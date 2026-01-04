import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "sonner";

export interface ReviewData {
    instructorId: string;
    bookingId: string;
    rating: number;
    comment: string;
}

export function useCreateReview() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: ReviewData) => {
            const res = await apiRequest("POST", "/api/reviews", data);
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "Failed to create review");
            }
            return res.json();
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["/api/bookings/student"] });
            queryClient.invalidateQueries({
                queryKey: [`/api/instructors/${variables.instructorId}/reviews`]
            });
            queryClient.invalidateQueries({
                queryKey: [`/api/instructors/${variables.instructorId}`]
            });
            toast.success("Avaliação enviada com sucesso!");
        },
        onError: (error: Error) => {
            toast.error(error.message || "Erro ao enviar avaliação. Tente novamente.");
        },
    });
}
