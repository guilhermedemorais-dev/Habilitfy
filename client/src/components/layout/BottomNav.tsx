import { Link, useLocation } from "wouter";
import { Home, Map, User, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const [location] = useLocation();

  const navItems = [
    { href: "/", icon: Home, label: "Início" },
    { href: "/instrutores", icon: Map, label: "Mapa" },
    { href: "/dashboard/aluno", icon: Calendar, label: "Aulas" },
    { href: "/dashboard/instrutor", icon: User, label: "Perfil" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2 px-4 z-50 md:hidden pb-safe">
      <div className="flex justify-around items-center">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <a className="flex flex-col items-center gap-1 p-2 w-16">
                <item.icon
                  className={cn(
                    "w-6 h-6 transition-colors",
                    isActive ? "text-primary fill-primary/20" : "text-gray-400"
                  )}
                />
                <span
                  className={cn(
                    "text-[10px] font-medium transition-colors",
                    isActive ? "text-primary" : "text-gray-400"
                  )}
                >
                  {item.label}
                </span>
              </a>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
