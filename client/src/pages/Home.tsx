import { Link } from "wouter";
import { MapPin, Search, Star, ChevronRight, ShieldCheck, ShipWheel } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import heroImg from "@assets/generated_images/happy_driving_lesson_in_brazil.png";
import logo from "@assets/36433982-73c6-4454-b519-1c5f29971d9f-removebg-preview_1_(1)_1765225573308.png";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-gray-100">
        <div className="flex items-center gap-2">
           <img src={logo} alt="HabilitaFácil Logo" className="h-16 w-auto object-contain" />
        </div>
        <Link href="/dashboard/aluno">
          <Button variant="ghost" size="sm" className="text-primary font-medium">Entrar</Button>
        </Link>
      </header>

      {/* Hero Section */}
      <section className="relative pt-8 pb-12 px-6 overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-10 bg-gradient-to-br from-green-500 to-yellow-400" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 max-w-md mx-auto text-center"
        >
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight text-slate-900">
            Sua CNH na mão, <br />
            <span className="text-primary">sem estresse.</span>
          </h1>
          <p className="text-slate-600 mb-8 text-lg">
            Encontre os melhores instrutores credenciados pelo Detran perto de você. Agende aulas avulsas ou pacotes.
          </p>

          <div className="bg-white p-2 rounded-2xl shadow-lg border border-gray-100 flex items-center gap-2 mb-8">
            <MapPin className="text-primary w-5 h-5 ml-2" />
            <input 
              type="text" 
              placeholder="Digite seu CEP ou bairro" 
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm h-10"
            />
            <Link href="/instrutores">
              <Button size="icon" className="bg-primary hover:bg-green-700 text-white rounded-xl h-10 w-10 shadow-md">
                <Search className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="relative z-10 mt-4 rounded-3xl overflow-hidden shadow-xl mx-4 md:mx-auto max-w-2xl border-4 border-white aspect-video"
        >
          <img src={heroImg} alt="Driving Lesson" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
            <div className="text-white">
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-yellow-400 text-black text-xs font-bold px-2 py-0.5 rounded-full">PROMO</span>
              </div>
              <h3 className="text-2xl font-bold">1ª Aula por R$ 69,90</h3>
              <p className="text-white/90 text-sm">Para novos alunos. Aproveite hoje!</p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features / Categories */}
      <section className="px-6 py-8 bg-white">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          Por que escolher a HabilitaFácil?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-none shadow-sm bg-green-50/50">
            <CardContent className="p-6 flex flex-col items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-primary">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg">100% Credenciados</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Todos os instrutores passam por verificação rigorosa do Detran e antecedentes criminais.
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-none shadow-sm bg-yellow-50/50">
             <CardContent className="p-6 flex flex-col items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-700">
                <Star className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg">Avaliação Real</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Veja reviews reais de outros alunos antes de escolher seu instrutor.
              </p>
            </CardContent>
          </Card>

           <Card className="border-none shadow-sm bg-blue-50/50">
             <CardContent className="p-6 flex flex-col items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700">
                <ShipWheel className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg">Carro ou Próprio</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Faça aula no carro da autoescola ou treine no seu próprio veículo (para habilitados).
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-12 pb-24 text-center">
        <Link href="/instrutores">
          <Button size="lg" className="w-full max-w-sm bg-primary hover:bg-green-700 text-white text-lg h-14 rounded-2xl shadow-xl shadow-green-200 animate-pulse-slow">
            Encontrar Instrutor Agora
            <ChevronRight className="ml-2 w-5 h-5" />
          </Button>
        </Link>
        <p className="mt-4 text-sm text-slate-400">
          Mais de 5.000 alunos aprovados em 2024
        </p>
      </section>
    </div>
  );
}
