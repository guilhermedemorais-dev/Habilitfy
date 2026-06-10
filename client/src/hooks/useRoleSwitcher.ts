import { useState, useCallback, useEffect } from "react";

const VIEW_ROLE_KEY = "habilitfy.adminViewRole";

export type ViewRole = "admin" | "instructor" | "student";

const isViewRole = (value: string | null): value is ViewRole =>
  value === "admin" || value === "instructor" || value === "student";

/**
 * Hook para admin simular visualização como outro role.
 * Salva em sessionStorage — não altera o banco, não afeta permissões reais.
 * Só funciona se o user real for o administrador mestre.
 */
export function useRoleSwitcher(realRole?: string, adminRole?: string | null) {
  const isMasterAdmin = realRole === "admin" && adminRole === "master";

  const [viewRole, setViewRoleState] = useState<ViewRole>(() => {
    if (typeof window === "undefined") return (realRole as ViewRole) || "student";
    const saved = window.sessionStorage.getItem(VIEW_ROLE_KEY);
    if (isViewRole(saved)) return saved;
    return (realRole as ViewRole) || "student";
  });

  // Sync when realRole changes (login/logout)
  useEffect(() => {
    if (!realRole) return;

    if (!isMasterAdmin) {
      // Only the master admin may keep a simulated role.
      setViewRoleState((realRole as ViewRole) || "student");
      window.sessionStorage.removeItem(VIEW_ROLE_KEY);
      return;
    }

    const saved = window.sessionStorage.getItem(VIEW_ROLE_KEY);
    setViewRoleState(isViewRole(saved) ? saved : "admin");
  }, [realRole, isMasterAdmin]);

  const setViewRole = useCallback(
    (role: ViewRole) => {
      if (!isMasterAdmin) return;
      setViewRoleState(role);
      if (role === "admin") {
        window.sessionStorage.removeItem(VIEW_ROLE_KEY);
      } else {
        window.sessionStorage.setItem(VIEW_ROLE_KEY, role);
      }
    },
    [isMasterAdmin]
  );

  const resetViewRole = useCallback(() => {
    setViewRoleState((realRole as ViewRole) || "admin");
    window.sessionStorage.removeItem(VIEW_ROLE_KEY);
  }, [realRole]);

  return {
    /** The role being currently viewed (may differ from real role) */
    viewRole: isMasterAdmin ? viewRole : (realRole as ViewRole) || "student",
    /** The real role from the database */
    realRole: realRole as ViewRole | undefined,
    /** Whether admin is currently impersonating another role */
    isImpersonating: isMasterAdmin && viewRole !== "admin",
    /** Whether the real user is the master admin (can switch roles) */
    canSwitch: isMasterAdmin,
    /** Set the view role */
    setViewRole,
    /** Reset to real admin role */
    resetViewRole,
  };
}
