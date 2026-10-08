import { Icons } from '@/components/ui';
import { Button } from '@/components/ui/buttons/Button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialogs/Dialog';
import { Label } from '@/components/ui/forms/Label';
import { cn } from '@/lib/utils';
import React from 'react';
import { templateService } from '../../services/templateService';
import { TableRowItem, TemplateFolder } from '../../types';

const { AlertTriangle, Folder, FolderInput, Loader2, Trash2 } = Icons;

interface BulkDeleteModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    selectedRows: TableRowItem[];
    onSuccess: () => void;
}

export function BulkDeleteModal({ isOpen, onOpenChange, selectedRows, onSuccess }: BulkDeleteModalProps) {
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const handleBulkDelete = () => {
        if (selectedRows.length === 0 || isSubmitting) return;

        setIsSubmitting(true);
        const folder_ids = selectedRows.filter((r) => r.itemType === 'folder').map((r) => r.id);
        const template_ids = selectedRows.filter((r) => r.itemType === 'template').map((r) => r.id);

        templateService.bulkDelete(
            { folder_ids, template_ids },
            {
                onSuccess: () => {
                    onOpenChange(false);
                    onSuccess();
                },
                onFinish: () => setIsSubmitting(false),
            },
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="border-surface-border bg-surface-base overflow-hidden border p-0 shadow-2xl sm:max-w-[420px]">
                <DialogHeader className="border-surface-border bg-rose-500/5 border-b p-5">
                    <DialogTitle className="flex items-center gap-2 text-sm font-bold text-rose-600 dark:text-rose-400">
                        <AlertTriangle size={16} /> Hapus {selectedRows.length} Item Terpilih
                    </DialogTitle>
                    <DialogDescription className="text-text-desc mt-1 text-xs leading-relaxed">
                        Apakah Anda yakin ingin menghapus <strong>{selectedRows.length} item</strong> sekaligus? Tindakan ini tidak dapat
                        dibatalkan.
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
                        onClick={handleBulkDelete}
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
                                <span>Hapus Semua</span>
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

interface BulkMoveModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    selectedRows: TableRowItem[];
    folders: TemplateFolder[];
    onSuccess: () => void;
}

export function BulkMoveModal({ isOpen, onOpenChange, selectedRows, folders, onSuccess }: BulkMoveModalProps) {
    const [bulkTargetFolderId, setBulkTargetFolderId] = React.useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    React.useEffect(() => {
        if (isOpen) {
            setBulkTargetFolderId(null);
        }
    }, [isOpen]);

    const handleBulkMove = () => {
        if (selectedRows.length === 0 || isSubmitting) return;

        setIsSubmitting(true);
        const folder_ids = selectedRows.filter((r) => r.itemType === 'folder').map((r) => r.id);
        const template_ids = selectedRows.filter((r) => r.itemType === 'template').map((r) => r.id);

        templateService.bulkMove(
            {
                target_folder_id: bulkTargetFolderId,
                folder_ids,
                template_ids,
            },
            {
                onSuccess: () => {
                    onOpenChange(false);
                    onSuccess();
                },
                onFinish: () => setIsSubmitting(false),
            },
        );
    };

    const selectedFolderIds = new Set(selectedRows.filter((r) => r.itemType === 'folder').map((r) => r.id));
    const availableFolders = folders.filter((f) => !selectedFolderIds.has(f.id));

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="border-surface-border bg-surface-base overflow-hidden border p-0 shadow-2xl sm:max-w-[450px]">
                <DialogHeader className="bg-surface-muted/40 border-surface-border border-b p-5">
                    <DialogTitle className="text-text-main flex items-center gap-2 text-sm font-bold">
                        <FolderInput size={16} className="text-blue-500" /> Pindahkan {selectedRows.length} Item Terpilih
                    </DialogTitle>
                    <DialogDescription className="text-text-desc mt-0.5 text-xs">Pilih folder tujuan untuk item yang dipilih.</DialogDescription>
                </DialogHeader>
                <div className="p-5">
                    <Label className="text-text-main mb-2 block text-xs font-semibold">Folder Tujuan</Label>
                    <div className="border-surface-border bg-surface-card/50 overflow-hidden rounded-xl border">
                        <div className="custom-scrollbar max-h-56 space-y-1 overflow-y-auto p-1.5">
                            <button
                                type="button"
                                className={cn(
                                    'flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold transition-all',
                                    bulkTargetFolderId === null ? 'bg-primary text-primary-foreground' : 'text-text-main hover:bg-surface-muted',
                                )}
                                onClick={() => setBulkTargetFolderId(null)}
                            >
                                <Folder size={14} className={cn(bulkTargetFolderId === null ? 'fill-current' : 'text-amber-500')} />
                                <span>Repository Root (Folder Utama)</span>
                            </button>
                            {availableFolders
                                .sort((a, b) => a.name.localeCompare(b.name))
                                .map((f) => (
                                    <button
                                        key={f.id}
                                        type="button"
                                        className={cn(
                                            'flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold transition-all',
                                            bulkTargetFolderId === f.id ? 'bg-primary text-primary-foreground' : 'text-text-main hover:bg-surface-muted',
                                        )}
                                        onClick={() => setBulkTargetFolderId(f.id)}
                                    >
                                        <Folder size={14} className={cn(bulkTargetFolderId === f.id ? 'fill-current' : 'text-amber-500')} />
                                        <span className="truncate">{f.name}</span>
                                    </button>
                                ))}
                        </div>
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
                        Batal
                    </Button>
                    <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        className="h-9 px-5 text-xs font-semibold"
                        onClick={handleBulkMove}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 size={14} className="mr-1.5 animate-spin" />
                                <span>Memindahkan...</span>
                            </>
                        ) : (
                            <span>Pindahkan Semua</span>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
