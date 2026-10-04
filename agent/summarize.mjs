// Merges the latest full test run with any later reruns on the same agent into one summary for the
// console's Evidence page (agent/evidence/summary.json). Runs after every `agent:test`; safe to re-run.
//   node agent/summarize.mjs
import { existsSync } from "node:fs";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "evidence");
const STEPS = ["open", "verify", "resolve", "handover", "full call"];

export async function summarize() {
  const latestFile = path.join(DIR, "latest.json");
  if (!existsSync(latestFile)) return null;
  const full = JSON.parse(await readFile(latestFile, "utf8"));
  const reruns = [];
  for (const f of (await readdir(DIR)).filter((x) => x.startsWith("rerun-")).sort()) {
    const r = JSON.parse(await readFile(path.join(DIR, f), "utf8"));
    if (r.agent_id === full.agent_id && r.ran_at > full.ran_at) reruns.push(r);
  }

  const byName = new Map();
  for (const t of full.tests) byName.set(t.name, { name: t.name, step: t.step, kind: t.kind, stakes: t.stakes, full: { passed: t.passed, runs: t.runs }, latest: { passed: t.passed, runs: t.runs, ran_at: full.ran_at, source: "full" } });
  for (const r of reruns) {
    for (const t of r.tests) {
      const row = byName.get(t.name) ?? { name: t.name, step: t.step, kind: t.kind, stakes: t.stakes, full: null };
      row.latest = { passed: t.passed, runs: t.runs, ran_at: r.ran_at, source: "rerun" };
      byName.set(t.name, row);
    }
  }
  const tests = [...byName.values()].sort((a, b) => STEPS.indexOf(a.step) - STEPS.indexOf(b.step));
  const fullPassed = full.tests.reduce((s, t) => s + t.passed, 0);
  const fullRuns = full.tests.reduce((s, t) => s + t.runs, 0);
  const summary = {
    agent_id: full.agent_id,
    full_run: { ran_at: full.ran_at, repeat: full.repeat, llm: full.llm, tts_model: full.tts_model, tests: full.tests.length, passed: fullPassed, runs: fullRuns },
    steps: STEPS.map((step) => {
      const rows = full.tests.filter((t) => t.step === step);
      return { step, passed: rows.reduce((s, t) => s + t.passed, 0), runs: rows.reduce((s, t) => s + t.runs, 0) };
    }).filter((s) => s.runs > 0),
    reruns_after: reruns.length,
    tests,
  };
  await writeFile(path.join(DIR, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
  return summary;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const s = await summarize();
  console.log(s ? `summary: ${s.full_run.passed}/${s.full_run.runs} in the full run, ${s.reruns_after} later rerun(s)` : "no full run yet");
}
