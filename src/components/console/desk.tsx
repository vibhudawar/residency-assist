import { getQueue } from "@/lib/console/queries";
import { QueueBoard } from "./queue-board";

/**
 * The counter desk: the queue board on the left, the open case file on the right. The queue lives in
 * the layout, so it stays on the desk (and keeps its scroll) while another case file is fetched.
 */
export async function Desk({ children }: { children: React.ReactNode }) {
  const queue = await getQueue();
  return (
    <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
      <div className="lg:col-span-4">
        <div className="lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto lg:rounded-[10px]">
          <QueueBoard rows={queue.rows} awaitingDecision={queue.awaitingDecision} openHandoffs={queue.openHandoffs} blockedToday={queue.blockedToday} />
        </div>
      </div>
      <div className="min-w-0 lg:col-span-8">{children}</div>
    </div>
  );
}

/** No cases at all: say what fills the desk. */
export function DeskClear() {
  return (
    <div className="max-w-[60ch] pt-4">
      <h1 className="text-[28px] font-semibold tracking-[-0.015em]">The desk is clear</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-ink-2">
        Cases appear in the queue as soon as an application is checked. Use Reset demo in the bar above to load the seven demo cases.
      </p>
    </div>
  );
}
