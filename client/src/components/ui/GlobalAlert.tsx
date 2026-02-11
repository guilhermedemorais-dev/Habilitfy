
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CheckCircle2, XCircle, AlertTriangle, Info } from "lucide-react";
import { create } from "zustand";

type AlertType = "success" | "error" | "warning" | "info";

interface AlertState {
    isOpen: boolean;
    type: AlertType;
    title: string;
    message: string;
    onConfirm?: () => void;
    showAlert: (type: AlertType, title: string, message: string, onConfirm?: () => void) => void;
    closeAlert: () => void;
}

export const useGlobalAlert = create<AlertState>((set) => ({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
    onConfirm: undefined,
    showAlert: (type, title, message, onConfirm) =>
        set({ isOpen: true, type, title, message, onConfirm }),
    closeAlert: () => set({ isOpen: false }),
}));

export function GlobalAlert() {
    const { isOpen, type, title, message, closeAlert, onConfirm } = useGlobalAlert();

    const handleConfirm = () => {
        if (onConfirm) onConfirm();
        closeAlert();
    };

    const getIcon = () => {
        switch (type) {
            case "success":
                return <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />;
            case "error":
                return <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />;
            case "warning":
                return <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />;
            case "info":
            default:
                return <Info className="w-16 h-16 text-blue-500 mx-auto mb-4" />;
        }
    };

    const getButtonClass = () => {
        switch (type) {
            case "success":
                return "bg-green-600 hover:bg-green-700";
            case "error":
                return "bg-red-600 hover:bg-red-700";
            case "warning":
                return "bg-yellow-600 hover:bg-yellow-700";
            case "info":
            default:
                return "bg-blue-600 hover:bg-blue-700";
        }
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={closeAlert}>
            <AlertDialogContent className="w-[90%] rounded-2xl md:max-w-md">
                <AlertDialogHeader>
                    {getIcon()}
                    <AlertDialogTitle className="text-center text-xl font-bold">
                        {title}
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-center text-base text-slate-600">
                        {message}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-4">
                    <AlertDialogAction
                        className={`w-full h-12 rounded-xl text-lg font-bold ${getButtonClass()}`}
                        onClick={handleConfirm}
                    >
                        Fechar
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
