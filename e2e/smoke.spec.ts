import { expect, test } from "@playwright/test";

test("unauthenticated visit redirects to login", async ({ page }) => {
  await page.goto("/");
  await page.waitForURL(/\/login(\?|$)/);
  await expect(page.getByRole("heading", { name: "Finance Tracker" })).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();
});
