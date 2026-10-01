/**
 * The words on the hall bar, in both languages. Kept out of i18n.ts (server-only) so screens that
 * must render in the browser, like error screens, carry the same banner and product mark.
 */
export const HALL_WORDS: Record<"en" | "ar", { banner: string; switchLanguage: string; product: string; hall: string }> = {
  en: {
    banner: "Prototype — not affiliated with GDRFA or ICP. All people and cases are fictional.",
    switchLanguage: "العربية",
    product: "Residency Assist",
    hall: "Residency service hall",
  },
  ar: {
    banner: "نموذج تجريبي — غير تابع للإدارة العامة للإقامة وشؤون الأجانب أو للهيئة الاتحادية للهوية. جميع الأشخاص والحالات خيالية.",
    switchLanguage: "English",
    product: "مساعد الإقامة",
    hall: "قاعة خدمات الإقامة",
  },
};
