import { test, expect } from "@playwright/test";

test("home shows hero and CTA", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: /Mais liberdade para aprender/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Sou aluno/i }).first(),
  ).toBeVisible();
});
