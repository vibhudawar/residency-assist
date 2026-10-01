import { setLanguage } from "@/app/apply/actions";
import type { Dictionary, Locale } from "@/lib/i18n";

/** Top of every screen: the prototype disclaimer, product mark and language switch. */
export function HallBar({
  t,
  locale,
  returnTo,
  right,
}: {
  t: Dictionary;
  locale: Locale;
  returnTo: string;
  right?: React.ReactNode;
}) {
  return (
    <header className="bg-board text-led-text">
      <div className="border-b border-board-rule bg-led-amber px-4 py-1.5 text-center text-[12.5px] font-medium text-board">
        {t.banner}
      </div>
      <div className="mx-auto flex max-w-[1240px] items-center justify-between gap-4 px-6 py-3.5">
        <div className="flex items-center gap-3">
          <span aria-hidden className="grid size-8 place-items-center rounded-[6px] bg-board-2 font-led text-[18px] font-black text-led-amber led-glow">
            R
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-[15px] font-semibold text-paper">{t.product}</span>
            <span className="text-[12px] text-led-text/70 max-sm:hidden">{t.hall}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          {right}
          <form action={setLanguage}>
            <input type="hidden" name="locale" value={locale === "ar" ? "en" : "ar"} />
            <input type="hidden" name="returnTo" value={returnTo} />
            <button
              type="submit"
              lang={locale === "ar" ? "en" : "ar"}
              className="rounded-[6px] border border-board-rule px-3 py-1.5 text-[13px] text-paper transition-colors hover:border-led-amber hover:text-led-amber"
            >
              {t.switchLanguage}
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
