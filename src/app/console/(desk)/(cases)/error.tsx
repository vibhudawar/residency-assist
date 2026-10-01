"use client";

import { ErrorNotice } from "@/components/hall/error-notice";

/** One case file failed; the queue beside it still works. */
export default function CaseError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div className="pt-4">
      <ErrorNotice
        size="panel"
        title="This case didn't load"
        body="The queue still works. Try again, or open another case from the queue."
        retry={retry}
        retryLabel="Try again"
        retryingLabel="Trying again…"
        digest={error.digest}
        refLabel="Error reference"
      />
    </div>
  );
}
