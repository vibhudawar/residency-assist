import "server-only";
import { sha256 } from "@/lib/security";
import { db } from "@/lib/supabase/server";
import { UAE_TZ } from "@/lib/time";
import { latestRuleResults } from "./evaluate";

export type Stage = "submitted" | "checked" | "returned" | "call" | "review" | "processing";
export type NextKey =
  | "in_processing"
  | "returned_fixable_consent"
  | "returned_fixable_no_consent"
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
export async function getApplicantStatus(token: string): Promise<ApplicantStatusView | null> {
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(token)) return null;

  const { data: app } = await db()
    .from("applications")
    .select("id, reference, created_at, full_name, passport_number, date_of_birth, passport_expiry, preferred_language, ai_call_consent, status")
    .eq("status_token_hash", sha256(token))
    .maybeSingle();
  if (!app) return null;

  const [rules, { data: attempts }, { data: corrections }, { data: slot }] = await Promise.all([
    latestRuleResults(app.id),
    db().from("call_attempts").select("status").eq("application_id", app.id).order("started_at", { ascending: false }).limit(1),
    db().from("corrections").select("field, new_value, status, created_at").eq("application_id", app.id).order("created_at"),
    db().from("appointment_slots").select("centre, starts_at").eq("application_id", app.id).order("starts_at").limit(1).maybeSingle(),
  ]);

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
      : status === "returned_fixable" ? (app.ai_call_consent ? "returned_fixable_consent" : "returned_fixable_no_consent")
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
    corrections: (corrections ?? []).map((c) => ({ field: c.field, newValue: c.new_value, status: c.status })),
    appointment: slot
      ? {
          centre: slot.centre,
          when: new Intl.DateTimeFormat("en-GB", { timeZone: UAE_TZ, weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit" }).format(new Date(slot.starts_at)),
        }
      : null,
  };
}
