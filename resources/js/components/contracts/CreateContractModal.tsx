import { usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

interface Props {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: FormData) => Promise<void>;
    types?: any[];
    submissionTypes?: any[];
    users?: any[];
    vendors?: any[];
}

export default function CreateContractModal({ open, onClose, onSubmit, types = [], submissionTypes = [], users = [], vendors = [] }: Props) {
    const { auth } = usePage().props as any;
    const [title, setTitle] = useState('');
    const [desc, setDesc] = useState('');
    const [typeId, setTypeId] = useState('');
    const [submissionTypeId, setSubmissionTypeId] = useState('');
    const [transactionType, setTransactionType] = useState('Perjanjian Baru');
    const [taxRequired, setTaxRequired] = useState(false);
    const [initiatedById, setInitiatedById] = useState('');
    const [vendorId, setVendorId] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Reset directed_by when modal opens
    useEffect(() => {
        if (open && auth?.user) {
            setInitiatedById(auth.user.id);
        }
    }, [open, auth]);

    if (!open) return null;

    const isLegalOrAdmin =
        auth?.user?.role === 'Admin' ||
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
        if (submissionTypeId) {
            fd.append('submission_type_id', submissionTypeId);
        }
        fd.append('transaction_type', transactionType);
        fd.append('tax_required', taxRequired ? '1' : '0');
        if (initiatedById) {
            fd.append('initiated_by_id', initiatedById);
        }
        if (vendorId) {
            fd.append('vendor_id', vendorId);
        }

        setLoading(true);
        try {
            await onSubmit(fd);
            onClose();
            setTitle('');
            setDesc('');
            setTypeId('');
            setSubmissionTypeId('');
            setTransactionType('Perjanjian Baru');
            setTaxRequired(false);
            setInitiatedById(auth?.user?.id || '');
            setVendorId('');
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
                        <div className="mb-2 rounded-lg border border-indigo-100 bg-indigo-50/50 p-4">
                            <label className="mb-1.5 block text-[11px] font-black tracking-wider text-indigo-900 uppercase">
                                <i className="fa-solid fa-user-shield mr-1.5" /> Dibuat Untuk (Initiator)
                            </label>
                            <select
                                value={initiatedById}
                                onChange={(e) => setInitiatedById(e.target.value)}
                                className="placeholder:text-muted-foreground/30 w-full rounded-md border border-indigo-200 bg-white px-3 py-2 text-[12px] font-bold outline-none focus:border-indigo-500"
                            >
                                <option value={auth.user.id}>Diri Sendiri ({auth.user.name})</option>
                                <optgroup label="Pilih User Lain (Legal Helper Mode)">
                                    {users
                                        .filter((u) => u.id !== auth.user.id)
                                        .map((u) => (
                                            <option key={u.id} value={u.id}>
                                                {u.name} — {u.role} ({u.department_name || 'No Dept'})
                                            </option>
                                        ))}
                                </optgroup>
                            </select>
                            <p className="mt-2 text-[10px] leading-relaxed text-indigo-600/70 italic">
                                <strong>Legal Helper:</strong> Jika Anda memilih user lain, workflow akan disesuaikan dengan departemen mereka, dan
                                beberapa tahap review awal dapat dilewati secara otomatis.
                            </p>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-muted-foreground mb-1.5 block text-[11px] font-semibold tracking-wider uppercase">
                                Perjanjian <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={submissionTypeId}
                                onChange={(e) => setSubmissionTypeId(e.target.value)}
                                className="border-border placeholder:text-muted-foreground/30 w-full rounded-md border bg-white px-3 py-2 text-[12px] outline-none focus:border-indigo-500"
                            >
                                <option value="">Pilih Tipe</option>
                                {submissionTypes.map((st) => (
                                    <option key={st.id} value={st.id}>
                                        {st.name}
                                    </option>
                                ))}
                            </select>
                            {errors.submission_type_id && <div className="mt-1 text-[10px] text-red-500">{errors.submission_type_id}</div>}
                        </div>

                        <div>
                            <label className="text-muted-foreground mb-1.5 block text-[11px] font-semibold tracking-wider uppercase">
                                Tipe Kontrak <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={typeId}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setTypeId(val);
                                    const selectedType = types.find((t) => String(t.id) === val);
                                    if (selectedType) setTitle(selectedType.name);
                                }}
                                className="border-border placeholder:text-muted-foreground/30 w-full rounded-md border bg-white px-3 py-2 text-[12px] outline-none focus:border-indigo-500"
                            >
                                <option value="">Pilih Tipe</option>
                                {types.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {t.name}
                                    </option>
                                ))}
                            </select>
                            {errors.contract_type_id && <div className="mt-1 text-[10px] text-red-500">{errors.contract_type_id}</div>}
                        </div>
                    </div>

                    <div>
                        <label className="text-muted-foreground mb-1.5 block text-[11px] font-semibold tracking-wider uppercase">
                            Judul Kontrak <span className="text-red-500">*</span>
                        </label>
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Masukkan judul kontrak"
                            className="border-border placeholder:text-muted-foreground/30 w-full rounded-md border px-3 py-2 text-[12px] outline-none focus:border-indigo-500"
                        />
                        {errors.title && <div className="mt-1 text-[10px] text-red-500">{errors.title}</div>}
                    </div>

                    {/* <div>
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
                    </div> */}

                    {/* <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-4">
                        <div className="flex flex-col">
                            <span className="text-foreground/80 text-[11px] font-black tracking-widest uppercase">Pajak (Tax Review)</span>
                            <span className="text-muted-foreground text-[10px] font-medium">Apakah kontrak ini memerlukan review pajak?</span>
                        </div>
                        <label className="relative inline-flex cursor-pointer items-center">
                            <input
                                type="checkbox"
                                checked={taxRequired}
                                onChange={(e) => setTaxRequired(e.target.checked)}
                                className="peer sr-only"
                            />
                            <div className="peer h-5 w-9 rounded-full bg-slate-300 peer-checked:bg-indigo-600 peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                        </label>
                    </div> */}

                    {errors.general && (
                        <div className="rounded-md border border-red-100 bg-red-50 p-3 text-[11px] text-red-600">
                            <i className="fa-solid fa-circle-exclamation mr-2" />
                            {errors.general}
                        </div>
                    )}
                </div>

                <div className="border-border/50 flex items-center justify-end gap-3 border-t bg-slate-50/50 px-5 py-4">
                    <button
                        onClick={onClose}
                        className="text-muted-foreground hover:text-foreground/80 px-5 py-2 text-[12px] font-medium transition-colors"
                    >
                        Batal
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="rounded-lg bg-indigo-600 px-6 py-2 text-[12px] font-black tracking-widest text-white uppercase shadow-lg shadow-indigo-200/50 transition-all hover:bg-indigo-700 active:scale-95 disabled:bg-gray-400"
                    >
                        {loading ? <i className="fa-solid fa-spinner fa-spin mr-2" /> : <i className="fa-solid fa-check mr-2" />}
                        Buat Kontrak
                    </button>
                </div>
            </div>
        </div>
    );
}
