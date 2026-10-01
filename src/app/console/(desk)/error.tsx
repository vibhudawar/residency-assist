"use client";

import { ErrorNotice } from "@/components/hall/error-notice";

/** One console section failed; the bar and tabs above still work. */
export default function DeskError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div className="pt-4">
      <ErrorNotice
        title="This page didn't load"
        body="It couldn't be read from the case system just now. Try again, or use the tabs above to open another section."
        retry={retry}
        retryLabel="Try again"
        retryingLabel="Trying again…"
        digest={error.digest}
        refLabel="Error reference"
      />
    </div>
  );
}
