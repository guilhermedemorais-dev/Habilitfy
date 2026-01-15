import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, LineChart, Line, XAxis, Tooltip } from "recharts";
import { Calendar as CalendarIcon, Users, User, AlertCircle } from "lucide-react";
import Calendar from "react-calendar";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "sonner";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import {
  useInstructorBookings,
  getTodayBookings,
  getWeekEarnings,
  getPendingEarnings,
} from "@/hooks/useInstructorBookings";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function InstructorDashboard() {
  const [date, setDate] = useState<Date>(new Date());
  const { user } = useAuth();
  const instructorProfile = (user as any)?.instructorProfile;
  const instructorName =
    user?.firstName || user?.lastName || user?.email || "Instrutor";

  const { data: bookings, isLoading, error } = useInstructorBookings(
    instructorProfile?.id
  );
  const queryClient = useQueryClient();
  const completeLesson = useMutation({
    mutationFn: async (bookingId: string) => {
      const res = await apiRequest("PATCH", `/api/bookings/${bookingId}`, {
        status: "completed",
      });
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

  const todayLessons = getTodayBookings(bookings);
  const weekData = getWeekEarnings(bookings);
  const pendingEarnings = getPendingEarnings(bookings);

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
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="border-none shadow-sm bg-primary text-white">
              <CardContent className="p-4">
                <p className="text-green-100 text-xs uppercase font-bold tracking-wider mb-1">
                  A Receber
                </p>
                <h3 className="text-2xl font-bold">
                  R$ {pendingEarnings.toFixed(2)}
                </h3>
                <Button
                  size="sm"
                  variant="secondary"
                  className="mt-3 w-full h-7 text-xs bg-white/20 text-white hover:bg-white/30 border-none"
                >
                  Sacar Pix
                </Button>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm">
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

          {/* Calendar & Schedule */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
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
                    <div
                      key={lesson.id}
                      className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-primary flex justify-between items-center hover:shadow-md transition-shadow"
                    >
                      <div>
                        <p className="font-bold text-slate-800">
                          {lesson.student?.name || "Aluno"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {format(new Date(lesson.date), "HH:mm", {
                            locale: ptBR,
                          })}{" "}
                          • {lesson.duration} min
                        </p>
                      </div>
                      {lesson.status !== "completed" && (
                        <Button
                          size="sm"
                          className="rounded-full"
                          onClick={() => completeLesson.mutate(lesson.id)}
                          disabled={completeLesson.isPending}
                        >
                          Concluir aula
                        </Button>
                      )}
                    </div>
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
        </div>
      </div >
    </AuthGuard >
  );
}
