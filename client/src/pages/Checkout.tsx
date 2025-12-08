import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, QrCode, CreditCard, ChevronLeft, Lock } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

export default function Checkout() {
  const [location, setLocation] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const total = params.get("total") || "0";
  
  // Pix Mock Payload
  const pixCode = "00020126580014br.gov.bcb.pix0136123e4567-e89b-12d3-a456-426614174000520400005303986540510.005802BR5913HabilitaFacil6008BRASILIA62070503***6304E2CA";

  return (
    <div className="bg-[#009EE3] min-h-screen font-sans flex flex-col">
       {/* Mercado Pago Mock Header */}
       <header className="p-4 flex items-center gap-4 text-white">
        <Button variant="ghost" size="icon" onClick={() => window.history.back()} className="text-white hover:bg-white/10">
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <span className="font-bold">Checkout Seguro</span>
      </header>

      <div className="bg-gray-100 flex-1 rounded-t-3xl p-6 mt-4">
         <div className="max-w-md mx-auto space-y-6">
            
            <div className="text-center mb-6">
                <p className="text-slate-500 text-sm">Valor a pagar</p>
                <h1 className="text-4xl font-bold text-slate-900">R$ {total},00</h1>
            </div>

            <Tabs defaultValue="pix" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4 bg-gray-200 p-1 rounded-xl">
                    <TabsTrigger value="pix" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Pix (Instantâneo)</TabsTrigger>
                    <TabsTrigger value="card" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Cartão</TabsTrigger>
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
                                <div className="bg-gray-100 p-3 rounded-lg flex-1 truncate text-xs font-mono text-slate-500">
                                    {pixCode}
                                </div>
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
                             {/* Mock Form */}
                             <div className="space-y-2 opacity-50 pointer-events-none">
                                <div className="h-10 bg-gray-100 rounded-lg w-full" />
                                <div className="flex gap-2">
                                    <div className="h-10 bg-gray-100 rounded-lg flex-1" />
                                    <div className="h-10 bg-gray-100 rounded-lg w-20" />
                                </div>
                             </div>
                             <p className="text-xs text-center text-red-400">Simulação: Use Pix para este protótipo</p>
                         </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <Button 
                className="w-full h-14 text-lg bg-[#009EE3] hover:bg-[#0081B9] text-white rounded-xl shadow-lg mt-4 flex items-center justify-center gap-2"
                onClick={() => setLocation("/sucesso")}
            >
                <Lock className="w-4 h-4" />
                Pagar Agora
            </Button>
            
            <div className="flex justify-center gap-2 text-slate-400">
                 <ShieldCheck className="w-4 h-4" />
                 <span className="text-xs">Pagamento processado pelo Mercado Pago</span>
            </div>
         </div>
      </div>
    </div>
  );
}

function ShieldCheck(props: any) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    )
  }
