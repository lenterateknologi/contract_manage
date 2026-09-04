import { Button } from '@/components/ui/buttons/Button';
import { FormInput } from '@/components/ui/inputs/FormInput';
import { FormTextarea } from '@/components/ui/inputs/FormTextarea';
import { PortalSelect } from '@/components/ui/selection/PortalSelect';
import { TreeSelect } from '@/components/ui/selection/TreeSelect';
import { Modal } from '@/components/ui/dialogs/Modal';
import { contractApi } from '@/pages/contracts/utils';
import { usePage } from '@inertiajs/react';
import { AlertCircle, Check, FilePlus2, Loader2, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { TaxToggle } from '../parts/TaxToggle';
import { validateContractForm } from '@/pages/contracts/validations/contractValidation';
import { type SharedData } from '@/types';
import { usePov } from '@/stores/usePovStore';

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
    const { auth, povOptions } = usePage<SharedData>().props;
    const pov = usePov(povOptions);
    const [title, setTitle] = useState('');
    const [desc, setDesc] = useState('');
    const [parentTypeId, setParentTypeId] = useState('');
    const [typeId, setTypeId] = useState('');
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
        if (open) {
            fetchWorkflows(typeId, initiatedById);
        } else {
            setWorkflows([]);
            setWorkflowId('');
        }
    }, [open, typeId, initiatedById]);

    const fetchWorkflows = async (tId: string, initId?: string) => {
        setFetchingWorkflows(true);
        try {
            const data = await contractApi.getWorkflows(tId, initId);
            const selectableWorkflows = (data || []).filter((w: any) => !!w.is_selectable);
            setWorkflows(selectableWorkflows);

            if (selectableWorkflows.length === 1) {
                setWorkflowId(selectableWorkflows[0].id);
            } else if (selectableWorkflows.length > 1) {
                const defaultWf = selectableWorkflows.find((w: any) => w.is_default);
                if (defaultWf) setWorkflowId(defaultWf.id);
            }
        } catch (err) {
            console.error('Failed to fetch workflows', err);
        } finally {
            setFetchingWorkflows(false);
        }
    };

    const handleSubmit = async () => {
        const validationErrors = validateContractForm(
            { title, contract_type_id: typeId, workflow_id: workflowId },
            workflows.length > 0
        );

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setErrors({});

        const fd = new FormData();
        fd.append('title', title);
        fd.append('description', desc);
        fd.append('contract_type_id', typeId);
        if (parentTypeId) {
            fd.append('contract_type_parent_id', parentTypeId);
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

    const isFormValid = Boolean(typeId && workflowId && title.trim());

    return (
        <Modal
            isOpen={open}
            onClose={onClose}
            headerVariant="primary"
            headerIcon={<FilePlus2 size={18} />}
            title="Buat Kontrak Baru"
            description="Isi formulir berikut untuk memulai pengajuan kontrak"
            maxWidth="2xl"
            footer={
                <div className="flex w-full justify-end gap-2.5">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        disabled={loading}
                        className="h-9 text-xs bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-800/50 font-semibold"
                    >
                        Batal
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading || !isFormValid} className="min-w-[120px] h-9 text-xs font-bold">
                        {loading ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Check size={15} className="mr-1.5" />}
                        Buat Kontrak
                    </Button>
                </div>
            }
        >
            <div className="space-y-3.5 pt-1">
                {(() => {
                    const canSelectInitiator = Boolean(
                        pov.isSimulatingNav
                            ? (pov.activeNavPov?.can_create_on_behalf ?? pov.activeNavPov?.roleName === 'Super Admin')
                            : (auth?.user?.can_create_on_behalf || auth?.user?.is_admin || auth?.user?.role === 'Super Admin')
                    );

                    if (!canSelectInitiator) return null;

                    return (
                        <div className="border-primary/20 bg-primary/5 dark:bg-primary/10 space-y-2 rounded-lg border p-3">
                            <label className="text-primary flex items-center gap-1.5 text-[10.5px] font-extrabold uppercase">
                                <ShieldCheck size={13} /> Dibuat Untuk (Initiator)
                            </label>
                            <PortalSelect
                                value={initiatedById}
                                onValueChange={(val) => setInitiatedById(val)}
                                options={initiatorOptions}
                                placeholder="Pilih Initiator"
                            />
                            <p className="text-text-soft text-[11px] leading-relaxed font-normal mt-1">
                                Workflow akan disesuaikan dengan departemen dan otoritas initiator yang dipilih.
                            </p>
                        </div>
                    );
                })()}

                <div className="space-y-1">
                    <label className="text-slate-700 dark:text-zinc-200 text-[10.5px] font-extrabold uppercase">
                        Klasifikasi & Jenis Dokumen <span className="text-rose-500">*</span>
                    </label>
                    <TreeSelect
                        value={typeId}
                        onValueChange={(childId, parentId) => {
                            setTypeId(childId);
                            setParentTypeId(parentId ?? '');

                            if (Array.isArray(types)) {
                                const selectedType = types.find((t) => String(t.id) === childId);
                                if (selectedType) {
                                    const pathNames = [selectedType.name];
                                    let current = selectedType;
                                    while (current && current.parent_id && String(current.parent_id) !== String(current.id)) {
                                        const parent = types.find((t) => String(t.id) === String(current.parent_id));
                                        if (parent && String(parent.id) !== String(current.id)) {
                                            pathNames.unshift(parent.name);
                                            current = parent;
                                        } else {
                                            break;
                                        }
                                    }
                                    setTitle(pathNames.join(' - '));
                                }
                            }
                        }}
                        items={types}
                        placeholder="Pilih Klasifikasi / Jenis Kontrak"
                        disableParentSelection={true}
                    />
                    {errors.contract_type_id && <div className="mt-0.5 text-[10px] font-medium text-rose-500">{errors.contract_type_id}</div>}
                </div>

                <div className="animate-in fade-in slide-in-from-top-2 space-y-1">
                    <label className="text-slate-700 dark:text-zinc-200 text-[10.5px] font-extrabold uppercase">
                        Pilih Alur Kerja <span className="text-rose-500">*</span>
                    </label>
                    <PortalSelect
                        value={workflowId}
                        onValueChange={(val) => setWorkflowId(val)}
                        options={workflows.map((w) => ({ value: String(w.id), label: w.name }))}
                        placeholder={!typeId ? 'Pilih jenis dokumen dulu...' : fetchingWorkflows ? 'Memuat...' : 'Pilih Alur Kerja'}
                        disabled={!typeId || fetchingWorkflows}
                    />
                    <p className="text-text-soft text-[11px] leading-relaxed font-normal mt-1">
                        Alur kerja persetujuan sesuai tipe kontrak yang dipilih.
                    </p>
                    {errors.workflow_id && <div className="mt-0.5 text-[10px] font-medium text-rose-500">{errors.workflow_id}</div>}
                </div>

                <FormInput
                    label="Nama Project / Judul Kontrak"
                    labelClassName="font-extrabold text-[10.5px] uppercase"
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
                    rows={2}
                />

                {errors.general && (
                    <div className="animate-in fade-in slide-in-from-top-2 flex items-center gap-3 rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-xs font-bold text-rose-500">
                        <AlertCircle size={16} className="shrink-0" />
                        {errors.general}
                    </div>
                )}
            </div>
        </Modal>
    );
}
