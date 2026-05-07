import { db } from "../db";
import { wallets, walletEntries, transactions, type Wallet } from "@shared/schema";
import { and, eq, sql } from "drizzle-orm";
import { storage } from "../storage";
import crypto from "crypto";

export class FeesService {
    private async lockBooking(tx: any, bookingId: string) {
        await tx.execute(sql`SELECT id FROM bookings WHERE id = ${bookingId} FOR UPDATE`);
    }

    private async lockWalletOwner(tx: any, userId: string) {
        await tx.execute(sql`SELECT id FROM users WHERE id = ${userId} FOR UPDATE`);
    }

    private async getOrCreateWalletTx(tx: any, userId: string): Promise<Wallet> {
        const existing = await tx.query.wallets.findFirst({
            where: eq(wallets.userId, userId),
        });

        if (existing) {
            return existing;
        }

        const now = new Date();
        const created: Wallet = {
            id: crypto.randomUUID(),
            userId,
            balance: "0.00",
            currency: "BRL",
            createdAt: now,
            updatedAt: now,
        };

        await tx.insert(wallets).values(created);
        return created;
    }

    /**
     * Calculate fees and split for a given total amount.
     * Fetches current configuration from AdminSettings.
     */
    async calculateSplit(totalAmount: number) {
        const settings = await storage.getAdminSettings();
        const platformFeePercent = Number(settings.platformFeePercent || 0);

        // Safety check
        if (platformFeePercent < 0 || platformFeePercent > 100) {
            console.error("Invalid platform fee percent:", platformFeePercent); // Fallback to 0 if invalid?
        }

        const platformFee = (totalAmount * platformFeePercent) / 100;
        const instructorAmount = totalAmount - platformFee;

        return {
            totalAmount,
            platformFee,
            instructorAmount,
            feePercent: platformFeePercent,
        };
    }

    /**
     * Distribute revenue for a booking.
     * Records platform fee and credits the instructor only if the booking payout
     * was not already applied by the booking transaction flow.
     */
    async distributeBookingRevenue(bookingId: string) {
        const booking = await storage.getBooking(bookingId);
        if (!booking) {
            throw new Error(`Booking ${bookingId} not found`);
        }

        const totalAmount = Number(booking.totalPrice);
        const split = await this.calculateSplit(totalAmount);

        console.log(`Distributing revenue for booking ${bookingId}: Total ${totalAmount}, Fee ${split.platformFee}, Net ${split.instructorAmount}`);

        // Credit Instructor Wallet
        const instructor = await storage.getInstructor(booking.instructorId);
        if (!instructor) {
            throw new Error(`Instructor ${booking.instructorId} not found`);
        }

        await db.transaction(async (tx) => {
            await this.lockBooking(tx, bookingId);

            const [existingCommission] = await tx
                .select({ id: transactions.id })
                .from(transactions)
                .where(
                    and(
                        eq(transactions.bookingId, bookingId),
                        eq(transactions.type, "commission"),
                    ),
                );

            if (existingCommission) {
                console.log(`Commission already registered for booking ${bookingId}`);
                return;
            }

            const [existingPayout] = await tx
                .select({ id: walletEntries.id })
                .from(walletEntries)
                .where(
                    and(
                        eq(walletEntries.userId, instructor.userId),
                        eq(walletEntries.bookingId, bookingId),
                        eq(walletEntries.type, "credit"),
                        eq(walletEntries.amount, split.instructorAmount.toFixed(2)),
                    ),
                );

            if (!existingPayout) {
                await this.lockWalletOwner(tx, instructor.userId);
                const wallet = await this.getOrCreateWalletTx(tx, instructor.userId);
                const now = new Date();

                await tx.insert(walletEntries).values({
                    id: crypto.randomUUID(),
                    walletId: wallet.id,
                    userId: instructor.userId,
                    type: "credit",
                    amount: split.instructorAmount.toFixed(2),
                    description: `Aula confirmada #${booking.startCode || bookingId}`,
                    bookingId,
                    createdAt: now,
                });

                await tx
                    .update(wallets)
                    .set({
                        balance: sql`${wallets.balance} + ${split.instructorAmount.toFixed(2)}`,
                        updatedAt: now,
                    })
                    .where(eq(wallets.id, wallet.id));
            }

            const now = new Date();
            await tx.insert(transactions).values({
                id: crypto.randomUUID(),
                bookingId,
                type: "commission",
                status: "paid",
                amountGross: split.platformFee.toFixed(2),
                amountNet: split.platformFee.toFixed(2),
                fromUserId: booking.studentId,
                createdAt: now,
                updatedAt: now,
            });
        });
    }

}

export const feesService = new FeesService();
