import { CaseLink, EmptyLog, LogTable, PageHead } from "@/components/console/log";
import { HANDOFF_LABEL, uaeTime } from "@/lib/console/format";
import { getHandoffs } from "@/lib/console/queries";
import { requireOfficer } from "@/lib/officer";
import { cn } from "@/lib/utils";

export default async function HandoffsPage() {
  await requireOfficer();
  const rows = await getHandoffs();
  return (
    <>
      <PageHead
        title="Handoffs"
        lead="Everything handed to a person: callbacks the caller asked for, escalations (dispute, distress, asked for a human, officer-only issue) and follow-ups the assistant can't do itself."
      />
      {rows.length === 0 ? (
        <EmptyLog>No handoffs yet. They appear when the assistant schedules a callback, escalates a call, or routes an issue, and when you reject a correction.</EmptyLog>
      ) : (
        <LogTable head={["When", "Case", "Kind", "Reason", "Preferred time", "Status"]}>
          {rows.map((h) => (
            <tr key={h.id}>
              <td className="px-4 py-3 font-mono text-[13px] whitespace-nowrap text-ink-2">{uaeTime(h.createdAt)}</td>
              <td className="px-4 py-3"><CaseLink applicationId={h.applicationId} reference={h.reference} /></td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span className={cn("rounded-[4px] px-2 py-1 text-[12.5px] font-medium", h.kind === "escalation" ? "bg-officer-bg text-officer" : "bg-route-bg text-route")}>
                  {HANDOFF_LABEL[h.kind] ?? h.kind}
                </span>
              </td>
              <td className="max-w-[60ch] px-4 py-3 leading-snug">{h.reason}</td>
              <td className="px-4 py-3 text-ink-2">{h.preferredTime ?? "—"}</td>
              <td className="px-4 py-3 text-ink-2 capitalize">{h.status}</td>
            </tr>
          ))}
        </LogTable>
      )}
    </>
  );
}
