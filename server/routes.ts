
import { logger } from "./utils/logger";
import { walletService } from "./services/wallet";
import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { db } from "./db";
import {
  users,
  kycStatusEnum,
  instructors,
  adminLogs,
  messages,
  supportTickets,
  vehicles,
  userAccessLogs,
  User,
} from "@shared/schema";
import { kycVerifications as kycVerificationsTable } from "@shared/kyc-schema";
import { saveBase64Image } from "./kyc";
import { and, desc, eq, or, sql } from "drizzle-orm";
import { setupAuth, isAuthenticated, hashPassword, requireAdminRole } from "./auth";
import { insertInstructorSchema, insertBookingSchema, insertReviewSchema, insertAvailabilitySchema, insertMessageSchema } from "@shared/schema";
import { z } from "zod";
import { createAbacateBilling, getAbacateBilling, mapAbacateStatusToBooking } from "./abacatepay";
import { createStripeCheckoutSession, constructStripeWebhookEvent } from "./stripe";
import rateLimit from "express-rate-limit";
import { storage } from "./storage";
import { cacheMiddleware } from "./cache";
import { invalidateCache } from "./redis";
import { insertVehicleSchema, insertSupportTicketSchema } from "@shared/schema";
import * as crypto from "crypto";
import { sendVerificationEmail } from "./email";
import OpenAI from "openai";


// Trigger server restart for stability check

// Simple in-memory metrics (resets every minute)
let requestCount = 0;
let errorCount = 0;
setInterval(() => { requestCount = 0; errorCount = 0; }, 60000);

// Rate limiters for different types of operations
const bookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // max 10 bookings per IP
  message: { message: 'Muitas tentativas de agendamento. Tente novamente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // max 20 payment attempts per IP
  message: { message: 'Muitas tentativas de pagamento. Tente novamente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // max 100 requests per minute per IP
  message: { message: 'Muitas requisições. Tente novamente em alguns instantes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

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

const gatewayStatusValues = ["active", "inactive"] as const;
const integrationStatusValues = ["active", "inactive"] as const;
const integrationEnvironmentValues = ["development", "production"] as const;
const integrationFieldTypes = ["text", "secret", "url", "number", "boolean"] as const;

const gatewayCreateSchema = z.object({
  provider: z.string().min(1),
  apiKey: z.string().optional().nullable(),
  status: z.enum(gatewayStatusValues).optional().default("active"),
  isDefault: z.boolean().optional().default(false),
});

const gatewayUpdateSchema = z.object({
  provider: z.string().min(1).optional(),
  apiKey: z.string().optional().nullable(),
  status: z.enum(gatewayStatusValues).optional(),
  isDefault: z.boolean().optional(),
});

const integrationFieldSchema = z.object({
  key: z.string().min(1),
  label: z.string().optional().nullable(),
  type: z.enum(integrationFieldTypes).optional().default("text"),
  value: z.string().optional().nullable(),
  required: z.boolean().optional().default(false),
  placeholder: z.string().optional().nullable(),
});

const integrationCreateSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).optional().nullable(),
  category: z.string().min(1).optional().default("payment"),
  status: z.enum(integrationStatusValues).optional().default("active"),
  environment: z.enum(integrationEnvironmentValues)
    .optional()
    .default("production"),
  isDefault: z.boolean().optional().default(false),
  fields: z.array(integrationFieldSchema).optional().default([]),
});

const integrationUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional().nullable(),
  category: z.string().min(1).optional(),
  status: z.enum(integrationStatusValues).optional(),
  environment: z.enum(integrationEnvironmentValues).optional(),
  isDefault: z.boolean().optional(),
  fields: z.array(integrationFieldSchema).optional(),
});

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

const generateSecurityCode = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const maskApiKey = (value?: string | null) => {
  if (!value) return null;
  const trimmed = value.trim();
  if (trimmed.length <= 4) return "****";
  return `**** ${trimmed.slice(-4)} `;
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const normalizeIntegrationFields = (
  fields: Array<z.infer<typeof integrationFieldSchema>> | undefined | null,
) => {
  if (!Array.isArray(fields)) return [];
  return fields
    .map((field) => ({
      key: String(field.key || "").trim(),
      label: field.label ? String(field.label).trim() : null,
      type: field.type || "text",
      value:
        typeof field.value === "string"
          ? field.value
          : field.value == null
            ? null
            : String(field.value),
      required: Boolean(field.required),
      placeholder: field.placeholder ? String(field.placeholder).trim() : null,
    }))
    .filter((field) => field.key.length > 0);
};

const maskIntegrationFields = (
  fields: Array<z.infer<typeof integrationFieldSchema>> | null | undefined,
) => {
  if (!Array.isArray(fields)) return [];
  return fields.map((field) => {
    if (field.type !== "secret") return field;
    const hasValue = Boolean(field.value && String(field.value).trim().length > 0);
    return {
      ...field,
      value: hasValue ? "****" : "",
      hasValue,
    };
  });
};

const mergeSecretIntegrationFields = (
  incoming: Array<z.infer<typeof integrationFieldSchema>>,
  existing: Array<z.infer<typeof integrationFieldSchema>> | null | undefined,
) => {
  if (!Array.isArray(incoming)) return incoming;
  const existingMap = new Map(
    (existing || []).map((field) => [field.key, field]),
  );
  return incoming.map((field) => {
    if (field.type !== "secret") return field;
    const value = typeof field.value === "string" ? field.value.trim() : "";
    if (!value || value === "****") {
      const stored = existingMap.get(field.key);
      return {
        ...field,
        value: stored?.value ?? null,
      };
    }
    return field;
  });
};

type AccessDeviceType = "mobile" | "tablet" | "desktop" | "bot" | "unknown";

const parseUserAgentInfo = (userAgentRaw: string) => {
  const userAgent = (userAgentRaw || "").toLowerCase();
  const browser = userAgent.includes("edg/")
    ? "Edge"
    : userAgent.includes("opr/") || userAgent.includes("opera")
      ? "Opera"
      : userAgent.includes("chrome/")
        ? "Chrome"
        : userAgent.includes("safari/") && !userAgent.includes("chrome/")
          ? "Safari"
          : userAgent.includes("firefox/")
            ? "Firefox"
            : userAgent.includes("postmanruntime")
              ? "Postman"
              : userAgent.includes("curl/")
                ? "curl"
                : "Unknown";

  const os = userAgent.includes("windows")
    ? "Windows"
    : userAgent.includes("android")
      ? "Android"
      : userAgent.includes("iphone") || userAgent.includes("ipad") || userAgent.includes("ios")
        ? "iOS"
        : userAgent.includes("mac os")
          ? "macOS"
          : userAgent.includes("linux")
            ? "Linux"
            : "Unknown";

  let deviceType: AccessDeviceType = "unknown";
  if (
    userAgent.includes("bot") ||
    userAgent.includes("spider") ||
    userAgent.includes("crawler")
  ) {
    deviceType = "bot";
  } else if (userAgent.includes("ipad") || userAgent.includes("tablet")) {
    deviceType = "tablet";
  } else if (
    userAgent.includes("iphone") ||
    userAgent.includes("android") ||
    userAgent.includes("mobile")
  ) {
    deviceType = "mobile";
  } else if (userAgent.length > 0) {
    deviceType = "desktop";
  }

  return { browser, os, deviceType };
};

const resolveClientIp = (req: Request) => {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0];
  }
  return req.ip || null;
};

