/** Display helpers for the console (safe on server and client). All times are UAE time. */

const TZ = "Asia/Dubai";

export function uaeTime(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: TZ, day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(iso));
}

export function uaeClock(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(new Date(iso));
}

export function uaeDay(isoDate: string): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric" }).format(new Date(`${isoDate}T00:00:00Z`));
}

/** The demo number is a real phone: only its last four digits ever reach the screen (or a recording). */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.length < 7 ? "••••" : `••• ••• ${digits.slice(-4)}`;
}

export const LANGUAGE: Record<string, string> = { en: "English", ar: "Arabic", hi: "Hindi" };

export const RULE_LABEL: Record<string, string> = {
  R1: "Name matches passport",
  R2: "Date of birth matches",
  R3: "Passport number matches",
  R4: "Photo meets requirements",
  R5: "Scan is readable",
  R6: "Emirates ID biometrics",
  R7: "Medical fitness test",
  R8: "Passport valid 6+ months",
  R9: "No active previous visa",
  R10: "No unpaid fines",
  R11: "Profession code matches",
  R12: "Officer review",
};

export const FIELD_LABEL: Record<string, string> = {
  full_name: "Full name",
  date_of_birth: "Date of birth",
  passport_number: "Passport number",
};

export const STATUS_LABEL: Record<string, string> = {
  submitted: "Submitted",
  returned_fixable: "Returned — fixable",
  returned_officer: "Returned — officer only",
  pending_review: "Awaiting your decision",
  in_processing: "In processing",
  needs_human: "Needs a person",
};

/** Short board words (dot-matrix), one per case status. */
export const STATUS_WORD: Record<string, string> = {
  submitted: "New",
  returned_fixable: "Fixable",
  returned_officer: "Officer",
  pending_review: "Decide",
  in_processing: "Clear",
  needs_human: "Person",
};

export const CALL_STATUS: Record<string, string> = {
  blocked: "Blocked before dialling",
  queued: "Queued for calling hours",
  dialing: "Dialling",
  no_answer: "No answer",
  declined: "Declined",
  silent: "Picked up, nobody spoke",
  voicemail: "Voicemail",
  connected: "On a call",
  completed: "Call completed",
  failed: "Call failed",
};

export const CHECK_LABEL: Record<string, string> = {
  consent: "Consent to AI calls",
  do_not_call: "Not on do-not-call list",
  calling_hours: "Calling hours 09:00–18:00",
  officer_only: "No officer-only issue",
  fixable_issue: "Something to fix",
  attempt_limits: "Retry limits",
  no_active_call: "No call in progress",
};

export const EVENT_LABEL: Record<string, string> = {
  application_submitted: "Application submitted",
  rules_checked: "12 rules checked",
  sms_sent: "SMS sent",
  call_blocked: "Call refused by pre-dial checks",
  call_started: "Call started",
  call_recorded: "Call ended — transcript received",
  call_not_connected: "Call didn't connect",
  identity_verified: "Caller verified",
  identity_check_failed: "Identity check failed",
  correction_submitted: "Correction captured (pending review)",
  upload_link_sent: "Upload link sent",
  appointment_booked: "Appointment booked",
  followup_created: "Follow-up created",
  escalated_to_human: "Escalated to a person",
  callback_scheduled: "Callback scheduled",
  opted_out: "Opted out of calls",
  consent_withdrawn: "Consent withdrawn",
  upload_passed_check: "New file passed the check (pending review)",
  upload_failed_check: "New file failed the check",
  upload_approved: "Officer approved new file",
  upload_rejected: "Officer rejected new file",
  correction_approved: "Officer approved correction",
  correction_rejected: "Officer rejected correction",
  demo_reset: "Demo reset",
};

export const HANDOFF_LABEL: Record<string, string> = { callback: "Callback", escalation: "Escalation", followup: "Follow-up" };
