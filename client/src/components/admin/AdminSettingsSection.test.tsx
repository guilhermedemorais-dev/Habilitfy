// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminSettingsSection } from "./AdminSettingsSection";

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

function createJsonResponse(data: unknown): Response {
  return {
    json: async () => data,
  } as Response;
}

function renderSection() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={client}>
      <AdminSettingsSection isAdmin={true} />
    </QueryClientProvider>,
  );
}

describe("AdminSettingsSection", () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
    toastMock.mockReset();
    apiRequestMock.mockImplementation(async (method: string, url: string) => {
      if (method === "GET" && url === "/api/admin/settings") {
        return createJsonResponse({
          id: "settings-1",
          platformFeePercent: "15",
          platformFeeType: "percentage",
          cancellationFeePercent: "20",
          cancellationInstructorSharePercent: "60",
        });
      }

      if (method === "PATCH" && url === "/api/admin/settings") {
        return createJsonResponse({ ok: true });
      }

      throw new Error(`Unhandled request: ${method} ${url}`);
    });
  });

  it("loads saved settings into the form", async () => {
    renderSection();

    await waitFor(() => {
      expect(apiRequestMock).toHaveBeenCalledWith("GET", "/api/admin/settings");
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue("15")).toBeTruthy();
      expect(screen.getByDisplayValue("20")).toBeTruthy();
      expect(screen.getByDisplayValue("60")).toBeTruthy();
    });
  });

  it("submits the updated settings payload", async () => {
    renderSection();

    await waitFor(() => {
      expect(screen.getByDisplayValue("15")).toBeTruthy();
    });

    const feeInput = screen.getByLabelText("Percentual da Taxa (%)");
    fireEvent.change(feeInput, { target: { value: "18" } });

    fireEvent.click(screen.getByRole("button", { name: "Salvar configuracoes" }));

    await waitFor(() => {
      expect(apiRequestMock).toHaveBeenCalledWith("PATCH", "/api/admin/settings", {
        platformFeePercent: "18",
        platformFeeType: "percentage",
        cancellationFeePercent: "20",
        cancellationInstructorSharePercent: "60",
      });
    });
  });
});
