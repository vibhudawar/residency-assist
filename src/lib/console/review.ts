import "server-only";
import { evaluateApplication } from "@/lib/applications/evaluate";
import { sendSms } from "@/lib/applications/notify";
import { normalisePassportNumber } from "@/lib/rules/engine";
import type { CorrectableField } from "@/lib/rules/types";
import { db } from "@/lib/supabase/server";

export type ReviewResult = { ok: true; status: string } | { ok: false; reason: "already_decided" | "not_found" };

const FIELDS: CorrectableField[] = ["full_name", "date_of_birth", "passport_number"];

/**
 * The human gate. Approve writes the corrected value onto the application, and once no
 * correction is still waiting, re-runs the 12 rules: a clean run goes back into processing.
 * The status update is a compare-and-set on `pending_review`, so a double click or two
 * officers acting at once can only decide a correction once.
 */
export async function approveCorrection(correctionId: number, officer: string): Promise<ReviewResult> {
  const now = new Date().toISOString();
  const { data: c } = await db()
    .from("corrections")
    .update({ status: "approved", reviewed_by: officer, reviewed_at: now })
    .eq("id", correctionId)
    .eq("status", "pending_review")
    .select("id, application_id, field, new_value")
    .maybeSingle();
  if (!c) return { ok: false, reason: (await exists(correctionId)) ? "already_decided" : "not_found" };

  const field = c.field as CorrectableField;
  if (!FIELDS.includes(field)) throw new Error(`correction ${c.id} has an uncorrectable field`);
  const value = field === "passport_number" ? normalisePassportNumber(c.new_value) : c.new_value.trim();
  await db().from("applications").update({ [field]: value, updated_at: now }).eq("id", c.application_id);
  await db().from("audit_log").insert({
    application_id: c.application_id,
    actor: "officer",
    event: "correction_approved",
    detail: { correction_id: c.id, field, reviewed_by: officer },
  });

  const [{ count: pending }, { data: app }] = await Promise.all([
    db().from("corrections").select("id", { count: "exact", head: true }).eq("application_id", c.application_id).eq("status", "pending_review"),
    db().from("applications").select("status").eq("id", c.application_id).single(),
  ]);
  // Wait for the officer to decide every slip; a rejected slip already handed the case to a person.
  if ((pending ?? 0) > 0 || app?.status === "needs_human") return { ok: true, status: app?.status ?? "pending_review" };

  const { status } = await evaluateApplication(c.application_id);
  if (status === "in_processing") await sendSms(c.application_id, "correction_approved");
  return { ok: true, status };
}

/** Reject never touches the application data: the case goes to a person and the applicant is told. */
export async function rejectCorrection(correctionId: number, officer: string, reason: string): Promise<ReviewResult> {
  const now = new Date().toISOString();
  const { data: c } = await db()
    .from("corrections")
    .update({ status: "rejected", reviewed_by: officer, reviewed_at: now, review_note: reason })
    .eq("id", correctionId)
    .eq("status", "pending_review")
    .select("id, application_id, field, conversation_id")
    .maybeSingle();
  if (!c) return { ok: false, reason: (await exists(correctionId)) ? "already_decided" : "not_found" };

  await db().from("applications").update({ status: "needs_human", updated_at: now }).eq("id", c.application_id);
  await db().from("handoffs").insert({
    application_id: c.application_id,
    conversation_id: c.conversation_id,
    kind: "followup",
    reason: `Officer rejected the ${c.field.replace(/_/g, " ")} correction: ${reason}`,
  });
  await db().from("audit_log").insert({
    application_id: c.application_id,
    actor: "officer",
    event: "correction_rejected",
    detail: { correction_id: c.id, field: c.field, reviewed_by: officer, reason },
  });
  await sendSms(c.application_id, "officer_will_contact");
  return { ok: true, status: "needs_human" };
}

async function exists(correctionId: number) {
  const { data } = await db().from("corrections").select("id").eq("id", correctionId).maybeSingle();
  return !!data;
}
