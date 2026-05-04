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
        <div className="animate-in fade-in slide-in-from-right-5 bg-card border-border/60 text-foreground flex flex-col overflow-hidden rounded-2xl border font-sans antialiased shadow-sm">
            {/* COMPACT STICKY HEADER */}
            <div className="border-border/60 bg-muted/40 z-40 flex shrink-0 items-center justify-between border-b px-6 py-4">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="hover:bg-muted h-8 w-8 shrink-0 rounded-xl" onClick={onClose}>
                        <ArrowLeft size={16} />
                    </Button>

                    <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                            <h1 className="text-foreground text-base font-bold tracking-tight">{title}</h1>
                            {isEdit && <div className="bg-primary h-1.5 w-1.5 animate-pulse rounded-full" />}
                        </div>
                        {subtitle && <p className="text-muted-foreground text-xs font-medium">{subtitle}</p>}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {headerActions}
                    <Button
                        variant="primary"
                        onClick={onSave}
                        disabled={processing || (!isDirty && isEdit)}
                        className="h-9 rounded-xl px-5 text-xs font-semibold shadow-sm"
                    >
                        {processing ? (
                            <div className="border-primary-foreground/20 border-t-primary-foreground h-4 w-4 animate-spin rounded-full border-2" />
                        ) : (
                            <div className="flex items-center gap-1.5">
                                <Save size={14} />
                                <span>{isEdit ? 'Update' : 'Simpan'}</span>
                            </div>
                        )}
                    </Button>
                </div>
            </div>

            {/* COMPACT FORM BODY */}
            <div className="bg-card flex-1 p-6 md:p-8">
                <div className="mx-auto w-full max-w-[1600px]">{children}</div>
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
        <div className={cn('border-border/60 bg-card overflow-hidden rounded-xl border shadow-sm', className)}>
            <div className="bg-muted/30 border-border/40 flex items-center justify-between border-b px-5 py-3.5">
                <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                        <Sparkles size={13} className="text-primary/50" />
                        <span className="text-foreground text-sm font-bold tracking-wide">{title}</span>
                    </div>
                    {subtitle && <p className="text-muted-foreground text-xs font-medium">{subtitle}</p>}
                </div>
                {headerAction}
            </div>
            <div className="text-foreground p-6">{children}</div>
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
            className={cn('rounded-xl border border-rose-200/60 bg-rose-50/40 p-5 shadow-sm dark:border-rose-900/40 dark:bg-rose-950/20', className)}
        >
            <div className="flex items-center justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <div className="flex h-5 w-5 items-center justify-center rounded-md bg-rose-500 text-xs font-bold text-white">!</div>
                        <span className="text-foreground text-sm font-bold">{title}</span>
                    </div>
                    <p className="text-muted-foreground max-w-sm text-xs leading-relaxed font-medium">{description}</p>
                </div>
                {children}
            </div>
        </div>
    );
}
