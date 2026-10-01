import { notFound } from "next/navigation";
import { Desk } from "@/components/console/desk";
import { requireOfficer } from "@/lib/officer";

export default async function CasePage({ params }: PageProps<"/console/cases/[id]">) {
  await requireOfficer();
  const { id } = await params;
  if (!/^\d{1,12}$/.test(id)) notFound();
  return <Desk caseId={Number(id)} />;
}
