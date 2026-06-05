import { AdvancedStepSettingsModal } from './modals/AdvancedStepSettingsModal';
import { ConditionExpressionModal } from './modals/ConditionExpressionModal';
import { Button } from '@/components/ui/base/Button';
import { Checkbox } from '@/components/ui/base/Checkbox';
import { useToast } from '@/components/ui/feedback/Toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/forms/Select';
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

import { SearchableMultiSelect } from '@/components/ui/forms/SearchableMultiSelect';
import { ALL_ROLES, APPROVER_TYPE_STYLES } from '../constants';
import { useWorkflowStepState } from '../hooks/useWorkflowStepState';
import { StepActionConfigCard } from './StepActionConfigCard';
import { StepSimulatorButtons } from './StepSimulatorButtons';

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

    const { activeModal, setActiveModal, parsedCondition, handleConditionChange, actions, addAction, updateAction, removeAction } =
        useWorkflowStepState({ step, idx, updateLocalStep });

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

    const updateConfig = (key: 'custom' | 'roles' | 'departments' | 'users' | 'is_default' | 'is_initiator_role' | 'is_initiator_department', value: any) => {
        const nextConfig = {
            custom: [],
            roles: [],
            departments: [],
            users: [],
            is_default: false,
            is_initiator_role: false,
            is_initiator_department: false,
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
        updateLocalStep(idx, {
            approver_config: nextConfig,
            approver_type: nextConfig.custom.length > 0 ? nextConfig.custom[0] : (nextConfig.users.length > 0 ? 'user' : (nextConfig.roles.length > 0 ? 'role' : 'role')),
            role: nextConfig.roles,
            department_ids: nextConfig.departments,
            user_ids: nextConfig.users
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
                    options.push({ value: 'initiator_department', label: 'DEPARTEMEN SESUAI INISIATOR' });
                } else if (cfg.departments && cfg.departments.length > 0) {
                    cfg.departments.forEach((deptId: string) => {
                        const dept = departments.find((d: any) => String(d.id) === String(deptId));
                        options.push({ value: `dept_${deptId}`, label: `DEPARTEMEN: ${dept ? dept.name.toUpperCase() : deptId}` });
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
    }, [actions, users, departments]);

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
            });
        }
        if (cfg.is_initiator_role) {
            parts.push('ROLE INISIATOR');
        } else if (cfg.roles && cfg.roles.length > 0) {
            parts.push(`ROLE: ${cfg.roles.join(', ')}`);
        }
        if (cfg.is_initiator_department) {
            parts.push('DEPT INISIATOR');
        } else if (cfg.departments && cfg.departments.length > 0) {
            const deptNames = cfg.departments.map((id: string) => departments.find((d) => String(d.id) === id)?.name || id);
            parts.push(`DEPT: ${deptNames.join(', ')}`);
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
                        const deptNames = deptsList.map((id: string) => departments.find((d) => String(d.id) === id)?.name || id);
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
                    return 'BELUM DIATUR';
            }
        }

        return parts.join(' + ');
    }, [step.approver_config, step.approver_type, step.role, step.department_ids, step.user_ids, departments, users]);

    const selectedStatus = useMemo(() => {
        return (contractStatuses || []).find((s: any) => s.code === step.meta?.target_status);
    }, [contractStatuses, step.meta?.target_status]);

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                'group/step flex flex-col gap-0 transition-all duration-300',
                isExpanded ? 'overflow-visible' : 'overflow-hidden',
                isDragging && 'z-50 scale-[1.01]',
            )}
        >
            <div
                className={cn(
                    'group/header dark:bg-card relative flex gap-3 rounded-2xl border p-3 transition-all duration-500',
                    isExpanded
                        ? 'rounded-b-none border-b-0 bg-white shadow-xl dark:bg-white/[0.02]'
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
                        <span className="text-primary/40 text-[10px] leading-none font-semibold">#{step.step}</span>
                    </div>
                </div>

                <div className="flex min-w-0 flex-1 items-center justify-between">
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                            <div
                                title={approverLabel}
                                className={cn(
                                    'flex max-w-[280px] items-center gap-1.5 truncate rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase',
                                    APPROVER_TYPE_STYLES[step.approver_type] || APPROVER_TYPE_STYLES.role,
                                )}
                            >
                                <UserCheck size={10} className="shrink-0" /> <span className="truncate">{approverLabel}</span>
                            </div>

                            {/* Conditional Flag */}
                            {step.condition_expression && (
                                <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[9px] font-semibold text-slate-600 uppercase dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                                    <GitBranch size={10} /> BERSYARAT
                                </div>
                            )}

                            {/* Target Status Badge */}
                            {selectedStatus && (
                                <div
                                    className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase"
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
                                <div className="flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2 py-1 text-[8px] font-semibold text-indigo-600 uppercase dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400">
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
                                <span className="text-[10px] font-medium text-slate-500 italic dark:text-slate-400">"{step.description}"</span>
                            )}

                            {step.allowed_actions?.length > 0 && (
                                <div className="flex items-center gap-1">
                                    <Shield size={10} className="text-slate-400" />
                                    <span className="text-[9px] font-bold  text-slate-500 uppercase dark:text-slate-400">
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
                <div className="border-primary/10 animate-in fade-in slide-in-from-top-6 relative overflow-visible rounded-b-3xl border-x border-b bg-white shadow-xl duration-500 dark:bg-black/40">
                    <div className="relative z-10 p-4">
                        <div className="grid grid-cols-12 gap-6">
                            {/* --- Column 1: Step Settings (Basic Settings & Conditions) --- */}
                            <div className="col-span-12 lg:col-span-5 space-y-6">
                                <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                                    <Settings2 size={14} className="text-slate-400" />
                                    <h4 className="text-[10px] font-semibold tracking-[0.2em] text-slate-400 uppercase">
                                        Konfigurasi Langkah
                                    </h4>
                                </div>

                                <div className="space-y-4">
                                    {/* Deskripsi */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase">Deskripsi Tahap</label>
                                        <input
                                            value={step.description || step.label || ''}
                                            onChange={(e) => updateLocalStep(idx, { description: e.target.value, label: e.target.value })}
                                            placeholder="Contoh: Review Legal Staff"
                                            className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-[11px] font-bold transition-all outline-none focus:border-slate-900 focus:bg-white dark:border-slate-800 dark:bg-slate-900/50 dark:focus:bg-slate-900"
                                        />
                                        <p className="text-[9px] leading-tight text-slate-400">Nama atau penjelasan tahap ini.</p>
                                    </div>

                                    {/* Target Status & Advanced Settings Group (2 Columns) */}
                                    <div className="rounded-2xl border border-slate-100 bg-slate-50/30 p-4 dark:border-slate-800/50 dark:bg-card/20 space-y-3">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                                            {/* Column 1: Target Status */}
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase">Status Kontrak Target</label>
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
                                                    <SelectTrigger className="h-9 rounded-xl border-slate-200 bg-white text-[11px] font-bold transition-all focus:border-slate-900 dark:border-slate-800 dark:bg-black/50">
                                                        <div className="flex items-center gap-2">
                                                            {selectedStatus && (
                                                                <div
                                                                    className="h-2 w-2 rounded-full"
                                                                    style={{ backgroundColor: selectedStatus.color || '#cbd5e1' }}
                                                                />
                                                            )}
                                                            <SelectValue placeholder="Pilih Status" />
                                                        </div>
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-xl">
                                                        <SelectItem value="default" className="py-2 text-[10px] font-bold text-slate-500 uppercase">
                                                            DEFAULT (OTOMATIS)
                                                        </SelectItem>
                                                        {contractStatuses.map((status: any) => (
                                                            <SelectItem
                                                                key={status.id}
                                                                value={status.code}
                                                                className="py-2 text-[10px] font-bold uppercase"
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

                                            {/* Column 2: Advanced Settings Button */}
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase">Pengaturan Lanjutan</label>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="w-full justify-start h-9 rounded-xl text-[11px] font-bold bg-white dark:bg-slate-900"
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
                                        <p className="text-[9px] leading-tight text-slate-400">Status otomatis jika langkah ini aktif.</p>
                                    </div>

                                    {/* Condition Expression */}
                                    <div className="space-y-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <GitBranch size={13} className="text-slate-400" />
                                                <h4 className="text-[10px] font-semibold text-slate-500 uppercase">Ekspresi Kondisi (Metadata)</h4>
                                            </div>
                                            <span className={cn(
                                                "px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase",
                                                step.condition_expression !== null 
                                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                                            )}>
                                                {step.condition_expression !== null ? 'AKTIF' : 'NON-AKTIF'}
                                            </span>
                                        </div>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            type="button"
                                            className="w-fit"
                                            onClick={() => setConditionModalOpen(true)}
                                        >
                                            <GitBranch className="mr-2 h-4 w-4" />
                                            {step.condition_expression !== null ? 'Ubah Kondisi' : 'Atur Kondisi'}
                                        </Button>
                                        
                                        {step.condition_expression !== null && (
                                            <p className="mt-2 text-[10px] text-slate-400">
                                                Ekspresi Aktif:{' '}
                                                <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-600 dark:bg-slate-800 dark:text-slate-300 break-all">
                                                    {step.condition_expression}
                                                </code>
                                            </p>
                                        )}
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
                                </div>
                            </div>

                            {/* --- Column 2: Actors / People Settings --- */}
                            <div className="col-span-12 lg:col-span-7 space-y-6 lg:border-l lg:border-slate-100 dark:lg:border-slate-800 lg:pl-6 pt-6 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                                    <UsersIcon size={14} className="text-slate-400" />
                                    <h4 className="text-[10px] font-semibold tracking-[0.2em] text-slate-400 uppercase">
                                        Pool Otoritas Langkah (Multi-Source)
                                    </h4>
                                </div>

                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    {/* 1. Custom Targets */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 px-1">
                                            <Settings2 size={12} className="text-slate-400" />
                                            <span className="text-[10px] font-semibold text-slate-500 uppercase font-bold">Aktor Kustom</span>
                                        </div>
                                        <SearchableMultiSelect
                                            values={step.approver_config?.custom || []}
                                            onValuesChange={(vals: string[]) => updateConfig('custom', vals)}
                                            options={[
                                                { value: 'initiator', label: 'INISIATOR' },
                                                { value: 'assigned_pic', label: 'PIC DITUGASKAN' }
                                            ]}
                                            placeholder="Pilih Aktor..."
                                        />
                                    </div>

                                    {/* 2. Role Pool */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between px-1">
                                            <div className="flex items-center gap-2">
                                                <Shield size={12} className="text-slate-400" />
                                                <span className="text-[10px] font-semibold text-slate-500 uppercase font-bold">Berdasarkan Role</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Checkbox
                                                    id={`step-init-role-${idx}`}
                                                    checked={step.approver_config?.is_initiator_role === true}
                                                    onCheckedChange={(checked) => updateConfig('is_initiator_role', checked === true)}
                                                />
                                                <label htmlFor={`step-init-role-${idx}`} className="text-[9px] font-bold text-slate-400 cursor-pointer uppercase">Sesuai Inisiator</label>
                                            </div>
                                        </div>
                                        <SearchableMultiSelect
                                            values={step.approver_config?.roles || []}
                                            onValuesChange={(vals: string[]) => updateConfig('roles', vals)}
                                            options={roles.map((r: any) => ({ value: r.name, label: r.name }))}
                                            placeholder={step.approver_config?.is_initiator_role ? "DITENTUKAN DARI ROLE INISIATOR" : "Pilih Role..."}
                                            disabled={step.approver_config?.is_initiator_role === true}
                                        />
                                    </div>

                                    {/* 3. Departemen Pool */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between px-1">
                                            <div className="flex items-center gap-2">
                                                <Briefcase size={12} className="text-slate-400" />
                                                <span className="text-[10px] font-semibold text-slate-500 uppercase font-bold">Departemen Pool</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Checkbox
                                                    id={`step-init-dept-${idx}`}
                                                    checked={step.approver_config?.is_initiator_department === true}
                                                    onCheckedChange={(checked) => updateConfig('is_initiator_department', checked === true)}
                                                />
                                                <label htmlFor={`step-init-dept-${idx}`} className="text-[9px] font-bold text-slate-400 cursor-pointer uppercase">Sesuai Inisiator</label>
                                            </div>
                                        </div>
                                        <SearchableMultiSelect
                                            values={step.approver_config?.departments || []}
                                            onValuesChange={(vals: string[]) => updateConfig('departments', vals)}
                                            options={departments.map((d: any) => ({ value: String(d.id), label: d.name }))}
                                            placeholder={step.approver_config?.is_initiator_department ? "DITENTUKAN DARI DEPT INISIATOR" : "Pilih Unit..."}
                                            disabled={step.approver_config?.is_initiator_department === true}
                                        />
                                    </div>

                                    {/* 4. User Spesifik */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 px-1">
                                            <UsersIcon size={12} className="text-slate-400" />
                                            <span className="text-[10px] font-semibold text-slate-500 uppercase font-bold">User Spesifik</span>
                                        </div>
                                        <SearchableMultiSelect
                                            values={step.approver_config?.users || []}
                                            onValuesChange={(vals: string[]) => updateConfig('users', vals)}
                                            options={userOptions}
                                            placeholder="Pilih User..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* --- Section 3: Konfigurasi Aksi --- */}
                    <div className="border-t border-slate-100 bg-slate-50/20 px-8 py-6 dark:border-slate-800 dark:bg-black/10">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-semibold tracking-[0.2em] text-slate-400 uppercase">Konfigurasi Aksi</span>
                                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-500 dark:bg-slate-800">
                                        {actions.length} Aksi
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={addAction}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[9px] font-semibold text-slate-700 uppercase shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                                >
                                    + Tambah Aksi
                                </button>
                            </div>

                            {actions.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-slate-200 py-6 text-center text-[10px] font-bold text-slate-400 uppercase italic dark:border-slate-800">
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
                                                    users={users}
                                                    updateAction={updateAction}
                                                    removeAction={removeAction}
                                                />
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
