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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white scale-in-center w-full max-w-sm overflow-hidden rounded-2xl border border-slate-200 shadow-2xl">
                {/* Content Section */}
                <div className="p-8 text-center">
                    <div className={cn(
                        "mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full transition-all duration-300",
                        variant === 'danger' ? 'bg-rose-50 text-rose-600' : 
                        variant === 'warning' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                    )}>
                        {icon || (
                            variant === 'danger' ? 
                            <i className="fa-solid fa-trash-can text-2xl" /> : 
                            variant === 'warning' ? 
                            <i className="fa-solid fa-circle-exclamation text-2xl" /> : 
                            <i className="fa-solid fa-circle-info text-2xl" />
                        )}
                    </div>
                    
                    <h3 className="text-slate-900 mb-3 text-xl font-black uppercase tracking-tight">
                        {title}
                    </h3>
                    <p className="text-slate-500 text-sm leading-relaxed font-medium">
                        {description}
                    </p>
                </div>

                {/* Actions Section */}
                <div className="flex border-t border-slate-100">
                    <button
                        onClick={onClose}
                        disabled={processing}
                        className="text-slate-400 hover:bg-slate-50 flex-1 border-r border-slate-100 py-5 text-sm font-black uppercase tracking-widest transition-all active:bg-slate-100"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={processing}
                        className={cn(
                            "flex-1 py-5 text-sm font-black uppercase tracking-widest transition-all active:opacity-80 disabled:opacity-50",
                            variant === 'danger' ? 'text-rose-600 hover:bg-rose-50' : 
                            variant === 'warning' ? 'text-amber-600 hover:bg-amber-50' : 'text-blue-600 hover:bg-blue-50'
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
