import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ResponsiveContainer, LineChart, Line, XAxis, Tooltip } from "recharts";
import { Calendar as CalendarIcon, Users, User, AlertCircle, Moon, Sun } from "lucide-react";
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
  const [isDark, setIsDark] = useState(false);

  const { data: bookings, isLoading, error } = useInstructorBookings(
    instructorProfile?.id
  );
  const queryClient = useQueryClient();
  const { data: availability = [] } = useQuery<Availability[]>({
    queryKey: ["/api/instructors", instructorProfile?.id, "availability"],
    enabled: !!instructorProfile?.id,
  });
  useEffect(() => {
    if (!instructorProfile) return;
    setSlotDurationMinutes(instructorProfile.slotDurationMinutes ?? 50);
    setMaxBookingsPerStudent(instructorProfile.maxBookingsPerStudent ?? 0);
    setPricePerHour(String(instructorProfile.pricePerHour ?? "0"));
    setServiceAreas(instructorProfile.serviceAreas ?? "");
    setPixKey(instructorProfile.pixKey ?? "");
  }, [
    instructorProfile?.slotDurationMinutes,
    instructorProfile?.maxBookingsPerStudent,
    instructorProfile?.pricePerHour,
    instructorProfile?.serviceAreas,
    instructorProfile?.pixKey,
  ]);
  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

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
      const res = await apiRequest("PATCH", `/api/instructors/${instructorProfile.id}`, {
        slotDurationMinutes,
        maxBookingsPerStudent,
        pricePerHour,
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
      <div className="min-h-screen bg-background pb-24">
        <header className="bg-white p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-slate-400">Olá</p>
              <h1 className="text-2xl font-bold text-slate-900 leading-tight">
                {instructorName}
              </h1>
            </div>
            <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden">
              {user?.profileImageUrl ? (
                <img
                  src={user.profileImageUrl}
                  alt={instructorName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/10">
                  <User className="w-5 h-5 text-primary" />
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              className="h-10 w-10 rounded-full bg-gray-100 text-slate-600 hover:bg-gray-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
              title={isDark ? "Modo claro" : "Modo escuro"}
            >
              {isDark ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full bg-gray-100 text-slate-600 hover:bg-gray-200 ml-4"
              asChild
            >
              <Link href="/chat">
                <div className="relative">
                  <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                </div>
              </Link>
            </Button>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {!isKycApproved ? (
            <KYCPendingBlock status={user?.kycStatus} />
          ) : (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <WalletCard />                <Card className="border-none shadow-sm">
                  <CardContent className="p-4">
                    <p className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-1">
                      Aulas Hoje
                    </p>
                    <h3 className="text-2xl font-bold text-slate-900">
                      {todayLessons.length}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {bookings?.filter((b) => b.status === "pending").length || 0}{" "}
                      pendentes
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Chart */}
              <Card className="border-none shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-bold">
                    Ganhos da Semana
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weekData}>
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
                        dot={{ r: 4, fill: "#228B22" }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Transaction History */}
              <div className="mt-6 mb-6">
                <TransactionHistory />
              </div>

              {/* Calendar & Schedule */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <Card className="border-none shadow-sm mb-6">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-bold">Configuracao da agenda</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="slotDurationMinutes">Duracao de cada aula (min)</Label>
                        <Input
                          id="slotDurationMinutes"
                          type="number"
                          min={10}
                          value={slotDurationMinutes}
                          onChange={(e) => {
                            const value = Number(e.target.value);
                            setSlotDurationMinutes(Number.isFinite(value) ? value : 0);
                          }}
                          className="bg-gray-50 border-gray-200"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="maxBookingsPerStudent">Limite de aulas por aluno</Label>
                        <Input
                          id="maxBookingsPerStudent"
                          type="number"
                          min={0}
                          value={maxBookingsPerStudent}
                          onChange={(e) => {
                            const value = Number(e.target.value);
                            setMaxBookingsPerStudent(Number.isFinite(value) ? value : 0);
                          }}
                          className="bg-gray-50 border-gray-200"
                        />
                        <p className="text-xs text-slate-500">Use 0 para deixar sem limite.</p>
                      </div>
                      <Button
                        onClick={() => updateScheduleSettings.mutate()}
                        disabled={updateScheduleSettings.isPending}
                        className="w-full bg-primary hover:bg-green-700"
                      >
                        {updateScheduleSettings.isPending ? "Salvando..." : "Salvar configuracoes"}
                      </Button>
                    </CardContent>
                  </Card>
                  <Card className="border-none shadow-sm mb-6">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-bold">Servicos e precos</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="pricePerHour">Preco por aula (min)</Label>
                        <Input
                          id="pricePerHour"
                          value={pricePerHour}
                          onChange={(e) => setPricePerHour(e.target.value)}
                          className="bg-gray-50 border-gray-200"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="serviceAreas">Bairros de atendimento</Label>
                        <Input
                          id="serviceAreas"
                          value={serviceAreas}
                          onChange={(e) => setServiceAreas(e.target.value)}
                          placeholder="Ex: Copacabana, Botafogo, Centro"
                          className="bg-gray-50 border-gray-200"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pixKey">Chave Pix</Label>
                        <Input
                          id="pixKey"
                          value={pixKey}
                          onChange={(e) => setPixKey(e.target.value)}
                          placeholder="CPF, Email ou Aleatoria"
                          className="bg-gray-50 border-gray-200"
                        />
                      </div>
                      <Button
                        onClick={() => updateScheduleSettings.mutate()}
                        disabled={updateScheduleSettings.isPending}
                        className="w-full bg-primary hover:bg-green-700"
                      >
                        {updateScheduleSettings.isPending ? "Salvando..." : "Salvar servicos"}
                      </Button>
                    </CardContent>
                  </Card>
                  <Card className="border-none shadow-sm mb-6">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-bold">Disponibilidade</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="availabilityDay">Dia da semana</Label>
                        <select
                          id="availabilityDay"
                          value={availabilityDay}
                          onChange={(e) => setAvailabilityDay(Number(e.target.value))}
                          className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
                        >
                          {dayLabels.map((label, index) => (
                            <option key={label} value={index}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="availabilityStart">Inicio</Label>
                          <Input
                            id="availabilityStart"
                            type="time"
                            value={availabilityStart}
                            onChange={(e) => setAvailabilityStart(e.target.value)}
                            className="bg-gray-50 border-gray-200"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="availabilityEnd">Fim</Label>
                          <Input
                            id="availabilityEnd"
                            type="time"
                            value={availabilityEnd}
                            onChange={(e) => setAvailabilityEnd(e.target.value)}
                            className="bg-gray-50 border-gray-200"
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          onClick={() => saveAvailability.mutate()}
                          disabled={saveAvailability.isPending}
                          className="w-full bg-primary hover:bg-green-700"
                        >
                          {saveAvailability.isPending
                            ? "Salvando..."
                            : editingSlotId
                              ? "Atualizar horario"
                              : "Adicionar horario"}
                        </Button>
                        {editingSlotId && (
                          <Button
                            variant="ghost"
                            onClick={() => {
                              setEditingSlotId(null);
                              setAvailabilityDay(1);
                              setAvailabilityStart("08:00");
                              setAvailabilityEnd("18:00");
                            }}
                          >
                            Cancelar edicao
                          </Button>
                        )}
                      </div>
                      <div className="space-y-2">
                        {availability.length === 0 ? (
                          <p className="text-xs text-slate-500">
                            Nenhum horario configurado ainda.
                          </p>
                        ) : (
                          availability.map((slot) => (
                            <div
                              key={slot.id}
                              className="flex items-center justify-between rounded-lg border border-gray-100 bg-white px-3 py-2 text-sm"
                            >
                              <span className="font-medium text-slate-700">
                                {dayLabels[slot.dayOfWeek]} • {slot.startTime} - {slot.endTime}
                              </span>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setEditingSlotId(slot.id);
                                    setAvailabilityDay(slot.dayOfWeek);
                                    setAvailabilityStart(slot.startTime);
                                    setAvailabilityEnd(slot.endTime);
                                  }}
                                >
                                  Editar
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteAvailability.mutate(slot.id)}
                                >
                                  Remover
                                </Button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-primary" />
                    Agenda
                  </h2>
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                    <Calendar
                      onChange={(val) => setDate(val as Date)}
                      value={date}
                      locale="pt-BR"
                    />
                  </div>
                </div>

                <div>
                  <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    Alunos de Hoje
                  </h2>
                  {todayLessons.length > 0 ? (
                    <div className="space-y-3">
                      {todayLessons.map((lesson) => (
                        (() => {
                          const timer = getTimer(lesson);
                          const startCodeValue = startCodes[lesson.id] ?? "";
                          const endCodeValue = endCodes[lesson.id] ?? "";
                          return (
                            <div
                              key={lesson.id}
                              className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-primary flex justify-between items-center hover:shadow-md transition-shadow"
                            >
                              <div className="flex-1">
                                <p className="font-bold text-slate-800">
                                  {lesson.student?.name || "Aluno"}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {format(new Date(lesson.date), "HH:mm", {
                                    locale: ptBR,
                                  })}{" "}
                                  • {lesson.duration} min
                                </p>
                                <p className="text-xs text-slate-500 mt-1">
                                  Ponto: {lesson.meetingAddress || "A combinar via chat"}
                                </p>
                                {timer && (
                                  <p className="text-xs text-slate-500 mt-1">
                                    Tempo: {timer.elapsedMinutes} min • Restante: {timer.remainingMinutes} min
                                  </p>
                                )}
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                {lesson.status !== "completed" && !lesson.startedAt && (
                                  <>
                                    <Input
                                      value={startCodeValue}
                                      onChange={(e) =>
                                        setStartCodes((prev) => ({
                                          ...prev,
                                          [lesson.id]: e.target.value,
                                        }))
                                      }
                                      placeholder="Codigo de inicio"
                                      className="h-8 w-36 text-xs"
                                    />
                                    <Button
                                      size="sm"
                                      className="rounded-full"
                                      onClick={() =>
                                        startLesson.mutate({
                                          bookingId: lesson.id,
                                          code: startCodeValue.trim(),
                                        })
                                      }
                                      disabled={startLesson.isPending || !startCodeValue.trim()}
                                    >
                                      Iniciar aula
                                    </Button>
                                  </>
                                )}
                                {lesson.status !== "completed" && lesson.startedAt && (
                                  <>
                                    <Input
                                      value={endCodeValue}
                                      onChange={(e) =>
                                        setEndCodes((prev) => ({
                                          ...prev,
                                          [lesson.id]: e.target.value,
                                        }))
                                      }
                                      placeholder="Codigo final"
                                      className="h-8 w-36 text-xs"
                                    />
                                    <Button
                                      size="sm"
                                      className="rounded-full"
                                      onClick={() =>
                                        completeLesson.mutate({
                                          bookingId: lesson.id,
                                          code: endCodeValue.trim(),
                                        })
                                      }
                                      disabled={completeLesson.isPending || !endCodeValue.trim()}
                                    >
                                      Concluir aula
                                    </Button>
                                  </>
                                )}
                                {lesson.status === "completed" && (
                                  <span className="text-xs font-semibold text-green-600">
                                    Concluida
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })()
                      ))}
                    </div>
                  ) : (
                    <Card className="border-none shadow-sm">
                      <CardContent className="p-8 text-center">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Users className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className="text-slate-500 text-sm">
                          Nenhuma aula agendada para hoje
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div >
    </AuthGuard >
  );
}
