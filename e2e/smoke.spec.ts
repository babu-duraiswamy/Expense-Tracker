import { expect, test } from "@playwright/test";

test("home page loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Finance Tracker" })).toBeVisible();
  await expect(page.getByTestId("format-check")).toHaveText("₹1,23,456.00");
});
