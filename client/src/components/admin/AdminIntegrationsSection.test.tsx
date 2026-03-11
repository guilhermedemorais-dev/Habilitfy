// @vitest-environment jsdom
import type { ComponentProps } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  AdminIntegrationsSection,
  type AdminIntegration,
} from "./AdminIntegrationsSection";

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

function renderSection(props?: Partial<ComponentProps<typeof AdminIntegrationsSection>>) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const integrations: AdminIntegration[] = [
    {
      id: "int-1",
      name: "Pix Gateway",
      slug: "pix-gateway",
      category: "payment",
      status: "active",
      environment: "production",
      isDefault: true,
      fields: [],
      createdAt: null,
      updatedAt: null,
    },
    {
      id: "int-2",
      name: "GovBR Login",
      slug: "govbr-login",
      category: "auth",
      status: "inactive",
      environment: "development",
      isDefault: false,
      fields: [],
      createdAt: null,
      updatedAt: null,
    },
  ];

  return render(
    <QueryClientProvider client={client}>
      <AdminIntegrationsSection
        integrations={integrations}
        isUnauthorized={false}
        searchTerm=""
        integrationsLoading={false}
        integrationsError={null}
        {...props}
      />
    </QueryClientProvider>,
  );
}

describe("AdminIntegrationsSection", () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
    toastMock.mockReset();
  });

  it("filters the integrations list by the provided search term", () => {
    renderSection({ searchTerm: "pix" });

    expect(screen.getByText("Pix Gateway")).toBeTruthy();
    expect(screen.queryByText("GovBR Login")).toBeNull();
  }, SLOW_TEST_TIMEOUT_MS);

  it("blocks submit when the integration name is empty", () => {
    renderSection();

    fireEvent.click(screen.getByRole("button", { name: "Salvar integração" }));

    expect(apiRequestMock).not.toHaveBeenCalled();
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Informe o nome",
      }),
    );
  }, SLOW_TEST_TIMEOUT_MS);
});
