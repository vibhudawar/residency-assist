import { Smartphone, UserRound } from "lucide-react";
import Link from "next/link";
import { HallBar } from "@/components/hall/hall-bar";
import { env } from "@/lib/env";
import { getDictionary } from "@/lib/i18n";
import { maskMobile } from "@/lib/session";
import { signInWithMockUaePass } from "../actions";

const DEMO_MOBILE = env().DEMO_PHONE_NUMBER ?? "+971500000000";

/** Stand-in for the UAE PASS consent screen. Deliberately not styled like the real UAE PASS. */
export default async function MockUaePass() {
  const { t, locale } = await getDictionary();
  return (
    <>
      <HallBar t={t} locale={locale} returnTo="/apply/uaepass" />
      <main className="grid flex-1 place-items-center px-6 py-16">
        <section className="w-full max-w-[440px] rounded-[12px] border border-rule bg-paper p-8 shadow-[0_24px_40px_-28px_rgb(22_24_26/0.5)]">
          <p className="flex items-center gap-2 text-[13px] font-medium text-ink-2">
            <span className="rounded-[4px] bg-ink px-1.5 py-0.5 text-[11px] text-paper">{t.mockTag}</span>
            {t.uaepassTitle}
          </p>
          <h1 className="mt-4 text-[22px] leading-snug font-semibold text-ink">{t.uaepassAsk}</h1>

          <dl className="mt-6 divide-y divide-rule border-y border-rule text-[15px]">
            <div className="flex items-center gap-3 py-3.5">
              <UserRound className="size-5 text-ink-2" aria-hidden />
              <dt className="text-ink-2">{t.uaepassAccount}</dt>
              <dd className="ms-auto font-medium">{t.demoAccount}</dd>
            </div>
            <div className="flex items-center gap-3 py-3.5">
              <Smartphone className="size-5 text-ink-2" aria-hidden />
              <dt className="text-ink-2">{t.uaepassMobile}</dt>
              <dd dir="ltr" className="ms-auto font-mono font-medium">{maskMobile(DEMO_MOBILE)}</dd>
            </div>
          </dl>

          <div className="mt-8 flex items-center justify-between gap-3">
            <Link href="/apply" className="rounded-[8px] px-4 py-3 text-[15px] text-ink-2 underline-offset-4 hover:text-ink hover:underline">
              {t.uaepassCancel}
            </Link>
            <form action={signInWithMockUaePass}>
              <button type="submit" className="h-12 rounded-[8px] bg-ink px-6 text-[15px] font-medium text-paper transition-colors hover:bg-board">
                {t.uaepassAllow}
              </button>
            </form>
          </div>
        </section>
      </main>
    </>
  );
}
