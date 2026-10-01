import { Check } from "lucide-react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { HallBar } from "@/components/hall/hall-bar";
import { RefCells } from "@/components/hall/ref-cells";
import { dictionaries, dirOf, LOCALE_COOKIE, type Locale } from "@/lib/i18n";
import { UAE_TZ } from "@/lib/time";
import { getUploadView, type UploadState } from "@/lib/uploads";
import { sendUpload } from "./actions";
import { UploadFlow } from "./upload-flow";

// The token is the key: keep it out of Referer headers.
export const metadata: Metadata = { title: "Upload — Residency Assist (prototype)", referrer: "no-referrer" };

const CLOSED: Partial<Record<UploadState, { title: "approvedTitle" | "rejectedTitle" | "expiredTitle" | "replacedTitle" | "lockedTitle"; body: "approvedBody" | "rejectedBody" | "expiredBody" | "replacedBody" | "lockedBody" }>> = {
  approved: { title: "approvedTitle", body: "approvedBody" },
  rejected: { title: "rejectedTitle", body: "rejectedBody" },
  expired: { title: "expiredTitle", body: "expiredBody" },
  replaced: { title: "replacedTitle", body: "replacedBody" },
  locked: { title: "lockedTitle", body: "lockedBody" },
};

/** A closed link: the h1 already names the state, so this says what it means and what to do. */
function Notice({ body, done = false }: { body: string; done?: boolean }) {
  return (
    <section aria-live="polite" className="mt-6 flex items-start gap-3 rounded-[6px] border border-rule bg-paper px-5 py-4">
      {done && (
        <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-ok text-paper">
          <Check aria-hidden className="size-4" />
        </span>
      )}
      <p className="max-w-[52ch] text-[15px] leading-relaxed text-ink-2">{body}</p>
    </section>
  );
}

export default async function UploadPage({ params }: PageProps<"/u/[token]">) {
  const { token } = await params;
  const view = await getUploadView(token);

  // The applicant's chosen language wins; otherwise open in the language they chose for the call.
  const cookie = (await cookies()).get(LOCALE_COOKIE)?.value;
  const locale: Locale = cookie === "ar" || cookie === "en" ? cookie : view?.language === "ar" ? "ar" : "en";
  const t = dictionaries[locale];
  const u = t.upload;

  // Latin digits on both screens, matching the reference number.
  const until = view
    ? new Intl.DateTimeFormat(locale === "ar" ? "ar-AE-u-nu-latn" : "en-GB", { timeZone: UAE_TZ, hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" }).format(new Date(view.expiresAt))
    : null;
  const closed = view ? CLOSED[view.state] : undefined;
  // The reason names exactly what the current file failed, worded the same way in both languages.
  const reason = !view
    ? ""
    : view.originalFailures === "missing" || view.originalFailures.length === 0
      ? u.reasons.missing
      : view.originalFailures.map((k) => u.reasons[k]).join(" ");
  // The headline always names where this link stands, not the task once it is done.
  const title = !view
    ? u.notFoundTitle
    : closed
      ? u[closed.title]
      : view.state === "pending_review"
        ? view.kind === "photo" ? u.passedPhoto : u.passedScan
        : view.kind === "photo" ? u.titlePhoto : u.titleScan;

  return (
    <div dir={dirOf(locale)} lang={locale} className="flex min-h-full flex-1 flex-col">
      <HallBar t={t} locale={locale} returnTo={`/u/${token}`} />
      <main className="mx-auto w-full max-w-[560px] flex-1 px-5 pt-6 pb-16">
        <h1 className="text-[28px] leading-[1.12] font-semibold tracking-[-0.015em] sm:text-[36px]">{title}</h1>
        {!view ? (
          <Notice body={u.notFoundBody} />
        ) : (
          <>
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-[14px] text-ink-2">
              <RefCells value={view.reference} size="sm" />
              <span>{view.firstName}</span>
              {!closed && view.state !== "pending_review" && (
                <span>
                  {u.validUntil} {until}
                </span>
              )}
            </div>

            {closed ? (
              <Notice body={u[closed.body]} done={view.state === "approved"} />
            ) : (
              <UploadFlow t={t} view={view} reason={reason} action={sendUpload.bind(null, token)} />
            )}

            <p className="mt-8 max-w-[52ch] text-[12.5px] leading-relaxed text-ink-2">{u.privacy}</p>
          </>
        )}
      </main>
    </div>
  );
}
