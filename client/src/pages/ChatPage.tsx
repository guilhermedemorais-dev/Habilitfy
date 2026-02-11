import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronLeft, Search, MessageCircle, Bot, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useChatContacts, type ChatContact } from "@/hooks/useChat";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { AIChatWindow } from "@/components/chat/AIChatWindow";
import { cn } from "@/lib/utils";

type ChatView = "list" | "chat" | "ai";

export default function ChatPage() {
    const { user } = useAuth();
    const { data: contacts = [], isLoading } = useChatContacts();
    const [search, setSearch] = useState("");
    const [view, setView] = useState<ChatView>("list");
    const [selectedContact, setSelectedContact] = useState<ChatContact | null>(null);

    const filteredContacts = useMemo(() => {
        if (!search.trim()) return contacts;
        const q = search.toLowerCase();
        return contacts.filter(
            (c) =>
                c.firstName.toLowerCase().includes(q) ||
                c.lastName.toLowerCase().includes(q)
        );
    }, [contacts, search]);

    const openChat = (contact: ChatContact) => {
        setSelectedContact(contact);
        setView("chat");
    };

    const openAI = () => {
        setView("ai");
    };

    const goBack = () => {
        setView("list");
        setSelectedContact(null);
    };

    // Chat individual view
    if (view === "chat" && selectedContact) {
        return (
            <div className="h-screen w-full bg-background pb-20 md:pb-0 flex flex-col">
                {/* Header */}
                <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
                    <div className="flex items-center gap-3 px-4 py-3">
                        <Button
                            size="icon"
                            variant="ghost"
                            className="rounded-full"
                            onClick={goBack}
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </Button>
                        <Avatar className="w-9 h-9">
                            {selectedContact.profileImageUrl ? (
                                <AvatarImage src={selectedContact.profileImageUrl} />
                            ) : null}
                            <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                                {selectedContact.firstName.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold text-sm text-slate-900">
                                {selectedContact.firstName} {selectedContact.lastName}
                            </p>
                            <p className="text-xs text-slate-400 capitalize">
                                {selectedContact.role === "instructor" ? "Instrutor" : "Aluno"}
                            </p>
                        </div>
                    </div>
                </div>
                <ChatWindow
                    initialContactId={selectedContact.id}
                    className="flex-1 w-full"
                />
            </div>
        );
    }

    // AI Chat view
    if (view === "ai") {
        return (
            <div className="h-screen w-full bg-background pb-20 md:pb-0 flex flex-col">
                {/* Header */}
                <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
                    <div className="flex items-center gap-3 px-4 py-3">
                        <Button
                            size="icon"
                            variant="ghost"
                            className="rounded-full"
                            onClick={goBack}
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </Button>
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md">
                            <Bot className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="font-semibold text-sm text-slate-900">
                                Assistente HabilitFy
                            </p>
                            <p className="text-xs text-green-500 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                                Online
                            </p>
                        </div>
                    </div>
                </div>
                <AIChatWindow className="flex-1 w-full" onClose={goBack} />
            </div>
        );
    }

    // List view (default)
    return (
        <div className="min-h-screen w-full bg-background pb-20 md:pb-0">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
                <div className="flex items-center gap-3 px-4 py-3">
                    <Button
                        size="icon"
                        variant="ghost"
                        className="rounded-full"
                        asChild
                    >
                        <Link href="/">
                            <ChevronLeft className="w-5 h-5" />
                        </Link>
                    </Button>
                    <h1 className="text-lg font-bold text-slate-900">Minhas Mensagens</h1>
                </div>
            </div>

            {/* Search */}
            <div className="px-4 py-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        placeholder="Buscar"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 bg-gray-50 border-gray-200 rounded-xl h-10"
                    />
                </div>
            </div>

            {/* AI Assistant Card (always visible) */}
            <div className="px-4 mb-2">
                <button
                    onClick={openAI}
                    className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-100 rounded-2xl hover:shadow-md transition-all active:scale-[0.98]"
                >
                    <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md">
                            <Bot className="w-6 h-6 text-white" />
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />
                    </div>
                    <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm text-slate-900">
                                Assistente HabilitFy
                            </p>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-100 text-violet-700">
                                <Sparkles className="w-3 h-3" /> Suporte
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 truncate">
                            Tire suas dúvidas sobre a plataforma
                        </p>
                    </div>
                    <ChevronLeft className="w-4 h-4 text-slate-300 rotate-180" />
                </button>
            </div>

            {/* Contacts List */}
            <div className="px-4 space-y-1">
                {isLoading ? (
                    <div className="space-y-3 pt-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                                <div className="w-12 h-12 rounded-full bg-gray-200" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-32 bg-gray-200 rounded" />
                                    <div className="h-3 w-48 bg-gray-200 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredContacts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                            <MessageCircle className="w-10 h-10 text-gray-300" />
                        </div>
                        <h3 className="font-bold text-slate-800 mb-1">Nenhuma mensagem</h3>
                        <p className="text-sm text-slate-400 max-w-[200px]">
                            Suas conversas aparecerão aqui
                        </p>
                    </div>
                ) : (
                    filteredContacts.map((contact) => (
                        <button
                            key={contact.id}
                            onClick={() => openChat(contact)}
                            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors active:bg-gray-100"
                        >
                            <div className="relative">
                                <Avatar className="w-12 h-12">
                                    {contact.profileImageUrl ? (
                                        <AvatarImage src={contact.profileImageUrl} />
                                    ) : null}
                                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                        {contact.firstName.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                            </div>
                            <div className="flex-1 text-left min-w-0">
                                <p className="font-semibold text-sm text-slate-900">
                                    {contact.firstName} {contact.lastName}
                                </p>
                                <p className="text-xs text-slate-400 capitalize">
                                    {contact.role === "instructor" ? "Instrutor" : "Aluno"}
                                </p>
                            </div>
                            <ChevronLeft className="w-4 h-4 text-slate-300 rotate-180 shrink-0" />
                        </button>
                    ))
                )}
            </div>
        </div>
    );
}
