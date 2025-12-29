import { test, expect } from "@playwright/test";

test("home shows hero and CTA", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: /Sua CNH/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Encontrar Instrutor/i }),
  ).toBeVisible();
});
