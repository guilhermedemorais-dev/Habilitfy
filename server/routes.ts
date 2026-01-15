import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertInstructorSchema, insertBookingSchema, insertReviewSchema, insertAvailabilitySchema, insertMessageSchema } from "@shared/schema";
import { z } from "zod";
import { createAbacateBilling, getAbacateBilling, mapAbacateStatusToBooking } from "./abacatepay";
import rateLimit from "express-rate-limit";

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

const maskApiKey = (value?: string | null) => {
  if (!value) return null;
  const trimmed = value.trim();
  if (trimmed.length <= 4) return "****";
  return `****${trimmed.slice(-4)}`;
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

export async function registerRoutes(app: Express): Promise<Server> {
  await setupAuth(app);

  app.get('/api/ping', (req, res) => {
    res.json({ message: 'pong', timestamp: new Date().toISOString() });
  });

  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub ?? req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const instructorProfile = await storage.getInstructorByUserId(userId);

      res.json({ ...user, instructorProfile });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.get('/api/instructors', async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const instructors = await storage.getAllInstructors(status || 'approved');
      const enriched = await Promise.all(
        instructors.map(async (instructor) => {
          const user = await storage.getUser(instructor.userId);
          const name =
            `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
            user?.email ||
            "Instrutor";
          const vehicle = `${instructor.vehicleModel} ${instructor.vehicleYear || ""}`.trim();
          return {
            ...instructor,
            user: user
              ? {
                  id: user.id,
                  firstName: user.firstName,
                  lastName: user.lastName,
                  email: user.email,
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

  app.get('/api/instructors/:id', async (req, res) => {
    try {
      const instructor = await storage.getInstructor(req.params.id);
      if (!instructor) {
        return res.status(404).json({ message: "Instructor not found" });
      }
      const user = await storage.getUser(instructor.userId);
      const name =
        `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
        user?.email ||
        "Instrutor";
      const vehicle = `${instructor.vehicleModel} ${instructor.vehicleYear || ""}`.trim();

      res.json({
        ...instructor,
        user: user
          ? {
              id: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
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

  app.post('/api/instructors', isAuthenticated, async (req: any, res) => {
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

  app.patch('/api/instructors/:id', isAuthenticated, async (req: any, res) => {
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

      const updated = await storage.updateInstructor(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating instructor:", error);
      res.status(500).json({ message: "Failed to update instructor" });
    }
  });

  app.get('/api/instructors/:id/reviews', async (req, res) => {
    try {
      const reviews = await storage.getReviewsByInstructor(req.params.id);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.get('/api/bookings/student', isAuthenticated, async (req: any, res) => {
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
              name: `${instructorUser.firstName || ''} ${instructorUser.lastName || ''}`.trim() || instructorUser.email || 'Instrutor',
              photo: instructorUser.profileImageUrl || '',
              vehicle: `${instructor.vehicleModel} ${instructor.vehicleYear || ''}`.trim(),
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

  app.get('/api/bookings/instructor/:instructorId', isAuthenticated, async (req, res) => {
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
              name: `${student.firstName || ''} ${student.lastName || ''}`.trim() || student.email || 'Aluno',
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

  app.post('/api/bookings', bookingLimiter, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertBookingSchema.parse({ ...req.body, studentId: userId });

      // 1. Check for booking conflicts (same instructor, overlapping time)
      const existingBookings = await storage.getBookingsByInstructor(data.instructorId);
      const newStart = new Date(data.date);
      const newEnd = new Date(newStart.getTime() + (data.duration || 60) * 60000);

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
      const availability = await storage.getAvailabilityByInstructor(data.instructorId);
      if (availability.length > 0) {
        const bookingDate = new Date(data.date);
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

      const booking = await storage.createBooking(data);
      res.status(201).json(booking);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating booking:", error);
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  app.patch('/api/bookings/:id', isAuthenticated, async (req: any, res) => {
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
          console.error("Error syncing booking transaction:", error);
        });
      }
      res.json(booking);
    } catch (error) {
      console.error("Error updating booking:", error);
      res.status(500).json({ message: "Failed to update booking" });
    }
  });

  // Availability routes
  // Reviews routes
  app.post('/api/reviews', isAuthenticated, async (req: any, res) => {
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

  app.get('/api/instructors/:id/reviews', async (req, res) => {
    try {
      const reviews = await storage.getReviewsByInstructor(req.params.id);

      // Enrich with student names if possible (need to fetch users)
      // For MVP, returning raw reviews. 
      // Ideally, storage.getReviewsByInstructor should join with users table.

      res.json(reviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.get('/api/instructors/:id/availability', async (req, res) => {
    try {
      const slots = await storage.getAvailabilityByInstructor(req.params.id);
      res.json(slots);
    } catch (error) {
      console.error("Error fetching availability:", error);
      res.status(500).json({ message: "Failed to fetch availability" });
    }
  });

  app.post('/api/instructors/:id/availability', isAuthenticated, async (req: any, res) => {
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

      const slot = await storage.createAvailability(data);
      res.status(201).json(slot);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating availability:", error);
      res.status(500).json({ message: "Failed to create availability" });
    }
  });

  app.get('/api/admin/instructors/pending', isAuthenticated, async (req: any, res) => {
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

  app.get('/api/admin/instructors', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }
      const status = req.query.status as string | undefined;
      const instructors = await storage.getInstructorsWithUser(status);
      res.json(instructors);
    } catch (error) {
      console.error("Error fetching instructors:", error);
      res.status(500).json({ message: "Failed to fetch instructors" });
    }
  });

  app.get('/api/admin/bookings', isAuthenticated, async (req: any, res) => {
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
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching admin bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.get('/api/admin/dashboard', isAuthenticated, async (req: any, res) => {
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

  app.get('/api/admin/geo-summary', isAuthenticated, async (req: any, res) => {
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

  app.get('/api/admin/users', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }
      const role = req.query.role as string | undefined;
      const users = await storage.getUsers(role);
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.patch('/api/admin/instructors/:id/status', isAuthenticated, async (req: any, res) => {
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

  app.get('/api/admin/finance/summary', isAuthenticated, async (req: any, res) => {
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

  app.get('/api/admin/finance/timeseries', isAuthenticated, async (req: any, res) => {
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

  app.get('/api/admin/transactions', isAuthenticated, async (req: any, res) => {
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
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching admin transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.get('/api/admin/wallets', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }

      const role = req.query.role as string | undefined;
      const wallets = await storage.getWalletsWithUser(role);
      res.json(wallets);
    } catch (error) {
      console.error("Error fetching admin wallets:", error);
      res.status(500).json({ message: "Failed to fetch wallets" });
    }
  });

  app.get('/api/admin/wallet-entries', isAuthenticated, async (req: any, res) => {
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
      res.json(entries);
    } catch (error) {
      console.error("Error fetching admin wallet entries:", error);
      res.status(500).json({ message: "Failed to fetch wallet entries" });
    }
  });

  app.get('/api/admin/withdrawals', isAuthenticated, async (req: any, res) => {
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
      res.json(withdrawals);
    } catch (error) {
      console.error("Error fetching admin withdrawals:", error);
      res.status(500).json({ message: "Failed to fetch withdrawals" });
    }
  });

  app.patch('/api/admin/withdrawals/:id', isAuthenticated, async (req: any, res) => {
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

  app.get('/api/admin/payment-gateways', isAuthenticated, async (req: any, res) => {
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

  app.post('/api/admin/payment-gateways', isAuthenticated, async (req: any, res) => {
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

  app.patch('/api/admin/payment-gateways/:id', isAuthenticated, async (req: any, res) => {
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

  app.get('/api/admin/integrations', isAuthenticated, async (req: any, res) => {
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

  app.post('/api/admin/integrations', isAuthenticated, async (req: any, res) => {
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

  app.patch('/api/admin/integrations/:id', isAuthenticated, async (req: any, res) => {
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
  app.get('/api/chat/contacts', isAuthenticated, async (req: any, res) => {
    try {
      const contacts = await storage.getContacts(req.user.claims.sub);
      res.json(contacts);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      res.status(500).json({ message: "Failed to fetch contacts" });
    }
  });

  app.get('/api/chat/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const messages = await storage.getMessages(req.params.userId, req.user.claims.sub);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post('/api/chat', isAuthenticated, async (req: any, res) => {
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

  app.post('/api/chat/:userId/read', isAuthenticated, async (req: any, res) => {
    try {
      await storage.markMessagesAsRead(req.params.userId, req.user.claims.sub);
      res.sendStatus(200);
    } catch (error) {
      console.error("Error marking messages as read:", error);
      res.status(500).json({ message: "Failed to mark messages as read" });
    }
  });

  const httpServer = createServer(app);

  app.post('/api/payments/abacatepay', paymentLimiter, isAuthenticated, async (req: any, res) => {
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

      const updated = await storage.updateBooking(booking.id, {
        paymentId: created.paymentId,
        paymentUrl: created.paymentUrl,
        paymentStatus: created.paymentStatus,
        paymentProvider: "abacatepay",
        paymentMethods: created.paymentMethods,
        paymentDevMode: created.paymentDevMode,
        status: bookingStatus,
        paidAt: bookingStatus === "paid" ? new Date() : booking.paidAt,
      });

      storage.upsertBookingTransaction(updated).catch((error) => {
        console.error("Error syncing booking transaction:", error);
      });

      res.json({
        bookingId: updated.id,
        paymentId: updated.paymentId,
        paymentUrl: updated.paymentUrl,
        paymentStatus: updated.paymentStatus,
        bookingStatus: updated.status,
      });
    } catch (error: any) {
      console.error("Error creating AbacatePay billing:", error);
      res.status(500).json({ message: error?.message || "Failed to create payment" });
    }
  });

  app.post('/api/webhooks/abacatepay', async (req: any, res) => {
    try {
      const raw = req.rawBody;
      // TODO: validar assinatura com ABACATEPAY_WEBHOOK_SECRET usando raw body + header
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

      const updatedBooking = await storage.updateBooking(booking.id, {
        paymentStatus: effectiveStatus,
        status: bookingStatus,
        paidAt: bookingStatus === "paid" ? new Date() : booking.paidAt,
      });

      storage.upsertBookingTransaction(updatedBooking).catch((error) => {
        console.error("Error syncing booking transaction:", error);
      });

      res.json({ ok: true });
    } catch (error) {
      console.error("Error handling AbacatePay webhook:", error);
      res.status(500).json({ message: "Webhook error" });
    }
  });

  return httpServer;
}
