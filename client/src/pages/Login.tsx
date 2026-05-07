import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GraduationCap, Award, Mail, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useGlobalAlert } from "@/components/ui/GlobalAlert";
import { motion, AnimatePresence } from "framer-motion";

const logoBlue = "/logo-new-blue.svg";
const heroImage = "/login-hero.png";

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5">
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

type Tab = "login" | "register";

export default function Login() {
  const { loginMutation, user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState<Tab>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const { showAlert } = useGlobalAlert();

  useEffect(() => {
    if (user && !isLoading) {
      if (user.role === "admin") {
        setLocation("/admin");
      } else if (user.role === "instructor") {
        setLocation("/dashboard/instrutor");
      } else {
        setLocation("/dashboard/aluno");
      }
    }
  }, [user, isLoading, setLocation]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");

    if (error === "account_not_found") {
      showAlert("error", "Conta não encontrada", "Você precisa se cadastrar antes de fazer login com o Google.");
    } else if (error === "auth_failed") {
      showAlert("error", "Falha na autenticação", "Não foi possível fazer login com o Google. Tente novamente.");
    } else if (error === "account_blocked") {
      showAlert("error", "Conta bloqueada", "Seu acesso foi bloqueado. Entre em contato com o suporte.");
    }
  }, [showAlert]);

  const handleLogin = async () => {
    try {
      if (!loginMutation) return;
      await loginMutation.mutateAsync({ username: email, password });
    } catch (e: any) {
      console.log("Login failed", e);
      showAlert("error", "Erro no Login", e.message || "Verifique suas credenciais e tente novamente.");
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `/api/auth/google`;
  };

  const isPending = !!(loginMutation && loginMutation.isPending);

  return (
    <div className="min-h-screen bg-white flex flex-col relative overflow-hidden">
      <div className="relative h-[40vh] w-full">
        <img
          src={heroImage}
          alt="Instrutora de autoescola"
          className="w-full h-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/20" />
      </div>

      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative flex-1 bg-white rounded-t-[28px] -mt-6 px-6 pt-8 pb-10 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]"
      >
        <div className="flex flex-col items-center mb-6">
          <img src={logoBlue} alt="HabilitFy" className="h-20 w-auto" />
        </div>

        {/* Tabs Entrar / Cadastrar */}
        <div className="relative grid grid-cols-2 bg-gray-100 rounded-2xl p-1 mb-6">
          <motion.div
            className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-xl shadow-sm"
            animate={{ left: tab === "login" ? 4 : "calc(50% + 0px)" }}
            transition={{ type: "spring", stiffness: 400, damping: 32 }}
          />
          <button
            type="button"
            onClick={() => setTab("login")}
            className={`relative z-10 h-11 rounded-xl text-sm font-semibold transition-colors ${
              tab === "login" ? "text-gray-900" : "text-gray-500"
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => setTab("register")}
            className={`relative z-10 h-11 rounded-xl text-sm font-semibold transition-colors ${
              tab === "register" ? "text-gray-900" : "text-gray-500"
            }`}
          >
            Cadastrar
          </button>
        </div>

        <AnimatePresence mode="wait">
          {tab === "login" ? (
            <motion.div
              key="login"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  E-mail
                </label>
                <div className="relative">
                  <Input
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-14 rounded-2xl bg-gray-50 border-gray-200 pl-4 pr-12 text-base placeholder:text-gray-400 focus:border-[#3B82F6] focus:ring-[#3B82F6]"
                  />
                  <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Senha
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-14 rounded-2xl bg-gray-50 border-gray-200 pl-4 pr-12 text-base placeholder:text-gray-400 focus:border-[#3B82F6] focus:ring-[#3B82F6]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <Button
                size="lg"
                className="w-full h-14 text-base bg-[#3B82F6] hover:bg-[#2563EB] text-white font-semibold rounded-2xl shadow-lg shadow-blue-500/25 transition-all active:scale-[0.98]"
                onClick={() => handleLogin()}
                disabled={isPending}
              >
                {isPending ? "Entrando..." : "Entrar"}
              </Button>

              <div className="flex items-center gap-3 my-2">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400">ou</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <Button
                variant="outline"
                size="lg"
                className="w-full h-14 text-base bg-gray-50 text-gray-800 font-semibold rounded-2xl border-gray-200 hover:bg-gray-100 transition-all active:scale-[0.98]"
                onClick={handleGoogleLogin}
              >
                <GoogleIcon />
                <span className="ml-3">Continuar com Google</span>
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="register"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-2 gap-3"
            >
              <button
                type="button"
                onClick={() => setLocation("/cadastro-aluno")}
                className="flex flex-col items-center justify-center text-center rounded-2xl border-2 border-[#3B82F6] bg-blue-50/40 px-4 py-6 transition-all hover:bg-blue-50 active:scale-[0.98]"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-2 text-2xl">
                  🎓
                </div>
                <span className="text-sm font-semibold text-[#3B82F6]">Aluno</span>
                <span className="text-xs text-gray-500 mt-0.5">Quero aprender</span>
              </button>

              <button
                type="button"
                onClick={() => setLocation("/cadastro-instrutor")}
                className="flex flex-col items-center justify-center text-center rounded-2xl border-2 border-gray-200 bg-white px-4 py-6 transition-all hover:border-[#3B82F6] hover:bg-blue-50/40 active:scale-[0.98]"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-2 text-2xl">
                  🏅
                </div>
                <span className="text-sm font-semibold text-gray-800">Instrutor</span>
                <span className="text-xs text-gray-500 mt-0.5">Quero ensinar</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
