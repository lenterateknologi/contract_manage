import { Icons } from '@/components/ui';
import { Button } from '@/components/ui/buttons/Button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialogs/Dialog';
import React, { useState } from 'react';
import { templateService } from '../../services/templateService';

const { AlertTriangle, Loader2, Trash2 } = Icons;

interface DeleteModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    target: { type: 'folder' | 'template'; id: string; name: string } | null;
}

export function DeleteModal({ isOpen, onOpenChange, target }: DeleteModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleDelete = () => {
        if (!target || isSubmitting) return;

        setIsSubmitting(true);
        if (target.type === 'folder') {
            templateService.deleteFolder(target.id, {
                onSuccess: () => onOpenChange(false),
                onFinish: () => setIsSubmitting(false),
            });
        } else {
            templateService.deleteTemplate(target.id, {
                onSuccess: () => onOpenChange(false),
                onFinish: () => setIsSubmitting(false),
            });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="border-surface-border bg-surface-base overflow-hidden border p-0 shadow-2xl sm:max-w-[420px]">
                <DialogHeader className="border-surface-border bg-rose-500/5 border-b p-5">
                    <DialogTitle className="flex items-center gap-2 text-sm font-bold text-rose-600 dark:text-rose-400">
                        <AlertTriangle size={16} /> Konfirmasi Hapus {target?.type === 'folder' ? 'Folder' : 'Template'}
                    </DialogTitle>
                    <DialogDescription className="text-text-desc mt-1 text-xs leading-relaxed">
                        Apakah Anda yakin ingin menghapus <strong>"{target?.name}"</strong>?
                        {target?.type === 'folder' && ' Seluruh sub-folder dan berkas template di dalamnya akan ikut terhapus.'} Tindakan ini tidak
                        dapat dibatalkan.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="border-surface-border/60 bg-surface-card/30 gap-2 border-t px-5 py-3.5">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-9 px-4 text-xs font-semibold"
                        onClick={() => onOpenChange(false)}
                        disabled={isSubmitting}
                    >
                        Batal
                    </Button>
                    <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        className="h-9 px-5 text-xs font-semibold"
                        onClick={handleDelete}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 size={14} className="mr-1.5 animate-spin" />
                                <span>Menghapus...</span>
                            </>
                        ) : (
                            <>
                                <Trash2 size={14} className="mr-1.5" />
                                <span>Ya, Hapus Sekarang</span>
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
