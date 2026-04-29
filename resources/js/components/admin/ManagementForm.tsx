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
        <div className="animate-in fade-in slide-in-from-right-10 flex min-h-full flex-col overflow-hidden border border-black dark:border-white bg-white dark:bg-black text-black dark:text-white transition-all duration-300">
            {/* Flat Sticky Header */}
            <div className="sticky top-0 z-30 flex h-12 shrink-0 items-center justify-between border-b border-black dark:border-white bg-white dark:bg-black px-4">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="text-black dark:text-white transition-colors" title="Kembali ke daftar">
                        <ArrowLeft size={18} strokeWidth={3} />
                    </button>
                    <div className="h-4 w-px bg-black dark:bg-white" />
                    <div>
                        <h1 className="text-sm leading-none font-bold tracking-tight uppercase">{title}</h1>
                        {subtitle && <p className="mt-1 text-[10px] leading-none font-medium text-black dark:text-white uppercase">{subtitle}</p>}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {headerActions}
                    <Button
                        onClick={onSave}
                        disabled={processing || (!isDirty && isEdit)}
                        className="h-8 rounded-none bg-black dark:bg-white px-6 text-[10px] font-bold tracking-widest text-white dark:text-black uppercase transition-all hover:opacity-90 active:scale-95"
                    >
                        <Save className="mr-2 h-3.5 w-3.5" /> Simpan Data
                    </Button>
                </div>
            </div>

            {/* Form Body */}
            <div className="flex-1 overflow-y-auto bg-white dark:bg-black">
                <div className="mx-auto max-w-[1400px] space-y-4 p-4">{children}</div>
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
        <div className={cn('border border-black dark:border-white bg-white dark:bg-black', className)}>
            <div className="flex items-center justify-between overflow-hidden border-b border-black dark:border-white bg-black/5 dark:bg-white/5 px-5 py-2.5 whitespace-nowrap">
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold tracking-[0.2em] text-black dark:text-white uppercase">{title}</span>
                </div>
                {headerAction}
            </div>
            <div className="p-4 text-black dark:text-white">{children}</div>
        </div>
    );
}

export function FormDangerZone({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
    return (
        <div className="space-y-2 border border-black dark:border-white bg-black/5 dark:bg-white/5 p-4">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-4 w-4 items-center justify-center bg-black dark:bg-white text-[10px] font-bold text-white dark:text-black">!</div>
                    <span className="text-[10px] font-bold tracking-widest text-black dark:text-white uppercase">{title}</span>
                </div>
                {children}
            </div>
        </div>
    );
}
