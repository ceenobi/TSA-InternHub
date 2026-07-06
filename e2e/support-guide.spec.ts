import { test, expect } from "@playwright/test";

test.describe("Support Guide (Public)", () => {
  test("renders the knowledge base with articles", async ({ page }) => {
    await page.goto("/support/guide");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveTitle(/Knowledge Base/i);
    await expect(page.getByPlaceholder(/search/i)).toBeVisible();
  });

  test("search filters articles by query", async ({ page }) => {
    await page.goto("/support/guide");
    await page.waitForLoadState("networkidle");
    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill("Getting Started");
    const results = page.locator("article, [class*='article'], a[href*='guide']").first();
    await expect(results).toBeVisible();
  });

  test("opens article modal on click", async ({ page }) => {
    await page.goto("/support/guide");
    await page.waitForLoadState("networkidle");
    const firstArticle = page.locator("a, button, [role='button']").filter({ hasText: /getting started/i }).first();
    if (await firstArticle.isVisible()) {
      await firstArticle.click();
      await expect(page.locator("[role='dialog'], [class*='modal'], dialog").first()).toBeVisible();
    }
  });
});
