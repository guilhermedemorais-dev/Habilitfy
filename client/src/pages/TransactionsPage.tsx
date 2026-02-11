
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    ArrowDownLeft,
    ArrowUpRight,
    TrendingUp,
    Wallet,
    Calendar,
    Search,
    Download,
    Filter
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { PixConfigModal } from "@/components/PixConfigModal";
import type { Transaction } from "@shared/schema";
import { cn } from "@/lib/utils";

// MOCK DATA for initial dev
const mockTransactions = [
    {
        id: "1",
        type: "booking",
        amountGross: "120.00",
        amountNet: "108.00",
        status: "paid",
        createdAt: new Date().toISOString(),
        description: "Aula com João Silva",
    },
    {
        id: "2",
        type: "booking",
        amountGross: "120.00",
        amountNet: "108.00",
        status: "pending",
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        description: "Aula com Maria Oliveira",
    },
    {
        id: "3",
        type: "withdrawal",
        amountGross: "500.00",
        amountNet: "500.00",
        status: "processing",
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        description: "Saque via Pix",
    },
];

export default function TransactionsPage() {
    const [filterType, setFilterType] = useState("all");

    // In real app, fetch from API
    // const { data: transactions } = useQuery({ queryKey: ["/api/transactions"] });
    const transactions = mockTransactions;

    const totalBalance = 1250.00; // Mock balance
    const pendingBalance = 360.00; // Mock pending

    return (
        <div className="min-h-screen bg-slate-50 pb-24 md:pb-8 md:pl-20">
            <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Financeiro</h1>
                        <p className="text-slate-500">Gerencie seus ganhos e saques.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" className="gap-2">
                            <Download className="h-4 w-4" /> Exportar
                        </Button>
                        <PixConfigModal />
                    </div>
                </div>

                {/* Balance Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="bg-slate-900 text-white border-none shadow-lg">
                        <CardHeader className="pb-2">
                            <CardDescription className="text-slate-400">Saldo Disponível</CardDescription>
                            <CardTitle className="text-3xl">R$ {totalBalance.toFixed(2)}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center text-emerald-400 text-sm font-medium">
                                <TrendingUp className="mr-1 h-4 w-4" />
                                +12% este mês
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>A Receber</CardDescription>
                            <CardTitle className="text-3xl text-slate-600">R$ {pendingBalance.toFixed(2)}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center text-amber-500 text-sm font-medium">
                                <Calendar className="mr-1 h-4 w-4" />
                                Previsão: 2 dias
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Saques Realizados</CardDescription>
                            <CardTitle className="text-3xl text-slate-600">R$ 500.00</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm text-slate-400">
                                Último saque há 3 dias
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Transactions List */}
                <Card className="border-none shadow-sm">
                    <CardHeader>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <CardTitle>Histórico de Transações</CardTitle>
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                                    <Input
                                        type="search"
                                        placeholder="Buscar..."
                                        className="pl-9 w-[200px] md:w-[300px]"
                                    />
                                </div>
                                <Select defaultValue="all" onValueChange={setFilterType}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Filtrar por" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todas</SelectItem>
                                        <SelectItem value="booking">Aulas</SelectItem>
                                        <SelectItem value="withdrawal">Saques</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {transactions.map((transaction) => (
                                <div
                                    key={transaction.id}
                                    className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "h-10 w-10 rounded-full flex items-center justify-center",
                                            transaction.type === "booking" ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
                                        )}>
                                            {transaction.type === "booking" ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-900">
                                                {transaction.description || (transaction.type === "booking" ? "Pagamento de Aula" : "Saque")}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {format(new Date(transaction.createdAt), "dd 'de' MMMM, HH:mm", { locale: ptBR })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={cn(
                                            "block font-bold",
                                            transaction.type === "booking" ? "text-emerald-600" : "text-slate-900"
                                        )}>
                                            {transaction.type === "booking" ? "+" : "-"} R$ {transaction.amountGross}
                                        </span>
                                        <Badge variant="secondary" className={cn(
                                            "text-[10px] uppercase tracking-wider",
                                            transaction.status === "paid" && "bg-emerald-100 text-emerald-700 hover:bg-emerald-200",
                                            transaction.status === "pending" && "bg-amber-100 text-amber-700 hover:bg-amber-200",
                                            transaction.status === "processing" && "bg-blue-100 text-blue-700 hover:bg-blue-200",
                                        )}>
                                            {transaction.status === "paid" ? "Pago" :
                                                transaction.status === "pending" ? "Pendente" : "Processando"}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
