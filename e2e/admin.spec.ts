import { test, expect } from "@playwright/test";

test("admin panel loads integrations section", async ({ page }) => {
  const loginResponse = await page.request.get("/api/login?redirect=/admin");
  expect(loginResponse.ok()).toBeTruthy();

  const authResponse = await page.request.get("/api/auth/user");
  expect(authResponse.ok()).toBeTruthy();
  const authUser = await authResponse.json();
  expect(authUser.role).toBe("admin");

  await page.goto("/admin", { waitUntil: "domcontentloaded" });
  await page.waitForURL("**/admin", { timeout: 30_000 });
  await expect(page.getByRole("link", { name: "Integrações" })).toBeVisible();

  await page.getByRole("link", { name: "Integrações" }).click();
  await expect(
    page.getByRole("heading", { name: "Integrações e webhooks" }),
  ).toBeVisible();
});
