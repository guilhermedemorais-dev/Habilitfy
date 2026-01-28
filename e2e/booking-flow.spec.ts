import { test, expect } from "@playwright/test";

test("fluxo completo: instrutor -> agendamento -> checkout -> sucesso", async ({
  page,
}) => {
  await page.goto("/api/login");
  await page.goto("/instrutores");

  await page.getByRole("button", { name: "Lista" }).click();
  await expect(page.getByText("Instrutores Próximos")).toBeVisible();

  const instructorLink = page.locator('a[href^="/instrutor/"]').first();
  await expect(instructorLink).toBeVisible();
  const href = await instructorLink.getAttribute("href");
  if (!href) {
    throw new Error("Nenhum instrutor encontrado para o teste de agendamento.");
  }
  const instructorId = href.split("/").pop();
  await page.goto(href, { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("button", { name: "Agendar Horário" }),
  ).toBeVisible();

  if (instructorId) {
    let bookingStatus = 0;
    let bookingBody = "";
    let dateValue = "";
    let startTime = "";

    const availabilityRes = await page.request.get(
      `/api/instructors/${instructorId}/availability`,
    );
    let availability = availabilityRes.ok()
      ? ((await availabilityRes.json()) as Array<{
          dayOfWeek: number;
          startTime: string;
          endTime: string;
        }>)
      : [];

    if (availability.length === 0) {
      const seedDate = new Date();
      seedDate.setDate(seedDate.getDate() + 30);
      const seedSlot = {
        dayOfWeek: seedDate.getDay(),
        startTime: "08:00",
        endTime: "09:00",
      };
      await page.request.post(
        `/api/instructors/${instructorId}/availability`,
        { data: seedSlot },
      );
      availability = [seedSlot];
    }

    const slot = availability[0];
    const bookingDate = new Date();
    bookingDate.setDate(bookingDate.getDate() + 30);
    bookingDate.setHours(0, 0, 0, 0);

    while (bookingDate.getDay() !== slot.dayOfWeek) {
      bookingDate.setDate(bookingDate.getDate() + 1);
    }

    for (let attempt = 0; attempt < 5; attempt += 1) {
      dateValue = bookingDate.toISOString().split("T")[0];
      startTime = slot.startTime;

      const bookingsRes = await page.request.get(
        `/api/bookings/instructor/${instructorId}`,
      );
      const existingBookings = bookingsRes.ok()
        ? ((await bookingsRes.json()) as Array<{
            date: string;
            duration?: number | null;
            status?: string | null;
          }>)
        : [];

      const newStart = new Date(`${dateValue}T${startTime}:00`);
      const newEnd = new Date(newStart.getTime() + 50 * 60000);
      const hasConflict = existingBookings.some((booking) => {
        if (booking.status === "cancelled") return false;
        const bookingStart = new Date(booking.date);
        const bookingEnd = new Date(
          bookingStart.getTime() + (booking.duration || 60) * 60000,
        );
        return newStart < bookingEnd && newEnd > bookingStart;
      });

      if (!hasConflict) {
        break;
      }

      bookingDate.setDate(bookingDate.getDate() + 7);
    }

    if (!dateValue || !startTime) {
      throw new Error("Nao foi possivel encontrar horario disponivel para teste.");
    }

    await page.getByRole("button", { name: "Agendar Horário" }).click();
    await expect(
      page.getByRole("heading", { name: "Agendar Aula" }),
    ).toBeVisible();

    await page.getByLabel("Data").fill(dateValue);
    await page.getByLabel("Horário").selectOption({ value: startTime });

    const bookingResponsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes("/api/bookings") &&
        resp.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Ir para Pagamento" }).click();
    const bookingResponse = await bookingResponsePromise;
    bookingStatus = bookingResponse.status();
    bookingBody = await bookingResponse.text();

    if (bookingStatus !== 201) {
      console.log("Booking response:", bookingStatus, bookingBody);
    }
    expect(bookingStatus).toBe(201);
  }

  await expect(page.getByText("Checkout Seguro")).toBeVisible();

  await page.getByRole("button", { name: /Gerar link de pagamento/i }).click();
  await expect(
    page.getByRole("heading", { name: /Agendamento Confirmado/i }),
  ).toBeVisible();
});
