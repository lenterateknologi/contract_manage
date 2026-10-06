import { Button } from '@/components/ui/buttons/Button';
import { Modal } from '@/components/ui/dialogs/Modal';
import { FormInput } from '@/components/ui/inputs/FormInput';
import { PortalSelect } from '@/components/ui/selection/PortalSelect';
import { TreeSelect } from '@/components/ui/selection/TreeSelect';
import { contractApi } from '@/pages/contracts/utils';
import { validateContractForm } from '@/pages/contracts/validations/contractValidation';
import { usePov } from '@/stores/usePovStore';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { AlertCircle, Check, FilePlus2, Loader2, ShieldCheck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface Props {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: FormData) => Promise<void>;
    types?: any[];
    submissionTypes?: any[];
    users?: any[];
    vendors?: any[];
    activeTab?: string;
    activeContractTypeId?: string;
    dashboardConfig?: {
        show_overview_contract?: boolean;
        show_overview_non_contract?: boolean;
        show_overview_nda?: boolean;
        [key: string]: unknown;
    };
}

// ponytail: helper to resolve root category ('contract' | 'non-contract' | 'nda') & topic from type hierarchy
function resolveTypeCategory(typeId: string, types: any[], activeTab?: string): { category: 'contract' | 'non-contract' | 'nda'; topic: string } {
    let current = types.find((t) => String(t.id) === String(typeId));
    const visited = new Set<string>();
    while (current && current.parent_id && String(current.parent_id) !== String(current.id) && !visited.has(String(current.id))) {
        visited.add(String(current.id));
        const parent = types.find((t) => String(t.id) === String(current.parent_id));
        if (parent) {
            current = parent;
        } else {
            break;
        }
    }

    if (!current) {
        if (activeTab === 'non_kontrak') return { category: 'non-contract', topic: 'non-perjanjian' };
        if (activeTab === 'nda') return { category: 'nda', topic: 'nda' };
        return { category: 'contract', topic: 'perjanjian' };
    }

    const code = (current.code || '').toUpperCase();
    const name = (current.name || '').toLowerCase();

    if (code === 'A-2' || name.includes('non')) {
        return { category: 'non-contract', topic: 'non-perjanjian' };
    }
    if (code === 'NDA' || name.includes('nda') || name.includes('kerahasiaan')) {
        return { category: 'nda', topic: 'nda' };
    }
    return { category: 'contract', topic: 'perjanjian' };
}

