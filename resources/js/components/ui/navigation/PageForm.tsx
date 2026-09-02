import * as React from 'react';
import { PageHeader } from './PageHeader';
import { PageFooter } from './PageFooter';
import { Button } from '@/components/ui/buttons/Button';
import { ArrowLeft } from 'lucide-react';
import { Link } from '@inertiajs/react';

interface PageFormProps {
    title: string;
    subtitle?: string;
    backUrl?: string;
    onSubmit?: (e: React.FormEvent) => void;
    children: React.ReactNode;
    actions?: React.ReactNode;
    processing?: boolean;
    submitLabel?: string;
    onCancel?: () => void;
    cancelLabel?: string;
}

export function PageForm({
    title,
    subtitle,
    backUrl,
    onSubmit,
    children,
    actions,
    processing = false,
    submitLabel = 'Simpan',
    onCancel,
    cancelLabel = 'Batal',
}: PageFormProps) {
    return (
        <div className="flex flex-col h-svh max-h-svh overflow-hidden bg-background w-full animate-in fade-in duration-200">
            <PageHeader
                title={title}
                subtitle={subtitle}
                actions={
                    <div className="flex items-center gap-2">
                        {backUrl && (
                            <Link href={backUrl}>
                                <Button variant="white" size="sm" className="gap-1.5 h-9 rounded-xl">
                                    <ArrowLeft size={14} /> Kembali
                                </Button>
                            </Link>
                        )}
                        {actions}
                    </div>
                }
            />
            
            <div className="flex-1 min-h-0 overflow-auto p-6 w-full">
                <div className="max-w-4xl mx-auto w-full">
                    <form onSubmit={onSubmit} className="bg-white dark:bg-zinc-900 border border-border rounded-xl shadow-xs p-6 space-y-6">
                        {children}
                        
                        <div className="flex justify-end gap-3 pt-4 border-t border-border">
                            {onCancel ? (
                                <Button type="button" variant="white" onClick={onCancel} className="h-10 px-5 rounded-xl">
                                    {cancelLabel}
                                </Button>
                            ) : backUrl ? (
                                <Link href={backUrl}>
                                    <Button type="button" variant="white" className="h-10 px-5 rounded-xl">
                                        {cancelLabel}
                                    </Button>
                                </Link>
                            ) : null}
                            <Button type="submit" variant="primary" disabled={processing} className="h-10 px-6 rounded-xl font-semibold">
                                {processing ? 'Menyimpan...' : submitLabel}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
            
            <PageFooter />
        </div>
    );
}
