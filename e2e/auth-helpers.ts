import type { Page } from "@playwright/test";

export const TEST_USER = {
  id: "test-user-id",
  name: "Test User",
  email: "test@example.com",
  role: "admin" as const,
  program: "full-stack",
};

export async function mockAuthSession(page: Page) {
  await page.route("**/api/auth/**", async (route) => {
    const url = route.request().url();
    if (route.request().method() === "GET" && url.includes("get-session")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          user: TEST_USER,
          session: { token: "mock-token", createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 86400000).toISOString() },
        }),
      });
    } else {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({}) });
    }
  });
}
