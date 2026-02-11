import { sql, relations } from 'drizzle-orm';
import {
  index,
  json,
  mysqlTable,
  timestamp,
  varchar,
  text,
  int,
  decimal,
  boolean,
  mysqlEnum,
} from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const sessions = mysqlTable(
  "sessions",
  {
    sid: varchar("sid", { length: 255 }).primaryKey(),
    sess: json("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

export const userRoleEnum = mysqlEnum('role', ['student', 'instructor', 'admin']);
export const adminRoleEnum = mysqlEnum('admin_role', ['master', 'manager', 'support']);
export const kycStatusEnum = mysqlEnum('kyc_status', ['pending', 'approved', 'rejected']);
export const bookingStatusEnum = mysqlEnum('booking_status', ['pending', 'confirmed', 'paid', 'completed', 'cancelled']);
export const instructorStatusEnum = mysqlEnum('instructor_status', ['pending', 'approved', 'rejected']);
export const disputeStatusEnum = mysqlEnum('dispute_status', ['open', 'in_review', 'resolved']);
export const disputeResolutionEnum = mysqlEnum('dispute_resolution', ['refund_student', 'release_instructor', 'split']);
export const transactionTypeEnum = mysqlEnum('transaction_type', [
  'booking',
  'withdrawal',
  'refund',
  'commission',
  'affiliate',
  'coupon',
]);
export const transactionStatusEnum = mysqlEnum('transaction_status', [
  'pending',
  'paid',
  'processing',
  'refunded',
  'cancelled',
  'failed',
]);
export const withdrawalStatusEnum = mysqlEnum('withdrawal_status', [
  'pending',
  'approved',
  'rejected',
  'processed',
]);
export const walletEntryTypeEnum = mysqlEnum('wallet_entry_type', [
  'credit',
  'debit',
  'refund',
  'withdrawal',
  'adjustment',
]);
export const integrationStatusEnum = mysqlEnum('integration_status', [
  'active',
  'inactive',
]);
export const integrationEnvironmentEnum = mysqlEnum('integration_environment', [
  'development',
  'production',
]);

export const vehicleStatusEnum = mysqlEnum('vehicle_status', [
  'pending',
  'approved',
  'rejected',
]);

export const ticketStatusEnum = mysqlEnum('ticket_status', [
  'open',
  'in_progress',
  'resolved',
  'closed',
]);

export const captureSessionStatusEnum = mysqlEnum('capture_session_status', [
  'pending',
  'completed',
  'expired',
]);

export const captureSessions = mysqlTable("capture_sessions", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  sessionToken: varchar("session_token", { length: 64 }).notNull().unique(),
  imageData: text("image_data"),
  status: captureSessionStatusEnum.default('pending').notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type CaptureSession = typeof captureSessions.$inferSelect;

export const users = mysqlTable("users", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  email: varchar("email", { length: 255 }).unique(),
  googleId: varchar("google_id", { length: 255 }).unique(),
  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  profileImageUrl: varchar("profile_image_url", { length: 500 }),
  role: userRoleEnum.default('student').notNull(),
  adminRole: adminRoleEnum,
  kycStatus: kycStatusEnum.default("approved").notNull(),
  phone: varchar("phone", { length: 50 }),
  cpf: varchar("cpf", { length: 20 }),
  cnpj: varchar("cnpj", { length: 20 }),
  addressLine: varchar("address_line", { length: 500 }),
  zipCode: varchar("zip_code", { length: 20 }),
  neighborhood: varchar("neighborhood", { length: 255 }),
  city: varchar("city", { length: 255 }),
  state: varchar("state", { length: 50 }),
  lat: decimal("lat", { precision: 10, scale: 7 }),
  lng: decimal("lng", { precision: 10, scale: 7 }),
  password: text("password"),
  isVerified: boolean("is_verified").default(false).notNull(),
  verificationToken: varchar("verification_token", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const adminLogs = mysqlTable("admin_logs", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  adminId: varchar("admin_id", { length: 36 }).references(() => users.id).notNull(),
  action: varchar("action", { length: 255 }).notNull(),
  targetId: varchar("target_id", { length: 36 }),
  changes: json("changes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const instructors = mysqlTable("instructors", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  userId: varchar("user_id", { length: 36 }).references(() => users.id).notNull(),
  bio: text("bio"),
  pricePerHour: decimal("price_per_hour", { precision: 10, scale: 2 }).notNull(),
  slotDurationMinutes: int("slot_duration_minutes").default(50).notNull(),
  maxBookingsPerStudent: int("max_bookings_per_student").default(0).notNull(),
  vehicleModel: varchar("vehicle_model", { length: 255 }).notNull(),
  vehicleYear: varchar("vehicle_year", { length: 10 }),
  vehicleType: varchar("vehicle_type", { length: 100 }).notNull(),
  vehiclePlate: varchar("vehicle_plate", { length: 20 }),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  reviewsCount: int("reviews_count").default(0),
  lat: decimal("lat", { precision: 10, scale: 7 }),
  lng: decimal("lng", { precision: 10, scale: 7 }),
  neighborhood: varchar("neighborhood", { length: 255 }),
  city: varchar("city", { length: 255 }),
  state: varchar("state", { length: 50 }),
  credentialNumber: varchar("credential_number", { length: 100 }),
  credentialImageUrl: varchar("credential_image_url", { length: 500 }),
  documentNumber: varchar("document_number", { length: 100 }),
  documentImageUrl: varchar("document_image_url", { length: 500 }),
  selfieImageUrl: varchar("selfie_image_url", { length: 500 }),
  cnhFrontImageUrl: varchar("cnh_front_image_url", { length: 500 }),
  cnhBackImageUrl: varchar("cnh_back_image_url", { length: 500 }),
  vehicleImageUrl: varchar("vehicle_image_url", { length: 500 }),
  vehicleDocImageUrl: varchar("vehicle_doc_image_url", { length: 500 }),
  vehiclePlateImageUrl: varchar("vehicle_plate_image_url", { length: 500 }),
  vehicleAuthorizationImageUrl: varchar("vehicle_authorization_image_url", { length: 500 }),
  status: instructorStatusEnum.default('pending').notNull(),
  serviceAreas: text("service_areas"),
  pixKey: varchar("pix_key", { length: 255 }),
  // Novos campos - Fase 2.5
  yearsExperience: int("years_experience").default(0),
  languages: json("languages").$type<string[]>(),
  specialties: json("specialties").$type<string[]>(),
  workingHours: varchar("working_hours", { length: 100 }),
  responseTime: varchar("response_time", { length: 50 }),
  galleryImages: json("gallery_images").$type<string[]>(),
  lessonsCompleted: int("lessons_completed").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const bookings = mysqlTable("bookings", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  studentId: varchar("student_id", { length: 36 }).references(() => users.id).notNull(),
  instructorId: varchar("instructor_id", { length: 36 }).references(() => instructors.id).notNull(),
  date: timestamp("date").notNull(),
  duration: int("duration").default(50).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  rentVehicle: boolean("rent_vehicle").default(false),
  vehicleRentalPrice: decimal("vehicle_rental_price", { precision: 10, scale: 2 }).default("0"),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  status: bookingStatusEnum.default('pending').notNull(),
  meetingAddress: text("meeting_address"),
  studentNotes: text("student_notes"),
  paymentStatus: varchar("payment_status", { length: 50 }).default('pending'),
  paymentId: varchar("payment_id", { length: 255 }),
  paymentProvider: varchar("payment_provider", { length: 100 }),
  paymentUrl: varchar("payment_url", { length: 500 }),
  paymentMethods: json("payment_methods"),
  paymentDevMode: boolean("payment_dev_mode"),
  paidAt: timestamp("paid_at"),
  startCode: varchar("start_code", { length: 10 }),
  endCode: varchar("end_code", { length: 10 }),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  cancelledAt: timestamp("cancelled_at"),
  cancelledByRole: userRoleEnum,
  cancelledByUserId: varchar("cancelled_by_user_id", { length: 36 }).references(() => users.id),
  cancelReason: text("cancel_reason"),
  cancelledMinutes: int("cancelled_minutes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const disputes = mysqlTable("disputes", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  bookingId: varchar("booking_id", { length: 36 }).references(() => bookings.id).notNull(),
  openedByUserId: varchar("opened_by_user_id", { length: 36 }).references(() => users.id).notNull(),
  openedByRole: userRoleEnum.notNull(),
  reason: text("reason").notNull(),
  status: disputeStatusEnum.default("open").notNull(),
  resolution: disputeResolutionEnum,
  resolvedByUserId: varchar("resolved_by_user_id", { length: 36 }).references(() => users.id),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const adminSettings = mysqlTable("admin_settings", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  platformFeePercent: decimal("platform_fee_percent", { precision: 5, scale: 2 }).default("0"),
  cancellationFeePercent: decimal("cancellation_fee_percent", { precision: 5, scale: 2 }).default("0"),
  cancellationInstructorSharePercent: decimal("cancellation_instructor_share_percent", { precision: 5, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const transactions = mysqlTable("transactions", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  bookingId: varchar("booking_id", { length: 36 }).references(() => bookings.id),
  type: transactionTypeEnum.notNull(),
  status: transactionStatusEnum.default('pending').notNull(),
  amountGross: decimal("amount_gross", { precision: 10, scale: 2 }).notNull(),
  amountNet: decimal("amount_net", { precision: 10, scale: 2 }).notNull(),
  gateway: varchar("gateway", { length: 100 }),
  paymentId: varchar("payment_id", { length: 255 }),
  fromUserId: varchar("from_user_id", { length: 36 }).references(() => users.id),
  toUserId: varchar("to_user_id", { length: 36 }).references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const wallets = mysqlTable("wallets", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  userId: varchar("user_id", { length: 36 }).references(() => users.id).notNull(),
  balance: decimal("balance", { precision: 10, scale: 2 }).default("0"),
  currency: varchar("currency", { length: 10 }).default("BRL"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const walletEntries = mysqlTable("wallet_entries", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  walletId: varchar("wallet_id", { length: 36 }).references(() => wallets.id).notNull(),
  userId: varchar("user_id", { length: 36 }).references(() => users.id).notNull(),
  type: walletEntryTypeEnum.notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  bookingId: varchar("booking_id", { length: 36 }).references(() => bookings.id),
  transactionId: varchar("transaction_id", { length: 36 }).references(() => transactions.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const withdrawals = mysqlTable("withdrawals", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  userId: varchar("user_id", { length: 36 }).references(() => users.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: withdrawalStatusEnum.default('pending').notNull(),
  destinationType: varchar("destination_type", { length: 50 }).default("pix"),
  destinationKey: varchar("destination_key", { length: 255 }),
  requestedAt: timestamp("requested_at").defaultNow(),
  processedAt: timestamp("processed_at"),
  processedByUserId: varchar("processed_by_user_id", { length: 36 }).references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const paymentGateways = mysqlTable("payment_gateways", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  provider: varchar("provider", { length: 100 }).notNull(),
  apiKey: text("api_key"),
  status: varchar("status", { length: 50 }).default("active"),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const vehicles = mysqlTable("vehicles", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  instructorId: varchar("instructor_id", { length: 36 }).references(() => instructors.id).notNull(),
  brand: varchar("brand", { length: 100 }).notNull(),
  model: varchar("model", { length: 100 }).notNull(),
  year: int("year").notNull(),
  plate: varchar("plate", { length: 20 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  status: vehicleStatusEnum.default('pending').notNull(),
  photoFront: text("photo_front"),
  photoSide: text("photo_side"),
  photoBack: text("photo_back"),
  photoInterior: text("photo_interior"),
  documentCrlv: text("document_crlv"),
  documentLav: text("document_lav"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const supportTickets = mysqlTable("support_tickets", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  userId: varchar("user_id", { length: 36 }).references(() => users.id).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  message: text("message").notNull(),
  attachmentUrls: json("attachment_urls").$type<string[]>(),
  type: varchar("type", { length: 50 }).notNull(),
  status: ticketStatusEnum.default("open").notNull(),
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

export const integrations = mysqlTable(
  "integrations",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 100 }).notNull(),
    category: varchar("category", { length: 100 }).notNull(),
    status: integrationStatusEnum.default("active").notNull(),
    environment: integrationEnvironmentEnum
      .default("production")
      .notNull(),
    isDefault: boolean("is_default").default(false),
    fields: json("fields").$type<IntegrationField[]>(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("integrations_slug_env_idx").on(table.slug, table.environment),
    index("integrations_category_env_idx").on(table.category, table.environment),
  ],
);

export const reviews = mysqlTable("reviews", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  bookingId: varchar("booking_id", { length: 36 }).references(() => bookings.id).notNull(),
  studentId: varchar("student_id", { length: 36 }).references(() => users.id).notNull(),
  instructorId: varchar("instructor_id", { length: 36 }).references(() => instructors.id).notNull(),
  rating: int("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const availability = mysqlTable("availability", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  instructorId: varchar("instructor_id", { length: 36 }).references(() => instructors.id).notNull(),
  dayOfWeek: int("day_of_week").notNull(),
  startTime: varchar("start_time", { length: 10 }).notNull(),
  endTime: varchar("end_time", { length: 10 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const usersRelations = relations(users, ({ many, one }) => ({
  instructorProfile: one(instructors, {
    fields: [users.id],
    references: [instructors.userId],
  }),
  bookingsAsStudent: many(bookings, { relationName: 'student_bookings' }),
  reviews: many(reviews),
  sentMessages: many(messages, { relationName: 'sent_messages' }),
  receivedMessages: many(messages, { relationName: 'received_messages' }),
}));

export const instructorsRelations = relations(instructors, ({ one, many }) => ({
  user: one(users, {
    fields: [instructors.userId],
    references: [users.id],
  }),
  bookings: many(bookings),
  reviews: many(reviews),
  availability: many(availability),
  vehicles: many(vehicles),
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
  disputes: many(disputes),
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

export const disputesRelations = relations(disputes, ({ one }) => ({
  booking: one(bookings, {
    fields: [disputes.bookingId],
    references: [bookings.id],
  }),
  openedBy: one(users, {
    fields: [disputes.openedByUserId],
    references: [users.id],
  }),
  resolvedBy: one(users, {
    fields: [disputes.resolvedByUserId],
    references: [users.id],
  }),
}));

export const messages = mysqlTable("messages", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  senderId: varchar("sender_id", { length: 36 }).references(() => users.id).notNull(),
  receiverId: varchar("receiver_id", { length: 36 }).references(() => users.id).notNull(),
  bookingId: varchar("booking_id", { length: 36 }).references(() => bookings.id),
  content: text("content").notNull(),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

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

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
    relationName: 'sent_messages',
  }),
  receiver: one(users, {
    fields: [messages.receiverId],
    references: [users.id],
    relationName: 'received_messages',
  }),
  booking: one(bookings, {
    fields: [messages.bookingId],
    references: [bookings.id],
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

export const vehiclesRelations = relations(vehicles, ({ one }) => ({
  instructor: one(instructors, {
    fields: [vehicles.instructorId],
    references: [instructors.id],
  }),
}));

export const supportTicketsRelations = relations(supportTickets, ({ one }) => ({
  user: one(users, {
    fields: [supportTickets.userId],
    references: [users.id],
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
}).extend({
  pricePerHour: z.coerce.number().min(0),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
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
export type Dispute = typeof disputes.$inferSelect;
export type AdminSettings = typeof adminSettings.$inferSelect;
export type AdminLog = typeof adminLogs.$inferSelect;


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

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
  read: true,
});
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

export const insertVehicleSchema = createInsertSchema(vehicles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type Vehicle = typeof vehicles.$inferSelect;

export const insertSupportTicketSchema = createInsertSchema(supportTickets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;
export type SupportTicket = typeof supportTickets.$inferSelect;
