import { redirect } from "next/navigation";
import { HallBar } from "@/components/hall/hall-bar";
import { getDictionary } from "@/lib/i18n";
import { getSession, maskMobile } from "@/lib/session";
import { signOut } from "../actions";
import { ApplyForm } from "./apply-form";

export default async function NewApplication() {
  const session = await getSession();
  if (!session) redirect("/apply");
  const { t, locale } = await getDictionary();

  return (
    <>
      <HallBar
        t={t}
        locale={locale}
        returnTo="/apply/new"
        right={
          <form action={signOut}>
            <button type="submit" className="rounded-[6px] px-3 py-1.5 text-[13px] whitespace-nowrap text-led-text/80 transition-colors hover:text-paper">
              {t.signOut}
            </button>
          </form>
        }
      />
      <ApplyForm t={t} mobileMasked={maskMobile(session.mobile)} />
    </>
  );
}
