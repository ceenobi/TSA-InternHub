import { test, expect } from "@playwright/test";
import { mockAuthSession } from "./auth-helpers";

test.describe("Hub Page (Authenticated)", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthSession(page);
    await page.goto("/hub");
    await page.waitForLoadState("networkidle");
  });

  test("renders the hub page", async ({ page }) => {
    await expect(page.locator("h1, h2").filter({ hasText: /hub|team|collaborat/i }).first()).toBeVisible();
  });

  test("does not redirect to login when authenticated", async ({ page }) => {
    await expect(page).not.toHaveURL(/\/auth\/login/);
    await expect(page).toHaveURL(/\/hub/);
  });
});
