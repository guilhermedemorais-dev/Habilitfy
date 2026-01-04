import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Booking } from "@shared/schema";
import { toast } from "sonner";

export interface BookingWithDetails extends Booking {
    instructor?: {
        id: string;
        userId: string;
        name: string;
        photo: string;
        vehicle: string;
    };
}

export function useStudentBookings() {
    return useQuery<BookingWithDetails[]>({
        queryKey: ["/api/bookings/student"],
        queryFn: async () => {
            const res = await apiRequest("GET", "/api/bookings/student");
            if (!res.ok) throw new Error("Failed to fetch bookings");
            return res.json();
        },
    });
}

export function useCancelBooking() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (bookingId: string) => {
            const res = await apiRequest("PATCH", `/api/bookings/${bookingId}`, {
                status: "cancelled",
            });
            if (!res.ok) throw new Error("Failed to cancel booking");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/bookings/student"] });
            toast.success("Aula cancelada com sucesso!");
        },
        onError: (error: Error) => {
            toast.error(error.message || "Erro ao cancelar aula. Tente novamente.");
        },
    });
}

export function getUpcomingBooking(bookings: BookingWithDetails[] | undefined) {
    if (!bookings || bookings.length === 0) return null;

    const now = new Date();
    const upcoming = bookings
        .filter((b) => {
            const bookingDate = new Date(b.date);
            return (
                bookingDate > now &&
                (b.status === "confirmed" || b.status === "paid")
            );
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return upcoming[0] || null;
}

export function getRecentBookings(
    bookings: BookingWithDetails[] | undefined,
    limit = 3
) {
    if (!bookings || bookings.length === 0) return [];

    return bookings
        .filter((b) => b.status === "completed")
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, limit);
}
