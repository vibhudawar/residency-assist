/**
 * Smoke test for the ElevenLabs post-call webhook, against the real database.
 * Plays ElevenLabs' part with clearly labelled test payloads, then resets the demo so no
 * test call is ever left looking like real evidence (pass --keep to inspect the console first).
 *
 *   pnpm smoke:webhook [--keep]     (dev server on SMOKE_BASE_URL, default :3006)
 *
 * With ELEVENLABS_WEBHOOK_SECRET set it also POSTs signed and forged payloads to the endpoint.
 * Prints PASS/FAIL per check. Never prints secrets.
 */
import { openCallAttempt } from "@/lib/calls/predial";
import { resetDemo } from "@/lib/demo/reset";
import { db } from "@/lib/supabase/server";
import { handlePostCallEvent } from "@/lib/webhooks/post-call";
import { signForTest } from "@/lib/webhooks/signature";

const BASE_URL = process.env.SMOKE_BASE_URL ?? "http://localhost:3006";
const WEBHOOK_SECRET = process.env.ELEVENLABS_WEBHOOK_SECRET ?? "";
const KEEP = process.argv.includes("--keep");
const TAG = "[smoke test]";

let failures = 0;
function check(name: string, ok: boolean, got?: unknown) {
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : `  → got ${JSON.stringify(got)}`}`);
}

async function appId(reference: string) {
  const { data } = await db().from("applications").select("id").eq("reference", reference).single();
  return data!.id as number;
}
async function attemptRow(id: number) {
  const { data } = await db().from("call_attempts").select("status, conversation_id, ended_at").eq("id", id).single();
  return data!;
}

const turn = (role: "agent" | "user", message: string, at: number, ttfbSecs?: number) => ({
  role,
  message: `${TAG} ${message}`,
  time_in_call_secs: at,
  tool_calls: null,
  conversation_turn_metrics: ttfbSecs === undefined ? null : { convai_llm_service_ttfb: { elapsed_time: ttfbSecs } },
});

function transcription(conversationId: string, attemptId: number, language: string, transcript: ReturnType<typeof turn>[]) {
  return {
    type: "post_call_transcription",
    event_timestamp: Math.floor(Date.now() / 1000),
    data: {
      agent_id: "smoke-agent",
      conversation_id: conversationId,
      status: "done",
      transcript,
      metadata: { call_duration_secs: 74, termination_reason: "end_call tool" },
      analysis: { call_successful: "success", transcript_summary: `${TAG} Caller verified and confirmed the corrected date of birth.` },
      conversation_initiation_client_data: {
        conversation_config_override: { agent: { language } },
        dynamic_variables: { call_attempt_id: String(attemptId) },
      },
    },
  };
}

async function main() {
  console.log("Resetting demo…");
  await resetDemo();

  // 1. A completed Arabic call, matched by the attempt id we pass as a dynamic variable.
  const ahmed = await openCallAttempt(await appId("RA-260106"), { channel: "browser" });
  const conv1 = `smoke-conv-${Date.now()}`;
  const payload1 = transcription(conv1, ahmed.attempt!.id, "ar", [
    turn("agent", "Hello, this is the AI assistant. This call is recorded.", 0),
    turn("user", "Yes, go ahead.", 4),
    turn("agent", "Please tell me your application reference.", 6, 0.42),
    turn("user", "RA 260106.", 11),
    turn("agent", "Thank you. I'll send the correction for officer review.", 15, 0.58),
  ]);
  const r1 = await handlePostCallEvent(payload1);
  check("Completed call is matched to its attempt", r1.handled === "transcription" && r1.matched === true, r1);

  const { data: rec } = await db().from("call_records").select("application_id, language, duration_secs, avg_latency_ms, max_latency_ms, call_successful").eq("conversation_id", conv1).single();
  check("Call record stored with language, length and latency", rec?.language === "ar" && rec?.duration_secs === 74 && rec?.avg_latency_ms === 500 && rec?.max_latency_ms === 580, rec);
  const a1 = await attemptRow(ahmed.attempt!.id);
  check("Attempt marked completed and tied to the conversation", a1.status === "completed" && a1.conversation_id === conv1 && !!a1.ended_at, a1);

  // 2. ElevenLabs retries: the same delivery again must not duplicate anything.
  await handlePostCallEvent(payload1);
  const { count } = await db().from("call_records").select("conversation_id", { count: "exact", head: true }).eq("conversation_id", conv1);
  const { count: logged } = await db().from("audit_log").select("id", { count: "exact", head: true }).eq("event", "call_recorded").eq("application_id", await appId("RA-260106"));
  check("A retried delivery is stored once and logged once", count === 1 && logged === 1, { count, logged });

  // 3. Picked up, nobody spoke.
  const priya = await openCallAttempt(await appId("RA-260103"), { channel: "browser" });
  const conv2 = `smoke-conv-silent-${Date.now()}`;
  await handlePostCallEvent(transcription(conv2, priya.attempt!.id, "hi", [turn("agent", "Hello, are you there?", 0), turn("agent", "I'll try again later.", 12, 0.31)]));
  check("Silent call recorded as silent", (await attemptRow(priya.attempt!.id)).status === "silent");

  // 4. The call never connected (no answer).
  const fatima = await openCallAttempt(await appId("RA-260102"), { channel: "browser" });
  const conv3 = `smoke-conv-fail-${Date.now()}`;
  const r3 = await handlePostCallEvent({
    type: "call_initiation_failure",
    event_timestamp: Math.floor(Date.now() / 1000),
    data: { agent_id: "smoke-agent", conversation_id: conv3, failure_reason: "no-answer", metadata: { dynamic_variables: { call_attempt_id: String(fatima.attempt!.id) } } },
  });
  check("Unanswered call recorded as no answer", r3.matched === true && (await attemptRow(fatima.attempt!.id)).status === "no_answer");

  // 5. Unknown types are acknowledged and ignored.
  check("Audio webhooks are acknowledged, not stored", (await handlePostCallEvent({ type: "post_call_audio", data: {} })).handled === "ignored");

  // 6. The HTTP endpoint itself.
  const body = JSON.stringify(transcription(`smoke-http-${Date.now()}`, 0, "en", [turn("agent", "Hello", 0)]));
  if (!WEBHOOK_SECRET) {
    const res = await fetch(`${BASE_URL}/api/webhooks/elevenlabs`, { method: "POST", body, headers: { "content-type": "application/json" } });
    check("Without a webhook secret the endpoint refuses (503)", res.status === 503, res.status);
    console.log("      (set ELEVENLABS_WEBHOOK_SECRET in .env to also test signed delivery)");
  } else {
    const post = (signature: string) =>
      fetch(`${BASE_URL}/api/webhooks/elevenlabs`, { method: "POST", body, headers: { "content-type": "application/json", "elevenlabs-signature": signature } });
    check("Signed delivery is accepted (200)", (await post(signForTest(body, WEBHOOK_SECRET))).status === 200);
    check("Forged signature is rejected (401)", (await post(signForTest(body, "not-the-secret"))).status === 401);
    check("Missing signature is rejected (401)", (await post("")).status === 401);
  }

  if (KEEP) {
    console.log("\n--keep: test calls left in place. Run `pnpm smoke:webhook` again (or Reset demo) to clear them.");
  } else {
    await resetDemo();
    console.log("\nDemo reset: no test calls left behind.");
  }
  console.log(failures === 0 ? "All checks passed." : `${failures} check(s) failed.`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("Webhook smoke test crashed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
