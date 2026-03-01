import type { Express, Response } from "express";
import { z } from "zod";
import { isAuthenticated } from "../auth";
import { storage } from "../storage";

const transactionStatusValues = [
  "pending",
  "paid",
  "processing",
  "refunded",
  "cancelled",
  "failed",
] as const;

const transactionTypeValues = [
  "booking",
  "withdrawal",
  "refund",
  "commission",
  "affiliate",
  "coupon",
] as const;

const withdrawalStatusValues = [
  "pending",
  "approved",
  "rejected",
  "processed",
] as const;

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

export function registerAdminFinanceRoutes(app: Express) {
  app.get('/api/admin/finance/summary', isAuthenticated, async (req: any, res: Response) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }

      const summary = await storage.getAdminFinanceSummary();
      res.json(summary);
    } catch (error) {
      console.error("Error fetching admin finance summary:", error);
      res.status(500).json({ message: "Failed to fetch finance summary" });
    }
  });

  app.get('/api/admin/finance/timeseries', isAuthenticated, async (req: any, res: Response) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }

      const status = req.query.status as string | undefined;
      const period = (req.query.period as "day" | "week" | "month" | undefined) ?? "day";
      const days = parseLimit(req.query.days, period === "day" ? 30 : 120, 365);

      if (status && status !== "all" && !transactionStatusValues.includes(status as any)) {
        return res.status(400).json({ message: "Invalid transaction status" });
      }
      if (!["day", "week", "month"].includes(period)) {
        return res.status(400).json({ message: "Invalid period" });
      }

      const series = await storage.getAdminTransactionSeries({
        status: status === "all" ? undefined : status,
        period,
        days,
      });
      res.json(series);
    } catch (error) {
      console.error("Error fetching finance timeseries:", error);
      res.status(500).json({ message: "Failed to fetch finance timeseries" });
    }
  });

  app.get('/api/admin/transactions', isAuthenticated, async (req: any, res: Response) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }

      const status = req.query.status as string | undefined;
      const type = req.query.type as string | undefined;
      const gateway = req.query.gateway as string | undefined;
      const limit = parseLimit(req.query.limit, 30, 100);

      if (status && !transactionStatusValues.includes(status as any)) {
        return res.status(400).json({ message: "Invalid transaction status" });
      }
      if (type && !transactionTypeValues.includes(type as any)) {
        return res.status(400).json({ message: "Invalid transaction type" });
      }

      const transactions = await storage.getAdminTransactions({
        status,
        type,
        gateway,
        limit,
      });
      res.json(sanitizeSensitiveData(transactions));
    } catch (error) {
      console.error("Error fetching admin transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.get('/api/admin/wallets', isAuthenticated, async (req: any, res: Response) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }

      const role = req.query.role as string | undefined;
      const wallets = await storage.getWalletsWithUser(role);
      res.json(sanitizeSensitiveData(wallets));
    } catch (error) {
      console.error("Error fetching admin wallets:", error);
      res.status(500).json({ message: "Failed to fetch wallets" });
    }
  });

  app.get('/api/admin/wallet-entries', isAuthenticated, async (req: any, res: Response) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }

      const walletId = req.query.walletId as string | undefined;
      const userId = req.query.userId as string | undefined;
      const limit = parseLimit(req.query.limit, 20, 200);

      const entries = await storage.getWalletEntries({
        walletId,
        userId,
        limit,
      });
      res.json(sanitizeSensitiveData(entries));
    } catch (error) {
      console.error("Error fetching admin wallet entries:", error);
      res.status(500).json({ message: "Failed to fetch wallet entries" });
    }
  });

  app.get('/api/admin/withdrawals', isAuthenticated, async (req: any, res: Response) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }

      const status = req.query.status as string | undefined;
      const limit = parseLimit(req.query.limit, 20, 200);

      if (status && !withdrawalStatusValues.includes(status as any)) {
        return res.status(400).json({ message: "Invalid withdrawal status" });
      }

      const withdrawals = await storage.getWithdrawals({
        status,
        limit,
      });
      res.json(sanitizeSensitiveData(withdrawals));
    } catch (error) {
      console.error("Error fetching admin withdrawals:", error);
      res.status(500).json({ message: "Failed to fetch withdrawals" });
    }
  });

  app.patch('/api/admin/withdrawals/:id', isAuthenticated, async (req: any, res: Response) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }

      const payload = z
        .object({
          status: z.enum(withdrawalStatusValues),
          notes: z.string().optional(),
        })
        .parse(req.body);

      const updateData: any = {
        status: payload.status,
        notes: payload.notes,
      };

      if (payload.status !== "pending") {
        updateData.processedAt = new Date();
        updateData.processedByUserId = user.id;
      }

      const withdrawal = await storage.updateWithdrawal(req.params.id, updateData);
      res.json(withdrawal);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating withdrawal:", error);
      res.status(500).json({ message: "Failed to update withdrawal" });
    }
  });
}
