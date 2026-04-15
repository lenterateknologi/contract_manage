import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

// ─── Toast ───────────────────────────────────────────────────────────
interface ToastMsg {
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
    const timerRef = useRef<ReturnType<typeof setTimeout>>();

    const showToast = useCallback((msg: string, type: ToastMsg['type'] = 'info') => {
        setToast({ msg, type });
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setToast(null), 3000);
    }, []);

    useEffect(() => () => clearTimeout(timerRef.current), []);

    const bgMap = { success: 'bg-green-600', danger: 'bg-red-600', info: 'bg-gray-800' };
    const iconMap = { success: 'fa-circle-check', danger: 'fa-circle-xmark', info: 'fa-circle-info' };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {toast && (
                <div
                    className={`fixed right-24 bottom-5 z-[200] flex items-center gap-2 rounded-lg px-4 py-2.5 text-[12px] font-medium text-white shadow-xl ${bgMap[toast.type]}`}
                    style={{ animation: 'toast-in .18s ease' }}
                >
                    <i className={`fa-solid ${iconMap[toast.type]} text-[13px]`} />
                    {toast.msg}
                </div>
            )}
        </ToastContext.Provider>
    );
}
