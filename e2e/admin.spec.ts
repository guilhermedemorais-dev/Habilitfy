import { test, expect } from "@playwright/test";

test("admin panel loads integrations section", async ({ page }) => {
  await page.goto("/admin");

  await expect(page.getByText(/Integra/)).toBeVisible();
});
