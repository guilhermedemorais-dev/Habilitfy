import { sql, relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

export const userRoleEnum = pgEnum('user_role', ['student', 'instructor', 'admin']);
export const bookingStatusEnum = pgEnum('booking_status', ['pending', 'confirmed', 'paid', 'completed', 'cancelled']);
export const instructorStatusEnum = pgEnum('instructor_status', ['pending', 'approved', 'rejected']);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").default('student').notNull(),
  phone: varchar("phone"),
  cpf: varchar("cpf"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const instructors = pgTable("instructors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  bio: text("bio"),
  pricePerHour: decimal("price_per_hour", { precision: 10, scale: 2 }).notNull(),
  vehicleModel: varchar("vehicle_model").notNull(),
  vehicleYear: varchar("vehicle_year"),
  vehicleType: varchar("vehicle_type").notNull(),
  vehiclePlate: varchar("vehicle_plate"),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  reviewsCount: integer("reviews_count").default(0),
  lat: decimal("lat", { precision: 10, scale: 7 }),
  lng: decimal("lng", { precision: 10, scale: 7 }),
  neighborhood: varchar("neighborhood"),
  credentialNumber: varchar("credential_number"),
  credentialImageUrl: varchar("credential_image_url"),
  vehicleImageUrl: varchar("vehicle_image_url"),
  status: instructorStatusEnum("status").default('pending').notNull(),
  serviceAreas: text("service_areas"),
  pixKey: varchar("pix_key"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").references(() => users.id).notNull(),
  instructorId: varchar("instructor_id").references(() => instructors.id).notNull(),
  date: timestamp("date").notNull(),
  duration: integer("duration").default(50).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  rentVehicle: boolean("rent_vehicle").default(false),
  vehicleRentalPrice: decimal("vehicle_rental_price", { precision: 10, scale: 2 }).default("0"),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  status: bookingStatusEnum("status").default('pending').notNull(),
  meetingAddress: text("meeting_address"),
  studentNotes: text("student_notes"),
  paymentStatus: varchar("payment_status").default('pending'),
  paymentId: varchar("payment_id"),
  paymentProvider: varchar("payment_provider"),
  paymentUrl: varchar("payment_url"),
  paymentMethods: jsonb("payment_methods"),
  paymentDevMode: boolean("payment_dev_mode"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: varchar("booking_id").references(() => bookings.id).notNull(),
  studentId: varchar("student_id").references(() => users.id).notNull(),
  instructorId: varchar("instructor_id").references(() => instructors.id).notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const availability = pgTable("availability", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  instructorId: varchar("instructor_id").references(() => instructors.id).notNull(),
  dayOfWeek: integer("day_of_week").notNull(),
  startTime: varchar("start_time").notNull(),
  endTime: varchar("end_time").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const usersRelations = relations(users, ({ many, one }) => ({
  instructorProfile: one(instructors, {
    fields: [users.id],
    references: [instructors.userId],
  }),
  bookingsAsStudent: many(bookings, { relationName: 'student_bookings' }),
  reviews: many(reviews),
}));

export const instructorsRelations = relations(instructors, ({ one, many }) => ({
  user: one(users, {
    fields: [instructors.userId],
    references: [users.id],
  }),
  bookings: many(bookings),
  reviews: many(reviews),
  availability: many(availability),
}));

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  student: one(users, {
    fields: [bookings.studentId],
    references: [users.id],
    relationName: 'student_bookings',
  }),
  instructor: one(instructors, {
    fields: [bookings.instructorId],
    references: [instructors.id],
  }),
  review: one(reviews),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  booking: one(bookings, {
    fields: [reviews.bookingId],
    references: [bookings.id],
  }),
  student: one(users, {
    fields: [reviews.studentId],
    references: [users.id],
  }),
  instructor: one(instructors, {
    fields: [reviews.instructorId],
    references: [instructors.id],
  }),
}));

export const availabilityRelations = relations(availability, ({ one }) => ({
  instructor: one(instructors, {
    fields: [availability.instructorId],
    references: [instructors.id],
  }),
}));

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export const insertInstructorSchema = createInsertSchema(instructors).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  rating: true,
  reviewsCount: true,
});
export type InsertInstructor = z.infer<typeof insertInstructorSchema>;
export type Instructor = typeof instructors.$inferSelect;

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
});
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;

export const insertAvailabilitySchema = createInsertSchema(availability).omit({
  id: true,
  createdAt: true,
});
export type InsertAvailability = z.infer<typeof insertAvailabilitySchema>;
export type Availability = typeof availability.$inferSelect;
