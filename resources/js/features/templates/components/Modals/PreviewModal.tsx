import { Icons } from '@/components/ui';
import { Button } from '@/components/ui/buttons/Button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialogs/Dialog';
import { cn } from '@/lib/utils';
import React from 'react';
import { ContractTemplate } from '../../types';
import { formatSize } from '../../utils/templateUtils';

const { Download, FileSpreadsheet, FileText } = Icons;

interface PreviewModalProps {
    template: ContractTemplate | null;
    onClose: () => void;
    canDownload?: boolean;
    onDownload: (id: string) => void;
}

export function PreviewModal({ template, onClose, canDownload, onDownload }: PreviewModalProps) {
    if (!template) return null;

    const isPdf = template.file_type === 'pdf';
    const isDoc = ['doc', 'docx'].includes(template.file_type);
    const isExcel = ['xls', 'xlsx'].includes(template.file_type);

    return (
        <Dialog open={Boolean(template)} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="border-surface-border bg-surface-base flex h-[85vh] max-h-[85vh] flex-col overflow-hidden border p-0 shadow-2xl sm:max-w-[800px]">
                <DialogHeader className="bg-surface-muted/40 border-surface-border shrink-0 border-b p-4 sm:p-5">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-3">
                            <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                                {isExcel ? <FileSpreadsheet size={20} /> : <FileText size={20} />}
                            </div>
                            <div className="min-w-0">
                                <DialogTitle className="text-text-main truncate text-sm font-bold">{template.name}</DialogTitle>
                                <DialogDescription className="text-text-desc mt-0.5 truncate text-xs">
                                    {template.file_name} • {formatSize(template.file_size)} • Diunggah oleh {template.creator?.name || 'Sistem'}
                                </DialogDescription>
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <div className="bg-surface-muted/20 custom-scrollbar flex min-h-0 flex-1 items-center justify-center overflow-auto p-6">
                    {isPdf ? (
                        <iframe
                            src={`/storage/${template.file_path}`}
                            className="border-surface-border h-full w-full rounded-xl border bg-white shadow-sm"
                            title={template.name}
                        />
                    ) : (
                        <div className="border-surface-border bg-surface-card flex max-w-md flex-col items-center justify-center gap-4 rounded-2xl border p-8 text-center shadow-xs">
                            <div
                                className={cn(
                                    'flex h-16 w-16 items-center justify-center rounded-2xl shadow-inner',
                                    isDoc
                                        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                        : isExcel
                                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                          : 'bg-primary/10 text-primary',
                                )}
                            >
                                {isExcel ? <FileSpreadsheet size={32} /> : <FileText size={32} />}
                            </div>
                            <div>
                                <h3 className="text-text-main text-base font-bold">{template.name}</h3>
                                <p className="text-text-desc mt-1 font-mono text-xs">{template.file_name}</p>
                                <p className="text-text-desc/70 mt-2 text-xs leading-relaxed">
                                    Format berkas ({template.file_type.toUpperCase()}) dapat diunduh untuk diedit langsung menggunakan aplikasi
                                    pengolah dokumen Microsoft Word atau Excel.
                                </p>
                            </div>
                            {canDownload && (
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => onDownload(template.id)}
                                    className="mt-2 h-9 px-5 text-xs font-semibold"
                                >
                                    <Download size={14} className="mr-1.5" />
                                    <span>Unduh Template Sekarang</span>
                                </Button>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter className="border-surface-border/60 bg-surface-card/30 shrink-0 gap-2 border-t px-5 py-3.5">
                    {canDownload && (
                        <Button variant="outline" size="sm" onClick={() => onDownload(template.id)} className="h-9 px-4 text-xs font-semibold">
                            <Download size={14} className="mr-1.5 text-emerald-500" />
                            <span>Unduh File</span>
                        </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={onClose} className="h-9 px-4 text-xs font-semibold">
                        Tutup
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
