import { addMonths } from "@/lib/rules/engine";
import type { PassportRecord, PersonStatus } from "@/lib/rules/types";
import { PHOTO_BLUE, PHOTO_WHITE } from "./photos";

/** One fictional demo person: what the registry says, and (optionally) what they typed. */
export interface DemoPerson {
  key: string;
  /** Shown in the console so the presenter knows which story this is. */
  story: string;
  passport: PassportRecord;
  status: PersonStatus;
  /** If set, an application is pre-seeded into the inbox. Rahul has none: he applies live on the portal. */
  application?: {
    reference: string;
    full_name: string;
    date_of_birth: string;
    passport_number: string;
    passport_expiry: string;
    profession_code: string | null;
    preferred_language: "en" | "ar" | "hi";
    ai_call_consent: boolean;
    photo_background: string;
  };
}

const clean: PersonStatus = {
  biometrics_done: true,
  medical_test_done: true,
  medical_flag: false,
  security_flag: false,
  prior_visa_active: false,
  unpaid_fines_aed: 0,
  contract_profession_code: "2149",
};

/** All names, numbers and dates are fictional. `today` keeps the passport-expiry story correct over time. */
export function demoPeople(today: string): DemoPerson[] {
  const soon = addMonths(today, 3); // passport expiring inside the 6-month window
  const later = "2032-03-31";

  return [
    {
      key: "rahul",
      story: "Main story — applies live on the portal with a name typo (R1), fixed by voice",
      passport: { passport_number: "Z4471820", full_name: "RAHUL SHARMA", date_of_birth: "1991-04-12", expiry_date: later, nationality: "IND" },
      status: clean,
    },
    {
      key: "fatima",
      story: "Photo background not white (R4) → secure upload link · Arabic",
      passport: { passport_number: "A20583316", full_name: "FATIMA HASSAN", date_of_birth: "1994-09-03", expiry_date: later, nationality: "EGY" },
      status: clean,
      application: {
        reference: "RA-260102", full_name: "Fatima Hassan", date_of_birth: "1994-09-03",
        passport_number: "A20583316", passport_expiry: later, profession_code: "2149",
        preferred_language: "ar", ai_call_consent: true, photo_background: PHOTO_BLUE,
      },
    },
    {
      key: "priya",
      story: "Biometrics not done (R6) → books an Amer visit · Hindi",
      passport: { passport_number: "V8812045", full_name: "PRIYA VERMA", date_of_birth: "1996-01-27", expiry_date: later, nationality: "IND" },
      status: { ...clean, biometrics_done: false },
      application: {
        reference: "RA-260103", full_name: "Priya Verma", date_of_birth: "1996-01-27",
        passport_number: "V8812045", passport_expiry: later, profession_code: "2149",
        preferred_language: "hi", ai_call_consent: true, photo_background: PHOTO_WHITE,
      },
    },
    {
      key: "imran",
      story: "Previous visa still active (R9) → explains + routes to sponsor",
      passport: { passport_number: "BK3390217", full_name: "IMRAN KHAN", date_of_birth: "1988-11-19", expiry_date: later, nationality: "PAK" },
      status: { ...clean, prior_visa_active: true },
      application: {
        reference: "RA-260104", full_name: "Imran Khan", date_of_birth: "1988-11-19",
        passport_number: "BK3390217", passport_expiry: later, profession_code: "2149",
        preferred_language: "en", ai_call_consent: true, photo_background: PHOTO_WHITE,
      },
    },
    {
      key: "maria",
      story: "Medical flag (R12) → AI call BLOCKED, officer only",
      passport: { passport_number: "P7741902", full_name: "MARIA SANTOS", date_of_birth: "1990-06-08", expiry_date: later, nationality: "PHL" },
      status: { ...clean, medical_flag: true },
      application: {
        reference: "RA-260105", full_name: "Maria Santos", date_of_birth: "1990-06-08",
        passport_number: "P7741902", passport_expiry: later, profession_code: "2149",
        preferred_language: "en", ai_call_consent: true, photo_background: PHOTO_WHITE,
      },
    },
    {
      key: "ahmed",
      story: "Wrong date of birth on form (R2) — demo: someone else answers → nothing revealed · Arabic",
      passport: { passport_number: "N55014873", full_name: "AHMED RASHID", date_of_birth: "1985-02-14", expiry_date: later, nationality: "JOR" },
      status: clean,
      application: {
        reference: "RA-260106", full_name: "Ahmed Rashid", date_of_birth: "1985-02-11",
        passport_number: "N55014873", passport_expiry: later, profession_code: "2149",
        preferred_language: "ar", ai_call_consent: true, photo_background: PHOTO_WHITE,
      },
    },
    {
      key: "sara",
      story: "Name typo (R1) but NO consent → no AI call, SMS instead",
      passport: { passport_number: "M2209761", full_name: "SARA THOMAS", date_of_birth: "1993-12-02", expiry_date: later, nationality: "IND" },
      status: clean,
      application: {
        reference: "RA-260107", full_name: "Sarah Thomas", date_of_birth: "1993-12-02",
        passport_number: "M2209761", passport_expiry: later, profession_code: "2149",
        preferred_language: "en", ai_call_consent: false, photo_background: PHOTO_WHITE,
      },
    },
    {
      key: "arjun",
      story: "Two problems: passport expiring (R8) + photo (R4) → one call covers both",
      passport: { passport_number: "U6603158", full_name: "ARJUN PATEL", date_of_birth: "1989-07-21", expiry_date: soon, nationality: "IND" },
      status: clean,
      application: {
        reference: "RA-260108", full_name: "Arjun Patel", date_of_birth: "1989-07-21",
        passport_number: "U6603158", passport_expiry: soon, profession_code: "2149",
        preferred_language: "en", ai_call_consent: true, photo_background: PHOTO_BLUE,
      },
    },
  ];
}

export const AMER_CENTRES = ["Amer Centre — Al Barsha", "Amer Centre — Deira"] as const;
export const SLOT_TIMES = ["09:30", "11:00", "14:30"] as const;
