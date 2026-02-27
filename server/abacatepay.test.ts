import { describe, it, expect } from "vitest";
import { mapAbacateStatusToBooking, verifyAbacateWebhookSignature } from "./abacatepay";
import crypto from "crypto";

describe("mapAbacateStatusToBooking", () => {
  it("maps pending and undefined to pending", () => {
    expect(mapAbacateStatusToBooking(undefined)).toBe("pending");
    expect(mapAbacateStatusToBooking("PENDING")).toBe("pending");
  });

  it("maps paid to paid", () => {
    expect(mapAbacateStatusToBooking("PAID")).toBe("paid");
  });

  it("maps expired and cancelled to cancelled", () => {
    expect(mapAbacateStatusToBooking("EXPIRED")).toBe("cancelled");
    expect(mapAbacateStatusToBooking("CANCELLED")).toBe("cancelled");
  });
});

describe("verifyAbacateWebhookSignature", () => {
  const secret = "test_secret";
  const body = JSON.stringify({ event: "test" });

  it("returns true for valid signature", () => {
    const signature = crypto.createHmac("sha256", secret).update(body).digest("hex");
    expect(verifyAbacateWebhookSignature(body, signature, secret)).toBe(true);
  });

  it("returns false for invalid signature", () => {
    const signature = "invalid_signature";
    expect(verifyAbacateWebhookSignature(body, signature, secret)).toBe(false);
  });

  it("returns false for wrong secret", () => {
    const signature = crypto.createHmac("sha256", "wrong_secret").update(body).digest("hex");
    expect(verifyAbacateWebhookSignature(body, signature, secret)).toBe(false);
  });

  it("returns true for valid base64 signature", () => {
    const signature = crypto.createHmac("sha256", secret).update(body).digest("base64");
    expect(verifyAbacateWebhookSignature(body, signature, secret)).toBe(true);
  });

  it("returns true for valid signature with sha256 prefix", () => {
    const digest = crypto.createHmac("sha256", secret).update(body).digest("hex");
    expect(verifyAbacateWebhookSignature(body, `sha256=${digest}`, secret)).toBe(true);
  });
});
