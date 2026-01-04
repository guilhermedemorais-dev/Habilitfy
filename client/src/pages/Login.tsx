import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { LogIn, ArrowLeft, BadgeCheck, GraduationCap, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const logoBlue = "/logo-new-blue.svg";

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const redirectTo =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("redirect") || undefined
      : undefined;

  const goTo = (path: string) => {
    if (isAuthenticated) {
      window.location.assign(redirectTo || path);
      return;
    }
    // For signup, we don't want to call login() which is for OIDC
    window.location.assign(path);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <header className="flex items-center justify-between p-6 md:px-12">
        <Link href="/">
          <button className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-medium">
            <ArrowLeft className="w-5 h-5" />
            <span>Voltar ao início</span>
          </button>
        </Link>
        <img src={logoBlue} alt="HabilitFy" className="h-8 w-auto md:hidden" />
      </header>

      <main className="flex-1 flex items-center justify-center px-6 pb-20">
        <div className="w-full max-w-[440px]">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-3xl shadow-xl shadow-blue-100 border border-slate-100 mb-6">
              <img src={logoBlue} alt="HabilitFy" className="h-10 w-auto" />
            </div>
            <h1 className="text-3xl font-heading font-extrabold text-slate-900 mb-3 tracking-tight">Opa! Que bom ter você aqui.</h1>
            <p className="text-slate-500 font-medium">Escolha como deseja acessar a plataforma.</p>
          </div>

          <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/60 border border-slate-100 p-8 md:p-10 space-y-8 relative overflow-hidden">
            {/* Subtle background decoration */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-50 rounded-full blur-3xl opacity-50"></div>

            <div className="space-y-4 relative z-10">
              <Button
                size="lg"
                className="w-full h-14 text-base bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 transition-all active:scale-[0.98]"
                onClick={() => login(redirectTo)}
              >
                <LogIn className="w-5 h-5 mr-3" />
                Acessar minha conta
              </Button>
              <p className="text-[11px] text-slate-400 text-center font-medium px-4">
                O acesso é feito via Replit Auth de forma segura e imediata.
              </p>
            </div>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest text-slate-400"><span className="bg-white px-4">Ou crie uma nova</span></div>
            </div>

            <div className="grid grid-cols-1 gap-4 relative z-10">
              <button
                className="group flex items-center gap-4 p-4 bg-slate-50 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 border border-slate-100 rounded-2xl transition-all text-left"
                onClick={() => goTo("/cadastro-instrutor")}
              >
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm border border-slate-50 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <BadgeCheck size={24} />
                </div>
                <div>
                  <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Vou ensinar</p>
                  <p className="text-xs text-slate-500 font-medium">Cadastro como Instrutor</p>
                </div>
              </button>

              <button
                className="group flex items-center gap-4 p-4 bg-slate-50 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 border border-slate-100 rounded-2xl transition-all text-left"
                onClick={() => goTo("/dashboard/aluno")}
              >
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-green-600 shadow-sm border border-slate-50 group-hover:bg-green-600 group-hover:text-white transition-colors">
                  <GraduationCap size={24} />
                </div>
                <div>
                  <p className="font-bold text-slate-900 group-hover:text-green-600 transition-colors">Quero aprender</p>
                  <p className="text-xs text-slate-500 font-medium">Cadastro como Aluno</p>
                </div>
              </button>
            </div>

            <div className="flex items-center justify-center gap-2 text-slate-400 pt-2">
              <ShieldCheck size={14} />
              <span className="text-[10px] font-bold uppercase tracking-wider">HabilitFy Secure Auth</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
