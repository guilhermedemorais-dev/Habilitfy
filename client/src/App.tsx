import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/layout/BottomNav";
import { AIChatFAB } from "@/components/chat/AIChatFAB";
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
import SignupStudent from "@/pages/SignupStudent";
import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";
import Admin from "@/pages/Admin";

// ... existing code ...




// Main App Component
function App() {
  const [location] = useLocation();
  const isAdminRoute = location.startsWith("/admin");
  const isAuthRoute = location.startsWith("/login") || location.startsWith("/cadastro");
  const isStyleguideRoute = location.startsWith("/styleguide");

  const isChatRoute = location.startsWith("/chat");

  // Show AI FAB on main user pages (not admin, auth, styleguide, or existing chat)
  const showAIChatFAB = !isAdminRoute && !isAuthRoute && !isStyleguideRoute && !isChatRoute;

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" richColors closeButton />
      <div
        className={cn(
          "min-h-screen bg-background text-slate-900 font-sans",
          isAdminRoute || isAuthRoute || isStyleguideRoute
            ? "pb-0"
            : "pb-16 md:pb-0",
        )}
      >
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/login" component={Login} />
          <Route path="/cadastro-instrutor" component={SignupInstructor} />
          <Route path="/signup-instructor" component={SignupInstructor} />
          <Route path="/cadastro-aluno" component={SignupStudent} />
          <Route path="/signup-student" component={SignupStudent} />
          <Route path="/mapa" component={MapPage} />
          <Route path="/instrutor/:id" component={InstructorProfile} />
          <Route path="/agendar/:instructorId" component={Booking} />
          <Route path="/checkout" component={Checkout} />
          <Route path="/sucesso" component={Success} />
          <Route path="/dashboard/student" component={StudentDashboard} />
          <Route path="/dashboard/aluno" component={StudentDashboard} />
          <Route path="/dashboard/instructor" component={InstructorDashboard} />
          <Route path="/dashboard/instrutor" component={InstructorDashboard} />
          <Route path="/admin" component={Admin} />

          <Route component={NotFound} />
        </Switch>
        {!isAdminRoute && !isAuthRoute && !isStyleguideRoute && <BottomNav />}
        {showAIChatFAB && <AIChatFAB />}
      </div>
    </QueryClientProvider>
  );
}

export default App;
