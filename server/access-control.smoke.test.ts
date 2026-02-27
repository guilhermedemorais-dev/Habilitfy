import { beforeEach, describe, expect, it, vi } from "vitest";

const { storageMock } = vi.hoisted(() => {
  const storageMock = {
    getUser: vi.fn(async (id: string) => ({
      id,
      role: process.env.LOCAL_USER_ROLE || "student",
      email: "smoke@example.com",
      isBlocked: false,
    })),
  };
  return { storageMock };
});

vi.mock("./storage", () => ({
  storage: storageMock,
}));

import { getSession, requireAdmin } from "./auth";

const createRes = () => {
  const res: any = {};
  res.statusCode = 200;
  res.status = vi.fn((code: number) => {
    res.statusCode = code;
    return res;
  });
  res.json = vi.fn((body: unknown) => {
    res.body = body;
    return res;
  });
  return res;
};

beforeEach(() => {
  process.env.SESSION_SECRET = "test-secret";
  process.env.NODE_ENV = "test";
  delete process.env.AUTH_MODE;
  delete process.env.LOCAL_USER_ROLE;
  delete process.env.E2E_AUTH_BYPASS;
  storageMock.getUser.mockClear();
});

describe("access control smoke", () => {
  it("returns 401 for anonymous request in oidc mode", async () => {
    process.env.AUTH_MODE = "oidc";

    const req: any = {
      path: "/api/admin/integrations",
      originalUrl: "/api/admin/integrations",
      isAuthenticated: () => false,
      user: undefined,
    };
    const res = createRes();
    const next = vi.fn();

    await requireAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 403 for non-admin user in local mode", async () => {
    process.env.AUTH_MODE = "local";
    process.env.LOCAL_USER_ROLE = "student";

    const req: any = {
      path: "/api/admin/integrations",
      originalUrl: "/api/admin/integrations",
      user: undefined,
    };
    const res = createRes();
    const next = vi.fn();

    await requireAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next for admin user in local mode", async () => {
    process.env.AUTH_MODE = "local";
    process.env.LOCAL_USER_ROLE = "admin";

    const req: any = {
      path: "/api/admin/integrations",
      originalUrl: "/api/admin/integrations",
      user: undefined,
    };
    const res = createRes();
    const next = vi.fn();

    await requireAdmin(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalledWith(401);
    expect(res.status).not.toHaveBeenCalledWith(403);
  });

  it("blocks local auth in production runtime", () => {
    process.env.NODE_ENV = "production";
    process.env.AUTH_MODE = "local";

    expect(() => getSession()).toThrow("AUTH_MODE=local is blocked");
  });
});
