// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UserManagementSheet } from "./UserReviewDialog";

const apiRequestMock = vi.fn();
const toastMock = vi.fn();

vi.mock("@/lib/queryClient", () => ({
  apiRequest: (...args: unknown[]) => apiRequestMock(...args),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: toastMock,
  }),
}));

const SLOW_TEST_TIMEOUT_MS = 20_000;

const reviewPayload = {
  user: {
    id: "user-1",
    firstName: "Ana",
    lastName: "Silva",
    email: "ana@example.com",
    role: "student",
    kycStatus: "pending",
    isBlocked: false,
    adminNotes: null,
  },
  instructor: null,
  latestKyc: null,
  vehiclesSummary: null,
  sectionErrors: {},
};

const financePayload = {
  wallet: null,
  entries: [],
  withdrawals: [],
  sectionErrors: {},
};

const historyPayload = {
  summary: {
    totalRequests: 0,
    uniqueIps: 0,
    firstSeenAt: null,
    lastSeenAt: null,
    connectedMinutes: 0,
  },
  access: {
    browserDistribution: [],
    deviceDistribution: [],
    topPaths: [],
    heatmap: [],
    logs: [],
  },
  supportTickets: [],
  supportChatHistory: [],
  chatHistory: [],
  adminActions: [],
  sectionErrors: {},
};

function createJsonResponse(data: unknown): Response {
  return {
    json: async () => data,
  } as Response;
}

function renderSheet() {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={client}>
      <UserManagementSheet open={true} onOpenChange={() => {}} userId="user-1" />
    </QueryClientProvider>,
  );
}

describe("UserManagementSheet", () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
    toastMock.mockReset();
    apiRequestMock.mockImplementation(async (_method: string, url: string) => {
      if (url.endsWith("/review")) {
        return createJsonResponse(reviewPayload);
      }
      if (url.endsWith("/finance")) {
        return createJsonResponse(financePayload);
      }
      if (url.endsWith("/history")) {
        return createJsonResponse(historyPayload);
      }
      throw new Error(`Unhandled request: ${url}`);
    });
  });

  it("lazy-loads finance and history only after tab activation", async () => {
    renderSheet();

    await waitFor(() => {
      expect(apiRequestMock).toHaveBeenCalledWith(
        "GET",
        "/api/admin/users/user-1/review",
      );
    });

    expect(apiRequestMock).not.toHaveBeenCalledWith(
      "GET",
      "/api/admin/users/user-1/finance",
    );
    expect(apiRequestMock).not.toHaveBeenCalledWith(
      "GET",
      "/api/admin/users/user-1/history",
    );

    const financeTab = await screen.findByRole("tab", { name: "Financeiro" });
    fireEvent.mouseDown(financeTab);

    await waitFor(() => {
      expect(apiRequestMock).toHaveBeenCalledWith(
        "GET",
        "/api/admin/users/user-1/finance",
      );
    });

    const historyTab = await screen.findByRole("tab", { name: "Histórico" });
    fireEvent.mouseDown(historyTab);

    await waitFor(() => {
      expect(apiRequestMock).toHaveBeenCalledWith(
        "GET",
        "/api/admin/users/user-1/history",
      );
    });
  }, SLOW_TEST_TIMEOUT_MS);
});
