import { EmptyLog, LOGS, PageHead } from "@/components/console/log";
import { Panel } from "@/components/hall/led-board";
import { agentEvidence, e2eEvidence, liveCallEvidence } from "@/lib/console/evidence";
import { LANGUAGE, uaeTime } from "@/lib/console/format";
import { getLatency } from "@/lib/console/queries";
import { requireOfficer } from "@/lib/officer";
import { cn } from "@/lib/utils";

/** What the backend refuses no matter what the agent asks — enforced in code, exercised by `pnpm smoke:tools`. */
const GUARDRAILS = [
  ["No consent, no call", "Pre-dial checks refuse the call and log it before anything is dialled."],
  ["Officer-only issues never get an AI call", "Type C cases are blocked at pre-dial and get_case refuses to share details."],
  ["Calling hours and retry limits", "Phone calls only 09:00–18:00 UAE; 3 attempts, 1 per day, stop after 2 declines."],
  ["Verify before anything", "Every case tool refuses until the caller passes reference + date-of-birth on this call; 2 tries, then locked."],
  ["Only flagged fields", "submit_correction refuses any field the rules check did not flag."],
  ["Read back first", "submit_correction refuses unless the caller confirmed the read-back."],
  ["Must match the passport record", "A value that still doesn't match is refused, and the record's value is never revealed."],
  ["A human decides", "Corrections are only ever saved as pending review; only Approve here changes the application."],
] as const;

const passed = (r: { passed: number; runs: number }) => r.runs > 0 && r.passed === r.runs;

