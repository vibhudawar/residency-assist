import { EmptyLog, LOGS, PageHead } from "@/components/console/log";
import { Panel } from "@/components/hall/led-board";
import { LANGUAGE } from "@/lib/console/format";
import { getLatency } from "@/lib/console/queries";
import { requireOfficer } from "@/lib/officer";

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

export default async function EvidencePage() {
  await requireOfficer();
  const latency = await getLatency();
  return (
    <>
      <PageHead title={LOGS.evidence.title} lead={LOGS.evidence.lead} />

      <div className="grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-5">
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
          <section aria-label="Agent tests">
            <h2 className="text-[19px] font-semibold">Agent tests</h2>
            <div className="mt-4">
              <EmptyLog>
                Not run yet. The suite runs on ElevenLabs once the agent exists: about 25 scenario tests, each repeated 10 times for a pass rate, including the high-stakes tool-call test that submit_correction is sent with the right field and value, and never before verification and read-back.
              </EmptyLog>
            </div>
          </section>

          <section aria-label="Guardrails">
            <h2 className="text-[19px] font-semibold">Guardrails enforced by the backend</h2>
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
