import type { Booking } from "@shared/schema";

const ABACATEPAY_BASE_URL = process.env.ABACATEPAY_BASE_URL || "https://api.abacatepay.com";
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

export function mapAbacateStatusToBooking(status: AbacateStatus | undefined): "pending" | "paid" | "cancelled" {
  if (!status || status === "PENDING") return "pending";
  if (status === "PAID") return "paid";
  return "cancelled";
}

export async function createAbacateBilling(booking: Booking) {
  if (!ABACATEPAY_API_KEY) {
    throw new Error("ABACATEPAY_API_KEY não configurada");
  }

  const amountInCents = Math.round(Number(booking.totalPrice) * 100);

  const payload = {
    amount: amountInCents,
    methods: ["PIX", "CARD"],
    frequency: "ONE_TIME",
    devMode: ABACATEPAY_DEV_MODE,
    metadata: {
      bookingId: booking.id,
      studentId: booking.studentId,
      instructorId: booking.instructorId,
    },
  };

  const res = await fetch(`${ABACATEPAY_BASE_URL}/billing/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ABACATEPAY_API_KEY}`,
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
    paymentDevMode: json.data.devMode ?? ABACATEPAY_DEV_MODE,
  };
}

export async function getAbacateBilling(id: string) {
  if (!ABACATEPAY_API_KEY) {
    throw new Error("ABACATEPAY_API_KEY não configurada");
  }

  const res = await fetch(`${ABACATEPAY_BASE_URL}/billing/get?id=${encodeURIComponent(id)}`, {
    headers: {
      Authorization: `Bearer ${ABACATEPAY_API_KEY}`,
    },
  });

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
