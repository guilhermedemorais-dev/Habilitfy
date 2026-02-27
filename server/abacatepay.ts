import type { Booking } from "@shared/schema";
import crypto from "node:crypto";

const ABACATEPAY_BASE_URL =
  process.env.ABACATEPAY_BASE_URL || "https://api.abacatepay.com/v1";
const ABACATEPAY_API_KEY = process.env.ABACATEPAY_API_KEY;
const ABACATEPAY_DEV_MODE = process.env.ABACATEPAY_DEV_MODE !== "false"; // default true

type AbacateStatus = "PENDING" | "PAID" | "EXPIRED" | "CANCELLED";

interface AbacateBillingResponse {
  data?: {
    id: string;
    url: string;
    status: AbacateStatus;
    methods?: string[];
    devMode?: boolean;
    createdAt?: string;
    updatedAt?: string;
  };
  error?: unknown;
}

type AbacateConfigOverrides = {
  apiKey?: string | null;
  baseUrl?: string | null;
  devMode?: boolean | null;
};

const normalizeAbacateBaseUrl = (input?: string | null) => {
  const raw = String(input || "").trim();
  if (!raw) return "https://api.abacatepay.com/v1";
  const withoutSlash = raw.replace(/\/+$/, "");
  return /\/v1$/i.test(withoutSlash) ? withoutSlash : `${withoutSlash}/v1`;
};

const resolveAbacateConfig = (overrides?: AbacateConfigOverrides) => {
  const apiKey = overrides?.apiKey ?? ABACATEPAY_API_KEY;
  const baseUrl = normalizeAbacateBaseUrl(
    overrides?.baseUrl ?? ABACATEPAY_BASE_URL,
  );
  const devMode =
    typeof overrides?.devMode === "boolean"
      ? overrides.devMode
      : ABACATEPAY_DEV_MODE;
  return { apiKey, baseUrl, devMode };
};

export function mapAbacateStatusToBooking(status: AbacateStatus | undefined): "pending" | "paid" | "cancelled" {
  if (!status || status === "PENDING") return "pending";
  if (status === "PAID") return "paid";
  return "cancelled";
}

export async function createAbacateBilling(
  booking: Booking,
  overrides?: AbacateConfigOverrides,
) {
  const { apiKey, baseUrl, devMode } = resolveAbacateConfig(overrides);
  if (!apiKey) {
    throw new Error("ABACATEPAY_API_KEY não configurada");
  }

  const amountInCents = Math.round(Number(booking.totalPrice) * 100);

  const payload = {
    // Legacy field still accepted by older integrations.
    amount: amountInCents,
    methods: ["PIX", "CARD"],
    frequency: "ONE_TIME",
    devMode,
    // Current API contract uses products.
    products: [
      {
        externalId: booking.id,
        name: "Aula de direção",
        description: `Agendamento ${booking.id}`,
        quantity: 1,
        price: amountInCents,
      },
    ],
    metadata: {
      bookingId: booking.id,
      studentId: booking.studentId,
      instructorId: booking.instructorId,
    },
  };

  const res = await fetch(`${baseUrl}/billing/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`AbacatePay create failed: ${res.status} ${body}`);
  }

  const json = (await res.json()) as AbacateBillingResponse;
  if (json.error) {
    throw new Error(`AbacatePay error: ${JSON.stringify(json.error)}`);
  }
  if (!json.data) {
    throw new Error("AbacatePay response sem data");
  }

  return {
    paymentId: json.data.id,
    paymentUrl: json.data.url,
    paymentStatus: json.data.status,
    paymentMethods: json.data.methods || ["PIX", "CARD"],
    paymentDevMode: json.data.devMode ?? devMode,
  };
}

export async function getAbacateBilling(
  id: string,
  overrides?: AbacateConfigOverrides,
) {
  const { apiKey, baseUrl } = resolveAbacateConfig(overrides);
  if (!apiKey) {
    throw new Error("ABACATEPAY_API_KEY não configurada");
  }

  const res = await fetch(
    `${baseUrl}/billing/get?id=${encodeURIComponent(id)}`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    },
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`AbacatePay get failed: ${res.status} ${body}`);
  }

  const json = (await res.json()) as AbacateBillingResponse;
  if (json.error) {
    throw new Error(`AbacatePay error: ${JSON.stringify(json.error)}`);
  }
  return json.data;
}

export function verifyAbacateWebhookSignature(
  rawBody: Buffer | string,
  signature: string,
  key: string,
): boolean {
  const cleanSignature = String(signature).trim().replace(/^sha256=/i, "");
  const source =
    typeof rawBody === "string" ? Buffer.from(rawBody) : Buffer.from(rawBody);

  // Supports both historical hex signatures and the current Base64 format.
  const candidates = [
    crypto.createHmac("sha256", key).update(source).digest("hex"),
    crypto.createHmac("sha256", key).update(source).digest("base64"),
  ];

  return candidates.some((candidate) => {
    const a = Buffer.from(cleanSignature);
    const b = Buffer.from(candidate);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  });
}
