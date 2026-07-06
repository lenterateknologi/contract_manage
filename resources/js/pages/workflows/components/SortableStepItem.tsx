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
    Briefcase,
    CheckCircle2,
    ChevronUp,
    Copy,
    GitBranch,
    Key,
    Settings2,
    Shield,
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
    regions = [],
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
    divisions?: any[];
    users: any[];
    companyGroups?: any[];
    regions?: any[];
    allWorkflows?: any[];
    allWorkflowSteps?: any[];
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
            className={cn(
                'group/step flex flex-col gap-0 transition-all duration-300 bg-white dark:bg-slate-900/40 border rounded-lg p-4',
                isExpanded
                    ? 'border-slate-300 dark:border-slate-700 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-900/60',
                isExpanded ? 'overflow-visible' : 'overflow-hidden',
                isDragging && 'z-50 scale-[1.01] border-primary/20 shadow-md',
            )}
        >
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                className={cn(
                    'group/header relative flex cursor-pointer gap-3 transition-all duration-300',
                    !step.approver_type && 'bg-rose-50/20 dark:bg-rose-950/10 p-2 rounded border border-dashed border-rose-200 dark:border-rose-900/50',
                )}
            >
                <div className="flex shrink-0 flex-col items-center">
                    <div
                        {...attributes}
                        {...listeners}
                        onClick={(e) => e.stopPropagation()}
                        className="border-primary/5 bg-primary/[0.03] hover:bg-primary/10 hover:border-primary/20 flex h-10 w-10 cursor-grab items-center justify-center rounded-xl border transition-all"
                    >
                        <div className="bg-primary/30 mb-0.5 h-1.5 w-1.5 rounded-full" />
                        <span className="text-primary/40 text-xs leading-none font-semibold">#{step.step}</span>
                    </div>
                </div>

                <div className="flex min-w-0 flex-1 items-center justify-between">
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                            <div
                                title={approverLabel}
                                className={cn(
                                    'flex max-w-[280px] items-center gap-1.5 truncate rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase',
                                    APPROVER_TYPE_STYLES[step.approver_type] || APPROVER_TYPE_STYLES.role,
                                )}
                            >
                                <UserCheck size={10} className="shrink-0" /> <span className="truncate">{approverLabel}</span>
                            </div>

                            {/* Conditional Flag */}
                            {step.condition_expression && (
                                <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[10px] font-medium text-slate-600 uppercase dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                                    <GitBranch size={10} /> BERSYARAT
                                </div>
                            )}

                            {/* Target Status Badge */}
                            {selectedStatus && (
                                <div
                                    className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase"
                                    style={{
                                        backgroundColor: `${selectedStatus.color}10`,
                                        borderColor: `${selectedStatus.color}30`,
                                        color: selectedStatus.color,
                                    }}
                                >
                                    <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: selectedStatus.color }} />
                                    {selectedStatus.label}
                                </div>
                            )}

                            {/* Data Filters Indicator */}
                            {(step.filter_department || step.filter_company_group || step.filter_region || step.filter_company) && (
                                <div className="flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2 py-1 text-[10px] font-medium text-indigo-600 uppercase dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400">
                                    <Shield size={10} className="shrink-0" />
                                    <div className="flex gap-1">
                                        {step.filter_department && <span>UNIT</span>}
                                        {step.filter_company_group && <span>GROUP</span>}
                                        {step.filter_region && <span>REG</span>}
                                        {step.filter_company && <span>COMP</span>}
                                    </div>
                                </div>
                            )}

                            {/* Simulator Buttons in Header */}
                            <StepSimulatorButtons
                                actions={actions}
                                idx={idx}
                                totalSteps={totalSteps}
                                allWorkflows={allWorkflows}
                                allWorkflowSteps={allWorkflowSteps}
                                setActiveModal={setActiveModal}
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                            {step.description && (
                                <span className="text-xs font-normal text-slate-500 italic dark:text-slate-400">"{step.description}"</span>
                            )}

                            {step.allowed_actions?.length > 0 && (
                                <div className="flex items-center gap-1">
                                    <Shield size={10} className="text-slate-400" />
                                    <span className="text-[10px] font-medium text-slate-500 uppercase dark:text-slate-400">
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
                                    moveLocalStep(idx, 'up');
                                }}
                                disabled={idx === 0}
                                className="hover:text-primary h-7 w-7 rounded-md text-slate-400 transition-all hover:bg-white disabled:opacity-10 dark:hover:bg-slate-700"
                                title="Pindah ke Atas"
                            >
                                <ArrowUp size={12} />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    moveLocalStep(idx, 'down');
                                }}
                                disabled={idx === totalSteps - 1}
                                className="hover:text-primary h-7 w-7 rounded-md text-slate-400 transition-all hover:bg-white disabled:opacity-10 dark:hover:bg-slate-700"
                                title="Pindah ke Bawah"
                            >
                                <ArrowDown size={12} />
                            </Button>
                        </div>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                                e.stopPropagation();
                                removeLocalStep(idx);
                            }}
                            className="h-8 w-8 rounded-lg text-slate-300 transition-all hover:bg-rose-50 hover:text-rose-500 dark:text-slate-700 dark:hover:bg-rose-500/10"
                        >
                            <Trash2 size={14} />
                        </Button>
                    </div>
                </div>
            </div>

            {/* --- Premium Expansion Block --- */}
            {isExpanded && (
                <div className="animate-in fade-in slide-in-from-top-3 relative overflow-visible duration-300 mt-2">
                    {/* Inner Step Tab Switcher */}
                    <div className="flex border-b border-slate-200 dark:border-slate-800 mb-4 gap-4 px-2">
                        <button
                            type="button"
                            onClick={() => setStepTab('config')}
                            className={cn(
                                'border-b-2 pb-2 text-sm font-semibold transition-all',
                                stepTab === 'config'
                                    ? 'border-primary text-primary dark:text-white'
                                    : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300',
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
                                    ? 'border-primary text-primary dark:text-white'
                                    : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300',
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
                                    ? 'border-primary text-primary dark:text-white'
                                    : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300',
                            )}
                        >
                            Konfigurasi Aksi
                            <span className={cn(
                                'rounded-full px-1.5 py-0.2 text-[9px] font-bold',
                                stepTab === 'actions'
                                    ? 'bg-primary/10 text-primary dark:bg-primary/20'
                                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
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
                                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                                        <Settings2 size={14} className="text-slate-400" />
                                        <h4 className="text-xs font-bold tracking-wide text-slate-700 dark:text-slate-300">
                                            Detail Langkah & Kondisi
                                        </h4>
                                    </div>

                                    <div className="grid grid-cols-12 gap-4 items-end">
                                        {/* Deskripsi */}
                                        <div className="col-span-12 md:col-span-4">
                                            <FormInput
                                                label="Deskripsi Tahap"
                                                labelClassName="text-xs font-bold text-slate-700 dark:text-slate-300"
                                                value={step.description || step.label || ''}
                                                onChange={(e) => updateLocalStep(idx, { description: e.target.value, label: e.target.value })}
                                                placeholder="Contoh: Review Legal Staff"
                                                variant="outline"
                                                className="h-10 rounded-lg border-slate-200 bg-white text-sm font-medium transition-all outline-none focus:border-slate-900 focus:bg-white dark:border-slate-800 dark:bg-slate-900/50 dark:focus:bg-slate-900"
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
                                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Pengaturan Lanjutan</label>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full justify-start h-10 rounded-lg text-sm font-semibold bg-white dark:bg-slate-900"
                                                onClick={() => setAdvancedSettingsOpen(true)}
                                            >
                                                <Settings2 className="mr-2 h-4 w-4" />
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
