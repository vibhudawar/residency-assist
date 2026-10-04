"use server";

import { refresh } from "next/cache";
import { setAutoCall, setCaseAutoCall } from "@/lib/calls/auto";
import { redirect } from "next/navigation";
import { z } from "zod";
import { abandonBrowserCall, type BrowserSession, markBrowserCallLive, startCall } from "@/lib/calls/start";
import type { PredialCheck } from "@/lib/calls/predial";
import { approveCorrection, approveUpload, rejectCorrection, rejectUpload } from "@/lib/console/review";
import { resetDemo } from "@/lib/demo/reset";
import { env } from "@/lib/env";
import { clearOfficerSession, OFFICER_NAME, passcodeMatches, requireOfficer, setOfficerSession } from "@/lib/officer";
import { forLog } from "@/lib/security";

const id = z.coerce.number().int().positive();

// ---------------------------------------------------------------------------
// Sign-in
// ---------------------------------------------------------------------------

export interface SignInState {
  error?: "wrong" | "not_set";
}

export async function signInOfficer(_prev: SignInState, formData: FormData): Promise<SignInState> {
  if (!env().OFFICER_PASSCODE) return { error: "not_set" };
  const passcode = z.string().max(200).safeParse(formData.get("passcode"));
  if (!passcode.success || !passcodeMatches(passcode.data)) {
    // Slow every wrong guess down; there is no account to lock in this prototype.
    await new Promise((r) => setTimeout(r, 800));
    return { error: "wrong" };
  }
  await setOfficerSession({ name: OFFICER_NAME, issuedAt: Date.now() });
  redirect("/console");
}

export async function signOutOfficer() {
  await clearOfficerSession();
  redirect("/console/signin");
}

// ---------------------------------------------------------------------------
// The human gate
// ---------------------------------------------------------------------------

export interface ReviewState {
  error?: "already_decided" | "reason_required" | "failed";
}

/** A slip is either a typed correction or a new photo/scan; both go through the same gate. */
const slipKind = z.enum(["correction", "upload"]);

export async function approveAction(_prev: ReviewState, formData: FormData): Promise<ReviewState> {
  const officer = await requireOfficer();
  const slipId = id.safeParse(formData.get("slipId"));
  const kind = slipKind.safeParse(formData.get("kind"));
  if (!slipId.success || !kind.success) return { error: "failed" };
  try {
    const result = kind.data === "upload" ? await approveUpload(slipId.data, officer.name) : await approveCorrection(slipId.data, officer.name);
    if (!result.ok) return { error: "already_decided" };
  } catch (err) {
    console.error("approve failed", forLog(err instanceof Error ? err.message : err));
    return { error: "failed" };
  }
  refresh();
  return {};
}

const reason = z.string().trim().min(5).max(300);

export async function rejectAction(_prev: ReviewState, formData: FormData): Promise<ReviewState> {
  const officer = await requireOfficer();
  const slipId = id.safeParse(formData.get("slipId"));
  const kind = slipKind.safeParse(formData.get("kind"));
  const note = reason.safeParse(formData.get("reason"));
  if (!slipId.success || !kind.success) return { error: "failed" };
  if (!note.success) return { error: "reason_required" };
  try {
    const result =
      kind.data === "upload" ? await rejectUpload(slipId.data, officer.name, note.data) : await rejectCorrection(slipId.data, officer.name, note.data);
    if (!result.ok) return { error: "already_decided" };
  } catch (err) {
    console.error("reject failed", forLog(err instanceof Error ? err.message : err));
    return { error: "failed" };
  }
  refresh();
  return {};
}

// ---------------------------------------------------------------------------
// Calls
// ---------------------------------------------------------------------------

export interface CallState {
  outcome?: "blocked" | "not_configured" | "failed" | "dialling" | "browser";
  channel?: "phone" | "browser";
  missing?: string[];
  refused?: PredialCheck[];
  /** Browser calls: what the page needs to start the session. */
  session?: BrowserSession;
}

export async function callAction(_prev: CallState, formData: FormData): Promise<CallState> {
  await requireOfficer();
  const applicationId = id.safeParse(formData.get("applicationId"));
  const channel = z.enum(["phone", "browser"]).safeParse(formData.get("channel"));
  if (!applicationId.success || !channel.success) return { outcome: "failed" };
  try {
    const result = await startCall(applicationId.data, channel.data);
    refresh();
    switch (result.kind) {
      case "blocked":
        return { outcome: "blocked", channel: channel.data, refused: result.checks.filter((c) => !c.passed) };
      case "not_configured":
        return { outcome: "not_configured", channel: channel.data, missing: result.missing };
      case "dialling":
        return { outcome: "dialling", channel: "phone" };
      case "browser":
        return { outcome: "browser", channel: "browser", session: result.session };
      default:
        return { outcome: "failed", channel: channel.data };
    }
  } catch (err) {
    console.error("call failed", forLog(err instanceof Error ? err.message : err));
    return { outcome: "failed", channel: channel.data };
  }
}

/** The officer's page reports whether its browser session connected, so the attempt never dangles. */
export async function browserCallEvent(attemptId: number, event: "live" | "abandoned") {
  await requireOfficer();
  const attempt = id.safeParse(attemptId);
  if (!attempt.success || !["live", "abandoned"].includes(event)) return;
  if (event === "live") await markBrowserCallLive(attempt.data);
  else await abandonBrowserCall(attempt.data);
  refresh();
}

// ---------------------------------------------------------------------------
// Demo
// ---------------------------------------------------------------------------

export interface ResetState {
  done?: boolean;
  error?: boolean;
}

export async function resetDemoAction(): Promise<ResetState> {
  await requireOfficer();
  try {
    await resetDemo();
  } catch (err) {
    console.error("demo reset failed", forLog(err instanceof Error ? err.message : err));
    return { error: true };
  }
  refresh();
  return { done: true };
}

export type AutoCallState = { done?: boolean; error?: boolean; cancelled?: number };

/** The officer's auto-call switch. Turning it off also cancels calls still waiting. */
export async function setAutoCallAction(enabled: boolean): Promise<AutoCallState> {
  const officer = await requireOfficer();
  if (typeof enabled !== "boolean") return { error: true };
  let cancelled = 0;
  try {
    ({ cancelled } = await setAutoCall(enabled, officer.name));
  } catch (err) {
    console.error("auto-call switch failed", forLog(err instanceof Error ? err.message : err));
    return { error: true };
  }
  refresh();
  return { done: true, cancelled };
}

/** Stop or resume automatic calls for one case. */
export async function caseAutoCallAction(applicationId: number, stopped: boolean): Promise<AutoCallState> {
  const officer = await requireOfficer();
  if (!Number.isSafeInteger(applicationId) || applicationId <= 0 || typeof stopped !== "boolean") return { error: true };
  try {
    await setCaseAutoCall(applicationId, stopped, officer.name);
  } catch (err) {
    console.error("case auto-call change failed", forLog(err instanceof Error ? err.message : err));
    return { error: true };
  }
  refresh();
  return { done: true };
}
