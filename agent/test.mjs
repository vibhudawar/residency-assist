// Runs the agent test suite on ElevenLabs, each test repeated N times, and writes the pass rates
// to agent/evidence/ (JSON + a readable Markdown table) for the evidence pack.
//   pnpm agent:test            (10 runs per test)
//   pnpm agent:test -- 3       (3 runs per test, for a quick check)
//   pnpm agent:test -- 1 name-a,name-b   (only these tests; written to evidence/rerun-*.json, latest is untouched)
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import * as S from "./settings.mjs";
import { SIMULATIONS, TESTS } from "./tests.mjs";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PROJECT = path.join(ROOT, "project");
const REPEAT = Math.max(1, Math.min(20, Number(process.argv[2] ?? 10) || 10));
const ONLY = process.argv[3] ? new Set(process.argv[3].split(",").map((n) => n.trim()).filter(Boolean)) : null;
const POLL_MS = 10_000;
const MAX_WAIT_MS = 45 * 60_000;

const apiKey = process.env.ELEVENLABS_API_KEY;
if (!apiKey) stop("ELEVENLABS_API_KEY is not set in .env.");

function stop(message) {
  console.error(`Tests stopped: ${message}`);
  process.exit(1);
}
const readJson = async (file) => (existsSync(path.join(PROJECT, file)) ? JSON.parse(await readFile(path.join(PROJECT, file), "utf8")) : {});

async function main() {
  const agentEntry = (await readJson("agents.json")).agents?.[0];
  const agentId = process.env.ELEVENLABS_AGENT_ID ?? agentEntry?.id ?? agentEntry?.agent_id;
  if (!agentId) stop("no agent id — run pnpm agent:deploy first.");

  const registry = (await readJson("tests.json")).tests ?? [];
  const name = (e) => e.name ?? e.test_name ?? e.config?.split("/").pop()?.replace(/\.json$/, ""); // CLI entries are {config, id}
  const testId = new Map(registry.map((e) => [name(e), e.id ?? e.test_id]));
  const suite = [...TESTS, ...SIMULATIONS].filter((x) => testId.get(x.name) && (!ONLY || ONLY.has(x.name)));
  if (ONLY) for (const n of ONLY) if (!suite.some((x) => x.name === n)) stop(`unknown or not uploaded test: ${n}`);
  if (!suite.length) stop("no uploaded tests — run pnpm agent:deploy first.");

  const client = new ElevenLabsClient({ apiKey });
  console.log(`Running ${suite.length} tests × ${REPEAT} on ${S.AGENT_NAME} (${agentId})…`);
  const started = await client.conversationalAi.agents.runTests(agentId, {
    tests: suite.map((x) => (x.node ? { testId: testId.get(x.name), workflowNodeId: x.node } : { testId: testId.get(x.name) })),
    repeatCount: REPEAT,
  });

  let invocation = started;
  const deadline = Date.now() + MAX_WAIT_MS;
  while (invocation.testRuns.some((r) => r.status === "pending")) {
    if (Date.now() > deadline) stop(`still running after ${MAX_WAIT_MS / 60000} minutes (invocation ${started.id}).`);
    await new Promise((r) => setTimeout(r, POLL_MS));
    invocation = await client.conversationalAi.tests.invocations.get(started.id);
    const done = invocation.testRuns.filter((r) => r.status !== "pending").length;
    process.stdout.write(`\r  ${done}/${invocation.testRuns.length} runs finished`);
  }
  console.log("");

  const rows = suite.map((x) => {
    const runs = invocation.testRuns.filter((r) => r.testId === testId.get(x.name));
    const passed = runs.filter((r) => r.status === "passed").length;
    return {
      name: x.name,
      step: x.node ?? "full call",
      kind: x.kind ?? "simulation",
      stakes: x.stakes ?? "normal",
      edge_case: x.edge ?? null,
      runs: runs.length,
      passed,
      pass_rate: runs.length ? passed / runs.length : 0,
      failures: runs
        .filter((r) => r.status === "failed")
        .slice(0, 3)
        .map((r) => r.conditionResult?.rationale?.summary ?? r.conditionResult?.result ?? "failed"),
    };
  });
  const totalRuns = rows.reduce((s, r) => s + r.runs, 0);
  const totalPassed = rows.reduce((s, r) => s + r.passed, 0);
  const result = {
    agent_id: agentId,
    invocation_id: started.id,
    ran_at: new Date().toISOString(),
    repeat: REPEAT,
    partial: !!ONLY,
    llm: S.LLM,
    tts_model: S.TTS_MODEL,
    overall_pass_rate: totalRuns ? totalPassed / totalRuns : 0,
    tests: rows,
  };

  const pct = (v) => `${Math.round(v * 100)}%`;
  await mkdir(path.join(ROOT, "evidence"), { recursive: true });
  const stamp = result.ran_at.replace(/[:.]/g, "-");
  await writeFile(path.join(ROOT, "evidence", `${ONLY ? "rerun" : "test-run"}-${stamp}.json`), `${JSON.stringify(result, null, 2)}\n`);
  if (ONLY) {
    console.log(`Rerun: ${pct(result.overall_pass_rate)} (${totalPassed}/${totalRuns}). Written to agent/evidence/rerun-${stamp}.json`);
    for (const r of rows) console.log(`  ${pct(r.pass_rate).padStart(4)}  ${r.name}${r.failures.length ? ` — ${String(r.failures[0]).slice(0, 160)}` : ""}`);
    return;
  }
  await writeFile(path.join(ROOT, "evidence", "latest.json"), `${JSON.stringify(result, null, 2)}\n`);

  const md = [
    `# Agent test run — ${result.ran_at.slice(0, 16).replace("T", " ")} UTC`,
    "",
    `${rows.length} tests × ${REPEAT} runs on ${S.LLM} / ${S.TTS_MODEL}. Overall pass rate: **${pct(result.overall_pass_rate)}** (${totalPassed}/${totalRuns}).`,
    "",
    "| Test | Step | Type | Edge case | Pass rate |",
    "|---|---|---|---|---|",
    ...rows.map((r) => `| ${r.stakes === "high" ? "**" : ""}${r.name}${r.stakes === "high" ? "** (high-stakes)" : ""} | ${r.step} | ${r.kind} | ${r.edge_case ?? "—"} | ${r.passed}/${r.runs} (${pct(r.pass_rate)}) |`),
    "",
    "Failures (first three per test):",
    "",
    ...rows.filter((r) => r.failures.length).flatMap((r) => [`- **${r.name}**`, ...r.failures.map((f) => `  - ${String(f).replace(/\s+/g, " ").slice(0, 240)}`)]),
    "",
  ].join("\n");
  await writeFile(path.join(ROOT, "evidence", "latest.md"), md);

  console.log(`Overall: ${pct(result.overall_pass_rate)} (${totalPassed}/${totalRuns}). Written to agent/evidence/latest.md`);
  for (const r of rows.filter((x) => x.pass_rate < 1)) console.log(`  ${pct(r.pass_rate).padStart(4)}  ${r.name}`);
}

main().catch((err) => stop(err instanceof Error ? err.message : String(err)));
