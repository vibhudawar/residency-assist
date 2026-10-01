import "server-only";
import { randomUUID } from "node:crypto";
import { normaliseName, normalisePassportNumber, outcomeOf, runRules } from "@/lib/rules/engine";
import { checkPhoto, checkScan } from "@/lib/rules/image-check";
import type { ImageCheck, PassportRecord, PersonStatus, RuleResult } from "@/lib/rules/types";
import { getDocument } from "@/lib/storage";
import { db } from "@/lib/supabase/server";
import { uaeToday } from "@/lib/time";

export interface ApplicationRow {
  id: number;
  reference: string;
  full_name: string;
  date_of_birth: string;
  passport_number: string;
  passport_expiry: string;
  profession_code: string | null;
  phone: string;
  preferred_language: "en" | "ar" | "hi";
  photo_path: string | null;
  scan_path: string | null;
  ai_call_consent: boolean;
  status: string;
}

/**
 * Finds the registry record for an application: by passport number first, then
 * (if the number has a typo) by date of birth + name.
 */
async function findPassport(app: ApplicationRow): Promise<PassportRecord | null> {
  const number = normalisePassportNumber(app.passport_number);
  const byNumber = await db().from("passport_records").select("*").eq("passport_number", number).maybeSingle();
  if (byNumber.data) return byNumber.data as PassportRecord;

  const byDob = await db().from("passport_records").select("*").eq("date_of_birth", app.date_of_birth);
  const target = normaliseName(app.full_name);
  return ((byDob.data ?? []) as PassportRecord[]).find((p) => normaliseName(p.full_name) === target) ?? null;
}

async function checkStored(path: string | null, check: (b: Buffer) => Promise<ImageCheck>): Promise<ImageCheck | null> {
  if (!path) return null;
  try {
    return await check(await getDocument(path));
  } catch {
    return { ok: false, detail: "The uploaded file could not be read. Please upload it again." };
  }
}

/** Runs the 12 rules, stores the results, and moves the application to its new status. */
export async function evaluateApplication(applicationId: number): Promise<{ results: RuleResult[]; status: string }> {
  const { data: app, error } = await db().from("applications").select("*").eq("id", applicationId).single();
  if (error || !app) throw new Error(`Application ${applicationId} not found`);
  const application = app as ApplicationRow;

  const passport = await findPassport(application);
  const status = passport
    ? ((await db().from("person_status").select("*").eq("passport_number", passport.passport_number).maybeSingle()).data as PersonStatus | null)
    : null;

  const results = runRules({
    form: application,
    passport,
    status,
    photo: await checkStored(application.photo_path, checkPhoto),
    scan: await checkStored(application.scan_path, checkScan),
    today: uaeToday(),
  });

  const runId = randomUUID();
  const { error: insertError } = await db().from("rule_results").insert(
    results.map((r) => ({
      application_id: application.id,
      rule_code: r.code,
      rule_type: r.type,
      passed: r.passed,
      field: r.field,
      detail: r.detail,
      run_id: runId,
    })),
  );
  if (insertError) throw new Error(`Saving rule results failed: ${insertError.message}`);

  const newStatus = outcomeOf(results);
  await db().from("applications").update({ status: newStatus, updated_at: new Date().toISOString() }).eq("id", application.id);
  await db().from("audit_log").insert({
    application_id: application.id,
    actor: "rules",
    event: "rules_checked",
    detail: { run_id: runId, outcome: newStatus, failed: results.filter((r) => !r.passed).map((r) => r.code) },
  });

  return { results, status: newStatus };
}

/** Latest rule run for an application (what the agent and console see). */
export async function latestRuleResults(applicationId: number) {
  const { data } = await db()
    .from("rule_results")
    .select("rule_code, rule_type, passed, field, detail, run_id, created_at")
    .eq("application_id", applicationId)
    .order("created_at", { ascending: false })
    .limit(24);
  const rows = data ?? [];
  const runId = rows[0]?.run_id;
  return rows.filter((r) => r.run_id === runId);
}
