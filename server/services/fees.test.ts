import { beforeEach, describe, expect, it, vi } from "vitest";

const { dbMock, txMock, storageMock } = vi.hoisted(() => {
  const txMock = {
    execute: vi.fn(),
    select: vi.fn(),
    insert: vi.fn(),
    query: {
      wallets: {
        findFirst: vi.fn(),
      },
    },
    update: vi.fn(),
  };

  const dbMock = {
    transaction: vi.fn(),
  };

  const storageMock = {
    getBooking: vi.fn(),
    getInstructor: vi.fn(),
    getAdminSettings: vi.fn(),
  };

  return { dbMock, txMock, storageMock };
});

vi.mock("../db", () => ({
  db: dbMock,
}));

vi.mock("../storage", () => ({
  storage: storageMock,
}));

import { feesService } from "./fees";

describe("feesService.distributeBookingRevenue", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    dbMock.transaction.mockImplementation(async (callback: (tx: typeof txMock) => Promise<unknown>) =>
      callback(txMock),
    );

    storageMock.getBooking.mockResolvedValue({
      id: "booking-1",
      instructorId: "instructor-1",
      studentId: "student-1",
      totalPrice: "100.00",
      startCode: "ABC123",
    });
    storageMock.getInstructor.mockResolvedValue({
      id: "instructor-1",
      userId: "user-1",
    });
    storageMock.getAdminSettings.mockResolvedValue({
      platformFeePercent: "10.00",
    });

    txMock.execute.mockResolvedValue([]);
    txMock.select.mockReturnValue({
      from: vi.fn(() => ({
        where: vi.fn().mockResolvedValue([{ id: "wallet-entry-existing" }]),
      })),
    });
    txMock.insert.mockReturnValue({
      values: vi.fn().mockResolvedValue(undefined),
    });
    txMock.update.mockReturnValue({
      set: vi.fn(() => ({
        where: vi.fn(),
      })),
    });
  });

  it("records the commission only once and skips a duplicate payout when the booking credit already exists", async () => {
    await feesService.distributeBookingRevenue("booking-1");

    expect(txMock.execute).toHaveBeenCalled();
    expect(txMock.insert).toHaveBeenCalledTimes(1);
    expect(txMock.update).not.toHaveBeenCalled();
  });
});
