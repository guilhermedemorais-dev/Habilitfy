import { useEffect, useMemo, useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Banknote,
  Calendar,
  CalendarCheck,
  CreditCard,
  DollarSign,
  Eye,
  GraduationCap,
  LayoutGrid,
  LogOut,
  Menu,
  Moon,
  Plus,
  Plug,
  Receipt,
  RefreshCcw,
  Search,
  ShieldCheck,
  Sun,
  Trash2,
  UserCheck,
  Users,
  Wallet,
  WalletCards,
  Lock,
  Map as MapIcon,
  ArrowLeftRight,
  ChevronRight,
} from "lucide-react";
import { AdminUsersTable } from "@/components/admin/AdminUsersTable";
import { AdminAIChat } from "@/components/admin/AdminAIChat";
import { AdminBookingsSection } from "@/components/admin/AdminBookingsSection";
import { AdminDashboardSection } from "@/components/admin/AdminDashboardSection";
import { AdminFinanceSection } from "@/components/admin/AdminFinanceSection";
import { AdminInstructorSection } from "@/components/admin/AdminInstructorSection";
import { AdminStudentsSection } from "@/components/admin/AdminStudentsSection";
import {
  AdminIntegrationsSection,
  type AdminIntegration,
} from "@/components/admin/AdminIntegrationsSection";
import { AdminSettingsSection } from "@/components/admin/AdminSettingsSection";
import { UserManagementSheet } from "@/components/admin/UserManagementSheet";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/hooks/useAuth";
import { useRoleSwitcher } from "@/hooks/useRoleSwitcher";
import { RoleSwitcherModal } from "@/components/RoleSwitcherModal";
import { AccountModal } from "@/components/account/AccountModal";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
  profileImageUrl?: string | null;
  role?: string | null;
  kycStatus?: "pending" | "approved" | "rejected" | null;
  phone?: string | null;
  cpf?: string | null;
  cnpj?: string | null;
  city?: string | null;
  state?: string | null;
  isBlocked?: boolean;
  blockedReason?: string | null;
  adminNotes?: string | null;
  createdAt?: string | null;
};

type AdminInstructor = {
  id: string;
  userId: string;
  status: "approved" | "pending" | "rejected";
  vehicleModel?: string | null;
  vehicleYear?: string | null;
  vehicleType?: string | null;
  credentialNumber?: string | null;
  createdAt?: string | null;
  user?: AdminUser | null;
};

type AdminBookingRow = {
  booking: {
    id: string;
    status: string;
    totalPrice: string;
    date?: string | null;
    createdAt?: string | null;
  };
  student: AdminUser | null;
  instructor: {
    id: string;
    userId: string;
  } | null;
  instructorUser: AdminUser | null;
};

type AdminDashboardStats = {
  totalBookings: number;
  completedBookings: number;
  totalRevenue: number;
  walletBalance: number;
};

type AdminFinanceSummary = {
  totalTransacted: number;
  totalProcessing: number;
  totalWalletBalance: number;
  pendingWithdrawals: number;
  pendingWithdrawalsCount: number;
  totalRefunded: number;
  failedTransactionsCount: number;
  pendingTransactionsCount: number;
};

type AdminTransactionRow = {
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
  booking: {
    id: string;
  } | null;
};

type AdminWalletRow = {
  id: string;
  userId: string;
  balance: string;
  currency?: string | null;
  updatedAt?: string | null;
  user?: AdminUser | null;
};

type AdminWalletEntryRow = {
  entry: {
    id: string;
    walletId: string;
    userId: string;
    type: string;
    amount: string;
    description?: string | null;
    bookingId?: string | null;
    transactionId?: string | null;
    createdAt?: string | null;
  };
  user: AdminUser | null;
  booking: { id: string } | null;
  transaction: { id: string; type?: string | null } | null;
};

