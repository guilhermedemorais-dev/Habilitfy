// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  AdminInstructorSection,
  type AdminInstructorRecord,
} from "./AdminInstructorSection";

const formatPersonName = (person?: {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
} | null) => {
  if (!person) return "—";
  return [person.firstName, person.lastName].filter(Boolean).join(" ") || person.email || "—";
};

const instructors: AdminInstructorRecord[] = [
  {
    id: "inst-1",
    userId: "user-1",
    status: "pending",
    vehicleModel: "Gol",
    credentialNumber: "ABC-123",
    createdAt: "2026-03-01T00:00:00.000Z",
    user: {
      firstName: "Ana",
      lastName: "Silva",
      email: "ana@example.com",
      isBlocked: false,
    },
  },
  {
    id: "inst-2",
    userId: "user-2",
    status: "approved",
    vehicleModel: "Civic",
    credentialNumber: "XYZ-999",
    createdAt: "2026-03-01T00:00:00.000Z",
    user: {
      firstName: "Bruno",
      lastName: "Souza",
      email: "bruno@example.com",
      isBlocked: true,
    },
  },
];

describe("AdminInstructorSection", () => {
  it("filters instructors with the shared search term", () => {
    render(
      <AdminInstructorSection
        instructors={instructors}
        isUnauthorized={false}
        instructorsLoading={false}
        instructorsError={null}
        searchTerm="bruno"
        pendingCount={1}
        totalCount={2}
        formatPersonName={formatPersonName}
        onRefresh={() => {}}
        onReview={() => {}}
      />,
    );

    expect(screen.getByText("1 de 2")).toBeTruthy();
    expect(screen.getByText("Bruno Souza")).toBeTruthy();
    expect(screen.getByText("Instrutores pendentes (KYC)")).toBeTruthy();
    expect(screen.getAllByText("Ana Silva")).toHaveLength(1);
  });

  it("triggers review and refresh actions", () => {
    const onRefresh = vi.fn();
    const onReview = vi.fn();

    render(
      <AdminInstructorSection
        instructors={instructors}
        isUnauthorized={false}
        instructorsLoading={false}
        instructorsError={null}
        searchTerm=""
        pendingCount={1}
        totalCount={2}
        formatPersonName={formatPersonName}
        onRefresh={onRefresh}
        onReview={onReview}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /recarregar/i }));
    fireEvent.click(screen.getAllByRole("button", { name: "Revisar" })[0]);

    expect(onRefresh).toHaveBeenCalledTimes(1);
    expect(onReview).toHaveBeenCalledWith("user-1");
  });
});
