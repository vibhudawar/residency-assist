import "server-only";
import { db } from "@/lib/supabase/server";
import { openCallAttempt, predialChecks } from "./predial";
import { afterRefusal, nextCallTime, type PredialName } from "./schedule";
import { startCall } from "./start";

/**
 * Auto-call: after a check finds something fixable on an opted-in application, the AI calls by itself.
 * The officer's switch decides whether it's on; the pre-dial checks still decide every single call.
 */

export interface AutoCallSetting {
  enabled: boolean;
  /** Set only by the end-to-end tests: due calls are marked placed without ringing anyone. */
  dryRun: boolean;
  updatedBy: string | null;
  updatedAt: string | null;
}

export async function getAutoCall(): Promise<AutoCallSetting> {
  const { data } = await db().from("settings").select("value, updated_by, updated_at").eq("key", "auto_call").maybeSingle();
  const value = (data?.value ?? {}) as { enabled?: boolean; dry_run?: boolean };
  return { enabled: value.enabled === true, dryRun: value.dry_run === true, updatedBy: data?.updated_by ?? null, updatedAt: data?.updated_at ?? null };
}

/**
 * The officer's switch. It applies to applications checked from now on (turning it on never rings the
 * cases already waiting). Turning it off cancels every call still waiting; returns how many.
 */
export async function setAutoCall(enabled: boolean, officer: string): Promise<{ cancelled: number }> {
  await db().from("settings").upsert({ key: "auto_call", value: { enabled }, updated_by: officer, updated_at: new Date().toISOString() });
  await db().from("audit_log").insert({ application_id: null, actor: "officer", event: enabled ? "auto_call_on" : "auto_call_off", detail: { by: officer } });
  if (!enabled) {
    const { data } = await db()
      .from("scheduled_calls")
      .update({ status: "cancelled", outcome: "Auto-call was turned off.", stop_reason: "switched_off", updated_at: new Date().toISOString() })
      .eq("status", "queued")
      .select("application_id");
    await logEach(data, "auto_call_cancelled", { reason: "auto-call turned off" });
    return { cancelled: data?.length ?? 0 };
  }
  return { cancelled: 0 };
}

async function logEach(rows: { application_id: number }[] | null, event: string, detail: Record<string, unknown>) {
  if (rows?.length) await db().from("audit_log").insert(rows.map((r) => ({ application_id: r.application_id, actor: "system", event, detail })));
}

/**
 * Queues an automatic call if everything allows it: auto-call on, the applicant opted in, something the
 * assistant can fix, and no officer has stopped calls for this case. One open call per case at most.
 */
export async function queueAutoCall(applicationId: number, reason: "submitted" | "retry" | "resumed", dueAt?: Date) {
  const setting = await getAutoCall();
  if (!setting.enabled) return null;
  const { data: app } = await db().from("applications").select("status, ai_call_consent, auto_call_stopped").eq("id", applicationId).single();
  if (!app || !app.ai_call_consent || app.status !== "returned_fixable" || app.auto_call_stopped) return null;
  const due = dueAt ?? nextCallTime(new Date());
  const { data, error } = await db()
    .from("scheduled_calls")
    .insert({ application_id: applicationId, due_at: due.toISOString(), reason })
    .select("id, due_at")
    .single();
  if (error) return null; // already one open for this case
  await db().from("audit_log").insert({ application_id: applicationId, actor: "system", event: "auto_call_queued", detail: { due_at: data.due_at, reason } });
  return data;
}

/** Stop or resume automatic calls for one application (the officer's choice on the case). */
export async function setCaseAutoCall(applicationId: number, stopped: boolean, officer: string) {
  await db().from("applications").update({ auto_call_stopped: stopped }).eq("id", applicationId);
  if (stopped) {
    await db()
      .from("scheduled_calls")
      .update({ status: "cancelled", outcome: "Stopped by an officer.", stop_reason: "officer", updated_at: new Date().toISOString() })
      .eq("application_id", applicationId)
      .eq("status", "queued");
  }
  await db().from("audit_log").insert({ application_id: applicationId, actor: "officer", event: stopped ? "auto_call_stopped" : "auto_call_resumed", detail: { by: officer } });
  if (!stopped) await queueAutoCall(applicationId, "resumed");
}

type Due = { id: number; application_id: number; tries: number };

