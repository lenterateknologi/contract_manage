import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { usePage } from '@inertiajs/react';

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
    hideProgress: () => {}
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
        setProgressToasts(prev => {
            const existing = prev.find(p => p.id === id);
            if (existing) {
                return prev.map(p => p.id === id ? { ...p, msg, progress } : p);
            }
            return [...prev, { id, msg, progress }];
        });
    }, []);

    const hideProgress = useCallback((id: string) => {
        setProgressToasts(prev => prev.filter(p => p.id !== id));
    }, []);

    useEffect(() => () => {
        if (timerRef.current) window.clearTimeout(timerRef.current);
    }, []);

    const iconMap = { success: 'fa-circle-check', danger: 'fa-circle-xmark', info: 'fa-circle-info' };

    return (
        <ToastContext.Provider value={{ showToast, showProgress, hideProgress }}>
            {children}
            
            {/* Standard Center Toast */}
            {toast && (
                <div
                    key={toast.id}
                    className="animate-in slide-in-from-bottom-5 fixed bottom-10 left-1/2 z-[1000] flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-white/20 bg-slate-900/90 px-6 py-3.5 text-[10px] font-black tracking-widest text-white shadow-2xl shadow-slate-900/20 backdrop-blur-xl duration-300"
                >
                    <i className={`fa-solid ${iconMap[toast.type]} text-[12px] ${toast.type === 'success' ? 'text-emerald-400' : 'text-rose-400'}`} />
                    <span className="uppercase">{toast.msg}</span>
                </div>
            )}

            {/* Bottom Right Progress Toasts */}
            <div className="fixed bottom-6 right-6 z-[1001] flex flex-col gap-3 pointer-events-none">
                {progressToasts.map(p => (
                    <div
                        key={p.id}
                        className="animate-in slide-in-from-right-10 w-72 rounded-xl border border-border bg-white p-4 shadow-2xl pointer-events-auto shadow-slate-200/50"
                    >
                        <div className="flex items-center justify-between mb-2.5">
                            <div className="flex items-center gap-2">
                                <div className="animate-spin h-3 w-3 border-2 border-primary border-t-transparent rounded-full" />
                                <span className="text-[9px] font-black tracking-widest text-slate-900 uppercase">{p.msg}</span>
                            </div>
                            <span className="text-[10px] font-mono font-bold text-primary">{Math.round(p.progress)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-primary transition-all duration-500 ease-out"
                                style={{ width: `${p.progress}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}
