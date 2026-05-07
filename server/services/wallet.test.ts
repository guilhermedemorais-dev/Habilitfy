import { beforeEach, describe, expect, it, vi } from "vitest";

const { dbMock, txMock } = vi.hoisted(() => {
  const txMock = {
    execute: vi.fn(),
    query: {
      wallets: {
        findFirst: vi.fn(),
      },
      walletEntries: {
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn(),
    update: vi.fn(),
  };

  const dbMock = {
    transaction: vi.fn(),
    query: {
      wallets: {
        findFirst: vi.fn(),
      },
    },
  };

  return { dbMock, txMock };
});

vi.mock("../db", () => ({
  db: dbMock,
}));

import { walletService } from "./wallet";

describe("walletService.debit", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    dbMock.transaction.mockImplementation(async (callback: (tx: typeof txMock) => Promise<unknown>) =>
      callback(txMock),
    );

    txMock.execute.mockResolvedValue([]);
    txMock.query.wallets.findFirst.mockResolvedValue({
      id: "wallet-1",
      userId: "user-1",
      balance: "50.00",
      currency: "BRL",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    });
    txMock.insert.mockReturnValue({
      values: vi.fn(),
    });
    txMock.update.mockReturnValue({
      set: vi.fn(() => ({
        where: vi.fn().mockResolvedValue({ affectedRows: 0 }),
      })),
    });
  });

  it("rejects without recording an entry when the conditional debit update affects no rows", async () => {
    await expect(
      walletService.debit("user-1", 60, "withdrawal", "Saque concorrente"),
    ).rejects.toThrow("Insufficient funds");

    expect(txMock.execute).toHaveBeenCalledTimes(1);
    expect(txMock.insert).not.toHaveBeenCalled();
  });
});
