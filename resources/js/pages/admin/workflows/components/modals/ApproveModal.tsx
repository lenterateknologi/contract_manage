import { SearchableSelect } from '@/components/ui/forms/SearchableSelect';
import { Modal } from '@/components/ui/overlays/Modal';
import { CheckCircle2, FileText, Info, Loader2, Paperclip, PenTool } from 'lucide-react';
import { useState } from 'react';

interface ApproveModalProps {
    isOpen: boolean;
    onClose: () => void;
    step: any;
    idx: number;
    userOptions: any[];
    showToast: (message: string, type?: 'success' | 'danger' | 'info') => void;
}

export function ApproveModal({ isOpen, onClose, step, idx, userOptions, showToast }: ApproveModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [approveNote, setApproveNote] = useState('');
    const [approveAttachment, setApproveAttachment] = useState<File | null>(null);
    const [signingP1, setSigningP1] = useState('');
    const [signingP2, setSigningP2] = useState('');
    const [signingSequence, setSigningSequence] = useState<'legal' | 'initiator'>('legal');

    const handleClose = () => {
        setApproveNote('');
        setApproveAttachment(null);
        setSigningP1('');
        setSigningP2('');
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 shadow-inner">
                        <CheckCircle2 size={20} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold tracking-wider text-slate-900 uppercase dark:text-white">Simulasi Persetujuan</h3>
                        <p className="mt-0.5 text-[10px] font-medium text-slate-400 uppercase">
                            Tahap {idx + 1}: {step.step_type || 'APPROVAL'}
                        </p>
                    </div>
                </div>
            }
            maxWidth="lg"
        >
            {step.step_type === 'SIGNING' ? (
                <div className="space-y-6">
                    <div className="flex gap-3 rounded-2xl border border-amber-500/10 bg-amber-500/5 p-4">
                        <Info size={16} className="mt-0.5 shrink-0 text-amber-500" />
                        <div className="text-[11px] leading-relaxed font-medium text-amber-700 dark:text-amber-400">
                            <strong>Tahap Penandatanganan:</strong> Harap tentukan perwakilan penandatangan untuk Pihak Pertama dan Pihak Kedua.
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-left">
                        {/* Pihak 1 */}
                        <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-black/20">
                            <div className="mb-3 flex items-center gap-2">
                                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/10 text-[10px] font-black text-emerald-600">
                                    P1
                                </div>
                                <span className="text-[10px] font-black tracking-wider text-slate-600 uppercase dark:text-slate-300">
                                    Pihak Pertama
                                </span>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black tracking-wider text-slate-400 uppercase">Penandatangan</label>
                                <SearchableSelect
                                    value={signingP1}
                                    onValueChange={setSigningP1}
                                    options={userOptions}
                                    placeholder="Pilih Penandatangan..."
                                />
                            </div>
                        </div>

                        {/* Pihak 2 */}
                        <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-black/20">
                            <div className="mb-3 flex items-center gap-2">
                                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-500/10 text-[10px] font-black text-blue-600">
                                    P2
                                </div>
                                <span className="text-[10px] font-black tracking-wider text-slate-600 uppercase dark:text-slate-300">
                                    Pihak Kedua
                                </span>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black tracking-wider text-slate-400 uppercase">Penandatangan</label>
                                <SearchableSelect
                                    value={signingP2}
                                    onValueChange={setSigningP2}
                                    options={userOptions}
                                    placeholder="Pilih Penandatangan..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2 text-left">
                        <label className="px-1 text-[9px] font-black text-slate-400 uppercase">Urutan Penandatanganan (Sequence)</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setSigningSequence('legal')}
                                className={`rounded-2xl border-2 p-3.5 text-left transition-all ${
                                    signingSequence === 'legal'
                                        ? 'border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10'
                                        : 'border-slate-100 bg-slate-50/30 hover:border-slate-200 dark:border-slate-800'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <div
                                        className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${signingSequence === 'legal' ? 'border-emerald-500 text-emerald-500' : 'border-slate-300'}`}
                                    >
                                        {signingSequence === 'legal' && <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                                    </div>
                                    <span className="text-[10px] font-black tracking-wider text-slate-700 uppercase dark:text-slate-200">
                                        Legal Dulu
                                    </span>
                                </div>
                                <p className="mt-1 px-6 text-[9px] font-medium text-slate-400 uppercase">
                                    Sequence: Pihak Pertama (Legal/P1) Menandatangani Lebih Dulu.
                                </p>
                            </button>
                            <button
                                type="button"
                                onClick={() => setSigningSequence('initiator')}
                                className={`rounded-2xl border-2 p-3.5 text-left transition-all ${
                                    signingSequence === 'initiator'
                                        ? 'border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10'
                                        : 'border-slate-100 bg-slate-50/30 hover:border-slate-200 dark:border-slate-800'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <div
                                        className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${signingSequence === 'initiator' ? 'border-emerald-500 text-emerald-500' : 'border-slate-300'}`}
                                    >
                                        {signingSequence === 'initiator' && <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                                    </div>
                                    <span className="text-[10px] font-black tracking-wider text-slate-700 uppercase dark:text-slate-200">
                                        Inisiator Dulu
                                    </span>
                                </div>
                                <p className="mt-1 px-6 text-[9px] font-medium text-slate-400 uppercase">
                                    Sequence: Pihak Kedua (Inisiator/P2) Menandatangani Lebih Dulu.
                                </p>
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50/30 p-4 dark:border-slate-800 dark:bg-black/10">
                        <PenTool size={20} className="text-slate-400" />
                        <span className="text-center text-[10px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                            E-Meterai & Tanda Tangan Digital akan Dibubuhkan Otomatis
                        </span>
                    </div>
                </div>
            ) : (
                <div className="space-y-5 text-left">
                    <div className="space-y-1.5">
                        <label className="px-1 text-[9px] font-black text-slate-400 uppercase">Catatan Persetujuan</label>
                        <textarea
                            value={approveNote}
                            onChange={(e) => setApproveNote(e.target.value)}
                            placeholder="Masukkan catatan atau memo persetujuan (opsional)..."
                            className="min-h-[100px] w-full resize-none rounded-2xl border border-slate-200 bg-slate-50/50 p-4 text-[11px] font-bold transition-all outline-none focus:border-emerald-500 focus:bg-white dark:border-slate-800 dark:bg-black/20 dark:text-white"
                        />
                    </div>

                    {/* Interactive File Attachment */}
                    <div className="space-y-1.5">
                        <label className="px-1 text-[9px] font-black text-slate-400 uppercase">Lampiran Pendukung (Opsional)</label>
                        <div className="relative flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/30 p-6 transition-all hover:border-emerald-400 dark:border-slate-800 dark:bg-black/10">
                            <input
                                type="file"
                                id={`approve-file-${step.id}`}
                                className="hidden"
                                onChange={(e) => setApproveAttachment(e.target.files?.[0] || null)}
                            />
                            {approveAttachment ? (
                                <div className="flex w-full flex-col items-center gap-2">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                                        <FileText size={20} />
                                    </div>
                                    <div className="text-center">
                                        <p className="max-w-[280px] truncate text-[10px] font-black text-slate-700 uppercase dark:text-slate-300">
                                            {approveAttachment.name}
                                        </p>
                                        <p className="mt-0.5 text-[9px] font-bold text-slate-400 uppercase">
                                            {(approveAttachment.size / 1024).toFixed(1)} KB
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setApproveAttachment(null)}
                                        className="mt-1 text-[9px] font-black text-rose-500 uppercase hover:underline"
                                    >
                                        Hapus Lampiran
                                    </button>
                                </div>
                            ) : (
                                <label
                                    htmlFor={`approve-file-${step.id}`}
                                    className="flex w-full cursor-pointer flex-col items-center gap-2 text-center"
                                >
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800">
                                        <Paperclip size={18} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-600 uppercase dark:text-slate-300">Pilih File Pendukung</p>
                                        <p className="mt-0.5 text-[9px] font-bold text-slate-400 uppercase">PDF, PNG, JPG (MAX 10MB)</p>
                                    </div>
                                </label>
                            )}
                        </div>
                    </div>
                </div>
            )}

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
                    disabled={isSubmitting || (step.step_type === 'SIGNING' && (!signingP1 || !signingP2))}
                    onClick={() => {
                        setIsSubmitting(true);
                        setTimeout(() => {
                            setIsSubmitting(false);
                            showToast(
                                step.step_type === 'SIGNING' ? 'Simulasi Setup Penandatanganan berhasil!' : 'Simulasi Persetujuan berhasil!',
                                'success',
                            );
                            handleClose();
                        }, 850);
                    }}
                    className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-[10px] font-black text-white uppercase shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.02] hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 size={12} className="animate-spin" />
                            Memproses...
                        </>
                    ) : (
                        <>
                            <CheckCircle2 size={12} />
                            Kirim Persetujuan
                        </>
                    )}
                </button>
            </div>
        </Modal>
    );
}
