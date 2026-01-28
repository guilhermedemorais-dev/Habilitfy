import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface WalletTransaction {
    id: number;
    type: "credit" | "debit" | "withdrawal" | "adjustment";
    amount: string;
    description: string;
    createdAt: string;
}

export interface WalletData {
    balance: number;
    currency: string;
    history: WalletTransaction[];
}

export function useWallet() {
    const queryClient = useQueryClient();

    const { data, isLoading, error } = useQuery<WalletData>({
        queryKey: ["wallet"],
        queryFn: async () => {
            const res = await apiRequest("GET", "/api/wallet");
            if (!res.ok) throw new Error("Failed to fetch wallet");
            return res.json();
        },
    });

    const withdrawMutation = useMutation({
        mutationFn: async (payload: { amount: number; pixKey: string }) => {
            const res = await apiRequest("POST", "/api/wallet/withdraw", payload);
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "Withdrawal failed");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["wallet"] });
        },
    });

    return {
        balance: data?.balance || 0,
        history: data?.history || [],
        currency: data?.currency || "BRL",
        isLoading,
        error,
        withdraw: withdrawMutation.mutateAsync,
        isWithdrawing: withdrawMutation.isPending,
    };
}
