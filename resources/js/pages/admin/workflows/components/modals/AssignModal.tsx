import { SearchableSelect } from '@/components/ui/forms/SearchableSelect';
import { Modal } from '@/components/ui/overlays/Modal';
import { Info, Loader2, UserCheck } from 'lucide-react';
import { useState } from 'react';

interface AssignModalProps {
    isOpen: boolean;
    onClose: () => void;
    legalUserOptions: any[];
    showToast: (message: string, type?: 'success' | 'danger' | 'info') => void;
}

export function AssignModal({ isOpen, onClose, legalUserOptions, showToast }: AssignModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [assignedPicId, setAssignedPicId] = useState('');
    const [assignNote, setAssignNote] = useState('');

    const handleClose = () => {
        setAssignedPicId('');
        setAssignNote('');
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 shadow-inner">
                        <UserCheck size={20} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold tracking-wider text-slate-900 uppercase dark:text-white">Simulasi Penugasan PIC</h3>
                        <p className="mt-0.5 text-[10px] font-medium text-slate-400 uppercase">Pilih PIC untuk Memproses Tahap Ini</p>
                    </div>
                </div>
            }
            maxWidth="lg"
        >
            <div className="space-y-5 text-left">
                {/* PIC Dropdown */}
                <div className="space-y-1.5">
                    <label className="px-1 text-[9px] font-black text-slate-400 uppercase">
                        Pilih PIC Legal / Staff <span className="text-rose-500">*</span>
                    </label>
                    <SearchableSelect
                        value={assignedPicId}
                        onValueChange={setAssignedPicId}
                        options={legalUserOptions}
                        placeholder="Cari & Pilih PIC Staff..."
                    />
                </div>

                {/* Info PIC */}
                <div className="flex gap-3 rounded-2xl border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-900/30 dark:bg-blue-950/20">
                    <Info size={16} className="mt-0.5 shrink-0 text-blue-500" />
                    <div className="text-[10px] leading-relaxed font-medium text-blue-700 dark:text-blue-400">
                        <strong>Alur Penugasan:</strong> PIC yang ditugaskan akan menerima pemberitahuan email & notifikasi sistem untuk segera
                        memproses tinjauan kontrak ini.
                    </div>
                </div>

                {/* Catatan / Instruksi */}
                <div className="space-y-1.5">
                    <label className="px-1 text-[9px] font-black text-slate-400 uppercase">Catatan / Instruksi Tambahan</label>
                    <textarea
                        value={assignNote}
                        onChange={(e) => setAssignNote(e.target.value)}
                        placeholder="Tulis instruksi khusus mengenai apa saja yang perlu difokuskan dalam peninjauan ini..."
                        className="min-h-[90px] w-full resize-none rounded-2xl border border-slate-200 bg-slate-50/50 p-4 text-[11px] font-bold transition-all outline-none focus:border-blue-500 focus:bg-white dark:border-slate-800 dark:bg-black/20 dark:text-white"
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
                    disabled={isSubmitting || !assignedPicId}
                    onClick={() => {
                        setIsSubmitting(true);
                        setTimeout(() => {
                            setIsSubmitting(false);
                            const picName = legalUserOptions.find((o) => o.value === assignedPicId)?.label || 'PIC';
                            showToast(`Simulasi Penugasan PIC kepada ${picName.split(' (')[0]} berhasil!`, 'success');
                            handleClose();
                        }, 850);
                    }}
                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-[10px] font-black text-white uppercase shadow-lg shadow-blue-600/20 transition-all hover:scale-[1.02] hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 size={12} className="animate-spin" />
                            Memproses...
                        </>
                    ) : (
                        <>
                            <UserCheck size={12} />
                            Tugaskan PIC
                        </>
                    )}
                </button>
            </div>
        </Modal>
    );
}
