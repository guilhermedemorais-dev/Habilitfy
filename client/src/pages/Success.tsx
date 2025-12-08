import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Check, Calendar, Share2, MapPin } from "lucide-react";
import { motion } from "framer-motion";

export default function Success() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
      <motion.div 
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6"
      >
        <Check className="w-12 h-12 text-green-600" strokeWidth={3} />
      </motion.div>

      <h1 className="text-3xl font-bold text-slate-900 mb-2">Agendamento Confirmado!</h1>
      <p className="text-slate-500 mb-8 max-w-xs mx-auto">
        Sua aula foi agendada com sucesso. Envie o comprovante para o instrutor.
      </p>

      <div className="w-full max-w-sm bg-gray-50 rounded-2xl p-6 border border-gray-100 mb-8 text-left space-y-4 shadow-sm">
        <div className="flex items-start gap-3">
             <div className="bg-white p-2 rounded-full shadow-sm">
                 <MapPin className="w-5 h-5 text-primary" />
             </div>
             <div>
                 <h3 className="font-bold text-slate-900">Ponto de Encontro</h3>
                 <p className="text-sm text-slate-500">Rua Siqueira Campos, 143 - Copacabana</p>
             </div>
        </div>
        <div className="flex items-start gap-3">
             <div className="bg-white p-2 rounded-full shadow-sm">
                 <Calendar className="w-5 h-5 text-primary" />
             </div>
             <div>
                 <h3 className="font-bold text-slate-900">Data e Hora</h3>
                 <p className="text-sm text-slate-500">Amanhã, 10:00 - 10:50</p>
             </div>
        </div>
      </div>

      <div className="w-full max-w-sm space-y-3">
        <Button className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white rounded-xl h-12 shadow-lg shadow-green-100 flex items-center justify-center gap-2 font-bold">
            <Share2 className="w-5 h-5" />
            Falar no WhatsApp
        </Button>
        <Link href="/dashboard/aluno">
            <Button variant="outline" className="w-full rounded-xl h-12">
                Ver Meus Agendamentos
            </Button>
        </Link>
      </div>
    </div>
  );
}
