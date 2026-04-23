import { usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';

interface Props {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: FormData) => Promise<void>;
    types?: any[];
    users?: any[];
}

export default function CreateContractModal({ open, onClose, onSubmit, types = [], users = [] }: Props) {
    const { auth } = usePage().props as any;
    const [title, setTitle] = useState('');
    const [desc, setDesc] = useState('');
    const [typeId, setTypeId] = useState('');
    const [transactionType, setTransactionType] = useState('Perjanjian Baru');
    const [taxRequired, setTaxRequired] = useState(false);
    const [initiatedById, setInitiatedById] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Reset directed_by when modal opens
    useEffect(() => {
        if (open && auth?.user) {
            setInitiatedById(auth.user.id);
        }
    }, [open, auth]);

    if (!open) return null;

    const isLegalOrAdmin = auth?.user?.role === 'Admin' || 
                          auth?.user?.department?.name?.toLowerCase().includes('legal') ||
                          auth?.user?.role?.toLowerCase().includes('legal');

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
        fd.append('tax_required', taxRequired ? '1' : '0');
        if (initiatedById) {
            fd.append('initiated_by_id', initiatedById);
        }

        setLoading(true);
        try {
            await onSubmit(fd);
            onClose();
            setTitle('');
            setDesc('');
            setTypeId('');
            setTransactionType('Perjanjian Baru');
            setTaxRequired(false);
            setInitiatedById(auth?.user?.id || '');
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

                <div className="max-h-[80vh] space-y-5 overflow-y-auto p-5">
                    {isLegalOrAdmin && (
                        <div className="bg-indigo-50/50 border border-indigo-100 rounded-lg p-4 mb-2">
                            <label className="text-indigo-900 mb-1.5 block text-[11px] font-black tracking-wider uppercase">
                                <i className="fa-solid fa-user-shield mr-1.5" /> Dibuat Untuk (Initiator)
                            </label>
                            <select
                                value={initiatedById}
                                onChange={(e) => setInitiatedById(e.target.value)}
                                className="border-indigo-200 bg-white placeholder:text-muted-foreground/30 w-full rounded-md border px-3 py-2 text-[12px] outline-none focus:border-indigo-500 font-bold"
                            >
                                <option value={auth.user.id}>Diri Sendiri ({auth.user.name})</option>
                                <optgroup label="Pilih User Lain (Legal Helper Mode)">
                                    {users.filter(u => u.id !== auth.user.id).map((u) => (
                                        <option key={u.id} value={u.id}>
                                            {u.name} — {u.role} ({u.department_name || 'No Dept'})
                                        </option>
                                    ))}
                                </optgroup>
                            </select>
                            <p className="mt-2 text-[10px] text-indigo-600/70 italic leading-relaxed">
                                <strong>Legal Helper:</strong> Jika Anda memilih user lain, workflow akan disesuaikan dengan departemen mereka, dan beberapa tahap review awal dapat dilewati secara otomatis.
                            </p>
                        </div>
                    )}

                    <div>
                        <label className="text-muted-foreground mb-1.5 block text-[11px] font-semibold tracking-wider uppercase">
                            Nama Kontrak <span className="text-red-500">*</span>
                        </label>
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Masukkan nama kontrak"
                            className="border-border placeholder:text-muted-foreground/30 w-full rounded-md border px-3 py-2 text-[12px] outline-none focus:border-indigo-500"
                        />
                        {errors.title && <div className="mt-1 text-[10px] text-red-500">{errors.title}</div>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-muted-foreground mb-1.5 block text-[11px] font-semibold tracking-wider uppercase">
                                Tipe Kontrak <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={typeId}
                                onChange={(e) => setTypeId(e.target.value)}
                                className="border-border placeholder:text-muted-foreground/30 w-full rounded-md border px-3 py-2 text-[12px] outline-none focus:border-indigo-500 bg-white"
                            >
                                <option value="">Pilih Tipe</option>
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
                                className="border-border placeholder:text-muted-foreground/30 w-full rounded-md border px-3 py-2 text-[12px] outline-none focus:border-indigo-500 bg-white"
                            >
                                <option value="Perjanjian Baru">Perjanjian Baru</option>
                                <option value="Addendum">Addendum</option>
                                <option value="Amandement">Amandement</option>
                                <option value="Perubahan Perjanjian">Perubahan Perjanjian</option>
                            </select>
                        </div>
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
                            className="border-border placeholder:text-muted-foreground/30 w-full rounded-md border px-3 py-2 text-[12px] outline-none focus:border-indigo-500"
                        />
                    </div>

                    <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-[11px] font-black uppercase tracking-widest text-foreground/80">Pajak (Tax Review)</span>
                            <span className="text-[10px] text-muted-foreground font-medium">Apakah kontrak ini memerlukan review pajak?</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={taxRequired} 
                                onChange={(e) => setTaxRequired(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                    </div>

                    {errors.general && (
                        <div className="rounded-md border border-red-100 bg-red-50 p-3 text-[11px] text-red-600">
                            <i className="fa-solid fa-circle-exclamation mr-2" />
                            {errors.general}
                        </div>
                    )}
                </div>

                <div className="border-border/50 flex items-center justify-end gap-3 border-t px-5 py-4 bg-slate-50/50">
                    <button
                        onClick={onClose}
                        className="text-muted-foreground hover:text-foreground/80 px-5 py-2 text-[12px] font-medium transition-colors"
                    >
                        Batal
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200/50 rounded-lg px-6 py-2 text-[12px] font-black uppercase tracking-widest text-white shadow-lg transition-all disabled:bg-gray-400 active:scale-95"
                    >
                        {loading ? <i className="fa-solid fa-spinner fa-spin mr-2" /> : <i className="fa-solid fa-check mr-2" />}
                        Buat Kontrak
                    </button>
                </div>
            </div>
        </div>
    );
}