/** The checks' own words, one reason at a time, each ending with a full stop. */
const reasons = (failed: { detail: string }[]) => failed.map((c) => (/[.!?]$/.test(c.detail.trim()) ? c.detail.trim() : `${c.detail.trim()}.`)).join(" · ");

async function settle(call: Due, patch: Record<string, unknown>, event: string, detail: Record<string, unknown>) {
  await db().from("scheduled_calls").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", call.id);
  await db().from("audit_log").insert({ application_id: call.application_id, actor: "system", event, detail });
}

/**
 * Places every call that's due (called by the every-minute job, and straight after a submission). Each
 * due call is claimed first, so two runs never dial the same one.
 */
export async function runDueCalls(now = new Date()): Promise<{ placed: number; rescheduled: number; cancelled: number }> {
  const counts = { placed: 0, rescheduled: 0, cancelled: 0 };
  const setting = await getAutoCall();
  if (!setting.enabled) return counts;

  const { data: due } = await db()
    .from("scheduled_calls")
    .select("id, application_id, tries")
    .eq("status", "queued")
    .lte("due_at", now.toISOString())
    .order("due_at")
    .limit(5);

  for (const row of due ?? []) {
    const { data: claimed } = await db()
      .from("scheduled_calls")
      .update({ status: "dialling", tries: row.tries + 1, updated_at: new Date().toISOString() })
      .eq("id", row.id)
      .eq("status", "queued")
      .select("id, application_id, tries")
      .maybeSingle();
    if (!claimed) continue;
    const call = claimed as Due;

    const { data: app } = await db().from("applications").select("auto_call_stopped").eq("id", call.application_id).single();
    if (app?.auto_call_stopped) {
      await settle(call, { status: "cancelled", outcome: "Stopped by an officer.", stop_reason: "officer" }, "auto_call_cancelled", { reason: "stopped by an officer" });
      counts.cancelled++;
      continue;
    }

    const pre = await predialChecks(call.application_id, { channel: "phone" });
    if (!pre.allowed) {
      const failed = pre.checks.filter((c) => !c.passed) as { name: PredialName; detail: string }[];
      const next = afterRefusal(failed, now);
      if (next.action === "reschedule") {
        await settle(call, { status: "queued", due_at: next.dueAt.toISOString(), outcome: reasons(failed) }, "auto_call_rescheduled", { due_at: next.dueAt.toISOString(), because: failed.map((c) => c.name) });
        counts.rescheduled++;
      } else {
        // A refusal for good is logged as a blocked attempt, like any refused call.
        await openCallAttempt(call.application_id, { channel: "phone" });
        await settle(call, { status: "cancelled", outcome: reasons(failed), stop_reason: "refused" }, "auto_call_cancelled", { because: failed.map((c) => c.name) });
        counts.cancelled++;
      }
      continue;
    }

    if (setting.dryRun) {
      await settle(call, { status: "placed", outcome: "Test mode: the call was not placed" }, "auto_call_placed", { dry_run: true });
      counts.placed++;
      continue;
    }

    const result = await startCall(call.application_id, "phone");
    if (result.kind === "dialling") {
      await settle(call, { status: "placed", outcome: "Ringing", call_attempt_id: result.attemptId }, "auto_call_placed", { attempt_id: result.attemptId });
      counts.placed++;
    } else if (result.kind === "not_configured") {
      await settle(call, { status: "cancelled", outcome: `Phone calling isn't set up (${result.missing.join(", ")}).`, stop_reason: "not_configured" }, "auto_call_cancelled", { missing: result.missing });
      counts.cancelled++;
    } else if (call.tries < 3) {
      // Couldn't reach ElevenLabs, or a check changed between the two looks: try again shortly.
      const later = new Date(now.getTime() + 10 * 60 * 1000);
      await settle(call, { status: "queued", due_at: later.toISOString(), outcome: "Couldn't start the call; trying again in 10 minutes." }, "auto_call_rescheduled", { due_at: later.toISOString(), because: [result.kind] });
      counts.rescheduled++;
    } else {
      await settle(call, { status: "cancelled", outcome: "Couldn't start the call after 3 tries.", stop_reason: "failed" }, "auto_call_cancelled", { because: [result.kind] });
      counts.cancelled++;
    }
  }
  return counts;
}

/** The open (or most recent) automatic call for a case, for the console and the status page. */
export async function latestAutoCall(applicationId: number) {
  const { data } = await db()
    .from("scheduled_calls")
    .select("status, due_at, reason, outcome, stop_reason, updated_at")
    .eq("application_id", applicationId)
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}
