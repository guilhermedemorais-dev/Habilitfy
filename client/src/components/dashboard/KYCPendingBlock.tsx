import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Clock, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface KYCPendingBlockProps {
    status: string | null | undefined;
    onRetry?: () => void;
}

export function KYCPendingBlock({ status, onRetry }: KYCPendingBlockProps) {
    if (status === "approved") return null;

    const isPending = status === "pending" || !status;
    const isRejected = status === "rejected";

    return (
        <div className="min-h-[50vh] flex items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-500">
            <Card className="border-none shadow-2xl rounded-2xl max-w-md w-full overflow-hidden relative">
                <div className={`absolute top-0 left-0 w-full h-2 ${isRejected ? "bg-red-500" : "bg-yellow-500"}`} />
                <CardContent className="p-8 text-center space-y-6">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-sm ${isRejected ? "bg-red-100 text-red-600" : "bg-yellow-100 text-yellow-600"}`}>
                        {isRejected ? <AlertCircle className="w-10 h-10" /> : <Clock className="w-10 h-10" />}
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">
                            {isRejected ? "Cadastro Reprovado" : "Em Análise"}
                        </h2>
                        <p className="text-slate-500 leading-relaxed">
                            {isRejected
                                ? "Houve um problema com sua documentação. Corrija as imagens e envie uma nova tentativa para análise."
                                : "Seus documentos estão sendo analisados pela nossa equipe. Você receberá uma notificação assim que seu cadastro for aprovado."}
                        </p>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-4 text-sm text-left space-y-3 border border-slate-100">
                        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-primary" /> Status da Verificação
                        </h3>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Documentos</span>
                                <span className={`font-medium ${isRejected ? "text-red-500" : "text-yellow-600"}`}>
                                    {isRejected ? "Recusado" : "Em análise"}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Selfie</span>
                                <span className={`font-medium ${isRejected ? "text-red-500" : "text-yellow-600"}`}>
                                    {isRejected ? "Recusado" : "Em análise"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {isRejected && (
                        <Button className="w-full bg-primary hover:bg-primary/90" onClick={onRetry}>
                            Reenviar documentos
                        </Button>
                    )}
                    {!isRejected && (
                        <p className="text-xs text-slate-400">
                            Tempo estimado: 24 horas úteis
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
