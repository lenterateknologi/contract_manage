import { Modal } from '@/components/ui/overlays/Modal';
import { AlertCircle, FileText, Loader2, Paperclip, XCircle } from 'lucide-react';
import { useState } from 'react';

interface RejectModalProps {
    isOpen: boolean;
    onClose: () => void;
    step: any;
    idx: number;
    showToast: (message: string, type?: 'success' | 'danger' | 'info') => void;
}

export function RejectModal({ isOpen, onClose, step, idx, showToast }: RejectModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [rejectAttachment, setRejectAttachment] = useState<File | null>(null);

    const handleClose = () => {
        setRejectReason('');
        setRejectAttachment(null);
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600 shadow-inner">
                        <XCircle size={20} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold tracking-wider text-slate-900 uppercase dark:text-white">Simulasi Penolakan</h3>
                        <p className="mt-0.5 text-[10px] font-medium text-slate-400 uppercase">Kontrak akan dikembalikan</p>
                    </div>
                </div>
            }
            maxWidth="lg"
        >
            <div className="space-y-5 text-left">
                {/* Rejection Alert */}
                <div className="flex gap-3 rounded-2xl border border-l-4 border-rose-500/30 border-y-transparent border-r-transparent bg-gradient-to-r from-rose-500/10 to-rose-500/[0.02] p-4 shadow-sm">
                    <AlertCircle size={16} className="mt-0.5 shrink-0 animate-pulse text-rose-500" />
                    <div className="text-[11px] leading-relaxed font-medium text-rose-700 dark:text-rose-400">
                        <strong>Pemberitahuan Rejeksi:</strong> Kontrak akan dikembalikan ke{' '}
                        <strong>TAHAP 1 (INISIATOR)</strong> untuk direvisi sesuai alasan penolakan di
                        bawah.
                    </div>
                </div>

                {/* Alasan Penolakan (Mandatory) */}
                <div className="space-y-1.5">
                    <label className="px-1 text-[9px] font-black text-slate-400 uppercase">
                        Alasan Penolakan <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Harap berikan alasan penolakan yang rinci agar inisiator/pihak sebelumnya dapat merevisi dengan tepat..."
                        className="min-h-[110px] w-full resize-none rounded-2xl border border-slate-200 bg-slate-50/50 p-4 text-[11px] font-bold transition-all outline-none focus:border-rose-500 focus:bg-white dark:border-slate-800 dark:bg-black/20 dark:text-white"
                        required
                    />
                </div>

                {/* Rejection Attachment */}
                <div className="space-y-1.5">
                    <label className="px-1 text-[9px] font-black text-slate-400 uppercase">Bukti / Dokumen Pendukung (Opsional)</label>
                    <div className="relative flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/30 p-5 transition-all hover:border-rose-400 dark:border-slate-800 dark:bg-black/10">
                        <input
                            type="file"
                            id={`reject-file-${step.id}`}
                            className="hidden"
                            onChange={(e) => setRejectAttachment(e.target.files?.[0] || null)}
                        />
                        {rejectAttachment ? (
                            <div className="flex w-full flex-col items-center gap-2">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600">
                                    <FileText size={20} />
                                </div>
                                <div className="text-center">
                                    <p className="max-w-[280px] truncate text-[10px] font-black text-slate-700 uppercase dark:text-slate-300">
                                        {rejectAttachment.name}
                                    </p>
                                    <p className="mt-0.5 text-[9px] font-bold text-slate-400 uppercase">
                                        {(rejectAttachment.size / 1024).toFixed(1)} KB
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setRejectAttachment(null)}
                                    className="mt-1 text-[9px] font-black text-rose-500 uppercase hover:underline"
                                >
                                    Hapus Lampiran
                                </button>
                            </div>
                        ) : (
                            <label htmlFor={`reject-file-${step.id}`} className="flex w-full cursor-pointer flex-col items-center gap-2 text-center">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800">
                                    <Paperclip size={18} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-600 uppercase dark:text-slate-300">Pilih File Bukti</p>
                                    <p className="mt-0.5 text-[9px] font-bold text-slate-400 uppercase">PDF, PNG, JPG (MAX 10MB)</p>
                                </div>
                            </label>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-6 dark:border-slate-800">
                <button
                    type="button"
                    onClick={handleClose}
                    className="rounded-xl border border-slate-200 px-5 py-2.5 text-[10px] font-black text-slate-500 uppercase transition-all hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-900"
                >
                    Batal
                </button>
                <button
                    type="button"
                    disabled={isSubmitting || !rejectReason.trim()}
                    onClick={() => {
                        setIsSubmitting(true);
                        setTimeout(() => {
                            setIsSubmitting(false);
                            showToast('Simulasi Penolakan berhasil!', 'success');
                            handleClose();
                        }, 850);
                    }}
                    className="flex items-center gap-2 rounded-xl bg-rose-600 px-6 py-2.5 text-[10px] font-black text-white uppercase shadow-lg shadow-rose-600/20 transition-all hover:scale-[1.02] hover:bg-rose-700 active:scale-[0.98] disabled:opacity-50"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 size={12} className="animate-spin" />
                            Memproses...
                        </>
                    ) : (
                        <>
                            <XCircle size={12} />
                            Tolak Kontrak
                        </>
                    )}
                </button>
            </div>
        </Modal>
    );
}
