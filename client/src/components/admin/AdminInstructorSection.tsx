import { useMemo, useState } from "react";
import { AlertTriangle, Eye, Loader2, RefreshCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

export type AdminUserSummary = {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  isBlocked?: boolean;
};

export type AdminInstructorRecord = {
  id: string;
  userId: string;
  status: "approved" | "pending" | "rejected";
  vehicleModel?: string | null;
  vehicleYear?: string | null;
  vehicleType?: string | null;
  credentialNumber?: string | null;
  createdAt?: string | null;
  user?: AdminUserSummary | null;
};

type AdminInstructorSectionProps = {
  instructors: AdminInstructorRecord[];
  isUnauthorized: boolean;
  instructorsLoading: boolean;
  instructorsError: unknown;
  searchTerm: string;
  pendingCount: number;
  totalCount: number;
  formatPersonName: (person?: AdminUserSummary | null) => string;
  onRefresh: () => void;
  onReview: (userId?: string | null) => void;
};

const getInstructorStatusMeta = (status?: string | null) => {
  const classNames: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
  };

  const labels: Record<string, string> = {
    pending: "Pendente",
    approved: "Aprovado",
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

export function AdminInstructorSection({
  instructors,
  isUnauthorized,
  instructorsLoading,
  instructorsError,
  searchTerm,
  pendingCount,
  totalCount,
  formatPersonName,
  onRefresh,
  onReview,
}: AdminInstructorSectionProps) {
  const [instructorStatusFilter, setInstructorStatusFilter] = useState("all");
  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredInstructors = useMemo(() => {
    return instructors.filter((instructor) => {
      if (
        instructorStatusFilter !== "all" &&
        instructor.status !== instructorStatusFilter
      ) {
        return false;
      }

      if (!normalizedSearch) return true;

      const fields = [
        instructor.user?.firstName,
        instructor.user?.lastName,
        instructor.user?.email,
        instructor.vehicleModel,
        instructor.vehicleYear,
        instructor.vehicleType,
        instructor.credentialNumber,
        instructor.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return fields.includes(normalizedSearch);
    });
  }, [instructorStatusFilter, instructors, normalizedSearch]);

  const pendingInstructors = useMemo(
    () => instructors.filter((instructor) => instructor.status === "pending"),
    [instructors],
  );

  return (
    <>
      <section id="kyc" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-blue-100">
              Instrutores pendentes (KYC)
            </h2>
            <p className="text-sm text-slate-500 dark:text-blue-400">
              Aprovações manuais aguardando análise.
            </p>
          </div>
          <Badge className="bg-yellow-100 text-yellow-800">
            {pendingCount} pendente(s)
          </Badge>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <p className="text-sm font-semibold text-slate-700">
              Fila de validação
            </p>
            <Button variant="ghost" size="icon" title="Recarregar" onClick={onRefresh}>
              <RefreshCcw className="h-4 w-4" />
            </Button>
          </div>
          <div className="min-h-[120px]">
            {isUnauthorized ? (
              <div className="flex items-center gap-2 p-4 text-sm text-slate-500">
                <AlertTriangle className="h-4 w-4" />
                Acesso restrito. Faça login como admin.
              </div>
            ) : instructorsLoading ? (
              <div className="flex items-center gap-2 p-4 text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" /> Carregando
                instrutores...
              </div>
            ) : instructorsError ? (
              <div className="flex items-center gap-2 p-4 text-sm text-red-600">
                <AlertTriangle className="h-4 w-4" />
                Erro ao carregar pendentes: {(instructorsError as Error).message}
              </div>
            ) : pendingInstructors.length === 0 ? (
              <div className="p-4 text-sm text-slate-500">
                Nenhum instrutor pendente.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Instrutor</TableHead>
                    <TableHead>Veículo</TableHead>
                    <TableHead>Credencial</TableHead>
                    <TableHead>Data cadastro</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingInstructors.map((instrutor) => {
                    const fullName = [instrutor.user?.firstName, instrutor.user?.lastName]
                      .filter(Boolean)
                      .join(" ");
                    const email = instrutor.user?.email || "";
                    const displayName = fullName || email || instrutor.userId || "Instrutor";
                    const showEmail = Boolean(email && email !== displayName);
                    const vehicleLabel = [instrutor.vehicleModel, instrutor.vehicleYear]
                      .filter(Boolean)
                      .join(" ");
                    const typeLabel = instrutor.vehicleType
                      ? `(${instrutor.vehicleType})`
                      : "";

                    return (
                      <TableRow key={instrutor.id}>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span>{displayName}</span>
                            {showEmail ? (
                              <span className="text-xs text-slate-400">{email}</span>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-slate-700 dark:text-blue-200">
                            {vehicleLabel || "—"}{" "}
                            <span className="text-xs text-slate-400 dark:text-blue-400">
                              {typeLabel}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {instrutor.credentialNumber ? (
                            <div className="flex items-center gap-1 text-xs text-blue-600">
                              <Eye className="h-3 w-3" /> {instrutor.credentialNumber}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {instrutor.createdAt
                            ? new Date(instrutor.createdAt).toLocaleDateString("pt-BR")
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 rounded-md px-3"
                              onClick={() => onReview(instrutor.userId)}
                            >
                              Revisar
                            </Button>
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

      <section id="instrutores" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-blue-100">
              Lista de instrutores
            </h2>
            <p className="text-sm text-slate-500 dark:text-blue-400">
              Base completa de instrutores cadastrados.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-44">
              <Select
                value={instructorStatusFilter}
                onValueChange={setInstructorStatusFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="approved">Aprovados</SelectItem>
                  <SelectItem value="rejected">Rejeitados</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Badge variant="outline" className="text-slate-500">
              {filteredInstructors.length} de {totalCount}
            </Badge>
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="min-h-[120px]">
            {isUnauthorized ? (
              <div className="flex items-center gap-2 p-4 text-sm text-slate-500">
                <AlertTriangle className="h-4 w-4" />
                Acesso restrito. Faça login como admin.
              </div>
            ) : instructorsLoading ? (
              <div className="flex items-center gap-2 p-4 text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" /> Carregando
                instrutores...
              </div>
            ) : instructorsError ? (
              <div className="flex items-center gap-2 p-4 text-sm text-red-600">
                <AlertTriangle className="h-4 w-4" />
                Erro ao carregar instrutores: {(instructorsError as Error).message}
              </div>
            ) : filteredInstructors.length === 0 ? (
              <div className="p-4 text-sm text-slate-500">
                Nenhum instrutor encontrado.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Instrutor</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Veículo</TableHead>
                    <TableHead>Credencial</TableHead>
                    <TableHead>Cadastro</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInstructors.map((instrutor) => {
                    const statusMeta = getInstructorStatusMeta(instrutor.status);
                    const vehicleLabel = [instrutor.vehicleModel, instrutor.vehicleYear]
                      .filter(Boolean)
                      .join(" ");
                    const typeLabel = instrutor.vehicleType
                      ? `(${instrutor.vehicleType})`
                      : "";

                    return (
                      <TableRow key={instrutor.id}>
                        <TableCell className="font-medium">
                          {formatPersonName(instrutor.user)}
                        </TableCell>
                        <TableCell>{instrutor.user?.email || "—"}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge
                              className={`border-none shadow-none ${statusMeta.className}`}
                            >
                              {statusMeta.label}
                            </Badge>
                            {instrutor.user?.isBlocked ? (
                              <Badge className="border-none shadow-none bg-red-100 text-red-700">
                                Banido
                              </Badge>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-slate-700 dark:text-blue-200">
                            {vehicleLabel || "—"}{" "}
                            <span className="text-xs text-slate-400 dark:text-blue-400">
                              {typeLabel}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{instrutor.credentialNumber || "—"}</TableCell>
                        <TableCell>
                          {instrutor.createdAt
                            ? new Date(instrutor.createdAt).toLocaleDateString("pt-BR")
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 rounded-md px-3"
                            onClick={() => onReview(instrutor.userId)}
                          >
                            Revisar
                          </Button>
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
