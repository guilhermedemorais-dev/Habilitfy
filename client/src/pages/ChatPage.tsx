import { AIChatWindow } from "@/components/chat/AIChatWindow";

export default function ChatPage() {
    return (
        <div className="h-screen w-full bg-slate-50 pb-20 md:pb-0 pt-0">
            <div className="mx-auto max-w-2xl h-full flex flex-col p-4">
                <h1 className="text-2xl font-bold mb-4 text-slate-900 hidden md:block">Chat com IA</h1>
                <AIChatWindow className="flex-1 w-full h-full shadow-sm" />
            </div>
        </div>
    );
}
