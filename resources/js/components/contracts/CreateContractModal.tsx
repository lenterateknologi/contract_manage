import { usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { 
    FilePlus2, 
    X, 
    ShieldCheck, 
    Check, 
    Loader2, 
    AlertCircle,
    FileText,
    Settings2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/base/Button';

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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[1px] p-4"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-[520px] max-w-full overflow-hidden rounded-xl shadow-xl"
                style={{ animation: 'modal-in .2s ease-out' }}
            >
                {/* Header */}
                <div className="border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-2">
                        <FilePlus2 size={18} className="text-zinc-600 dark:text-zinc-400" />
                        <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Buat Kontrak Baru</h2>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="text-zinc-400 hover:text-zinc-600 dark:hover:text-white p-1 rounded-lg transition-all"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Form Content */}
                <div className="max-h-[70vh] space-y-5 overflow-y-auto p-6 custom-scrollbar">
                    {isLegalOrAdmin && (
                        <div className="rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 p-3.5 space-y-2">
                            <label className="flex items-center gap-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                                <ShieldCheck size={14} className="text-zinc-500" /> Dibuat Untuk (Initiator)
                            </label>
                            <select
                                value={initiatedById}
                                onChange={(e) => setInitiatedById(e.target.value)}
                                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-xs font-normal text-zinc-900 dark:text-zinc-100 outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-700"
                            >
                                <option value={auth.user.id}>Diri Sendiri ({auth.user.name})</option>
                                <optgroup label="Pilih User Lain">
                                    {users
                                        .filter((u) => u.id !== auth.user.id)
                                        .map((u) => (
                                            <option key={u.id} value={u.id}>
                                                {u.name} — {u.role} ({u.department_name || 'No Dept'})
                                            </option>
                                        ))}
                                </optgroup>
                            </select>
                            <div className="text-[10px] text-zinc-500 dark:text-zinc-400">
                                <strong>Legal Helper:</strong> Workflow akan disesuaikan dengan departemen initiator yang dipilih.
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 px-0.5">
                                Perjanjian <span className="text-rose-500">*</span>
                            </label>
                            <select
                                value={submissionTypeId}
                                onChange={(e) => setSubmissionTypeId(e.target.value)}
                                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-700 transition-all"
                            >
                                <option value="">Pilih Tipe</option>
                                {submissionTypes.map((st) => (
                                    <option key={st.id} value={st.id}>
                                        {st.name}
                                    </option>
                                ))}
                            </select>
                            {errors.submission_type_id && <div className="mt-1 text-[10px] text-rose-500 font-medium">{errors.submission_type_id}</div>}
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 px-0.5">
                                Tipe Kontrak <span className="text-rose-500">*</span>
                            </label>
                            <select
                                value={typeId}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setTypeId(val);
                                    const selectedType = types.find((t) => String(t.id) === val);
                                    if (selectedType) setTitle(selectedType.name);
                                }}
                                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-700 transition-all"
                            >
                                <option value="">Pilih Tipe</option>
                                {types.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {t.name}
                                    </option>
                                ))}
                            </select>
                            {errors.contract_type_id && <div className="mt-1 text-[10px] text-rose-500 font-medium">{errors.contract_type_id}</div>}
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 px-0.5">
                            Judul Kontrak <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                            <input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Masukkan judul kontrak"
                                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 pl-9 pr-4 py-2 text-xs font-normal text-zinc-900 dark:text-zinc-100 outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-700 transition-all placeholder:text-zinc-400"
                            />
                        </div>
                        {errors.title && <div className="mt-1 text-[10px] text-rose-500 font-medium">{errors.title}</div>}
                    </div>

                    {errors.general && (
                        <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3 text-xs text-rose-500 flex items-center gap-2">
                            <AlertCircle size={14} />
                            {errors.general}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-3 px-6 py-4 bg-zinc-50/50 dark:bg-zinc-800/20">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 h-9 px-4 text-xs font-medium transition-all"
                    >
                        Batal
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="h-9 gap-1.5 rounded-lg px-5 text-xs font-medium shadow-sm transition-all"
                    >
                        {loading ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                            <Check size={14} />
                        )}
                        Buat Kontrak
                    </Button>
                </div>
            </div>
        </div>
    );
}
