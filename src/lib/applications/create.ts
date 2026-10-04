import "server-only";
import { randomInt } from "node:crypto";
import { normalisePassportNumber } from "@/lib/rules/engine";
import { randomToken, sha256 } from "@/lib/security";
import { putDocument } from "@/lib/storage";
import { db } from "@/lib/supabase/server";
import { queueAutoCall } from "@/lib/calls/auto";
import { evaluateApplication } from "./evaluate";
import { notifyAfterCheck } from "./notify";

export interface NewApplication {
  reference?: string;
  full_name: string;
  date_of_birth: string;
  passport_number: string;
  passport_expiry: string;
  profession_code: string | null;
  phone: string;
  preferred_language: "en" | "ar" | "hi";
  ai_call_consent: boolean;
  is_demo_seed?: boolean;
}

/** Short, speakable reference: "RA-" + 6 digits (read out on the call). */
function newReference(): string {
  return `RA-${randomInt(270000, 999999)}`;
}

/** Stores an application + its photo, then runs the rules on it. */
export async function createApplication(input: NewApplication, photo: { body: Buffer; contentType: string } | null) {
  let row: { id: number; reference: string } | null = null;
  // Private link to the applicant's status page; only the hash is stored.
  const statusToken = randomToken();

  for (let attempt = 0; attempt < 5 && !row; attempt++) {
    const reference = input.reference ?? newReference();
    const { data, error } = await db()
      .from("applications")
      .insert({
        reference,
        full_name: input.full_name.trim(),
        date_of_birth: input.date_of_birth,
        passport_number: normalisePassportNumber(input.passport_number),
        passport_expiry: input.passport_expiry,
        profession_code: input.profession_code,
        phone: input.phone,
        preferred_language: input.preferred_language,
        ai_call_consent: input.ai_call_consent,
        ai_call_consent_at: input.ai_call_consent ? new Date().toISOString() : null,
        is_demo_seed: input.is_demo_seed ?? false,
        status_token_hash: sha256(statusToken),
      })
      .select("id, reference")
      .single();
    if (data) row = data;
    else if (error?.code !== "23505" || input.reference) throw new Error(`Creating application failed: ${error?.message}`);
  }
  if (!row) throw new Error("Could not allocate an application reference");

  if (photo) {
    const ext = photo.contentType === "image/png" ? "png" : photo.contentType === "image/webp" ? "webp" : "jpg";
    const path = `applications/${row.reference}-photo-${Date.now()}.${ext}`;
    await putDocument(path, photo.body, photo.contentType);
    await db().from("applications").update({ photo_path: path }).eq("id", row.id);
  }

  await db().from("audit_log").insert({
    application_id: row.id,
    actor: "portal",
    event: "application_submitted",
    detail: { ai_call_consent: input.ai_call_consent },
  });

  const evaluation = await evaluateApplication(row.id);
  await notifyAfterCheck(row.id);
  // Something fixable and an opt-in: the assistant calls by itself (if the officer's switch is on).
  await queueAutoCall(row.id, "submitted");
  return { id: row.id, reference: row.reference, statusToken, ...evaluation };
}
