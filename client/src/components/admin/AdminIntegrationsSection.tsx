import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Loader2, Plus, RefreshCcw, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type AdminIntegrationField = {
  key: string;
  label?: string | null;
  type: "text" | "secret" | "url" | "number" | "boolean";
  value?: string | null;
  required?: boolean;
  placeholder?: string | null;
  hasValue?: boolean;
};

export type AdminIntegration = {
  id: string;
  name: string;
  slug: string;
  category: string;
  status?: "active" | "inactive" | null;
  environment?: "development" | "production" | null;
  isDefault?: boolean | null;
  fields?: AdminIntegrationField[] | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type IntegrationFormState = {
  name: string;
  slug: string;
  category: string;
  environment: "development" | "production";
  status: "active" | "inactive";
  isDefault: boolean;
  fields: AdminIntegrationField[];
};

type AdminIntegrationsSectionProps = {
  integrations: AdminIntegration[];
  isUnauthorized: boolean;
  searchTerm: string;
  integrationsLoading: boolean;
  integrationsError: unknown;
};

const integrationFieldTemplates: AdminIntegrationField[] = [
  {
    key: "apiKey",
    label: "API Key",
    type: "secret",
    required: true,
    placeholder: "Chave principal da integracao",
  },
  {
    key: "baseUrl",
    label: "Base URL",
    type: "url",
    required: false,
    placeholder: "https://api.exemplo.com",
  },
  {
    key: "devMode",
    label: "Dev Mode",
    type: "boolean",
    required: false,
    placeholder: "true/false",
  },
  {
    key: "webhookSecret",
    label: "Webhook Secret",
    type: "secret",
    required: false,
    placeholder: "Segredo do webhook",
  },
];

const createIntegrationField = (
  overrides?: Partial<AdminIntegrationField>,
): AdminIntegrationField => ({
  key: "",
  label: "",
  type: "text",
  value: "",
  required: false,
  placeholder: "",
  ...overrides,
});

const getIntegrationStatusMeta = (status?: string | null) => {
  const classNames: Record<string, string> = {
    active: "bg-green-100 text-green-700",
    inactive: "bg-slate-100 text-slate-600",
  };

  const labels: Record<string, string> = {
    active: "Ativo",
    inactive: "Inativo",
  };

  if (!status) {
    return { label: "—", className: "bg-slate-100 text-slate-600" };
  }

  return {
    label: labels[status] || status,
    className: classNames[status] || "bg-slate-100 text-slate-600",
  };
};

export function AdminIntegrationsSection({
  integrations,
  isUnauthorized,
  searchTerm,
  integrationsLoading,
  integrationsError,
}: AdminIntegrationsSectionProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [integrationStatusFilter, setIntegrationStatusFilter] = useState("all");
  const [integrationEnvironmentFilter, setIntegrationEnvironmentFilter] =
    useState("all");
  const [integrationForm, setIntegrationForm] = useState<IntegrationFormState>({
    name: "",
    slug: "",
    category: "payment",
    environment: "production",
    status: "active",
    isDefault: true,
    fields: [],
  });
  const [editingIntegrationId, setEditingIntegrationId] = useState<string | null>(
    null,
  );

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const resetIntegrationForm = () => {
    setIntegrationForm({
      name: "",
      slug: "",
      category: "payment",
      environment: "production",
      status: "active",
      isDefault: true,
      fields: [],
    });
    setEditingIntegrationId(null);
  };

  const createIntegration = useMutation({
    mutationFn: async (payload: {
      name: string;
      slug?: string | null;
      category: string;
      status: string;
      environment: string;
      isDefault: boolean;
      fields: AdminIntegrationField[];
    }) => {
      const res = await apiRequest("POST", "/api/admin/integrations", payload);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Integração salva" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/integrations"] });
      resetIntegrationForm();
    },
    onError: (err: any) => {
      toast({
        title: "Erro ao salvar integração",
        description: err?.message || "Tente novamente",
        variant: "destructive",
      });
    },
  });

  const updateIntegration = useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: {
      id: string;
      name?: string;
      slug?: string | null;
      category?: string;
      status?: string;
      environment?: string;
      isDefault?: boolean;
      fields?: AdminIntegrationField[];
    }) => {
      const res = await apiRequest(
        "PATCH",
        `/api/admin/integrations/${id}`,
        payload,
      );
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Integração atualizada" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/integrations"] });
      resetIntegrationForm();
    },
    onError: (err: any) => {
      toast({
        title: "Erro ao atualizar integração",
        description: err?.message || "Tente novamente",
        variant: "destructive",
      });
    },
  });

  const filteredIntegrations = useMemo(() => {
    return integrations.filter((integration) => {
      if (
        integrationStatusFilter !== "all" &&
        integration.status !== integrationStatusFilter
      ) {
        return false;
      }
      if (
        integrationEnvironmentFilter !== "all" &&
        integration.environment !== integrationEnvironmentFilter
      ) {
        return false;
      }

      if (!normalizedSearch) return true;

      const fields = [
        integration.name,
        integration.slug,
        integration.category,
        integration.status,
        integration.environment,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return fields.includes(normalizedSearch);
    });
  }, [
    integrations,
    integrationEnvironmentFilter,
    integrationStatusFilter,
    normalizedSearch,
  ]);

  const addIntegrationField = (preset?: Partial<AdminIntegrationField>) => {
    setIntegrationForm((prev) => ({
      ...prev,
      fields: [...prev.fields, createIntegrationField(preset)],
    }));
  };

  const addTemplateFields = () => {
    setIntegrationForm((prev) => {
      const existingKeys = new Set(prev.fields.map((field) => field.key));
      const additions = integrationFieldTemplates
        .filter((field) => !existingKeys.has(field.key))
        .map((field) => createIntegrationField(field));

      return {
        ...prev,
        fields: [...prev.fields, ...additions],
      };
    });
  };

  const updateIntegrationField = (
    index: number,
    updates: Partial<AdminIntegrationField>,
  ) => {
    setIntegrationForm((prev) => {
      const fields = [...prev.fields];
      fields[index] = { ...fields[index], ...updates };
      return { ...prev, fields };
    });
  };

  const removeIntegrationField = (index: number) => {
    setIntegrationForm((prev) => ({
      ...prev,
      fields: prev.fields.filter((_, fieldIndex) => fieldIndex !== index),
    }));
  };

  const handleIntegrationEdit = (integration: AdminIntegration) => {
    setEditingIntegrationId(integration.id);
    setIntegrationForm({
      name: integration.name || "",
      slug: integration.slug || "",
      category: integration.category || "payment",
      environment:
        (integration.environment as "development" | "production") ||
        "production",
      status: (integration.status as "active" | "inactive") || "inactive",
      isDefault: Boolean(integration.isDefault),
      fields: (integration.fields || []).map((field) =>
        createIntegrationField({
          ...field,
          type: field.type || "text",
          value: field.value ?? "",
          label: field.label ?? "",
          placeholder: field.placeholder ?? "",
          required: Boolean(field.required),
        }),
      ),
    });
  };

  const normalizeIntegrationFields = (fields: AdminIntegrationField[]) =>
    fields
      .map((field) => ({
        key: field.key.trim(),
        label: field.label?.trim() || "",
        type: field.type || "text",
        value: typeof field.value === "string" ? field.value : "",
        required: Boolean(field.required),
        placeholder: field.placeholder?.trim() || "",
      }))
      .filter((field) => field.key.length > 0);

  const handleIntegrationSubmit = () => {
    if (!integrationForm.name.trim()) {
      toast({
        title: "Informe o nome",
        description: "A integração precisa de um nome para cadastro.",
      });
      return;
    }

    const fields = normalizeIntegrationFields(integrationForm.fields);
    const basePayload = {
      name: integrationForm.name.trim(),
      slug: integrationForm.slug.trim() || null,
      category: integrationForm.category.trim() || "payment",
      status: integrationForm.status,
      environment: integrationForm.environment,
      isDefault: integrationForm.isDefault,
      fields,
    };

    if (editingIntegrationId) {
      updateIntegration.mutate({ id: editingIntegrationId, ...basePayload });
      return;
    }

    createIntegration.mutate({
      ...basePayload,
      slug: basePayload.slug || undefined,
    });
  };

  return (
    <section id="integracoes" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Integrações e webhooks
          </h2>
          <p className="text-sm text-slate-500">
            Configure chaves de API e ative integrações do sistema.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={integrationStatusFilter}
            onValueChange={setIntegrationStatusFilter}
          >
            <SelectTrigger className="h-9 w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="inactive">Inativos</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={integrationEnvironmentFilter}
            onValueChange={setIntegrationEnvironmentFilter}
          >
            <SelectTrigger className="h-9 w-[170px]">
              <SelectValue placeholder="Ambiente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos ambientes</SelectItem>
              <SelectItem value="production">Producao</SelectItem>
              <SelectItem value="development">Desenvolvimento</SelectItem>
            </SelectContent>
          </Select>
          <Badge variant="outline" className="text-slate-500">
            {filteredIntegrations.length} integração(ões)
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr,2fr]">
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-700">
                {editingIntegrationId ? "Editar integração" : "Nova integração"}
              </p>
              {editingIntegrationId ? (
                <Button size="sm" variant="ghost" onClick={resetIntegrationForm}>
                  Cancelar edicao
                </Button>
              ) : null}
            </div>
          </div>
          <div className="space-y-4 p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-500">Nome</p>
                <Input
                  placeholder="Ex: AbacatePay, Gov.br, OneSignal"
                  value={integrationForm.name}
                  onChange={(event) =>
                    setIntegrationForm((prev) => ({
                      ...prev,
                      name: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-500">
                  Slug (opcional)
                </p>
                <Input
                  placeholder="abacatepay"
                  value={integrationForm.slug}
                  onChange={(event) =>
                    setIntegrationForm((prev) => ({
                      ...prev,
                      slug: event.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-500">Categoria</p>
                <Input
                  placeholder="payment, kyc, analytics"
                  value={integrationForm.category}
                  onChange={(event) =>
                    setIntegrationForm((prev) => ({
                      ...prev,
                      category: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-500">Ambiente</p>
                <Select
                  value={integrationForm.environment}
                  onValueChange={(value) =>
                    setIntegrationForm((prev) => ({
                      ...prev,
                      environment: value as "development" | "production",
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Ambiente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="production">Producao</SelectItem>
                    <SelectItem value="development">Desenvolvimento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-500">Status</p>
                <Select
                  value={integrationForm.status}
                  onValueChange={(value) =>
                    setIntegrationForm((prev) => ({
                      ...prev,
                      status: value as "active" | "inactive",
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Checkbox
                checked={integrationForm.isDefault}
                onCheckedChange={(value) =>
                  setIntegrationForm((prev) => ({
                    ...prev,
                    isDefault: Boolean(value),
                  }))
                }
              />
              <span className="text-sm text-slate-600">
                Definir como padrão para a categoria
              </span>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs font-semibold text-slate-500">
                  Campos da integração
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" variant="outline" onClick={addTemplateFields}>
                    <Plus className="mr-2 h-4 w-4" />
                    Campos padrão
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => addIntegrationField()}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Novo campo
                  </Button>
                </div>
              </div>
              {integrationForm.fields.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">
                  Adicione campos para armazenar chaves e configurações da
                  integração.
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {integrationForm.fields.map((field, index) => {
                    const inputType =
                      field.type === "secret"
                        ? "password"
                        : field.type === "url"
                          ? "url"
                          : field.type === "number"
                            ? "number"
                            : "text";

                    return (
                      <div
                        key={`${field.key}-${index}`}
                        className="rounded-md border border-slate-200 bg-white p-4"
                      >
                        <div className="grid gap-3 sm:grid-cols-3">
                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-slate-500">
                              Chave
                            </p>
                            <Input
                              placeholder="apiKey"
                              value={field.key}
                              onChange={(event) =>
                                updateIntegrationField(index, {
                                  key: event.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-slate-500">
                              Rotulo
                            </p>
                            <Input
                              placeholder="API Key"
                              value={field.label || ""}
                              onChange={(event) =>
                                updateIntegrationField(index, {
                                  label: event.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-slate-500">
                              Tipo
                            </p>
                            <Select
                              value={field.type}
                              onValueChange={(value) =>
                                updateIntegrationField(index, {
                                  type: value as AdminIntegrationField["type"],
                                })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Tipo" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="text">Texto</SelectItem>
                                <SelectItem value="secret">Segredo</SelectItem>
                                <SelectItem value="url">URL</SelectItem>
                                <SelectItem value="number">Numero</SelectItem>
                                <SelectItem value="boolean">Booleano</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="mt-3 grid gap-3 sm:grid-cols-[1.4fr,1fr,auto]">
                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-slate-500">
                              Valor
                            </p>
                            {field.type === "boolean" ? (
                              <Select
                                value={field.value || ""}
                                onValueChange={(value) =>
                                  updateIntegrationField(index, {
                                    value,
                                  })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="true">true</SelectItem>
                                  <SelectItem value="false">false</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input
                                type={inputType}
                                placeholder="Valor do campo"
                                value={field.value || ""}
                                onChange={(event) =>
                                  updateIntegrationField(index, {
                                    value: event.target.value,
                                  })
                                }
                              />
                            )}
                            {field.type === "secret" && field.hasValue ? (
                              <p className="text-xs text-slate-400">
                                Chave salva. Preencha para substituir.
                              </p>
                            ) : null}
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-slate-500">
                              Placeholder
                            </p>
                            <Input
                              placeholder="Exemplo ou dica"
                              value={field.placeholder || ""}
                              onChange={(event) =>
                                updateIntegrationField(index, {
                                  placeholder: event.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="flex flex-col justify-end gap-2">
                            <label className="flex items-center gap-2 text-xs text-slate-500">
                              <Checkbox
                                checked={Boolean(field.required)}
                                onCheckedChange={(value) =>
                                  updateIntegrationField(index, {
                                    required: Boolean(value),
                                  })
                                }
                              />
                              Obrigatorio
                            </label>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="justify-start text-slate-500"
                              onClick={() => removeIntegrationField(index)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Remover
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button variant="outline" onClick={resetIntegrationForm}>
                Limpar formulario
              </Button>
              <Button
                onClick={handleIntegrationSubmit}
                disabled={createIntegration.isPending || updateIntegration.isPending}
              >
                {editingIntegrationId ? "Atualizar integração" : "Salvar integração"}
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <p className="text-sm font-semibold text-slate-700">
              Integrações cadastradas
            </p>
            <Button
              variant="ghost"
              size="icon"
              title="Recarregar"
              onClick={() =>
                queryClient.invalidateQueries({
                  queryKey: ["/api/admin/integrations"],
                })
              }
            >
              <RefreshCcw className="h-4 w-4" />
            </Button>
          </div>
          <div className="min-h-[120px]">
            {isUnauthorized ? (
              <div className="flex items-center gap-2 p-4 text-sm text-slate-500">
                <AlertTriangle className="h-4 w-4" />
                Acesso restrito. Faça login como admin.
              </div>
            ) : integrationsLoading ? (
              <div className="flex items-center gap-2 p-4 text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" /> Carregando integrações...
              </div>
            ) : integrationsError ? (
              <div className="flex items-center gap-2 p-4 text-sm text-red-600">
                <AlertTriangle className="h-4 w-4" />
                Erro ao carregar integrações:{" "}
                {(integrationsError as Error).message}
              </div>
            ) : filteredIntegrations.length === 0 ? (
              <div className="p-4 text-sm text-slate-500">
                Nenhuma integração cadastrada.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Ambiente</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Padrao</TableHead>
                    <TableHead>Atualizado</TableHead>
                    <TableHead className="text-right">Acoes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIntegrations.map((integration) => {
                    const statusMeta = getIntegrationStatusMeta(integration.status);

                    return (
                      <TableRow key={integration.id}>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span>{integration.name}</span>
                            <span className="text-xs text-slate-400">
                              {integration.slug}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{integration.category || "—"}</TableCell>
                        <TableCell>
                          {integration.environment === "production"
                            ? "Producao"
                            : integration.environment === "development"
                              ? "Desenvolvimento"
                              : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`border-none shadow-none ${statusMeta.className}`}
                          >
                            {statusMeta.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {integration.isDefault ? (
                            <Badge className="bg-blue-100 text-blue-700">
                              Padrao
                            </Badge>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>
                          {integration.updatedAt
                            ? new Date(integration.updatedAt).toLocaleDateString("pt-BR")
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-wrap justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 rounded-md px-3"
                              onClick={() => handleIntegrationEdit(integration)}
                            >
                              Editar
                            </Button>
                            {!integration.isDefault ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 rounded-md px-3"
                                disabled={updateIntegration.isPending}
                                onClick={() =>
                                  updateIntegration.mutate({
                                    id: integration.id,
                                    isDefault: true,
                                  })
                                }
                              >
                                Definir padrao
                              </Button>
                            ) : null}
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 rounded-md px-3"
                              disabled={updateIntegration.isPending}
                              onClick={() =>
                                updateIntegration.mutate({
                                  id: integration.id,
                                  status:
                                    integration.status === "active"
                                      ? "inactive"
                                      : "active",
                                })
                              }
                            >
                              {integration.status === "active" ? "Desativar" : "Ativar"}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
