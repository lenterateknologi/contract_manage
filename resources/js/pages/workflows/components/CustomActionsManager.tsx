import { Button } from '@/components/ui/buttons/Button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialogs/Dialog';
import { SearchableMultiSelect } from '@/components/ui/selection/SearchableMultiSelect';
import { SearchableMultiSelectPortal } from '@/components/ui/selection/SearchableMultiSelectPortal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/selection/Select';
import LucideIcons from '@/lib/lucide-dynamic';
import { cn } from '@/lib/utils';
import {
    ArrowRight,
    Copy,
    CornerDownLeft,
    Flag,
    GitBranch,
    Key,
    Layers,
    Plus,
    PlusCircle,
    Settings2,
    Sliders,
    Sparkles,
    Trash2,
    UserPlus,
    Users as UsersIcon,
    Workflow as WorkflowIcon,
    XCircle,
    Zap,
} from 'lucide-react';
import React, { useState } from 'react';
import { AUTOFILLED_PARAMS, AVAILABLE_FIELDS, MASTER_ACTIONS, TRANSITION_OPTIONS } from '../constants';
import AuthorityTableManager from './AuthorityTableManager';

export interface CustomActionItem {
    id: string;
    action_code: string;
    name: string;
    alias: string;
    description?: string;
    is_active: boolean;
    scope: 'all_steps' | 'specific_steps';
    step_ids?: string[];
    execution_type?: 'adhoc_internal' | 'cross_workflow';
    target_step_mode?: 'current_step' | 'specific_step' | 'next_step';
    target_step_position?: 'at' | 'before' | 'after';
    target_step_id?: string;
    transition_config?: {
        type?: string;
        workflow_id?: string;
        sequence?: number;
        step_id?: string;
        offset?: number;
        return_mode?: 'branch_next' | 'branch_origin' | null;
        [key: string]: any;
    };
    authorities: any[];
    eligible_personnel?: any[];
    requires_note?: boolean;
    requires_attachment?: boolean;
    visibility_condition?: 'always' | 'require_pic' | 'no_pic' | 'has_signers' | 'no_signers' | 'custom_status';
    custom_status_value?: string;
    unlocks_other_actions?: boolean;
    target_status?: string | null;
    required_fields?: string[];
    autofilled_fields?: string[];
    meta?: Record<string, any>;
}

export const CUSTOM_ACTION_TEMPLATES: Array<{
    action_code: string;
    name: string;
    alias: string;
    description: string;
    badgeBg: string;
    icon: any;
    defaultData: Partial<CustomActionItem>;
}> = [
    {
        action_code: 'approve',
        name: 'Setujui',
        alias: 'Setujui',
        description: 'Aksi untuk memberikan persetujuan dokumen kontrak dan memajukan alur kerja.',
        badgeBg: 'bg-emerald-600 text-white',
        icon: Sparkles,
        defaultData: {
            scope: 'all_steps',
            step_ids: [],
            visibility_condition: 'always',
            transition_config: { type: 'relative', offset: 1 },
            target_status: null,
            unlocks_other_actions: false,
            authorities: [{ authority_type: 'custom', user_id: 'initiator' }],
            eligible_personnel: [],
        },
    },
    {
        action_code: 'reject',
        name: 'Tolak',
        alias: 'Tolak / Kembalikan',
        description: 'Aksi untuk menolak pengajuan dokumen kontrak atau mengembalikan berkas ke tahap sebelumnya.',
        badgeBg: 'bg-rose-600 text-white',
        icon: XCircle,
        defaultData: {
            scope: 'all_steps',
            step_ids: [],
            visibility_condition: 'always',
            transition_config: { type: 'relative', offset: -1 },
            target_status: null,
            unlocks_other_actions: false,
            authorities: [{ authority_type: 'custom', user_id: 'initiator' }],
            eligible_personnel: [],
        },
    },
    {
        action_code: 'assign',
        name: 'Tugaskan',
        alias: 'Tentukan / Ganti PIC',
        description: 'Aksi untuk menugaskan atau mengubah PIC (Person in Charge) penanggung jawab dokumen.',
        badgeBg: 'bg-blue-600 text-white',
        icon: UsersIcon,
        defaultData: {
            scope: 'all_steps',
            step_ids: [],
            visibility_condition: 'always',
            transition_config: { type: 'relative', offset: 0 },
            target_step_mode: 'current_step',
            target_status: null,
            unlocks_other_actions: false,
            authorities: [{ authority_type: 'custom', user_id: 'initiator' }],
            eligible_personnel: [],
        },
    },
    {
        action_code: 'add_adhoc',
        name: 'Approval Tambahan',
        alias: 'Minta Persetujuan Tambahan',
        description: 'Aksi untuk menambahkan reviewer / approver ad-hoc tambahan ke dalam tahapan alur persetujuan.',
        badgeBg: 'bg-indigo-600 text-white',
        icon: UserPlus,
        defaultData: {
            scope: 'all_steps',
            step_ids: [],
            visibility_condition: 'always',
            execution_type: 'adhoc_internal',
            target_step_position: 'at',
            target_step_mode: 'current_step',
            target_status: null,
            unlocks_other_actions: false,
            authorities: [{ authority_type: 'custom', user_id: 'initiator' }],
            eligible_personnel: [],
        },
    },
    {
        action_code: 'branch',
        name: 'Pindah Workflow (Cabang)',
        alias: 'Pindah Alur / Cabang',
        description: 'Aksi untuk mengalihkan proses ke workflow/alur kerja lain sebagai alur cabang.',
        badgeBg: 'bg-amber-600 text-white',
        icon: GitBranch,
        defaultData: {
            scope: 'all_steps',
            step_ids: [],
            visibility_condition: 'always',
            execution_type: 'cross_workflow',
            transition_config: {
                type: 'cross_workflow',
                sequence: 1,
                return_mode: 'branch_next',
            },
            target_status: null,
            unlocks_other_actions: false,
            authorities: [{ authority_type: 'custom', user_id: 'initiator' }],
            eligible_personnel: [],
        },
    },
    {
        action_code: 'auto',
        name: 'Otomatis (Auto Transition)',
        alias: 'Transisi Otomatis',
        description: 'Aksi transisi otomatis yang dieksekusi oleh sistem saat kondisi terpenuhi.',
        badgeBg: 'bg-purple-600 text-white',
        icon: Zap,
        defaultData: {
            scope: 'all_steps',
            step_ids: [],
            visibility_condition: 'always',
            transition_config: { type: 'relative', offset: 1 },
            target_status: null,
            unlocks_other_actions: false,
            authorities: [{ authority_type: 'custom', user_id: 'initiator' }],
            eligible_personnel: [],
        },
    },
];

