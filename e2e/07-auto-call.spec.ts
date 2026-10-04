import { expect, test } from "@playwright/test";
import { applyAsRahul, autoCallTestMode, freshDemo, officer, openCase, portalLanguage } from "./support";

test("With auto-call on, the assistant calls by itself after a fixable check, and the officer can stop it", async ({ page, browser, baseURL }) => {
  await freshDemo();
  await portalLanguage(page, baseURL!, "en");
  const desk = await officer(browser);
  const autoCall = desk.getByRole("button", { name: /^Auto-call/ });
  let statusPath = "";

  await test.step("Auto-call starts off; turning it on asks first", async () => {
    await expect(autoCall).toHaveAttribute("aria-pressed", "false");
    await autoCall.click();
    await expect(desk.getByRole("button", { name: "Turn on auto-call" })).toBeVisible();
    await expect(desk.getByText(/for applications checked from now on/)).toBeVisible();
    await expect(desk.getByRole("button", { name: "Cancel" })).toBeFocused();
    await desk.getByRole("button", { name: "Turn on auto-call" }).click();
    await expect(autoCall).toHaveAttribute("aria-pressed", "true");
    await expect(autoCall).toBeFocused();
  });

  // From here no phone is rung: the tests' own switch marks due calls placed without dialling.
  await autoCallTestMode();

  await test.step("The applicant submits; the status page says when the assistant will call", async () => {
    statusPath = await applyAsRahul(page);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      /^Something needs fixing\. Our AI assistant will call you (shortly|today after 9:00|later today|tomorrow, between 9:00 and 18:00)\.$/,
    );
  });

  await test.step("The case shows the automatic call: placed now, or queued for calling hours", async () => {
    await openCase(desk, "Rahul Sarma");
    const line = desk.getByText("Automatic call:", { exact: true }).locator("..");
    await expect(line).toContainText(/Placed\s*At .* \(test mode: nobody was rung\)\.|Queued\s*For .*\./);
    await expect(desk.locator('section[aria-labelledby="case-history"]').getByText("Automatic call queued")).toBeVisible();
  });

  await test.step("The officer stops automatic calls for this case; the applicant is told an officer will arrange it", async () => {
    await desk.getByRole("button", { name: "Stop automatic calls" }).click();
    await expect(desk.getByText("Stopped for this case by an officer.")).toBeVisible();
    await page.goto(statusPath);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Something needs fixing. An officer will arrange a call with our AI assistant.");
  });

  await test.step("Turning auto-call off is immediate", async () => {
    await autoCall.click();
    await expect(autoCall).toHaveAttribute("aria-pressed", "false");
    await expect(desk.getByText("Auto-call is off. Calls start from the keys below.")).toBeVisible();
  });
});
