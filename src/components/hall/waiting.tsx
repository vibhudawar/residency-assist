import { cn } from "@/lib/utils";

/**
 * Skeleton parts in the hall's two materials. The board is not lit yet (dark cells, unlit lamps);
 * the paper is not printed yet (faint ink lines). Every shape sits where the real content will, at
 * its real size, so nothing moves when the content arrives.
 */

/**
 * The waiting screen. Screen readers hear one sentence; the shapes are hidden from them. It only
 * appears if the wait outlasts a blink, so fast loads never flash a skeleton.
 */
export function Waiting({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div role="status" aria-live="polite" className={cn("animate-wait-in", className)}>
      <span className="sr-only">{label}</span>
      <div aria-hidden className="contents">
        {children}
      </div>
    </div>
  );
}

/** An unprinted line on paper, the height of the text it stands for. */
export function Ink({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <span style={style} className={cn("block h-3 rounded-[3px] bg-ink/[0.07] animate-wait-breathe", className)} />;
}

/** An unlit line on the board. */
export function Unlit({ className }: { className?: string }) {
  return <span className={cn("block h-3 rounded-[3px] bg-led-text/[0.08] animate-wait-breathe", className)} />;
}

/** An unlit board lamp: the 8px dot, no glow. */
export function UnlitLamp({ className }: { className?: string }) {
  return <span className={cn("block size-2 shrink-0 rounded-full bg-led-text/25", className)} />;
}

/** The heading of a page or section, as a line of unprinted ink at the heading's own height. */
export function InkHeading({ size = "case", className }: { size?: "case" | "section" | "display"; className?: string }) {
  return (
    <Ink
      className={cn(
        size === "case" ? "h-[26px] w-64" : size === "section" ? "h-[19px] w-44" : "h-9 w-[min(26rem,80%)] lg:h-10",
        className,
      )}
    />
  );
}
