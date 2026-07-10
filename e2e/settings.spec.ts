import { test, expect } from "@playwright/test";
import { mockAuthSession } from "./auth-helpers";

test.describe("Settings Page (Authenticated)", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthSession(page);
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");
  });

  test("renders the settings page", async ({ page }) => {
    await expect(page.locator("h1, h2").filter({ hasText: /setting|profile|account/i }).first()).toBeVisible();
  });

  test("does not redirect to login when authenticated", async ({ page }) => {
    await expect(page).not.toHaveURL(/\/auth\/login/);
    await expect(page).toHaveURL(/\/settings/);
  });
});
