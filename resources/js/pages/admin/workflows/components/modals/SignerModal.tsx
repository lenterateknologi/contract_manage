import { SearchableSelect } from '@/components/ui/forms/SearchableSelect';
import { Modal } from '@/components/ui/overlays/Modal';
import { Info, Loader2, PenTool } from 'lucide-react';
import { useState } from 'react';

interface SignerModalProps {
    isOpen: boolean;
    onClose: () => void;
    showToast: (message: string, type?: 'success' | 'danger' | 'info') => void;
    signerOptions?: { value: string; label: string }[];
}

const DEFAULT_SIGNER_OPTIONS = [
    { value: 'initiator', label: 'Inisiator Kontrak (Initiator)' },
    { value: 'pic', label: 'PIC Ditugaskan (PIC)' },
];

export function SignerModal({
    isOpen,
    onClose,
    showToast,
    signerOptions = DEFAULT_SIGNER_OPTIONS,
}: SignerModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [signerId, setSignerId] = useState('');
    const [signerNote, setSignerNote] = useState('');

    const handleClose = () => {
        setSignerId('');
        setSignerNote('');
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 shadow-inner">
                        <PenTool size={20} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold tracking-wider text-slate-900 uppercase dark:text-white">Simulasi Penandatanganan Kontrak</h3>
                        <p className="mt-0.5 text-[10px] font-medium text-slate-400 uppercase">Pilih Aktor yang Akan Menandatangani Kontrak</p>
                    </div>
                </div>
            }
            maxWidth="lg"
        >
            <div className="space-y-5 text-left">
                {/* Signer Dropdown */}
                <div className="space-y-1.5">
                    <label className="px-1 text-[9px] font-black text-slate-400 uppercase">
                        Pilih Penandatangan <span className="text-rose-500">*</span>
                    </label>
                    <SearchableSelect
                        value={signerId}
                        onValueChange={setSignerId}
                        options={signerOptions}
                        placeholder="Cari & Pilih Penandatangan..."
                    />
                </div>

                {/* Info Signer */}
                <div className="flex gap-3 rounded-2xl border border-amber-100 bg-amber-50/50 p-4 dark:border-amber-900/30 dark:bg-amber-950/20">
                    <Info size={16} className="mt-0.5 shrink-0 text-amber-500" />
                    <div className="text-[10px] leading-relaxed font-medium text-amber-700 dark:text-amber-400">
                        <strong>Alur Tanda Tangan:</strong> Penandatangan yang dipilih akan memproses tanda tangan elektronik untuk merampungkan kontrak ini.
                    </div>
                </div>

                {/* Catatan / Instruksi */}
                <div className="space-y-1.5">
                    <label className="px-1 text-[9px] font-black text-slate-400 uppercase">Catatan / Instruksi Tanda Tangan</label>
                    <textarea
                        value={signerNote}
                        onChange={(e) => setSignerNote(e.target.value)}
                        placeholder="Tulis instruksi khusus mengenai penandatanganan ini..."
                        className="min-h-[90px] w-full resize-none rounded-2xl border border-slate-200 bg-slate-50/50 p-4 text-[11px] font-bold transition-all outline-none focus:border-amber-500 focus:bg-white dark:border-slate-800 dark:bg-black/20 dark:text-white"
                    />
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
                    disabled={isSubmitting || !signerId}
                    onClick={() => {
                        setIsSubmitting(true);
                        setTimeout(() => {
                            setIsSubmitting(false);
                            const signerName = signerOptions.find((o) => o.value === signerId)?.label || 'Penandatangan';
                            showToast(`Simulasi Tanda Tangan Kontrak oleh ${signerName.split(' (')[0]} berhasil!`, 'success');
                            handleClose();
                        }, 850);
                    }}
                    className="flex items-center gap-2 rounded-xl bg-amber-600 px-6 py-2.5 text-[10px] font-black text-white uppercase shadow-lg shadow-amber-600/20 transition-all hover:scale-[1.02] hover:bg-amber-700 active:scale-[0.98] disabled:opacity-50"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 size={12} className="animate-spin" />
                            Memproses...
                        </>
                    ) : (
                        <>
                            <PenTool size={12} />
                            Tanda Tangani
                        </>
                    )}
                </button>
            </div>
        </Modal>
    );
}
