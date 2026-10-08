import { Icons } from '@/components/ui';
import { Button } from '@/components/ui/buttons/Button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialogs/Dialog';
import { Label } from '@/components/ui/forms/Label';
import { Input } from '@/components/ui/inputs/Input';
import React, { useState } from 'react';
import { templateService } from '../../services/templateService';

const { Edit3, Loader2 } = Icons;

interface RenameModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    target: { type: 'folder' | 'template'; id: string; name: string; description?: string | null } | null;
}

export function RenameModal({ isOpen, onOpenChange, target }: RenameModalProps) {
    const [name, setName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    React.useEffect(() => {
        if (isOpen && target) {
            setName(target.name);
        }
    }, [isOpen, target]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!target || !name.trim() || isSubmitting) return;

        setIsSubmitting(true);
        if (target.type === 'folder') {
            templateService.updateFolder(
                target.id,
                { name: name.trim() },
                {
                    onSuccess: () => onOpenChange(false),
                    onFinish: () => setIsSubmitting(false),
                },
            );
        } else {
            templateService.updateTemplate(
                target.id,
                { name: name.trim(), description: target.description },
                {
                    onSuccess: () => onOpenChange(false),
                    onFinish: () => setIsSubmitting(false),
                },
            );
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="border-surface-border bg-surface-base overflow-hidden border p-0 shadow-2xl sm:max-w-[420px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader className="bg-surface-muted/40 border-surface-border border-b p-5">
                        <DialogTitle className="text-text-main flex items-center gap-2 text-sm font-bold">
                            <Edit3 size={16} className="text-amber-500" /> Ubah Nama {target?.type === 'folder' ? 'Folder' : 'Dokumen'}
                        </DialogTitle>
                        <DialogDescription className="text-text-desc mt-0.5 text-xs">
                            Ubah nama untuk "{target?.name}".
                        </DialogDescription>
                    </DialogHeader>
                    <div className="p-5">
                        <Label htmlFor="rename-input" className="text-text-main mb-2 block text-xs font-semibold">
                            Nama Baru
                        </Label>
                        <Input
                            id="rename-input"
                            className="h-10 text-xs"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            autoFocus
                            required
                        />
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
                            type="submit"
                            variant="primary"
                            size="sm"
                            className="h-9 px-5 text-xs font-semibold"
                            disabled={!name.trim() || isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={14} className="mr-1.5 animate-spin" />
                                    <span>Menyimpan...</span>
                                </>
                            ) : (
                                <span>Terapkan Perubahan</span>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
