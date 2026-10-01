import { cn } from "@/lib/utils";

const TEMPLATE = "RA-······";

/**
 * The application reference in fixed character cells, like a queue ticket's number.
 * - `paper`: thermal print — reverse-printed ink cells with paper-coloured digits. Paper can't glow.
 * - `board`: the LED board — amber dot-matrix digits that glow.
 * With `cascade`, each cell drops in one after another (the ticket "printing").
 */
export function RefCells({
  value,
  cascade = false,
  size = "lg",
  tone = "paper",
  className,
}: {
  value: string | null;
  cascade?: boolean;
  size?: "sm" | "md" | "lg";
  tone?: "paper" | "board";
  className?: string;
}) {
  const chars = (value ?? TEMPLATE).split("");
  const empty = !value;
  return (
    <span
      dir="ltr"
      role="img"
      aria-label={value ? value.split("").join(" ") : undefined}
      className={cn("inline-flex gap-[3px] font-led font-black tabular-nums", className)}
    >
      {chars.map((ch, i) => {
        const dash = ch === "-";
        const blank = ch === "·";
        return (
          <span
            key={`${i}-${ch}`}
            aria-hidden
            className={cn(
              "grid place-items-center rounded-[3px] leading-none",
              size === "lg" ? "h-[52px] w-[34px] text-[34px]" : size === "md" ? "h-[34px] w-[23px] text-[22px]" : "h-[24px] w-[16px] text-[15px]",
              dash && (size === "lg" ? "w-[14px]" : size === "md" ? "w-[10px]" : "w-[7px]"),
              tone === "paper"
                ? dash ? "bg-transparent text-ink" : blank ? "border border-dashed border-ink/30 bg-transparent" : "bg-ink text-paper"
                : dash ? "bg-transparent text-led-amber" : blank ? "bg-board-2 shadow-[inset_0_-1px_0_var(--board-rule)]" : "bg-board-2 text-led-amber led-glow shadow-[inset_0_-1px_0_var(--board-rule)]",
              cascade && !empty && "animate-cell-drop",
            )}
            style={cascade && !empty ? { animationDelay: `${300 + i * 70}ms` } : undefined}
          >
            {blank ? "" : ch}
          </span>
        );
      })}
    </span>
  );
}
