import * as React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialogs/Dialog';
import { Button } from '@/components/ui/buttons/Button';

interface PageDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description?: string;
    onSubmit?: (e: React.FormEvent) => void;
    children: React.ReactNode;
    processing?: boolean;
    submitLabel?: string;
    cancelLabel?: string;
    maxWidthClassName?: string;
}

export function PageDialog({
    open,
    onOpenChange,
    title,
    description,
    onSubmit,
    children,
    processing = false,
    submitLabel = 'Simpan',
    cancelLabel = 'Batal',
    maxWidthClassName = 'max-w-md',
}: PageDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={maxWidthClassName}>
                <DialogTitle>{title}</DialogTitle>
                {description && <DialogDescription>{description}</DialogDescription>}
                
                <form onSubmit={onSubmit} className="space-y-4 mt-2">
                    <div className="max-h-[60svh] overflow-y-auto pr-1 py-1 space-y-4 custom-scrollbar">
                        {children}
                    </div>
                    
                    <div className="flex justify-end gap-2 pt-4 border-t border-border mt-4">
                        <Button type="button" variant="white" onClick={() => onOpenChange(false)}>
                            {cancelLabel}
                        </Button>
                        <Button type="submit" variant="primary" disabled={processing}>
                            {processing ? 'Menyimpan...' : submitLabel}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
