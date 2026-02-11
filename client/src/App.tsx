import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { BottomNav } from "@/components/layout/BottomNav";
import { PageTransition } from "@/components/layout/PageTransition";
import { SwipeNavigation } from "@/components/layout/SwipeNavigation";
import { GlobalAlert } from "@/components/ui/GlobalAlert";
import { cn } from "@/lib/utils";
import { Suspense, lazy } from "react";

// Lazy-loaded pages (code-splitting per route)
const Home = lazy(() => import("@/pages/Home"));
const MapPage = lazy(() => import("@/pages/MapPage"));
const InstructorProfile = lazy(() => import("@/pages/InstructorProfile"));
const Booking = lazy(() => import("@/pages/Booking"));
const Checkout = lazy(() => import("@/pages/Checkout"));
const Success = lazy(() => import("@/pages/Success"));
const StudentDashboard = lazy(() => import("@/pages/StudentDashboard"));
const InstructorDashboard = lazy(() => import("@/pages/InstructorDashboard"));
const SignupInstructor = lazy(() => import("@/pages/SignupInstructor"));
const SignupStudent = lazy(() => import("@/pages/SignupStudent"));
const NotFound = lazy(() => import("@/pages/not-found"));
const Login = lazy(() => import("@/pages/Login"));
const Admin = lazy(() => import("@/pages/Admin"));
const Styleguide = lazy(() => import("@/pages/Styleguide"));
const ChatPage = lazy(() => import("@/pages/ChatPage"));
const TransactionsPage = lazy(() => import("@/pages/TransactionsPage"));


import { ThemeProvider } from "@/components/theme-provider";

// Main App Component
function App() {
  const [location] = useLocation();
  const isAdminRoute = location.startsWith("/admin");
  const isAuthRoute = location.startsWith("/login") || location.startsWith("/cadastro") || location.startsWith("/signup") || location.startsWith("/verify-email");
  const isStyleguideRoute = location.startsWith("/styleguide");


  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="habilitfy-theme">
        <Toaster position="top-right" richColors closeButton />
        <GlobalAlert />
        <div
          className={cn(
            "min-h-screen bg-background text-foreground font-sans",
            isAdminRoute || isAuthRoute || isStyleguideRoute
              ? "pb-0"
              : "pb-16 md:pb-0",
          )}
        >
          <SwipeNavigation>
            <PageTransition>
              <Suspense fallback={
                <div className="flex items-center justify-center min-h-[60vh]">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              }>
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
                  <Route path="/dashboard/financeiro" component={TransactionsPage} />
                  <Route path="/admin" component={Admin} />
                  <Route path="/styleguide" component={Styleguide} />
                  <Route path="/chat" component={ChatPage} />

                  <Route component={NotFound} />
                </Switch>
              </Suspense>
            </PageTransition>
          </SwipeNavigation>
          {!isAdminRoute && !isAuthRoute && !isStyleguideRoute && <BottomNav />}
        </div>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
