// @vitest-environment jsdom
import type { ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { AlertTriangle } from "lucide-react";
import { describe, expect, it, vi } from "vitest";

vi.mock("react-leaflet", () => ({
  MapContainer: ({ children }: { children: ReactNode }) => (
    <div data-testid="map">{children}</div>
  ),
  TileLayer: () => <div data-testid="tile-layer" />,
  CircleMarker: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Popup: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  useMap: () => ({ setView: vi.fn() }),
}));

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  LineChart: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CartesianGrid: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  Tooltip: () => <div />,
  Line: () => <div />,
}));

vi.mock("./AdminMonitoring", () => ({
  AdminMonitoring: () => <div>AdminMonitoring</div>,
}));

vi.mock("./AdminFinancialCharts", () => ({
  AdminFinancialCharts: () => <div>AdminFinancialCharts</div>,
}));

import { AdminDashboardSection } from "./AdminDashboardSection";

const SLOW_TEST_TIMEOUT_MS = 20_000;

describe("AdminDashboardSection", () => {
  it("renders overview content and triggers primary actions", () => {
    const onExportBookings = vi.fn();
    const onMapLayerChange = vi.fn();

    render(
      <AdminDashboardSection
        onExportBookings={onExportBookings}
        stats={[
          {
            label: "Instrutores pendentes",
            value: 3,
            loading: false,
            error: false,
            helper: "Aguardando validação",
            icon: AlertTriangle,
            tone: "text-yellow-700",
            bg: "bg-yellow-100",
          },
        ]}
        alerts={[
          {
            label: "Saques pendentes",
            valueLabel: "2",
            helper: "Aguardando aprovacao manual.",
            icon: AlertTriangle,
            tone: "text-blue-700",
            bg: "bg-blue-100",
          },
        ]}
        mapStateFilter="all"
        onMapStateChange={() => {}}
        mapCityFilter="all"
        onMapCityChange={() => {}}
        mapLayer="instructors"
        onMapLayerChange={onMapLayerChange}
        geoSummary={{
          instructors: [{ lat: -23.5, lng: -46.6, count: 2, label: "São Paulo" }],
          students: [],
          states: ["SP"],
          cities: ["São Paulo"],
          totals: {
            instructorsTotal: 5,
            instructorsWithLocation: 2,
            studentsTotal: 7,
            studentsWithLocation: 0,
          },
        }}
        geoSummaryLoading={false}
        geoSummaryError={null}
        financePeriodFilter="day"
        onFinancePeriodChange={() => {}}
        financeStatusFilter="all"
        onFinanceStatusChange={() => {}}
        financeSeries={[]}
        financeSeriesLoading={false}
        formatCurrency={(value) => String(value ?? "—")}
      />,
    );

    expect(screen.getByText("Visão geral")).toBeTruthy();
    expect(screen.getByText("AdminMonitoring")).toBeTruthy();
    expect(screen.getByText("AdminFinancialCharts")).toBeTruthy();
    expect(screen.getByText("Sem dados financeiros para o periodo selecionado.")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Exportar relatórios" }));
    fireEvent.click(screen.getByRole("button", { name: "Alunos" }));

    expect(onExportBookings).toHaveBeenCalledTimes(1);
    expect(onMapLayerChange).toHaveBeenCalledWith("students");
  }, SLOW_TEST_TIMEOUT_MS);
});
