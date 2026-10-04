import "server-only";
import e2eReport from "../../../e2e/report/latest.json";
import agentSummary from "../../../agent/evidence/summary.json";
import keptCalls from "../../../agent/evidence/live-calls.json";

/**
 * The evidence the console shows, read from the files the test runs write (agent/evidence/summary.json
 * from `pnpm agent:test`, e2e/report/latest.json from `pnpm test:e2e`). Nothing here is typed by hand.
 */

export interface AgentTestRow {
  name: string;
  title: string;
  step: string;
  kind: string;
  stakes: string;
  full: { passed: number; runs: number } | null;
  latest: { passed: number; runs: number; ran_at: string; source: "full" | "rerun" };
}

const STEP_WORD: Record<string, string> = { open: "Open", verify: "Verify", resolve: "Resolve", handover: "Hand over", "full call": "Simulated call" };

/** "resolve-submits-only-after-read-back" → "Submits only after read-back". */
function titleOf(name: string, step: string): string {
  const words = name
    .replace(/^(open|verify|resolve|handover|sim)-/, "")
    .replace(/-/g, " ")
    .replace(/\bdob\b/g, "date of birth")
    .replace(/\bref\b/g, "reference")
    .replace(/\bread back\b/g, "read-back")
    .replace(/\b(arabic|hindi|english)\b/g, (w) => w.charAt(0).toUpperCase() + w.slice(1));
  return step === "full call" ? `Full call: ${words}` : words.charAt(0).toUpperCase() + words.slice(1);
}

export function agentEvidence() {
  const s = agentSummary as {
    agent_id: string;
    full_run: { ran_at: string; repeat: number; llm: string; tts_model: string; tests: number; passed: number; runs: number };
    steps: { step: string; passed: number; runs: number }[];
    reruns_after: number;
    tests: Omit<AgentTestRow, "title">[];
  };
  const tests: AgentTestRow[] = s.tests.map((t) => ({ ...t, title: titleOf(t.name, t.step) }));
  return {
    fullRun: s.full_run,
    steps: s.steps.map((x) => ({ ...x, label: STEP_WORD[x.step] ?? x.step })),
    tests,
    stepWord: STEP_WORD,
    // The tests that must never fail: the correction is only sent after a confirmed read-back, and full calls.
    mustNeverFail: tests.filter((t) => t.stakes === "high" || t.step === "full call"),
    // What happened after the full run: a test that failed there and was rerun, or a test added since.
    sinceFullRun: tests.filter((t) => t.latest.source === "rerun"),
  };
}

export interface KeptCall {
  conversation_id: string;
  started_at: string;
  channel: string;
  language: string;
  duration_secs: number;
  avg_latency_ms: number | null;
  max_latency_ms: number | null;
  call_successful: string | null;
  summary_title: string | null;
  evaluation: Record<string, string>;
  data_collected: Record<string, string | null>;
}

/** Live calls verified end to end and kept as evidence (agent/export-live-call.mjs), newest first. */
export function liveCallEvidence(): KeptCall[] {
  return [...(keptCalls as KeptCall[])].reverse();
}

export function e2eEvidence() {
  const r = e2eReport as { ran_at: string; passed: number; total: number; flows: { flow: string; status: string; seconds: number; steps: { title: string; ok: boolean }[] }[] };
  return { ranAt: r.ran_at, passed: r.passed, total: r.total, flows: r.flows };
}
