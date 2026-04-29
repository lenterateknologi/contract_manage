import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ArrowLeft, Save } from 'lucide-react';
import React from 'react';

interface ManagementFormProps {
    title: string;
    subtitle?: string;
    onClose: () => void;
    onSave: (e: React.FormEvent) => void;
    processing?: boolean;
    isDirty?: boolean;
    isEdit?: boolean;
    children: React.ReactNode;
    headerActions?: React.ReactNode;
}

export function ManagementForm({
    title,
    subtitle,
    onClose,
    onSave,
    processing = false,
    isDirty = false,
    isEdit = false,
    children,
    headerActions,
}: ManagementFormProps) {
    return (
        <div className="animate-in fade-in slide-in-from-right-10 flex min-h-[calc(100vh-64px)] flex-col overflow-hidden bg-white dark:bg-black text-black dark:text-white transition-all duration-300 antialiased font-inter">
            {/* Premium Header */}
            <div className="sticky top-0 z-30 flex h-20 shrink-0 items-center justify-between border-b border-black/[0.05] dark:border-white/[0.05] bg-white dark:bg-black px-8">
                <div className="flex items-center gap-6">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 shrink-0 rounded-xl border border-black/[0.05] dark:border-white/[0.05] bg-black/[0.02] dark:bg-white/[0.02] hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-all active:scale-95 shadow-sm"
                        onClick={onClose}
                    >
                        <ArrowLeft size={16} />
                    </Button>
                    <div className="flex flex-col">
                        <h1 className="text-[14px] font-black leading-none tracking-[0.2em] uppercase mb-1.5">{title}</h1>
                        {subtitle && <p className="text-[10px] leading-none font-bold text-black/40 dark:text-white/40 uppercase tracking-widest">{subtitle}</p>}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {headerActions}
                    <Button
                        variant="primary"
                        onClick={onSave}
                        disabled={processing || (!isDirty && isEdit)}
                        className="h-10 px-8 active:scale-95 transition-all shadow-xl shadow-[var(--primary)]/20"
                    >
                        <Save className="mr-2 h-4 w-4" /> Simpan Data
                    </Button>
                </div>
            </div>

            {/* Form Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-black/[0.01] dark:bg-white/[0.01]">
                <div className="mx-auto max-w-[1400px] p-8">{children}</div>
            </div>
        </div>
    );
}

export function FormSection({
    title,
    subtitle,
    children,
    className,
    headerAction,
}: {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    className?: string;
    headerAction?: React.ReactNode;
}) {
    return (
        <div className={cn('bg-white dark:bg-black/20 rounded-xl border border-black/[0.05] dark:border-white/[0.05] shadow-sm overflow-hidden', className)}>
            <div className="flex items-center justify-between border-b border-black/[0.05] dark:border-white/[0.05] bg-black/[0.02] dark:bg-white/[0.02] px-6 py-4">
                <div className="space-y-1">
                    <span className="text-[11px] font-black tracking-[0.15em] text-black dark:text-white uppercase leading-none block">{title}</span>
                    {subtitle && <p className="text-[9px] font-bold text-black/30 dark:text-white/30 uppercase tracking-widest leading-none">{subtitle}</p>}
                </div>
                {headerAction}
            </div>
            <div className="p-8 text-black dark:text-white">{children}</div>
        </div>
    );
}

export function FormDangerZone({ title, description, children, className }: { title: string; description: string; children: React.ReactNode, className?: string }) {
    return (
        <div className={cn("rounded-xl border border-black/[0.05] dark:border-white/[0.05] bg-black/[0.02] dark:bg-white/[0.02] p-6 shadow-sm", className)}>
            <div className="flex items-center justify-between gap-6">
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                        <div className="flex h-5 w-5 items-center justify-center rounded-lg bg-black dark:bg-white text-[10px] font-black text-white dark:text-black shadow-sm">!</div>
                        <span className="text-[11px] font-black tracking-widest text-black dark:text-white uppercase leading-none">{title}</span>
                    </div>
                    <p className="text-[10px] font-bold text-black/40 dark:text-white/40 uppercase tracking-tight leading-relaxed max-w-sm">{description}</p>
                </div>
                {children}
            </div>
        </div>
    );
}
