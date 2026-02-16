import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";

export function useCaptureSession(token?: string) {
    const { data: session, isLoading, error } = useQuery({
        queryKey: ["capture-session", token],
        queryFn: async () => {
            if (!token) return null;
            const res = await fetch(`/api/capture-session/${token}`);
            if (!res.ok) {
                if (res.status === 410) throw new Error("Sessão expirada");
                if (res.status === 404) throw new Error("Sessão não encontrada");
                throw new Error("Erro ao carregar sessão");
            }
            return res.json();
        },
        enabled: !!token,
        retry: false,
    });

    const uploadMutation = useMutation({
        mutationFn: async (imageData: string) => {
            if (!token) throw new Error("Token não fornecido");
            const res = await apiRequest("POST", `/api/capture-session/${token}/upload`, { imageData });
            return res.json();
        },
    });

    return {
        session,
        isLoading,
        error,
        upload: uploadMutation.mutateAsync,
        isUploading: uploadMutation.isPending,
    };
}

export function useCreateCaptureSession() {
    return useMutation({
        mutationFn: async () => {
            const res = await apiRequest("POST", "/api/capture-session");
            return res.json();
        },
    });
}
