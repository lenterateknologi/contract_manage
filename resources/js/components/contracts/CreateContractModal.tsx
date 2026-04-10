import React, { useRef, useState } from 'react';

import { ContractType } from '@/types/contracts';

interface Props {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: FormData) => Promise<void>;
    types: ContractType[];
}

export default function CreateContractModal({ open, onClose, onSubmit, types }: Props) {
    const [title, setTitle] = useState('');
    const [desc, setDesc] = useState('');
    const [contractDate, setContractDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [contractTypeId, setContractTypeId] = useState('');
    const [changelog, setChangelog] = useState('');
    const [f1File, setF1File] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    if (!open) return null;

    const handleSubmit = async () => {
        setErrors({});
        if (!title.trim()) { setErrors(prev => ({ ...prev, title: 'Judul harus diisi' })); return; }
        if (!f1File) { setErrors(prev => ({ ...prev, f1_file: 'Form F1 (Dokumen Utama) wajib diupload' })); return; }

        const fd = new FormData();
        fd.append('title', title);
        fd.append('description', desc);
        fd.append('contract_date', contractDate);
        fd.append('end_date', endDate);
        if (contractTypeId) fd.append('contract_type_id', contractTypeId);
        fd.append('changelog', changelog);
        fd.append('f1_file', f1File);

        setLoading(true);
        try {
            await onSubmit(fd);
            onClose();
            setTitle(''); setDesc(''); setContractDate(''); setEndDate(''); setContractTypeId(''); setChangelog(''); setF1File(null);
        } catch (err: any) {
            if (err.response?.data?.errors) setErrors(err.response.data.errors);
            else setErrors({ general: 'Gagal membuat kontrak.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="bg-background border border-border shadow-xl rounded-xl w-[520px] max-w-full shadow-xl overflow-hidden" style={{ animation: 'modal-in .18s ease' }}>
                <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
                    <h6 className="text-[14px] font-semibold flex items-center gap-2">
                        <i className="fa-solid fa-file-circle-plus text-muted-foreground text-[13px]" /> Buat Kontrak Baru
                    </h6>
                    <button onClick={onClose} className="text-muted-foreground hover:text-muted-foreground transition-colors">
                        <i className="fa-solid fa-xmark" />
                    </button>
                </div>

                <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
                    <div>
                        <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Judul Kontrak</label>
                        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Masukkan judul kontrak"
                            className="w-full text-[12px] border border-border rounded-md px-3 py-2 outline-none focus:border-blue-500 placeholder:text-muted-foreground/30" />
                        {errors.title && <div className="text-red-500 text-[10px] mt-1">{errors.title}</div>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Tanggal Kontrak</label>
                            <input type="date" value={contractDate} onChange={e => setContractDate(e.target.value)}
                                className="w-full text-[12px] border border-border rounded-md px-3 py-2 outline-none focus:border-blue-500" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Tipe Perjanjian</label>
                            <select value={contractTypeId} onChange={e => setContractTypeId(e.target.value)}
                                className="w-full text-[12px] border border-border rounded-md px-3 py-2 outline-none focus:border-blue-500 bg-background">
                                <option value="">Pilih Tipe...</option>
                                {types.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Tgl Berakhir Kontrak</label>
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                                className="w-full text-[12px] border border-border rounded-md px-3 py-2 outline-none focus:border-blue-500" />
                        </div>
                    </div>

                    <div>
                        <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Form F1 (Dokumen Utama)</div>
                        <div className="relative group">
                            <input
                                type="file"
                                accept=".docx,.doc,.pdf"
                                onChange={(e) => setF1File(e.target.files?.[0] || null)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div className={`p-6 border-2 border-dashed rounded-xl transition-all flex flex-col items-center justify-center gap-2 ${f1File ? 'border-primary/50 bg-primary/5' : 'border-border group-hover:border-gray-300 bg-muted/50'}`}>
                                <i className={`fa-solid ${f1File ? 'fa-file-circle-check text-blue-500' : 'fa-file-signature text-muted-foreground'} text-2xl`} />
                                <div className="text-[11px] font-medium text-muted-foreground truncate max-w-full px-2">
                                    {f1File ? f1File.name : 'Pilih file Form F1'}
                                </div>
                            </div>
                        </div>
                        {errors.f1_file && <div className="text-red-500 text-[10px] mt-1">{errors.f1_file}</div>}
                    </div>

                    <div>
                        <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Deskripsi</label>
                        <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2} placeholder="Deskripsi singkat..."
                            className="w-full text-[12px] border border-border rounded-md px-3 py-2 outline-none focus:border-blue-500 placeholder:text-muted-foreground/30" />
                    </div>

                    <div>
                        <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Keterangan Awal (Changelog)</label>
                        <input value={changelog} onChange={e => setChangelog(e.target.value)} placeholder="Contoh: Draft awal"
                            className="w-full text-[12px] border border-border rounded-md px-3 py-2 outline-none focus:border-blue-500 placeholder:text-muted-foreground/30" />
                    </div>

                    {errors.general && (
                        <div className="p-3 bg-red-50 border border-red-100 rounded-md text-red-600 text-[11px]">
                            <i className="fa-solid fa-circle-exclamation mr-2" />
                            {errors.general}
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-border/50">
                    <button onClick={onClose} className="px-5 py-2 text-[12px] font-medium text-muted-foreground hover:text-foreground/80 transition-colors">
                        Batal
                    </button>
                    <button onClick={handleSubmit} disabled={loading} className="px-6 py-2 bg-primary hover:bg-primary/90 disabled:bg-gray-400 text-white text-[12px] font-semibold rounded-lg transition-all shadow-lg shadow-primary/10">
                        {loading ? <i className="fa-solid fa-spinner fa-spin mr-2" /> : <i className="fa-solid fa-check mr-2" />}
                        Buat Kontrak
                    </button>
                </div>
            </div>
        </div>
    );
}
