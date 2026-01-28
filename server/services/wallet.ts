import { db } from "../db";
import { wallets, walletEntries, type Wallet, type WalletEntry } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

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

        const [newWallet] = await db
            .insert(wallets)
            .values({
                userId,
                balance: "0.00",
                currency: "BRL",
            })
            .returning();

        return newWallet;
    }

    /**
     * Credit an amount to a user's wallet.
     * Uses a transaction to ensure atomicity.
     */
    async credit(
        userId: string,
        amount: number,
        type: "credit" | "refund" | "adjustment" | "sale", // Added 'sale' which might need to map to schema enum
        description: string,
        metadata?: { bookingId?: string; transactionId?: string }
    ): Promise<WalletEntry> {
        // Map 'sale' to 'credit' or ensure schema supports it. Schema has: credit, debit, refund, withdrawal, adjustment.
        // We will use 'credit' for sales/commission earnings for now, or strict schema types.
        const entryType = type === "sale" ? "credit" : type;

        return await db.transaction(async (tx) => {
            // 1. Get or create wallet (within transaction implies locking or just safe ops)
            // For strict correctness, we might want to lock, but Drizzle simple update is usually fine for atomic increment if using sql helpers.
            // However, we need the wallet ID first.

            let wallet = await tx.query.wallets.findFirst({
                where: eq(wallets.userId, userId),
            });

            if (!wallet) {
                // Create if not exists
                const [created] = await tx
                    .insert(wallets)
                    .values({
                        userId,
                        balance: "0.00",
                    })
                    .returning();
                wallet = created;
            }

            // 2. Insert Entry
            const [entry] = await tx
                .insert(walletEntries)
                .values({
                    walletId: wallet.id,
                    userId,
                    type: entryType as any, // Cast to match enum if strictly typed
                    amount: amount.toFixed(2),
                    description,
                    bookingId: metadata?.bookingId,
                    transactionId: metadata?.transactionId,
                })
                .returning();

            // 3. Update Balance
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

            // 1. Insert Entry
            const [entry] = await tx
                .insert(walletEntries)
                .values({
                    walletId: wallet.id,
                    userId,
                    type: type,
                    amount: (-amount).toFixed(2), // Storing negative for debit? Or positive with type debit? 
                    // Usually ledger credits are positive, debits negative OR absolute values with type. 
                    // Schema seems to allow decimal. Let's stick to absolute value in amount, type determines sign, 
                    // BUT `balance` update must subtract. 
                    // Actually, let's keep amount positive in entry for clarity, but logic subtracts.
                    description,
                    bookingId: metadata?.bookingId,
                    transactionId: metadata?.transactionId,
                })
                .returning();

            // 2. Update Balance
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

    async getBalance(userId: string): Promise<number> {
        const wallet = await this.getWallet(userId);
        return Number(wallet.balance);
    }
}

export const walletService = new WalletService();
