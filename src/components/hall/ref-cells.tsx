import { cn } from "@/lib/utils";

const TEMPLATE = "RA-······";

/**
 * The application reference in fixed character cells, like a queue ticket's number.
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
  size?: "md" | "lg";
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
      {chars.map((ch, i) => (
        <span
          key={`${i}-${ch}`}
          aria-hidden
          className={cn(
            "grid place-items-center rounded-[3px] leading-none",
            size === "lg" ? "h-[52px] w-[34px] text-[34px]" : "h-[34px] w-[23px] text-[22px]",
            tone === "paper"
              ? ch === "-" ? "w-[14px] bg-transparent text-ink" : "bg-ink text-led-amber"
              : ch === "-" ? "w-[14px] bg-transparent text-led-amber" : "bg-board-2 text-led-amber shadow-[inset_0_-1px_0_var(--board-rule)]",
            empty && ch === "·" && "text-led-dim",
            cascade && !empty && "animate-cell-drop",
            ch !== "-" && "led-glow",
          )}
          style={cascade && !empty ? { animationDelay: `${300 + i * 70}ms` } : undefined}
        >
          {ch === "·" ? "0" : ch}
        </span>
      ))}
    </span>
  );
}
