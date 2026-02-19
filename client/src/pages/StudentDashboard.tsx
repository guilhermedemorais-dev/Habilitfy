import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Clock,
  CheckCircle2,
  User,
  Calendar,
  AlertCircle,
  LogOut,
} from "lucide-react";
import { Link } from "wouter";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/hooks/useAuth";
import {
  useStudentBookings,
  getUpcomingBooking,
  getRecentBookings,
} from "@/hooks/useStudentBookings";
import { ReviewDialog } from "@/components/reviews/ReviewDialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useEffect, useState } from "react";
import { PwaInstallBanner } from "@/components/pwa/PwaInstallBanner";
import { QRCodeSVG } from "qrcode.react";
import { KYCPendingBlock } from "@/components/dashboard/KYCPendingBlock";

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const { data: bookings, isLoading, error } = useStudentBookings();
  const [reviewOpen, setReviewOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<{
    id: string;
    instructorId: string;
    instructorName: string;
  } | null>(null);
  const [now, setNow] = useState<Date>(new Date());

  const isKycApproved = user?.kycStatus === "approved";

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const studentName =
    user?.firstName || user?.lastName || user?.email || "Aluno";

  const handleReviewClick = (lesson: any) => {
    setSelectedBooking({
      id: lesson.id,
      instructorId: lesson.instructorId,
      instructorName: lesson.instructor?.name || "Instrutor",
    });
    setReviewOpen(true);
  };

  const getTimer = (lesson: any) => {
    if (!lesson?.startedAt) return null;
    const start = new Date(lesson.startedAt);
    const elapsedMinutes = Math.max(
      0,
      Math.floor((now.getTime() - start.getTime()) / 60000),
    );
    const duration = lesson.duration || 0;
    const remainingMinutes = Math.max(duration - elapsedMinutes, 0);
    return { elapsedMinutes, remainingMinutes };
  };

  const upcomingLesson = getUpcomingBooking(bookings);
  const recentLessons = getRecentBookings(bookings, 3);
  const upcomingTimer = upcomingLesson ? getTimer(upcomingLesson) : null;
  const completedCount =
    bookings?.filter((b) => b.status === "completed").length || 0;
  const showPackageSuggestion = completedCount === 1 && recentLessons.length > 0;

  if (isLoading) {
    return (
      <AuthGuard redirectTo="/dashboard/aluno">
        <div className="min-h-screen bg-background pb-24">
          <header className="bg-primary pt-12 pb-24 px-6 rounded-b-[2.5rem] shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white border-2 border-white/30">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-green-100 text-sm">Bem-vindo,</p>
                  <div className="h-6 w-32 bg-white/20 rounded animate-pulse" />
                </div>
              </div>
              <div className="text-right">
                <p className="text-green-100 text-xs uppercase tracking-wider">
                  Saldo
                </p>
                <div className="h-8 w-24 bg-white/20 rounded animate-pulse mt-1" />
              </div>
            </div>
          </header>

          <div className="px-6 -mt-16 space-y-6">
            <div className="mb-2">
              <h2 className="text-white font-bold mb-3 flex items-center gap-2 text-sm opacity-90">
                <Clock className="w-4 h-4" /> Carregando...
              </h2>
              <Card className="border-none shadow-xl rounded-2xl overflow-hidden">
                <CardContent className="p-5">
                  <div className="animate-pulse space-y-3">
                    <div className="h-14 bg-gray-200 rounded-full" />
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-10 bg-gray-200 rounded" />
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
      <AuthGuard redirectTo="/dashboard/aluno">
        <div className="min-h-screen bg-background pb-24 flex items-center justify-center px-6">
          <Card className="border-none shadow-xl rounded-2xl max-w-md w-full">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="font-bold text-lg mb-2">Erro ao carregar aulas</h3>
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
    <AuthGuard redirectTo="/dashboard/aluno">
      <div className="min-h-screen bg-background pb-24">
        <header className="bg-primary pt-12 pb-24 px-6 rounded-b-[2.5rem] shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white border-2 border-white/30">
                <User className="w-6 h-6" />
              </div>
              <div>
                <p className="text-green-100 text-sm">Bem-vindo,</p>
                <h1 className="text-white text-xl font-bold truncate max-w-[200px]">
                  {studentName}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isKycApproved && (
                <div className="text-right mr-2">
                  <p className="text-green-100 text-xs uppercase tracking-wider">
                    Saldo
                  </p>
                  <p className="text-white text-2xl font-bold">R$ 0,00</p>
                </div>
              )}
              <Button
                variant="secondary"
                size="icon"
                className="rounded-full bg-white/20 hover:bg-white/30 text-white border-0"
                asChild
              >
                <Link href="/chat">
                  <div className="relative">
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-primary" />
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                  </div>
                </Link>
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="rounded-full bg-white/20 hover:bg-white/30 text-white border-0 px-3"
                onClick={logout}
              >
                <LogOut className="w-4 h-4 mr-1" />
                Sair
              </Button>
            </div>
          </div>
        </header>

        <PwaInstallBanner />

        <div className="px-6 -mt-16 space-y-6">
          {!isKycApproved ? (
            <KYCPendingBlock status={user?.kycStatus} />
          ) : (
            <>
              <div className="mb-2">
                <h2 className="text-white font-bold mb-3 flex items-center gap-2 text-sm opacity-90">
                  <Clock className="w-4 h-4" /> Próxima Aula
                </h2>
                {upcomingLesson && upcomingLesson.instructor ? (
                  <Card className="border-none shadow-xl rounded-2xl overflow-hidden hover:shadow-2xl transition-shadow">
                    <CardContent className="p-0">
                      <div className="bg-yellow-400 p-2 text-center text-xs font-bold uppercase tracking-wider text-yellow-900">
                        {format(new Date(upcomingLesson.date), "EEEE • HH:mm", {
                          locale: ptBR,
                        })}
                      </div>
                      <div className="p-5">
                        <div className="flex gap-4 items-center mb-4">
                          {upcomingLesson.instructor.photo ? (
                            <img
                              src={upcomingLesson.instructor.photo}
                              className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm"
                              alt={upcomingLesson.instructor.name}
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center border-2 border-white shadow-sm">
                              <User className="w-7 h-7 text-primary" />
                            </div>
                          )}
                          <div>
                            <h3 className="font-bold text-slate-900 text-lg">
                              {upcomingLesson.instructor.name}
                            </h3>
                            <p className="text-sm text-slate-500">
                              {upcomingLesson.instructor.vehicle}
                            </p>
                          </div>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                          <p className="text-xs uppercase text-slate-400 mb-1">
                            Ponto de encontro
                          </p>
                          <p>{upcomingLesson.meetingAddress || "A combinar via chat"}</p>
                        </div>
                        <div className="space-y-2 mt-4">
                          {upcomingLesson.startCode && !upcomingLesson.startedAt && (
                            <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">
                              <p className="font-semibold">Codigo para iniciar a aula</p>
                              <p className="text-2xl font-bold tracking-widest mt-1">
                                {upcomingLesson.startCode}
                              </p>
                              <p className="text-xs text-green-700 mt-1">
                                Informe este codigo ao instrutor para iniciar o tempo.
                              </p>
                            </div>
                          )}
                          {upcomingLesson.startedAt && (
                            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                              <p className="font-semibold">Tempo da aula</p>
                              <p className="text-sm mt-1">
                                {upcomingTimer
                                  ? `Decorrido: ${upcomingTimer.elapsedMinutes} min • Restante: ${upcomingTimer.remainingMinutes} min`
                                  : "Cronometro em andamento"}
                              </p>
                              {upcomingTimer && upcomingTimer.remainingMinutes <= 0 && upcomingLesson.endCode && (
                                <div className="mt-3 rounded-lg bg-white p-3">
                                  <p className="text-xs text-slate-500">
                                    Codigo para concluir a aula
                                  </p>
                                  <p className="text-lg font-bold tracking-widest">
                                    {upcomingLesson.endCode}
                                  </p>
                                  <div className="mt-2 flex items-center gap-3">
                                    <div className="bg-white p-2 rounded-lg border border-gray-100 shadow-inner">
                                      <QRCodeSVG value={upcomingLesson.endCode} size={80} />
                                    </div>
                                    <p className="text-xs text-slate-500">
                                      O instrutor pode escanear este QR ou digitar o codigo.
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          <Button
                            className="w-full bg-primary hover:bg-green-700 text-white"
                            asChild
                          >
                            <Link href={`/booking/${upcomingLesson.id}/details`}>
                              Ver Detalhes
                            </Link>
                          </Button>
                          <Button
                            variant="outline"
                            className="w-full border-primary text-primary hover:bg-primary/5"
                            asChild
                          >
                            <Link href={`/chat/${upcomingLesson.instructor.userId}`}>
                              Falar com Instrutor
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-none shadow-xl rounded-2xl overflow-hidden">
                    <CardContent className="p-8 text-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Calendar className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="font-bold text-slate-900 mb-2">
                        Nenhuma aula agendada
                      </h3>
                      <p className="text-slate-500 text-sm mb-4">
                        Que tal agendar sua próxima aula?
                      </p>
                      <Button className="bg-primary hover:bg-green-700" asChild>
                        <Link href="/instrutores">Encontrar Instrutor</Link>
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
                <div className="absolute right-0 top-0 opacity-10 transform translate-x-1/3 -translate-y-1/3">
                  <User className="w-40 h-40" />
                </div>
                <h3 className="font-bold text-lg mb-1 relative z-10">
                  Indique um amigo
                </h3>
                <p className="text-blue-100 text-sm mb-3 relative z-10 max-w-[80%]">
                  Ganhe 1 aula grátis para cada amigo que completar a primeira
                  aula.
                </p>
                <Button
                  size="sm"
                  variant="secondary"
                  className="relative z-10 text-blue-700 font-bold bg-white"
                >
                  Copiar Código
                </Button>
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-bold text-slate-900 text-lg">Histórico</h2>
                  <Link
                    href="/historico"
                    className="text-primary text-sm font-medium"
                  >
                    Ver tudo
                  </Link>
                </div>
                {recentLessons.length > 0 ? (
                  <div className="space-y-3">
                    {showPackageSuggestion && (
                      <Card className="border-none shadow-sm bg-blue-50">
                        <CardContent className="p-4">
                          <h3 className="font-bold text-slate-900">
                            Primeira aula avaliativa concluida
                          </h3>
                          <p className="text-sm text-slate-600 mt-1">
                            Recomendamos seguir com um pacote de aulas para evoluir
                            mais rapido. Voce pode continuar agendando normalmente.
                          </p>
                          <Button className="mt-3 bg-primary hover:bg-green-700" asChild>
                            <Link href="/instrutores">Agendar mais aulas</Link>
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                    {recentLessons.map((lesson) => (
                      <div
                        key={lesson.id}
                        className="bg-white p-4 rounded-xl shadow-sm flex items-center justify-between border border-gray-100 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center gap-3">
                          <div className="bg-gray-100 p-2 rounded-full text-gray-500">
                            <CheckCircle2 className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-sm">
                              Aula Prática
                            </p>
                            <p className="text-xs text-slate-400">
                              {format(new Date(lesson.date), "dd MMM", {
                                locale: ptBR,
                              })}{" "}
                              •{" "}
                              {lesson.instructor?.name || "Instrutor"}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            Concluído
                          </span>
                          <Button
                            variant="link"
                            className="h-auto p-0 text-yellow-500 text-xs mt-1"
                            onClick={() => handleReviewClick(lesson)}
                          >
                            Avaliar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Card className="border-none shadow-sm">
                    <CardContent className="p-8 text-center">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <CheckCircle2 className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-slate-500 text-sm">
                        Nenhuma aula concluída ainda
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          )}
        </div>

        {selectedBooking && (
          <ReviewDialog
            open={reviewOpen}
            onOpenChange={setReviewOpen}
            instructorId={selectedBooking.instructorId}
            instructorName={selectedBooking.instructorName}
            bookingId={selectedBooking.id}
          />
        )}
      </div>
    </AuthGuard>
  );
}
