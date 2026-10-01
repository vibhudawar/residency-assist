/** A = agent can fix on the call, B = agent explains + routes, C = officer only, never an AI call. */
export type RuleType = "A" | "B" | "C";

export type RuleCode =
  | "R1" | "R2" | "R3" | "R4" | "R5" | "R6"
  | "R7" | "R8" | "R9" | "R10" | "R11" | "R12";

/** How the agent resolves a failed rule. */
export type ResolutionPath =
  | "fix_by_voice"
  | "upload"
  | "book_visit"
  | "route"
  | "officer_only";

/** Form fields an agent correction is allowed to change (the backend allowlist). */
export type CorrectableField = "full_name" | "date_of_birth" | "passport_number";

export interface ApplicationForm {
  full_name: string;
  date_of_birth: string; // YYYY-MM-DD
  passport_number: string;
  passport_expiry: string; // YYYY-MM-DD
  profession_code: string | null;
}

export interface PassportRecord {
  passport_number: string;
  full_name: string;
  date_of_birth: string;
  expiry_date: string;
  nationality: string;
}

export interface PersonStatus {
  biometrics_done: boolean;
  medical_test_done: boolean;
  medical_flag: boolean;
  security_flag: boolean;
  prior_visa_active: boolean;
  unpaid_fines_aed: number;
  contract_profession_code: string | null;
}

/** One requirement an image is checked against (lit as its own lamp on the upload page). */
export type ImageRequirement = "photo_size" | "photo_portrait" | "photo_background" | "scan_resolution" | "scan_sharpness";

/** Result of checking an uploaded image (computed separately, see image-check.ts). */
export interface ImageCheck {
  ok: boolean;
  /** The first failing requirement in plain words, or a pass message. */
  detail: string;
  /** Every requirement, checked independently so the applicant sees all of them at once. */
  requirements?: { key: ImageRequirement; ok: boolean }[];
}

export interface RuleInput {
  form: ApplicationForm;
  /** Registry record found for this applicant, or null if none could be matched. */
  passport: PassportRecord | null;
  status: PersonStatus | null;
  photo: ImageCheck | null;
  scan: ImageCheck | null;
  /** "Today" in YYYY-MM-DD, injected so the 6-month rule is testable. */
  today: string;
}

export interface RuleResult {
  code: RuleCode;
  type: RuleType;
  passed: boolean;
  path: ResolutionPath;
  /** The form field this rule concerns, when a voice correction can fix it. */
  field: CorrectableField | null;
  /** Plain-language explanation for the agent, officer and applicant. */
  detail: string;
}

export type Outcome = "in_processing" | "returned_fixable" | "returned_officer";
