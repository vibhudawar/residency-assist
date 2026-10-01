import { notFound } from "next/navigation";
import { HallBar } from "@/components/hall/hall-bar";
import { getApplicantStatus } from "@/lib/applications/status";
import { getDictionary } from "@/lib/i18n";
import { StatusView } from "./status-view";

export default async function ApplicationStatus({ params, searchParams }: PageProps<"/apply/status/[token]">) {
  const { token } = await params;
  const { checked } = await searchParams;
  const view = await getApplicantStatus(token);
  if (!view) notFound();
  const { t, locale } = await getDictionary();

  return (
    <>
      <HallBar t={t} locale={locale} returnTo={`/apply/status/${token}`} />
      <StatusView t={t} locale={locale} token={token} initial={view} justChecked={checked === "1"} />
    </>
  );
}
