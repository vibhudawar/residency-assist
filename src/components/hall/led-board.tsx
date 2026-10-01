import { cn } from "@/lib/utils";

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
  pending: "bg-led-dim text-led-dim",
};
const word: Record<LedState, string> = {
  pass: "text-led-green",
  fix: "text-led-amber",
  route: "text-led-blue",
  officer: "text-led-red",
  pending: "text-led-dim",
};

/**
 * The service hall's LED board. Rows light one after another when `cascade` is set
 * (the rules check running); otherwise the board shows its final state immediately.
 */
export function LedBoard({
  title,
  aside,
  rows,
  cascade = false,
  dense = false,
  className,
}: {
  title: string;
  aside?: React.ReactNode;
  rows: LedRow[];
  cascade?: boolean;
  dense?: boolean;
  className?: string;
}) {
  return (
    <section
      aria-label={title}
      className={cn("rounded-[10px] bg-board p-1.5 text-led-text shadow-[0_24px_40px_-24px_rgb(0_0_0/0.6)]", className)}
    >
      <div className="rounded-[7px] border border-board-rule bg-[radial-gradient(circle_at_1px_1px,#ffffff08_1px,transparent_1.2px)] bg-[length:6px_6px]">
        <header className="flex items-center justify-between gap-3 border-b border-board-rule px-4 py-2.5">
          <h2 className="text-[13px] font-medium tracking-[0.04em] text-led-text">{title}</h2>
          {aside}
        </header>
        <ol className={cn("divide-y divide-board-rule", dense ? "text-[13px]" : "text-[14px]")}>
          {rows.map((row, i) => (
            <li
              key={row.key}
              className={cn("grid grid-cols-[auto_1fr_auto] items-start gap-x-3 px-4", dense ? "py-2" : "py-2.5", cascade && "animate-led-on")}
              style={cascade ? { animationDelay: `${900 + i * 160}ms` } : undefined}
            >
              <span aria-hidden className={cn("mt-[0.45em] size-2 rounded-full led-glow shadow-[0_0_8px_currentColor]", lamp[row.state])} />
              <span className="min-w-0">
                <span className="flex items-baseline gap-2">
                  {row.code && <span dir="ltr" className="font-led text-[13px] font-bold text-led-dim">{row.code}</span>}
                  <span className="truncate">{row.label}</span>
                </span>
                {row.detail && <span className="mt-1 block text-[12.5px] leading-snug text-led-text/75">{row.detail}</span>}
              </span>
              <span className={cn("font-led text-[15px] font-black tracking-[0.06em] led-glow uppercase", word[row.state])}>{row.stateLabel}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/** A small "live" lamp for the board header. */
export function LiveLamp({ label }: { label: string }) {
  return (
    <span className="flex items-center gap-2 text-[11px] text-led-text/70">
      <span aria-hidden className="relative flex size-2">
        <span className="absolute inset-0 animate-ping rounded-full bg-led-green/60" />
        <span className="relative size-2 rounded-full bg-led-green" />
      </span>
      {label}
    </span>
  );
}
