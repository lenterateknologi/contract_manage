import { Modal } from '@/components/ui/overlays/Modal';
import { Check, Eye, Loader2, Send } from 'lucide-react';
import { useState } from 'react';

interface ReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    step: any;
    idx: number;
    showToast: (message: string, type?: 'success' | 'danger' | 'info') => void;
}

export function ReviewModal({ isOpen, onClose, step, idx, showToast }: ReviewModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newCommentText, setNewCommentText] = useState('');
    const [reviewComments, setReviewComments] = useState<{ id: string; user: string; role: string; text: string; time: string }[]>([
        {
            id: '1',
            user: 'Rian Anggara',
            role: 'Legal Staff',
            text: 'Mohon periksa klausul ganti rugi di pasal 8, sepertinya perlu disesuaikan dengan limitasi tanggung jawab.',
            time: '10:15',
        },
        {
            id: '2',
            user: 'Siti Rahma',
            role: 'VP Legal',
            text: 'Klausul pembayaran di pasal 4 sudah sesuai dengan termin kontrak standard kita.',
            time: '11:30',
        },
    ]);

    const handleClose = () => {
        setNewCommentText('');
        onClose();
    };

    const handleAddComment = () => {
        if (newCommentText.trim()) {
            setReviewComments((prev) => [
                ...prev,
                {
                    id: String(Date.now()),
                    user: 'Administrator',
                    role: 'WORKFLOW DESIGNER',
                    text: newCommentText,
                    time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
                },
            ]);
            setNewCommentText('');
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 shadow-inner">
                        <Eye size={20} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold tracking-wider text-slate-900 uppercase dark:text-white">Simulasi Peninjauan & Markup</h3>
                        <p className="mt-0.5 text-[10px] font-medium text-slate-400 uppercase">Tahap {idx + 1} • Reviewer Kolaboratif</p>
                    </div>
                </div>
            }
            maxWidth="full"
        >
            <div className="grid max-h-[70vh] min-h-[500px] grid-cols-12 gap-8">
                {/* Left Pane: Document Preview */}
                <div className="col-span-7 flex min-h-0 flex-col gap-3 text-left">
                    <div className="flex items-center justify-between px-1">
                        <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase">Draf Kontrak Hukum (Simulasi)</span>
                        <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold tracking-wider text-emerald-600 uppercase">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Dilindungi
                        </div>
                    </div>

                    <div className="relative flex-1 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-8 font-serif text-xs leading-relaxed text-slate-700 shadow-inner select-none dark:border-slate-800 dark:bg-black/30 dark:text-slate-300">
                        {/* Watermark */}
                        <div className="pointer-events-none absolute inset-0 flex rotate-12 items-center justify-center text-6xl font-black uppercase opacity-[0.02] select-none dark:opacity-[0.03]">
                            DRAFT SIMULASI
                        </div>

                        <div className="mb-6 text-center text-[13px] font-bold tracking-wider text-slate-900 uppercase dark:text-white">
                            SURAT PERJANJIAN KERJASAMA PENYEDIAAN JASA TEKNOLOGI INFORMASI
                        </div>

                        <p className="mb-4">
                            Yang bertanda tangan di bawah ini, selanjutnya disebut sebagai <strong>Pihak Pertama</strong> (Penyedia) dan{' '}
                            <strong>Pihak Kedua</strong> (Mitra Kerja/Klien), dengan ini sepakat untuk mengikatkan diri dalam perjanjian kerjasama
                            dengan syarat-syarat sebagai berikut:
                        </p>

                        <h5 className="mb-2 font-bold tracking-wider text-slate-800 uppercase dark:text-slate-200">
                            PASAL 1 - RUANG LINGKUP PEKERJAAN
                        </h5>
                        <p className="mb-4">
                            Penyedia setuju untuk menyediakan jasa pengembangan perangkat lunak berupa modul Contract Builder beserta workflow engine
                            terintegrasi sesuai spesifikasi teknis lampiran A.
                        </p>

                        <h5 className="mb-2 font-bold tracking-wider text-slate-800 uppercase dark:text-slate-200">PASAL 4 - TERMIN PEMBAYARAN</h5>
                        <p className="mb-4">
                            Pembayaran atas pelaksanaan kontrak ini wajib dibayarkan oleh Pihak Kedua secara bertahap. Termin pertama sebesar 30%
                            dibayarkan selambat-lambatnya{' '}
                            <span
                                className="inline-block cursor-help rounded-md border border-indigo-200 bg-indigo-100 px-1.5 py-0.5 font-bold text-indigo-900 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-300"
                                title="Termin pembayaran standard adalah 30 hari. Mohon periksa kembali."
                            >
                                14 hari kerja
                            </span>{' '}
                            setelah invoice dan berita acara serah terima pekerjaan (BAST) diterima oleh Pihak Kedua.
                        </p>

                        <h5 className="mb-2 font-bold tracking-wider text-slate-800 uppercase dark:text-slate-200">
                            PASAL 8 - BATASAN TANGGUNG JAWAB (LIABILITAS)
                        </h5>
                        <p className="mb-4">
                            Total kewajiban ganti rugi atau liabilitas dari Penyedia atas segala klaim yang timbul dari perjanjian kerjasama ini
                            dibatasi maksimal sebesar{' '}
                            <span
                                className="inline-block cursor-help rounded-md border border-amber-200 bg-amber-100 px-1.5 py-0.5 font-bold text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                title="Batas limit ganti rugi maksimal 200% dinilai terlalu tinggi untuk standard resiko kita. Direkomendasikan 100%."
                            >
                                200% dari nilai kontrak
                            </span>{' '}
                            yang disepakati oleh kedua belah pihak.
                        </p>

                        <h5 className="mb-2 font-bold tracking-wider text-slate-800 uppercase dark:text-slate-200">PASAL 12 - FORCE MAJEURE</h5>
                        <p className="mb-4">
                            Keadaan kahar yang dibenarkan dalam perjanjian ini mencakup bencana alam, huru-hara, epidemi, perang, serta perubahan
                            kebijakan regulasi pemerintah yang berdampak langsung pada kelancaran operasional.
                        </p>
                    </div>
                </div>

                {/* Right Pane: Review Comments & Discussion */}
                <div className="col-span-5 flex min-h-0 flex-col gap-3 border-l border-slate-100 pl-8 text-left dark:border-slate-800">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                            Thread Review & Diskusi ({reviewComments.length})
                        </span>
                        <span className="text-right text-[9px] font-black text-indigo-500 uppercase">Kolaborasi Aktif</span>
                    </div>

                    {/* Chat Messages */}
                    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto rounded-2xl border border-slate-100 bg-slate-50/20 p-4 dark:border-slate-800 dark:bg-black/10">
                        {reviewComments.map((comment) => (
                            <div key={comment.id} className="flex gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-[10px] font-black text-slate-600 uppercase shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                    {comment.user
                                        .split(' ')
                                        .map((n) => n[0])
                                        .join('')}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-baseline gap-2">
                                        <span className="max-w-[120px] truncate text-[10px] font-black text-slate-700 uppercase dark:text-slate-200">
                                            {comment.user}
                                        </span>
                                        <span className="max-w-[120px] truncate rounded-md border border-slate-200/50 bg-slate-100 px-1.5 py-0.5 text-[8px] leading-none font-bold tracking-wider text-slate-400 uppercase dark:border-slate-700 dark:bg-slate-800">
                                            {comment.role}
                                        </span>
                                        <span className="ml-auto shrink-0 text-[8px] font-bold text-slate-400 uppercase">{comment.time}</span>
                                    </div>
                                    <div className="mt-1.5 rounded-2xl rounded-tl-none border border-slate-100 bg-white p-3 text-[11px] leading-relaxed font-medium whitespace-pre-wrap text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                                        {comment.text}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Input Comment */}
                    <div className="flex items-end gap-2 pt-2">
                        <textarea
                            value={newCommentText}
                            onChange={(e) => setNewCommentText(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleAddComment();
                                }
                            }}
                            placeholder="Tulis masukan review Anda di sini..."
                            className="max-h-[100px] min-h-[50px] flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-[11px] font-bold transition-all outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-800 dark:bg-black/20 dark:text-white"
                        />
                        <button
                            type="button"
                            disabled={!newCommentText.trim()}
                            onClick={handleAddComment}
                            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/10 transition-all hover:bg-indigo-700 active:scale-95 disabled:opacity-40"
                        >
                            <Send size={14} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-6 dark:border-slate-800">
                <button
                    type="button"
                    onClick={handleClose}
                    className="rounded-xl border border-slate-200 px-5 py-2.5 text-[10px] font-black text-slate-500 uppercase transition-all hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-900"
                >
                    Tutup
                </button>
                <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => {
                        setIsSubmitting(true);
                        setTimeout(() => {
                            setIsSubmitting(false);
                            showToast('Simulasi Review & Markup selesai!', 'success');
                            handleClose();
                        }, 850);
                    }}
                    className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-[10px] font-black text-white uppercase shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.02] hover:bg-indigo-700 active:scale-[0.98]"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 size={12} className="animate-spin" />
                            Menyimpan...
                        </>
                    ) : (
                        <>
                            <Check size={12} />
                            Selesaikan Review
                        </>
                    )}
                </button>
            </div>
        </Modal>
    );
}
