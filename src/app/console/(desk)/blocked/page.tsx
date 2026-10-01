import { CaseLink, EmptyLog, LOGS, LogTable, PageHead } from "@/components/console/log";
import { uaeTime } from "@/lib/console/format";
import { getBlockedActions } from "@/lib/console/queries";
import { requireOfficer } from "@/lib/officer";

export default async function BlockedPage() {
  await requireOfficer();
  const rows = await getBlockedActions();
  return (
    <>
      <PageHead title={LOGS.blocked.title} lead={LOGS.blocked.lead} />
      {rows.length === 0 ? (
        <EmptyLog>Nothing has been refused yet. Try calling a case without consent from the Cases tab: the refusal is logged here.</EmptyLog>
      ) : (
        <LogTable head={LOGS.blocked.head}>
          {rows.map((b) => (
            <tr key={b.key}>
              <td className="px-4 py-3 font-mono text-[13px] whitespace-nowrap text-ink-2">{uaeTime(b.at)}</td>
              <td className="px-4 py-3"><CaseLink applicationId={b.applicationId} reference={b.reference} /></td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span className="rounded-[4px] bg-secondary px-2 py-1 text-[12.5px] font-medium text-ink">
                  {b.source === "tool" ? "Backend" : "Pre-dial check"}
                </span>
              </td>
              <td className="px-4 py-3 font-mono text-[13px] whitespace-nowrap">{b.what}</td>
              <td className="max-w-[64ch] px-4 py-3 leading-snug">{b.reason}</td>
            </tr>
          ))}
        </LogTable>
      )}
    </>
  );
}
