import { Icons } from '@/components/ui';
import { Button } from '@/components/ui/buttons/Button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialogs/Dialog';
import { Label } from '@/components/ui/forms/Label';
import React, { useState } from 'react';
import { templateService } from '../../services/templateService';
import { TemplateFolder } from '../../types';

const { Upload } = Icons;

interface UploadModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    currentFolderId: string | null;
    folders: TemplateFolder[];
}

export function UploadModal({ isOpen, onOpenChange, currentFolderId, folders }: UploadModalProps) {
    const [targetFolderId, setTargetFolderId] = useState<string | null>(currentFolderId);
    const [isSubmitting, setIsSubmitting] = useState(false);

    React.useEffect(() => {
        if (isOpen) {
            setTargetFolderId(currentFolderId);
        }
    }, [isOpen, currentFolderId]);

    const handleFiles = (files: FileList | null) => {
        if (!files || files.length === 0) return;
        const filesArray = Array.from(files);
        setIsSubmitting(true);
        onOpenChange(false);

        filesArray.forEach((file) => {
            const defaultName = file.name.replace(/\.[^/.]+$/, '');
            const formData = new FormData();
            formData.append('name', defaultName);
            formData.append('description', '');
            if (targetFolderId) {
                formData.append('template_folder_id', targetFolderId);
            }
            formData.append('file', file);

            templateService.storeTemplate(formData, {
                onFinish: () => setIsSubmitting(false),
            });
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="border-surface-border bg-surface-base overflow-hidden border p-0 shadow-2xl sm:max-w-[520px]">
                <DialogHeader className="bg-surface-muted/40 border-surface-border border-b p-5">
                    <DialogTitle className="text-text-main flex items-center gap-2 text-sm font-bold">
                        <Upload size={16} className="text-primary" /> Upload Template Dokumen
                    </DialogTitle>
                    <DialogDescription className="text-text-desc mt-0.5 text-xs">
                        Unggah berkas template (.docx, .pdf, .xlsx) ke dalam repositori.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 p-5">
                    <div className="grid gap-1.5">
                        <Label className="text-text-main text-xs font-semibold">Folder Tujuan Upload</Label>
                        <select
                            value={targetFolderId || ''}
                            onChange={(e) => setTargetFolderId(e.target.value || null)}
                            className="border-surface-border bg-surface-card text-text-main focus:border-primary h-9 w-full rounded-lg border px-3 text-xs outline-none"
                        >
                            <option value="">Repository Root (Tanpa Folder)</option>
                            {folders
                                .sort((a, b) => a.name.localeCompare(b.name))
                                .map((f) => (
                                    <option key={f.id} value={f.id}>
                                        📁 {f.name}
                                    </option>
                                ))}
                        </select>
                    </div>

                    {/* Drop Zone Box */}
                    <div
                        onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            e.dataTransfer.dropEffect = 'copy';
                        }}
                        onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleFiles(e.dataTransfer.files);
                        }}
                        className="group border-primary/40 hover:border-primary bg-primary/5 hover:bg-primary/10 relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-8 text-center transition-all"
                    >
                        <input
                            type="file"
                            multiple
                            accept=".docx,.doc,.pdf,.xls,.xlsx,.txt,.rtf,.odt,.ods,.csv"
                            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                            onChange={(e) => handleFiles(e.target.files)}
                        />
                        <div className="bg-primary text-primary-foreground flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg transition-transform group-hover:scale-105">
                            <Upload size={24} />
                        </div>
                        <div>
                            <h4 className="text-text-main text-sm font-bold">Seret & Jatuhkan File di Sini</h4>
                            <p className="text-text-desc mt-1 text-xs">
                                atau <span className="text-primary font-semibold underline">klik untuk memilih dari komputer</span>
                            </p>
                        </div>
                        <p className="text-text-desc/70 text-[11px]">Mendukung multi-file: .docx, .doc, .pdf, .xls, .xlsx (maks 20MB per file)</p>
                    </div>
                </div>

                <DialogFooter className="border-surface-border/60 bg-surface-card/30 gap-2 border-t px-5 py-3.5">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-9 px-4 text-xs font-semibold"
                        onClick={() => onOpenChange(false)}
                        disabled={isSubmitting}
                    >
                        Tutup
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
