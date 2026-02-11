import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Legend } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function AdminFinancialCharts() {
    const { data: financialData, isLoading: isLoadingFinance } = useQuery({
        queryKey: ["/api/admin/metrics/finance"],
        queryFn: async () => {
            const res = await apiRequest("GET", "/api/admin/metrics/finance");
            const data = await res.json();
            // Ensure data is array
            return Array.isArray(data) ? data : [];
        }
    });

    const { data: growthData, isLoading: isLoadingGrowth } = useQuery({
        queryKey: ["/api/admin/metrics/growth"],
        queryFn: async () => {
            const res = await apiRequest("GET", "/api/admin/metrics/growth");
            const data = await res.json();
            return Array.isArray(data) ? data : [];
        }
    });

    if (isLoadingFinance || isLoadingGrowth) {
        return <div className="p-8 text-center text-slate-500">Carregando dados financeiros reais...</div>;
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
                <CardHeader>
                    <CardTitle>Receita Real (GMV vs Receita Líquida)</CardTitle>
                    <CardDescription>
                        Dados extraídos das transações confirmadas (últimos 12 meses).
                    </CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                    <ResponsiveContainer width="100%" height={350}>
                        <AreaChart data={financialData || []}>
                            <defs>
                                <linearGradient id="colorGmv" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`} />
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <Tooltip formatter={(value) => `R$ ${Number(value).toFixed(2)}`} />
                            <Area type="monotone" dataKey="gmv" stroke="#8884d8" fillOpacity={1} fill="url(#colorGmv)" name="GMV Total" />
                            <Area type="monotone" dataKey="revenue" stroke="#82ca9d" fillOpacity={1} fill="url(#colorRevenue)" name="Receita Líquida" />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card className="col-span-3">
                <CardHeader>
                    <CardTitle>Crescimento (Base de Dados)</CardTitle>
                    <CardDescription>
                        Novos usuários registrados na plataforma.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={growthData || []}>
                            <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip cursor={{ fill: 'transparent' }} />
                            <Legend />
                            <Bar dataKey="newUsers" name="Novos Usuários" fill="#adfa1d" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}
