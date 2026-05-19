import { usePage } from '@inertiajs/react';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

// ─── Toast Types ──────────────────────────────────────────────────────
interface ToastMsg {
    id: number;
    msg: string;
    type: 'success' | 'danger' | 'info';
}

interface ProgressToast {
    id: string;
    msg: string;
    progress: number; // 0 to 100
}

interface ToastCtx {
    showToast: (msg: string, type?: ToastMsg['type']) => void;
    showProgress: (id: string, msg: string, progress: number) => void;
    hideProgress: (id: string) => void;
}

const ToastContext = createContext<ToastCtx>({
    showToast: () => {},
    showProgress: () => {},
    hideProgress: () => {},
});

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const { props } = usePage<any>();
    const [toast, setToast] = useState<ToastMsg | null>(null);
    const [progressToasts, setProgressToasts] = useState<ProgressToast[]>([]);
    const timerRef = useRef<any>(null);

    const showToast = useCallback((msg: string, type: ToastMsg['type'] = 'info') => {
        setToast({ id: Date.now(), msg, type });
        if (timerRef.current) window.clearTimeout(timerRef.current);
        timerRef.current = window.setTimeout(() => setToast(null), 3000);
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

    const iconMap = { success: 'fa-circle-check', danger: 'fa-circle-xmark', info: 'fa-circle-info' };

    return (
        <ToastContext.Provider value={{ showToast, showProgress, hideProgress }}>
            {children}

            {/* Standard Center Toast */}
            {toast && (
                <div
                    key={toast.id}
                    className="animate-in slide-in-from-bottom-5 fixed bottom-10 left-1/2 z-[1000] flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-black/10 bg-black/90 px-6 py-3.5 text-[10px] font-black text-white shadow-2xl backdrop-blur-xl duration-300 dark:border-white/20 dark:bg-white/95 dark:text-black"
                >
                    <i className={`fa-solid ${iconMap[toast.type]} text-[12px] text-white dark:text-black`} />
                    <span className="uppercase">{toast.msg}</span>
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
                                <span className="text-[9px] font-black text-black uppercase dark:text-white">{p.msg}</span>
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
