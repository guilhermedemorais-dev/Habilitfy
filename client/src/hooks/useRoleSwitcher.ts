import { useState, useCallback, useEffect } from "react";

const VIEW_ROLE_KEY = "habilitfy.adminViewRole";

export type ViewRole = "admin" | "instructor" | "student";

/**
 * Hook para admin simular visualização como outro role.
 * Salva em sessionStorage — não altera o banco, não afeta permissões reais.
 * Só funciona se o user real for admin.
 */
export function useRoleSwitcher(realRole?: string) {
  const isAdmin = realRole === "admin";

  const [viewRole, setViewRoleState] = useState<ViewRole>(() => {
    if (typeof window === "undefined") return (realRole as ViewRole) || "student";
    const saved = window.sessionStorage.getItem(VIEW_ROLE_KEY);
    if (saved && isAdmin) return saved as ViewRole;
    return (realRole as ViewRole) || "student";
  });

  // Sync when realRole changes (login/logout)
  useEffect(() => {
    if (!isAdmin) {
      // Non-admin: always use their real role
      setViewRoleState((realRole as ViewRole) || "student");
      window.sessionStorage.removeItem(VIEW_ROLE_KEY);
    }
  }, [realRole, isAdmin]);

  const setViewRole = useCallback(
    (role: ViewRole) => {
      if (!isAdmin) return; // Only admin can switch
      setViewRoleState(role);
      if (role === "admin") {
        window.sessionStorage.removeItem(VIEW_ROLE_KEY);
      } else {
        window.sessionStorage.setItem(VIEW_ROLE_KEY, role);
      }
    },
    [isAdmin]
  );

  const resetViewRole = useCallback(() => {
    setViewRoleState((realRole as ViewRole) || "admin");
    window.sessionStorage.removeItem(VIEW_ROLE_KEY);
  }, [realRole]);

  return {
    /** The role being currently viewed (may differ from real role) */
    viewRole: isAdmin ? viewRole : (realRole as ViewRole) || "student",
    /** The real role from the database */
    realRole: realRole as ViewRole | undefined,
    /** Whether admin is currently impersonating another role */
    isImpersonating: isAdmin && viewRole !== "admin",
    /** Whether the real user is admin (can switch roles) */
    canSwitch: isAdmin,
    /** Set the view role */
    setViewRole,
    /** Reset to real admin role */
    resetViewRole,
  };
}
