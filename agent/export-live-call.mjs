// Keeps a verified live call as evidence that survives demo resets: fetches the call from ElevenLabs
// and adds its summary (no transcript) to agent/evidence/live-calls.json. Free; safe to re-run.
//   node --env-file=.env agent/export-live-call.mjs <conversation_id>
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

const FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), "evidence", "live-calls.json");
const id = process.argv[2];
if (!id || !/^conv_[A-Za-z0-9]+$/.test(id)) throw new Error("usage: export-live-call.mjs <conversation_id>");

const conv = await new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY }).conversationalAi.conversations.get(id);
const ttfb = conv.transcript
  .map((t) => t.conversationTurnMetrics?.metrics?.convai_llm_service_ttfb?.elapsedTime)
  .filter((v) => typeof v === "number");
const analysis = conv.analysis ?? {};
const call = {
  conversation_id: id,
  started_at: new Date(conv.metadata.startTimeUnixSecs * 1000).toISOString(),
  channel: conv.metadata.phoneCall ? "phone" : "browser",
  language: conv.conversationInitiationClientData?.conversationConfigOverride?.agent?.language ?? "en",
  duration_secs: conv.metadata.callDurationSecs,
  avg_latency_ms: ttfb.length ? Math.round((ttfb.reduce((a, b) => a + b, 0) / ttfb.length) * 1000) : null,
  max_latency_ms: ttfb.length ? Math.round(Math.max(...ttfb) * 1000) : null,
  call_successful: analysis.callSuccessful ?? null,
  summary_title: analysis.callSummaryTitle ?? null,
  evaluation: Object.fromEntries(Object.entries(analysis.evaluationCriteriaResults ?? {}).map(([k, v]) => [k, v.result])),
  data_collected: Object.fromEntries(Object.entries(analysis.dataCollectionResults ?? {}).map(([k, v]) => [k, v.value ?? null])),
};
const calls = existsSync(FILE) ? JSON.parse(await readFile(FILE, "utf8")) : [];
const next = [...calls.filter((c) => c.conversation_id !== id), call].sort((a, b) => a.started_at.localeCompare(b.started_at));
await writeFile(FILE, `${JSON.stringify(next, null, 2)}\n`);
console.log(`kept ${id}: ${call.duration_secs}s, ${call.language}, LLM ${call.avg_latency_ms}/${call.max_latency_ms} ms, ${Object.values(call.evaluation).filter((r) => r === "success").length}/${Object.keys(call.evaluation).length} checks passed`);
