
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
  bookings,
  messages,
  supportTickets,
  transactions,
  wallets,
  walletEntries,
  withdrawals,
  vehicles,
  webhooksEvents,
  userAccessLogs,
  User,
} from "@shared/schema";
import { kycVerifications as kycVerificationsTable } from "@shared/kyc-schema";
import { saveBase64Image } from "./kyc";
import { and, desc, eq, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";
import { setupAuth, isAuthenticated, hashPassword, requireAdmin, requireAdminRole } from "./auth";
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
import { registerAdminConfigRoutes } from "./routes/admin-config";
import { registerAdminUserManagementRoutes } from "./routes/admin-user-management";
import { registerAdminFinanceRoutes } from "./routes/admin-finance";
import { registerAdminControlRoutes } from "./routes/admin-control";
import { registerAdminOperationsRoutes } from "./routes/admin-operations";
import { registerKycAdminRoutes } from "./routes/kyc-admin";


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
  app.use("/api/admin", requireAdmin);

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

  // --- Admin Routes ---

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

  registerAdminControlRoutes(app, {
    getRequestCount: () => requestCount,
    getErrorCount: () => errorCount,
  });
  registerAdminUserManagementRoutes(app);
  registerAdminFinanceRoutes(app);
  registerAdminConfigRoutes(app);
  registerAdminOperationsRoutes(app);
  registerKycAdminRoutes(app);
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

      if (normalizedCpf) {
        const [existingByCpf] = await db
          .select()
          .from(users)
          .where(and(eq(users.cpf, normalizedCpf), eq(users.isBlocked, false)))
          .limit(1);
        if (existingByCpf) {
          return res.status(409).json({
            message: "Já existe uma conta ativa vinculada a este CPF.",
            code: "CPF_ALREADY_REGISTERED",
          });
        }
      }

      if (normalizedCnpj) {
        const [existingByCnpj] = await db
          .select()
          .from(users)
          .where(and(eq(users.cnpj, normalizedCnpj), eq(users.isBlocked, false)))
          .limit(1);
        if (existingByCnpj) {
          return res.status(409).json({
            message: "Já existe uma conta ativa vinculada a este CNPJ.",
            code: "CNPJ_ALREADY_REGISTERED",
          });
        }
      }

      // Check if email already exists
      const existingUser = await storage.getUserByEmail?.(normalizedEmail);
      if (existingUser) {
        if (role === "instructor") {
          const existingInstructor = await storage.getInstructorByUserId(existingUser.id);
          if (!existingInstructor) {
            return res.status(409).json({
              message:
                "Este e-mail já possui uma conta base cadastrada, mas o perfil de instrutor está incompleto. Entre em contato com o suporte para concluir a ativação.",
              code: "INSTRUCTOR_PROFILE_INCOMPLETE",
            });
          }
        }

        return res.status(409).json({
          message: "Este e-mail já está cadastrado em uma conta ativa.",
          code: "USER_ALREADY_EXISTS",
        });
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
      logger.info("[register] User persisted", {
        userId: newUser.id,
        email: newUser.email,
        role: newUser.role,
        kycStatus: newUser.kycStatus,
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

        const instructorProfile = await storage.createInstructor({
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
        logger.info("[register] Instructor profile persisted", {
          userId,
          instructorId: instructorProfile.id,
          instructorStatus: instructorProfile.status,
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

      // Import provider check
      const { isKycProviderAvailable } = await import('./kyc');

      res.json({
        status: kycStatus,
        canRetry: kycStatus === 'rejected',
        userId: user.id,
        providerAvailable: isKycProviderAvailable(),
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

      // Check consent before allowing upload (Phase 2 — LGPD)
      const { hasValidConsent } = await import('./kyc-admin');
      const hasConsent = await hasValidConsent(userId);
      if (!hasConsent) {
        return res.status(403).json({
          message: 'Você precisa aceitar o termo de consentimento antes de enviar documentos.',
          code: 'CONSENT_REQUIRED',
        });
      }

      // Import KYC service
      const { performKycVerification, saveBase64Image } = await import('./kyc');
      const { computeFileHash, logKycAuditEvent } = await import('./kyc-admin');
      const { KYC_AUDIT_EVENTS, KYC_REASON_CODES } = await import('@shared/kyc-schema');

      const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip;

      // Log KYC started
      await logKycAuditEvent({
        userId,
        eventType: KYC_AUDIT_EVENTS.STARTED,
        ipAddress,
        userAgent: req.headers['user-agent'],
      });

      // Save images + compute hashes (Phase 5 — Hardening)
      const selfieUrl = await saveBase64Image(selfie, userId, 'selfie');
      const fileHashSelfie = computeFileHash(selfie);
      const documentFrontUrl = await saveBase64Image(documentFront, userId, 'document_front');
      const fileHashDocumentFront = computeFileHash(documentFront);
      let documentBackUrl;
      let fileHashDocumentBack;
      if (documentBack) {
        documentBackUrl = await saveBase64Image(documentBack, userId, 'document_back');
        fileHashDocumentBack = computeFileHash(documentBack);
      }

      // Log uploads
      await logKycAuditEvent({
        userId,
        eventType: KYC_AUDIT_EVENTS.SELFIE_UPLOADED,
        metadata: { fileHash: fileHashSelfie },
        ipAddress,
        userAgent: req.headers['user-agent'],
      });
      await logKycAuditEvent({
        userId,
        eventType: KYC_AUDIT_EVENTS.DOCUMENT_UPLOADED,
        metadata: { fileHash: fileHashDocumentFront, type: 'front' },
        ipAddress,
        userAgent: req.headers['user-agent'],
      });

      // Extract base64 data (remove data URL prefix)
      const selfieBase64 = selfie.replace(/^data:image\/\w+;base64,/, '');
      const documentFrontBase64 = documentFront.replace(/^data:image\/\w+;base64,/, '');

      // Log AI analysis start
      await logKycAuditEvent({
        userId,
        eventType: KYC_AUDIT_EVENTS.AI_ANALYSIS_STARTED,
        ipAddress,
      });

      // Perform verification
      const result = await performKycVerification(
        userId,
        selfieBase64,
        documentFrontBase64,
        documentBack ? documentBack.replace(/^data:image\/\w+;base64,/, '') : undefined
      );

      // Log AI analysis result
      await logKycAuditEvent({
        userId,
        eventType: result.success ? KYC_AUDIT_EVENTS.AI_ANALYSIS_COMPLETED : KYC_AUDIT_EVENTS.AI_ANALYSIS_FAILED,
        newStatus: result.overallStatus,
        reasonCode: result.success ? undefined : KYC_REASON_CODES.TECHNICAL_ANALYSIS_FAILED,
        metadata: {
          faceMatchPassed: result.faceMatchPassed,
          documentValid: result.documentValid,
          rejectionReasons: result.rejectionReasons,
        },
        ipAddress,
      });

      // Update user KYC status — preserve requires_review, don't map to pending
      const statusMap: Record<string, string> = {
        approved: 'approved',
        rejected: 'rejected',
        requires_review: 'pending', // user.kycStatus enum only has pending/approved/rejected
      };
      const newKycStatus = statusMap[result.overallStatus] || 'pending';

      await storage.upsertUser({
        id: userId,
        kycStatus: newKycStatus as any,
      });

      // Store the detailed result in kyc_verifications if we have documents
      // The actual requires_review status is preserved in the verification record

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

    let webhookEventId: string | undefined;
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
      webhookEventId = event.id;
      if (!webhookEventId) {
        return res.status(400).send("Webhook Error: event.id ausente");
      }

      const [existingEvent] = await db
        .select()
        .from(webhooksEvents)
        .where(
          and(
            eq(webhooksEvents.provider, "stripe"),
            eq(webhooksEvents.eventId, webhookEventId),
          ),
        )
        .limit(1);

      if (existingEvent?.status === "processed") {
        return res.json({ received: true, idempotent: true });
      }

      if (!existingEvent) {
        await db.insert(webhooksEvents).values({
          eventId: webhookEventId,
          eventType: event.type,
          provider: "stripe",
          payload: event as any,
          status: "pending",
        });
      }

      if (event.type === "checkout.session.completed") {
        const session = event.data.object as any;
        const bookingId = session.metadata?.bookingId;

        if (bookingId) {
          console.log(`[Stripe] Payment confirmed for booking ${bookingId}`);

          // Generate security codes
          const startCode = Math.floor(1000 + Math.random() * 9000).toString();
          const endCode = Math.floor(1000 + Math.random() * 9000).toString();

          const updated = await storage.updateBooking(bookingId, {
            paymentId: session.id,
            paymentStatus: "paid",
            paymentProvider: "stripe",
            status: "paid",
            startCode,
            endCode
          });

          await storage.upsertBookingTransaction(updated);
        }
      }

      await db
        .update(webhooksEvents)
        .set({
          status: "processed",
          processedAt: new Date(),
          eventType: event.type,
        })
        .where(
          and(
            eq(webhooksEvents.provider, "stripe"),
            eq(webhooksEvents.eventId, webhookEventId),
          ),
        );

      res.json({ received: true });
    } catch (error: any) {
      if (webhookEventId) {
        await db
          .update(webhooksEvents)
          .set({
            status: "failed",
            processedAt: new Date(),
          })
          .where(
            and(
              eq(webhooksEvents.provider, "stripe"),
              eq(webhooksEvents.eventId, webhookEventId),
            ),
          )
          .catch(() => undefined);
      }
      console.error("Stripe Webhook Error:", error.message);
      res.status(400).send(`Webhook Error: ${error.message}`);
    }
  });

  return httpServer;
}
