import { useLocation, useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Star, ShieldCheck, MapPin, Calendar as CalendarIcon, Share2 } from "lucide-react";
import Calendar from "react-calendar";
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import type { Instructor, Review } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";

export default function InstructorProfile() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [date, setDate] = useState<Date>(new Date());

  const { data: instructor, isLoading } = useQuery<Instructor & { name?: string }>({
    queryKey: ["/api/instructors", id],
    enabled: !!id,
  });

  const { data: instructorReviews = [] } = useQuery<Review[]>({
    queryKey: ["/api/instructors", id, "reviews"],
    enabled: !!id,
  });

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
    <div className="bg-background min-h-screen pb-24">
      {/* Hero Image */}
      <div className="relative h-72 w-full">
        {instructor.vehicleImageUrl ? (
          <img src={instructor.vehicleImageUrl} className="w-full h-full object-cover" alt={instructor.vehicleModel} />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-green-100 to-yellow-100 flex items-center justify-center text-5xl">🚗</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        <div className="absolute top-4 left-4 z-10">
          <Button
            size="icon"
            variant="ghost"
            className="text-white hover:bg-white/20 rounded-full"
            asChild
          >
            <Link href="/instrutores">
              <ChevronLeft className="w-6 h-6" />
            </Link>
          </Button>
        </div>
         <div className="absolute top-4 right-4 z-10">
            <Button size="icon" variant="ghost" className="text-white hover:bg-white/20 rounded-full">
              <Share2 className="w-5 h-5" />
            </Button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 w-fit">
              <ShieldCheck className="w-3 h-3" /> CREDENCIADO DETRAN
            </span>
            <span className="bg-yellow-400 text-black text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 w-fit">
              {instructor.rating ?? "5.0"} ★ ({instructor.reviewsCount ?? 0} aulas)
            </span>
          </div>
          <h1 className="text-3xl font-bold mb-1">
            {instructor.name || instructor.neighborhood || "Instrutor"}
          </h1>
          <p className="text-white/80 flex items-center gap-1 text-sm">
            <MapPin className="w-3 h-3" /> {instructor.neighborhood}
          </p>
        </div>
      </div>

      <div className="px-6 py-6 -mt-6 bg-white rounded-t-3xl relative z-20">
        
        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Veículo</p>
                <p className="font-semibold text-slate-800 text-sm">{instructor.vehicleModel}</p>
                <p className="text-xs text-slate-500">{instructor.vehicleType}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Preço/Aula</p>
                <p className="font-semibold text-primary text-xl">R$ {instructor.pricePerHour}</p>
                <p className="text-xs text-slate-500">50 minutos</p>
            </div>
        </div>

        {/* Bio */}
        <div className="mb-8">
            <h2 className="font-bold text-lg mb-2 text-slate-900">Sobre o Instrutor</h2>
            <p className="text-slate-600 text-sm leading-relaxed">{instructor.bio || "Instrutor cadastrado na plataforma."}</p>
        </div>

        {/* Calendar */}
        <div className="mb-8">
            <h2 className="font-bold text-lg mb-4 text-slate-900 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-primary" />
                Disponibilidade
            </h2>
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                 <Calendar 
                    onChange={(val) => setDate(val as Date)} 
                    value={date}
                    locale="pt-BR"
                    minDate={new Date()}
                    className="w-full bg-transparent"
                    tileClassName={({ date, view }) => {
                        // Randomly disable some dates for mock effect
                        if (view === 'month' && date.getDay() === 0) return 'opacity-25 pointer-events-none';
                        return null;
                    }}
                 />
                 <div className="mt-4 pt-4 border-t border-gray-200">
                     <p className="text-sm font-bold mb-2 text-slate-700">Horários Livres em {format(date, "dd 'de' MMMM", { locale: ptBR })}:</p>
                     <div className="flex flex-wrap gap-2">
                         {["08:00", "10:00", "14:00", "16:30"].map(time => (
                             <Button key={time} variant="outline" size="sm" className="rounded-full border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300">
                                 {time}
                             </Button>
                         ))}
                     </div>
                 </div>
            </div>
        </div>

        {/* Reviews */}
        <div className="mb-8">
            <h2 className="font-bold text-lg mb-4 text-slate-900 flex items-center gap-2">
                Avaliações Recentes
            </h2>
            <div className="space-y-4">
                {instructorReviews.length === 0 && <p className="text-sm text-slate-500">Ainda não há avaliações.</p>}
                {instructorReviews.map(review => (
                    <div key={review.id} className="border-b border-gray-100 pb-4 last:border-0">
                        <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-sm text-slate-800">Aluno</span>
                            <span className="text-xs text-slate-400">{review.createdAt ? format(new Date(review.createdAt), "dd/MM", { locale: ptBR }) : ""}</span>
                        </div>
                        <div className="flex text-yellow-400 mb-1">
                            {[...Array(review.rating)].map((_, i) => <Star key={i} className="w-3 h-3 fill-current" />)}
                        </div>
                        <p className="text-sm text-slate-600">{review.comment || "Avaliação enviada."}</p>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 z-50 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between mb-2 px-1">
            <div className="text-xs text-slate-500">Total para 1 aula</div>
            <div className="font-bold text-lg text-slate-900">R$ {instructor.pricePerHour},00</div>
        </div>
        <Button
          size="lg"
          className="w-full bg-primary hover:bg-green-700 text-white rounded-xl h-12 font-bold shadow-lg shadow-green-200"
          onClick={() => {
            const target = `/agendar/${instructor.id}`;
            if (!user) {
              setLocation(`/login?redirect=${encodeURIComponent(target)}`);
              return;
            }
            setLocation(target);
          }}
        >
          Agendar Horário
        </Button>
      </div>
    </div>
  );
}
