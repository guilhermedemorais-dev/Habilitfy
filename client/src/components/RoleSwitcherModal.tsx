import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, GraduationCap, Car, X, Check } from "lucide-react";
import type { ViewRole } from "@/hooks/useRoleSwitcher";

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
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-x-4 bottom-24 z-[101] mx-auto max-w-sm rounded-3xl bg-white p-6 shadow-2xl"
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 60, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Trocar Visão</h3>
                <p className="text-xs text-gray-500 mt-0.5">Visualize como cada tipo de usuário</p>
              </div>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Role options */}
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
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-200 text-left ${
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
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{description}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Footer note */}
            <p className="text-[10px] text-gray-400 text-center mt-4">
              Apenas visual • Suas permissões reais não mudam
            </p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
