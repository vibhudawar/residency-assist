import "server-only";
import { db } from "@/lib/supabase/server";

type Lang = "en" | "ar" | "hi";

type Template = "returned_fixable" | "returned_officer" | "correction_approved" | "officer_will_contact";

const templates: Record<Template, Record<Lang, (ref: string) => string>> = {
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
  correction_approved: {
    en: (ref) => `Residency Assist (prototype): an officer approved the correction to application ${ref}. It is back in processing.`,
    ar: (ref) => `مساعد الإقامة (تجريبي): وافق الموظف المختص على تصحيح الطلب ${ref}، وعاد الطلب إلى المعالجة.`,
    hi: (ref) => `Residency Assist (प्रोटोटाइप): अधिकारी ने आवेदन ${ref} का सुधार मंज़ूर कर दिया है। आवेदन फिर से प्रोसेसिंग में है।`,
  },
  officer_will_contact: {
    en: (ref) => `Residency Assist (prototype): an officer needs to check application ${ref} with you. They will contact you.`,
    ar: (ref) => `مساعد الإقامة (تجريبي): يحتاج الموظف المختص إلى مراجعة الطلب ${ref} معك، وسيتواصل معك.`,
    hi: (ref) => `Residency Assist (प्रोटोटाइप): अधिकारी को आवेदन ${ref} के बारे में आपसे बात करनी है। वे आपसे संपर्क करेंगे।`,
  },
};

/** Writes one simulated SMS to the outbox, in the applicant's language. */
export async function sendSms(applicationId: number, template: Template) {
  const { data: app } = await db().from("applications").select("id, reference, phone, preferred_language").eq("id", applicationId).single();
  if (!app) return;
  const lang = (["en", "ar", "hi"].includes(app.preferred_language) ? app.preferred_language : "en") as Lang;
  await db().from("sms_outbox").insert({ application_id: app.id, to_phone: app.phone, body: templates[template][lang](app.reference) });
  await db().from("audit_log").insert({ application_id: app.id, actor: "system", event: "sms_sent", detail: { reason: template } });
}

/**
 * After the rules run: anyone the AI may NOT call (no consent, or officer-only issue)
 * gets today's channel — a plain SMS (simulated: written to the SMS outbox).
 * Opted-in applicants with fixable issues get the AI call instead.
 */
export async function notifyAfterCheck(applicationId: number) {
  const { data: app } = await db().from("applications").select("status, ai_call_consent").eq("id", applicationId).single();
  if (!app) return;

  const needsSms =
    app.status === "returned_officer" || (app.status === "returned_fixable" && !app.ai_call_consent);
  if (needsSms) await sendSms(applicationId, app.status as "returned_fixable" | "returned_officer");
}
