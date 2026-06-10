import { describe, expect, it } from "vitest";
import { calculateCapacity } from "./system-capacity";

describe("calculateCapacity", () => {
  it("reports calibrated traffic pressure and remaining headroom", () => {
    const result = calculateCapacity({
      activeSessions: 60,
      requestsPerMinute: 700,
      avgResponseTime: 180,
      errorsLastHour: 0,
      memoryUsedBytes: 400,
      memoryLimitBytes: 1000,
      cpuPercent: 42,
      safeConcurrentUsers: 100,
      safeRequestsPerMinute: 1000,
    });

    expect(result.calibrated).toBe(true);
    expect(result.status).toBe("warning");
    expect(result.utilizationPercent).toBe(70);
    expect(result.headroomPercent).toBe(30);
    expect(result.bottleneck).toBe("traffic");
  });

  it("does not invent a user limit before load-test calibration", () => {
    const result = calculateCapacity({
      activeSessions: 1,
      requestsPerMinute: 2,
      avgResponseTime: 30,
      errorsLastHour: 0,
      memoryUsedBytes: 30,
      memoryLimitBytes: 1024,
      cpuPercent: 2,
    });

    expect(result.calibrated).toBe(false);
    expect(result.safeConcurrentUsers).toBeNull();
    expect(result.safeRequestsPerMinute).toBeNull();
  });
});
