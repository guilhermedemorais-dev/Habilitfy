import { describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({
  db: {},
}));

import { DatabaseStorage } from "./storage";

describe("DatabaseStorage.ensureWalletEntryTx", () => {
  it("skips a second wallet credit when the same booking payout already exists", async () => {
    const storage = new DatabaseStorage();
    const txMock = {
      execute: vi.fn().mockResolvedValue([]),
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn().mockResolvedValue([{ id: "wallet-entry-1" }]),
        })),
      })),
      insert: vi.fn(),
      update: vi.fn(),
    };

    await (storage as any).ensureWalletEntryTx(txMock, {
      id: "booking-transaction-1",
      toUserId: "user-1",
      bookingId: "booking-1",
      amountNet: "90.00",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    expect(txMock.execute).toHaveBeenCalledTimes(1);
    expect(txMock.insert).not.toHaveBeenCalled();
    expect(txMock.update).not.toHaveBeenCalled();
  });
});
