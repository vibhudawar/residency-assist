"use client";

import { PhoneCall } from "lucide-react";
import { useEffect, useState } from "react";
import { LedBoard, LiveLamp, StageBoard, type LedState } from "@/components/hall/led-board";
import { Ticket } from "@/components/hall/ticket";
import type { ApplicantStatusView, CheckState } from "@/lib/applications/status";
import type { Dictionary } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { withdrawConsent } from "../../actions";

const POLL_MS = 3000;
const LANG_LABEL = { en: "English", ar: "العربية", hi: "हिन्दी" } as const;

const ramp: Record<Exclude<CheckState, "pass">, { text: string; bg: string }> = {
  fix: { text: "text-fix", bg: "bg-fix-bg" },
  route: { text: "text-route", bg: "bg-route-bg" },
  officer: { text: "text-officer", bg: "bg-officer-bg" },
};

export function StatusView({
  t,
  locale,
  token,
  initial,
  justChecked,
}: {
  t: Dictionary;
  locale: "en" | "ar";
  token: string;
  initial: ApplicantStatusView;
  justChecked: boolean;
}) {
  const [view, setView] = useState(initial);
  // The print-and-check cascade plays once, on arrival from the form.
  const [cascade] = useState(justChecked);

  useEffect(() => {
    if (justChecked) window.history.replaceState(null, "", `/apply/status/${token}`);
  }, [justChecked, token]);

  useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        const res = await fetch(`/api/apply/status/${token}`, { cache: "no-store" });
        if (res.ok && alive) setView(await res.json());
      } catch {
        // Offline for a moment — keep showing the last known state.
      }
    };
    const id = window.setInterval(tick, POLL_MS);
    return () => { alive = false; window.clearInterval(id); };
  }, [token]);

  const stageIndex = view.path.indexOf(view.stage);
  const issues = view.checks.filter((c) => c.state !== "pass");
  const stateLabel = (s: CheckState) =>
    s === "pass" ? t.checkPassed : s === "fix" ? t.checkFailed : s === "route" ? t.checkRoute : t.checkOfficer;
  const issueLabel = (s: CheckState) => (s === "fix" ? t.issueFixable : s === "route" ? t.issueRoute : t.issueOfficer);
  const fieldLabel = (f: string) =>
    f === "full_name" ? t.fullName : f === "date_of_birth" ? t.dob : f === "photo" ? t.upload.statusPhoto : f === "scan" ? t.upload.statusScan : t.passportNumber;
  const isFile = (f: string) => f === "photo" || f === "scan";
  const issuedAt = new Intl.DateTimeFormat(locale === "ar" ? "ar-AE" : "en-GB", {
    timeZone: "Asia/Dubai", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  }).format(new Date(view.submittedAt));
  const correctionLabel = (s: string) => (s === "approved" ? t.correctionApproved : s === "rejected" ? t.correctionRejected : t.correctionPending);

  return (
    <main className="mx-auto grid w-full max-w-[1240px] flex-1 grid-cols-1 gap-12 px-6 py-12 lg:grid-cols-12">
      <section className="lg:col-span-7">
        {/* "Now serving": the hall board says where the application is. */}
        <StageBoard
          title={t.boardNowServing}
          aside={<LiveLamp label={t.live} />}
          numberLabel={t.ticketNumber}
          reference={view.reference}
          currentLabel={t.stages[view.stage]}
          stages={view.path.map((s, i) => ({
            key: s,
            label: t.stages[s],
            state: i < stageIndex || view.stage === "processing" ? "done" : i === stageIndex ? "current" : "upcoming",
          }))}
        />

        {/* The single next step, at the scale of a hall announcement. */}
        <h1 className="mt-10 max-w-[24ch] text-[34px] leading-[1.12] font-semibold tracking-[-0.015em] text-ink lg:text-[40px]">
          {view.next === "calling" && <PhoneCall className="me-3 inline size-8 -translate-y-1 text-fix" aria-hidden />}
          {t.next[view.next]}
        </h1>

        {issues.length > 0 && (
          <ul className="mt-8 space-y-3">
            {issues.map((c) => {
              const tone = ramp[c.state as Exclude<CheckState, "pass">];
              return (
                <li key={c.code} className="grid grid-cols-[auto_1fr] items-start gap-4 rounded-lg border border-rule bg-paper p-4">
                  <span dir="ltr" className={cn("rounded-[4px] px-2 py-1 font-mono text-[13px] font-semibold", tone.bg, tone.text)}>{c.code}</span>
                  <div>
                    <p className="text-[15.5px] leading-snug font-semibold text-ink">
                      {locale === "ar" || !c.detail ? t.ruleDetails[c.code as keyof Dictionary["ruleDetails"]] : c.detail}
                    </p>
                    <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]">
                      <span className={cn("font-medium", tone.text)}>{issueLabel(c.state)}</span>
                      <span className="text-ink-2">{t.checkLabel}: {t.rules[c.code as keyof Dictionary["rules"]]}</span>
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {(view.corrections.length > 0 || view.appointment) && (
          <dl className="mt-8 divide-y divide-rule border-y border-rule text-[14.5px]">
            {view.corrections.map((c, i) => (
              <div key={`${c.field}-${i}`} className="flex flex-wrap items-baseline justify-between gap-3 py-3.5">
                <dt className="text-ink-2">{isFile(c.field) ? fieldLabel(c.field) : `${t.correction} · ${fieldLabel(c.field)}`}</dt>
                <dd className="flex items-baseline gap-3">
                  <span className={cn("font-medium text-ink", !isFile(c.field) && "font-mono")}>{isFile(c.field) ? t.upload.statusReceived : c.newValue}</span>
                  <span className={cn("text-[12.5px] font-medium", c.status === "approved" ? "text-ok" : c.status === "rejected" ? "text-officer" : "text-fix")}>
                    {correctionLabel(c.status)}
                  </span>
                </dd>
              </div>
            ))}
            {view.appointment && (
              <div className="flex flex-wrap items-baseline justify-between gap-3 py-3.5">
                <dt className="text-ink-2">{t.appointment}</dt>
                <dd className="font-medium text-ink">{view.appointment.when} · {view.appointment.centre}</dd>
              </div>
            )}
          </dl>
        )}

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-rule pt-6">
          <p className="flex items-center gap-2 text-[14px] text-ink-2">
            <span aria-hidden className={cn("size-2 rounded-full", view.consent ? "bg-ok" : "bg-ink-2/50")} />
            {view.consent ? t.consentOn : t.consentOff}
          </p>
          {view.consent && (
            <form action={withdrawConsent}>
              <input type="hidden" name="token" value={token} />
              <button type="submit" className="rounded-[6px] border border-rule bg-paper px-3.5 py-2 text-[13.5px] text-ink transition-colors hover:border-officer hover:text-officer">
                {t.withdrawConsent}
              </button>
            </form>
          )}
        </div>
      </section>

      <aside className="lg:col-span-5">
        <div className="flex flex-col items-center gap-6 lg:sticky lg:top-8">
          <Ticket
            hall={t.hall}
            numberLabel={t.ticketNumber}
            pendingLabel={t.ticketPending}
            reference={view.reference}
            cascade={cascade}
            feed={cascade}
            lines={[
              { label: t.ticketService, value: t.ticketServiceValue, keepCase: true },
              { label: t.ticketIssued, value: issuedAt, keepCase: true },
              { label: t.ticketName, value: view.fullName },
              { label: t.ticketDob, value: view.dateOfBirth },
              { label: t.ticketPassport, value: view.passportMasked },
              { label: t.ticketExpiry, value: view.passportExpiry },
              { label: t.ticketLanguage, value: LANG_LABEL[view.language], keepCase: true },
              { label: t.ticketConsent, value: view.consent ? t.ticketConsentYes : t.ticketConsentNo, keepCase: true },
            ]}
          />
          <LedBoard
            className="w-full max-w-[360px]"
            title={t.checksTitle}
            dense
            cascade={cascade}
            checkingLabel={t.checking}
            rows={view.checks.map((c) => ({
              key: c.code,
              code: c.code,
              label: t.rules[c.code as keyof Dictionary["rules"]],
              state: c.state as LedState,
              stateLabel: stateLabel(c.state),
            }))}
          />
        </div>
      </aside>
    </main>
  );
}
