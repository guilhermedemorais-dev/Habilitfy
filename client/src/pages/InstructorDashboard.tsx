import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, LineChart, Line, XAxis, Tooltip } from "recharts";
import { Calendar as CalendarIcon, DollarSign, Users, ArrowUpRight } from "lucide-react";
import Calendar from "react-calendar";
import { useState } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/hooks/useAuth";

const data = [
  { name: "Seg", value: 150 },
  { name: "Ter", value: 300 },
  { name: "Qua", value: 200 },
  { name: "Qui", value: 450 },
  { name: "Sex", value: 380 },
  { name: "Sab", value: 600 },
  { name: "Dom", value: 0 },
];

export default function InstructorDashboard() {
  const [date, setDate] = useState<Date>(new Date());
  const { user } = useAuth();
  const instructorName =
    user?.firstName || user?.lastName || user?.email || "Instrutor";

  return (
    <AuthGuard redirectTo="/dashboard/instrutor">
      <div className="min-h-screen bg-gray-50 pb-24">
        <header className="bg-white p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-slate-400">Olá</p>
              <h1 className="text-2xl font-bold text-slate-900 leading-tight">
                {instructorName}
              </h1>
            </div>
            <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden">
              {/* Avatar placeholder */}
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="border-none shadow-sm bg-primary text-white">
              <CardContent className="p-4">
                <p className="text-green-100 text-xs uppercase font-bold tracking-wider mb-1">
                  A Receber
                </p>
                <h3 className="text-2xl font-bold">R$ 1.250</h3>
                <Button
                  size="sm"
                  variant="secondary"
                  className="mt-3 w-full h-7 text-xs bg-white/20 text-white hover:bg-white/30 border-none"
                >
                  Sacar Pix
                </Button>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm">
              <CardContent className="p-4">
                <p className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-1">
                  Aulas Hoje
                </p>
                <h3 className="text-2xl font-bold text-slate-900">4</h3>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <ArrowUpRight className="w-3 h-3 mr-1" /> +2 pendentes
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Chart */}
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold">
                Ganhos da Semana
              </CardTitle>
            </CardHeader>
            <CardContent className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <XAxis
                    dataKey="name"
                    stroke="#cbd5e1"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#228B22"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#228B22" }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Calendar & Schedule */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-primary" />
                Agenda
              </h2>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <Calendar
                  onChange={(val) => setDate(val as Date)}
                  value={date}
                  locale="pt-BR"
                />
              </div>
            </div>

            <div>
              <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Alunos de Hoje
              </h2>
              <div className="space-y-3">
                {["08:00 - João Silva", "10:00 - Maria Costa", "14:00 - Pedro Santos"].map((slot, i) => (
                  <div
                    key={i}
                    className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-primary flex justify-between items-center"
                  >
                    <div>
                      <p className="font-bold text-slate-800">
                        {slot.split(" - ")[1]}
                      </p>
                      <p className="text-xs text-slate-500">
                        {slot.split(" - ")[0]} • Baliza
                      </p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-green-600 bg-green-50 rounded-full"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
