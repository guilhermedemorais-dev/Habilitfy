import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, ChevronLeft, Lock, Shield } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useMemo, useState } from "react";
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
      const res = await apiRequest("POST", "/api/payments/abacatepay", { bookingId });
      return res.json();
    },
    onSuccess: (data) => {
      if (data?.paymentUrl) {
        window.location.href = data.paymentUrl;
        return;
      }
      setLocation(bookingId ? `/sucesso?bookingId=${bookingId}` : "/sucesso");
    },
    onError: (err: any) => {
      setError(err?.message || "Falha ao iniciar pagamento.");
    },
  });

  const pixCode = useMemo(
    () =>
      "00020126580014br.gov.bcb.pix0136123e4567-e89b-12d3-a456-426614174000520400005303986540510.005802BR5910HabilitFy6008BRASILIA62070503***6304E2CA",
    [],
  );

  return (
    <div className="bg-background min-h-screen font-sans flex flex-col">
      <header className="p-4 flex items-center gap-4 text-slate-900">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => window.history.back()}
          className="text-slate-700 hover:bg-slate-100"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <span className="font-bold">Checkout Seguro</span>
      </header>

      <div className="bg-gray-100 flex-1 rounded-t-3xl p-6 mt-4">
        <div className="max-w-md mx-auto space-y-6">
          <div className="text-center mb-6">
            <p className="text-slate-500 text-sm">Valor a pagar</p>
            <h1 className="text-4xl font-bold text-slate-900">R$ {total},00</h1>
            {bookingId ? (
              <p className="text-xs text-slate-500 mt-1">Reserva: {bookingId}</p>
            ) : (
              <p className="text-xs text-red-500 mt-1">BookingId não informado.</p>
            )}
          </div>

          <Tabs defaultValue="pix" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4 bg-gray-200 p-1 rounded-xl">
              <TabsTrigger value="pix" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Pix (Instantâneo)
              </TabsTrigger>
              <TabsTrigger value="card" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Cartão
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pix">
              <Card className="border-none shadow-sm">
                <CardContent className="p-6 flex flex-col items-center gap-4">
                  <div className="bg-white p-2 rounded-xl border border-gray-100 shadow-inner">
                    <QRCodeSVG value={pixCode} size={200} />
                  </div>
                  <p className="text-sm text-center text-slate-500">
                    Escaneie o QR Code ou copie o código abaixo para pagar no seu app de banco.
                  </p>
                  <div className="w-full flex gap-2">
                    <div className="bg-gray-100 p-3 rounded-lg flex-1 truncate text-xs font-mono text-slate-500">{pixCode}</div>
                    <Button variant="outline" size="icon" className="shrink-0">
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="card">
              <Card className="border-none shadow-sm">
                <CardContent className="p-6 space-y-4">
                  <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 rounded-xl text-white shadow-lg mb-4">
                    <div className="flex justify-between items-start mb-8">
                      <div className="w-10 h-6 bg-yellow-500/80 rounded" />
                      <span className="font-mono">CREDIT</span>
                    </div>
                    <div className="font-mono text-lg tracking-widest mb-2">•••• •••• •••• 4242</div>
                    <div className="flex justify-between text-xs opacity-70">
                      <span>NOME TITULAR</span>
                      <span>12/28</span>
                    </div>
                  </div>
                  <div className="space-y-2 opacity-50 pointer-events-none">
                    <div className="h-10 bg-gray-100 rounded-lg w-full" />
                    <div className="flex gap-2">
                      <div className="h-10 bg-gray-100 rounded-lg flex-1" />
                      <div className="h-10 bg-gray-100 rounded-lg w-20" />
                    </div>
                  </div>
                  <p className="text-xs text-center text-red-400">Use Pix neste protótipo.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <Button
            className="w-full h-14 text-lg bg-[#009EE3] hover:bg-[#0081B9] text-white rounded-xl shadow-lg mt-4 flex items-center justify-center gap-2"
            disabled={payBooking.isLoading || !bookingId}
            onClick={() => payBooking.mutate()}
          >
            <Lock className="w-4 h-4" />
            {payBooking.isLoading ? "Processando..." : "Gerar link de pagamento"}
          </Button>

          <div className="flex justify-center gap-2 text-slate-400">
            <Shield className="w-4 h-4" />
            <span className="text-xs">Pagamento seguro AbacatePay</span>
          </div>
        </div>
      </div>
    </div>
  );
}
