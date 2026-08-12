import { AdvancedStepSettingsModal } from './modals/AdvancedStepSettingsModal';
import { ConditionExpressionModal } from './modals/ConditionExpressionModal';
import { Button } from '@/components/ui/buttons/Button';
import { Checkbox } from '@/components/ui/selection/Checkbox';
import { useToast } from '@/components/ui/feedback/Toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/selection/Select';
import { cn } from '@/lib/utils';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    ArrowDown,
    ArrowUp,
    Bookmark,
    Briefcase,
    CheckCircle2,
    CheckSquare2,
    ChevronUp,
    Copy,
    GitBranch,
    Key,
    Settings2,
    Shield,
    Square,
    Trash2,
    UserCheck,
    Users as UsersIcon,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { ApproveModal } from './modals/ApproveModal';
import { AssignModal } from './modals/AssignModal';
import { ForwardModal } from './modals/ForwardModal';
import { RejectModal } from './modals/RejectModal';
import { SignerModal } from './modals/SignerModal';
import AuthoritySelector from './AuthoritySelector';
import AuthorityTableManager from './AuthorityTableManager';

import { ALL_ROLES, APPROVER_TYPE_STYLES } from '../constants';

import { useWorkflowStepState } from '../hooks/useWorkflowStepState';
import { StepActionConfigCard } from './StepActionConfigCard';
import { StepSimulatorButtons } from './StepSimulatorButtons';
import { FormInput } from '@/components/ui/inputs/FormInput';


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
    divisions = [],
    users,
    companyGroups = [],
    companies = [],
    regions = [],
    allWorkflows = [],
    allWorkflowSteps = [],
    onSavePreset,
    isSelected = false,
    onToggleSelect,
    onMoveKeyboard,
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
    divisions?: any[];
    users: any[];
    companyGroups?: any[];
    companies?: any[];
    regions?: any[];
    allWorkflows?: any[];
    allWorkflowSteps?: any[];
    onSavePreset?: (step: any) => void;
    isSelected?: boolean;
    onToggleSelect?: (id: string) => void;
    onMoveKeyboard?: (idx: number, direction: 'up' | 'down') => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: step.id });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : (isExpanded ? 30 : 'auto'),
        opacity: isDragging ? 0.5 : 1,
    };

    const { showToast } = useToast();

    const { activeModal, setActiveModal, parsedCondition, handleConditionChange, actions, addAction, updateAction, removeAction, cloneAction } =
        useWorkflowStepState({ step, idx, updateLocalStep });

    const isConditionEnabled = step.condition_expression !== null;
    const handleToggleCondition = () => {
        if (isConditionEnabled) {
            updateLocalStep(idx, {
                condition_expression: null,
                meta: {
                    ...(step.meta || {}),
                    condition_key: null,
                    condition_operator: null,
                    condition_value: null,
                },
            });
        } else {
            updateLocalStep(idx, {
                condition_expression: 'METADATA_KEY',
                meta: {
                    ...(step.meta || {}),
                    condition_key: 'METADATA_KEY',
                    condition_operator: 'truthy',
                    condition_value: '',
                },
            });
        }
    };

    // Filtered users for select dropdowns
    const userOptions = useMemo(() => {
        return (users || []).map((u: any) => ({
            value: String(u.id),
            label: `${u.name.toUpperCase()} (${(u.role || 'Staff').toUpperCase()})`,
            department_id: u.department_id,
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
    const [advancedSettingsOpen, setAdvancedSettingsOpen] = useState(false);
    const [conditionModalOpen, setConditionModalOpen] = useState(false);
    const [stepTab, setStepTab] = useState<'config' | 'actors' | 'actions'>('config');

    const updateConfig = (key: 'custom' | 'roles' | 'departments' | 'users' | 'is_default' | 'is_initiator_role' | 'is_initiator_department' | 'use_combination', value: any) => {
        const nextConfig = {
            custom: [],
            roles: [],
            departments: [],
            users: [],
            is_default: false,
            is_initiator_role: false,
            is_initiator_department: false,
            use_combination: true,
            ...(step.approver_config || {}),
            [key]: value
        };
        if (nextConfig.is_default) {
            nextConfig.custom = ['initiator'];
            nextConfig.roles = [];
            nextConfig.departments = [];
            nextConfig.users = [];
            nextConfig.is_initiator_role = false;
            nextConfig.is_initiator_department = false;
        }
        if (nextConfig.is_initiator_role) {
            nextConfig.roles = [];
        }
        if (nextConfig.is_initiator_department) {
            nextConfig.departments = [];
        }

        // Determine approver_type
        let appType = 'role';
        if (nextConfig.custom && nextConfig.custom.length > 0) {
            appType = nextConfig.custom[0];
        } else if (nextConfig.users && nextConfig.users.length > 0) {
            appType = 'user';
        } else if (nextConfig.is_initiator_role || (nextConfig.roles && nextConfig.roles.length > 0)) {
            appType = 'role';
        } else if (nextConfig.is_initiator_department || (nextConfig.departments && nextConfig.departments.length > 0)) {
            appType = 'role';
        }

        updateLocalStep(idx, {
            approver_config: nextConfig,
            approver_type: appType,
            role: nextConfig.roles,
            department_ids: nextConfig.departments,
            user_ids: nextConfig.users,
            filter_department: nextConfig.is_initiator_department
        });
    };


    const assigneeOptions = useMemo(() => {
        const assignAction = actions.find(
            (a: any) => a.master_action?.code?.toLowerCase().includes('assign') || a.master_action_name?.toLowerCase().includes('assign'),
        );
        const options: any[] = [];

        if (assignAction?.assignee_config) {
            const cfg = assignAction.assignee_config;

            // Legacy single type handling
            if (cfg.type) {
                if (cfg.type === 'initiator') {
                    options.push({ value: 'initiator', label: 'INISIATOR (PIC / PEMBUAT)' });
                } else if (cfg.type === 'atasan') {
                    options.push({ value: 'atasan', label: 'ATASAN LANGSUNG' });
                } else if (cfg.type === 'assigned_pic') {
                    options.push({ value: 'assigned_pic', label: 'PIC DITUGASKAN' });
                } else if (cfg.type === 'role' && cfg.roles) {
                    cfg.roles.forEach((r: string) => options.push({ value: `role_${r}`, label: `ROLE: ${r.toUpperCase()}` }));
                } else if (cfg.type === 'user' && cfg.user_ids) {
                    cfg.user_ids.forEach((uid: string) => {
                        const u = users.find((x: any) => String(x.id) === String(uid));
                        if (u) {
                            options.push({ value: `user_${u.id}`, label: `USER: ${u.name.toUpperCase()} (${u.role})` });
                        }
                    });
                }
            } else {
                // Multi-Source handling
                // 1. Custom Actors
                if (cfg.custom && cfg.custom.length > 0) {
                    cfg.custom.forEach((c: string) => {
                        if (c === 'initiator') {
                            options.push({ value: 'initiator', label: 'INISIATOR (PIC / PEMBUAT)' });
                        } else if (c === 'assigned_pic') {
                            options.push({ value: 'assigned_pic', label: 'PIC DITUGASKAN' });
                        } else if (c === 'creator') {
                            options.push({ value: 'creator', label: 'PEMBUAT' });
                        }
                    });
                }
                // 2. Roles
                if (cfg.is_initiator_role) {
                    options.push({ value: 'initiator_role', label: 'ROLE SESUAI INISIATOR' });
                } else if (cfg.roles && cfg.roles.length > 0) {
                    cfg.roles.forEach((r: string) => {
                        options.push({ value: `role_${r}`, label: `ROLE: ${r.toUpperCase()}` });
                    });
                }
                // 3. Departments
                if (cfg.is_initiator_department) {
                    options.push({ value: 'initiator_department', label: 'DIVISI SESUAI INISIATOR' });
                } else if (cfg.departments && cfg.departments.length > 0) {
                    cfg.departments.forEach((deptId: string) => {
                        const pool = divisions.length > 0 ? divisions : departments;
                        const dept = pool.find((d: any) => String(d.id) === String(deptId));
                        options.push({ value: `dept_${deptId}`, label: `DIVISI: ${dept ? dept.name.toUpperCase() : deptId}` });
                    });
                }
                // 4. Users
                if (cfg.users && cfg.users.length > 0) {
                    cfg.users.forEach((uid: string) => {
                        const u = users.find((x: any) => String(x.id) === String(uid));
                        if (u) {
                            options.push({ value: `user_${u.id}`, label: `USER: ${u.name.toUpperCase()} (${u.role})` });
                        }
                    });
                }
            }
        }
        return options.length ? options : undefined;
    }, [actions, users, departments, divisions]);

    const signerOptions = useMemo(() => {
        return users;
    }, [users]);

    const approverLabel = useMemo(() => {
        const cfg = step.approver_config || {};
        const parts: string[] = [];

        if (cfg.custom && cfg.custom.length > 0) {
            cfg.custom.forEach((c: string) => {
                if (c === 'initiator') parts.push('INISIATOR');
                if (c === 'assigned_pic') parts.push('PIC DITUGASKAN');
                if (c === 'atasan') parts.push('ATASAN LANGSUNG');
                if (c === 'creator') parts.push('PEMBUAT');
            });
        }
        if (cfg.is_initiator_role) {
            parts.push('ROLE INISIATOR');
        } else if (cfg.roles && cfg.roles.length > 0) {
            parts.push(`ROLE: ${cfg.roles.join(', ')}`);
        }
        if (cfg.is_initiator_department) {
            parts.push('DIVISI INISIATOR');
        } else if (cfg.departments && cfg.departments.length > 0) {
            const pool = divisions.length > 0 ? divisions : departments;
            const deptNames = cfg.departments.map((id: string) => pool.find((d) => String(d.id) === id)?.name || id);
            parts.push(`DIVISI: ${deptNames.join(', ')}`);
        }
        if (cfg.users && cfg.users.length > 0) {
            const userNames = cfg.users.map((id: any) => (users || []).find((u) => String(u.id) === String(id))?.name || id);
            parts.push(`USER: ${userNames.join(', ')}`);
        }

        if (parts.length === 0) {
            switch (step.approver_type) {
                case 'initiator':
                    return 'INISIATOR';
                case 'assigned_pic':
                    return 'PIC DITUGASKAN';
                case 'creator':
                    return 'PEMBUAT';
                case 'role': {
                    const rolesList = step.role || [];
                    const deptsList = step.department_ids || [];
                    if (rolesList.length === 0 && deptsList.length === 0) {
                        return 'ROLE POOL (SEMUA)';
                    }
                    const partsList = [];
                    if (rolesList.length > 0) {
                        partsList.push(rolesList.join(', '));
                    }
                    if (deptsList.length > 0) {
                        const pool = divisions.length > 0 ? divisions : departments;
                        const deptNames = deptsList.map((id: string) => pool.find((d) => String(d.id) === id)?.name || id);
                        partsList.push(`[${deptNames.join(', ')}]`);
                    }
                    return `ROLE: ${partsList.join(' ')}`;
                }
                case 'user': {
                    const usersList = step.user_ids || [];
                    if (usersList.length === 0) {
                        return 'USER POOL (SEMUA)';
                    }
                    const userNames = usersList.map((id: any) => (users || []).find((u) => String(u.id) === String(id))?.name || id);
                    return `USER: ${userNames.join(', ')}`;
                }
                default:
                    return '—';
            }
        }

        return parts.join(' | ');
    }, [step.approver_config, step.approver_type, step.role, step.department_ids, step.user_ids, departments, divisions, users]);

    const selectedStatus = useMemo(() => {
        return (contractStatuses || []).find((s: any) => s.code === step.meta?.target_status);
    }, [contractStatuses, step.meta?.target_status]);

    return (
        <div
            ref={setNodeRef}
            style={style}
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.target !== e.currentTarget) return;
                if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    onMoveKeyboard?.(idx, 'up');
                } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    onMoveKeyboard?.(idx, 'down');
                }
            }}
            className={cn(
                'group/step flex flex-col gap-0 transition-all duration-300 rounded-lg p-4 outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                isExpanded
                    ? 'border border-primary/40 dark:border-primary/50 bg-white dark:bg-zinc-900/90'
                    : 'border border-primary/20 dark:border-primary/30 bg-primary/[0.01] dark:bg-primary/[0.02] hover:bg-primary/[0.03] hover:border-primary/40',
                isExpanded ? 'overflow-visible' : 'overflow-hidden',
                isDragging && 'z-50 scale-[1.01] border-primary/60',
                isSelected && 'ring-2 ring-primary/50 border-primary bg-primary/[0.04] dark:bg-primary/[0.08]',
            )}
        >
            <div
                {...attributes}
                {...listeners}
                onClick={() => setIsExpanded(!isExpanded)}
                className={cn(
                    'group/header relative flex items-center cursor-grab active:cursor-grabbing gap-3 transition-all duration-300',
                    !step.approver_type && 'bg-rose-50/20 dark:bg-rose-950/10 p-2 rounded border border-dashed border-rose-200 dark:border-rose-900/50',
                )}
            >
                {/* Column 1: Bulk Select Checkbox */}
                {onToggleSelect && (
                    <div className="flex shrink-0 items-center justify-center">
                        <div
                            onClick={(e) => { e.stopPropagation(); onToggleSelect(step.id); }}
                            className={cn(
                                'flex h-5 w-5 items-center justify-center rounded border transition-all cursor-pointer z-10',
                                isSelected
                                    ? 'bg-primary border-primary opacity-100'
                                    : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 opacity-60 group-hover/step:opacity-100'
                            )}
                            title={isSelected ? 'Batalkan pilihan' : 'Pilih tahap ini'}
                        >
                            {isSelected && (
                                <svg viewBox="0 0 10 8" className="h-3 w-3 text-white fill-none stroke-current stroke-[1.5]">
                                    <polyline points="1,4 3.5,6.5 9,1" />
                                </svg>
                            )}
                        </div>
                    </div>
                )}

                {/* Column 2: Step Number Text Only (Tanpa Efek Card) */}
                <div className="flex shrink-0 items-center justify-center min-w-[24px]">
                    <span className="text-sm font-black text-slate-700 dark:text-slate-200 select-none">
                        {step.step}.
                    </span>
                </div>

                {/* Column 3: Status, Deskripsi & Action Buttons */}
                <div className="flex min-w-0 flex-1 items-center justify-between gap-4">
                    <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                        {/* Row 1: Status & Deskripsi (Single Row) */}
                        <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                            {/* Target Status Badge */}
                            {selectedStatus && (
                                <div
                                    className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase shrink-0"
                                    style={{
                                        backgroundColor: `${selectedStatus.color}15`,
                                        borderColor: `${selectedStatus.color}40`,
                                        color: selectedStatus.color,
                                    }}
                                >
                                    <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: selectedStatus.color }} />
                                    {selectedStatus.label}
                                </div>
                            )}

                            {/* Deskripsi Step */}
                            {step.description && (
                                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-snug truncate shrink">
                                    {step.description}
                                </p>
                            )}

                            {/* Conditional Flag */}
                            {step.condition_expression && (
                                <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 uppercase dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 shrink-0">
                                    <GitBranch size={10} /> BERSYARAT
                                </div>
                            )}

                            {/* Data Filters Indicator */}
                            {(step.filter_department || step.filter_company_group || step.filter_region || step.filter_company) && (
                                <div className="flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-600 uppercase dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400 shrink-0">
                                    <Shield size={10} className="shrink-0" />
                                    <div className="flex gap-1">
                                        {step.filter_department && <span>UNIT</span>}
                                        {step.filter_company_group && <span>GROUP</span>}
                                        {step.filter_region && <span>REG</span>}
                                        {step.filter_company && <span>COMP</span>}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Row 2: Action Buttons */}
                        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                            <StepSimulatorButtons
                                actions={actions}
                                idx={idx}
                                totalSteps={totalSteps}
                                allWorkflows={allWorkflows}
                                allWorkflowSteps={allWorkflowSteps}
                                setActiveModal={setActiveModal}
                            />
                        </div>
                    </div>

                    <div className="ml-6 flex shrink-0 items-center gap-2">
                        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800">
                            {onSavePreset && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onSavePreset(step);
                                    }}
                                    className="hover:text-amber-600 h-7 w-7 rounded-md text-amber-500/80 transition-all hover:bg-amber-50 dark:hover:bg-amber-950/40"
                                    title="Simpan sebagai Preset"
                                >
                                    <Bookmark size={12} />
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    duplicateLocalStep(idx);
                                }}
                                className="hover:text-primary h-7 w-7 rounded-md text-slate-400 transition-all hover:bg-white dark:hover:bg-slate-700"
                                title="Duplikat Tahap"
                            >
                                <Copy size={12} />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeLocalStep(idx);
                                }}
                                className="hover:text-rose-600 h-7 w-7 rounded-md text-slate-400 transition-all hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                title="Hapus Tahap"
                            >
                                <Trash2 size={12} />
                            </Button>
                        </div>
                        <div className="text-slate-400 transition-transform duration-300">
                            <ChevronUp size={16} className={cn('transition-transform duration-300', !isExpanded && 'rotate-180')} />
                        </div>
                    </div>
                </div>
            </div>

            {/* --- Premium Expansion Block --- */}
            {isExpanded && (
                <div className="animate-in fade-in slide-in-from-top-3 relative overflow-visible duration-300 mt-2">
                    {/* Inner Step Tab Switcher */}
                    <div className="flex border-b border-slate-200/80 dark:border-zinc-700/80 mb-4 gap-4 px-2">
                        <button
                            type="button"
                            onClick={() => setStepTab('config')}
                            className={cn(
                                'border-b-2 pb-2 text-sm font-semibold transition-all',
                                stepTab === 'config'
                                    ? 'border-primary text-primary dark:text-zinc-100 font-extrabold'
                                    : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200 font-medium',
                            )}
                        >
                            Konfigurasi Langkah
                        </button>
                        <button
                            type="button"
                            onClick={() => setStepTab('actors')}
                            className={cn(
                                'border-b-2 pb-2 text-sm font-semibold transition-all',
                                stepTab === 'actors'
                                    ? 'border-primary text-primary dark:text-zinc-100 font-extrabold'
                                    : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200 font-medium',
                            )}
                        >
                            Aktor & Otoritas
                        </button>
                        <button
                            type="button"
                            onClick={() => setStepTab('actions')}
                            className={cn(
                                'flex items-center gap-1.5 border-b-2 pb-2 text-sm font-semibold transition-all',
                                stepTab === 'actions'
                                    ? 'border-primary text-primary dark:text-zinc-100 font-extrabold'
                                    : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200 font-medium',
                            )}
                        >
                            Konfigurasi Aksi
                            <span className={cn(
                                'rounded-full px-1.5 py-0.2 text-[9px] font-bold',
                                stepTab === 'actions'
                                    ? 'bg-primary/10 text-primary dark:bg-primary/20'
                                    : 'bg-slate-200/80 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                            )}>
                                {actions.length}
                            </span>
                        </button>
                    </div>

                    <div className="relative z-10 py-3">
                        {stepTab === 'config' && (
                            <div className="space-y-6 animate-in fade-in duration-200 w-full">
                                {/* --- Column 1: Step Settings (Basic Settings & Conditions) --- */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-2 pb-2 border-b border-slate-200/80 dark:border-zinc-800">
                                        <Settings2 size={14} className="text-slate-400" />
                                        <h4 className="text-xs font-bold tracking-wide text-slate-800 dark:text-zinc-100">
                                            Detail Langkah & Kondisi
                                        </h4>
                                    </div>

                                    <div className="grid grid-cols-12 gap-4 items-end">
                                        {/* Deskripsi */}
                                        <div className="col-span-12 md:col-span-4">
                                            <FormInput
                                                label="Deskripsi Tahap"
                                                labelClassName="text-xs font-bold text-slate-800 dark:text-zinc-200"
                                                value={step.description || step.label || ''}
                                                onChange={(e) => updateLocalStep(idx, { description: e.target.value, label: e.target.value })}
                                                placeholder="Contoh: Review Legal Staff"
                                                variant="outline"
                                                className="h-10 rounded-lg border-slate-200/80 bg-white text-sm font-medium transition-all outline-none focus:border-slate-900 dark:border-zinc-700/80 dark:bg-zinc-900 dark:text-zinc-100"
                                            />
                                        </div>

                                        {/* Target Status */}
                                        <div className="col-span-12 sm:col-span-6 md:col-span-4 space-y-1.5">
                                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Status Kontrak Target</label>
                                            <Select
                                                value={step.meta?.target_status || 'default'}
                                                onValueChange={(v) => {
                                                    updateLocalStep(idx, {
                                                        meta: {
                                                            ...(step.meta || {}),
                                                            target_status: v === 'default' ? null : v,
                                                        },
                                                    });
                                                }}
                                            >
                                                <SelectTrigger className="h-10 rounded-lg border-slate-200 bg-white text-sm font-medium transition-all focus:border-slate-900 dark:border-slate-800 dark:bg-black/50">
                                                    <SelectValue placeholder="Pilih Status" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl">
                                                    <SelectItem value="default" className="py-2 text-sm font-medium text-slate-500 uppercase">
                                                        DEFAULT (OTOMATIS)
                                                    </SelectItem>
                                                    {contractStatuses.map((status: any) => (
                                                        <SelectItem
                                                            key={status.id}
                                                            value={status.code}
                                                            className="py-2 text-sm font-medium uppercase"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <div
                                                                    className="h-2 w-2 rounded-full"
                                                                    style={{ backgroundColor: status.color || '#cbd5e1' }}
                                                                />
                                                                <span>
                                                                    {(status.label || status.name || status.code || '').toUpperCase()} (
                                                                    {status.code?.toUpperCase()})
                                                                </span>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Advanced Settings Button */}
                                        <div className="col-span-12 sm:col-span-6 md:col-span-4 space-y-1.5">
                                            <label className="text-xs font-bold text-slate-800 dark:text-zinc-200">Pengaturan Lanjutan</label>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full justify-start h-10 rounded-lg text-sm font-bold border-slate-200/80 dark:border-zinc-700/80 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
                                                onClick={() => setAdvancedSettingsOpen(true)}
                                            >
                                                <Settings2 className="mr-2 h-4 w-4 text-primary" />
                                                Pengaturan Lanjutan Tahap
                                            </Button>
                                            <AdvancedStepSettingsModal
                                                open={advancedSettingsOpen}
                                                onOpenChange={setAdvancedSettingsOpen}
                                                step={step}
                                                onUpdateStep={(updates) => updateLocalStep(idx, updates)}
                                            />
                                        </div>

                                    </div>

                                    {/* Condition Expression */}
                                    <div className="space-y-4 border-t border-slate-100 pt-4 dark:border-slate-800">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <GitBranch size={13} className="text-slate-400" />
                                                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">Ekspresi Kondisi (Metadata)</h4>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleToggleCondition}
                                                className={cn(
                                                    'flex h-6 cursor-pointer items-center gap-2 rounded-full px-3 text-[10px] font-bold uppercase transition-all',
                                                    isConditionEnabled
                                                        ? 'bg-primary text-white shadow-xs'
                                                        : 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-500',
                                                )}
                                            >
                                                {isConditionEnabled ? 'AKTIF' : 'NON-AKTIF'}
                                            </button>
                                        </div>

                                        {isConditionEnabled ? (
                                            <div className="space-y-4 animate-in fade-in-50 duration-200 pt-2">
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                                    {/* Key Input */}
                                                    <FormInput
                                                        label={
                                                            <span className="flex items-center gap-1">
                                                                <Key className="h-3 w-3" />
                                                                <span>Metadata Key</span>
                                                            </span>
                                                        }
                                                        labelClassName="text-xs font-bold text-slate-700 dark:text-slate-300"
                                                        value={parsedCondition.key}
                                                        onChange={(e) => handleConditionChange({ key: e.target.value })}
                                                        placeholder="Contoh: contract.has_tax"
                                                        variant="outline"
                                                        className="h-10 rounded-lg border-slate-200 bg-white text-sm font-medium transition-all outline-none focus:border-slate-900 focus:bg-white dark:border-slate-800 dark:bg-slate-900/50 dark:focus:bg-slate-900"
                                                    />

                                                    {/* Operator Input */}
                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Operator</label>
                                                        <Select
                                                            value={parsedCondition.operator}
                                                            onValueChange={(v) => handleConditionChange({ operator: v })}
                                                        >
                                                            <SelectTrigger className="h-10 rounded-lg border-slate-200 bg-white text-sm font-medium transition-all focus:border-slate-900 dark:border-slate-800 dark:bg-black/50">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent className="rounded-xl">
                                                                <SelectItem value="truthy" className="py-2 text-sm font-medium uppercase">
                                                                    TRUTHY
                                                                </SelectItem>
                                                                <SelectItem value="==" className="py-2 text-sm font-medium uppercase">
                                                                    == (SAMA)
                                                                </SelectItem>
                                                                <SelectItem value="!=" className="py-2 text-sm font-medium uppercase">
                                                                    != (BEDA)
                                                                </SelectItem>
                                                                <SelectItem value=">" className="py-2 text-sm font-medium uppercase">
                                                                    &gt; (LEBIH)
                                                                </SelectItem>
                                                                <SelectItem value="<" className="py-2 text-sm font-medium uppercase">
                                                                    &lt; (KURANG)
                                                                </SelectItem>
                                                                <SelectItem value="contains" className="py-2 text-sm font-medium uppercase">
                                                                    CONTAINS
                                                                </SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    {/* Expected Value Input */}
                                                    {parsedCondition.operator !== 'truthy' ? (
                                                        <FormInput
                                                            label="Expected Value"
                                                            labelClassName="text-xs font-bold text-slate-700 dark:text-slate-300"
                                                            value={parsedCondition.value}
                                                            onChange={(e) => handleConditionChange({ value: e.target.value })}
                                                            placeholder="Nilai yang diharapkan"
                                                            variant="outline"
                                                            className="h-10 rounded-lg border-slate-200 bg-white text-sm font-medium transition-all outline-none focus:border-slate-900 focus:bg-white dark:border-slate-800 dark:bg-slate-900/50 dark:focus:bg-slate-900"
                                                        />
                                                    ) : (
                                                        <div className="space-y-1.5 opacity-40 pointer-events-none">
                                                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Expected Value</label>
                                                            <div className="h-10 rounded-lg border border-slate-100 bg-slate-50/50 dark:border-slate-800/50 dark:bg-slate-900 px-3 flex items-center text-sm font-medium text-slate-400">
                                                                Tidak diperlukan untuk Truthy
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex h-12 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/30 dark:border-slate-800/50 dark:bg-black/10">
                                                <p className="text-sm font-medium text-slate-400 dark:text-slate-500">
                                                    Selalu Diproses (Tanpa Kondisi)
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}                        {stepTab === 'actors' && (
                            <div className="space-y-6 animate-in fade-in duration-200 w-full">
                                <AuthorityTableManager
                                    title="Otoritas Langkah"
                                    authorities={step.approver_authorities || []}
                                    onChange={(vals) => updateLocalStep(idx, { approver_authorities: vals })}
                                    users={users}
                                    roles={roles}
                                    departments={departments}
                                    divisions={divisions}
                                    companyGroups={companyGroups}
                                    companies={companies}
                                    regions={regions}
                                    showCustom={true}
                                />
                            </div>
                        )}

                        {stepTab === 'actions' && (
                            <div className="space-y-4 animate-in fade-in duration-200">
                                <div className="flex items-center justify-end">
                                    <button
                                        type="button"
                                        onClick={addAction}
                                        className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg bg-primary text-white shadow-sm hover:bg-primary/90 transition-all text-sm font-bold cursor-pointer"
                                    >
                                        + Tambah Aksi
                                    </button>
                                </div>

                                {actions.length === 0 ? (
                                    <div className="rounded-xl border border-dashed border-slate-200 py-6 text-center text-xs text-slate-500 uppercase italic dark:border-slate-800">
                                        Belum ada aksi yang dikonfigurasi. Klik tombol di atas untuk menambah.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-4 py-2 md:grid-cols-2">
                                        {actions.map((act: any, actIdx: number) => {
                                            return (
                                                <div key={act.id || actIdx} className="animate-in fade-in relative duration-300">
                                                    <StepActionConfigCard
                                                        act={act}
                                                        actIdx={actIdx}
                                                        idx={idx}
                                                        step={step}
                                                        allWorkflows={allWorkflows}
                                                        allWorkflowSteps={allWorkflowSteps}
                                                        roles={roles}
                                                        departments={departments}
                                                        divisions={divisions}
                                                        companyGroups={companyGroups}
                                                        regions={regions}
                                                        users={users}
                                                        updateAction={updateAction}
                                                        removeAction={removeAction}
                                                        cloneAction={cloneAction}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
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

            <RejectModal isOpen={activeModal === 'reject'} onClose={() => setActiveModal(null)} step={step} idx={idx} showToast={showToast} />

            <AssignModal
                isOpen={activeModal === 'assign_pic'}
                onClose={() => setActiveModal(null)}
                assigneeOptions={assigneeOptions || []}
                showToast={showToast}
            />

            <SignerModal
                isOpen={activeModal === 'sign'}
                onClose={() => setActiveModal(null)}
                step={step}
                idx={idx}
                showToast={showToast}
                userOptions={signerOptions || []}
            />
            <ForwardModal isOpen={activeModal === 'forward'} onClose={() => setActiveModal(null)} step={step} idx={idx} showToast={showToast} />

            <ConditionExpressionModal
                open={conditionModalOpen}
                onOpenChange={setConditionModalOpen}
                step={step}
                idx={idx}
                updateLocalStep={updateLocalStep}
                parsedCondition={parsedCondition}
                handleConditionChange={handleConditionChange}
            />
        </div>
    );
}
