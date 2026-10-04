import { expect, test } from "@playwright/test";
import { endTestCalls, freshDemo, officer, openCase, photo, portalLanguage, startCall, tool } from "./support";

test("A new photo by SMS link: a bad one is refused with the reason, a good one is approved by an officer", async ({ page, request, browser, baseURL }) => {
  await freshDemo();
  let linkPath = "";

  await test.step("On a call, the assistant texts Fatima an upload link", async () => {
    const call = await startCall("RA-260102");
    expect((await tool(request, call, "verify_identity", { application_reference: "RA-260102", date_of_birth: "1994-09-03" })).body.verified).toBe(true);
    expect((await tool(request, call, "send_upload_link", { kind: "photo" })).body.sent).toBe(true);
  });

  const desk = await officer(browser);

  await test.step("The text with the link is in the SMS outbox", async () => {
    await desk.goto("/console/sms");
    const text = await desk.locator("tr").filter({ hasText: "RA-260102" }).filter({ hasText: "/u/" }).first().innerText();
    linkPath = new URL(text.match(/https?:\/\/\S+\/u\/[\w-]+/)![0]).pathname;
  });

  await test.step("A photo on a blue background is refused, naming exactly what's wrong", async () => {
    await portalLanguage(page, baseURL!, "en");
    await page.goto(linkPath);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Take a new passport photo");
    await page.locator('input[type="file"]:not([capture])').setInputFiles(await photo("#7fa7d9"));
    await page.getByRole("button", { name: "Send for checking" }).click();
    await expect(page.getByText("Not accepted yet")).toBeVisible();
    const board = page.getByRole("region", { name: "What the photo needs" });
    await expect(board.locator("li").filter({ hasText: "Plain white background" })).toContainText("Fix");
    await expect(board.locator("li").filter({ hasText: "Upright" }).first()).toContainText("Pass");
    await expect(page.getByText("tries left")).toBeVisible();
  });

  await test.step("A photo on white passes the automatic check and waits for an officer", async () => {
    await page.locator('input[type="file"]:not([capture])').setInputFiles(await photo("#fbfbfb"));
    await page.getByRole("button", { name: "Send for checking" }).click();
    await expect(page.getByText("It passed the automatic check. An officer will confirm it before it replaces the old one.")).toBeVisible();
    // Coming back to the link later, its headline says where it stands.
    await page.reload();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Photo received");
  });

  await test.step("Officer compares old and new and approves the photo", async () => {
    await openCase(desk, "Fatima Hassan");
    const slip = desk.getByRole("article", { name: "New photo" });
    await slip.getByRole("button", { name: "Approve photo" }).click();
    await expect(slip).toContainText("The new photo is now on the application");
  });

  await test.step("The link now says the new photo is on the application, and is closed", async () => {
    await page.goto(linkPath);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Your new file is on your application");
    await expect(page.locator('input[type="file"]')).toHaveCount(0);
  });

  await endTestCalls();
});
