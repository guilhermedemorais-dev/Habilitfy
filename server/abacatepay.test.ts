import { describe, it, expect } from "vitest";
import { mapAbacateStatusToBooking } from "./abacatepay";

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
