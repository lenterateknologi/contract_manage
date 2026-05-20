import { Modal } from '@/components/ui/overlays/Modal';
import { Check, Loader2, Upload } from 'lucide-react';
import React, { useState } from 'react';

interface UploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    step: any;
    showToast: (message: string, type?: 'success' | 'danger' | 'info') => void;
}

export function UploadModal({ isOpen, onClose, step, showToast }: UploadModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [formVersion, setFormVersion] = useState<'F1' | 'F2'>('F1');
    const [uploadChangelog, setUploadChangelog] = useState('');

    const handleClose = () => {
        setUploading(false);
        setUploadProgress(0);
        setUploadedFile(null);
        setFormVersion('F1');
        setUploadChangelog('');
        onClose();
    };

    // Handle interactive simulated upload
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setUploading(true);
            setUploadProgress(0);
            setUploadedFile(null);
            let current = 0;
            const interval = setInterval(() => {
                current += 10;
                if (current >= 100) {
                    clearInterval(interval);
                    setUploading(false);
                    setUploadProgress(100);
                    setUploadedFile(file);
                } else {
                    setUploadProgress(current);
                }
            }, 120);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 shadow-inner">
                        <Upload size={20} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold tracking-wider text-slate-900 uppercase dark:text-white">Simulasi Unggah Dokumen</h3>
                        <p className="mt-0.5 text-[10px] font-medium text-slate-400 uppercase">Unggah Draft Final Hasil TTD / Revisi</p>
                    </div>
                </div>
            }
            maxWidth="lg"
        >
            <div className="space-y-5 text-left">
                {/* Form Version Selection Button Group */}
                <div className="space-y-1.5">
                    <label className="px-1 text-[9px] font-black text-slate-400 uppercase">Versi Formulir (Form Version)</label>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => setFormVersion('F1')}
                            className={`rounded-2xl border-2 p-3.5 text-left transition-all ${
                                formVersion === 'F1'
                                    ? 'border-indigo-500 bg-indigo-500/5 dark:bg-indigo-500/10'
                                    : 'border-slate-100 bg-slate-50/30 hover:border-slate-200 dark:border-slate-800'
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <div
                                    className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${formVersion === 'F1' ? 'border-indigo-500 text-indigo-500' : 'border-slate-300'}`}
                                >
                                    {formVersion === 'F1' && <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />}
                                </div>
                                <span className="text-[10px] font-black tracking-wider text-slate-700 uppercase dark:text-slate-200">
                                    Form F1 (Utama)
                                </span>
                            </div>
                            <p className="mt-1 px-6 text-[9px] font-medium text-slate-400 uppercase">
                                Formulir Standard Kontrak Utama & Klausul Umum.
                            </p>
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormVersion('F2')}
                            className={`rounded-2xl border-2 p-3.5 text-left transition-all ${
                                formVersion === 'F2'
                                    ? 'border-indigo-500 bg-indigo-500/5 dark:bg-indigo-500/10'
                                    : 'border-slate-100 bg-slate-50/30 hover:border-slate-200 dark:border-slate-800'
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <div
                                    className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${formVersion === 'F2' ? 'border-indigo-500 text-indigo-500' : 'border-slate-300'}`}
                                >
                                    {formVersion === 'F2' && <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />}
                                </div>
                                <span className="text-[10px] font-black tracking-wider text-slate-700 uppercase dark:text-slate-200">Form F2</span>
                            </div>
                            <p className="mt-1 px-6 text-[9px] font-medium text-slate-400 uppercase">
                                Formulir Amandemen, Addendum atau Lampiran Khusus.
                            </p>
                        </button>
                    </div>
                </div>

                {/* Upload Area */}
                <div className="space-y-1.5">
                    <label className="px-1 text-[9px] font-black text-slate-400 uppercase">
                        Unggah Draf Dokumen <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                        <input type="file" id={`sim-upload-file-${step.id}`} className="hidden" disabled={uploading} onChange={handleFileChange} />

                        {!uploadedFile && !uploading && (
                            <label
                                htmlFor={`sim-upload-file-${step.id}`}
                                className="flex cursor-pointer flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/20 p-12 text-center transition-all hover:border-indigo-500 hover:bg-indigo-50/5 dark:border-slate-800"
                            >
                                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 shadow-inner transition-transform hover:scale-110">
                                    <Upload size={32} />
                                </div>
                                <div>
                                    <h4 className="text-xs font-black text-slate-800 uppercase dark:text-slate-200">
                                        Tarik & Lepas File Draf di Sini
                                    </h4>
                                    <p className="mt-1.5 text-[9px] font-bold tracking-wider text-slate-400 uppercase">
                                        Atau klik untuk menelusuri dari penyimpanan lokal
                                    </p>
                                </div>
                                <div className="rounded-xl border border-slate-100 bg-white px-3 py-1.5 text-[8px] font-bold text-slate-400 uppercase dark:border-slate-800 dark:bg-black/40">
                                    Format: PDF, DOCX (Max 15MB)
                                </div>
                            </label>
                        )}

                        {uploading && (
                            <div className="flex flex-col items-center justify-center gap-6 rounded-3xl border-2 border-slate-100 bg-white p-12 dark:border-slate-800 dark:bg-black/10">
                                <div className="relative flex h-20 w-20 items-center justify-center">
                                    <div className="absolute inset-0 rounded-full border-4 border-slate-100 dark:border-slate-800" />
                                    <div className="absolute inset-0 animate-spin rounded-full border-4 border-t-indigo-600 border-r-indigo-600" />
                                    <span className="text-xs leading-none font-black text-slate-800 dark:text-white">{uploadProgress}%</span>
                                </div>
                                <div className="w-full max-w-[280px] text-center">
                                    <h4 className="text-[10px] font-black tracking-wider text-slate-800 uppercase dark:text-slate-200">
                                        Mengunggah Dokumen...
                                    </h4>
                                    <p className="mt-1 text-[8px] leading-relaxed font-bold text-slate-400 uppercase">
                                        Mengamankan enkripsi draft dan menyimpannya ke server repositori
                                    </p>
                                </div>
                                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 p-0.5 dark:bg-slate-800">
                                    <div
                                        className="h-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 transition-all duration-150"
                                        style={{ width: `${uploadProgress}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {uploadedFile && (
                            <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border-2 border-emerald-500/20 bg-emerald-500/[0.02] p-8 text-center dark:border-emerald-500/30">
                                <div className="flex h-14 w-14 animate-bounce items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 shadow-inner">
                                    <Check size={26} />
                                </div>
                                <div className="max-w-[320px]">
                                    <h4 className="text-[10px] font-black tracking-wider text-emerald-600 uppercase dark:text-emerald-400">
                                        Dokumen Berhasil Terupload
                                    </h4>
                                    <p className="mx-auto mt-2 max-w-[280px] truncate rounded-xl border border-slate-100 bg-white px-3 py-1 text-xs font-black text-slate-800 uppercase dark:border-slate-800 dark:bg-black/30 dark:text-slate-200">
                                        {uploadedFile.name}
                                    </p>
                                    <p className="mt-1.5 text-[9px] font-bold text-slate-400 uppercase">
                                        Ukuran: {(uploadedFile.size / 1024).toFixed(1)} KB • Tipe: {uploadedFile.name.split('.').pop()?.toUpperCase()}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setUploadedFile(null);
                                        setUploadProgress(0);
                                    }}
                                    className="mt-2 rounded-xl bg-rose-500/5 px-4 py-2 text-[9px] font-black text-rose-500 uppercase transition-all hover:bg-rose-500/10 hover:underline"
                                >
                                    Ganti File Dokumen
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Deskripsi Perubahan / Changelog (Mandatory) */}
                <div className="space-y-1.5">
                    <label className="px-1 text-[9px] font-black text-slate-400 uppercase">
                        Catatan Perubahan / Changelog <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                        value={uploadChangelog}
                        onChange={(e) => setUploadChangelog(e.target.value)}
                        placeholder="Masukkan deskripsi perubahan atau riwayat revisi pada draf dokumen ini (wajib)..."
                        className="min-h-[90px] w-full resize-none rounded-2xl border border-slate-200 bg-slate-50/50 p-4 text-[11px] font-bold transition-all outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-800 dark:bg-black/20 dark:text-white"
                        required
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
                    disabled={isSubmitting || !uploadedFile || !uploadChangelog.trim()}
                    onClick={() => {
                        setIsSubmitting(true);
                        setTimeout(() => {
                            setIsSubmitting(false);
                            showToast('Simulasi Unggah Dokumen berhasil!', 'success');
                            handleClose();
                        }, 850);
                    }}
                    className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-[10px] font-black text-white uppercase shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.02] hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-50"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 size={12} className="animate-spin" />
                            Menyimpan...
                        </>
                    ) : (
                        <>
                            <Check size={12} />
                            Konfirmasi Dokumen
                        </>
                    )}
                </button>
            </div>
        </Modal>
    );
}
