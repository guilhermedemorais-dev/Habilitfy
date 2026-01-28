import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { getNavItems } from "@/components/layout/navigation";
import { useAuth } from "@/hooks/useAuth";

export function BottomNav() {
  const [location] = useLocation();
  const { user } = useAuth();
  const navItems = getNavItems(user?.role);

  return (
    <nav className="fixed bottom-4 left-4 right-4 z-50 md:hidden">
      <div className="mx-auto flex w-full max-w-[360px] items-center justify-between rounded-[2rem] border border-white/20 bg-white/90 px-3 py-2 shadow-xl shadow-blue-900/10 backdrop-blur-xl">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              title={item.label}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200",
                isActive
                  ? "bg-primary text-white shadow-md shadow-blue-500/25"
                  : "text-slate-400 hover:bg-blue-50 hover:text-primary"
              )}
            >
              <item.icon
                className={cn(
                  "h-4 w-4 transition-transform",
                  isActive && "scale-105"
                )}
              />
              <span className="sr-only">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
