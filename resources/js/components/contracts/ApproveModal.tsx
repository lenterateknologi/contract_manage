import { useState, useRef } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/overlays/Dialog';
import { Button } from '@/components/ui/base/Button';
import { Paperclip, X } from 'lucide-react';

interface Props {
    open: boolean;
    onClose: () => void;
    onSubmit: (note: string, attachment?: File) => Promise<void>;
}

export default function ApproveModal({ open, onClose, onSubmit }: Props) {
    const [note, setNote] = useState('');
    const [attachment, setAttachment] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await onSubmit(note, attachment || undefined);
            onClose();
            setNote('');
            setAttachment(null);
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
                <div className="py-4 space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Apakah Anda yakin ingin menyetujui kontrak ini? Anda dapat memberikan catatan approval dan lampiran (opsional).
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

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                            Lampiran Pendukung (Optional)
                        </label>
                        <div className="mt-1">
                            {!attachment ? (
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border py-4 text-muted-foreground transition-all hover:border-primary hover:text-primary"
                                >
                                    <Paperclip size={16} />
                                    <span className="text-xs font-medium">Klik untuk lampirkan file</span>
                                </button>
                            ) : (
                                <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <Paperclip size={14} className="text-primary shrink-0" />
                                        <span className="truncate text-xs font-medium">{attachment.name}</span>
                                    </div>
                                    <button
                                        onClick={() => setAttachment(null)}
                                        className="text-muted-foreground hover:text-rose-500 transition-colors"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            )}
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                onChange={(e) => setAttachment(e.target.files?.[0] || null)}
                            />
                        </div>
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
