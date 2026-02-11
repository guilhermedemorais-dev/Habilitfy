import {
  users,
  instructors,
  bookings,
  reviews,
  availability,
  transactions,
  wallets,
  walletEntries,
  withdrawals,
  paymentGateways,
  integrations,
  adminSettings,
  disputes,
  type User,
  type UpsertUser,
  type Instructor,
  type InsertInstructor,
  type Booking,
  type InsertBooking,
  type Review,
  type InsertReview,
  type Dispute,
  type AdminSettings,
  type Availability,
  type InsertAvailability,
  type Transaction,
  type Wallet,
  type WalletEntry,
  type Withdrawal,
  type PaymentGateway,
  type Integration,
  type IntegrationInsert,
  messages,
  type Message,
  type InsertMessage,
  vehicles,
  type Vehicle,
  type InsertVehicle,
  supportTickets,
  type SupportTicket,
  type InsertSupportTicket,
} from "@shared/schema";

import { db } from "./db";
import * as crypto from "crypto";
import { eq, and, or, gte, lte, desc, sql, ne, isNotNull, inArray } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(email: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  getUsers(role?: string): Promise<User[]>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User>;

  getInstructor(id: string): Promise<Instructor | undefined>;
  getInstructorByUserId(userId: string): Promise<Instructor | undefined>;
  getAllInstructors(status?: string): Promise<Instructor[]>;
  getInstructorsWithUser(status?: string): Promise<(Instructor & { user: User | null })[]>;
  createInstructor(instructor: InsertInstructor): Promise<Instructor>;
  updateInstructor(id: string, data: Partial<InsertInstructor>): Promise<Instructor>;

  getBooking(id: string): Promise<Booking | undefined>;
  getBookingsByStudent(studentId: string): Promise<Booking[]>;
  getBookingsByInstructor(instructorId: string): Promise<Booking[]>;
  countActiveBookingsByStudent(instructorId: string, studentId: string): Promise<number>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBooking(id: string, data: Partial<InsertBooking>): Promise<Booking>;
  getBookingByPaymentId(paymentId: string): Promise<Booking | undefined>;
  upsertBookingTransaction(booking: Booking): Promise<Transaction | undefined>;
  getAdminBookings(limit?: number): Promise<
    Array<{
      booking: Booking;
      student: User | null;
      instructor: Instructor | null;
      instructorUser: User | null;
    }>
  >;
  getAdminDashboardStats(): Promise<{
    totalBookings: number;
    completedBookings: number;
    totalRevenue: number;
    walletBalance: number;
  }>;
  getAdminFinanceSummary(): Promise<{
    totalTransacted: number;
    totalProcessing: number;
    totalWalletBalance: number;
    pendingWithdrawals: number;
    pendingWithdrawalsCount: number;
    totalRefunded: number;
    failedTransactionsCount: number;
    pendingTransactionsCount: number;
  }>;
  getAdminTransactionSeries(options?: {
    status?: string;
    period?: "day" | "week" | "month";
    days?: number;
  }): Promise<Array<{ period: string; total: number; count: number }>>;
  getAdminGeoSummary(filters?: {
    state?: string;
    city?: string;
  }): Promise<{
    instructors: Array<{ lat: number; lng: number; count: number; label: string | null }>;
    students: Array<{ lat: number; lng: number; count: number; label: string | null }>;
    states: string[];
    cities: string[];
    totals: {
      instructorsTotal: number;
      instructorsWithLocation: number;
      studentsTotal: number;
      studentsWithLocation: number;
    };
  }>;
  getAdminTransactions(filters?: {
    status?: string;
    type?: string;
    gateway?: string;
    limit?: number;
  }): Promise<
    Array<{
      transaction: Transaction;
      fromUser: User | null;
      toUser: User | null;
      booking: Booking | null;
    }>
  >;
  getWalletsWithUser(role?: string): Promise<(Wallet & { user: User | null })[]>;
  getWalletEntries(filters?: {
    walletId?: string;
    userId?: string;
    limit?: number;
  }): Promise<
    Array<{
      entry: WalletEntry;
      user: User | null;
      booking: Booking | null;
      transaction: Transaction | null;
    }>
  >;
  getWithdrawals(filters?: { status?: string; limit?: number }): Promise<
    Array<{
      withdrawal: Withdrawal;
      user: User | null;
      processedBy: User | null;
    }>
  >;
  createWithdrawal(data: {
    userId: string;
    amount: string;
    status: "pending";
    destinationType: string;
    destinationKey: string;
  }): Promise<Withdrawal>;
  updateWithdrawal(id: string, data: Partial<Withdrawal>): Promise<Withdrawal>;
  getPaymentGateways(): Promise<PaymentGateway[]>;
  createPaymentGateway(data: {
    provider: string;
    apiKey?: string | null;
    status?: string;
    isDefault?: boolean;
  }): Promise<PaymentGateway>;
  updatePaymentGateway(
    id: string,
    data: {
      provider?: string;
      apiKey?: string | null;
      status?: string;
      isDefault?: boolean;
    },
  ): Promise<PaymentGateway>;
  getAdminFinancialMetrics(): Promise<Array<{ name: string; gmv: number; revenue: number }>>;
  getAdminGrowthMetrics(): Promise<Array<{ name: string; newUsers: number; churn: number }>>;
  getIntegrations(filters?: {
    category?: string;
    status?: string;
    environment?: string;
  }): Promise<Integration[]>;
  getIntegration(id: string): Promise<Integration | undefined>;
  getIntegrationBySlug(
    slug: string,
    environment?: string,
  ): Promise<Integration | undefined>;
  createIntegration(data: {
    name: string;
    slug: string;
    category: string;
    status?: string;
    environment?: string;
    isDefault?: boolean;
    fields?: IntegrationInsert["fields"];
  }): Promise<Integration>;
  updateIntegration(
    id: string,
    data: {
      name?: string;
      slug?: string;
      category?: string;
      status?: string;
      environment?: string;
      isDefault?: boolean;
      fields?: IntegrationInsert["fields"];
    },
  ): Promise<Integration>;

  createReview(review: InsertReview): Promise<Review>;
  getReviewsByInstructor(instructorId: string): Promise<Review[]>;

  createAvailability(avail: InsertAvailability): Promise<Availability>;
  getAvailabilityByInstructor(instructorId: string): Promise<Availability[]>;
  getAvailabilityById(id: string): Promise<Availability | undefined>;
  updateAvailability(id: string, data: Partial<InsertAvailability>): Promise<Availability>;
  deleteAvailability(id: string): Promise<Availability | undefined>;
  getAdminSettings(): Promise<AdminSettings>;
  updateAdminSettings(data: Partial<AdminSettings>): Promise<AdminSettings>;
  createDispute(data: {
    bookingId: string;
    openedByUserId: string;
    openedByRole: "student" | "instructor" | "admin";
    reason: string;
  }): Promise<Dispute>;
  getDisputeByBooking(bookingId: string): Promise<Dispute | undefined>;
  getDisputes(): Promise<Dispute[]>;
  updateDispute(id: string, data: Partial<Dispute>): Promise<Dispute>;

  getVehicles(instructorId: string): Promise<Vehicle[]>;
  createVehicle(data: InsertVehicle): Promise<Vehicle>;
  updateVehicle(id: string, data: Partial<Vehicle>): Promise<Vehicle>;
  deleteVehicle(id: string): Promise<Vehicle | undefined>;

  createSupportTicket(data: InsertSupportTicket): Promise<SupportTicket>;
  getSupportTickets(userId?: string): Promise<SupportTicket[]>;
  updateSupportTicket(id: string, data: Partial<SupportTicket>): Promise<SupportTicket>;
}


