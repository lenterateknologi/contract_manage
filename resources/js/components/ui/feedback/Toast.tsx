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
        success: <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />,
        danger: <XCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0" />,
        info: <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0" />,
        error: <XCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0" />,
        warning: <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />,
    };

    const borderMap: Record<ToastType, string> = {
        success: 'border-l-emerald-500 dark:border-l-emerald-400',
        danger: 'border-l-rose-500 dark:border-l-rose-400',
        info: 'border-l-blue-500 dark:border-l-blue-400',
        error: 'border-l-rose-500 dark:border-l-rose-400',
        warning: 'border-l-amber-500 dark:border-l-amber-400',
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

            {/* Premium Toast */}
            {toast && (
                <div
                    key={toast.id}
                    className={`animate-in slide-in-from-bottom-5 fade-in zoom-in-95 fixed bottom-6 right-6 z-[1000] flex items-center gap-4 rounded-xl border border-surface-border bg-surface-card p-4 pr-8 shadow-xl shadow-black/5 dark:shadow-black/40 border-l-4 ${borderMap[toast.type] || borderMap.info} duration-500 ease-out`}
                >
                    {iconMap[toast.type] || iconMap.info}
                    <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-text-main uppercase tracking-wider">
                            {typeLabelMap[toast.type] || 'Info'}
                        </span>
                        <span className="text-[12px] text-text-desc">{toast.msg}</span>
                    </div>
                </div>
            )}

            {/* Bottom Right Progress Toasts */}
            <div className="pointer-events-none fixed right-6 bottom-6 z-[1001] flex flex-col gap-3">
                {progressToasts.map((p) => (
                    <div
                        key={p.id}
                        className="animate-in slide-in-from-right-10 border-surface-border pointer-events-auto w-72 rounded-xl border bg-surface-card p-4 shadow-2xl shadow-black/10 dark:shadow-black/40"
                    >
                        <div className="mb-2.5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                <span className="text-[9px] font-semibold text-text-main uppercase">{p.msg}</span>
                            </div>
                            <span className="font-mono text-[10px] font-bold text-text-main">{Math.round(p.progress)}%</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full border border-surface-border bg-surface-muted">
                            <div className="h-full bg-primary transition-all duration-500 ease-out" style={{ width: `${p.progress}%` }} />
                        </div>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}
