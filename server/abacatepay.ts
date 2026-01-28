import type { Booking } from "@shared/schema";

const ABACATEPAY_BASE_URL =
  process.env.ABACATEPAY_BASE_URL || "https://api.abacatepay.com";
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

const resolveAbacateConfig = (overrides?: AbacateConfigOverrides) => {
  const apiKey = overrides?.apiKey ?? ABACATEPAY_API_KEY;
  const baseUrl = overrides?.baseUrl ?? ABACATEPAY_BASE_URL;
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
    amount: amountInCents,
    methods: ["PIX", "CARD"],
    frequency: "ONE_TIME",
    devMode,
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
  secret: string
): boolean {
  const crypto = require("crypto");
  const hmac = crypto.createHmac("sha256", secret);
  const digest = hmac.update(rawBody).digest("hex");
  const signatureBuffer = Buffer.from(signature);
  const digestBuffer = Buffer.from(digest);

  if (signatureBuffer.length !== digestBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(signatureBuffer, digestBuffer);
}
