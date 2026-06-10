// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useRoleSwitcher } from "./useRoleSwitcher";

describe("useRoleSwitcher", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it("allows the master administrator to switch the viewed role", () => {
    const { result } = renderHook(() => useRoleSwitcher("admin", "master"));

    expect(result.current.canSwitch).toBe(true);

    act(() => result.current.setViewRole("instructor"));

    expect(result.current.viewRole).toBe("instructor");
    expect(result.current.isImpersonating).toBe(true);
    expect(window.sessionStorage.getItem("habilitfy.adminViewRole")).toBe("instructor");
  });

  it("blocks managers and clears a previously simulated role", () => {
    window.sessionStorage.setItem("habilitfy.adminViewRole", "student");
    const { result } = renderHook(() => useRoleSwitcher("admin", "manager"));

    expect(result.current.canSwitch).toBe(false);
    expect(result.current.viewRole).toBe("admin");

    act(() => result.current.setViewRole("instructor"));

    expect(result.current.viewRole).toBe("admin");
    expect(window.sessionStorage.getItem("habilitfy.adminViewRole")).toBeNull();
  });
});
