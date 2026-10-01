"use client";

import { BarFrame } from "@/components/hall/bar-frame";
import { ErrorNotice } from "@/components/hall/error-notice";
import { HALL_WORDS } from "@/lib/hall-words";
import { SCREEN_WORDS } from "@/lib/screen-words";

/**
 * A portal screen failed: same hall bar, the applicant's language, one way forward. Both languages
 * are drawn and <html dir> (set from the applicant's choice) shows one, so it is right on first paint.
 */
export default function PortalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <>
      {(["en", "ar"] as const).map((locale) => {
        const w = SCREEN_WORDS[locale];
        const hall = HALL_WORDS[locale];
        return (
          <div
            key={locale}
            dir={locale === "ar" ? "rtl" : "ltr"}
            lang={locale}
            className={locale === "ar" ? "flex min-h-full flex-1 flex-col ltr:hidden" : "flex min-h-full flex-1 flex-col rtl:hidden"}
          >
            <BarFrame variant="portal" banner={hall.banner} product={hall.product} subtitle={hall.hall} />
            <main className="mx-auto w-full max-w-[1240px] flex-1 px-6 pt-12 pb-16">
              <ErrorNotice
                title={w.errorTitle}
                body={w.errorBody}
                retry={retry}
                retryLabel={w.retry}
                retryingLabel={w.retrying}
                exit={{ href: "/apply", label: w.toStart }}
                digest={error.digest}
                refLabel={w.errorRef}
              />
            </main>
          </div>
        );
      })}
    </>
  );
}
