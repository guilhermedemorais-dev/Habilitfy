import { useLocation, useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  Star,
  ShieldCheck,
  MapPin,
  Calendar as CalendarIcon,
  Share2,
  Clock,
  BadgeCheck,
  GraduationCap,
  BookOpen
} from "lucide-react";
import Calendar from "react-calendar";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import type { Availability, Instructor, Review } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { buildAvailableTimes } from "@/lib/availability";
import { InstructorProfileTabs } from "@/components/instructor/InstructorProfileTabs";
import { InstructorGuarantees } from "@/components/instructor/InstructorGuarantees";

type InstructorWithUser = Instructor & {
  user?: {
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
  };
};

export default function InstructorProfile() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [date, setDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const { data: instructor, isLoading } = useQuery<InstructorWithUser>({
    queryKey: ["/api/instructors", id],
    enabled: !!id,
  });
  const { data: availability = [] } = useQuery<Availability[]>({
    queryKey: ["/api/instructors", id, "availability"],
    enabled: !!id,
  });

  const { data: instructorReviews = [] } = useQuery<Review[]>({
    queryKey: ["/api/instructors", id, "reviews"],
    enabled: !!id,
  });

  const slotDuration = instructor?.slotDurationMinutes || 50;
  const canBook = instructor?.status === "approved";
  const availableTimes = useMemo(() => {
    if (!instructor) return [];
    return buildAvailableTimes(availability, date, slotDuration);
  }, [availability, date, slotDuration, instructor]);

  const instructorName = instructor?.user?.firstName
    ? `${instructor.user.firstName} ${instructor.user.lastName || ""}`.trim()
    : instructor?.neighborhood || "Instrutor";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600">Carregando instrutor...</p>
        </div>
      </div>
    );
  }

  if (!instructor) return <div className="p-6">Instrutor não encontrado</div>;

  return (
    <div className="bg-background min-h-screen pb-32">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="flex items-center justify-between px-4 py-3">
          <Button
            size="icon"
            variant="ghost"
            className="text-slate-700 hover:bg-gray-100 rounded-full"
            asChild
          >
            <Link href="/mapa">
              <ChevronLeft className="w-6 h-6" />
            </Link>
          </Button>
          <span className="font-semibold text-slate-800">Perfil do Instrutor</span>
          <Button size="icon" variant="ghost" className="text-slate-700 hover:bg-gray-100 rounded-full">
            <Share2 className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Profile Header - Igual ao concorrente */}
      <div className="px-6 py-6 bg-white border-b border-gray-100">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="relative">
            <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-primary shadow-lg">
              {instructor.user?.profileImageUrl ? (
                <img
                  src={instructor.user.profileImageUrl}
                  alt={instructorName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary to-green-400 flex items-center justify-center text-white text-2xl font-bold">
                  {instructorName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            {instructor.status === "approved" && (
              <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1">
                <BadgeCheck className="w-4 h-4 text-white" />
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex-1">
            <div className="flex items-center gap-4 text-center">
              <div className="flex-1">
                <p className="text-lg font-bold text-slate-800">{instructor.lessonsCompleted || 0}</p>
                <p className="text-xs text-slate-400">Aulas</p>
              </div>
              <div className="w-px h-8 bg-gray-200" />
              <div className="flex-1">
                <p className="text-lg font-bold text-slate-800 flex items-center justify-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  {instructor.rating || "0.0"}
                </p>
                <p className="text-xs text-slate-400">{instructor.reviewsCount || 0} avaliações</p>
              </div>
              <div className="w-px h-8 bg-gray-200" />
              <div className="flex-1">
                <p className="text-lg font-bold text-slate-800">{instructor.yearsExperience || 0} anos</p>
                <p className="text-xs text-slate-400">Experiência</p>
              </div>
            </div>
          </div>
        </div>

        {/* Name + Location + Badge */}
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-slate-900">{instructorName}</h1>
            {instructor.status === "approved" && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                <BadgeCheck className="w-3 h-3" /> Verificado
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> {instructor.city || instructor.neighborhood}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Aulas de {slotDuration}min
            </span>
          </div>
        </div>

        {/* Bio */}
        <p className="mt-3 text-sm text-slate-600 leading-relaxed">
          {instructor.bio || "Instrutor cadastrado na plataforma HabilitFy."}
        </p>

        {/* Response Time Badge */}
        {instructor.responseTime && (
          <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-green-700 bg-green-50 px-3 py-1.5 rounded-full border border-green-200">
            <Clock className="w-3.5 h-3.5" />
            Responde em {instructor.responseTime}
          </div>
        )}
      </div>

      {/* CTA + Price */}
      <div className="px-6 py-4 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between">
          <Button
            size="lg"
            className="flex-1 h-12 rounded-xl bg-primary hover:bg-green-700 text-white font-bold shadow-lg shadow-green-200"
            disabled={!canBook}
            onClick={() => {
              if (!canBook) return;
              const target = `/agendar/${instructor.id}`;
              if (!user) {
                setLocation(`/login?redirect=${encodeURIComponent(target)}`);
                return;
              }
              setLocation(target);
            }}
          >
            <CalendarIcon className="w-5 h-5 mr-2" />
            Agendar Aula
          </Button>
          <div className="ml-4 text-right">
            <p className="text-xs text-slate-400">A partir de</p>
            <p className="text-xl font-bold text-primary">R$ {instructor.pricePerHour}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 py-6 space-y-8">
        {/* Tabs */}
        <InstructorProfileTabs instructor={instructor} reviews={instructorReviews} />

        {/* Garantias */}
        <InstructorGuarantees />

        {/* Calendar Section */}
        <div>
          <h2 className="font-bold text-lg mb-4 text-slate-900 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-primary" />
            Disponibilidade
          </h2>
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <Calendar
              onChange={(val) => {
                const nextDate = val as Date;
                setDate(nextDate);
                setSelectedTime(null);
              }}
              value={date}
              locale="pt-BR"
              minDate={new Date()}
              className="w-full bg-transparent"
              tileClassName={({ date: d, view }) => {
                if (view === 'month' && d.getDay() === 0) return 'opacity-25 pointer-events-none';
                return null;
              }}
            />
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm font-bold mb-2 text-slate-700">
                Horários em {format(date, "dd 'de' MMMM", { locale: ptBR })}:
              </p>
              {availableTimes.length === 0 ? (
                <p className="text-xs text-slate-500">Nenhum horário disponível para esta data.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {availableTimes.map((time) => {
                    const isSelected = selectedTime === time;
                    return (
                      <Button
                        key={time}
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        className={
                          isSelected
                            ? "rounded-full bg-green-600 text-white hover:bg-green-700"
                            : "rounded-full border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300"
                        }
                        onClick={() => setSelectedTime(time)}
                      >
                        {time}
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
