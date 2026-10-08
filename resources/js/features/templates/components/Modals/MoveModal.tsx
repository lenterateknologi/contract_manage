import { Icons } from '@/components/ui';
import { Button } from '@/components/ui/buttons/Button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialogs/Dialog';
import { Label } from '@/components/ui/forms/Label';
import { cn } from '@/lib/utils';
import React, { useState } from 'react';
import { templateService } from '../../services/templateService';
import { TemplateFolder } from '../../types';

const { Folder, FolderInput, Loader2 } = Icons;

interface MoveModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    target: { type: 'folder' | 'template'; id: string; name: string } | null;
    folders: TemplateFolder[];
}

export function MoveModal({ isOpen, onOpenChange, target, folders }: MoveModalProps) {
    const [targetFolderId, setTargetFolderId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    React.useEffect(() => {
        if (isOpen) {
            setTargetFolderId(null);
        }
    }, [isOpen]);

    const handleMove = () => {
        if (!target || isSubmitting) return;

        setIsSubmitting(true);
        if (target.type === 'folder') {
            templateService.moveFolder(target.id, targetFolderId, {
                onSuccess: () => onOpenChange(false),
                onFinish: () => setIsSubmitting(false),
            });
        } else {
            templateService.moveTemplate(target.id, targetFolderId, {
                onSuccess: () => onOpenChange(false),
                onFinish: () => setIsSubmitting(false),
            });
        }
    };

    // Filter out self and descendant folders if moving a folder
    const availableFolders = folders.filter((f) => {
        if (target?.type === 'folder' && f.id === target.id) return false;
        return true;
    });

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="border-surface-border bg-surface-base overflow-hidden border p-0 shadow-2xl sm:max-w-[450px]">
                <DialogHeader className="bg-surface-muted/40 border-surface-border border-b p-5">
                    <DialogTitle className="text-text-main flex items-center gap-2 text-sm font-bold">
                        <FolderInput size={16} className="text-blue-500" /> Pindahkan {target?.type === 'folder' ? 'Folder' : 'Dokumen'}
                    </DialogTitle>
                    <DialogDescription className="text-text-desc mt-0.5 text-xs">
                        Pilih folder tujuan untuk <strong>{target?.name}</strong>.
                    </DialogDescription>
                </DialogHeader>
                <div className="p-5">
                    <Label className="text-text-main mb-2 block text-xs font-semibold">Folder Tujuan</Label>
                    <div className="border-surface-border bg-surface-card/50 overflow-hidden rounded-xl border">
                        <div className="custom-scrollbar max-h-56 space-y-1 overflow-y-auto p-1.5">
                            <button
                                type="button"
                                className={cn(
                                    'flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold transition-all',
                                    targetFolderId === null ? 'bg-primary text-primary-foreground' : 'text-text-main hover:bg-surface-muted',
                                )}
                                onClick={() => setTargetFolderId(null)}
                            >
                                <Folder size={14} className={cn(targetFolderId === null ? 'fill-current' : 'text-amber-500')} />
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
                                            targetFolderId === f.id ? 'bg-primary text-primary-foreground' : 'text-text-main hover:bg-surface-muted',
                                        )}
                                        onClick={() => setTargetFolderId(f.id)}
                                    >
                                        <Folder size={14} className={cn(targetFolderId === f.id ? 'fill-current' : 'text-amber-500')} />
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
                        onClick={handleMove}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 size={14} className="mr-1.5 animate-spin" />
                                <span>Memindahkan...</span>
                            </>
                        ) : (
                            <span>Pindahkan Sekarang</span>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
