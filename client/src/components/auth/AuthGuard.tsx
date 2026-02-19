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
  const { user, isLoading, login, logout } = useAuth();
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

  if (user && (user as any).isBlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-slate-700 p-4">
        <div className="bg-white shadow-sm rounded-xl border border-red-200 px-6 py-6 text-center max-w-md w-full">
          <p className="text-sm font-semibold text-red-600">Conta bloqueada</p>
          <p className="text-xs text-slate-500 mt-2">
            Seu acesso à plataforma foi bloqueado por um administrador.
          </p>
          {(user as any).blockedReason ? (
            <p className="text-xs text-slate-600 mt-3 rounded-md bg-slate-50 border border-slate-200 p-3">
              Motivo: {(user as any).blockedReason}
            </p>
          ) : null}
          <button
            type="button"
            className="mt-4 inline-flex h-9 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-100"
            onClick={logout}
          >
            Sair
          </button>
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
