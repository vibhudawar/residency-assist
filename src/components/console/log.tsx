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
export function LogTable({ head, children, className }: { head: readonly string[]; children: React.ReactNode; className?: string }) {
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

/** Each log page's fixed words: its page and its loading screen print the same title, lead and columns. */
export const LOGS = {
  records: { title: "Call records", lead: "One record per call, sent by ElevenLabs after the call ends: the full transcript, its summary and post-call checks, and response latency." },
  handoffs: { title: "Handoffs", lead: "Everything handed to a person: callbacks the caller asked for, escalations (dispute, distress, asked for a human, officer-only issue) and follow-ups the assistant can't do itself.", head: ["When", "Case", "Kind", "Reason", "Preferred time", "Status"] },
  sms: { title: "SMS outbox", lead: "Texts are simulated in this prototype: each one is written here instead of being sent. They go out in the applicant's call language.", head: ["When", "Case", "To", "Message"] },
  blocked: { title: "Blocked actions", lead: "Every action the system refused, and why: calls stopped by the pre-dial checks, and tool calls the backend turned down even when the agent asked (unverified caller, unflagged field, value that doesn't match the passport record).", head: ["When", "Case", "Stopped by", "What was tried", "Why it was refused"] },
  evidence: { title: "Evidence", lead: "Response latency per language from recorded calls, the agent test suite, and the guardrails the backend enforces." },
} as const;
