import { Desk } from "@/components/console/desk";
import { requireOfficer } from "@/lib/officer";

export default async function ConsolePage() {
  await requireOfficer();
  return <Desk caseId={null} />;
}
