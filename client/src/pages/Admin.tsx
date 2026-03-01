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
  Loader2,
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
} from "lucide-react";
import { AdminUsersTable } from "@/components/admin/AdminUsersTable";
import { AdminMonitoring } from "@/components/admin/AdminMonitoring";
import { AdminAIChat } from "@/components/admin/AdminAIChat";
import { AdminFinanceSection } from "@/components/admin/AdminFinanceSection";
import { AdminFinancialCharts } from "@/components/admin/AdminFinancialCharts";
import {
  AdminIntegrationsSection,
  type AdminIntegration,
} from "@/components/admin/AdminIntegrationsSection";
import { AdminSettingsSection } from "@/components/admin/AdminSettingsSection";
import { UserManagementSheet } from "@/components/admin/UserManagementSheet";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

function AdminMapController({
  center,
  zoom,
}: {
  center: [number, number];
  zoom: number;
}) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);

  return null;
}

const formatCurrency = (value: number | string | null | undefined) => {
  if (value === null || value === undefined) return "—";
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "—";
  return parsed.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
};

const formatPersonName = (person?: AdminUser | null) => {
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
    completed: "Concluído",
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

export default function Admin() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [globalSearch, setGlobalSearch] = useState("");
  const [instructorStatusFilter, setInstructorStatusFilter] = useState("all");
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
  const mapPoints =
    mapLayer === "instructors" ? geoSummary.instructors : geoSummary.students;
  const mapCenter = useMemo<[number, number]>(() => {
    if (mapPoints.length === 0) return [-14.235, -51.9253];
    const latSum = mapPoints.reduce((sum, point) => sum + point.lat, 0);
    const lngSum = mapPoints.reduce((sum, point) => sum + point.lng, 0);
    return [latSum / mapPoints.length, lngSum / mapPoints.length];
  }, [mapPoints]);
  const mapZoom = mapPoints.length > 1 ? 4 : mapPoints.length === 1 ? 9 : 4;
  const chartHasData = financeSeries.length > 0;

  const formatSeriesLabel = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    if (financePeriodFilter === "month") {
      return date.toLocaleDateString("pt-BR", {
        month: "short",
        year: "2-digit",
      });
    }
    if (financePeriodFilter === "week") {
      return `Sem ${date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
      })}`;
    }
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    });
  };

  const normalizedSearch = globalSearch.trim().toLowerCase();

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
  }, [instructors, instructorStatusFilter, normalizedSearch]);

  const filteredStudents = useMemo(() => {
    if (!normalizedSearch) return students;

    return students.filter((student) => {
      const fields = [
        student.firstName,
        student.lastName,
        student.email,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return fields.includes(normalizedSearch);
    });
  }, [students, normalizedSearch]);

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
  }, [bookings, normalizedSearch]);

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

  const pendingInstructors = useMemo(
    () => instructors.filter((instructor) => instructor.status === "pending"),
    [instructors],
  );
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
    if (filteredBookings.length === 0) {
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
      filteredBookings.map((row) => [
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
            <div className="px-4 py-4">
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
              <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4 lg:px-10">
                <div className="flex items-center gap-3">
                  <Sheet>
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
                      <div className="px-4 py-4">
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
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-blue-100">
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
                  <div className="hidden items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm md:flex dark:border-slate-700 dark:bg-slate-800">
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
                  </div>
                </div>
              </div>
            </header>
            <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-8 lg:px-10">
              {hasLoadError && (
                <div className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <AlertTriangle className="h-4 w-4" />
                  Erro ao carregar dados do painel. Atualize a página.
                </div>
              )}

              <section id="dashboard" className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Visão geral
                    </h2>
                    <p className="text-sm text-slate-500">
                      Indicadores principais do painel admin.
                    </p>
                  </div>
                  <Button variant="outline" onClick={exportBookingsCsv}>
                    Exportar relatórios
                  </Button>
                </div>

                <AdminMonitoring />


                <AdminFinancialCharts />

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {stats.map((stat) => {
                    const Icon = stat.icon;
                    const value = stat.loading
                      ? "..."
                      : stat.error
                        ? "—"
                      : stat.format
                        ? stat.format(stat.value)
                        : stat.value.toLocaleString("pt-BR");

                    return (
                      <Card
                        key={stat.label}
                        className="border border-slate-200 shadow-sm"
                      >
                        <CardContent className="flex items-center justify-between gap-4 p-5">
                          <div>
                            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-blue-400">
                              {stat.label}
                            </p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-blue-100">
                              {value}
                            </p>
                            <p className="text-xs text-slate-400 dark:text-blue-300/70">
                              {stat.error
                                ? "Dados temporariamente indisponíveis."
                                : stat.helper}
                            </p>
                          </div>
                          <div
                            className={`flex h-11 w-11 items-center justify-center rounded-lg ${stat.bg} ${stat.tone}`}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
                  <Card id="mapa" className="border border-slate-200 shadow-sm">
                    <CardContent className="p-0">
                      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-6 py-4">
                        <div>
                          <p className="text-sm font-semibold text-slate-800 dark:text-blue-100">
                            Mapa Brasil
                          </p>
                          <p className="text-xs text-slate-500 dark:text-blue-400">
                            Distribuicao por instrutores e alunos com
                            localizacao cadastrada.
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Select
                            value={mapStateFilter}
                            onValueChange={(value) => {
                              setMapStateFilter(value);
                              setMapCityFilter("all");
                            }}
                          >
                            <SelectTrigger className="h-8 w-[160px]">
                              <SelectValue placeholder="Estado" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todos estados</SelectItem>
                              {geoSummary.states.map((state) => (
                                <SelectItem key={state} value={state}>
                                  {state}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select
                            value={mapCityFilter}
                            onValueChange={setMapCityFilter}
                            disabled={geoSummary.cities.length === 0}
                          >
                            <SelectTrigger className="h-8 w-[200px]">
                              <SelectValue placeholder="Cidade" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">
                                Todas cidades
                              </SelectItem>
                              {geoSummary.cities.map((city) => (
                                <SelectItem key={city} value={city}>
                                  {city}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            variant={
                              mapLayer === "instructors" ? "default" : "outline"
                            }
                            onClick={() => setMapLayer("instructors")}
                          >
                            Instrutores
                          </Button>
                          <Button
                            size="sm"
                            variant={
                              mapLayer === "students" ? "default" : "outline"
                            }
                            onClick={() => setMapLayer("students")}
                          >
                            Alunos
                          </Button>
                        </div>
                      </div>
                      <div className="h-[320px] overflow-hidden">
                        {geoSummaryLoading ? (
                          <div className="flex h-full items-center justify-center gap-2 text-slate-500">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Carregando mapa...
                          </div>
                        ) : geoSummaryError ? (
                          <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-amber-600">
                            <AlertTriangle className="h-4 w-4" />
                            Dados de geolocalização indisponíveis no momento.
                          </div>
                        ) : mapPoints.length === 0 ? (
                          <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-slate-500">
                            <AlertTriangle className="h-4 w-4" />
                            Nenhuma coordenada encontrada para exibir no mapa.
                          </div>
                        ) : (
                          <MapContainer
                            center={mapCenter}
                            zoom={mapZoom}
                            scrollWheelZoom={false}
                            className="h-full w-full"
                          >
                            <AdminMapController
                              center={mapCenter}
                              zoom={mapZoom}
                            />
                            <TileLayer
                              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                            />
                            {mapPoints.map((point) => {
                              const color =
                                mapLayer === "instructors"
                                  ? "#2563eb"
                                  : "#16a34a";
                              const radius = Math.min(
                                6 + point.count * 2,
                                18,
                              );
                              const label =
                                point.label || "Localizacao nao informada";

                              return (
                                <CircleMarker
                                  key={`${mapLayer}-${point.lat}-${point.lng}`}
                                  center={[point.lat, point.lng]}
                                  radius={radius}
                                  pathOptions={{
                                    color,
                                    fillColor: color,
                                    fillOpacity: 0.6,
                                  }}
                                >
                                  <Popup>
                                    <div className="text-sm">
                                      <p className="font-semibold">
                                        {label}
                                      </p>
                                      <p>
                                        {mapLayer === "instructors"
                                          ? "Instrutores"
                                          : "Alunos com aulas"}
                                        : {point.count}
                                      </p>
                                    </div>
                                  </Popup>
                                </CircleMarker>
                              );
                            })}
                          </MapContainer>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-6 py-3 text-xs text-slate-500">
                        <span>
                          Instrutores com localizacao:{" "}
                          {geoSummary.totals.instructorsWithLocation} de{" "}
                          {geoSummary.totals.instructorsTotal}
                        </span>
                        <span>
                          Alunos com localizacao:{" "}
                          {geoSummary.totals.studentsWithLocation} de{" "}
                          {geoSummary.totals.studentsTotal}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-slate-200 shadow-sm">
                    <CardContent className="space-y-4 p-6">
                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-blue-100">
                          Alertas criticos
                        </p>
                        <p className="text-xs text-slate-500 dark:text-blue-400">
                          Pendencias que exigem atencao imediata.
                        </p>
                      </div>
                      <div className="space-y-3">
                        {alerts.map((alert) => {
                          const Icon = alert.icon;
                          return (
                            <div
                              key={alert.label}
                              className="flex items-center gap-3 rounded-lg border border-slate-100 bg-white px-3 py-3 dark:bg-slate-800 dark:border-slate-700"
                            >
                              <div
                                className={`flex h-9 w-9 items-center justify-center rounded-lg ${alert.bg} ${alert.tone}`}
                              >
                                <Icon className="h-4 w-4" />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-slate-800 dark:text-blue-100">
                                  {alert.label}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-blue-400">
                                  {alert.helper}
                                </p>
                              </div>
                              <span
                                className={`text-sm font-semibold ${alert.tone}`}
                              >
                                {alert.valueLabel}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="border border-slate-200 shadow-sm">
                  <CardContent className="space-y-4 p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-blue-100">
                          Grafico financeiro
                        </p>
                        <p className="text-xs text-slate-500 dark:text-blue-400">
                          Transacoes por periodo e status.
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Select
                          value={financePeriodFilter}
                          onValueChange={(value) =>
                            setFinancePeriodFilter(
                              value as "day" | "week" | "month",
                            )
                          }
                        >
                          <SelectTrigger className="h-8 w-[140px]">
                            <SelectValue placeholder="Periodo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="day">Dia</SelectItem>
                            <SelectItem value="week">Semana</SelectItem>
                            <SelectItem value="month">Mes</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select
                          value={financeStatusFilter}
                          onValueChange={setFinanceStatusFilter}
                        >
                          <SelectTrigger className="h-8 w-[160px]">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="paid">Pagas</SelectItem>
                            <SelectItem value="pending">Pendentes</SelectItem>
                            <SelectItem value="processing">Processando</SelectItem>
                            <SelectItem value="refunded">Reembolsadas</SelectItem>
                            <SelectItem value="all">Todas</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="h-[260px]">
                      {financeSeriesLoading ? (
                        <div className="flex h-full items-center justify-center gap-2 text-slate-500">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Carregando grafico...
                        </div>
                      ) : !chartHasData ? (
                        <div className="flex h-full items-center justify-center text-sm text-slate-500">
                          Sem dados financeiros para o periodo selecionado.
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={financeSeries} margin={{ left: 8, right: 16 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis
                              dataKey="period"
                              tickFormatter={formatSeriesLabel}
                              stroke="#94a3b8"
                              fontSize={12}
                            />
                            <YAxis
                              tickFormatter={(value) => formatCurrency(value)}
                              stroke="#94a3b8"
                              fontSize={12}
                              width={90}
                            />
                            <Tooltip
                              formatter={(value) => formatCurrency(value as number)}
                              labelFormatter={formatSeriesLabel}
                            />
                            <Line
                              type="monotone"
                              dataKey="total"
                              stroke="#2563eb"
                              strokeWidth={2}
                              dot={false}
                              name="Total"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </section>

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
                    {counts.pending} pendente(s)
                  </Badge>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                    <p className="text-sm font-semibold text-slate-700">
                      Fila de validação
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Recarregar"
                      onClick={() =>
                        queryClient.invalidateQueries({
                          queryKey: ["/api/admin/instructors"],
                        })
                      }
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
                    ) : instructorsLoading ? (
                      <div className="flex items-center gap-2 p-4 text-slate-500">
                        <Loader2 className="h-4 w-4 animate-spin" /> Carregando
                        instrutores...
                      </div>
                    ) : instructorsError ? (
                      <div className="flex items-center gap-2 p-4 text-sm text-red-600">
                        <AlertTriangle className="h-4 w-4" />
                        Erro ao carregar pendentes:{" "}
                        {(instructorsError as Error).message}
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
                            const fullName = [
                              instrutor.user?.firstName,
                              instrutor.user?.lastName,
                            ]
                              .filter(Boolean)
                              .join(" ");
                            const email = instrutor.user?.email || "";
                            const displayName =
                              fullName ||
                              email ||
                              instrutor.userId ||
                              "Instrutor";
                            const showEmail = Boolean(email && email !== displayName);
                            const vehicleLabel = [
                              instrutor.vehicleModel,
                              instrutor.vehicleYear,
                            ]
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
                                      <span className="text-xs text-slate-400">
                                        {email}
                                      </span>
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
                                      <Eye className="h-3 w-3" />{" "}
                                      {instrutor.credentialNumber}
                                    </div>
                                  ) : (
                                    <span className="text-xs text-slate-400">
                                      —
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {instrutor.createdAt
                                    ? new Date(
                                      instrutor.createdAt,
                                    ).toLocaleDateString("pt-BR")
                                    : "—"}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-8 rounded-md px-3"
                                      onClick={() =>
                                        openUserReviewDialog(instrutor.userId)
                                      }
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
                      {filteredInstructors.length} de {counts.total}
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
                        Erro ao carregar instrutores:{" "}
                        {(instructorsError as Error).message}
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
                            const statusMeta = getInstructorStatusMeta(
                              instrutor.status,
                            );
                            const vehicleLabel = [
                              instrutor.vehicleModel,
                              instrutor.vehicleYear,
                            ]
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
                                <TableCell>
                                  {instrutor.user?.email || "—"}
                                </TableCell>
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
                                <TableCell>
                                  {instrutor.credentialNumber || "—"}
                                </TableCell>
                                <TableCell>
                                  {instrutor.createdAt
                                    ? new Date(
                                      instrutor.createdAt,
                                    ).toLocaleDateString("pt-BR")
                                    : "—"}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 rounded-md px-3"
                                    onClick={() =>
                                      openUserReviewDialog(instrutor.userId)
                                    }
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

              <section id="alunos" className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-blue-100">
                      Lista de alunos
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-blue-400">
                      Alunos cadastrados e ativos na plataforma.
                    </p>
                  </div>
                  <Badge variant="outline" className="text-slate-500">
                    {filteredStudents.length} de {students.length}
                  </Badge>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
                  <div className="min-h-[120px]">
                    {isUnauthorized ? (
                      <div className="flex items-center gap-2 p-4 text-sm text-slate-500">
                        <AlertTriangle className="h-4 w-4" />
                        Acesso restrito. Faça login como admin.
                      </div>
                    ) : studentsLoading ? (
                      <div className="flex items-center gap-2 p-4 text-slate-500">
                        <Loader2 className="h-4 w-4 animate-spin" /> Carregando
                        alunos...
                      </div>
                    ) : studentsError ? (
                      <div className="flex items-center gap-2 p-4 text-sm text-red-600">
                        <AlertTriangle className="h-4 w-4" />
                        Erro ao carregar alunos:{" "}
                        {(studentsError as Error).message}
                      </div>
                    ) : filteredStudents.length === 0 ? (
                      <div className="p-4 text-sm text-slate-500">
                        Nenhum aluno encontrado.
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Aluno</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Cadastro</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredStudents.map((aluno) => (
                            <TableRow key={aluno.id}>
                              <TableCell className="font-medium">
                                {formatPersonName(aluno)}
                              </TableCell>
                              <TableCell>{aluno.email || "—"}</TableCell>
                              <TableCell>
                                {aluno.isBlocked ? (
                                  <Badge className="border-none shadow-none bg-red-100 text-red-700">
                                    Banido
                                  </Badge>
                                ) : (
                                  <Badge className="border-none shadow-none bg-green-100 text-green-700">
                                    Ativo
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {aluno.createdAt
                                  ? new Date(
                                    aluno.createdAt,
                                  ).toLocaleDateString("pt-BR")
                                  : "—"}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 rounded-md px-3"
                                  onClick={() => openUserReviewDialog(aluno.id)}
                                >
                                  Revisar
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                </div>
              </section>

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
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Recarregar"
                    onClick={() =>
                      queryClient.invalidateQueries({
                        queryKey: ["/api/admin/bookings?limit=12"],
                      })
                    }
                  >
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
                        <Loader2 className="h-4 w-4 animate-spin" /> Carregando
                        agendamentos...
                      </div>
                    ) : bookingsError ? (
                      <div className="flex items-center gap-2 p-4 text-sm text-red-600">
                        <AlertTriangle className="h-4 w-4" />
                        Erro ao carregar agendamentos:{" "}
                        {(bookingsError as Error).message}
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
                            const { booking, student, instructorUser } = row;
                            const statusMeta = getBookingStatusMeta(
                              booking.status,
                            );

                            return (
                              <TableRow key={booking.id}>
                                <TableCell className="font-medium">
                                  {booking.id}
                                </TableCell>
                                <TableCell>{formatPersonName(student)}</TableCell>
                                <TableCell>
                                  {formatPersonName(instructorUser)}
                                </TableCell>
                                <TableCell>
                                  {formatCurrency(booking.totalPrice)}
                                </TableCell>
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
    </AuthGuard>
  );
}
