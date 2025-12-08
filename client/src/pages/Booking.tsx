import { useParams, useLocation } from "wouter";
import { instructors } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, Car, Calendar, DollarSign } from "lucide-react";
import { useState } from "react";

export default function Booking() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const instructor = instructors.find((i) => i.id === id);
  const [rentVehicle, setRentVehicle] = useState(false);

  if (!instructor) return <div>Instrutor não encontrado</div>;

  const basePrice = instructor.price;
  const rentalPrice = 50;
  const total = rentVehicle ? basePrice + rentalPrice : basePrice;

  return (
    <div className="bg-gray-50 min-h-screen pb-24 font-sans">
      <header className="bg-white p-4 flex items-center gap-4 border-b border-gray-100 sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <h1 className="font-bold text-lg">Agendar Aula</h1>
      </header>

      <div className="p-6 max-w-lg mx-auto space-y-6">
        {/* Summary Card */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-4 flex gap-4 items-center">
            <img src={instructor.photo} className="w-16 h-16 rounded-full object-cover" />
            <div>
              <p className="text-sm text-slate-500">Instrutor</p>
              <h3 className="font-bold text-slate-900">{instructor.name}</h3>
              <p className="text-xs text-slate-400">{instructor.vehicle}</p>
            </div>
          </CardContent>
        </Card>

        {/* Options */}
        <div className="space-y-4">
          <h2 className="font-bold text-slate-900">Opções da Aula</h2>
          
          <div className="flex items-center space-x-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
             <div className="bg-yellow-100 p-2 rounded-lg text-yellow-700">
               <Car className="w-5 h-5" />
             </div>
             <div className="flex-1">
               <Label htmlFor="rent-vehicle" className="font-bold text-slate-800">Alugar veículo do instrutor</Label>
               <p className="text-xs text-slate-500">Obrigatório se não tiver carro próprio</p>
             </div>
             <div className="flex items-center gap-3">
               <span className="text-sm font-bold text-primary">+R$50</span>
               <Checkbox 
                 id="rent-vehicle" 
                 checked={rentVehicle} 
                 onCheckedChange={(c) => setRentVehicle(!!c)} 
                 className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
               />
             </div>
          </div>
        </div>

        {/* User Details Form */}
        <div className="space-y-4">
          <h2 className="font-bold text-slate-900">Seus Dados</h2>
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input id="name" placeholder="Ex: Maria Silva" className="bg-gray-50 border-gray-200" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input id="cpf" placeholder="000.000.000-00" className="bg-gray-50 border-gray-200" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">WhatsApp</Label>
              <Input id="phone" placeholder="(21) 99999-9999" className="bg-gray-50 border-gray-200" />
            </div>
          </div>
        </div>

        {/* Price Breakdown */}
        <div className="space-y-2 pt-4">
            <div className="flex justify-between text-sm text-slate-500">
                <span>Aula Prática (50min)</span>
                <span>R$ {basePrice},00</span>
            </div>
            {rentVehicle && (
                <div className="flex justify-between text-sm text-slate-500">
                    <span>Aluguel Veículo</span>
                    <span>R$ {rentalPrice},00</span>
                </div>
            )}
            <div className="flex justify-between font-bold text-lg text-slate-900 pt-2 border-t border-gray-200">
                <span>Total</span>
                <span>R$ {total},00</span>
            </div>
        </div>

        <Button 
            className="w-full h-14 text-lg bg-primary hover:bg-green-700 text-white rounded-xl shadow-lg shadow-green-200 mt-6"
            onClick={() => setLocation(`/checkout?total=${total}&instructor=${instructor.name}`)}
        >
            Ir para Pagamento
        </Button>
      </div>
    </div>
  );
}
