"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createApplication } from "@/lib/applications/create";
import { PHOTO_BLUE, PHOTO_WHITE, silhouettePhoto } from "@/lib/demo/photos";
import { env } from "@/lib/env";
import { LOCALE_COOKIE, type Locale } from "@/lib/i18n";
import { forLog, sha256 } from "@/lib/security";
import { clearSession, getSession, setSession } from "@/lib/session";
import { db } from "@/lib/supabase/server";

const FALLBACK_DEMO_MOBILE = "+971500000000";
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
const PHOTO_MAX_BYTES = 5 * 1024 * 1024;

/** Only same-site paths may be used as a return target. */
function validatePath(path: unknown): string {
  return typeof path === "string" && /^\/(?!\/)[A-Za-z0-9/_\-?=&.]*$/.test(path) ? path : "/apply";
}

export async function setLanguage(formData: FormData) {
  const locale: Locale = formData.get("locale") === "ar" ? "ar" : "en";
  (await cookies()).set(LOCALE_COOKIE, locale, { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 365 });
  redirect(validatePath(formData.get("returnTo")));
}

/** Mock UAE PASS: stands in for the OAuth round-trip and returns a verified mobile. */
export async function signInWithMockUaePass() {
  await setSession({
    sub: "mock-uaepass-demo-applicant",
    displayName: "Demo applicant",
    mobile: env().DEMO_PHONE_NUMBER ?? FALLBACK_DEMO_MOBILE,
    issuedAt: Date.now(),
  });
  redirect("/apply/new");
}

export async function signOut() {
  await clearSession();
  redirect("/apply");
}

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const applicationSchema = z.object({
  full_name: z.string().trim().min(2).max(120),
  date_of_birth: isoDate,
  passport_number: z.string().trim().min(5).max(20),
  passport_expiry: isoDate,
  profession_code: z.string().trim().max(10).optional().transform((v) => (v ? v : null)),
  preferred_language: z.enum(["en", "ar", "hi"]),
  ai_call_consent: z.literal("on").optional(),
  photo_sample: z.enum(["", "white", "blue"]).optional(),
});

export type FieldError = "required" | "date" | "photo" | "photoType";
export interface SubmitState {
  errors?: Partial<Record<keyof z.infer<typeof applicationSchema> | "photo", FieldError>>;
  formError?: "generic";
}

export async function submitApplication(_prev: SubmitState, formData: FormData): Promise<SubmitState> {
  const session = await getSession();
  if (!session) redirect("/apply");

  const parsed = applicationSchema.safeParse(Object.fromEntries(formData.entries()));
  const errors: SubmitState["errors"] = {};
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof NonNullable<SubmitState["errors"]>;
      errors[key] = key === "date_of_birth" || key === "passport_expiry" ? "date" : "required";
    }
  }

  // Photo: an uploaded file, or one of the two sample photos.
  const file = formData.get("photo");
  const sample = formData.get("photo_sample");
  let photo: { body: Buffer; contentType: string } | null = null;
  if (file instanceof File && file.size > 0) {
    if (!PHOTO_TYPES.includes(file.type) || file.size > PHOTO_MAX_BYTES) errors.photo = "photoType";
    else photo = { body: Buffer.from(await file.arrayBuffer()), contentType: file.type };
  } else if (sample === "white" || sample === "blue") {
    photo = { body: await silhouettePhoto(sample === "white" ? PHOTO_WHITE : PHOTO_BLUE), contentType: "image/jpeg" };
  } else {
    errors.photo = "photo";
  }

  if (!parsed.success || Object.keys(errors).length > 0 || !photo) return { errors };

  let statusToken: string;
  try {
    const created = await createApplication(
      {
        full_name: parsed.data.full_name,
        date_of_birth: parsed.data.date_of_birth,
        passport_number: parsed.data.passport_number,
        passport_expiry: parsed.data.passport_expiry,
        profession_code: parsed.data.profession_code,
        phone: session.mobile,
        preferred_language: parsed.data.preferred_language,
        ai_call_consent: parsed.data.ai_call_consent === "on",
      },
      photo,
    );
    statusToken = created.statusToken;
  } catch (err) {
    const message = err instanceof Error ? forLog(err.message) : "unknown error";
    console.error("submit application failed", message);
    return { formError: "generic" };
  }
  redirect(`/apply/status/${statusToken}?checked=1`);
}

/** Applicant withdraws AI-call consent from their status page. */
export async function withdrawConsent(formData: FormData) {
  const token = formData.get("token");
  if (typeof token !== "string" || !/^[A-Za-z0-9_-]{16,64}$/.test(token)) redirect("/apply");
  const { data } = await db()
    .from("applications")
    .update({ ai_call_consent: false, updated_at: new Date().toISOString() })
    .eq("status_token_hash", sha256(token))
    .select("id")
    .maybeSingle();
  if (data) {
    await db().from("audit_log").insert({ application_id: data.id, actor: "portal", event: "consent_withdrawn", detail: {} });
  }
  redirect(`/apply/status/${token}`);
}
