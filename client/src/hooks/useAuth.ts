import { useCallback, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import type { User } from "@shared/schema";

const LOGIN_REDIRECT_KEY = "habilitfy.postLoginRedirect";

function rememberRedirect(target?: string) {
  if (typeof window === "undefined") return;
  const next = target || window.location.pathname + window.location.search;
  window.sessionStorage.setItem(LOGIN_REDIRECT_KEY, next);
}

function consumeRedirect() {
  if (typeof window === "undefined") return null;
  const saved = window.sessionStorage.getItem(LOGIN_REDIRECT_KEY);
  if (saved) {
    window.sessionStorage.removeItem(LOGIN_REDIRECT_KEY);
    return saved;
  }
  return null;
}

export function useAuth() {
  const [, navigate] = useLocation();
  const hasNavigated = useRef(false);

  const { data: user, isLoading, refetch } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
  });

  useEffect(() => {
    if (!user || hasNavigated.current) return;
    const redirectTo = consumeRedirect();
    if (redirectTo) {
      hasNavigated.current = true;
      navigate(redirectTo);
    }
  }, [user, navigate]);

  const login = useCallback(
    (redirectTo?: string) => {
      if (user) {
        // Se já autenticado, só navega para o destino salvo
        navigate(redirectTo || "/");
        return;
      }

      rememberRedirect(redirectTo);
      if (typeof window !== "undefined") {
        window.location.assign("/api/login");
      }
    },
    [navigate, user]
  );

  const logout = useCallback(() => {
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(LOGIN_REDIRECT_KEY);
      window.location.assign("/api/logout");
    }
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    refetchUser: refetch,
  };
}
