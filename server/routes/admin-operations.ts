import type { Express, Response } from "express";
import { isAuthenticated } from "../auth";
import { storage } from "../storage";
import { logger } from "../utils/logger";

const parseLimit = (value: unknown, fallback: number, max = 200) => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, 1), max);
};

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

const ensureAdmin = async (req: any, res: Response) => {
  const userId = req.user?.claims?.sub ?? req.user?.id;
  const user = userId ? await storage.getUser(userId) : null;
  if (user?.role !== "admin") {
    res.status(403).json({ message: "Forbidden" });
    return null;
  }
  return user;
};

export function registerAdminOperationsRoutes(app: Express) {
  app.get("/api/admin/vehicles/pending", isAuthenticated, async (req: any, res: Response) => {
    try {
      const user = await ensureAdmin(req, res);
      if (!user) return;

      const vehicles = await storage.getPendingVehicles();
      res.json(vehicles);
    } catch (error) {
      console.error("Error fetching pending vehicles:", error);
      res.status(500).json({ message: "Failed to fetch pending vehicles" });
    }
  });

  app.patch("/api/admin/vehicles/:id/status", isAuthenticated, async (req: any, res: Response) => {
    try {
      const user = await ensureAdmin(req, res);
      if (!user) return;

      const { status, rejectionReason } = req.body;
      if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const vehicle = await storage.updateVehicleStatus(
        req.params.id,
        status,
        rejectionReason,
        user.id,
      );
      res.json(vehicle);
    } catch (error) {
      console.error("Error updating vehicle status:", error);
      res.status(500).json({ message: "Failed to update vehicle status" });
    }
  });

  app.get("/api/admin/instructors/pending", isAuthenticated, async (req: any, res: Response) => {
    try {
      const user = await ensureAdmin(req, res);
      if (!user) return;

      const instructors = await storage.getAllInstructors("pending");
      res.json(instructors);
    } catch (error) {
      console.error("Error fetching pending instructors:", error);
      res.status(500).json({ message: "Failed to fetch pending instructors" });
    }
  });

  app.get("/api/admin/instructors", isAuthenticated, async (req: any, res: Response) => {
    try {
      const user = await ensureAdmin(req, res);
      if (!user) return;

      const status = req.query.status as string | undefined;
      const instructors = await storage.getInstructorsWithUser(status);
      res.json(sanitizeSensitiveData(instructors));
    } catch (error) {
      console.error("Error fetching instructors:", error);
      res.status(500).json({ message: "Failed to fetch instructors" });
    }
  });

  app.get("/api/admin/disputes", isAuthenticated, async (req: any, res: Response) => {
    try {
      const user = await ensureAdmin(req, res);
      if (!user) return;

      const disputes = await storage.getDisputes();
      res.json(disputes);
    } catch (error) {
      console.error("Error fetching disputes:", error);
      res.status(500).json({ message: "Failed to fetch disputes" });
    }
  });

  app.patch("/api/admin/disputes/:id", isAuthenticated, async (req: any, res: Response) => {
    try {
      const user = await ensureAdmin(req, res);
      if (!user) return;

      const status = String(req.body?.status ?? "").trim();
      const resolution = String(req.body?.resolution ?? "").trim();
      if (!status) {
        return res.status(400).json({ message: "Status obrigatorio" });
      }

      const payload: any = { status };
      if (status === "resolved") {
        if (!resolution) {
          return res.status(400).json({ message: "Resolution obrigatoria" });
        }
        payload.resolution = resolution;
        payload.resolvedByUserId = user.id;
        payload.resolvedAt = new Date();
      }

      const updated = await storage.updateDispute(req.params.id, payload);
      res.json(updated);
    } catch (error) {
      console.error("Error updating dispute:", error);
      res.status(500).json({ message: "Failed to update dispute" });
    }
  });

  app.get("/api/admin/bookings", isAuthenticated, async (req: any, res: Response) => {
    try {
      const user = await ensureAdmin(req, res);
      if (!user) return;

      const limit = parseLimit(req.query.limit, 20, 100);
      const bookings = await storage.getAdminBookings(limit);
      res.json(sanitizeSensitiveData(bookings));
    } catch (error) {
      console.error("Error fetching admin bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.get("/api/admin/dashboard", isAuthenticated, async (req: any, res: Response) => {
    try {
      const user = await ensureAdmin(req, res);
      if (!user) return;

      const stats = await storage.getAdminDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get("/api/admin/geo-summary", isAuthenticated, async (req: any, res: Response) => {
    try {
      const user = await ensureAdmin(req, res);
      if (!user) return;

      const state = req.query.state as string | undefined;
      const city = req.query.city as string | undefined;

      const summary = await storage.getAdminGeoSummary({
        state: state && state !== "all" ? state : undefined,
        city: city && city !== "all" ? city : undefined,
      });
      res.json(summary);
    } catch (error) {
      console.error("Error fetching admin geo summary:", error);
      res.status(500).json({ message: "Failed to fetch geo summary" });
    }
  });

  app.get("/api/admin/users", isAuthenticated, async (req: any, res: Response) => {
    try {
      const user = await ensureAdmin(req, res);
      if (!user) return;

      const role = req.query.role as string | undefined;
      const users = await storage.getUsers(role);
      res.json(sanitizeSensitiveData(users));
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.patch("/api/admin/instructors/:id/status", isAuthenticated, async (req: any, res: Response) => {
    try {
      const user = await ensureAdmin(req, res);
      if (!user) return;

      const status = req.body?.status as string | undefined;
      if (!status || !["approved", "rejected", "pending"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const instructor = await storage.updateInstructor(req.params.id, { status: status as any });
      res.json(instructor);
    } catch (error) {
      console.error("Error updating instructor status:", error);
      res.status(500).json({ message: "Failed to update instructor status" });
    }
  });

  app.get("/api/admin/kyc/pending", isAuthenticated, async (req: any, res: Response) => {
    try {
      const user = await ensureAdmin(req, res);
      if (!user) return;

      const pendingUsers = (await storage.getUsers?.()) || [];
      const pending = pendingUsers.filter((entry: any) => entry.kycStatus === "pending");

      res.json({
        verifications: pending.map((entry: any) => ({
          userId: entry.id,
          email: entry.email,
          name: `${entry.firstName || ""} ${entry.lastName || ""}`.trim(),
          status: entry.kycStatus,
          createdAt: entry.createdAt,
        })),
      });
    } catch (error) {
      console.error("Error fetching pending KYC:", error);
      res.status(500).json({ message: "Erro ao buscar verificações pendentes" });
    }
  });

  app.post("/api/admin/kyc/:userId/review", isAuthenticated, async (req: any, res: Response) => {
    try {
      const user = await ensureAdmin(req, res);
      if (!user) return;

      const { userId } = req.params;
      const { action } = req.body;

      if (!["approve", "reject"].includes(action)) {
        return res.status(400).json({ message: "Ação inválida" });
      }

      const newStatus = action === "approve" ? "approved" : "rejected";

      await storage.upsertUser({
        id: userId,
        kycStatus: newStatus as any,
      });

      logger.info(`[KYC] Admin ${user.id} ${action}d KYC for user ${userId}`, {
        adminId: user.id,
        action,
        userId,
      });

      res.json({
        success: true,
        userId,
        status: newStatus,
        reviewedBy: user.id,
      });
    } catch (error) {
      console.error("Error reviewing KYC:", error);
      res.status(500).json({ message: "Erro ao revisar verificação" });
    }
  });
}
