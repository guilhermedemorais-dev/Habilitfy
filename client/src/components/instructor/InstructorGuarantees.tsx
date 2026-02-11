import { ShieldCheck, CreditCard, RotateCcw } from "lucide-react";

const guarantees = [
    {
        icon: RotateCcw,
        title: "Reembolso Garantido",
        description: "Cancelamento grátis até 24h antes",
    },
    {
        icon: CreditCard,
        title: "Pagamento Seguro",
        description: "Transações protegidas",
    },
    {
        icon: ShieldCheck,
        title: "Cancelamento Grátis",
        description: "Sem taxas ocultas",
    },
];

export function InstructorGuarantees() {
    return (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
            <h3 className="font-bold text-slate-900 mb-4 text-center">Garantias HabilitFy</h3>
            <div className="grid grid-cols-3 gap-4">
                {guarantees.map((guarantee) => (
                    <div key={guarantee.title} className="text-center">
                        <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-white shadow-sm flex items-center justify-center">
                            <guarantee.icon className="w-5 h-5 text-green-600" />
                        </div>
                        <p className="text-xs font-semibold text-slate-800 leading-tight">{guarantee.title}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