export default function CreateContractModal({
    open,
    onClose,
    onSubmit,
    types = [],
    users = [],
    vendors = [],
    activeTab,
    activeContractTypeId,
    dashboardConfig,
}: Props) {
    const { auth, povOptions } = usePage<SharedData>().props;
    const pov = usePov(povOptions);
    const [title, setTitle] = useState('');
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

    // ponytail: filter type tree to strictly match active filtering/tab (kontrak / non_kontrak / nda) & dashboardConfig
    const filteredTypes = useMemo(() => {
        const showContract = dashboardConfig?.show_overview_contract !== false;
        const showNonContract = dashboardConfig?.show_overview_non_contract !== false;
        const showNda = dashboardConfig?.show_overview_nda !== false;

        let baseTypes = types;
        if (!showContract || !showNonContract || !showNda) {
            // Find root ids that are allowed
            const allowedRootIds = new Set<string>();
            types.forEach((t) => {
                if (t.parent_id && String(t.parent_id) !== String(t.id)) return;
                const code = (t.code || '').toUpperCase();
                const name = (t.name || '').toLowerCase();
                const isContract = code === 'A-1' || (!name.includes('non') && name.includes('kontrak'));
                const isNonContract = code === 'A-2' || name.includes('non');
                const isNda = code === 'NDA' || name.includes('nda') || name.includes('kerahasiaan');

                if ((isContract && showContract) || (isNonContract && showNonContract) || (isNda && showNda)) {
                    allowedRootIds.add(String(t.id));
                }
            });

            if (allowedRootIds.size > 0) {
                const allowedDescendantIds = new Set<string>(allowedRootIds);
                let added = true;
                while (added) {
                    added = false;
                    for (const item of types) {
                        if (item.parent_id && allowedDescendantIds.has(String(item.parent_id)) && !allowedDescendantIds.has(String(item.id))) {
                            allowedDescendantIds.add(String(item.id));
                            added = true;
                        }
                    }
                }
                baseTypes = types.filter((t) => allowedDescendantIds.has(String(t.id)));
            }
        }

        if (!activeTab || activeTab === 'all' || activeTab === 'pending' || activeTab === 'history') {
            return baseTypes;
        }

        const root = baseTypes.find((t) => {
            if (t.parent_id && String(t.parent_id) !== String(t.id)) return false;
            const code = (t.code || '').toUpperCase();
            const name = (t.name || '').toLowerCase();
            if (activeTab === 'kontrak') {
                return code === 'A-1' || (!name.includes('non') && name.includes('kontrak'));
            }
            if (activeTab === 'non_kontrak') {
                return code === 'A-2' || name.includes('non');
            }
            if (activeTab === 'nda') {
                return code === 'NDA' || name.includes('nda') || name.includes('kerahasiaan');
            }
            return false;
        });

        if (!root) return baseTypes;

        const allowedIds = new Set<string>([String(root.id)]);
        let added = true;
        while (added) {
            added = false;
            for (const item of baseTypes) {
                if (item.parent_id && allowedIds.has(String(item.parent_id)) && !allowedIds.has(String(item.id))) {
                    allowedIds.add(String(item.id));
                    added = true;
                }
            }
        }

        return baseTypes.filter((t) => allowedIds.has(String(t.id)));
    }, [types, activeTab, dashboardConfig]);

    const initiatorOptions = useMemo(() => {
        const allowedUserIds = auth?.user?.allowed_on_behalf_user_ids;
        const otherUsers = Array.isArray(users)
            ? users
                  .filter((u) => {
                      if (String(u.id) === String(auth?.user?.id)) return false;
                      if (Array.isArray(allowedUserIds)) {
                          return allowedUserIds.includes(String(u.id));
                      }
                      return true;
                  })
                  .map((u) => ({
                      value: String(u.id),
                      label: `${u.name} — ${u.role} (${u.department_name || 'No Dept'})`,
                  }))
            : [];

        return [
            { value: String(auth?.user?.id), label: `Diri Sendiri (${auth?.user?.name})` },
            ...otherUsers,
        ];
    }, [auth?.user, users]);

    // Reset and initialize state when modal opens
    useEffect(() => {
        if (open) {
            setTitle('');
            setTypeId('');
            setParentTypeId('');
            setWorkflowId('');
            setWorkflows([]);
            setErrors({});
            setProjectName('');
            const initialCat = resolveTypeCategory('', types, activeTab).category;
            setCategory(initialCat);

            if (auth?.user) {
                setInitiatedById(auth.user.id);
            }

            // Auto-select if activeContractTypeId is a leaf in filteredTypes
            if (activeContractTypeId) {
                const target = filteredTypes.find((t) => String(t.id) === String(activeContractTypeId));
                if (target) {
                    const hasChildren = filteredTypes.some((t) => String(t.parent_id) === String(target.id) && String(t.id) !== String(target.id));
                    if (!hasChildren) {
                        setTypeId(String(target.id));
                        setParentTypeId(target.parent_id ? String(target.parent_id) : '');
                        setTitle(target.name);
                        setCategory(resolveTypeCategory(String(target.id), types, activeTab).category);
                    }
                }
            }
        }
    }, [open, auth, activeTab, activeContractTypeId, filteredTypes, types]);

    useEffect(() => {
        if (open && typeId) {
            fetchWorkflows(typeId, initiatedById);
        } else if (!typeId) {
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

            const eligibleWorkflows = selectableWorkflows.filter((w: any) => w.is_eligible !== false);
            if (eligibleWorkflows.length > 0) {
                const defaultWf = eligibleWorkflows.find((w: any) => w.is_default) || eligibleWorkflows[0];
                setWorkflowId(String(defaultWf.id));
            } else {
                setWorkflowId('');
            }
        } catch (err) {
            console.error('Failed to fetch workflows', err);
        } finally {
            setFetchingWorkflows(false);
        }
    };

    const handleSubmit = async () => {
        const validationErrors = validateContractForm({ title, contract_type_id: typeId, workflow_id: workflowId }, workflows.length > 0);

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setErrors({});

        const { category: detectedCat } = resolveTypeCategory(typeId, types, activeTab);

        const fd = new FormData();
        fd.append('title', title);
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
        fd.append('category', detectedCat);
        if (workflowId) {
            fd.append('workflow_id', workflowId);
        }
        if (detectedCat === 'nda') {
            fd.append('project_name', projectName || title);
            fd.append('topic', 'nda');
        } else if (detectedCat === 'non-contract') {
            fd.append('topic', 'non-perjanjian');
        } else {
            fd.append('topic', 'perjanjian');
        }

        setLoading(true);
        try {
            await onSubmit(fd);
            onClose();
        } catch (err) {
            console.error('Failed to create contract', err);
        } finally {
            setLoading(false);
        }
    };

    const isFormValid = Boolean(title && typeId && (!workflows.length || workflowId));

    const modalTitle = activeTab === 'non_kontrak'
        ? 'Buat Pengajuan Non Kontrak'
        : activeTab === 'nda'
          ? 'Buat Pengajuan NDA'
          : 'Buat Pengajuan Baru';

    const modalDesc = activeTab === 'non_kontrak'
        ? 'Isi formulir berikut untuk memulai pengajuan non-kontrak'
        : activeTab === 'nda'
          ? 'Isi formulir berikut untuk memulai pengajuan dokumen kerahasiaan (NDA)'
          : 'Isi formulir berikut untuk memulai pengajuan kontrak';

    return (
        <Modal
            isOpen={open}
            onClose={onClose}
            headerVariant="primary"
            headerIcon={<FilePlus2 size={18} />}
            title={modalTitle}
            description={modalDesc}
            maxWidth="3xl"
            className="min-h-[620px] max-h-[85vh] flex flex-col"
            footer={
                <div className="flex w-full justify-end gap-2.5">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        disabled={loading}
                        className="h-9 border border-rose-200 bg-rose-50 text-xs font-semibold text-rose-600 hover:bg-rose-100 hover:text-rose-700 dark:border-rose-800/50 dark:bg-rose-950/30 dark:text-rose-400 dark:hover:bg-rose-900/50"
                    >
                        Batal
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading || !isFormValid} className="h-9 min-w-[120px] text-xs font-bold">
                        {loading ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Check size={15} className="mr-1.5" />}
                        Buat Pengajuan
                    </Button>
                </div>
            }
        >
            <div className="space-y-4 pt-1.5 pb-6">
                {(() => {
                    const canSelectInitiator = Boolean(
                        pov.isSimulatingNav
                            ? (pov.activeNavPov?.can_create_on_behalf ?? pov.activeNavPov?.roleName === 'Super Admin')
                            : auth?.user?.can_create_on_behalf || auth?.user?.is_admin || auth?.user?.role === 'Super Admin',
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
                            <p className="text-text-soft mt-1 text-[11px] leading-relaxed font-normal">
                                Workflow akan disesuaikan dengan departemen dan otoritas initiator yang dipilih.
                            </p>
                        </div>
                    );
                })()}

                <div className="space-y-1">
                    <label className="text-[10.5px] font-extrabold text-slate-700 uppercase dark:text-zinc-200">
                        Klasifikasi & Jenis Dokumen <span className="text-rose-500">*</span>
                    </label>
                    <TreeSelect
                        value={typeId}
                        onValueChange={(childId, parentId) => {
                            setTypeId(childId);
                            setParentTypeId(parentId ?? '');

                            const { category: detectedCat } = resolveTypeCategory(childId, types, activeTab);
                            setCategory(detectedCat);

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
                        items={filteredTypes}
                        placeholder={
                            activeTab === 'non_kontrak'
                                ? 'Pilih Jenis Dokumen Non Kontrak'
                                : activeTab === 'nda'
                                  ? 'Pilih Jenis Dokumen NDA'
                                  : 'Pilih Klasifikasi / Jenis Kontrak'
                        }
                        disableParentSelection={true}
                    />
                    {errors.contract_type_id && <div className="mt-0.5 text-[10px] font-medium text-rose-500">{errors.contract_type_id}</div>}
                </div>

                <div className="animate-in fade-in slide-in-from-top-2 space-y-1">
                    <label className="text-[10.5px] font-extrabold text-slate-700 uppercase dark:text-zinc-200">
                        Pilih Alur Kerja <span className="text-rose-500">*</span>
                    </label>
                    <PortalSelect
                        value={workflowId}
                        onValueChange={(val) => setWorkflowId(val)}
                        options={workflows.map((w: any) => ({
                            value: String(w.id),
                            label: w.name,
                            disabled: w.is_eligible === false,
                        }))}
                        placeholder={!typeId ? 'Pilih jenis dokumen dulu...' : fetchingWorkflows ? 'Memuat...' : 'Pilih Alur Kerja'}
                        disabled={!typeId || fetchingWorkflows}
                    />
                    {errors.workflow_id && <div className="mt-0.5 text-[10px] font-medium text-rose-500">{errors.workflow_id}</div>}
                </div>

                <FormInput
                    label="Nama Project / Judul Dokumen"
                    labelClassName="font-extrabold text-[10.5px] uppercase"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Masukkan nama project atau judul dokumen"
                    error={errors.title}
                    required
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
