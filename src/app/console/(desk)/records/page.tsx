import { CaseLink, EmptyLog, PageHead } from "@/components/console/log";
import { LANGUAGE, uaeClock, uaeTime } from "@/lib/console/format";
import { getCallRecords } from "@/lib/console/queries";
import { requireOfficer } from "@/lib/officer";
import { cn } from "@/lib/utils";

const secs = (s: number | null) => (s === null ? "—" : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`);
const ms = (v: number | null) => (v === null ? "—" : `${v} ms`);

export default async function RecordsPage() {
  await requireOfficer();
  const records = await getCallRecords();
  return (
    <>
      <PageHead
        title="Call records"
        lead="One record per call, sent by ElevenLabs after the call ends: the full transcript, its summary and post-call checks, and response latency."
      />
      {records.length === 0 ? (
        <EmptyLog>
          No calls recorded yet. Records arrive from the ElevenLabs post-call webhook once the agent is connected and a call ends.
        </EmptyLog>
      ) : (
        <div className="space-y-4">
          {records.map((r) => (
            <article key={r.conversationId} id={r.conversationId} className="scroll-mt-6 rounded-[6px] border border-rule bg-paper">
              <header className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-rule px-5 py-3.5 text-[13.5px]">
                <CaseLink applicationId={r.applicationId} reference={r.reference} />
                <span className="font-mono text-[13px] text-ink-2">{uaeTime(r.receivedAt)}</span>
                <span>{r.language ? LANGUAGE[r.language] ?? r.language : "—"}</span>
                <span className="text-ink-2">Length <span className="font-mono text-ink">{secs(r.durationSecs)}</span></span>
                <span className="text-ink-2">Latency avg <span className="font-mono text-ink">{ms(r.avgLatencyMs)}</span> · max <span className="font-mono text-ink">{ms(r.maxLatencyMs)}</span></span>
                <span
                  className={cn(
                    "ms-auto rounded-[4px] px-2 py-1 text-[12.5px] font-medium",
                    r.successful === "success" ? "bg-secondary text-ok" : r.successful === "failure" ? "bg-officer-bg text-officer" : "bg-secondary text-ink-2",
                  )}
                >
                  {r.successful === "success" ? "Goal met" : r.successful === "failure" ? "Goal not met" : "Not evaluated"}
                </span>
              </header>
              {r.summary && <p className="max-w-[80ch] px-5 pt-4 text-[14.5px] leading-relaxed">{r.summary}</p>}
              <details className="group px-5 py-4">
                <summary className="cursor-pointer text-[13.5px] font-medium text-ink-2 hover:text-ink">
                  Transcript · {r.transcript.length} turns
                </summary>
                <ol className="mt-3 space-y-2">
                  {r.transcript.map((t, i) => (
                    <li key={i} className="grid grid-cols-[4rem_5.5rem_1fr] gap-x-3 text-[14px] leading-snug">
                      <span className="font-mono text-[12.5px] text-ink-2">{t.timeInCallSecs === null ? "" : secs(Math.round(t.timeInCallSecs))}</span>
                      <span className={cn("text-[12.5px] font-medium", t.role === "agent" ? "text-ink" : "text-route")}>{t.role === "agent" ? "Assistant" : "Caller"}</span>
                      <span dir="auto">{t.message}</span>
                    </li>
                  ))}
                </ol>
              </details>
              <p className="border-t border-rule px-5 py-2.5 font-mono text-[12px] text-ink-2">
                conversation {r.conversationId} · received {uaeClock(r.receivedAt)}
              </p>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
