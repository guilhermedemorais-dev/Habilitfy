import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type AdminSettings = {
  id: string;
  platformFeePercent?: string | null;
  platformFeeType?: "percentage" | "fixed" | null;
  cancellationFeePercent?: string | null;
  cancellationInstructorSharePercent?: string | null;
};

type AdminSettingsSectionProps = {
  isAdmin: boolean;
};

const SETTINGS_QUERY_KEY = ["/api/admin/settings"] as const;

export function AdminSettingsSection({ isAdmin }: AdminSettingsSectionProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [platformFeePercent, setPlatformFeePercent] = useState("0");
  const [platformFeeType, setPlatformFeeType] = useState<"percentage" | "fixed">(
    "percentage",
  );
  const [cancellationFeePercent, setCancellationFeePercent] = useState("0");
  const [cancellationInstructorSharePercent, setCancellationInstructorSharePercent] =
    useState("0");

  const {
    data: adminSettingsData,
    isLoading: adminSettingsLoading,
    error: adminSettingsError,
  } = useQuery<AdminSettings>({
    queryKey: SETTINGS_QUERY_KEY,
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/settings");
      return res.json();
    },
    enabled: isAdmin,
  });

  useEffect(() => {
    if (!adminSettingsData) return;
    setPlatformFeePercent(adminSettingsData.platformFeePercent || "0");
    setPlatformFeeType(adminSettingsData.platformFeeType || "percentage");
    setCancellationFeePercent(adminSettingsData.cancellationFeePercent || "0");
    setCancellationInstructorSharePercent(
      adminSettingsData.cancellationInstructorSharePercent || "0",
    );
  }, [
    adminSettingsData?.platformFeePercent,
    adminSettingsData?.platformFeeType,
    adminSettingsData?.cancellationFeePercent,
    adminSettingsData?.cancellationInstructorSharePercent,
  ]);

  const updateAdminSettings = useMutation({
    mutationFn: async () => {
      const payload = {
        platformFeePercent,
        platformFeeType,
        cancellationFeePercent,
        cancellationInstructorSharePercent,
      };
      const res = await apiRequest("PATCH", "/api/admin/settings", payload);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Configuracoes salvas" });
      queryClient.invalidateQueries({ queryKey: SETTINGS_QUERY_KEY });
    },
    onError: (err: any) => {
      toast({
        title: "Erro ao salvar configuracoes",
        description: err?.message || "Tente novamente",
        variant: "destructive",
      });
    },
  });

  return (
    <section id="taxas" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Taxas</h2>
          <p className="text-sm text-slate-500">
            Configure taxas e cobrancas aplicadas aos fluxos do sistema.
          </p>
        </div>
      </div>

      {!isAdmin ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Acesso restrito. Faça login como admin.
        </div>
      ) : null}

      {adminSettingsError ? (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertTriangle className="h-4 w-4" />
          Erro ao carregar configurações: {(adminSettingsError as Error).message}
        </div>
      ) : null}

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <p className="text-sm font-semibold text-slate-700">
            Taxa de Cobrança da Plataforma
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Comissão cobrada em cada agendamento (split entre instrutor e
            plataforma)
          </p>
        </div>
        <div className="space-y-4 p-6">
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
            <div className="flex items-start gap-2">
              <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                i
              </div>
              <div className="flex-1 space-y-2">
                <p className="text-sm font-semibold text-slate-800">
                  Como funciona a cobrança:
                </p>
                <ul className="ml-1 space-y-1.5 text-xs text-slate-700">
                  <li className="flex gap-2">
                    <span className="font-bold text-blue-600">•</span>
                    <span>
                      <strong>Percentual:</strong> A plataforma retém X% do valor
                      da aula. Ex: aula de R$ 100 com 15% = R$ 15 para
                      plataforma, R$ 85 para instrutor.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-blue-600">•</span>
                    <span>
                      <strong>Valor Fixo:</strong> A plataforma cobra um valor
                      fixo por agendamento. Ex: R$ 5,00 por aula, independente do
                      valor.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-blue-600">•</span>
                    <span>
                      <strong>Liberação:</strong> O valor fica retido até a
                      conclusão da aula (check-in + check-out confirmados).
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label
                htmlFor="platformFeeType"
                className="text-sm font-medium text-slate-700"
              >
                Tipo de Taxa
              </label>
              <Select
                value={platformFeeType}
                onValueChange={(value) =>
                  setPlatformFeeType(value as "percentage" | "fixed")
                }
              >
                <SelectTrigger id="platformFeeType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentual (%)</SelectItem>
                  <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label
                htmlFor="platformFeePercent"
                className="text-sm font-medium text-slate-700"
              >
                {platformFeeType === "percentage"
                  ? "Percentual da Taxa (%)"
                  : "Valor Fixo (R$)"}
              </label>
              <Input
                id="platformFeePercent"
                type="number"
                min={0}
                max={platformFeeType === "percentage" ? 100 : undefined}
                step="0.01"
                value={platformFeePercent}
                onChange={(event) => setPlatformFeePercent(event.target.value)}
              />
              <p className="text-xs text-slate-500">
                {platformFeeType === "percentage"
                  ? "Percentual do valor da aula retido pela plataforma"
                  : "Valor fixo cobrado por agendamento"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <p className="text-sm font-semibold text-slate-700">Cancelamento</p>
        </div>
        <div className="space-y-4 p-6">
          <div className="rounded-lg border border-amber-100 bg-amber-50 p-4">
            <div className="flex items-start gap-2">
              <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-600 text-xs font-bold text-white">
                i
              </div>
              <div className="flex-1 space-y-2">
                <p className="text-sm font-semibold text-slate-800">
                  Como funciona a taxa de cancelamento:
                </p>
                <ul className="ml-1 space-y-1.5 text-xs text-slate-700">
                  <li className="flex gap-2">
                    <span className="font-bold text-amber-600">•</span>
                    <span>
                      <strong>Percentual de cancelamento:</strong> Define quanto o
                      aluno paga ao cancelar. Ex: aula de R$ 100 com 20% = R$ 20
                      de multa.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-amber-600">•</span>
                    <span>
                      <strong>Split da taxa:</strong> Define quanto o instrutor
                      recebe da multa. Ex: 50% = R$ 10 para instrutor, R$ 10 para
                      plataforma.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-amber-600">•</span>
                    <span>
                      <strong>Exemplo completo:</strong> Aula R$ 100, cancelamento
                      20%, split instrutor 60% → Multa R$ 20 (R$ 12 instrutor +
                      R$ 8 plataforma).
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-amber-600">•</span>
                    <span className="text-amber-700">
                      <strong>⚠️ Atenção:</strong> A lógica de aplicação ainda não
                      está implementada no sistema.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label
                htmlFor="cancellationFeePercent"
                className="text-sm font-medium text-slate-700"
              >
                Percentual de cancelamento (%)
              </label>
              <Input
                id="cancellationFeePercent"
                type="number"
                min={0}
                max={100}
                step="0.01"
                value={cancellationFeePercent}
                onChange={(event) =>
                  setCancellationFeePercent(event.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="cancellationInstructorSharePercent"
                className="text-sm font-medium text-slate-700"
              >
                Percentual do instrutor na taxa (%)
              </label>
              <Input
                id="cancellationInstructorSharePercent"
                type="number"
                min={0}
                max={100}
                step="0.01"
                value={cancellationInstructorSharePercent}
                onChange={(event) =>
                  setCancellationInstructorSharePercent(event.target.value)
                }
              />
              <p className="text-xs text-slate-500">
                O restante da taxa fica com a plataforma.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() => updateAdminSettings.mutate()}
              disabled={!isAdmin || updateAdminSettings.isPending}
            >
              {updateAdminSettings.isPending
                ? "Salvando..."
                : "Salvar configuracoes"}
            </Button>
            {adminSettingsLoading ? (
              <span className="text-xs text-slate-400">
                Carregando configuracoes...
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
