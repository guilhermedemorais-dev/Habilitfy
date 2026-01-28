import type { LucideIcon } from "lucide-react";
import { Calendar, Home, Map, MessageCircle, User } from "lucide-react";

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

export const getNavItems = (role?: string): NavItem[] => [
  { href: "/", icon: Home, label: "Inicio" },
  { href: "/chat", icon: MessageCircle, label: "Chat" },
  { href: "/instrutores", icon: Map, label: "Buscar Instrutores" },
  { href: "/dashboard/aluno", icon: Calendar, label: "Minhas Aulas" },
  { href: resolveProfileHref(role), icon: User, label: "Perfil" },
];
