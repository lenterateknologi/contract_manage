import { Button } from '@/components/ui/base/Button';
import { usePage } from '@inertiajs/react';
import { AlertCircle, Check, FilePlus2, FileText, Loader2, ShieldCheck, X } from 'lucide-react';
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
    const [parentTypeId, setParentTypeId] = useState('');
    const [typeId, setTypeId] = useState('');
    const [submissionTypeId, setSubmissionTypeId] = useState('');
    const [transactionType, setTransactionType] = useState('Perjanjian Baru');
    const [taxRequired, setTaxRequired] = useState(false);
    const [initiatedById, setInitiatedById] = useState('');
    const [vendorId, setVendorId] = useState('');
    const [category, setCategory] = useState<'contract' | 'non-contract' | 'nda'>('contract');
    const [projectName, setProjectName] = useState('');
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
        if (parentTypeId) {
            fd.append('contract_type_parent_id', parentTypeId);
        }
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
        fd.append('category', category);
        if (category === 'nda') {
            fd.append('project_name', projectName);
            fd.append('topic', 'nda');
        } else if (category === 'non-contract') {
            fd.append('topic', 'non-perjanjian');
        } else {
            fd.append('topic', 'perjanjian');
        }

        setLoading(true);
        try {
            await onSubmit(fd);
            onClose();
            setTitle('');
            setDesc('');
            setParentTypeId('');
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-[2px]"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div
                className="bg-sidebar border-sidebar-border w-[520px] max-w-full overflow-hidden rounded-2xl border shadow-2xl ring-1 ring-black/5"
                style={{ animation: 'modal-in .2s cubic-bezier(0.16, 1, 0.3, 1)' }}
            >
                {/* Header */}
                <div className="border-border bg-muted/30 flex items-center justify-between border-b px-6 py-4">
                    <div className="text-foreground flex items-center gap-3">
                        <FilePlus2 size={20} className="text-primary" />
                        <h2 className="text-sm font-semibold">Buat Kontrak Baru</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-black/50 transition-all hover:text-black dark:text-white/50 dark:hover:text-white"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Form Content */}
                <div className="custom-scrollbar max-h-[75vh] space-y-6 overflow-y-auto p-6">
                    {isLegalOrAdmin && (
                        <div className="border-border bg-muted/40 space-y-3 rounded-xl border p-4">
                            <label className="text-foreground flex items-center gap-2 text-xs font-semibold">
                                <ShieldCheck size={14} className="text-primary" /> Dibuat Untuk (Initiator)
                            </label>
                            <select
                                value={initiatedById}
                                onChange={(e) => setInitiatedById(e.target.value)}
                                className="border-border bg-card text-foreground focus:ring-primary w-full rounded-lg border px-3 py-2.5 text-sm font-medium outline-none focus:ring-1"
                            >
                                <option value={auth.user.id}>Diri Sendiri ({auth.user.name})</option>
                                <optgroup label="Pilih User Lain (Legal Helper Mode)">
                                    {Array.isArray(users) &&
                                        users
                                            .filter((u) => u.id !== auth.user.id)
                                            .map((u) => (
                                                <option key={u.id} value={u.id}>
                                                    {u.name} — {u.role} ({u.department_name || 'No Dept'})
                                                </option>
                                            ))}
                                </optgroup>
                            </select>
                            <div className="text-muted-foreground flex gap-2 text-xs leading-relaxed italic">
                                <span className="shrink-0 font-bold">Legal Helper:</span>
                                <span>Workflow akan disesuaikan dengan departemen initiator yang dipilih.</span>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="px-1 text-[11px] font-semibold text-black dark:text-white">
                                Tipe Pengajuan <span className="text-rose-500">*</span>
                            </label>
                            <select
                                value={submissionTypeId}
                                onChange={(e) => setSubmissionTypeId(e.target.value)}
                                className="border-sidebar-border bg-sidebar-accent/20 text-sidebar-foreground focus:ring-sidebar-primary w-full rounded-lg border px-3 py-2.5 text-[12px] transition-all outline-none focus:ring-1"
                            >
                                <option value="">Tipe Pengajuan</option>
                                {Array.isArray(submissionTypes) &&
                                    submissionTypes.map((st) => (
                                        <option key={st.id} value={st.id}>
                                            {st.name}
                                        </option>
                                    ))}
                            </select>
                            {errors.submission_type_id && (
                                <div className="mt-1 px-1 text-[10px] font-medium text-rose-500">{errors.submission_type_id}</div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="px-1 text-[11px] font-semibold text-black dark:text-white">
                                Induk Klasifikasi Kontrak <span className="text-rose-500">*</span>
                            </label>
                            <select
                                value={parentTypeId}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setParentTypeId(val);
                                    setTypeId('');
                                }}
                                className="border-sidebar-border bg-sidebar-accent/20 text-sidebar-foreground focus:ring-sidebar-primary w-full rounded-lg border px-3 py-2.5 text-[12px] transition-all outline-none focus:ring-1"
                            >
                                <option value="">Pilih Induk Tipe</option>
                                {Array.isArray(types) &&
                                    types
                                        .filter((t) => !t.parent_id)
                                        .map((t) => (
                                            <option key={t.id} value={t.id}>
                                                {t.name}
                                            </option>
                                        ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="px-1 text-[11px] font-semibold text-black dark:text-white">
                                Jenis Kontrak <span className="text-rose-500">*</span>
                            </label>
                            <select
                                value={typeId}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setTypeId(val);
                                    const selectedType = Array.isArray(types) ? types.find((t) => String(t.id) === val) : undefined;
                                    if (selectedType) setTitle(selectedType.name);
                                }}
                                disabled={!parentTypeId}
                                className="border-sidebar-border bg-sidebar-accent/20 text-sidebar-foreground focus:ring-sidebar-primary w-full rounded-lg border px-3 py-2.5 text-[12px] transition-all outline-none focus:ring-1 disabled:opacity-50"
                            >
                                <option value="">Pilih Jenis</option>
                                {Array.isArray(types) &&
                                    types
                                        .filter((t) => String(t.parent_id) === String(parentTypeId))
                                        .map((t) => (
                                            <option key={t.id} value={t.id}>
                                                {t.name}
                                            </option>
                                        ))}
                            </select>
                            {errors.contract_type_id && (
                                <div className="mt-1 px-1 text-[10px] font-medium text-rose-500">{errors.contract_type_id}</div>
                            )}
                        </div>
                    </div>



                    <div className="border-border bg-muted/20 hover:bg-muted/30 space-y-3 rounded-xl border p-4 transition-all">
                        <label className="flex cursor-pointer items-start gap-3">
                            <div className="relative mt-0.5 flex h-5 w-5 items-center justify-center">
                                <input
                                    type="checkbox"
                                    checked={taxRequired}
                                    onChange={(e) => setTaxRequired(e.target.checked)}
                                    className="peer checked:border-primary checked:bg-primary h-5 w-5 cursor-pointer appearance-none rounded-md border-2 border-slate-300 bg-white transition-all focus:outline-none dark:border-slate-700 dark:bg-slate-900"
                                />
                                <Check
                                    size={14}
                                    strokeWidth={4}
                                    className="pointer-events-none absolute text-white opacity-0 transition-opacity peer-checked:opacity-100"
                                />
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <span className="text-foreground text-sm font-bold">Butuh Persetujuan Pajak?</span>
                                <span className="text-muted-foreground text-[10px] leading-tight">
                                    Centang jika kontrak ini memiliki implikasi perpajakan yang perlu divalidasi tim Tax.
                                </span>
                            </div>
                        </label>
                    </div>

                    {errors.general && (
                        <div className="flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/5 p-3 text-xs text-rose-500">
                            <AlertCircle size={14} />
                            {errors.general}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-border bg-muted/30 flex items-center justify-end gap-3 border-t px-6 py-4">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="text-muted-foreground hover:text-foreground h-10 px-4 text-xs font-bold transition-all"
                    >
                        Batal
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="h-10 gap-2 rounded-lg px-6 text-sm font-semibold shadow-sm transition-all active:scale-95 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check size={16} />}
                        Buat Kontrak
                    </Button>
                </div>
            </div>
        </div>
    );
}
