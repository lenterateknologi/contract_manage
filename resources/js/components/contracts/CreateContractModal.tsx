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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-4"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div
                className="bg-sidebar border-sidebar-border w-[520px] max-w-full overflow-hidden rounded-2xl border shadow-2xl ring-1 ring-black/5"
                style={{ animation: 'modal-in .2s cubic-bezier(0.16, 1, 0.3, 1)' }}
            >
                {/* Header */}
                <div className="border-sidebar-border/50 flex items-center justify-between border-b bg-sidebar-accent/20 px-6 py-5">
                    <div className="flex items-center gap-3 text-sidebar-primary">
                        <FilePlus2 size={20} strokeWidth={2.5} />
                        <h2 className="text-[14px] font-bold text-sidebar-foreground">Buat Kontrak Baru</h2>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white p-1.5 rounded-lg transition-all"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Form Content */}
                <div className="max-h-[75vh] space-y-6 overflow-y-auto p-6 custom-scrollbar">
                    {isLegalOrAdmin && (
                        <div className="rounded-xl border border-sidebar-primary/20 bg-sidebar-primary/5 p-4 space-y-3">
                            <label className="flex items-center gap-2 text-[11px] font-semibold text-black dark:text-white">
                                <ShieldCheck size={14} /> Dibuat Untuk (Initiator)
                            </label>
                            <select
                                value={initiatedById}
                                onChange={(e) => setInitiatedById(e.target.value)}
                                className="w-full rounded-lg border border-sidebar-primary/20 bg-sidebar px-3 py-2.5 text-[12px] font-medium text-sidebar-foreground outline-none focus:ring-1 focus:ring-sidebar-primary"
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
                            <div className="flex gap-2 text-[10px] leading-relaxed text-black dark:text-white italic">
                                <span className="font-bold shrink-0">Legal Helper:</span>
                                <span>Workflow akan disesuaikan dengan departemen initiator yang dipilih.</span>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[11px] font-semibold text-black dark:text-white px-1">
                                Perjanjian <span className="text-rose-500">*</span>
                            </label>
                            <select
                                value={submissionTypeId}
                                onChange={(e) => setSubmissionTypeId(e.target.value)}
                                className="w-full rounded-lg border border-sidebar-border bg-sidebar-accent/20 px-3 py-2.5 text-[12px] text-sidebar-foreground outline-none focus:ring-1 focus:ring-sidebar-primary transition-all"
                            >
                                <option value="">Pilih Tipe</option>
                                {submissionTypes.map((st) => (
                                    <option key={st.id} value={st.id}>
                                        {st.name}
                                    </option>
                                ))}
                            </select>
                            {errors.submission_type_id && <div className="mt-1 px-1 text-[10px] text-rose-500 font-medium">{errors.submission_type_id}</div>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-semibold text-black dark:text-white px-1">
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
                                className="w-full rounded-lg border border-sidebar-border bg-sidebar-accent/20 px-3 py-2.5 text-[12px] text-sidebar-foreground outline-none focus:ring-1 focus:ring-sidebar-primary transition-all"
                            >
                                <option value="">Pilih Tipe</option>
                                {types.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {t.name}
                                    </option>
                                ))}
                            </select>
                            {errors.contract_type_id && <div className="mt-1 px-1 text-[10px] text-rose-500 font-medium">{errors.contract_type_id}</div>}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-black dark:text-white px-1">
                            Judul Kontrak <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black/30 dark:text-white/30" />
                            <input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Masukkan judul kontrak"
                                className="w-full rounded-lg border border-sidebar-border bg-sidebar-accent/20 pl-10 pr-4 py-2.5 text-[13px] font-medium text-black dark:text-white outline-none focus:ring-1 focus:ring-sidebar-primary transition-all placeholder:text-black/30 dark:placeholder:text-white/30"
                            />
                        </div>
                        {errors.title && <div className="mt-1 px-1 text-[10px] text-rose-500 font-medium">{errors.title}</div>}
                    </div>

                    {errors.general && (
                        <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3 text-[11px] text-rose-500 flex items-center gap-2">
                            <AlertCircle size={14} />
                            {errors.general}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-sidebar-border/50 flex items-center justify-end gap-3 border-t bg-sidebar-accent/20 px-6 py-5">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white px-4 h-10 text-[11px] font-bold uppercase tracking-widest transition-all"
                    >
                        Batal
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="h-10 gap-2 rounded-lg px-8 text-[11px] font-black uppercase tracking-widest shadow-lg active:scale-95 disabled:opacity-50"
                    >
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Check size={16} strokeWidth={3} />
                        )}
                        Buat Kontrak
                    </Button>
                </div>
            </div>
        </div>
    );
}
