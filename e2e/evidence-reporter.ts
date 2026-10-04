/**
 * Writes the end-to-end results into the evidence pack: e2e/report/latest.json and latest.md,
 * one row per flow with its steps, so a reviewer sees what was exercised and what passed.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { FullConfig, FullResult, Reporter, TestCase, TestResult, TestStep } from "@playwright/test/reporter";

interface Row {
  flow: string;
  file: string;
  status: TestResult["status"];
  seconds: number;
  steps: { title: string; ok: boolean }[];
  error?: string;
}

const DIR = path.join(process.cwd(), "e2e", "report");

export default class EvidenceReporter implements Reporter {
  private rows: Row[] = [];
  private baseURL = "";

  onBegin(config: FullConfig) {
    this.baseURL = String(config.projects[0]?.use.baseURL ?? "");
  }

  onTestEnd(test: TestCase, result: TestResult) {
    const steps = result.steps.filter((s: TestStep) => s.category === "test.step").map((s) => ({ title: s.title, ok: !s.error }));
    this.rows.push({
      flow: test.title,
      file: path.basename(test.location.file),
      status: result.status,
      seconds: Math.round(result.duration / 100) / 10,
      steps,
      // The first line only: assertion messages, never page content or secrets.
      error: result.error?.message?.split("\n")[0]?.replace(/\u001b\[[0-9;]*m/g, "").slice(0, 200),
    });
  }

  onEnd(result: FullResult) {
    mkdirSync(DIR, { recursive: true });
    const passed = this.rows.filter((r) => r.status === "passed").length;
    const ranAt = new Date().toISOString();
    writeFileSync(path.join(DIR, "latest.json"), `${JSON.stringify({ ran_at: ranAt, base_url: this.baseURL, status: result.status, passed, total: this.rows.length, flows: this.rows }, null, 2)}\n`);
    const md = [
      `# End-to-end flows — ${ranAt.slice(0, 16).replace("T", " ")} UTC`,
      "",
      `${passed} of ${this.rows.length} flows passed against ${this.baseURL}. Each flow starts from a fresh demo and plays the applicant and the officer in a real browser, and the voice assistant and ElevenLabs' webhook through the same endpoints the live agent uses.`,
      "",
      "| Flow | Result | Steps | Time |",
      "|---|---|---|---|",
      ...this.rows.map((r) => `| ${r.flow} | ${r.status === "passed" ? "Pass" : r.status === "skipped" ? "Skipped" : "**Fail**"} | ${r.steps.length} | ${r.seconds}s |`),
      "",
      ...this.rows.flatMap((r) => [`## ${r.flow}`, "", ...r.steps.map((s) => `- ${s.ok ? "✓" : "✗"} ${s.title}`), ...(r.error ? ["", `Failure: ${r.error}`] : []), ""]),
    ].join("\n");
    writeFileSync(path.join(DIR, "latest.md"), md);
  }
}
