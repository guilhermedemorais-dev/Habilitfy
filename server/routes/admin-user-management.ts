import type { Express, Response } from "express";
import { z } from "zod";
import { and, desc, eq, or } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";
import { db } from "../db";
import { isAuthenticated } from "../auth";
import { storage } from "../storage";
import {
  adminLogs,
  bookings,
  messages,
  supportTickets,
  transactions,
  users,
  userAccessLogs,
  vehicles,
  walletEntries,
  wallets,
  withdrawals,
} from "@shared/schema";
import { kycVerifications as kycVerificationsTable } from "@shared/kyc-schema";

export function registerAdminUserManagementRoutes(app: Express) {
  app.post('/api/admin/users/:id/approve', isAuthenticated, async (req: any, res: Response) => {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    try {
      const userId = req.params.id;
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      await storage.updateUser(userId, { kycStatus: 'approved' });

      if (user.role === 'instructor') {
        const instructor = await storage.getInstructorByUserId(userId);
        if (instructor) {
          await storage.updateInstructor(instructor.id, { status: 'approved' });
        }
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error approving user:", error);
      res.status(500).json({ message: "Failed to approve user" });
    }
  });

  app.post('/api/admin/users/:id/reject', isAuthenticated, async (req: any, res: Response) => {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    try {
      const userId = req.params.id;
      await storage.updateUser(userId, { kycStatus: 'rejected' });

      const user = await storage.getUser(userId);
      if (user?.role === 'instructor') {
        const instructor = await storage.getInstructorByUserId(userId);
        if (instructor) {
          await storage.updateInstructor(instructor.id, { status: 'rejected' });
        }
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error rejecting user:", error);
      res.status(500).json({ message: "Failed to reject user" });
    }
  });

  app.put('/api/admin/users/:id/kyc', isAuthenticated, async (req: any, res: Response) => {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    try {
      const adminId = req.user?.claims?.sub ?? req.user?.id;
      if (!adminId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const payload = z
        .object({
          status: z.enum(["approved", "rejected"]),
          rejectionReason: z.string().trim().max(1000).optional().nullable(),
        })
        .superRefine((value, ctx) => {
          if (value.status === "rejected" && !value.rejectionReason) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["rejectionReason"],
              message: "Rejection reason is required when rejecting KYC",
            });
          }
        })
        .parse(req.body);

      const userId = req.params.id;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      await storage.updateUser(userId, { kycStatus: payload.status });

      const [latestKyc] = await db
        .select()
        .from(kycVerificationsTable)
        .where(eq(kycVerificationsTable.userId, userId))
        .orderBy(desc(kycVerificationsTable.createdAt))
        .limit(1);

      if (latestKyc) {
        await db
          .update(kycVerificationsTable)
          .set({
            status: payload.status,
            rejectionReason:
              payload.status === "rejected" ? payload.rejectionReason ?? null : null,
            reviewedByUserId: adminId,
            reviewedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(kycVerificationsTable.id, latestKyc.id));
      }

      if (user.role === 'instructor') {
        const instructor = await storage.getInstructorByUserId(userId);
        if (instructor) {
          await storage.updateInstructor(instructor.id, { status: payload.status });
        }
      }

      await db.insert(adminLogs).values({
        adminId,
        action: "user_kyc_updated",
        targetId: userId,
        changes: {
          status: payload.status,
          rejectionReason:
            payload.status === "rejected" ? payload.rejectionReason ?? null : null,
        },
      });

      res.json({
        success: true,
        status: payload.status,
        rejectionReason:
          payload.status === "rejected" ? payload.rejectionReason ?? null : null,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.issues[0]?.message || "Invalid payload" });
      }
      console.error("Error updating KYC:", error);
      res.status(500).json({ message: "Failed to update KYC" });
    }
  });

  app.patch('/api/admin/users/:id/notes', isAuthenticated, async (req: any, res: Response) => {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    try {
      const adminId = req.user?.claims?.sub ?? req.user?.id;
      if (!adminId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const targetUserId = req.params.id;
      const targetUser = await storage.getUser(targetUserId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const notes =
        typeof req.body?.notes === "string" ? req.body.notes.trim().slice(0, 5000) : "";
      const updated = await storage.updateUser(targetUserId, {
        adminNotes: notes || null,
        adminNotesUpdatedAt: new Date(),
        adminNotesUpdatedByAdminId: adminId,
      } as any);
      await db.insert(adminLogs).values({
        adminId,
        action: "user_notes_updated",
        targetId: targetUserId,
        changes: { notesLength: notes.length },
      });

      res.json({
        id: updated.id,
        adminNotes: updated.adminNotes || "",
        adminNotesUpdatedAt: updated.adminNotesUpdatedAt,
        adminNotesUpdatedByAdminId: updated.adminNotesUpdatedByAdminId,
      });
    } catch (error) {
      console.error("Error updating user notes:", error);
      res.status(500).json({ message: "Failed to update notes" });
    }
  });

  app.post('/api/admin/users/:id/block', isAuthenticated, async (req: any, res: Response) => {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    try {
      const adminId = req.user?.claims?.sub ?? req.user?.id;
      if (!adminId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const targetUserId = req.params.id;
      if (targetUserId === adminId) {
        return res.status(400).json({ message: "Você não pode bloquear a própria conta." });
      }

      const targetUser = await storage.getUser(targetUserId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }
      if (
        targetUser.role === "admin" &&
        targetUser.adminRole === "master" &&
        req.user.adminRole !== "master"
      ) {
        return res.status(403).json({ message: "Não é permitido bloquear o admin master." });
      }

      const reason =
        typeof req.body?.reason === "string" ? req.body.reason.trim().slice(0, 500) : null;
      const updated = await storage.updateUser(targetUserId, {
        isBlocked: true,
        blockedAt: new Date(),
        blockedReason: reason,
        blockedByAdminId: adminId,
      } as any);
      await db.insert(adminLogs).values({
        adminId,
        action: "user_blocked",
        targetId: targetUserId,
        changes: { reason },
      });

      res.json({
        success: true,
        userId: updated.id,
        isBlocked: updated.isBlocked,
        blockedAt: updated.blockedAt,
        blockedReason: updated.blockedReason,
      });
    } catch (error) {
      console.error("Error blocking user:", error);
      res.status(500).json({ message: "Failed to block user" });
    }
  });

  app.post('/api/admin/users/:id/unblock', isAuthenticated, async (req: any, res: Response) => {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    try {
      const adminId = req.user?.claims?.sub ?? req.user?.id;
      if (!adminId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const targetUserId = req.params.id;
      const targetUser = await storage.getUser(targetUserId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const updated = await storage.updateUser(targetUserId, {
        isBlocked: false,
        blockedAt: null,
        blockedReason: null,
        blockedByAdminId: null,
      } as any);
      await db.insert(adminLogs).values({
        adminId,
        action: "user_unblocked",
        targetId: targetUserId,
        changes: { restoredAccess: true },
      });

      res.json({
        success: true,
        userId: updated.id,
        isBlocked: updated.isBlocked,
      });
    } catch (error) {
      console.error("Error unblocking user:", error);
      res.status(500).json({ message: "Failed to unblock user" });
    }
  });

  app.get('/api/admin/users/:id/review', isAuthenticated, async (req: any, res: Response) => {
    const adminUserId = req.user?.claims?.sub ?? req.user?.id;
    try {
      const adminUser = adminUserId ? await storage.getUser(adminUserId) : null;
      if (adminUser?.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

      const targetUserId = req.params.id;
      const user = await storage.getUser(targetUserId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const sectionErrors: Record<string, string> = {};
      const loadSection = async <T,>(
        key: string,
        fallback: T,
        loader: () => Promise<T>,
      ): Promise<T> => {
        try {
          return await loader();
        } catch (sectionError) {
          console.error(`Error loading review section ${key}:`, sectionError);
          sectionErrors[key] = "Dados parcialmente indisponíveis.";
          return fallback;
        }
      };

      const instructor = await loadSection(
        "instructor",
        null as Awaited<ReturnType<typeof storage.getInstructorByUserId>> | null,
        async () => (await storage.getInstructorByUserId(targetUserId)) || null,
      );
      const latestKyc = await loadSection(
        "kyc",
        null as any,
        async () => {
          const [record] = await db
            .select()
            .from(kycVerificationsTable)
            .where(eq(kycVerificationsTable.userId, targetUserId))
            .orderBy(desc(kycVerificationsTable.createdAt))
            .limit(1);
          return record || null;
        },
      );

      let vehiclesSummary: any = null;
      if (instructor) {
        vehiclesSummary = await loadSection(
          "vehicles",
          null,
          async () => {
            const allVehicles = await db
              .select()
              .from(vehicles)
              .where(eq(vehicles.instructorId, instructor.id))
              .orderBy(desc(vehicles.createdAt));

            return {
              total: allVehicles.length,
              approved: allVehicles.filter((vehicle) => vehicle.status === "approved").length,
              pending: allVehicles.filter((vehicle) => vehicle.status === "pending").length,
              rejected: allVehicles.filter((vehicle) => vehicle.status === "rejected").length,
            };
          },
        );
      }

      res.json({
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          cpf: user.cpf,
          cnpj: user.cnpj,
          phone: user.phone,
          city: user.city,
          state: user.state,
          kycStatus: user.kycStatus,
          isBlocked: user.isBlocked,
          blockedAt: user.blockedAt,
          blockedReason: user.blockedReason,
          adminNotes: user.adminNotes,
          adminNotesUpdatedAt: user.adminNotesUpdatedAt,
          createdAt: user.createdAt,
        },
        instructor,
        latestKyc: latestKyc || null,
        vehiclesSummary,
        sectionErrors,
      });
    } catch (error) {
      console.error("Error loading review data:", error);
      res.status(500).json({ message: "Failed to load review data" });
    }
  });

  app.get('/api/admin/users/:id/finance', isAuthenticated, async (req: any, res: Response) => {
    const adminUserId = req.user?.claims?.sub ?? req.user?.id;
    try {
      const adminUser = adminUserId ? await storage.getUser(adminUserId) : null;
      if (adminUser?.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

      const targetUserId = req.params.id;
      const user = await storage.getUser(targetUserId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const sectionErrors: Record<string, string> = {};
      const loadSection = async <T,>(
        key: string,
        fallback: T,
        loader: () => Promise<T>,
      ): Promise<T> => {
        try {
          return await loader();
        } catch (sectionError) {
          console.error(`Error loading finance section ${key}:`, sectionError);
          sectionErrors[key] = "Dados parcialmente indisponíveis.";
          return fallback;
        }
      };

      const [wallet, entries, userWithdrawals] = await Promise.all([
        loadSection("wallet", null as any, async () => {
          const [walletRecord] = await db
            .select()
            .from(wallets)
            .where(eq(wallets.userId, targetUserId))
            .limit(1);
          return walletRecord ?? null;
        }),
        loadSection("entries", [] as any[], async () =>
          await db
            .select({
              entry: walletEntries,
              booking: bookings,
              transaction: transactions,
            })
            .from(walletEntries)
            .leftJoin(bookings, eq(walletEntries.bookingId, bookings.id))
            .leftJoin(
              transactions,
              eq(walletEntries.transactionId, transactions.id),
            )
            .where(eq(walletEntries.userId, targetUserId))
            .orderBy(desc(walletEntries.createdAt))
            .limit(20),
        ),
        loadSection("withdrawals", [] as any[], async () => {
          const processedBy = alias(users, "processed_by_user");
          return await db
            .select({
              withdrawal: withdrawals,
              processedBy,
            })
            .from(withdrawals)
            .leftJoin(
              processedBy,
              eq(withdrawals.processedByUserId, processedBy.id),
            )
            .where(eq(withdrawals.userId, targetUserId))
            .orderBy(desc(withdrawals.requestedAt))
            .limit(20);
        }),
      ]);

      res.json({
        wallet,
        entries,
        withdrawals: userWithdrawals,
        sectionErrors,
      });
    } catch (error) {
      console.error("Error loading finance data:", error);
      res.status(500).json({ message: "Failed to load finance data" });
    }
  });

  app.get('/api/admin/users/:id/history', isAuthenticated, async (req: any, res: Response) => {
    const adminUserId = req.user?.claims?.sub ?? req.user?.id;
    try {
      const adminUser = adminUserId ? await storage.getUser(adminUserId) : null;
      if (adminUser?.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

      const targetUserId = req.params.id;
      const user = await storage.getUser(targetUserId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const sectionErrors: Record<string, string> = {};
      const loadSection = async <T,>(
        key: string,
        fallback: T,
        loader: () => Promise<T>,
      ): Promise<T> => {
        try {
          return await loader();
        } catch (sectionError) {
          console.error(`Error loading history section ${key}:`, sectionError);
          sectionErrors[key] = "Dados parcialmente indisponíveis.";
          return fallback;
        }
      };

      const supportItems = await loadSection(
        "supportTickets",
        [] as any[],
        async () =>
          await db
            .select()
            .from(supportTickets)
            .where(eq(supportTickets.userId, targetUserId))
            .orderBy(desc(supportTickets.createdAt))
            .limit(50),
      );

      const chatItems = await loadSection(
        "chatHistory",
        [] as any[],
        async () =>
          await db
            .select()
            .from(messages)
            .where(
              or(
                eq(messages.senderId, targetUserId),
                eq(messages.receiverId, targetUserId),
              ),
            )
            .orderBy(desc(messages.createdAt))
            .limit(120),
      );

      const counterpartIds = Array.from(
        new Set(
          chatItems
            .map((item) =>
              item.senderId === targetUserId ? item.receiverId : item.senderId,
            )
            .filter(Boolean),
        ),
      );

      const counterparts = await Promise.all(
        counterpartIds.map(async (id) => {
          try {
            const counterpart = await storage.getUser(id);
            return counterpart
              ? {
                  id: counterpart.id,
                  firstName: counterpart.firstName,
                  lastName: counterpart.lastName,
                  email: counterpart.email,
                  role: counterpart.role,
                }
              : null;
          } catch (counterpartError) {
            console.error("Error loading history counterpart:", counterpartError);
            sectionErrors.chatHistory = "Dados parcialmente indisponíveis.";
            return null;
          }
        }),
      );

      const counterpartMap = new Map(
        counterparts.filter(Boolean).map((item: any) => [item.id, item]),
      );

      const accessLogs = await loadSection(
        "access",
        [] as any[],
        async () =>
          await db
            .select()
            .from(userAccessLogs)
            .where(eq(userAccessLogs.userId, targetUserId))
            .orderBy(desc(userAccessLogs.createdAt))
            .limit(500),
      );

      const adminActionRows = await loadSection(
        "adminActions",
        [] as any[],
        async () =>
          await db
            .select()
            .from(adminLogs)
            .where(eq(adminLogs.targetId, targetUserId))
            .orderBy(desc(adminLogs.createdAt))
            .limit(50),
      );

      const adminActorIds = Array.from(
        new Set(adminActionRows.map((item) => item.adminId).filter(Boolean)),
      );
      const adminActors = await Promise.all(
        adminActorIds.map(async (id) => {
          try {
            const admin = await storage.getUser(id);
            return admin
              ? {
                  id: admin.id,
                  firstName: admin.firstName,
                  lastName: admin.lastName,
                  email: admin.email,
                }
              : null;
          } catch (adminActorError) {
            console.error("Error loading history admin actor:", adminActorError);
            sectionErrors.adminActions = "Dados parcialmente indisponíveis.";
            return null;
          }
        }),
      );
      const adminActorMap = new Map(
        adminActors.filter(Boolean).map((item: any) => [item.id, item]),
      );

      const sortedAccessAsc = [...accessLogs].sort(
        (a, b) =>
          new Date(a.createdAt || 0).getTime() -
          new Date(b.createdAt || 0).getTime(),
      );
      let connectedMs = 0;
      for (let i = 1; i < sortedAccessAsc.length; i++) {
        const prev = new Date(sortedAccessAsc[i - 1].createdAt || 0).getTime();
        const curr = new Date(sortedAccessAsc[i].createdAt || 0).getTime();
        const diff = curr - prev;
        if (diff > 0 && diff <= 30 * 60 * 1000) {
          connectedMs += diff;
        }
      }

      const heatmapCounter = new Map<string, number>();
      const browserCounter = new Map<string, number>();
      const deviceCounter = new Map<string, number>();
      const pathCounter = new Map<string, number>();
      const ipSet = new Set<string>();

      for (const log of accessLogs) {
        const date = new Date(log.createdAt || 0);
        const heatKey = `${date.getDay()}-${date.getHours()}`;
        heatmapCounter.set(heatKey, (heatmapCounter.get(heatKey) || 0) + 1);

        const browser = log.browser || "Unknown";
        const device = log.deviceType || "unknown";
        const path = log.requestPath || "unknown";
        browserCounter.set(browser, (browserCounter.get(browser) || 0) + 1);
        deviceCounter.set(device, (deviceCounter.get(device) || 0) + 1);
        pathCounter.set(path, (pathCounter.get(path) || 0) + 1);
        if (log.ipAddress) ipSet.add(log.ipAddress);
      }

      const maxHeatCount = Math.max(1, ...Array.from(heatmapCounter.values()));
      const chatWithCounterpart = chatItems.map((item) => {
        const counterpartId =
          item.senderId === targetUserId ? item.receiverId : item.senderId;
        return {
          ...item,
          counterpart: counterpartMap.get(counterpartId || "") || null,
        };
      });

      res.json({
        summary: {
          totalRequests: accessLogs.length,
          uniqueIps: ipSet.size,
          firstSeenAt:
            sortedAccessAsc.length > 0 ? sortedAccessAsc[0].createdAt : null,
          lastSeenAt: accessLogs.length > 0 ? accessLogs[0].createdAt : null,
          connectedMinutes: Math.round(connectedMs / 60000),
        },
        access: {
          browserDistribution: Array.from(browserCounter.entries())
            .map(([label, count]) => ({ label, count }))
            .sort((a, b) => b.count - a.count),
          deviceDistribution: Array.from(deviceCounter.entries())
            .map(([label, count]) => ({ label, count }))
            .sort((a, b) => b.count - a.count),
          topPaths: Array.from(pathCounter.entries())
            .map(([path, count]) => ({ path, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 12),
          heatmap: Array.from(heatmapCounter.entries()).map(([key, count]) => {
            const [dayOfWeek, hour] = key.split("-").map(Number);
            return {
              dayOfWeek,
              hour,
              count,
              intensity: count / maxHeatCount,
            };
          }),
          logs: accessLogs.slice(0, 150),
        },
        supportTickets: supportItems,
        supportChatHistory: chatWithCounterpart.filter(
          (item) => item.counterpart?.role === "admin",
        ),
        chatHistory: chatWithCounterpart,
        adminActions: adminActionRows.map((item) => ({
          ...item,
          admin: adminActorMap.get(item.adminId || "") || null,
        })),
        sectionErrors,
      });
    } catch (error) {
      console.error("Error loading history data:", error);
      res.status(500).json({ message: "Failed to load history data" });
    }
  });
}
