import { Panel } from "@/components/hall/led-board";
import { RefCells } from "@/components/hall/ref-cells";
import {
  Ink,
  InkHeading,
  Unlit,
  UnlitLamp,
  Waiting,
} from "@/components/hall/waiting";
import { CHECK_LABEL } from "@/lib/console/format";
import { cn } from "@/lib/utils";
import { LOGS, LogTable, PageHead } from "./log";

/*
 * The console's loading screens. The forms are pre-printed: fixed labels (section names, fact labels,
 * board titles, column heads) are real text, and only the case data is unprinted (paper) or unlit
 * (board). Every block sits at its real size, so nothing jumps when the data arrives.
 */

const FACT_LABELS = [
  "Date of birth (form)",
  "Passport number",
  "Passport expiry",
  "Profession code",
  "Mobile",
  "Call language",
  "AI-call consent",
  "Appointment",
];
// The checks run in this order for every case (predial.ts), so their labels can print before the results.
const CHECKS = [
  "consent",
  "do_not_call",
  "calling_hours",
  "officer_only",
  "fixable_issue",
  "attempt_limits",
  "no_active_call",
].map((k) => CHECK_LABEL[k]);

function SectionHead({
  title,
  aside = true,
}: {
  title?: string;
  aside?: boolean;
}) {
  return (
    <div className="mb-3.5 flex items-baseline justify-between gap-4">
      {title ? (
        <h2 className="text-[19px] font-semibold">{title}</h2>
      ) : (
        <InkHeading size="section" className="mt-1" />
      )}
      {aside && <Ink className="w-28" />}
    </div>
  );
}

/** The open case file, unprinted: same sections, same order, same sizes. */
export function CaseFileWaiting() {
  return (
    <Waiting label="Opening the case…">
      <CaseFileShapes />
    </Waiting>
  );
}

