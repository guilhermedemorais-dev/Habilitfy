import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogIn, ArrowLeft, BadgeCheck, GraduationCap, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

const logoBlue = "/logo-new-blue.svg";

// Google Icon SVG Component
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 mr-3">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

export default function Login() {
  const { loginMutation } = useAuth();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");

    if (error === "account_not_found") {
      toast({
        title: "Conta não encontrada",
        description: "Você precisa se cadastrar antes de fazer login com o Google.",
        variant: "destructive",
      });
    } else if (error === "auth_failed") {
      toast({
        title: "Falha na autenticação",
        description: "Não foi possível fazer login com o Google. Tente novamente.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleLogin = async () => {
    try {
      if (!loginMutation) return;
      await loginMutation.mutateAsync({ username: email, password });
    } catch (e) {
      // Error handled by mutation hook via toast
      console.log("Login failed", e);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `/api/auth/google`;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <header className="flex items-center justify-between p-6 md:px-12">
        <Link
          href="/"
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Voltar ao início</span>
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
            <p className="text-slate-500 font-medium">Acesse sua conta ou cadastre-se abaixo.</p>
          </div>

          <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/60 border border-slate-100 p-8 md:p-10 space-y-6 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-50 rounded-full blur-3xl opacity-50"></div>

            <div className="space-y-4 relative z-10">
              {/* Inputs */}
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="E-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all"
                />

                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Login Buttons */}
              <Button
                size="lg"
                className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-[0.98]"
                onClick={handleLogin}
                disabled={loginMutation && loginMutation.isPending}
              >
                {loginMutation && loginMutation.isPending ? "Entrando..." : "Entrar"}
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="w-full h-12 text-base bg-white hover:bg-slate-50 text-slate-800 font-bold rounded-xl border-2 border-slate-200 hover:border-slate-300 transition-all active:scale-[0.98]"
                onClick={handleGoogleLogin}
              >
                <GoogleIcon />
                Entrar com Google
              </Button>

              {/* Divider */}
              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest text-slate-400"><span className="bg-white px-4">ou cadastre-se</span></div>
              </div>

              {/* Registration Buttons */}
              <div className="grid grid-cols-1 gap-3">
                <Button
                  variant="outline"
                  className="w-full h-14 justify-start px-4 rounded-xl border-slate-200 hover:border-blue-200 hover:bg-blue-50 transition-all group"
                  onClick={() => setLocation("/cadastro-aluno")}
                >
                  <div className="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                    <GraduationCap size={18} />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-bold text-slate-700 group-hover:text-blue-700">Cadastro Aluno</span>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="w-full h-14 justify-start px-4 rounded-xl border-slate-200 hover:border-blue-200 hover:bg-blue-50 transition-all group"
                  onClick={() => setLocation("/cadastro-instrutor")}
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                    <BadgeCheck size={18} />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-bold text-slate-700 group-hover:text-blue-700">Cadastro Instrutor</span>
                  </div>
                </Button>
              </div>

            </div>

            <div className="flex items-center justify-center gap-2 text-slate-400 pt-2">
              <ShieldCheck size={14} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Ambiente Seguro</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
