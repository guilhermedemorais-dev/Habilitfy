import type { AdminIntegrationField, AdminUser } from "./types";

export const formatCurrency = (value: number | string | null | undefined) => {
  if (value === null || value === undefined) return "—";
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "—";
  return parsed.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
};

export const formatPersonName = (person?: AdminUser | null) => {
  if (!person) return "—";
  const fullName = [person.firstName, person.lastName].filter(Boolean).join(" ");
  return fullName || person.email || "—";
};

export const formatRoleLabel = (role?: string | null) => {
  const labels: Record<string, string> = {
    student: "Aluno",
    instructor: "Instrutor",
    admin: "Admin",
  };

  if (!role) return "—";
  return labels[role] || role;
};

export const getBookingStatusMeta = (status?: string | null) => {
  const classNames: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    confirmed: "bg-green-100 text-green-700",
    paid: "bg-blue-100 text-blue-700",
    completed: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };

  const labels: Record<string, string> = {
    pending: "Pendente",
    confirmed: "Confirmado",
    paid: "Pago",
    completed: "Concluído",
    cancelled: "Cancelado",
  };

  if (!status) {
    return { label: "—", className: "bg-slate-100 text-slate-600" };
  }

  return {
    label: labels[status] || status,
    className: classNames[status] || "bg-slate-100 text-slate-600",
  };
};

export const getInstructorStatusMeta = (status?: string | null) => {
  const classNames: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
  };

  const labels: Record<string, string> = {
    pending: "Pendente",
    approved: "Aprovado",
    rejected: "Rejeitado",
  };

  if (!status) {
    return { label: "—", className: "bg-slate-100 text-slate-600" };
  }

  return {
    label: labels[status] || status,
    className: classNames[status] || "bg-slate-100 text-slate-600",
  };
};

export const getTransactionStatusMeta = (status?: string | null) => {
  const classNames: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    paid: "bg-green-100 text-green-700",
    processing: "bg-blue-100 text-blue-700",
    refunded: "bg-orange-100 text-orange-700",
    cancelled: "bg-red-100 text-red-700",
    failed: "bg-red-100 text-red-700",
  };

  const labels: Record<string, string> = {
    pending: "Pendente",
    paid: "Pago",
    processing: "Processando",
    refunded: "Reembolsado",
    cancelled: "Cancelado",
    failed: "Falhou",
  };

  if (!status) {
    return { label: "—", className: "bg-slate-100 text-slate-600" };
  }

  return {
    label: labels[status] || status,
    className: classNames[status] || "bg-slate-100 text-slate-600",
  };
};

export const getTransactionTypeLabel = (type?: string | null) => {
  const labels: Record<string, string> = {
    booking: "Agendamento",
    withdrawal: "Saque",
    refund: "Reembolso",
    commission: "Comissao",
    affiliate: "Afiliado",
    coupon: "Cupom",
  };

  if (!type) return "—";
  return labels[type] || type;
};

export const getWithdrawalStatusMeta = (status?: string | null) => {
  const classNames: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    approved: "bg-blue-100 text-blue-700",
    processed: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
  };

  const labels: Record<string, string> = {
    pending: "Pendente",
    approved: "Aprovado",
    processed: "Processado",
    rejected: "Rejeitado",
  };

  if (!status) {
    return { label: "—", className: "bg-slate-100 text-slate-600" };
  }

  return {
    label: labels[status] || status,
    className: classNames[status] || "bg-slate-100 text-slate-600",
  };
};

export const getWalletEntryTypeMeta = (type?: string | null) => {
  const classNames: Record<string, string> = {
    credit: "bg-green-100 text-green-700",
    debit: "bg-red-100 text-red-700",
    refund: "bg-orange-100 text-orange-700",
    withdrawal: "bg-red-100 text-red-700",
    adjustment: "bg-blue-100 text-blue-700",
  };

  const labels: Record<string, string> = {
    credit: "Credito",
    debit: "Debito",
    refund: "Reembolso",
    withdrawal: "Saque",
    adjustment: "Ajuste",
  };

  if (!type) {
    return { label: "—", className: "bg-slate-100 text-slate-600" };
  }

  return {
    label: labels[type] || type,
    className: classNames[type] || "bg-slate-100 text-slate-600",
  };
};

export const getIntegrationStatusMeta = (status?: string | null) => {
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

export const integrationFieldTemplates: AdminIntegrationField[] = [
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
    placeholder: "Mesma chave enviada na query webhookSecret",
  },
  {
    key: "publicKey",
    label: "Public Key",
    type: "secret",
    required: false,
    placeholder: "Chave usada para validar X-Webhook-Signature",
  },
];

export const createIntegrationField = (
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
