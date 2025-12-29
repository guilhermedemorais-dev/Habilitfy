import { createServer } from "http";
import { randomUUID } from "crypto";
import { URL } from "url";

type BillingRecord = {
  id: string;
  url: string;
  status: "PENDING" | "PAID" | "EXPIRED" | "CANCELLED";
  methods: string[];
  devMode: boolean;
};

const mockPort = Number(process.env.ABACATEPAY_MOCK_PORT || 5555);
const baseUrl = `http://127.0.0.1:${mockPort}`;

if (!process.env.ABACATEPAY_BASE_URL) {
  process.env.ABACATEPAY_BASE_URL = baseUrl;
}
if (!process.env.ABACATEPAY_API_KEY) {
  process.env.ABACATEPAY_API_KEY = "e2e-key";
}
if (!process.env.ABACATEPAY_DEV_MODE) {
  process.env.ABACATEPAY_DEV_MODE = "true";
}

const billings = new Map<string, BillingRecord>();

const mockServer = createServer((req, res) => {
  if (!req.url) {
    res.statusCode = 404;
    res.end();
    return;
  }

  const url = new URL(req.url, baseUrl);

  if (req.method === "POST" && url.pathname === "/billing/create") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      const payload = body ? JSON.parse(body) : {};
      const id = randomUUID();
      const paymentUrl =
        process.env.E2E_PAYMENT_REDIRECT_URL || "/sucesso?paymentId=e2e";

      const record: BillingRecord = {
        id,
        url: paymentUrl,
        status: "PENDING",
        methods: Array.isArray(payload?.methods) ? payload.methods : ["PIX"],
        devMode: process.env.ABACATEPAY_DEV_MODE !== "false",
      };

      billings.set(id, record);

      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          data: {
            id: record.id,
            url: record.url,
            status: record.status,
            methods: record.methods,
            devMode: record.devMode,
            createdAt: new Date().toISOString(),
          },
        }),
      );
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/billing/get") {
    const id = url.searchParams.get("id");
    if (!id || !billings.has(id)) {
      res.statusCode = 404;
      res.end(JSON.stringify({ error: "not_found" }));
      return;
    }

    const record = billings.get(id)!;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        data: {
          id: record.id,
          url: record.url,
          status: record.status,
          methods: record.methods,
          devMode: record.devMode,
          updatedAt: new Date().toISOString(),
        },
      }),
    );
    return;
  }

  res.statusCode = 404;
  res.end(JSON.stringify({ error: "route_not_found" }));
});

mockServer.listen(mockPort, "127.0.0.1", () => {
  console.log(`AbacatePay mock iniciado em ${baseUrl}`);
});

await import("../server/index");
