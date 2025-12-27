import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertInstructorSchema, insertBookingSchema, insertReviewSchema } from "@shared/schema";
import { z } from "zod";
import { createAbacateBilling, getAbacateBilling, mapAbacateStatusToBooking } from "./abacatepay";

export async function registerRoutes(app: Express): Promise<Server> {
  await setupAuth(app);

  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
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
      res.json(instructors);
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
      res.json(instructor);
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

  app.patch('/api/instructors/:id', isAuthenticated, async (req, res) => {
    try {
      const instructor = await storage.updateInstructor(req.params.id, req.body);
      res.json(instructor);
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
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching student bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.get('/api/bookings/instructor/:instructorId', isAuthenticated, async (req, res) => {
    try {
      const bookings = await storage.getBookingsByInstructor(req.params.instructorId);
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching instructor bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.post('/api/bookings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertBookingSchema.parse({ ...req.body, studentId: userId });
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

  app.patch('/api/bookings/:id', isAuthenticated, async (req, res) => {
    try {
      const booking = await storage.updateBooking(req.params.id, req.body);
      res.json(booking);
    } catch (error) {
      console.error("Error updating booking:", error);
      res.status(500).json({ message: "Failed to update booking" });
    }
  });

  app.post('/api/reviews', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertReviewSchema.parse({ ...req.body, studentId: userId });
      const review = await storage.createReview(data);
      res.status(201).json(review);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating review:", error);
      res.status(500).json({ message: "Failed to create review" });
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

  const httpServer = createServer(app);

  app.post('/api/payments/abacatepay', isAuthenticated, async (req: any, res) => {
    try {
      const bookingId = req.body.bookingId as string;
      if (!bookingId) {
        return res.status(400).json({ message: "bookingId é obrigatório" });
      }

      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking não encontrado" });
      }
      if (booking.studentId !== req.user.claims.sub) {
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

      const created = await createAbacateBilling(booking);
      const bookingStatus = mapAbacateStatusToBooking(created.paymentStatus as any);

      const updated = await storage.updateBooking(booking.id, {
        paymentId: created.paymentId,
        paymentUrl: created.paymentUrl,
        paymentStatus: created.paymentStatus,
        paymentProvider: "abacatepay",
        paymentMethods: created.paymentMethods,
        paymentDevMode: created.paymentDevMode,
        status: bookingStatus,
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

      const billing = await getAbacateBilling(paymentId).catch(() => undefined);
      const effectiveStatus = (billing?.status as any) || (status as any);
      const bookingStatus = mapAbacateStatusToBooking(effectiveStatus);

      // Procurar booking por paymentId
      const booking = await storage.getBookingByPaymentId?.(paymentId);
      if (!booking) {
        // fallback: nada a atualizar
        return res.status(202).json({ ok: true, message: "Booking não encontrado para paymentId" });
      }

      await storage.updateBooking(booking.id, {
        paymentStatus: effectiveStatus,
        status: bookingStatus,
        paidAt: bookingStatus === "paid" ? new Date() : booking.paidAt,
      });

      res.json({ ok: true });
    } catch (error) {
      console.error("Error handling AbacatePay webhook:", error);
      res.status(500).json({ message: "Webhook error" });
    }
  });

  return httpServer;
}