type AdminWithdrawalRow = {
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

type AdminFinanceSeriesPoint = {
  period: string;
  total: number;
  count: number;
};

type AdminGeoPoint = {
  lat: number;
  lng: number;
  count: number;
  label?: string | null;
};

type AdminGeoSummary = {
  instructors: AdminGeoPoint[];
  students: AdminGeoPoint[];
  states: string[];
  cities: string[];
  totals: {
    instructorsTotal: number;
    instructorsWithLocation: number;
    studentsTotal: number;
    studentsWithLocation: number;
  };
};

const formatCurrency = (value: number | string | null | undefined) => {
  if (value === null || value === undefined) return "—";
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "—";
  return parsed.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
};

const formatPersonName = (person?: {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
} | null) => {
  if (!person) return "—";
  const fullName = [person.firstName, person.lastName]
    .filter(Boolean)
    .join(" ");
  return fullName || person.email || "—";
};

const formatRoleLabel = (role?: string | null) => {
  const labels: Record<string, string> = {
    student: "Aluno",
    instructor: "Instrutor",
    admin: "Admin",
  };

  if (!role) return "—";
  return labels[role] || role;
};

export default function Admin() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [globalSearch, setGlobalSearch] = useState("");
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { viewRole, canSwitch, setViewRole } = useRoleSwitcher(
    user?.role,
    user?.adminRole,
  );
  const [mapLayer, setMapLayer] = useState<"instructors" | "students">(
    "instructors",
  );
  const [mapStateFilter, setMapStateFilter] = useState("all");
  const [mapCityFilter, setMapCityFilter] = useState("all");
  const [financeStatusFilter, setFinanceStatusFilter] = useState("paid");
  const [financePeriodFilter, setFinancePeriodFilter] = useState<
    "day" | "week" | "month"
  >("day");
  const initialTheme = useRef<boolean | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewUserId, setReviewUserId] = useState<string | null>(null);

  const {
    data: instructorsData,
    isLoading: instructorsLoading,
    error: instructorsError,
  } = useQuery<AdminInstructor[] | null>({
    queryKey: ["/api/admin/instructors"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: user?.role === "admin",
  });

  const {
    data: studentsData,
    isLoading: studentsLoading,
    error: studentsError,
  } = useQuery<AdminUser[] | null>({
    queryKey: ["/api/admin/users?role=student"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: user?.role === "admin",
  });

  const {
    data: dashboardData,
    isLoading: dashboardLoading,
    error: dashboardError,
  } = useQuery<AdminDashboardStats | null>({
    queryKey: ["/api/admin/dashboard"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: user?.role === "admin",
  });

  const {
    data: bookingsData,
    isLoading: bookingsLoading,
    error: bookingsError,
  } = useQuery<AdminBookingRow[] | null>({
    queryKey: ["/api/admin/bookings?limit=12"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: user?.role === "admin",
  });

  const financeSeriesQueryKey = useMemo(() => {
    const days =
      financePeriodFilter === "day"
        ? 30
        : financePeriodFilter === "week"
          ? 120
          : 365;
    const params = new URLSearchParams();
    params.set("period", financePeriodFilter);
    params.set("days", String(days));
    if (financeStatusFilter && financeStatusFilter !== "all") {
      params.set("status", financeStatusFilter);
    }
    return `/api/admin/finance/timeseries?${params.toString()}`;
  }, [financePeriodFilter, financeStatusFilter]);

  const {
    data: financeSeriesData,
    isLoading: financeSeriesLoading,
    error: financeSeriesError,
  } = useQuery<AdminFinanceSeriesPoint[] | null>({
    queryKey: [financeSeriesQueryKey],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: user?.role === "admin",
  });

  const geoSummaryQueryKey = useMemo(() => {
    const params = new URLSearchParams();
    if (mapStateFilter !== "all") {
      params.set("state", mapStateFilter);
    }
    if (mapCityFilter !== "all") {
      params.set("city", mapCityFilter);
    }
    const query = params.toString();
    return query ? `/api/admin/geo-summary?${query}` : "/api/admin/geo-summary";
  }, [mapStateFilter, mapCityFilter]);

  const {
    data: geoSummaryData,
    isLoading: geoSummaryLoading,
    error: geoSummaryError,
  } = useQuery<AdminGeoSummary | null>({
    queryKey: [geoSummaryQueryKey],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: user?.role === "admin",
  });

  const {
    data: financeSummaryData,
    isLoading: financeSummaryLoading,
    error: financeSummaryError,
  } = useQuery<AdminFinanceSummary | null>({
    queryKey: ["/api/admin/finance/summary"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: user?.role === "admin",
  });

  const {
    data: transactionsData,
    isLoading: transactionsLoading,
    error: transactionsError,
  } = useQuery<AdminTransactionRow[] | null>({
    queryKey: ["/api/admin/transactions?limit=30"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: user?.role === "admin",
  });

  const {
    data: walletsData,
    isLoading: walletsLoading,
    error: walletsError,
  } = useQuery<AdminWalletRow[] | null>({
    queryKey: ["/api/admin/wallets"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: user?.role === "admin",
  });

  const {
    data: walletEntriesData,
    isLoading: walletEntriesLoading,
    error: walletEntriesError,
  } = useQuery<AdminWalletEntryRow[] | null>({
    queryKey: ["/api/admin/wallet-entries?limit=12"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: user?.role === "admin",
  });

  const {
    data: withdrawalsData,
    isLoading: withdrawalsLoading,
    error: withdrawalsError,
  } = useQuery<AdminWithdrawalRow[] | null>({
    queryKey: ["/api/admin/withdrawals?limit=12"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: user?.role === "admin",
  });

  const {
    data: integrationsData,
    isLoading: integrationsLoading,
    error: integrationsError,
  } = useQuery<AdminIntegration[] | null>({
    queryKey: ["/api/admin/integrations"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: user?.role === "admin",
  });

  const instructors = useMemo(() => instructorsData || [], [instructorsData]);
  const students = useMemo(() => studentsData || [], [studentsData]);
  const bookings = useMemo(() => bookingsData || [], [bookingsData]);
  const transactions = useMemo(() => transactionsData || [], [transactionsData]);
  const wallets = useMemo(() => walletsData || [], [walletsData]);
  const walletEntries = useMemo(
    () => walletEntriesData || [],
    [walletEntriesData],
  );
  const withdrawals = useMemo(() => withdrawalsData || [], [withdrawalsData]);
  const integrations = useMemo(() => integrationsData || [], [integrationsData]);

  // Dark mode effect (following Styleguide.tsx pattern)
  useEffect(() => {
    const root = document.documentElement;
    initialTheme.current = root.classList.contains("dark");
    setIsDark(initialTheme.current);
    return () => {
      if (initialTheme.current !== null) {
        root.classList.toggle("dark", initialTheme.current);
      }
    };
  }, []);

  useEffect(() => {
    if (initialTheme.current === null) return;
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  const toggleDarkMode = () => {
    setIsDark((value) => !value);
  };
  const dashboardStats = dashboardData || {
    totalBookings: 0,
    completedBookings: 0,
    totalRevenue: 0,
    walletBalance: 0,
  };
  const financeSummary = financeSummaryData || {
    totalTransacted: 0,
    totalProcessing: 0,
    totalWalletBalance: 0,
    pendingWithdrawals: 0,
    pendingWithdrawalsCount: 0,
    totalRefunded: 0,
    failedTransactionsCount: 0,
    pendingTransactionsCount: 0,
  };
  const financeSeries = useMemo(
    () => financeSeriesData || [],
    [financeSeriesData],
  );
  const geoSummary = geoSummaryData || {
    instructors: [],
    students: [],
    states: [],
    cities: [],
    totals: {
      instructorsTotal: 0,
      instructorsWithLocation: 0,
      studentsTotal: 0,
      studentsWithLocation: 0,
    },
  };
  useEffect(() => {
    if (
      mapCityFilter !== "all" &&
      !geoSummary.cities.includes(mapCityFilter)
    ) {
      setMapCityFilter("all");
    }
  }, [geoSummary.cities, mapCityFilter]);
  const normalizedSearch = globalSearch.trim().toLowerCase();

  const counts = useMemo(() => {
    let pending = 0;
    let approved = 0;
    let rejected = 0;

    for (const instructor of instructors) {
      if (instructor.status === "pending") pending += 1;
      else if (instructor.status === "approved") approved += 1;
      else if (instructor.status === "rejected") rejected += 1;
    }

    return {
      pending,
      approved,
      rejected,
      total: instructors.length,
    };
  }, [instructors]);

  const pendingWithdrawals = useMemo(
    () =>
      withdrawals.filter(
        (row) =>
          row.withdrawal.status === "pending" ||
          row.withdrawal.status === "approved",
      ),
    [withdrawals],
  );
  const alerts = useMemo(() => {
    const paymentIntegrationActive = integrations.some(
      (integration) =>
        integration.category === "payment" &&
        integration.isDefault &&
        integration.status === "active",
    );
    const instructorsUnavailable = Boolean(instructorsError);
    const financeUnavailable = Boolean(financeSummaryError);
    const integrationsUnavailable = Boolean(integrationsError);

    return [
      {
        label: "Instrutores pendentes de KYC",
        value: counts.pending,
        valueLabel: instructorsUnavailable
          ? "—"
          : counts.pending.toLocaleString("pt-BR"),
        tone: "text-yellow-700",
        bg: "bg-yellow-100/70",
        icon: AlertTriangle,
        helper: instructorsUnavailable
          ? "Dados de instrutores indisponíveis."
          : "Documentacao aguardando aprovacao.",
      },
      {
        label: "Pagamentos falhos",
        value: financeSummary.failedTransactionsCount,
        valueLabel: financeUnavailable
          ? "—"
          : financeSummary.failedTransactionsCount.toLocaleString("pt-BR"),
        tone: "text-red-700",
        bg: "bg-red-100/70",
        icon: Receipt,
        helper: financeUnavailable
          ? "Resumo financeiro indisponível."
          : "Falhas ou cancelamentos recentes.",
      },
      {
        label: "Saques pendentes",
        value: financeSummary.pendingWithdrawalsCount,
        valueLabel: financeUnavailable
          ? "—"
          : financeSummary.pendingWithdrawalsCount.toLocaleString("pt-BR"),
        tone: "text-blue-700",
        bg: "bg-blue-100/70",
        icon: Banknote,
        helper: financeUnavailable
          ? "Resumo financeiro indisponível."
          : "Aguardando aprovacao manual.",
      },
      {
        label: "Integração de pagamento default",
        value: paymentIntegrationActive ? 1 : 0,
        valueLabel: integrationsUnavailable
          ? "—"
          : paymentIntegrationActive ? "OK" : "Ajustar",
        tone: integrationsUnavailable
          ? "text-amber-700"
          : paymentIntegrationActive ? "text-green-700" : "text-red-700",
        bg: integrationsUnavailable
          ? "bg-amber-100/70"
          : paymentIntegrationActive ? "bg-green-100/70" : "bg-red-100/70",
        icon: Plug,
        helper: integrationsUnavailable
          ? "Integrações indisponíveis."
          : paymentIntegrationActive
            ? "Integração principal configurada."
            : "Nenhuma integração default ativa.",
      },
    ];
  }, [
    counts.pending,
    financeSummary.failedTransactionsCount,
    financeSummary.pendingWithdrawalsCount,
    integrations,
    financeSummaryError,
    instructorsError,
    integrationsError,
  ]);

  const isUnauthorized = instructorsData === null;
  const hasLoadError = Boolean(
    instructorsError ||
    studentsError ||
    dashboardError ||
    bookingsError ||
    financeSummaryError ||
    financeSeriesError ||
    geoSummaryError ||
    transactionsError ||
    walletsError ||
    walletEntriesError ||
    withdrawalsError ||
    integrationsError,
  );
  const adminName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.email ||
    "Admin";
  const adminInitials =
    adminName
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0]?.toUpperCase())
      .slice(0, 2)
      .join("") || "AD";

  const navItems = useMemo(
    () => [
      { label: "Dashboard", href: "#dashboard", icon: LayoutGrid },
      {
        label: "KYC & Instrutores",
        href: "#kyc",
        icon: ShieldCheck,
        badge: counts.pending ? counts.pending : null,
      },
      { label: "Instrutores", href: "#instrutores", icon: Users },
      { label: "Alunos", href: "#alunos", icon: GraduationCap },
      { label: "Agendamentos", href: "#agendamentos", icon: Calendar },
      { label: "Financeiro", href: "#financeiro", icon: Wallet },
      { label: "Transacoes", href: "#transacoes", icon: Receipt },
      { label: "Carteiras", href: "#carteiras", icon: WalletCards },
      {
        label: "Saques",
        href: "#saques",
        icon: Banknote,
        badge: pendingWithdrawals.length ? pendingWithdrawals.length : null,
      },
      { label: "Taxas", href: "#taxas", icon: CalendarCheck },
      { label: "Integrações", href: "#integracoes", icon: Plug },
      {
        label: "Gestão Acesso",
        href: "#acesso",
        icon: Lock,
        hidden: user?.adminRole !== 'master'
      },
      { label: "Mapa", href: "#mapa", icon: MapIcon },
    ],
    [counts.pending, pendingWithdrawals.length, user?.adminRole],
  );

  const stats = useMemo(
    () => [
      {
        label: "Instrutores pendentes",
        value: counts.pending,
        loading: instructorsLoading,
        error: Boolean(instructorsError),
        helper: "Aguardando validação",
        icon: AlertTriangle,
        tone: "text-yellow-700 dark:text-yellow-400",
        bg: "bg-yellow-100/70 dark:bg-yellow-900/30",
      },
      {
        label: "Instrutores aprovados",
        value: counts.approved,
        loading: instructorsLoading,
        error: Boolean(instructorsError),
        helper: "Ativos na plataforma",
        icon: UserCheck,
        tone: "text-green-700 dark:text-green-400",
        bg: "bg-green-100/70 dark:bg-green-900/30",
      },
      {
        label: "Total de instrutores",
        value: counts.total,
        loading: instructorsLoading,
        error: Boolean(instructorsError),
        helper: "Base cadastrada",
        icon: Users,
        tone: "text-slate-700 dark:text-slate-300",
        bg: "bg-slate-100 dark:bg-slate-800",
      },
      {
        label: "Total de alunos",
        value: students.length,
        loading: studentsLoading,
        error: Boolean(studentsError),
        helper: "Cadastros ativos",
        icon: GraduationCap,
        tone: "text-blue-700 dark:text-blue-400",
        bg: "bg-blue-100/70 dark:bg-blue-900/30",
      },
      {
        label: "Agendamentos",
        value: dashboardStats.totalBookings,
        loading: dashboardLoading,
        error: Boolean(dashboardError),
        helper: "Total registrados",
        icon: Calendar,
        tone: "text-indigo-700 dark:text-indigo-400",
        bg: "bg-indigo-100/70 dark:bg-indigo-900/30",
      },
      {
        label: "Aulas concluídas",
        value: dashboardStats.completedBookings,
        loading: dashboardLoading,
        error: Boolean(dashboardError),
        helper: "Finalizadas",
        icon: CalendarCheck,
        tone: "text-emerald-700 dark:text-emerald-400",
        bg: "bg-emerald-100/70 dark:bg-emerald-900/30",
      },
      {
        label: "Volume financeiro",
        value: dashboardStats.totalRevenue,
        loading: dashboardLoading,
        error: Boolean(dashboardError),
        helper: "Pagas + concluídas",
        icon: Wallet,
        tone: "text-slate-700 dark:text-slate-300",
        bg: "bg-slate-100 dark:bg-slate-800",
        format: formatCurrency,
      },
      {
        label: "Saldo em carteiras",
        value: dashboardStats.walletBalance,
        loading: dashboardLoading,
        error: Boolean(dashboardError),
        helper: "Retido em contas",
        icon: WalletCards,
        tone: "text-teal-700 dark:text-teal-400",
        bg: "bg-teal-100/70 dark:bg-teal-900/30",
        format: formatCurrency,
      },
    ],
    [
      counts,
      instructorsLoading,
      students.length,
      studentsLoading,
      dashboardLoading,
      dashboardError,
      dashboardStats.totalBookings,
      dashboardStats.completedBookings,
      dashboardStats.totalRevenue,
      dashboardStats.walletBalance,
      instructorsError,
      studentsError,
    ],
  );

  const financeCards = useMemo(
    () => [
      {
        label: "Total transacionado",
        value: financeSummary.totalTransacted,
        loading: financeSummaryLoading,
        error: Boolean(financeSummaryError),
        helper: "Pagos no gateway",
        icon: DollarSign,
        tone: "text-emerald-700 dark:text-emerald-400",
        bg: "bg-emerald-100/70 dark:bg-emerald-900/30",
        format: formatCurrency,
      },
      {
        label: "Em processamento",
        value: financeSummary.totalProcessing,
        loading: financeSummaryLoading,
        error: Boolean(financeSummaryError),
        helper: "Aguardando confirmacao",
        icon: RefreshCcw,
        tone: "text-blue-700 dark:text-blue-400",
        bg: "bg-blue-100/70 dark:bg-blue-900/30",
        format: formatCurrency,
      },
      {
        label: "Em carteiras",
        value: financeSummary.totalWalletBalance,
        loading: financeSummaryLoading,
        error: Boolean(financeSummaryError),
        helper: "Disponivel para saque",
        icon: WalletCards,
        tone: "text-teal-700 dark:text-teal-400",
        bg: "bg-teal-100/70 dark:bg-teal-900/30",
        format: formatCurrency,
      },
      {
        label: "Saques pendentes",
        value: financeSummary.pendingWithdrawals,
        loading: financeSummaryLoading,
        error: Boolean(financeSummaryError),
        helper: "Em analise",
        icon: Banknote,
        tone: "text-yellow-700 dark:text-yellow-400",
        bg: "bg-yellow-100/70 dark:bg-yellow-900/30",
        format: formatCurrency,
      },
      {
        label: "Reembolsado",
        value: financeSummary.totalRefunded,
        loading: financeSummaryLoading,
        error: Boolean(financeSummaryError),
        helper: "Ultimos pagamentos",
        icon: Receipt,
        tone: "text-orange-700 dark:text-orange-400",
        bg: "bg-orange-100/70 dark:bg-orange-900/30",
        format: formatCurrency,
      },
    ],
    [
      financeSummary.totalTransacted,
      financeSummary.totalProcessing,
      financeSummary.totalWalletBalance,
      financeSummary.pendingWithdrawals,
      financeSummary.totalRefunded,
      financeSummaryLoading,
      financeSummaryError,
    ],
  );

  const openUserReviewDialog = (userId?: string | null) => {
    if (!userId) return;
    setReviewUserId(userId);
    setReviewDialogOpen(true);
  };

  const updateWithdrawal = useMutation({
    mutationFn: async ({
      id,
      status,
      notes,
    }: {
      id: string;
      status: string;
      notes?: string;
    }) => {
      const res = await apiRequest(
        "PATCH",
        `/api/admin/withdrawals/${id}`,
        { status, notes },
      );
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Saque atualizado" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/withdrawals?limit=12"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/finance/summary"] });
    },
    onError: (err: any) => {
      toast({
        title: "Erro ao atualizar saque",
        description: err?.message || "Tente novamente",
        variant: "destructive",
      });
    },
  });

  const downloadCsv = (
    filename: string,
    header: string[],
    rows: Array<Array<string | number | null | undefined>>,
  ) => {
    const escapeValue = (value: string | number | null | undefined) => {
      return `"${String(value ?? "").replace(/"/g, '""')}"`;
    };

    const csvContent = [header.map(escapeValue), ...rows.map((row) => row.map(escapeValue))]
      .map((line) => line.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateStamp = new Date().toISOString().split("T")[0];
    link.href = url;
    link.download = `${filename}-${dateStamp}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const exportBookingsCsv = () => {
    const bookingRows = !normalizedSearch
      ? bookings
      : bookings.filter((row) => {
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

    if (bookingRows.length === 0) {
      toast({
        title: "Sem dados para exportar",
        description: "Nenhum agendamento encontrado.",
      });
      return;
    }

    downloadCsv(
      "agendamentos",
      [
        "booking_id",
        "status",
        "total",
        "student",
        "student_email",
        "instructor",
        "instructor_email",
      ],
      bookingRows.map((row) => [
        row.booking.id,
        row.booking.status,
        row.booking.totalPrice,
        formatPersonName(row.student),
        row.student?.email || "",
        formatPersonName(row.instructorUser),
        row.instructorUser?.email || "",
      ]),
    );
  };

  const exportTransactionsCsv = (rows: AdminTransactionRow[]) => {
    if (rows.length === 0) {
      toast({
        title: "Sem dados para exportar",
        description: "Nenhuma transacao encontrada.",
      });
      return;
    }

    downloadCsv(
      "transacoes",
      [
        "transaction_id",
        "type",
        "status",
        "amount_gross",
        "amount_net",
        "from_user",
        "from_email",
        "to_user",
        "to_email",
        "gateway",
        "payment_id",
        "booking_id",
        "created_at",
      ],
      rows.map((row) => [
        row.transaction.id,
        row.transaction.type,
        row.transaction.status,
        row.transaction.amountGross,
        row.transaction.amountNet,
        formatPersonName(row.fromUser),
        row.fromUser?.email || "",
        formatPersonName(row.toUser),
        row.toUser?.email || "",
        row.transaction.gateway || "",
        row.transaction.paymentId || "",
        row.transaction.bookingId || "",
        row.transaction.createdAt || "",
      ]),
    );
  };

  const exportWithdrawalsCsv = (rows: AdminWithdrawalRow[]) => {
    if (rows.length === 0) {
      toast({
        title: "Sem dados para exportar",
        description: "Nenhum saque encontrado.",
      });
      return;
    }

    downloadCsv(
      "saques",
      [
        "withdrawal_id",
        "user",
        "user_email",
        "amount",
        "status",
        "destination_type",
        "destination_key",
        "requested_at",
        "processed_at",
        "processed_by",
      ],
      rows.map((row) => [
        row.withdrawal.id,
        formatPersonName(row.user),
        row.user?.email || "",
        row.withdrawal.amount,
        row.withdrawal.status,
        row.withdrawal.destinationType || "",
        row.withdrawal.destinationKey || "",
        row.withdrawal.requestedAt || "",
        row.withdrawal.processedAt || "",
        formatPersonName(row.processedBy),
      ]),
    );
  };

  return (
    <AuthGuard redirectTo="/admin" requiredRoles={["admin"]}>
      <div className="min-h-screen bg-background text-slate-900 dark:text-blue-100">
        <div className="flex">
          <aside className="sticky top-0 hidden h-screen w-64 flex-col border-r border-slate-200 bg-white lg:flex dark:bg-slate-900 dark:border-slate-800">
            <div className="px-6 py-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary dark:bg-blue-900/30 dark:text-blue-300">
                  HF
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-blue-400">
                    HabilitFy
                  </p>
                  <p className="text-lg font-bold text-slate-900 dark:text-blue-100">Admin</p>
                </div>
              </div>
            </div>
            <Separator className="dark:bg-slate-800" />
            <nav className="flex-1 space-y-1 px-4 py-4">
              {navItems.filter(item => !item.hidden).map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:text-blue-200 dark:hover:bg-slate-800/50"
                >
                  <span className="flex items-center gap-3">
                    <item.icon className="h-4 w-4 text-slate-500 dark:text-blue-400" />
                    {item.label}
                  </span>
                  {item.badge ? (
                    <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                      {item.badge}
                    </Badge>
                  ) : null}
                </a>
              ))}
            </nav>
            <Separator className="dark:bg-slate-800" />
            <div className="px-4 py-4 space-y-1">
              {canSwitch && (
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 hover:bg-blue-50 text-blue-600 dark:hover:bg-blue-900/30 dark:text-blue-300"
                  onClick={() => setShowRoleSwitcher(true)}
                >
                  <ArrowLeftRight className="h-4 w-4" />
                  Trocar Conta
                </Button>
              )}
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 hover:bg-slate-100 dark:hover:bg-slate-800/50 dark:text-blue-300"
                onClick={logout}
              >
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </div>
          </aside>
          <main className="flex-1">
            <header className="sticky top-0 z-20 border-b border-slate-200 bg-background/90 backdrop-blur dark:bg-slate-900/90 dark:border-slate-800">
              <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 sm:py-4 lg:px-10">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                  <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="icon" className="lg:hidden dark:bg-slate-800 dark:border-slate-700">
                        <Menu className="h-4 w-4 dark:text-blue-200" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-72 p-0 dark:bg-slate-900 dark:border-slate-800">
                      <SheetHeader className="px-6 py-6 text-left">
                        <SheetTitle className="dark:text-blue-100">Painel Admin</SheetTitle>
                      </SheetHeader>
                      <Separator className="dark:bg-slate-800" />
                      <nav className="space-y-1 px-4 py-4">
                        {navItems.filter(item => !item.hidden).map((item) => (
                          <a
                            key={item.href}
                            href={item.href}
                            className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:text-blue-200 dark:hover:bg-slate-800/50"
                          >
                            <span className="flex items-center gap-3">
                              <item.icon className="h-4 w-4 text-slate-500 dark:text-blue-400" />
                              {item.label}
                            </span>
                            {item.badge ? (
                              <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                                {item.badge}
                              </Badge>
                            ) : null}
                          </a>
                        ))}
                      </nav>
                      <Separator className="dark:bg-slate-800" />
                      <div className="px-4 py-4 space-y-1">
                        {canSwitch && (
                          <Button
                            variant="ghost"
                            className="w-full justify-start gap-2 hover:bg-blue-50 text-blue-600 dark:hover:bg-blue-900/30 dark:text-blue-300"
                            onClick={() => {
                              setMobileMenuOpen(false);
                              window.setTimeout(() => setShowRoleSwitcher(true), 0);
                            }}
                          >
                            <ArrowLeftRight className="h-4 w-4" />
                            Trocar Conta
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          className="w-full justify-start gap-2 hover:bg-slate-100 dark:hover:bg-slate-800/50 dark:text-blue-300"
                          onClick={logout}
                        >
                          <LogOut className="h-4 w-4" />
                          Sair
                        </Button>
                      </div>
                    </SheetContent>
                  </Sheet>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-blue-400">
                      Painel Administrativo
                    </p>
                    <h1 className="text-xl font-bold text-slate-900 sm:text-2xl dark:text-blue-100">
                      Dashboard
                    </h1>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-slate-600 shadow-sm xl:flex dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300">
                    <Search className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                    <Input
                      placeholder="Buscar usuarios, transacoes..."
                      value={globalSearch}
                      onChange={(event) => setGlobalSearch(event.target.value)}
                      className="h-8 w-64 border-0 p-0 shadow-none focus-visible:ring-0 dark:bg-transparent dark:text-white dark:placeholder:text-slate-500"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleDarkMode}
                    className="h-9 w-9 rounded-lg border border-slate-200 bg-white shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
                    title={isDark ? "Modo claro" : "Modo escuro"}
                  >
                    {isDark ? (
                      <Sun className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                    ) : (
                      <Moon className="h-4 w-4 text-slate-600" />
                    )}
                  </Button>
                  <button
                    type="button"
                    onClick={() => setShowAccountModal(true)}
                    className="hidden items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left shadow-sm transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary md:flex dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
                    aria-label="Abrir configurações da conta"
                  >
                    <Avatar className="h-8 w-8">
                      {user?.profileImageUrl ? (
                        <AvatarImage
                          src={user.profileImageUrl}
                          alt={adminName}
                        />
                      ) : null}
                      <AvatarFallback>{adminInitials}</AvatarFallback>
                    </Avatar>
                    <div className="leading-tight">
                      <p className="text-sm font-semibold text-slate-800">
                        {adminName}
                      </p>
                      <p className="text-xs text-slate-500">Admin</p>
                    </div>
                  </button>
                </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAccountModal(true)}
                  className="mt-3 flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 text-left shadow-sm transition-colors active:bg-slate-100 md:hidden dark:border-slate-700 dark:bg-slate-800 dark:active:bg-slate-700"
                  aria-label="Abrir configurações da conta"
                >
                  <Avatar className="h-10 w-10 shrink-0">
                    {user?.profileImageUrl ? (
                      <AvatarImage src={user.profileImageUrl} alt={adminName} />
                    ) : null}
                    <AvatarFallback>{adminInitials}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 leading-tight">
                    <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {adminName}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {user?.adminRole === "master" ? "Administrador mestre" : "Administrador"}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
                </button>
              </div>
            </header>
            <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-8 lg:px-10">
              {hasLoadError && (
                <div className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <AlertTriangle className="h-4 w-4" />
                  Erro ao carregar dados do painel. Atualize a página.
                </div>
              )}

              <AdminDashboardSection
                onExportBookings={exportBookingsCsv}
                stats={stats}
                alerts={alerts}
                mapStateFilter={mapStateFilter}
                onMapStateChange={setMapStateFilter}
                mapCityFilter={mapCityFilter}
                onMapCityChange={setMapCityFilter}
                mapLayer={mapLayer}
                onMapLayerChange={setMapLayer}
                geoSummary={geoSummary}
                geoSummaryLoading={geoSummaryLoading}
                geoSummaryError={geoSummaryError}
                financePeriodFilter={financePeriodFilter}
                onFinancePeriodChange={setFinancePeriodFilter}
                financeStatusFilter={financeStatusFilter}
                onFinanceStatusChange={setFinanceStatusFilter}
                financeSeries={financeSeries}
                financeSeriesLoading={financeSeriesLoading}
                formatCurrency={formatCurrency}
              />

              <AdminInstructorSection
                instructors={instructors}
                isUnauthorized={isUnauthorized}
                instructorsLoading={instructorsLoading}
                instructorsError={instructorsError}
                searchTerm={globalSearch}
                pendingCount={counts.pending}
                totalCount={counts.total}
                formatPersonName={formatPersonName}
                onRefresh={() =>
                  queryClient.invalidateQueries({
                    queryKey: ["/api/admin/instructors"],
                  })
                }
                onReview={openUserReviewDialog}
              />

              <AdminStudentsSection
                students={students}
                isUnauthorized={isUnauthorized}
                studentsLoading={studentsLoading}
                studentsError={studentsError}
                searchTerm={globalSearch}
                formatPersonName={formatPersonName}
                onReview={openUserReviewDialog}
              />

              <AdminBookingsSection
                bookings={bookings}
                isUnauthorized={isUnauthorized}
                bookingsLoading={bookingsLoading}
                bookingsError={bookingsError}
                searchTerm={globalSearch}
                formatPersonName={formatPersonName}
                formatCurrency={formatCurrency}
                onRefresh={() =>
                  queryClient.invalidateQueries({
                    queryKey: ["/api/admin/bookings?limit=12"],
                  })
                }
              />

              <AdminFinanceSection
                financeCards={financeCards}
                transactions={transactions}
                wallets={wallets}
                walletEntries={walletEntries}
                withdrawals={withdrawals}
                transactionsLoading={transactionsLoading}
                transactionsError={transactionsError}
                walletsLoading={walletsLoading}
                walletsError={walletsError}
                walletEntriesLoading={walletEntriesLoading}
                walletEntriesError={walletEntriesError}
                withdrawalsLoading={withdrawalsLoading}
                withdrawalsError={withdrawalsError}
                isUnauthorized={isUnauthorized}
                searchTerm={globalSearch}
                formatCurrency={formatCurrency}
                formatPersonName={formatPersonName}
                formatRoleLabel={formatRoleLabel}
                onRefreshFinanceSummary={() =>
                  queryClient.invalidateQueries({
                    queryKey: ["/api/admin/finance/summary"],
                  })
                }
                onRefreshTransactions={() =>
                  queryClient.invalidateQueries({
                    queryKey: ["/api/admin/transactions?limit=30"],
                  })
                }
                onRefreshWallets={() =>
                  queryClient.invalidateQueries({
                    queryKey: ["/api/admin/wallets"],
                  })
                }
                onRefreshWalletEntries={() =>
                  queryClient.invalidateQueries({
                    queryKey: ["/api/admin/wallet-entries?limit=12"],
                  })
                }
                onRefreshWithdrawals={() =>
                  queryClient.invalidateQueries({
                    queryKey: ["/api/admin/withdrawals?limit=12"],
                  })
                }
                onExportTransactions={exportTransactionsCsv}
                onExportWithdrawals={exportWithdrawalsCsv}
                onWithdrawalAction={({ id, status }) =>
                  updateWithdrawal.mutate({ id, status })
                }
                isUpdatingWithdrawal={updateWithdrawal.isPending}
              />

              <AdminSettingsSection isAdmin={user?.role === "admin"} />

              {user?.adminRole === 'master' && (
                <section id="acesso" className="space-y-4">
                  <AdminUsersTable />
                </section>
              )}

              <AdminIntegrationsSection
                integrations={integrations}
                isUnauthorized={isUnauthorized}
                searchTerm={globalSearch}
                integrationsLoading={integrationsLoading}
                integrationsError={integrationsError}
              />
            </div>
          </main>
          <AdminAIChat />
          <UserManagementSheet
            open={reviewDialogOpen}
            onOpenChange={setReviewDialogOpen}
            userId={reviewUserId}
          />
        </div>
      </div>
      {/* Role Switcher Modal */}
      <RoleSwitcherModal
        open={showRoleSwitcher}
        onClose={() => setShowRoleSwitcher(false)}
        currentViewRole={viewRole}
        onSelectRole={(role) => {
          setViewRole(role);
          if (role === "admin") window.location.hash = "#dashboard";
          else if (role === "instructor") window.location.href = "/dashboard/instrutor";
          else window.location.href = "/dashboard/aluno";
        }}
      />
      <AccountModal
        open={showAccountModal}
        onOpenChange={setShowAccountModal}
        user={user}
      />
    </AuthGuard>
  );
}
