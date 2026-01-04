import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/layout/BottomNav";
import { cn } from "@/lib/utils";

import Home from "@/pages/Home";
import MapPage from "@/pages/MapPage";
import InstructorProfile from "@/pages/InstructorProfile";
import Booking from "@/pages/Booking";
import Checkout from "@/pages/Checkout";
import Success from "@/pages/Success";
import StudentDashboard from "@/pages/StudentDashboard";
import InstructorDashboard from "@/pages/InstructorDashboard";
import SignupInstructor from "@/pages/SignupInstructor";
import Admin from "@/pages/Admin";
import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";
import ChatPage from "@/pages/ChatPage";

import { Link } from "wouter";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

function AuthGuard({ component: Component, allowedRoles }: { component: React.ComponentType<any>, allowedRoles?: string[] }) {
  const { user, isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    const redirectTarget =
      typeof window !== "undefined"
        ? `${window.location.pathname}${window.location.search}`
        : location;
    setTimeout(
      () => setLocation(`/login?redirect=${encodeURIComponent(redirectTarget)}`),
      0,
    );
    return null;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background p-4 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Acesso Negado</h1>
        <p className="text-slate-600">Você não tem permissão para acessar esta página.</p>
        <Link href="/">
          <Button>Voltar ao Início</Button>
        </Link>
      </div>
    );
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/cadastro-instrutor" component={SignupInstructor} />

      {/* Protected Routes */}
      <Route path="/instrutores" component={MapPage} />
      <Route path="/instrutor/:id" component={InstructorProfile} />
      <Route path="/agendar/:id">
        {(params) => <AuthGuard component={Booking} {...params} />}
      </Route>
      <Route path="/checkout">
        {() => <AuthGuard component={Checkout} />}
      </Route>
      <Route path="/sucesso">
        {() => <AuthGuard component={Success} />}
      </Route>
      <Route path="/chat/:contactId?">
        {(params) => <AuthGuard component={ChatPage} {...params} />}
      </Route>
      <Route path="/dashboard/aluno">
        {() => <AuthGuard component={StudentDashboard} allowedRoles={['student']} />}
      </Route>
      <Route path="/dashboard/instrutor">
        {() => <AuthGuard component={InstructorDashboard} allowedRoles={['instructor']} />}
      </Route>
      <Route path="/admin">
        {() => <AuthGuard component={Admin} allowedRoles={['admin']} />}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [location] = useLocation();
  const isAdminRoute = location.startsWith("/admin");
  const isAuthRoute = location.startsWith("/login") || location.startsWith("/cadastro-instrutor");

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" richColors closeButton />
      <div
        className={cn(
          "min-h-screen bg-background text-slate-900 font-sans",
          isAdminRoute || isAuthRoute ? "pb-0" : "pb-16 md:pb-0",
        )}
      >
        <Router />
        {!isAdminRoute && !isAuthRoute && <BottomNav />}
      </div>
    </QueryClientProvider>
  );
}

export default App;
