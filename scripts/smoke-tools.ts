/**
 * End-to-end guardrail smoke test for the agent tools, against the real database and a
 * running dev server. Plays the agent's part and tries to break the rules.
 *
 *   pnpm smoke:tools            (dev server must be running on BASE_URL, default :3006)
 *
 * Prints PASS/FAIL per check. Never prints secrets.
 */
import { openCallAttempt } from "@/lib/calls/predial";
import { resetDemo } from "@/lib/demo/reset";
import { db } from "@/lib/supabase/server";

const BASE_URL = process.env.SMOKE_BASE_URL ?? "http://localhost:3006";
const SECRET = process.env.TOOL_SHARED_SECRET ?? "";

let failures = 0;
function check(name: string, ok: boolean, got?: unknown) {
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : `  → got ${JSON.stringify(got)}`}`);
}

async function call(tool: string, caseToken: string, args: Record<string, unknown> = {}, secret = SECRET) {
  const res = await fetch(`${BASE_URL}/api/tools/${tool}`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-tool-secret": secret, "x-case-token": caseToken },
    body: JSON.stringify({ conversation_id: `smoke-${caseToken.slice(0, 8)}`, ...args }),
  });
  return { status: res.status, body: (await res.json()) as Record<string, unknown> };
}

async function appId(reference: string) {
  const { data } = await db().from("applications").select("id").eq("reference", reference).single();
  return data!.id as number;
}

async function main() {
  console.log("Resetting demo…");
  await resetDemo();

  // --- Pre-dial blocks ---------------------------------------------------
  const maria = await openCallAttempt(await appId("RA-260105"), { channel: "phone" });
  check("Maria (medical flag): AI call blocked", !maria.allowed && maria.checks.some((c) => c.name === "officer_only" && !c.passed), maria.checks);

  const sara = await openCallAttempt(await appId("RA-260107"), { channel: "phone" });
  check("Sara (no consent): AI call blocked", !sara.allowed && sara.checks.some((c) => c.name === "consent" && !c.passed), sara.checks);

  // --- Auth ----------------------------------------------------------------
  const ahmedId = await appId("RA-260106");
  const first = await openCallAttempt(ahmedId, { channel: "browser" });
  check("Ahmed: browser call allowed", first.allowed && !!first.caseToken, first.checks);
  const t1 = first.caseToken!;

  check("Wrong tool secret is rejected (401)", (await call("get_case", t1, {}, "not-the-secret")).status === 401);
  check("Unknown case token is rejected (403)", (await call("get_case", "made-up-token")).status === 403);

  // --- Verification gate -------------------------------------------------
  const early = await call("get_case", t1);
  check("get_case before verification is refused", early.body.reason === "not_verified", early.body);

  const v1 = await call("verify_identity", t1, { application_reference: "RA-260106", date_of_birth: "1985-02-11" });
  check("Form DOB (wrong) does not verify", v1.body.verified === false && v1.body.attempts_left === 1, v1.body);
  const v2 = await call("verify_identity", t1, { application_reference: "RA-999999", date_of_birth: "1985-02-14" });
  check("Second failure locks verification", v2.body.locked === true, v2.body);
  const v3 = await call("verify_identity", t1, { application_reference: "RA-260106", date_of_birth: "1985-02-14" });
  check("Locked call can't verify even with right details", v3.body.verified === false && v3.body.locked === true, v3.body);
  const lockedCase = await call("get_case", t1);
  check("…and still can't read the case", lockedCase.body.reason === "not_verified", lockedCase.body);

  // New call, correct details (reference spoken loosely).
  await db().from("call_attempts").update({ status: "completed" }).eq("case_token_hash", null).eq("application_id", ahmedId);
  await db().from("call_attempts").update({ status: "completed" }).eq("application_id", ahmedId).eq("status", "connected");
  const second = await openCallAttempt(ahmedId, { channel: "browser" });
  const t2 = second.caseToken!;
  const ok = await call("verify_identity", t2, { application_reference: "R A 2 6 0 1 0 6", date_of_birth: "1985-02-14" });
  check("Correct reference + true DOB verifies", ok.body.verified === true, ok.body);

  const kase = await call("get_case", t2);
  const issues = (kase.body.issues ?? []) as { rule: string }[];
  check("get_case lists the R2 date-of-birth issue", kase.body.ok === true && issues.some((i) => i.rule === "R2"), kase.body);

  // --- Correction guardrails ---------------------------------------------
  const unflagged = await call("submit_correction", t2, { field: "full_name", new_value: "Ahmed Rashid", caller_confirmed_read_back: true });
  check("Correcting an unflagged field is refused", unflagged.body.reason === "field_not_flagged", unflagged.body);

  const noReadBack = await call("submit_correction", t2, { field: "date_of_birth", new_value: "1985-02-14", caller_confirmed_read_back: false });
  check("Correction without read-back is refused", noReadBack.body.reason === "read_back_required", noReadBack.body);

  const wrongValue = await call("submit_correction", t2, { field: "date_of_birth", new_value: "1985-03-14", caller_confirmed_read_back: true });
  check("Value that still doesn't match the passport is refused", wrongValue.body.reason === "still_does_not_match", wrongValue.body);
  check("…without revealing the correct value", !JSON.stringify(wrongValue.body).includes("1985-02-14"), wrongValue.body);

  const good = await call("submit_correction", t2, { field: "date_of_birth", new_value: "1985-02-14", caller_confirmed_read_back: true });
  check("Correct value saved as pending officer review", good.body.status === "pending_officer_review", good.body);
  const again = await call("submit_correction", t2, { field: "date_of_birth", new_value: "1985-02-14", caller_confirmed_read_back: true });
  check("Same correction sent twice is stored once", again.body.correction_id === good.body.correction_id, again.body);

  const { data: corr } = await db().from("corrections").select("status").eq("application_id", ahmedId);
  check("Nothing is approved automatically", (corr ?? []).every((c) => c.status === "pending_review") && corr?.length === 1, corr);

  // --- Other paths ---------------------------------------------------------
  const priya = await openCallAttempt(await appId("RA-260103"), { channel: "browser" });
  const tp = priya.caseToken!;
  await call("verify_identity", tp, { application_reference: "RA-260103", date_of_birth: "1996-01-27" });
  const slots = await call("list_slots", tp, { purpose: "biometrics" });
  const slotList = (slots.body.slots ?? []) as { slot_id: number }[];
  check("Priya: two biometrics slots offered", slotList.length === 2, slots.body);
  const booked = await call("book_appointment", tp, { slot_id: slotList[0]?.slot_id });
  check("Priya: appointment booked", booked.body.ok === true && typeof booked.body.when === "string", booked.body);
  const noMedical = await call("list_slots", tp, { purpose: "medical" });
  check("Priya: can't book a step she doesn't need", noMedical.body.reason === "not_needed", noMedical.body);

  const fatima = await openCallAttempt(await appId("RA-260102"), { channel: "browser" });
  const tf = fatima.caseToken!;
  await call("verify_identity", tf, { application_reference: "RA-260102", date_of_birth: "1994-09-03" });
  const link = await call("send_upload_link", tf, { kind: "photo" });
  check("Fatima: upload link sent", link.body.sent === true, link.body);
  const { data: sms } = await db().from("sms_outbox").select("body").eq("application_id", await appId("RA-260102"));
  check("Fatima: SMS in outbox with a /u/ link", (sms ?? []).some((m) => m.body.includes("/u/")), sms);

  const optOut = await call("record_opt_out", tf);
  check("Opt-out recorded", optOut.body.ok === true, optOut.body);
  const afterOptOut = await openCallAttempt(await appId("RA-260104"), { channel: "phone" });
  check("Opt-out blocks later calls to that number", afterOptOut.checks.some((c) => c.name === "do_not_call" && !c.passed), afterOptOut.checks);

  const { count } = await db().from("blocked_actions").select("id", { count: "exact", head: true });
  check("Every refusal is in the blocked-actions log", (count ?? 0) >= 6, count);

  console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) failed.`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("Smoke test crashed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
