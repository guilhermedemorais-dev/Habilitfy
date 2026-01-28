import { useMutation } from "@tanstack/react-query";

interface AIMessage {
    role: "user" | "assistant";
    content: string;
}

interface AIResponse {
    reply: string;
    model?: string;
}

interface QuickRepliesResponse {
    replies: string[];
}

export function useAIChat() {
    return useMutation({
        mutationFn: async (messages: AIMessage[]): Promise<AIResponse> => {
            const res = await fetch("/api/chat/ai", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ messages }),
            });

            if (!res.ok) {
                const error = await res.json().catch(() => ({ message: "Erro desconhecido" }));
                throw new Error(error.message || "Erro ao enviar mensagem");
            }

            return res.json();
        },
    });
}

export async function fetchQuickReplies(context: "greeting" | "booking" | "payment" = "greeting"): Promise<string[]> {
    const res = await fetch(`/api/chat/quick-replies?context=${context}`);
    if (!res.ok) return [];
    const data: QuickRepliesResponse = await res.json();
    return data.replies || [];
}
