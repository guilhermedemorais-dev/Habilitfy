// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  AdminBookingsSection,
  type AdminBookingRecord,
} from "./AdminBookingsSection";

const formatPersonName = (person?: {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
} | null) => {
  if (!person) return "—";
  return [person.firstName, person.lastName].filter(Boolean).join(" ") || person.email || "—";
};

const formatCurrency = (value: number | string | null | undefined) =>
  String(value ?? "—");

const bookings: AdminBookingRecord[] = [
  {
    booking: {
      id: "bk-1",
      status: "pending",
      totalPrice: "120",
    },
    student: {
      firstName: "Ana",
      lastName: "Silva",
      email: "ana@example.com",
    },
    instructorUser: {
      firstName: "Bruno",
      lastName: "Souza",
      email: "bruno@example.com",
    },
  },
  {
    booking: {
      id: "bk-2",
      status: "completed",
      totalPrice: "200",
    },
    student: {
      firstName: "Carla",
      lastName: "Lima",
      email: "carla@example.com",
    },
    instructorUser: {
      firstName: "Diego",
      lastName: "Paz",
      email: "diego@example.com",
    },
  },
];

describe("AdminBookingsSection", () => {
  it("filters bookings with the shared search term", () => {
    render(
      <AdminBookingsSection
        bookings={bookings}
        isUnauthorized={false}
        bookingsLoading={false}
        bookingsError={null}
        searchTerm="diego"
        formatPersonName={formatPersonName}
        formatCurrency={formatCurrency}
        onRefresh={() => {}}
      />,
    );

    expect(screen.getByText("bk-2")).toBeTruthy();
    expect(screen.queryByText("bk-1")).toBeNull();
    expect(screen.getByText("Concluido")).toBeTruthy();
  });

  it("triggers the refresh action", () => {
    const onRefresh = vi.fn();

    render(
      <AdminBookingsSection
        bookings={bookings}
        isUnauthorized={false}
        bookingsLoading={false}
        bookingsError={null}
        searchTerm=""
        formatPersonName={formatPersonName}
        formatCurrency={formatCurrency}
        onRefresh={onRefresh}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /recarregar/i }));

    expect(onRefresh).toHaveBeenCalledTimes(1);
  });
});
