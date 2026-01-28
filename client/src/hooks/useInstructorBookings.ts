import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Booking } from "@shared/schema";

export interface BookingWithStudent extends Booking {
    student?: {
        id: string;
        name: string;
        phone?: string;
    };
}

export function useInstructorBookings(instructorId: string | undefined) {
    return useQuery<BookingWithStudent[]>({
        queryKey: ["/api/bookings/instructor", instructorId],
        queryFn: async () => {
            if (!instructorId) throw new Error("Instructor ID required");
            const res = await apiRequest(
                "GET",
                `/api/bookings/instructor/${instructorId}`
            );
            if (!res.ok) throw new Error("Failed to fetch bookings");
            return res.json();
        },
        enabled: !!instructorId,
    });
}

export function getTodayBookings(bookings: BookingWithStudent[] | undefined) {
    if (!bookings || bookings.length === 0) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return bookings.filter((b) => {
        const bookingDate = new Date(b.date);
        return bookingDate >= today && bookingDate < tomorrow;
    });
}

export function getWeekEarnings(bookings: BookingWithStudent[] | undefined) {
    if (!bookings || bookings.length === 0) {
        return [
            { name: "Seg", value: 0 },
            { name: "Ter", value: 0 },
            { name: "Qua", value: 0 },
            { name: "Qui", value: 0 },
            { name: "Sex", value: 0 },
            { name: "Sab", value: 0 },
            { name: "Dom", value: 0 },
        ];
    }

    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const paidBookings = bookings.filter((b) => {
        const bookingDate = new Date(b.date);
        return (
            bookingDate >= weekAgo &&
            bookingDate <= today &&
            b.status === "completed"
        );
    });

    const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
    const earnings = new Array(7).fill(0);

    paidBookings.forEach((booking) => {
        const day = new Date(booking.date).getDay();
        earnings[day] += Number(booking.totalPrice || 0);
    });

    return dayNames.map((name, i) => ({
        name,
        value: earnings[i],
    }));
}

export function getPendingEarnings(bookings: BookingWithStudent[] | undefined) {
    if (!bookings || bookings.length === 0) return 0;

    return bookings
        .filter((b) => b.status !== "completed" && b.paymentStatus === "paid")
        .reduce((sum, b) => sum + Number(b.totalPrice || 0), 0);
}
