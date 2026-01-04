import { ChatWindow } from "@/components/chat/ChatWindow";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function ChatPage() {
    const [match, params] = useRoute("/chat/:contactId?");
    const initialContactId = params?.contactId;

    return (
        <AuthGuard>
            <div className="min-h-screen bg-background flex flex-col">
                {/* Simple Header */}
                <header className="bg-white border-b px-6 py-4 flex items-center gap-4 sticky top-0 z-20">
                    <Link href="/dashboard/aluno">
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ArrowLeft className="w-5 h-5 text-slate-600" />
                        </Button>
                    </Link>
                    <h1 className="font-bold text-lg text-slate-900">Mensagens</h1>
                </header>

                {/* Chat Content */}
                <div className="flex-1 p-6 md:p-8 max-w-6xl mx-auto w-full">
                    <ChatWindow
                        initialContactId={initialContactId}
                        className="h-[calc(100vh-140px)] shadow-xl"
                    />
                </div>
            </div>
        </AuthGuard>
    );
}
