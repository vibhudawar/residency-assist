import "server-only";
import { db } from "@/lib/supabase/server";

type Lang = "en" | "ar" | "hi";

const templates: Record<"returned_fixable" | "returned_officer", Record<Lang, (ref: string) => string>> = {
  returned_fixable: {
    en: (ref) => `Residency Assist (prototype): application ${ref} was returned for a correction. Sign in to see what needs fixing.`,
    ar: (ref) => `مساعد الإقامة (تجريبي): أُعيد الطلب ${ref} لإجراء تصحيح. سجّل الدخول لمعرفة ما يجب تصحيحه.`,
    hi: (ref) => `Residency Assist (प्रोटोटाइप): आवेदन ${ref} सुधार के लिए लौटाया गया है। क्या ठीक करना है, देखने के लिए साइन इन करें।`,
  },
  returned_officer: {
    en: (ref) => `Residency Assist (prototype): application ${ref} is being reviewed by an officer. They will contact you.`,
    ar: (ref) => `مساعد الإقامة (تجريبي): يراجع موظف مختص الطلب ${ref} وسيتواصل معك.`,
    hi: (ref) => `Residency Assist (प्रोटोटाइप): आवेदन ${ref} की समीक्षा एक अधिकारी कर रहे हैं। वे आपसे संपर्क करेंगे।`,
  },
};

/**
 * After the rules run: anyone the AI may NOT call (no consent, or officer-only issue)
 * gets today's channel — a plain SMS (simulated: written to the SMS outbox).
 * Opted-in applicants with fixable issues get the AI call instead.
 */
export async function notifyAfterCheck(applicationId: number) {
  const { data: app } = await db()
    .from("applications")
    .select("id, reference, phone, status, ai_call_consent, preferred_language")
    .eq("id", applicationId)
    .single();
  if (!app) return;

  const needsSms =
    app.status === "returned_officer" || (app.status === "returned_fixable" && !app.ai_call_consent);
  if (!needsSms) return;

  const lang = (["en", "ar", "hi"].includes(app.preferred_language) ? app.preferred_language : "en") as Lang;
  const body = templates[app.status as "returned_fixable" | "returned_officer"][lang](app.reference);
  await db().from("sms_outbox").insert({ application_id: app.id, to_phone: app.phone, body });
  await db().from("audit_log").insert({ application_id: app.id, actor: "system", event: "sms_sent", detail: { reason: app.status } });
}
