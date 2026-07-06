import { test, expect } from "@playwright/test";

test.describe("Login Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/auth/login");
    await page.waitForLoadState("networkidle");
  });

  test("renders the login page with title and form", async ({ page }) => {
    await expect(page).toHaveTitle(/Account Login/);
    await expect(page.getByRole("heading", { name: /login/i })).toBeVisible();
    await expect(page.getByPlaceholder(/enter email/i)).toBeVisible();
    await expect(page.getByPlaceholder(/enter password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /continue to dashboard/i })).toBeVisible();
  });

  test("contains links to register and account recovery", async ({ page }) => {
    await expect(page.getByRole("link", { name: /create an account/i })).toHaveAttribute("href", "/auth/register");
    await expect(page.getByRole("link", { name: /recover account/i })).toHaveAttribute("href", "/auth/account-recovery");
  });

  test("shows validation errors for empty form submission", async ({ page }) => {
    await page.getByRole("button", { name: /continue to dashboard/i }).click();
    await expect(page.getByText(/invalid/i).or(page.getByText(/required/i)).first()).toBeVisible();
  });

  test("shows validation error for invalid email", async ({ page }) => {
    await page.getByPlaceholder(/enter email/i).fill("not-an-email");
    await page.getByPlaceholder(/enter password/i).fill("ValidPass1!");
    await page.getByRole("button", { name: /continue to dashboard/i }).click();
    await expect(page.getByText(/invalid email/i).or(page.getByText(/valid/i)).first()).toBeVisible();
  });

  test("shows validation error for weak password", async ({ page }) => {
    await page.getByPlaceholder(/enter email/i).fill("test@example.com");
    await page.getByPlaceholder(/enter password/i).fill("short");
    await page.getByRole("button", { name: /continue to dashboard/i }).click();
    await expect(page.getByText(/character/i).or(page.getByText(/8/i)).first()).toBeVisible();
  });

  test("submitting valid form triggers login action", async ({ page }) => {
    const responsePromise = page.waitForResponse(
      (res) => res.url().includes("/auth/login") && res.request().method() === "POST"
    );
    await page.getByPlaceholder(/enter email/i).fill("test@example.com");
    await page.getByPlaceholder(/enter password/i).fill("ValidPass1!");
    await page.getByRole("button", { name: /continue to dashboard/i }).click();
    const response = await responsePromise;
    expect(response.status()).toBe(200);
  });
});
