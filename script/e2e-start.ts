import fs from "fs";
import http from "http";
import path from "path";

const tmpDir = process.env.TMPDIR || "/tmp/habilitfy-e2e";
const builtClient = path.resolve(process.cwd(), "dist/public/index.html");

fs.mkdirSync(tmpDir, { recursive: true });

process.env.TMPDIR = tmpDir;
process.env.TMP = process.env.TMP || tmpDir;
process.env.TEMP = process.env.TEMP || tmpDir;
process.env.HOST = process.env.HOST || "127.0.0.1";
process.env.PORT = process.env.PORT || "5001";
process.env.DB_HOST = process.env.DB_HOST || "127.0.0.1";
process.env.DB_PORT = process.env.DB_PORT || "3306";
process.env.DB_USER = process.env.DB_USER || "habilitfy";
process.env.DB_PASSWORD = process.env.DB_PASSWORD || "habilitfy_dev";
process.env.DB_NAME = process.env.DB_NAME || "habilitfy";
process.env.DATABASE_URL =
  process.env.E2E_DATABASE_URL ||
  process.env.DATABASE_URL ||
  "mysql://habilitfy:habilitfy_dev@127.0.0.1:3306/habilitfy";
process.env.SESSION_SECRET =
  process.env.SESSION_SECRET || "dev-secret-habilitfy";
process.env.NODE_ENV = process.env.NODE_ENV || "development";
process.env.AUTH_MODE = process.env.AUTH_MODE || "local";
process.env.LOCAL_USER_ROLE = process.env.LOCAL_USER_ROLE || "admin";
process.env.LOCAL_USER_ID = process.env.LOCAL_USER_ID || "e2e-admin";
process.env.LOCAL_USER_EMAIL =
  process.env.LOCAL_USER_EMAIL || "e2e-admin@example.com";
process.env.LOCAL_USER_FIRSTNAME = process.env.LOCAL_USER_FIRSTNAME || "E2E";
process.env.LOCAL_USER_LASTNAME = process.env.LOCAL_USER_LASTNAME || "Admin";
process.env.ABACATEPAY_BASE_URL =
  process.env.ABACATEPAY_BASE_URL || "http://127.0.0.1:5501";
process.env.ABACATEPAY_API_KEY = process.env.ABACATEPAY_API_KEY || "e2e-key";
process.env.ABACATEPAY_DEV_MODE = process.env.ABACATEPAY_DEV_MODE || "true";
process.env.E2E_AUTH_BYPASS = process.env.E2E_AUTH_BYPASS || "1";

if (process.env.NODE_ENV === "production" && !fs.existsSync(builtClient)) {
  throw new Error(
    `E2E bootstrap requires ${builtClient}. Run "npm run build" before Playwright/TestSprite local QA.`,
  );
}

const host = process.env.ABACATEPAY_MOCK_HOST || "127.0.0.1";
const port = Number(process.env.ABACATEPAY_MOCK_PORT || "5501");

const jsonResponse = (body: unknown) => JSON.stringify(body);

const mockServer = http.createServer((req, res) => {
  res.setHeader("content-type", "application/json");

  if (req.method === "POST" && req.url === "/billing/create") {
    res.statusCode = 200;
    res.end(
      jsonResponse({
        data: {
          id: `e2e_bill_${Date.now()}`,
          url: "https://example.test/e2e-payment",
          status: "PENDING",
          methods: ["PIX", "CARD"],
          devMode: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      }),
    );
    return;
  }

  if (req.method === "GET" && req.url?.startsWith("/billing/get")) {
    res.statusCode = 200;
    res.end(
      jsonResponse({
        data: {
          id: "e2e_bill_lookup",
          url: "https://example.test/e2e-payment",
          status: "PENDING",
          methods: ["PIX", "CARD"],
          devMode: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      }),
    );
    return;
  }

  res.statusCode = 404;
  res.end(jsonResponse({ error: "not_found" }));
});

mockServer.on("error", (error: NodeJS.ErrnoException) => {
  if (error.code === "EADDRINUSE") {
    console.warn(
      `[e2e] AbacatePay mock already running on http://${host}:${port}, reusing it.`,
    );
    return;
  }

  throw error;
});

mockServer.listen(port, host, () => {
  console.log(`[e2e] AbacatePay mock listening on http://${host}:${port}`);
});

const shutdown = () => {
  if (!mockServer.listening) {
    process.exit(0);
    return;
  }

  mockServer.close(() => process.exit(0));
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

await import("../server/index.ts");