export async function registerRoutes(app: any, httpServer: Server): Promise<Server> {
  // Middleware for real-time monitoring
  app.use((req: any, res: any, next: any) => {
    requestCount++;
    res.on('finish', () => {
      if (res.statusCode >= 500) {
        errorCount++;
      }
    });
    next();
  });

  await setupAuth(app);

  app.use((req: any, res: any, next: any) => {
    const startedAt = Date.now();

    res.on("finish", () => {
      const userId = req.user?.claims?.sub ?? req.user?.id;
      if (!userId) return;
      if (!req.path?.startsWith("/api")) return;
      if (req.path === "/api/health" || req.path === "/api/ping") return;

      const userAgent = String(req.headers["user-agent"] || "");
      const accessInfo = parseUserAgentInfo(userAgent);
      const durationMs = Date.now() - startedAt;

      void db
        .insert(userAccessLogs)
        .values({
          userId,
          sessionId: req.sessionID || null,
          ipAddress: resolveClientIp(req as Request),
          userAgent,
          deviceType: accessInfo.deviceType,
          browser: accessInfo.browser,
          os: accessInfo.os,
          requestPath: req.path,
          requestMethod: req.method,
          statusCode: res.statusCode,
          requestDurationMs: durationMs,
        })
        .catch((error) => {
          logger.warn(`[access-log] failed to persist: ${error?.message || error}`);
        });
    });

    next();
  });

  app.get('/api/ping', (req: Request, res: Response) => {
    res.json({ message: 'pong', timestamp: new Date().toISOString() });
  });

  // Health check endpoint for Docker and load balancers
  app.get('/api/health', async (req: Request, res: Response) => {
    try {
      // Basic health check
      const healthData = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
      };

      res.status(200).json(healthData);
    } catch (error) {
      res.status(503).json({
        status: 'error',
        message: 'Service unavailable',
        timestamp: new Date().toISOString()
      });
    }
  });

  // --- Capture Session Routes (Remote Photo Capture via QR Code) ---
  app.post('/api/capture-session', async (req: Request, res: Response) => {
    try {
      const sessionToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await storage.createCaptureSession({
        sessionToken,
        expiresAt,
      });

      res.status(201).json({ sessionToken, expiresAt });
    } catch (error) {
      console.error("Error creating capture session:", error);
      res.status(500).json({ message: "Failed to create capture session" });
    }
  });

  app.get('/api/capture-session/:token', async (req: Request, res: Response) => {
    try {
      const session = await storage.getCaptureSession(req.params.token);

      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      if (new Date(session.expiresAt) < new Date()) {
        return res.status(410).json({ error: "Session expired" });
      }

      res.json({
        status: session.status,
        imageData: session.imageData,
      });
    } catch (error) {
      console.error("Error fetching capture session:", error);
      res.status(500).json({ message: "Failed to fetch capture session" });
    }
  });

  app.post('/api/capture-session/:token/upload', async (req: Request, res: Response) => {
    try {
      const { imageData } = req.body;

      if (!imageData || typeof imageData !== 'string') {
        return res.status(400).json({ error: "imageData is required" });
      }

      const session = await storage.getCaptureSession(req.params.token);

      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      if (new Date(session.expiresAt) < new Date()) {
        return res.status(410).json({ error: "Session expired" });
      }

      await storage.updateCaptureSession(req.params.token, {
        imageData,
        status: 'completed',
        updatedAt: new Date(),
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error uploading to capture session:", error);
      res.status(500).json({ message: "Failed to upload image" });
    }
  });

  app.get('/api/auth/user', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any)?.claims?.sub ?? (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const instructorProfile = await storage.getInstructorByUserId(userId);

      const safeUser = sanitizeSensitiveData(user as any);
      res.json({ ...safeUser, instructorProfile });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // --- Admin Routes ---

  app.get('/api/admin/instructors', isAuthenticated, async (req: any, res: Response) => {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    try {
      const instructors = await storage.getAllInstructors();
      const enriched = await Promise.all(
        instructors.map(async (instructor) => {
          const user = await storage.getUser(instructor.userId);
          return {
            ...instructor,
            user: user ? sanitizeSensitiveData(user) : null,
            status: instructor.status, // Ensure status is explicitly returned
            credentialImageUrl: instructor.credentialImageUrl,
            selfieImageUrl: instructor.selfieImageUrl,
            documentImageUrl: instructor.documentImageUrl,
          };
        })
      );
      res.json(enriched);
    } catch (error) {
      console.error("Error fetching admin instructors:", error);
      res.status(500).json({ message: "Failed to fetch instructors" });
    }
  });

  app.get('/api/admin/users', isAuthenticated, async (req: any, res: Response) => {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    try {
      const role = req.query.role as string | undefined;
      const users = await storage.getUsers(role);
      res.json(sanitizeSensitiveData(users));
    } catch (error) {
      console.error("Error fetching admin users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });



  // --- AI Assistant Route (Real) ---
  // Helper function to resolve OpenAI configuration
  const resolveOpenAIIntegrationConfig = async () => {
    const environment =
      process.env.NODE_ENV === "production" ? "production" : "development";
    const integration = await storage.getIntegrationBySlug(
      "openai",
      environment,
    );
    if (!integration || integration.status !== "active") {
      return {};
    }
    const fields = Array.isArray(integration.fields) ? integration.fields : [];
    const readField = (key: string) =>
      fields.find((field) => field.key === key)?.value ?? null;
    const apiKey = readField("apiKey") || readField("api_key");
    const organization = readField("organization");

    return {
      apiKey: apiKey?.trim() || undefined,
      organization: organization?.trim() || undefined,
    };
  };

  app.post('/api/ai/chat', requireAdminRole('support'), async (req: any, res: Response) => {
    try {
      const config = await resolveOpenAIIntegrationConfig();
      const apiKey = config.apiKey || process.env.OPENAI_API_KEY;

      if (!apiKey) {
        // Fail gracefully if no key is configured, but inform user this is a configuration issue
        return res.json({
          role: 'assistant',
          content: '⚠️ Erro de Configuração: A chave da API OpenAI não foi encontrada. Por favor, configure a integração "OpenAI" no menu Configurações > Integrações do Painel Administrativo.'
        });
      }

      const { message } = req.body;
      const openai = new OpenAI({
        apiKey: apiKey,
        organization: config.organization
      });

      const completion = await openai.chat.completions.create({
        messages: [
          { role: "system", content: "Você é o assistente virtual do painel administrativo do HabilitFy. Ajude com dúvidas sobre gestão, instrutores, alunos e financeiro. Seja sucinto e profissional. Ao responder, sempre considere que você está falando com um administrador do sistema." },
          { role: "user", content: message }
        ],
        model: "gpt-4o",
      });

      res.json({
        role: 'assistant',
        content: completion.choices[0].message.content
      });
    } catch (error: any) {
      console.error("AI Error:", error);

      // Handle specific OpenAI errors
      if (error.status === 401) {
        return res.json({
          role: 'assistant',
          content: '⚠️ Erro de Autenticação: A chave da API OpenAI configurada é inválida. Verifique a integração no Painel Admin.'
        });
      }

      res.status(500).json({ message: "Erro ao comunicar com serviço de AI." });
    }
  });

  // --- Real BI Metrics Routes ---

  app.get('/api/admin/metrics/finance', requireAdminRole('manager'), async (req: any, res: Response) => {
    try {
      const data = await storage.getAdminFinancialMetrics();
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Error fetching finance metrics" });
    }
  });

  app.get('/api/admin/metrics/growth', requireAdminRole('manager'), async (req: any, res: Response) => {
    try {
      const data = await storage.getAdminGrowthMetrics();
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Error fetching growth metrics" });
    }
  });

  // --- Admin Management Routes (Master Only) ---

  app.get('/api/admin/system-health', requireAdminRole('support'), async (req: any, res: Response) => {
    try {
      const memoryUsage = process.memoryUsage();
      const uptime = process.uptime();
      // Mock data for demonstration
      const activeSessions = Math.floor(Math.random() * 50) + 10;
      const requestsPerMinute = Math.floor(Math.random() * 200) + 50;
      const errorsLastHour = Math.floor(Math.random() * 5);

      res.json({
        status: 'healthy',
        uptime,
        memory: {
          rss: Math.round(memoryUsage.rss / 1024 / 1024),
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        },
        metrics: {
          activeSessions,
          requestsPerMinute: requestCount, // Real counter
          errorsLastHour: errorCount, // Real counter
          avgResponseTime: Math.floor(Math.random() * 100) + 20 // Latency tracking requires middleware, keeping partial mock for safety
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch system health" });
    }
  });

  app.get('/api/admin/admins', requireAdminRole('master'), async (req: any, res: Response) => {
    try {
      // Fetch users where role is 'admin'
      const admins = await storage.getUsers('admin');
      res.json(sanitizeSensitiveData(admins));
    } catch (error) {
      console.error("Error fetching admins:", error);
      res.status(500).json({ message: "Failed to fetch admins" });
    }
  });

  app.post('/api/admin/admins', requireAdminRole('master'), async (req: any, res: Response) => {
    try {
      const { email, password, firstName, lastName, adminRole } = req.body;

      if (!email || !password || !firstName || !lastName || !adminRole) {
        return res.status(400).json({ message: "Todos os campos são obrigatórios" });
      }

      // Check existing
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
        role: 'admin',
        adminRole, // 'master', 'manager', 'support'
        password: hashedPassword,
        isVerified: true
      });

      res.status(201).json(sanitizeSensitiveData(newAdmin));
    } catch (error) {
      console.error("Error creating admin:", error);
      res.status(500).json({ message: "Failed to create admin" });
    }
  });

  app.put('/api/admin/admins/:id', requireAdminRole('master'), async (req: any, res: Response) => {
    try {
      const { adminRole } = req.body;
      const targetId = req.params.id;

      // Prevent self-demotion if loop prevention needed, but Master can edit Master
      if (!adminRole) return res.status(400).json({ message: "Role is required" });

      await storage.updateUser(targetId, { adminRole });
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating admin:", error);
      res.status(500).json({ message: "Failed to update admin" });
    }
  });

  app.delete('/api/admin/admins/:id', requireAdminRole('master'), async (req: any, res: Response) => {
    try {
      // Soft delete or hard delete? Usually hard delete for admins or deactivation
      // For now, let's just change role to 'student' and adminRole to null (Deactivate admin rights)
      const targetId = req.params.id;
      if (targetId === req.user.id) {
        return res.status(400).json({ message: "Cannot delete yourself" });
      }

      await storage.updateUser(targetId, { role: 'student', adminRole: null });
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting admin:", error);
      res.status(500).json({ message: "Failed to delete admin" });
    }
  });

  // --- Impersonate Route (Manager+) ---
  app.post('/api/admin/impersonate/:userId', requireAdminRole('manager'), async (req: any, res: Response) => {
    try {
      const targetUserId = req.params.userId;
      const targetUser = await storage.getUser(targetUserId);

      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Prevent creating a session for another admin with higher privileges
      if (targetUser.role === 'admin' && targetUser.adminRole === 'master' && req.user.adminRole !== 'master') {
        return res.status(403).json({ message: "Insufficient privileges to impersonate Master" });
      }

      // Log the action (Audit Log placeholder - Fase 2)
      console.log(`[Audit] Admin ${req.user.email} impersonated ${targetUser.email}`);

      // Log in as the target user
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

  app.post('/api/admin/users/:id/approve', isAuthenticated, async (req: any, res: Response) => {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    try {
      const userId = req.params.id;
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      await storage.updateUser(userId, { kycStatus: 'approved' });

      // Also update kyc_verifications table if needed
      // await db.update(kycVerificationsTable).set({ status: 'approved' }).where(eq(kycVerificationsTable.userId, userId));

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
      // await db.update(kycVerificationsTable).set({ status: 'rejected' }).where(eq(kycVerificationsTable.userId, userId));

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
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    try {
      const targetUserId = req.params.id;
      const user = await storage.getUser(targetUserId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const instructor = await storage.getInstructorByUserId(targetUserId);
      const [latestKyc] = await db
        .select()
        .from(kycVerificationsTable)
        .where(eq(kycVerificationsTable.userId, targetUserId))
        .orderBy(desc(kycVerificationsTable.createdAt))
        .limit(1);

      const supportItems = await db
        .select()
        .from(supportTickets)
        .where(eq(supportTickets.userId, targetUserId))
        .orderBy(desc(supportTickets.createdAt))
        .limit(50);

      const chatItems = await db
        .select()
        .from(messages)
        .where(
          or(
            eq(messages.senderId, targetUserId),
            eq(messages.receiverId, targetUserId),
          ),
        )
        .orderBy(desc(messages.createdAt))
        .limit(120);

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
        }),
      );
      const counterpartMap = new Map(
        counterparts.filter(Boolean).map((item: any) => [item.id, item]),
      );

      const accessLogs = await db
        .select()
        .from(userAccessLogs)
        .where(eq(userAccessLogs.userId, targetUserId))
        .orderBy(desc(userAccessLogs.createdAt))
        .limit(500);

      const sortedAccessAsc = [...accessLogs].sort(
        (a, b) =>
          new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime(),
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
        const dayOfWeek = date.getDay();
        const hour = date.getHours();
        const heatKey = `${dayOfWeek}-${hour}`;
        heatmapCounter.set(heatKey, (heatmapCounter.get(heatKey) || 0) + 1);

        const browser = log.browser || "Unknown";
        const device = log.deviceType || "unknown";
        const path = log.requestPath || "unknown";
        browserCounter.set(browser, (browserCounter.get(browser) || 0) + 1);
        deviceCounter.set(device, (deviceCounter.get(device) || 0) + 1);
        pathCounter.set(path, (pathCounter.get(path) || 0) + 1);
        if (log.ipAddress) ipSet.add(log.ipAddress);
      }

      let vehiclesSummary: any = null;
      if (instructor) {
        const allVehicles = await db
          .select()
          .from(vehicles)
          .where(eq(vehicles.instructorId, instructor.id))
          .orderBy(desc(vehicles.createdAt));

        vehiclesSummary = {
          total: allVehicles.length,
          approved: allVehicles.filter((vehicle) => vehicle.status === "approved")
            .length,
          pending: allVehicles.filter((vehicle) => vehicle.status === "pending").length,
          rejected: allVehicles.filter((vehicle) => vehicle.status === "rejected")
            .length,
          items: allVehicles.slice(0, 15),
        };
      }

      const safeUser = {
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
      };

      const chatWithCounterpart = chatItems.map((item) => {
        const counterpartId =
          item.senderId === targetUserId ? item.receiverId : item.senderId;
        return {
          ...item,
          counterpart: counterpartMap.get(counterpartId || "") || null,
        };
      });

      const maxHeatCount = Math.max(
        1,
        ...Array.from(heatmapCounter.values()),
      );
      const heatmap = Array.from(heatmapCounter.entries()).map(([key, count]) => {
        const [dayOfWeek, hour] = key.split("-").map(Number);
        return {
          dayOfWeek,
          hour,
          count,
          intensity: count / maxHeatCount,
        };
      });

      const topPaths = Array.from(pathCounter.entries())
        .map(([path, count]) => ({ path, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 12);

      const browserDistribution = Array.from(browserCounter.entries())
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count);

      const deviceDistribution = Array.from(deviceCounter.entries())
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count);

      res.json({
        user: safeUser,
        instructor,
        latestKyc: latestKyc || null,
        vehiclesSummary,
        supportTickets: supportItems,
        chatHistory: chatWithCounterpart,
        supportChatHistory: chatWithCounterpart.filter(
          (item) => item.counterpart?.role === "admin",
        ),
        access: {
          totalRequests: accessLogs.length,
          uniqueIps: ipSet.size,
          firstSeenAt:
            sortedAccessAsc.length > 0 ? sortedAccessAsc[0].createdAt : null,
          lastSeenAt: accessLogs.length > 0 ? accessLogs[0].createdAt : null,
          connectedMinutes: Math.round(connectedMs / 60000),
          browserDistribution,
          deviceDistribution,
          topPaths,
          heatmap,
          logs: accessLogs.slice(0, 150),
        },
      });
    } catch (error) {
      console.error("Error loading review data:", error);
      res.status(500).json({ message: "Failed to load review data" });
    }
  });

  // --- End Admin Routes ---

  // Register new user (student or instructor)
  // Register new user (student or instructor)
  app.post('/api/users/register', async (req: Request, res: Response) => {
    try {
      const {
        firstName, lastName, fullName, email, cpf, cnpj, phone, addressLine, zipCode, neighborhood, city, state, role,
        birthDate, selfieImageUrl, documentFrontImageUrl, documentBackImageUrl, theoreticalProofImageUrl, licenseImageUrl, isLicensed,
        cnhFrontImageUrl, cnhBackImageUrl, credentialImageUrl,
        password, confirmPassword, googleId
      } = req.body;

      // Validate Google ID if present
      if (googleId) {
        const pendingUser = (req.session as any).pendingGoogleUser;
        if (!pendingUser || pendingUser.googleId !== googleId) {
          return res.status(400).json({ message: 'Erro de validação do Google Login. Tente novamente.' });
        }
      }

      // Validate required fields (Password optional if Google Login)
      if (!firstName || !lastName || !email) {
        return res.status(400).json({ message: 'Nome, sobrenome e e-mail são obrigatórios' });
      }

      if (!googleId) {
        if (!password || !confirmPassword) {
          return res.status(400).json({ message: 'Senha é obrigatória para cadastro via e-mail' });
        }
        if (password !== confirmPassword) {
          return res.status(400).json({ message: 'As senhas não coincidem' });
        }
      }

      const normalizedEmail = String(email || "").toLowerCase().trim();
      const normalizedCpf =
        role !== "instructor" && typeof cpf === "string"
          ? cpf.replace(/\D/g, "")
          : "";
      const normalizedCnpj =
        role === "instructor" && typeof cnpj === "string"
          ? cnpj.replace(/\D/g, "")
          : "";

      const [blockedByEmail] = await db
        .select()
        .from(users)
        .where(
          and(
            sql`lower(${users.email}) = ${normalizedEmail}`,
            eq(users.isBlocked, true),
          ),
        )
        .limit(1);
      if (blockedByEmail) {
        return res.status(403).json({
          message:
            "Cadastro indisponível para este e-mail. Entre em contato com o suporte.",
          code: "ACCOUNT_BLOCKED",
        });
      }

      if (normalizedCpf) {
        const [blockedByCpf] = await db
          .select()
          .from(users)
          .where(and(eq(users.cpf, normalizedCpf), eq(users.isBlocked, true)))
          .limit(1);
        if (blockedByCpf) {
          return res.status(403).json({
            message:
              "Cadastro indisponível para este CPF. Entre em contato com o suporte.",
            code: "ACCOUNT_BLOCKED",
          });
        }
      }

      if (normalizedCnpj) {
        const [blockedByCnpj] = await db
          .select()
          .from(users)
          .where(and(eq(users.cnpj, normalizedCnpj), eq(users.isBlocked, true)))
          .limit(1);
        if (blockedByCnpj) {
          return res.status(403).json({
            message:
              "Cadastro indisponível para este CNPJ. Entre em contato com o suporte.",
            code: "ACCOUNT_BLOCKED",
          });
        }
      }

      // Check if email already exists
      const existingUser = await storage.getUserByEmail?.(normalizedEmail);
      if (existingUser) {
        return res.status(400).json({ message: 'Este e-mail já está cadastrado' });
      }

      // Generate a unique ID
      const userId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const hashedPassword = password ? await hashPassword(password) : undefined;
      const verificationToken = googleId ? null : crypto.randomBytes(32).toString('hex');
      const isVerified = !!googleId; // Google users are verified by default

      // Extract first/last name from fullName if provided (instructor flow)
      const finalFirstName = firstName?.trim() || (fullName ? fullName.split(' ')[0] : '');
      const finalLastName = lastName?.trim() || (fullName ? fullName.split(' ').slice(1).join(' ') : '');

      // 1. Create User
      const newUser = await storage.upsertUser({
        id: userId,
        email: normalizedEmail,
        googleId: googleId || null,
        firstName: finalFirstName,
        lastName: finalLastName,
        cpf: role !== 'instructor' ? (normalizedCpf || null) : null,
        cnpj: role === 'instructor' ? (normalizedCnpj || null) : null,
        phone: phone?.replace(/\D/g, '') || null,
        addressLine: addressLine?.trim() || null,
        zipCode: zipCode?.replace(/\D/g, '') || null,
        neighborhood: neighborhood?.trim() || null,
        city: city?.trim() || null,
        state: state?.trim() || null,
        role: role === 'instructor' ? 'instructor' : 'student',
        kycStatus: 'pending',
        password: hashedPassword,
        isVerified: isVerified,
        verificationToken: verificationToken,
      });

      // Clear pending session if successful
      if (googleId) {
        delete (req.session as any).pendingGoogleUser;
      } else if (email && verificationToken) {
        // Send verification email for manual signups
        // Don't await to avoid blocking the response if SMTP is slow
        sendVerificationEmail(email, verificationToken).catch(err => {
          console.error("Failed to send verification email:", err);
        });
      }

      // 2. Process KYC Documents and Instructor Images
      let savedSelfieUrl = null;
      let savedDocumentFrontUrl = null;
      let savedDocumentBackUrl = null;

      // Instructor specific images
      let savedCredentialImageUrl = null;
      let savedCnhFrontImageUrl = null;
      let savedCnhBackImageUrl = null;
      let savedVehicleAuthorizationImageUrl = null;
      let savedVehicleImageUrl = null;
      let savedVehicleDocImageUrl = null;
      let savedVehiclePlateImageUrl = null;

      if (selfieImageUrl) {
        savedSelfieUrl = await saveBase64Image(selfieImageUrl, userId, 'selfie');
      }
      if (documentFrontImageUrl) {
        savedDocumentFrontUrl = await saveBase64Image(documentFrontImageUrl, userId, 'document_front');
      }
      if (documentBackImageUrl) {
        savedDocumentBackUrl = await saveBase64Image(documentBackImageUrl, userId, 'document_back');
      }

      if (role === 'instructor') {
        const { vehicleAuthorizationImageUrl, vehicleImageUrl, vehicleDocImageUrl, vehiclePlateImageUrl } = req.body;

        // CNH images
        if (cnhFrontImageUrl) savedCnhFrontImageUrl = await saveBase64Image(cnhFrontImageUrl, userId, 'cnh_front');
        if (cnhBackImageUrl) savedCnhBackImageUrl = await saveBase64Image(cnhBackImageUrl, userId, 'cnh_back');

        // Other instructor docs
        if (credentialImageUrl) savedCredentialImageUrl = await saveBase64Image(credentialImageUrl, userId, 'credential');
        if (vehicleAuthorizationImageUrl) savedVehicleAuthorizationImageUrl = await saveBase64Image(vehicleAuthorizationImageUrl, userId, 'vehicle_auth');
        if (vehicleImageUrl) savedVehicleImageUrl = await saveBase64Image(vehicleImageUrl, userId, 'vehicle');
        if (vehicleDocImageUrl) savedVehicleDocImageUrl = await saveBase64Image(vehicleDocImageUrl, userId, 'vehicle_doc');
        if (vehiclePlateImageUrl) savedVehiclePlateImageUrl = await saveBase64Image(vehiclePlateImageUrl, userId, 'vehicle_plate');
      }

      // 3. Create KYC Verification Record
      if (savedSelfieUrl || savedDocumentFrontUrl) {
        await db.insert(kycVerificationsTable).values({
          userId: userId,
          selfieUrl: savedSelfieUrl,
          documentFrontUrl: savedDocumentFrontUrl,
          documentBackUrl: savedDocumentBackUrl,
          status: 'pending',
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        });
      }

      // 4. Create Instructor Record if role is instructor
      if (role === 'instructor') {
        const {
          bio, pricePerHour, vehicleModel, vehicleYear, vehicleType, vehiclePlate,
          credentialNumber, documentNumber
        } = req.body;

        await storage.createInstructor({
          userId: userId,
          bio: bio || "",
          pricePerHour: pricePerHour ? Number(pricePerHour) : 0,
          vehicleModel: vehicleModel || "",
          vehicleYear: vehicleYear || "",
          vehicleType: vehicleType || "",
          vehiclePlate: vehiclePlate || "",
          credentialNumber: credentialNumber || "",
          documentNumber: documentNumber || "",
          selfieImageUrl: savedSelfieUrl,
          documentImageUrl: savedDocumentFrontUrl,
          cnhFrontImageUrl: savedCnhFrontImageUrl,
          cnhBackImageUrl: savedCnhBackImageUrl,
          credentialImageUrl: savedCredentialImageUrl,
          vehicleAuthorizationImageUrl: savedVehicleAuthorizationImageUrl,
          vehicleImageUrl: savedVehicleImageUrl,
          vehicleDocImageUrl: savedVehicleDocImageUrl,
          vehiclePlateImageUrl: savedVehiclePlateImageUrl,
          status: "pending",
          maxBookingsPerStudent: 0
        });
      }

      logger.info(`[register] User created: ${userId} (${email})`, { userId, email });

      // Auto-login
      req.login(newUser, (err: any) => {
        if (err) {
          console.error("Auto-login failed:", err);
          // Return success even if auto-login fails, frontend should handle redirect to login
          return res.status(201).json({
            success: true,
            message: 'Cadastro realizado com sucesso',
            user: {
              id: userId,
              email: email,
              firstName: firstName,
              lastName: lastName,
              role: role || 'student',
            },
          });
        }
        return res.status(201).json({
          success: true,
          message: 'Cadastro realizado com sucesso',
          user: {
            id: userId,
            email: email,
            firstName: firstName,
            lastName: lastName,
            role: role || 'student',
          },
        });
      });
    } catch (error: any) {
      logger.error(`[register] Error registering user: ${error?.message || error}`, { stack: error?.stack });
      res.status(500).json({ message: error?.message || 'Erro ao criar conta' });
    }
  });

  app.post("/api/auth/verify-email", async (req: Request, res: Response) => {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({ message: "Token de verificação não fornecido" });
      }

      // Using direct DB query for now to avoid altering storage interface again in this step
      // Ideally update storage interface.
      // const usersTable = (await import("@shared/schema")).users; // users is already imported
      const [user] = await db.select().from(users).where(eq(users.verificationToken, token));

      if (!user) {
        return res.status(400).json({ message: "Token inválido ou expirado" });
      }

      await storage.updateUser(user.id, {
        isVerified: true,
        verificationToken: null, // Clear token after use
      });

      res.status(200).json({ message: "E-mail verificado com sucesso!" });
    } catch (error) {
      console.error("Email verification error:", error);
      res.status(500).json({ message: "Erro ao verificar e-mail" });
    }
  });

  app.patch('/api/users/me', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user?.claims?.sub ?? req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const payload = {
        firstName: typeof req.body?.firstName === "string" ? req.body.firstName.trim() : undefined,
        lastName: typeof req.body?.lastName === "string" ? req.body.lastName.trim() : undefined,
        cpf: typeof req.body?.cpf === "string" ? req.body.cpf.trim() : undefined,
        phone: typeof req.body?.phone === "string" ? req.body.phone.trim() : undefined,
        addressLine:
          typeof req.body?.addressLine === "string" ? req.body.addressLine.trim() : undefined,
        zipCode: typeof req.body?.zipCode === "string" ? req.body.zipCode.trim() : undefined,
        neighborhood:
          typeof req.body?.neighborhood === "string" ? req.body.neighborhood.trim() : undefined,
        city: typeof req.body?.city === "string" ? req.body.city.trim() : undefined,
        state: typeof req.body?.state === "string" ? req.body.state.trim() : undefined,
        // Campos adicionais do cadastro de aluno
        birthDate: typeof req.body?.birthDate === "string" ? req.body.birthDate.trim() : undefined,
        selfieImageUrl: typeof req.body?.selfieImageUrl === "string" ? req.body.selfieImageUrl : undefined,
        documentImageUrl: typeof req.body?.documentImageUrl === "string" ? req.body.documentImageUrl : undefined,
        theoreticalProofImageUrl: req.body?.theoreticalProofImageUrl !== undefined ? req.body.theoreticalProofImageUrl : undefined,
        licenseImageUrl: req.body?.licenseImageUrl !== undefined ? req.body.licenseImageUrl : undefined,
        isLicensed: typeof req.body?.isLicensed === "boolean" ? req.body.isLicensed : undefined,
      };

      const updated = await storage.updateUser(userId, payload);
      res.json(sanitizeSensitiveData(updated));
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.get('/api/instructors', cacheMiddleware(60), async (req: Request, res: Response) => {
    try {
      const status = req.query.status as string | undefined;
      const instructors = await storage.getAllInstructors(status || 'approved');
      const enriched = await Promise.all(
        instructors.map(async (instructor) => {
          const user = await storage.getUser(instructor.userId);
          const name =
            `${user?.firstName || ""} ${user?.lastName || ""} `.trim() ||
            user?.email ||
            "Instrutor";
          const vehicle = `${instructor.vehicleModel} ${instructor.vehicleYear || ""} `.trim();
          return {
            // Only safe, public fields
            id: instructor.id,
            userId: instructor.userId,
            bio: instructor.bio,
            pricePerHour: instructor.pricePerHour,
            slotDurationMinutes: instructor.slotDurationMinutes,
            maxBookingsPerStudent: instructor.maxBookingsPerStudent,
            vehicleModel: instructor.vehicleModel,
            vehicleYear: instructor.vehicleYear,
            vehicleType: instructor.vehicleType,
            vehiclePlate: instructor.vehiclePlate,
            vehicleImageUrl: instructor.vehicleImageUrl,
            rating: instructor.rating,
            reviewsCount: instructor.reviewsCount,
            lat: instructor.lat,
            lng: instructor.lng,
            neighborhood: instructor.neighborhood,
            city: instructor.city,
            state: instructor.state,
            status: instructor.status,
            yearsExperience: instructor.yearsExperience,
            languages: instructor.languages,
            specialties: instructor.specialties,
            workingHours: instructor.workingHours,
            responseTime: instructor.responseTime,
            galleryImages: instructor.galleryImages,
            lessonsCompleted: instructor.lessonsCompleted,
            createdAt: instructor.createdAt,
            user: user
              ? {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                profileImageUrl: user.profileImageUrl,
              }
              : null,
            name,
            photo: user?.profileImageUrl || "",
            vehicle,
          };
        }),
      );

      res.json(enriched);
    } catch (error) {
      console.error("Error fetching instructors:", error);
      res.status(500).json({ message: "Failed to fetch instructors" });
    }
  });

  app.get('/api/instructors/:id', cacheMiddleware(120), async (req: Request, res: Response) => {
    try {
      const instructor = await storage.getInstructor(req.params.id);
      if (!instructor) {
        return res.status(404).json({ message: "Instructor not found" });
      }
      const user = await storage.getUser(instructor.userId);
      const name =
        `${user?.firstName || ""} ${user?.lastName || ""} `.trim() ||
        user?.email ||
        "Instrutor";
      const vehicle = `${instructor.vehicleModel} ${instructor.vehicleYear || ""} `.trim();

      res.json({
        // Only safe, public fields
        id: instructor.id,
        userId: instructor.userId,
        bio: instructor.bio,
        pricePerHour: instructor.pricePerHour,
        slotDurationMinutes: instructor.slotDurationMinutes,
        maxBookingsPerStudent: instructor.maxBookingsPerStudent,
        vehicleModel: instructor.vehicleModel,
        vehicleYear: instructor.vehicleYear,
        vehicleType: instructor.vehicleType,
        vehiclePlate: instructor.vehiclePlate,
        vehicleImageUrl: instructor.vehicleImageUrl,
        rating: instructor.rating,
        reviewsCount: instructor.reviewsCount,
        lat: instructor.lat,
        lng: instructor.lng,
        neighborhood: instructor.neighborhood,
        city: instructor.city,
        state: instructor.state,
        status: instructor.status,
        yearsExperience: instructor.yearsExperience,
        languages: instructor.languages,
        specialties: instructor.specialties,
        workingHours: instructor.workingHours,
        responseTime: instructor.responseTime,
        galleryImages: instructor.galleryImages,
        lessonsCompleted: instructor.lessonsCompleted,
        createdAt: instructor.createdAt,
        user: user
          ? {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            profileImageUrl: user.profileImageUrl,
          }
          : null,
        name,
        photo: user?.profileImageUrl || "",
        vehicle,
      });
    } catch (error) {
      console.error("Error fetching instructor:", error);
      res.status(500).json({ message: "Failed to fetch instructor" });
    }
  });

  app.post('/api/instructors', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertInstructorSchema.parse({ ...req.body, userId });
      const instructor = await storage.createInstructor(data);
      res.status(201).json(instructor);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating instructor:", error);
      res.status(500).json({ message: "Failed to create instructor" });
    }
  });

  app.patch('/api/instructors/:id', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const instructor = await storage.getInstructor(req.params.id);

      if (!instructor) {
        return res.status(404).json({ message: "Instructor not found" });
      }

      // Verify ownership: user must be the instructor owner or admin
      const user = await storage.getUser(userId);
      if (instructor.userId !== userId && user?.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden: You don't have permission to modify this instructor" });
      }

      const payload = { ...req.body };
      if (Object.prototype.hasOwnProperty.call(payload, "slotDurationMinutes")) {
        const duration = Number(payload.slotDurationMinutes);
        if (!Number.isFinite(duration) || duration <= 0) {
          return res.status(400).json({ message: "slotDurationMinutes inválido" });
        }
        payload.slotDurationMinutes = Math.round(duration);
      }
      if (Object.prototype.hasOwnProperty.call(payload, "maxBookingsPerStudent")) {
        const limit = Number(payload.maxBookingsPerStudent);
        if (!Number.isFinite(limit) || limit < 0) {
          return res.status(400).json({ message: "maxBookingsPerStudent inválido" });
        }
        payload.maxBookingsPerStudent = Math.round(limit);
      }

      const updated = await storage.updateInstructor(req.params.id, payload);
      await invalidateCache("cache:*/api/instructors*");
      res.json(updated);
    } catch (error) {
      console.error("Error updating instructor:", error);
      res.status(500).json({ message: "Failed to update instructor" });
    }
  });

  // PUT /api/instructors/:id/profile - Update instructor profile (bio, specialties, languages, etc.)
  app.put('/api/instructors/:id/profile', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const instructor = await storage.getInstructor(req.params.id);

      if (!instructor) {
        return res.status(404).json({ message: "Instructor not found" });
      }

      // Verify ownership: user must be the instructor owner
      if (instructor.userId !== userId) {
        return res.status(403).json({ message: "Forbidden: You can only update your own profile" });
      }

      const { bio, yearsExperience, workingHours, responseTime, specialties, languages, galleryImages } = req.body;

      const updateData: Record<string, unknown> = {};
      if (bio !== undefined) updateData.bio = bio;
      if (yearsExperience !== undefined) updateData.yearsExperience = Number(yearsExperience) || 0;
      if (workingHours !== undefined) updateData.workingHours = workingHours;
      if (responseTime !== undefined) updateData.responseTime = responseTime;
      if (specialties !== undefined) updateData.specialties = specialties;
      if (languages !== undefined) updateData.languages = languages;
      if (galleryImages !== undefined) updateData.galleryImages = galleryImages;

      const updated = await storage.updateInstructor(req.params.id, updateData);
      await invalidateCache("cache:*/api/instructors*");
      res.json(updated);
    } catch (error) {
      console.error("Error updating instructor profile:", error);
      res.status(500).json({ message: "Failed to update instructor profile" });
    }
  });

  // --- Vehicle Routes ---
  app.get('/api/vehicles', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user?.id || req.user?.claims?.sub;
      const instructor = await storage.getInstructorByUserId(userId);
      if (!instructor) return res.status(404).json({ message: "Instructor profile not found" });
      const vehicles = await storage.getVehicles(instructor.id);
      res.json(vehicles);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch vehicles" });
    }
  });

  app.post('/api/vehicles', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user?.id || req.user?.claims?.sub;
      const instructor = await storage.getInstructorByUserId(userId);
      if (!instructor) return res.status(404).json({ message: "Instructor profile not found" });

      const data = insertVehicleSchema.parse({ ...req.body, instructorId: instructor.id });
      const vehicle = await storage.createVehicle(data);
      res.status(201).json(vehicle);
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json(error.errors);
      res.status(500).json({ message: "Failed to create vehicle" });
    }
  });

  app.patch('/api/vehicles/:id', isAuthenticated, async (req: any, res: Response) => {
    try {
      const updated = await storage.updateVehicle(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update vehicle" });
    }
  });

  app.delete('/api/vehicles/:id', isAuthenticated, async (req: any, res: Response) => {
    try {
      await storage.deleteVehicle(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete vehicle" });
    }
  });

  // --- Support Tickets ---
  app.post('/api/support', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user?.id || req.user?.claims?.sub;
      const data = insertSupportTicketSchema.parse({ ...req.body, userId });
      const ticket = await storage.createSupportTicket(data);
      res.status(201).json(ticket);
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json(error.errors);
      res.status(500).json({ message: "Failed to submit support request" });
    }
  });

  app.get('/api/support', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user?.id || req.user?.claims?.sub;
      const tickets = await storage.getSupportTickets(userId);
      res.json(tickets);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch support requests" });
    }
  });

  app.get('/api/config/fees', async (req: Request, res: Response) => {
    try {
      const settings = await storage.getAdminSettings();
      res.json({
        platformFeePercent: Number(settings.platformFeePercent || 0)
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch fee configuration" });
    }
  });


  app.get('/api/instructors/:id/reviews', cacheMiddleware(300), async (req: Request, res: Response) => {
    try {
      const reviews = await storage.getReviewsByInstructor(req.params.id);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.get('/api/bookings/student', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const bookings = await storage.getBookingsByStudent(userId);

      // Enrich bookings with instructor details
      const enrichedBookings = await Promise.all(
        bookings.map(async (booking) => {
          const instructor = await storage.getInstructor(booking.instructorId);
          const instructorUser = instructor
            ? await storage.getUser(instructor.userId)
            : null;

          return {
            ...booking,
            instructor: instructor && instructorUser ? {
              id: instructor.id,
              userId: instructorUser.id,
              name: `${instructorUser.firstName || ''} ${instructorUser.lastName || ''} `.trim() || instructorUser.email || 'Instrutor',
              photo: instructorUser.profileImageUrl || '',
              vehicle: `${instructor.vehicleModel} ${instructor.vehicleYear || ''} `.trim(),
            } : undefined,
          };
        })
      );

      res.json(enrichedBookings);
    } catch (error) {
      console.error("Error fetching student bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.get('/api/bookings/instructor/:instructorId', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const bookings = await storage.getBookingsByInstructor(req.params.instructorId);

      // Enrich bookings with student details
      const enrichedBookings = await Promise.all(
        bookings.map(async (booking) => {
          const student = await storage.getUser(booking.studentId);

          return {
            ...booking,
            student: student ? {
              id: student.id,
              name: `${student.firstName || ''} ${student.lastName || ''} `.trim() || student.email || 'Aluno',
              phone: student.phone || undefined,
            } : undefined,
          };
        })
      );

      res.json(enrichedBookings);
    } catch (error) {
      console.error("Error fetching instructor bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.post('/api/bookings', bookingLimiter, isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const incoming = { ...req.body, studentId: userId };
      const parsedDate =
        typeof incoming.date === "string" ? new Date(incoming.date) : incoming.date;
      const data = insertBookingSchema.parse({ ...incoming, date: parsedDate });
      const instructor = await storage.getInstructor(data.instructorId);
      if (!instructor) {
        return res.status(404).json({ message: "Instructor not found" });
      }
      const student = await storage.getUser(userId);
      if (student?.kycStatus && student.kycStatus !== "approved") {
        return res.status(403).json({
          message: "Cadastro ainda nao aprovado. Complete o KYC para agendar.",
        });
      }
      if (instructor.status !== "approved") {
        return res.status(403).json({
          message: "Instrutor ainda nao aprovado para receber agendamentos.",
        });
      }

      const slotDuration =
        typeof instructor.slotDurationMinutes === "number" && instructor.slotDurationMinutes > 0
          ? instructor.slotDurationMinutes
          : data.duration || 50;
      const bookingData = { ...data, duration: slotDuration };

      if ((instructor.maxBookingsPerStudent || 0) > 0) {
        const activeCount = await storage.countActiveBookingsByStudent(
          data.instructorId,
          userId,
        );
        if (activeCount >= instructor.maxBookingsPerStudent) {
          return res.status(400).json({
            message: "Limite de aulas por aluno atingido para este instrutor.",
          });
        }
      }

      // 1. Check for booking conflicts (same instructor, overlapping time)
      const existingBookings = await storage.getBookingsByInstructor(bookingData.instructorId);
      const newStart = new Date(bookingData.date);
      const newEnd = new Date(newStart.getTime() + (bookingData.duration || 60) * 60000);

      const hasConflict = existingBookings.some(booking => {
        if (booking.status === 'cancelled') return false;

        const bookingStart = new Date(booking.date);
        const bookingEnd = new Date(bookingStart.getTime() + (booking.duration || 60) * 60000);

        // Check if time ranges overlap
        return newStart < bookingEnd && newEnd > bookingStart;
      });

      if (hasConflict) {
        return res.status(409).json({
          message: "Horário indisponível. Este instrutor já possui uma aula agendada neste horário."
        });
      }

      // 2. Check if instructor has availability for this time slot
      const availability = await storage.getAvailabilityByInstructor(bookingData.instructorId);
      if (availability.length > 0) {
        const bookingDate = new Date(bookingData.date);
        const dayOfWeek = bookingDate.getDay();
        const bookingTime = bookingDate.toTimeString().slice(0, 5); // "HH:mm"

        const hasAvailability = availability.some(slot =>
          slot.dayOfWeek === dayOfWeek &&
          bookingTime >= slot.startTime &&
          bookingTime <= slot.endTime
        );

        if (!hasAvailability) {
          return res.status(400).json({
            message: "Instrutor não disponível neste horário. Verifique os horários disponíveis."
          });
        }
      }

      const booking = await storage.createBooking(bookingData);
      res.status(201).json(booking);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating booking:", error);
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  app.patch('/api/bookings/:id', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const existingBooking = await storage.getBooking(req.params.id);

      if (!existingBooking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Verify ownership: user must be the student, instructor, or admin
      const user = await storage.getUser(userId);
      const instructor = await storage.getInstructor(existingBooking.instructorId);

      const isStudent = existingBooking.studentId === userId;
      const isInstructor = instructor?.userId === userId;
      const isAdmin = user?.role === 'admin';

      if (!isStudent && !isInstructor && !isAdmin) {
        return res.status(403).json({ message: "Forbidden: You don't have permission to modify this booking" });
      }

      const booking = await storage.updateBooking(req.params.id, req.body);
      if (
        booking.status === "paid" ||
        booking.status === "completed" ||
        String(booking.paymentStatus ?? "").toLowerCase() === "paid"
      ) {
        storage.upsertBookingTransaction(booking).catch((error) => {
          logger.error("Error syncing booking transaction:", error);
        });
      }
      res.json(booking);
    } catch (error) {
      console.error("Error updating booking:", error);
      res.status(500).json({ message: "Failed to update booking" });
    }
  });

  app.post('/api/bookings/:id/start', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const booking = await storage.getBooking(req.params.id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      const instructor = await storage.getInstructor(booking.instructorId);
      const user = await storage.getUser(userId);
      const isInstructor = instructor?.userId === userId;
      const isAdmin = user?.role === "admin";
      if (!isInstructor && !isAdmin) {
        return res.status(403).json({ message: "Forbidden" });
      }

      if (booking.startedAt) {
        return res.status(409).json({ message: "Aula ja iniciada" });
      }

      if (
        booking.paymentStatus?.toLowerCase() !== "paid" &&
        booking.status !== "paid"
      ) {
        return res.status(400).json({ message: "Pagamento nao confirmado" });
      }

      if (!booking.startCode) {
        return res.status(400).json({ message: "Codigo de inicio nao gerado" });
      }

      const code = String(req.body?.code ?? "").trim();
      if (!code || booking.startCode !== code) {
        return res.status(400).json({ message: "Codigo de inicio invalido" });
      }

      const updated = await storage.updateBooking(booking.id, {
        startedAt: new Date(),
        status: booking.status === "paid" ? "confirmed" : booking.status,
      });
      res.json(updated);
    } catch (error) {
      console.error("Error starting booking:", error);
      res.status(500).json({ message: "Failed to start booking" });
    }
  });

  app.post('/api/bookings/:id/complete', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const booking = await storage.getBooking(req.params.id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      const instructor = await storage.getInstructor(booking.instructorId);
      const user = await storage.getUser(userId);
      const isInstructor = instructor?.userId === userId;
      const isAdmin = user?.role === "admin";
      if (!isInstructor && !isAdmin) {
        return res.status(403).json({ message: "Forbidden" });
      }

      if (!booking.startedAt) {
        return res.status(400).json({ message: "Aula ainda nao iniciada" });
      }
      if (booking.completedAt || booking.status === "completed") {
        return res.status(409).json({ message: "Aula ja concluida" });
      }

      if (!booking.endCode) {
        return res.status(400).json({ message: "Codigo de conclusao nao gerado" });
      }

      const code = String(req.body?.code ?? "").trim();
      if (!code || booking.endCode !== code) {
        return res.status(400).json({ message: "Codigo de conclusao invalido" });
      }

      const updated = await storage.updateBooking(booking.id, {
        status: "completed",
        completedAt: new Date(),
      });

      storage.upsertBookingTransaction(updated).catch((err) => {
        console.error("Error syncing booking transaction:", err);
      });

      res.json(updated);
    } catch (error) {
      console.error("Error completing booking:", error);
      res.status(500).json({ message: "Failed to complete booking" });
    }
  });

  app.post('/api/bookings/:id/cancel', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const booking = await storage.getBooking(req.params.id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      if (booking.status === "completed") {
        return res.status(400).json({ message: "Aula ja concluida" });
      }

      const user = await storage.getUser(userId);
      const instructor = await storage.getInstructor(booking.instructorId);
      const isStudent = booking.studentId === userId;
      const isInstructor = instructor?.userId === userId;
      const isAdmin = user?.role === "admin";
      if (!isStudent && !isInstructor && !isAdmin) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const reason = String(req.body?.reason ?? "").trim();
      if (!reason) {
        return res.status(400).json({ message: "Motivo obrigatorio" });
      }

      const now = new Date();
      let cancelledMinutes = 0;
      if (booking.startedAt) {
        const diffMs = now.getTime() - new Date(booking.startedAt).getTime();
        const diffMinutes = Math.ceil(diffMs / 60000);
        const maxDuration = booking.duration || 0;
        cancelledMinutes = Math.min(Math.max(diffMinutes, 0), maxDuration);
      }

      const updated = await storage.updateBooking(booking.id, {
        status: "cancelled",
        cancelledAt: now,
        cancelledByRole: user?.role ?? "student",
        cancelledByUserId: userId,
        cancelReason: reason,
        cancelledMinutes,
      });

      const existingDispute = await storage.getDisputeByBooking(booking.id);
      if (!existingDispute && (booking.startedAt || isInstructor)) {
        await storage.createDispute({
          bookingId: booking.id,
          openedByUserId: userId,
          openedByRole: (user?.role ?? "student") as any,
          reason,
        });
      }

      storage.upsertBookingTransaction(updated).catch((err) => {
        console.error("Error syncing booking transaction:", err);
      });

      res.json(updated);
    } catch (error) {
      console.error("Error cancelling booking:", error);
      res.status(500).json({ message: "Failed to cancel booking" });
    }
  });

  app.post('/api/bookings/:id/disputes', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const booking = await storage.getBooking(req.params.id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      const user = await storage.getUser(userId);
      const instructor = await storage.getInstructor(booking.instructorId);
      const isStudent = booking.studentId === userId;
      const isInstructor = instructor?.userId === userId;
      const isAdmin = user?.role === "admin";
      if (!isStudent && !isInstructor && !isAdmin) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const reason = String(req.body?.reason ?? "").trim();
      if (!reason) {
        return res.status(400).json({ message: "Motivo obrigatorio" });
      }

      const existingDispute = await storage.getDisputeByBooking(booking.id);
      if (existingDispute && existingDispute.status !== "resolved") {
        return res.status(409).json({ message: "Disputa ja aberta" });
      }

      const dispute = await storage.createDispute({
        bookingId: booking.id,
        openedByUserId: userId,
        openedByRole: (user?.role ?? "student") as any,
        reason,
      });

      res.status(201).json(dispute);
    } catch (error) {
      console.error("Error creating dispute:", error);
      res.status(500).json({ message: "Failed to create dispute" });
    }
  });

  // Availability routes
  // Reviews routes
  app.post('/api/reviews', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertReviewSchema.parse({ ...req.body, studentId: userId });

      // 1. Verify if booking exists and belongs to student
      const booking = await storage.getBooking(data.bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Reserva não encontrada" });
      }

      if (booking.studentId !== userId) {
        return res.status(403).json({ message: "Você só pode avaliar suas próprias reservas" });
      }

      // 2. Verify if booking is completed (or paid, depending on business rule)
      if (booking.status !== 'completed' && booking.status !== 'paid') {
        return res.status(400).json({ message: "Você só pode avaliar aulas concluídas" });
      }

      // 3. Check for duplicate review
      const existingReviews = await storage.getReviewsByInstructor(data.instructorId);
      const hasReviewed = existingReviews.some(r => r.bookingId === data.bookingId);

      if (hasReviewed) {
        return res.status(409).json({ message: "Você já avaliou esta aula" });
      }

      const review = await storage.createReview(data);

      // Update instructor rating (async, fire and forget)
      // TODO: Implement updateInstructorRating in storage if needed for cache/search optimization

      res.status(201).json(review);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      console.error("Error creating review:", error);
      res.status(500).json({ message: "Erro ao criar avaliação" });
    }
  });

  app.get('/api/instructors/:id/availability', cacheMiddleware(30), async (req: Request, res: Response) => {
    try {
      const slots = await storage.getAvailabilityByInstructor(req.params.id);
      res.json(slots);
    } catch (error) {
      console.error("Error fetching availability:", error);
      res.status(500).json({ message: "Failed to fetch availability" });
    }
  });

  app.post('/api/instructors/:id/availability', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const instructor = await storage.getInstructor(req.params.id);

      if (!instructor) {
        return res.status(404).json({ message: "Instructor not found" });
      }

      // Verify ownership: user must be the instructor or admin
      const user = await storage.getUser(userId);
      if (instructor.userId !== userId && user?.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }

      const data = insertAvailabilitySchema.parse({
        ...req.body,
        instructorId: req.params.id,
      });
      if (data.startTime >= data.endTime) {
        return res.status(400).json({ message: "Horario inicial deve ser menor que o final" });
      }

      const slot = await storage.createAvailability(data);
      await invalidateCache("cache:*/api/instructors*");
      res.status(201).json(slot);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating availability:", error);
      res.status(500).json({ message: "Failed to create availability" });
    }
  });

  app.patch('/api/instructors/:id/availability/:slotId', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const instructor = await storage.getInstructor(req.params.id);
      if (!instructor) {
        return res.status(404).json({ message: "Instructor not found" });
      }

      const user = await storage.getUser(userId);
      if (instructor.userId !== userId && user?.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }

      const slot = await storage.getAvailabilityById(req.params.slotId);
      if (!slot || slot.instructorId !== instructor.id) {
        return res.status(404).json({ message: "Availability not found" });
      }

      const data = insertAvailabilitySchema
        .partial()
        .parse({ ...req.body, instructorId: instructor.id });
      if (data.startTime && data.endTime && data.startTime >= data.endTime) {
        return res.status(400).json({ message: "Horario inicial deve ser menor que o final" });
      }

      const updated = await storage.updateAvailability(req.params.slotId, data);
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating availability:", error);
      res.status(500).json({ message: "Failed to update availability" });
    }
  });

  app.delete('/api/instructors/:id/availability/:slotId', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const instructor = await storage.getInstructor(req.params.id);
      if (!instructor) {
        return res.status(404).json({ message: "Instructor not found" });
      }

      const user = await storage.getUser(userId);
      if (instructor.userId !== userId && user?.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }

      const slot = await storage.getAvailabilityById(req.params.slotId);
      if (!slot || slot.instructorId !== instructor.id) {
        return res.status(404).json({ message: "Availability not found" });
      }

      await storage.deleteAvailability(req.params.slotId);
      res.json({ ok: true });
    } catch (error) {
      console.error("Error deleting availability:", error);
      res.status(500).json({ message: "Failed to delete availability" });
    }
  });

  app.post('/api/withdrawals', isAuthenticated, async (req: any, res: Response) => {
    try {
      const instructor = await storage.getInstructorByUserId(req.user.claims.sub);
      if (!instructor) {
        return res.status(403).json({ message: "Apenas instrutores podem solicitar saque." });
      }

      const { amount, pixKey } = req.body;
      const amountNum = Number(amount);

      if (!amount || amountNum <= 0) {
        return res.status(400).json({ message: "Valor inválido" });
      }

      // Use the pixKey provided in the request or fallback to the instructor's saved pixKey
      const destinationKey = pixKey || instructor.pixKey;

      if (!destinationKey) {
        return res.status(400).json({ message: "Chave Pix não informada." });
      }

      // Create withdrawal request
      const withdrawal = await storage.createWithdrawal({
        userId: req.user.claims.sub,
        amount: amountNum.toString(),
        status: "pending",
        destinationType: "pix",
        destinationKey: destinationKey,
      });

      res.status(201).json(withdrawal);
    } catch (err) {
      console.error("Withdrawal error:", err);
      res.status(500).json({ message: "Erro ao solicitar saque" });
    }
  });

  app.get('/api/admin/vehicles/pending', isAuthenticated, async (req: any, res: Response) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }
      const vehicles = await storage.getPendingVehicles();
      res.json(vehicles);
    } catch (error) {
      console.error("Error fetching pending vehicles:", error);
      res.status(500).json({ message: "Failed to fetch pending vehicles" });
    }
  });

  app.patch('/api/admin/vehicles/:id/status', isAuthenticated, async (req: any, res: Response) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }
      const { status, rejectionReason } = req.body;
      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const vehicle = await storage.updateVehicleStatus(
        req.params.id,
        status,
        rejectionReason,
        user.id
      );
      res.json(vehicle);
    } catch (error) {
      console.error("Error updating vehicle status:", error);
      res.status(500).json({ message: "Failed to update vehicle status" });
    }
  });

  app.get('/api/admin/instructors/pending', isAuthenticated, async (req: any, res: Response) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }
      const instructors = await storage.getAllInstructors('pending');
      res.json(instructors);
    } catch (error) {
      console.error("Error fetching pending instructors:", error);
      res.status(500).json({ message: "Failed to fetch pending instructors" });
    }
  });

  app.get('/api/admin/instructors', isAuthenticated, async (req: any, res: Response) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }
      const status = req.query.status as string | undefined;
      const instructors = await storage.getInstructorsWithUser(status);
      res.json(sanitizeSensitiveData(instructors));
    } catch (error) {
      console.error("Error fetching instructors:", error);
      res.status(500).json({ message: "Failed to fetch instructors" });
    }
  });

  app.get('/api/admin/settings', isAuthenticated, async (req: any, res: Response) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }
      const settings = await storage.getAdminSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching admin settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.patch('/api/admin/settings', isAuthenticated, async (req: any, res: Response) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }
      const payload = req.body ?? {};
      const cancellationFeePercent = Number(payload.cancellationFeePercent);
      const cancellationInstructorSharePercent = Number(
        payload.cancellationInstructorSharePercent,
      );
      const platformFeePercent = Number(payload.platformFeePercent);

      if (
        !Number.isFinite(cancellationFeePercent) ||
        cancellationFeePercent < 0 ||
        cancellationFeePercent > 100
      ) {
        return res.status(400).json({ message: "Percentual de cancelamento invalido" });
      }
      if (
        !Number.isFinite(cancellationInstructorSharePercent) ||
        cancellationInstructorSharePercent < 0 ||
        cancellationInstructorSharePercent > 100
      ) {
        return res.status(400).json({ message: "Percentual do instrutor invalido" });
      }
      if (
        !Number.isFinite(platformFeePercent) ||
        platformFeePercent < 0 ||
        platformFeePercent > 100
      ) {
        return res.status(400).json({ message: "Taxa da plataforma invalida" });
      }

      const updated = await storage.updateAdminSettings({
        cancellationFeePercent: cancellationFeePercent.toFixed(2),
        cancellationInstructorSharePercent: cancellationInstructorSharePercent.toFixed(2),
        platformFeePercent: platformFeePercent.toFixed(2),
      });
      res.json(updated);
    } catch (error) {
      console.error("Error updating admin settings:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  app.get('/api/admin/disputes', isAuthenticated, async (req: any, res: Response) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }
      const disputes = await storage.getDisputes();
      res.json(disputes);
    } catch (error) {
      console.error("Error fetching disputes:", error);
      res.status(500).json({ message: "Failed to fetch disputes" });
    }
  });

  app.patch('/api/admin/disputes/:id', isAuthenticated, async (req: any, res: Response) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }

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

  app.get('/api/admin/bookings', isAuthenticated, async (req: any, res: Response) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }

      const limitParam = Number.parseInt(req.query.limit as string, 10);
      const limit = Number.isFinite(limitParam)
        ? Math.min(Math.max(limitParam, 1), 100)
        : 20;

      const bookings = await storage.getAdminBookings(limit);
      res.json(sanitizeSensitiveData(bookings));
    } catch (error) {
      console.error("Error fetching admin bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.get('/api/admin/dashboard', isAuthenticated, async (req: any, res: Response) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }

      const stats = await storage.getAdminDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get('/api/admin/geo-summary', isAuthenticated, async (req: any, res: Response) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }

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

  app.get('/api/admin/users', isAuthenticated, async (req: any, res: Response) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }
      const role = req.query.role as string | undefined;
      const users = await storage.getUsers(role);
      res.json(sanitizeSensitiveData(users));
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.patch('/api/admin/instructors/:id/status', isAuthenticated, async (req: any, res: Response) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }

      const status = req.body?.status as string | undefined;
      if (!status || !['approved', 'rejected', 'pending'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }

      const instructor = await storage.updateInstructor(req.params.id, { status: status as any });
      res.json(instructor);
    } catch (error) {
      console.error("Error updating instructor status:", error);
      res.status(500).json({ message: "Failed to update instructor status" });
    }
  });

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

  app.get('/api/admin/payment-gateways', isAuthenticated, async (req: any, res: Response) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }

      const gateways = await storage.getPaymentGateways();
      res.json(
        gateways.map((gateway) => ({
          id: gateway.id,
          provider: gateway.provider,
          status: gateway.status,
          isDefault: gateway.isDefault,
          maskedKey: maskApiKey(gateway.apiKey),
          updatedAt: gateway.updatedAt,
          createdAt: gateway.createdAt,
        })),
      );
    } catch (error) {
      console.error("Error fetching payment gateways:", error);
      res.status(500).json({ message: "Failed to fetch payment gateways" });
    }
  });

  app.post('/api/admin/payment-gateways', isAuthenticated, async (req: any, res: Response) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }

      const payload = gatewayCreateSchema.parse(req.body);
      const apiKey = payload.apiKey?.trim() || null;

      const gateway = await storage.createPaymentGateway({
        provider: payload.provider,
        apiKey,
        status: payload.status,
        isDefault: payload.isDefault,
      });

      res.status(201).json({
        id: gateway.id,
        provider: gateway.provider,
        status: gateway.status,
        isDefault: gateway.isDefault,
        maskedKey: maskApiKey(gateway.apiKey),
        updatedAt: gateway.updatedAt,
        createdAt: gateway.createdAt,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating payment gateway:", error);
      res.status(500).json({ message: "Failed to create payment gateway" });
    }
  });

  app.patch('/api/admin/payment-gateways/:id', isAuthenticated, async (req: any, res: Response) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }

      const payload = gatewayUpdateSchema.parse(req.body);
      const apiKey =
        typeof payload.apiKey === "string" ? payload.apiKey.trim() : payload.apiKey;

      const gateway = await storage.updatePaymentGateway(req.params.id, {
        provider: payload.provider,
        apiKey: typeof apiKey === "string" ? apiKey : apiKey ?? undefined,
        status: payload.status,
        isDefault: payload.isDefault,
      });

      res.json({
        id: gateway.id,
        provider: gateway.provider,
        status: gateway.status,
        isDefault: gateway.isDefault,
        maskedKey: maskApiKey(gateway.apiKey),
        updatedAt: gateway.updatedAt,
        createdAt: gateway.createdAt,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating payment gateway:", error);
      res.status(500).json({ message: "Failed to update payment gateway" });
    }
  });

  app.get('/api/admin/integrations', isAuthenticated, async (req: any, res: Response) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }

      const status = req.query.status as string | undefined;
      const category = req.query.category as string | undefined;
      const environment = req.query.environment as string | undefined;

      if (status && !integrationStatusValues.includes(status as any)) {
        return res.status(400).json({ message: "Invalid integration status" });
      }
      if (environment && !integrationEnvironmentValues.includes(environment as any)) {
        return res.status(400).json({ message: "Invalid integration environment" });
      }

      const integrations = await storage.getIntegrations({
        status,
        category,
        environment,
      });

      res.json(
        integrations.map((integration) => ({
          ...integration,
          fields: maskIntegrationFields(integration.fields as any),
        })),
      );
    } catch (error) {
      console.error("Error fetching integrations:", error);
      res.status(500).json({ message: "Failed to fetch integrations" });
    }
  });

  app.post('/api/admin/integrations', isAuthenticated, async (req: any, res: Response) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }

      const payload = integrationCreateSchema.parse(req.body);
      const slug = payload.slug?.trim() || slugify(payload.name);
      if (!slug) {
        return res.status(400).json({ message: "Slug inválido" });
      }

      const existing = await storage.getIntegrationBySlug(
        slug,
        payload.environment,
      );
      if (existing) {
        return res.status(409).json({ message: "Integração já cadastrada" });
      }

      const integration = await storage.createIntegration({
        name: payload.name.trim(),
        slug,
        category: payload.category.trim(),
        status: payload.status,
        environment: payload.environment,
        isDefault: payload.isDefault,
        fields: normalizeIntegrationFields(payload.fields),
      });

      res.status(201).json({
        ...integration,
        fields: maskIntegrationFields(integration.fields as any),
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating integration:", error);
      res.status(500).json({ message: "Failed to create integration" });
    }
  });

  app.patch('/api/admin/integrations/:id', isAuthenticated, async (req: any, res: Response) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }

      const payload = integrationUpdateSchema.parse(req.body);
      const current = await storage.getIntegration(req.params.id);
      if (!current) {
        return res.status(404).json({ message: "Integração não encontrada" });
      }

      let slug: string | undefined;
      if (payload.slug !== undefined) {
        const candidate = payload.slug?.trim() || slugify(payload.name || current.name);
        if (!candidate) {
          return res.status(400).json({ message: "Slug inválido" });
        }
        slug = candidate;

        const envToCheck = payload.environment || current.environment;
        if (candidate !== current.slug || envToCheck !== current.environment) {
          const existing = await storage.getIntegrationBySlug(
            candidate,
            envToCheck,
          );
          if (existing && existing.id !== current.id) {
            return res.status(409).json({ message: "Integração já cadastrada" });
          }
        }
      }

      const fields =
        payload.fields === undefined
          ? undefined
          : mergeSecretIntegrationFields(
            normalizeIntegrationFields(payload.fields),
            current.fields as any,
          );

      const integration = await storage.updateIntegration(req.params.id, {
        name: payload.name?.trim(),
        slug,
        category: payload.category?.trim(),
        status: payload.status,
        environment: payload.environment,
        isDefault: payload.isDefault,
        fields,
      });

      res.json({
        ...integration,
        fields: maskIntegrationFields(integration.fields as any),
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating integration:", error);
      res.status(500).json({ message: "Failed to update integration" });
    }
  });

  const parseBooleanField = (value?: string | null) => {
    if (value == null) return undefined;
    const normalized = String(value).trim().toLowerCase();
    if (!normalized) return undefined;
    if (["true", "1", "yes", "on"].includes(normalized)) return true;
    if (["false", "0", "no", "off"].includes(normalized)) return false;
    return undefined;
  };

  const resolveAbacateIntegrationConfig = async () => {
    const environment =
      process.env.NODE_ENV === "production" ? "production" : "development";
    const integration = await storage.getIntegrationBySlug(
      "abacatepay",
      environment,
    );
    if (!integration || integration.status !== "active") {
      return {};
    }
    const fields = Array.isArray(integration.fields) ? integration.fields : [];
    const readField = (key: string) =>
      fields.find((field) => field.key === key)?.value ?? null;
    const apiKey = readField("apiKey") || readField("api_key");
    const baseUrl = readField("baseUrl") || readField("base_url");
    const devModeRaw = readField("devMode") || readField("dev_mode");

    return {
      apiKey: apiKey?.trim() || undefined,
      baseUrl: baseUrl?.trim() || undefined,
      devMode: parseBooleanField(devModeRaw),
    };
  };

  // Chat routes
  app.get('/api/chat/contacts', isAuthenticated, async (req: any, res: Response) => {
    try {
      const contacts = await storage.getContacts(req.user.claims.sub);
      res.json(contacts);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      res.status(500).json({ message: "Failed to fetch contacts" });
    }
  });

  app.get('/api/chat/:userId', isAuthenticated, async (req: any, res: Response) => {
    try {
      const messages = await storage.getMessages(req.params.userId, req.user.claims.sub);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post('/api/chat', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertMessageSchema.parse({ ...req.body, senderId: userId });

      // Verify if receiver exists
      const receiver = await storage.getUser(data.receiverId);
      if (!receiver) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      const message = await storage.createMessage(data);
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Erro ao enviar mensagem" });
    }
  });

  app.post('/api/chat/:userId/read', isAuthenticated, async (req: any, res: Response) => {
    try {
      await storage.markMessagesAsRead(req.params.userId, req.user.claims.sub);
      res.sendStatus(200);
    } catch (error) {
      console.error("Error marking messages as read:", error);
      res.status(500).json({ message: "Failed to mark messages as read" });
    }
  });

  // AI Chat routes
  app.post('/api/chat/ai', isAuthenticated, async (req: any, res: Response) => {
    try {
      const { chatWithAI } = await import("./ai");
      const userId = req.user?.claims?.sub ?? req.user?.id;
      const user = await storage.getUser(userId);

      const messagesPayload = z.array(z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(2000),
      })).parse(req.body.messages);

      if (messagesPayload.length === 0) {
        return res.status(400).json({ message: "Mensagens não podem estar vazias" });
      }

      const result = await chatWithAI(
        messagesPayload,
        {
          userId,
          role: user?.role,
          name: user?.firstName || undefined,
        }
      );

      res.json({
        reply: result.reply,
        model: result.model,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      if (error.message?.includes("API key")) {
        return res.status(503).json({
          message: "Assistente IA não configurado. Configure a integração OpenAI no painel admin.",
          code: "AI_NOT_CONFIGURED"
        });
      }
      console.error("Error in AI chat:", error);
      res.status(500).json({ message: "Erro ao processar mensagem com IA" });
    }
  });

  app.get('/api/chat/quick-replies', async (req: Request, res: Response) => {
    try {
      const { getQuickReplies } = await import("./ai");
      const context = (req.query.context as "greeting" | "booking" | "payment") || "greeting";
      const replies = getQuickReplies(context);
      res.json({ replies });
    } catch (error) {
      console.error("Error fetching quick replies:", error);
      res.status(500).json({ message: "Failed to fetch quick replies" });
    }
  });

  // ==================== KYC ROUTES ====================

  // KYC rate limiter (stricter for face verification)
  const kycLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // max 5 verification attempts per hour
    message: { message: 'Muitas tentativas de verificação. Tente novamente em 1 hora.' },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Get KYC status
  app.get('/api/kyc/status', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Não autenticado' });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado' });
      }

      // Check KYC status from user record
      const kycStatus = user.kycStatus || 'pending';

      res.json({
        status: kycStatus === 'approved' ? 'approved' :
          kycStatus === 'rejected' ? 'rejected' : 'not_started',
        canRetry: kycStatus === 'rejected',
        userId: user.id,
      });
    } catch (error) {
      console.error('Error fetching KYC status:', error);
      res.status(500).json({ message: 'Erro ao buscar status do KYC' });
    }
  });

  // Get KYC requirements
  app.get('/api/kyc/requirements', async (req: Request, res: Response) => {
    try {
      const { KYC_REQUIREMENTS } = await import('./kyc');
      res.json(KYC_REQUIREMENTS);
    } catch (error) {
      console.error('Error fetching KYC requirements:', error);
      res.status(500).json({ message: 'Erro ao buscar requisitos' });
    }
  });

  // Verify KYC (submit images for verification)
  app.post('/api/kyc/verify', kycLimiter, isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Não autenticado' });
      }

      const { selfie, documentFront, documentBack } = req.body;

      if (!selfie || !documentFront) {
        return res.status(400).json({
          message: 'Selfie e documento são obrigatórios'
        });
      }

      // Import KYC service
      const { performKycVerification, saveBase64Image } = await import('./kyc');

      // Save images
      const selfieUrl = await saveBase64Image(selfie, userId, 'selfie');
      const documentFrontUrl = await saveBase64Image(documentFront, userId, 'document_front');
      let documentBackUrl;
      if (documentBack) {
        documentBackUrl = await saveBase64Image(documentBack, userId, 'document_back');
      }

      // Extract base64 data (remove data URL prefix)
      const selfieBase64 = selfie.replace(/^data:image\/\w+;base64,/, '');
      const documentFrontBase64 = documentFront.replace(/^data:image\/\w+;base64,/, '');

      // Perform verification
      const result = await performKycVerification(
        userId,
        selfieBase64,
        documentFrontBase64,
        documentBack ? documentBack.replace(/^data:image\/\w+;base64,/, '') : undefined
      );

      // Update user KYC status
      const newKycStatus = result.overallStatus === 'approved' ? 'approved' :
        result.overallStatus === 'rejected' ? 'rejected' : 'pending';

      await storage.upsertUser({
        id: userId,
        kycStatus: newKycStatus as any,
      });

      logger.info(`[KYC] User ${userId} verification: ${result.overallStatus} `, { userId, status: result.overallStatus });

      res.json(result);
    } catch (error: any) {
      console.error('Error in KYC verification:', error);
      res.status(500).json({
        message: 'Erro na verificação de identidade',
        error: error.message
      });
    }
  });

  // Admin: List pending KYC verifications
  app.get('/api/admin/kyc/pending', isAuthenticated, async (req: any, res: Response) => {
    try {
      const adminUser = req.user;
      if (adminUser?.role !== 'admin') {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      // Get users with pending KYC
      const pendingUsers = await storage.getUsers?.() || [];
      const pending = pendingUsers.filter((u: any) => u.kycStatus === 'pending');

      res.json({
        verifications: pending.map((u: any) => ({
          userId: u.id,
          email: u.email,
          name: `${u.firstName || ''} ${u.lastName || ''} `.trim(),
          status: u.kycStatus,
          createdAt: u.createdAt,
        }))
      });
    } catch (error) {
      console.error('Error fetching pending KYC:', error);
      res.status(500).json({ message: 'Erro ao buscar verificações pendentes' });
    }
  });

  // Admin: Approve/Reject KYC manually
  app.post('/api/admin/kyc/:userId/review', isAuthenticated, async (req: any, res: Response) => {
    try {
      const adminUser = req.user;
      if (adminUser?.role !== 'admin') {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      const { userId } = req.params;
      const { action, notes } = req.body;

      if (!['approve', 'reject'].includes(action)) {
        return res.status(400).json({ message: 'Ação inválida' });
      }

      const newStatus = action === 'approve' ? 'approved' : 'rejected';

      await storage.upsertUser({
        id: userId,
        kycStatus: newStatus as any,
      });

      logger.info(`[KYC] Admin ${adminUser.id} ${action}d KYC for user ${userId}`, { adminId: adminUser.id, action, userId });

      res.json({
        success: true,
        userId,
        status: newStatus,
        reviewedBy: adminUser.id,
      });
    } catch (error) {
      console.error('Error reviewing KYC:', error);
      res.status(500).json({ message: 'Erro ao revisar verificação' });
    }
  });



  app.post('/api/payments/abacatepay', paymentLimiter, isAuthenticated, async (req: any, res: Response) => {
    try {
      const bookingId = req.body.bookingId as string;
      if (!bookingId) {
        return res.status(400).json({ message: "bookingId é obrigatório" });
      }

      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking não encontrado" });
      }
      const userId = req.user?.claims?.sub ?? req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      if (booking.studentId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      // Se já existir cobrança, apenas retorna
      if (booking.paymentId && booking.paymentUrl) {
        return res.json({
          paymentId: booking.paymentId,
          paymentUrl: booking.paymentUrl,
          paymentStatus: booking.paymentStatus,
          bookingStatus: booking.status,
        });
      }

      const integrationConfig = await resolveAbacateIntegrationConfig();
      const hasApiKey = Boolean(
        integrationConfig.apiKey || process.env.ABACATEPAY_API_KEY,
      );
      if (!hasApiKey) {
        return res.status(400).json({
          message: "Gateway de pagamento não configurado",
        });
      }

      const created = await createAbacateBilling(booking, integrationConfig);
      const bookingStatus = mapAbacateStatusToBooking(created.paymentStatus as any);
      const shouldGenerateCodes = bookingStatus === "paid";
      const startCode = shouldGenerateCodes
        ? (booking.startCode ?? generateSecurityCode())
        : booking.startCode;
      const endCode = shouldGenerateCodes
        ? (booking.endCode ?? generateSecurityCode())
        : booking.endCode;

      const updated = await storage.updateBooking(booking.id, {
        paymentId: created.paymentId,
        paymentUrl: created.paymentUrl,
        paymentStatus: created.paymentStatus,
        paymentProvider: "abacatepay",
        paymentMethods: created.paymentMethods,
        paymentDevMode: created.paymentDevMode,
        status: bookingStatus,
        paidAt: bookingStatus === "paid" ? new Date() : booking.paidAt,
        startCode,
        endCode,
      });

      storage.upsertBookingTransaction(updated).catch((error) => {
        logger.error("Error syncing booking transaction:", error);
      });

      res.json({
        bookingId: updated.id,
        paymentId: updated.paymentId,
        paymentUrl: updated.paymentUrl,
        paymentStatus: updated.paymentStatus,
        bookingStatus: updated.status,
      });
    } catch (error: any) {
      logger.error("Error creating AbacatePay billing:", error);
      res.status(500).json({ message: error?.message || "Failed to create payment" });
    }
  });

  app.post('/api/webhooks/abacatepay', async (req: Request, res: Response) => {
    try {
      const { verifyAbacateWebhookSignature, getAbacateBilling } = await import("./abacatepay");
      const raw = req.rawBody;
      const signature = req.headers["x-webhook-signature"] || req.headers["abacate-signature"];
      const secret = process.env.ABACATEPAY_WEBHOOK_SECRET;

      if (!secret) {
        logger.error("ABACATEPAY_WEBHOOK_SECRET not configured, skipping validation (DANGEROUS)");
        // In production this should be an error
        if (process.env.NODE_ENV === "production") {
          return res.status(500).json({ message: "Webhook secret not configured" });
        }
      } else if (!signature || !verifyAbacateWebhookSignature(raw as string | Buffer, signature as string, secret)) {
        logger.warn("Invalid AbacatePay webhook signature");
        return res.status(401).json({ message: "Invalid signature" });
      }

      const payload = req.body as any;
      const status = payload?.data?.status as string | undefined;
      const paymentId = payload?.data?.id as string | undefined;

      if (!paymentId) {
        return res.status(400).json({ message: "paymentId ausente" });
      }

      const integrationConfig = await resolveAbacateIntegrationConfig();
      const billing = await getAbacateBilling(paymentId, integrationConfig).catch(
        () => undefined,
      );
      const effectiveStatus = (billing?.status as any) || (status as any);
      const bookingStatus = mapAbacateStatusToBooking(effectiveStatus);

      // Procurar booking por paymentId
      const booking = await storage.getBookingByPaymentId?.(paymentId);
      if (!booking) {
        // fallback: nada a atualizar
        return res.status(202).json({ ok: true, message: "Booking não encontrado para paymentId" });
      }

      const shouldGenerateCodes = bookingStatus === "paid";
      const startCode = shouldGenerateCodes
        ? (booking.startCode ?? generateSecurityCode())
        : booking.startCode;
      const endCode = shouldGenerateCodes
        ? (booking.endCode ?? generateSecurityCode())
        : booking.endCode;

      const updatedBooking = await storage.updateBooking(booking.id, {
        paymentStatus: effectiveStatus,
        status: bookingStatus,
        paidAt: bookingStatus === "paid" ? new Date() : booking.paidAt,
        startCode,
        endCode,
      });

      if (bookingStatus === "paid") {
        import("./services/fees").then(({ feesService }) => {
          feesService.distributeBookingRevenue(updatedBooking.id).catch(err => {
            console.error("Error distributing revenue:", err);
          });
        });
      }

      storage.upsertBookingTransaction(updatedBooking).catch((error) => {
        logger.error("Error syncing booking transaction:", error);
      });

      res.json({ ok: true });
    } catch (error) {
      console.error("Error handling AbacatePay webhook:", error);
      res.status(500).json({ message: "Webhook error" });
    }
  });

  // =============================================================================
  // Wallet & Financial Routes
  // =============================================================================

  // Get Wallet Balance & History
  app.get("/api/wallet", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      if (!user) return res.status(401).json({ message: "Unauthorized" });

      const balance = await walletService.getBalance(user.id);
      const history = await walletService.getHistory(user.id);

      res.json({
        balance,
        currency: "BRL",
        history,
      });
    } catch (error: any) {
      logger.error("Error fetching wallet data:", error);
      res.status(500).json({ message: "Failed to fetch wallet data" });
    }
  });

  // Withdraw Request
  app.post("/api/wallet/withdraw", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const { amount, pixKey } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }

      if (!pixKey) {
        return res.status(400).json({ message: "Pix Key is required" });
      }

      const balance = await walletService.getBalance(user.id);
      if (balance < amount) {
        return res.status(400).json({ message: "Saldo insuficiente" });
      }

      // Debit wallet (creates transaction record)
      await walletService.debit(
        user.id,
        amount,
        "withdrawal",
        `Saque solicitado para chave PIX: ${pixKey} `
      );

      // TODO: Here we would trigger an actual payout via AbacatePay or notify admin
      // For now, it's just a debit/ledger record.

      logger.info(`Withdrawal requested by user ${user.id}: ${amount} BRL to ${pixKey} `);

      res.json({ success: true, message: "Saque solicitado com sucesso" });
    } catch (error: any) {
      logger.error("Error processing withdrawal:", error);
      res.status(500).json({ message: error.message || "Withdrawal failed" });
    }
  });

  // Stripe Payment Routes
  app.post("/api/payments/stripe/checkout", paymentLimiter, isAuthenticated, async (req: any, res: Response) => {
    try {
      const { bookingId } = req.body;
      const user = await storage.getUser(req.user.claims.sub);
      if (!user) return res.status(401).json({ message: "Unauthorized" });

      const booking = await storage.getBooking(bookingId);
      if (!booking) return res.status(404).json({ message: "Booking not found" });

      // Check if user owns booking
      if (booking.studentId !== user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }

      // Get Stripe integration config
      const environment = process.env.NODE_ENV === "production" ? "production" : "development";
      const integration = await storage.getIntegrationBySlug("stripe", environment);

      const config = integration?.status === "active" ? {
        apiKey: integration.fields?.find((f: any) => f.key === "apiKey")?.value,
        webhookSecret: integration.fields?.find((f: any) => f.key === "webhookSecret")?.value,
      } : undefined;

      const successUrl = `${req.protocol}://${req.get("host")}/sucesso?bookingId=${bookingId}&session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${req.protocol}://${req.get("host")}/checkout?bookingId=${bookingId}`;

      const session = await createStripeCheckoutSession(booking, successUrl, cancelUrl, config);

      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Stripe Checkout Error:", error);
      res.status(500).json({ message: error.message || "Failed to create checkout session" });
    }
  });

  app.post("/api/webhooks/stripe", async (req: Request, res: Response) => {
    const sig = req.headers["stripe-signature"];
    if (!sig) return res.status(400).send("Missing Stripe Signature");

    try {
      const environment = process.env.NODE_ENV === "production" ? "production" : "development";
      const integration = await storage.getIntegrationBySlug("stripe", environment);

      const config = integration?.status === "active" ? {
        apiKey: integration.fields?.find((f: any) => f.key === "apiKey")?.value,
        webhookSecret: integration.fields?.find((f: any) => f.key === "webhookSecret")?.value,
      } : undefined;

      // req.rawBody provided by server/index.ts middleware
      const rawBody = (req as any).rawBody;
      if (!rawBody) {
        throw new Error("Raw body not available");
      }

      const event = constructStripeWebhookEvent(rawBody, sig as string, config);

      if (event.type === "checkout.session.completed") {
        const session = event.data.object as any;
        const bookingId = session.metadata?.bookingId;

        if (bookingId) {
          console.log(`[Stripe] Payment confirmed for booking ${bookingId}`);

          // Generate security codes
          const startCode = Math.floor(1000 + Math.random() * 9000).toString();
          const endCode = Math.floor(1000 + Math.random() * 9000).toString();

          await storage.updateBooking(bookingId, {
            paymentId: session.id,
            paymentStatus: "paid",
            paymentProvider: "stripe",
            status: "paid",
            startCode,
            endCode
          });

          await storage.createTransaction({
            type: "booking",
            amount: session.amount_total ? (session.amount_total / 100).toString() : "0",
            currency: "BRL",
            status: "paid",
            referenceId: bookingId,
            referenceType: "booking",
            metadata: { stripeSessionId: session.id },
            instructorId: session.metadata?.instructorId || "",
            studentId: session.metadata?.studentId || "",
          });
        }
      }

      res.json({ received: true });
    } catch (error: any) {
      console.error("Stripe Webhook Error:", error.message);
      res.status(400).send(`Webhook Error: ${error.message}`);
    }
  });

  return httpServer;
}
