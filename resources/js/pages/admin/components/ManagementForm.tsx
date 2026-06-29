import { Button } from '@/components/ui/buttons/Button';
import { cn } from '@/lib/utils';
import { ArrowLeft, ChevronsUp, Loader2, Save } from 'lucide-react';
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
    onCollapseAll?: () => void;
    flat?: boolean;
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
    onCollapseAll,
    flat = false,
}: ManagementFormProps) {
    return (
        <div
            className={cn(
                "animate-in fade-in slide-in-from-right-5 bg-surface-base text-text-main flex flex-col overflow-hidden font-sans antialiased",
                flat ? "h-full w-full" : "border-surface-border m-5 rounded-2xl border shadow-sm"
            )}
            style={{ maxHeight: flat ? '100%' : 'calc(100svh - 2.5rem)' }}
        >
            {/* COMPACT STICKY HEADER */}
            <div className="border-surface-border bg-surface-muted/95 sticky top-0 z-50 flex shrink-0 items-center justify-between border-b px-6 py-4 backdrop-blur">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="hover:bg-surface-muted h-8 w-8 shrink-0 rounded-xl" onClick={onClose}>
                        <ArrowLeft size={16} />
                    </Button>

                    <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                            <h1 className="text-text-main text-lg font-semibold">{title}</h1>
                            {isEdit && <div className="bg-primary h-1.5 w-1.5 animate-pulse rounded-full" />}
                        </div>
                        {subtitle && <p className="text-text-desc text-sm font-bold  ">{subtitle}</p>}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {onCollapseAll && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onCollapseAll}
                            className="hover:bg-surface-muted text-text-desc hover:text-text-main h-9 w-9 rounded-xl"
                            title="Tutup Semua Expand"
                        >
                            <ChevronsUp size={16} />
                        </Button>
                    )}
                    {headerActions}
                    <Button
                        variant="primary"
                        onClick={onSave}
                        disabled={processing || (!isDirty && isEdit)}
                        className="h-9 rounded-xl px-5 text-sm font-semibold  shadow-sm"
                    >
                        {processing ? (
                            <Loader2 size={14} className="animate-spin" />
                        ) : (
                            <div className="flex items-center gap-1.5">
                                <Save size={14} />
                                <span>{isEdit ? 'Perbarui' : 'Simpan'}</span>
                            </div>
                        )}
                    </Button>
                </div>
            </div>

            {/* COMPACT FORM BODY */}
            <div className="bg-surface-base flex-1 overflow-y-auto md:p-8">
                <div className="mx-auto w-full max-w-full">{children}</div>
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
    title?: string;
    subtitle?: string;
    children?: React.ReactNode;
    className?: string;
    headerAction?: React.ReactNode;
}) {
    return (
        <div className={cn('space-y-6', className)}>
            {(title || subtitle || headerAction) && (
                <div className="flex items-center justify-between gap-4 border-b border-black/[0.03] pb-4 dark:border-white/[0.03]">
                    <div className="space-y-1">
                        {title && <h3 className="text-text-main text-xs font-semibold  ">{title}</h3>}
                        {subtitle && <p className="text-text-desc text-sm leading-relaxed font-medium ">{subtitle}</p>}
                    </div>
                    {headerAction}
                </div>
            )}
            <div className="animate-in fade-in duration-500">{children}</div>
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
