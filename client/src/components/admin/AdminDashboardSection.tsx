import { useEffect, useMemo } from "react";
import type { LucideIcon } from "lucide-react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { AdminFinancialCharts } from "@/components/admin/AdminFinancialCharts";
import { AdminMonitoring } from "@/components/admin/AdminMonitoring";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

export type AdminDashboardStat = {
  label: string;
  value: number;
  loading: boolean;
  error: boolean;
  helper: string;
  icon: LucideIcon;
  tone: string;
  bg: string;
  format?: (value: number) => string;
};

export type AdminDashboardAlert = {
  label: string;
  valueLabel: string;
  helper: string;
  icon: LucideIcon;
  tone: string;
  bg: string;
};

export type AdminFinanceSeriesPoint = {
  period: string;
  total: number;
  count: number;
};

export type AdminGeoPoint = {
  lat: number;
  lng: number;
  count: number;
  label?: string | null;
};

export type AdminGeoSummary = {
  instructors: AdminGeoPoint[];
  students: AdminGeoPoint[];
  states: string[];
  cities: string[];
  totals: {
    instructorsTotal: number;
    instructorsWithLocation: number;
    studentsTotal: number;
    studentsWithLocation: number;
  };
};

type AdminDashboardSectionProps = {
  onExportBookings: () => void;
  stats: AdminDashboardStat[];
  alerts: AdminDashboardAlert[];
  mapStateFilter: string;
  onMapStateChange: (value: string) => void;
  mapCityFilter: string;
  onMapCityChange: (value: string) => void;
  mapLayer: "instructors" | "students";
  onMapLayerChange: (value: "instructors" | "students") => void;
  geoSummary: AdminGeoSummary;
  geoSummaryLoading: boolean;
  geoSummaryError: unknown;
  financePeriodFilter: "day" | "week" | "month";
  onFinancePeriodChange: (value: "day" | "week" | "month") => void;
  financeStatusFilter: string;
  onFinanceStatusChange: (value: string) => void;
  financeSeries: AdminFinanceSeriesPoint[];
  financeSeriesLoading: boolean;
  formatCurrency: (value: number | string | null | undefined) => string;
};

function AdminMapController({
  center,
  zoom,
}: {
  center: [number, number];
  zoom: number;
}) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, map, zoom]);

  return null;
}

