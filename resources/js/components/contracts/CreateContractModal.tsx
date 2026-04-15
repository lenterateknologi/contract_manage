import React, { useState } from 'react';

interface Props {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: FormData) => Promise<void>;
    types?: any[];
}

export default function CreateContractModal({ open, onClose, onSubmit }: Props) {
    const [title, setTitle] = useState('');
    const [desc, setDesc] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    if (!open) return null;

    const handleSubmit = async () => {
        setErrors({});
        if (!title.trim()) { setErrors(prev => ({ ...prev, title: 'Nama kontrak harus diisi' })); return; }

        const fd = new FormData();
        fd.append('title', title);
        fd.append('description', desc);

        setLoading(true);
        try {
            await onSubmit(fd);
            onClose();
            setTitle(''); setDesc('');
        } catch (err: any) {
            if (err.response?.data?.errors) setErrors(err.response.data.errors);
            else setErrors({ general: 'Gagal membuat kontrak.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="bg-background border border-border shadow-xl rounded-xl w-[520px] max-w-full overflow-hidden" style={{ animation: 'modal-in .18s ease' }}>
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
                        <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Nama Kontrak <span className="text-red-500">*</span></label>
                        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Masukkan nama kontrak"
                            className="w-full text-[12px] border border-border rounded-md px-3 py-2 outline-none focus:border-blue-500 placeholder:text-muted-foreground/30" />
                        {errors.title && <div className="text-red-500 text-[10px] mt-1">{errors.title}</div>}
                    </div>

                    <div>
                        <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Deskripsi <span className="text-muted-foreground/50 text-[10px] normal-case">(opsional)</span></label>
                        <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3} placeholder="Deskripsi singkat kontrak..."
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
