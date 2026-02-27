// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthGuard } from "./AuthGuard";

const loginMock = vi.fn();
const logoutMock = vi.fn();
const useAuthMock = vi.fn();

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => useAuthMock(),
}));

describe("AuthGuard smoke", () => {
  beforeEach(() => {
    loginMock.mockReset();
    logoutMock.mockReset();
    useAuthMock.mockReset();
  });

  it("requests login when user is anonymous", async () => {
    useAuthMock.mockReturnValue({
      user: null,
      isLoading: false,
      login: loginMock,
      logout: logoutMock,
    });

    render(
      <AuthGuard redirectTo="/admin" requiredRoles={["admin"]}>
        <div>Admin content</div>
      </AuthGuard>,
    );

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith("/admin");
    });
    expect(screen.queryByText("Admin content")).not.toBeInTheDocument();
  });

  it("blocks non-admin user", () => {
    useAuthMock.mockReturnValue({
      user: { id: "u-1", role: "student" },
      isLoading: false,
      login: loginMock,
      logout: logoutMock,
    });

    render(
      <AuthGuard requiredRoles={["admin"]}>
        <div>Admin content</div>
      </AuthGuard>,
    );

    expect(screen.getByText("Acesso negado")).toBeInTheDocument();
    expect(screen.queryByText("Admin content")).not.toBeInTheDocument();
  });

  it("renders content for admin user", () => {
    useAuthMock.mockReturnValue({
      user: { id: "u-2", role: "admin", adminRole: "master" },
      isLoading: false,
      login: loginMock,
      logout: logoutMock,
    });

    render(
      <AuthGuard requiredRoles={["admin"]}>
        <div>Admin content</div>
      </AuthGuard>,
    );

    expect(screen.getByText("Admin content")).toBeInTheDocument();
  });
});