interface CustomActionsManagerProps {
    customActions: CustomActionItem[];
    onChange: (actions: CustomActionItem[]) => void;
    steps: any[];
    allWorkflows?: any[];
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
    simulationContext?: any;
    onOpenSimulationModal?: () => void;
}

export function CustomActionsManager({
    customActions = [],
    onChange,
    steps = [],
    allWorkflows = [],
    roles = [],
    departments = [],
    divisions = [],
    locations = [],
    companyGroups = [],
    organizationGroups = [],
    companies = [],
    regions = [],
    users = [],
    contractStatuses = [],
    simulationContext,
    onOpenSimulationModal,
}: CustomActionsManagerProps) {
    const [editingAuthorityActionId, setEditingAuthorityActionId] = useState<string | null>(null);
    const [editingPersonnelActionId, setEditingPersonnelActionId] = useState<string | null>(null);
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [actionToDelete, setActionToDelete] = useState<{ index: number; name: string } | null>(null);

    const updateAction = (index: number, data: Partial<CustomActionItem>) => {
        const updated = [...customActions];
        updated[index] = { ...updated[index], ...data };
        onChange(updated);
    };

    const handleAddFromMasterAction = (actionCode: string) => {
        const template = CUSTOM_ACTION_TEMPLATES.find((t) => t.action_code === actionCode) || CUSTOM_ACTION_TEMPLATES[0];
        const uniqueSuffix = Math.random().toString(36).substring(2, 7);
        const newId = `action_${template.action_code}_${uniqueSuffix}`;

        const newItem: CustomActionItem = {
            id: newId,
            action_code: template.action_code,
            name: template.name,
            alias: template.alias,
            description: template.description,
            is_active: true,
            scope: 'all_steps',
            step_ids: [],
            visibility_condition: 'always',
            target_step_mode: 'current_step',
            target_status: null,
            unlocks_other_actions: false,
            authorities: [{ authority_type: 'custom', user_id: 'initiator' }],
            eligible_personnel: [],
            ...(template.defaultData || {}),
        };

        onChange([...customActions, newItem]);
        setAddModalOpen(false);
    };

    const handleDuplicateAction = (index: number) => {
        const source = customActions[index];
        if (!source) return;
        const uniqueSuffix = Math.random().toString(36).substring(2, 7);
        const duplicateItem: CustomActionItem = {
            ...JSON.parse(JSON.stringify(source)),
            id: `action_${source.action_code || 'custom'}_${uniqueSuffix}`,
            name: `${source.name || 'Aksi'} (Salinan)`,
            alias: `${source.alias || source.name || 'Aksi'} (Salinan)`,
        };
        const nextList = [...customActions];
        nextList.splice(index + 1, 0, duplicateItem);
        onChange(nextList);
    };

    const handleConfirmDelete = () => {
        if (actionToDelete !== null) {
            const nextList = customActions.filter((_, i) => i !== actionToDelete.index);
            onChange(nextList);
            setActionToDelete(null);
        }
    };

    const stepOptions = steps.map((s, sIdx) => ({
        value: String(s.id),
        label: `Tahap ${s.step || sIdx + 1}: ${s.label || s.name || s.description || `Langkah ${sIdx + 1}`}`,
    }));

    const currentEditingAuthorityAction = customActions.find((a) => a.id === editingAuthorityActionId);
    const currentEditingAuthorityIndex = customActions.findIndex((a) => a.id === editingAuthorityActionId);

    const currentEditingPersonnelAction = customActions.find((a) => a.id === editingPersonnelActionId);
    const currentEditingPersonnelIndex = customActions.findIndex((a) => a.id === editingPersonnelActionId);

    return (
        <div className="w-full min-w-0 bg-white dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800 rounded-xl p-3.5 flex flex-col gap-3">
            {/* Header Section */}
            <div className="flex flex-wrap items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-2.5 gap-2">
                <div className="flex items-center gap-2">
                    <div className="bg-primary/10 text-primary p-1.5 rounded-lg shrink-0">
                        <Sliders size={15} />
                    </div>
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-wide text-slate-800 dark:text-zinc-100">
                            Konfigurasi Aksi Kustom (Custom Actions)
                        </h3>
                        <p className="text-[10px] text-slate-500 dark:text-zinc-400">
                            Kelola tombol aksi dinamis alur kerja sesuai jenis Master Action (Setujui, Tolak, Tugaskan, Approval Tambahan, Pindah Workflow, Otomatis).
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        {customActions.length} Aksi Terpasang
                    </span>
                    <Button
                        type="button"
                        onClick={() => setAddModalOpen(true)}
                        className="h-8 px-3 rounded-lg text-xs font-bold bg-primary text-white hover:bg-primary/90 flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                        <PlusCircle size={14} />
                        <span>Tambah Aksi</span>
                    </Button>
                </div>
            </div>

            {/* Empty State */}
            {customActions.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-200 dark:border-zinc-800 p-8 text-center bg-slate-50/50 dark:bg-zinc-900/40 flex flex-col items-center justify-center gap-3">
                    <div className="p-3 bg-primary/10 text-primary rounded-full">
                        <Sliders size={24} />
                    </div>
                    <div className="space-y-1 max-w-md">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-100">
                            Belum Ada Aksi Kustom Dikonfigurasi
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                            Pilih jenis Master Action di bawah untuk menambahkan tombol aksi kustom ke alur kerja ini:
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                        {MASTER_ACTIONS.map((ma: any) => {
                            const tmpl = CUSTOM_ACTION_TEMPLATES.find((t) => t.action_code === ma.code) || CUSTOM_ACTION_TEMPLATES[0];
                            const IconComp = tmpl.icon || Sliders;
                            return (
                                <button
                                    key={ma.id}
                                    type="button"
                                    onClick={() => handleAddFromMasterAction(ma.code)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:border-primary hover:text-primary transition-all shadow-2xs cursor-pointer"
                                >
                                    <IconComp size={13} className="text-primary" />
                                    <span>+ {ma.name}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* List of Custom Actions */}
            <div className="space-y-2.5">
                {customActions.map((act, actIdx) => {
                    const actionCode = (act.action_code || 'assign').toLowerCase();
                    const authorityCount = (act.authorities || []).length;
                    const personnelCount = (act.eligible_personnel || []).length;
                    const isSelectionAction = ['assign', 'add_adhoc'].includes(actionCode);

                    const headerThemes: Record<string, { badgeBg: string; text: string; icon: React.ReactNode; label: string }> = {
                        approve: {
                            badgeBg: 'bg-emerald-600 text-white',
                            text: 'text-emerald-600 dark:text-emerald-400',
                            icon: <Sparkles size={12} className="text-emerald-500 shrink-0" />,
                            label: `#${actIdx + 1} Setujui`,
                        },
                        reject: {
                            badgeBg: 'bg-rose-600 text-white',
                            text: 'text-rose-600 dark:text-rose-400',
                            icon: <Trash2 size={12} className="text-rose-500 shrink-0" />,
                            label: `#${actIdx + 1} Tolak`,
                        },
                        assign: {
                            badgeBg: 'bg-blue-600 text-white',
                            text: 'text-blue-600 dark:text-blue-400',
                            icon: <UsersIcon size={12} className="text-blue-500 shrink-0" />,
                            label: `#${actIdx + 1} Tugaskan`,
                        },
                        add_adhoc: {
                            badgeBg: 'bg-indigo-600 text-white',
                            text: 'text-indigo-600 dark:text-indigo-400',
                            icon: <UserPlus size={12} className="text-indigo-500 shrink-0" />,
                            label: `#${actIdx + 1} Tambahan`,
                        },
                        branch: {
                            badgeBg: 'bg-sky-600 text-white',
                            text: 'text-sky-600 dark:text-sky-400',
                            icon: <GitBranch size={12} className="text-sky-500 shrink-0" />,
                            label: `#${actIdx + 1} Cabang`,
                        },
                        auto: {
                            badgeBg: 'bg-purple-600 text-white',
                            text: 'text-purple-600 dark:text-purple-400',
                            icon: <Zap size={12} className="text-purple-500 shrink-0" />,
                            label: `#${actIdx + 1} Otomatis`,
                        },
                    };

                    const theme = headerThemes[actionCode] || {
                        badgeBg: 'bg-slate-600 text-white',
                        text: 'text-slate-600',
                        icon: <Sliders size={12} />,
                        label: `#${actIdx + 1} Aksi`,
                    };

                    const isCrossWorkflowMode = act.execution_type === 'cross_workflow' || actionCode === 'branch';

                    // Transisi Alur
                    const currentTransition = (() => {
                        if (act.transition_config?.type) {
                            if (act.transition_config.type === 'relative') {
                                if (act.transition_config.offset === 1) return 'sequential';
                                if (act.transition_config.offset === -1) return 'back';
                                if (act.transition_config.offset === 0) return 'stay';
                            }
                            if (act.transition_config.type === 'absolute') return 'absolute';
                            if (act.transition_config.type === 'origin_return') return 'origin_return';
                            if (act.transition_config.type === 'cross_workflow') return 'cross_workflow';
                            if (act.transition_config.type === 'initial_step') return 'initial_step';
                        }
                        if (actionCode === 'branch') return 'cross_workflow';
                        if (actionCode === 'assign') return 'stay';
                        if (actionCode === 'reject') return 'back';
                        return 'sequential';
                    })();

                    return (
                        <div
                            key={act.id || actIdx}
                            className={cn(
                                "rounded-lg border bg-white dark:bg-zinc-900/90 transition-all p-3 shadow-2xs space-y-2.5",
                                act.is_active !== false
                                    ? "border-slate-200/90 hover:border-slate-300 dark:border-zinc-800"
                                    : "border-slate-200/50 bg-slate-50/50 dark:bg-zinc-900/40 opacity-60"
                            )}
                        >
                            {/* Row 1: Header (Badge, Master Action, Status Target, Buttons) */}
                            <div className="flex flex-wrap items-center justify-between gap-2.5">
                                <div className="flex flex-wrap items-center gap-2 min-w-0">
                                    <span className={cn("text-[10px] font-bold uppercase px-2 py-1 rounded-md tracking-wider shrink-0", theme.badgeBg)}>
                                        {theme.label}
                                    </span>

                                    {/* Master Action Selector */}
                                    <div className="w-40 sm:w-48">
                                        <Select
                                            value={actionCode}
                                            onValueChange={(val) => {
                                                const tmpl = CUSTOM_ACTION_TEMPLATES.find((t) => t.action_code === val);
                                                const ma = MASTER_ACTIONS.find((m: any) => m.code === val);
                                                updateAction(actIdx, {
                                                    action_code: val,
                                                    name: ma?.name || val,
                                                    alias: act.alias || ma?.name || val,
                                                    ...(tmpl ? tmpl.defaultData : {}),
                                                });
                                            }}
                                        >
                                            <SelectTrigger className="h-8.5 py-1.5 px-3 rounded-lg border-slate-200 bg-white text-xs font-semibold dark:border-zinc-700 dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 shadow-2xs">
                                                <SelectValue placeholder="Pilih Master Action" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-lg border-slate-200 bg-white text-slate-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
                                                {MASTER_ACTIONS.map((ma: any) => (
                                                    <SelectItem key={ma.id || ma.code} value={ma.code} className="text-xs font-medium">
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
                                            <SelectTrigger className="h-8.5 py-1.5 px-3 rounded-lg border-slate-200 bg-white text-xs font-medium dark:border-zinc-700 dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 shadow-2xs">
                                                <SelectValue placeholder="Status Target" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-lg border-slate-200 bg-white text-slate-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 max-h-72">
                                                <SelectItem value="default" className="text-xs font-medium text-slate-500">
                                                    Status Tetap (Tidak Berubah)
                                                </SelectItem>
                                                {contractStatuses.map((status: any) => {
                                                    const StatusIcon = status.icon && (LucideIcons as any)[status.icon] ? (LucideIcons as any)[status.icon] : null;
                                                    return (
                                                        <SelectItem
                                                            key={status.id}
                                                            value={status.code}
                                                            className="text-xs font-medium uppercase"
                                                        >
                                                            <div className="flex items-center gap-1.5">
                                                                {StatusIcon ? (
                                                                    <StatusIcon
                                                                        className="h-3 w-3 shrink-0"
                                                                        style={{ color: status.color || 'currentColor' }}
                                                                    />
                                                                ) : (
                                                                    <div
                                                                        className="h-2 w-2 rounded-full shrink-0"
                                                                        style={{ backgroundColor: status.color || '#cbd5e1' }}
                                                                    />
                                                                )}
                                                                <span className="font-semibold">
                                                                    {status.code?.toUpperCase()}{status.label ? ` • ${status.label}` : ''}
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
                                <div className="flex items-center gap-1.5 shrink-0">
                                    {/* 1. Tombol Otoritas Akses Tombol */}
                                    <button
                                        type="button"
                                        title="Tentukan siapa yang berhak melihat dan mengklik tombol aksi ini"
                                        onClick={() => setEditingAuthorityActionId(act.id)}
                                        className={cn(
                                            "inline-flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer border",
                                            authorityCount > 0
                                                ? "bg-slate-800 text-white border-slate-800 hover:bg-slate-700 dark:bg-zinc-700 dark:border-zinc-600"
                                                : "bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-50"
                                        )}
                                    >
                                        <Key size={13} className="text-amber-400" />
                                        <span>Otoritas Tombol</span>
                                        <span className={cn(
                                            "ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none",
                                            authorityCount > 0 ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-300"
                                        )}>
                                            {authorityCount}
                                        </span>
                                    </button>

                                    {/* 2. Tombol Tentukan Personil / Pool Reviewer */}
                                    {isSelectionAction && !isCrossWorkflowMode && (
                                        <button
                                            type="button"
                                            title={actionCode === 'add_adhoc' ? 'Tentukan lingkup reviewer tambahan' : 'Tentukan daftar personil yang bisa dipilih saat aksi digunakan'}
                                            onClick={() => setEditingPersonnelActionId(act.id)}
                                            className={cn(
                                                "inline-flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer border",
                                                personnelCount > 0
                                                    ? "bg-primary text-white border-primary hover:bg-primary/90"
                                                    : "bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-50"
                                            )}
                                        >
                                            <UsersIcon size={13} className="text-blue-500" />
                                            <span>{actionCode === 'add_adhoc' ? 'Atur Reviewer' : 'Tentukan Personil'}</span>
                                            <span className={cn(
                                                "ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none",
                                                personnelCount > 0 ? "bg-white/25 text-white" : "bg-primary text-white"
                                            )}>
                                                {personnelCount}
                                            </span>
                                        </button>
                                    )}

                                    {/* Active/Inactive Toggle */}
                                    <button
                                        type="button"
                                        onClick={() => updateAction(actIdx, { is_active: act.is_active !== false ? false : true })}
                                        className={cn(
                                            'flex h-8 cursor-pointer items-center rounded-lg px-3 text-[10px] font-bold uppercase transition-all shadow-2xs ml-0.5',
                                            act.is_active !== false
                                                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                                : 'bg-slate-200 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-slate-300'
                                        )}
                                    >
                                        {act.is_active !== false ? 'AKTIF' : 'NON-AKTIF'}
                                    </button>

                                    {/* Duplicate Action */}
                                    <button
                                        type="button"
                                        title="Duplikasi Aksi Kustom Ini"
                                        onClick={() => handleDuplicateAction(actIdx)}
                                        className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                                    >
                                        <Copy size={13} />
                                    </button>

                                    {/* Delete Action */}
                                    <button
                                        type="button"
                                        title="Hapus Aksi Kustom Ini"
                                        onClick={() => setActionToDelete({ index: actIdx, name: act.alias || act.name || 'Aksi' })}
                                        className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/60 transition-colors cursor-pointer"
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            </div>

                            {/* Row 2: Standardized Normalized Fields */}
                            {act.is_active !== false && (
                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-3 border-t border-slate-100 dark:border-zinc-800/80 text-xs">
                                    {/* Label Tombol (Alias) */}
                                    <div className="sm:col-span-3 space-y-1">
                                        <label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300 block">
                                            Label Tombol (Alias):
                                        </label>
                                        <input
                                            type="text"
                                            value={act.alias || ''}
                                            onChange={(e) => updateAction(actIdx, { alias: e.target.value })}
                                            className="h-8.5 w-full py-1.5 px-3 rounded-lg border border-slate-200 bg-white text-xs font-medium transition-all focus:border-primary focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 shadow-2xs placeholder:text-slate-400"
                                            placeholder="Label tombol..."
                                        />
                                    </div>

                                    {/* Deskripsi Aksi */}
                                    <div className="sm:col-span-4 space-y-1">
                                        <label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300 block">
                                            Deskripsi Aksi:
                                        </label>
                                        <input
                                            type="text"
                                            value={act.description || ''}
                                            onChange={(e) => updateAction(actIdx, { description: e.target.value })}
                                            className="h-8.5 w-full py-1.5 px-3 rounded-lg border border-slate-200 bg-white text-xs font-medium transition-all focus:border-primary focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 shadow-2xs placeholder:text-slate-400"
                                            placeholder="Keterangan / penjelasan aksi..."
                                        />
                                    </div>

                                    {/* Smart Visibility Dropdown */}
                                    <div className="sm:col-span-3 space-y-1">
                                        <label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300 block">
                                            Kondisi Visibilitas:
                                        </label>
                                        <div className="w-full">
                                            <Select
                                                value={act.visibility_condition || 'always'}
                                                onValueChange={(val) => updateAction(actIdx, { visibility_condition: val as any })}
                                            >
                                                <SelectTrigger className="h-8.5 py-1.5 px-3 rounded-lg border-slate-200 bg-white text-xs font-medium dark:border-zinc-700 dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 shadow-2xs">
                                                    <SelectValue placeholder="Pilih Kondisi" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-lg border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
                                                    <SelectItem value="always" className="text-xs font-medium">
                                                        Selalu Muncul
                                                    </SelectItem>
                                                    <SelectItem value="no_pic" className="text-xs font-medium">
                                                        Jika PIC Belum Ditugaskan
                                                    </SelectItem>
                                                    <SelectItem value="require_pic" className="text-xs font-medium">
                                                        Jika PIC Sudah Ditugaskan
                                                    </SelectItem>
                                                    <SelectItem value="no_signers" className="text-xs font-medium">
                                                        Jika Penandatangan Belum Ditentukan
                                                    </SelectItem>
                                                    <SelectItem value="has_signers" className="text-xs font-medium">
                                                        Jika Penandatangan Sudah Ditentukan
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {/* Cakupan Tahap (All vs Specific) */}
                                    <div className="sm:col-span-2 space-y-1 flex flex-col justify-end">
                                        <label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300 block sm:text-right">
                                            Cakupan Tahap:
                                        </label>
                                        <div className="flex items-center justify-between sm:justify-end gap-2.5 h-8.5">
                                            <label className="flex items-center gap-1 text-xs text-slate-700 dark:text-zinc-300 cursor-pointer font-medium whitespace-nowrap">
                                                <input
                                                    type="radio"
                                                    name={`scope_${act.id}`}
                                                    checked={act.scope !== 'specific_steps'}
                                                    onChange={() => updateAction(actIdx, { scope: 'all_steps' })}
                                                    className="text-primary h-3.5 w-3.5"
                                                />
                                                Semua
                                            </label>
                                            <label className="flex items-center gap-1 text-xs text-slate-700 dark:text-zinc-300 cursor-pointer font-medium whitespace-nowrap">
                                                <input
                                                    type="radio"
                                                    name={`scope_${act.id}`}
                                                    checked={act.scope === 'specific_steps'}
                                                    onChange={() => updateAction(actIdx, { scope: 'specific_steps' })}
                                                    className="text-primary h-3.5 w-3.5"
                                                />
                                                Tertentu
                                            </label>
                                        </div>
                                    </div>

                                    {/* Specific Steps MultiSelect */}
                                    {act.scope === 'specific_steps' && (
                                        <div className="sm:col-span-12 pt-1">
                                            <SearchableMultiSelect
                                                values={act.step_ids || []}
                                                onValuesChange={(vals) => updateAction(actIdx, { step_ids: vals })}
                                                options={stepOptions}
                                                placeholder="Pilih tahapan yang mengizinkan aksi ini..."
                                            />
                                        </div>
                                    )}

                                    {/* Transition Options Selector (Mirrors StepActionConfigCard) */}
                                    <div className="sm:col-span-12 pt-2 border-t border-dashed border-slate-200 dark:border-zinc-800 space-y-2">
                                        <div className="flex flex-wrap items-center gap-2.5">
                                            <span className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300 shrink-0 flex items-center gap-1.5">
                                                <Layers size={13} className="text-primary" />
                                                <span>Transisi Alur Langkah:</span>
                                            </span>

                                            {/* Transisi Selector */}
                                            <div className="w-56 sm:w-64">
                                                <Select
                                                    value={currentTransition}
                                                    onValueChange={(val) => {
                                                        if (val === 'sequential') {
                                                            updateAction(actIdx, {
                                                                execution_type: undefined,
                                                                transition_config: { type: 'relative', offset: 1 },
                                                            });
                                                        } else if (val === 'stay') {
                                                            updateAction(actIdx, {
                                                                execution_type: undefined,
                                                                transition_config: { type: 'relative', offset: 0 },
                                                            });
                                                        } else if (val === 'back') {
                                                            updateAction(actIdx, {
                                                                execution_type: undefined,
                                                                transition_config: { type: 'relative', offset: -1 },
                                                            });
                                                        } else if (val === 'initial_step') {
                                                            updateAction(actIdx, {
                                                                execution_type: undefined,
                                                                transition_config: { type: 'initial_step' },
                                                            });
                                                        } else if (val === 'absolute') {
                                                            updateAction(actIdx, {
                                                                execution_type: undefined,
                                                                transition_config: {
                                                                    type: 'absolute',
                                                                    step_id: steps[0]?.id ? String(steps[0].id) : undefined,
                                                                },
                                                            });
                                                        } else if (val === 'cross_workflow') {
                                                            const targetWf = allWorkflows[0];
                                                            updateAction(actIdx, {
                                                                execution_type: 'cross_workflow',
                                                                transition_config: {
                                                                    type: 'cross_workflow',
                                                                    workflow_id: targetWf?.id ? String(targetWf.id) : '',
                                                                    sequence: targetWf?.steps?.[0]?.step || 1,
                                                                    return_mode: 'branch_next',
                                                                },
                                                            });
                                                        } else if (val === 'origin_return') {
                                                            updateAction(actIdx, {
                                                                execution_type: 'cross_workflow',
                                                                transition_config: {
                                                                    type: 'origin_return',
                                                                    return_mode: 'branch_next',
                                                                },
                                                            });
                                                        }
                                                    }}
                                                >
                                                    <SelectTrigger className="h-8.5 py-1.5 px-3 rounded-lg border-slate-200 bg-white text-xs font-medium dark:border-zinc-700 dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 shadow-2xs">
                                                        <SelectValue placeholder="Pilih Perilaku Transisi" />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-lg border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
                                                        {TRANSITION_OPTIONS.map((opt) => (
                                                            <SelectItem key={opt.value} value={opt.value} className="text-xs font-medium">
                                                                {opt.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {/* If absolute: Select Specific Step */}
                                            {currentTransition === 'absolute' && (
                                                <div className="w-56 sm:w-64">
                                                    <Select
                                                        value={String(act.transition_config?.step_id || steps[0]?.id || '')}
                                                        onValueChange={(val) => {
                                                            const targetStep = steps.find((s: any) => String(s.id) === val);
                                                            updateAction(actIdx, {
                                                                transition_config: {
                                                                    ...act.transition_config,
                                                                    type: 'absolute',
                                                                    step_id: val,
                                                                    sequence: targetStep?.step || 1,
                                                                },
                                                            });
                                                        }}
                                                    >
                                                        <SelectTrigger className="h-8.5 py-1.5 px-3 rounded-lg border-slate-200 bg-white text-xs font-medium dark:border-zinc-700 dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 shadow-2xs">
                                                            <SelectValue placeholder="Pilih Tahap Target" />
                                                        </SelectTrigger>
                                                        <SelectContent className="rounded-lg border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
                                                            {steps.map((s: any, sIdx: number) => (
                                                                <SelectItem key={s.id} value={String(s.id)} className="text-xs font-medium">
                                                                    Tahap {s.step || sIdx + 1}: {s.label || s.name || s.description || `Langkah ${sIdx + 1}`}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            )}

                                            {/* If cross_workflow: Select Target Workflow, Target Sequence, & Return Mode */}
                                            {currentTransition === 'cross_workflow' && (
                                                <>
                                                    <div className="w-52 sm:w-60">
                                                        <Select
                                                            value={act.transition_config?.workflow_id || (allWorkflows[0]?.id ? String(allWorkflows[0].id) : '')}
                                                            onValueChange={(val) => {
                                                                const targetWf = allWorkflows.find((w: any) => String(w.id) === val);
                                                                updateAction(actIdx, {
                                                                    transition_config: {
                                                                        type: 'cross_workflow',
                                                                        workflow_id: val,
                                                                        sequence: targetWf?.steps?.[0]?.step || 1,
                                                                        return_mode: act.transition_config?.return_mode || 'branch_next',
                                                                    },
                                                                });
                                                            }}
                                                        >
                                                            <SelectTrigger className="h-8.5 py-1.5 px-3 rounded-lg border-slate-200 bg-white text-xs font-medium dark:border-zinc-700 dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 shadow-2xs">
                                                                <SelectValue placeholder="Pilih Target Workflow" />
                                                            </SelectTrigger>
                                                            <SelectContent className="z-[9999] rounded-lg border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
                                                                {allWorkflows.map((w: any) => (
                                                                    <SelectItem key={w.id} value={String(w.id)} className="text-xs font-medium">
                                                                        <div className="flex items-center gap-1.5">
                                                                            <WorkflowIcon size={12} className="shrink-0 text-violet-500" />
                                                                            <span>{w.name} {w.contract_type ? `[${w.contract_type.name}]` : '[SEMUA JENIS]'}</span>
                                                                        </div>
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    <div className="w-44 sm:w-52">
                                                        <Select
                                                            value={String(act.transition_config?.sequence || '1')}
                                                            onValueChange={(val) =>
                                                                updateAction(actIdx, {
                                                                    transition_config: {
                                                                        ...act.transition_config,
                                                                        type: 'cross_workflow',
                                                                        sequence: Number(val),
                                                                    },
                                                                })
                                                            }
                                                        >
                                                            <SelectTrigger className="h-8.5 py-1.5 px-3 rounded-lg border-slate-200 bg-white text-xs font-medium dark:border-zinc-700 dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 shadow-2xs">
                                                                <SelectValue placeholder="Pilih Tahap Target" />
                                                            </SelectTrigger>
                                                            <SelectContent className="rounded-lg border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
                                                                {(
                                                                    allWorkflows.find(
                                                                        (w: any) => String(w.id) === (act.transition_config?.workflow_id || allWorkflows[0]?.id),
                                                                    )?.steps || []
                                                                ).map((s: any, sIdx: number) => (
                                                                    <SelectItem key={s.id} value={String(s.step || sIdx + 1)} className="text-xs font-medium">
                                                                        Tahap {s.step || sIdx + 1}: {s.label || `Langkah ${sIdx + 1}`}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    <div className="w-52 sm:w-60">
                                                        <Select
                                                            value={act.transition_config?.return_mode || 'branch_next'}
                                                            onValueChange={(val) => {
                                                                updateAction(actIdx, {
                                                                    transition_config: {
                                                                        ...act.transition_config,
                                                                        type: 'cross_workflow',
                                                                        return_mode: val as any,
                                                                    },
                                                                });
                                                            }}
                                                        >
                                                            <SelectTrigger className="h-8.5 py-1.5 px-3 rounded-lg border-slate-200 bg-white text-xs font-medium dark:border-zinc-700 dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 shadow-2xs">
                                                                <SelectValue placeholder="Titik Kembali" />
                                                            </SelectTrigger>
                                                            <SelectContent className="rounded-lg border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
                                                                <SelectItem value="branch_next" className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <Sparkles size={13} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                                                                        <span>Lanjut ke Step Berikutnya (Origin + 1)</span>
                                                                    </div>
                                                                </SelectItem>
                                                                <SelectItem value="branch_origin" className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <CornerDownLeft size={13} className="shrink-0 text-amber-600 dark:text-amber-400" />
                                                                        <span>Kembali ke Step Pemanggil (Origin Step)</span>
                                                                    </div>
                                                                </SelectItem>
                                                                <SelectItem value="1" className="text-xs font-medium">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <Flag size={13} className="shrink-0 text-slate-500" />
                                                                        <span>Kembali ke Tahap 1 Workflow Asal</span>
                                                                    </div>
                                                                </SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Dedicated Setting for Approval Tambahan (Position of Reviewer) */}
                                    {actionCode === 'add_adhoc' && (
                                        <div className="sm:col-span-12 pt-2 border-t border-dashed border-slate-200 dark:border-zinc-800 space-y-1.5">
                                            <div className="flex flex-wrap items-center gap-2.5">
                                                <span className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300 shrink-0 flex items-center gap-1.5">
                                                    <UserPlus size={13} className="text-indigo-500" />
                                                    <span>Posisi Penempatan Reviewer Tambahan:</span>
                                                </span>

                                                <div className="w-48 sm:w-56">
                                                    <Select
                                                        value={act.target_step_position || 'at'}
                                                        onValueChange={(val) => updateAction(actIdx, { target_step_position: val as any })}
                                                    >
                                                        <SelectTrigger className="h-8.5 py-1.5 px-3 rounded-lg border-slate-200 bg-white text-xs font-medium dark:border-zinc-700 dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 shadow-2xs">
                                                            <SelectValue placeholder="Pilih Posisi" />
                                                        </SelectTrigger>
                                                        <SelectContent className="rounded-lg border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
                                                            <SelectItem value="at" className="text-xs font-medium">
                                                                <div className="flex items-center gap-1.5">
                                                                    <Settings2 size={13} className="text-slate-400 shrink-0" />
                                                                    <span>Pada Tahap (Saat Ini)</span>
                                                                </div>
                                                            </SelectItem>
                                                            <SelectItem value="before" className="text-xs font-medium">
                                                                <div className="flex items-center gap-1.5">
                                                                    <CornerDownLeft size={13} className="text-amber-500 shrink-0" />
                                                                    <span>Sebelum Tahap</span>
                                                                </div>
                                                            </SelectItem>
                                                            <SelectItem value="after" className="text-xs font-medium">
                                                                <div className="flex items-center gap-1.5">
                                                                    <ArrowRight size={13} className="text-emerald-500 shrink-0" />
                                                                    <span>Setelah Tahap</span>
                                                                </div>
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Kolom Wajib & Autofill / Reset Data Otomatis */}
                                    <div className="sm:col-span-12 pt-2 border-t border-dashed border-slate-200 dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-12 gap-3">
                                        <div className="sm:col-span-6 space-y-1">
                                            <label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300 block">
                                                Kolom Wajib Diisi (Required):
                                            </label>
                                            <SearchableMultiSelectPortal
                                                values={act.required_fields || []}
                                                onValuesChange={(vals: string[]) => updateAction(actIdx, { required_fields: vals })}
                                                options={AVAILABLE_FIELDS}
                                                placeholder="Pilih Kolom..."
                                                triggerClassName="min-h-[34px] py-1 px-3 text-xs rounded-lg"
                                            />
                                        </div>

                                        <div className="sm:col-span-6 space-y-1">
                                            <label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300 block">
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
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Modal Tambah Master Action Baru */}
            <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
                <DialogContent className="sm:max-w-[550px] border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 rounded-xl p-0 shadow-2xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-800/40 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 bg-primary/10 text-primary rounded-lg">
                                <PlusCircle size={18} />
                            </div>
                            <div>
                                <DialogTitle className="text-sm font-bold text-slate-800 dark:text-zinc-100">
                                    Tambah Aksi Kustom (Master Action)
                                </DialogTitle>
                                <DialogDescription className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                                    Pilih jenis Master Action yang ingin ditambahkan ke tombol aksi alur kerja.
                                </DialogDescription>
                            </div>
                        </div>
                    </div>

                    <div className="p-5 space-y-2.5 max-h-[70vh] overflow-y-auto">
                        {MASTER_ACTIONS.map((ma: any) => {
                            const tmpl = CUSTOM_ACTION_TEMPLATES.find((t) => t.action_code === ma.code) || CUSTOM_ACTION_TEMPLATES[0];
                            const IconComp = tmpl.icon || Sliders;
                            return (
                                <button
                                    key={ma.id || ma.code}
                                    type="button"
                                    onClick={() => handleAddFromMasterAction(ma.code)}
                                    className="w-full text-left p-3 rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-primary hover:bg-primary/5 transition-all flex items-start gap-3 group cursor-pointer"
                                >
                                    <div className={cn("p-2 rounded-lg shrink-0 mt-0.5", tmpl.badgeBg)}>
                                        <IconComp size={16} className="text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-100 group-hover:text-primary transition-colors">
                                                {ma.name}
                                            </h4>
                                            <span className="text-[10px] font-mono text-slate-400 uppercase bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                                                {ma.code}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                                            {tmpl.description}
                                        </p>
                                    </div>
                                    <Plus size={15} className="text-slate-400 group-hover:text-primary shrink-0 mt-1" />
                                </button>
                            );
                        })}
                    </div>

                    <DialogFooter className="p-3 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/50">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setAddModalOpen(false)}
                            className="h-8.5 px-4 text-xs font-semibold"
                        >
                            Batal
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal Konfirmasi Hapus Aksi */}
            <Dialog open={actionToDelete !== null} onOpenChange={(open) => { if (!open) setActionToDelete(null); }}>
                <DialogContent className="sm:max-w-[420px] border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 rounded-xl p-5 shadow-2xl">
                    <div className="flex items-start gap-3.5">
                        <div className="p-2.5 bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400 rounded-full shrink-0">
                            <Trash2 size={20} />
                        </div>
                        <div className="space-y-1.5">
                            <DialogTitle className="text-sm font-bold text-slate-800 dark:text-zinc-100">
                                Hapus Aksi Kustom?
                            </DialogTitle>
                            <DialogDescription className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                                Apakah Anda yakin ingin menghapus aksi <strong>"{actionToDelete?.name}"</strong> dari alur kerja ini?
                            </DialogDescription>
                        </div>
                    </div>
                    <DialogFooter className="mt-4 flex items-center justify-end gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setActionToDelete(null)}
                            className="h-8.5 px-3.5 text-xs font-semibold"
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            onClick={handleConfirmDelete}
                            className="h-8.5 px-4 text-xs font-bold bg-red-600 hover:bg-red-700 text-white"
                        >
                            Hapus Aksi
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal 1: Otoritas Akses Tombol */}
            {!!editingAuthorityActionId && (
                <Dialog open={!!editingAuthorityActionId} onOpenChange={(open) => { if (!open) setEditingAuthorityActionId(null); }}>
                    <DialogContent className="sm:max-w-[96vw] w-[96vw] max-w-[96vw] h-[90vh] max-h-[90vh] border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 rounded-[12px] border p-0 shadow-2xl overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-slate-700 bg-slate-800 text-white flex items-center justify-between rounded-t-[12px] shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="bg-white/20 text-white border border-white/20 flex h-9 w-9 items-center justify-center rounded-lg">
                                    <Key size={18} className="text-amber-400" />
                                </div>
                                <div>
                                    <DialogTitle className="text-sm font-bold tracking-tight text-white">
                                        Otoritas Akses Tombol — {currentEditingAuthorityAction?.alias || currentEditingAuthorityAction?.name || 'Aksi Kustom'}
                                    </DialogTitle>
                                    <DialogDescription className="text-white/80 text-xs font-medium mt-0.5">
                                        Tentukan pengguna/role/departemen yang berhak <strong>melihat dan mengklik tombol</strong> ini di detail kontrak.
                                    </DialogDescription>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-white dark:bg-zinc-900 flex-1 overflow-y-auto space-y-4">
                            {currentEditingAuthorityAction && currentEditingAuthorityIndex >= 0 && (
                                <AuthorityTableManager
                                    title={`Otoritas Akses Tombol: ${currentEditingAuthorityAction.alias || currentEditingAuthorityAction.name}`}
                                    authorities={currentEditingAuthorityAction.authorities || []}
                                    onChange={(vals) => updateAction(currentEditingAuthorityIndex, { authorities: vals })}
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
                            )}
                        </div>

                        <DialogFooter className="p-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/50 flex items-center justify-end">
                            <Button
                                type="button"
                                onClick={() => setEditingAuthorityActionId(null)}
                                className="cursor-pointer h-8.5 px-4 text-xs font-bold"
                            >
                                Selesai
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {/* Modal 2: Tentukan Personil / Pool Reviewer */}
            {!!editingPersonnelActionId && (
                <Dialog open={!!editingPersonnelActionId} onOpenChange={(open) => { if (!open) setEditingPersonnelActionId(null); }}>
                    <DialogContent className="sm:max-w-[96vw] w-[96vw] max-w-[96vw] h-[90vh] max-h-[90vh] border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 rounded-[12px] border p-0 shadow-2xl overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-primary/20 bg-primary text-white flex items-center justify-between rounded-t-[12px] shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="bg-white/20 text-white border border-white/20 flex h-9 w-9 items-center justify-center rounded-lg">
                                    <UsersIcon size={18} />
                                </div>
                                <div>
                                    <DialogTitle className="text-sm font-bold tracking-tight text-white">
                                        Daftar Personil Yang Dapat Dipilih — {currentEditingPersonnelAction?.alias || currentEditingPersonnelAction?.name || 'Aksi Kustom'}
                                    </DialogTitle>
                                    <DialogDescription className="text-white/80 text-xs font-medium mt-0.5">
                                        Tentukan daftar pengguna/role/departemen yang <strong>bisa dipilih</strong> di dalam modal (misal: calon PIC, Reviewer, atau Penandatangan).
                                    </DialogDescription>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-white dark:bg-zinc-900 flex-1 overflow-y-auto space-y-4">
                            {currentEditingPersonnelAction && currentEditingPersonnelIndex >= 0 && (
                                <AuthorityTableManager
                                    title={`Daftar Personil Yang Dapat Dipilih: ${currentEditingPersonnelAction.alias || currentEditingPersonnelAction.name}`}
                                    authorities={currentEditingPersonnelAction.eligible_personnel || []}
                                    onChange={(vals) => updateAction(currentEditingPersonnelIndex, { eligible_personnel: vals })}
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
                            )}
                        </div>

                        <DialogFooter className="p-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/50 flex items-center justify-end">
                            <Button
                                type="button"
                                onClick={() => setEditingPersonnelActionId(null)}
                                className="cursor-pointer h-8.5 px-4 text-xs font-bold"
                            >
                                Selesai
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
