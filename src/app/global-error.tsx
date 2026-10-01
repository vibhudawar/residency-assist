"use client";

import { BarFrame } from "@/components/hall/bar-frame";
import { ErrorNotice } from "@/components/hall/error-notice";
import { HALL_WORDS } from "@/lib/hall-words";
import { SCREEN_WORDS } from "@/lib/screen-words";
import { fontVariables } from "./fonts";
import "./globals.css";

/**
 * The root layout itself failed, so this draws its own document. Its language isn't known here, so
 * the notice is in English with the Arabic beneath it.
 */
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const en = SCREEN_WORDS.en;
  const ar = SCREEN_WORDS.ar;
  return (
    <html lang="en" className={`${fontVariables} h-full`}>
      <body className="flex min-h-full flex-col">
        <title>Residency Assist — prototype</title>
        <BarFrame variant="portal" banner={HALL_WORDS.en.banner} product={HALL_WORDS.en.product} subtitle={HALL_WORDS.en.hall} />
        <main className="mx-auto w-full max-w-[1240px] flex-1 px-6 pt-12 pb-16">
          <ErrorNotice
            title={en.errorTitle}
            body={en.errorBody}
            retry={retry}
            // Its language isn't known here, so the one way forward is labelled in both.
            retryLabel={`${en.retry} · ${ar.retry}`}
            retryingLabel={`${en.retrying} · ${ar.retrying}`}
            digest={error.digest}
            refLabel={en.errorRef}
          />
          <div dir="rtl" lang="ar" className="mt-10 max-w-[60ch] border-t border-rule pt-6">
            <p className="text-[19px] font-semibold">{ar.errorTitle}</p>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{ar.errorBody}</p>
          </div>
        </main>
      </body>
    </html>
  );
}
