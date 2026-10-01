import { notFound } from "next/navigation";
import { CaseFile } from "@/components/console/case-file";
import { getCase } from "@/lib/console/queries";
import { requireOfficer } from "@/lib/officer";

export default async function CasePage({ params }: PageProps<"/console/cases/[id]">) {
  await requireOfficer();
  const { id } = await params;
  if (!/^\d{1,12}$/.test(id)) notFound();
  const file = await getCase(Number(id));
  if (!file) notFound();
  return <CaseFile data={file} />;
}
