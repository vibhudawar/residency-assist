import { expect, test } from "@playwright/test";
import { endTestCalls, freshDemo, latestReference, officer, openCase, portalLanguage, postCallWebhook, startCall, tool, WEBHOOK_SECRET } from "./support";

test("A typo is fixed on the call, approved by an officer, and the applicant sees it", async ({ page, request, browser, baseURL }) => {
  await freshDemo();
  await portalLanguage(page, baseURL!, "en");
  let statusPath = "";
  let reference = "";

  await test.step("Applicant signs in, fills the form with a name typo, opts in to AI calls and submits", async () => {
    await page.goto("/apply");
    await page.getByRole("link", { name: "Sign in with UAE PASS" }).click();
    await page.getByRole("button", { name: "Allow and continue" }).click();
    await page.getByRole("button", { name: "Fill demo applicant details" }).click();
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Submit application" }).click();
    await page.waitForURL(/\/apply\/status\/[^/?]+/);
    statusPath = new URL(page.url()).pathname;
    reference = await latestReference("Rahul Sarma");
  });

  await test.step("The 12-rule check returns the name; with auto-call off, an officer arranges the call", async () => {
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Something needs fixing. An officer will arrange a call with our AI assistant.");
    await expect(page.locator("main li").filter({ hasText: "R1" }).first()).toBeVisible();
  });

  const call = await startCall(reference);

  await test.step("Assistant can't read the case before the caller is verified", async () => {
    const early = await tool(request, call, "get_case");
    expect(early.body.reason).toBe("not_verified");
  });

  await test.step("Caller verifies with reference and date of birth; the case lists the name issue", async () => {
    const verified = await tool(request, call, "verify_identity", { application_reference: reference, date_of_birth: "1991-04-12" });
    expect(verified.body.verified).toBe(true);
    const kase = await tool(request, call, "get_case");
    expect((kase.body.issues as { rule: string }[]).map((i) => i.rule)).toContain("R1");
  });

  await test.step("Caller confirms the read-back; mid-call the applicant sees the call and the pending correction", async () => {
    const fix = await tool(request, call, "submit_correction", { field: "full_name", new_value: "Rahul Sharma", caller_confirmed_read_back: true });
    expect(fix.body.status).toBe("pending_officer_review");
    await page.goto(statusPath);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Our AI assistant is calling you now.");
    await expect(page.getByText("waiting for officer approval")).toBeVisible();
  });

  const desk = await officer(browser);

  // Needs ELEVENLABS_WEBHOOK_SECRET in .env (the app refuses unsigned records); otherwise the call is simply ended.
  if (WEBHOOK_SECRET) {
    await test.step("The call ends: ElevenLabs' signed post-call record shows in Call records with its latency", async () => {
      expect(await postCallWebhook(request, call, "en")).toBe(200);
      await desk.goto("/console/records");
      const record = desk.locator("article").filter({ hasText: reference });
      await expect(record).toContainText("Goal met");
      await expect(record).toContainText("480 ms");
    });
  } else {
    await endTestCalls();
  }

  await test.step("After the call, the applicant sees the correction waiting for an officer", async () => {
    await page.goto(statusPath);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Your correction is waiting for an officer to approve it.");
  });

  await test.step("Officer opens the case and approves the correction", async () => {
    await openCase(desk, "Rahul Sarma");
    const slip = desk.getByRole("article", { name: "Full name correction" });
    await expect(slip).toContainText("Rahul Sharma");
    await slip.getByRole("button", { name: "Approve correction" }).click();
    await expect(slip).toContainText("Approved by Duty officer (demo)");
  });

  await test.step("Applicant's status page shows the approval and the application moves to processing", async () => {
    await page.goto(statusPath);
    await expect(page.getByText("approved", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Nothing to fix. Your application is in processing.");
  });

  await test.step("The applicant is told by SMS, logged in the outbox", async () => {
    await desk.goto("/console/sms");
    await expect(desk.locator("tr").filter({ hasText: reference }).first()).toBeVisible();
  });

  await endTestCalls();
});
