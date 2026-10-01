import { CaseLink, EmptyLog, LogTable, PageHead } from "@/components/console/log";
import { uaeTime } from "@/lib/console/format";
import { getSmsOutbox } from "@/lib/console/queries";
import { requireOfficer } from "@/lib/officer";

export default async function SmsPage() {
  await requireOfficer();
  const rows = await getSmsOutbox();
  return (
    <>
      <PageHead
        title="SMS outbox"
        lead="Texts are simulated in this prototype: each one is written here instead of being sent. They go out in the applicant's call language."
      />
      {rows.length === 0 ? (
        <EmptyLog>No texts yet. Applicants who didn&apos;t opt in to AI calls, officer-only cases, upload links and your decisions each produce one.</EmptyLog>
      ) : (
        <LogTable head={["When", "Case", "To", "Message"]}>
          {rows.map((s) => (
            <tr key={s.id}>
              <td className="px-4 py-3 font-mono text-[13px] whitespace-nowrap text-ink-2">{uaeTime(s.createdAt)}</td>
              <td className="px-4 py-3"><CaseLink applicationId={s.applicationId} reference={s.reference} /></td>
              <td dir="ltr" className="px-4 py-3 font-mono text-[13px] whitespace-nowrap text-ink-2">{s.toPhone}</td>
              <td dir="auto" className="max-w-[72ch] px-4 py-3 leading-snug break-words">{s.body}</td>
            </tr>
          ))}
        </LogTable>
      )}
    </>
  );
}
