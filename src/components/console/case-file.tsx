import { RefCells } from "@/components/hall/ref-cells";
import {
  EVENT_LABEL,
  HANDOFF_LABEL,
  LANGUAGE,
  RULE_LABEL,
  STATUS_LABEL,
  uaeClock,
  uaeDay,
  uaeTime,
} from "@/lib/console/format";
import type { CaseFile as CaseData, Ramp } from "@/lib/console/queries";
import { cn } from "@/lib/utils";
import { CallBoard } from "./call-board";
import { CorrectionSlip } from "./correction-slip";

const chip: Record<"A" | "B" | "C", string> = {
  A: "bg-fix-bg text-fix",
  B: "bg-route-bg text-route",
  C: "bg-officer-bg text-officer",
};
const statusChip: Record<Ramp, string> = {
  pass: "bg-secondary text-ok",
  fix: "bg-fix-bg text-fix",
  route: "bg-route-bg text-route",
  officer: "bg-officer-bg text-officer",
};

function historyLabel(event: string): string {
  if (event.startsWith("refused_")) return `Refused: ${event.slice("refused_".length)}`;
  if (event.startsWith("handoff_")) return `${HANDOFF_LABEL[event.slice("handoff_".length)] ?? "Handoff"} created`;
  return EVENT_LABEL[event] ?? event.replace(/_/g, " ");
}

function resolution(code: string, type: "A" | "B" | "C"): string {
  if (type === "C") return "Officer only — the assistant never calls";
  if (type === "B") return "Explain and route to whoever must act";
  if (code === "R4" || code === "R5") return "New upload, link sent by SMS";
  if (code === "R6" || code === "R7") return "Book an Amer visit on the call";
  return "Fix on the call, then your approval";
}

