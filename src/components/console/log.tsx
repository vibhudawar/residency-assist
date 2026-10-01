import Link from "next/link";
import { cn } from "@/lib/utils";

export function PageHead({ title, lead, aside }: { title: string; lead: string; aside?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
      <div>
        <h1 className="text-[28px] leading-tight font-semibold tracking-[-0.015em]">{title}</h1>
        <p className="mt-2 max-w-[70ch] text-[15px] leading-relaxed text-ink-2">{lead}</p>
      </div>
      {aside}
    </div>
  );
}

/** An empty log that says what will fill it, so the screen teaches itself. */
export function EmptyLog({ children }: { children: React.ReactNode }) {
  return <p className="max-w-[70ch] rounded-[6px] border border-dashed border-ink/25 px-5 py-6 text-[14.5px] leading-relaxed text-ink-2">{children}</p>;
}

export function CaseLink({ applicationId, reference }: { applicationId: number | null; reference: string | null }) {
  if (!applicationId || !reference) return <span className="font-mono text-ink-2">—</span>;
  return (
    <Link href={`/console/cases/${applicationId}`} dir="ltr" className="font-mono whitespace-nowrap text-ink underline-offset-[0.2em] hover:underline">
      {reference}
    </Link>
  );
}

/** A plain paper table for the cross-case logs. */
export function LogTable({ head, children, className }: { head: string[]; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-x-auto rounded-[6px] border border-rule bg-paper", className)}>
      <table className="w-full min-w-[860px] text-[14px]">
        <thead>
          <tr className="border-b border-rule text-[12.5px] text-ink-2">
            {head.map((h) => (
              <th key={h} scope="col" className="px-4 py-2.5 text-start font-normal whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-rule align-top">{children}</tbody>
      </table>
    </div>
  );
}
