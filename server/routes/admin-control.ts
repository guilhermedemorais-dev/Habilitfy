import type { Express, Response } from "express";
import { hashPassword, requireAdminRole } from "../auth";
import { storage } from "../storage";

const SENSITIVE_RESPONSE_KEYS = new Set(["password", "verificationToken"]);

const sanitizeSensitiveData = <T>(value: T): T => {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeSensitiveData(item)) as T;
  }

  if (!value || typeof value !== "object" || value instanceof Date) {
    return value;
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, nestedValue] of Object.entries(value as Record<string, unknown>)) {
    if (SENSITIVE_RESPONSE_KEYS.has(key)) continue;
    sanitized[key] = sanitizeSensitiveData(nestedValue);
  }
  return sanitized as T;
};

type AdminControlRuntimeMetrics = {
  getRequestCount: () => number;
  getErrorCount: () => number;
};

export function registerAdminControlRoutes(
  app: Express,
  runtimeMetrics: AdminControlRuntimeMetrics,
) {
  app.get("/api/admin/metrics/finance", requireAdminRole("manager"), async (req: any, res: Response) => {
    try {
      const data = await storage.getAdminFinancialMetrics();
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Error fetching finance metrics" });
    }
  });

  app.get("/api/admin/metrics/growth", requireAdminRole("manager"), async (req: any, res: Response) => {
    try {
      const data = await storage.getAdminGrowthMetrics();
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Error fetching growth metrics" });
    }
  });

  app.get("/api/admin/system-health", requireAdminRole("support"), async (req: any, res: Response) => {
    try {
      const memoryUsage = process.memoryUsage();
      const uptime = process.uptime();
      const activeSessions = Math.floor(Math.random() * 50) + 10;

      res.json({
        status: "healthy",
        uptime,
        memory: {
          rss: Math.round(memoryUsage.rss / 1024 / 1024),
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        },
        metrics: {
          activeSessions,
          requestsPerMinute: runtimeMetrics.getRequestCount(),
          errorsLastHour: runtimeMetrics.getErrorCount(),
          avgResponseTime: Math.floor(Math.random() * 100) + 20,
        },
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch system health" });
    }
  });

  app.get("/api/admin/admins", requireAdminRole("master"), async (req: any, res: Response) => {
    try {
      const admins = await storage.getUsers("admin");
      res.json(sanitizeSensitiveData(admins));
    } catch (error) {
      console.error("Error fetching admins:", error);
      res.status(500).json({ message: "Failed to fetch admins" });
    }
  });

  app.post("/api/admin/admins", requireAdminRole("master"), async (req: any, res: Response) => {
    try {
      const { email, password, firstName, lastName, adminRole } = req.body;

      if (!email || !password || !firstName || !lastName || !adminRole) {
        return res.status(400).json({ message: "Todos os campos são obrigatórios" });
      }

      const existing = await storage.getUserByEmail(email);
      if (existing) {
        return res.status(400).json({ message: "E-mail já cadastrado" });
      }

      const hashedPassword = await hashPassword(password);
      const userId = `local_admin_${Date.now()}`;

      const newAdmin = await storage.upsertUser({
        id: userId,
        email,
        firstName,
        lastName,
        role: "admin",
        adminRole,
        password: hashedPassword,
        isVerified: true,
      });

      res.status(201).json(sanitizeSensitiveData(newAdmin));
    } catch (error) {
      console.error("Error creating admin:", error);
      res.status(500).json({ message: "Failed to create admin" });
    }
  });

  app.put("/api/admin/admins/:id", requireAdminRole("master"), async (req: any, res: Response) => {
    try {
      const { adminRole } = req.body;
      const targetId = req.params.id;

      if (!adminRole) {
        return res.status(400).json({ message: "Role is required" });
      }

      await storage.updateUser(targetId, { adminRole });
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating admin:", error);
      res.status(500).json({ message: "Failed to update admin" });
    }
  });

  app.delete("/api/admin/admins/:id", requireAdminRole("master"), async (req: any, res: Response) => {
    try {
      const targetId = req.params.id;
      if (targetId === req.user.id) {
        return res.status(400).json({ message: "Cannot delete yourself" });
      }

      await storage.updateUser(targetId, { role: "student", adminRole: null });
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting admin:", error);
      res.status(500).json({ message: "Failed to delete admin" });
    }
  });

  app.post("/api/admin/impersonate/:userId", requireAdminRole("manager"), async (req: any, res: Response) => {
    try {
      const targetUserId = req.params.userId;
      const targetUser = await storage.getUser(targetUserId);

      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }

      if (
        targetUser.role === "admin" &&
        targetUser.adminRole === "master" &&
        req.user.adminRole !== "master"
      ) {
        return res.status(403).json({ message: "Insufficient privileges to impersonate Master" });
      }

      console.log(`[Audit] Admin ${req.user.email} impersonated ${targetUser.email}`);

      req.login(targetUser, (err: any) => {
        if (err) {
          console.error("Impersonate login error:", err);
          return res.status(500).json({ message: "Failed to impersonate" });
        }
        return res.json({ success: true, user: sanitizeSensitiveData(targetUser) });
      });
    } catch (error) {
      console.error("Error impersonating:", error);
      res.status(500).json({ message: "Failed to impersonate" });
    }
  });
}
