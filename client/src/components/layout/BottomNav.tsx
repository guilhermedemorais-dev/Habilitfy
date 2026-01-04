import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { navItems } from "@/components/layout/navigation";

export function BottomNav() {
  const [location] = useLocation();

  return (
    <nav className="fixed bottom-6 left-4 right-4 z-50 md:hidden">
      <div className="bg-white/90 backdrop-blur-xl border border-white/20 shadow-2xl shadow-blue-900/10 rounded-[2.5rem] py-3 px-2 flex justify-around items-center">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <button
                aria-label={item.label}
                title={item.label}
                className={cn(
                  "flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300",
                  isActive
                    ? "bg-primary text-white shadow-lg shadow-blue-500/30 scale-110 -translate-y-2"
                    : "text-slate-400 hover:text-primary hover:bg-blue-50"
                )}
              >
                <item.icon
                  className={cn(
                    "w-5 h-5 transition-transform",
                    isActive && "scale-110"
                  )}
                />
                <span className="sr-only">{item.label}</span>
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
