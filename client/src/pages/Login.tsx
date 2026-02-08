import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GraduationCap, BadgeCheck, Mail, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

const logoBlue = "/logo-new-blue.svg";
const heroImage = "/login-hero.png";

// Google Icon SVG Component
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

export default function Login() {
  const { loginMutation, user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  // Redirecionar se já estiver logado
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
      console.log("Login failed", e);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `/api/auth/google`;
  };

  return (
    <div className="min-h-screen bg-white flex flex-col relative overflow-hidden">
      {/* Hero Image - Top 40% */}
      <div className="relative h-[40vh] w-full">
        <img
          src={heroImage}
          alt="Instrutora de autoescola"
          className="w-full h-full object-cover object-top"
        />
        {/* Gradient overlay for smooth transition */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/20" />
      </div>

      {/* Bottom Sheet */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative flex-1 bg-white rounded-t-[28px] -mt-6 px-6 pt-8 pb-10 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="flex items-center gap-2 mb-2">
            <img src={logoBlue} alt="HabilitFy" style={{ height: '25px', width: 'auto' }} />
          </div>
        </div>

        {/* Cadastre-se section */}
        <div className="mb-6">
          <p className="text-center text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
            ou cadastre-se
          </p>
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full h-14 justify-start px-4 rounded-2xl border-gray-200 hover:border-[#3B82F6] hover:bg-blue-50/50 transition-all group"
              onClick={() => setLocation("/cadastro-aluno")}
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mr-3">
                <GraduationCap size={20} />
              </div>
              <span className="font-semibold text-gray-800">Cadastro Aluno</span>
            </Button>

            <Button
              variant="outline"
              className="w-full h-14 justify-start px-4 rounded-2xl border-gray-200 hover:border-[#3B82F6] hover:bg-blue-50/50 transition-all group"
              onClick={() => setLocation("/cadastro-instrutor")}
            >
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mr-3">
                <BadgeCheck size={20} />
              </div>
              <span className="font-semibold text-gray-800">Cadastro Instrutor</span>
            </Button>
          </div>
        </div>

        {/* Login Form */}
        <div className="space-y-4">
          {/* Email Input */}
          <div className="relative">
            <Input
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-14 rounded-2xl bg-gray-50 border-gray-200 pl-4 pr-12 text-base placeholder:text-gray-400 focus:border-[#3B82F6] focus:ring-[#3B82F6]"
            />
            <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
          </div>

          {/* Password Input */}
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Senha"
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

          {/* Submit Button */}
          <Button
            size="lg"
            className="w-full h-14 text-base bg-[#3B82F6] hover:bg-[#2563EB] text-white font-semibold rounded-2xl shadow-lg shadow-blue-500/25 transition-all active:scale-[0.98]"
            onClick={handleLogin}
            disabled={loginMutation && loginMutation.isPending}
          >
            {loginMutation && loginMutation.isPending ? "Entrando..." : "Entrar"}
          </Button>

          {/* Google Login */}
          <Button
            variant="outline"
            size="lg"
            className="w-full h-14 text-base bg-white text-gray-700 font-semibold rounded-2xl border-gray-200 hover:bg-gray-50 transition-all active:scale-[0.98]"
            onClick={handleGoogleLogin}
          >
            <GoogleIcon />
            <span className="ml-3">Entrar com Google</span>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
