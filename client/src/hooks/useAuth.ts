import { useCallback, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
  const { toast } = useToast();
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

  const loginMutation = useMutation({
    mutationFn: async (credentials: any) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/auth/user"], user);

      const redirectTo = consumeRedirect();
      if (redirectTo) {
        navigate(redirectTo);
      } else {
        if (user.role === "admin") {
          navigate("/admin");
        } else if (user.role === "instructor") {
          navigate("/dashboard/instrutor");
        } else {
          // Default to student dashboard or home
          navigate("/dashboard/aluno");
        }
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erro no login",
        description: error.message,
        variant: "destructive",
      });
    },
  });

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

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/user"], null);
      navigate("/login");
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao sair",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logout = useCallback(() => {
    logoutMutation.mutate();
  }, [logoutMutation]);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    refetchUser: refetch,
    loginMutation,
  };
}
