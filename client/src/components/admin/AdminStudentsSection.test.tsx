// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  AdminStudentsSection,
  type AdminStudentRecord,
} from "./AdminStudentsSection";

const formatPersonName = (person?: AdminStudentRecord | null) => {
  if (!person) return "—";
  return [person.firstName, person.lastName].filter(Boolean).join(" ") || person.email || "—";
};

const students: AdminStudentRecord[] = [
  {
    id: "student-1",
    firstName: "Ana",
    lastName: "Silva",
    email: "ana@example.com",
    isBlocked: false,
    createdAt: "2026-03-01T00:00:00.000Z",
  },
  {
    id: "student-2",
    firstName: "Bruno",
    lastName: "Souza",
    email: "bruno@example.com",
    isBlocked: true,
    createdAt: "2026-03-01T00:00:00.000Z",
  },
];

describe("AdminStudentsSection", () => {
  it("filters the students list with the shared search term", () => {
    render(
      <AdminStudentsSection
        students={students}
        isUnauthorized={false}
        studentsLoading={false}
        studentsError={null}
        searchTerm="bruno"
        formatPersonName={formatPersonName}
        onReview={() => {}}
      />,
    );

    expect(screen.getByText("1 de 2")).toBeTruthy();
    expect(screen.getByText("Bruno Souza")).toBeTruthy();
    expect(screen.queryByText("Ana Silva")).toBeNull();
  });

  it("opens the review flow for a student", () => {
    const onReview = vi.fn();

    render(
      <AdminStudentsSection
        students={students}
        isUnauthorized={false}
        studentsLoading={false}
        studentsError={null}
        searchTerm=""
        formatPersonName={formatPersonName}
        onReview={onReview}
      />,
    );

    fireEvent.click(screen.getAllByRole("button", { name: "Revisar" })[0]);

    expect(onReview).toHaveBeenCalledWith("student-1");
  });
});
