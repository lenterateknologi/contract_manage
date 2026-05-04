import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/overlays/Dialog';
import { Button } from '@/components/ui/base/Button';

interface Props {
    open: boolean;
    onClose: () => void;
    onSubmit: (note: string) => Promise<void>;
}

export default function ApproveModal({ open, onClose, onSubmit }: Props) {
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await onSubmit(note);
            onClose();
            setNote('');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <i className="fa-solid fa-circle-check text-emerald-500" />
                        Setujui Kontrak
                    </DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <p className="mb-4 text-sm text-muted-foreground">
                        Apakah Anda yakin ingin menyetujui kontrak ini? Anda dapat memberikan catatan approval (opsional).
                    </p>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                            Catatan Approval
                        </label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            rows={3}
                            placeholder="Tambahkan catatan approval..."
                            className="w-full resize-none rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-foreground outline-none focus:border-primary transition-all"
                        />
                    </div>
                </div>
                <DialogFooter className="flex gap-2">
                    <Button variant="outline" onClick={onClose} disabled={loading} className="flex-1">
                        Batal
                    </Button>
                    <Button variant="primary" onClick={handleSubmit} disabled={loading} className="flex-1">
                        {loading ? <i className="fa-solid fa-spinner fa-spin mr-2" /> : <i className="fa-solid fa-check mr-2" />}
                        Konfirmasi Setuju
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
