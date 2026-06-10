import { useEffect, useMemo, useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from "@tanstack/react-query";
import {
  AlertTriangle,
  Ban,
  Check,
  Clock3,
  FileText,
  History,
  Loader2,
  Save,
  ShieldCheck,
  X,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
    id?: string;
    selfieUrl?: string | null;
    documentFrontUrl?: string | null;
    documentBackUrl?: string | null;
    status?: string | null;
    rejectionReason?: string | null;
    reviewNotes?: string | null;
    documentValidationDetails?: {
      submissionType?: string;
      role?: string;
      isLicensed?: boolean;
      licenseImageUrl?: string | null;
      theoreticalProofImageUrl?: string | null;
      credentialImageUrl?: string | null;
    } | null;
    createdAt?: string | null;
  } | null;
  vehiclesSummary?: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
  } | null;
  sectionErrors?: Partial<Record<string, string>>;
};

type FinancePayload = {
  wallet: {
    id: string;
    balance?: string | number | null;
    currency?: string | null;
  } | null;
  entries: Array<{
    entry: {
      id: string;
      type?: string | null;
      amount?: string | number | null;
      description?: string | null;
      createdAt?: string | null;
    };
    booking?: {
      id: string;
    } | null;
    transaction?: {
      id: string;
      status?: string | null;
      gateway?: string | null;
    } | null;
  }>;
  withdrawals: Array<{
    withdrawal: {
      id: string;
      amount?: string | number | null;
      status?: string | null;
      destinationType?: string | null;
      destinationKey?: string | null;
      requestedAt?: string | null;
      processedAt?: string | null;
      notes?: string | null;
    };
    processedBy?: {
      id: string;
      firstName?: string | null;
      lastName?: string | null;
      email?: string | null;
    } | null;
  }>;
  sectionErrors?: Partial<Record<string, string>>;
};

type HistoryPayload = {
  summary: {
    totalRequests: number;
    uniqueIps: number;
    firstSeenAt?: string | null;
    lastSeenAt?: string | null;
    connectedMinutes: number;
  };
  access: {
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
      browser?: string | null;
      deviceType?: string | null;
      requestPath?: string | null;
      requestMethod?: string | null;
      statusCode?: number | null;
      createdAt?: string | null;
    }>;
  };
  supportTickets: Array<{
    id: string;
    subject: string;
    status?: string | null;
    type?: string | null;
    createdAt?: string | null;
  }>;
  supportChatHistory: Array<{
    id: string;
    content: string;
    createdAt?: string | null;
    counterpart?: {
      id: string;
      firstName?: string | null;
      lastName?: string | null;
      email?: string | null;
    } | null;
  }>;
  chatHistory: Array<{
    id: string;
    content: string;
    createdAt?: string | null;
    counterpart?: {
      id: string;
      firstName?: string | null;
      lastName?: string | null;
      email?: string | null;
    } | null;
  }>;
  adminActions: Array<{
    id: string;
    action: string;
    createdAt?: string | null;
    changes?: unknown;
    admin?: {
      id: string;
      firstName?: string | null;
      lastName?: string | null;
      email?: string | null;
    } | null;
  }>;
  sectionErrors?: Partial<Record<string, string>>;
};

type UserManagementSheetProps = {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type ActiveTab = "profile" | "kyc" | "finance" | "history" | "actions";

const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];

const emptyHistory: HistoryPayload = {
  summary: {
    totalRequests: 0,
    uniqueIps: 0,
    firstSeenAt: null,
    lastSeenAt: null,
    connectedMinutes: 0,
  },
  access: {
    browserDistribution: [],
    deviceDistribution: [],
    topPaths: [],
    heatmap: [],
    logs: [],
  },
  supportTickets: [],
  supportChatHistory: [],
  chatHistory: [],
  adminActions: [],
  sectionErrors: {},
};

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

const formatCurrency = (value?: string | number | null) => {
  const numeric = Number(value ?? 0);
  if (Number.isNaN(numeric)) return "R$ 0,00";
  return numeric.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
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
  if (status === "processing") return "Processando";
  if (status === "approved") return "Aprovado";
  if (status === "rejected") return "Rejeitado";
  if (status === "processed") return "Processado";
  if (status === "open") return "Aberto";
  if (status === "in_progress") return "Em andamento";
  if (status === "resolved") return "Resolvido";
  if (status === "closed") return "Fechado";
  return status;
};

