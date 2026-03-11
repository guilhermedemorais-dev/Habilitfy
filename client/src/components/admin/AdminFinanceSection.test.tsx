// @vitest-environment jsdom
import type { ComponentProps } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Wallet } from "lucide-react";
import {
  AdminFinanceSection,
  type AdminTransactionRow,
  type AdminWalletEntryRow,
  type AdminWalletRow,
  type AdminWithdrawalRow,
} from "./AdminFinanceSection";

const SLOW_TEST_TIMEOUT_MS = 20_000;

const formatCurrency = (value: number | string | null | undefined) =>
  String(value ?? "—");

const formatPersonName = (person?: {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
} | null) => {
  if (!person) return "—";
  return [person.firstName, person.lastName].filter(Boolean).join(" ") || person.email || "—";
};

const formatRoleLabel = (role?: string | null) => role || "—";

function renderSection(overrides?: Partial<ComponentProps<typeof AdminFinanceSection>>) {
  const financeCards = [
    {
      label: "Total transacionado",
      value: 100,
      loading: false,
      error: false,
      helper: "Teste",
      icon: Wallet,
      tone: "text-slate-700",
      bg: "bg-slate-100",
    },
  ];

  const transactions: AdminTransactionRow[] = [
    {
      transaction: {
        id: "tx-1",
        bookingId: "b-1",
        type: "booking",
        status: "paid",
        amountGross: "100",
        amountNet: "85",
        gateway: "pix",
        createdAt: "2026-03-01T00:00:00.000Z",
      },
      fromUser: { id: "u-1", firstName: "Ana", lastName: "Silva", email: "ana@example.com" },
      toUser: { id: "u-2", firstName: "Bob", lastName: "Souza", email: "bob@example.com" },
      booking: { id: "b-1" },
    },
  ];

  const wallets: AdminWalletRow[] = [
    {
      id: "w-1",
      balance: "50",
      currency: "BRL",
      updatedAt: "2026-03-01T00:00:00.000Z",
      user: { id: "u-1", firstName: "Ana", lastName: "Silva", email: "ana@example.com", role: "student" },
    },
  ];

  const walletEntries: AdminWalletEntryRow[] = [
    {
      entry: {
        id: "we-1",
        type: "credit",
        amount: "50",
        description: "Entrada",
        createdAt: "2026-03-01T00:00:00.000Z",
      },
      user: { id: "u-1", firstName: "Ana", lastName: "Silva", email: "ana@example.com" },
    },
  ];

  const withdrawals: AdminWithdrawalRow[] = [
    {
      withdrawal: {
        id: "wd-1",
        userId: "u-1",
        amount: "40",
        status: "pending",
        destinationType: "pix",
        destinationKey: "ana@pix",
        requestedAt: "2026-03-01T00:00:00.000Z",
      },
      user: { id: "u-1", firstName: "Ana", lastName: "Silva", email: "ana@example.com" },
      processedBy: null,
    },
  ];

  return render(
    <AdminFinanceSection
      financeCards={financeCards}
      transactions={transactions}
      wallets={wallets}
      walletEntries={walletEntries}
      withdrawals={withdrawals}
      transactionsLoading={false}
      transactionsError={null}
      walletsLoading={false}
      walletsError={null}
      walletEntriesLoading={false}
      walletEntriesError={null}
      withdrawalsLoading={false}
      withdrawalsError={null}
      isUnauthorized={false}
      searchTerm=""
      formatCurrency={formatCurrency}
      formatPersonName={formatPersonName}
      formatRoleLabel={formatRoleLabel}
      onRefreshFinanceSummary={() => {}}
      onRefreshTransactions={() => {}}
      onRefreshWallets={() => {}}
      onRefreshWalletEntries={() => {}}
      onRefreshWithdrawals={() => {}}
      onExportTransactions={() => {}}
      onExportWithdrawals={() => {}}
      onWithdrawalAction={() => {}}
      isUpdatingWithdrawal={false}
      {...overrides}
    />,
  );
}

describe("AdminFinanceSection", () => {
  it("filters transactions by the shared search term", () => {
    renderSection({ searchTerm: "bob" });

    expect(screen.getByText("tx-1")).toBeTruthy();
    expect(screen.getByText("Nenhum saque encontrado.")).toBeTruthy();
  }, SLOW_TEST_TIMEOUT_MS);

  it("triggers withdrawal actions from the withdrawals table", () => {
    const onWithdrawalAction = vi.fn();
    renderSection({ onWithdrawalAction });

    fireEvent.click(screen.getByRole("button", { name: "Aprovar" }));

    expect(onWithdrawalAction).toHaveBeenCalledWith({
      id: "wd-1",
      status: "approved",
    });
  }, SLOW_TEST_TIMEOUT_MS);
});
