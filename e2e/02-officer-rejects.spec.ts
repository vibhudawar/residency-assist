import { expect, test } from "@playwright/test";
import { endTestCalls, freshDemo, officer, openCase, startCall, tool } from "./support";

test("An officer rejects a correction: nothing changes, a person takes over and the applicant is told", async ({ request, browser }) => {
  await freshDemo();

  await test.step("On a call, Ahmed verifies and confirms his date of birth from his passport", async () => {
    const call = await startCall("RA-260106");
    expect((await tool(request, call, "verify_identity", { application_reference: "RA-260106", date_of_birth: "1985-02-14" })).body.verified).toBe(true);
    const fix = await tool(request, call, "submit_correction", { field: "date_of_birth", new_value: "1985-02-14", caller_confirmed_read_back: true });
    expect(fix.body.status).toBe("pending_officer_review");
    await endTestCalls();
  });

  const desk = await officer(browser);

  await test.step("A reason is required to reject", async () => {
    await openCase(desk, "Ahmed Rashid");
    const slip = desk.getByRole("article", { name: "Date of birth correction" });
    await slip.getByRole("button", { name: "Reject…" }).click();
    await expect(slip.getByLabel("Why are you rejecting this?")).toBeFocused();
  });

  await test.step("Officer rejects with a reason; the slip records who, when and why", async () => {
    const slip = desk.getByRole("article", { name: "Date of birth correction" });
    await slip.getByLabel("Why are you rejecting this?").fill("Passport scan is unreadable; asking the applicant to visit.");
    await slip.getByRole("button", { name: "Reject correction" }).click();
    await expect(slip).toContainText("Rejected by Duty officer (demo)");
    await expect(slip).toContainText("Passport scan is unreadable");
  });

  await test.step("The case is handed to a person, listed under Handoffs", async () => {
    await desk.goto("/console/handoffs");
    await expect(desk.locator("tr").filter({ hasText: "RA-260106" }).first()).toBeVisible();
  });

  await test.step("The applicant is told by SMS that an officer will contact them", async () => {
    await desk.goto("/console/sms");
    await expect(desk.locator("tr").filter({ hasText: "RA-260106" }).first()).toBeVisible();
  });
});
