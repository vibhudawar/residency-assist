import { CaseFile } from "@/components/console/case-file";
import { DeskClear } from "@/components/console/desk";
import { getCase, getQueue } from "@/lib/console/queries";
import { requireOfficer } from "@/lib/officer";

/** /console opens the case at the top of the queue (the one waiting longest for a decision). */
export default async function ConsolePage() {
  await requireOfficer();
  const first = (await getQueue()).rows[0];
  const file = first ? await getCase(first.id) : null;
  return file ? <CaseFile data={file} /> : <DeskClear />;
}
