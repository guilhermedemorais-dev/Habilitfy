import { useMemo } from "react";
import { AlertTriangle, Loader2, RefreshCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type BookingUser = {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
};

export type AdminBookingRecord = {
  booking: {
    id: string;
    status: string;
    totalPrice: string;
  };
  student: BookingUser | null;
  instructorUser: BookingUser | null;
};

type AdminBookingsSectionProps = {
  bookings: AdminBookingRecord[];
  isUnauthorized: boolean;
  bookingsLoading: boolean;
  bookingsError: unknown;
  searchTerm: string;
  formatPersonName: (person?: BookingUser | null) => string;
  formatCurrency: (value: number | string | null | undefined) => string;
  onRefresh: () => void;
};

const getBookingStatusMeta = (status?: string | null) => {
  const classNames: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    confirmed: "bg-green-100 text-green-700",
    paid: "bg-blue-100 text-blue-700",
    completed: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };

  const labels: Record<string, string> = {
    pending: "Pendente",
    confirmed: "Confirmado",
    paid: "Pago",
    completed: "Concluido",
    cancelled: "Cancelado",
  };

  if (!status) {
    return { label: "—", className: "bg-slate-100 text-slate-600" };
  }

  return {
    label: labels[status] || status,
    className: classNames[status] || "bg-slate-100 text-slate-600",
  };
};

export function AdminBookingsSection({
  bookings,
  isUnauthorized,
  bookingsLoading,
  bookingsError,
  searchTerm,
  formatPersonName,
  formatCurrency,
  onRefresh,
}: AdminBookingsSectionProps) {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredBookings = useMemo(() => {
    if (!normalizedSearch) return bookings;

    return bookings.filter((row) => {
      const fields = [
        row.booking.id,
        row.booking.status,
        formatPersonName(row.student),
        formatPersonName(row.instructorUser),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return fields.includes(normalizedSearch);
    });
  }, [bookings, formatPersonName, normalizedSearch]);

  return (
    <section id="agendamentos" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-blue-100">
            Últimos agendamentos
          </h2>
          <p className="text-sm text-slate-500 dark:text-blue-400">
            Registros mais recentes da plataforma.
          </p>
        </div>
        <Button variant="ghost" size="icon" title="Recarregar" onClick={onRefresh}>
          <RefreshCcw className="h-4 w-4" />
        </Button>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="min-h-[120px]">
          {isUnauthorized ? (
            <div className="flex items-center gap-2 p-4 text-sm text-slate-500">
              <AlertTriangle className="h-4 w-4" />
              Acesso restrito. Faça login como admin.
            </div>
          ) : bookingsLoading ? (
            <div className="flex items-center gap-2 p-4 text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando agendamentos...
            </div>
          ) : bookingsError ? (
            <div className="flex items-center gap-2 p-4 text-sm text-red-600">
              <AlertTriangle className="h-4 w-4" />
              Erro ao carregar agendamentos: {(bookingsError as Error).message}
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="p-4 text-sm text-slate-500">
              Nenhum agendamento encontrado.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Instrutor</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.map((row) => {
                  const statusMeta = getBookingStatusMeta(row.booking.status);

                  return (
                    <TableRow key={row.booking.id}>
                      <TableCell className="font-medium">{row.booking.id}</TableCell>
                      <TableCell>{formatPersonName(row.student)}</TableCell>
                      <TableCell>{formatPersonName(row.instructorUser)}</TableCell>
                      <TableCell>{formatCurrency(row.booking.totalPrice)}</TableCell>
                      <TableCell>
                        <Badge
                          className={`border-none shadow-none ${statusMeta.className}`}
                        >
                          {statusMeta.label}
                        </Badge>
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
  );
}
