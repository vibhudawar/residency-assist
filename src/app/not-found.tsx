import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { HallBar } from "@/components/hall/hall-bar";
import { getDictionary } from "@/lib/i18n";
import { SCREEN_WORDS } from "@/lib/screen-words";

/** No such page, or a status link that isn't valid: say so, and the way back in. */
export default async function NotFound() {
  const { t, locale } = await getDictionary();
  const w = SCREEN_WORDS[locale];
  return (
    <>
      <HallBar t={t} locale={locale} />
      <main className="mx-auto w-full max-w-[1240px] flex-1 px-6 pt-12 pb-16">
        <section className="max-w-[60ch]">
          <h1 className="text-[28px] leading-[1.12] font-semibold tracking-[-0.015em] sm:text-[36px]">{w.notFoundTitle}</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-2">{w.notFoundBody}</p>
          <Link href="/apply" className={buttonVariants({ size: "lg", className: "mt-6" })}>
            {w.toPortal}
          </Link>
        </section>
      </main>
    </>
  );
}
