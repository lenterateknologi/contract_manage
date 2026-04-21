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

    const bgMap = { success: 'bg-green-600', danger: 'bg-red-600', info: 'bg-gray-800' };
    const iconMap = { success: 'fa-circle-check', danger: 'fa-circle-xmark', info: 'fa-circle-info' };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {toast && (
                <div
                    key={toast.id}
                    className={`fixed right-8 bottom-24 z-[200] flex items-center gap-2 rounded-lg px-4 py-2.5 text-[12px] font-medium text-white shadow-xl ${bgMap[toast.type]}`}
                    style={{ animation: 'toast-in .18s ease' }}
                >
                    <i className={`fa-solid ${iconMap[toast.type]} text-[13px]`} />
                    {toast.msg}
                </div>
            )}
        </ToastContext.Provider>
    );
}
