import { expect, test } from "@playwright/test";
import { freshDemo, officer, openCase } from "./support";

test("Calls that break the rules are refused before dialling and logged", async ({ browser }) => {
  await freshDemo();
  const desk = await officer(browser);

  await test.step("Sarah never opted in to AI calls: the call is refused for consent", async () => {
    await openCase(desk, "Sarah Thomas");
    await desk.getByRole("button", { name: "Call phone" }).click();
    const outcome = desk.getByRole("status").filter({ hasText: "Call refused before dialling" });
    await expect(outcome).toContainText("Consent to AI calls");
  });

  await test.step("Maria's case is officer-only (a medical result): the AI never calls", async () => {
    await openCase(desk, "Maria Santos");
    await desk.getByRole("button", { name: "Call phone" }).click();
    const outcome = desk.getByRole("status").filter({ hasText: "Call refused before dialling" });
    await expect(outcome).toContainText("No officer-only issue");
  });

  await test.step("Both refusals are in the Blocked actions log", async () => {
    await desk.goto("/console/blocked");
    await expect(desk.locator("tr").filter({ hasText: "RA-260107" }).first()).toBeVisible();
    await expect(desk.locator("tr").filter({ hasText: "RA-260105" }).first()).toBeVisible();
  });
});
