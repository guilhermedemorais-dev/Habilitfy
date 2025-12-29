import { defineConfig, devices } from "@playwright/test";
import { loadEnvFile } from "./e2e/env";

const envFile = loadEnvFile();
const resolveEnv = (key: string, fallback?: string) =>
  process.env[key] || envFile[key] || fallback;

const port = resolveEnv("E2E_PORT", "5001");
const baseURL = `http://127.0.0.1:${port}`;
const abacateMockPort = resolveEnv("ABACATEPAY_MOCK_PORT", "5555");

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  globalSetup: "./e2e/global-setup.ts",
  webServer: {
    command: "tsx script/e2e-start.ts",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      NODE_ENV: "development",
      HOST: "127.0.0.1",
      PORT: port,
      DATABASE_URL: resolveEnv("DATABASE_URL"),
      SESSION_SECRET: resolveEnv("SESSION_SECRET", "dev-secret-habilitfy"),
      AUTH_MODE: "local",
      LOCAL_USER_ROLE: "admin",
      LOCAL_USER_ID: "e2e-admin",
      LOCAL_USER_EMAIL: "e2e-admin@example.com",
      LOCAL_USER_FIRSTNAME: "E2E",
      LOCAL_USER_LASTNAME: "Admin",
      ABACATEPAY_MOCK_PORT: abacateMockPort,
      ABACATEPAY_BASE_URL: `http://127.0.0.1:${abacateMockPort}`,
      ABACATEPAY_API_KEY: resolveEnv("ABACATEPAY_API_KEY", "e2e-key"),
      ABACATEPAY_DEV_MODE: "true",
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
