import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "../server/db";
import {
  bookings,
  instructors,
  transactions,
  wallets,
  walletEntries,
  users,
} from "../shared/schema";

const PLATFORM_FEE_PERCENT = Number(process.env.PLATFORM_FEE_PERCENT ?? "0");

const toNumber = (value: string | number | null | undefined) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatMoney = (value: number) => value.toFixed(2);

const getTransactionStatus = (booking: typeof bookings.$inferSelect) => {
  const paymentStatus = String(booking.paymentStatus ?? "").toLowerCase();
  if (paymentStatus === "paid" || booking.status === "paid" || booking.status === "completed") {
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
};

async function ensureWallets() {
  const [usersList, walletRows] = await Promise.all([
    db.select({ id: users.id }).from(users),
    db.select({ userId: wallets.userId }).from(wallets),
  ]);

  const existing = new Set(walletRows.map((row) => row.userId));
  const missing = usersList.filter((user) => !existing.has(user.id));

  if (missing.length > 0) {
    await db.insert(wallets).values(
      missing.map((user) => ({
        userId: user.id,
        balance: "0",
        currency: "BRL",
      })),
    );
  }

  return missing.length;
}

async function backfillTransactions() {
  const [bookingRows, existingRows] = await Promise.all([
    db
      .select({ booking: bookings, instructorUserId: instructors.userId })
      .from(bookings)
      .leftJoin(instructors, eq(bookings.instructorId, instructors.id)),
    db
      .select({ bookingId: transactions.bookingId })
      .from(transactions)
      .where(eq(transactions.type, "booking" as any)),
  ]);

  const existing = new Set(
    existingRows.map((row) => row.bookingId).filter(Boolean) as string[],
  );
  const feeRate = Number.isFinite(PLATFORM_FEE_PERCENT)
    ? Math.min(Math.max(PLATFORM_FEE_PERCENT / 100, 0), 1)
    : 0;

  const toInsert = bookingRows
    .filter((row) => row.booking && !existing.has(row.booking.id))
    .map((row) => {
      const gross = toNumber(row.booking.totalPrice);
      const net = Math.max(gross * (1 - feeRate), 0);

      return {
        bookingId: row.booking.id,
        type: "booking",
        status: getTransactionStatus(row.booking),
        amountGross: formatMoney(gross),
        amountNet: formatMoney(net),
        gateway: row.booking.paymentProvider ?? null,
        paymentId: row.booking.paymentId ?? null,
        fromUserId: row.booking.studentId,
        toUserId: row.instructorUserId ?? null,
        createdAt: row.booking.createdAt ?? new Date(),
        updatedAt: row.booking.updatedAt ?? new Date(),
      };
    });

  if (toInsert.length > 0) {
    await db.insert(transactions).values(toInsert);
  }

  return toInsert.length;
}

async function backfillWalletEntries() {
  const paidTransactions = await db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.type, "booking" as any),
        eq(transactions.status, "paid" as any),
      ),
    );

  if (paidTransactions.length === 0) {
    return 0;
  }

  const existingEntries = await db
    .select({ transactionId: walletEntries.transactionId })
    .from(walletEntries)
    .where(inArray(walletEntries.transactionId, paidTransactions.map((t) => t.id)));

  const existing = new Set(
    existingEntries.map((row) => row.transactionId).filter(Boolean) as string[],
  );

  const walletRows = await db.select({ id: wallets.id, userId: wallets.userId }).from(wallets);
  const walletByUser = new Map(walletRows.map((row) => [row.userId, row.id]));

  const toInsert = paidTransactions
    .filter((transaction) => !existing.has(transaction.id))
    .map((transaction) => {
      const userId = transaction.toUserId ?? "";
      const walletId = walletByUser.get(userId);
      if (!walletId || !userId) return null;

      return {
        walletId,
        userId,
        type: "credit",
        amount: transaction.amountNet,
        description: transaction.bookingId
          ? `Repasse booking ${transaction.bookingId}`
          : "Repasse booking",
        bookingId: transaction.bookingId ?? null,
        transactionId: transaction.id,
        createdAt: transaction.createdAt ?? new Date(),
      };
    })
    .filter(Boolean) as Array<{
    walletId: string;
    userId: string;
    type: string;
    amount: string;
    description: string;
    bookingId: string | null;
    transactionId: string;
    createdAt: Date;
  }>;

  if (toInsert.length > 0) {
    await db.insert(walletEntries).values(toInsert);
  }

  return toInsert.length;
}

async function updateWalletBalances() {
  const walletRows = await db.select({ id: wallets.id }).from(wallets);
  const balanceRows = await db
    .select({
      walletId: walletEntries.walletId,
      balance: sql<number>`
        coalesce(
          sum(
            case
              when ${walletEntries.type} in ('debit', 'withdrawal')
              then -${walletEntries.amount}
              else ${walletEntries.amount}
            end
          ),
          0
        )
      `.mapWith(Number),
    })
    .from(walletEntries)
    .groupBy(walletEntries.walletId);

  const balanceByWallet = new Map(
    balanceRows.map((row) => [row.walletId, row.balance]),
  );

  for (const wallet of walletRows) {
    const balance = balanceByWallet.get(wallet.id) ?? 0;
    await db
      .update(wallets)
      .set({ balance: formatMoney(balance), updatedAt: new Date() })
      .where(eq(wallets.id, wallet.id));
  }
}

async function run() {
  const createdWallets = await ensureWallets();
  const createdTransactions = await backfillTransactions();
  const createdEntries = await backfillWalletEntries();
  await updateWalletBalances();

  console.log(
    `Backfill concluido: ${createdWallets} carteiras, ${createdTransactions} transacoes, ${createdEntries} movimentos.`,
  );
}

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
