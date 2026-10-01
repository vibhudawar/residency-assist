import { notFound } from "next/navigation";
import { getCase, getQueue } from "@/lib/console/queries";
import { CaseFile } from "./case-file";
import { QueueBoard } from "./queue-board";

/** The counter desk: queue board on the left, the open case file on the right. */
export async function Desk({ caseId }: { caseId: number | null }) {
  const queue = await getQueue();
  const selectedId = caseId ?? queue.rows[0]?.id ?? null;
  const file = selectedId ? await getCase(selectedId) : null;
  if (caseId && !file) notFound();

  return (
    <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
      <div className="lg:col-span-4">
        <div className="lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto lg:rounded-[10px]">
          <QueueBoard
            rows={queue.rows}
            selectedId={selectedId}
            awaitingDecision={queue.awaitingDecision}
            openHandoffs={queue.openHandoffs}
            blockedToday={queue.blockedToday}
          />
        </div>
      </div>
      <div className="min-w-0 lg:col-span-8">
        {file ? (
          <CaseFile data={file} />
        ) : (
          <div className="max-w-[60ch] pt-4">
            <h1 className="text-[28px] font-semibold tracking-[-0.015em]">The desk is clear</h1>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-2">
              Cases appear in the queue as soon as an application is checked. Use Reset demo in the bar above to load the seven demo cases.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
