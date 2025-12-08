import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { BottomNav } from "@/components/layout/BottomNav";

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

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/instrutores" component={MapPage} />
      <Route path="/instrutor/:id" component={InstructorProfile} />
      <Route path="/agendar/:id" component={Booking} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/sucesso" component={Success} />
      <Route path="/dashboard/aluno" component={StudentDashboard} />
      <Route path="/dashboard/instrutor" component={InstructorDashboard} />
      <Route path="/cadastro-instrutor" component={SignupInstructor} />
      <Route path="/admin" component={Admin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <div className="min-h-screen pb-16 md:pb-0 bg-gray-50 text-slate-900 font-sans">
        <Router />
        <BottomNav />
      </div>
    </QueryClientProvider>
  );
}

export default App;
