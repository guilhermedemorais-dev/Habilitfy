import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { instructors } from "@/lib/data";
import { Clock, CheckCircle2, ChevronRight, User } from "lucide-react";
import { Link } from "wouter";

export default function StudentDashboard() {
  const upcomingLesson = instructors[0]; // Mock
  
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-primary pt-12 pb-24 px-6 rounded-b-[2.5rem] shadow-lg">
        <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white border-2 border-white/30">
                    <User className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-green-100 text-sm">Bem-vindo,</p>
                    <h1 className="text-white text-xl font-bold">Gabriel</h1>
                </div>
            </div>
            <div className="text-right">
                <p className="text-green-100 text-xs uppercase tracking-wider">Saldo</p>
                <p className="text-white text-2xl font-bold">R$ 0,00</p>
            </div>
        </div>
      </header>

      <div className="px-6 -mt-16 space-y-6">
         {/* Next Lesson Card */}
         <div className="mb-2">
            <h2 className="text-white font-bold mb-3 flex items-center gap-2 text-sm opacity-90">
                <Clock className="w-4 h-4" /> Próxima Aula
            </h2>
            <Card className="border-none shadow-xl rounded-2xl overflow-hidden">
                <CardContent className="p-0">
                    <div className="bg-yellow-400 p-2 text-center text-xs font-bold uppercase tracking-wider text-yellow-900">
                        Amanhã • 10:00
                    </div>
                    <div className="p-5">
                         <div className="flex gap-4 items-center mb-4">
                             <img src={upcomingLesson.photo} className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm" />
                             <div>
                                 <h3 className="font-bold text-slate-900 text-lg">{upcomingLesson.name}</h3>
                                 <p className="text-sm text-slate-500">{upcomingLesson.vehicle}</p>
                             </div>
                         </div>
                         <div className="flex gap-2">
                             <Button className="flex-1 bg-green-50 text-green-700 hover:bg-green-100 border-green-100" variant="outline">
                                 Ver Detalhes
                             </Button>
                             <Button size="icon" className="bg-[#25D366] hover:bg-[#128C7E] text-white">
                                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                             </Button>
                         </div>
                    </div>
                </CardContent>
            </Card>
         </div>

         {/* Promo Banner */}
         <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
             <div className="absolute right-0 top-0 opacity-10 transform translate-x-1/3 -translate-y-1/3">
                 <User className="w-40 h-40" />
             </div>
             <h3 className="font-bold text-lg mb-1 relative z-10">Indique um amigo</h3>
             <p className="text-blue-100 text-sm mb-3 relative z-10 max-w-[80%]">
                 Ganhe 1 aula grátis para cada amigo que completar a primeira aula.
             </p>
             <Button size="sm" variant="secondary" className="relative z-10 text-blue-700 font-bold bg-white">
                 Copiar Código
             </Button>
         </div>

         {/* History */}
         <div>
             <div className="flex justify-between items-center mb-4">
                 <h2 className="font-bold text-slate-900 text-lg">Histórico</h2>
                 <Link href="/historico" className="text-primary text-sm font-medium">Ver tudo</Link>
             </div>
             <div className="space-y-3">
                 {[1, 2, 3].map((_, i) => (
                     <div key={i} className="bg-white p-4 rounded-xl shadow-sm flex items-center justify-between border border-gray-100">
                         <div className="flex items-center gap-3">
                             <div className="bg-gray-100 p-2 rounded-full text-gray-500">
                                 <CheckCircle2 className="w-5 h-5" />
                             </div>
                             <div>
                                 <p className="font-bold text-slate-800 text-sm">Aula de Baliza</p>
                                 <p className="text-xs text-slate-400">05 Dez • {instructors[1].name}</p>
                             </div>
                         </div>
                         <div className="flex flex-col items-end">
                             <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded">Concluído</span>
                             <Button variant="link" className="h-auto p-0 text-yellow-500 text-xs mt-1">Avaliar</Button>
                         </div>
                     </div>
                 ))}
             </div>
         </div>
      </div>
    </div>
  );
}
