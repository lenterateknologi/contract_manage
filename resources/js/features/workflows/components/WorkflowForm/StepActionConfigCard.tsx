import { Button } from '@/components/ui/buttons/Button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialogs/Dialog';
import { SearchableMultiSelectPortal } from '@/components/ui/selection/SearchableMultiSelectPortal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/selection/Select';
import {
    ArrowDown,
    ArrowRight,
    ArrowUp,
    Copy,
    CornerDownLeft,
    Eye,
    EyeOff,
    Flag,
    GitBranch,
    Key,
    RefreshCw,
    Settings2,
    Sparkles,
    Target,
    Trash2,
    UserCheck,
    UserPlus,
    Users as UsersIcon,
    Workflow as WorkflowIcon,
    Zap,
} from 'lucide-react';
import { useState } from 'react';

import LucideIcons from '@/lib/lucide-dynamic';
import { cn } from '@/lib/utils';
import { AUTOFILLED_PARAMS, AVAILABLE_FIELDS, MASTER_ACTIONS, TRANSITION_OPTIONS } from '../../utils/constants';
import AuthorityTableManager from '../Authority/AuthorityTableManager';

const mapConfigToAuthorities = (config: any) => {
    if (!config) return [];
    if (config.authorities && Array.isArray(config.authorities)) {
        return config.authorities;
    }
    if (Array.isArray(config)) {
        return config;
    }

    const list: any[] = [];
    if (config.custom && Array.isArray(config.custom)) {
        config.custom.forEach((c: string) => {
            if (c) list.push({ authority_type: 'custom', user_id: c });
        });
    }
    if (config.users && Array.isArray(config.users)) {
        config.users.forEach((u: string) => {
            if (u) list.push({ authority_type: 'user', user_id: u });
        });
    }
    if (config.roles && Array.isArray(config.roles)) {
        config.roles.forEach((r: string) => {
            if (r) list.push({ authority_type: 'role', role_id: r });
        });
    }
    if (config.departments && Array.isArray(config.departments)) {
        config.departments.forEach((d: string) => {
            if (d) list.push({ authority_type: 'department', department_id: d });
        });
    }
    if (config.divisions && Array.isArray(config.divisions)) {
        config.divisions.forEach((d: string) => {
            if (d) list.push({ authority_type: 'division', division_id: d });
        });
    }
    if (config.locations && Array.isArray(config.locations)) {
        config.locations.forEach((loc: string) => {
            if (loc) list.push({ authority_type: 'location', location_id: loc });
        });
    }
    if (config.company_groups && Array.isArray(config.company_groups)) {
        config.company_groups.forEach((cg: string) => {
            if (cg) list.push({ authority_type: 'company_group', company_group_id: cg });
        });
    }
    if (config.regions && Array.isArray(config.regions)) {
        config.regions.forEach((r: string) => {
            if (r) list.push({ authority_type: 'region', region_id: r });
        });
    }
    return list;
};

const mapAuthoritiesToConfig = (authorities: any[]) => {
    const config: any = {
        custom: [],
        users: [],
        roles: [],
        departments: [],
        divisions: [],
        locations: [],
        company_groups: [],
        regions: [],
        authorities: authorities,
    };
    if (!authorities) return config;

    authorities.forEach((auth) => {
        if (auth.authority_type === 'custom') {
            if (auth.user_id) config.custom.push(auth.user_id);
        } else if (auth.authority_type === 'user') {
            if (auth.user_id) config.users.push(auth.user_id);
        } else if (auth.authority_type === 'role') {
            if (auth.role_id) config.roles.push(auth.role_id);
        } else if (auth.authority_type === 'department') {
            if (auth.department_id) config.departments.push(auth.department_id);
        } else if (auth.authority_type === 'division') {
            if (auth.division_id) config.divisions.push(auth.division_id);
        } else if (auth.authority_type === 'location') {
            if (auth.location_id) config.locations.push(auth.location_id);
        } else if (auth.authority_type === 'company_group') {
            if (auth.company_group_id) config.company_groups.push(auth.company_group_id);
        } else if (auth.authority_type === 'region') {
            if (auth.region_id) config.regions.push(auth.region_id);
        }
    });
    return config;
};

interface StepActionConfigCardProps {
    act: any;
    actIdx: number;
    totalActions?: number;
    idx: number;
    step: any;
    allWorkflows: any[];
    allWorkflowSteps: any[];
    roles: any[];
    departments: any[];
    divisions?: any[];
    locations?: any[];
    companyGroups?: any[];
    organizationGroups?: any[];
    companies?: any[];
    regions?: any[];
    users: any[];
    contractStatuses?: any[];
    updateAction: (actIdx: number, data: any) => void;
    removeAction: (actIdx: number) => void;
    cloneAction: (actIdx: number) => void;
    moveAction?: (actIdx: number, direction: 'up' | 'down') => void;
    simulationContext?: any;
    onOpenSimulationModal?: () => void;
}

