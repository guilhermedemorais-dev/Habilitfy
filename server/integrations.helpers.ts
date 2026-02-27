export type IntegrationFieldType = "text" | "secret" | "url" | "number" | "boolean";

export type IntegrationField = {
  key: string;
  label?: string | null;
  type: IntegrationFieldType;
  value?: string | null;
  required?: boolean;
  placeholder?: string | null;
  hasValue?: boolean;
};

export const normalizeIntegrationFields = (
  fields: IntegrationField[] | undefined | null,
): IntegrationField[] => {
  if (!Array.isArray(fields)) return [];
  return fields
    .map((field) => ({
      key: String(field.key || "").trim(),
      label: field.label ? String(field.label).trim() : null,
      type: field.type || "text",
      value:
        typeof field.value === "string"
          ? field.value
          : field.value == null
            ? null
            : String(field.value),
      required: Boolean(field.required),
      placeholder: field.placeholder ? String(field.placeholder).trim() : null,
    }))
    .filter((field) => field.key.length > 0);
};

export const maskIntegrationFields = (
  fields: IntegrationField[] | null | undefined,
): IntegrationField[] => {
  if (!Array.isArray(fields)) return [];
  return fields.map((field) => {
    if (field.type !== "secret") return field;
    const hasValue = Boolean(field.value && String(field.value).trim().length > 0);
    return {
      ...field,
      value: hasValue ? "****" : "",
      hasValue,
    };
  });
};

export const mergeSecretIntegrationFields = (
  incoming: IntegrationField[],
  existing: IntegrationField[] | null | undefined,
): IntegrationField[] => {
  if (!Array.isArray(incoming)) return incoming;
  const existingMap = new Map((existing || []).map((field) => [field.key, field]));
  return incoming.map((field) => {
    if (field.type !== "secret") return field;
    const value = typeof field.value === "string" ? field.value.trim() : "";
    if (!value || value === "****") {
      const stored = existingMap.get(field.key);
      return {
        ...field,
        value: stored?.value ?? null,
      };
    }
    return field;
  });
};
