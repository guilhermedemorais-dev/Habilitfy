import { test, expect } from "@playwright/test";

test("fluxo completo: instrutor -> agendamento -> checkout -> sucesso", async ({
  page,
}) => {
  await page.goto("/instrutores");

  await page.getByRole("button", { name: "Lista" }).click();
  await expect(page.getByText("Instrutores Próximos")).toBeVisible();

  await page.locator('a[href^="/instrutor/"]').first().click();
  await expect(
    page.getByRole("button", { name: "Agendar Horário" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Agendar Horário" }).click();
  await expect(page.getByRole("heading", { name: "Agendar Aula" })).toBeVisible();

  await page.getByRole("button", { name: "Ir para Pagamento" }).click();
  await expect(page.getByText("Checkout Seguro")).toBeVisible();

  await page.getByRole("button", { name: /Gerar link de pagamento/i }).click();
  await expect(
    page.getByRole("heading", { name: /Agendamento Confirmado/i }),
  ).toBeVisible();
});
