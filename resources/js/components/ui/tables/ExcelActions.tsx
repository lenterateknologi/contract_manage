import { Button } from '@/components/ui/buttons/Button';
import { useToast } from '@/components/ui/feedback/Toast';
import { router } from '@inertiajs/react';
import { FileSpreadsheet, Loader2, Upload, MoreVertical, RefreshCw } from 'lucide-react';
import React, { useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/selection/DropdownMenu';

declare function route(name: string, params?: Record<string, unknown>): string;

interface ExcelActionsProps {
    /** Named route for GET export, e.g. 'admin.company-groups.export' */
    exportRoute?: string;
    /** Named route for POST import, e.g. 'admin.company-groups.import' */
    importRoute?: string;
    /** Callback to trigger Portal synchronization */
    onSyncPortal?: () => void;
    /** Whether Portal synchronization is currently running */
    isSyncingPortal?: boolean;
    /** Label shown next to buttons, e.g. 'Group' */
    label?: string;
    /** Render action items inline without More dropdown trigger */
    inline?: boolean;
    /** Additional CSS class */
    className?: string;
}

/**
 * Reusable Excel export + import actions wrapped in a "More" (MoreVertical) dropdown menu.
 * - Export: triggers a direct file download via window.location.
 * - Import: opens a hidden <input type="file"> and POSTs with Inertia.
 */
export function ExcelActions({ exportRoute, importRoute, onSyncPortal, isSyncingPortal = false, label, inline = false, className }: Readonly<ExcelActionsProps>) {
    const { showToast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const handleExport = () => {
        if (!exportRoute) return;
        const url = exportRoute.includes('/') ? exportRoute : route(exportRoute);
        window.location.href = url;
        showToast(`Mengunduh file Excel${label ? ` ${label}` : ''}...`, 'success');
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.name.match(/\.(xlsx|xls)$/i)) {
            showToast('Hanya file .xlsx atau .xls yang diperbolehkan.', 'danger');
            e.target.value = '';
            return;
        }

        setSelectedFile(file);
        submitImport(file);
        // Reset input so same file can be re-uploaded
        e.target.value = '';
    };

    const submitImport = (file: File) => {
        if (!importRoute) return;
        setUploading(true);

        const formData = new FormData();
        formData.append('file', file);

        const url = importRoute.includes('/') ? importRoute : route(importRoute);

        router.post(url, formData, {
            forceFormData: true,
            onSuccess: () => {
                showToast(`Data${label ? ` ${label}` : ''} berhasil diimpor dari Excel.`, 'success');
                setSelectedFile(null);
                setUploading(false);
            },
            onError: (errors: Record<string, string>) => {
                const msg = errors.error ?? errors.file ?? `Gagal mengimpor${label ? ` ${label}` : ''}. Periksa format file Anda.`;
                showToast(msg, 'danger');
                setSelectedFile(null);
                setUploading(false);
            },
            onFinish: () => {
                setUploading(false);
            },
        });
    };

    if (inline) {
        return (
            <div className={cn('flex flex-col gap-1.5 w-full', className)}>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={uploading}
                />
                {onSyncPortal && (
                    <button
                        type="button"
                        onClick={onSyncPortal}
                        disabled={isSyncingPortal}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-text-main hover:bg-surface-muted rounded-lg transition-all cursor-pointer disabled:opacity-50"
                    >
                        <RefreshCw size={15} className={cn("text-primary shrink-0", isSyncingPortal && "animate-spin")} />
                        <span>{isSyncingPortal ? 'Menyinkronkan...' : 'Sinkron Portal'}</span>
                    </button>
                )}
                {exportRoute && (
                    <button
                        type="button"
                        onClick={handleExport}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-text-main hover:bg-surface-muted rounded-lg transition-all cursor-pointer"
                    >
                        <FileSpreadsheet size={15} className="text-emerald-600 shrink-0" />
                        <span>Export Excel</span>
                    </button>
                )}
                {importRoute && (
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-text-main hover:bg-surface-muted rounded-lg transition-all cursor-pointer"
                    >
                        {uploading ? (
                            <Loader2 size={15} className="animate-spin text-primary shrink-0" />
                        ) : (
                            <Upload size={15} className="text-primary shrink-0" />
                        )}
                        <span>Import Excel</span>
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className={cn('relative inline-block', className)}>
            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleFileChange}
                disabled={uploading}
            />

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="white"
                        size="icon"
                        disabled={uploading || isSyncingPortal}
                        title={`Aksi Lainnya${label ? ` ${label}` : ''}`}
                    >
                        {uploading || isSyncingPortal ? (
                            <Loader2 size={14} className="animate-spin text-primary" />
                        ) : (
                            <MoreVertical size={14} className="text-text-soft" />
                        )}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    align="end"
                    className="w-48 rounded-xl p-1.5 shadow-xl bg-surface-base border border-surface-border"
                >
                    {onSyncPortal && (
                        <DropdownMenuItem
                            onClick={onSyncPortal}
                            disabled={isSyncingPortal}
                            className="flex cursor-pointer items-center gap-2 rounded-lg py-2 px-3 text-xs font-semibold text-text-main hover:bg-muted focus:bg-muted transition-all"
                        >
                            <RefreshCw size={14} className={cn("text-primary shrink-0", isSyncingPortal && "animate-spin")} />
                            <span>{isSyncingPortal ? 'Menyinkronkan...' : 'Sinkron Portal'}</span>
                        </DropdownMenuItem>
                    )}

                    {exportRoute && (
                        <DropdownMenuItem
                            onClick={handleExport}
                            className="flex cursor-pointer items-center gap-2 rounded-lg py-2 px-3 text-xs font-semibold text-text-main hover:bg-muted focus:bg-muted transition-all"
                        >
                            <FileSpreadsheet size={14} className="text-emerald-600 shrink-0" />
                            <span>Export Excel</span>
                        </DropdownMenuItem>
                    )}
                    
                    {importRoute && (
                        <DropdownMenuItem
                            onClick={() => fileInputRef.current?.click()}
                            className="flex cursor-pointer items-center gap-2 rounded-lg py-2 px-3 text-xs font-semibold text-text-main hover:bg-muted focus:bg-muted transition-all"
                        >
                            <Upload size={14} className="text-primary shrink-0" />
                            <span>Import Excel</span>
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}

