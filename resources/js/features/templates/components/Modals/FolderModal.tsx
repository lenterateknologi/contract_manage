import { Icons } from '@/components/ui';
import { Button } from '@/components/ui/buttons/Button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialogs/Dialog';
import { Label } from '@/components/ui/forms/Label';
import { Input } from '@/components/ui/inputs/Input';
import React, { useState } from 'react';
import { templateService } from '../../services/templateService';
import { TemplateFolder } from '../../types';

const { FolderPlus, Loader2 } = Icons;

interface FolderModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    parentId: string | null;
    folders: TemplateFolder[];
}

export function FolderModal({ isOpen, onOpenChange, parentId, folders }: FolderModalProps) {
    const [name, setName] = useState('');
    const [selectedParentId, setSelectedParentId] = useState<string | null>(parentId);
    const [isSubmitting, setIsSubmitting] = useState(false);

    React.useEffect(() => {
        if (isOpen) {
            setName('');
            setSelectedParentId(parentId);
        }
    }, [isOpen, parentId]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || isSubmitting) return;

        setIsSubmitting(true);
        templateService.createFolder(
            { name: name.trim(), parent_id: selectedParentId },
            {
                onSuccess: () => {
                    onOpenChange(false);
                    setName('');
                },
                onFinish: () => setIsSubmitting(false),
            },
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="border-surface-border bg-surface-base overflow-hidden border p-0 shadow-2xl sm:max-w-[450px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader className="bg-surface-muted/40 border-surface-border border-b p-5">
                        <DialogTitle className="text-text-main flex items-center gap-2 text-sm font-bold">
                            <FolderPlus size={16} className="text-primary" /> Buat Folder Baru
                        </DialogTitle>
                        <DialogDescription className="text-text-desc mt-0.5 text-xs">
                            Folder digunakan untuk mengelompokkan template kontrak agar rapi dan terstruktur.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 p-5">
                        <div className="grid gap-1.5">
                            <Label htmlFor="folder-name" className="text-text-main text-xs font-semibold">
                                Nama Folder
                            </Label>
                            <Input
                                id="folder-name"
                                placeholder="misal: NDA & Kerahasiaan, Perjanjian Sewa..."
                                className="h-10 text-xs"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                autoFocus
                                required
                            />
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="parent-folder" className="text-text-main text-xs font-semibold">
                                Lokasi Folder Induk (Parent)
                            </Label>
                            <select
                                id="parent-folder"
                                value={selectedParentId || ''}
                                onChange={(e) => setSelectedParentId(e.target.value || null)}
                                className="border-surface-border bg-surface-card text-text-main focus:border-primary h-9 w-full rounded-lg border px-3 text-xs outline-none"
                            >
                                <option value="">Repository Root (Folder Utama)</option>
                                {folders
                                    .sort((a, b) => a.name.localeCompare(b.name))
                                    .map((f) => (
                                        <option key={f.id} value={f.id}>
                                            📁 {f.name}
                                        </option>
                                    ))}
                            </select>
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
                                <span>Buat Folder</span>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
