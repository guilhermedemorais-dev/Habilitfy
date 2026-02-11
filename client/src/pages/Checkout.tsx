import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Added CardHeader, CardTitle
import { ChevronLeft, Lock, Shield, CreditCard } from "lucide-react";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";

export default function Checkout() {
  const [, setLocation] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const total = params.get("total") || "0";
  const bookingId = params.get("bookingId");
  const [error, setError] = useState<string | null>(null);

  const payBooking = useMutation({
    mutationFn: async () => {
      if (!bookingId) throw new Error("Booking não informado.");
      // Call Stripe Checkout endpoint
      const res = await apiRequest("POST", "/api/payments/stripe/checkout", { bookingId });
      return res.json();
    },
    onSuccess: (data) => {
      if (data?.url) {
        // Redirect to Stripe Hosted Checkout
        window.location.href = data.url;
        return;
      }
      setError("Não foi possível gerar o link de pagamento.");
    },
    onError: (err: any) => {
      setError(err?.message || "Falha ao iniciar pagamento.");
    },
  });

  return (
    <div className="bg-background min-h-screen font-sans flex flex-col">
      <header className="p-4 flex items-center gap-4 text-slate-900 border-b">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => window.history.back()}
          className="text-slate-700 hover:bg-slate-100"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <span className="font-bold text-lg">Checkout Seguro</span>
      </header>

      <div className="bg-gray-50 flex-1 p-6 flex flex-col items-center justify-center">
        <div className="w-full max-w-md space-y-6">
          <Card className="shadow-lg border-slate-200">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-xl text-slate-700">Resumo do Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              <div className="text-center">
                <p className="text-slate-500 text-sm uppercase tracking-wide">Valor a pagar</p>
                <h1 className="text-4xl font-extrabold text-[#009EE3] mt-2">R$ {total},00</h1>
                {bookingId ? (
                  <p className="text-xs text-slate-400 mt-2 font-mono">Reserva ID: {bookingId}</p>
                ) : (
                  <p className="text-xs text-red-500 mt-2">BookingId não informado.</p>
                )}
              </div>

              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-sm text-slate-600 space-y-2">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#009EE3]" />
                  <span>Pagamento processado via <strong>Stripe</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#009EE3]" />
                  <span>Ambiente criptografado e seguro</span>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center border border-red-100">
                  {error}
                </div>
              )}

              <Button
                className="w-full h-14 text-lg bg-[#635BFF] hover:bg-[#5340D8] text-white rounded-xl shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 transition-all"
                disabled={payBooking.isPending || !bookingId}
                onClick={() => payBooking.mutate()}
              >
                <Lock className="w-4 h-4" />
                {payBooking.isPending ? "Redirecionando..." : "Ir para Pagamento Seguro"}
              </Button>

              <div className="flex justify-center gap-2 text-slate-400">
                <span className="text-xs flex items-center gap-1">Powered by <span className="font-bold text-slate-500">Stripe</span></span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
