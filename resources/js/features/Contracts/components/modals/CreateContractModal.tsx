import { Button } from '@/components/ui/buttons/Button';
import { Modal } from '@/components/ui/dialogs/Modal';
import { FormInput } from '@/components/ui/inputs/FormInput';
import { PortalSelect } from '@/components/ui/selection/PortalSelect';
import { TreeSelect } from '@/components/ui/selection/TreeSelect';
import { contractApi, validateContractForm } from '@/features/Contracts/utils';
import { usePov } from '@/stores/usePovStore';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { AlertCircle, Check, FilePlus2, Loader2, ShieldCheck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface Props {
    open?: boolean;
    isOpen?: boolean;
    onClose?: () => void;
    onOpenChange?: (open: boolean) => void;
    onSubmit?: (data: FormData) => Promise<void>;
    types?: any[];
    submissionTypes?: any[];
    users?: any[];
    vendors?: any[];
    departments?: any[];
    divisions?: any[];
    roles?: any[];
    regions?: any[];
    locations?: any[];
    companyGroups?: any[];
    companies?: any[];
    organizationTree?: any;
    formTemplates?: any[];
    currentUserId?: string | number;
    processing?: boolean;
    activeTab?: string;
    activeContractTypeId?: string;
    dashboardConfig?: {
        show_overview_contract?: boolean;
        show_overview_non_contract?: boolean;
        show_overview_nda?: boolean;
        [key: string]: unknown;
    };
}

// Helper to resolve root category and topic dynamically from master data hierarchy
function getRootType(typeId: string, types: any[]): any | null {
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
    return current || null;
}

function resolveTypeCategory(typeId: string, types: any[], activeTab?: string): { category: string; topic: string; root: any | null } {
    const root = getRootType(typeId, types);
    if (!root) {
        return {
            category: activeTab === 'non_kontrak' ? 'non-contract' : activeTab === 'nda' ? 'nda' : 'contract',
            topic: activeTab === 'non_kontrak' ? 'non-perjanjian' : activeTab === 'nda' ? 'nda' : 'perjanjian',
            root: null,
        };
    }

    const code = (root.code || '').toUpperCase();
    const name = (root.name || '').toLowerCase();

    let category = root.code ? root.code.toLowerCase() : 'contract';
    if (code === 'A-1' || (!name.includes('non') && name.includes('kontrak'))) {
        category = 'contract';
    } else if (code === 'A-2' || name.includes('non')) {
        category = 'non-contract';
    } else if (code === 'NDA' || name.includes('nda') || name.includes('kerahasiaan')) {
        category = 'nda';
    }

    const topic = root.name || 'perjanjian';

    return { category, topic, root };
}

export default function CreateContractModal({
    open: propOpen,
    isOpen: propIsOpen,
    onClose: propOnClose,
    onOpenChange,
    onSubmit,
    types = [],
    users = [],
    activeTab,
    activeContractTypeId,
}: Props) {
    const isModalOpen = Boolean(propOpen ?? propIsOpen);
    const handleClose = () => {
        if (propOnClose) propOnClose();
        if (onOpenChange) onOpenChange(false);
    };

    const { auth, povOptions } = usePage<SharedData>().props;
    const pov = usePov(povOptions);
    const [title, setTitle] = useState('');
    const [parentTypeId, setParentTypeId] = useState('');
    const [typeId, setTypeId] = useState('');
    const [, setCategory] = useState('contract');
    const [transactionType] = useState('Perjanjian Baru');
    const [taxRequired] = useState(true);
    const [initiatedById, setInitiatedById] = useState('');
    const [projectName, setProjectName] = useState('');
    const [loading, setLoading] = useState(false);
    const [workflows, setWorkflows] = useState<any[]>([]);
    const [workflowId, setWorkflowId] = useState('');
    const [fetchingWorkflows, setFetchingWorkflows] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Filter type tree dynamically from master data hierarchy & active tab/config
    const filteredTypes = useMemo(() => {
        let baseTypes = types;

        if (activeTab && activeTab !== 'all' && activeTab !== 'pending' && activeTab !== 'history') {
            const root = baseTypes.find((t) => {
                if (t.parent_id && String(t.parent_id) !== String(t.id)) return false;
                const code = (t.code || '').toLowerCase();
                const name = (t.name || '').toLowerCase();
                const id = String(t.id);
                if (activeTab === id || activeTab === code) return true;
                if (activeTab === 'kontrak' && (code === 'a-1' || (!name.includes('non') && name.includes('kontrak')))) return true;
                if (activeTab === 'non_kontrak' && (code === 'a-2' || name.includes('non'))) return true;
                if (activeTab === 'nda' && (code === 'nda' || name.includes('nda') || name.includes('kerahasiaan'))) return true;
                return false;
            });

            if (root) {
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
                baseTypes = baseTypes.filter((t) => allowedIds.has(String(t.id)));
            }
        }

        return baseTypes;
    }, [types, activeTab]);

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

        return [{ value: String(auth?.user?.id), label: `Diri Sendiri (${auth?.user?.name})` }, ...otherUsers];
    }, [auth?.user, users]);

    // Reset and initialize state when modal opens
    useEffect(() => {
        if (isModalOpen) {
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
                    }
                }
            }
        }
    }, [isModalOpen, auth, activeTab, activeContractTypeId, filteredTypes, types]);

    useEffect(() => {
        if (isModalOpen && typeId) {
            fetchWorkflows(typeId, initiatedById);
        } else if (!typeId) {
            setWorkflows([]);
            setWorkflowId('');
        }
    }, [isModalOpen, typeId, initiatedById]);

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
            await onSubmit?.(fd);
            handleClose();
        } catch (err) {
            console.error('Failed to create contract', err);
        } finally {
            setLoading(false);
        }
    };

    const isFormValid = Boolean(title && typeId && (!workflows.length || workflowId));

    const modalTitle =
        activeTab === 'non_kontrak' ? 'Buat Pengajuan Non Kontrak' : activeTab === 'nda' ? 'Buat Pengajuan NDA' : 'Buat Pengajuan Baru';

    const modalDesc =
        activeTab === 'non_kontrak'
            ? 'Isi formulir berikut untuk memulai pengajuan non-kontrak'
            : activeTab === 'nda'
              ? 'Isi formulir berikut untuk memulai pengajuan dokumen kerahasiaan (NDA)'
              : 'Isi formulir berikut untuk memulai pengajuan kontrak';

    return (
        <Modal
            isOpen={isModalOpen}
            onClose={handleClose}
            headerVariant="primary"
            headerIcon={<FilePlus2 size={18} />}
            title={modalTitle}
            description={modalDesc}
            maxWidth="3xl"
            className="flex max-h-[90vh] min-h-[600px] flex-col"
            footer={
                <div className="flex w-full justify-end gap-2.5">
                    <Button
                        variant="ghost"
                        onClick={handleClose}
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
            <div className="space-y-4 pt-1.5 pb-4">
                {(() => {
                    const canSelectInitiator = Boolean(
                        pov.isSimulatingNav ? pov.activeNavPov?.can_create_on_behalf : auth?.user?.can_create_on_behalf,
                    );

                    if (!canSelectInitiator) return null;

                    return (
                        <div className="space-y-1.5">
                            <label className="text-primary flex items-center gap-1.5 px-0.5 text-[11px] font-bold tracking-wider uppercase">
                                <ShieldCheck size={13} /> Dibuat Untuk (Initiator)
                            </label>
                            <PortalSelect
                                value={initiatedById}
                                onValueChange={(val) => setInitiatedById(val)}
                                options={initiatorOptions}
                                placeholder="Pilih Initiator"
                                disabled={initiatorOptions.length <= 1}
                            />
                            <p className="text-text-soft px-0.5 text-[11px] leading-relaxed font-normal">
                                {initiatorOptions.length <= 1
                                    ? 'Pengajuan dibuat atas nama akun Anda sendiri.'
                                    : 'Workflow akan disesuaikan dengan departemen dan otoritas initiator yang dipilih.'}
                            </p>
                        </div>
                    );
                })()}

                <div className="space-y-1.5">
                    <label className="flex items-center gap-0.5 px-0.5 text-[11px] font-bold tracking-wider text-slate-700 uppercase dark:text-zinc-200">
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
                    {errors.contract_type_id && (
                        <span className="mt-1 block px-0.5 text-[10px] font-bold text-rose-500 uppercase">{errors.contract_type_id}</span>
                    )}
                </div>

                <div className="animate-in fade-in slide-in-from-top-2 space-y-1.5">
                    <label className="flex items-center gap-0.5 px-0.5 text-[11px] font-bold tracking-wider text-slate-700 uppercase dark:text-zinc-200">
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
                        disabled={!typeId || fetchingWorkflows || workflows.length <= 1}
                    />
                    {workflows.length === 1 && !fetchingWorkflows && typeId && (
                        <p className="text-[11px] text-text-soft px-0.5 font-normal">
                            Alur kerja otomatis ditentukan sesuai departemen dan otoritas initiator yang dipilih.
                        </p>
                    )}
                    {errors.workflow_id && (
                        <span className="mt-1 block px-0.5 text-[10px] font-bold text-rose-500 uppercase">{errors.workflow_id}</span>
                    )}
                </div>

                <FormInput
                    label="Nama Project / Judul Dokumen"
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
