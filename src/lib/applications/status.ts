import "server-only";
import { sha256 } from "@/lib/security";
import { db } from "@/lib/supabase/server";
import { uaeHour, uaeToday } from "@/lib/time";
import { UAE_TZ } from "@/lib/time";
import { latestRuleResults } from "./evaluate";

export type Stage = "submitted" | "checked" | "returned" | "call" | "review" | "processing";
export type NextKey =
  | "in_processing"
  | "returned_fixable_consent"
  | "returned_fixable_no_consent"
  | "call_today"
  | "call_later_today"
  | "no_ai_call"
  | "call_later"
  | "officer_arranges_call"
  | "returned_officer"
  | "pending_review"
  | "needs_human"
  | "calling";
export type CheckState = "pass" | "fix" | "route" | "officer";

export interface ApplicantStatusView {
  reference: string;
  submittedAt: string;
  fullName: string;
  passportMasked: string;
  dateOfBirth: string;
  passportExpiry: string;
  language: "en" | "ar" | "hi";
  consent: boolean;
  stage: Stage;
  /** Stages this application actually goes through, in order. */
  path: Stage[];
  next: NextKey;
  checks: { code: string; state: CheckState; detail: string | null }[];
  corrections: { field: string; newValue: string; status: "pending_review" | "approved" | "rejected" }[];
  appointment: { centre: string; when: string } | null;
}

const OFFICER_DETAIL = "This application needs review by an officer.";

function mask(passport: string): string {
  return passport.length <= 4 ? "••••" : `${passport.slice(0, 2)}${"•".repeat(passport.length - 4)}${passport.slice(-2)}`;
}

/**
 * The applicant's view of their application, found by the private status link token.
 * Returns an explicit whitelist of fields — never raw rows.
 */
/** What an opted-in applicant is told about the call: soon, later today, another day, or an officer will arrange it. */
function autoCallNext(dueAt: string | null): NextKey {
  if (!dueAt) return "officer_arranges_call";
  const due = new Date(dueAt);
  // Already due (or just placed): "shortly".
  if (due.getTime() - Date.now() <= 15 * 60 * 1000) return "returned_fixable_consent";
  if (uaeToday(due) !== uaeToday()) return "call_later";
  // "After 9:00" only when it really waits for the morning; a same-day retry is "later today".
  return uaeHour(due) === 9 && due.getUTCMinutes() === 0 ? "call_today" : "call_later_today";
}

export async function getApplicantStatus(token: string): Promise<ApplicantStatusView | null> {
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(token)) return null;

  const { data: app } = await db()
    .from("applications")
    .select("id, reference, created_at, full_name, passport_number, date_of_birth, passport_expiry, preferred_language, ai_call_consent, status")
    .eq("status_token_hash", sha256(token))
    .maybeSingle();
  if (!app) return null;

  const [rules, { data: attempts }, { data: corrections }, { data: slot }, { data: uploads }] = await Promise.all([
    latestRuleResults(app.id),
    db().from("call_attempts").select("status").eq("application_id", app.id).order("started_at", { ascending: false }).limit(1),
    db().from("corrections").select("field, new_value, status, created_at").eq("application_id", app.id).order("created_at"),
    db().from("appointment_slots").select("centre, starts_at").eq("application_id", app.id).order("starts_at").limit(1).maybeSingle(),
    db().from("uploads").select("kind, review_status, uploaded_at").eq("application_id", app.id).not("review_status", "is", null).order("uploaded_at"),
  ]);
  // When (and whether) the assistant will call by itself: only an automatic call actually waiting counts.
  const { data: auto } = await db().from("scheduled_calls").select("status, due_at, stop_reason, updated_at").eq("application_id", app.id).order("id", { ascending: false }).limit(1).maybeSingle();
  // A call waiting, or one placed in the last few minutes (the phone attempt shows as "calling" once it rings).
  const queued = auto && (["queued", "dialling"].includes(auto.status) || (auto.status === "placed" && Date.now() - new Date(auto.updated_at).getTime() < 10 * 60 * 1000)) ? auto : null;
  // The checks refused an AI call for good (do-not-call, limits spent): don't promise one.
  const refused = auto?.status === "cancelled" && auto.stop_reason === "refused";

  const calling = ["dialing", "connected"].includes(attempts?.[0]?.status ?? "");
  const status = app.status as string;

  const stage: Stage =
    status === "submitted" ? "submitted"
      : status === "in_processing" ? "processing"
        : status === "returned_fixable" ? (calling ? "call" : "returned")
          : "review"; // returned_officer, pending_review, needs_human

  const path: Stage[] =
    status === "in_processing" && !(corrections ?? []).length
      ? ["submitted", "checked", "processing"]
      : status === "returned_officer"
        ? ["submitted", "checked", "returned", "review", "processing"]
        : app.ai_call_consent
          ? ["submitted", "checked", "returned", "call", "review", "processing"]
          : ["submitted", "checked", "returned", "review", "processing"];

  const next: NextKey =
    calling ? "calling"
      : status === "returned_fixable" ? (app.ai_call_consent ? (refused && !queued ? "no_ai_call" : autoCallNext(queued?.due_at ?? null)) : "returned_fixable_no_consent")
        : status === "returned_officer" ? "returned_officer"
          : status === "pending_review" ? "pending_review"
            : status === "needs_human" ? "needs_human"
              : "in_processing";

  return {
    reference: app.reference,
    submittedAt: app.created_at,
    fullName: app.full_name,
    passportMasked: mask(app.passport_number),
    dateOfBirth: app.date_of_birth,
    passportExpiry: app.passport_expiry,
    language: app.preferred_language,
    consent: app.ai_call_consent,
    stage,
    path,
    next,
    checks: rules.map((r) => {
      const state: CheckState = r.passed ? "pass" : r.rule_type === "C" ? "officer" : r.rule_type === "B" ? "route" : "fix";
      return {
        code: r.rule_code,
        state,
        detail: r.passed ? null : r.rule_type === "C" ? OFFICER_DETAIL : r.detail,
      };
    }),
    corrections: [
      ...(corrections ?? []).map((c) => ({ field: c.field, newValue: c.new_value, status: c.status })),
      // A new photo/scan that passed the check is shown like a correction; its value is the file, so none is printed.
      ...(uploads ?? []).map((u) => ({ field: u.kind as string, newValue: "", status: u.review_status as "pending_review" | "approved" | "rejected" })),
    ],
    appointment: slot
      ? {
          centre: slot.centre,
          when: new Intl.DateTimeFormat("en-GB", { timeZone: UAE_TZ, weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit" }).format(new Date(slot.starts_at)),
        }
      : null,
  };
}
