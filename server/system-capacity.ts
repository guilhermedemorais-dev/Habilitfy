import { readFileSync } from "node:fs";
import { cpus, totalmem } from "node:os";

type CapacityInput = {
  activeSessions: number;
  requestsPerMinute: number;
  avgResponseTime: number;
  errorsLastHour: number;
  memoryUsedBytes: number;
  memoryLimitBytes: number;
  cpuPercent: number;
  safeConcurrentUsers?: number;
  safeRequestsPerMinute?: number;
};

const clampPercent = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

export function calculateCapacity(input: CapacityInput) {
  const memoryPercent = clampPercent((input.memoryUsedBytes / Math.max(input.memoryLimitBytes, 1)) * 100);
  const cpuPercent = clampPercent(input.cpuPercent);
  const latencyPercent = clampPercent((input.avgResponseTime / 1000) * 100);
  const errorPercent = clampPercent((input.errorsLastHour / 20) * 100);
  const sessionPercent = input.safeConcurrentUsers
    ? clampPercent((input.activeSessions / input.safeConcurrentUsers) * 100)
    : 0;
  const trafficPercent = input.safeRequestsPerMinute
    ? clampPercent((input.requestsPerMinute / input.safeRequestsPerMinute) * 100)
    : 0;

  const pressure = {
    memory: memoryPercent,
    cpu: cpuPercent,
    latency: latencyPercent,
    errors: errorPercent,
    sessions: sessionPercent,
    traffic: trafficPercent,
  };
  const [bottleneck, utilizationPercent] = Object.entries(pressure).reduce(
    (highest, entry) => entry[1] > highest[1] ? entry : highest,
    ["memory", memoryPercent] as [string, number],
  );
  const calibrated = Boolean(input.safeConcurrentUsers && input.safeRequestsPerMinute);

  return {
    status: utilizationPercent >= 85 ? "critical" : utilizationPercent >= 65 ? "warning" : "healthy",
    calibrated,
    utilizationPercent,
    headroomPercent: Math.max(0, 100 - utilizationPercent),
    bottleneck,
    safeConcurrentUsers: input.safeConcurrentUsers ?? null,
    safeRequestsPerMinute: input.safeRequestsPerMinute ?? null,
    pressure,
  };
}

const readCgroupValue = (path: string) => {
  try {
    return readFileSync(path, "utf8").trim();
  } catch {
    return null;
  }
};

const parsePositiveNumber = (value: string | undefined) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
};

let previousCpuUsage = process.cpuUsage();
let previousCpuSample = process.hrtime.bigint();

export function getRuntimeResources() {
  const memoryCurrent = Number(readCgroupValue("/sys/fs/cgroup/memory.current"));
  const memoryMaxRaw = readCgroupValue("/sys/fs/cgroup/memory.max");
  const memoryMax = memoryMaxRaw && memoryMaxRaw !== "max" ? Number(memoryMaxRaw) : totalmem();

  const cpuMaxRaw = readCgroupValue("/sys/fs/cgroup/cpu.max");
  const [quotaRaw, periodRaw] = cpuMaxRaw?.split(/\s+/) ?? [];
  const quota = Number(quotaRaw);
  const period = Number(periodRaw);
  const cpuLimit = quotaRaw && quotaRaw !== "max" && quota > 0 && period > 0
    ? quota / period
    : cpus().length;

  const currentUsage = process.cpuUsage();
  const currentSample = process.hrtime.bigint();
  const elapsedMicros = Number(currentSample - previousCpuSample) / 1000;
  const usedMicros = currentUsage.user - previousCpuUsage.user + currentUsage.system - previousCpuUsage.system;
  const cpuPercent = elapsedMicros > 0 ? (usedMicros / elapsedMicros / Math.max(cpuLimit, 0.1)) * 100 : 0;
  previousCpuUsage = currentUsage;
  previousCpuSample = currentSample;

  return {
    memoryUsedBytes: Number.isFinite(memoryCurrent) && memoryCurrent > 0
      ? memoryCurrent
      : process.memoryUsage().rss,
    memoryLimitBytes: Number.isFinite(memoryMax) && memoryMax > 0 ? memoryMax : totalmem(),
    cpuPercent,
    cpuLimit,
    safeConcurrentUsers: parsePositiveNumber(process.env.CAPACITY_SAFE_CONCURRENT_USERS),
    safeRequestsPerMinute: parsePositiveNumber(process.env.CAPACITY_SAFE_REQUESTS_PER_MINUTE),
  };
}
