import { cn } from "@/lib/utils";
import { Barcode } from "./barcode";
import { RefCells } from "./ref-cells";

export interface TicketLine {
  label: string;
  value: string;
  /** Show the value as typed rather than forced uppercase. */
  keepCase?: boolean;
}

/**
 * The thermal service-hall ticket. The same ticket appears at every stage, at the same scale,
 * so the only thing that moves between stages is what actually changed.
 * Everything on it is one printed voice: thermal mono, ink on paper.
 */
export function Ticket({
  hall,
  numberLabel,
  pendingLabel,
  reference,
  lines,
  cascade = false,
  feed = false,
  className,
}: {
  hall: string;
  numberLabel: string;
  pendingLabel: string;
  reference: string | null;
  lines: TicketLine[];
  cascade?: boolean;
  feed?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "ticket-edge relative w-full max-w-[360px] bg-paper px-6 pt-7 pb-6 font-mono text-[12.5px] leading-snug text-ink",
        "shadow-[0_18px_30px_-18px_rgb(22_24_26/0.45),0_2px_6px_-2px_rgb(22_24_26/0.18)]",
        feed && "animate-paper-feed",
        className,
      )}
    >
      {/* Masthead: printed in the ticket's own voice, not a label above a heading. */}
      <div className="flex items-center justify-between gap-3">
        <span className="font-semibold uppercase rtl:normal-case">{hall}</span>
        <span aria-hidden className="flex gap-1">
          <span className="size-1.5 rounded-full bg-ink" />
          <span className="size-1.5 rounded-full bg-ink/60" />
          <span className="size-1.5 rounded-full bg-ink/30" />
        </span>
      </div>

      <div className="mt-4 border-t border-dashed border-ink/30 pt-4">
        <p className="text-ink-2 uppercase rtl:normal-case">{numberLabel}</p>
        <div className="mt-2">
          <RefCells value={reference} cascade={cascade} />
        </div>
        {!reference && <p className="mt-2 text-ink-2">{pendingLabel}</p>}
      </div>

      <dl className="mt-5 space-y-1.5 border-t border-dashed border-ink/30 pt-4">
        {lines.map((line) => (
          <div key={line.label} className="grid grid-cols-[7.5rem_1fr] gap-2">
            <dt className="text-ink-2 uppercase rtl:normal-case">{line.label}</dt>
            <dd className={cn("min-h-[1.2em] break-words", !line.keepCase && "uppercase rtl:normal-case")}>{line.value || "—"}</dd>
          </div>
        ))}
      </dl>

      <div dir="ltr" className="mt-5 flex flex-col items-center gap-1 text-ink">
        <Barcode value={reference ?? ""} className="h-7 w-full max-w-[240px]" />
        <span className="text-[10px] tracking-[0.3em] text-ink-2">{reference ?? "RA-000000"}</span>
      </div>
    </div>
  );
}
