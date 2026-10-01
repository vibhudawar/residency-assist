import "server-only";
import sharp from "sharp";
import { checkPhoto, checkScan } from "@/lib/rules/image-check";
import type { ImageRequirement } from "@/lib/rules/types";
import { sha256 } from "@/lib/security";
import { getDocument, putDocument, signedDocumentUrl } from "@/lib/storage";
import { db } from "@/lib/supabase/server";

/**
 * The applicant's upload link (`/u/<token>`, sent by SMS during or after the call).
 * The link is the key: random, one application, one kind of file, valid 24 hours, and
 * closed once a file passes the check. Nothing passing the check replaces the old file
 * until an officer approves it.
 */

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const MAX_UPLOAD_ATTEMPTS = 5;
const TOKEN = /^[A-Za-z0-9_-]{16,64}$/;

export type UploadKind = "photo" | "scan";
export type UploadState =
  | "open"            // waiting for a file (or a retry after a failed check)
  | "pending_review"  // passed the check, waiting for an officer
  | "approved"
  | "rejected"
  | "expired"
  | "replaced"        // a newer link for the same file was sent
  | "locked";         // too many failed attempts

export interface RequirementResult { key: ImageRequirement; ok: boolean }

export interface UploadView {
  reference: string;
  firstName: string;
  language: "en" | "ar" | "hi";
  kind: UploadKind;
  state: UploadState;
  expiresAt: string;
  attemptsLeft: number;
  /** Which requirements the file on the application failed — the page words them in the reader's language. */
  originalFailures: ImageRequirement[] | "missing";
  /** The applicant's own file once it passed the check (short-lived signed URL). */
  receivedUrl: string | null;
  /** The latest attempt's result, so lamps relight after a reload. */
  last: { ok: boolean; requirements: RequirementResult[] } | null;
}

interface UploadRow {
  id: number;
  file_path: string | null;
  application_id: number;
  kind: UploadKind;
  expires_at: string;
  created_at: string;
  uploaded_at: string | null;
  check_passed: boolean | null;
  check_requirements: RequirementResult[] | null;
  attempts: number;
  review_status: "pending_review" | "approved" | "rejected" | null;
}

async function findUpload(token: string): Promise<UploadRow | null> {
  if (!TOKEN.test(token)) return null;
  const { data } = await db()
    .from("uploads")
    .select("id, application_id, kind, file_path, expires_at, created_at, uploaded_at, check_passed, check_requirements, attempts, review_status")
    .eq("token_hash", sha256(token))
    .maybeSingle();
  return (data as UploadRow | null) ?? null;
}

async function stateOf(u: UploadRow, now = Date.now()): Promise<UploadState> {
  if (u.review_status) return u.review_status;
  if (u.attempts >= MAX_UPLOAD_ATTEMPTS) return "locked";
  if (new Date(u.expires_at).getTime() <= now) return "expired";
  const { data: newer } = await db()
    .from("uploads")
    .select("id")
    .eq("application_id", u.application_id)
    .eq("kind", u.kind)
    .gt("created_at", u.created_at)
    .limit(1);
  return newer?.length ? "replaced" : "open";
}

/** The page's view of a link: an explicit whitelist, never the raw rows. */
export async function getUploadView(token: string): Promise<UploadView | null> {
  const u = await findUpload(token);
  if (!u) return null;
  const { data: app } = await db().from("applications").select("reference, full_name, preferred_language, photo_path, scan_path").eq("id", u.application_id).single();
  if (!app) return null;
  const state = await stateOf(u);

  return {
    reference: app.reference,
    firstName: app.full_name.split(/\s+/)[0],
    language: app.preferred_language,
    kind: u.kind,
    state,
    expiresAt: u.expires_at,
    attemptsLeft: Math.max(0, MAX_UPLOAD_ATTEMPTS - u.attempts),
    originalFailures: await originalFailures(u.kind === "photo" ? app.photo_path : app.scan_path, u.kind),
    receivedUrl: u.file_path && (state === "pending_review" || state === "approved") ? await signedDocumentUrl(u.file_path) : null,
    last: u.uploaded_at && u.check_requirements ? { ok: !!u.check_passed, requirements: u.check_requirements } : null,
  };
}

/** Re-checks the file currently on the application, so the reason names exactly what failed. */
async function originalFailures(path: string | null, kind: UploadKind): Promise<ImageRequirement[] | "missing"> {
  if (!path) return "missing";
  try {
    const buffer = await getDocument(path);
    const check = kind === "photo" ? await checkPhoto(buffer) : await checkScan(buffer);
    return (check.requirements ?? []).filter((r) => !r.ok).map((r) => r.key);
  } catch {
    return "missing";
  }
}

export type SubmitResult =
  | { kind: "checked"; ok: boolean; requirements: RequirementResult[]; attemptsLeft: number }
  | { kind: "refused"; reason: "not_found" | "closed" | "not_an_image" | "too_large" };

/** Checks and stores one attempt. A pass moves the application to officer review; a fail lets them retry. */
export async function submitUpload(token: string, file: Buffer): Promise<SubmitResult> {
  const u = await findUpload(token);
  if (!u) return { kind: "refused", reason: "not_found" };
  if ((await stateOf(u)) !== "open") return { kind: "refused", reason: "closed" };
  if (file.byteLength > MAX_UPLOAD_BYTES) return { kind: "refused", reason: "too_large" };

  // Decode server-side (the browser's file type is not trusted) and re-encode: this also
  // applies the camera's rotation and drops EXIF metadata such as GPS location.
  let jpeg: Buffer;
  try {
    const { format } = await sharp(file).metadata();
    if (!format || !["jpeg", "png", "webp", "heif"].includes(format)) return { kind: "refused", reason: "not_an_image" };
    jpeg = await sharp(file).rotate().jpeg({ quality: 90 }).toBuffer();
  } catch {
    return { kind: "refused", reason: "not_an_image" };
  }

  const check = u.kind === "photo" ? await checkPhoto(jpeg) : await checkScan(jpeg);
  const attempts = u.attempts + 1;
  const { data: app } = await db().from("applications").select("reference, status").eq("id", u.application_id).single();
  const path = `applications/${app?.reference ?? u.application_id}-${u.kind}-upload-${u.id}-${attempts}.jpg`;
  await putDocument(path, jpeg, "image/jpeg");

  // Compare-and-set on the attempt count, so two submits at once can't both count as the same attempt.
  const { data: updated } = await db()
    .from("uploads")
    .update({
      file_path: path,
      uploaded_at: new Date().toISOString(),
      attempts,
      check_passed: check.ok,
      check_detail: check.detail,
      check_requirements: check.requirements ?? [],
      review_status: check.ok ? "pending_review" : null,
    })
    .eq("id", u.id)
    .eq("attempts", u.attempts)
    .is("review_status", null)
    .select("id");
  if (!updated?.length) return { kind: "refused", reason: "closed" };

  await db().from("audit_log").insert({
    application_id: u.application_id,
    actor: "portal",
    event: check.ok ? "upload_passed_check" : "upload_failed_check",
    detail: { kind: u.kind, attempts, reason: check.ok ? undefined : check.detail },
  });
  if (check.ok && app && ["returned_fixable", "submitted"].includes(app.status)) {
    await db().from("applications").update({ status: "pending_review", updated_at: new Date().toISOString() }).eq("id", u.application_id);
  }

  return { kind: "checked", ok: check.ok, requirements: check.requirements ?? [], attemptsLeft: Math.max(0, MAX_UPLOAD_ATTEMPTS - attempts) };
}
