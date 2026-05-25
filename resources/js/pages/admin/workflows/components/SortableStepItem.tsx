import { useToast } from '@/components/contracts/Toast';
import { Button } from '@/components/ui/base/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/forms/Select';
import { cn } from '@/lib/utils';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { router } from '@inertiajs/react';
import {
    ArrowDown,
    ArrowUp,
    Briefcase,
    CheckCircle2,
    ChevronUp,
    Copy,
    CornerDownLeft,
    Eye,
    FileSignature,
    GitBranch,
    Key,
    Loader2,
    Settings2,
    Shield,
    Trash2,
    Upload,
    UserCheck,
    Users as UsersIcon,
    XCircle,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { ApproveModal } from './modals/ApproveModal';
import { AssignModal } from './modals/AssignModal';
import { ManageMasterActionsModal } from './modals/ManageMasterActionsModal';
import { RejectModal } from './modals/RejectModal';
import { ReturnModal } from './modals/ReturnModal';
import { ReviewModal } from './modals/ReviewModal';
import { UploadModal } from './modals/UploadModal';
import { SignerModal } from './modals/SignerModal';

import { SearchableMultiSelect } from '@/components/ui/forms/SearchableMultiSelect';

const AVAILABLE_FIELDS = [
    { value: 'attachment', label: 'Lampiran Kontrak (Attachment)' },
    { value: 'signed_attachment', label: 'Lampiran TTD Kontrak' },
    { value: 'notes', label: 'Catatan / Review (Notes)' },
    { value: 'contract_no', label: 'Nomor Kontrak (contract_no)' },
    { value: 'crown_no', label: 'Nomor Crown (crown_no)' },
    { value: 'title', label: 'Judul Kontrak (title)' },
    { value: 'description', label: 'Deskripsi Kontrak (description)' },
    { value: 'contract_date', label: 'Tanggal Kontrak (contract_date)' },
    { value: 'end_date', label: 'Tanggal Berakhir (end_date)' },
    { value: 'kop_topik', label: 'Kop Surat Topik' },
    { value: 'p1_entity', label: 'Pihak 1 Entitas' },
    { value: 'p1_signer', label: 'Pihak 1 Penandatangan' },
    { value: 'p2_entity', label: 'Pihak 2 Entitas' },
    { value: 'p2_signer', label: 'Pihak 2 Penandatangan' },
    { value: 'f2_price', label: 'Nilai Kontrak (f2_price)' },
    { value: 'f2_payment', label: 'Ketentuan Pembayaran (f2_payment)' },
    { value: 'f2_tenure', label: 'Jangka Waktu (f2_tenure)' },
    { value: 'vendor_id', label: 'Vendor ID' },
    { value: 'assigned_pic_id', label: 'PIC Ditugaskan' },
    { value: 'submitted_at', label: 'Waktu Submit (submitted_at)' },
    { value: 'approved_at', label: 'Waktu Disetujui (approved_at)' },
    { value: 'closed_at', label: 'Waktu Selesai (closed_at)' },
];


const AUTOFILLED_PARAMS = [
    { value: 'received_at', label: 'Isi Waktu diterima' },
    { value: 'assigned_at', label: 'Isi Waktu ditugaskan' },
    { value: 'finished_at', label: 'Isi Waktu diselesaikan' },
    { value: 'closed_at', label: 'Isi Waktu ditutup' },
    { value: 'received_at-null', label: 'Kosongkan Waktu diterima' },
    { value: 'assigned_at-null', label: 'Kosongkan Waktu ditugaskan' },
    { value: 'finished_at-null', label: 'Kosongkan Waktu diselesaikan' },
    { value: 'closed_at-null', label: 'Kosongkan Waktu ditutup' },
];

export default function SortableStepItem({
    step,
    idx,
    totalSteps,
    contractStatuses,
    updateLocalStep,
    removeLocalStep,
    duplicateLocalStep,
    moveLocalStep,
    isExpanded,
    setIsExpanded,
    roles,
    departments,
    users,
    masterActions = [],
    allWorkflows = [],
    allWorkflowSteps = [],
}: {
    step: any;
    idx: number;
    totalSteps: number;
    contractStatuses: any[];
    updateLocalStep: (idx: number, data: any) => void;
    removeLocalStep: (idx: number) => void;
    duplicateLocalStep: (idx: number) => void;
    moveLocalStep: (idx: number, direction: 'up' | 'down') => void;
    isExpanded: boolean;
    setIsExpanded: (expanded: boolean) => void;
    roles: any[];
    departments: any[];
    users: any[];
    masterActions?: any[];
    allWorkflows?: any[];
    allWorkflowSteps?: any[];
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: step.id });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0.5 : 1,
    };

    const { showToast } = useToast();

    const parsedCondition = useMemo(() => {
        const key = step.meta?.condition_key ?? '';
        const op = step.meta?.condition_operator ?? '';
        const val = step.meta?.condition_value ?? '';

        if (key || op || val) {
            return { key, operator: op || 'truthy', value: val };
        }

        // Fallback: parse condition_expression
        const expr = step.condition_expression || '';
        if (!expr || expr === 'METADATA_KEY') {
            return { key: '', operator: 'truthy', value: '' };
        }

        const operators = ['==', '!=', '>', '<', 'contains'];
        for (const o of operators) {
            if (expr.includes(` ${o} `)) {
                const parts = expr.split(` ${o} `);
                return { key: parts[0].trim(), operator: o, value: parts[1].trim() };
            } else if (expr.includes(o)) {
                const parts = expr.split(o);
                return { key: parts[0].trim(), operator: o, value: parts[1].trim() };
            }
        }
        return { key: expr.trim(), operator: 'truthy', value: '' };
    }, [step.condition_expression, step.meta]);

    const handleConditionChange = (updates: { key?: string; operator?: string; value?: string }) => {
        const nextKey = updates.key !== undefined ? updates.key : parsedCondition.key;
        const nextOp = updates.operator !== undefined ? updates.operator : parsedCondition.operator;
        const nextVal = updates.value !== undefined ? updates.value : parsedCondition.value;

        let expr = '';
        if (nextOp === 'truthy') {
            expr = nextKey;
        } else {
            expr = `${nextKey} ${nextOp} ${nextVal}`;
        }

        updateLocalStep(idx, {
            condition_expression: expr,
            meta: {
                ...(step.meta || {}),
                condition_key: nextKey,
                condition_operator: nextOp,
                condition_value: nextVal,
            }
        });
    };

    const actions = useMemo(() => {
        if (step.actions && step.actions.length > 0) {
            return step.actions;
        }
        // Fallback: convert legacy allowed_actions to actions array
        if (step.allowed_actions && step.allowed_actions.length > 0) {
            return step.allowed_actions.map((actCode: string, index: number) => {
                const code = actCode.toLowerCase();
                const matchedMaster = (masterActions || []).find((ma: any) => ma.code === code);
                return {
                    id: `legacy-${code}-${index}`,
                    master_action_id: matchedMaster?.id || '',
                    master_action: matchedMaster || { id: '', name: actCode.toUpperCase(), code },
                    next_step_id: null,
                    next_workflow_id: null,
                    next_workflow_step_id: null,
                    required_fields: [],
                    autofilled_fields: [],
                    alias: '',
                    description: ''
                };
            });
        }
        return [];
    }, [step.actions, step.allowed_actions, masterActions]);

    const addAction = () => {
        const next = [
            ...actions,
            {
                id: `new-action-${Date.now()}`,
                master_action_id: '',
                master_action_name: '',
                next_step_id: null,
                next_workflow_id: null,
                next_workflow_step_id: null,
                required_fields: [],
                autofilled_fields: [],
                alias: '',
                description: ''
            }
        ];
        updateLocalStep(idx, { actions: next, allowed_actions: next.map((a: any) => a.master_action?.code || a.master_action_name?.toLowerCase()).filter(Boolean) });
    };

    const updateAction = (actionIdx: number, data: any) => {
        const next = [...actions];
        next[actionIdx] = { ...next[actionIdx], ...data };
        updateLocalStep(idx, { actions: next, allowed_actions: next.map((a: any) => a.master_action?.code || a.master_action_name?.toLowerCase()).filter(Boolean) });
    };

    const removeAction = (actionIdx: number) => {
        const next = actions.filter((_: any, i: number) => i !== actionIdx);
        updateLocalStep(idx, { actions: next, allowed_actions: next.map((a: any) => a.master_action?.code || a.master_action_name?.toLowerCase()).filter(Boolean) });
    };

    const [activeModal, setActiveModal] = useState<'approve' | 'reject' | 'return' | 'assign_pic' | 'upload' | 'review' | 'sign' | null>(null);
    const [showManageMasterActions, setShowManageMasterActions] = useState(false);
    const [isSavingAction, setIsSavingAction] = useState<number | null>(null);

    const handleSaveCustomAction = (actIdx: number, customName: string) => {
        if (!customName || !customName.trim()) {
            showToast('Nama aksi tidak boleh kosong', 'danger');
            return;
        }

        setIsSavingAction(actIdx);
        router.post(
            route('admin.workflows.master-actions.store'),
            { name: customName },
            {
                preserveScroll: true,
                onSuccess: (page: any) => {
                    showToast('Aksi berhasil didaftarkan ke Master Aksi', 'success');
                    
                    const nameLower = customName.trim().toLowerCase();
                    const code = nameLower.replace(/\s+/g, '_');
                    
                    setTimeout(() => {
                        const matched = masterActions.find((m: any) => m.code === code || m.name.toLowerCase() === nameLower);
                        if (matched) {
                            updateAction(actIdx, {
                                master_action_id: matched.id,
                                master_action_name: '',
                                master_action: matched
                            });
                        }
                    }, 100);
                },
                onError: (err) => {
                    showToast(err.name || 'Gagal mendaftarkan aksi', 'danger');
                },
                onFinish: () => setIsSavingAction(null),
            }
        );
    };

    // Filtered users for select dropdowns
    const userOptions = useMemo(() => {
        return (users || []).map((u: any) => ({
            value: String(u.id),
            label: `${u.name.toUpperCase()} (${(u.role || 'Staff').toUpperCase()})`,
        }));
    }, [users]);

    const legalUserOptions = useMemo(() => {
        let list = (users || []).filter(
            (u) => u.role?.toLowerCase().includes('legal') || u.role?.toLowerCase().includes('admin') || u.role?.toLowerCase().includes('staff'),
        );
        if (list.length === 0) list = users || [];
        return list.map((u) => ({
            value: String(u.id),
            label: `${u.name.toUpperCase()} (${(u.role || 'Legal Staff').toUpperCase()})`,
        }));
    }, [users]);

    const approverLabel = useMemo(() => {
        switch (step.approver_type) {
            case 'initiator':
                return 'INISIATOR';
            case 'atasan':
                return 'ATASAN LANGSUNG';
            case 'assigned_pic':
                return 'PIC DITUGASKAN';
            case 'role': {
                const rolesList = step.role || [];
                const deptsList = step.department_ids || [];
                if (rolesList.length === 0 && deptsList.length === 0) {
                    return 'ROLE POOL (SEMUA)';
                }
                const parts = [];
                if (rolesList.length > 0) {
                    parts.push(rolesList.join(', '));
                }
                if (deptsList.length > 0) {
                    const deptNames = deptsList.map((id: string) => departments.find(d => String(d.id) === id)?.name || id);
                    parts.push(`[${deptNames.join(', ')}]`);
                }
                return `ROLE: ${parts.join(' ')}`;
            }
            case 'user': {
                const usersList = step.user_ids || [];
                if (usersList.length === 0) {
                    return 'USER POOL (SEMUA)';
                }
                const userNames = usersList.map((id: any) => (users || []).find(u => String(u.id) === String(id))?.name || id);
                return `USER: ${userNames.join(', ')}`;
            }
            default:
                return 'BELUM DIATUR';
        }
    }, [step.approver_type, step.role, step.department_ids, step.user_ids, departments, users]);

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn('group/step flex flex-col gap-0 transition-all duration-300', isExpanded ? 'overflow-visible' : 'overflow-hidden', isDragging && 'z-50 scale-[1.01]')}
        >
            {/* --- Premium Header Card --- */}
            <div
                className={cn(
                    'group/header dark:bg-card relative flex gap-4 rounded-2xl border p-4 transition-all duration-500',
                    isExpanded
                        ? 'rounded-b-none border-b-0 bg-white shadow-2xl dark:bg-white/[0.02]'
                        : 'bg-white/50 shadow-sm hover:bg-white dark:bg-black/20 dark:hover:bg-white/[0.05]',
                    !step.approver_type && 'border-dashed border-rose-200 bg-rose-50/20',
                    step.approver_type ? 'border-primary/10' : 'border-primary/20',
                )}
            >
                <div className="flex shrink-0 flex-col items-center">
                    <div
                        {...attributes}
                        {...listeners}
                        className="border-primary/5 bg-primary/[0.03] hover:bg-primary/10 hover:border-primary/20 flex h-10 w-10 cursor-grab items-center justify-center rounded-xl border transition-all"
                    >
                        <div className="bg-primary/30 mb-0.5 h-1.5 w-1.5 rounded-full" />
                        <span className="text-primary/40 text-[10px] leading-none font-black">#{idx + 1}</span>
                    </div>
                </div>

                <div className="flex min-w-0 flex-1 items-center justify-between">
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                            <div
                                title={approverLabel}
                                className={cn(
                                    'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-black uppercase max-w-[280px] truncate',
                                    step.approver_type === 'initiator'
                                        ? 'border-blue-100 bg-blue-50 text-blue-600 dark:border-blue-800/50 dark:bg-blue-950/30 dark:text-blue-400'
                                        : step.approver_type === 'atasan'
                                            ? 'border-amber-100 bg-amber-50 text-amber-600 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-400'
                                            : step.approver_type === 'assigned_pic'
                                                ? 'border-indigo-100 bg-indigo-50 text-indigo-600 dark:border-indigo-800/50 dark:bg-indigo-950/30 dark:text-indigo-400'
                                                : step.approver_type === 'user'
                                                    ? 'border-teal-100 bg-teal-50 text-teal-600 dark:border-teal-800/50 dark:bg-teal-950/30 dark:text-teal-400'
                                                    : 'border-emerald-100 bg-emerald-50 text-emerald-600 dark:border-emerald-800/50 dark:bg-emerald-950/30 dark:text-emerald-400',
                                )}
                            >
                                <UserCheck size={10} className="shrink-0" /> <span className="truncate">{approverLabel}</span>
                            </div>

                            {/* Conditional Flag */}
                            {step.condition_expression && (
                                <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[9px] font-black text-slate-600 uppercase dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                                    <GitBranch size={10} /> BERSYARAT
                                </div>
                            )}

                            {/* Simulator Buttons in Header */}
                            {actions.length > 0 && (
                                <div className="ml-4 flex items-center gap-2 border-l border-slate-200 pl-4 dark:border-slate-800">
                                    <span className="text-[8px] font-black uppercase tracking-wider text-slate-400">Simulasi:</span>
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        {(() => {
                                            const buttons = [];

                                            for (const act of actions) {
                                                let code = '';
                                                let name = '';
                                                if (act.master_action_id) {
                                                    const ma = masterActions.find((m: any) => m.id === act.master_action_id);
                                                    code = ma?.code || '';
                                                    name = ma?.name || '';
                                                } else if (act.master_action_name) {
                                                    code = act.master_action_name.toLowerCase();
                                                    name = act.master_action_name;
                                                }

                                                if (!code) continue;

                                                let color = 'bg-slate-600 hover:bg-slate-700';
                                                let icon = Settings2;
                                                let actionType = code;

                                                if (code === 'approve') {
                                                    color = 'bg-emerald-600 hover:bg-emerald-700';
                                                    icon = CheckCircle2;
                                                } else if (code === 'reject') {
                                                    color = 'bg-rose-500 hover:bg-rose-600';
                                                    icon = XCircle;
                                                } else if (code === 'assign_pic') {
                                                    color = 'bg-blue-600 hover:bg-blue-700';
                                                    icon = UserCheck;
                                                } else if (code === 'upload') {
                                                    color = 'bg-indigo-600 hover:bg-indigo-700';
                                                    icon = Upload;
                                                } else if (code === 'review') {
                                                    color = 'bg-indigo-600 hover:bg-indigo-700';
                                                    icon = Eye;
                                                } else if (code === 'return' || code.includes('kembalikan')) {
                                                    color = 'bg-amber-500 hover:bg-amber-600';
                                                    icon = CornerDownLeft;
                                                    actionType = 'return';
                                                } else if (code.includes('sign') || code.includes('tangan') || code.includes('paraf')) {
                                                    color = 'bg-amber-600 hover:bg-amber-700';
                                                    icon = FileSignature;
                                                    actionType = 'sign';
                                                }

                                                let tooltip = '';
                                                if (act.next_workflow_id) {
                                                    const targetWfName = allWorkflows.find((w: any) => w.id === act.next_workflow_id)?.name || 'Workflow Lain';
                                                    tooltip = `Lompat ke Workflow: ${targetWfName}`;
                                                } else if (act.next_step_id) {
                                                    const targetStepIdx = allWorkflowSteps.findIndex(s => s.id === act.next_step_id);
                                                    tooltip = `Lompat ke Tahap ${targetStepIdx !== -1 ? targetStepIdx + 1 : 'Kustom'}`;
                                                } else {
                                                    tooltip = idx + 2 > totalSteps ? 'Selesai / Final' : `Lanjut ke Tahap ${idx + 2}`;
                                                }

                                                buttons.push({
                                                    label: act.alias || name,
                                                    actionType,
                                                    color,
                                                    icon,
                                                    tooltip: act.description || tooltip,
                                                    act
                                                });
                                            }

                                            return buttons.map((btn, bIdx) => (
                                                <button
                                                    key={bIdx}
                                                    type="button"
                                                    title={btn.tooltip}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (['approve', 'reject', 'return', 'assign_pic', 'upload', 'review', 'sign'].includes(btn.actionType)) {
                                                            setActiveModal(btn.actionType as any);
                                                        } else {
                                                            showToast(`Simulasi: Menjalankan aksi "${btn.label}" (${btn.tooltip}). Kolom Wajib: ${(btn.act.required_fields || []).join(', ') || '-'}`, 'success');
                                                        }
                                                    }}
                                                    className={cn(
                                                        'flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-white shadow-sm transition-all hover:scale-105 active:scale-95 text-[9px] font-bold uppercase',
                                                        btn.color,
                                                    )}
                                                >
                                                    <btn.icon size={10} className="opacity-80" />
                                                    <span>{btn.label}</span>
                                                </button>
                                            ));
                                        })()}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                            {step.description && (
                                <span className="text-[10px] font-medium text-slate-500 italic dark:text-slate-400">"{step.description}"</span>
                            )}



                            {step.allowed_actions?.length > 0 && (
                                <div className="flex items-center gap-1">
                                    <Shield size={10} className="text-slate-400" />
                                    <span className="text-[9px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                        AKSI: {step.allowed_actions.map((a: string) => a.toUpperCase()).join(', ')}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="ml-6 flex shrink-0 items-center gap-2">
                        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => duplicateLocalStep(idx)}
                                className="hover:text-primary h-7 w-7 rounded-md text-slate-400 transition-all hover:bg-white dark:hover:bg-slate-700"
                                title="Duplikat Tahap"
                            >
                                <Copy size={12} />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => moveLocalStep(idx, 'up')}
                                disabled={idx === 0}
                                className="hover:text-primary h-7 w-7 rounded-md text-slate-400 transition-all hover:bg-white disabled:opacity-10 dark:hover:bg-slate-700"
                                title="Pindah ke Atas"
                            >
                                <ArrowUp size={12} />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => moveLocalStep(idx, 'down')}
                                disabled={idx === totalSteps - 1}
                                className="hover:text-primary h-7 w-7 rounded-md text-slate-400 transition-all hover:bg-white disabled:opacity-10 dark:hover:bg-slate-700"
                                title="Pindah ke Bawah"
                            >
                                <ArrowDown size={12} />
                            </Button>
                        </div>

                        <Button
                            variant={isExpanded ? 'default' : 'outline'}
                            onClick={() => setIsExpanded(!isExpanded)}
                            className={cn(
                                'h-8 gap-2 rounded-lg px-3 text-[10px] font-bold tracking-tight uppercase transition-all',
                                isExpanded
                                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
                                    : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800',
                            )}
                        >
                            {isExpanded ? <ChevronUp size={12} /> : <Settings2 size={12} />}
                            {isExpanded ? 'TUTUP' : 'EDIT'}
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeLocalStep(idx)}
                            className="h-8 w-8 rounded-lg text-slate-300 transition-all hover:bg-rose-50 hover:text-rose-500 dark:text-slate-700 dark:hover:bg-rose-500/10"
                        >
                            <Trash2 size={14} />
                        </Button>
                    </div>
                </div>
            </div>

            {/* --- Premium Expansion Block --- */}
            {isExpanded && (
                <div className="border-primary/10 animate-in fade-in slide-in-from-top-6 relative overflow-visible rounded-b-3xl border-x border-b bg-white shadow-2xl duration-500 dark:bg-black/40">
                    <div className="relative z-10 p-6">
                        <div className="grid grid-cols-12 gap-6">
                            {/* --- Section 1: Basic Config --- */}
                            <div className="col-span-12 space-y-5 lg:col-span-6">
                                <div>
                                    <h4 className="text-primary/30 mb-4 flex items-center gap-2 text-[11px] font-black uppercase">
                                        <Settings2 size={12} /> Konfigurasi Dasar
                                    </h4>

                                    <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                                        <div className="col-span-2 space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase">Deskripsi Tahap</label>
                                            <input
                                                value={step.description || step.label || ''}
                                                onChange={(e) => updateLocalStep(idx, { description: e.target.value, label: e.target.value })}
                                                placeholder="Contoh: Review Legal Staff"
                                                className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-[11px] font-bold outline-none transition-all focus:border-slate-900 focus:bg-white dark:border-slate-800 dark:bg-slate-900/50 dark:focus:bg-slate-900"
                                            />
                                        </div>

                                        {/* Status Kontrak saat Langkah Aktif */}
                                        <div className="col-span-2 space-y-1.5 sm:col-span-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase">Status Kontrak Target</label>
                                            <Select
                                                value={step.meta?.target_status || 'default'}
                                                onValueChange={(v) => {
                                                    updateLocalStep(idx, {
                                                        meta: {
                                                            ...(step.meta || {}),
                                                            target_status: v === 'default' ? null : v
                                                        }
                                                    });
                                                }}
                                            >
                                                <SelectTrigger className="h-9 rounded-xl border-slate-200 bg-white text-[11px] font-bold transition-all focus:border-slate-900 dark:border-slate-800 dark:bg-black/50">
                                                    <SelectValue placeholder="Pilih Status" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl">
                                                    <SelectItem value="default" className="py-2 text-[10px] font-bold uppercase text-slate-500">
                                                        DEFAULT (OTOMATIS)
                                                    </SelectItem>
                                                    {contractStatuses.map((status: any) => (
                                                        <SelectItem key={status.id} value={status.code} className="py-2 text-[10px] font-bold uppercase">
                                                            {(status.label || status.name || status.code || '').toUpperCase()} ({status.code?.toUpperCase()})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <p className="text-[9px] text-slate-400 leading-tight">
                                                Status kontrak yang akan diterapkan secara otomatis saat langkah ini mulai aktif.
                                            </p>
                                        </div>

                                        {/* Pihak Penanggung Jawab */}
                                        <div className="col-span-2 space-y-1.5 sm:col-span-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase">Penanggung Jawab Langkah</label>
                                            <div className="flex h-9 items-center justify-between rounded-xl border border-slate-200 bg-white px-3 dark:border-slate-800 dark:bg-black/50">
                                                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                                    {step.meta?.is_host ? 'INTERNAL (HOST)' : 'EKSTERNAL (MITRA)'}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        updateLocalStep(idx, {
                                                            meta: {
                                                                ...(step.meta || {}),
                                                                is_host: !step.meta?.is_host
                                                            }
                                                        });
                                                    }}
                                                    className={cn(
                                                        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                                                        step.meta?.is_host ? 'bg-slate-900 dark:bg-white' : 'bg-slate-200 dark:bg-slate-800'
                                                    )}
                                                >
                                                    <span
                                                        className={cn(
                                                            'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out dark:bg-black',
                                                            step.meta?.is_host ? 'translate-x-4' : 'translate-x-0'
                                                        )}
                                                    />
                                                </button>
                                            </div>
                                            <p className="text-[9px] text-slate-400 leading-tight">
                                                Aktifkan jika langkah ini dilakukan oleh pihak internal (Host). Nonaktifkan jika dilakukan pihak eksternal.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* --- Section 2: Logika Eksekusi --- */}
                            <div className="col-span-12 space-y-6 lg:col-span-6">
                                <div className="grid grid-cols-1 gap-6">
                                    {/* Metadata Logic (Visibility) */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <GitBranch size={16} className="text-slate-400" />
                                                <h4 className="text-[10px] font-black text-slate-500 uppercase">Ekspresi Kondisi (Metadata)</h4>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (step.condition_expression !== null) {
                                                        updateLocalStep(idx, {
                                                            condition_expression: null,
                                                            meta: {
                                                                ...(step.meta || {}),
                                                                condition_key: null,
                                                                condition_operator: null,
                                                                condition_value: null,
                                                            }
                                                        });
                                                    } else {
                                                        updateLocalStep(idx, {
                                                            condition_expression: 'METADATA_KEY',
                                                            meta: {
                                                                ...(step.meta || {}),
                                                                condition_key: 'METADATA_KEY',
                                                                condition_operator: 'truthy',
                                                                condition_value: '',
                                                            }
                                                        });
                                                    }
                                                }}
                                                className={cn(
                                                    'flex h-6 items-center gap-2 rounded-full px-3 text-[9px] font-black uppercase transition-all cursor-pointer',
                                                    step.condition_expression !== null
                                                        ? 'bg-slate-900 text-white shadow-sm'
                                                        : 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-500',
                                                )}
                                            >
                                                {step.condition_expression !== null ? 'AKTIF' : 'NON-AKTIF'}
                                            </button>
                                        </div>

                                        <div className="min-h-[140px]">
                                            {step.condition_expression !== null ? (
                                                <div className="grid grid-cols-12 gap-3 animate-in zoom-in-95 duration-200">
                                                    {/* Key Input */}
                                                    <div className="col-span-12 space-y-1">
                                                        <label className="text-[9px] font-bold text-slate-400 uppercase">Metadata Key</label>
                                                        <div className="relative">
                                                            <Key className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" size={12} />
                                                            <input
                                                                value={parsedCondition.key}
                                                                onChange={(e) => handleConditionChange({ key: e.target.value })}
                                                                placeholder="Contoh: contract.has_tax atau initiator_is_staff"
                                                                className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 pr-3 pl-9 text-[11px] font-bold outline-none transition-all focus:border-slate-900 focus:bg-white dark:border-slate-800 dark:bg-slate-900/50 dark:focus:bg-slate-900"
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Operator Input */}
                                                    <div className={cn("space-y-1", parsedCondition.operator === 'truthy' ? "col-span-12" : "col-span-5")}>
                                                        <label className="text-[9px] font-bold text-slate-400 uppercase">Operator</label>
                                                        <Select
                                                            value={parsedCondition.operator}
                                                            onValueChange={(v) => handleConditionChange({ operator: v })}
                                                        >
                                                            <SelectTrigger className="h-9 rounded-xl border-slate-200 bg-white text-[11px] font-bold transition-all focus:border-slate-900 dark:border-slate-800 dark:bg-black/50">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent className="rounded-xl">
                                                                <SelectItem value="truthy" className="py-2 text-[10px] font-bold uppercase">
                                                                    TRUTHY (AKTIF/YES)
                                                                </SelectItem>
                                                                <SelectItem value="==" className="py-2 text-[10px] font-bold uppercase">
                                                                    == (SAMA DENGAN)
                                                                </SelectItem>
                                                                <SelectItem value="!=" className="py-2 text-[10px] font-bold uppercase">
                                                                    != (TIDAK SAMA DENGAN)
                                                                </SelectItem>
                                                                <SelectItem value=">" className="py-2 text-[10px] font-bold uppercase">
                                                                    &gt; (LEBIH BESAR DARI)
                                                                </SelectItem>
                                                                <SelectItem value="<" className="py-2 text-[10px] font-bold uppercase">
                                                                    &lt; (LEBIH KECIL DARI)
                                                                </SelectItem>
                                                                <SelectItem value="contains" className="py-2 text-[10px] font-bold uppercase">
                                                                    CONTAINS (MENGANDUNG)
                                                                </SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    {/* Expected Value Input */}
                                                    {parsedCondition.operator !== 'truthy' && (
                                                        <div className="col-span-7 space-y-1 animate-in slide-in-from-left-2 duration-200">
                                                            <label className="text-[9px] font-bold text-slate-400 uppercase">Expected Value</label>
                                                            <input
                                                                value={parsedCondition.value}
                                                                onChange={(e) => handleConditionChange({ value: e.target.value })}
                                                                placeholder="Nilai pembanding"
                                                                className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-[11px] font-bold outline-none transition-all focus:border-slate-900 focus:bg-white dark:border-slate-800 dark:bg-slate-900/50 dark:focus:bg-slate-900"
                                                            />
                                                        </div>
                                                    )}

                                                    {/* Live Preview (read-only for clarity) */}
                                                    <div className="col-span-12 mt-1">
                                                        <p className="text-[9px] text-slate-400">
                                                            Sinkronisasi Ekspresi Kontrak (Read-Only Preview):{' '}
                                                            <code className="rounded bg-slate-100 px-1 py-0.5 text-[10px] font-mono text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                                                {step.condition_expression || '-'}
                                                            </code>
                                                        </p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex h-[140px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-100 bg-slate-50/30 dark:border-slate-800/50 dark:bg-black/10">
                                                    <p className="text-[9px] font-bold text-slate-300 uppercase">Selalu Diproses (Tanpa Kondisi)</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* --- Section 3: Actor Pools (Per-Step) --- */}
                            <div className="col-span-12 mt-2 border-t border-slate-100 pt-6 dark:border-slate-800">
                                <div className="mb-4 flex items-center gap-2">
                                    <UsersIcon size={14} className="text-primary/40" />
                                    <h4 className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">Pool Otoritas Langkah</h4>
                                </div>
                                <div className="col-span-2 space-y-1.5 sm:col-span-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Pemeran (Actor)</label>
                                    <Select
                                        value={step.approver_type || 'initiator'}
                                        onValueChange={(v) => {
                                            const approverType = String(v);
                                            const updates: any = { approver_type: approverType };
                                            if (approverType !== 'role') {
                                                updates.role = [];
                                                updates.department_ids = [];
                                            }
                                            if (approverType !== 'user') {
                                                updates.user_ids = [];
                                            }
                                            updateLocalStep(idx, updates);
                                        }}
                                    >
                                        <SelectTrigger className="h-9 rounded-xl border-slate-200 bg-white text-[11px] font-bold transition-all focus:border-slate-900 dark:border-slate-800 dark:bg-black/50">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl">
                                            <SelectItem value="initiator" className="py-2 text-[10px] font-bold uppercase">
                                                INISIATOR
                                            </SelectItem>
                                            <SelectItem value="atasan" className="py-2 text-[10px] font-bold uppercase">
                                                ATASAN LANGSUNG
                                            </SelectItem>
                                            <SelectItem value="assigned_pic" className="py-2 text-[10px] font-bold uppercase">
                                                PIC DITUGASKAN
                                            </SelectItem>
                                            <SelectItem value="role" className="py-2 text-[10px] font-bold uppercase">
                                                ROLE POOL
                                            </SelectItem>
                                            <SelectItem value="user" className="py-2 text-[10px] font-bold uppercase">
                                                USER POOL
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {(step.approver_type === 'role' || step.approver_type === 'user') && (
                                    <>
                                        <div className="m-5"></div>
                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
                                            {step.approver_type === 'role' && (
                                                <>
                                                    {/* Role Pool (multi-select) */}
                                                    <div className="space-y-3 md:col-span-6">
                                                        <div className="flex items-center gap-2 px-1">
                                                            <Shield size={12} className="text-slate-400" />
                                                            <span className="text-[10px] font-black text-slate-500 uppercase">ROLE POOL</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 px-1">
                                                            <button
                                                                type="button"
                                                                onClick={() => updateLocalStep(idx, { role: [] })}
                                                                className={cn(
                                                                    'rounded-lg px-2 py-1 text-[10px] font-bold uppercase transition-all',
                                                                    !step.role || step.role.length === 0
                                                                        ? 'border-slate-900 bg-slate-900 text-white shadow-lg'
                                                                        : 'border-transparent text-slate-400 italic hover:bg-slate-100',
                                                                )}
                                                            >
                                                                SEMUA ROLE
                                                            </button>
                                                            <div className="flex-1">
                                                                <SearchableMultiSelect
                                                                    values={step.role || []}
                                                                    onValuesChange={(vals: string[]) => updateLocalStep(idx, { role: vals })}
                                                                    options={roles.map((r: any) => ({ value: r.name, label: r.name }))}
                                                                    placeholder="Pilih Role..."
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Unit Pool (multi-select) */}
                                                    <div className="space-y-3 border-l border-slate-100 pl-6 dark:border-slate-800 md:col-span-6">
                                                        <div className="flex items-center gap-2 px-1">
                                                            <Briefcase size={12} className="text-slate-400" />
                                                            <span className="text-[10px] font-black text-slate-500 uppercase">UNIT POOL</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 px-1">
                                                            <button
                                                                type="button"
                                                                onClick={() => updateLocalStep(idx, { department_ids: [] })}
                                                                className={cn(
                                                                    'rounded-lg px-2 py-1 text-[10px] font-bold uppercase transition-all',
                                                                    !step.department_ids || step.department_ids.length === 0
                                                                        ? 'border-slate-900 bg-slate-900 text-white shadow-lg'
                                                                        : 'border-transparent text-slate-400 italic hover:bg-slate-100',
                                                                )}
                                                            >
                                                                SEMUA UNIT
                                                            </button>
                                                            <div className="flex-1">
                                                                <SearchableMultiSelect
                                                                    values={step.department_ids || []}
                                                                    onValuesChange={(vals: string[]) => updateLocalStep(idx, { department_ids: vals })}
                                                                    options={departments.map((d: any) => ({ value: String(d.id), label: d.name }))}
                                                                    placeholder="Pilih Unit..."
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                            {step.approver_type === 'user' && (
                                                <div className="space-y-3 md:col-span-12">
                                                    <div className="flex items-center gap-2 px-1">
                                                        <UsersIcon size={12} className="text-slate-400" />
                                                        <span className="text-[10px] font-black text-slate-500 uppercase">USER POOL</span>
                                                    </div>
                                                    {step.user_ids && step.user_ids.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 px-1 py-1">
                                                            {step.user_ids.map((uId: any) => {
                                                                const uName = (users || []).find(u => String(u.id) === String(uId))?.name || `User ID: ${uId}`;
                                                                return (
                                                                    <span key={uId} className="inline-flex items-center gap-1 bg-slate-900 text-white dark:bg-white dark:text-black px-2 py-0.5 rounded text-[8px] font-bold uppercase">
                                                                        {uName}
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                const next = (step.user_ids || []).filter((u: any) => String(u) !== String(uId));
                                                                                updateLocalStep(idx, { user_ids: next });
                                                                            }}
                                                                            className="hover:text-rose-500 font-bold focus:outline-none"
                                                                        >
                                                                            ×
                                                                        </button>
                                                                    </span>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                    <div className="custom-scrollbar max-h-[160px] space-y-1 overflow-y-auto pr-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => updateLocalStep(idx, { user_ids: [] })}
                                                            className={cn(
                                                                'flex w-full items-center justify-between rounded-xl border p-2 text-left transition-all',
                                                                !step.user_ids || step.user_ids.length === 0
                                                                    ? 'border-slate-900 bg-slate-900 text-white shadow-lg'
                                                                    : 'border-transparent text-slate-400 italic hover:bg-slate-100',
                                                            )}
                                                        >
                                                            <span className="w-full text-center text-[10px] font-bold uppercase">SEMUA USER</span>
                                                        </button>
                                                        {users.map((user: any) => {
                                                            const isSelected = step.user_ids?.includes(String(user.id));
                                                            return (
                                                                <button
                                                                    key={user.id}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const current = step.user_ids || [];
                                                                        const next = isSelected
                                                                            ? current.filter((u: string) => u !== String(user.id))
                                                                            : [...current, String(user.id)];
                                                                        updateLocalStep(idx, { user_ids: next });
                                                                    }}
                                                                    className={cn(
                                                                        'flex w-full items-center justify-between rounded-xl border p-2 text-left transition-all',
                                                                        isSelected
                                                                            ? 'border-slate-900 bg-slate-900 text-white'
                                                                            : 'border-transparent hover:bg-slate-100',
                                                                    )}
                                                                >
                                                                    <div className="flex flex-col">
                                                                        <span className="text-[10px] font-bold uppercase">{user.name}</span>
                                                                        <span className="text-[8px] uppercase opacity-50">{user.role}</span>
                                                                    </div>
                                                                    {isSelected && <CheckCircle2 size={10} />}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>



                    {/* --- Section 3: Konfigurasi Aksi --- */}
                    <div className="border-t border-slate-100 bg-slate-50/20 px-8 py-6 dark:border-slate-800 dark:bg-black/10">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">Konfigurasi Aksi</span>
                                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-500 dark:bg-slate-800">
                                        {actions.length} Aksi
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={addAction}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[9px] font-black uppercase text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                                >
                                    + Tambah Aksi
                                </button>
                            </div>

                            {actions.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-slate-200 py-6 text-center text-[10px] font-bold text-slate-400 uppercase italic dark:border-slate-800">
                                    Belum ada aksi yang dikonfigurasi. Klik tombol di atas untuk menambah.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {actions.map((act: any, actIdx: number) => {
                                        const isCustom = !act.master_action_id && !!act.master_action_name;
                                        return (
                                            <div
                                                key={act.id || actIdx}
                                                className="relative rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/40 space-y-3"
                                            >
                                                {/* Card Header */}
                                                <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                                                    <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase">
                                                        Aksi #{actIdx + 1}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeAction(actIdx)}
                                                        className="text-slate-400 hover:text-rose-500 transition-colors"
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                </div>

                                                {/* Grid Input 2x2 */}
                                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                    {/* Cell 1: Nama Aksi */}
                                                    <div className="space-y-1">
                                                        <div className="flex items-center justify-between">
                                                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Nama Aksi</label>
                                                            <button
                                                                type="button"
                                                                onClick={() => setShowManageMasterActions(true)}
                                                                className="text-[8px] font-bold text-indigo-500 hover:text-indigo-600 hover:underline uppercase transition-colors"
                                                            >
                                                                Kelola Aksi
                                                            </button>
                                                        </div>
                                                        {isCustom ? (
                                                            <div className="flex items-center gap-1.5">
                                                                <input
                                                                    type="text"
                                                                    value={act.master_action_name || ''}
                                                                    onChange={(e) => updateAction(actIdx, {
                                                                        master_action_name: e.target.value,
                                                                        master_action_id: '',
                                                                        master_action: null
                                                                    })}
                                                                    className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 text-[10px] font-bold uppercase transition-all focus:border-slate-900 focus:bg-white dark:border-slate-800 dark:bg-slate-900"
                                                                    placeholder="Contoh: CONFIRM"
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleSaveCustomAction(actIdx, act.master_action_name || '')}
                                                                    disabled={isSavingAction === actIdx}
                                                                    className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[8px] font-black uppercase text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 dark:border-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400"
                                                                    title="Daftarkan ke Master Aksi"
                                                                >
                                                                    {isSavingAction === actIdx ? (
                                                                        <Loader2 size={10} className="animate-spin" />
                                                                    ) : (
                                                                        'Daftar'
                                                                    )}
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => updateAction(actIdx, {
                                                                        master_action_name: '',
                                                                        master_action_id: masterActions[0]?.id || '',
                                                                        master_action: masterActions[0] || null
                                                                    })}
                                                                    className="rounded-lg border border-slate-200 px-2 py-1.5 text-[8px] font-black uppercase text-slate-500 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900"
                                                                    title="Batal dan pilih dari daftar"
                                                                >
                                                                    Batal
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-1.5">
                                                                <Select
                                                                    value={act.master_action_id || ''}
                                                                    onValueChange={(val) => {
                                                                        if (val === 'custom') {
                                                                            updateAction(actIdx, {
                                                                                master_action_id: '',
                                                                                master_action_name: 'CUSTOM_ACTION',
                                                                                master_action: null
                                                                            });
                                                                        } else {
                                                                            const matched = masterActions.find((m: any) => m.id === val);
                                                                            updateAction(actIdx, {
                                                                                master_action_id: val,
                                                                                master_action_name: '',
                                                                                master_action: matched || null
                                                                            });
                                                                        }
                                                                    }}
                                                                >
                                                                    <SelectTrigger className="h-8 rounded-lg border-slate-200 bg-slate-50/50 text-[10px] font-black uppercase tracking-tight focus:border-slate-900 dark:border-slate-800 dark:bg-slate-900">
                                                                        <SelectValue placeholder="PILIH AKSI" />
                                                                    </SelectTrigger>
                                                                    <SelectContent className="rounded-lg border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
                                                                        {(masterActions || []).map((ma: any) => (
                                                                            <SelectItem key={ma.id} value={ma.id} className="text-[9px] font-bold uppercase">
                                                                                {ma.name}
                                                                            </SelectItem>
                                                                        ))}
                                                                        <SelectItem value="custom" className="text-[9px] font-black uppercase text-emerald-600">
                                                                            + AKSI KUSTOM BARU
                                                                        </SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Cell 1b: Alias Aksi */}
                                                    <div className="space-y-1">
                                                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Alias Aksi (Label Tombol)</label>
                                                        <input
                                                            type="text"
                                                            value={act.alias || ''}
                                                            onChange={(e) => updateAction(actIdx, { alias: e.target.value })}
                                                            className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 text-[10px] font-bold transition-all focus:border-slate-900 focus:bg-white dark:border-slate-800 dark:bg-slate-900"
                                                            placeholder="Contoh: Kirim Review, Kembalikan ke Legal"
                                                        />
                                                    </div>

                                                    {/* Cell 2: Transisi Ke & Conditional Details */}
                                                    <div className="space-y-3">
                                                        <div className="space-y-1">
                                                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Transisi Ke</label>
                                                            <Select
                                                                value={(() => {
                                                                    if (act.next_workflow_id) return 'cross_workflow';
                                                                    if (act.next_step_id) {
                                                                        const prevStep = allWorkflowSteps[idx - 1];
                                                                        if (prevStep && act.next_step_id === prevStep.id) return 'back';
                                                                        return 'jump_step';
                                                                    }
                                                                    return 'sequential';
                                                                })()}
                                                                onValueChange={(val) => {
                                                                    if (val === 'sequential') {
                                                                        updateAction(actIdx, {
                                                                            next_step_id: null,
                                                                            next_workflow_id: null,
                                                                            next_workflow_step_id: null
                                                                        });
                                                                    } else if (val === 'back') {
                                                                        const prevStep = allWorkflowSteps[idx - 1];
                                                                        updateAction(actIdx, {
                                                                            next_step_id: prevStep?.id || null,
                                                                            next_workflow_id: null,
                                                                            next_workflow_step_id: null
                                                                        });
                                                                    } else if (val === 'jump_step') {
                                                                        updateAction(actIdx, {
                                                                            next_step_id: allWorkflowSteps.find((s: any) => s.id !== step.id)?.id || null,
                                                                            next_workflow_id: null,
                                                                            next_workflow_step_id: null
                                                                        });
                                                                    } else if (val === 'cross_workflow') {
                                                                        const targetWf = allWorkflows.find((w: any) => w.id !== step.workflow_id) || allWorkflows[0];
                                                                        updateAction(actIdx, {
                                                                            next_step_id: null,
                                                                            next_workflow_id: targetWf?.id || null,
                                                                            next_workflow_step_id: targetWf?.steps?.[0]?.id || null
                                                                        });
                                                                    }
                                                                }}
                                                            >
                                                                <SelectTrigger className="h-8 rounded-lg border-slate-200 bg-slate-50/50 text-[10px] font-black uppercase tracking-tight focus:border-slate-900 dark:border-slate-800 dark:bg-slate-900">
                                                                    <SelectValue placeholder="PILIH TRANSISI" />
                                                                </SelectTrigger>
                                                                <SelectContent className="rounded-lg border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
                                                                    <SelectItem value="sequential" className="text-[9px] font-bold uppercase">
                                                                        LANGKAH BERIKUTNYA (DEFAULT)
                                                                    </SelectItem>
                                                                    <SelectItem value="back" className="text-[9px] font-bold uppercase">
                                                                        LANGKAH SEBELUMNYA (BACK)
                                                                    </SelectItem>
                                                                    <SelectItem value="jump_step" className="text-[9px] font-bold uppercase">
                                                                        LOMPAT LANGKAH (INTERNAL)
                                                                    </SelectItem>
                                                                    <SelectItem value="cross_workflow" className="text-[9px] font-bold uppercase">
                                                                        LINTAS ALUR KERJA (CROSS WORKFLOW)
                                                                    </SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>

                                                        {(!act.next_workflow_id && act.next_step_id && (() => { const prev = allWorkflowSteps[idx - 1]; return !prev || act.next_step_id !== prev.id; })()) && (
                                                            <div className="space-y-1 bg-slate-50/40 p-2.5 rounded-xl border border-slate-100 dark:bg-slate-900/10 dark:border-slate-800">
                                                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Pilih Target Langkah (Alur Ini)</label>
                                                                <Select
                                                                    value={String(act.next_step_id)}
                                                                    onValueChange={(val) => updateAction(actIdx, { next_step_id: val })}
                                                                >
                                                                    <SelectTrigger className="h-8 rounded-lg border-slate-200 bg-white text-[10px] font-black uppercase focus:border-slate-900 dark:border-slate-800 dark:bg-slate-950">
                                                                        <SelectValue placeholder="PILIH TAHAP TARGET" />
                                                                    </SelectTrigger>
                                                                    <SelectContent className="rounded-lg bg-white dark:bg-slate-950">
                                                                        {allWorkflowSteps.map((s: any, sIdx: number) => (
                                                                            <SelectItem key={s.id} value={String(s.id)} className="text-[9px] font-bold uppercase">
                                                                                TAHAP {sIdx + 1}: {s.label || `Langkah ${sIdx + 1}`}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        )}

                                                        {act.next_workflow_id && (
                                                            <div className="space-y-3 bg-slate-50/40 p-2.5 rounded-xl border border-slate-100 dark:bg-slate-900/10 dark:border-slate-800">
                                                                <div className="space-y-1">
                                                                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Target Alur Kerja</label>
                                                                    <Select
                                                                        value={String(act.next_workflow_id)}
                                                                        onValueChange={(val) => {
                                                                            const targetWf = allWorkflows.find((w: any) => String(w.id) === val);
                                                                            updateAction(actIdx, {
                                                                                next_workflow_id: val,
                                                                                next_workflow_step_id: targetWf?.steps?.[0]?.id || null
                                                                            });
                                                                        }}
                                                                    >
                                                                        <SelectTrigger className="h-8 rounded-lg border-slate-200 bg-white text-[10px] font-black uppercase focus:border-slate-900 dark:border-slate-800 dark:bg-slate-950">
                                                                            <SelectValue placeholder="PILIH WORKFLOW" />
                                                                        </SelectTrigger>
                                                                        <SelectContent className="rounded-lg bg-white dark:bg-slate-950">
                                                                            {allWorkflows.map((w: any) => (
                                                                                <SelectItem key={w.id} value={String(w.id)} className="text-[9px] font-bold uppercase">
                                                                                    {w.name}
                                                                                </SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Mulai Dari Langkah</label>
                                                                    <Select
                                                                        value={act.next_workflow_step_id ? String(act.next_workflow_step_id) : ''}
                                                                        onValueChange={(val) => updateAction(actIdx, { next_workflow_step_id: val })}
                                                                    >
                                                                        <SelectTrigger className="h-8 rounded-lg border-slate-200 bg-white text-[10px] font-black uppercase focus:border-slate-900 dark:border-slate-800 dark:bg-slate-950">
                                                                            <SelectValue placeholder="PILIH TAHAP TARGET" />
                                                                        </SelectTrigger>
                                                                        <SelectContent className="rounded-lg bg-white dark:bg-slate-950">
                                                                            {(allWorkflows.find((w: any) => String(w.id) === String(act.next_workflow_id))?.steps || []).map((s: any, sIdx: number) => (
                                                                                <SelectItem key={s.id} value={String(s.id)} className="text-[9px] font-bold uppercase">
                                                                                    TAHAP {sIdx + 1}: {s.label || `Langkah ${sIdx + 1}`}
                                                                                </SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Cell 2b: Deskripsi Aksi */}
                                                    <div className="space-y-1">
                                                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Deskripsi Aksi (Tooltip)</label>
                                                        <input
                                                            type="text"
                                                            value={act.description || ''}
                                                            onChange={(e) => updateAction(actIdx, { description: e.target.value })}
                                                            className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 text-[10px] font-bold transition-all focus:border-slate-900 focus:bg-white dark:border-slate-800 dark:bg-slate-900"
                                                            placeholder="Deskripsi singkat fungsi tombol ini..."
                                                        />
                                                    </div>

                                                    {/* Cell 3: Required Fields */}
                                                    <div className="space-y-1">
                                                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Kolom Wajib Diisi (Required)</label>
                                                        <SearchableMultiSelect
                                                            values={act.required_fields || []}
                                                            onValuesChange={(vals: string[]) => updateAction(actIdx, { required_fields: vals })}
                                                            options={AVAILABLE_FIELDS}
                                                            placeholder="Pilih Kolom..."
                                                        />
                                                    </div>

                                                    {/* Cell 4: Autofill Fields */}
                                                    <div className="space-y-1">
                                                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Kolom Isi Otomatis (Autofill)</label>
                                                        <SearchableMultiSelect
                                                            values={act.autofilled_fields || []}
                                                            onValuesChange={(vals: string[]) => updateAction(actIdx, { autofilled_fields: vals })}
                                                            options={AUTOFILLED_PARAMS}
                                                            placeholder="Pilih Kolom..."
                                                        />
                                                    </div>

                                                    {/* Cell 5: Signers (Conditional) */}
                                                    {(act.master_action?.code?.toLowerCase() === 'signature') && (
                                                        <div className="space-y-2 col-span-1 sm:col-span-2 bg-amber-50/50 p-3 rounded-xl border border-amber-100/50 dark:bg-amber-900/10 dark:border-amber-800/30">
                                                            <div className="flex items-center gap-1.5">
                                                                <FileSignature size={12} className="text-amber-500" />
                                                                <label className="text-[9px] font-bold text-amber-600 uppercase tracking-tight dark:text-amber-500">Pilihan Penandatangan (Signers)</label>
                                                            </div>
                                                            <SearchableMultiSelect
                                                                values={act.signing_parties || []}
                                                                onValuesChange={(vals: string[]) => updateAction(actIdx, { signing_parties: vals })}
                                                                options={[
                                                                    { value: 'initiator', label: 'INISIATOR (PIC / PEMBUAT)' },
                                                                    { value: 'pic', label: 'PIC DITUGASKAN' },
                                                                    { value: 'legal', label: 'LEGAL STAFF' },
                                                                    { value: 'manager_legal', label: 'MANAGER LEGAL' },
                                                                    { value: 'vp_legal', label: 'VP LEGAL / MANAGEMENT' },
                                                                    { value: 'vendor', label: 'VENDOR / PIHAK LUAR' }
                                                                ]}
                                                                placeholder="Pilih Pemeran Penandatangan..."
                                                            />
                                                            <p className="text-[9px] text-amber-600/70 italic leading-tight dark:text-amber-500/70">
                                                                Pilih peran yang diizinkan untuk menandatangani dokumen pada aksi ini.
                                                            </p>
                                                        </div>
                                                    )}

                                                    {/* Cell 6: Assignee Config (Conditional) */}
                                                    {(act.master_action?.code?.toLowerCase() == 'assign') && (
                                                        <div className="space-y-3 col-span-1 sm:col-span-2 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/50 dark:bg-indigo-900/10 dark:border-indigo-800/30">
                                                            <div className="flex items-center gap-1.5">
                                                                <UsersIcon size={12} className="text-indigo-500" />
                                                                <label className="text-[9px] font-bold text-indigo-600 uppercase tracking-tight dark:text-indigo-500">Konfigurasi Penugasan (Assignee)</label>
                                                            </div>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                <div className="space-y-1">
                                                                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Tipe Assignee</label>
                                                                    <Select
                                                                        value={act.assignee_config?.type || ''}
                                                                        onValueChange={(val) => {
                                                                            updateAction(actIdx, {
                                                                                assignee_config: {
                                                                                    ...(act.assignee_config || {}),
                                                                                    type: val
                                                                                }
                                                                            });
                                                                        }}
                                                                    >
                                                                        <SelectTrigger className="h-8 rounded-lg border-slate-200 bg-white text-[10px] font-black uppercase focus:border-slate-900 dark:border-slate-800 dark:bg-slate-950">
                                                                            <SelectValue placeholder="PILIH TIPE ASSIGNEE" />
                                                                        </SelectTrigger>
                                                                        <SelectContent className="rounded-lg bg-white dark:bg-slate-950">
                                                                            <SelectItem value="initiator" className="text-[9px] font-bold uppercase">INISIATOR</SelectItem>
                                                                            <SelectItem value="atasan" className="text-[9px] font-bold uppercase">ATASAN LANGSUNG</SelectItem>
                                                                            <SelectItem value="assigned_pic" className="text-[9px] font-bold uppercase">PIC DITUGASKAN</SelectItem>
                                                                            <SelectItem value="role" className="text-[9px] font-bold uppercase">ROLE POOL</SelectItem>
                                                                            <SelectItem value="user" className="text-[9px] font-bold uppercase">USER POOL</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>

                                                                {(act.assignee_config?.type === 'role') && (
                                                                    <>
                                                                        <div className="space-y-1">
                                                                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Role Tujuan</label>
                                                                            <SearchableMultiSelect
                                                                                values={act.assignee_config?.roles || []}
                                                                                onValuesChange={(vals) => updateAction(actIdx, { assignee_config: { ...act.assignee_config, roles: vals } })}
                                                                                options={roles.map((r: any) => ({ value: r.name, label: r.name }))}
                                                                                placeholder="Pilih Role..."
                                                                            />
                                                                        </div>
                                                                        <div className="space-y-1">
                                                                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Unit / Department Tujuan</label>
                                                                            <SearchableMultiSelect
                                                                                values={act.assignee_config?.department_ids || []}
                                                                                onValuesChange={(vals) => updateAction(actIdx, { assignee_config: { ...act.assignee_config, department_ids: vals } })}
                                                                                options={departments.map((d: any) => ({ value: String(d.id), label: d.name }))}
                                                                                placeholder="Pilih Unit..."
                                                                            />
                                                                        </div>
                                                                    </>
                                                                )}
                                                                {(act.assignee_config?.type === 'user') && (
                                                                    <div className="space-y-1 md:col-span-2">
                                                                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">User Tujuan</label>
                                                                        <SearchableMultiSelect
                                                                            values={act.assignee_config?.user_ids || []}
                                                                            onValuesChange={(vals) => updateAction(actIdx, { assignee_config: { ...act.assignee_config, user_ids: vals } })}
                                                                            options={users.map((u: any) => ({ value: String(u.id), label: `${u.name} (${u.role})` }))}
                                                                            placeholder="Pilih User..."
                                                                        />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <p className="text-[9px] text-indigo-600/70 italic leading-tight dark:text-indigo-500/70">
                                                                Konfigurasi siapa yang dapat dipilih atau ditugaskan pada saat aksi ini dijalankan.
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* --- Interactive Simulated Modals (accessible outside the expansion block) --- */}
            <ApproveModal
                isOpen={activeModal === 'approve'}
                onClose={() => setActiveModal(null)}
                step={step}
                idx={idx}
                userOptions={userOptions}
                showToast={showToast}
            />

            <ManageMasterActionsModal
                isOpen={showManageMasterActions}
                onClose={() => setShowManageMasterActions(false)}
                masterActions={masterActions}
                showToast={showToast}
            />

            <RejectModal isOpen={activeModal === 'reject'} onClose={() => setActiveModal(null)} step={step} idx={idx} showToast={showToast} />

            <ReturnModal isOpen={activeModal === 'return'} onClose={() => setActiveModal(null)} step={step} idx={idx} showToast={showToast} />

            {(() => {
                const assignAction = actions.find((a: any) => a.master_action?.code?.toLowerCase().includes('assign') || a.master_action_name?.toLowerCase().includes('assign'));
                const assigneeOptions: any[] = [];

                if (assignAction?.assignee_config) {
                    const cfg = assignAction.assignee_config;
                    if (cfg.type === 'initiator') assigneeOptions.push({ value: 'initiator', label: 'INISIATOR (PIC / PEMBUAT)' });
                    else if (cfg.type === 'atasan') assigneeOptions.push({ value: 'atasan', label: 'ATASAN LANGSUNG' });
                    else if (cfg.type === 'assigned_pic') assigneeOptions.push({ value: 'assigned_pic', label: 'PIC DITUGASKAN' });
                    else if (cfg.type === 'role' && cfg.roles) {
                        cfg.roles.forEach((r: string) => assigneeOptions.push({ value: `role_${r}`, label: `ROLE: ${r.toUpperCase()}` }));
                    }
                    else if (cfg.type === 'user' && cfg.user_ids) {
                        cfg.user_ids.forEach((uid: string) => {
                            const u = users.find((x: any) => String(x.id) === String(uid));
                            if (u) assigneeOptions.push({ value: `user_${u.id}`, label: `USER: ${u.name.toUpperCase()} (${u.role})` });
                        });
                    }
                }

                return (
                    <AssignModal
                        isOpen={activeModal === 'assign_pic'}
                        onClose={() => setActiveModal(null)}
                        assigneeOptions={assigneeOptions.length ? assigneeOptions : undefined}
                        showToast={showToast}
                    />
                );
            })()}

            <UploadModal isOpen={activeModal === 'upload'} onClose={() => setActiveModal(null)} step={step} showToast={showToast} />

            <ReviewModal isOpen={activeModal === 'review'} onClose={() => setActiveModal(null)} step={step} idx={idx} showToast={showToast} />

            {(() => {
                const signAction = actions.find((a: any) => a.master_action?.code?.toLowerCase().includes('sign') || a.master_action_name?.toLowerCase().includes('sign') || a.master_action_name?.toLowerCase().includes('tangan') || a.master_action_name?.toLowerCase().includes('paraf'));
                const ALL_ROLES = [
                    { value: 'initiator', label: 'INISIATOR (PIC / PEMBUAT)' },
                    { value: 'pic', label: 'PIC DITUGASKAN' },
                    { value: 'legal', label: 'LEGAL STAFF' },
                    { value: 'manager_legal', label: 'MANAGER LEGAL' },
                    { value: 'vp_legal', label: 'VP LEGAL / MANAGEMENT' },
                    { value: 'vendor', label: 'VENDOR / PIHAK LUAR' }
                ];
                const signerOptions = signAction?.signing_parties?.length
                    ? signAction.signing_parties.map((role: string) => ALL_ROLES.find(o => o.value === role) || { value: role, label: role.toUpperCase() })
                    : undefined;
                return (
                    <SignerModal
                        isOpen={activeModal === 'sign'}
                        onClose={() => setActiveModal(null)}
                        showToast={showToast}
                        signerOptions={signerOptions}
                    />
                );
            })()}
        </div>
    );
}
