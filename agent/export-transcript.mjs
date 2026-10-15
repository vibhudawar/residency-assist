// Writes a real call as a readable transcript with ElevenLabs' post-call analysis, for the evidence pack.
// Free (reads the call from ElevenLabs). The applicants are fictional demo cases.
//   node --env-file=.env agent/export-transcript.mjs <conversation_id> <file-name> "<title>"
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

const [id, name, title] = process.argv.slice(2);
if (!id || !/^conv_[A-Za-z0-9]+$/.test(id) || !name || !/^[a-z0-9-]+$/.test(name)) {
  throw new Error('usage: export-transcript.mjs <conversation_id> <file-name> "<title>"');
}
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "docs", "transcripts");
const INTERNAL = /^notify_condition_|^transfer_to_agent$/; // workflow plumbing, not actions

const conv = await new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY }).conversationalAi.conversations.get(id);
const a = conv.analysis ?? {};
const ttfb = conv.transcript.map((t) => t.conversationTurnMetrics?.metrics?.convai_llm_service_ttfb?.elapsedTime).filter((v) => typeof v === "number");
const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;
const clip = (v, n = 220) => (String(v).length > n ? `${String(v).slice(0, n)}…` : String(v));

const lines = [];
for (const t of conv.transcript) {
  for (const c of t.toolCalls ?? []) if (!INTERNAL.test(c.toolName)) lines.push(`| ${mmss(t.timeInCallSecs)} | ⚙︎ tool | \`${c.toolName}\` ${c.paramsAsJson && c.paramsAsJson !== "{}" ? `\`${clip(c.paramsAsJson, 160).replace(/\|/g, "\\|")}\`` : ""} |`);
  for (const r of t.toolResults ?? []) if (!INTERNAL.test(r.toolName)) lines.push(`| ${mmss(t.timeInCallSecs)} | ↳ result | \`${clip(r.resultValue).replace(/\|/g, "\\|").replace(/\n/g, " ")}\` |`);
  const msg = t.message?.trim();
  if (msg && msg !== "...") lines.push(`| ${mmss(t.timeInCallSecs)} | ${t.role === "agent" ? "**Agent**" : "Caller"} | ${msg.replace(/\|/g, "\\|").replace(/\n+/g, " ")} |`);
}

const md = [
  `# ${title ?? name}`,
  "",
  `Real call to the deployed agent, ${new Date(conv.metadata.startTimeUnixSecs * 1000).toISOString().slice(0, 16).replace("T", " ")} UTC. Fictional demo applicant.`,
  "",
  "| | |",
  "|---|---|",
  `| Conversation | \`${id}\` |`,
  `| Channel | ${conv.metadata.phoneCall ? "Phone (Twilio, outbound)" : "Browser (WebRTC)"} |`,
  `| Length | ${mmss(conv.metadata.callDurationSecs)} |`,
  `| LLM response time | ${ttfb.length ? `avg ${Math.round((ttfb.reduce((x, y) => x + y, 0) / ttfb.length) * 1000)} ms · max ${Math.round(Math.max(...ttfb) * 1000)} ms` : "—"} |`,
  `| How it ended | ${conv.metadata.terminationReason ?? "—"} |`,
  "",
  "## Post-call analysis (ElevenLabs)",
  "",
  a.transcriptSummary ? `> ${a.transcriptSummary.replace(/\n+/g, " ")}` : "",
  "",
  `**Call successful:** ${a.callSuccessful ?? "—"}`,
  "",
  "| Evaluation criterion | Result | Why |",
  "|---|---|---|",
  ...Object.entries(a.evaluationCriteriaResults ?? {}).map(([k, v]) => `| ${k} | ${v.result} | ${clip(v.rationale ?? "", 200).replace(/\|/g, "\\|").replace(/\n/g, " ")} |`),
  "",
  "| Data collected | Value |",
  "|---|---|",
  ...Object.entries(a.dataCollectionResults ?? {}).map(([k, v]) => `| ${k} | ${v.value ?? "—"} |`),
  "",
  "## Transcript (with tool calls)",
  "",
  "| Time | Who | What |",
  "|---|---|---|",
  ...lines,
  "",
].join("\n");

await mkdir(OUT, { recursive: true });
await writeFile(path.join(OUT, `${name}.md`), md);
console.log(`wrote docs/transcripts/${name}.md (${conv.transcript.length} turns, ${a.callSuccessful ?? "?"})`);