/** A result on paper: Stamp Green for a pass, officer ink for a fail. */
function Result({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return <span className={cn("rounded-[4px] px-2 py-1 text-[12.5px] font-medium whitespace-nowrap", ok ? "bg-secondary text-ok" : "bg-officer-bg text-officer")}>{children}</span>;
}

export default async function EvidencePage() {
  await requireOfficer();
  const calls = liveCallEvidence();
  const latency = await getLatency(calls);
  const agent = agentEvidence();
  const e2e = e2eEvidence();
  const run = agent.fullRun;
  const allPassed = run.passed === run.runs;

  return (
    <>
      <PageHead title={LOGS.evidence.title} lead={LOGS.evidence.lead} />

      <div className="grid gap-10 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-5">
          <Panel title="Agent tests — latest full run" aside={<span className="font-mono text-[12px] text-led-text/60">{uaeTime(run.ran_at)} · ×{run.repeat}</span>}>
            <div className="flex items-end justify-between gap-4 px-4 pt-4 pb-3.5">
              <div>
                <p className={cn("font-led text-[34px] leading-none font-black led-glow", allPassed ? "text-led-green" : "text-led-amber")}>
                  {run.passed}/{run.runs}
                </p>
                <p className="mt-2 text-[12.5px] text-led-text/75">tests passed, every test run once</p>
              </div>
              <p className="text-end font-mono text-[11.5px] leading-relaxed text-led-text/55">
                {run.llm}
                <br />
                {run.tts_model}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-px border-t border-board-rule bg-board-rule sm:grid-cols-5 lg:grid-cols-3 xl:grid-cols-5">
              {agent.steps.map((s) => (
                <div key={s.step} className="bg-board px-3 py-2.5">
                  <p className={cn("font-led text-[22px] leading-none font-black led-glow", passed(s) ? "text-led-green" : "text-led-amber")}>
                    {s.passed}/{s.runs}
                  </p>
                  <p className="mt-1.5 text-[12px] leading-tight text-led-text/70">{s.label}</p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Response latency by language" aside={<span className="font-mono text-[12px] text-led-text/60">LLM first token, per agent turn</span>}>
            {latency.length === 0 ? (
              <p className="px-4 py-5 text-[13.5px] leading-relaxed text-led-text/75">No recorded calls yet. Latency fills in from each call&apos;s turn metrics.</p>
            ) : (
              <table className="w-full text-[13.5px]">
                <thead>
                  <tr className="border-b border-board-rule text-[12px] text-led-text/60">
                    <th scope="col" className="px-4 py-2 text-start font-normal">Language</th>
                    <th scope="col" className="px-2 py-2 text-end font-normal">Calls</th>
                    <th scope="col" className="px-2 py-2 text-end font-normal">Average</th>
                    <th scope="col" className="px-4 py-2 text-end font-normal">Worst</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-board-rule">
                  {latency.map((l) => (
                    <tr key={l.language}>
                      <td className="px-4 py-3 text-led-text">{LANGUAGE[l.language] ?? l.language}</td>
                      <td className="px-2 py-3 text-end font-mono text-led-text/75">{l.calls}</td>
                      <td className="px-2 py-3 text-end font-led text-[17px] font-black text-led-amber led-glow">{l.avgMs}<span className="ms-1 font-sans text-[11px] font-normal text-led-text/60">ms</span></td>
                      <td className="px-4 py-3 text-end font-mono text-led-text/75">{l.maxMs} ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Panel>
        </div>

        <div className="space-y-10 lg:col-span-7">
          <section aria-labelledby="agent-tests">
            <h2 id="agent-tests" className="text-[19px] font-semibold">Agent tests</h2>
            <p className="mt-1.5 max-w-[70ch] text-[14px] leading-relaxed text-ink-2">
              Run on ElevenLabs&apos; test runner against the deployed agent. Each test replays a moment of a call and checks what the assistant says, or which tool it calls with which values; two play a whole call with a simulated caller.
            </p>

            <h3 className="mt-5 text-[14.5px] font-medium">Must never fail</h3>
            <ul className="mt-2 divide-y divide-rule rounded-[6px] border border-rule bg-paper">
              {agent.mustNeverFail.map((t) => (
                <li key={t.name} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 px-5 py-3">
                  <span className="text-[14.5px]">{t.title}</span>
                  <Result ok={passed(t.latest)}>{passed(t.latest) ? "Passed" : "Failed"}</Result>
                </li>
              ))}
            </ul>

            {agent.sinceFullRun.length > 0 && (
              <>
                <h3 className="mt-6 text-[14.5px] font-medium">Since the full run</h3>
                <ul className="mt-2 divide-y divide-rule rounded-[6px] border border-rule bg-paper">
                  {agent.sinceFullRun.map((t) => (
                    <li key={t.name} className="grid gap-1 px-5 py-3 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-6">
                      <span>
                        <span className="text-[14.5px]">{t.title}</span>
                        <span className="mt-0.5 block text-[13px] text-ink-2">
                          {t.full ? (passed(t.full) ? "Passed in the full run; rerun" : "Failed in the full run; rerun after a fix") : "Added after the full run"} · <span className="font-mono text-[12.5px]">{uaeTime(t.latest.ran_at)}</span>
                        </span>
                      </span>
                      <Result ok={passed(t.latest)}>{passed(t.latest) ? "Passed" : "Failed"}</Result>
                    </li>
                  ))}
                </ul>
              </>
            )}

            <div className="mt-6">
              <EmptyLog>
                Pass rates over 10 runs of every test: not run yet. A full run uses about 6,000 ElevenLabs credits, so the ten-run rates come when the challenge credits arrive.
              </EmptyLog>
            </div>

            <details className="group mt-4">
              <summary className="cursor-pointer text-[13.5px] font-medium text-ink-2 hover:text-ink">Every test and its latest result · {agent.tests.length} tests</summary>
              <div className="mt-3 overflow-x-auto rounded-[6px] border border-rule bg-paper">
                <table className="w-full min-w-[560px] text-[14px]">
                  <thead>
                    <tr className="border-b border-rule text-[12.5px] text-ink-2">
                      <th scope="col" className="px-4 py-2.5 text-start font-normal">Test</th>
                      <th scope="col" className="px-4 py-2.5 text-start font-normal">Call step</th>
                      <th scope="col" className="px-4 py-2.5 text-end font-normal">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rule">
                    {agent.tests.map((t) => (
                      <tr key={t.name}>
                        <td className="px-4 py-2.5">{t.title}</td>
                        <td className="px-4 py-2.5 text-ink-2">{agent.stepWord[t.step] ?? t.step}</td>
                        <td className="px-4 py-2.5 text-end">
                          <Result ok={passed(t.latest)}>{t.latest.passed}/{t.latest.runs}</Result>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </section>

          {calls.length > 0 && (
            <section aria-labelledby="live-calls">
              <h2 id="live-calls" className="text-[19px] font-semibold">Live calls</h2>
              <p className="mt-1.5 max-w-[70ch] text-[14px] leading-relaxed text-ink-2">
                Real calls with the deployed agent, checked end to end and kept here so a demo reset doesn&apos;t remove them. The checks are ElevenLabs&apos; post-call evaluation against our criteria.
              </p>
              <ul className="mt-4 divide-y divide-rule rounded-[6px] border border-rule bg-paper">
                {calls.map((c) => {
                  const checks = Object.values(c.evaluation);
                  const ok = checks.filter((r) => r === "success").length;
                  return (
                    <li key={c.conversation_id} className="grid gap-1 px-5 py-3 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-6">
                      <span>
                        <span className="text-[14.5px]">{c.summary_title ?? "Call"}</span>
                        <span className="mt-0.5 block text-[13px] text-ink-2">
                          {c.channel === "phone" ? "Phone" : "Browser"} · {LANGUAGE[c.language] ?? c.language} · {Math.floor(c.duration_secs / 60)}:{String(c.duration_secs % 60).padStart(2, "0")} · {(c.data_collected.outcome ?? "").replace(/_/g, " ") || "outcome not recorded"} · <span className="font-mono text-[12.5px]">{uaeTime(c.started_at)}</span>
                        </span>
                      </span>
                      <Result ok={ok === checks.length && checks.length > 0}>{ok}/{checks.length} checks passed</Result>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          <section aria-labelledby="e2e-flows">
            <h2 id="e2e-flows" className="text-[19px] font-semibold">End-to-end flows</h2>
            <p className="mt-1.5 max-w-[70ch] text-[14px] leading-relaxed text-ink-2">
              {e2e.passed} of {e2e.total} passed · <span className="font-mono text-[12.5px]">{uaeTime(e2e.ranAt)}</span>. Each flow starts from a fresh demo and plays the applicant and the officer in a real browser, and the assistant and ElevenLabs&apos; webhook through the same endpoints the live agent uses.
            </p>
            <ul className="mt-4 divide-y divide-rule rounded-[6px] border border-rule bg-paper">
              {e2e.flows.map((f) => (
                <li key={f.flow} className="grid gap-1 px-5 py-3 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-6">
                  <span>
                    <span className="text-[14.5px]">{f.flow}</span>
                    <span className="mt-0.5 block text-[13px] text-ink-2">{f.steps.length} steps · {f.seconds}s</span>
                  </span>
                  <Result ok={f.status === "passed"}>{f.status === "passed" ? "Passed" : f.status === "skipped" ? "Skipped" : "Failed"}</Result>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="guardrails">
            <h2 id="guardrails" className="text-[19px] font-semibold">Guardrails enforced by the backend</h2>
            <p className="mt-1.5 max-w-[70ch] text-[14px] leading-relaxed text-ink-2">
              The agent&apos;s prompt asks for these too, but the backend is the lock: each refusal is written to Blocked actions.
            </p>
            <ul className="mt-4 divide-y divide-rule rounded-[6px] border border-rule bg-paper">
              {GUARDRAILS.map(([rule, how]) => (
                <li key={rule} className="grid gap-1 px-5 py-3.5 sm:grid-cols-[16rem_1fr] sm:gap-6">
                  <span className="text-[14.5px] font-medium">{rule}</span>
                  <span className="text-[14px] leading-snug text-ink-2">{how}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}
