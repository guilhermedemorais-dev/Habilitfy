import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { getNavItems } from "@/components/layout/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useRoleSwitcher } from "@/hooks/useRoleSwitcher";
import { RoleSwitcherModal } from "@/components/RoleSwitcherModal";
import { User } from "lucide-react";

export function BottomNav() {
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const { viewRole, canSwitch, isImpersonating, setViewRole } = useRoleSwitcher(user?.role);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);

  // Use viewRole for navigation items so admin sees the correct nav
  const navItems = getNavItems(viewRole);

  // Badge color for impersonation indicator
  const badgeColor = viewRole === "instructor"
    ? "bg-blue-500"
    : viewRole === "student"
    ? "bg-green-500"
    : "";

  return (
    <>
      <nav className="fixed bottom-4 left-4 right-4 z-50 md:hidden">
        {/* Impersonation banner */}
        {isImpersonating && (
          <div className="mx-auto mb-2 flex max-w-[360px] items-center justify-center gap-2 rounded-full bg-amber-100 px-3 py-1.5 text-[11px] font-medium text-amber-800 shadow-sm border border-amber-200">
            <span className={`h-2 w-2 rounded-full ${badgeColor} animate-pulse`} />
            Visualizando como {viewRole === "instructor" ? "Instrutor" : "Aluno"}
            <button
              onClick={() => setViewRole("admin")}
              className="ml-1 rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-bold hover:bg-amber-300 transition-colors"
            >
              Voltar
            </button>
          </div>
        )}

        <div className="mx-auto flex w-full max-w-[360px] items-center justify-between rounded-[2rem] border border-white/20 bg-white/90 px-3 py-2 shadow-xl shadow-blue-900/10 backdrop-blur-xl">
          {navItems.map((item) => {
            const isActive = location === item.href;
            const isProfileItem = item.icon === User || item.label === "Perfil";

            // If admin and clicking profile icon, show role switcher instead
            if (isProfileItem && canSwitch) {
              return (
                <button
                  key="profile-switcher"
                  onClick={() => setShowRoleSwitcher(true)}
                  aria-label="Trocar visão"
                  title="Trocar visão de conta"
                  className={cn(
                    "relative flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200",
                    isActive
                      ? "bg-primary text-white shadow-md shadow-blue-500/25"
                      : "text-slate-400 hover:bg-blue-50 hover:text-primary"
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-4 w-4 transition-transform",
                      isActive && "scale-105"
                    )}
                  />
                  {/* Role indicator dot */}
                  {isImpersonating && (
                    <span className={`absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full ${badgeColor} border-2 border-white`} />
                  )}
                </button>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                title={item.label}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200",
                  isActive
                    ? "bg-primary text-white shadow-md shadow-blue-500/25"
                    : "text-slate-400 hover:bg-blue-50 hover:text-primary"
                )}
              >
                <item.icon
                  className={cn(
                    "h-4 w-4 transition-transform",
                    isActive && "scale-105"
                  )}
                />
                <span className="sr-only">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Role Switcher Modal */}
      <RoleSwitcherModal
        open={showRoleSwitcher}
        onClose={() => setShowRoleSwitcher(false)}
        currentViewRole={viewRole}
        onSelectRole={(role) => {
          setViewRole(role);
          // Navigate to the correct dashboard
          if (role === "admin") navigate("/admin");
          else if (role === "instructor") navigate("/dashboard/instrutor");
          else navigate("/dashboard/aluno");
        }}
      />
    </>
  );
}
