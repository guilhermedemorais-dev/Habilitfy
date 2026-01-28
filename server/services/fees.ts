import { db } from "../db";
import { bookings, adminSettings, transactions, type Booking } from "@shared/schema";
import { eq } from "drizzle-orm";
import { walletService } from "./wallet";
import { storage } from "../storage";

export class FeesService {
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
     * Credits instructor wallet and records platform fee.
     * Idempotent: checks if transaction already exists.
     */
    async distributeBookingRevenue(bookingId: string) {
        // 1. Check idempotency (Transaction exists?)
        const existingTx = await db.query.transactions.findFirst({
            where: eq(transactions.bookingId, bookingId),
        });

        if (existingTx) {
            console.log(`Revenue already distributed for booking ${bookingId}`);
            return;
        }

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

        await walletService.credit(
            instructor.userId,
            split.instructorAmount,
            "sale",
            `Aula confirmada #${booking.startCode || bookingId}`,
            { bookingId }
        );

        // Create Transaction Record for Platform Fee (Revenue)
        await db.insert(transactions).values({
            bookingId,
            type: "commission",
            status: "paid",
            amountGross: split.platformFee.toFixed(2),
            amountNet: split.platformFee.toFixed(2),
            fromUserId: booking.studentId,
            createdAt: new Date(),
        });
    }

}

export const feesService = new FeesService();
