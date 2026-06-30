import { Button } from '@/components/ui/buttons/Button';
import { useToast } from '@/components/ui/feedback/Toast';
import { router } from '@inertiajs/react';
import { FileSpreadsheet, Loader2, Upload, MoreVertical } from 'lucide-react';
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
    exportRoute: string;
    /** Named route for POST import, e.g. 'admin.company-groups.import' */
    importRoute: string;
    /** Label shown next to buttons, e.g. 'Group' */
    label?: string;
    /** Additional CSS class */
    className?: string;
}

/**
 * Reusable Excel export + import actions wrapped in a "More" (MoreVertical) dropdown menu.
 * - Export: triggers a direct file download via window.location.
 * - Import: opens a hidden <input type="file"> and POSTs with Inertia.
 */
export function ExcelActions({ exportRoute, importRoute, label, className }: Readonly<ExcelActionsProps>) {
    const { showToast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const handleExport = () => {
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
                        disabled={uploading}
                        title={`Aksi Excel${label ? ` ${label}` : ''}`}
                    >
                        {uploading ? (
                            <Loader2 size={14} className="animate-spin text-primary" />
                        ) : (
                            <MoreVertical size={14} className="text-text-soft" />
                        )}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    align="end"
                    className="w-44 rounded-xl p-1.5 shadow-xl bg-surface-base border border-surface-border"
                >
                    <DropdownMenuItem
                        onClick={handleExport}
                        className="flex cursor-pointer items-center gap-2 rounded-lg py-2 px-3 text-xs font-semibold text-text-main hover:bg-muted focus:bg-muted transition-all"
                    >
                        <FileSpreadsheet size={14} className="text-emerald-600" />
                        <span>Export Excel</span>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem
                        onClick={() => fileInputRef.current?.click()}
                        className="flex cursor-pointer items-center gap-2 rounded-lg py-2 px-3 text-xs font-semibold text-text-main hover:bg-muted focus:bg-muted transition-all"
                    >
                        <Upload size={14} className="text-primary" />
                        <span>Import Excel</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}

