import { Desk } from "@/components/console/desk";
import { requireOfficer } from "@/lib/officer";

export default async function CasesLayout({ children }: { children: React.ReactNode }) {
  // Layouts and pages render in parallel, so this one checks the officer itself before reading cases.
  await requireOfficer();
  return <Desk>{children}</Desk>;
}
