import { expect, test } from "@playwright/test";
import { portalLanguage } from "./support";

test("The applicant portal works in Arabic, right to left, and switches back", async ({ page, baseURL }) => {
  await test.step("In Arabic the page is right to left with Arabic text and the prototype banner", async () => {
    await portalLanguage(page, baseURL!, "ar");
    await page.goto("/apply");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("تقديم طلب تأشيرة إقامة");
    await expect(page.getByText("نموذج تجريبي")).toBeVisible();
  });

  await test.step("The language switch returns to English, left to right", async () => {
    await page.getByRole("button", { name: "English" }).click();
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Apply for a residence visa");
  });
});