export function AdminDashboardSection({
  onExportBookings,
  stats,
  alerts,
  mapStateFilter,
  onMapStateChange,
  mapCityFilter,
  onMapCityChange,
  mapLayer,
  onMapLayerChange,
  geoSummary,
  geoSummaryLoading,
  geoSummaryError,
  financePeriodFilter,
  onFinancePeriodChange,
  financeStatusFilter,
  onFinanceStatusChange,
  financeSeries,
  financeSeriesLoading,
  formatCurrency,
}: AdminDashboardSectionProps) {
  const mapPoints =
    mapLayer === "instructors" ? geoSummary.instructors : geoSummary.students;
  const mapCenter = useMemo<[number, number]>(() => {
    if (mapPoints.length === 0) return [-14.235, -51.9253];
    const latSum = mapPoints.reduce((sum, point) => sum + point.lat, 0);
    const lngSum = mapPoints.reduce((sum, point) => sum + point.lng, 0);
    return [latSum / mapPoints.length, lngSum / mapPoints.length];
  }, [mapPoints]);
  const mapZoom = mapPoints.length > 1 ? 4 : mapPoints.length === 1 ? 9 : 4;
  const chartHasData = financeSeries.length > 0;

  const formatSeriesLabel = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    if (financePeriodFilter === "month") {
      return date.toLocaleDateString("pt-BR", {
        month: "short",
        year: "2-digit",
      });
    }
    if (financePeriodFilter === "week") {
      return `Sem ${date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
      })}`;
    }
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    });
  };

  return (
    <section id="dashboard" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Visão geral</h2>
          <p className="text-sm text-slate-500">
            Indicadores principais do painel admin.
          </p>
        </div>
        <Button variant="outline" onClick={onExportBookings}>
          Exportar relatórios
        </Button>
      </div>

      <AdminMonitoring />
      <AdminFinancialCharts />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const value = stat.loading
            ? "..."
            : stat.error
              ? "—"
              : stat.format
                ? stat.format(stat.value)
                : stat.value.toLocaleString("pt-BR");

          return (
            <Card key={stat.label} className="border border-slate-200 shadow-sm">
              <CardContent className="flex items-center justify-between gap-4 p-5">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-blue-400">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-blue-100">
                    {value}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-blue-300/70">
                    {stat.error ? "Dados temporariamente indisponíveis." : stat.helper}
                  </p>
                </div>
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-lg ${stat.bg} ${stat.tone}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card id="mapa" className="border border-slate-200 shadow-sm">
          <CardContent className="p-0">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-6 py-4">
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-blue-100">
                  Mapa Brasil
                </p>
                <p className="text-xs text-slate-500 dark:text-blue-400">
                  Distribuicao por instrutores e alunos com localizacao cadastrada.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={mapStateFilter}
                  onValueChange={(value) => {
                    onMapStateChange(value);
                    onMapCityChange("all");
                  }}
                >
                  <SelectTrigger className="h-8 w-[160px]">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos estados</SelectItem>
                    {geoSummary.states.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={mapCityFilter}
                  onValueChange={onMapCityChange}
                  disabled={geoSummary.cities.length === 0}
                >
                  <SelectTrigger className="h-8 w-[200px]">
                    <SelectValue placeholder="Cidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas cidades</SelectItem>
                    {geoSummary.cities.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  variant={mapLayer === "instructors" ? "default" : "outline"}
                  onClick={() => onMapLayerChange("instructors")}
                >
                  Instrutores
                </Button>
                <Button
                  size="sm"
                  variant={mapLayer === "students" ? "default" : "outline"}
                  onClick={() => onMapLayerChange("students")}
                >
                  Alunos
                </Button>
              </div>
            </div>
            <div className="h-[320px] overflow-hidden">
              {geoSummaryLoading ? (
                <div className="flex h-full items-center justify-center gap-2 text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Carregando mapa...
                </div>
              ) : geoSummaryError ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-amber-600">
                  <AlertTriangle className="h-4 w-4" />
                  Dados de geolocalização indisponíveis no momento.
                </div>
              ) : mapPoints.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-slate-500">
                  <AlertTriangle className="h-4 w-4" />
                  Nenhuma coordenada encontrada para exibir no mapa.
                </div>
              ) : (
                <MapContainer
                  center={mapCenter}
                  zoom={mapZoom}
                  scrollWheelZoom={false}
                  className="h-full w-full"
                >
                  <AdminMapController center={mapCenter} zoom={mapZoom} />
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                  />
                  {mapPoints.map((point) => {
                    const color = mapLayer === "instructors" ? "#2563eb" : "#16a34a";
                    const radius = Math.min(6 + point.count * 2, 18);
                    const label = point.label || "Localizacao nao informada";

                    return (
                      <CircleMarker
                        key={`${mapLayer}-${point.lat}-${point.lng}`}
                        center={[point.lat, point.lng]}
                        radius={radius}
                        pathOptions={{
                          color,
                          fillColor: color,
                          fillOpacity: 0.6,
                        }}
                      >
                        <Popup>
                          <div className="text-sm">
                            <p className="font-semibold">{label}</p>
                            <p>
                              {mapLayer === "instructors"
                                ? "Instrutores"
                                : "Alunos com aulas"}
                              : {point.count}
                            </p>
                          </div>
                        </Popup>
                      </CircleMarker>
                    );
                  })}
                </MapContainer>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-6 py-3 text-xs text-slate-500">
              <span>
                Instrutores com localizacao: {geoSummary.totals.instructorsWithLocation} de{" "}
                {geoSummary.totals.instructorsTotal}
              </span>
              <span>
                Alunos com localizacao: {geoSummary.totals.studentsWithLocation} de{" "}
                {geoSummary.totals.studentsTotal}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 shadow-sm">
          <CardContent className="space-y-4 p-6">
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-blue-100">
                Alertas criticos
              </p>
              <p className="text-xs text-slate-500 dark:text-blue-400">
                Pendencias que exigem atencao imediata.
              </p>
            </div>
            <div className="space-y-3">
              {alerts.map((alert) => {
                const Icon = alert.icon;
                return (
                  <div
                    key={alert.label}
                    className="flex items-center gap-3 rounded-lg border border-slate-100 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-800"
                  >
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-lg ${alert.bg} ${alert.tone}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-800 dark:text-blue-100">
                        {alert.label}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-blue-400">
                        {alert.helper}
                      </p>
                    </div>
                    <span className={`text-sm font-semibold ${alert.tone}`}>
                      {alert.valueLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-slate-200 shadow-sm">
        <CardContent className="space-y-4 p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-blue-100">
                Grafico financeiro
              </p>
              <p className="text-xs text-slate-500 dark:text-blue-400">
                Transacoes por periodo e status.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={financePeriodFilter}
                onValueChange={(value) =>
                  onFinancePeriodChange(value as "day" | "week" | "month")
                }
              >
                <SelectTrigger className="h-8 w-[140px]">
                  <SelectValue placeholder="Periodo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Dia</SelectItem>
                  <SelectItem value="week">Semana</SelectItem>
                  <SelectItem value="month">Mes</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={financeStatusFilter}
                onValueChange={onFinanceStatusChange}
              >
                <SelectTrigger className="h-8 w-[160px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">Pagas</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="processing">Processando</SelectItem>
                  <SelectItem value="refunded">Reembolsadas</SelectItem>
                  <SelectItem value="all">Todas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="h-[260px]">
            {financeSeriesLoading ? (
              <div className="flex h-full items-center justify-center gap-2 text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando grafico...
              </div>
            ) : !chartHasData ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                Sem dados financeiros para o periodo selecionado.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={financeSeries} margin={{ left: 8, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="period"
                    tickFormatter={formatSeriesLabel}
                    stroke="#94a3b8"
                    fontSize={12}
                  />
                  <YAxis
                    tickFormatter={(value) => formatCurrency(value)}
                    stroke="#94a3b8"
                    fontSize={12}
                    width={90}
                  />
                  <Tooltip
                    formatter={(value) => formatCurrency(value as number)}
                    labelFormatter={formatSeriesLabel}
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={false}
                    name="Total"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
