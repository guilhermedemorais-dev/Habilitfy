import { test, expect } from "@playwright/test";

test("admin panel loads integrations section", async ({ page }) => {
  await page.goto("/api/login");
  await page.goto("/admin", { waitUntil: "domcontentloaded" });

  await page.getByRole("link", { name: "Integrações" }).click();
  await expect(
    page.getByRole("heading", { name: "Integrações e webhooks" }),
  ).toBeVisible();
});
