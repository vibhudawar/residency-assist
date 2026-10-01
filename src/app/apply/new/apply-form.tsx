"use client";

import { BadgeCheck, ImageUp, Loader2, Wand2 } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
import { LedBoard } from "@/components/hall/led-board";
import { Ticket } from "@/components/hall/ticket";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Dictionary } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { submitApplication, type FieldError, type SubmitState } from "../actions";

type Lang = "en" | "ar" | "hi";
type PhotoChoice = "" | "white" | "blue" | "upload";

const LANG_LABEL: Record<Lang, string> = { en: "English", ar: "العربية", hi: "हिन्दी" };

/** What "Rahul" typed — note the one-letter typo in his name (passport says SHARMA). */
const DEMO = {
  full_name: "Rahul Sarma",
  date_of_birth: "1991-04-12",
  passport_number: "Z4471820",
  passport_expiry: "2032-03-31",
  profession_code: "2149",
};

function Silhouette({ background, className }: { background: string; className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 450 580" className={className}>
      <rect width="450" height="580" fill={background} />
      <ellipse cx="225" cy="230" rx="95" ry="120" fill="#8a6a52" />
      <path d="M60 580 C 70 430, 380 430, 390 580 Z" fill="#2f3b4c" />
      <rect x="190" y="335" width="70" height="70" fill="#8a6a52" />
    </svg>
  );
}

function Section({ title, children, aside }: { title: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <fieldset className="border-t border-rule pt-7 pb-2">
      <div className="mb-5 flex items-baseline justify-between gap-4">
        <legend className="text-[19px] font-semibold text-ink">{title}</legend>
        {aside}
      </div>
      {children}
    </fieldset>
  );
}

function Field({
  id,
  label,
  hint,
  error,
  errorText,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: FieldError;
  errorText?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id} className="block text-[14px] leading-snug font-medium text-ink">
        {label}
        {hint && <span className="font-normal text-ink-2"> · {hint}</span>}
      </Label>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-[13px] font-medium text-officer">
          {errorText}
        </p>
      )}
    </div>
  );
}

const inputClass = "h-11 bg-paper px-3.5 text-[15px] md:text-[15px] border-input focus-visible:border-ink focus-visible:ring-ring/40";

