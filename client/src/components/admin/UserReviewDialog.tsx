import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Ban,
  Check,
  Clock3,
  FileText,
  History,
  Loader2,
  MessageSquare,
  Save,
  ShieldCheck,
  X,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

type ReviewPayload = {
  user: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    role?: string | null;
    cpf?: string | null;
    cnpj?: string | null;
    phone?: string | null;
    city?: string | null;
    state?: string | null;
    kycStatus?: string | null;
    isBlocked?: boolean;
    blockedAt?: string | null;
    blockedReason?: string | null;
    adminNotes?: string | null;
    adminNotesUpdatedAt?: string | null;
    createdAt?: string | null;
  };
  instructor?: {
    id: string;
    status?: string | null;
    vehicleModel?: string | null;
    vehicleYear?: string | null;
    vehicleType?: string | null;
    vehiclePlate?: string | null;
    credentialNumber?: string | null;
    credentialImageUrl?: string | null;
    selfieImageUrl?: string | null;
    documentImageUrl?: string | null;
    cnhFrontImageUrl?: string | null;
    cnhBackImageUrl?: string | null;
    vehicleAuthorizationImageUrl?: string | null;
    vehicleImageUrl?: string | null;
    vehicleDocImageUrl?: string | null;
    vehiclePlateImageUrl?: string | null;
  } | null;
  latestKyc?: {
    selfieUrl?: string | null;
    documentFrontUrl?: string | null;
    documentBackUrl?: string | null;
    status?: string | null;
    rejectionReason?: string | null;
    reviewNotes?: string | null;
  } | null;
  vehiclesSummary?: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
    items: Array<{
      id: string;
      brand?: string | null;
      model?: string | null;
      plate?: string | null;
      year?: number | null;
      category?: string | null;
      status?: string | null;
    }>;
  } | null;
  supportTickets: Array<{
    id: string;
    subject: string;
    message: string;
    status?: string | null;
    type?: string | null;
    createdAt?: string | null;
  }>;
  supportChatHistory: Array<{
    id: string;
    content: string;
    createdAt?: string | null;
    senderId: string;
    receiverId: string;
    counterpart?: {
      id: string;
      firstName?: string | null;
      lastName?: string | null;
      email?: string | null;
      role?: string | null;
    } | null;
  }>;
  chatHistory: Array<{
    id: string;
    content: string;
    createdAt?: string | null;
    senderId: string;
    receiverId: string;
    counterpart?: {
      id: string;
      firstName?: string | null;
      lastName?: string | null;
      email?: string | null;
      role?: string | null;
    } | null;
  }>;
  access: {
    totalRequests: number;
    uniqueIps: number;
    firstSeenAt?: string | null;
    lastSeenAt?: string | null;
    connectedMinutes: number;
    browserDistribution: Array<{ label: string; count: number }>;
    deviceDistribution: Array<{ label: string; count: number }>;
    topPaths: Array<{ path: string; count: number }>;
    heatmap: Array<{
      dayOfWeek: number;
      hour: number;
      count: number;
      intensity: number;
    }>;
    logs: Array<{
      id: string;
      ipAddress?: string | null;
      deviceType?: string | null;
      browser?: string | null;
      os?: string | null;
      requestPath?: string | null;
      requestMethod?: string | null;
      statusCode?: number | null;
      requestDurationMs?: number | null;
      createdAt?: string | null;
    }>;
  };
  sectionErrors?: Partial<Record<string, string>>;
};

type UserReviewDialogProps = {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];

const formatDateTime = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("pt-BR");
};

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("pt-BR");
};

const personName = (user?: {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
}) => {
  if (!user) return "—";
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
  return fullName || user.email || "—";
};

const roleLabel = (role?: string | null) => {
  if (!role) return "—";
  if (role === "student") return "Aluno";
  if (role === "instructor") return "Instrutor";
  if (role === "admin") return "Admin";
  return role;
};

const statusLabel = (status?: string | null) => {
  if (!status) return "—";
  if (status === "pending") return "Pendente";
  if (status === "approved") return "Aprovado";
  if (status === "rejected") return "Rejeitado";
  if (status === "open") return "Aberto";
  if (status === "in_progress") return "Em andamento";
  if (status === "resolved") return "Resolvido";
  if (status === "closed") return "Fechado";
  return status;
};

