import React from "react";
import { Shield, GraduationCap, Car, Check } from "lucide-react";
import type { ViewRole } from "@/hooks/useRoleSwitcher";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface RoleSwitcherModalProps {
  open: boolean;
  onClose: () => void;
  currentViewRole: ViewRole;
  onSelectRole: (role: ViewRole) => void;
}

const roles: { role: ViewRole; label: string; description: string; icon: React.ElementType; color: string; bgColor: string }[] = [
  {
    role: "admin",
    label: "Administrador",
    description: "Painel completo, gestão de usuários e configurações",
    icon: Shield,
    color: "text-purple-600",
    bgColor: "bg-purple-50 border-purple-200 hover:bg-purple-100",
  },
  {
    role: "instructor",
    label: "Instrutor",
    description: "Agenda de aulas, alunos, financeiro e perfil",
    icon: Car,
    color: "text-blue-600",
    bgColor: "bg-blue-50 border-blue-200 hover:bg-blue-100",
  },
  {
    role: "student",
    label: "Aluno",
    description: "Buscar instrutores, agendar aulas e acompanhar progresso",
    icon: GraduationCap,
    color: "text-green-600",
    bgColor: "bg-green-50 border-green-200 hover:bg-green-100",
  },
];

export function RoleSwitcherModal({ open, onClose, currentViewRole, onSelectRole }: RoleSwitcherModalProps) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
      <DialogContent className="z-[120] max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-sm overflow-y-auto rounded-lg p-5 sm:p-6">
        <DialogHeader className="pr-7 text-left">
          <DialogTitle>Trocar conta</DialogTitle>
          <DialogDescription>Visualize a plataforma como cada tipo de usuário.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
              {roles.map(({ role, label, description, icon: Icon, color, bgColor }) => {
                const isActive = currentViewRole === role;
                return (
                  <button
                    key={role}
                    onClick={() => {
                      onSelectRole(role);
                      onClose();
                    }}
                    className={`flex min-h-20 w-full items-center gap-3 rounded-lg border-2 p-3 text-left transition-colors sm:gap-4 sm:p-4 ${
                      isActive
                        ? `${bgColor} border-current ring-2 ring-offset-1 ${color.replace("text-", "ring-")}`
                        : "bg-gray-50 border-gray-100 hover:bg-gray-100"
                    }`}
                  >
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                        isActive ? `${color} bg-white shadow-sm` : "text-gray-400 bg-white"
                      }`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${isActive ? color : "text-gray-900"}`}>
                          {label}
                        </span>
                        {isActive && (
                          <span className={`flex h-5 w-5 items-center justify-center rounded-full ${color} bg-white`}>
                            <Check className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs leading-4 text-gray-500">{description}</p>
                    </div>
                  </button>
                );
              })}
        </div>
        <p className="text-center text-[11px] text-gray-500">
          Apenas visual. Suas permissões reais não mudam.
        </p>
      </DialogContent>
    </Dialog>
  );
}
