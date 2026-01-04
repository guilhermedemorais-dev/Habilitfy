import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
    useChatContacts,
    useChatMessages,
    useSendMessage,
    useMarkAsRead,
} from "@/hooks/useChat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ChatWindowProps {
    initialContactId?: string;
    className?: string;
}

export function ChatWindow({ initialContactId, className }: ChatWindowProps) {
    const { user } = useAuth();
    const [selectedContactId, setSelectedContactId] = useState<string | null>(
        initialContactId || null
    );
    const [newMessage, setNewMessage] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    const { data: contacts, isLoading: loadingContacts } = useChatContacts();
    const { data: messages, isLoading: loadingMessages } =
        useChatMessages(selectedContactId);
    const sendMessage = useSendMessage();
    const markAsRead = useMarkAsRead();

    // Sort contacts to show recent interactions first (could be done on backend)
    // For now just list them.

    useEffect(() => {
        if (messages && scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    useEffect(() => {
        if (selectedContactId && messages?.length) {
            // Mark unread messages from this contact as read
            const hasUnread = messages.some(
                (m) => m.senderId === selectedContactId && !m.read
            );
            if (hasUnread) {
                markAsRead.mutate(selectedContactId);
            }
        }
    }, [messages, selectedContactId, markAsRead]);

    const handleSend = () => {
        if (!selectedContactId || !newMessage.trim()) return;

        sendMessage.mutate(
            {
                receiverId: selectedContactId,
                content: newMessage,
            },
            {
                onSuccess: () => {
                    setNewMessage("");
                },
            }
        );
    };

    const selectedContact = contacts?.find((c) => c.id === selectedContactId);

    return (
        <div className={cn("flex h-[600px] bg-white rounded-xl shadow-lg overflow-hidden border", className)}>
            {/* Sidebar - Contacts */}
            <div className="w-1/3 border-r bg-gray-50 flex flex-col">
                <div className="p-4 border-b bg-white">
                    <h2 className="font-bold text-lg text-slate-800">Mensagens</h2>
                </div>
                <ScrollArea className="flex-1">
                    <div className="p-2 space-y-1">
                        {loadingContacts ? (
                            <div className="p-4 text-center text-sm text-slate-500">
                                Carregando contatos...
                            </div>
                        ) : contacts?.length === 0 ? (
                            <div className="p-4 text-center text-sm text-slate-500">
                                Nenhum contato encontrado.
                            </div>
                        ) : (
                            contacts?.map((contact) => (
                                <button
                                    key={contact.id}
                                    onClick={() => setSelectedContactId(contact.id)}
                                    className={cn(
                                        "w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors",
                                        selectedContactId === contact.id
                                            ? "bg-primary/10 border-primary border"
                                            : "hover:bg-white hover:shadow-sm"
                                    )}
                                >
                                    <Avatar>
                                        <AvatarImage src={contact.profileImageUrl} />
                                        <AvatarFallback>
                                            <User className="w-4 h-4" />
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="font-medium text-sm truncate text-slate-900">
                                            {contact.firstName} {contact.lastName}
                                        </p>
                                        <p className="text-xs text-slate-500 truncate capitalize">
                                            {contact.role === "student" ? "Aluno" : "Instrutor"}
                                        </p>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col bg-[#efeae2] bg-opacity-30">
                {selectedContact ? (
                    <>
                        {/* Header */}
                        <div className="p-4 border-b bg-white flex items-center gap-3 shadow-sm z-10">
                            <Avatar>
                                <AvatarImage src={selectedContact.profileImageUrl} />
                                <AvatarFallback>
                                    <User className="w-4 h-4" />
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <h3 className="font-bold text-slate-900">
                                    {selectedContact.firstName}
                                </h3>
                                <p className="text-xs text-green-600 flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-green-600 animate-pulse" />
                                    Online
                                </p>
                            </div>
                        </div>

                        {/* Messages */}
                        <ScrollArea className="flex-1 p-4">
                            <div className="space-y-4 flex flex-col">
                                {messages?.map((msg) => {
                                    const isMe = msg.senderId === user?.id;
                                    return (
                                        <div
                                            key={msg.id}
                                            className={cn(
                                                "max-w-[80%] rounded-2xl p-3 shadow-sm text-sm",
                                                isMe
                                                    ? "bg-primary text-white self-end rounded-br-none"
                                                    : "bg-white text-slate-800 self-start rounded-bl-none"
                                            )}
                                        >
                                            <p>{msg.content}</p>
                                            <p
                                                className={cn(
                                                    "text-[10px] mt-1 text-right",
                                                    isMe ? "text-primary-foreground/70" : "text-slate-400"
                                                )}
                                            >
                                                {format(new Date(msg.createdAt), "HH:mm")}
                                            </p>
                                        </div>
                                    );
                                })}
                                <div ref={scrollRef} />
                            </div>
                        </ScrollArea>

                        {/* Input */}
                        <div className="p-4 bg-white border-t">
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleSend();
                                }}
                                className="flex gap-2"
                            >
                                <Input
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Digite sua mensagem..."
                                    className="flex-1 rounded-full bg-slate-100 border-none focus-visible:ring-1"
                                />
                                <Button
                                    type="submit"
                                    size="icon"
                                    className="rounded-full w-10 h-10 bg-primary hover:bg-primary/90"
                                    disabled={!newMessage.trim() || sendMessage.isPending}
                                >
                                    <Send className="w-4 h-4" />
                                </Button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50">
                        <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mb-4">
                            <Send className="w-8 h-8 text-slate-400" />
                        </div>
                        <p className="font-medium">Selecione um contato para conversar</p>
                    </div>
                )}
            </div>
        </div>
    );
}