const isImageLike = (url?: string | null) =>
  Boolean(url && /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(url));

function MediaItem({ label, url }: { label: string; url?: string | null }) {
  if (!url) {
    return (
      <div className="rounded-md border border-dashed border-slate-200 p-3 text-xs text-slate-400">
        {label}: não enviado
      </div>
    );
  }
  return (
    <div className="rounded-md border border-slate-200 p-2">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-slate-700">{label}</span>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-blue-600 hover:underline"
        >
          Abrir
        </a>
      </div>
      {isImageLike(url) ? (
        <img
          src={url}
          alt={label}
          className="h-28 w-full rounded object-cover border border-slate-100"
        />
      ) : (
        <div className="flex h-28 items-center justify-center rounded border border-slate-100 bg-slate-50 text-xs text-slate-500">
          Arquivo não-imagem
        </div>
      )}
    </div>
  );
}

function SectionWarning({ messages }: { messages: string[] }) {
  if (messages.length === 0) return null;

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="space-y-1">
          {messages.map((message, index) => (
            <p key={`${message}-${index}`}>{message}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

export function UserReviewDialog({
  userId,
  open,
  onOpenChange,
}: UserReviewDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("review");
  const [notes, setNotes] = useState("");
  const [blockReason, setBlockReason] = useState("");

  const reviewQuery = useQuery<ReviewPayload | null>({
    queryKey: ["/api/admin/users", userId, "review"],
    queryFn: async () => {
      if (!userId) return null;
      const res = await apiRequest("GET", `/api/admin/users/${userId}/review`);
      return res.json();
    },
    enabled: open && !!userId,
  });

  useEffect(() => {
    if (!open) {
      setActiveTab("review");
    }
  }, [open]);

  useEffect(() => {
    if (reviewQuery.data?.user) {
      setNotes(reviewQuery.data.user.adminNotes || "");
      setBlockReason(reviewQuery.data.user.blockedReason || "");
    }
  }, [reviewQuery.data]);

  const invalidateAdminData = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/admin/instructors"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/users?role=student"] });
    queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    if (userId) {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users", userId, "review"] });
    }
  };

  const saveNotes = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("Usuário inválido");
      const res = await apiRequest("PATCH", `/api/admin/users/${userId}/notes`, {
        notes,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Anotações salvas" });
      invalidateAdminData();
    },
    onError: (err: any) => {
      toast({
        title: "Erro ao salvar anotações",
        description: err?.message || "Tente novamente",
        variant: "destructive",
      });
    },
  });

  const updateKyc = useMutation({
    mutationFn: async (status: "approved" | "rejected") => {
      if (!userId) throw new Error("Usuário inválido");
      const endpoint =
        status === "approved"
          ? `/api/admin/users/${userId}/approve`
          : `/api/admin/users/${userId}/reject`;
      const res = await apiRequest("POST", endpoint, {});
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Status de KYC atualizado" });
      invalidateAdminData();
    },
    onError: (err: any) => {
      toast({
        title: "Erro ao atualizar KYC",
        description: err?.message || "Tente novamente",
        variant: "destructive",
      });
    },
  });

  const blockUser = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("Usuário inválido");
      const res = await apiRequest("POST", `/api/admin/users/${userId}/block`, {
        reason: blockReason || null,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Usuário bloqueado" });
      invalidateAdminData();
    },
    onError: (err: any) => {
      toast({
        title: "Erro ao bloquear usuário",
        description: err?.message || "Tente novamente",
        variant: "destructive",
      });
    },
  });

  const unblockUser = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("Usuário inválido");
      const res = await apiRequest("POST", `/api/admin/users/${userId}/unblock`, {});
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Usuário desbloqueado" });
      invalidateAdminData();
    },
    onError: (err: any) => {
      toast({
        title: "Erro ao desbloquear usuário",
        description: err?.message || "Tente novamente",
        variant: "destructive",
      });
    },
  });

  const reviewData = reviewQuery.data;
  const user = reviewData?.user;
  const instructor = reviewData?.instructor;
  const sectionErrors = reviewData?.sectionErrors || {};
  const access = reviewData?.access || {
    totalRequests: 0,
    uniqueIps: 0,
    firstSeenAt: null,
    lastSeenAt: null,
    connectedMinutes: 0,
    browserDistribution: [],
    deviceDistribution: [],
    topPaths: [],
    heatmap: [],
    logs: [],
  };
  const isBusy =
    saveNotes.isPending ||
    updateKyc.isPending ||
    blockUser.isPending ||
    unblockUser.isPending;
  const reviewWarnings = useMemo(
    () =>
      Array.from(
        new Set(
          [
            sectionErrors.instructor,
            sectionErrors.kyc,
            sectionErrors.vehicles,
          ].filter(Boolean) as string[],
        ),
      ),
    [sectionErrors.instructor, sectionErrors.kyc, sectionErrors.vehicles],
  );
  const historyWarnings = useMemo(
    () =>
      Array.from(
        new Set(
          [
            sectionErrors.supportTickets,
            sectionErrors.chatHistory,
            sectionErrors.access,
          ].filter(Boolean) as string[],
        ),
      ),
    [sectionErrors.access, sectionErrors.chatHistory, sectionErrors.supportTickets],
  );

  const heatmapMap = useMemo(() => {
    const map = new Map<string, { count: number; intensity: number }>();
    for (const point of access.heatmap) {
      map.set(`${point.dayOfWeek}-${point.hour}`, {
        count: point.count,
        intensity: point.intensity,
      });
    }
    return map;
  }, [access.heatmap]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] max-w-6xl max-h-[92vh] overflow-hidden p-0">
        <DialogHeader className="border-b border-slate-200 px-6 py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <DialogTitle className="text-lg">
                Revisão do Usuário
              </DialogTitle>
              <DialogDescription>
                KYC, notas internas, histórico de suporte/chat e logs de acesso.
              </DialogDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setActiveTab("history")}
            >
              <History className="mr-2 h-4 w-4" />
              Histórico completo
            </Button>
          </div>
        </DialogHeader>

        {reviewQuery.isLoading ? (
          <div className="flex h-[70vh] items-center justify-center gap-2 text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando dados do usuário...
          </div>
        ) : reviewQuery.error || !reviewData || !user ? (
          <div className="p-6 text-sm text-red-600">
            Não foi possível carregar os dados de revisão.
          </div>
        ) : (
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex h-[78vh] flex-col"
          >
            <div className="border-b border-slate-100 px-6 py-3">
              <TabsList>
                <TabsTrigger value="review">Revisão</TabsTrigger>
                <TabsTrigger value="history">Histórico</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="review" className="mt-0 flex-1 overflow-hidden">
              <ScrollArea className="h-full px-6 py-5">
                <div className="space-y-6">
                  <SectionWarning messages={reviewWarnings} />
                  <div className="grid gap-4 lg:grid-cols-[1.2fr,1fr]">
                    <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className="bg-slate-100 text-slate-700">
                          {roleLabel(user.role)}
                        </Badge>
                        <Badge className="bg-blue-100 text-blue-700">
                          KYC: {statusLabel(user.kycStatus)}
                        </Badge>
                        {user.isBlocked ? (
                          <Badge className="bg-red-100 text-red-700">Banido</Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-700">Ativo</Badge>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {personName(user)}
                        </p>
                        <p className="text-xs text-slate-500">{user.email || "—"}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="text-slate-400">CPF</p>
                          <p className="font-medium text-slate-700">{user.cpf || "—"}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">CNPJ</p>
                          <p className="font-medium text-slate-700">{user.cnpj || "—"}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Telefone</p>
                          <p className="font-medium text-slate-700">{user.phone || "—"}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Local</p>
                          <p className="font-medium text-slate-700">
                            {[user.city, user.state].filter(Boolean).join(" / ") || "—"}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-slate-400">
                        Cadastro: {formatDate(user.createdAt)}
                      </p>
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-slate-600" />
                        <p className="text-sm font-semibold text-slate-800">
                          Anotações internas
                        </p>
                      </div>
                      <Textarea
                        value={notes}
                        onChange={(event) => setNotes(event.target.value)}
                        placeholder="Escreva observações internas sobre este usuário..."
                        className="min-h-[120px]"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => saveNotes.mutate()}
                        disabled={isBusy}
                      >
                        <Save className="mr-2 h-4 w-4" />
                        Salvar anotação
                      </Button>
                      <p className="text-[11px] text-slate-400">
                        Última atualização: {formatDateTime(user.adminNotesUpdatedAt)}
                      </p>
                    </div>
                  </div>

                  {instructor ? (
                    <div className="rounded-lg border border-blue-200 bg-blue-50/40 p-4">
                      <p className="text-sm font-semibold text-blue-800">
                        Veículos do instrutor (RN-007)
                      </p>
                      <p className="text-xs text-blue-700 mt-1">
                        Após aprovado, o instrutor pode cadastrar quantos veículos quiser.
                        Cada veículo é analisado separadamente.
                      </p>
                      {reviewData.vehiclesSummary ? (
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                          <Badge className="bg-slate-100 text-slate-700">
                            Total: {reviewData.vehiclesSummary.total}
                          </Badge>
                          <Badge className="bg-green-100 text-green-700">
                            Aprovados: {reviewData.vehiclesSummary.approved}
                          </Badge>
                          <Badge className="bg-yellow-100 text-yellow-700">
                            Pendentes: {reviewData.vehiclesSummary.pending}
                          </Badge>
                          <Badge className="bg-red-100 text-red-700">
                            Rejeitados: {reviewData.vehiclesSummary.rejected}
                          </Badge>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-slate-800">
                      Evidências e documentos
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      <MediaItem label="Selfie (instrutor)" url={instructor?.selfieImageUrl} />
                      <MediaItem
                        label="Documento (instrutor)"
                        url={instructor?.documentImageUrl}
                      />
                      <MediaItem
                        label="Credencial instrutor"
                        url={instructor?.credentialImageUrl}
                      />
                      <MediaItem label="CNH frente" url={instructor?.cnhFrontImageUrl} />
                      <MediaItem label="CNH verso" url={instructor?.cnhBackImageUrl} />
                      <MediaItem
                        label="Autorização do veículo"
                        url={instructor?.vehicleAuthorizationImageUrl}
                      />
                      <MediaItem label="KYC selfie" url={reviewData.latestKyc?.selfieUrl} />
                      <MediaItem
                        label="KYC documento frente"
                        url={reviewData.latestKyc?.documentFrontUrl}
                      />
                      <MediaItem
                        label="KYC documento verso"
                        url={reviewData.latestKyc?.documentBackUrl}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-slate-800">
                      Ações administrativas
                    </p>
                    <div className="grid gap-3 md:grid-cols-[1fr,auto]">
                      <Input
                        value={blockReason}
                        onChange={(event) => setBlockReason(event.target.value)}
                        placeholder="Motivo do bloqueio (opcional)"
                      />
                      <div className="flex flex-wrap items-center gap-2">
                        {user.role === "instructor" ? (
                          <>
                            <Button
                              type="button"
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              disabled={isBusy}
                              onClick={() => updateKyc.mutate("approved")}
                            >
                              <Check className="mr-2 h-4 w-4" />
                              Aprovar KYC
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              disabled={isBusy}
                              onClick={() => updateKyc.mutate("rejected")}
                            >
                              <X className="mr-2 h-4 w-4" />
                              Reprovar KYC
                            </Button>
                          </>
                        ) : null}
                        {user.isBlocked ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={isBusy}
                            onClick={() => unblockUser.mutate()}
                          >
                            <ShieldCheck className="mr-2 h-4 w-4" />
                            Desbloquear
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            disabled={isBusy}
                            onClick={() => blockUser.mutate()}
                          >
                            <Ban className="mr-2 h-4 w-4" />
                            Bloquear (Banir)
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="history" className="mt-0 flex-1 overflow-hidden">
              <ScrollArea className="h-full px-6 py-5">
                <div className="space-y-6">
                  <SectionWarning messages={historyWarnings} />
                  <div className="grid gap-3 md:grid-cols-4">
                    <div className="rounded-lg border border-slate-200 bg-white p-3">
                      <p className="text-xs text-slate-500">Requisições</p>
                      <p className="text-lg font-bold text-slate-900">
                        {access.totalRequests}
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white p-3">
                      <p className="text-xs text-slate-500">IPs únicos</p>
                      <p className="text-lg font-bold text-slate-900">
                        {access.uniqueIps}
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white p-3">
                      <p className="text-xs text-slate-500">Tempo conectado</p>
                      <p className="text-lg font-bold text-slate-900">
                        {access.connectedMinutes} min
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white p-3">
                      <p className="text-xs text-slate-500">Último acesso</p>
                      <p className="text-sm font-semibold text-slate-900">
                        {formatDateTime(access.lastSeenAt)}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-3">
                    <div className="rounded-lg border border-slate-200 bg-white p-4">
                      <p className="text-sm font-semibold text-slate-800 mb-2">
                        Browsers
                      </p>
                      <div className="space-y-1">
                        {access.browserDistribution.slice(0, 5).map((item) => (
                          <div
                            key={item.label}
                            className="flex items-center justify-between text-xs"
                          >
                            <span className="text-slate-600">{item.label}</span>
                            <span className="font-semibold text-slate-800">{item.count}</span>
                          </div>
                        ))}
                        {access.browserDistribution.length === 0 ? (
                          <p className="text-xs text-slate-500">Sem dados.</p>
                        ) : null}
                      </div>
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-white p-4">
                      <p className="text-sm font-semibold text-slate-800 mb-2">
                        Dispositivos
                      </p>
                      <div className="space-y-1">
                        {access.deviceDistribution.slice(0, 5).map((item) => (
                          <div
                            key={item.label}
                            className="flex items-center justify-between text-xs"
                          >
                            <span className="text-slate-600">{item.label}</span>
                            <span className="font-semibold text-slate-800">{item.count}</span>
                          </div>
                        ))}
                        {access.deviceDistribution.length === 0 ? (
                          <p className="text-xs text-slate-500">Sem dados.</p>
                        ) : null}
                      </div>
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-white p-4">
                      <p className="text-sm font-semibold text-slate-800 mb-2">
                        Rotas mais usadas
                      </p>
                      <div className="space-y-1">
                        {access.topPaths.slice(0, 5).map((item) => (
                          <div
                            key={item.path}
                            className="flex items-center justify-between gap-2 text-xs"
                          >
                            <span className="text-slate-600 truncate">{item.path}</span>
                            <span className="font-semibold text-slate-800">{item.count}</span>
                          </div>
                        ))}
                        {access.topPaths.length === 0 ? (
                          <p className="text-xs text-slate-500">Sem dados.</p>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-lg border border-slate-200 bg-white p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-slate-600" />
                        <p className="text-sm font-semibold text-slate-800">
                          Chat com suporte
                        </p>
                      </div>
                      {reviewData.supportChatHistory.length === 0 ? (
                        <p className="text-xs text-slate-500">Sem mensagens de suporte.</p>
                      ) : (
                        <div className="space-y-2">
                          {reviewData.supportChatHistory.slice(0, 8).map((message) => (
                            <div
                              key={message.id}
                              className="rounded border border-slate-200 bg-slate-50 p-2"
                            >
                              <p className="text-[11px] text-slate-500">
                                {personName(message.counterpart || undefined)} •{" "}
                                {formatDateTime(message.createdAt)}
                              </p>
                              <p className="text-xs text-slate-700">{message.content}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-white p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-slate-600" />
                        <p className="text-sm font-semibold text-slate-800">
                          Tickets de suporte
                        </p>
                      </div>
                      {reviewData.supportTickets.length === 0 ? (
                        <p className="text-xs text-slate-500">Sem tickets de suporte.</p>
                      ) : (
                        <div className="space-y-2">
                          {reviewData.supportTickets.slice(0, 8).map((ticket) => (
                            <div
                              key={ticket.id}
                              className="rounded border border-slate-200 bg-slate-50 p-2"
                            >
                              <p className="text-xs font-medium text-slate-800">
                                {ticket.subject}
                              </p>
                              <p className="text-[11px] text-slate-500">
                                {statusLabel(ticket.status)} • {formatDateTime(ticket.createdAt)}
                              </p>
                              <p className="mt-1 text-xs text-slate-700 line-clamp-3">
                                {ticket.message}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-slate-600" />
                      <p className="text-sm font-semibold text-slate-800">
                        Histórico geral de chat (usuário, aluno e instrutor)
                      </p>
                    </div>
                    {reviewData.chatHistory.length === 0 ? (
                      <p className="text-xs text-slate-500">Sem histórico de chat.</p>
                    ) : (
                      <div className="space-y-2">
                        {reviewData.chatHistory.slice(0, 12).map((message) => (
                          <div
                            key={message.id}
                            className="rounded border border-slate-200 bg-slate-50 p-2"
                          >
                            <p className="text-[11px] text-slate-500">
                              {personName(message.counterpart || undefined)} •{" "}
                              {roleLabel(message.counterpart?.role)} •{" "}
                              {formatDateTime(message.createdAt)}
                            </p>
                            <p className="text-xs text-slate-700">{message.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <p className="text-sm font-semibold text-slate-800 mb-2">
                      Mapa de calor de uso (dia x hora)
                    </p>
                    <div className="overflow-x-auto">
                      <div className="min-w-[760px]">
                        <div className="mb-1 grid grid-cols-[48px_repeat(24,minmax(0,1fr))] gap-1 text-[10px] text-slate-400">
                          <div />
                          {Array.from({ length: 24 }).map((_, hour) => (
                            <div key={`h-${hour}`} className="text-center">
                              {hour % 3 === 0 ? String(hour).padStart(2, "0") : ""}
                            </div>
                          ))}
                        </div>
                        {weekDays.map((dayLabel, dayIndex) => (
                          <div
                            key={dayLabel}
                            className="grid grid-cols-[48px_repeat(24,minmax(0,1fr))] gap-1 mb-1"
                          >
                            <div className="text-[10px] text-slate-500">{dayLabel}</div>
                            {Array.from({ length: 24 }).map((_, hour) => {
                              const point = heatmapMap.get(`${dayIndex}-${hour}`);
                              const intensity = point?.intensity || 0;
                              const count = point?.count || 0;
                              return (
                                <div
                                  key={`${dayIndex}-${hour}`}
                                  title={`${dayLabel} ${String(hour).padStart(2, "0")}:00 • ${count} acesso(s)`}
                                  className="h-4 rounded"
                                  style={{
                                    backgroundColor:
                                      count === 0
                                        ? "rgba(148,163,184,0.12)"
                                        : `rgba(37,99,235,${Math.min(
                                            0.15 + intensity * 0.85,
                                            1,
                                          )})`,
                                  }}
                                />
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2">
                      Intensidade maior = mais ações naquele horário.
                    </p>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <p className="text-sm font-semibold text-slate-800 mb-3">
                      Logs recentes de acesso
                    </p>
                    <div className="space-y-2">
                      {access.logs.slice(0, 20).map((log) => (
                        <div
                          key={log.id}
                          className="grid gap-2 rounded border border-slate-200 bg-slate-50 p-2 text-[11px] text-slate-700 md:grid-cols-[1.3fr,1fr,1fr,2fr]"
                        >
                          <div>
                            <p className="font-medium">{formatDateTime(log.createdAt)}</p>
                            <p className="text-slate-500">
                              <Clock3 className="inline mr-1 h-3 w-3" />
                              {log.requestDurationMs || 0}ms
                            </p>
                          </div>
                          <div>
                            <p className="font-medium">{log.ipAddress || "—"}</p>
                            <p className="text-slate-500">{log.os || "SO desconhecido"}</p>
                          </div>
                          <div>
                            <p className="font-medium">{log.browser || "Browser"}</p>
                            <p className="text-slate-500">{log.deviceType || "device"}</p>
                          </div>
                          <div>
                            <p className="font-medium break-all">{log.requestPath || "—"}</p>
                            <p className="text-slate-500">
                              {(log.requestMethod || "GET").toUpperCase()} • status{" "}
                              {log.statusCode || "—"}
                            </p>
                          </div>
                        </div>
                      ))}
                      {access.logs.length === 0 ? (
                        <p className="text-xs text-slate-500">
                          Não há logs de acesso para este usuário.
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
