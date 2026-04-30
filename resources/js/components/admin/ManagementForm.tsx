import { Button } from '@/components/ui/base/Button';
import { cn } from '@/lib/utils';
import { ArrowLeft, Save, Sparkles } from 'lucide-react';
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
        <div className="animate-in fade-in slide-in-from-right-10 dark:bg-primary font-inter flex min-h-[calc(100vh-64px)] flex-col overflow-hidden bg-white text-black antialiased transition-all duration-300 dark:text-white">
            {/* COMPACT STICKY HEADER */}
            <div className="border-primary/10 dark:bg-background sticky top-0 z-40 flex h-12 shrink-0 items-center justify-between bg-white/10 px-5 backdrop-blur-md border-b">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                            'h-7 w-7 shrink-0 rounded-lg transition-all duration-300 active:scale-90',
                            'bg-primary/[0.05] border-primary/10 border dark:border-white/10 dark:bg-white/[0.05]',
                            'hover:bg-primary dark:hover:text-primary hover:text-white dark:hover:bg-white',
                        )}
                        onClick={onClose}
                    >
                        <ArrowLeft size={12} strokeWidth={3} />
                    </Button>

                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <h1 className="text-primary text-[12px] leading-none font-black tracking-tight uppercase dark:text-white">{title}</h1>
                            {isEdit && <div className="bg-primary h-1 w-1 animate-pulse rounded-full dark:bg-white" />}
                        </div>
                        {subtitle && (
                            <p className="text-primary/40 mt-1 text-[7px] leading-none font-bold tracking-[0.2em] uppercase dark:text-white">
                                {subtitle}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {headerActions}
                    <div className="bg-primary/10 mx-1 h-4 w-px dark:bg-white/10" />
                    <Button
                        variant="primary"
                        onClick={onSave}
                        disabled={processing || (!isDirty && isEdit)}
                        className={cn(
                            'shadow-primary/10 h-8 rounded-lg px-5 text-[8px] font-black tracking-[0.15em] uppercase shadow-lg transition-all duration-300 active:scale-95',
                            'bg-primary border-none text-white dark:bg-white dark:text-black',
                        )}
                    >
                        {processing ? (
                            <div className="dark:border-primary/20 dark:border-t-primary h-3 w-3 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                        ) : (
                            <div className="flex items-center gap-2">
                                <Save size={10} strokeWidth={3} />
                                <span>{isEdit ? 'UPDATE' : 'SIMPAN'}</span>
                            </div>
                        )}
                    </Button>
                </div>
            </div>

            {/* COMPACT FORM BODY */}
            <div className="dark:bg-background flex-1 overflow-y-auto bg-white">
                <div className="w-full p-5 lg:p-8 max-w-[1600px] mx-auto">{children}</div>
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
        <div
            className={cn(
                'dark:bg-primary/[0.03] border-primary/10 overflow-hidden rounded-xl border bg-white shadow-sm dark:border-white/10',
                className,
            )}
        >
            <div className="border-primary/5 bg-primary/[0.01] flex items-center justify-between border-b px-5 py-3 dark:border-white/5 dark:bg-white/[0.01]">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Sparkles size={10} className="text-primary/20 dark:text-white/20" />
                        <span className="text-primary block text-[10px] leading-none font-black tracking-widest uppercase dark:text-white">
                            {title}
                        </span>
                    </div>
                    {subtitle && (
                        <p className="text-primary/30 text-[7px] leading-none font-bold tracking-[0.2em] uppercase dark:text-white">{subtitle}</p>
                    )}
                </div>
                {headerAction}
            </div>
            <div className="p-5 text-black dark:text-white">{children}</div>
        </div>
    );
}

export function FormDangerZone({
    title,
    description,
    children,
    className,
}: {
    title: string;
    description: string;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'border-primary/10 bg-primary/[0.03] rounded-xl border p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]',
                className,
            )}
        >
            <div className="flex items-center justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <div className="bg-primary dark:text-primary flex h-4 w-4 items-center justify-center rounded-md text-[9px] font-black text-white shadow-sm dark:bg-white">
                            !
                        </div>
                        <span className="text-primary text-[10px] leading-none font-black tracking-widest uppercase dark:text-white">{title}</span>
                    </div>
                    <p className="text-primary/30 max-w-sm text-[8px] leading-relaxed font-bold tracking-widest uppercase dark:text-white/30">
                        {description}
                    </p>
                </div>
                {children}
            </div>
        </div>
    );
}
