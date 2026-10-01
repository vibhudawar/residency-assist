import { cn } from "@/lib/utils";
import { Barcode } from "./barcode";
import { RefCells } from "./ref-cells";

export interface TicketLine {
  label: string;
  value: string;
  /** Show the value in Arabic/Latin as typed rather than forced uppercase. */
  keepCase?: boolean;
}

/**
 * The thermal service-hall ticket. The same ticket appears at every stage, at the same scale,
 * so the only thing that moves between stages is what actually changed.
 */
export function Ticket({
  hall,
  header,
  numberLabel,
  pendingLabel,
  reference,
  lines,
  cascade = false,
  feed = false,
  footer,
  className,
}: {
  hall: string;
  header: string;
  numberLabel: string;
  pendingLabel: string;
  reference: string | null;
  lines: TicketLine[];
  cascade?: boolean;
  feed?: boolean;
  footer?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "ticket-edge relative w-full max-w-[360px] bg-paper px-6 pt-7 pb-6 text-ink",
        "shadow-[0_18px_30px_-18px_rgb(22_24_26/0.45),0_2px_6px_-2px_rgb(22_24_26/0.18)]",
        feed && "animate-paper-feed",
        className,
      )}
    >
      <div className="flex items-baseline justify-between gap-3 font-mono text-[11px] tracking-[0.12em] text-ink-2 uppercase">
        <span>{hall}</span>
        <span aria-hidden className="flex gap-1">
          <span className="size-1.5 rounded-full bg-ink" />
          <span className="size-1.5 rounded-full bg-ink/60" />
          <span className="size-1.5 rounded-full bg-ink/30" />
        </span>
      </div>
      <p className="mt-3 text-[15px] leading-snug font-medium">{header}</p>

      <div className="mt-5 border-t border-dashed border-ink/30 pt-4">
        <p className="font-mono text-[11px] tracking-[0.12em] text-ink-2 uppercase">{numberLabel}</p>
        <div className="mt-2">
          <RefCells value={reference} cascade={cascade} />
        </div>
        {!reference && <p className="mt-2 font-mono text-[11px] text-ink-2">{pendingLabel}</p>}
      </div>

      <dl className="mt-5 space-y-1.5 border-t border-dashed border-ink/30 pt-4 font-mono text-[12.5px] leading-snug">
        {lines.map((line) => (
          <div key={line.label} className="grid grid-cols-[7.5rem_1fr] gap-2">
            <dt className="text-ink-2 uppercase">{line.label}</dt>
            <dd className={cn("min-h-[1.2em] break-words", !line.keepCase && "uppercase")}>{line.value || "—"}</dd>
          </div>
        ))}
      </dl>

      {footer && <div className="mt-5 border-t border-dashed border-ink/30 pt-4">{footer}</div>}

      <div dir="ltr" className="mt-5 flex flex-col items-center gap-1 text-ink">
        <Barcode value={reference ?? ""} className="h-7 w-full max-w-[240px]" />
        <span className="font-mono text-[10px] tracking-[0.3em] text-ink-2">{reference ?? "RA-000000"}</span>
      </div>
    </div>
  );
}