function Section({ title, aside, children }: { title: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section aria-label={title} className="border-t border-rule pt-5">
      <div className="mb-3.5 flex items-baseline justify-between gap-4">
        <h2 className="text-[19px] font-semibold">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

function Fact({ label, value, mono = true }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div>
      <dt className="text-[12.5px] text-ink-2">{label}</dt>
      <dd className={cn("mt-0.5 text-[14px]", mono && "font-mono")}>{value}</dd>
    </div>
  );
}

/** The open case file on the officer's desk. Same sections in the same order for every case. */
export function CaseFile({ data }: { data: CaseData }) {
  const failed = data.rules.filter((r) => !r.passed);
  const passed = data.rules.length - failed.length;
  const pending = data.corrections.filter((c) => c.status === "pending_review").length;

  return (
    <article aria-label={`Case ${data.reference}`} className="space-y-6">
      {/* Header: who, what was filed, where it stands. */}
      <header className="flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0">
          <RefCells value={data.reference} size="md" />
          <h1 className="mt-3 text-[28px] leading-tight font-semibold tracking-[-0.015em]">{data.fullName}</h1>
          <p className="mt-1.5 flex flex-wrap items-center gap-3 text-[13.5px] text-ink-2">
            <span className={cn("rounded-[4px] px-2 py-1 text-[12.5px] font-medium", statusChip[data.ramp])}>{STATUS_LABEL[data.status] ?? data.status}</span>
            <span>Submitted {uaeTime(data.createdAt)}</span>
          </p>
        </div>
        {data.photoUrl && (
          // A short-lived signed URL from private storage; next/image would cache it past its expiry.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.photoUrl} alt={`Photo submitted with ${data.reference}`} className="h-[100px] w-[80px] rounded-[4px] border border-rule object-cover" />
        )}
      </header>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-[6px] border border-rule bg-paper px-5 py-3.5 sm:grid-cols-4">
        <Fact label="Date of birth (form)" value={uaeDay(data.dateOfBirth)} />
        <Fact label="Passport number" value={<span dir="ltr">{data.passportNumber}</span>} />
        <Fact label="Passport expiry" value={uaeDay(data.passportExpiry)} />
        <Fact label="Profession code" value={data.professionCode ?? "—"} />
        <Fact label="Mobile" value={<span dir="ltr">{data.phone}</span>} />
        <Fact label="Call language" value={LANGUAGE[data.language]} mono={false} />
        <Fact
          label="AI-call consent"
          mono={false}
          value={data.consent ? <span>Opted in {data.consentAt && <span className="font-mono text-[12.5px]">{uaeTime(data.consentAt)}</span>}</span> : <span className="text-ink-2">Not given — SMS only</span>}
        />
        <Fact label="Appointment" mono={false} value={data.appointment ? `${data.appointment.centre}, ${uaeTime(data.appointment.startsAt)}` : "—"} />
      </dl>

      <Section title={failed.length ? "Why it was returned" : "Rules check"} aside={<span className="text-[12.5px] text-ink-2">{passed} of {data.rules.length} checks passed</span>}>
        {failed.length === 0 ? (
          <p className="text-[14px] text-ink-2">All {data.rules.length} checks pass on the latest run. Nothing left for the assistant or you to fix.</p>
        ) : (
          <ul className="space-y-2.5">
            {failed.map((r) => (
              <li key={r.code} className="grid grid-cols-[auto_1fr] gap-x-4 rounded-[6px] border border-rule bg-paper px-4 py-3.5">
                <span className={cn("h-fit rounded-[4px] px-2 py-1 font-mono text-[12px] font-medium", chip[r.type])}>{r.code}</span>
                <div className="min-w-0">
                  <p className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <span className="text-[14.5px] font-medium">{RULE_LABEL[r.code]}</span>
                    <span className={cn("text-[12.5px]", r.type === "A" ? "text-fix" : r.type === "B" ? "text-route" : "text-officer")}>{resolution(r.code, r.type)}</span>
                  </p>
                  {r.detail && <p className="mt-1 max-w-[70ch] text-[13.5px] leading-relaxed text-ink-2">{r.detail}</p>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section
        title="Your decision"
        aside={pending > 0 ? <span className="text-[12.5px] font-medium text-fix">{pending} waiting</span> : undefined}
      >
        {data.corrections.length === 0 ? (
          <p className="max-w-[70ch] text-[14px] leading-relaxed text-ink-2">
            No corrections captured yet. When the assistant confirms a corrected value on a call, it lands here as a slip; nothing changes on the application until you approve it.
          </p>
        ) : (
          <div className="space-y-3">
            {data.corrections.map((c) => (
              <CorrectionSlip key={c.id} slip={c} hasRecord={data.recordedConversations.includes(c.conversationId)} />
            ))}
          </div>
        )}
      </Section>

      <Section title="Call">
        <CallBoard applicationId={data.id} phone={data.predial.phone} browser={data.predial.browser} calls={data.calls} />
      </Section>

      <section aria-labelledby="case-history" className="border-t border-rule pt-6">
        <div className="ticket-edge bg-paper px-6 pt-6 pb-6 font-mono text-[12.5px] leading-snug shadow-[0_18px_30px_-18px_rgb(22_24_26/0.45),0_2px_6px_-2px_rgb(22_24_26/0.18)]">
          <h2 id="case-history" className="flex justify-between border-b border-dashed border-ink/30 pb-3 text-[12.5px] font-semibold uppercase">
            <span>Case history</span>
            <span dir="ltr">{data.reference}</span>
          </h2>
          <ol className="mt-3 space-y-1.5">
            {data.history.map((e, i) => (
              <li key={i} className="grid grid-cols-[5.5rem_4.5rem_1fr] gap-x-3">
                <span className="text-ink-2">{uaeClock(e.at)}</span>
                <span className="text-ink-2 uppercase">{e.actor}</span>
                <span>
                  {historyLabel(e.event)}
                  {e.detail && <span dir="auto" className="block break-words text-ink-2">{e.detail}</span>}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </article>
  );
}
