import {
  users,
  instructors,
  bookings,
  reviews,
  availability,
  type User,
  type UpsertUser,
  type Instructor,
  type InsertInstructor,
  type Booking,
  type InsertBooking,
  type Review,
  type InsertReview,
  type Availability,
  type InsertAvailability,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  getInstructor(id: string): Promise<Instructor | undefined>;
  getInstructorByUserId(userId: string): Promise<Instructor | undefined>;
  getAllInstructors(status?: string): Promise<Instructor[]>;
  createInstructor(instructor: InsertInstructor): Promise<Instructor>;
  updateInstructor(id: string, data: Partial<InsertInstructor>): Promise<Instructor>;
  
  getBooking(id: string): Promise<Booking | undefined>;
  getBookingsByStudent(studentId: string): Promise<Booking[]>;
  getBookingsByInstructor(instructorId: string): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBooking(id: string, data: Partial<InsertBooking>): Promise<Booking>;
  
  createReview(review: InsertReview): Promise<Review>;
  getReviewsByInstructor(instructorId: string): Promise<Review[]>;
  
  createAvailability(avail: InsertAvailability): Promise<Availability>;
  getAvailabilityByInstructor(instructorId: string): Promise<Availability[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getInstructor(id: string): Promise<Instructor | undefined> {
    const [instructor] = await db.select().from(instructors).where(eq(instructors.id, id));
    return instructor;
  }

  async getInstructorByUserId(userId: string): Promise<Instructor | undefined> {
    const [instructor] = await db.select().from(instructors).where(eq(instructors.userId, userId));
    return instructor;
  }

  async getAllInstructors(status?: string): Promise<Instructor[]> {
    if (status) {
      return db.select().from(instructors).where(eq(instructors.status, status as any));
    }
    return db.select().from(instructors);
  }

  async createInstructor(instructorData: InsertInstructor): Promise<Instructor> {
    const [instructor] = await db
      .insert(instructors)
      .values(instructorData)
      .returning();
    return instructor;
  }

  async updateInstructor(id: string, data: Partial<InsertInstructor>): Promise<Instructor> {
    const [instructor] = await db
      .update(instructors)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(instructors.id, id))
      .returning();
    return instructor;
  }

  async getBooking(id: string): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking;
  }

  async getBookingsByStudent(studentId: string): Promise<Booking[]> {
    return db.select().from(bookings)
      .where(eq(bookings.studentId, studentId))
      .orderBy(desc(bookings.date));
  }

  async getBookingsByInstructor(instructorId: string): Promise<Booking[]> {
    return db.select().from(bookings)
      .where(eq(bookings.instructorId, instructorId))
      .orderBy(desc(bookings.date));
  }

  async createBooking(bookingData: InsertBooking): Promise<Booking> {
    const [booking] = await db
      .insert(bookings)
      .values(bookingData)
      .returning();
    return booking;
  }

  async updateBooking(id: string, data: Partial<InsertBooking>): Promise<Booking> {
    const [booking] = await db
      .update(bookings)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(bookings.id, id))
      .returning();
    return booking;
  }

  async createReview(reviewData: InsertReview): Promise<Review> {
    const [review] = await db
      .insert(reviews)
      .values(reviewData)
      .returning();
    
    const allReviews = await db.select().from(reviews)
      .where(eq(reviews.instructorId, reviewData.instructorId));
    
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    
    await db.update(instructors)
      .set({
        rating: avgRating.toFixed(2),
        reviewsCount: allReviews.length,
      })
      .where(eq(instructors.id, reviewData.instructorId));
    
    return review;
  }

  async getReviewsByInstructor(instructorId: string): Promise<Review[]> {
    return db.select().from(reviews)
      .where(eq(reviews.instructorId, instructorId))
      .orderBy(desc(reviews.createdAt));
  }

  async createAvailability(availData: InsertAvailability): Promise<Availability> {
    const [avail] = await db
      .insert(availability)
      .values(availData)
      .returning();
    return avail;
  }

  async getAvailabilityByInstructor(instructorId: string): Promise<Availability[]> {
    return db.select().from(availability)
      .where(eq(availability.instructorId, instructorId));
  }
}

export const storage = new DatabaseStorage();
