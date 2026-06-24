// Lightweight toast system. Two ways in: the useToast() hook for React code,
// and a module-level emitToast() for non-React code (the RTK Query error
// middleware in store.ts and the <audio> onError handler both funnel through
// it). The provider subscribes to the same emitter and renders the stack.

import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from "react";
import { CheckCircle2, Info, AlertTriangle, X } from "lucide-react";

export type ToastKind = "success" | "info" | "error";

interface Toast {
    id: number;
    message: string;
    kind: ToastKind;
}

// --- imperative emitter (works outside React) ---
type ToastListener = (message: string, kind: ToastKind) => void;
let listener: ToastListener | null = null;

export function emitToast(message: string, kind: ToastKind = "info") {
    if (listener) listener(message, kind);
}

interface ToastValue {
    toast: (message: string, kind?: ToastKind) => void;
}

const ToastContext = createContext<ToastValue | null>(null);

export function useToast(): ToastValue {
    const context = useContext(ToastContext);
    if (!context) throw new Error("useToast must be used within <ToastProvider>");
    return context;
}

const ICONS: Record<ToastKind, ReactNode> = {
    success: <CheckCircle2 size={18} className="text-amber-400 shrink-0" />,
    info: <Info size={18} className="text-stone-300 shrink-0" />,
    error: <AlertTriangle size={18} className="text-red-400 shrink-0" />,
};

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    function push(message: string, kind: ToastKind = "info") {
        const id = Date.now() + Math.random();
        setToasts((current) => [...current, { id, message, kind }]);
        // auto-dismiss
        setTimeout(() => {
            setToasts((current) => current.filter((toast) => toast.id !== id));
        }, 3500);
    }

    function dismiss(id: number) {
        setToasts((current) => current.filter((toast) => toast.id !== id));
    }

    // route the module-level emitter through this provider's state
    useEffect(() => {
        listener = push;
        return () => {
            listener = null;
        };
    }, []);

    const value: ToastValue = { toast: push };

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div className="fixed bottom-24 right-4 z-[60] flex flex-col gap-2 max-w-sm">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className="flex items-center gap-3 bg-stone-900 border border-stone-700 rounded-xl px-4 py-3 shadow-2xl text-sm"
                    >
                        {ICONS[toast.kind]}
                        <span className="text-stone-300 flex-1">{toast.message}</span>
                        <button
                            onClick={() => dismiss(toast.id)}
                            aria-label="Dismiss"
                            className="text-stone-500 hover:text-stone-200 transition-colors shrink-0"
                        >
                            <X size={15} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}
