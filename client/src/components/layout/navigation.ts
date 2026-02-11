import type { LucideIcon } from "lucide-react";
import { Calendar, Home, Map, MessageCircle, User, DollarSign } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const resolveProfileHref = (role?: string) => {
  if (role === "admin") return "/admin";
  if (role === "instructor") return "/dashboard/instrutor";
  if (role === "student") return "/dashboard/aluno";
  return "/login";
};

export const getNavItems = (role?: string): NavItem[] => {
  const items = [
    { href: "/", icon: Home, label: "Inicio" },
    { href: "/chat", icon: MessageCircle, label: "Chat" },
    { href: "/mapa", icon: Map, label: "Buscar" },
  ];

  if (role === "instructor") {
    items.push({ href: "/dashboard/instrutor", icon: Calendar, label: "Agenda" });
    items.push({ href: "/dashboard/financeiro", icon: DollarSign, label: "Financeiro" });
  } else {
    items.push({ href: "/dashboard/aluno", icon: Calendar, label: "Minhas Aulas" });
  }

  items.push({ href: resolveProfileHref(role), icon: User, label: "Perfil" });

  return items;
};
