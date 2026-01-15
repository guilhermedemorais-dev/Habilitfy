import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, Car } from "lucide-react";
import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { Instructor } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { formatISO } from "date-fns";

type InstructorDetails = Instructor & {
  name?: string;
  photo?: string;
  vehicle?: string;
  user?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    profileImageUrl?: string | null;
  } | null;
};

export default function Booking() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const [rentVehicle, setRentVehicle] = useState(false);
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState<string>("10:00");
  const { data: instructor, isLoading } = useQuery<InstructorDetails>({
    queryKey: ["/api/instructors", id],
    enabled: !!id,
  });
  const basePrice = useMemo(() => Number(instructor?.pricePerHour || 0), [instructor]);
  const rentalPrice = rentVehicle ? 50 : 0;
  const total = useMemo(() => basePrice + rentalPrice, [rentVehicle, basePrice, rentalPrice]);

  const createBooking = useMutation({
    mutationFn: async () => {
      if (!instructor || !id) throw new Error("Instrutor não encontrado");
      const dateTime = new Date(`${date}T${time}:00`);
      const payload = {
        instructorId: id,
        date: formatISO(dateTime),
        duration: 50,
        price: basePrice,
        rentVehicle,
        vehicleRentalPrice: rentalPrice,
        totalPrice: total,
        meetingAddress: "A combinar via WhatsApp",
        status: "pending",
      };
      const res = await apiRequest("POST", "/api/bookings", payload);
      const json = await res.json();
      return json;
    },
    onSuccess: (booking) => {
      setLocation(`/checkout?bookingId=${booking.id}&total=${total}`);
    },
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

  if (!instructor) return <div>Instrutor não encontrado</div>;

  const instructorName =
    instructor.name ||
    `${instructor.user?.firstName || ""} ${instructor.user?.lastName || ""}`.trim() ||
    instructor.user?.email ||
    "Instrutor";
  const instructorVehicle =
    instructor.vehicle ||
    `${instructor.vehicleModel} ${instructor.vehicleYear || ""}`.trim() ||
    instructor.vehicleType;
  const instructorPhoto =
    instructor.photo || instructor.user?.profileImageUrl || "";

  const onSubmit = () => {
    createBooking.mutate();
  };

  return (
    <div className="bg-background min-h-screen pb-24 font-sans">
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
            {instructorPhoto ? (
              <img
                src={instructorPhoto}
                className="w-16 h-16 rounded-full object-cover"
                alt={instructorName}
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-sm font-semibold">
                {instructorName.charAt(0)}
              </div>
            )}
            <div>
              <p className="text-sm text-slate-500">Instrutor</p>
              <h3 className="font-bold text-slate-900">{instructorName}</h3>
              <p className="text-xs text-slate-400">{instructorVehicle}</p>
            </div>
          </CardContent>
        </Card>

        {/* Options */}
        <div className="space-y-4">
          <h2 className="font-bold text-slate-900">Opções da Aula</h2>
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3">
            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <Input
                type="date"
                id="date"
                value={date}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setDate(e.target.value)}
                className="bg-gray-50 border-gray-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Horário</Label>
              <Input
                type="time"
                id="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="bg-gray-50 border-gray-200"
              />
            </div>
          </div>
          
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
            disabled={createBooking.isLoading}
            onClick={onSubmit}
        >
            {createBooking.isLoading ? "Criando reserva..." : "Ir para Pagamento"}
        </Button>
     </div>
    </div>
  );
}
