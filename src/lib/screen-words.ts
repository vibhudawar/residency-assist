/**
 * Words for the screens shown when a page is loading, fails or doesn't exist, in both portal
 * languages. Browser-safe (error screens render in the browser), unlike the server-only i18n.ts.
 * Arabic follows the portal's register; Latin digits throughout (One Digit System).
 */
export const SCREEN_WORDS = {
  en: {
    loadingStatus: "Loading your application…",
    errorTitle: "This page didn't load",
    errorBody: "Something went wrong on our side, not with your application. Try again in a moment.",
    retry: "Try again",
    retrying: "Trying again…",
    toStart: "Back to the start",
    errorRef: "Error reference",
    notFoundTitle: "We couldn't find that page",
    notFoundBody: "The link may be mistyped, or it may no longer be valid. You can start again from the applicant portal.",
    toPortal: "Go to the applicant portal",
  },
  ar: {
    loadingStatus: "جارٍ تحميل طلبك…",
    errorTitle: "تعذّر تحميل هذه الصفحة",
    errorBody: "حدث خطأ من جهتنا، وليس في طلبك. حاول مرة أخرى بعد قليل.",
    retry: "حاول مرة أخرى",
    retrying: "جارٍ المحاولة…",
    toStart: "العودة إلى البداية",
    errorRef: "رقم مرجع الخطأ",
    notFoundTitle: "تعذّر العثور على هذه الصفحة",
    notFoundBody: "قد يكون الرابط مكتوبًا بشكل خاطئ أو لم يعد صالحًا. يمكنك البدء من جديد من بوابة المتقدمين.",
    toPortal: "الانتقال إلى بوابة المتقدمين",
  },
} as const;

export type ScreenLocale = keyof typeof SCREEN_WORDS;
