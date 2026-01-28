import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useWallet, type WalletTransaction } from "@/hooks/useWallet";
import { ArrowDownLeft, ArrowUpRight, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function TransactionHistory() {
    const { history, isLoading } = useWallet();

    if (isLoading) {
        return <div className="p-4 flex justify-center">Carregando extrato...</div>;
    }

    if (!history || history.length === 0) {
        return (
            <Card className="glass-premium">
                <CardHeader>
                    <CardTitle className="text-lg">Extrato Recente</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-slate-500">
                        Nenhuma transação encontrada.
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="glass-premium col-span-2">
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-500" />
                    Extrato Financeiro
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Data</TableHead>
                                <TableHead>Descrição</TableHead>
                                <TableHead className="text-right">Valor</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {history.map((tx) => (
                                <TableRow key={tx.id}>
                                    <TableCell className="font-medium">
                                        {format(new Date(tx.createdAt), "dd/MM/yyyy HH:mm", {
                                            locale: ptBR,
                                        })}
                                    </TableCell>
                                    <TableCell className="flex items-center gap-2">
                                        {getTypeIcon(tx.type)}
                                        <span>{tx.description || getTypeName(tx.type)}</span>
                                    </TableCell>
                                    <TableCell
                                        className={`text-right font-bold ${Number(tx.amount) >= 0 ? "text-emerald-600" : "text-rose-600"
                                            }`}
                                    >
                                        {new Intl.NumberFormat("pt-BR", {
                                            style: "currency",
                                            currency: "BRL",
                                        }).format(Number(tx.amount))}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}

function getTypeIcon(type: string) {
    switch (type) {
        case "credit":
        case "sale":
            return <ArrowDownLeft className="h-4 w-4 text-emerald-500" />;
        case "debit":
        case "withdrawal":
            return <ArrowUpRight className="h-4 w-4 text-rose-500" />;
        default:
            return <div className="h-4 w-4 rounded-full bg-slate-200" />;
    }
}

function getTypeName(type: string) {
    switch (type) {
        case "credit": return "Crédito";
        case "sale": return "Venda";
        case "debit": return "Débito";
        case "withdrawal": return "Saque";
        case "adjustment": return "Ajuste";
        default: return type;
    }
}
