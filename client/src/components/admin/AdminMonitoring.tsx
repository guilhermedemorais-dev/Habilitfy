import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Cpu, Server, AlertCircle, Gauge, Users } from "lucide-react";
import { getQueryFn } from "@/lib/queryClient";

type SystemHealth = {
    status: string;
    uptime: number;
    memory: {
        rss: number;
        heapTotal: number;
        heapUsed: number;
    };
    metrics: {
        activeSessions: number;
        requestsPerMinute: number;
        errorsLastHour: number;
        avgResponseTime: number;
        cpuPercent: number;
        cpuLimit: number;
    };
    container: {
        memoryUsedMb: number;
        memoryLimitMb: number;
    };
    capacity: {
        status: "healthy" | "warning" | "critical";
        calibrated: boolean;
        utilizationPercent: number;
        headroomPercent: number;
        bottleneck: string;
        safeConcurrentUsers: number | null;
        safeRequestsPerMinute: number | null;
    };
};

export function AdminMonitoring() {
    const { data: health, isLoading } = useQuery<SystemHealth>({
        queryKey: ["/api/admin/system-health"],
        queryFn: getQueryFn({ on401: "returnNull" }),
        refetchInterval: 30000, // Refresh every 30s
    });

    if (isLoading) return <div className="text-sm text-slate-500">Carregando métricas do sistema...</div>;
    if (!health) return null;

    const formatUptime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return `${h}h ${m}m`;
    };
    const statusLabel = health.capacity.status === "critical"
        ? "Crítico"
        : health.capacity.status === "warning"
          ? "Atenção"
          : "Saudável";
    const capacityTone = health.capacity.status === "critical"
        ? "bg-red-500"
        : health.capacity.status === "warning"
          ? "bg-amber-500"
          : "bg-emerald-500";
    const bottleneckLabels: Record<string, string> = {
        memory: "memória",
        cpu: "CPU",
        latency: "latência",
        errors: "erros",
        sessions: "usuários simultâneos",
        traffic: "requisições",
    };

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Status do Sistema</CardTitle>
                    <Activity className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{statusLabel}</div>
                    <p className="text-xs text-muted-foreground">
                        Uptime: {formatUptime(health.uptime)}
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Memória do container</CardTitle>
                    <Server className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{health.container.memoryUsedMb} MB</div>
                    <p className="text-xs text-muted-foreground">
                        Limite: {health.container.memoryLimitMb} MB
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Tráfego e CPU</CardTitle>
                    <Cpu className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{health.metrics.requestsPerMinute}</div>
                    <p className="text-xs text-muted-foreground">
                        {health.metrics.cpuPercent}% CPU · {health.metrics.avgResponseTime}ms
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Erros (1h)</CardTitle>
                    <AlertCircle className={`h-4 w-4 ${health.metrics.errorsLastHour > 0 ? "text-red-500" : "text-slate-500"}`} />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{health.metrics.errorsLastHour}</div>
                    <p className="text-xs text-muted-foreground">
                        Sessões ativas: {health.metrics.activeSessions}
                    </p>
                </CardContent>
            </Card>

            <Card className="md:col-span-2 lg:col-span-4">
                <CardContent className="grid gap-5 p-5 lg:grid-cols-[1.2fr_1fr_1fr] lg:items-center">
                    <div>
                        <div className="flex items-center gap-2">
                            <Gauge className="h-5 w-5 text-primary" />
                            <p className="text-sm font-semibold">Capacidade da plataforma</p>
                        </div>
                        <div className="mt-3 flex items-end gap-2">
                            <span className="text-3xl font-bold">{health.capacity.utilizationPercent}%</span>
                            <span className="pb-1 text-sm text-muted-foreground">de pressão atual</span>
                        </div>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                            <div
                                className={`h-full rounded-full transition-all ${capacityTone}`}
                                style={{ width: `${Math.max(2, health.capacity.utilizationPercent)}%` }}
                            />
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                            Folga estimada: {health.capacity.headroomPercent}% · Gargalo atual: {bottleneckLabels[health.capacity.bottleneck] || health.capacity.bottleneck}
                        </p>
                    </div>

                    <div className="rounded-lg border border-slate-200 p-4">
                        <div className="flex items-center gap-2 text-sm font-medium">
                            <Users className="h-4 w-4 text-slate-500" />
                            Usuários simultâneos
                        </div>
                        <p className="mt-2 text-2xl font-bold">
                            {health.metrics.activeSessions}
                            <span className="text-sm font-normal text-muted-foreground">
                                {health.capacity.safeConcurrentUsers ? ` / ${health.capacity.safeConcurrentUsers}` : " ativos"}
                            </span>
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            {health.capacity.safeConcurrentUsers ? "Limite seguro calibrado" : "Limite ainda não calibrado"}
                        </p>
                    </div>

                    <div className="rounded-lg border border-slate-200 p-4">
                        <p className="text-sm font-medium">Limite para campanhas</p>
                        {health.capacity.calibrated ? (
                            <>
                                <p className="mt-2 text-2xl font-bold">{health.capacity.safeRequestsPerMinute} rpm</p>
                                <p className="mt-1 text-xs text-muted-foreground">Alerta em 65% e crítico em 85%.</p>
                            </>
                        ) : (
                            <>
                                <p className="mt-2 text-base font-semibold text-amber-700">Teste de carga necessário</p>
                                <p className="mt-1 text-xs text-muted-foreground">O painel não inventa um limite apenas com tráfego baixo.</p>
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
