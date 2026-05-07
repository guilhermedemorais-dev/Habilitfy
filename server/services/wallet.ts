import { db } from "../db";
import { wallets, walletEntries, type Wallet, type WalletEntry } from "@shared/schema";
import { and, eq, sql } from "drizzle-orm";
import crypto from "crypto";

export class WalletService {
    private getAffectedRows(result: unknown) {
        if (Array.isArray(result)) {
            const [header] = result;
            return Number((header as { affectedRows?: number } | undefined)?.affectedRows ?? 0);
        }

        return Number((result as { affectedRows?: number } | undefined)?.affectedRows ?? 0);
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
     * Get or create a wallet for a user.
     */
    async getWallet(userId: string): Promise<Wallet> {
        return await db.transaction(async (tx) => {
            await this.lockWalletOwner(tx, userId);
            return await this.getOrCreateWalletTx(tx, userId);
        });
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
            await this.lockWalletOwner(tx, userId);

            if (metadata?.transactionId) {
                const existing = await tx.query.walletEntries.findFirst({
                    where: eq(walletEntries.transactionId, metadata.transactionId),
                });

                if (existing) {
                    return existing;
                }
            }

            const wallet = await this.getOrCreateWalletTx(tx, userId);
            const now = new Date();
            const entry: WalletEntry = {
                id: crypto.randomUUID(),
                walletId: wallet.id,
                userId,
                type: entryType as any,
                amount: amount.toFixed(2),
                description,
                bookingId: metadata?.bookingId ?? null,
                transactionId: metadata?.transactionId ?? null,
                createdAt: now,
            };

            await tx.insert(walletEntries).values(entry);

            await tx
                .update(wallets)
                .set({
                    balance: sql`${wallets.balance} + ${amount.toFixed(2)}`,
                    updatedAt: now,
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
            await this.lockWalletOwner(tx, userId);

            if (metadata?.transactionId) {
                const existing = await tx.query.walletEntries.findFirst({
                    where: eq(walletEntries.transactionId, metadata.transactionId),
                });

                if (existing) {
                    return existing;
                }
            }

            const wallet = await tx.query.wallets.findFirst({
                where: eq(wallets.userId, userId),
            });

            if (!wallet) {
                throw new Error("Wallet not found");
            }

            const now = new Date();
            const amountValue = amount.toFixed(2);
            const updateResult = await tx
                .update(wallets)
                .set({
                    balance: sql`${wallets.balance} - ${amountValue}`,
                    updatedAt: now,
                })
                .where(
                    and(
                        eq(wallets.id, wallet.id),
                        sql`${wallets.balance} >= ${amountValue}`,
                    ),
                );

            if (this.getAffectedRows(updateResult) === 0) {
                throw new Error("Insufficient funds");
            }

            const entry: WalletEntry = {
                id: crypto.randomUUID(),
                walletId: wallet.id,
                userId,
                type: type,
                amount: (-amount).toFixed(2),
                description,
                bookingId: metadata?.bookingId ?? null,
                transactionId: metadata?.transactionId ?? null,
                createdAt: now,
            };

            await tx.insert(walletEntries).values(entry);

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
