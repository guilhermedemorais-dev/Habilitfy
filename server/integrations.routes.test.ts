import { describe, expect, it } from "vitest";
import {
  maskIntegrationFields,
  mergeSecretIntegrationFields,
  normalizeIntegrationFields,
} from "./integrations.helpers";

describe("integration field helpers", () => {
  it("masks secret fields while preserving non-secret values", () => {
    const result = maskIntegrationFields([
      { key: "apiKey", type: "secret", value: "secret-123" },
      { key: "baseUrl", type: "url", value: "https://api.example.com" },
    ] as any);

    expect(result[0]).toMatchObject({ key: "apiKey", value: "****", hasValue: true });
    expect(result[1]).toMatchObject({ key: "baseUrl", value: "https://api.example.com" });
  });

  it("keeps stored secret when payload sends masked placeholder", () => {
    const incoming = [{ key: "apiKey", type: "secret", value: "****" }] as any;
    const existing = [{ key: "apiKey", type: "secret", value: "secret-123" }] as any;

    const merged = mergeSecretIntegrationFields(incoming, existing);
    expect(merged[0]).toMatchObject({ key: "apiKey", value: "secret-123" });
  });

  it("normalizes and filters invalid field keys", () => {
    const normalized = normalizeIntegrationFields([
      { key: " apiKey ", type: "secret", value: "x", required: true },
      { key: "", type: "text", value: "ignored" },
    ] as any);

    expect(normalized).toHaveLength(1);
    expect(normalized[0]).toMatchObject({ key: "apiKey", type: "secret", required: true });
  });
});
