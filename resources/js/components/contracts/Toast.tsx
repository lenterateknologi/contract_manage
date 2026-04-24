import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

// ─── Toast ───────────────────────────────────────────────────────────
interface ToastMsg {
    id: number;
    msg: string;
    type: 'success' | 'danger' | 'info';
}
interface ToastCtx {
    showToast: (msg: string, type?: ToastMsg['type']) => void;
}

const ToastContext = createContext<ToastCtx>({ showToast: () => {} });
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toast, setToast] = useState<ToastMsg | null>(null);
    const timerRef = useRef<any>(null);

    const showToast = useCallback((msg: string, type: ToastMsg['type'] = 'info') => {
        setToast({ id: Date.now(), msg, type });
        if (timerRef.current) window.clearTimeout(timerRef.current);
        timerRef.current = window.setTimeout(() => setToast(null), 3000);
    }, []);

    useEffect(() => () => {
        if (timerRef.current) window.clearTimeout(timerRef.current);
    }, []);

    const bgMap = { success: 'bg-emerald-600', danger: 'bg-rose-600', info: 'bg-slate-900' };
    const iconMap = { success: 'fa-circle-check', danger: 'fa-circle-xmark', info: 'fa-circle-info' };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {toast && (
                <div
                    key={toast.id}
                    className="animate-in slide-in-from-bottom-5 fixed bottom-10 left-1/2 z-[1000] flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-white/20 bg-slate-900/90 px-6 py-3.5 text-[10px] font-black tracking-widest text-white shadow-2xl shadow-slate-900/20 backdrop-blur-xl duration-300"
                >
                    <i className={`fa-solid ${iconMap[toast.type]} text-[12px] ${toast.type === 'success' ? 'text-emerald-400' : 'text-rose-400'}`} />
                    <span className="uppercase">{toast.msg}</span>
                </div>
            )}
        </ToastContext.Provider>
    );
}
