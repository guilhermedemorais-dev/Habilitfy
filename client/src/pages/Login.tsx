import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { LogIn, ArrowLeft, BadgeCheck, GraduationCap } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Login() {
  const { login, isAuthenticated } = useAuth();

  const goTo = (path: string) => {
    // Se já estiver autenticado, vai direto. Caso contrário, segue o fluxo de login com redirect.
    if (isAuthenticated) {
      window.location.assign(path);
      return;
    }
    login(path);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="flex items-center gap-3 p-6">
        <Link href="/">
          <Button variant="ghost" size="sm" className="text-slate-600">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Voltar
          </Button>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 pb-12">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg border border-gray-100 p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/10 text-primary">
              <LogIn className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Acesso</p>
              <h1 className="text-2xl font-bold text-slate-900">Entre para continuar</h1>
            </div>
          </div>

          <Button
            size="lg"
            className="w-full h-12 text-base bg-primary hover:bg-green-700 text-white"
            onClick={() => login()}
          >
            Entrar com sua conta
          </Button>

          <div className="space-y-3">
            <p className="text-xs uppercase font-semibold text-slate-500 tracking-wide">
              Começar agora
            </p>
            <Button
              size="lg"
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => goTo("/cadastro-instrutor")}
            >
              <BadgeCheck className="w-4 h-4 mr-2" />
              Cadastro Instrutor
            </Button>
            <Button
              size="lg"
              className="w-full h-12 bg-green-600 hover:bg-green-700 text-white"
              onClick={() => goTo("/dashboard/aluno")}
            >
              <GraduationCap className="w-4 h-4 mr-2" />
              Cadastro Aluno
            </Button>
          </div>

          <p className="text-xs text-slate-400 text-center">
            O login usa nosso provedor seguro (OIDC) e cria/atualiza sua conta automaticamente.
          </p>
        </div>
      </main>
    </div>
  );
}
