import type { LucideIcon } from "lucide-react";
import { Calendar, Home, Map, MessageCircle, User } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const navItems: NavItem[] = [
  { href: "/", icon: Home, label: "Inicio" },
  { href: "/chat", icon: MessageCircle, label: "Chat" },
  { href: "/instrutores", icon: Map, label: "Buscar Instrutores" },
  { href: "/dashboard/aluno", icon: Calendar, label: "Minhas Aulas" },
  { href: "/dashboard/instrutor", icon: User, label: "Perfil" },
];
