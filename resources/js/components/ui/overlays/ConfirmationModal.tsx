import React from 'react';
import { cn } from '@/lib/utils';

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
}

/**
 * Standard Professional Confirmation Modal
 * Used for critical actions like Deletion or Important Changes.
 * Style: Clean, Professional, Centered Icon, Wide Actions.
 */
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
    icon
}: ConfirmationModalProps) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-black scale-in-center w-full max-w-sm overflow-hidden rounded-none border border-black dark:border-white shadow-2xl">
                {/* Content Section */}
                <div className="p-8 text-center">
                    <div className={cn(
                        "mx-auto mb-6 flex h-20 w-20 items-center justify-center transition-all duration-300 border-2",
                        variant === 'danger' ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white' :
                        variant === 'warning' ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white' : 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white'
                    )}>
                        {icon || (
                            variant === 'danger' ?
                            <i className="fa-solid fa-trash-can text-2xl" /> :
                            variant === 'warning' ?
                            <i className="fa-solid fa-circle-exclamation text-2xl" /> :
                            <i className="fa-solid fa-circle-info text-2xl" />
                        )}
                    </div>

                    <h3 className="text-black dark:text-white mb-3 text-xl font-black uppercase tracking-tight">
                        {title}
                    </h3>
                    <p className="text-black/60 dark:text-white/60 text-[11px] leading-relaxed font-bold uppercase tracking-wider">
                        {description}
                    </p>
                </div>

                {/* Actions Section */}
                <div className="flex border-t border-black dark:border-white">
                    <button
                        onClick={onClose}
                        disabled={processing}
                        className="text-black/40 dark:text-white/40 hover:bg-black/5 dark:hover:bg-white/5 flex-1 border-r border-black dark:border-white py-5 text-[11px] font-black uppercase  transition-all active:bg-black/10 dark:active:bg-white/10"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={processing}
                        className={cn(
                            "flex-1 py-5 text-[11px] font-black uppercase  transition-all active:opacity-80 disabled:opacity-50",
                            "text-black dark:text-white hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black"
                        )}
                    >
                        {processing ? <i className="fa-solid fa-spinner fa-spin mr-2" /> : null}
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
