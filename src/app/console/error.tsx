"use client";

import { BarFrame } from "@/components/hall/bar-frame";
import { ErrorNotice } from "@/components/hall/error-notice";
import { HALL_WORDS } from "@/lib/hall-words";

/** The console's own frame failed (sign-in check or tab counts): the bar, and one way forward. */
export default function ConsoleError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div dir="ltr" lang="en" className="flex min-h-full flex-1 flex-col">
      <BarFrame variant="console" banner={HALL_WORDS.en.banner} product="Residency Assist" subtitle="Operator console" />
      <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 pt-10 pb-16 sm:px-6">
        <ErrorNotice
          title="The console didn't load"
          body="It couldn't reach the case system just now. Nothing on any case was changed by this. Try again in a moment."
          retry={retry}
          retryLabel="Try again"
          retryingLabel="Trying again…"
          digest={error.digest}
          refLabel="Error reference"
        />
      </main>
    </div>
  );
}
