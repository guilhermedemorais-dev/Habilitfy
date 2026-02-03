import { db } from "../db";
import { wallets, walletEntries, type Wallet, type WalletEntry } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import crypto from "crypto";

export class WalletService {
    /**
     * Get or create a wallet for a user.
     */
    async getWallet(userId: string): Promise<Wallet> {
        const existing = await db.query.wallets.findFirst({
            where: eq(wallets.userId, userId),
        });

        if (existing) {
            return existing;
        }

        const walletId = crypto.randomUUID();
        await db.insert(wallets).values({
            id: walletId,
            userId,
            balance: "0.00",
            currency: "BRL",
        });
        const [newWallet] = await db.select().from(wallets).where(eq(wallets.id, walletId));

        return newWallet;
    }

    /**
     * Credit an amount to a user's wallet.
     * Uses a transaction to ensure atomicity.
     */
    async credit(
        userId: string,
        amount: number,
        type: "credit" | "refund" | "adjustment" | "sale",
        description: string,
        metadata?: { bookingId?: string; transactionId?: string }
    ): Promise<WalletEntry> {
        const entryType = type === "sale" ? "credit" : type;

        return await db.transaction(async (tx) => {
            let wallet = await tx.query.wallets.findFirst({
                where: eq(wallets.userId, userId),
            });

            if (!wallet) {
                const walletId = crypto.randomUUID();
                await tx.insert(wallets).values({
                    id: walletId,
                    userId,
                    balance: "0.00",
                });
                const [created] = await tx.select().from(wallets).where(eq(wallets.id, walletId));
                wallet = created;
            }

            // Insert Entry
            const entryId = crypto.randomUUID();
            await tx.insert(walletEntries).values({
                id: entryId,
                walletId: wallet.id,
                userId,
                type: entryType as any,
                amount: amount.toFixed(2),
                description,
                bookingId: metadata?.bookingId,
                transactionId: metadata?.transactionId,
            });
            const [entry] = await tx.select().from(walletEntries).where(eq(walletEntries.id, entryId));

            // Update Balance
            await tx
                .update(wallets)
                .set({
                    balance: sql`${wallets.balance} + ${amount.toFixed(2)}`,
                    updatedAt: new Date(),
                })
                .where(eq(wallets.id, wallet.id));

            return entry;
        });
    }

    /**
     * Debit an amount from a user's wallet.
     * Throws error if insufficient funds.
     */
    async debit(
        userId: string,
        amount: number,
        type: "debit" | "withdrawal" | "adjustment",
        description: string,
        metadata?: { bookingId?: string; transactionId?: string }
    ): Promise<WalletEntry> {
        return await db.transaction(async (tx) => {
            let wallet = await tx.query.wallets.findFirst({
                where: eq(wallets.userId, userId),
            });

            if (!wallet) {
                throw new Error("Wallet not found");
            }

            const currentBalance = Number(wallet.balance);
            if (currentBalance < amount) {
                throw new Error("Insufficient funds");
            }

            // Insert Entry
            const entryId = crypto.randomUUID();
            await tx.insert(walletEntries).values({
                id: entryId,
                walletId: wallet.id,
                userId,
                type: type,
                amount: (-amount).toFixed(2),
                description,
                bookingId: metadata?.bookingId,
                transactionId: metadata?.transactionId,
            });
            const [entry] = await tx.select().from(walletEntries).where(eq(walletEntries.id, entryId));

            // Update Balance
            await tx
                .update(wallets)
                .set({
                    balance: sql`${wallets.balance} - ${amount.toFixed(2)}`,
                    updatedAt: new Date(),
                })
                .where(eq(wallets.id, wallet.id));

            return entry;
        });
    }

    async getHistory(userId: string, limit = 50): Promise<WalletEntry[]> {
        return await db.query.walletEntries.findMany({
            where: eq(walletEntries.userId, userId),
            orderBy: (entries, { desc }) => [desc(entries.createdAt)],
            limit,
        });
    }

    async getBalance(userId: string): Promise<number> {
        const wallet = await this.getWallet(userId);
        return Number(wallet.balance);
    }
}

export const walletService = new WalletService();
