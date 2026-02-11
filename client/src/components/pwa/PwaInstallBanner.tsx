import { usePwaInstall } from "@/hooks/usePwaInstall";
import { Download, X, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

/**
 * Banner de instalação PWA que aparece no topo do dashboard
 * quando o app pode ser instalado. O usuário pode instalar ou dispensar.
 */
export function PwaInstallBanner() {
    const { canInstall, isInstalled, install } = usePwaInstall();
    const [dismissed, setDismissed] = useState(() => {
        try {
            return sessionStorage.getItem("pwa-dismissed") === "true";
        } catch {
            return false;
        }
    });

    if (!canInstall || isInstalled || dismissed) return null;

    const handleDismiss = () => {
        setDismissed(true);
        try {
            sessionStorage.setItem("pwa-dismissed", "true");
        } catch {
            // ignore
        }
    };

    const handleInstall = async () => {
        const accepted = await install();
        if (accepted) {
            setDismissed(true);
        }
    };

    return (
        <div className="relative mx-4 mt-4 mb-2 p-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg text-white overflow-hidden">
            {/* Close button */}
            <button
                onClick={handleDismiss}
                className="absolute top-3 right-3 p-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                aria-label="Fechar"
            >
                <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-4">
                {/* Icon */}
                <div className="shrink-0 w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <Smartphone className="w-6 h-6" />
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm leading-tight">
                        Instalar HabilitFy
                    </h3>
                    <p className="text-xs text-white/80 mt-0.5 leading-snug">
                        Acesse rápido pela tela inicial do seu celular
                    </p>
                </div>

                {/* Install button */}
                <Button
                    onClick={handleInstall}
                    size="sm"
                    className="shrink-0 bg-white text-blue-700 hover:bg-white/90 font-bold rounded-xl shadow-md"
                >
                    <Download className="w-4 h-4 mr-1.5" />
                    Instalar
                </Button>
            </div>
        </div>
    );
}
