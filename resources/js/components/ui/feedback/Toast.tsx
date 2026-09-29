import { usePage } from '@inertiajs/react';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

// ─── Toast Types ──────────────────────────────────────────────────────
export type ToastType = 'success' | 'danger' | 'info' | 'error' | 'warning';

export interface ToastOptions {
    title?: string;
    message: string;
    type?: ToastType | string;
}

export type ToastInput = string | ToastOptions;

interface ToastMsg {
    id: number;
    msg: string;
    type: ToastType;
}

interface ProgressToast {
    id: string;
    msg: string;
    progress: number; // 0 to 100
}

interface ToastCtx {
    showToast: (msg: ToastInput, type?: ToastType) => void;
    showProgress: (id: string, msg: string, progress: number) => void;
    hideProgress: (id: string) => void;
}

const ToastContext = createContext<ToastCtx>({
    showToast: () => { },
    showProgress: () => { },
    hideProgress: () => { },
});

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const { props } = usePage<any>();
    const [toast, setToast] = useState<ToastMsg | null>(null);
    const [progressToasts, setProgressToasts] = useState<ProgressToast[]>([]);
    const timerRef = useRef<any>(null);

    const showToast = useCallback((msg: ToastInput, type: ToastType = 'info') => {
        let text = '';
        let finalType: ToastType = type;
        if (typeof msg === 'object' && msg !== null) {
            text = msg.message || msg.title || '';
            if (msg.type && ['success', 'danger', 'info', 'error', 'warning'].includes(msg.type)) {
                finalType = msg.type as ToastType;
            }
        } else {
            text = String(msg);
        }
        setToast({ id: Date.now(), msg: text, type: finalType });
        if (timerRef.current) window.clearTimeout(timerRef.current);
        timerRef.current = window.setTimeout(() => setToast(null), 4000);
    }, []);

    // Auto-show Flash Messages from Backend
    useEffect(() => {
        const flash = (props as any).flash;
        if (flash?.success) showToast(flash.success, 'success');
        if (flash?.error) showToast(flash.error, 'danger');
        if (flash?.danger) showToast(flash.danger, 'danger');
        if (flash?.info) showToast(flash.info, 'info');
    }, [props.flash, showToast]);

    const showProgress = useCallback((id: string, msg: string, progress: number) => {
        setProgressToasts((prev) => {
            const existing = prev.find((p) => p.id === id);
            if (existing) {
                return prev.map((p) => (p.id === id ? { ...p, msg, progress } : p));
            }
            return [...prev, { id, msg, progress }];
        });
    }, []);

    const hideProgress = useCallback((id: string) => {
        setProgressToasts((prev) => prev.filter((p) => p.id !== id));
    }, []);

    useEffect(
        () => () => {
            if (timerRef.current) window.clearTimeout(timerRef.current);
        },
        [],
    );

    const iconMap: Record<ToastType, React.ReactNode> = {
        success: <CheckCircle2 className="h-5 w-5 text-emerald-600" />,
        danger: <XCircle className="h-5 w-5 text-rose-600" />,
        info: <Info className="h-5 w-5 text-blue-600" />,
        error: <XCircle className="h-5 w-5 text-rose-600" />,
        warning: <AlertTriangle className="h-5 w-5 text-amber-600" />,
    };

    const borderMap: Record<ToastType, string> = {
        success: 'border-l-emerald-500',
        danger: 'border-l-rose-500',
        info: 'border-l-blue-500',
        error: 'border-l-rose-500',
        warning: 'border-l-amber-500',
    };

    const typeLabelMap: Record<ToastType, string> = {
        success: 'Sukses',
        danger: 'Error',
        info: 'Info',
        error: 'Error',
        warning: 'Peringatan',
    };

    return (
        <ToastContext.Provider value={{ showToast, showProgress, hideProgress }}>
            {children}

            {/* Premium Toast (White background with colored left border) */}
            {toast && (
                <div
                    key={toast.id}
                    className={`animate-in slide-in-from-bottom-5 fade-in zoom-in-95 fixed bottom-6 right-6 z-[1000] flex items-center gap-4 rounded-xl border border-slate-100 bg-white p-4 pr-8 shadow-xl shadow-slate-200/50 border-l-4 ${borderMap[toast.type] || borderMap.info} duration-500 ease-out`}
                >
                    {iconMap[toast.type] || iconMap.info}
                    <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                            {typeLabelMap[toast.type] || 'Info'}
                        </span>
                        <span className="text-[12px] text-slate-600">{toast.msg}</span>
                    </div>
                </div>
            )}

            {/* Bottom Right Progress Toasts */}
            <div className="pointer-events-none fixed right-6 bottom-6 z-[1001] flex flex-col gap-3">
                {progressToasts.map((p) => (
                    <div
                        key={p.id}
                        className="animate-in slide-in-from-right-10 border-border pointer-events-auto w-72 rounded-xl border bg-white p-4 shadow-2xl shadow-slate-200/50"
                    >
                        <div className="mb-2.5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="h-3 w-3 animate-spin rounded-full border-2 border-black border-t-transparent dark:border-white" />
                                <span className="text-[9px] font-semibold text-black uppercase dark:text-white">{p.msg}</span>
                            </div>
                            <span className="font-mono text-[10px] font-bold text-black dark:text-white">{Math.round(p.progress)}%</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full border border-black/5 bg-black/5 dark:border-white/5 dark:bg-white/10">
                            <div className="h-full bg-black transition-all duration-500 ease-out dark:bg-white" style={{ width: `${p.progress}%` }} />
                        </div>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}
