import { setLanguage } from "@/app/apply/actions";
import type { Dictionary, Locale } from "@/lib/i18n";
import { BarFrame } from "./bar-frame";

const SWITCH = "rounded-[6px] border border-board-rule px-3 py-1.5 text-[13px] text-paper transition-colors hover:border-led-amber hover:text-led-amber";

/**
 * Top of every applicant screen: the prototype disclaimer, product mark and language switch.
 * Without `returnTo` (a loading screen, which doesn't know its own address yet) the switch holds its
 * place but isn't a control.
 */
export function HallBar({
  t,
  locale,
  returnTo,
  right,
}: {
  t: Dictionary;
  locale: Locale;
  returnTo?: string;
  right?: React.ReactNode;
}) {
  const other = locale === "ar" ? "en" : "ar";
  return (
    <BarFrame
      variant="portal"
      banner={t.banner}
      product={t.product}
      subtitle={t.hall}
      right={
        <div className="flex items-center gap-2">
          {right}
          {returnTo ? (
            <form action={setLanguage}>
              <input type="hidden" name="locale" value={other} />
              <input type="hidden" name="returnTo" value={returnTo} />
              <button type="submit" lang={other} className={SWITCH}>
                {t.switchLanguage}
              </button>
            </form>
          ) : (
            <span aria-hidden lang={other} className={`${SWITCH} opacity-60`}>
              {t.switchLanguage}
            </span>
          )}
        </div>
      }
    />
  );
}
