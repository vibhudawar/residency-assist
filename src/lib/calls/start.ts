import "server-only";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { env, requireEnv } from "@/lib/env";
import { forLog } from "@/lib/security";
import { db } from "@/lib/supabase/server";
import { type Channel, openCallAttempt, type PredialCheck, predialChecks } from "./predial";

/** A browser call the officer's page starts itself (WebRTC, with a short-lived token). */
export interface BrowserSession {
  attemptId: number;
  conversationId: string;
  conversationToken: string;
  /**
   * Per-call variables. `secret__case_token` is only ever sent to ElevenLabs in tool headers; on its own
   * it can't call our tools (they also need the tool secret, which never leaves the servers).
   */
  dynamicVariables: Record<string, string>;
  language: "en" | "ar" | "hi";
}

export type StartCallResult =
  | { kind: "blocked"; checks: PredialCheck[] }
  | { kind: "not_configured"; missing: string[]; checks: PredialCheck[] }
  | { kind: "dialling"; attemptId: number; checks: PredialCheck[] }
  | { kind: "browser"; session: BrowserSession; checks: PredialCheck[] }
  | { kind: "failed"; checks: PredialCheck[] };

/** Rings out for this long before counting as no answer. */
const RINGING_TIMEOUT_SECS = 40;

let client: ElevenLabsClient | undefined;
const elevenlabs = () => (client ??= new ElevenLabsClient({ apiKey: requireEnv("ELEVENLABS_API_KEY") }));

/** What the agent needs before a call of this channel can be placed. Names only, never values. */
function missingConfig(channel: Channel): string[] {
  const e = env();
  const needed = channel === "phone"
    ? (["ELEVENLABS_API_KEY", "ELEVENLABS_AGENT_ID", "ELEVENLABS_PHONE_NUMBER_ID"] as const)
    : (["ELEVENLABS_API_KEY", "ELEVENLABS_AGENT_ID"] as const);
  return needed.filter((k) => !e[k]);
}

async function closeAttempt(attemptId: number, applicationId: number, reason: string) {
  await db().from("call_attempts").update({ status: "failed", ended_at: new Date().toISOString() }).eq("id", attemptId);
  await db().from("audit_log").insert({ application_id: applicationId, actor: "system", event: "call_failed", detail: { reason } });
}

/**
 * Officer presses "Call". The pre-dial checks always run first; a refusal is recorded as a blocked
 * attempt (that log is evidence). Then, for a phone call, ElevenLabs rings the applicant through
 * Twilio; for a browser call, the page gets a session to start. Each call carries its own one-time
 * case token, so the agent can only ever touch this one application.
 */
export async function startCall(applicationId: number, channel: Channel): Promise<StartCallResult> {
  const pre = await predialChecks(applicationId, { channel });
  if (!pre.allowed) {
    await openCallAttempt(applicationId, { channel }); // re-checks and stores the blocked attempt with its reasons
    return { kind: "blocked", checks: pre.checks };
  }

  const missing = missingConfig(channel);
  if (missing.length) return { kind: "not_configured", missing, checks: pre.checks };

  const { data: app } = await db().from("applications").select("phone, preferred_language").eq("id", applicationId).single();
  if (!app) return { kind: "failed", checks: pre.checks };

  const opened = await openCallAttempt(applicationId, { channel });
  if (!opened.attempt || !opened.caseToken) return { kind: "blocked", checks: opened.checks };
  const attemptId = opened.attempt.id;
  const language = (["en", "ar", "hi"].includes(app.preferred_language) ? app.preferred_language : "en") as BrowserSession["language"];
  const dynamicVariables = { secret__case_token: opened.caseToken, call_attempt_id: String(attemptId), channel };
  const agentId = requireEnv("ELEVENLABS_AGENT_ID");

  try {
    if (channel === "phone") {
      const res = await elevenlabs().conversationalAi.twilio.outboundCall({
        agentId,
        agentPhoneNumberId: requireEnv("ELEVENLABS_PHONE_NUMBER_ID"),
        toNumber: app.phone,
        // The language picks the agent's matching preset (opening line + voice) for this applicant.
        conversationInitiationClientData: { dynamicVariables, conversationConfigOverride: { agent: { language } } },
        telephonyCallConfig: { ringingTimeoutSecs: RINGING_TIMEOUT_SECS },
      });
      if (!res.success) {
        await closeAttempt(attemptId, applicationId, forLog(res.message));
        return { kind: "failed", checks: opened.checks };
      }
      await db()
        .from("call_attempts")
        .update({ conversation_id: res.conversationId ?? null, twilio_call_sid: res.callSid ?? null })
        .eq("id", attemptId);
      return { kind: "dialling", attemptId, checks: opened.checks };
    }

    const token = await elevenlabs().conversationalAi.conversations.getWebrtcToken({ agentId });
    await db().from("call_attempts").update({ conversation_id: token.conversationId }).eq("id", attemptId);
    return {
      kind: "browser",
      session: { attemptId, conversationId: token.conversationId, conversationToken: token.token, dynamicVariables, language },
      checks: opened.checks,
    };
  } catch (err) {
    console.error("starting call failed", forLog(err instanceof Error ? err.message : err));
    await closeAttempt(attemptId, applicationId, "could not reach ElevenLabs");
    return { kind: "failed", checks: opened.checks };
  }
}

/** The browser session never connected (microphone refused, network): close the attempt so it doesn't block. */
export async function abandonBrowserCall(attemptId: number) {
  const { data } = await db()
    .from("call_attempts")
    .update({ status: "failed", ended_at: new Date().toISOString() })
    .eq("id", attemptId)
    .eq("channel", "browser")
    .eq("status", "dialing")
    .select("application_id")
    .maybeSingle();
  if (data) await db().from("audit_log").insert({ application_id: data.application_id, actor: "system", event: "call_failed", detail: { reason: "browser session did not connect" } });
}

/** The browser session connected: mark the attempt live (the post-call webhook closes it). */
export async function markBrowserCallLive(attemptId: number) {
  await db().from("call_attempts").update({ status: "connected" }).eq("id", attemptId).eq("channel", "browser").eq("status", "dialing");
}
