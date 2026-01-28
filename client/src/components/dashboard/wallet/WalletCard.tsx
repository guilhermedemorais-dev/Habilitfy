import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet, ArrowUpCircle, AlertCircle } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function WalletCard() {
    const { balance, currency, isLoading, withdraw, isWithdrawing } = useWallet();
    const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState("");
    const [pixKey, setPixKey] = useState("");

    const handleWithdraw = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await withdraw({
                amount: Number(withdrawAmount),
                pixKey,
            });
            toast.success("Solicitação de saque enviada com sucesso!");
            setIsWithdrawOpen(false);
            setWithdrawAmount("");
            setPixKey("");
        } catch (error: any) {
            toast.error(error.message || "Erro ao solicitar saque");
        }
    };

    const formattedBalance = new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: currency,
    }).format(balance);

    const canWithdraw = balance > 0;

    return (
        <Card className="glass-premium border-l-4 border-l-emerald-500 card-lift">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xl font-heading font-bold text-slate-800 flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-emerald-600" />
                    Sua Carteira
                </CardTitle>
                <span className="text-xs text-slate-500 font-medium px-2 py-1 bg-slate-100 rounded-full">
                    Disponível
                </span>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col gap-1">
                    {isLoading ? (
                        <div className="h-10 w-32 skeleton rounded" />
                    ) : (
                        <div className="text-4xl font-bold font-heading text-slate-900 tracking-tight">
                            {formattedBalance}
                        </div>
                    )}
                    <p className="text-sm text-slate-500">
                        Saldo livre para saque imediato via PIX.
                    </p>
                </div>

                <div className="mt-6">
                    <Dialog open={isWithdrawOpen} onOpenChange={setIsWithdrawOpen}>
                        <DialogTrigger asChild>
                            <Button
                                className={cn("w-full btn-premium", !canWithdraw ? "opacity-50 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700")}
                                disabled={!canWithdraw}
                            >
                                <ArrowUpCircle className="mr-2 h-4 w-4" />
                                Solicitar Saque
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Solicitar Saque</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleWithdraw} className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="amount">Valor (R$)</Label>
                                    <Input
                                        id="amount"
                                        type="number"
                                        step="0.01"
                                        max={balance}
                                        value={withdrawAmount}
                                        onChange={(e) => setWithdrawAmount(e.target.value)}
                                        placeholder="0,00"
                                        required
                                    />
                                    <p className="text-xs text-slate-500">
                                        Máximo disponível: {formattedBalance}
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="pix">Chave PIX</Label>
                                    <Input
                                        id="pix"
                                        placeholder="CPF, Email ou Telefone"
                                        value={pixKey}
                                        onChange={(e) => setPixKey(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="flex items-center gap-2 p-3 bg-amber-50 text-amber-800 rounded-md text-sm">
                                    <AlertCircle className="h-4 w-4" />
                                    <span>O valor cairá na sua conta em até 24h úteis.</span>
                                </div>

                                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={isWithdrawing}>
                                    {isWithdrawing ? "Processando..." : "Confirmar Saque"}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardContent>
        </Card>
    );
}
