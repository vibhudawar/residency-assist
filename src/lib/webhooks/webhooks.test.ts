import { describe, expect, it } from "vitest";
import { failureStatus, summarise, type Transcription } from "./post-call";
import { signForTest, verifyElevenLabsSignature } from "./signature";

const SECRET = "wsec_test_only";
const NOW = 1_790_000_000;

describe("verifyElevenLabsSignature", () => {
  const body = JSON.stringify({ type: "post_call_transcription", data: { conversation_id: "c1" } });

  it("accepts a correctly signed, fresh payload", () => {
    expect(verifyElevenLabsSignature(body, signForTest(body, SECRET, NOW), SECRET, NOW)).toBe(true);
  });

  it("rejects a changed body, a wrong secret, and a missing header", () => {
    const header = signForTest(body, SECRET, NOW);
    expect(verifyElevenLabsSignature(body.replace("c1", "c2"), header, SECRET, NOW)).toBe(false);
    expect(verifyElevenLabsSignature(body, header, "another_secret", NOW)).toBe(false);
    expect(verifyElevenLabsSignature(body, null, SECRET, NOW)).toBe(false);
  });

  it("rejects a replay older than 30 minutes and a timestamp far in the future", () => {
    expect(verifyElevenLabsSignature(body, signForTest(body, SECRET, NOW - 31 * 60), SECRET, NOW)).toBe(false);
    expect(verifyElevenLabsSignature(body, signForTest(body, SECRET, NOW + 10 * 60), SECRET, NOW)).toBe(false);
  });
});

const call = (transcript: Transcription["transcript"], extra: Partial<Transcription> = {}): Transcription => ({
  conversation_id: "c1",
  transcript,
  ...extra,
});
const agent = (message: string, ttfbSecs?: number) => ({
  role: "agent",
  message,
  conversation_turn_metrics: ttfbSecs === undefined ? null : { convai_llm_service_ttfb: { elapsed_time: ttfbSecs } },
});

describe("summarise", () => {
  it("averages and maxes the per-turn LLM first-token latency in ms", () => {
    const s = summarise(call([agent("Hello", 0.3), { role: "user", message: "Hi" }, agent("Sure", 0.5), agent("Done")]));
    expect(s).toMatchObject({ outcome: "completed", avgLatencyMs: 400, maxLatencyMs: 500 });
  });

  it("calls it silent when the caller never spoke, and voicemail when the voicemail tool fired", () => {
    expect(summarise(call([agent("Hello?"), { role: "user", message: "  " }])).outcome).toBe("silent");
    const vm = call([agent("Hello", 0.2), { role: "agent", message: "", tool_calls: [{ tool_name: "voicemail_detection" }] }]);
    expect(summarise(vm).outcome).toBe("voicemail");
  });

  it("reads the call language from the conversation override", () => {
    const s = summarise(call([agent("مرحبا")], { conversation_initiation_client_data: { conversation_config_override: { agent: { language: "ar" } } } }));
    expect(s.language).toBe("ar");
  });
});

describe("failureStatus", () => {
  it("maps busy to declined, no answer to no_answer, anything else to failed", () => {
    expect(failureStatus("busy")).toBe("declined");
    expect(failureStatus("no-answer")).toBe("no_answer");
    expect(failureStatus("no_answer")).toBe("no_answer");
    expect(failureStatus("unknown")).toBe("failed");
  });
});