const isImageLike = (url?: string | null) =>
  Boolean(url && /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(url));

const secureKycUrl = (url?: string | null) => {
  if (!url) return url;
  const match = url.match(/^\/uploads\/kyc\/([^/]+)\/([^/]+)$/);
  return match ? `/api/kyc/files/${encodeURIComponent(match[1])}/${encodeURIComponent(match[2])}` : url;
};

function MediaItem({ label, url }: { label: string; url?: string | null }) {
  const safeUrl = secureKycUrl(url);
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
          href={safeUrl || undefined}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-blue-600 hover:underline"
        >
          Abrir
        </a>
      </div>
      {isImageLike(url) ? (
        <img
          src={safeUrl || undefined}
          alt={label}
          className="h-28 w-full rounded border border-slate-100 object-cover"
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

function QueryState<T>({
  query,
  loadingLabel,
  errorLabel,
  children,
}: {
  query: UseQueryResult<T | null>;
  loadingLabel: string;
  errorLabel: string;
  children: (data: T) => JSX.Element;
}) {
  if (query.isLoading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center gap-2 text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        {loadingLabel}
      </div>
    );
  }

  if (query.isError || !query.data) {
    const message =
      query.error instanceof Error ? query.error.message : errorLabel;
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {message || errorLabel}
      </div>
    );
  }

  return children(query.data as T);
}

export function useAdminUserManagementData({
  userId,
  open,
  activeTab,
}: {
  userId: string | null;
  open: boolean;
  activeTab: ActiveTab;
}) {
  const reviewQuery = useQuery<ReviewPayload | null>({
    queryKey: ["/api/admin/users", userId, "review"],
    queryFn: async () => {
      if (!userId) return null;
      const res = await apiRequest("GET", `/api/admin/users/${userId}/review`);
      return res.json();
    },
    enabled: open && !!userId,
  });

  const financeQuery = useQuery<FinancePayload | null>({
    queryKey: ["/api/admin/users", userId, "finance"],
    queryFn: async () => {
      if (!userId) return null;
      const res = await apiRequest("GET", `/api/admin/users/${userId}/finance`);
      return res.json();
    },
    enabled: open && !!userId && activeTab === "finance",
  });

  const historyQuery = useQuery<HistoryPayload | null>({
    queryKey: ["/api/admin/users", userId, "history"],
    queryFn: async () => {
      if (!userId) return null;
      const res = await apiRequest("GET", `/api/admin/users/${userId}/history`);
      return res.json();
    },
    enabled: open && !!userId && activeTab === "history",
  });

  return { reviewQuery, financeQuery, historyQuery };
}

export function UserManagementSheet({
  userId,
  open,
  onOpenChange,
}: UserManagementSheetProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<ActiveTab>("profile");
  const [notes, setNotes] = useState("");
  const [blockReason, setBlockReason] = useState("");
  const [kycRejectionReason, setKycRejectionReason] = useState("");

  const { reviewQuery, financeQuery, historyQuery } = useAdminUserManagementData({
    userId,
    open,
    activeTab,
  });

  useEffect(() => {
    if (!open) {
      setActiveTab("profile");
    }
  }, [open]);

  useEffect(() => {
    if (reviewQuery.data?.user) {
      setNotes(reviewQuery.data.user.adminNotes || "");
      setBlockReason(reviewQuery.data.user.blockedReason || "");
      setKycRejectionReason(reviewQuery.data.latestKyc?.rejectionReason || "");
    }
  }, [reviewQuery.data]);

  const invalidateAdminData = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/admin/instructors"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    queryClient.invalidateQueries({
      queryKey: ["/api/admin/users?role=student"],
    });
    queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });

    if (userId) {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/users", userId, "review"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/users", userId, "finance"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/users", userId, "history"],
      });
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
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar anotações",
        description: error?.message || "Tente novamente",
        variant: "destructive",
      });
    },
  });

  const updateKyc = useMutation({
    mutationFn: async (status: "approved" | "rejected") => {
      if (!userId) throw new Error("Usuário inválido");
      const res = await apiRequest("PUT", `/api/admin/users/${userId}/kyc`, {
        status,
        rejectionReason:
          status === "rejected" ? kycRejectionReason.trim() || null : null,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Status de KYC atualizado" });
      invalidateAdminData();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar KYC",
        description: error?.message || "Tente novamente",
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
    onError: (error: any) => {
      toast({
        title: "Erro ao bloquear usuário",
        description: error?.message || "Tente novamente",
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
    onError: (error: any) => {
      toast({
        title: "Erro ao desbloquear usuário",
        description: error?.message || "Tente novamente",
        variant: "destructive",
      });
    },
  });

  const isBusy =
    saveNotes.isPending ||
    updateKyc.isPending ||
    blockUser.isPending ||
    unblockUser.isPending;

  const reviewData = reviewQuery.data;
  const user = reviewData?.user;
  const instructor = reviewData?.instructor;
  const latestKycDetails = reviewData?.latestKyc?.documentValidationDetails;

  const reviewWarnings = useMemo(
    () =>
      Array.from(
        new Set(
          [
            reviewData?.sectionErrors?.instructor,
            reviewData?.sectionErrors?.kyc,
            reviewData?.sectionErrors?.vehicles,
          ].filter(Boolean) as string[],
        ),
      ),
    [
      reviewData?.sectionErrors?.instructor,
      reviewData?.sectionErrors?.kyc,
      reviewData?.sectionErrors?.vehicles,
    ],
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full max-w-full p-0 sm:max-w-[96vw] lg:max-w-[1400px]"
      >
        <SheetHeader className="border-b border-slate-200 px-6 py-4">
          <div className="flex flex-wrap items-start justify-between gap-3 pr-10">
            <div>
              <SheetTitle className="text-lg">Central do Usuário</SheetTitle>
              <SheetDescription>
                Perfil, KYC, financeiro, histórico e ações administrativas.
              </SheetDescription>
            </div>
            <Badge className="bg-slate-100 text-slate-700">
              {user ? personName(user) : "Carregando"}
            </Badge>
          </div>
        </SheetHeader>

        {reviewQuery.isLoading ? (
          <div className="flex h-[78vh] items-center justify-center gap-2 text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando dados do usuário...
          </div>
        ) : reviewQuery.isError || !reviewData || !user ? (
          <div className="p-6 text-sm text-red-600">
            Não foi possível carregar os dados do usuário.
          </div>
        ) : (
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as ActiveTab)}
            className="flex h-[calc(100vh-5.5rem)] flex-col"
          >
            <div className="border-b border-slate-100 px-6 py-3">
              <TabsList className="grid h-auto w-full grid-cols-2 gap-2 md:grid-cols-5">
                <TabsTrigger value="profile">Perfil</TabsTrigger>
                <TabsTrigger value="kyc">KYC / Documentos</TabsTrigger>
                <TabsTrigger value="finance">Financeiro</TabsTrigger>
                <TabsTrigger value="history">Histórico</TabsTrigger>
                <TabsTrigger value="actions">Ações</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="profile" className="mt-0 flex-1 overflow-hidden">
              <ScrollArea className="h-full px-6 py-5">
                <div className="space-y-6">
                  <SectionWarning messages={reviewWarnings} />
                  <div className="grid gap-4 lg:grid-cols-[1.2fr,1fr]">
                    <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
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
                          <p className="font-medium text-slate-700">
                            {user.phone || "—"}
                          </p>
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

                    <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
                      <div className="flex items-center gap-2">
                        <Clock3 className="h-4 w-4 text-slate-600" />
                        <p className="text-sm font-semibold text-slate-800">
                          Perfil operacional
                        </p>
                      </div>
                      {instructor ? (
                        <div className="grid gap-3 text-xs sm:grid-cols-2">
                          <div>
                            <p className="text-slate-400">Status</p>
                            <p className="font-medium text-slate-700">
                              {statusLabel(instructor.status)}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-400">Credencial</p>
                            <p className="font-medium text-slate-700">
                              {instructor.credentialNumber || "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-400">Veículo</p>
                            <p className="font-medium text-slate-700">
                              {instructor.vehicleModel || "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-400">Tipo</p>
                            <p className="font-medium text-slate-700">
                              {instructor.vehicleType || "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-400">Ano</p>
                            <p className="font-medium text-slate-700">
                              {instructor.vehicleYear || "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-400">Placa</p>
                            <p className="font-medium text-slate-700">
                              {instructor.vehiclePlate || "—"}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500">
                          Este usuário não possui perfil de instrutor.
                        </p>
                      )}

                      {reviewData.vehiclesSummary ? (
                        <div className="flex flex-wrap gap-2 text-xs">
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
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="kyc" className="mt-0 flex-1 overflow-hidden">
              <ScrollArea className="h-full px-6 py-5">
                <div className="space-y-6">
                  <SectionWarning messages={reviewWarnings} />

                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="bg-blue-100 text-blue-700">
                        Status atual:{" "}
                        {statusLabel(
                          reviewData.latestKyc?.status || reviewData.user.kycStatus,
                        )}
                      </Badge>
                      {reviewData.latestKyc?.rejectionReason ? (
                        <Badge className="bg-red-100 text-red-700">
                          Rejeição registrada
                        </Badge>
                      ) : null}
                      {reviewData.latestKyc?.createdAt ? (
                        <Badge className="bg-slate-100 text-slate-700">
                          Enviado em {formatDateTime(reviewData.latestKyc.createdAt)}
                        </Badge>
                      ) : null}
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      <MediaItem
                        label="Selfie (instrutor)"
                        url={instructor?.selfieImageUrl}
                      />
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
                      <MediaItem
                        label="CNH adicional do aluno"
                        url={latestKycDetails?.licenseImageUrl}
                      />
                      <MediaItem
                        label="LADV / comprovante teórico"
                        url={latestKycDetails?.theoreticalProofImageUrl}
                      />
                      <MediaItem
                        label="Credencial da tentativa KYC"
                        url={latestKycDetails?.credentialImageUrl}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-slate-600" />
                      <p className="text-sm font-semibold text-slate-800">
                        Decisão de revisão
                      </p>
                    </div>

                    <Textarea
                      value={kycRejectionReason}
                      onChange={(event) => setKycRejectionReason(event.target.value)}
                      placeholder="Motivo obrigatório para rejeição de KYC"
                      className="min-h-[110px]"
                    />

                    <div className="flex flex-wrap gap-2">
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
                        disabled={isBusy || !kycRejectionReason.trim()}
                        onClick={() => updateKyc.mutate("rejected")}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Rejeitar KYC
                      </Button>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="finance" className="mt-0 flex-1 overflow-hidden">
              <ScrollArea className="h-full px-6 py-5">
                <QueryState
                  query={financeQuery}
                  loadingLabel="Carregando dados financeiros..."
                  errorLabel="Não foi possível carregar o financeiro."
                >
                  {(financeData) => (
                    <div className="space-y-6">
                      <SectionWarning
                        messages={Array.from(
                          new Set(
                            Object.values(financeData.sectionErrors || {}).filter(
                              Boolean,
                            ) as string[],
                          ),
                        )}
                      />

                      <div className="grid gap-3 md:grid-cols-3">
                        <div className="rounded-lg border border-slate-200 bg-white p-4">
                          <p className="text-xs text-slate-500">Saldo da carteira</p>
                          <p className="text-xl font-bold text-slate-900">
                            {formatCurrency(financeData.wallet?.balance)}
                          </p>
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-white p-4">
                          <p className="text-xs text-slate-500">Lançamentos</p>
                          <p className="text-xl font-bold text-slate-900">
                            {financeData.entries.length}
                          </p>
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-white p-4">
                          <p className="text-xs text-slate-500">Saques</p>
                          <p className="text-xl font-bold text-slate-900">
                            {financeData.withdrawals.length}
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-4 lg:grid-cols-2">
                        <div className="rounded-lg border border-slate-200 bg-white p-4">
                          <p className="mb-3 text-sm font-semibold text-slate-800">
                            Últimos lançamentos
                          </p>
                          <div className="space-y-3">
                            {financeData.entries.slice(0, 8).map((item) => (
                              <div
                                key={item.entry.id}
                                className="rounded-md border border-slate-100 px-3 py-2 text-xs"
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <span className="font-medium text-slate-800">
                                    {statusLabel(item.entry.type)}
                                  </span>
                                  <span className="font-semibold text-slate-900">
                                    {formatCurrency(item.entry.amount)}
                                  </span>
                                </div>
                                <p className="mt-1 text-slate-500">
                                  {item.entry.description || "Sem descrição"}
                                </p>
                                <p className="mt-1 text-slate-400">
                                  {formatDateTime(item.entry.createdAt)}
                                </p>
                              </div>
                            ))}
                            {financeData.entries.length === 0 ? (
                              <p className="text-sm text-slate-500">
                                Nenhum lançamento encontrado.
                              </p>
                            ) : null}
                          </div>
                        </div>

                        <div className="rounded-lg border border-slate-200 bg-white p-4">
                          <p className="mb-3 text-sm font-semibold text-slate-800">
                            Saques do usuário
                          </p>
                          <div className="space-y-3">
                            {financeData.withdrawals.slice(0, 8).map((item) => (
                              <div
                                key={item.withdrawal.id}
                                className="rounded-md border border-slate-100 px-3 py-2 text-xs"
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <span className="font-medium text-slate-800">
                                    {statusLabel(item.withdrawal.status)}
                                  </span>
                                  <span className="font-semibold text-slate-900">
                                    {formatCurrency(item.withdrawal.amount)}
                                  </span>
                                </div>
                                <p className="mt-1 text-slate-500">
                                  {item.withdrawal.destinationType || "—"}:{" "}
                                  {item.withdrawal.destinationKey || "—"}
                                </p>
                                <p className="mt-1 text-slate-400">
                                  Solicitado em{" "}
                                  {formatDateTime(item.withdrawal.requestedAt)}
                                </p>
                              </div>
                            ))}
                            {financeData.withdrawals.length === 0 ? (
                              <p className="text-sm text-slate-500">
                                Nenhum saque encontrado.
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </QueryState>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="history" className="mt-0 flex-1 overflow-hidden">
              <ScrollArea className="h-full px-6 py-5">
                <QueryState
                  query={historyQuery}
                  loadingLabel="Carregando histórico..."
                  errorLabel="Não foi possível carregar o histórico."
                >
                  {(historyData) => {
                    const historyWarnings = Array.from(
                      new Set(
                        Object.values(historyData.sectionErrors || {}).filter(
                          Boolean,
                        ) as string[],
                      ),
                    );

                    return (
                      <div className="space-y-6">
                        <SectionWarning messages={historyWarnings} />

                        <div className="grid gap-3 md:grid-cols-4">
                          <div className="rounded-lg border border-slate-200 bg-white p-3">
                            <p className="text-xs text-slate-500">Requisições</p>
                            <p className="text-lg font-bold text-slate-900">
                              {historyData.summary.totalRequests}
                            </p>
                          </div>
                          <div className="rounded-lg border border-slate-200 bg-white p-3">
                            <p className="text-xs text-slate-500">IPs únicos</p>
                            <p className="text-lg font-bold text-slate-900">
                              {historyData.summary.uniqueIps}
                            </p>
                          </div>
                          <div className="rounded-lg border border-slate-200 bg-white p-3">
                            <p className="text-xs text-slate-500">Tempo conectado</p>
                            <p className="text-lg font-bold text-slate-900">
                              {historyData.summary.connectedMinutes} min
                            </p>
                          </div>
                          <div className="rounded-lg border border-slate-200 bg-white p-3">
                            <p className="text-xs text-slate-500">Último acesso</p>
                            <p className="text-sm font-semibold text-slate-900">
                              {formatDateTime(historyData.summary.lastSeenAt)}
                            </p>
                          </div>
                        </div>

                        <div className="grid gap-4 lg:grid-cols-2">
                          <div className="rounded-lg border border-slate-200 bg-white p-4">
                            <p className="mb-3 text-sm font-semibold text-slate-800">
                              Ações administrativas
                            </p>
                            <div className="space-y-3">
                              {historyData.adminActions.slice(0, 8).map((item) => (
                                <div
                                  key={item.id}
                                  className="rounded-md border border-slate-100 px-3 py-2 text-xs"
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <span className="font-medium text-slate-800">
                                      {item.action}
                                    </span>
                                    <span className="text-slate-400">
                                      {formatDateTime(item.createdAt)}
                                    </span>
                                  </div>
                                  <p className="mt-1 text-slate-500">
                                    {item.admin ? personName(item.admin) : "Sistema"}
                                  </p>
                                </div>
                              ))}
                              {historyData.adminActions.length === 0 ? (
                                <p className="text-sm text-slate-500">
                                  Nenhuma ação administrativa registrada.
                                </p>
                              ) : null}
                            </div>
                          </div>

                          <div className="rounded-lg border border-slate-200 bg-white p-4">
                            <p className="mb-3 text-sm font-semibold text-slate-800">
                              Tickets de suporte
                            </p>
                            <div className="space-y-3">
                              {historyData.supportTickets.slice(0, 8).map((ticket) => (
                                <div
                                  key={ticket.id}
                                  className="rounded-md border border-slate-100 px-3 py-2 text-xs"
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <span className="font-medium text-slate-800">
                                      {ticket.subject}
                                    </span>
                                    <span className="text-slate-400">
                                      {formatDateTime(ticket.createdAt)}
                                    </span>
                                  </div>
                                  <p className="mt-1 text-slate-500">
                                    {statusLabel(ticket.status)} /{" "}
                                    {ticket.type || "sem tipo"}
                                  </p>
                                </div>
                              ))}
                              {historyData.supportTickets.length === 0 ? (
                                <p className="text-sm text-slate-500">
                                  Nenhum ticket de suporte encontrado.
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        <div className="rounded-lg border border-slate-200 bg-white p-4">
                          <div className="mb-3 flex items-center gap-2">
                            <History className="h-4 w-4 text-slate-600" />
                            <p className="text-sm font-semibold text-slate-800">
                              Logs de acesso recentes
                            </p>
                          </div>
                          <div className="space-y-2">
                            {historyData.access.logs.slice(0, 10).map((item) => (
                              <div
                                key={item.id}
                                className="grid gap-1 rounded-md border border-slate-100 px-3 py-2 text-xs md:grid-cols-[1.2fr,1fr,1fr,auto]"
                              >
                                <span className="text-slate-700">
                                  {item.requestMethod || "—"} {item.requestPath || "—"}
                                </span>
                                <span className="text-slate-500">
                                  {item.browser || "—"} / {item.deviceType || "—"}
                                </span>
                                <span className="text-slate-500">
                                  {item.ipAddress || "—"}
                                </span>
                                <span className="text-slate-400">
                                  {formatDateTime(item.createdAt)}
                                </span>
                              </div>
                            ))}
                            {historyData.access.logs.length === 0 ? (
                              <p className="text-sm text-slate-500">
                                Nenhum log de acesso encontrado.
                              </p>
                            ) : null}
                          </div>
                        </div>

                        {historyData.access.heatmap.length > 0 ? (
                          <div className="rounded-lg border border-slate-200 bg-white p-4">
                            <p className="mb-3 text-sm font-semibold text-slate-800">
                              Heatmap de acesso
                            </p>
                            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                              {historyData.access.heatmap.slice(0, 12).map((item) => (
                                <div
                                  key={`${item.dayOfWeek}-${item.hour}`}
                                  className="rounded-md border border-slate-100 px-3 py-2 text-xs"
                                >
                                  <p className="font-medium text-slate-800">
                                    {weekDays[item.dayOfWeek]} {String(item.hour).padStart(2, "0")}
                                    h
                                  </p>
                                  <p className="text-slate-500">
                                    {item.count} acessos
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  }}
                </QueryState>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="actions" className="mt-0 flex-1 overflow-hidden">
              <ScrollArea className="h-full px-6 py-5">
                <div className="space-y-6">
                  <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
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
                      className="min-h-[140px]"
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

                  <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
                    <p className="text-sm font-semibold text-slate-800">
                      Restrições de acesso
                    </p>
                    <Input
                      value={blockReason}
                      onChange={(event) => setBlockReason(event.target.value)}
                      placeholder="Motivo do bloqueio"
                    />
                    <div className="flex flex-wrap gap-2">
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
                          Banir usuário
                        </Button>
                      )}
                    </div>
                    {user.blockedAt ? (
                      <p className="text-xs text-slate-500">
                        Bloqueado em {formatDateTime(user.blockedAt)}
                      </p>
                    ) : null}
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        )}
      </SheetContent>
    </Sheet>
  );
}