export function ApplyForm({ t, mobileMasked }: { t: Dictionary; mobileMasked: string }) {
  const [state, formAction, pending] = useActionState<SubmitState, FormData>(submitApplication, {});
  const [values, setValues] = useState({ full_name: "", date_of_birth: "", passport_number: "", passport_expiry: "", profession_code: "" });
  const [lang, setLang] = useState<Lang>("en");
  const [photo, setPhoto] = useState<PhotoChoice>("");
  const [uploadUrl, setUploadUrl] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => { if (uploadUrl) URL.revokeObjectURL(uploadUrl); }, [uploadUrl]);

  const errorText = (e?: FieldError) =>
    e === "date" ? t.errorDate : e === "photo" ? t.errorPhoto : e === "photoType" ? t.errorPhotoType : t.errorRequired;
  const err = state.errors ?? {};
  const set = (key: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement>) => setValues((v) => ({ ...v, [key]: e.target.value }));

  const fillDemo = () => {
    setValues(DEMO);
    setLang("en");
    setPhoto("white");
    if (fileRef.current) fileRef.current.value = "";
  };

  const photoOptions: { id: PhotoChoice; label: string; bg?: string }[] = [
    { id: "white", label: t.photoSampleWhite, bg: "#fbfbfb" },
    { id: "blue", label: t.photoSampleBlue, bg: "#7fa7d9" },
  ];

  return (
    <main className="mx-auto grid w-full max-w-[1240px] flex-1 grid-cols-1 gap-12 px-6 py-12 lg:grid-cols-12">
      <form action={formAction} className="lg:col-span-7" noValidate>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="text-[36px] leading-tight font-semibold tracking-[-0.015em] text-ink">{t.formTitle}</h1>
            <p className="mt-2 text-[16px] text-ink-2">{t.formIntro}</p>
          </div>
          <div className="flex max-w-[260px] flex-col items-start gap-1.5">
            <button
              type="button"
              onClick={fillDemo}
              className="inline-flex h-9 items-center gap-2 rounded-[6px] border border-ink/25 bg-paper px-3 text-[13.5px] font-medium text-ink transition-colors hover:border-ink"
            >
              <Wand2 className="size-4" aria-hidden />
              {t.demoFill}
            </button>
            <p className="text-[12px] leading-snug text-ink-2">{t.demoFillNote}</p>
          </div>
        </div>

        <div className="mt-8 space-y-8">
          <Section title={t.sectionPassport}>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field id="full_name" label={t.fullName} error={err.full_name} errorText={errorText(err.full_name)}>
                  <Input id="full_name" name="full_name" value={values.full_name} onChange={set("full_name")} autoComplete="name"
                    aria-invalid={!!err.full_name} aria-describedby={err.full_name ? "full_name-error" : undefined} className={inputClass} />
                </Field>
              </div>
              <Field id="date_of_birth" label={t.dob} error={err.date_of_birth} errorText={errorText(err.date_of_birth)}>
                <Input id="date_of_birth" name="date_of_birth" type="date" value={values.date_of_birth} onChange={set("date_of_birth")}
                  aria-invalid={!!err.date_of_birth} aria-describedby={err.date_of_birth ? "date_of_birth-error" : undefined} className={inputClass} />
              </Field>
              <Field id="passport_number" label={t.passportNumber} error={err.passport_number} errorText={errorText(err.passport_number)}>
                <Input id="passport_number" name="passport_number" dir="ltr" value={values.passport_number} onChange={set("passport_number")}
                  autoCapitalize="characters" spellCheck={false} aria-invalid={!!err.passport_number}
                  aria-describedby={err.passport_number ? "passport_number-error" : undefined} className={cn(inputClass, "font-mono uppercase tracking-[0.08em]")} />
              </Field>
              <Field id="passport_expiry" label={t.passportExpiry} error={err.passport_expiry} errorText={errorText(err.passport_expiry)}>
                <Input id="passport_expiry" name="passport_expiry" type="date" value={values.passport_expiry} onChange={set("passport_expiry")}
                  aria-invalid={!!err.passport_expiry} aria-describedby={err.passport_expiry ? "passport_expiry-error" : undefined} className={inputClass} />
              </Field>
              <Field id="profession_code" label={t.professionCode} hint={t.optional}>
                <Input id="profession_code" name="profession_code" dir="ltr" inputMode="numeric" value={values.profession_code} onChange={set("profession_code")}
                  className={cn(inputClass, "font-mono")} />
              </Field>
            </div>
          </Section>

          <Section title={t.sectionContact}>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <span className="text-[14px] leading-snug font-medium text-ink">{t.mobile}</span>
                <div className="flex min-h-11 flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-lg border border-rule bg-[#eef0eb] px-3.5 py-2">
                  <span dir="ltr" className="font-mono text-[15px] whitespace-nowrap">{mobileMasked}</span>
                  <span className="flex items-center gap-1.5 text-[12.5px] font-medium whitespace-nowrap text-[#1e6b43]">
                    <BadgeCheck className="size-4" aria-hidden />
                    {t.mobileFromUaePass}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <span id="lang-label" className="text-[14px] leading-snug font-medium text-ink">{t.callLanguage}</span>
                <div role="radiogroup" aria-labelledby="lang-label" className="grid h-11 grid-cols-3 rounded-lg border border-input bg-paper p-1">
                  {(Object.keys(LANG_LABEL) as Lang[]).map((l) => (
                    <label
                      key={l}
                      lang={l}
                      className={cn(
                        "grid cursor-pointer place-items-center rounded-[5px] text-[14px] transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring",
                        lang === l ? "bg-ink text-paper" : "text-ink-2 hover:text-ink",
                      )}
                    >
                      <input type="radio" name="preferred_language" value={l} checked={lang === l} onChange={() => setLang(l)} className="sr-only" />
                      {LANG_LABEL[l]}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </Section>

          <Section title={t.sectionPhoto}>
            <p className="-mt-2 mb-4 text-[14px] text-ink-2">{t.photoRule}</p>
            <input type="hidden" name="photo_sample" value={photo === "white" || photo === "blue" ? photo : ""} />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {photoOptions.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  aria-pressed={photo === o.id}
                  onClick={() => { setPhoto(o.id); if (fileRef.current) fileRef.current.value = ""; }}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border bg-paper p-2.5 text-start text-[13.5px] leading-snug transition-colors",
                    photo === o.id ? "border-ink ring-1 ring-ink" : "border-rule hover:border-ink/50",
                  )}
                >
                  <Silhouette background={o.bg!} className="h-14 w-11 shrink-0 rounded-[3px] border border-rule" />
                  <span>{o.label}</span>
                </button>
              ))}
              <label
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-lg border bg-paper p-2.5 text-[13.5px] transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring",
                  photo === "upload" ? "border-ink ring-1 ring-ink" : "border-rule hover:border-ink/50",
                )}
              >
                {uploadUrl && photo === "upload" ? (
                  // eslint-disable-next-line @next/next/no-img-element -- local object URL preview
                  <img src={uploadUrl} alt="" className="h-14 w-11 shrink-0 rounded-[3px] border border-rule object-cover" />
                ) : (
                  <span className="grid h-14 w-11 shrink-0 place-items-center rounded-[3px] border border-dashed border-ink/30">
                    <ImageUp className="size-4 text-ink-2" aria-hidden />
                  </span>
                )}
                <span>{t.photoUpload}</span>
                <input
                  ref={fileRef}
                  type="file"
                  name="photo"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) { setPhoto("upload"); setUploadUrl(URL.createObjectURL(f)); }
                  }}
                />
              </label>
            </div>
            {err.photo && <p className="mt-2 text-[13px] font-medium text-officer">{errorText(err.photo)}</p>}
          </Section>

          <Section title={t.sectionConsent}>
            <div className={cn("flex gap-4 rounded-lg border p-4 transition-colors", consent ? "border-ink bg-paper" : "border-rule bg-paper/60")}>
              <Checkbox id="ai_call_consent" name="ai_call_consent" value="on" checked={consent} onCheckedChange={(c) => setConsent(c === true)} className="mt-0.5 size-5" />
              <div>
                <Label htmlFor="ai_call_consent" className="text-[15px] leading-snug font-medium text-ink">{t.consentLabel}</Label>
                <p className="mt-2 text-[13.5px] leading-relaxed text-ink-2">{t.consentDetail}</p>
              </div>
            </div>
          </Section>
        </div>

        {state.formError && <p className="mt-6 text-[14px] font-medium text-officer">{t.errorGeneric}</p>}

        <div className="mt-10 flex items-center gap-4 border-t border-rule pt-7">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-12 min-w-[220px] items-center justify-center gap-2 rounded-[8px] bg-ink px-6 text-[16px] font-medium text-paper transition-colors hover:bg-board disabled:opacity-70"
          >
            {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
            {pending ? t.submitting : t.submit}
          </button>
        </div>
      </form>

      <aside className="lg:col-span-5">
        <div className="flex flex-col items-center gap-6 lg:sticky lg:top-8">
          <Ticket
            hall={t.hall}
            numberLabel={t.ticketNumber}
            pendingLabel={t.ticketPending}
            reference={null}
            lines={[
              { label: t.ticketService, value: t.ticketServiceValue, keepCase: true },
              { label: t.ticketName, value: values.full_name },
              { label: t.ticketDob, value: values.date_of_birth },
              { label: t.ticketPassport, value: values.passport_number },
              { label: t.ticketExpiry, value: values.passport_expiry },
              { label: t.ticketLanguage, value: LANG_LABEL[lang], keepCase: true },
              { label: t.ticketConsent, value: consent ? t.ticketConsentYes : t.ticketConsentNo, keepCase: true },
            ]}
          />
          <LedBoard
            className="w-full max-w-[360px]"
            title={t.checksTitle}
            dense
            rows={[{ key: "waiting", label: t.boardWaiting, state: "pending", stateLabel: "" }]}
          />
        </div>
      </aside>
    </main>
  );
}
