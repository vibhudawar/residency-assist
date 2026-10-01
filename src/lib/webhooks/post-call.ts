import "server-only";
import { z } from "zod";
import { forLog } from "@/lib/security";
import { db } from "@/lib/supabase/server";

/**
 * ElevenLabs post-call webhooks → call records, call-attempt outcomes and the audit trail.
 * Payloads are validated loosely (ElevenLabs adds fields over time); only what we use is required.
 */

const turnSchema = z
  .object({
    role: z.string(),
    message: z.string().nullable().optional(),
    time_in_call_secs: z.number().nullable().optional(),
    tool_calls: z.array(z.object({ tool_name: z.string().optional() }).passthrough()).nullable().optional(),
    conversation_turn_metrics: z
      .object({ metrics: z.record(z.string(), z.unknown()).optional() })
      .catchall(z.unknown())
      .nullable()
      .optional(),
  })
  .passthrough();

const transcriptionSchema = z.object({
  type: z.literal("post_call_transcription"),
  data: z
    .object({
      conversation_id: z.string().min(1).max(200),
      status: z.string().optional(),
      transcript: z.array(turnSchema).default([]),
      metadata: z
        .object({
          call_duration_secs: z.number().optional(),
          termination_reason: z.string().optional(),
        })
        .passthrough()
        .optional(),
      analysis: z
        .object({ call_successful: z.string().optional(), transcript_summary: z.string().optional() })
        .passthrough()
        .nullable()
        .optional(),
      conversation_initiation_client_data: z
        .object({
          conversation_config_override: z
            .object({ agent: z.object({ language: z.string().nullable().optional() }).passthrough().nullable().optional() })
            .passthrough()
            .nullable()
            .optional(),
          dynamic_variables: z.record(z.string(), z.unknown()).nullable().optional(),
        })
        .passthrough()
        .nullable()
        .optional(),
    })
    .passthrough(),
});

const failureSchema = z.object({
  type: z.literal("call_initiation_failure"),
  data: z
    .object({
      conversation_id: z.string().min(1).max(200),
      failure_reason: z.string().optional(),
      metadata: z.object({ dynamic_variables: z.record(z.string(), z.unknown()).optional() }).passthrough().optional(),
    })
    .passthrough(),
});

export type Transcription = z.infer<typeof transcriptionSchema>["data"];
type Turn = z.infer<typeof turnSchema>;
export type AttemptOutcome = "completed" | "silent" | "voicemail";

/** Seconds → ms for one turn's metric, whichever shape it arrives in (`{elapsed_time}` directly or under `metrics`). */
function metricMs(turn: Turn, name: string): number | null {
  const m = turn.conversation_turn_metrics;
  if (!m) return null;
  const entry = ((m.metrics as Record<string, unknown> | undefined)?.[name] ?? (m as Record<string, unknown>)[name]) as { elapsed_time?: unknown } | undefined;
  return typeof entry?.elapsed_time === "number" ? Math.round(entry.elapsed_time * 1000) : null;
}

/**
 * What a finished call means for us, from the payload alone (pure; unit-tested):
 * - latency: the LLM's time to first token on each agent turn (the metric ElevenLabs reports per turn)
 * - outcome: voicemail if the voicemail tool fired, silent if the caller never said anything, else completed
 */
export function summarise(data: Transcription) {
  const turns = data.transcript;
  const latencies = turns.filter((t) => t.role === "agent").map((t) => metricMs(t, "convai_llm_service_ttfb")).filter((v): v is number => v !== null);
  const toolNames = turns.flatMap((t) => (t.tool_calls ?? []).map((c) => c.tool_name ?? ""));
  const callerSpoke = turns.some((t) => t.role === "user" && (t.message ?? "").trim().length > 0);
  const termination = (data.metadata?.termination_reason ?? "").toLowerCase();

  const outcome: AttemptOutcome =
    toolNames.includes("voicemail_detection") || termination.includes("voicemail") ? "voicemail" : callerSpoke ? "completed" : "silent";

  const client = data.conversation_initiation_client_data;
  const language = client?.conversation_config_override?.agent?.language ?? (typeof client?.dynamic_variables?.language === "string" ? client.dynamic_variables.language : null);

  return {
    outcome,
    language: language && /^[a-z]{2}(-[A-Za-z]{2})?$/.test(language) ? language.slice(0, 2) : null,
    durationSecs: typeof data.metadata?.call_duration_secs === "number" ? Math.round(data.metadata.call_duration_secs) : null,
    avgLatencyMs: latencies.length ? Math.round(latencies.reduce((s, v) => s + v, 0) / latencies.length) : null,
    maxLatencyMs: latencies.length ? Math.max(...latencies) : null,
    toolsUsed: [...new Set(toolNames.filter(Boolean))],
  };
}

