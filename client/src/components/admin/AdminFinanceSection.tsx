import { useMemo, useState, type ComponentType } from "react";
import { AlertTriangle, Loader2, RefreshCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type AdminUser = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  role?: string | null;
};

export type AdminTransactionRow = {
  transaction: {
    id: string;
    bookingId?: string | null;
    type: string;
    status: string;
    amountGross: string;
    amountNet: string;
    gateway?: string | null;
    paymentId?: string | null;
    createdAt?: string | null;
  };
  fromUser: AdminUser | null;
  toUser: AdminUser | null;
  booking: { id: string } | null;
};

export type AdminWalletRow = {
  id: string;
  balance: string;
  currency?: string | null;
  updatedAt?: string | null;
  user?: AdminUser | null;
};

export type AdminWalletEntryRow = {
  entry: {
    id: string;
    type: string;
    amount: string;
    description?: string | null;
    bookingId?: string | null;
    createdAt?: string | null;
  };
  user: AdminUser | null;
};

export type AdminWithdrawalRow = {
  withdrawal: {
    id: string;
    userId: string;
    amount: string;
    status: string;
    destinationType?: string | null;
    destinationKey?: string | null;
    requestedAt?: string | null;
    processedAt?: string | null;
    processedByUserId?: string | null;
    notes?: string | null;
  };
  user: AdminUser | null;
  processedBy: AdminUser | null;
};

type FinanceCard = {
  label: string;
  value: number;
  loading: boolean;
  error: boolean;
  helper: string;
  icon: ComponentType<{ className?: string }>;
  tone: string;
  bg: string;
  format?: (value: number) => string;
};

type AdminFinanceSectionProps = {
  financeCards: FinanceCard[];
  transactions: AdminTransactionRow[];
  wallets: AdminWalletRow[];
  walletEntries: AdminWalletEntryRow[];
  withdrawals: AdminWithdrawalRow[];
  transactionsLoading: boolean;
  transactionsError: unknown;
  walletsLoading: boolean;
  walletsError: unknown;
  walletEntriesLoading: boolean;
  walletEntriesError: unknown;
  withdrawalsLoading: boolean;
  withdrawalsError: unknown;
  isUnauthorized: boolean;
  searchTerm: string;
  formatCurrency: (value: number | string | null | undefined) => string;
  formatPersonName: (person?: AdminUser | null) => string;
  formatRoleLabel: (role?: string | null) => string;
  onRefreshFinanceSummary: () => void;
  onRefreshTransactions: () => void;
  onRefreshWallets: () => void;
  onRefreshWalletEntries: () => void;
  onRefreshWithdrawals: () => void;
  onExportTransactions: (
    filteredTransactions: AdminTransactionRow[],
  ) => void;
  onExportWithdrawals: (
    filteredWithdrawals: AdminWithdrawalRow[],
  ) => void;
  onWithdrawalAction: (payload: { id: string; status: string }) => void;
  isUpdatingWithdrawal: boolean;
};

const getTransactionStatusMeta = (status?: string | null) => {
  const classNames: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    paid: "bg-green-100 text-green-700",
    processing: "bg-blue-100 text-blue-700",
    refunded: "bg-orange-100 text-orange-700",
    cancelled: "bg-red-100 text-red-700",
    failed: "bg-red-100 text-red-700",
  };

  const labels: Record<string, string> = {
    pending: "Pendente",
    paid: "Pago",
    processing: "Processando",
    refunded: "Reembolsado",
    cancelled: "Cancelado",
    failed: "Falhou",
  };

  if (!status) {
    return { label: "—", className: "bg-slate-100 text-slate-600" };
  }

  return {
    label: labels[status] || status,
    className: classNames[status] || "bg-slate-100 text-slate-600",
  };
};

const getTransactionTypeLabel = (type?: string | null) => {
  const labels: Record<string, string> = {
    booking: "Agendamento",
    withdrawal: "Saque",
    refund: "Reembolso",
    commission: "Comissao",
    affiliate: "Afiliado",
    coupon: "Cupom",
  };

  if (!type) return "—";
  return labels[type] || type;
};

