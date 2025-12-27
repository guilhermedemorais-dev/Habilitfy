import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Eye, Loader2, AlertTriangle, RefreshCcw } from "lucide-react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type PendingInstructor = {
  id: string;
  userId: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  vehicleModel?: string | null;
  vehicleType?: string | null;
  vehicleYear?: string | null;
  credentialNumber?: string | null;
  createdAt?: string | null;
};

export default function Admin() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading, error } = useQuery<PendingInstructor[] | null>({
    queryKey: ["/api/admin/instructors/pending"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: user?.role === "admin",
  });

  const pending = useMemo(() => data || [], [data]);
  const isUnauthorized = data === null;

  const updateStatus = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: "approved" | "rejected" | "pending";
    }) => {
      const res = await apiRequest(
        "PATCH",
        `/api/admin/instructors/${id}/status`,
        { status },
      );
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Status atualizado" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/instructors/pending"] });
    },
    onError: (err: any) => {
      toast({
        title: "Erro ao atualizar",
        description: err?.message || "Tente novamente",
        variant: "destructive",
      });
    },
  });

  return (
    <AuthGuard redirectTo="/admin" requiredRoles={["admin"]}>
      <div className="min-h-screen bg-gray-50 p-6 md:p-12">
        <div className="max-w-6xl mx-auto">
          <header className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900">
              Painel Administrativo
            </h1>
            <div className="flex gap-2">
              <Button variant="outline">Exportar Relatórios</Button>
            </div>
          </header>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h2 className="font-bold text-lg">Instrutores Pendentes</h2>
                <p className="text-sm text-slate-400">Aguardando aprovação</p>
              </div>
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
                {pending.length} pendente(s)
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                title="Recarregar"
                onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/instructors/pending"] })}
              >
                <RefreshCcw className="w-4 h-4" />
              </Button>
            </div>
            <div className="min-h-[120px]">
              {isUnauthorized ? (
                <div className="flex items-center gap-2 p-4 text-slate-500 text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  Acesso restrito. Faça login como admin.
                </div>
              ) : isLoading ? (
                <div className="flex items-center gap-2 p-4 text-slate-500">
                  <Loader2 className="w-4 h-4 animate-spin" /> Carregando instrutores...
                </div>
              ) : error ? (
                <div className="flex items-center gap-2 p-4 text-red-600 text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  Erro ao carregar pendentes: {(error as Error).message}
                </div>
              ) : pending.length === 0 ? (
                <div className="p-4 text-slate-500 text-sm">Nenhum instrutor pendente.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Instrutor</TableHead>
                      <TableHead>Veículo</TableHead>
                      <TableHead>Credencial</TableHead>
                      <TableHead>Data Cadastro</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pending.map((instrutor) => (
                      <TableRow key={instrutor.id}>
                        <TableCell className="font-medium">
                          {instrutor.firstName || instrutor.lastName
                            ? `${instrutor.firstName ?? ""} ${instrutor.lastName ?? ""}`.trim()
                            : instrutor.email || instrutor.userId || "Instrutor"}
                        </TableCell>
                        <TableCell>
                          {[instrutor.vehicleModel, instrutor.vehicleYear].filter(Boolean).join(" ")}
                        </TableCell>
                        <TableCell>
                          {instrutor.credentialNumber ? (
                            <div className="flex items-center gap-1 text-blue-600 text-xs">
                              <Eye className="w-3 h-3" /> {instrutor.credentialNumber}
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
                        <TableCell className="text-right space-x-2">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 h-8 w-8 p-0 text-white rounded-full"
                            disabled={updateStatus.isLoading}
                            onClick={() =>
                              updateStatus.mutate({
                                id: instrutor.id,
                                status: "approved",
                              })
                            }
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-8 w-8 p-0 rounded-full"
                            disabled={updateStatus.isLoading}
                            onClick={() =>
                              updateStatus.mutate({
                                id: instrutor.id,
                                status: "rejected",
                              })
                            }
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="font-bold text-lg">Últimos Agendamentos</h2>
            </div>
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
                    <TableRow>
                        <TableCell>#8921</TableCell>
                        <TableCell>Maria Silva</TableCell>
                        <TableCell>Carlos Instrutor</TableCell>
                        <TableCell>R$ 80,00</TableCell>
                        <TableCell><Badge className="bg-green-100 text-green-700 border-none shadow-none">Confirmado</Badge></TableCell>
                    </TableRow>
                     <TableRow>
                        <TableCell>#8920</TableCell>
                        <TableCell>Pedro Souza</TableCell>
                        <TableCell>Fernanda Costa</TableCell>
                        <TableCell>R$ 145,00</TableCell>
                        <TableCell><Badge className="bg-yellow-100 text-yellow-700 border-none shadow-none">Pendente Pix</Badge></TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </div>
        </div>
      </div>
    </AuthGuard>
  );
}
