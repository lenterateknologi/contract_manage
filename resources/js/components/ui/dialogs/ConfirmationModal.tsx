import React from 'react';
import { cn } from '@/lib/utils';
import { Trash2, AlertTriangle, Info, Loader2 } from 'lucide-react';

interface ConfirmationModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    processing?: boolean;
    icon?: React.ReactNode;
    className?: string;
    children?: React.ReactNode;
}

export function ConfirmationModal({
    open,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = 'Ya, Lanjutkan',
    cancelText = 'Batal',
    variant = 'danger',
    processing = false,
    icon,
    className,
    children,
}: ConfirmationModalProps) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 dark:bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className={cn("relative mx-auto my-auto bg-white dark:bg-slate-900 w-full max-w-sm overflow-hidden rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-2xl animate-in zoom-in-95 duration-200", className)}>
                {/* Content Section */}
                <div className="p-6 text-center">
                    <div className={cn(
                        "mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-300",
                        variant === 'danger' ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400' :
                        variant === 'warning' ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' :
                        'bg-primary/10 text-primary border border-primary/20'
                    )}>
                        {icon || (
                            variant === 'danger' ?
                            <Trash2 size={24} /> :
                            variant === 'warning' ?
                            <AlertTriangle size={24} /> :
                            <Info size={24} />
                        )}
                    </div>

                    <h3 className="text-slate-900 dark:text-slate-100 mb-1.5 text-base font-bold tracking-tight">
                        {title}
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-medium leading-relaxed">
                        {description}
                    </p>
                    {children}
                </div>

                {/* Actions Section */}
                <div className="flex items-center justify-end gap-3 px-6 pb-6 pt-2">
                    {cancelText !== "" && (
                        <button
                            onClick={onClose}
                            disabled={processing}
                            className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all active:scale-[0.98] disabled:opacity-50"
                        >
                            {cancelText}
                        </button>
                    )}
                    <button
                        onClick={onConfirm}
                        disabled={processing}
                        className={cn(
                            "flex-1 rounded-xl px-4 py-2.5 text-xs font-bold text-white transition-all active:scale-[0.98] disabled:opacity-50 shadow-md flex items-center justify-center gap-1.5",
                            variant === 'danger' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/10' :
                            variant === 'warning' ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/10' :
                            'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/10'
                        )}
                    >
                        {processing && <Loader2 size={12} className="animate-spin" />}
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}