const getWithdrawalStatusMeta = (status?: string | null) => {
  const classNames: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    approved: "bg-blue-100 text-blue-700",
    processed: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
  };

  const labels: Record<string, string> = {
    pending: "Pendente",
    approved: "Aprovado",
    processed: "Processado",
    rejected: "Rejeitado",
  };

  if (!status) {
    return { label: "—", className: "bg-slate-100 text-slate-600" };
  }

  return {
    label: labels[status] || status,
    className: classNames[status] || "bg-slate-100 text-slate-600",
  };
};

const getWalletEntryTypeMeta = (type?: string | null) => {
  const classNames: Record<string, string> = {
    credit: "bg-green-100 text-green-700",
    debit: "bg-red-100 text-red-700",
    refund: "bg-orange-100 text-orange-700",
    withdrawal: "bg-red-100 text-red-700",
    adjustment: "bg-blue-100 text-blue-700",
  };

  const labels: Record<string, string> = {
    credit: "Credito",
    debit: "Debito",
    refund: "Reembolso",
    withdrawal: "Saque",
    adjustment: "Ajuste",
  };

  if (!type) {
    return { label: "—", className: "bg-slate-100 text-slate-600" };
  }

  return {
    label: labels[type] || type,
    className: classNames[type] || "bg-slate-100 text-slate-600",
  };
};

