import { useEffect, useRef, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type AuthGuardProps = {
  children: ReactNode;
  redirectTo?: string;
  message?: string;
  requiredRoles?: string[];
};

export function AuthGuard({
  children,
  redirectTo,
  message = "Redirecionando para login...",
  requiredRoles,
}: AuthGuardProps) {
  const { user, isLoading, login } = useAuth();
  const hasTriggeredLogin = useRef(false);

  useEffect(() => {
    if (isLoading || user || hasTriggeredLogin.current) return;
    hasTriggeredLogin.current = true;
    login(redirectTo);
  }, [isLoading, user, login, redirectTo]);

  if (user && requiredRoles?.length && !requiredRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-slate-700">
        <div className="bg-white shadow-sm rounded-xl border border-gray-200 px-6 py-5 text-center">
          <p className="text-sm font-semibold text-red-600">Acesso negado</p>
          <p className="text-xs text-slate-500 mt-1">
            Sua conta não tem permissão para acessar esta página.
          </p>
        </div>
      </div>
    );
  }

  if (user) return <>{children}</>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-slate-700">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <p className="text-sm">{message}</p>
      </div>
    </div>
  );
}
