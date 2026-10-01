"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { startCall } from "@/lib/calls/start";
import type { PredialCheck } from "@/lib/calls/predial";
import { approveCorrection, rejectCorrection } from "@/lib/console/review";
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

export async function approveAction(_prev: ReviewState, formData: FormData): Promise<ReviewState> {
  const officer = await requireOfficer();
  const correctionId = id.safeParse(formData.get("correctionId"));
  if (!correctionId.success) return { error: "failed" };
  try {
    const result = await approveCorrection(correctionId.data, officer.name);
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
  const correctionId = id.safeParse(formData.get("correctionId"));
  const note = reason.safeParse(formData.get("reason"));
  if (!correctionId.success) return { error: "failed" };
  if (!note.success) return { error: "reason_required" };
  try {
    const result = await rejectCorrection(correctionId.data, officer.name, note.data);
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
  outcome?: "blocked" | "not_configured" | "failed";
  channel?: "phone" | "browser";
  missing?: string[];
  refused?: PredialCheck[];
}

export async function callAction(_prev: CallState, formData: FormData): Promise<CallState> {
  await requireOfficer();
  const applicationId = id.safeParse(formData.get("applicationId"));
  const channel = z.enum(["phone", "browser"]).safeParse(formData.get("channel"));
  if (!applicationId.success || !channel.success) return { outcome: "failed" };
  try {
    const result = await startCall(applicationId.data, channel.data);
    refresh();
    return result.kind === "blocked"
      ? { outcome: "blocked", channel: channel.data, refused: result.checks.filter((c) => !c.passed) }
      : { outcome: "not_configured", channel: channel.data, missing: result.missing };
  } catch (err) {
    console.error("call failed", forLog(err instanceof Error ? err.message : err));
    return { outcome: "failed", channel: channel.data };
  }
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
