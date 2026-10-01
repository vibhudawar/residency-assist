import type {
  CorrectableField,
  Outcome,
  ResolutionPath,
  RuleCode,
  RuleInput,
  RuleResult,
  RuleType,
} from "./types";

/** Normalise a name for comparison: case, spacing and punctuation don't matter. */
export function normaliseName(name: string): string {
  return name
    .normalize("NFKC")
    .toUpperCase()
    .replace(/[^\p{L}\p{N} ]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalisePassportNumber(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/** Adds whole months to a YYYY-MM-DD date (UTC), clamping to month end. */
export function addMonths(isoDate: string, months: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const target = new Date(Date.UTC(y, m - 1 + months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(d, lastDay));
  return target.toISOString().slice(0, 10);
}

function result(
  code: RuleCode,
  type: RuleType,
  path: ResolutionPath,
  field: CorrectableField | null,
  passed: boolean,
  detail: string,
): RuleResult {
  return { code, type, path, field, passed, detail };
}

/**
 * Runs the 12 residency-application rules against the mock ICP/GDRFA records.
 * Pure function: no I/O, so it is fully unit-testable.
 */
export function runRules(input: RuleInput): RuleResult[] {
  const { form, passport, status, photo, scan, today } = input;
  const out: RuleResult[] = [];

  // --- Identity data vs passport registry (type A, fixable by voice) -------
  if (!passport) {
    out.push(result("R3", "A", "fix_by_voice", "passport_number", false,
      "The passport number does not match any passport on record."));
  } else {
    const nameOk = normaliseName(form.full_name) === normaliseName(passport.full_name);
    out.push(result("R1", "A", "fix_by_voice", "full_name", nameOk, nameOk
      ? "Name matches the passport."
      : "The name on the form is spelled differently from the name on the passport."));

    const dobOk = form.date_of_birth === passport.date_of_birth;
    out.push(result("R2", "A", "fix_by_voice", "date_of_birth", dobOk, dobOk
      ? "Date of birth matches the passport."
      : "The date of birth on the form does not match the passport."));

    const numberOk = normalisePassportNumber(form.passport_number) === normalisePassportNumber(passport.passport_number);
    out.push(result("R3", "A", "fix_by_voice", "passport_number", numberOk, numberOk
      ? "Passport number matches."
      : "The passport number on the form has a typo compared with the passport on record."));
  }

  // --- Uploaded documents (type A, fixable by re-upload) -------------------
  out.push(result("R4", "A", "upload", null, photo?.ok ?? false,
    photo ? photo.detail : "No photo was uploaded."));
  out.push(result("R5", "A", "upload", null, scan?.ok ?? true,
    scan ? scan.detail : "No passport scan required for this application."));

  // --- Pending in-person steps (type A, fixable by booking a visit) --------
  if (status) {
    out.push(result("R6", "A", "book_visit", null, status.biometrics_done, status.biometrics_done
      ? "Emirates ID biometrics are done."
      : "Emirates ID biometrics (fingerprints and photo) have not been done yet."));
    out.push(result("R7", "A", "book_visit", null, status.medical_test_done, status.medical_test_done
      ? "Medical fitness test is done."
      : "The medical fitness test has not been done yet."));
  }

  // --- Passport validity (type B: applicant must renew first) --------------
  const validEnough = form.passport_expiry >= addMonths(today, 6);
  out.push(result("R8", "B", "route", null, validEnough, validEnough
    ? "Passport is valid for at least six more months."
    : "The passport expires in less than six months. It must be renewed before the visa can be issued."));

  if (status) {
    // --- Status issues (type B: someone else must act) ---------------------
    out.push(result("R9", "B", "route", null, !status.prior_visa_active, !status.prior_visa_active
      ? "No active previous visa."
      : "A previous UAE residence visa is still active. The previous sponsor must cancel it first."));

    const fines = status.unpaid_fines_aed;
    out.push(result("R10", "B", "route", null, fines <= 0, fines <= 0
      ? "No unpaid fines."
      : `There are unpaid fines of AED ${fines.toFixed(2)}. They must be paid through the official channels first.`));

    const code = status.contract_profession_code;
    const codeOk = !code || !form.profession_code || code === form.profession_code;
    out.push(result("R11", "B", "route", null, codeOk, codeOk
      ? "Profession code matches the labour contract."
      : "The profession code does not match the labour contract. The employer must correct it."));

    // --- Medical / security (type C: officer only, never an AI call) -------
    const flagged = status.medical_flag || status.security_flag;
    out.push(result("R12", "C", "officer_only", null, !flagged, flagged
      ? "This application needs review by an officer."   // deliberately vague — never disclosed by the agent
      : "No medical or security review needed."));
  }

  return out;
}

/** Overall outcome: any type C failure wins, then any other failure, else all clear. */
export function outcomeOf(results: RuleResult[]): Outcome {
  const failed = results.filter((r) => !r.passed);
  if (failed.some((r) => r.type === "C")) return "returned_officer";
  if (failed.length > 0) return "returned_fixable";
  return "in_processing";
}
