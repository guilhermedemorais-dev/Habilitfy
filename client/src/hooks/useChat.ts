import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface ChatMessage {
    id: string;
    senderId: string;
    receiverId: string;
    bookingId?: string;
    content: string;
    read: boolean;
    createdAt: string;
}

export interface ChatContact {
    id: string;
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
    role: "student" | "instructor";
}

export function useChatContacts() {
    return useQuery<ChatContact[]>({
        queryKey: ["/api/chat/contacts"],
    });
}

export function useChatMessages(contactId: string | null) {
    return useQuery<ChatMessage[]>({
        queryKey: ["/api/chat", contactId],
        queryFn: async () => {
            if (!contactId) return [];
            const res = await apiRequest("GET", `/api/chat/${contactId}`);
            return res.json();
        },
        enabled: !!contactId,
        refetchInterval: 3000, // Poll every 3 seconds for new messages
    });
}

export function useSendMessage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            receiverId,
            content,
            bookingId,
        }: {
            receiverId: string;
            content: string;
            bookingId?: string;
        }) => {
            const res = await apiRequest("POST", "/api/chat", {
                receiverId,
                content,
                bookingId,
            });
            return res.json();
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: ["/api/chat", variables.receiverId],
            });
        },
    });
}

export function useMarkAsRead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (senderId: string) => {
            await apiRequest("POST", `/api/chat/${senderId}/read`);
        },
        onSuccess: (_, senderId) => {
            queryClient.invalidateQueries({
                queryKey: ["/api/chat", senderId],
            });
        },
    });
}
