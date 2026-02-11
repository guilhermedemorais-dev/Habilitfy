import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ResponsiveContainer, LineChart, Line, XAxis, Tooltip } from "recharts";
import { Calendar as CalendarIcon, Users, User, AlertCircle, Moon, Sun, Shield, Car, HelpCircle, Plus, Trash2, Upload, MessageSquare } from "lucide-react";

import Calendar from "react-calendar";
import { useEffect, useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "sonner";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import type { Availability } from "@shared/schema";
import { KYCPendingBlock } from "@/components/dashboard/KYCPendingBlock";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useTheme } from "@/components/theme-provider";
import {
  useInstructorBookings,
  getTodayBookings,
  getWeekEarnings,
  getPendingEarnings,
} from "@/hooks/useInstructorBookings";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { WalletCard } from "@/components/dashboard/wallet/WalletCard";
import { TransactionHistory } from "@/components/dashboard/wallet/TransactionHistory";
import { ProfileEditor } from "@/components/dashboard/ProfileEditor";
import { PwaInstallBanner } from "@/components/pwa/PwaInstallBanner";

export default function InstructorDashboard() {
  const [date, setDate] = useState<Date>(new Date());
  const { user } = useAuth();
  const instructorProfile = (user as any)?.instructorProfile;
  const instructorName =
    user?.firstName || user?.lastName || user?.email || "Instrutor";
  const [slotDurationMinutes, setSlotDurationMinutes] = useState<number>(50);
  const [maxBookingsPerStudent, setMaxBookingsPerStudent] = useState<number>(0);
  const [availabilityDay, setAvailabilityDay] = useState<number>(1);
  const [availabilityStart, setAvailabilityStart] = useState<string>("08:00");
  const [availabilityEnd, setAvailabilityEnd] = useState<string>("18:00");
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [pricePerHour, setPricePerHour] = useState<string>("0");
  const [serviceAreas, setServiceAreas] = useState<string>("");
  const [now, setNow] = useState<Date>(new Date());
  const [startCodes, setStartCodes] = useState<Record<string, string>>({});
  const [endCodes, setEndCodes] = useState<Record<string, string>>({});
  const [pixKey, setPixKey] = useState<string>("");
  const initialTheme = useRef<boolean | null>(null);
  // const [isDark, setIsDark] = useState(false); // Removed old state
  const [vehicleBrand, setVehicleBrand] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehicleYear, setVehicleYear] = useState(new Date().getFullYear());
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [vehicleCategory, setVehicleCategory] = useState("Carro");
  const [photoFront, setPhotoFront] = useState<string | null>(null);
  const [photoSide, setPhotoSide] = useState<string | null>(null);
  const [photoBack, setPhotoBack] = useState<string | null>(null);
  const [photoInterior, setPhotoInterior] = useState<string | null>(null);
  const [documentCrlv, setDocumentCrlv] = useState<string | null>(null);
  const [documentLav, setDocumentLav] = useState<string | null>(null);
  const [supportType, setSupportType] = useState("support");
  const [supportSubject, setSupportSubject] = useState("");
  const [supportMessage, setSupportMessage] = useState("");
  const [platformFeePercent, setPlatformFeePercent] = useState(20); // Default to 20%


  const { theme, setTheme } = useTheme();
  // Helper to check if dark mode is active (for conditional rendering)
  const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string | null) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };



  const { data: bookings, isLoading, error } = useInstructorBookings(
    instructorProfile?.id
  );
  const queryClient = useQueryClient();
  const { data: availability = [] } = useQuery<Availability[]>({
    queryKey: ["/api/instructors", instructorProfile?.id, "availability"],
    enabled: !!instructorProfile?.id,
  });
  const { data: vehicles = [] } = useQuery<any[]>({
    queryKey: ["/api/vehicles"],
    enabled: !!instructorProfile?.id,
  });
  const { data: feeConfig } = useQuery<any>({
    queryKey: ["/api/config/fees"],
  });

  useEffect(() => {
    if (feeConfig) {
      setPlatformFeePercent(feeConfig.platformFeePercent);
    }
  }, [feeConfig]);

  // Effect to load profile data and convert Gross (DB) -> Net (UI)
  useEffect(() => {
    if (!instructorProfile || !feeConfig) return; // Wait for feeConfig to be ready

    setSlotDurationMinutes(instructorProfile.slotDurationMinutes ?? 50);
    setMaxBookingsPerStudent(instructorProfile.maxBookingsPerStudent ?? 0);

    // Convert DB Gross Price -> UI Net Price
    const grossPrice = Number(instructorProfile.pricePerHour ?? "0");
    const feePercent = feeConfig.platformFeePercent || 20;
    // Net = Gross * (1 - fee%)
    // If we have a stored price, calculate what that means in "User Pocket Money"
    const netPrice = grossPrice * (1 - (feePercent / 100));
    setPricePerHour(netPrice > 0 ? netPrice.toFixed(2) : "0");

    setServiceAreas(instructorProfile.serviceAreas ?? "");
    setPixKey(instructorProfile.pixKey ?? "");
  }, [
    instructorProfile?.slotDurationMinutes,
    instructorProfile?.maxBookingsPerStudent,
    instructorProfile?.pricePerHour,
    instructorProfile?.serviceAreas,
    instructorProfile?.pixKey,
    feeConfig?.platformFeePercent
  ]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const toggleDarkMode = () => {
    setTheme(isDark ? "light" : "dark");
  };

  const completeLesson = useMutation({
    mutationFn: async (payload: { bookingId: string; code: string }) => {
      const res = await apiRequest(
        "POST",
        `/api/bookings/${payload.bookingId}/complete`,
        {
          code: payload.code,
        },
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/bookings/instructor", instructorProfile?.id],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/student"] });
      toast.success("Aula concluida com sucesso.");
    },
    onError: () => {
      toast.error("Nao foi possivel concluir a aula.");
    },
  });

  const startLesson = useMutation({
    mutationFn: async (payload: { bookingId: string; code: string }) => {
      const res = await apiRequest(
        "POST",
        `/api/bookings/${payload.bookingId}/start`,
        {
          code: payload.code,
        },
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/bookings/instructor", instructorProfile?.id],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/student"] });
      toast.success("Aula iniciada.");
    },
    onError: () => {
      toast.error("Nao foi possivel iniciar a aula.");
    },
  });

  const updateScheduleSettings = useMutation({
    mutationFn: async () => {
      if (!instructorProfile?.id) {
        throw new Error("Instrutor nao encontrado");
      }
      if (!feeConfig) {
        throw new Error("Configuração de taxas ainda não carregada. Tente recarregar a página.");
      }

      // Convert UI Net Price -> DB Gross Price before saving
      // Gross = Net / (1 - fee%)
      const netPrice = Number(pricePerHour);
      const feePercent = platformFeePercent; // Current state
      const grossPrice = netPrice / (1 - (feePercent / 100));

      const res = await apiRequest("PATCH", `/api/instructors/${instructorProfile.id}`, {
        slotDurationMinutes,
        maxBookingsPerStudent,
        pricePerHour: grossPrice.toFixed(2), // Save Gross
        serviceAreas,
        pixKey,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast.success("Configuracoes de agenda salvas.");
    },
    onError: () => {
      toast.error("Nao foi possivel salvar as configuracoes.");
    },
  });
  const saveAvailability = useMutation({
    mutationFn: async () => {
      if (!instructorProfile?.id) {
        throw new Error("Instrutor nao encontrado");
      }
      const payload = {
        dayOfWeek: availabilityDay,
        startTime: availabilityStart,
        endTime: availabilityEnd,
      };
      const endpoint = editingSlotId
        ? `/api/instructors/${instructorProfile.id}/availability/${editingSlotId}`
        : `/api/instructors/${instructorProfile.id}/availability`;
      const method = editingSlotId ? "PATCH" : "POST";
      const res = await apiRequest(method, endpoint, payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/instructors", instructorProfile?.id, "availability"],
      });
      setEditingSlotId(null);
      toast.success("Disponibilidade salva.");
    },
    onError: () => {
      toast.error("Nao foi possivel salvar a disponibilidade.");
    },
  });
  const deleteAvailability = useMutation({
    mutationFn: async (slotId: string) => {
      if (!instructorProfile?.id) {
        throw new Error("Instrutor nao encontrado");
      }
      const res = await apiRequest(
        "DELETE",
        `/api/instructors/${instructorProfile.id}/availability/${slotId}`,
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/instructors", instructorProfile?.id, "availability"],
      });
      toast.success("Disponibilidade removida.");
    },
    onError: () => {
      toast.error("Nao foi possivel remover a disponibilidade.");
    },
  });
  const requestWithdrawal = useMutation({
    mutationFn: async () => {
      if (!instructorProfile?.id) {
        throw new Error("Instrutor nao encontrado");
      }
      if (!pixKey) {
        throw new Error("Cadastre sua chave Pix antes de solicitar o saque.");
      }
      if (pendingEarnings <= 0) {
        throw new Error("Sem saldo a receber.");
      }

      const res = await apiRequest("POST", "/api/withdrawals", {
        amount: pendingEarnings,
        pixKey,
      });
      return res.json();
    },
    onSuccess: () => {
      toast.success("Solicitacao de saque realizada com sucesso!");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erro ao solicitar saque.");
    },
  });

  const createVehicle = useMutation({
    mutationFn: async () => {
      const payload = {
        brand: vehicleBrand,
        model: vehicleModel,
        year: vehicleYear,
        plate: vehiclePlate,
        category: vehicleCategory,
        photoFront,
        photoSide,
        photoBack,
        photoInterior,
        documentCrlv,
        documentLav,
      };
      const res = await apiRequest("POST", "/api/vehicles", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/vehicles"]
      });
      toast.success("Veículo enviado para análise!");
      // Reset form
      setVehicleBrand("");
      setVehicleModel("");
      setVehiclePlate("");
      setPhotoFront(null);
      setPhotoSide(null);
      setPhotoBack(null);
      setPhotoInterior(null);
      setDocumentCrlv(null);
      setDocumentLav(null);
    },
    onError: () => {
      toast.error("Erro ao cadastrar veículo.");
    },
  });

  const deleteVehicle = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/vehicles/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/vehicles"]
      });
      toast.success("Veículo removido.");
    },
  });

  const submitSupport = useMutation({
    mutationFn: async () => {
      const payload = {
        type: supportType,
        subject: supportSubject,
        message: supportMessage,
      };
      const res = await apiRequest("POST", "/api/support", payload);
      return res.json();
    },
    onSuccess: () => {
      toast.success("Mensagem enviada com sucesso!");
      setSupportSubject("");
      setSupportMessage("");
    },
    onError: () => {
      toast.error("Erro ao enviar mensagem.");
    },
  });


  const todayLessons = getTodayBookings(bookings);
  const weekData = getWeekEarnings(bookings);
  const pendingEarnings = getPendingEarnings(bookings);
  const dayLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
  const getTimer = (lesson: (typeof todayLessons)[number]) => {
    if (!lesson.startedAt) return null;
    const start = new Date(lesson.startedAt);
    const elapsedMinutes = Math.max(
      0,
      Math.floor((now.getTime() - start.getTime()) / 60000),
    );
    const duration = lesson.duration || 0;
    const remainingMinutes = Math.max(duration - elapsedMinutes, 0);
    return { elapsedMinutes, remainingMinutes };
  };

  const isKycApproved = user?.kycStatus === "approved";

  if (isLoading) {
    return (
      <AuthGuard redirectTo="/dashboard/instrutor">
        <div className="min-h-screen bg-background pb-24">
          <header className="bg-white p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-slate-400">Olá</p>
                <div className="h-8 w-40 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
            </div>
          </header>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Card className="border-none shadow-sm">
                <CardContent className="p-4">
                  <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-20" />
                    <div className="h-8 bg-gray-200 rounded w-24" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm">
                <CardContent className="p-4">
                  <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-20" />
                    <div className="h-8 bg-gray-200 rounded w-16" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (error) {
    return (
      <AuthGuard redirectTo="/dashboard/instrutor">
        <div className="min-h-screen bg-background pb-24 flex items-center justify-center px-6">
          <Card className="border-none shadow-xl rounded-2xl max-w-md w-full">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="font-bold text-lg mb-2">Erro ao carregar dados</h3>
              <p className="text-slate-500 text-sm mb-4">
                Não foi possível carregar suas aulas. Tente novamente.
              </p>
              <Button
                onClick={() => window.location.reload()}
                className="bg-primary hover:bg-green-700"
              >
                Tentar Novamente
              </Button>
            </CardContent>
          </Card>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard redirectTo="/dashboard/instrutor">
      <div className="min-h-screen bg-background pb-24 mobile-app-container border-x border-sidebar-border">
        <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center transition-all duration-300">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="relative group cursor-pointer shrink-0">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden border-2 border-white shadow-sm ring-1 ring-gray-100 group-hover:ring-primary/20 transition-all duration-300">
                {user?.profileImageUrl ? (
                  <img
                    src={user.profileImageUrl}
                    alt={instructorName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <User className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                )}
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
            </div>

            <div>
              <p className="text-[10px] md:text-xs text-slate-400 font-medium tracking-wide uppercase">Olá</p>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white leading-tight tracking-tight">
                {instructorName}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              className="h-9 w-9 md:h-10 md:w-10 rounded-full bg-gray-50 dark:bg-slate-800 text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-primary transition-all duration-300"
              title={isDark ? "Modo claro" : "Modo escuro"}
            >
              {isDark ? (
                <Sun className="h-4 w-4 md:h-5 md:w-5" />
              ) : (
                <Moon className="h-4 w-4 md:h-5 md:w-5" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="rounded-full bg-gray-50 text-slate-500 hover:bg-gray-100 hover:text-primary transition-all duration-300 ml-1"
              asChild
            >
              <Link href="/chat">
                <div className="relative p-2">
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white animate-pulse" />
                  <MessageSquare className="w-5 h-5 md:w-6 md:h-6" />
                </div>
              </Link>
            </Button>
          </div>
        </header>

        <PwaInstallBanner />

        <div className="p-6 space-y-6">
          {!isKycApproved ? (
            <KYCPendingBlock status={user?.kycStatus} />
          ) : (
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-5 lg:w-fit">
                <TabsTrigger value="overview">Resumo</TabsTrigger>
                <TabsTrigger value="schedule">Agenda</TabsTrigger>
                <TabsTrigger value="profile">Perfil</TabsTrigger>
                <TabsTrigger value="vehicles">Veículos</TabsTrigger>
                <TabsTrigger value="support">Suporte</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6 outline-none">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  < WalletCard />
                  <Card className="border-none shadow-sm h-full flex flex-col justify-between">
                    < CardContent className="p-4 flex flex-col h-full justify-between">
                      < div >
                        <p className="text-slate-400 text-[10px] md:text-xs uppercase font-bold tracking-wider mb-1">
                          Aulas Hoje
                        </p >
                        <h3 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                          {todayLessons.length}
                        </h3>
                      </div >
                      <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 font-medium bg-slate-100 dark:bg-slate-800 w-fit px-2 py-1 rounded-full whitespace-nowrap">
                        {
                          bookings?.filter((b) => b.status === "pending").length || 0} pendentes
                      </p >
                    </CardContent >
                  </Card >
                </div >

                {/* Chart */}
                < Card className="border-none shadow-sm">
                  < CardHeader className="pb-2">
                    < CardTitle className="text-base font-bold">
                      Ganhos da Semana
                    </CardTitle >
                  </CardHeader >
                  <CardContent className="h-48">
                    < ResponsiveContainer width="100%" height="100%">
                      < LineChart data={weekData} >
                        <XAxis
                          dataKey="name"
                          stroke="#cbd5e1"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: "12px",
                            border: "none",
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                          }}
                          formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                        />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="#228B22"
                          strokeWidth={3}
                          dot={{
                            r: 4, fill: "#228B22"
                          }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart >
                    </ResponsiveContainer >
                  </CardContent >
                </Card >

                {/* Today's Students */}
                < div >
                  <h2 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    < Users className="w-5 h-5 text-primary" />
                    Alunos de Hoje
                  </h2 >
                  {
                    todayLessons.length > 0 ? (
                      <div className="space-y-3">
                        {
                          todayLessons.map((lesson) => (
                            (() => {
                              const timer = getTimer(lesson);
                              const startCodeValue = startCodes[lesson.id] ?? "";
                              const endCodeValue = endCodes[lesson.id] ?? "";
                              return (
                                <div
                                  key={lesson.id}
                                  className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border-l-4 border-primary flex justify-between items-center hover:shadow-md transition-shadow"
                                >
                                  <div className="flex-1">
                                    <p className="font-bold text-slate-800 dark:text-slate-100">
                                      {
                                        lesson.student?.name || "Aluno"}
                                    </p >
                                    <p className="text-xs text-slate-500">
                                      {
                                        format(new Date(lesson.date), "HH:mm", {
                                          locale: ptBR,
                                        })}{
                                        " "}
                                      • {lesson.duration} min
                                    </p >
                                    {timer && (
                                      <p className="text-xs text-slate-500 mt-1">
                                        Tempo: {timer.elapsedMinutes} min • Restante: {timer.remainingMinutes} min
                                      </p >
                                    )
                                    }
                                  </div >
                                  <div className="flex flex-col items-end gap-2">
                                    {
                                      lesson.status !== "completed" && !lesson.startedAt && (
                                        < div className="flex gap-2">
                                          < Input
                                            value={startCodeValue}
                                            onChange={(e) =>
                                              setStartCodes((prev) => ({
                                                ...prev,
                                                [lesson.id]: e.target.value,
                                              }))
                                            }
                                            placeholder="Código"
                                            className="h-8 w-24 text-xs"
                                          />
                                          <Button
                                            size="sm"
                                            onClick={() =>
                                              startLesson.mutate({
                                                bookingId: lesson.id,
                                                code: startCodeValue.trim(),
                                              })
                                            }
                                            disabled={startLesson.isPending || !startCodeValue.trim()}
                                          >
                                            Iniciar
                                          </Button >
                                        </div >
                                      )}
                                    {
                                      lesson.status !== "completed" && lesson.startedAt && (
                                        < div className="flex gap-2">
                                          < Input
                                            value={endCodeValue}
                                            onChange={(e) =>
                                              setEndCodes((prev) => ({
                                                ...prev,
                                                [lesson.id]: e.target.value,
                                              }))
                                            }
                                            placeholder="Código"
                                            className="h-8 w-24 text-xs"
                                          />
                                          <Button
                                            size="sm"
                                            onClick={() =>
                                              completeLesson.mutate({
                                                bookingId: lesson.id,
                                                code: endCodeValue.trim(),
                                              })
                                            }
                                            disabled={completeLesson.isPending || !endCodeValue.trim()}
                                          >
                                            Concluir
                                          </Button >
                                        </div >
                                      )}
                                    {
                                      lesson.status === "completed" && (
                                        < span className="text-xs font-semibold text-green-600">
                                          Concluída
                                        </span >
                                      )
                                    }
                                  </div >
                                </div >
                              );
                            })()
                          ))}
                      </div >
                    ) : (
                      <Card className="border-none shadow-sm">
                        < CardContent className="p-8 text-center">
                          < div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            < Users className="w-6 h-6 text-gray-400" />
                          </div >
                          <p className="text-slate-500 text-sm">
                            Nenhuma aula agendada para hoje
                          </p >
                        </CardContent >
                      </Card >
                    )}
                </div >
              </TabsContent >

              <TabsContent value="schedule" className="space-y-6 outline-none">
                < div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  < div className="space-y-6">
                    < Card className="border-none shadow-sm">
                      < CardHeader className="pb-2">
                        < CardTitle className="text-base font-bold">Serviços e Preços</CardTitle>
                      </CardHeader >
                      <CardContent className="space-y-4">
                        < div className="space-y-2">
                          < Label htmlFor="pricePerHour">O quanto você quer receber por aula (R$)</Label>
                          < div className="relative">
                            < span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">R$</span>
                            < Input
                              id="pricePerHour"
                              value={pricePerHour}
                              onChange={(e) => setPricePerHour(e.target.value)}
                              className="pl-10 bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 dark:text-white"
                              placeholder="Ex: 100.00"
                            />
                          </div >
                          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mt-2">
                            < div className="flex justify-between text-sm mb-1">
                              < span className="text-slate-500">Seu valor:</span>
                              < span className="font-medium">R$ {Number(pricePerHour || 0).toFixed(2)}</span>
                            </div >
                            <div className="flex justify-between text-sm mb-1">
                              < span className="text-slate-500">Taxa da Plataforma ({platformFeePercent}%):</span>
                              < span className="text-red-500">+ R$ {(Number(pricePerHour || 0) * (platformFeePercent / (100 - platformFeePercent))).toFixed(2)}</span>
                            </div >
                            <div className="h-px bg-slate-200 my-2" />
                            < div className="flex justify-between text-base font-bold">
                              < span > Preço final para o aluno:</span >
                              <span className="text-primary">R$ {(Number(pricePerHour || 0) * (100 / (100 - platformFeePercent))).toFixed(2)}</span>
                            </div >
                          </div >
                          <p className="text-[10px] text-slate-400 leading-tight italic">
                            * O cálculo é feito para que você receba o valor integral desejado após o desconto da taxa.
                          </p >
                        </div >
                        <div className="space-y-2">
                          < Label htmlFor="serviceAreas">Bairros de atendimento</Label>
                          < Input
                            id="serviceAreas"
                            value={serviceAreas}
                            onChange={(e) => setServiceAreas(e.target.value)}
                            placeholder="Ex: Copacabana, Botafogo, Centro"
                            className="bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 dark:text-white"
                          />
                        </div >
                        <Button
                          onClick={() => updateScheduleSettings.mutate()}
                          disabled={updateScheduleSettings.isPending}
                          className="w-full bg-primary hover:bg-green-700"
                        >
                          {
                            updateScheduleSettings.isPending ? "Salvando..." : "Salvar Serviços"}
                        </Button>
                      </CardContent >
                    </Card >

                    <Card className="border-none shadow-sm">
                      < CardHeader className="pb-2">
                        < CardTitle className="text-base font-bold">Configurações de Aula</CardTitle>
                      </CardHeader >
                      <CardContent className="space-y-4">
                        < div className="space-y-2">
                          < Label htmlFor="slotDurationMinutes">Duração de cada aula (min)</Label>
                          < Input
                            id="slotDurationMinutes"
                            type="number"
                            min={10}
                            value={slotDurationMinutes}
                            onChange={(e) => setSlotDurationMinutes(Number(e.target.value))}
                            className="bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 dark:text-white"
                          />
                        </div >
                        <Button
                          onClick={() => updateScheduleSettings.mutate()}
                          disabled={updateScheduleSettings.isPending}
                          className="w-full bg-primary hover:bg-green-700"
                        >
                          Salvar Configurações
                        </Button >
                      </CardContent >
                    </Card >
                  </div >

                  <div className="space-y-6">
                    < Card className="border-none shadow-sm">
                      < CardHeader className="pb-2">
                        < CardTitle className="text-base font-bold flex items-center gap-2">
                          < CalendarIcon className="w-4 h-4 text-primary" />
                          Disponibilidade
                        </CardTitle >
                      </CardHeader >
                      <CardContent className="space-y-4">
                        < div className="space-y-2">
                          < Label > Dia da semana</Label >
                          <select
                            value={availabilityDay}
                            onChange={(e) => setAvailabilityDay(Number(e.target.value))}
                            className="w-full rounded-md border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 px-3 py-2 text-sm dark:text-white"
                          >
                            {
                              dayLabels.map((label, index) => (
                                <option key={label} value={index}>{label}</option>
                              ))
                            }
                          </select >
                        </div >
                        <div className="grid grid-cols-2 gap-3">
                          < div className="space-y-2">
                            < Label > Início</Label >
                            <Input
                              type="time"
                              value={availabilityStart}
                              onChange={(e) => setAvailabilityStart(e.target.value)}
                              className="bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 dark:text-white"
                            />
                          </div >
                          <div className="space-y-2">
                            < Label > Fim</Label >
                            <Input
                              type="time"
                              value={availabilityEnd}
                              onChange={(e) => setAvailabilityEnd(e.target.value)}
                              className="bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 dark:text-white"
                            />
                          </div >
                        </div >
                        <Button
                          onClick={() => saveAvailability.mutate()}
                          disabled={saveAvailability.isPending}
                          className="w-full"
                        >
                          {
                            editingSlotId ? "Atualizar" : "Adicionar Horário"}
                        </Button>
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                          {
                            availability.map((slot) => (
                              <div key={slot.id} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-sm border border-slate-100 dark:border-slate-700 dark:text-slate-200">
                                < span > {dayLabels[slot.dayOfWeek]} • {slot.startTime} - {slot.endTime}</span >
                                <div className="flex gap-1">
                                  < Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-red-500"
                                    onClick={() => deleteAvailability.mutate(slot.id)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button >
                                </div >
                              </div >
                            ))}
                        </div >
                      </CardContent >
                    </Card >

                    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
                      < Calendar
                        onChange={(val) => setDate(val as Date)}
                        value={date}
                        locale="pt-BR"
                      />
                    </div >
                  </div >
                </div >
              </TabsContent >

              <TabsContent value="profile" className="space-y-6 outline-none">
                {instructorProfile && <ProfileEditor instructor={instructorProfile} />}
              </TabsContent>

              <TabsContent value="vehicles" className="space-y-6 outline-none">
                < div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  < div className="lg:col-span-2 space-y-6">
                    < div className="flex justify-between items-center">
                      < h2 className="font-bold text-xl text-slate-900 flex items-center gap-2">
                        < Car className="w-6 h-6 text-primary" />
                        Meus Veículos
                      </h2 >
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button className="gap-2 rounded-full">
                            <Plus className="w-4 h-4" /> Cadastrar Veículo
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90dvh] overflow-y-auto w-[90%] rounded-2xl">
                          < DialogHeader >
                            <DialogTitle>Cadastrar Novo Veículo</DialogTitle>
                          </DialogHeader >
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Marca</Label>
                              <Input value={vehicleBrand} onChange={e => setVehicleBrand(e.target.value)} placeholder="Ex: Chevrolet" className="bg-gray-50 border-gray-200" />
                            </div>
                            <div className="space-y-2">
                              <Label>Modelo</Label>
                              <Input value={vehicleModel} onChange={e => setVehicleModel(e.target.value)} placeholder="Ex: Onix" className="bg-gray-50 border-gray-200" />
                            </div>
                            <div className="space-y-2">
                              <Label>Ano</Label>
                              <Input type="number" value={vehicleYear} onChange={e => setVehicleYear(Number(e.target.value))} className="bg-gray-50 border-gray-200" />
                            </div>
                            <div className="space-y-2">
                              <Label>Placa</Label>
                              <Input value={vehiclePlate} onChange={e => setVehiclePlate(e.target.value.toUpperCase())} placeholder="ABC-1234" className="bg-gray-50 border-gray-200" />
                            </div>
                            <div className="space-y-2 sm:col-span-2">
                              <Label>Categoria</Label>
                              <select
                                value={vehicleCategory}
                                onChange={(e) => setVehicleCategory(e.target.value)}
                                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                              >
                                <option value="Carro">Carro (Categoria B)</option>
                                <option value="Moto">Moto (Categoria A)</option>
                                <option value="Ônibus">Ônibus (Categoria D)</option>
                                <option value="Caminhão">Caminhão (Categoria C)</option>
                              </select>
                            </div>
                          </div>

                          <div className="space-y-4 mt-6">
                            <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                              <Upload className="w-4 h-4 text-primary" /> Documentação Obrigatória
                            </h4>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="relative border-2 border-dashed border-slate-200 rounded-xl p-4 text-center cursor-pointer hover:bg-slate-50 transition-colors group">
                                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileChange(e, setPhotoFront)} />
                                {photoFront ? (
                                  <img src={photoFront} alt="Frente" className="w-full h-20 object-cover rounded-lg mb-2" />
                                ) : (
                                  <Car className="w-8 h-8 text-slate-300 mx-auto mb-2 group-hover:text-primary transition-colors" />
                                )}
                                <p className="text-sm font-medium text-slate-700">Foto Frente</p>
                                <p className="text-[10px] text-slate-400">Visível "AUTO-ESCOLA"</p>
                              </div>

                              <div className="relative border-2 border-dashed border-slate-200 rounded-xl p-4 text-center cursor-pointer hover:bg-slate-50 transition-colors group">
                                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileChange(e, setPhotoSide)} />
                                {photoSide ? (
                                  <img src={photoSide} alt="Lateral" className="w-full h-20 object-cover rounded-lg mb-2" />
                                ) : (
                                  <Car className="w-8 h-8 text-slate-300 mx-auto mb-2 group-hover:text-primary transition-colors" />
                                )}
                                <p className="text-sm font-medium text-slate-700">Foto Lateral</p>
                                <p className="text-[10px] text-slate-400">Visível "AUTO-ESCOLA"</p>
                              </div>

                              <div className="relative border-2 border-dashed border-slate-200 rounded-xl p-4 text-center cursor-pointer hover:bg-slate-50 transition-colors group">
                                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileChange(e, setPhotoBack)} />
                                {photoBack ? (
                                  <img src={photoBack} alt="Traseira" className="w-full h-20 object-cover rounded-lg mb-2" />
                                ) : (
                                  <Car className="w-8 h-8 text-slate-300 mx-auto mb-2 group-hover:text-primary transition-colors" />
                                )}
                                <p className="text-sm font-medium text-slate-700">Foto Traseira</p>
                              </div>

                              <div className="relative border-2 border-dashed border-slate-200 rounded-xl p-4 text-center cursor-pointer hover:bg-slate-50 transition-colors group">
                                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileChange(e, setPhotoInterior)} />
                                {photoInterior ? (
                                  <img src={photoInterior} alt="Interior" className="w-full h-20 object-cover rounded-lg mb-2" />
                                ) : (
                                  <Car className="w-8 h-8 text-slate-300 mx-auto mb-2 group-hover:text-primary transition-colors" />
                                )}
                                <p className="text-sm font-medium text-slate-700">Foto Interior</p>
                                <p className="text-[10px] text-slate-400">Pedais (se houver)</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mt-2">
                              <div className="relative border-2 border-dashed border-slate-200 rounded-xl p-4 text-center cursor-pointer hover:bg-slate-50 transition-colors group">
                                <input type="file" accept="image/*,.pdf" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileChange(e, setDocumentCrlv)} />
                                {documentCrlv ? (
                                  <div className="w-full h-8 mb-2 flex items-center justify-center bg-green-100 rounded text-green-700 font-bold text-xs">Arquivo Selecionado</div>
                                ) : (
                                  <div className="w-8 h-8 bg-slate-100 rounded-lg mx-auto mb-2 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                    <span className="font-bold text-xs text-slate-500 group-hover:text-primary">CRLV</span>
                                  </div>
                                )}
                                <p className="text-xs font-medium text-slate-700">Documento Regular</p>
                              </div>

                              <div className="relative border-2 border-dashed border-slate-200 rounded-xl p-4 text-center cursor-pointer hover:bg-slate-50 transition-colors group">
                                <input type="file" accept="image/*,.pdf" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileChange(e, setDocumentLav)} />
                                {documentLav ? (
                                  <div className="w-full h-8 mb-2 flex items-center justify-center bg-green-100 rounded text-green-700 font-bold text-xs">Arquivo Selecionado</div>
                                ) : (
                                  <div className="w-8 h-8 bg-slate-100 rounded-lg mx-auto mb-2 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                    <span className="font-bold text-xs text-slate-500 group-hover:text-primary">LAV</span>
                                  </div>
                                )}
                                <p className="text-xs font-medium text-slate-700">Licença Aprendizagem</p>
                              </div>
                            </div>
                          </div>

                          <div className="bg-amber-50 p-4 rounded-lg border border-amber-100 mt-4">
                            < h4 className="font-bold text-amber-800 text-sm flex items-center gap-2 mb-2">
                              < Shield className="w-4 h-4" /> Regras de Cadastro
                            </h4 >
                            <ul className="text-xs text-amber-700 space-y-1 list-disc pl-4">
                              < li > Veículo deve estar em seu nome ou com autorização formal.</li >
                              <li>Documentação (CRLV) e Licença de Aprendizagem (LAV) em dia.</li>
                              <li>Manutenção regular e itens de segurança (CTB) funcionando.</li>
                              <li>Idade máxima: Carros (12 anos), Motos (8 anos), Carga (20 anos).</li>
                              <li>Identificação visual "AUTO-ESCOLA" obrigatória durante as aulas.</li>
                            </ul >
                          </div >

                          <DialogFooter>
                            <Button
                              onClick={() => createVehicle.mutate()}
                              disabled={createVehicle.isPending || !vehicleModel || !vehiclePlate}
                              className="w-full"
                            >
                              {createVehicle.isPending ? "Enviando..." : "Enviar para Análise"}
                            </Button>
                          </DialogFooter >
                        </DialogContent >
                      </Dialog >
                    </div >

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {
                        vehicles.length === 0 ? (
                          <Card className="border-dashed border-2 bg-slate-50 col-span-2">
                            < CardContent className="p-8 text-center text-slate-500">
                              Nenhum veículo cadastrado.
                            </CardContent >
                          </Card >
                        ) : (
                          vehicles.map(v => (
                            <Card key={v.id} className="overflow-hidden border-none shadow-sm">
                              < CardContent className="p-0 flex h-32">
                                < div className="w-32 bg-slate-100 flex items-center justify-center">
                                  < Car className="w-10 h-10 text-slate-300" />
                                </div >
                                <div className="flex-1 p-4 flex flex-col justify-between">
                                  < div >
                                    <div className="flex justify-between items-start">
                                      < h4 className="font-bold text-slate-900">{v.brand} {v.model}</h4>
                                      < span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${v.status === 'approved' ? 'bg-green-100 text-green-700' :
                                        v.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                                        }`}>
                                        {v.status === 'approved' ? 'Aprovado' : v.status === 'rejected' ? 'Rejeitado' : 'Em Análise'}
                                      </span >
                                    </div >
                                    <p className="text-xs text-slate-500">{v.plate} • {v.year} • {v.category}</p>
                                  </div >
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-red-500 hover:text-red-700 p-0 w-fit gap-1"
                                    onClick={() => deleteVehicle.mutate(v.id)}
                                  >
                                    <Trash2 className="w-3 h-3" /> Remover
                                  </Button >
                                </div >
                              </CardContent >
                            </Card >
                          ))
                        )}
                    </div >
                  </div >

                  <div className="space-y-6">
                    < Card className="border-none shadow-sm bg-primary/5">
                      < CardHeader className="pb-2">
                        < CardTitle className="text-base font-bold flex items-center gap-2">
                          < HelpCircle className="w-4 h-4 text-primary" /> FAQ do Instrutor
                        </CardTitle >
                      </CardHeader >
                      <CardContent className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
                        < div className="space-y-1">
                          < p className="font-bold text-slate-800 dark:text-slate-100">Preciso de pedal duplo?</p>
                          < p className="text-xs">Segundo a Resolução 1.020/2025, o duplo comando é dispensado para veículos particulares autorizados, bastando cumprir os requisitos de segurança do CTB.</p>
                        </div >
                        <div className="space-y-1">
                          < p className="font-bold text-slate-800 dark:text-slate-100">Posso usar carro automático?</p>
                          < p className="text-xs">Sim, a nova regulamentação permite o ensino em veículos convencionais, inclusive automáticos.</p>
                        </div >
                        <div className="space-y-1">
                          < p className="font-bold text-slate-800 dark:text-slate-100">E a identificação?</p>
                          < p className="text-xs">É obrigatória a faixa amarela ou branca (removível) de 20cm com o escrito "AUTO-ESCOLA" nas laterais.</p>
                        </div >
                      </CardContent >
                    </Card >
                  </div >
                </div >
              </TabsContent >

              <TabsContent value="support" className="space-y-6 outline-none">
                < div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  < Card className="border-none shadow-sm">
                    < CardHeader >
                      <CardTitle className="flex items-center gap-2">
                        < MessageSquare className="w-5 h-5 text-primary" />
                        Suporte e Sugestões
                      </CardTitle >
                    </CardHeader >
                    <CardContent className="space-y-4">
                      < div className="space-y-2">
                        < Label > Tipo</Label >
                        <select
                          value={supportType}
                          onChange={e => setSupportType(e.target.value)}
                          className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
                        >
                          <option value="support">Suporte Técnico</option>
                          < option value="suggestion">Sugestão de Melhoria</option>
                          < option value="bug">Relatar um Erro (Bug)</option>
                        </select >
                      </div >
                      <div className="space-y-2">
                        < Label > Assunto</Label >
                        <Input value={supportSubject} onChange={e => setSupportSubject(e.target.value)} placeholder="Sobre o que você quer falar?" />
                      </div >
                      <div className="space-y-2">
                        < Label > Mensagem</Label >
                        <textarea
                          value={supportMessage}
                          onChange={e => setSupportMessage(e.target.value)}
                          className="w-full min-h-[120px] rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                          placeholder="Descreva detalhadamente sua sugestão ou problema..."
                        />
                      </div >
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">Anexar Evidência <span className="text-[10px] text-slate-400">(Opcional)</span></Label>
                        <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center cursor-pointer hover:bg-slate-50 transition-colors group">
                          <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2 group-hover:text-primary transition-colors" />
                          <p className="text-sm font-medium text-slate-700">Clique para enviar</p>
                          <p className="text-xs text-slate-500">Suporta JPG, PNG ou PDF (Max 5MB)</p>
                        </div>
                      </div>
                      <Button
                        onClick={() => submitSupport.mutate()}
                        disabled={submitSupport.isPending || !supportSubject || !supportMessage}
                        className="w-full"
                      >
                        {
                          submitSupport.isPending ? "Enviando..." : "Enviar Mensagem"}
                      </Button>
                    </CardContent >
                  </Card >

                  <div className="space-y-6">
                    < Card className="border-none shadow-sm">
                      < CardHeader >
                        <CardTitle className="text-base font-bold">Canais Oficiais</CardTitle>
                      </CardHeader >
                      <CardContent className="space-y-4">
                        < div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-100">
                          < div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white">
                            < svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                          </div >
                          <div>
                            <p className="text-sm font-bold text-green-800">WhatsApp Suporte</p>
                            <p className="text-xs text-green-700">(11) 99999-9999</p>
                          </div >
                        </div >
                        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                          < div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white">
                            < svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                          </div >
                          <div>
                            <p className="text-sm font-bold text-blue-800">E-mail</p>
                            <p className="text-xs text-blue-700">suporte@habilitfy.com.br</p>
                          </div >
                        </div >
                      </CardContent >
                    </Card >
                  </div >
                </div >
              </TabsContent >
            </Tabs >
          )}
        </div >
      </div >
    </AuthGuard >
  );
}
