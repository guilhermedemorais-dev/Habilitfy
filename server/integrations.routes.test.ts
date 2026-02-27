import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

type IntegrationField = {
  key: string;
  type: "text" | "secret" | "url" | "number" | "boolean";
  value?: string | null;
  required?: boolean;
  label?: string | null;
  placeholder?: string | null;
};

type IntegrationRecord = {
  id: string;
  name: string;
  slug: string;
  category: string;
  status: string;
  environment: string;
  isDefault: boolean;
  fields: IntegrationField[];
  createdAt: Date;
  updatedAt: Date;
};

const { integrations, storageMock } = vi.hoisted(() => {
  const integrations: IntegrationRecord[] = [];
  const storageMock = {
    getUser: vi.fn(async (id: string) => ({
      id,
      role: process.env.LOCAL_USER_ROLE || "admin",
      email: "test@example.com",
    })),
    upsertUser: vi.fn(async (data: any) => data),
    getIntegrations: vi.fn(async () => integrations),
    getIntegrationBySlug: vi.fn(async (slug: string, environment?: string) => {
      return (
        integrations.find(
          (item) =>
            item.slug === slug &&
            (!environment || item.environment === environment),
        ) || undefined
      );
    }),
    getIntegration: vi.fn(async (id: string) => {
      return integrations.find((item) => item.id === id);
    }),
    createIntegration: vi.fn(async (data: any) => {
      const now = new Date();
      const record: IntegrationRecord = {
        id: `int-${integrations.length + 1}`,
        name: data.name,
        slug: data.slug,
        category: data.category,
        status: data.status ?? "active",
        environment: data.environment ?? "production",
        isDefault: data.isDefault ?? false,
        fields: data.fields ?? [],
        createdAt: now,
        updatedAt: now,
      };
      integrations.push(record);
      return record;
    }),
    updateIntegration: vi.fn(async (id: string, data: any) => {
      const index = integrations.findIndex((item) => item.id === id);
      if (index === -1) throw new Error("Not found");
      const current = integrations[index];
      const updated: IntegrationRecord = {
        ...current,
        ...data,
        fields: data.fields ?? current.fields,
        updatedAt: new Date(),
      };
      integrations[index] = updated;
      return updated;
    }),
  };

  return { integrations, storageMock };
});

vi.mock("./storage", () => ({
  storage: storageMock,
}));

import { registerRoutes } from "./routes";

const buildApp = async () => {
  process.env.AUTH_MODE = "local";
  process.env.LOCAL_USER_ROLE = process.env.LOCAL_USER_ROLE || "admin";

  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  await registerRoutes(app);
  return app;
};

beforeEach(() => {
  integrations.splice(0, integrations.length);
  storageMock.getIntegrations.mockClear();
  storageMock.getIntegrationBySlug.mockClear();
  storageMock.getIntegration.mockClear();
  storageMock.createIntegration.mockClear();
  storageMock.updateIntegration.mockClear();
});

describe("admin integrations routes", () => {
  it("blocks non-admin users", async () => {
    process.env.LOCAL_USER_ROLE = "student";
    const app = await buildApp();

    const res = await request(app).get("/api/admin/integrations");
    expect(res.status).toBe(403);
  });

  it("lists integrations with masked secrets", async () => {
    process.env.LOCAL_USER_ROLE = "admin";
    const app = await buildApp();

    integrations.push({
      id: "int-1",
      name: "AbacatePay",
      slug: "abacatepay",
      category: "payment",
      status: "active",
      environment: "production",
      isDefault: true,
      fields: [
        {
          key: "apiKey",
          type: "secret",
          value: "secret-123",
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await request(app).get("/api/admin/integrations");
    expect(res.status).toBe(200);
    expect(res.body[0].fields[0].value).toBe("****");
    expect(res.body[0].fields[0].hasValue).toBe(true);
  });

  it("creates integrations and masks secret fields", async () => {
    process.env.LOCAL_USER_ROLE = "admin";
    const app = await buildApp();

    const res = await request(app)
      .post("/api/admin/integrations")
      .send({
        name: "AbacatePay",
        slug: "abacatepay",
        category: "payment",
        status: "active",
        environment: "production",
        isDefault: true,
        fields: [
          { key: "apiKey", type: "secret", value: "secret-123" },
          { key: "baseUrl", type: "url", value: "https://api.example.com" },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.fields[0].value).toBe("****");
    expect(res.body.fields[0].hasValue).toBe(true);
    expect(res.body.fields[1].value).toBe("https://api.example.com");
  });

  it("prevents duplicate slug per environment", async () => {
    process.env.LOCAL_USER_ROLE = "admin";
    const app = await buildApp();

    integrations.push({
      id: "int-1",
      name: "AbacatePay",
      slug: "abacatepay",
      category: "payment",
      status: "active",
      environment: "production",
      isDefault: true,
      fields: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await request(app)
      .post("/api/admin/integrations")
      .send({
        name: "AbacatePay",
        slug: "abacatepay",
        category: "payment",
        status: "active",
        environment: "production",
        isDefault: false,
        fields: [],
      });

    expect(res.status).toBe(409);
  });

  it("keeps secret values when patching with mask", async () => {
    process.env.LOCAL_USER_ROLE = "admin";
    const app = await buildApp();

    integrations.push({
      id: "int-1",
      name: "AbacatePay",
      slug: "abacatepay",
      category: "payment",
      status: "active",
      environment: "production",
      isDefault: true,
      fields: [
        {
          key: "apiKey",
          type: "secret",
          value: "secret-123",
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await request(app)
      .patch("/api/admin/integrations/int-1")
      .send({
        fields: [{ key: "apiKey", type: "secret", value: "****" }],
      });

    expect(res.status).toBe(200);
    expect(integrations[0].fields[0].value).toBe("secret-123");
  });
});
