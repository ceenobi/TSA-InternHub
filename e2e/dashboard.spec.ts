import { test, expect } from "@playwright/test";
import { mockAuthSession } from "./auth-helpers";

test.describe("Dashboard (Authenticated)", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthSession(page);
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
  });

  test("renders the dashboard page with welcome heading", async ({ page }) => {
    await expect(page.locator("h1, h2").filter({ hasText: /welcome back/i }).first()).toBeVisible();
  });

  test("displays stat cards", async ({ page }) => {
    const statCards = page.locator("[class*='card'], [class*='Card'], section > div").filter({ hasText: /tasks|score|rate|progress|users|submissions/i });
    const count = await statCards.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test("shows the sidebar navigation", async ({ page }) => {
    const sidebar = page.locator("nav, aside, [class*='sidebar'], [class*='Sidebar']").first();
    await expect(sidebar).toBeVisible();
  });

  test("shows the header", async ({ page }) => {
    const header = page.locator("header, [class*='header'], [class*='Header']").first();
    await expect(header).toBeVisible();
  });

  test("does not redirect to login when authenticated", async ({ page }) => {
    await expect(page).not.toHaveURL(/\/auth\/login/);
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
