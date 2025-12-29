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
export const transactionTypeEnum = pgEnum('transaction_type', [
  'booking',
  'withdrawal',
  'refund',
  'commission',
  'affiliate',
  'coupon',
]);
export const transactionStatusEnum = pgEnum('transaction_status', [
  'pending',
  'paid',
  'processing',
  'refunded',
  'cancelled',
  'failed',
]);
export const withdrawalStatusEnum = pgEnum('withdrawal_status', [
  'pending',
  'approved',
  'rejected',
  'processed',
]);
export const walletEntryTypeEnum = pgEnum('wallet_entry_type', [
  'credit',
  'debit',
  'refund',
  'withdrawal',
  'adjustment',
]);
export const integrationStatusEnum = pgEnum('integration_status', [
  'active',
  'inactive',
]);
export const integrationEnvironmentEnum = pgEnum('integration_environment', [
  'development',
  'production',
]);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").default('student').notNull(),
  phone: varchar("phone"),
  cpf: varchar("cpf"),
  neighborhood: varchar("neighborhood"),
  city: varchar("city"),
  state: varchar("state"),
  lat: decimal("lat", { precision: 10, scale: 7 }),
  lng: decimal("lng", { precision: 10, scale: 7 }),
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
  city: varchar("city"),
  state: varchar("state"),
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

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: varchar("booking_id").references(() => bookings.id),
  type: transactionTypeEnum("type").notNull(),
  status: transactionStatusEnum("status").default('pending').notNull(),
  amountGross: decimal("amount_gross", { precision: 10, scale: 2 }).notNull(),
  amountNet: decimal("amount_net", { precision: 10, scale: 2 }).notNull(),
  gateway: varchar("gateway"),
  paymentId: varchar("payment_id"),
  fromUserId: varchar("from_user_id").references(() => users.id),
  toUserId: varchar("to_user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const wallets = pgTable("wallets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  balance: decimal("balance", { precision: 10, scale: 2 }).default("0"),
  currency: varchar("currency").default("BRL"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const walletEntries = pgTable("wallet_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletId: varchar("wallet_id").references(() => wallets.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  type: walletEntryTypeEnum("type").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  bookingId: varchar("booking_id").references(() => bookings.id),
  transactionId: varchar("transaction_id").references(() => transactions.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const withdrawals = pgTable("withdrawals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: withdrawalStatusEnum("status").default('pending').notNull(),
  destinationType: varchar("destination_type").default("pix"),
  destinationKey: varchar("destination_key"),
  requestedAt: timestamp("requested_at").defaultNow(),
  processedAt: timestamp("processed_at"),
  processedByUserId: varchar("processed_by_user_id").references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const paymentGateways = pgTable("payment_gateways", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  provider: varchar("provider").notNull(),
  apiKey: text("api_key"),
  status: varchar("status").default("active"),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type IntegrationFieldType =
  | "text"
  | "secret"
  | "url"
  | "number"
  | "boolean";

export type IntegrationField = {
  key: string;
  label?: string | null;
  type: IntegrationFieldType;
  value?: string | null;
  required?: boolean;
  placeholder?: string | null;
};

export const integrations = pgTable(
  "integrations",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    name: varchar("name").notNull(),
    slug: varchar("slug").notNull(),
    category: varchar("category").notNull(),
    status: integrationStatusEnum("status").default("active").notNull(),
    environment: integrationEnvironmentEnum("environment")
      .default("production")
      .notNull(),
    isDefault: boolean("is_default").default(false),
    fields: jsonb("fields").$type<IntegrationField[]>(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("integrations_slug_env_idx").on(table.slug, table.environment),
    index("integrations_category_env_idx").on(table.category, table.environment),
  ],
);

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

export const transactionsRelations = relations(transactions, ({ one }) => ({
  booking: one(bookings, {
    fields: [transactions.bookingId],
    references: [bookings.id],
  }),
  fromUser: one(users, {
    fields: [transactions.fromUserId],
    references: [users.id],
  }),
  toUser: one(users, {
    fields: [transactions.toUserId],
    references: [users.id],
  }),
}));

export const walletsRelations = relations(wallets, ({ one, many }) => ({
  user: one(users, {
    fields: [wallets.userId],
    references: [users.id],
  }),
  entries: many(walletEntries),
}));

export const walletEntriesRelations = relations(walletEntries, ({ one }) => ({
  wallet: one(wallets, {
    fields: [walletEntries.walletId],
    references: [wallets.id],
  }),
  user: one(users, {
    fields: [walletEntries.userId],
    references: [users.id],
  }),
  booking: one(bookings, {
    fields: [walletEntries.bookingId],
    references: [bookings.id],
  }),
  transaction: one(transactions, {
    fields: [walletEntries.transactionId],
    references: [transactions.id],
  }),
}));

export const withdrawalsRelations = relations(withdrawals, ({ one }) => ({
  user: one(users, {
    fields: [withdrawals.userId],
    references: [users.id],
  }),
  processedBy: one(users, {
    fields: [withdrawals.processedByUserId],
    references: [users.id],
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

export type Transaction = typeof transactions.$inferSelect;
export type Wallet = typeof wallets.$inferSelect;
export type WalletEntry = typeof walletEntries.$inferSelect;
export type Withdrawal = typeof withdrawals.$inferSelect;
export type PaymentGateway = typeof paymentGateways.$inferSelect;
export type Integration = typeof integrations.$inferSelect;
export type IntegrationInsert = typeof integrations.$inferInsert;

export const insertAvailabilitySchema = createInsertSchema(availability).omit({
  id: true,
  createdAt: true,
});
export type InsertAvailability = z.infer<typeof insertAvailabilitySchema>;
export type Availability = typeof availability.$inferSelect;