function CaseFileShapes() {
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0">
          <RefCells value={null} size="md" />
          <InkHeading className="mt-4" />
          <div className="mt-3 flex items-center gap-3">
            <Ink className="h-[25px] w-36 rounded-[4px]" />
            <Ink className="w-32" />
          </div>
        </div>
        <span className="block h-[100px] w-[80px] rounded-[4px] border border-dashed border-ink/25" />
      </header>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-[6px] border border-rule bg-paper px-5 py-3.5 sm:grid-cols-4">
        {FACT_LABELS.map((label, i) => (
          <div key={label}>
            <dt className="text-[12.5px] text-ink-2">{label}</dt>
            <dd className="mt-0.5 flex h-[21px] items-center">
              <Ink
                className={cn(
                  i % 3 === 0 ? "w-24" : i % 3 === 1 ? "w-28" : "w-20",
                )}
              />
            </dd>
          </div>
        ))}
      </dl>

      <section className="border-t border-rule pt-5">
        <SectionHead />
        <ul className="space-y-2.5">
          {[0, 1].map((i) => (
            <li
              key={i}
              className="grid grid-cols-[auto_1fr] gap-x-4 rounded-[6px] border border-rule bg-paper px-4 py-3.5"
            >
              <Ink className="h-[24px] w-9 rounded-[4px]" />
              <div className="space-y-2 pt-1">
                <div className="flex justify-between gap-4">
                  <Ink className="w-56" />
                  <Ink className="w-40 max-sm:hidden" />
                </div>
                <Ink className="w-[min(36rem,90%)]" />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-t border-rule pt-5">
        <SectionHead title="Your decision" aside={false} />
        <div className="rounded-[6px] border border-rule bg-paper">
          <div className="space-y-2.5 px-4 py-4">
            <Ink className="w-48" />
            <Ink className="h-[18px] w-72" />
          </div>
          <div className="flex items-center justify-between gap-4 border-t border-rule px-4 py-3.5">
            <Ink className="h-12 w-56 rounded-[8px]" />
            <Ink className="h-10 w-24 rounded-[8px]" />
          </div>
        </div>
      </section>

      <section className="border-t border-rule pt-5">
        <SectionHead title="Call" aside={false} />
        <Panel
          title="Before calling"
          aside={
            <span className="font-mono text-[12px] text-led-text/60">
              checked on every press
            </span>
          }
        >
          <table className="w-full text-[13.5px]">
            <thead>
              <tr className="border-b border-board-rule text-[12px] text-led-text/60">
                <th scope="col" className="px-4 py-2 text-start font-normal">
                  Check
                </th>
                <th scope="col" className="w-28 px-2 py-2 text-end font-normal">
                  Phone
                </th>
                <th scope="col" className="w-28 px-4 py-2 text-end font-normal">
                  Browser
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-board-rule">
              {CHECKS.map((c) => (
                <tr key={c}>
                  <td className="px-4 py-2.5">
                    <span className="block text-led-text">{c}</span>
                    <Unlit className="mt-1.5 h-2.5 w-44" />
                  </td>
                  <td className="px-2 py-2.5">
                    <span className="flex items-center justify-end gap-2">
                      <UnlitLamp />
                      <Unlit className="h-3 w-9" />
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="flex items-center justify-end gap-2">
                      <UnlitLamp />
                      <Unlit className="h-3 w-9" />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center gap-3 border-t border-board-rule px-4 py-3.5">
            <Unlit className="h-10 w-32 rounded-[8px]" />
            <Unlit className="h-10 w-40 rounded-[8px]" />
          </div>
        </Panel>
      </section>

      <section className="border-t border-rule pt-6">
        <div className="ticket-edge bg-paper px-6 pt-6 pb-6 font-mono text-[12.5px] leading-snug shadow-[0_18px_30px_-18px_rgb(22_24_26/0.45),0_2px_6px_-2px_rgb(22_24_26/0.18)]">
          <p className="flex justify-between border-b border-dashed border-ink/30 pb-3 font-semibold uppercase">
            <span>Case history</span>
            <Ink className="w-20" />
          </p>
          <div className="mt-3 space-y-2.5">
            {[64, 48, 72, 40, 56].map((w, i) => (
              <div
                key={i}
                className="grid grid-cols-[5.5rem_4.5rem_1fr] gap-x-3"
              >
                <Ink className="w-16" />
                <Ink className="w-12" />
                <Ink style={{ width: `${w}%` }} />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

/** The queue board, unlit: header and counts in place, rows dark. */
export function QueueWaiting() {
  return (
    <Panel title="Queue" aside={<Unlit className="h-2.5 w-14" />}>
      <div className="grid grid-cols-3 gap-px border-b border-board-rule bg-board-rule">
        {["Awaiting your decision", "Open handoffs", "Blocked today"].map(
          (label) => (
            <div key={label} className="bg-board px-3 py-2.5">
              <Unlit className="h-[26px] w-7" />
              <p className="mt-1.5 text-[12px] leading-tight text-led-text/70">
                {label}
              </p>
            </div>
          ),
        )}
      </div>
      <ol className="divide-y divide-board-rule">
        {/* Seven rows: the demo queue's size, so the board doesn't grow when it lights. */}
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <li
            key={i}
            className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1.5 px-4 py-3"
          >
            <RefCells value={null} tone="board" size="sm" />
            <span className="flex items-center gap-2.5 justify-self-end">
              <UnlitLamp />
              <Unlit className="h-3.5 w-14" />
            </span>
            <span className="col-span-2 flex h-[1lh] items-center text-[13px]">
              <Unlit className="w-40" />
            </span>
            <span className="col-span-2 flex h-[1lh] items-center text-[12px]">
              <Unlit className="h-2.5 w-52" />
            </span>
          </li>
        ))}
      </ol>
    </Panel>
  );
}

/** The whole desk, when the Cases tab is opened from another section. */
export function DeskWaiting() {
  return (
    <Waiting label="Opening the case desk…">
      <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-4">
          <QueueWaiting />
        </div>
        <div className="min-w-0 lg:col-span-8">
          <CaseFileShapes />
        </div>
      </div>
    </Waiting>
  );
}

/** A cross-case log: its own title and columns, rows unprinted. */
export function LogWaiting({ log }: { log: "handoffs" | "sms" | "blocked" }) {
  const { title, lead, head } = LOGS[log];
  return (
    <Waiting label={`Loading ${title.toLowerCase()}…`}>
      <PageHead title={title} lead={lead} />
      <LogTable head={head}>
        {[0, 1, 2, 3, 4, 5].map((r) => (
          <tr key={r}>
            {head.map((h, c) => (
              <td key={h} className="px-4 py-3.5">
                <Ink
                  className={
                    c === 0
                      ? "w-28"
                      : c === 1
                        ? "w-20"
                        : c === head.length - 1
                          ? "w-[min(18rem,100%)]"
                          : "w-24"
                  }
                />
              </td>
            ))}
          </tr>
        ))}
      </LogTable>
    </Waiting>
  );
}

/** Call records: one unprinted record card per call. */
export function RecordsWaiting() {
  const { title, lead } = LOGS.records;
  return (
    <Waiting label="Loading call records…">
      <PageHead title={title} lead={lead} />
      <div className="space-y-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-[6px] border border-rule bg-paper">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-rule px-5 py-4">
              <Ink className="w-20" />
              <Ink className="w-28" />
              <Ink className="w-16" />
              <Ink className="w-24" />
              <Ink className="w-48" />
              <Ink className="ms-auto h-[25px] w-20 rounded-[4px]" />
            </div>
            <div className="space-y-2.5 px-5 py-4">
              <Ink className="w-[min(40rem,95%)]" />
              <Ink className="w-[min(30rem,80%)]" />
              <Ink className="mt-4 w-36" />
            </div>
            <div className="border-t border-rule px-5 py-3">
              <Ink className="h-2.5 w-80" />
            </div>
          </div>
        ))}
      </div>
    </Waiting>
  );
}

/** Evidence: the latency board unlit; the section headings are fixed words, so they print. */
export function EvidenceWaiting() {
  const { title, lead } = LOGS.evidence;
  return (
    <Waiting label="Loading the evidence…">
      <PageHead title={title} lead={lead} />
      <div className="grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Panel
            title="Response latency by language"
            aside={
              <span className="font-mono text-[12px] text-led-text/60">
                LLM first token, per agent turn
              </span>
            }
          >
            <div className="divide-y divide-board-rule">
              {["English", "Arabic", "Hindi"].map((l) => (
                <div
                  key={l}
                  className="flex items-center justify-between gap-4 px-4 py-3.5"
                >
                  <span className="text-[13.5px] text-led-text">{l}</span>
                  <Unlit className="h-[17px] w-16" />
                </div>
              ))}
            </div>
          </Panel>
        </div>
        <div className="space-y-10 lg:col-span-7">
          <section>
            <h2 className="text-[19px] font-semibold">Agent tests</h2>
            <Ink className="mt-4 h-16 w-full rounded-[6px]" />
          </section>
          <section>
            <h2 className="text-[19px] font-semibold">Guardrails enforced by the backend</h2>
            <Ink className="mt-4 h-72 w-full rounded-[6px]" />
          </section>
        </div>
      </div>
    </Waiting>
  );
}
