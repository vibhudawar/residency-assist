import Link from "next/link";
import { Panel } from "@/components/hall/led-board";
import { RefCells } from "@/components/hall/ref-cells";
import { CALL_STATUS, LANGUAGE, STATUS_WORD } from "@/lib/console/format";
import type { QueueRow } from "@/lib/console/queries";
import { cn } from "@/lib/utils";
import { ChangeLamp } from "./live";

/** A returned case reads by its weight on the ramp: fixable on the call, or routed to someone else. */
const wordOf = (row: QueueRow) => (row.status === "returned_fixable" && row.ramp === "route" ? "Route" : STATUS_WORD[row.status] ?? row.status);

function Count({ value, label, tone }: { value: number; label: string; tone: string }) {
  return (
    <div className="bg-board px-3 py-2.5">
      <p className={cn("font-led text-[26px] leading-none font-black led-glow", value ? tone : "text-led-text/30")}>{value}</p>
      <p className="mt-1.5 text-[12px] leading-tight text-led-text/70">{label}</p>
    </div>
  );
}

/** The hall's queue board, officer side: every case as a lit row, decisions waiting at the top. */
export function QueueBoard({
  rows,
  selectedId,
  awaitingDecision,
  openHandoffs,
  blockedToday,
}: {
  rows: QueueRow[];
  selectedId: number | null;
  awaitingDecision: number;
  openHandoffs: number;
  blockedToday: number;
}) {
  return (
    <Panel title="Queue" aside={<span className="font-mono text-[12px] text-led-text/60">{rows.length} cases</span>}>
      <div className="grid grid-cols-3 gap-px border-b border-board-rule bg-board-rule">
        <Count value={awaitingDecision} label="Awaiting your decision" tone="text-led-amber" />
        <Count value={openHandoffs} label="Open handoffs" tone="text-led-blue" />
        <Count value={blockedToday} label="Blocked today" tone="text-led-red" />
      </div>
      {rows.length === 0 ? (
        <p className="px-4 py-6 text-[13.5px] leading-relaxed text-led-text/75">
          No cases yet. Submit one from the applicant portal at <span className="font-mono">/apply</span>, or reset the demo to load the seven demo cases.
        </p>
      ) : (
        <ol className="divide-y divide-board-rule">
          {rows.map((row) => {
            const selected = row.id === selectedId;
            // The state line names what last happened: your decision once there is one, otherwise the call.
            const call =
              row.lastDecision && (row.status === "in_processing" || row.status === "needs_human")
                ? row.lastDecision === "approved" ? "Correction approved" : "Correction rejected"
                : row.lastCall ? CALL_STATUS[row.lastCall.status] ?? row.lastCall.status : row.consent ? "Not called yet" : "No AI calls (no consent)";
            return (
              <li key={row.id}>
                <Link
                  href={`/console/cases/${row.id}`}
                  aria-current={selected ? "true" : undefined}
                  className={cn(
                    "grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1.5 px-4 py-3 transition-colors",
                    selected ? "bg-board-2" : "hover:bg-board-2/60",
                  )}
                >
                  <RefCells value={row.reference} tone="board" size="sm" />
                  <ChangeLamp state={row.ramp} label={wordOf(row)} className="justify-self-end" />
                  <span className="col-span-2 flex min-w-0 flex-wrap items-baseline gap-x-2 text-[13px]">
                    <span className={cn("truncate font-medium", selected ? "text-paper" : "text-led-text")}>{row.fullName}</span>
                    {row.failed.length > 0 && <span className="font-mono text-[11.5px] text-led-text/60">{row.failed.join(" ")}</span>}
                  </span>
                  <span className="col-span-2 flex flex-wrap gap-x-2 text-[12px] text-led-text/60">
                    <span>{LANGUAGE[row.language]}</span>
                    <span aria-hidden>·</span>
                    <span>{call}</span>
                    {row.pendingCorrections > 0 && (
                      <>
                        <span aria-hidden>·</span>
                        <span className="text-led-amber">{row.pendingCorrections} to decide</span>
                      </>
                    )}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </Panel>
  );
}
