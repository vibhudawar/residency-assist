import { HallBar } from "@/components/hall/hall-bar";
import { Panel } from "@/components/hall/led-board";
import { RefCells } from "@/components/hall/ref-cells";
import { Ink, Unlit, UnlitLamp, Waiting } from "@/components/hall/waiting";
import { getDictionary } from "@/lib/i18n";
import { SCREEN_WORDS } from "@/lib/screen-words";

/**
 * The status page before its data arrives (right after submitting, or opening a saved link), in the
 * applicant's own language. The board is dark and the ticket's pre-printed labels are there; only
 * the application's own details aren't printed yet. Same grid and sizes as StatusView.
 */
export default async function Loading() {
  const { t, locale } = await getDictionary();
  const ticketLabels = [t.ticketService, t.ticketIssued, t.ticketName, t.ticketDob, t.ticketPassport, t.ticketExpiry, t.ticketLanguage, t.ticketConsent];
  const rules = Object.entries(t.rules);

  return (
    <>
      <HallBar t={t} locale={locale} />
      <Waiting label={SCREEN_WORDS[locale].loadingStatus} className="flex flex-1 flex-col">
        <main className="mx-auto grid w-full max-w-[1240px] flex-1 grid-cols-1 gap-12 px-6 py-12 lg:grid-cols-12">
          <section className="lg:col-span-7">
            <Panel title={t.boardNowServing}>
              <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 px-4 pt-4 pb-3">
                <div>
                  <p className="text-[12px] text-led-text/70">{t.ticketNumber}</p>
                  <RefCells value={null} tone="board" size="md" className="mt-1.5" />
                </div>
                <Unlit className="h-[26px] w-44" />
              </div>
              <div className="grid grid-cols-3 gap-px border-t border-board-rule bg-board-rule">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-2 bg-board px-3 py-2.5 text-[12.5px] leading-tight">
                    <UnlitLamp />
                    <span className="flex h-[1lh] items-center">
                      <Unlit className="h-2.5 w-20" />
                    </span>
                  </div>
                ))}
              </div>
            </Panel>

            <div className="mt-10 max-w-[24ch] space-y-3">
              <Ink className="h-8 w-full lg:h-9" />
              <Ink className="h-8 w-3/5 lg:h-9" />
            </div>

            <div className="mt-8 space-y-3">
              {[0, 1].map((i) => (
                <div key={i} className="grid grid-cols-[auto_1fr] items-start gap-4 rounded-lg border border-rule bg-paper p-4">
                  <Ink className="h-[27px] w-10 rounded-[4px]" />
                  <div className="space-y-2.5 pt-1">
                    <Ink className="w-[min(28rem,90%)]" />
                    <Ink className="h-2.5 w-52" />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 flex items-center justify-between gap-4 border-t border-rule pt-6">
              <Ink className="w-48" />
              <Ink className="h-9 w-36 rounded-[6px]" />
            </div>
          </section>

          <aside className="lg:col-span-5">
            <div className="flex flex-col items-center gap-6 lg:sticky lg:top-8">
              <div className="ticket-edge w-full max-w-[360px] bg-paper px-6 pt-7 pb-6 font-mono text-[12.5px] leading-snug text-ink shadow-[0_18px_30px_-18px_rgb(22_24_26/0.45),0_2px_6px_-2px_rgb(22_24_26/0.18)]">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold uppercase rtl:normal-case">{t.hall}</span>
                  <span className="flex gap-1">
                    <span className="size-1.5 rounded-full bg-ink" />
                    <span className="size-1.5 rounded-full bg-ink/60" />
                    <span className="size-1.5 rounded-full bg-ink/30" />
                  </span>
                </div>
                <div className="mt-4 border-t border-dashed border-ink/30 pt-4">
                  <p className="text-ink-2 uppercase rtl:normal-case">{t.ticketNumber}</p>
                  <div className="mt-2">
                    <RefCells value={null} />
                  </div>
                </div>
                <dl className="mt-5 space-y-1.5 border-t border-dashed border-ink/30 pt-4">
                  {ticketLabels.map((label, i) => (
                    <div key={label} className="grid grid-cols-[7.5rem_1fr] items-center gap-2">
                      <dt className="text-ink-2 uppercase rtl:normal-case">{label}</dt>
                      <dd className="flex min-h-[1.2em] items-center">
                        <Ink className={i % 2 ? "h-2.5 w-24" : "h-2.5 w-32"} />
                      </dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-5 flex flex-col items-center gap-1.5">
                  <Ink className="h-7 w-full max-w-[240px]" />
                  <Ink className="h-2 w-24" />
                </div>
              </div>

              <Panel title={t.checksTitle} className="w-full max-w-[360px]">
                <ol className="divide-y divide-board-rule text-[13px]">
                  {rules.map(([code, label]) => (
                    <li key={code} className="grid grid-cols-[auto_1fr_auto] items-start gap-x-3 px-4 py-2">
                      <UnlitLamp className="mt-[0.45em]" />
                      <span className="flex min-w-0 items-baseline gap-2">
                        <span dir="ltr" className="font-mono text-[12px] text-led-text/60">{code}</span>
                        <span className="truncate text-led-text/70">{label}</span>
                      </span>
                      <span className="w-10 text-end font-led text-[15px] font-black text-led-text/40 rtl:font-sans rtl:text-[14px] rtl:font-semibold">–</span>
                    </li>
                  ))}
                </ol>
              </Panel>
            </div>
          </aside>
        </main>
      </Waiting>
    </>
  );
}
