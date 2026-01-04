import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { Upload, CheckCircle2, ChevronRight, ChevronLeft } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function SignupInstructor() {
  const [step, setStep] = useState(1);
  const [, setLocation] = useLocation();

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
    else setLocation("/dashboard/instrutor"); // Mock success redirect
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-6">
       <div className="w-full max-w-md">
           {/* Progress */}
           <div className="flex justify-between mb-8 px-2">
               {[1, 2, 3, 4].map(i => (
                   <div key={i} className={`w-full h-2 rounded-full mx-1 ${i <= step ? 'bg-primary' : 'bg-gray-200'}`} />
               ))}
           </div>

           <div className="text-center mb-8">
               <h1 className="text-2xl font-bold text-slate-900">Cadastro de Parceiro</h1>
               <p className="text-slate-500">Torne-se um instrutor HabilitFy</p>
           </div>

           <Card className="border-none shadow-lg">
               <CardContent className="p-6 space-y-6">
                   {step === 1 && (
                       <div className="space-y-4 animate-in fade-in slide-in-from-right-8">
                           <h2 className="font-bold text-lg">Documentação</h2>
                           <div className="space-y-2">
                               <Label>Credencial Detran (Frente)</Label>
                               <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-slate-400 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
                                   <Upload className="w-8 h-8 mb-2" />
                                   <span className="text-sm">Clique para enviar</span>
                               </div>
                           </div>
                           <div className="space-y-2">
                               <Label>CNH</Label>
                               <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center text-slate-400 bg-gray-50">
                                   <Upload className="w-6 h-6 mb-1" />
                                   <span className="text-xs">Clique para enviar</span>
                               </div>
                           </div>
                       </div>
                   )}

                   {step === 2 && (
                       <div className="space-y-4 animate-in fade-in slide-in-from-right-8">
                           <h2 className="font-bold text-lg">Seu Veículo</h2>
                           <div className="space-y-2">
                               <Label>Modelo do Carro</Label>
                               <Input placeholder="Ex: Hyundai HB20" />
                           </div>
                           <div className="space-y-2">
                               <Label>Ano</Label>
                               <Input placeholder="2023" />
                           </div>
                           <div className="space-y-2">
                               <Label>Foto do Veículo</Label>
                               <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-slate-400 bg-gray-50">
                                   <Upload className="w-8 h-8 mb-2" />
                                   <span className="text-sm">Foto lateral com placa</span>
                               </div>
                           </div>
                       </div>
                   )}

                   {step === 3 && (
                       <div className="space-y-4 animate-in fade-in slide-in-from-right-8">
                           <h2 className="font-bold text-lg">Detalhes do Serviço</h2>
                           <div className="space-y-2">
                               <Label>Preço por Aula (50min)</Label>
                               <div className="relative">
                                   <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">R$</span>
                                   <Input className="pl-10" placeholder="80,00" />
                               </div>
                           </div>
                           <div className="space-y-2">
                               <Label>Bairros de Atendimento</Label>
                               <Input placeholder="Ex: Copacabana, Botafogo, Centro" />
                           </div>
                       </div>
                   )}

                   {step === 4 && (
                       <div className="space-y-4 animate-in fade-in slide-in-from-right-8 text-center py-4">
                           <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
                               <CheckCircle2 className="w-10 h-10" />
                           </div>
                           <h2 className="font-bold text-xl">Cadastro Recebido!</h2>
                           <p className="text-slate-500 text-sm">
                               Nossa equipe irá analisar seus documentos em até 24h. Você receberá uma notificação no WhatsApp.
                           </p>
                       </div>
                   )}

                   <div className="flex gap-3 pt-4">
                       {step > 1 && (
                           <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1">
                               <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
                           </Button>
                       )}
                       <Button onClick={handleNext} className="flex-1 bg-primary hover:bg-green-700 text-white font-bold">
                           {step === 4 ? "Concluir" : "Próximo"} <ChevronRight className="w-4 h-4 ml-1" />
                       </Button>
                   </div>
               </CardContent>
           </Card>
           
           <div className="mt-6 text-center">
               <Link href="/" className="text-sm text-slate-400 hover:text-slate-600">Cancelar cadastro</Link>
           </div>
       </div>
    </div>
  );
}
