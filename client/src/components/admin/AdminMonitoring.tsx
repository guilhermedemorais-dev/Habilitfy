import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Cpu, Server, AlertCircle, Clock } from "lucide-react";
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
        cpuLoad?: number;
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

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Status do Sistema</CardTitle>
                    <Activity className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold capitalize">{health.status}</div>
                    <p className="text-xs text-muted-foreground">
                        Uptime: {formatUptime(health.uptime)}
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Memória (Heap)</CardTitle>
                    <Server className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{health.memory.heapUsed} MB</div>
                    <p className="text-xs text-muted-foreground">
                        Total: {health.memory.heapTotal} MB
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Requisições / min</CardTitle>
                    <Cpu className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{health.metrics.requestsPerMinute}</div>
                    <p className="text-xs text-muted-foreground">
                        Latência média: {health.metrics.avgResponseTime}ms
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
        </div>
    );
}