export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    return user;
  }

  async getUsers(role?: string): Promise<User[]> {
    if (role) {
      return db.select().from(users).where(eq(users.role, role as any));
    }
    return db.select().from(users);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // MySQL: check if exists, then insert or update
    const existing = await db.select().from(users).where(eq(users.id, userData.id!));
    if (existing.length > 0) {
      await db.update(users).set({ ...userData, updatedAt: new Date() }).where(eq(users.id, userData.id!));
    } else {
      await db.insert(users).values(userData);
    }
    const [user] = await db.select().from(users).where(eq(users.id, userData.id!));
    return user;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    await db.update(users).set({ ...data, updatedAt: new Date() }).where(eq(users.id, id));
    const [updated] = await db.select().from(users).where(eq(users.id, id));
    return updated;
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

  async getInstructorsWithUser(status?: string): Promise<(Instructor & { user: User | null })[]> {
    const baseQuery = db
      .select({ instructor: instructors, user: users })
      .from(instructors)
      .leftJoin(users, eq(users.id, instructors.userId));

    if (status) {
      const rows = await baseQuery.where(eq(instructors.status, status as any));
      return rows.map((row) => ({ ...row.instructor, user: row.user }));
    }
    const rows = await baseQuery;
    return rows.map((row) => ({ ...row.instructor, user: row.user }));
  }

  async createInstructor(instructorData: InsertInstructor): Promise<Instructor> {
    const id = crypto.randomUUID();
    await db.insert(instructors).values({ ...instructorData, id });
    const [instructor] = await db.select().from(instructors).where(eq(instructors.id, id));
    return instructor;
  }

  async updateInstructor(id: string, data: Partial<InsertInstructor>): Promise<Instructor> {
    await db.update(instructors).set({ ...data, updatedAt: new Date() }).where(eq(instructors.id, id));
    const [instructor] = await db.select().from(instructors).where(eq(instructors.id, id));
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

  async countActiveBookingsByStudent(instructorId: string, studentId: string): Promise<number> {
    const [row] = await db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(bookings)
      .where(
        and(
          eq(bookings.instructorId, instructorId),
          eq(bookings.studentId, studentId),
          inArray(bookings.status, ["pending", "confirmed", "paid"]),
        ),
      );
    return row?.count ?? 0;
  }

  async getAdminBookings(limit = 20): Promise<
    Array<{
      booking: Booking;
      student: User | null;
      instructor: Instructor | null;
      instructorUser: User | null;
    }>
  > {
    const studentUser = alias(users, "student_user");
    const instructorUser = alias(users, "instructor_user");

    const rows = await db
      .select({
        booking: bookings,
        student: studentUser,
        instructor: instructors,
        instructorUser,
      })
      .from(bookings)
      .leftJoin(studentUser, eq(bookings.studentId, studentUser.id))
      .leftJoin(instructors, eq(bookings.instructorId, instructors.id))
      .leftJoin(instructorUser, eq(instructors.userId, instructorUser.id))
      .orderBy(desc(bookings.createdAt))
      .limit(limit);

    return rows.map((row) => ({
      booking: row.booking,
      student: row.student ?? null,
      instructor: row.instructor ?? null,
      instructorUser: row.instructorUser ?? null,
    }));
  }

  async getAdminDashboardStats(): Promise<{
    totalBookings: number;
    completedBookings: number;
    totalRevenue: number;
    walletBalance: number;
  }> {
    const [row] = await db
      .select({
        totalBookings: sql<number>`count(${bookings.id})`.mapWith(Number),
        completedBookings: sql<number>`
          count(*) filter (where ${bookings.status} = 'completed')
        `.mapWith(Number),
        totalRevenue: sql<number>`
          coalesce(
            sum(
              case
                when ${bookings.status} in ('paid', 'completed')
                then ${bookings.totalPrice}
                else 0
              end
            ),
            0
          )
        `.mapWith(Number),
      })
      .from(bookings);

    const [walletRow] = await db
      .select({
        walletBalance: sql<number>`
          coalesce(sum(${wallets.balance}), 0)
        `.mapWith(Number),
      })
      .from(wallets);

    return {
      totalBookings: row?.totalBookings ?? 0,
      completedBookings: row?.completedBookings ?? 0,
      totalRevenue: row?.totalRevenue ?? 0,
      walletBalance: walletRow?.walletBalance ?? 0,
    };
  }

  async getAdminFinanceSummary(): Promise<{
    totalTransacted: number;
    totalProcessing: number;
    totalWalletBalance: number;
    pendingWithdrawals: number;
    pendingWithdrawalsCount: number;
    totalRefunded: number;
    failedTransactionsCount: number;
    pendingTransactionsCount: number;
  }> {
    const [transactionRow] = await db
      .select({
        totalTransacted: sql<number>`
          coalesce(
            sum(
              case
                when ${transactions.status} = 'paid'
                then ${transactions.amountGross}
                else 0
              end
            ),
            0
          )
        `.mapWith(Number),
        totalProcessing: sql<number>`
          coalesce(
            sum(
              case
                when ${transactions.status} in ('pending', 'processing')
                then ${transactions.amountGross}
                else 0
              end
            ),
            0
          )
        `.mapWith(Number),
        totalRefunded: sql<number>`
          coalesce(
            sum(
              case
                when ${transactions.status} = 'refunded'
                then ${transactions.amountGross}
                else 0
              end
            ),
            0
          )
        `.mapWith(Number),
        failedTransactionsCount: sql<number>`
          count(*) filter (where ${transactions.status} in ('failed', 'cancelled'))
        `.mapWith(Number),
        pendingTransactionsCount: sql<number>`
          count(*) filter (where ${transactions.status} in ('pending', 'processing'))
        `.mapWith(Number),
      })
      .from(transactions);

    const [walletRow] = await db
      .select({
        totalWalletBalance: sql<number>`
          coalesce(sum(${wallets.balance}), 0)
        `.mapWith(Number),
      })
      .from(wallets);

    const [withdrawalRow] = await db
      .select({
        pendingWithdrawals: sql<number>`
          coalesce(
            sum(
              case
                when ${withdrawals.status} in ('pending', 'approved')
                then ${withdrawals.amount}
                else 0
              end
            ),
            0
          )
        `.mapWith(Number),
        pendingWithdrawalsCount: sql<number>`
          count(*) filter (where ${withdrawals.status} in ('pending', 'approved'))
        `.mapWith(Number),
      })
      .from(withdrawals);

    return {
      totalTransacted: transactionRow?.totalTransacted ?? 0,
      totalProcessing: transactionRow?.totalProcessing ?? 0,
      totalWalletBalance: walletRow?.totalWalletBalance ?? 0,
      pendingWithdrawals: withdrawalRow?.pendingWithdrawals ?? 0,
      pendingWithdrawalsCount: withdrawalRow?.pendingWithdrawalsCount ?? 0,
      totalRefunded: transactionRow?.totalRefunded ?? 0,
      failedTransactionsCount: transactionRow?.failedTransactionsCount ?? 0,
      pendingTransactionsCount: transactionRow?.pendingTransactionsCount ?? 0,
    };
  }

  async getAdminTransactionSeries(options?: {
    status?: string;
    period?: "day" | "week" | "month";
    days?: number;
  }): Promise<Array<{ period: string; total: number; count: number }>> {
    const period = options?.period ?? "day";
    const days = Math.min(Math.max(options?.days ?? 30, 1), 365);
    const since = new Date();
    since.setDate(since.getDate() - days);

    const periodExpression = sql<Date>`date_trunc(${sql.raw(`'${period}'`)}, ${transactions.createdAt})`;
    const conditions = [gte(transactions.createdAt, since)];

    if (options?.status) {
      conditions.push(eq(transactions.status, options.status as any));
    }

    const rows = await db
      .select({
        period: periodExpression,
        total: sql<number>`
          coalesce(sum(${transactions.amountGross}), 0)
        `.mapWith(Number),
        count: sql<number>`
          count(${transactions.id})
        `.mapWith(Number),
      })
      .from(transactions)
      .where(and(...conditions))
      .groupBy(periodExpression)
      .orderBy(periodExpression);

    return rows.map((row) => ({
      period:
        row.period instanceof Date
          ? row.period.toISOString()
          : String(row.period),
      total: row.total ?? 0,
      count: row.count ?? 0,
    }));
  }

  async getAdminGeoSummary(filters?: {
    state?: string;
    city?: string;
  }): Promise<{
    instructors: Array<{ lat: number; lng: number; count: number; label: string | null }>;
    students: Array<{ lat: number; lng: number; count: number; label: string | null }>;
    states: string[];
    cities: string[];
    totals: {
      instructorsTotal: number;
      instructorsWithLocation: number;
      studentsTotal: number;
      studentsWithLocation: number;
    };
  }> {
    const state = filters?.state?.trim() || undefined;
    const city = filters?.city?.trim() || undefined;
    const instructorConditions = [isNotNull(instructors.lat), isNotNull(instructors.lng)];
    const studentConditions = [
      eq(users.role, "student" as any),
      isNotNull(users.lat),
      isNotNull(users.lng),
    ];
    const instructorTotalConditions: any[] = [];
    const studentTotalConditions: any[] = [eq(users.role, "student" as any)];

    if (state) {
      instructorConditions.push(eq(instructors.state, state));
      studentConditions.push(eq(users.state, state));
      instructorTotalConditions.push(eq(instructors.state, state));
      studentTotalConditions.push(eq(users.state, state));
    }
    if (city) {
      instructorConditions.push(eq(instructors.city, city));
      studentConditions.push(eq(users.city, city));
      instructorTotalConditions.push(eq(instructors.city, city));
      studentTotalConditions.push(eq(users.city, city));
    }

    const [
      instructorTotals,
      studentTotals,
      instructorPoints,
      studentPoints,
      instructorStates,
      studentStates,
      instructorCities,
      studentCities,
    ] = await Promise.all([
      instructorTotalConditions.length > 0
        ? db
          .select({
            instructorsTotal: sql<number>`
                count(${instructors.id})
              `.mapWith(Number),
            instructorsWithLocation: sql<number>`
                count(*) filter (where ${instructors.lat} is not null and ${instructors.lng} is not null)
              `.mapWith(Number),
          })
          .from(instructors)
          .where(and(...instructorTotalConditions))
        : db
          .select({
            instructorsTotal: sql<number>`
                count(${instructors.id})
              `.mapWith(Number),
            instructorsWithLocation: sql<number>`
                count(*) filter (where ${instructors.lat} is not null and ${instructors.lng} is not null)
              `.mapWith(Number),
          })
          .from(instructors),
      db
        .select({
          studentsTotal: sql<number>`
            count(${users.id})
          `.mapWith(Number),
          studentsWithLocation: sql<number>`
            count(*) filter (where ${users.lat} is not null and ${users.lng} is not null)
          `.mapWith(Number),
        })
        .from(users)
        .where(and(...studentTotalConditions)),
      db
        .select({
          lat: instructors.lat,
          lng: instructors.lng,
          neighborhood: instructors.neighborhood,
          city: instructors.city,
          state: instructors.state,
          count: sql<number>`
            count(${instructors.id})
          `.mapWith(Number),
        })
        .from(instructors)
        .where(and(...instructorConditions))
        .groupBy(
          instructors.lat,
          instructors.lng,
          instructors.neighborhood,
          instructors.city,
          instructors.state,
        ),
      db
        .select({
          lat: users.lat,
          lng: users.lng,
          neighborhood: users.neighborhood,
          city: users.city,
          state: users.state,
          count: sql<number>`
            count(${users.id})
          `.mapWith(Number),
        })
        .from(users)
        .where(and(...studentConditions))
        .groupBy(users.lat, users.lng, users.neighborhood, users.city, users.state),
      db
        .select({ state: instructors.state })
        .from(instructors)
        .where(isNotNull(instructors.state))
        .groupBy(instructors.state),
      db
        .select({ state: users.state })
        .from(users)
        .where(and(eq(users.role, "student" as any), isNotNull(users.state)))
        .groupBy(users.state),
      db
        .select({ city: instructors.city })
        .from(instructors)
        .where(
          and(
            ...[
              isNotNull(instructors.city),
              ...(state ? [eq(instructors.state, state)] : []),
            ],
          ),
        )
        .groupBy(instructors.city),
      db
        .select({ city: users.city })
        .from(users)
        .where(
          and(
            ...[
              eq(users.role, "student" as any),
              isNotNull(users.city),
              ...(state ? [eq(users.state, state)] : []),
            ],
          ),
        )
        .groupBy(users.city),
    ]);
    const instructorTotalsRow = instructorTotals[0];
    const studentTotalsRow = studentTotals[0];

    const mapPoint = (row: {
      lat: string | null;
      lng: string | null;
      neighborhood: string | null;
      city: string | null;
      state: string | null;
      count: number;
    }) => {
      const labelParts = [row.neighborhood, row.city, row.state]
        .filter((value): value is string => Boolean(value))
        .map((value) => value.trim());
      const uniqueParts = Array.from(new Set(labelParts));
      return {
        lat: row.lat ? Number(row.lat) : 0,
        lng: row.lng ? Number(row.lng) : 0,
        label: uniqueParts.length > 0 ? uniqueParts.join(" - ") : null,
        count: row.count ?? 0,
      };
    };

    const uniqueSorted = (values: Array<string | null>) => {
      const filtered = values.filter((value): value is string => Boolean(value));
      return Array.from(new Set(filtered)).sort((a, b) => a.localeCompare(b));
    };

    return {
      instructors: instructorPoints.map(mapPoint).filter((point) => point.lat && point.lng),
      students: studentPoints.map(mapPoint).filter((point) => point.lat && point.lng),
      states: uniqueSorted([
        ...instructorStates.map((row) => row.state),
        ...studentStates.map((row) => row.state),
      ]),
      cities: uniqueSorted([
        ...instructorCities.map((row) => row.city),
        ...studentCities.map((row) => row.city),
      ]),
      totals: {
        instructorsTotal: instructorTotalsRow?.instructorsTotal ?? 0,
        instructorsWithLocation: instructorTotalsRow?.instructorsWithLocation ?? 0,
        studentsTotal: studentTotalsRow?.studentsTotal ?? 0,
        studentsWithLocation: studentTotalsRow?.studentsWithLocation ?? 0,
      },
    };
  }

  async getAdminTransactions(filters?: {
    status?: string;
    type?: string;
    gateway?: string;
    limit?: number;
  }): Promise<
    Array<{
      transaction: Transaction;
      fromUser: User | null;
      toUser: User | null;
      booking: Booking | null;
    }>
  > {
    const fromUser = alias(users, "from_user");
    const toUser = alias(users, "to_user");
    const limit = Math.min(Math.max(filters?.limit ?? 30, 1), 100);
    const conditions = [];

    if (filters?.status) {
      conditions.push(eq(transactions.status, filters.status as any));
    }
    if (filters?.type) {
      conditions.push(eq(transactions.type, filters.type as any));
    }
    if (filters?.gateway) {
      conditions.push(eq(transactions.gateway, filters.gateway));
    }

    let query = db
      .select({
        transaction: transactions,
        fromUser,
        toUser,
        booking: bookings,
      })
      .from(transactions)
      .leftJoin(fromUser, eq(transactions.fromUserId, fromUser.id))
      .leftJoin(toUser, eq(transactions.toUserId, toUser.id))
      .leftJoin(bookings, eq(transactions.bookingId, bookings.id))
      .orderBy(desc(transactions.createdAt))
      .limit(limit);

    const rows =
      conditions.length > 0 ? await query.where(and(...conditions)) : await query;
    return rows.map((row) => ({
      transaction: row.transaction,
      fromUser: row.fromUser ?? null,
      toUser: row.toUser ?? null,
      booking: row.booking ?? null,
    }));
  }

  async getWalletsWithUser(role?: string): Promise<(Wallet & { user: User | null })[]> {
    let query = db
      .select({ wallet: wallets, user: users })
      .from(wallets)
      .leftJoin(users, eq(wallets.userId, users.id))
      .orderBy(desc(wallets.updatedAt));

    const rows = role ? await query.where(eq(users.role, role as any)) : await query;
    return rows.map((row) => ({
      ...row.wallet,
      user: row.user ?? null,
    }));
  }

  async getWalletEntries(filters?: {
    walletId?: string;
    userId?: string;
    limit?: number;
  }): Promise<
    Array<{
      entry: WalletEntry;
      user: User | null;
      booking: Booking | null;
      transaction: Transaction | null;
    }>
  > {
    const limit = Math.min(Math.max(filters?.limit ?? 20, 1), 200);
    const conditions = [];

    if (filters?.walletId) {
      conditions.push(eq(walletEntries.walletId, filters.walletId));
    }
    if (filters?.userId) {
      conditions.push(eq(walletEntries.userId, filters.userId));
    }

    let query = db
      .select({
        entry: walletEntries,
        user: users,
        booking: bookings,
        transaction: transactions,
      })
      .from(walletEntries)
      .leftJoin(users, eq(walletEntries.userId, users.id))
      .leftJoin(bookings, eq(walletEntries.bookingId, bookings.id))
      .leftJoin(transactions, eq(walletEntries.transactionId, transactions.id))
      .orderBy(desc(walletEntries.createdAt))
      .limit(limit);

    const rows =
      conditions.length > 0 ? await query.where(and(...conditions)) : await query;
    return rows.map((row) => ({
      entry: row.entry,
      user: row.user ?? null,
      booking: row.booking ?? null,
      transaction: row.transaction ?? null,
    }));
  }

  async getWithdrawals(filters?: { status?: string; limit?: number }): Promise<
    Array<{
      withdrawal: Withdrawal;
      user: User | null;
      processedBy: User | null;
    }>
  > {
    const processedBy = alias(users, "processed_by");
    const limit = Math.min(Math.max(filters?.limit ?? 20, 1), 200);

    let query = db
      .select({
        withdrawal: withdrawals,
        user: users,
        processedBy,
      })
      .from(withdrawals)
      .leftJoin(users, eq(withdrawals.userId, users.id))
      .leftJoin(processedBy, eq(withdrawals.processedByUserId, processedBy.id))
      .orderBy(desc(withdrawals.requestedAt))
      .limit(limit);

    const rows = filters?.status
      ? await query.where(eq(withdrawals.status, filters.status as any))
      : await query;
    return rows.map((row) => ({
      withdrawal: row.withdrawal,
      user: row.user ?? null,
      processedBy: row.processedBy ?? null,
    }));
  }

  async updateWithdrawal(id: string, data: Partial<Withdrawal>): Promise<Withdrawal> {
    await db.update(withdrawals).set({ ...data, updatedAt: new Date() }).where(eq(withdrawals.id, id));
    const [withdrawal] = await db.select().from(withdrawals).where(eq(withdrawals.id, id));
    return withdrawal;
  }

  async getPaymentGateways(): Promise<PaymentGateway[]> {
    return db.select().from(paymentGateways).orderBy(desc(paymentGateways.updatedAt));
  }

  async createPaymentGateway(data: {
    provider: string;
    apiKey?: string | null;
    status?: string;
    isDefault?: boolean;
  }): Promise<PaymentGateway> {
    if (data.isDefault) {
      await db
        .update(paymentGateways)
        .set({ isDefault: false, updatedAt: new Date() });
    }

    const gatewayId = crypto.randomUUID();
    await db.insert(paymentGateways).values({
      id: gatewayId,
      provider: data.provider,
      apiKey: data.apiKey ?? null,
      status: data.status ?? "active",
      isDefault: data.isDefault ?? false,
    });
    const [gateway] = await db.select().from(paymentGateways).where(eq(paymentGateways.id, gatewayId));
    return gateway;
  }

  async updatePaymentGateway(
    id: string,
    data: {
      provider?: string;
      apiKey?: string | null;
      status?: string;
      isDefault?: boolean;
    },
  ): Promise<PaymentGateway> {
    if (data.isDefault) {
      await db
        .update(paymentGateways)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(ne(paymentGateways.id, id));
    }

    const payload: Partial<typeof paymentGateways.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (typeof data.provider === "string") {
      payload.provider = data.provider;
    }
    if (typeof data.apiKey !== "undefined") {
      payload.apiKey = data.apiKey;
    }
    if (typeof data.status === "string") {
      payload.status = data.status;
    }
    if (typeof data.isDefault === "boolean") {
      payload.isDefault = data.isDefault;
    }

    await db.update(paymentGateways).set(payload).where(eq(paymentGateways.id, id));
    const [gateway] = await db.select().from(paymentGateways).where(eq(paymentGateways.id, id));
    return gateway;
  }

  async getIntegrations(filters?: {
    category?: string;
    status?: string;
    environment?: string;
  }): Promise<Integration[]> {
    const conditions = [];

    if (filters?.category) {
      conditions.push(eq(integrations.category, filters.category));
    }
    if (filters?.status) {
      conditions.push(eq(integrations.status, filters.status as any));
    }
    if (filters?.environment) {
      conditions.push(eq(integrations.environment, filters.environment as any));
    }

    const query = db.select().from(integrations).orderBy(desc(integrations.updatedAt));
    if (conditions.length === 1) {
      return query.where(conditions[0]);
    }
    if (conditions.length > 1) {
      return query.where(and(...conditions));
    }
    return query;
  }

  async getIntegration(id: string): Promise<Integration | undefined> {
    const [integration] = await db
      .select()
      .from(integrations)
      .where(eq(integrations.id, id));
    return integration;
  }

  async getIntegrationBySlug(
    slug: string,
    environment?: string,
  ): Promise<Integration | undefined> {
    const conditions = [eq(integrations.slug, slug)];
    if (environment) {
      conditions.push(eq(integrations.environment, environment as any));
    }
    const whereClause =
      conditions.length > 1 ? and(...conditions) : conditions[0];
    const [integration] = await db
      .select()
      .from(integrations)
      .where(whereClause)
      .limit(1);
    return integration;
  }

  async createIntegration(data: {
    name: string;
    slug: string;
    category: string;
    status?: string;
    environment?: string;
    isDefault?: boolean;
    fields?: IntegrationInsert["fields"];
  }): Promise<Integration> {
    const environment = data.environment ?? "production";

    if (data.isDefault) {
      await db
        .update(integrations)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(
          and(
            eq(integrations.category, data.category),
            eq(integrations.environment, environment as any),
          ),
        );
    }

    const integrationValues: IntegrationInsert = {
      name: data.name,
      slug: data.slug,
      category: data.category,
      status: (data.status ?? "active") as IntegrationInsert["status"],
      environment: environment as IntegrationInsert["environment"],
      isDefault: data.isDefault ?? false,
      fields: data.fields ?? [],
    };
    const integrationId = crypto.randomUUID();
    await db.insert(integrations).values({ ...integrationValues, id: integrationId });
    const [integration] = await db.select().from(integrations).where(eq(integrations.id, integrationId));
    return integration;
  }

  async updateIntegration(
    id: string,
    data: {
      name?: string;
      slug?: string;
      category?: string;
      status?: string;
      environment?: string;
      isDefault?: boolean;
      fields?: IntegrationInsert["fields"];
    },
  ): Promise<Integration> {
    let current: Integration | undefined;
    if (data.isDefault) {
      current = await this.getIntegration(id);
      const category = data.category ?? current?.category;
      const environment = data.environment ?? current?.environment ?? "production";
      if (category) {
        await db
          .update(integrations)
          .set({ isDefault: false, updatedAt: new Date() })
          .where(
            and(
              eq(integrations.category, category),
              eq(integrations.environment, environment as any),
              ne(integrations.id, id),
            ),
          );
      }
    }

    const payload: Partial<typeof integrations.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (typeof data.name === "string") {
      payload.name = data.name;
    }
    if (typeof data.slug === "string") {
      payload.slug = data.slug;
    }
    if (typeof data.category === "string") {
      payload.category = data.category;
    }
    if (typeof data.status === "string") {
      payload.status = data.status as any;
    }
    if (typeof data.environment === "string") {
      payload.environment = data.environment as any;
    }
    if (typeof data.isDefault === "boolean") {
      payload.isDefault = data.isDefault;
    }
    if (typeof data.fields !== "undefined") {
      payload.fields = data.fields;
    }

    await db.update(integrations).set(payload).where(eq(integrations.id, id));
    const [integration] = await db.select().from(integrations).where(eq(integrations.id, id));
    return integration;
  }

  async getBookingByPaymentId(paymentId: string): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.paymentId, paymentId));
    return booking;
  }

  async createBooking(bookingData: InsertBooking): Promise<Booking> {
    const bookingId = crypto.randomUUID();
    await db.insert(bookings).values({ ...bookingData, id: bookingId });
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, bookingId));
    return booking;
  }

  async updateBooking(id: string, data: Partial<InsertBooking>): Promise<Booking> {
    await db.update(bookings).set({ ...data, updatedAt: new Date() }).where(eq(bookings.id, id));
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking;
  }

  private getTransactionStatusFromBooking(booking: Booking) {
    const paymentStatus = String(booking.paymentStatus ?? "").toLowerCase();
    if (
      booking.status === "completed"
    ) {
      return "paid";
    }
    if (paymentStatus === "paid" || booking.status === "paid") {
      return "paid";
    }
    if (
      booking.status === "cancelled" ||
      paymentStatus === "cancelled" ||
      paymentStatus === "expired" ||
      paymentStatus === "failed"
    ) {
      return "cancelled";
    }
    return "pending";
  }

  private async getOrCreateWallet(userId: string): Promise<Wallet> {
    const [existing] = await db
      .select()
      .from(wallets)
      .where(eq(wallets.userId, userId));
    if (existing) return existing;

    const walletId = crypto.randomUUID();
    await db.insert(wallets).values({ id: walletId, userId, balance: "0", currency: "BRL" });
    const [created] = await db.select().from(wallets).where(eq(wallets.id, walletId));
    return created;
  }

  private async ensureWalletEntry(transaction: Transaction) {
    if (!transaction.toUserId) return;

    const [existing] = await db
      .select({ id: walletEntries.id })
      .from(walletEntries)
      .where(eq(walletEntries.transactionId, transaction.id));

    if (existing) return;

    const wallet = await this.getOrCreateWallet(transaction.toUserId);

    await db.insert(walletEntries).values({
      walletId: wallet.id,
      userId: transaction.toUserId,
      type: "credit",
      amount: transaction.amountNet,
      description: transaction.bookingId
        ? `Repasse booking ${transaction.bookingId}`
        : "Repasse booking",
      bookingId: transaction.bookingId,
      transactionId: transaction.id,
      createdAt: transaction.createdAt ?? new Date(),
    });

    const currentBalance = Number(wallet.balance);
    const baseBalance = Number.isFinite(currentBalance) ? currentBalance : 0;
    const delta = Number(transaction.amountNet);
    const safeDelta = Number.isFinite(delta) ? delta : 0;
    const updatedBalance = baseBalance + safeDelta;

    await db
      .update(wallets)
      .set({ balance: updatedBalance.toFixed(2), updatedAt: new Date() })
      .where(eq(wallets.id, wallet.id));
  }

  async upsertBookingTransaction(booking: Booking): Promise<Transaction | undefined> {
    if (!booking) return undefined;

    const [existing] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.bookingId, booking.id));

    const instructor = await this.getInstructor(booking.instructorId);
    const gross = Number(booking.totalPrice);
    const amountGross = Number.isFinite(gross) ? gross.toFixed(2) : "0";

    // Calculate Platform Fee
    const settings = await this.getAdminSettings();
    const platformFeePercent = Number(settings.platformFeePercent || 0);
    const feeAmount = gross * (platformFeePercent / 100);
    const net = gross - feeAmount;
    const amountNet = Number.isFinite(net) ? net.toFixed(2) : amountGross; // Fallback to gross if calc fails

    const status = this.getTransactionStatusFromBooking(booking);

    // Only process wallet entry if status is 'paid' (money is available)
    const shouldProcessWallet = status === "paid";

    if (existing) {
      await db.update(transactions).set({
        status,
        amountGross,
        amountNet,
        gateway: booking.paymentProvider ?? null,
        paymentId: booking.paymentId ?? null,
        fromUserId: booking.studentId,
        toUserId: instructor?.userId ?? null,
        updatedAt: new Date(),
      }).where(eq(transactions.id, existing.id));
      const [updated] = await db.select().from(transactions).where(eq(transactions.id, existing.id));

      if (shouldProcessWallet) {
        await this.ensureWalletEntry(updated);
      }

      return updated;
    }

    const transactionId = crypto.randomUUID();
    await db.insert(transactions).values({
      id: transactionId,
      bookingId: booking.id,
      type: "booking",
      status,
      amountGross,
      amountNet,
      gateway: booking.paymentProvider ?? null,
      paymentId: booking.paymentId ?? null,
      fromUserId: booking.studentId,
      toUserId: instructor?.userId ?? null,
    });
    const [created] = await db.select().from(transactions).where(eq(transactions.id, transactionId));

    if (shouldProcessWallet) {
      await this.ensureWalletEntry(created);
    }

    return created;
  }

  async createReview(reviewData: InsertReview): Promise<Review> {
    const reviewId = crypto.randomUUID();
    await db.insert(reviews).values({ ...reviewData, id: reviewId });
    const [review] = await db.select().from(reviews).where(eq(reviews.id, reviewId));

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
    const availId = crypto.randomUUID();
    await db.insert(availability).values({ ...availData, id: availId });
    const [avail] = await db.select().from(availability).where(eq(availability.id, availId));
    return avail;
  }

  async getAvailabilityByInstructor(instructorId: string): Promise<Availability[]> {
    return db.select().from(availability)
      .where(eq(availability.instructorId, instructorId));
  }

  async getAvailabilityById(id: string): Promise<Availability | undefined> {
    const [slot] = await db.select().from(availability).where(eq(availability.id, id));
    return slot;
  }

  async updateAvailability(id: string, data: Partial<InsertAvailability>): Promise<Availability> {
    await db.update(availability).set(data).where(eq(availability.id, id));
    const [slot] = await db.select().from(availability).where(eq(availability.id, id));
    return slot;
  }

  async deleteAvailability(id: string): Promise<Availability | undefined> {
    const [slot] = await db.select().from(availability).where(eq(availability.id, id));
    if (slot) {
      await db.delete(availability).where(eq(availability.id, id));
    }
    return slot;
  }

  async getAdminSettings(): Promise<AdminSettings> {
    const [settings] = await db.select().from(adminSettings).limit(1);
    if (settings) return settings;
    const settingsId = crypto.randomUUID();
    await db.insert(adminSettings).values({ id: settingsId });
    const [created] = await db.select().from(adminSettings).where(eq(adminSettings.id, settingsId));
    return created;
  }

  async updateAdminSettings(data: Partial<AdminSettings>): Promise<AdminSettings> {
    const current = await this.getAdminSettings();
    await db.update(adminSettings).set({ ...data, updatedAt: new Date() }).where(eq(adminSettings.id, current.id));
    const [updated] = await db.select().from(adminSettings).where(eq(adminSettings.id, current.id));
    return updated;
  }

  async createDispute(data: {
    bookingId: string;
    openedByUserId: string;
    openedByRole: "student" | "instructor" | "admin";
    reason: string;
  }): Promise<Dispute> {
    const disputeId = crypto.randomUUID();
    await db.insert(disputes).values({
      id: disputeId,
      bookingId: data.bookingId,
      openedByUserId: data.openedByUserId,
      openedByRole: data.openedByRole,
      reason: data.reason,
    });
    const [dispute] = await db.select().from(disputes).where(eq(disputes.id, disputeId));
    return dispute;
  }

  async getDisputeByBooking(bookingId: string): Promise<Dispute | undefined> {
    const [dispute] = await db
      .select()
      .from(disputes)
      .where(eq(disputes.bookingId, bookingId))
      .orderBy(desc(disputes.createdAt))
      .limit(1);
    return dispute;
  }

  async getDisputes(): Promise<Dispute[]> {
    return db
      .select()
      .from(disputes)
      .orderBy(desc(disputes.createdAt));
  }

  async updateDispute(id: string, data: Partial<Dispute>): Promise<Dispute> {
    await db.update(disputes).set({ ...data, updatedAt: new Date() }).where(eq(disputes.id, id));
    const [updated] = await db.select().from(disputes).where(eq(disputes.id, id));
    return updated;
  }

  async createWithdrawal(data: {
    userId: string;
    amount: string;
    status: "pending";
    destinationType: string;
    destinationKey: string;
  }): Promise<Withdrawal> {
    const withdrawalId = crypto.randomUUID();
    await db.insert(withdrawals).values({
      id: withdrawalId,
      userId: data.userId,
      amount: data.amount,
      status: data.status,
      destinationType: data.destinationType,
      destinationKey: data.destinationKey,
    });
    const [withdrawal] = await db.select().from(withdrawals).where(eq(withdrawals.id, withdrawalId));
    return withdrawal;
  }

  async createMessage(data: InsertMessage): Promise<Message> {
    const msgId = crypto.randomUUID();
    await db.insert(messages).values({ ...data, id: msgId });
    const [msg] = await db.select().from(messages).where(eq(messages.id, msgId));
    return msg;
  }

  async getMessages(contactId: string, currentUserId: string): Promise<Message[]> {
    return db.select()
      .from(messages)
      .where(
        or(
          and(eq(messages.senderId, currentUserId), eq(messages.receiverId, contactId)),
          and(eq(messages.senderId, contactId), eq(messages.receiverId, currentUserId))
        )
      )
      .orderBy(messages.createdAt);
  }

  async getContacts(userId: string): Promise<User[]> {
    // Determine contacts based on bookings
    // If user is instructor: get students from their bookings
    // If user is student: get instructors from their bookings

    // This is a simplified implementation. Optimally we would use a more complex query.
    // For MVP, we'll query bookings involving the user.

    /* 
       Ideally:
       SELECT DISTINCT u.* FROM users u
       JOIN bookings b ON (b.student_id = u.id OR b.instructor_id = (SELECT id FROM instructors WHERE user_id = u.id))
       WHERE ...
    */

    // Let's rely on retrieving bookings first

    // Case 1: Start with assuming the user might be a student or instructor.
    // We will just find all unique user IDs they interacted with in bookings.

    // Note: To implement this purely with Drizzle and clean code given context, 
    // it's easier to just fetch relevant bookings and map the unique counterparts.

    // Fetch bookings where user is student
    const studentBookings = await db.query.bookings.findMany({
      where: eq(bookings.studentId, userId),
      with: { instructor: { with: { user: true } } }
    });

    // Fetch bookings where user is instructor
    const instructorProfile = await db.query.instructors.findFirst({
      where: eq(instructors.userId, userId)
    });

    const instructorBookings = instructorProfile
      ? await db.query.bookings.findMany({
        where: eq(bookings.instructorId, instructorProfile.id),
        with: { student: true }
      })
      : [];

    const contactsMap = new Map<string, User>();

    studentBookings.forEach(b => {
      if (b.instructor?.user) {
        contactsMap.set(b.instructor.user.id, b.instructor.user);
      }
    });

    instructorBookings.forEach(b => {
      if (b.student) {
        contactsMap.set(b.student.id, b.student);
      }
    });

    return Array.from(contactsMap.values());
  }

  async markMessagesAsRead(senderId: string, receiverId: string): Promise<void> {
    await db.update(messages)
      .set({ read: true })
      .where(
        and(
          eq(messages.senderId, senderId),
          eq(messages.receiverId, receiverId),
          eq(messages.read, false)
        )
      );
  }

  async getVehicles(instructorId: string): Promise<Vehicle[]> {
    return db.select().from(vehicles).where(eq(vehicles.instructorId, instructorId));
  }

  async createVehicle(data: InsertVehicle): Promise<Vehicle> {
    const vehicleId = crypto.randomUUID();
    await db.insert(vehicles).values({ ...data, id: vehicleId });
    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, vehicleId));
    return vehicle;
  }

  async updateVehicle(id: string, data: Partial<Vehicle>): Promise<Vehicle> {
    await db.update(vehicles).set({ ...data, updatedAt: new Date() }).where(eq(vehicles.id, id));
    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, id));
    return vehicle;
  }

  async deleteVehicle(id: string): Promise<Vehicle | undefined> {
    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, id));
    if (vehicle) {
      await db.delete(vehicles).where(eq(vehicles.id, id));
    }
    return vehicle;
  }

  async createSupportTicket(data: InsertSupportTicket): Promise<SupportTicket> {
    const ticketId = crypto.randomUUID();
    await db.insert(supportTickets).values({ ...data, id: ticketId });
    const [ticket] = await db.select().from(supportTickets).where(eq(supportTickets.id, ticketId));
    return ticket;
  }

  async getSupportTickets(userId?: string): Promise<SupportTicket[]> {
    if (userId) {
      return db
        .select()
        .from(supportTickets)
        .where(eq(supportTickets.userId, userId))
        .orderBy(desc(supportTickets.createdAt));
    }
    return db.select().from(supportTickets).orderBy(desc(supportTickets.createdAt));
  }

  async updateSupportTicket(id: string, data: Partial<SupportTicket>): Promise<SupportTicket> {
    await db.update(supportTickets).set({ ...data, updatedAt: new Date() }).where(eq(supportTickets.id, id));
    const [ticket] = await db.select().from(supportTickets).where(eq(supportTickets.id, id));
    return ticket;
  }
  async getAdminFinancialMetrics(): Promise<Array<{ name: string; gmv: number; revenue: number }>> {
    const rows = await db
      .select({
        name: sql<string>`DATE_FORMAT(${transactions.createdAt}, '%Y-%m')`,
        gmv: sql<number>`sum(${transactions.amountGross})`.mapWith(Number),
        revenue: sql<number>`sum(${transactions.amountNet})`.mapWith(Number),
      })
      .from(transactions)
      .where(eq(transactions.status, 'paid'))
      .groupBy(sql`DATE_FORMAT(${transactions.createdAt}, '%Y-%m')`)
      .orderBy(sql`DATE_FORMAT(${transactions.createdAt}, '%Y-%m')`)
      .limit(12);

    return rows.map(r => ({ ...r, gmv: r.gmv || 0, revenue: r.revenue || 0 }));
  }

  async getAdminGrowthMetrics(): Promise<Array<{ name: string; newUsers: number; churn: number }>> {
    const rows = await db
      .select({
        name: sql<string>`DATE_FORMAT(${users.createdAt}, '%Y-%m')`,
        newUsers: sql<number>`count(${users.id})`.mapWith(Number),
      })
      .from(users)
      .where(eq(users.role, 'student'))
      .groupBy(sql`DATE_FORMAT(${users.createdAt}, '%Y-%m')`)
      .orderBy(sql`DATE_FORMAT(${users.createdAt}, '%Y-%m')`)
      .limit(12);

    return rows.map(r => ({ name: r.name, newUsers: r.newUsers || 0, churn: 0 }));
  }
}


export const storage = new DatabaseStorage();
