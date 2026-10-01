import { describe, expect, it } from "vitest";
import { addMonths, outcomeOf, runRules } from "./engine";
import type { PersonStatus, RuleInput } from "./types";

const cleanStatus: PersonStatus = {
  biometrics_done: true,
  medical_test_done: true,
  medical_flag: false,
  security_flag: false,
  prior_visa_active: false,
  unpaid_fines_aed: 0,
  contract_profession_code: "2121",
};

function input(overrides: Partial<RuleInput> = {}): RuleInput {
  return {
    form: {
      full_name: "Rahul Sharma",
      date_of_birth: "1991-04-12",
      passport_number: "Z1234567",
      passport_expiry: "2030-01-01",
      profession_code: "2121",
    },
    passport: {
      passport_number: "Z1234567",
      full_name: "RAHUL SHARMA",
      date_of_birth: "1991-04-12",
      expiry_date: "2030-01-01",
      nationality: "IND",
    },
    status: cleanStatus,
    photo: { ok: true, detail: "Photo meets requirements." },
    scan: null,
    today: "2026-10-01",
    ...overrides,
  };
}

const failed = (i: RuleInput) => runRules(i).filter((r) => !r.passed).map((r) => r.code);

describe("runRules", () => {
  it("passes a clean application and sends it to processing", () => {
    const results = runRules(input());
    expect(failed(input())).toEqual([]);
    expect(outcomeOf(results)).toBe("in_processing");
  });

  it("ignores case, spacing and punctuation in names", () => {
    expect(failed(input({ form: { ...input().form, full_name: "  rahul   sharma." } }))).toEqual([]);
  });

  it("flags a one-letter name mismatch as fixable by voice", () => {
    const results = runRules(input({ form: { ...input().form, full_name: "Rahul Sarma" } }));
    const r1 = results.find((r) => r.code === "R1")!;
    expect(r1).toMatchObject({ passed: false, type: "A", path: "fix_by_voice", field: "full_name" });
    expect(outcomeOf(results)).toBe("returned_fixable");
  });

  it("flags an unknown passport as an R3 problem", () => {
    expect(failed(input({ passport: null }))).toContain("R3");
  });

  it("applies the six-month passport rule at the boundary", () => {
    const sixMonths = addMonths("2026-10-01", 6); // 2027-04-01
    expect(failed(input({ form: { ...input().form, passport_expiry: sixMonths } }))).not.toContain("R8");
    expect(failed(input({ form: { ...input().form, passport_expiry: "2027-03-31" } }))).toContain("R8");
  });

  it("clamps month arithmetic to the end of the month", () => {
    expect(addMonths("2026-08-31", 6)).toBe("2027-02-28");
  });

  it("treats a medical or security flag as officer-only even with other fixable issues", () => {
    const results = runRules(input({
      form: { ...input().form, full_name: "Rahul Sarma" },
      status: { ...cleanStatus, medical_flag: true },
    }));
    expect(results.find((r) => r.code === "R12")).toMatchObject({ passed: false, type: "C", path: "officer_only" });
    expect(outcomeOf(results)).toBe("returned_officer");
  });

  it("never reveals the medical/security reason in the R12 detail", () => {
    const r12 = runRules(input({ status: { ...cleanStatus, security_flag: true } })).find((r) => r.code === "R12")!;
    expect(r12.detail.toLowerCase()).not.toMatch(/medical|security|hiv|tb|criminal/);
  });

  it("routes status issues (old visa, fines, profession code) rather than fixing them", () => {
    const results = runRules(input({
      form: { ...input().form, profession_code: "9999" },
      status: { ...cleanStatus, prior_visa_active: true, unpaid_fines_aed: 450 },
    }));
    for (const code of ["R9", "R10", "R11"]) {
      expect(results.find((r) => r.code === code)).toMatchObject({ passed: false, type: "B", path: "route" });
    }
  });

  it("reports a missing or bad photo as an upload problem", () => {
    expect(runRules(input({ photo: null })).find((r) => r.code === "R4")).toMatchObject({ passed: false, path: "upload" });
    expect(failed(input({ photo: { ok: false, detail: "Background is not plain white." } }))).toContain("R4");
  });
});