export function StepActionConfigCard({
    act,
    actIdx,
    totalActions = 1,
    idx,
    step,
    allWorkflows,
    allWorkflowSteps,
    roles,
    departments,
    divisions = [],
    locations = [],
    companyGroups = [],
    organizationGroups = [],
    companies = [],
    regions = [],
    users,
    contractStatuses = [],
    updateAction,
    removeAction,
    cloneAction,
    moveAction,
    simulationContext,
    onOpenSimulationModal,
}: StepActionConfigCardProps) {
    const actionCode = (act.master_action?.code || act.action_code || act.master_action_id || '').toLowerCase();
    const isForwardAction = actionCode === 'add_adhoc';
    const isAssignAction = ['assign', 'assign_pic'].includes(actionCode);
    const isSelectionAction = isAssignAction || isForwardAction;

    const [isButtonAuthorityModalOpen, setIsButtonAuthorityModalOpen] = useState(false);
    const [isAssigneeModalOpen, setIsAssigneeModalOpen] = useState(false);

    // Fallback status: act.target_status -> step.meta?.target_status

    // Calculate authority counts
    const buttonAuthorities = mapConfigToAuthorities(act.authorities || act.authority_config);
    const buttonAuthorityCount = buttonAuthorities.length;

    const personnelAuthorities = mapConfigToAuthorities(act.assignee_config || act.eligible_personnel);
    const personnelCount = personnelAuthorities.length;

    // Precomputed action styling
    const actionStyleMap: Record<string, { badgeBg: string; text: string; icon: React.ReactNode; label: string }> = {
        approve: {
            badgeBg: 'bg-primary text-white',
            text: 'text-primary dark:text-primary-400',
            icon: <Sparkles size={12} className="text-primary shrink-0" />,
            label: `#${actIdx + 1} Aksi Alur`,
        },
        assign: {
            badgeBg: 'bg-blue-600 text-white',
            text: 'text-blue-600 dark:text-blue-400',
            icon: <UserCheck size={12} className="shrink-0 text-blue-500" />,
            label: `#${actIdx + 1} Tugaskan`,
        },
        assign_pic: {
            badgeBg: 'bg-blue-600 text-white',
            text: 'text-blue-600 dark:text-blue-400',
            icon: <UsersIcon size={12} className="shrink-0 text-blue-500" />,
            label: `#${actIdx + 1} Tugaskan`,
        },
        add_adhoc: {
            badgeBg: 'bg-indigo-600 text-white',
            text: 'text-indigo-600 dark:text-indigo-400',
            icon: <UserPlus size={12} className="shrink-0 text-indigo-500" />,
            label: `#${actIdx + 1} Tambahan`,
        },
        branch: {
            badgeBg: 'bg-sky-600 text-white',
            text: 'text-sky-600 dark:text-sky-400',
            icon: <GitBranch size={12} className="shrink-0 text-sky-500" />,
            label: `#${actIdx + 1} Cabang`,
        },
        auto: {
            badgeBg: 'bg-purple-600 text-white',
            text: 'text-purple-600 dark:text-purple-400',
            icon: <Zap size={12} className="shrink-0 text-purple-500" />,
            label: `#${actIdx + 1} Otomatis`,
        },
        automation: {
            badgeBg: 'bg-purple-600 text-white',
            text: 'text-purple-600 dark:text-purple-400',
            icon: <Zap size={12} className="shrink-0 text-purple-500" />,
            label: `#${actIdx + 1} Otomatis`,
        },
    };

    const theme = actionStyleMap[actionCode] || {
        badgeBg: 'bg-primary text-white',
        text: 'text-primary',
        icon: <Sparkles size={12} />,
        label: `#${actIdx + 1} Aksi Alur`,
    };

    const transitionType = (() => {
        if (act.transition_config?.type) {
            if (act.transition_config.type === 'relative') {
                if (act.transition_config.offset === 1) return 'sequential';
                if (act.transition_config.offset === -1) return 'back';
                if (act.transition_config.offset === 0) return 'stay';
            }
            if (act.transition_config.type === 'absolute') {
                return 'absolute';
            }
            if (act.transition_config.type === 'origin_return' || act.transition_config.workflow_id === 'origin_workflow') {
                return 'origin_return';
            }
            if (act.transition_config.type === 'cross_workflow') return 'cross_workflow';
            if (act.transition_config.type === 'initial_step') return 'initial_step';
        }

        // Fallback for backward compatibility
        if (act.next_workflow_id === 'origin_workflow') return 'origin_return';
        if (act.next_workflow_id) return 'cross_workflow';
        if (act.next_step_id) {
            const firstStep = allWorkflowSteps[0];
            if (firstStep && act.next_step_id === firstStep.id && idx > 0) return 'absolute';
            const prevStep = allWorkflowSteps[idx - 1];
            if (prevStep && act.next_step_id === prevStep.id) return 'back';
            return 'absolute';
        }
        return 'sequential';
    })();

    const showCrossWorkflowSelector = transitionType === 'cross_workflow' || transitionType === 'origin_return';
    const showAbsoluteStepSelector = transitionType === 'absolute';

    return (
        <div
            className={cn(
                'space-y-2.5 rounded-lg border bg-white p-3 shadow-2xs transition-all dark:bg-zinc-900/90',
                act.is_active !== false
                    ? 'border-slate-200/90 hover:border-slate-300 dark:border-zinc-800'
                    : 'border-slate-200/50 bg-slate-50/50 opacity-60 dark:bg-zinc-900/40',
            )}
        >
            {/* Row 1: Header (Badge, Master Action, Status, Action Buttons) */}
            <div className="flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <span className={cn('shrink-0 rounded-md px-2 py-1 text-[10px] font-bold tracking-wider uppercase', theme.badgeBg)}>
                        {theme.label}
                    </span>

                    {/* Master Action Selector */}
                    <div className="w-40 sm:w-48">
                        <Select
                            value={act.master_action_id || ''}
                            onValueChange={(val) => {
                                const ma = MASTER_ACTIONS.find((m: any) => m.id === val);
                                updateAction(actIdx, {
                                    master_action_id: val,
                                    master_action: ma || null,
                                    alias: act.alias || (ma ? ma.name : ''),
                                });
                            }}
                        >
                            <SelectTrigger className="h-8.5 rounded-lg border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-2xs dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
                                <SelectValue placeholder="Pilih Aksi" />
                            </SelectTrigger>
                            <SelectContent className="rounded-lg border-slate-200 bg-white text-slate-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
                                {MASTER_ACTIONS.map((ma: any) => (
                                    <SelectItem key={ma.id} value={ma.id} className="text-xs font-medium">
                                        {ma.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Status Target Selector */}
                    <div className="w-40 sm:w-48">
                        <Select
                            value={act.target_status || 'default'}
                            onValueChange={(v) => {
                                updateAction(actIdx, {
                                    target_status: v === 'default' ? null : v,
                                });
                            }}
                        >
                            <SelectTrigger className="h-8.5 rounded-lg border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 shadow-2xs dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
                                <SelectValue placeholder="Status Target" />
                            </SelectTrigger>
                            <SelectContent className="max-h-72 rounded-lg border-slate-200 bg-white text-slate-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
                                <SelectItem value="default" className="text-xs font-medium text-slate-500">
                                    <div className="flex items-center gap-1.5">
                                        <div
                                            className="h-2 w-2 shrink-0 rounded-full border border-slate-300"
                                            style={{
                                                backgroundColor: step?.meta?.target_status
                                                    ? contractStatuses.find((s: any) => s.code === step.meta.target_status)?.color || '#cbd5e1'
                                                    : '#cbd5e1',
                                            }}
                                        />
                                        <span>DEFAULT{step?.meta?.target_status ? ` (${step.meta.target_status.toUpperCase()})` : ''}</span>
                                    </div>
                                </SelectItem>
                                {contractStatuses.map((status: any) => {
                                    const StatusIcon = status.icon && (LucideIcons as any)[status.icon] ? (LucideIcons as any)[status.icon] : null;
                                    return (
                                        <SelectItem key={status.id} value={status.code} className="text-xs font-medium uppercase">
                                            <div className="flex items-center gap-1.5">
                                                {StatusIcon ? (
                                                    <StatusIcon className="h-3 w-3 shrink-0" style={{ color: status.color || 'currentColor' }} />
                                                ) : (
                                                    <div
                                                        className="h-2 w-2 shrink-0 rounded-full"
                                                        style={{ backgroundColor: status.color || '#cbd5e1' }}
                                                    />
                                                )}
                                                <span className="font-semibold">
                                                    {status.code?.toUpperCase()}
                                                    {status.label ? ` • ${status.label}` : ''}
                                                </span>
                                            </div>
                                        </SelectItem>
                                    );
                                })}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Right Side Header Controls */}
                <div className="flex shrink-0 items-center gap-1.5">
                    {/* 1. Tombol Otoritas Akses Tombol (Siapa yang bisa melihat / klik tombol) */}
                    <button
                        type="button"
                        title="Tentukan siapa yang berhak melihat dan mengklik tombol aksi ini"
                        onClick={() => setIsButtonAuthorityModalOpen(true)}
                        className={cn(
                            'inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border px-3 text-xs font-bold shadow-2xs transition-colors',
                            buttonAuthorityCount > 0
                                ? 'border-slate-800 bg-slate-800 text-white hover:bg-slate-700 dark:border-zinc-600 dark:bg-zinc-700'
                                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
                        )}
                    >
                        <Key size={13} className="text-amber-400" />
                        <span>Otoritas Tombol</span>
                        <span
                            className={cn(
                                'ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] leading-none font-bold',
                                buttonAuthorityCount > 0
                                    ? 'bg-white/20 text-white'
                                    : 'bg-slate-200 text-slate-700 dark:bg-zinc-700 dark:text-zinc-300',
                            )}
                        >
                            {buttonAuthorityCount}
                        </span>
                    </button>

                    {/* 2. Tombol Tentukan Personil / Atur Reviewer */}
                    {isSelectionAction && (
                        <button
                            type="button"
                            title={
                                isForwardAction
                                    ? 'Tentukan lingkup reviewer tambahan'
                                    : 'Tentukan daftar personil yang bisa dipilih saat aksi digunakan'
                            }
                            onClick={() => setIsAssigneeModalOpen(true)}
                            className={cn(
                                'inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border px-3 text-xs font-bold shadow-2xs transition-colors',
                                personnelCount > 0
                                    ? 'bg-primary border-primary hover:bg-primary/90 text-white'
                                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
                            )}
                        >
                            <UsersIcon size={13} className="text-blue-500" />
                            <span>{isForwardAction ? 'Atur Reviewer' : 'Tentukan Personil'}</span>
                            <span
                                className={cn(
                                    'ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] leading-none font-bold',
                                    personnelCount > 0 ? 'bg-white/25 text-white' : 'bg-primary text-white',
                                )}
                            >
                                {personnelCount}
                            </span>
                        </button>
                    )}

                    {/* 3. Reorder Buttons */}
                    {moveAction && totalActions > 1 && (
                        <div className="flex h-8 items-center gap-0.5 rounded-lg border border-slate-200 bg-slate-100 p-0.5 shadow-2xs dark:border-zinc-700 dark:bg-zinc-800">
                            <button
                                type="button"
                                disabled={actIdx === 0}
                                onClick={() => moveAction(actIdx, 'up')}
                                className={cn(
                                    'flex h-7 w-7 cursor-pointer items-center justify-center rounded-md p-1.5 text-slate-600 transition-all dark:text-zinc-300',
                                    actIdx === 0 ? 'cursor-not-allowed opacity-30' : 'hover:bg-white active:scale-95 dark:hover:bg-zinc-700',
                                )}
                                title="Pindah ke Atas (Tukar Posisi)"
                            >
                                <ArrowUp size={12} />
                            </button>
                            <button
                                type="button"
                                disabled={actIdx === totalActions - 1}
                                onClick={() => moveAction(actIdx, 'down')}
                                className={cn(
                                    'flex h-7 w-7 cursor-pointer items-center justify-center rounded-md p-1.5 text-slate-600 transition-all dark:text-zinc-300',
                                    actIdx === totalActions - 1
                                        ? 'cursor-not-allowed opacity-30'
                                        : 'hover:bg-white active:scale-95 dark:hover:bg-zinc-700',
                                )}
                                title="Pindah ke Bawah (Tukar Posisi)"
                            >
                                <ArrowDown size={12} />
                            </button>
                        </div>
                    )}

                    {/* 4. Toggle Visible/Invisible (Eye Icon) */}
                    <button
                        type="button"
                        onClick={() => updateAction(actIdx, { is_visible: act.is_visible === false ? true : false })}
                        className={cn(
                            'flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border p-1.5 shadow-2xs transition-all',
                            act.is_visible !== false
                                ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
                                : 'border-amber-300 bg-amber-500/15 text-amber-600 hover:bg-amber-500/25 dark:border-amber-800 dark:text-amber-400',
                        )}
                        title={
                            act.is_visible !== false
                                ? 'Aksi Terlihat (Tombol Tampil di Form/Detail Kontrak)'
                                : 'Aksi Tersembunyi (Aksi Otomatis/Sistem Tanpa Tombol)'
                        }
                    >
                        {act.is_visible !== false ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>

                    {/* 5. Toggle Active/Inactive */}
                    <button
                        type="button"
                        onClick={() => updateAction(actIdx, { is_active: act.is_active !== false ? false : true })}
                        className={cn(
                            'flex h-8 cursor-pointer items-center rounded-lg px-3 text-[10px] font-bold uppercase shadow-2xs transition-all',
                            act.is_active !== false
                                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                : 'bg-slate-200 text-slate-600 hover:bg-slate-300 dark:bg-zinc-800 dark:text-zinc-400',
                        )}
                    >
                        {act.is_active !== false ? 'AKTIF' : 'NON-AKTIF'}
                    </button>

                    {/* 6. Duplicate Button */}
                    {actionCode !== 'auto' && actionCode !== 'automation' && (
                        <button
                            type="button"
                            onClick={() => cloneAction(actIdx)}
                            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white p-1.5 text-slate-700 shadow-2xs transition-colors hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                            title="Duplikat Aksi"
                        >
                            <Copy size={13} />
                        </button>
                    )}

                    {/* 7. Delete Button */}
                    <button
                        type="button"
                        onClick={() => removeAction(actIdx)}
                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white p-1.5 text-rose-600 shadow-2xs transition-colors hover:border-rose-200 hover:bg-rose-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-rose-400 dark:hover:bg-rose-950/30"
                        title="Hapus Aksi"
                    >
                        <Trash2 size={13} />
                    </button>
                </div>
            </div>

            {/* Row 2: Standardized Normalized Fields Layout */}
            {act.is_active !== false && (
                <div className="grid grid-cols-1 gap-3 border-t border-slate-100 pt-3 text-xs sm:grid-cols-12 dark:border-zinc-800/80">
                    {/* Label Tombol */}
                    <div className="space-y-1 sm:col-span-6">
                        <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300">Label Tombol (Alias):</label>
                        <input
                            type="text"
                            value={act.alias || ''}
                            onChange={(e) => updateAction(actIdx, { alias: e.target.value })}
                            className="focus:border-primary h-8.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 shadow-2xs transition-all placeholder:text-slate-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                            placeholder="Label tombol aksi..."
                        />
                    </div>

                    {/* Deskripsi Aksi */}
                    <div className="space-y-1 sm:col-span-6">
                        <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300">Deskripsi / Tooltip Aksi:</label>
                        <input
                            type="text"
                            value={act.description || ''}
                            onChange={(e) => updateAction(actIdx, { description: e.target.value })}
                            className="focus:border-primary h-8.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 shadow-2xs transition-all placeholder:text-slate-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                            placeholder="Deskripsi / tooltip fungsi tombol..."
                        />
                    </div>

                    {/* Pengaturan Transisi (Next Step) */}
                    <div className="space-y-1.5 border-t border-dashed border-slate-200 pt-2 sm:col-span-12 dark:border-zinc-800">
                        <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 dark:text-zinc-300">
                            <GitBranch size={13} className="text-primary" />
                            <span>Transisi Alur & Tahap Target:</span>
                        </label>

                        <div className="grid w-full grid-cols-1 items-center gap-3 sm:grid-cols-3">
                            {/* 1. Transition Type Selector (1/3 width) */}
                            <div className="w-full">
                                <Select
                                    value={transitionType}
                                    onValueChange={(val) => {
                                        if (val === 'sequential') {
                                            updateAction(actIdx, {
                                                transition_config: { type: 'relative', offset: 1 },
                                                next_step_id: null,
                                                next_workflow_id: null,
                                                next_workflow_step_id: null,
                                            });
                                        } else if (val === 'stay') {
                                            updateAction(actIdx, {
                                                transition_config: { type: 'relative', offset: 0 },
                                                next_step_id: null,
                                                next_workflow_id: null,
                                                next_workflow_step_id: null,
                                            });
                                        } else if (val === 'back') {
                                            updateAction(actIdx, {
                                                transition_config: { type: 'relative', offset: -1 },
                                                next_step_id: null,
                                                next_workflow_id: null,
                                                next_workflow_step_id: null,
                                            });
                                        } else if (val === 'absolute') {
                                            const defaultTarget = allWorkflowSteps.find((s: any) => s.id !== step?.id) || allWorkflowSteps[0];
                                            updateAction(actIdx, {
                                                transition_config: {
                                                    type: 'absolute',
                                                    step_id: defaultTarget?.id || null,
                                                    sequence: defaultTarget?.step || 1,
                                                },
                                                next_step_id: defaultTarget?.id || null,
                                                next_workflow_id: null,
                                                next_workflow_step_id: null,
                                            });
                                        } else if (val === 'origin_return') {
                                            updateAction(actIdx, {
                                                transition_config: {
                                                    type: 'cross_workflow',
                                                    workflow_id: 'origin_workflow',
                                                    return_mode: 'branch_next',
                                                    sequence: 1,
                                                },
                                                next_step_id: null,
                                                next_workflow_id: null,
                                                next_workflow_step_id: null,
                                            });
                                        } else if (val === 'cross_workflow') {
                                            updateAction(actIdx, {
                                                transition_config: { type: 'cross_workflow', workflow_id: '', sequence: 1 },
                                                next_step_id: null,
                                                next_workflow_id: null,
                                                next_workflow_step_id: null,
                                            });
                                        } else if (val === 'initial_step') {
                                            updateAction(actIdx, {
                                                transition_config: { type: 'initial_step' },
                                                next_step_id: null,
                                                next_workflow_id: null,
                                                next_workflow_step_id: null,
                                            });
                                        }
                                    }}
                                >
                                    <SelectTrigger className="h-8.5 w-full rounded-lg border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 shadow-2xs dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
                                        <SelectValue placeholder="Pilih Transisi" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-lg border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
                                        {TRANSITION_OPTIONS.map((opt) => {
                                            const getTransitionIcon = (val: string) => {
                                                switch (val) {
                                                    case 'sequential':
                                                        return <ArrowRight size={13} className="shrink-0 text-emerald-500" />;
                                                    case 'origin_return':
                                                        return <RefreshCw size={13} className="shrink-0 text-indigo-500" />;
                                                    case 'cross_workflow':
                                                        return <GitBranch size={13} className="shrink-0 text-blue-500" />;
                                                    case 'stay':
                                                        return <Settings2 size={13} className="shrink-0 text-slate-400" />;
                                                    case 'back':
                                                        return <CornerDownLeft size={13} className="shrink-0 text-amber-500" />;
                                                    case 'initial_step':
                                                        return <Flag size={13} className="shrink-0 text-rose-500" />;
                                                    case 'absolute':
                                                        return <Target size={13} className="shrink-0 text-teal-500" />;
                                                    default:
                                                        return <ArrowRight size={13} className="shrink-0" />;
                                                }
                                            };

                                            return (
                                                <SelectItem key={opt.value} value={opt.value} className="text-xs font-medium">
                                                    <div className="flex items-center gap-1.5">
                                                        {getTransitionIcon(opt.value)}
                                                        <span>{opt.label}</span>
                                                    </div>
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* 2. Cross Workflow Target Selector (1/3 + 1/3) */}
                            {showCrossWorkflowSelector && (
                                <>
                                    <div className="w-full">
                                        <Select
                                            value={act.transition_config?.workflow_id || act.next_workflow_id || ''}
                                            onValueChange={(val) => {
                                                if (val === 'origin_workflow') {
                                                    updateAction(actIdx, {
                                                        transition_config: {
                                                            type: 'cross_workflow',
                                                            workflow_id: 'origin_workflow',
                                                            return_mode: 'branch_next',
                                                            sequence: 1,
                                                        },
                                                        next_workflow_id: null,
                                                        next_workflow_step_id: null,
                                                    });
                                                } else {
                                                    const targetWf = allWorkflows.find((w: any) => String(w.id) === val);
                                                    updateAction(actIdx, {
                                                        transition_config: {
                                                            type: 'cross_workflow',
                                                            workflow_id: val,
                                                            sequence: targetWf?.steps?.[0]?.step || 1,
                                                        },
                                                        next_workflow_id: null,
                                                        next_workflow_step_id: null,
                                                    });
                                                }
                                            }}
                                        >
                                            <SelectTrigger className="h-8.5 w-full rounded-lg border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 shadow-2xs dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
                                                <SelectValue placeholder="Pilih Alur Kerja" />
                                            </SelectTrigger>
                                            <SelectContent className="z-[9999] rounded-lg border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
                                                <SelectItem
                                                    value="origin_workflow"
                                                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400"
                                                >
                                                    <div className="flex items-center gap-1.5">
                                                        <RefreshCw size={13} className="shrink-0 text-indigo-600 dark:text-indigo-400" />
                                                        <span>Workflow Asal (Origin Workflow)</span>
                                                    </div>
                                                </SelectItem>
                                                {allWorkflows.map((w: any) => (
                                                    <SelectItem key={w.id} value={String(w.id)} className="text-xs font-medium">
                                                        <div className="flex items-center gap-1.5">
                                                            <WorkflowIcon size={12} className="shrink-0 text-slate-400" />
                                                            <span>
                                                                {w.name} {w.contract_type ? `[${w.contract_type.name}]` : '[SEMUA JENIS]'}
                                                            </span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="w-full">
                                        {(act.transition_config?.workflow_id || act.next_workflow_id) === 'origin_workflow' ? (
                                            <Select
                                                value={act.transition_config?.return_mode || String(act.transition_config?.sequence || 'branch_next')}
                                                onValueChange={(val) => {
                                                    if (val === 'branch_next' || val === 'branch_origin') {
                                                        updateAction(actIdx, {
                                                            transition_config: {
                                                                ...act.transition_config,
                                                                type: 'cross_workflow',
                                                                workflow_id: 'origin_workflow',
                                                                return_mode: val,
                                                                sequence: 1,
                                                            },
                                                            next_workflow_step_id: null,
                                                        });
                                                    } else {
                                                        updateAction(actIdx, {
                                                            transition_config: {
                                                                ...act.transition_config,
                                                                type: 'cross_workflow',
                                                                workflow_id: 'origin_workflow',
                                                                return_mode: null,
                                                                sequence: Number(val),
                                                            },
                                                            next_workflow_step_id: null,
                                                        });
                                                    }
                                                }}
                                            >
                                                <SelectTrigger className="h-8.5 w-full rounded-lg border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 shadow-2xs dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
                                                    <SelectValue placeholder="Pilih Tahap Target" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-lg border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
                                                    <SelectItem
                                                        value="branch_next"
                                                        className="text-xs font-semibold text-emerald-600 dark:text-emerald-400"
                                                    >
                                                        <div className="flex items-center gap-1.5">
                                                            <Sparkles size={13} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                                                            <span>Lanjut ke Step Berikutnya (+1)</span>
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem
                                                        value="branch_origin"
                                                        className="text-xs font-semibold text-amber-600 dark:text-amber-400"
                                                    >
                                                        <div className="flex items-center gap-1.5">
                                                            <CornerDownLeft size={13} className="shrink-0 text-amber-600 dark:text-amber-400" />
                                                            <span>Kembali ke Step Pemanggil</span>
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="1" className="text-xs font-medium">
                                                        <div className="flex items-center gap-1.5">
                                                            <Flag size={13} className="shrink-0 text-slate-500" />
                                                            <span>Tahap 1 Workflow Asal</span>
                                                        </div>
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <Select
                                                value={String(act.transition_config?.sequence || '')}
                                                onValueChange={(val) =>
                                                    updateAction(actIdx, {
                                                        transition_config: {
                                                            ...act.transition_config,
                                                            type: 'cross_workflow',
                                                            sequence: Number(val),
                                                            return_mode: null,
                                                        },
                                                        next_workflow_step_id: null,
                                                    })
                                                }
                                            >
                                                <SelectTrigger className="h-8.5 w-full rounded-lg border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 shadow-2xs dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
                                                    <SelectValue placeholder="Pilih Tahap Target" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-lg border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
                                                    {(
                                                        allWorkflows.find(
                                                            (w: any) => String(w.id) === (act.transition_config?.workflow_id || act.next_workflow_id),
                                                        )?.steps || []
                                                    ).map((s: any, sIdx: number) => (
                                                        <SelectItem key={s.id} value={String(s.step || sIdx + 1)} className="text-xs font-medium">
                                                            Tahap {s.step || sIdx + 1}: {s.label || `Langkah ${sIdx + 1}`}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    </div>
                                </>
                            )}

                            {/* 3. Absolute Step Selector (1/3 width) */}
                            {showAbsoluteStepSelector && (
                                <div className="w-full">
                                    <Select
                                        value={(() => {
                                            if (act.transition_config?.step_id) {
                                                const found = allWorkflowSteps.find(
                                                    (s: any) => String(s.id) === String(act.transition_config.step_id),
                                                );
                                                if (found) return String(found.id);
                                            }
                                            if (act.next_step_id) {
                                                const found = allWorkflowSteps.find((s: any) => String(s.id) === String(act.next_step_id));
                                                if (found) return String(found.id);
                                            }
                                            if (act.transition_config?.sequence) {
                                                const found = allWorkflowSteps.find(
                                                    (s: any) => (s.step || 0) === Number(act.transition_config.sequence),
                                                );
                                                if (found) return String(found.id);
                                            }
                                            return allWorkflowSteps[0]?.id ? String(allWorkflowSteps[0].id) : '';
                                        })()}
                                        onValueChange={(val) => {
                                            const targetStep = allWorkflowSteps.find((s: any) => String(s.id) === val);
                                            updateAction(actIdx, {
                                                transition_config: {
                                                    ...act.transition_config,
                                                    type: 'absolute',
                                                    step_id: val,
                                                    sequence: targetStep?.step || 1,
                                                },
                                                next_step_id: val,
                                            });
                                        }}
                                    >
                                        <SelectTrigger className="h-8.5 w-full rounded-lg border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 shadow-2xs dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
                                            <SelectValue placeholder="Pilih Tahap Target" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-lg border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
                                            {allWorkflowSteps.map((s: any, sIdx: number) => (
                                                <SelectItem key={s.id} value={String(s.id)} className="text-xs font-medium">
                                                    Tahap {s.step || sIdx + 1}: {s.label || `Langkah ${sIdx + 1}`}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Kolom Wajib & Autofill Fields */}
                    <div className="space-y-1 sm:col-span-6">
                        <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300">Kolom Wajib Diisi (Required):</label>
                        <SearchableMultiSelectPortal
                            values={act.required_fields || []}
                            onValuesChange={(vals: string[]) => updateAction(actIdx, { required_fields: vals })}
                            options={AVAILABLE_FIELDS}
                            placeholder="Pilih Kolom..."
                            triggerClassName="min-h-[34px] py-1 px-3 text-xs rounded-lg"
                        />
                    </div>

                    <div className="space-y-1 sm:col-span-6">
                        <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300">
                            Aksi & Pengisian Data Otomatis (Autofill / Reset):
                        </label>
                        <SearchableMultiSelectPortal
                            values={act.autofilled_fields || []}
                            onValuesChange={(vals: string[]) => updateAction(actIdx, { autofilled_fields: vals })}
                            options={AUTOFILLED_PARAMS}
                            placeholder="Pilih Aksi / Kolom Otomatis..."
                            triggerClassName="min-h-[34px] py-1 px-3 text-xs rounded-lg"
                        />
                    </div>
                </div>
            )}

            {/* Modal Dialog 1: Otoritas Tombol (Siapa yang bisa melihat / klik tombol) */}
            {isButtonAuthorityModalOpen && (
                <Dialog open={isButtonAuthorityModalOpen} onOpenChange={setIsButtonAuthorityModalOpen}>
                    <DialogContent className="flex h-[90vh] max-h-[90vh] w-[96vw] max-w-[96vw] flex-col overflow-hidden rounded-[12px] border border-slate-200/80 bg-white p-0 text-slate-800 shadow-2xl sm:max-w-[96vw] dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
                        <div className="flex shrink-0 items-center justify-between rounded-t-[12px] border-b border-slate-800 bg-slate-900 px-6 py-4 text-white">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 bg-white/20 text-white">
                                    <Key size={18} className="text-amber-400" />
                                </div>
                                <div>
                                    <DialogTitle className="text-sm font-bold tracking-tight text-white">
                                        Otoritas Akses Tombol — Aksi #{actIdx + 1}: {act.alias || act.master_action?.name || 'Aksi'}
                                    </DialogTitle>
                                    <DialogDescription className="mt-0.5 text-xs font-medium text-white/80">
                                        Tentukan siapa yang berhak melihat dan mengklik tombol aksi ini pada form persetujuan
                                    </DialogDescription>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto bg-white p-6 dark:bg-zinc-900">
                            <AuthorityTableManager
                                title="Otoritas Akses Tombol"
                                authorities={buttonAuthorities}
                                onChange={(vals) => updateAction(actIdx, { authorities: vals, authority_config: mapAuthoritiesToConfig(vals) })}
                                users={users}
                                roles={roles}
                                departments={departments}
                                divisions={divisions}
                                locations={locations}
                                companyGroups={companyGroups}
                                organizationGroups={organizationGroups}
                                companies={companies}
                                regions={regions}
                                showCustom={true}
                                showCombinations={true}
                                simulationContext={simulationContext}
                                onOpenSimulationModal={onOpenSimulationModal}
                            />
                        </div>

                        <DialogFooter className="flex items-center justify-end border-t border-slate-100 bg-slate-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-800/50">
                            <Button type="button" onClick={() => setIsButtonAuthorityModalOpen(false)} className="cursor-pointer text-xs font-bold">
                                Selesai
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {/* Modal Dialog 2: Tentukan Personil / Assignee / Reviewer Pool */}
            {isAssigneeModalOpen && (
                <Dialog open={isAssigneeModalOpen} onOpenChange={setIsAssigneeModalOpen}>
                    <DialogContent className="flex h-[90vh] max-h-[90vh] w-[96vw] max-w-[96vw] flex-col overflow-hidden rounded-[12px] border border-slate-200/80 bg-white p-0 text-slate-800 shadow-2xl sm:max-w-[96vw] dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
                        <div className="border-primary/20 bg-primary flex shrink-0 items-center justify-between rounded-t-[12px] border-b px-6 py-4 text-white dark:border-zinc-700/80 dark:bg-zinc-800/90 dark:text-zinc-200">
                            <div className="flex items-center gap-3">
                                <div className="dark:bg-primary/20 dark:text-primary dark:border-primary/30 flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 bg-white/20 text-white">
                                    <UsersIcon size={18} />
                                </div>
                                <div>
                                    <DialogTitle className="text-sm font-bold tracking-tight text-white dark:text-zinc-100">
                                        {isForwardAction ? 'Konfigurasi Reviewer Tambahan' : 'Konfigurasi Personil Penugasan (Assignee Pool)'} — Aksi
                                        #{actIdx + 1}: {act.alias || act.master_action?.name || 'Aksi'}
                                    </DialogTitle>
                                    <DialogDescription className="mt-0.5 text-xs font-medium text-white/80 dark:text-zinc-400">
                                        {isForwardAction
                                            ? 'Tentukan langkah target dan daftar reviewer yang berhak menerima pengajuan'
                                            : 'Tentukan aktor/pengguna yang dapat dipilih dan ditugaskan sebagai PIC'}
                                    </DialogDescription>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 space-y-4 overflow-y-auto bg-white p-6 dark:bg-zinc-900">
                            {isForwardAction && (
                                <div className="max-w-sm space-y-1">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Target Langkah (Insert To)</label>
                                    <Select
                                        value={act.next_step_id || 'current'}
                                        onValueChange={(val) => {
                                            updateAction(actIdx, {
                                                next_step_id: val === 'current' ? null : val,
                                            });
                                        }}
                                    >
                                        <SelectTrigger className="h-9 rounded-lg border-slate-200 bg-white px-3 py-2 text-xs font-medium focus:border-slate-900 dark:border-slate-800 dark:bg-slate-950">
                                            <SelectValue placeholder="Pilih Tahap Target" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-lg bg-white dark:bg-slate-950">
                                            <SelectItem value="current" className="text-xs font-medium">
                                                Langkah Saat Ini (Default)
                                            </SelectItem>
                                            {allWorkflowSteps.map((s: any, sIdx: number) => (
                                                <SelectItem key={s.id} value={String(s.id)} className="text-xs font-medium">
                                                    Tahap {sIdx + 1}: {s.label || `Langkah ${sIdx + 1}`}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {/* Authority Table Manager for Assignee */}
                            <AuthorityTableManager
                                title={isForwardAction ? 'Lingkup Reviewer Tambahan' : 'Aktor Penugasan (Assignee Pool)'}
                                authorities={personnelAuthorities}
                                onChange={(vals) => {
                                    updateAction(actIdx, { assignee_config: mapAuthoritiesToConfig(vals) });
                                }}
                                users={users}
                                roles={roles}
                                departments={departments}
                                divisions={divisions}
                                locations={locations}
                                companyGroups={companyGroups}
                                organizationGroups={organizationGroups}
                                companies={companies}
                                regions={regions}
                                showCustom={true}
                                showCombinations={true}
                                simulationContext={simulationContext}
                                onOpenSimulationModal={onOpenSimulationModal}
                            />
                        </div>

                        <DialogFooter className="flex items-center justify-end border-t border-slate-100 bg-slate-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-800/50">
                            <Button type="button" onClick={() => setIsAssigneeModalOpen(false)} className="cursor-pointer text-xs font-bold">
                                Selesai
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
