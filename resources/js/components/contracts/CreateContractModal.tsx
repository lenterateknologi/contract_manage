import { useState } from 'react';

interface Props {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: FormData) => Promise<void>;
    types?: any[];
}

export default function CreateContractModal({ open, onClose, onSubmit, types = [] }: Props) {
    const [title, setTitle] = useState('');
    const [desc, setDesc] = useState('');
    const [typeId, setTypeId] = useState('');
    const [transactionType, setTransactionType] = useState('Perjanjian Baru');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    if (!open) return null;

    const handleSubmit = async () => {
        setErrors({});
        if (!title.trim()) {
            setErrors((prev) => ({ ...prev, title: 'Nama kontrak harus diisi' }));
            return;
        }
        if (!typeId) {
            setErrors((prev) => ({ ...prev, contract_type_id: 'Tipe kontrak harus dipilih' }));
            return;
        }

        const fd = new FormData();
        fd.append('title', title);
        fd.append('description', desc);
        fd.append('contract_type_id', typeId);
        fd.append('transaction_type', transactionType);

        setLoading(true);
        try {
            await onSubmit(fd);
            onClose();
            setTitle('');
            setDesc('');
            setTypeId('');
            setTransactionType('Perjanjian Baru');
        } catch (err: any) {
            if (err.response?.data?.errors) setErrors(err.response.data.errors);
            else setErrors({ general: 'Gagal membuat kontrak.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div
                className="bg-background border-border w-[520px] max-w-full overflow-hidden rounded-xl border shadow-xl"
                style={{ animation: 'modal-in .18s ease' }}
            >
                <div className="border-border/50 flex items-center justify-between border-b px-5 py-4">
                    <h6 className="flex items-center gap-2 text-[14px] font-semibold">
                        <i className="fa-solid fa-file-circle-plus text-muted-foreground text-[13px]" /> Buat Kontrak Baru
                    </h6>
                    <button onClick={onClose} className="text-muted-foreground hover:text-muted-foreground transition-colors">
                        <i className="fa-solid fa-xmark" />
                    </button>
                </div>

                <div className="max-h-[80vh] space-y-4 overflow-y-auto p-5">
                    <div>
                        <label className="text-muted-foreground mb-1.5 block text-[11px] font-semibold tracking-wider uppercase">
                            Nama Kontrak <span className="text-red-500">*</span>
                        </label>
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Masukkan nama kontrak"
                            className="border-border placeholder:text-muted-foreground/30 w-full rounded-md border px-3 py-2 text-[12px] outline-none focus:border-blue-500"
                        />
                        {errors.title && <div className="mt-1 text-[10px] text-red-500">{errors.title}</div>}
                    </div>

                    <div>
                        <label className="text-muted-foreground mb-1.5 block text-[11px] font-semibold tracking-wider uppercase">
                            Tipe Kontrak <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={typeId}
                            onChange={(e) => setTypeId(e.target.value)}
                            className="border-border placeholder:text-muted-foreground/30 w-full rounded-md border px-3 py-2 text-[12px] outline-none focus:border-blue-500 bg-white"
                        >
                            <option value="">Pilih Tipe Perjanjian</option>
                            {types.map((t) => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                        {errors.contract_type_id && <div className="mt-1 text-[10px] text-red-500">{errors.contract_type_id}</div>}
                    </div>

                    <div>
                        <label className="text-muted-foreground mb-1.5 block text-[11px] font-semibold tracking-wider uppercase">
                            Mode Transaksi <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={transactionType}
                            onChange={(e) => setTransactionType(e.target.value)}
                            className="border-border placeholder:text-muted-foreground/30 w-full rounded-md border px-3 py-2 text-[12px] outline-none focus:border-blue-500 bg-white"
                        >
                            <option value="Perjanjian Baru">Perjanjian Baru</option>
                            <option value="Addendum">Addendum</option>
                            <option value="Amandement">Amandement</option>
                            <option value="Perubahan Perjanjian">Perubahan Perjanjian</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-muted-foreground mb-1.5 block text-[11px] font-semibold tracking-wider uppercase">
                            Deskripsi <span className="text-muted-foreground/50 text-[10px] normal-case">(opsional)</span>
                        </label>
                        <textarea
                            value={desc}
                            onChange={(e) => setDesc(e.target.value)}
                            rows={3}
                            placeholder="Deskripsi singkat kontrak..."
                            className="border-border placeholder:text-muted-foreground/30 w-full rounded-md border px-3 py-2 text-[12px] outline-none focus:border-blue-500"
                        />
                    </div>

                    {errors.general && (
                        <div className="rounded-md border border-red-100 bg-red-50 p-3 text-[11px] text-red-600">
                            <i className="fa-solid fa-circle-exclamation mr-2" />
                            {errors.general}
                        </div>
                    )}
                </div>

                <div className="border-border/50 flex items-center justify-end gap-3 border-t px-5 py-4">
                    <button
                        onClick={onClose}
                        className="text-muted-foreground hover:text-foreground/80 px-5 py-2 text-[12px] font-medium transition-colors"
                    >
                        Batal
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="bg-primary hover:bg-primary/90 shadow-primary/10 rounded-lg px-6 py-2 text-[12px] font-semibold text-white shadow-lg transition-all disabled:bg-gray-400"
                    >
                        {loading ? <i className="fa-solid fa-spinner fa-spin mr-2" /> : <i className="fa-solid fa-check mr-2" />}
                        Buat Kontrak
                    </button>
                </div>
            </div>
        </div>
    );
}
