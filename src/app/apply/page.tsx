import { ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { HallBar } from "@/components/hall/hall-bar";
import { Ticket } from "@/components/hall/ticket";
import { getDictionary } from "@/lib/i18n";
import { getSession } from "@/lib/session";

export default async function ApplyStart() {
  const { t, locale } = await getDictionary();
  const session = await getSession();

  return (
    <>
      <HallBar t={t} locale={locale} returnTo="/apply" />
      <main className="mx-auto grid w-full max-w-[1240px] flex-1 grid-cols-1 items-start gap-12 px-6 py-14 lg:grid-cols-12 lg:py-20">
        <section className="lg:col-span-6 lg:pt-6">
          <h1 className="max-w-[16ch] text-[44px] leading-[1.05] font-semibold tracking-[-0.02em] text-ink lg:text-[56px]">
            {t.signInTitle}
          </h1>
          <p className="mt-6 max-w-[52ch] text-[18px] leading-relaxed text-ink-2">{t.signInBody}</p>

          <div className="mt-10 max-w-[460px]">
            {session ? (
              <Link
                href="/apply/new"
                className="group flex h-14 items-center justify-between gap-3 rounded-[8px] bg-ink px-5 text-[16px] font-medium text-paper transition-colors hover:bg-board"
              >
                {t.formTitle}
                <ArrowRight className="size-5 transition-transform group-hover:translate-x-0.5 rtl:rotate-180" aria-hidden />
              </Link>
            ) : (
              <Link
                href="/apply/uaepass"
                className="group flex h-14 items-center justify-between gap-3 rounded-[8px] bg-ink px-5 text-[16px] font-medium text-paper transition-colors hover:bg-board"
              >
                <span className="flex items-center gap-3">
                  <ShieldCheck className="size-5 text-led-amber" aria-hidden />
                  {t.signInAction}
                  <span className="rounded-[4px] border border-paper/30 px-1.5 py-0.5 text-[11px] font-normal tracking-[0.04em] text-paper/80">
                    {t.mockTag}
                  </span>
                </span>
                <ArrowRight className="size-5 transition-transform group-hover:translate-x-0.5 rtl:rotate-180" aria-hidden />
              </Link>
            )}
            <p className="mt-3 text-[13px] leading-snug text-ink-2">{t.signInNote}</p>
          </div>

          <p className="mt-14 max-w-[52ch] border-t border-rule pt-5 text-[14px] text-ink-2">{t.statusNoLogin}</p>
        </section>

        {/* The dispenser: a board-black machine with the next blank ticket in its slot. */}
        <section aria-hidden className="relative flex justify-center lg:col-span-6">
          <div className="w-full max-w-[420px]">
            <div className="rounded-t-[14px] bg-board px-6 pt-6 pb-5 shadow-[0_30px_50px_-30px_rgb(0_0_0/0.7)]">
              <div className="flex items-center justify-between">
                <span className="font-led text-[15px] font-black tracking-[0.12em] text-led-amber led-glow">RA</span>
                <span className="text-[13px] text-led-text/70">{t.dispenserPrompt}</span>
              </div>
              <div className="mt-4 h-3 rounded-full bg-[#050607] shadow-[inset_0_2px_3px_rgb(0_0_0/0.9)]" />
            </div>
            <div className="-mt-1 flex justify-center px-6">
              <Ticket
                hall={t.hall}
                numberLabel={t.ticketNumber}
                pendingLabel={t.ticketPending}
                reference={null}
                feed
                lines={[
                  { label: t.ticketService, value: t.ticketServiceValue, keepCase: true },
                  { label: t.ticketName, value: "" },
                  { label: t.ticketPassport, value: "" },
                  { label: t.ticketLanguage, value: "" },
                ]}
                className="rounded-b-[2px]"
              />
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
