import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bot, Send, X, MessageSquare, Minimize2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

type Message = {
    role: "user" | "assistant";
    content: string;
};

export function AdminAIChat() {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<Message[]>([
        { role: "assistant", content: "Olá! Sou o assistente virtual do HabilitFy. Como posso ajudar com a gestão hoje?" }
    ]);
    const scrollRef = useRef<HTMLDivElement>(null);

    const sendMessageMutation = useMutation({
        mutationFn: async (message: string) => {
            const res = await apiRequest("POST", "/api/ai/chat", { message });
            return res.json();
        },
        onSuccess: (data) => {
            setMessages((prev) => [...prev, data]);
        },
        onError: () => {
            setMessages((prev) => [...prev, { role: "assistant", content: "Desculpe, estou indisponível no momento." }]);
        }
    });

    const handleSend = () => {
        if (!input.trim()) return;
        const userMsg = input;
        setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
        setInput("");
        sendMessageMutation.mutate(userMsg);
    };

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    // Web Admin Only: hidden on mobile (md:flex)
    return (
        <div className="fixed bottom-6 right-6 z-50 hidden md:flex flex-col items-end gap-2">
            {isOpen && (
                <Card className="w-80 h-96 shadow-xl border-slate-200 animate-in slide-in-from-bottom-10 fade-in duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 border-b bg-slate-50 rounded-t-lg">
                        <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8 border bg-white">
                                <AvatarFallback className="bg-primary/10 text-primary"><Bot size={16} /></AvatarFallback>
                            </Avatar>
                            <div>
                                <CardTitle className="text-sm font-bold">HabilitFy AI</CardTitle>
                                <p className="text-[10px] text-green-600 font-medium flex items-center gap-1">
                                    <span className="block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Online
                                </p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsOpen(false)}>
                            <Minimize2 className="h-4 w-4 text-slate-400 hover:text-slate-600" />
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0 h-[calc(100%-110px)]">
                        <div className="h-full overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${msg.role === 'user'
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-slate-100 text-slate-800'
                                        }`}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                            {sendMessageMutation.isPending && (
                                <div className="flex justify-start">
                                    <div className="bg-slate-100 rounded-lg px-3 py-2 text-sm text-slate-500 italic">
                                        Digitando...
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                    <CardFooter className="p-3 border-t bg-white rounded-b-lg">
                        <form
                            className="flex w-full items-center gap-2"
                            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                        >
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Digite sua dúvida..."
                                className="h-9 text-sm focus-visible:ring-1"
                                disabled={sendMessageMutation.isPending}
                            />
                            <Button type="submit" size="icon" className="h-9 w-9" disabled={sendMessageMutation.isPending || !input.trim()}>
                                <Send className="h-4 w-4" />
                            </Button>
                        </form>
                    </CardFooter>
                </Card>
            )}

            <Button
                onClick={() => setIsOpen(!isOpen)}
                size="icon"
                className="h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 bg-primary text-primary-foreground"
            >
                {isOpen ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
            </Button>
        </div>
    );
}
