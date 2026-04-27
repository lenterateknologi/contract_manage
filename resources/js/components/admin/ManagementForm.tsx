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
        <div className="animate-in fade-in slide-in-from-right-10 flex min-h-full flex-col overflow-hidden border border-slate-200 bg-white text-slate-900 transition-all duration-300">
            {/* Flat Sticky Header */}
            <div className="sticky top-0 z-30 flex h-12 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="text-slate-400 transition-colors hover:text-black" title="Back to list">
                        <ArrowLeft size={18} strokeWidth={3} />
                    </button>
                    <div className="h-4 w-px bg-slate-200" />
                    <div>
                        <h1 className="text-sm leading-none font-black tracking-tight uppercase">{title}</h1>
                        {subtitle && <p className="mt-1 text-[10px] leading-none font-bold text-slate-400 uppercase">{subtitle}</p>}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {headerActions}
                    <Button
                        onClick={onSave}
                        disabled={processing || (!isDirty && isEdit)}
                        className="h-8 rounded-none bg-black px-6 text-[10px] font-black tracking-widest text-white uppercase transition-all hover:bg-slate-800 active:scale-95"
                    >
                        <Save className="mr-2 h-3.5 w-3.5" /> Simpan Data
                    </Button>
                </div>
            </div>

            {/* Form Body */}
            <div className="flex-1 overflow-y-auto bg-slate-50/30">
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
        <div className={cn('border border-slate-200 bg-white', className)}>
            <div className="flex items-center justify-between overflow-hidden border-b border-slate-200 bg-slate-50 px-5 py-2.5 whitespace-nowrap">
                <div className="flex items-center gap-3">
                    {/* <div className="w-1.5 h-3 bg-black" /> */}
                    <span className="text-[10px] font-black tracking-[0.2em] text-slate-600 uppercase">{title}</span>
                </div>
                {headerAction}
            </div>
            <div className="p-4">{children}</div>
        </div>
    );
}

export function FormDangerZone({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
    return (
        <div className="space-y-2 border border-slate-200 bg-slate-50/50 p-4">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-4 w-4 items-center justify-center bg-black text-[10px] font-black text-white">!</div>
                    <span className="text-[10px] font-black tracking-widest text-black uppercase">{title}</span>
                </div>
                {children}
            </div>
        </div>
    );
}
