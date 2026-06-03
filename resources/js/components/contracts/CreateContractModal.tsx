import { Button } from '@/components/ui/base/Button';
import { Modal } from '@/components/ui/overlays/Modal';
import { FormInput } from '@/components/ui/forms/FormInput';
import { FormTextarea } from '@/components/ui/forms/FormTextarea';
import { usePage } from '@inertiajs/react';
import { AlertCircle, Check, FilePlus2, Loader2, ShieldCheck, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { TreeSelect } from '@/components/ui/forms/TreeSelect';
import { PortalSelect } from '@/components/ui/forms/PortalSelect';
import { cn } from '@/lib/utils';
import { contractApi } from '@/lib/contract-api';
import { TaxToggle } from './parts/TaxToggle';

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
    const [taxRequired, setTaxRequired] = useState(true);
    const [initiatedById, setInitiatedById] = useState('');
    const [vendorId, setVendorId] = useState('');
    const [category, setCategory] = useState<'contract' | 'non-contract' | 'nda'>('contract');
    const [projectName, setProjectName] = useState('');
    const [loading, setLoading] = useState(false);
    const [workflows, setWorkflows] = useState<any[]>([]);
    const [workflowId, setWorkflowId] = useState('');
    const [fetchingWorkflows, setFetchingWorkflows] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const initiatorOptions = [
        { value: String(auth?.user?.id), label: `Diri Sendiri (${auth?.user?.name})` },
        ...(Array.isArray(users)
            ? users
                .filter((u) => u.id !== auth?.user?.id)
                .map((u) => ({
                    value: String(u.id),
                    label: `${u.name} — ${u.role} (${u.department_name || 'No Dept'})`,
                }))
            : []),
    ];

    // Reset directed_by when modal opens
    useEffect(() => {
        if (open && auth?.user) {
            setInitiatedById(auth.user.id);
        }
    }, [open, auth]);

    useEffect(() => {
        if (typeId) {
            fetchWorkflows(typeId, initiatedById);
        } else {
            setWorkflows([]);
            setWorkflowId('');
        }
    }, [typeId, initiatedById]);

    const fetchWorkflows = async (tId: string, initId?: string) => {
        setFetchingWorkflows(true);
        try {
            const data = await contractApi.getWorkflows(tId, initId);
            setWorkflows(data);

            if (data.length === 1) {
                setWorkflowId(data[0].id);
            } else if (data.length > 1) {
                const defaultWf = data.find((w: any) => w.is_default);
                if (defaultWf) setWorkflowId(defaultWf.id);
                else setWorkflowId('');
            }
        } catch (err) {
            console.error('Failed to fetch workflows', err);
        } finally {
            setFetchingWorkflows(false);
        }
    };

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
        if (workflows.length > 0 && !workflowId) {
            setErrors((prev) => ({ ...prev, workflow_id: 'Alur kerja harus dipilih' }));
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
        if (workflowId) {
            fd.append('workflow_id', workflowId);
        }
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
            setTaxRequired(true);
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
        <Modal
            isOpen={open}
            onClose={onClose}
            title={
                <div className="flex items-center gap-3">
                    <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-xl">
                        <FilePlus2 size={20} className="text-primary" />
                    </div>
                    <span>Buat Kontrak Baru</span>
                </div>
            }
            maxWidth="5xl"
            footer={
                <div className="flex w-full justify-end gap-3">
                    <Button variant="ghost" onClick={onClose} disabled={loading}>
                        Batal
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="min-w-[140px]"
                    >
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check size={16} className="mr-2" />}
                        Buat Kontrak
                    </Button>
                </div>
            }
        >
            <div className="space-y-6">
                {isLegalOrAdmin && (
                    <div className="space-y-3 rounded-2xl border border-primary/10 bg-primary/5 p-5">
                        <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-primary">
                            <ShieldCheck size={14} /> Dibuat Untuk (Initiator)
                        </label>
                        <PortalSelect
                            value={initiatedById}
                            onValueChange={(val) => setInitiatedById(val)}
                            options={initiatorOptions}
                            placeholder="Pilih Initiator"
                        />
                        <p className="text-muted-foreground text-[10px] font-medium leading-relaxed italic">
                            Legal Helper: Workflow akan disesuaikan dengan departemen initiator yang dipilih.
                        </p>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                            Tipe Pengajuan <span className="text-rose-500">*</span>
                        </label>
                        <PortalSelect
                            value={submissionTypeId}
                            onValueChange={(val) => setSubmissionTypeId(val)}
                            options={Array.isArray(submissionTypes) ? submissionTypes.map((st) => ({ value: String(st.id), label: st.name })) : []}
                            placeholder="Pilih Tipe Pengajuan"
                        />
                        {errors.submission_type_id && (
                            <div className="mt-1 text-[10px] font-medium text-rose-500">{errors.submission_type_id}</div>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                            Klasifikasi & Jenis Kontrak <span className="text-rose-500">*</span>
                        </label>
                        <TreeSelect
                            value={typeId}
                            onValueChange={(childId, parentId) => {
                                setTypeId(childId);
                                setParentTypeId(parentId ?? '');
                                const selectedType = Array.isArray(types) ? types.find((t) => String(t.id) === childId) : undefined;
                                if (selectedType) setTitle(selectedType.name);
                            }}
                            items={types}
                            placeholder="Pilih Klasifikasi / Jenis Kontrak"
                        />
                        {errors.contract_type_id && (
                            <div className="mt-1 text-[10px] font-medium text-rose-500">{errors.contract_type_id}</div>
                        )}
                    </div>
                </div>

                {workflows.length > 0 && (
                    <div className="animate-in fade-in slide-in-from-top-2 space-y-1.5 rounded-2xl border border-primary/10 bg-primary/[0.02] p-4">
                        <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-primary">
                            <ShieldCheck size={14} /> Pilih Alur Kerja (Workflow) <span className="text-rose-500">*</span>
                        </label>
                        <PortalSelect
                            value={workflowId}
                            onValueChange={(val) => setWorkflowId(val)}
                            options={workflows.map((w) => ({ value: String(w.id), label: w.name }))}
                            placeholder="Pilih Alur Kerja"
                        />
                        <p className="text-muted-foreground text-[9px] font-medium leading-relaxed italic">
                            Silakan pilih alur kerja (workflow) yang sesuai untuk tipe kontrak ini.
                        </p>
                        {errors.workflow_id && (
                            <div className="mt-1 text-[10px] font-medium text-rose-500">{errors.workflow_id}</div>
                        )}
                    </div>
                )}

                <FormInput
                    label="Nama Project / Judul Kontrak *"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Masukkan nama project atau judul kontrak"
                    error={errors.title}
                    required
                />

                <TaxToggle taxRequired={taxRequired} setTaxRequired={setTaxRequired} />

                <FormTextarea
                    label="Keterangan (Optional)"
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    placeholder="Tambahkan keterangan singkat mengenai kontrak ini..."
                    rows={3}
                />

                {errors.general && (
                    <div className="flex items-center gap-3 rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-xs font-bold text-rose-500 animate-in fade-in slide-in-from-top-2">
                        <AlertCircle size={16} className="shrink-0" />
                        {errors.general}
                    </div>
                )}
            </div>
        </Modal>
    );
}