/** Busy / no answer / anything else, as our call-attempt states. */
export function failureStatus(reason: string | undefined): "declined" | "no_answer" | "failed" {
  const r = (reason ?? "").toLowerCase().replace(/[\s_]/g, "-");
  if (r === "busy" || r.includes("declin") || r.includes("reject")) return "declined";
  if (r.includes("no-answer") || r.includes("noanswer") || r.includes("timeout")) return "no_answer";
  return "failed";
}

/** The attempt this conversation belongs to: by conversation id, else by the attempt id we passed as a dynamic variable. */
async function findAttempt(conversationId: string, dynamicVariables: Record<string, unknown> | null | undefined) {
  const byConversation = await db().from("call_attempts").select("id, application_id, status").eq("conversation_id", conversationId).maybeSingle();
  if (byConversation.data) return byConversation.data;

  const raw = dynamicVariables?.call_attempt_id;
  const attemptId = typeof raw === "number" ? raw : typeof raw === "string" && /^\d{1,12}$/.test(raw) ? Number(raw) : null;
  if (!attemptId) return null;
  const { data } = await db().from("call_attempts").select("id, application_id, status, conversation_id").eq("id", attemptId).maybeSingle();
  // Only claim an attempt that isn't already tied to a different conversation.
  if (!data || (data.conversation_id && data.conversation_id !== conversationId)) return null;
  await db().from("call_attempts").update({ conversation_id: conversationId }).eq("id", data.id);
  return data;
}

const OPEN = ["dialing", "connected", "queued"];

export type WebhookResult = { handled: "transcription" | "failure" | "ignored"; conversationId?: string; matched?: boolean };

export async function handlePostCallEvent(event: unknown): Promise<WebhookResult> {
  const type = (event as { type?: unknown } | null)?.type;

  if (type === "post_call_transcription") {
    const { data } = transcriptionSchema.parse(event);
    const summary = summarise(data);
    const attempt = await findAttempt(data.conversation_id, data.conversation_initiation_client_data?.dynamic_variables);

    // Upsert: ElevenLabs retries deliveries, and a retry must not create a second record.
    const { error } = await db().from("call_records").upsert(
      {
        conversation_id: data.conversation_id,
        application_id: attempt?.application_id ?? null,
        // Our reading of the call (completed / silent / voicemail); ElevenLabs' own status stays in raw.
        status: summary.outcome,
        call_successful: data.analysis?.call_successful ?? null,
        language: summary.language,
        duration_secs: summary.durationSecs,
        avg_latency_ms: summary.avgLatencyMs,
        max_latency_ms: summary.maxLatencyMs,
        transcript: data.transcript,
        analysis: data.analysis ?? null,
        raw: event,
        received_at: new Date().toISOString(),
      },
      { onConflict: "conversation_id" },
    );
    if (error) throw new Error(`saving call record failed: ${error.message}`);

    if (attempt) {
      // Compare-and-set on an open status: a retried delivery changes nothing and logs nothing.
      const { data: closed } = await db()
        .from("call_attempts")
        .update({ status: summary.outcome, ended_at: new Date().toISOString() })
        .eq("id", attempt.id)
        .in("status", OPEN)
        .select("id");
      if (closed?.length) {
        await db().from("audit_log").insert({ application_id: attempt.application_id, actor: "agent", event: "call_recorded", detail: { outcome: summary.outcome } });
      }
    } else {
      console.warn("post-call record with no matching call attempt", forLog(data.conversation_id));
    }
    return { handled: "transcription", conversationId: data.conversation_id, matched: !!attempt };
  }

  if (type === "call_initiation_failure") {
    const { data } = failureSchema.parse(event);
    const attempt = await findAttempt(data.conversation_id, data.metadata?.dynamic_variables);
    if (attempt) {
      const status = failureStatus(data.failure_reason);
      const { data: closed } = await db()
        .from("call_attempts")
        .update({ status, ended_at: new Date().toISOString() })
        .eq("id", attempt.id)
        .in("status", OPEN)
        .select("id");
      if (closed?.length) {
        await db().from("audit_log").insert({
          application_id: attempt.application_id,
          actor: "system",
          event: "call_not_connected",
          detail: { outcome: status, reason: forLog(data.failure_reason ?? "unknown") },
        });
      }
    }
    return { handled: "failure", conversationId: data.conversation_id, matched: !!attempt };
  }

  // post_call_audio and future types: acknowledged, nothing to store.
  return { handled: "ignored" };
}
