import { defineConfig, devices } from "@playwright/test";
import { loadEnvFile } from "./e2e/env";

const envFile = loadEnvFile();
const resolveEnv = (key: string, fallback?: string) =>
  process.env[key] || envFile[key] || fallback;

const port = resolveEnv("E2E_PORT", "5001");
const host = resolveEnv("E2E_HOST", "127.0.0.1");
const baseHost = resolveEnv("E2E_BASE_HOST", "127.0.0.1");
const baseURL = `http://${baseHost}:${port}`;
const abacateMockPort = resolveEnv("ABACATEPAY_MOCK_PORT", "5501");
const databaseURL =
  process.env.E2E_DATABASE_URL ||
  envFile.E2E_DATABASE_URL ||
  "mysql://habilitfy:habilitfy_dev@127.0.0.1:3306/habilitfy";
const webServerCommand = [
  "NODE_ENV=development",
  "TMPDIR=/tmp/habilitfy-e2e",
  `HOST=${host}`,
  `PORT=${port}`,
  `DATABASE_URL=${databaseURL}`,
  "DB_HOST=127.0.0.1",
  "DB_PORT=3306",
  "DB_USER=habilitfy",
  "DB_PASSWORD=habilitfy_dev",
  "DB_NAME=habilitfy",
  "SESSION_SECRET=dev-secret-habilitfy",
  "AUTH_MODE=local",
  "LOCAL_USER_ROLE=admin",
  "LOCAL_USER_ID=e2e-admin",
  "LOCAL_USER_EMAIL=e2e-admin@example.com",
  "LOCAL_USER_FIRSTNAME=E2E",
  "LOCAL_USER_LASTNAME=Admin",
  `ABACATEPAY_MOCK_PORT=${abacateMockPort}`,
  `ABACATEPAY_BASE_URL=http://${baseHost}:${abacateMockPort}`,
  "ABACATEPAY_API_KEY=e2e-key",
  "ABACATEPAY_DEV_MODE=true",
  "E2E_AUTH_BYPASS=1",
  "/usr/bin/node --import tsx/esm script/e2e-start.ts",
].join(" ");

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  workers: 1,
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
    command: webServerCommand,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      NODE_ENV: "development",
      TMPDIR: "/tmp/habilitfy-e2e",
      HOST: host,
      PORT: port,
      DATABASE_URL: databaseURL,
      DB_HOST: "127.0.0.1",
      DB_PORT: "3306",
      DB_USER: "habilitfy",
      DB_PASSWORD: "habilitfy_dev",
      DB_NAME: "habilitfy",
      SESSION_SECRET: resolveEnv("SESSION_SECRET", "dev-secret-habilitfy"),
      AUTH_MODE: "local",
      LOCAL_USER_ROLE: "admin",
      LOCAL_USER_ID: "e2e-admin",
      LOCAL_USER_EMAIL: "e2e-admin@example.com",
      LOCAL_USER_FIRSTNAME: "E2E",
      LOCAL_USER_LASTNAME: "Admin",
      ABACATEPAY_MOCK_PORT: abacateMockPort,
      ABACATEPAY_BASE_URL: `http://${baseHost}:${abacateMockPort}`,
      ABACATEPAY_API_KEY: resolveEnv("ABACATEPAY_API_KEY", "e2e-key"),
      ABACATEPAY_DEV_MODE: "true",
      E2E_AUTH_BYPASS: "1",
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
