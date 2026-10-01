import { cn } from "@/lib/utils";
import { RefCells } from "./ref-cells";

export type LedState = "pass" | "fix" | "route" | "officer" | "pending";

export interface LedRow {
  key: string;
  code?: string;
  label: string;
  state: LedState;
  stateLabel: string;
  detail?: string | null;
}

const lamp: Record<LedState, string> = {
  pass: "bg-led-green text-led-green",
  fix: "bg-led-amber text-led-amber",
  route: "bg-led-blue text-led-blue",
  officer: "bg-led-red text-led-red",
  pending: "bg-led-text/25 text-led-text/25",
};
const word: Record<LedState, string> = {
  pass: "text-led-green",
  fix: "text-led-amber",
  route: "text-led-blue",
  officer: "text-led-red",
  pending: "text-led-text/60",
};

/** The board's panel: black frame, faint dot-matrix field, one header row. */
function Panel({ title, aside, children, className }: { title: string; aside?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section aria-label={title} className={cn("rounded-[10px] bg-board p-1.5 text-led-text shadow-[0_24px_40px_-24px_rgb(0_0_0/0.6)]", className)}>
      <div className="rounded-[7px] border border-board-rule bg-[radial-gradient(circle_at_1px_1px,#ffffff08_1px,transparent_1.2px)] bg-[length:6px_6px]">
        <header className="flex items-center justify-between gap-3 border-b border-board-rule px-4 py-2.5">
          <h2 className="text-[13px] font-medium text-led-text">{title}</h2>
          {aside}
        </header>
        {children}
      </div>
    </section>
  );
}

/**
 * The rules check. With `cascade`, rows light one after another, each holding amber
 * ("checking") before settling on its result; otherwise the board shows its final state.
 */
export function LedBoard({
  title,
  aside,
  rows,
  checkingLabel,
  cascade = false,
  dense = false,
  className,
}: {
  title: string;
  aside?: React.ReactNode;
  rows: LedRow[];
  checkingLabel?: string;
  cascade?: boolean;
  dense?: boolean;
  className?: string;
}) {
  return (
    <Panel title={title} aside={aside} className={className}>
      <ol className={cn("divide-y divide-board-rule", dense ? "text-[13px]" : "text-[14px]")}>
        {rows.map((row, i) => {
          const at = 900 + i * 160;
          const delay = { animationDelay: `${at}ms` };
          return (
            <li
              key={row.key}
              className={cn("grid grid-cols-[auto_1fr_auto] items-start gap-x-3 px-4", dense ? "py-2" : "py-2.5", cascade && "animate-led-on")}
              style={cascade ? delay : undefined}
            >
              <span
                aria-hidden
                className={cn("mt-[0.45em] size-2 rounded-full shadow-[0_0_8px_currentColor]", lamp[row.state], cascade && "animate-led-check")}
                style={cascade ? delay : undefined}
              />
              <span className="min-w-0">
                <span className="flex items-baseline gap-2">
                  {row.code && <span dir="ltr" className="font-mono text-[12px] text-led-text/60">{row.code}</span>}
                  <span className="truncate">{row.label}</span>
                </span>
                {row.detail && <span className="mt-1 block text-[12.5px] leading-snug text-led-text/75">{row.detail}</span>}
              </span>
              <span className="relative grid text-end font-led text-[15px] font-black tracking-[0.06em] uppercase rtl:tracking-normal">
                {cascade && checkingLabel && (
                  <span aria-hidden className="col-start-1 row-start-1 text-led-amber led-glow animate-led-out" style={delay}>
                    {checkingLabel}
                  </span>
                )}
                <span className={cn("col-start-1 row-start-1 led-glow", word[row.state], cascade && "animate-led-in")} style={cascade ? delay : undefined}>
                  {row.stateLabel}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
    </Panel>
  );
}

export interface StageLamp {
  key: string;
  label: string;
  state: "done" | "current" | "upcoming";
}

/**
 * "Now serving": the hall board says where the application is — the number,
 * the current stage in lit dot-matrix, and every stage as a lamp.
 */
export function StageBoard({
  title,
  reference,
  numberLabel,
  currentLabel,
  stages,
  aside,
  className,
}: {
  title: string;
  reference: string;
  numberLabel: string;
  currentLabel: string;
  stages: StageLamp[];
  aside?: React.ReactNode;
  className?: string;
}) {
  return (
    <Panel title={title} aside={aside} className={className}>
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 px-4 pt-4 pb-3">
        <div>
          <p className="text-[12px] text-led-text/70">{numberLabel}</p>
          <RefCells value={reference} tone="board" size="md" className="mt-1.5" />
        </div>
        <p aria-live="polite" className="font-led text-[26px] leading-none font-black tracking-[0.04em] text-led-amber uppercase led-glow rtl:tracking-normal">
          {currentLabel}
        </p>
      </div>
      {/* Two even rows of three: labels never wrap unevenly. */}
      <ol className="grid grid-cols-3 gap-px border-t border-board-rule bg-board-rule">
        {stages.map((s) => (
          <li key={s.key} aria-current={s.state === "current" ? "step" : undefined} className="flex items-center gap-2 bg-board px-3 py-2.5 text-[12.5px] leading-tight">
            <span
              aria-hidden
              className={cn(
                "size-2 shrink-0 rounded-full",
                s.state === "done" && "bg-led-green shadow-[0_0_6px_var(--led-green)]",
                s.state === "current" && "bg-led-amber shadow-[0_0_8px_var(--led-amber)]",
                s.state === "upcoming" && "bg-led-text/25",
              )}
            />
            <span className={cn("whitespace-nowrap", s.state === "current" ? "font-medium text-led-amber" : s.state === "done" ? "text-led-text" : "text-led-text/60")}>
              {s.label}
            </span>
          </li>
        ))}
      </ol>
    </Panel>
  );
}

/** A steady "live" lamp for a board header. */
export function LiveLamp({ label }: { label: string }) {
  return (
    <span className="flex items-center gap-2 text-[11px] text-led-text/70">
      <span aria-hidden className="size-2 rounded-full bg-led-green shadow-[0_0_6px_var(--led-green)]" />
      {label}
    </span>
  );
}
