import { useState } from 'react';
import { Button } from '@/components/ui/buttons/Button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialogs/Dialog';
import { SearchableMultiSelect } from '@/components/ui/selection/SearchableMultiSelect';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/selection/Select';
import { Briefcase, Copy, FileSignature, GitBranch, Settings2, Shield, Trash2, Users as UsersIcon } from 'lucide-react';

import { AUTOFILLED_PARAMS, AVAILABLE_FIELDS, MASTER_ACTIONS, TRANSITION_OPTIONS, getActionTheme } from '../constants';
import { cn } from '@/lib/utils';
import AuthoritySelector from './AuthoritySelector';
import AuthorityTableManager from './AuthorityTableManager';

const mapConfigToAuthorities = (config: any) => {
    if (!config) return [];
    if (config.authorities && Array.isArray(config.authorities)) {
        return config.authorities;
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
    idx: number;
    step: any;
    allWorkflows: any[];
    allWorkflowSteps: any[];
    roles: any[];
    departments: any[];
    divisions?: any[];
    companyGroups?: any[];
    regions?: any[];
    users: any[];
    contractStatuses?: any[];
    updateAction: (actIdx: number, data: any) => void;
    removeAction: (actIdx: number) => void;
    cloneAction: (actIdx: number) => void;
}

export function StepActionConfigCard({
    act,
    actIdx,
    idx,
    step,
    allWorkflows,
    allWorkflowSteps,
    roles,
    departments,
    divisions = [],
    companyGroups = [],
    regions = [],
    users,
    contractStatuses = [],
    updateAction,
    removeAction,
    cloneAction,
}: StepActionConfigCardProps) {
    const actionCode = (act.master_action?.code || act.action_code || act.master_action_id || '').toLowerCase();
    const isForwardAction = actionCode === 'forward';
    const isSignatureAction = ['signature', 'sign'].includes(actionCode);
    const isAssignOrForwardAction = ['assign', 'forward'].includes(actionCode);

    const [isAssigneeModalOpen, setIsAssigneeModalOpen] = useState(false);

    // Fallback status: act.target_status -> step.meta?.target_status
    const effectiveStatusCode = act.target_status || step?.meta?.target_status;
    const effectiveStatusObj = effectiveStatusCode
        ? contractStatuses.find((s: any) => s.code === effectiveStatusCode)
        : null;

    const { color } = getActionTheme(actionCode);

    const headerThemes: Record<string, { bg: string; text: string; border: string; buttonHover: string; activeColor: string }> = {
        approve: {
            bg: 'bg-emerald-700/90 dark:bg-emerald-900/80',
            text: 'text-white',
            border: 'border-transparent',
            buttonHover: 'text-white/80 hover:text-white hover:bg-white/15',
            activeColor: 'bg-primary text-white shadow-xs'
        },
        reject: {
            bg: 'bg-rose-600/90 dark:bg-rose-900/80',
            text: 'text-white',
            border: 'border-transparent',
            buttonHover: 'text-white/80 hover:text-white hover:bg-white/15',
            activeColor: 'bg-primary text-white shadow-xs'
        },
        assign: {
            bg: 'bg-blue-700/90 dark:bg-blue-900/80',
            text: 'text-white',
            border: 'border-transparent',
            buttonHover: 'text-white/80 hover:text-white hover:bg-white/15',
            activeColor: 'bg-primary text-white shadow-xs'
        },
        assign_pic: {
            bg: 'bg-blue-700/90 dark:bg-blue-900/80',
            text: 'text-white',
            border: 'border-transparent',
            buttonHover: 'text-white/80 hover:text-white hover:bg-white/15',
            activeColor: 'bg-primary text-white shadow-xs'
        },
        sign: {
            bg: 'bg-amber-700/90 dark:bg-amber-900/80',
            text: 'text-white',
            border: 'border-transparent',
            buttonHover: 'text-white/80 hover:text-white hover:bg-white/15',
            activeColor: 'bg-primary text-white shadow-xs'
        },
        signature: {
            bg: 'bg-amber-700/90 dark:bg-amber-900/80',
            text: 'text-white',
            border: 'border-transparent',
            buttonHover: 'text-white/80 hover:text-white hover:bg-white/15',
            activeColor: 'bg-primary text-white shadow-xs'
        },
        forward: {
            bg: 'bg-indigo-600/90 dark:bg-indigo-900/80',
            text: 'text-white',
            border: 'border-transparent',
            buttonHover: 'text-white/80 hover:text-white hover:bg-white/15',
            activeColor: 'bg-primary text-white shadow-xs'
        }
    };

    const headerTheme = headerThemes[actionCode] || {
        bg: 'bg-slate-700 dark:bg-slate-800',
        text: 'text-white',
        border: 'border-transparent',
        buttonHover: 'text-white/80 hover:text-white hover:bg-white/15',
        activeColor: 'bg-primary text-white shadow-xs'
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
            if (act.transition_config.type === 'cross_workflow') return 'cross_workflow';
            if (act.transition_config.type === 'initial_step') return 'initial_step';
        }

        // Fallback for backward compatibility
        if (act.next_workflow_id) return 'cross_workflow';
        if (act.next_step_id) {
            const firstStep = allWorkflowSteps[0];
            if (firstStep && act.next_step_id === firstStep.id && idx > 0) return 'absolute';
            const prevStep = allWorkflowSteps[idx - 1];
            if (prevStep && act.next_step_id === prevStep.id) return 'back';
        }
        return 'sequential';
    })();

    const showCrossWorkflowSelector = transitionType === 'cross_workflow';
    const showAbsoluteStepSelector = transitionType === 'absolute';

    return (
        <div className="relative space-y-3 rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm transition-all hover:border-slate-300 dark:border-zinc-800 dark:bg-zinc-900/95 focus-within:z-30">
            {/* Card Header */}
            <div
                className={cn(
                    "flex flex-wrap items-center justify-between gap-2.5 border-b pb-2.5 px-4 py-3 -mx-4 -mt-4 rounded-t-xl transition-all shadow-xs",
                    !effectiveStatusObj && headerTheme.bg,
                    headerTheme.border
                )}
                style={effectiveStatusObj?.color ? {
                    backgroundColor: effectiveStatusObj.color,
                    borderColor: 'transparent',
                } : undefined}
            >
                <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-sm font-bold text-white tracking-wide shrink-0">
                        Aksi #{actIdx + 1}
                    </span>

                    {/* Nama Aksi (Master Action) di Header */}
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
                            <SelectTrigger className="h-8 py-1 px-2.5 rounded-lg border-white/25 bg-white/20 hover:bg-white/25 text-white text-xs font-semibold focus:ring-1 focus:ring-white/40 focus:border-white shadow-none backdrop-blur-xs [&>svg]:text-white [&>svg]:opacity-80">
                                <SelectValue placeholder="Pilih Aksi" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-slate-200 bg-white text-slate-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
                                {MASTER_ACTIONS.map((ma: any) => (
                                    <SelectItem key={ma.id} value={ma.id} className="text-xs font-medium">
                                        {ma.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Status Kontrak Target di Header */}
                    <div className="w-36 sm:w-48">
                        <Select
                            value={act.target_status || 'default'}
                            onValueChange={(v) => {
                                updateAction(actIdx, {
                                    target_status: v === 'default' ? null : v,
                                });
                            }}
                        >
                            <SelectTrigger className="h-8 py-1 px-2.5 rounded-lg border-white/25 bg-white/20 hover:bg-white/25 text-white text-xs font-semibold focus:ring-1 focus:ring-white/40 focus:border-white shadow-none backdrop-blur-xs [&>svg]:text-white [&>svg]:opacity-80">
                                <SelectValue placeholder="Pilih Status" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-slate-200 bg-white text-slate-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
                                <SelectItem value="default" className="py-2 text-xs font-medium text-slate-500 uppercase">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="h-2.5 w-2.5 rounded-full border border-slate-300"
                                            style={{ backgroundColor: step?.meta?.target_status ? (contractStatuses.find((s: any) => s.code === step.meta.target_status)?.color || '#cbd5e1') : '#cbd5e1' }}
                                        />
                                        <span>
                                            DEFAULT{step?.meta?.target_status ? ` (${step.meta.target_status.toUpperCase()})` : ''}
                                        </span>
                                    </div>
                                </SelectItem>
                                {contractStatuses.map((status: any) => (
                                    <SelectItem
                                        key={status.id}
                                        value={status.code}
                                        className="py-2 text-xs font-medium uppercase"
                                    >
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="h-2.5 w-2.5 rounded-full"
                                                style={{ backgroundColor: status.color || '#cbd5e1' }}
                                            />
                                            <span className="font-semibold tracking-wide">
                                                {status.code?.toUpperCase()}
                                            </span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                    {/* Toggle Active/Inactive */}
                    <button
                        type="button"
                        onClick={() => updateAction(actIdx, { is_active: act.is_active !== false ? false : true })}
                        className={cn(
                            'flex h-6.5 cursor-pointer items-center gap-1 rounded-full px-3 text-[9.5px] font-bold uppercase transition-all mr-1 shadow-xs',
                            act.is_active !== false ? 'bg-primary text-white hover:bg-primary/90' : 'bg-white/20 text-white/80 hover:bg-white/30'
                        )}
                    >
                        {act.is_active !== false ? 'AKTIF' : 'NON-AKTIF'}
                    </button>

                    <button
                        type="button"
                        onClick={() => cloneAction(actIdx)}
                        className="cursor-pointer transition-colors p-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white border border-white/10 flex items-center justify-center shadow-xs"
                        title="Duplikat Aksi"
                    >
                        <Copy size={13} />
                    </button>
                    <button
                        type="button"
                        onClick={() => removeAction(actIdx)}
                        className="cursor-pointer transition-colors p-1.5 rounded-lg bg-white/15 hover:bg-rose-500/90 text-white border border-white/10 flex items-center justify-center shadow-xs"
                        title="Hapus Aksi"
                    >
                        <Trash2 size={13} />
                    </button>
                </div>
            </div>

            {/* Grid Input */}
            <div className={cn("grid grid-cols-1 gap-3.5 sm:grid-cols-2 pt-1 transition-opacity duration-200", act.is_active === false && "opacity-45 pointer-events-none")}>
                {/* Alias Aksi */}
                <div className="space-y-1.5 sm:col-span-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Alias Aksi (Label Tombol)</label>
                    <input
                        type="text"
                        value={act.alias || ''}
                        onChange={(e) => updateAction(actIdx, { alias: e.target.value })}
                        className="h-9.5 w-full py-2 px-3 rounded-lg border border-slate-200 bg-white text-xs font-medium transition-all focus:border-primary focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 shadow-none"
                        placeholder="Contoh: Kirim Review, Kembalikan ke Legal"
                    />
                </div>

                {/* Deskripsi Aksi */}
                <div className="space-y-1.5 sm:col-span-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Deskripsi Aksi (Keterangan / Tooltip)</label>
                    <input
                        type="text"
                        value={act.description || ''}
                        onChange={(e) => updateAction(actIdx, { description: e.target.value })}
                        className="h-9.5 w-full py-2 px-3 rounded-lg border border-slate-200 bg-white text-xs font-medium transition-all focus:border-primary focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 shadow-none"
                        placeholder="Deskripsi singkat fungsi tombol ini..."
                    />
                </div>

                {/* Pengaturan Transisi (Single Flat Section, No Nested Card) */}
                <div className="space-y-1.5 sm:col-span-2">
                    <div className="flex items-center gap-1.5">
                        <GitBranch size={13} className="text-slate-500 dark:text-zinc-400" />
                        <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                            Pengaturan Transisi (Next Step)
                        </label>
                    </div>

                    <div className="space-y-2">
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
                                    updateAction(actIdx, {
                                        transition_config: { type: 'absolute', sequence: 1 },
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
                            <SelectTrigger className="h-9.5 py-2 px-3 rounded-lg border-slate-200 bg-white text-xs font-medium focus:border-primary dark:border-zinc-700 dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 shadow-none">
                                <SelectValue placeholder="Pilih Transisi" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
                                {TRANSITION_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value} className="text-xs font-medium">
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Cross Workflow Selector (Flat Inline) */}
                        {showCrossWorkflowSelector && (
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pt-1 animate-in fade-in-50 duration-200">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Target Alur Kerja</label>
                                    <Select
                                        value={act.transition_config?.workflow_id || act.next_workflow_id || ''}
                                        onValueChange={(val) => {
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
                                        }}
                                    >
                                        <SelectTrigger className="h-9.5 py-2 px-3 rounded-lg border-slate-200 bg-white text-xs font-medium focus:border-primary dark:border-zinc-700 dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 shadow-none">
                                            <SelectValue placeholder="Pilih Alur Kerja" />
                                        </SelectTrigger>
                                        <SelectContent className="z-[9999] rounded-xl border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
                                            {allWorkflows.map((w: any) => (
                                                <SelectItem key={w.id} value={String(w.id)} className="text-xs font-medium">
                                                    {w.name} {w.contract_type ? `[${w.contract_type.name}]` : '[SEMUA JENIS]'}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Mulai Dari Langkah</label>
                                    <Select
                                        value={String(act.transition_config?.sequence || '')}
                                        onValueChange={(val) =>
                                            updateAction(actIdx, {
                                                transition_config: { ...act.transition_config, type: 'cross_workflow', sequence: Number(val) },
                                                next_workflow_step_id: null,
                                            })
                                        }
                                    >
                                        <SelectTrigger className="h-9.5 py-2 px-3 rounded-lg border-slate-200 bg-white text-xs font-medium focus:border-primary dark:border-zinc-700 dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 shadow-none">
                                            <SelectValue placeholder="Pilih Tahap Target" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
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
                                </div>
                            </div>
                        )}

                        {/* Absolute Step Selector (Flat Inline) */}
                        {showAbsoluteStepSelector && (
                            <div className="pt-1 animate-in fade-in-50 duration-200">
                                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Pilih Langkah Target</label>
                                <Select
                                    value={String(act.transition_config?.sequence || '1')}
                                    onValueChange={(val) =>
                                        updateAction(actIdx, {
                                            transition_config: { ...act.transition_config, type: 'absolute', sequence: Number(val) },
                                        })
                                    }
                                >
                                    <SelectTrigger className="h-9.5 py-2 px-3 rounded-lg border-slate-200 bg-white text-xs font-medium focus:border-primary dark:border-zinc-700 dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 shadow-none">
                                        <SelectValue placeholder="Pilih Tahap Target" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
                                        {allWorkflowSteps.map((s: any, sIdx: number) => (
                                            <SelectItem key={s.id} value={String(s.step || sIdx + 1)} className="text-xs font-medium">
                                                Tahap {s.step || sIdx + 1}: {s.label || `Langkah ${sIdx + 1}`}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>
                </div>

                {/* Cell 3: Required Fields */}
                <div className="relative space-y-1.5 z-20 focus-within:z-40">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Kolom Wajib Diisi (Required)</label>
                    <SearchableMultiSelect
                        values={act.required_fields || []}
                        onValuesChange={(vals: string[]) => updateAction(actIdx, { required_fields: vals })}
                        options={AVAILABLE_FIELDS}
                        placeholder="Pilih Kolom..."
                    />
                </div>

                {/* Cell 4: Autofill Fields */}
                <div className="relative space-y-1.5 z-10 focus-within:z-40">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Kolom Isi Otomatis (Autofill)</label>
                    <SearchableMultiSelect
                        values={act.autofilled_fields || []}
                        onValuesChange={(vals: string[]) => updateAction(actIdx, { autofilled_fields: vals })}
                        options={AUTOFILLED_PARAMS}
                        placeholder="Pilih Kolom..."
                    />
                </div>

                {/* Cell 5: Signers (Conditional) */}
                {isSignatureAction && (
                    <div className="col-span-1 space-y-3 pt-2 border-t border-slate-100 dark:border-zinc-800 sm:col-span-2 w-full">
                        <div className="flex items-center gap-1.5">
                            <FileSignature size={13} className="text-amber-500" />
                            <label className="text-xs font-bold text-amber-600 dark:text-amber-400">
                                Konfigurasi Upload Tanda Tangan
                            </label>
                        </div>

                        {/* Target Langkah (Sub-Step) */}
                        <div className="space-y-1 max-w-sm">
                            <label className="text-xs font-medium text-slate-600 dark:text-zinc-400">Target Langkah (Sub-Step)</label>
                            <Select
                                value={act.assignee_config?.signature_target_step ? String(act.assignee_config?.signature_target_step) : ''}
                                onValueChange={(val) =>
                                    updateAction(actIdx, {
                                        assignee_config: {
                                            ...act.assignee_config,
                                            signature_target_step: val,
                                        },
                                    })
                                }
                            >
                                <SelectTrigger className="h-9.5 py-2 px-3 rounded-lg border-slate-200 bg-white text-xs font-medium focus:border-primary dark:border-zinc-700 dark:bg-zinc-900">
                                    <SelectValue placeholder="Pilih Tahap Target" />
                                </SelectTrigger>
                                <SelectContent className="rounded-lg bg-white dark:bg-zinc-950">
                                    {allWorkflowSteps.map((s: any, sIdx: number) => (
                                        <SelectItem key={s.id} value={String(s.id)} className="text-xs font-medium">
                                            Tahap {sIdx + 1}: {s.label || `Langkah ${sIdx + 1}`}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="pt-2">
                            <AuthorityTableManager
                                title="Aktor Penandatangan"
                                authorities={mapConfigToAuthorities(act.signing_parties)}
                                onChange={(vals) => updateAction(actIdx, { signing_parties: mapAuthoritiesToConfig(vals) })}
                                users={users}
                                roles={roles}
                                departments={departments}
                                divisions={divisions}
                                companyGroups={companyGroups}
                                regions={regions}
                                showCustom={true}
                                showCombinations={true}
                            />
                        </div>
                    </div>
                )}

                {/* Cell 6: Assignee Config (Button + Modal - Flat Strip) */}
                {isAssignOrForwardAction && (() => {
                    const assigneeAuthorities = mapConfigToAuthorities(act.assignee_config);
                    const assigneeCount = assigneeAuthorities.length;

                    return (
                        <div className="col-span-1 sm:col-span-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-zinc-800/80">
                            <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5">
                                    <UsersIcon size={14} className="text-primary" />
                                    <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                                        {isForwardAction ? 'Lingkup Reviewer Tambahan' : 'Konfigurasi Penugasan (Assignee)'}
                                    </span>
                                </div>
                                <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                                    {assigneeCount > 0
                                        ? `${assigneeCount} otoritas / aktor telah dikonfigurasi.`
                                        : 'Belum ada aktor penugasan yang ditentukan.'}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setIsAssigneeModalOpen(true)}
                                className={cn(
                                    "inline-flex items-center gap-1.5 px-3.5 h-8.5 rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer shrink-0 border",
                                    assigneeCount > 0
                                        ? "bg-primary text-white border-primary hover:bg-primary/90"
                                        : "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800"
                                )}
                            >
                                <Settings2 size={13} />
                                <span>{isForwardAction ? 'Atur Reviewer' : 'Atur Aktor Penugasan'}</span>
                                <span className={cn(
                                    "ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-bold",
                                    assigneeCount > 0 ? "bg-white/25 text-white" : "bg-primary text-white"
                                )}>
                                    {assigneeCount}
                                </span>
                            </button>

                            {/* Modal Dialog for Assignee Configuration */}
                            <Dialog open={isAssigneeModalOpen} onOpenChange={setIsAssigneeModalOpen}>
                                <DialogContent className="sm:max-w-[96vw] w-[96vw] max-w-[96vw] h-[90vh] max-h-[90vh] border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 rounded-[12px] border p-0 shadow-2xl overflow-hidden flex flex-col">
                                    <div className="px-6 py-4 border-b border-primary/20 dark:border-zinc-700/80 bg-primary dark:bg-zinc-800/90 text-white dark:text-zinc-200 flex items-center justify-between rounded-t-[12px] shrink-0">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-white/20 text-white border border-white/20 dark:bg-primary/20 dark:text-primary dark:border-primary/30 flex h-9 w-9 items-center justify-center rounded-lg">
                                                <UsersIcon size={18} />
                                            </div>
                                            <div>
                                                <DialogTitle className="text-sm font-bold tracking-tight text-white dark:text-zinc-100">
                                                    {isForwardAction ? 'Konfigurasi Reviewer Tambahan' : 'Konfigurasi Aktor Penugasan (Assignee)'} — Aksi #{actIdx + 1}: {act.alias || act.master_action?.name || 'Aksi'}
                                                </DialogTitle>
                                                <DialogDescription className="text-white/80 dark:text-zinc-400 text-xs font-medium mt-0.5">
                                                    {isForwardAction
                                                        ? 'Tentukan langkah target dan daftar reviewer yang berhak menerima dokumen'
                                                        : 'Tentukan langkah target dan aktor/pengguna yang dapat ditugaskan sebagai PIC'}
                                                </DialogDescription>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 bg-white dark:bg-zinc-900 flex-1 overflow-y-auto space-y-4">
                                        {isForwardAction && (
                                            <div className="space-y-1 max-w-sm">
                                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                    Target Langkah (Insert To)
                                                </label>
                                                <Select
                                                    value={act.next_step_id || 'current'}
                                                    onValueChange={(val) => {
                                                        updateAction(actIdx, {
                                                            next_step_id: val === 'current' ? null : val,
                                                        });
                                                    }}
                                                >
                                                    <SelectTrigger className="h-10 py-2 px-3 rounded-lg border-slate-200 bg-white text-sm font-medium focus:border-slate-900 dark:border-slate-800 dark:bg-slate-950">
                                                        <SelectValue placeholder="Pilih Tahap Target" />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-lg bg-white dark:bg-slate-950">
                                                        <SelectItem value="current" className="text-sm font-medium">
                                                            Langkah Saat Ini (Default)
                                                        </SelectItem>
                                                        {allWorkflowSteps.map((s: any, sIdx: number) => (
                                                            <SelectItem key={s.id} value={String(s.id)} className="text-sm font-medium">
                                                                Tahap {sIdx + 1}: {s.label || `Langkah ${sIdx + 1}`}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}

                                        {isSignatureAction && (
                                            <div className="space-y-1 max-w-sm">
                                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                    Target Langkah Upload Tanda Tangan (Insert To)
                                                </label>
                                                <Select
                                                    value={act.assignee_config?.signature_target_step ? String(act.assignee_config?.signature_target_step) : ''}
                                                    onValueChange={(val) =>
                                                        updateAction(actIdx, {
                                                            assignee_config: {
                                                                ...act.assignee_config,
                                                                signature_target_step: val,
                                                            },
                                                        })
                                                    }
                                                >
                                                    <SelectTrigger className="h-10 py-2 px-3 rounded-lg border-slate-200 bg-white text-sm font-medium focus:border-slate-900 dark:border-slate-800 dark:bg-slate-950">
                                                        <SelectValue placeholder="Pilih Tahap Target" />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-lg bg-white dark:bg-slate-950">
                                                        {allWorkflowSteps.map((s: any, sIdx: number) => (
                                                            <SelectItem key={s.id} value={String(s.id)} className="text-sm font-medium">
                                                                Tahap {sIdx + 1}: {s.label || `Langkah ${sIdx + 1}`}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}

                                        {/* Authority Table Manager for Assignee */}
                                        <AuthorityTableManager
                                            title={isForwardAction ? 'Lingkup Reviewer Tambahan' : 'Aktor Penugasan (Assignee)'}
                                            authorities={assigneeAuthorities}
                                            onChange={(vals) => updateAction(actIdx, { assignee_config: mapAuthoritiesToConfig(vals) })}
                                            users={users}
                                            roles={roles}
                                            departments={departments}
                                            divisions={divisions}
                                            companyGroups={companyGroups}
                                            regions={regions}
                                            showCustom={true}
                                            showCombinations={true}
                                        />
                                    </div>

                                    <DialogFooter className="p-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/50 flex items-center justify-end">
                                        <Button
                                            type="button"
                                            onClick={() => setIsAssigneeModalOpen(false)}
                                            className="cursor-pointer"
                                        >
                                            Selesai
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    );
                })()}
            </div>
        </div>
    );
}
