import "server-only";
import { randomToken, sha256 } from "@/lib/security";
import { db } from "@/lib/supabase/server";
import { uaeHour, uaeToday } from "@/lib/time";

export const CALL_WINDOW = { startHour: 9, endHour: 18 } as const; // UAE time, TDRA calling hours
export const MAX_ATTEMPTS_TOTAL = 3;
export const MAX_ATTEMPTS_PER_DAY = 1;
export const MAX_DECLINES = 2;

export type Channel = "phone" | "browser";

const STATUS_WORDS: Record<string, string> = {
  submitted: "not checked yet",
  pending_review: "a correction is waiting for an officer",
  in_processing: "already back in processing",
  needs_human: "handed to a person",
  returned_officer: "officer-only issue",
};

export interface PredialCheck {
  name: "consent" | "do_not_call" | "calling_hours" | "officer_only" | "fixable_issue" | "attempt_limits" | "no_active_call";
  passed: boolean;
  detail: string;
}

export interface PredialResult {
  allowed: boolean;
  checks: PredialCheck[];
}

interface Options {
  /** Browser demo calls skip the calling-hours window and phone retry limits so judges can try any time. Phone calls never skip them. */
  channel: Channel;
  now?: Date;
}

/** Runs every pre-dial check. Pure read — no side effects. */
export async function predialChecks(applicationId: number, { channel, now = new Date() }: Options): Promise<PredialResult> {
  const { data: app } = await db().from("applications").select("id, phone, status, ai_call_consent").eq("id", applicationId).single();
  if (!app) throw new Error(`Application ${applicationId} not found`);

  const [{ data: optOut }, { data: attempts }] = await Promise.all([
    db().from("opt_outs").select("phone").eq("phone", app.phone).maybeSingle(),
    db().from("call_attempts").select("status, started_at, channel").eq("application_id", applicationId).neq("status", "blocked"),
  ]);

  const hour = uaeHour(now);
  const inWindow = hour >= CALL_WINDOW.startHour && hour < CALL_WINDOW.endHour;
  // Attempt limits are about ringing someone's phone; browser demo calls don't count.
  const real = (attempts ?? []).filter((a) => a.status !== "queued" && a.channel === "phone");
  const today = uaeToday(now);
  const todayCount = real.filter((a) => uaeToday(new Date(a.started_at)) === today).length;
  const declines = real.filter((a) => a.status === "declined").length;
  const active = (attempts ?? []).some((a) => ["dialing", "connected"].includes(a.status));

  const checks: PredialCheck[] = [
    {
      name: "consent",
      passed: app.ai_call_consent,
      detail: app.ai_call_consent ? "Applicant opted in to AI calls at submission." : "Applicant did not opt in to AI calls — SMS and portal only.",
    },
    {
      name: "do_not_call",
      passed: !optOut,
      detail: optOut ? "Number is on the do-not-call list." : "Checked against the do-not-call list.",
    },
    {
      name: "calling_hours",
      passed: channel === "browser" || inWindow,
      detail: channel === "browser"
        ? "Browser demo call — calling-hours window not applied."
        : inWindow
          ? `Within calling hours (09:00–18:00 UAE, now ${String(hour).padStart(2, "0")}:00).`
          : "Outside calling hours (09:00–18:00 UAE) — queued for the next window.",
    },
    {
      name: "officer_only",
      passed: app.status !== "returned_officer",
      detail: app.status === "returned_officer" ? "Officer-only issue — AI calls are never allowed." : "No type C rule failed.",
    },
    {
      name: "fixable_issue",
      passed: app.status === "returned_fixable",
      detail: app.status === "returned_fixable" ? "Application has issues the assistant can help with." : `Nothing for the assistant to do — ${STATUS_WORDS[app.status] ?? "not returned"}.`,
    },
    {
      name: "attempt_limits",
      passed: channel === "browser" || (real.length < MAX_ATTEMPTS_TOTAL && todayCount < MAX_ATTEMPTS_PER_DAY && declines < MAX_DECLINES),
      detail: channel === "browser"
        ? "Browser demo call — phone retry limits not applied."
        : declines >= MAX_DECLINES
        ? "Call declined twice — stop calling, SMS and portal only."
        : real.length >= MAX_ATTEMPTS_TOTAL
          ? `Already tried ${real.length} times — SMS and portal only.`
          : todayCount >= MAX_ATTEMPTS_PER_DAY
            ? "Already called today — next attempt tomorrow."
            : `Attempt ${real.length + 1} of ${MAX_ATTEMPTS_TOTAL}.`,
    },
    {
      name: "no_active_call",
      passed: !active,
      detail: active ? "A call for this application is already in progress." : "Nothing dialling or connected for this case.",
    },
  ];

  return { allowed: checks.every((c) => c.passed), checks };
}

/**
 * Runs the checks and, if allowed, opens a call attempt with a one-time case token.
 * The plain token is returned once (to hand to ElevenLabs as a secret__ variable); only its hash is stored.
 */
export async function openCallAttempt(applicationId: number, opts: Options) {
  const result = await predialChecks(applicationId, opts);

  if (!result.allowed) {
    const reasons = result.checks.filter((c) => !c.passed).map((c) => c.detail);
    await db().from("call_attempts").insert({
      application_id: applicationId,
      channel: opts.channel,
      status: "blocked",
      block_reason: reasons.join(" "),
      ended_at: new Date().toISOString(),
    });
    await db().from("audit_log").insert({ application_id: applicationId, actor: "system", event: "call_blocked", detail: { reasons } });
    return { ...result, attempt: null, caseToken: null };
  }

  const caseToken = randomToken();
  const { data: attempt, error } = await db()
    .from("call_attempts")
    .insert({ application_id: applicationId, channel: opts.channel, status: "dialing", case_token_hash: sha256(caseToken) })
    .select("id")
    .single();
  if (error || !attempt) throw new Error(`Opening call attempt failed: ${error?.message}`);

  await db().from("audit_log").insert({ application_id: applicationId, actor: "system", event: "call_started", detail: { channel: opts.channel, attempt_id: attempt.id } });
  return { ...result, attempt, caseToken };
}