export function AdminFinanceSection({
  financeCards,
  transactions,
  wallets,
  walletEntries,
  withdrawals,
  transactionsLoading,
  transactionsError,
  walletsLoading,
  walletsError,
  walletEntriesLoading,
  walletEntriesError,
  withdrawalsLoading,
  withdrawalsError,
  isUnauthorized,
  searchTerm,
  formatCurrency,
  formatPersonName,
  formatRoleLabel,
  onRefreshFinanceSummary,
  onRefreshTransactions,
  onRefreshWallets,
  onRefreshWalletEntries,
  onRefreshWithdrawals,
  onExportTransactions,
  onExportWithdrawals,
  onWithdrawalAction,
  isUpdatingWithdrawal,
}: AdminFinanceSectionProps) {
  const [transactionStatusFilter, setTransactionStatusFilter] = useState("all");
  const [transactionTypeFilter, setTransactionTypeFilter] = useState("all");
  const [walletRoleFilter, setWalletRoleFilter] = useState("all");
  const [withdrawalStatusFilter, setWithdrawalStatusFilter] = useState("all");

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredTransactions = useMemo(() => {
    return transactions.filter((row) => {
      if (
        transactionStatusFilter !== "all" &&
        row.transaction.status !== transactionStatusFilter
      ) {
        return false;
      }

      if (
        transactionTypeFilter !== "all" &&
        row.transaction.type !== transactionTypeFilter
      ) {
        return false;
      }

      if (!normalizedSearch) return true;

      const fields = [
        row.transaction.id,
        row.transaction.type,
        row.transaction.status,
        row.transaction.gateway,
        row.transaction.bookingId,
        formatPersonName(row.fromUser),
        formatPersonName(row.toUser),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return fields.includes(normalizedSearch);
    });
  }, [
    formatPersonName,
    normalizedSearch,
    transactionStatusFilter,
    transactionTypeFilter,
    transactions,
  ]);

  const filteredWallets = useMemo(() => {
    return wallets.filter((wallet) => {
      if (
        walletRoleFilter !== "all" &&
        wallet.user?.role !== walletRoleFilter
      ) {
        return false;
      }

      if (!normalizedSearch) return true;

      const fields = [
        wallet.id,
        wallet.user?.email,
        wallet.user?.firstName,
        wallet.user?.lastName,
        wallet.user?.role,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return fields.includes(normalizedSearch);
    });
  }, [normalizedSearch, walletRoleFilter, wallets]);

  const filteredWalletEntries = useMemo(() => {
    if (!normalizedSearch) return walletEntries;

    return walletEntries.filter((row) => {
      const fields = [
        row.entry.id,
        row.entry.type,
        row.entry.description,
        row.entry.bookingId,
        formatPersonName(row.user),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return fields.includes(normalizedSearch);
    });
  }, [formatPersonName, normalizedSearch, walletEntries]);

  const filteredWithdrawals = useMemo(() => {
    return withdrawals.filter((row) => {
      if (
        withdrawalStatusFilter !== "all" &&
        row.withdrawal.status !== withdrawalStatusFilter
      ) {
        return false;
      }

      if (!normalizedSearch) return true;

      const fields = [
        row.withdrawal.id,
        row.withdrawal.status,
        row.withdrawal.destinationType,
        row.withdrawal.destinationKey,
        formatPersonName(row.user),
        row.user?.email,
        formatPersonName(row.processedBy),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return fields.includes(normalizedSearch);
    });
  }, [
    formatPersonName,
    normalizedSearch,
    withdrawalStatusFilter,
    withdrawals,
  ]);

  return (
    <>
      <section id="financeiro" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Gestao financeira</h2>
            <p className="text-sm text-slate-500">
              Indicadores de caixa e operacoes da plataforma.
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            title="Recarregar"
            onClick={onRefreshFinanceSummary}
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {financeCards.map((card) => {
            const Icon = card.icon;
            const value = card.loading
              ? "..."
              : card.error
                ? "—"
                : card.format
                  ? card.format(card.value)
                  : card.value.toLocaleString("pt-BR");

            return (
              <Card key={card.label} className="border border-slate-200 shadow-sm">
                <CardContent className="flex items-center justify-between gap-4 p-5">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-blue-400">
                      {card.label}
                    </p>
                    <p className="text-xl font-bold text-slate-900 dark:text-blue-100">
                      {value}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-blue-300/70">
                      {card.error
                        ? "Dados temporariamente indisponíveis."
                        : card.helper}
                    </p>
                  </div>
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-lg ${card.bg} ${card.tone}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section id="transacoes" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Transacoes & cobrancas
            </h2>
            <p className="text-sm text-slate-500">
              Monitoramento em tempo real de pagamentos e repasses.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-44">
              <Select
                value={transactionStatusFilter}
                onValueChange={setTransactionStatusFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="paid">Pagos</SelectItem>
                  <SelectItem value="processing">Processando</SelectItem>
                  <SelectItem value="refunded">Reembolsados</SelectItem>
                  <SelectItem value="cancelled">Cancelados</SelectItem>
                  <SelectItem value="failed">Falhos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-44">
              <Select value={transactionTypeFilter} onValueChange={setTransactionTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="booking">Agendamentos</SelectItem>
                  <SelectItem value="withdrawal">Saques</SelectItem>
                  <SelectItem value="refund">Reembolsos</SelectItem>
                  <SelectItem value="commission">Comissoes</SelectItem>
                  <SelectItem value="affiliate">Afiliados</SelectItem>
                  <SelectItem value="coupon">Cupons</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Badge variant="outline" className="text-slate-500">
              {filteredTransactions.length} de {transactions.length}
            </Badge>
            <Button
              variant="outline"
              onClick={() => onExportTransactions(filteredTransactions)}
            >
              Exportar CSV
            </Button>
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <p className="text-sm font-semibold text-slate-700">
              Transacoes recentes
            </p>
            <Button
              variant="ghost"
              size="icon"
              title="Recarregar"
              onClick={onRefreshTransactions}
            >
              <RefreshCcw className="h-4 w-4" />
            </Button>
          </div>
          <div className="min-h-[120px]">
            {isUnauthorized ? (
              <div className="flex items-center gap-2 p-4 text-sm text-slate-500">
                <AlertTriangle className="h-4 w-4" />
                Acesso restrito. Faça login como admin.
              </div>
            ) : transactionsLoading ? (
              <div className="flex items-center gap-2 p-4 text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" /> Carregando
                transacoes...
              </div>
            ) : transactionsError ? (
              <div className="flex items-center gap-2 p-4 text-sm text-red-600">
                <AlertTriangle className="h-4 w-4" />
                Erro ao carregar transacoes: {(transactionsError as Error).message}
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="p-4 text-sm text-slate-500">
                Nenhuma transacao encontrada.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Destino</TableHead>
                    <TableHead>Gateway</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((row) => {
                    const statusMeta = getTransactionStatusMeta(
                      row.transaction.status,
                    );

                    return (
                      <TableRow key={row.transaction.id}>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span>{row.transaction.id}</span>
                            {row.transaction.bookingId ? (
                              <span className="text-xs text-slate-400">
                                Booking {row.transaction.bookingId}
                              </span>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getTransactionTypeLabel(row.transaction.type)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`border-none shadow-none ${statusMeta.className}`}
                          >
                            {statusMeta.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{formatCurrency(row.transaction.amountGross)}</span>
                            <span className="text-xs text-slate-400">
                              Liq. {formatCurrency(row.transaction.amountNet)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{formatPersonName(row.fromUser)}</TableCell>
                        <TableCell>{formatPersonName(row.toUser)}</TableCell>
                        <TableCell>{row.transaction.gateway || "—"}</TableCell>
                        <TableCell>
                          {row.transaction.createdAt
                            ? new Date(row.transaction.createdAt).toLocaleString(
                                "pt-BR",
                              )
                            : "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </section>

      <section id="carteiras" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Carteiras digitais
            </h2>
            <p className="text-sm text-slate-500">
              Saldo individual e movimentacoes recentes.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-44">
              <Select value={walletRoleFilter} onValueChange={setWalletRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Perfil" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="student">Alunos</SelectItem>
                  <SelectItem value="instructor">Instrutores</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Badge variant="outline" className="text-slate-500">
              {filteredWallets.length} de {wallets.length}
            </Badge>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <p className="text-sm font-semibold text-slate-700">
              Saldos por usuario
            </p>
            <Button
              variant="ghost"
              size="icon"
              title="Recarregar"
              onClick={onRefreshWallets}
            >
              <RefreshCcw className="h-4 w-4" />
            </Button>
          </div>
          <div className="min-h-[120px]">
            {isUnauthorized ? (
              <div className="flex items-center gap-2 p-4 text-sm text-slate-500">
                <AlertTriangle className="h-4 w-4" />
                Acesso restrito. Faça login como admin.
              </div>
            ) : walletsLoading ? (
              <div className="flex items-center gap-2 p-4 text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" /> Carregando
                carteiras...
              </div>
            ) : walletsError ? (
              <div className="flex items-center gap-2 p-4 text-sm text-red-600">
                <AlertTriangle className="h-4 w-4" />
                Erro ao carregar carteiras: {(walletsError as Error).message}
              </div>
            ) : filteredWallets.length === 0 ? (
              <div className="p-4 text-sm text-slate-500">
                Nenhuma carteira encontrada.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead>Saldo</TableHead>
                    <TableHead>Moeda</TableHead>
                    <TableHead>Atualizado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWallets.map((wallet) => (
                    <TableRow key={wallet.id}>
                      <TableCell className="font-medium">
                        {formatPersonName(wallet.user)}
                      </TableCell>
                      <TableCell>{formatRoleLabel(wallet.user?.role)}</TableCell>
                      <TableCell>{formatCurrency(wallet.balance)}</TableCell>
                      <TableCell>{wallet.currency || "BRL"}</TableCell>
                      <TableCell>
                        {wallet.updatedAt
                          ? new Date(wallet.updatedAt).toLocaleDateString("pt-BR")
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <p className="text-sm font-semibold text-slate-700">
              Movimentacoes recentes
            </p>
            <Button
              variant="ghost"
              size="icon"
              title="Recarregar"
              onClick={onRefreshWalletEntries}
            >
              <RefreshCcw className="h-4 w-4" />
            </Button>
          </div>
          <div className="min-h-[120px]">
            {isUnauthorized ? (
              <div className="flex items-center gap-2 p-4 text-sm text-slate-500">
                <AlertTriangle className="h-4 w-4" />
                Acesso restrito. Faça login como admin.
              </div>
            ) : walletEntriesLoading ? (
              <div className="flex items-center gap-2 p-4 text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" /> Carregando
                movimentacoes...
              </div>
            ) : walletEntriesError ? (
              <div className="flex items-center gap-2 p-4 text-sm text-red-600">
                <AlertTriangle className="h-4 w-4" />
                Erro ao carregar movimentacoes:{" "}
                {(walletEntriesError as Error).message}
              </div>
            ) : filteredWalletEntries.length === 0 ? (
              <div className="p-4 text-sm text-slate-500">
                Nenhuma movimentacao registrada.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Descricao</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWalletEntries.map((row) => {
                    const typeMeta = getWalletEntryTypeMeta(row.entry.type);

                    return (
                      <TableRow key={row.entry.id}>
                        <TableCell className="font-medium">
                          {formatPersonName(row.user)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`border-none shadow-none ${typeMeta.className}`}
                          >
                            {typeMeta.label}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatCurrency(row.entry.amount)}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{row.entry.description || "—"}</span>
                            {row.entry.bookingId ? (
                              <span className="text-xs text-slate-400">
                                Booking {row.entry.bookingId}
                              </span>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell>
                          {row.entry.createdAt
                            ? new Date(row.entry.createdAt).toLocaleString("pt-BR")
                            : "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </section>

      <section id="saques" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Saques</h2>
            <p className="text-sm text-slate-500">
              Acompanhe solicitacoes de saque e aprove manualmente.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-44">
              <Select
                value={withdrawalStatusFilter}
                onValueChange={setWithdrawalStatusFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="approved">Aprovados</SelectItem>
                  <SelectItem value="processed">Processados</SelectItem>
                  <SelectItem value="rejected">Rejeitados</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Badge variant="outline" className="text-slate-500">
              {filteredWithdrawals.length} de {withdrawals.length}
            </Badge>
            <Button
              variant="outline"
              onClick={() => onExportWithdrawals(filteredWithdrawals)}
            >
              Exportar CSV
            </Button>
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <p className="text-sm font-semibold text-slate-700">
              Solicitacoes de saque
            </p>
            <Button
              variant="ghost"
              size="icon"
              title="Recarregar"
              onClick={onRefreshWithdrawals}
            >
              <RefreshCcw className="h-4 w-4" />
            </Button>
          </div>
          <div className="min-h-[120px]">
            {isUnauthorized ? (
              <div className="flex items-center gap-2 p-4 text-sm text-slate-500">
                <AlertTriangle className="h-4 w-4" />
                Acesso restrito. Faça login como admin.
              </div>
            ) : withdrawalsLoading ? (
              <div className="flex items-center gap-2 p-4 text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" /> Carregando saques...
              </div>
            ) : withdrawalsError ? (
              <div className="flex items-center gap-2 p-4 text-sm text-red-600">
                <AlertTriangle className="h-4 w-4" />
                Erro ao carregar saques: {(withdrawalsError as Error).message}
              </div>
            ) : filteredWithdrawals.length === 0 ? (
              <div className="p-4 text-sm text-slate-500">
                Nenhum saque encontrado.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Destino</TableHead>
                    <TableHead>Solicitado em</TableHead>
                    <TableHead>Processado por</TableHead>
                    <TableHead className="text-right">Acoes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWithdrawals.map((row) => {
                    const statusMeta = getWithdrawalStatusMeta(
                      row.withdrawal.status,
                    );
                    const canApprove = row.withdrawal.status === "pending";
                    const canProcess = row.withdrawal.status === "approved";

                    return (
                      <TableRow key={row.withdrawal.id}>
                        <TableCell className="font-medium">
                          {formatPersonName(row.user)}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(row.withdrawal.amount)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`border-none shadow-none ${statusMeta.className}`}
                          >
                            {statusMeta.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{row.withdrawal.destinationType || "pix"}</span>
                            <span className="text-xs text-slate-400">
                              {row.withdrawal.destinationKey || "—"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {row.withdrawal.requestedAt
                            ? new Date(row.withdrawal.requestedAt).toLocaleString(
                                "pt-BR",
                              )
                            : "—"}
                        </TableCell>
                        <TableCell>{formatPersonName(row.processedBy)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {canApprove ? (
                              <>
                                <Button
                                  size="sm"
                                  className="h-8 rounded-md bg-green-600 px-3 text-white hover:bg-green-700"
                                  disabled={isUpdatingWithdrawal}
                                  onClick={() =>
                                    onWithdrawalAction({
                                      id: row.withdrawal.id,
                                      status: "approved",
                                    })
                                  }
                                >
                                  Aprovar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-8 rounded-md px-3"
                                  disabled={isUpdatingWithdrawal}
                                  onClick={() =>
                                    onWithdrawalAction({
                                      id: row.withdrawal.id,
                                      status: "rejected",
                                    })
                                  }
                                >
                                  Rejeitar
                                </Button>
                              </>
                            ) : null}
                            {canProcess ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 rounded-md px-3"
                                disabled={isUpdatingWithdrawal}
                                onClick={() =>
                                  onWithdrawalAction({
                                    id: row.withdrawal.id,
                                    status: "processed",
                                  })
                                }
                              >
                                Processar
                              </Button>
                            ) : null}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
