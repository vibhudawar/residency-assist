import { expect, test } from "@playwright/test";
import { freshDemo, startCall, tool } from "./support";

test("Only the right people get in: officers, verified callers, and signed webhooks", async ({ page, request }) => {
  await freshDemo();

  await test.step("Console pages send a signed-out visitor to sign-in", async () => {
    await page.goto("/console/cases/1");
    await expect(page).toHaveURL(/\/console\/signin$/);
  });

  await test.step("A wrong passcode is refused", async () => {
    await page.locator("#passcode").fill("not-the-passcode");
    await page.getByRole("button", { name: "Open the console" }).click();
    await expect(page.getByText("That passcode isn't right. Check it and try again.")).toBeVisible();
  });

  await test.step("Demo reset refuses anyone who isn't a signed-in officer", async () => {
    expect((await request.post("/api/demo/reset")).status()).toBe(401);
  });

  await test.step("Agent tools refuse a wrong tool secret and an unknown case token", async () => {
    const call = await startCall("RA-260106");
    expect((await tool(request, call, "get_case", {}, "not-the-secret")).status).toBe(401);
    expect((await tool(request, { ...call, token: "made-up-token" }, "get_case")).status).toBe(403);
  });

  await test.step("The post-call webhook refuses an unsigned record", async () => {
    const res = await request.post("/api/webhooks/elevenlabs", { data: { type: "post_call_transcription", data: {} } });
    expect([401, 503]).toContain(res.status());
  });

  await test.step("The auto-call dialler refuses anyone without the job's secret", async () => {
    expect((await request.post("/api/calls/run", { headers: { "x-cron-secret": "not-the-secret" } })).status()).toBe(401);
  });

  await test.step("A status link that isn't valid says so, with the way back", async () => {
    await page.goto("/apply/status/not-a-real-token");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("We couldn't find that page");
    await expect(page.getByRole("link", { name: "Go to the applicant portal" })).toBeVisible();
  });
});
