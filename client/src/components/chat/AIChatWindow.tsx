import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAIChat, fetchQuickReplies } from "@/hooks/useAIChat";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, Sparkles, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
}

interface AIChatWindowProps {
    className?: string;
    onClose?: () => void;
}

const WELCOME_MESSAGE: Message = {
    id: "welcome",
    role: "assistant",
    content: "Olá! 👋 Sou o Assistente Virtual da HabilitFy. Como posso ajudar você hoje?",
    timestamp: new Date(),
};

export function AIChatWindow({ className, onClose }: AIChatWindowProps) {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
    const [input, setInput] = useState("");
    const [quickReplies, setQuickReplies] = useState<string[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const aiChat = useAIChat();

    // Load quick replies on mount
    useEffect(() => {
        fetchQuickReplies("greeting").then(setQuickReplies);
    }, []);

    // Scroll to bottom when messages change
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    const sendMessage = async (content: string) => {
        if (!content.trim()) return;

        const userMessage: Message = {
            id: `user-${Date.now()}`,
            role: "user",
            content: content.trim(),
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setQuickReplies([]); // Hide quick replies after first message

        try {
            // Prepare conversation history for API
            const conversationHistory = [...messages.filter(m => m.id !== "welcome"), userMessage].map((m) => ({
                role: m.role,
                content: m.content,
            }));

            const result = await aiChat.mutateAsync(conversationHistory);

            const assistantMessage: Message = {
                id: `assistant-${Date.now()}`,
                role: "assistant",
                content: result.reply,
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, assistantMessage]);
        } catch (error: any) {
            const errorMessage: Message = {
                id: `error-${Date.now()}`,
                role: "assistant",
                content: error.message || "Desculpe, ocorreu um erro. Tente novamente.",
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
        }
    };

    const handleQuickReply = (reply: string) => {
        sendMessage(reply);
    };

    return (
        <div className={cn("flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200", className)}>
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                    <h3 className="font-bold text-white">Assistente HabilitFy</h3>
                    <p className="text-xs text-blue-100 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Powered by IA
                    </p>
                </div>
                {onClose && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-white hover:bg-white/20"
                        onClick={onClose}
                    >
                        ✕
                    </Button>
                )}
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4 bg-gradient-to-b from-slate-50 to-white">
                <div className="space-y-4 flex flex-col">
                    <AnimatePresence>
                        {messages.map((msg) => (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className={cn(
                                    "flex gap-2 max-w-[85%]",
                                    msg.role === "user" ? "self-end flex-row-reverse" : "self-start"
                                )}
                            >
                                <Avatar className="w-8 h-8 shrink-0">
                                    <AvatarFallback className={cn(
                                        msg.role === "user"
                                            ? "bg-blue-100 text-blue-600"
                                            : "bg-gradient-to-br from-blue-500 to-purple-500 text-white"
                                    )}>
                                        {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                    </AvatarFallback>
                                </Avatar>
                                <div
                                    className={cn(
                                        "rounded-2xl p-3 text-sm shadow-sm",
                                        msg.role === "user"
                                            ? "bg-blue-600 text-white rounded-br-sm"
                                            : "bg-white text-slate-800 rounded-bl-sm border border-slate-100"
                                    )}
                                >
                                    <p className="whitespace-pre-wrap">{msg.content}</p>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Loading indicator */}
                    {aiChat.isPending && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex gap-2 self-start"
                        >
                            <Avatar className="w-8 h-8">
                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                </AvatarFallback>
                            </Avatar>
                            <div className="bg-white rounded-2xl rounded-bl-sm p-3 border border-slate-100 shadow-sm">
                                <div className="flex gap-1">
                                    <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                    <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                    <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    <div ref={scrollRef} />
                </div>
            </ScrollArea>

            {/* Quick Replies */}
            {quickReplies.length > 0 && (
                <div className="px-4 py-2 bg-slate-50 border-t border-slate-100">
                    <div className="flex flex-wrap gap-2">
                        {quickReplies.map((reply, index) => (
                            <Button
                                key={index}
                                variant="outline"
                                size="sm"
                                className="text-xs rounded-full bg-white hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                                onClick={() => handleQuickReply(reply)}
                            >
                                {reply}
                            </Button>
                        ))}
                    </div>
                </div>
            )}

            {/* Input */}
            <div className="p-4 bg-white border-t border-slate-100">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        sendMessage(input);
                    }}
                    className="flex gap-2"
                >
                    <Input
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Digite sua pergunta..."
                        className="flex-1 rounded-full bg-slate-100 border-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        disabled={aiChat.isPending}
                    />
                    <Button
                        type="submit"
                        size="icon"
                        className="rounded-full w-10 h-10 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200"
                        disabled={!input.trim() || aiChat.isPending}
                    >
                        <Send className="w-4 h-4" />
                    </Button>
                </form>
            </div>
        </div>
    );
}
