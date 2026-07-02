import { SearchableMultiSelect } from '@/components/ui/selection/SearchableMultiSelect';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/selection/Select';
import { Briefcase, Copy, FileSignature, Settings2, Shield, Trash2, Users as UsersIcon } from 'lucide-react';

import { AUTOFILLED_PARAMS, AVAILABLE_FIELDS, MASTER_ACTIONS, getActionTheme } from '../constants';
import { cn } from '@/lib/utils';
import AuthoritySelector from './AuthoritySelector';


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
    users: any[];
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
    users,
    updateAction,
    removeAction,
    cloneAction,
}: StepActionConfigCardProps) {
    const actionCode = (act.master_action?.code || act.action_code || act.master_action_id || '').toLowerCase();
    const isForwardAction = actionCode === 'forward';
    const isSignatureAction = ['signature', 'sign'].includes(actionCode);
    const isAssignOrForwardAction = ['assign', 'forward'].includes(actionCode);

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
        <div className="relative space-y-2 rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-950/40">
            {/* Card Header */}
            <div className={cn(
                "flex items-center justify-between border-b pb-2 px-3 py-2.5 -mx-3 -mt-3 rounded-t-lg transition-all",
                headerTheme.bg,
                headerTheme.border
            )}>
                <span className={cn(
                    "text-sm font-semibold tracking-wider font-bold",
                    headerTheme.text
                )}>
                    Aksi #{actIdx + 1}
                </span>
                <div className="flex items-center gap-1.5">
                    {/* Toggle Active/Inactive */}
                    <button
                        type="button"
                        onClick={() => updateAction(actIdx, { is_active: act.is_active !== false ? false : true })}
                        className={cn(
                            'flex h-6 cursor-pointer items-center gap-1 rounded-full px-2.5 text-[9px] font-bold uppercase transition-all mr-1.5',
                            act.is_active !== false ? 'bg-primary text-white shadow-xs' : 'bg-white/20 text-white/70 hover:bg-white/30'
                        )}
                    >
                        {act.is_active !== false ? 'AKTIF' : 'NON-AKTIF'}
                    </button>

                    <button
                        type="button"
                        onClick={() => cloneAction(actIdx)}
                        className="cursor-pointer transition-colors p-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white border border-white/10 flex items-center justify-center shadow-xs"
                        title="Clone Aksi"
                    >
                        <Copy size={14} />
                    </button>
                    <button
                        type="button"
                        onClick={() => removeAction(actIdx)}
                        className="cursor-pointer transition-colors p-1.5 rounded-lg bg-white/15 hover:bg-rose-500/80 text-white border border-white/10 flex items-center justify-center shadow-xs"
                        title="Hapus Aksi"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            {/* Grid Input 2x2 */}
            <div className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2 transition-opacity duration-200", act.is_active === false && "opacity-45 pointer-events-none")}>
                {/* Cell 1: Nama Aksi */}
                <div className="space-y-1">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ">Nama Aksi</label>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Select
                            value={act.master_action_id || ''}
                            onValueChange={(val) => {
                                const matched = MASTER_ACTIONS.find((m: any) => m.id === val || m.code === val);
                                updateAction(actIdx, {
                                    master_action_id: val,
                                    master_action_name: '',
                                    master_action: matched || null,
                                });
                            }}
                        >
                            <SelectTrigger className="h-10 py-2 px-3 rounded-lg border-slate-200 bg-white dark:bg-slate-900 text-sm font-medium  focus:border-slate-900 dark:border-slate-800 dark:bg-slate-900">
                                <SelectValue placeholder="Pilih Aksi" />
                            </SelectTrigger>
                            <SelectContent className="rounded-lg border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
                                {MASTER_ACTIONS.map((ma: any) => (
                                    <SelectItem key={ma.id} value={ma.id} className="text-sm font-medium ">
                                        {ma.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Cell 1b: Alias Aksi */}
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ">Alias Aksi (Label Tombol)</label>
                    <input
                        type="text"
                        value={act.alias || ''}
                        onChange={(e) => updateAction(actIdx, { alias: e.target.value })}
                        className="h-10 w-full py-2 px-3 rounded-lg border border-slate-200 bg-white dark:bg-slate-900 text-sm font-medium transition-all focus:border-slate-900 focus:bg-white dark:border-slate-800 dark:bg-slate-900"
                        placeholder="Contoh: Kirim Review, Kembalikan ke Legal"
                    />
                </div>

                {/* Cell 2: Transisi Ke */}
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ">Transisi Ke</label>
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
                            }
                        }}
                    >
                        <SelectTrigger className="h-10 py-2 px-3 rounded-lg border-slate-200 bg-white dark:bg-slate-900 text-left text-sm font-medium  focus:border-slate-900 dark:border-slate-800 dark:bg-slate-900 [&>span]:w-full [&>span]:text-left">
                            <SelectValue placeholder="Pilih Transisi" />
                        </SelectTrigger>
                        <SelectContent className="rounded-lg border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
                            <SelectItem value="sequential" className="text-sm font-medium ">
                                Langkah + 1 (Default)
                            </SelectItem>
                            <SelectItem value="stay" className="text-sm font-medium ">
                                Tetap di Langkah Saat Ini (Stay)
                            </SelectItem>
                            <SelectItem value="back" className="text-sm font-medium ">
                                Langkah - 1 (Back)
                            </SelectItem>
                            <SelectItem value="absolute" className="text-sm font-medium ">
                                Langkah Spesifik Alur Kerja Ini
                            </SelectItem>
                            <SelectItem value="cross_workflow" className="text-sm font-medium ">
                                Langkah ke Workflow N & Step N
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Cell 2b: Deskripsi Aksi */}
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ">Deskripsi Aksi (Tooltip)</label>
                    <input
                        type="text"
                        value={act.description || ''}
                        onChange={(e) => updateAction(actIdx, { description: e.target.value })}
                        className="h-10 w-full py-2 px-3 rounded-lg border border-slate-200 bg-white dark:bg-slate-900 text-sm font-medium transition-all focus:border-slate-900 focus:bg-white dark:border-slate-800 dark:bg-slate-900"
                        placeholder="Deskripsi singkat fungsi tombol ini..."
                    />
                </div>

                {/* Cell 2c: Cross Workflow Selector (Full Width if active) */}
                {showCrossWorkflowSelector && (
                    <div className="sm:col-span-2 rounded-lg border border-slate-100 bg-slate-50/40 p-2.5 dark:border-slate-800 dark:bg-slate-900/10">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ">Target Alur Kerja</label>
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
                                    <SelectTrigger className="h-10 py-2 px-3 rounded-lg border-slate-200 bg-white text-sm font-medium  focus:border-slate-900 dark:border-slate-800 dark:bg-slate-950">
                                        <SelectValue placeholder="Pilih Alur Kerja" />
                                    </SelectTrigger>
                                    <SelectContent className="z-[9999] rounded-lg bg-white dark:bg-slate-950">
                                        {allWorkflows.map((w: any) => (
                                            <SelectItem key={w.id} value={String(w.id)} className="text-sm font-medium ">
                                                {w.name} {w.contract_type ? `[${w.contract_type.name}]` : '[SEMUA JENIS]'}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ">Mulai Dari Langkah</label>
                                <Select
                                    value={String(act.transition_config?.sequence || '')}
                                    onValueChange={(val) =>
                                        updateAction(actIdx, {
                                            transition_config: { ...act.transition_config, type: 'cross_workflow', sequence: Number(val) },
                                            next_workflow_step_id: null,
                                        })
                                    }
                                >
                                    <SelectTrigger className="h-10 py-2 px-3 rounded-lg border-slate-200 bg-white text-sm font-medium  focus:border-slate-900 dark:border-slate-800 dark:bg-slate-950">
                                        <SelectValue placeholder="Pilih Tahap Target" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-lg bg-white dark:bg-slate-950">
                                        {(
                                            allWorkflows.find(
                                                (w: any) => String(w.id) === (act.transition_config?.workflow_id || act.next_workflow_id),
                                            )?.steps || []
                                        ).map((s: any, sIdx: number) => (
                                            <SelectItem key={s.id} value={String(s.step || sIdx + 1)} className="text-sm font-medium ">
                                                Tahap {s.step || sIdx + 1}: {s.label || `Langkah ${sIdx + 1}`}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                )}

                {/* Cell 2d: Absolute Step Selector (Full Width if active) */}
                {showAbsoluteStepSelector && (
                    <div className="sm:col-span-2 rounded-lg border border-slate-100 bg-slate-50/40 p-2.5 dark:border-slate-800 dark:bg-slate-900/10">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Pilih Langkah Target</label>
                            <Select
                                value={String(act.transition_config?.sequence || '1')}
                                onValueChange={(val) =>
                                    updateAction(actIdx, {
                                        transition_config: { ...act.transition_config, type: 'absolute', sequence: Number(val) },
                                    })
                                }
                            >
                                <SelectTrigger className="h-10 py-2 px-3 rounded-lg border border-slate-200 bg-white text-sm font-medium focus:border-slate-900 dark:border-slate-800 dark:bg-slate-950">
                                    <SelectValue placeholder="Pilih Tahap Target" />
                                </SelectTrigger>
                                <SelectContent className="rounded-lg bg-white dark:bg-slate-950">
                                    {allWorkflowSteps.map((s: any, sIdx: number) => (
                                        <SelectItem key={s.id} value={String(s.step || sIdx + 1)} className="text-sm font-medium">
                                            Tahap {s.step || sIdx + 1}: {s.label || `Langkah ${sIdx + 1}`}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                )}

                {/* Cell 3: Required Fields */}
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ">Kolom Wajib Diisi (Required)</label>
                    <SearchableMultiSelect
                        values={act.required_fields || []}
                        onValuesChange={(vals: string[]) => updateAction(actIdx, { required_fields: vals })}
                        options={AVAILABLE_FIELDS}
                        placeholder="Pilih Kolom..."
                    />
                </div>

                {/* Cell 4: Autofill Fields */}
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ">Kolom Isi Otomatis (Autofill)</label>
                    <SearchableMultiSelect
                        values={act.autofilled_fields || []}
                        onValuesChange={(vals: string[]) => updateAction(actIdx, { autofilled_fields: vals })}
                        options={AUTOFILLED_PARAMS}
                        placeholder="Pilih Kolom..."
                    />
                </div>

                {/* Cell 5: Signers (Conditional) */}
                {isSignatureAction && (
                    <div className="col-span-1 space-y-3 rounded-lg border border-amber-100/50 bg-amber-50/50 p-3 sm:col-span-2 dark:border-amber-800/30 dark:bg-amber-900/10">
                        <div className="flex items-center gap-1.5">
                            <FileSignature size={12} className="text-amber-500" />
                            <label className="text-sm font-semibold text-amber-600  dark:text-amber-500">
                                Konfigurasi Upload Tanda Tangan
                            </label>
                        </div>

                        {/* Target Langkah (Sub-Step) - Full Width */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ">Target Langkah (Sub-Step)</label>
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
                                <SelectTrigger className="h-10 py-2 px-3 rounded-lg border-slate-200 bg-white text-sm font-medium  focus:border-slate-900 dark:border-slate-800 dark:bg-slate-950">
                                    <SelectValue placeholder="Pilih Tahap Target" />
                                </SelectTrigger>
                                <SelectContent className="rounded-lg bg-white dark:bg-slate-950">
                                    {allWorkflowSteps.map((s: any, sIdx: number) => (
                                        <SelectItem key={s.id} value={String(s.id)} className="text-sm font-medium ">
                                            Tahap {sIdx + 1}: {s.label || `Langkah ${sIdx + 1}`}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-amber-600/70 italic dark:text-amber-500/70">
                                Penandatangan akan dimasukkan sebagai sub-step pada langkah yang dipilih ini.
                            </p>
                        </div>

                        {/* Multi-Source Pools for Signers (2x2 Grid) */}
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 border-t border-amber-200/30 pt-2">
                            {/* 1. Custom Targets */}
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-1.5 px-0.5">
                                    <Settings2 size={11} className="text-slate-400" />
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 ">Aktor Kustom</span>
                                </div>
                                <SearchableMultiSelect
                                    values={act.signing_parties?.custom || []}
                                    onValuesChange={(vals) =>
                                        updateAction(actIdx, { signing_parties: { ...act.signing_parties, custom: vals } })
                                    }
                                    options={[
                                        { value: 'initiator', label: 'INISIATOR' },
                                        { value: 'assigned_pic', label: 'PIC DITUGASKAN' },
                                        { value: 'creator', label: 'PEMBUAT' }
                                    ]}
                                    placeholder="Pilih Aktor..."
                                />
                            </div>

                            {/* 2. User Spesifik */}
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-1.5 px-0.5">
                                    <UsersIcon size={11} className="text-slate-400" />
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 ">User Spesifik</span>
                                </div>
                                <SearchableMultiSelect
                                    values={act.signing_parties?.users || []}
                                    onValuesChange={(vals) =>
                                        updateAction(actIdx, { signing_parties: { ...act.signing_parties, users: vals } })
                                    }
                                    options={users.map((u: any) => ({ value: String(u.id), label: `${u.name} (${u.role})` }))}
                                    placeholder="Pilih User..."
                                />
                            </div>

                            {/* 3. Role Pool */}
                            <AuthoritySelector
                                label="Berdasarkan Role"
                                idPrefix={`act-sign-role-${actIdx}`}
                                isInitiator={act.signing_parties?.is_initiator_role === true}
                                onIsInitiatorChange={(checked) =>
                                    updateAction(actIdx, { signing_parties: { ...act.signing_parties, is_initiator_role: checked, roles: checked ? [] : (act.signing_parties?.roles || []) } })
                                }
                                values={act.signing_parties?.roles || []}
                                onValuesChange={(vals) =>
                                    updateAction(actIdx, { signing_parties: { ...act.signing_parties, roles: vals } })
                                }
                                options={roles.map((r: any) => ({ value: r.name, label: r.name }))}
                                placeholder="Pilih Role..."
                            />

                            {/* 4. Departemen / Divisi Pool */}
                            <AuthoritySelector
                                label="Departemen / Divisi Pool"
                                idPrefix={`act-sign-dept-${actIdx}`}
                                isInitiator={act.signing_parties?.is_initiator_department === true}
                                onIsInitiatorChange={(checked) =>
                                    updateAction(actIdx, { signing_parties: { ...act.signing_parties, is_initiator_department: checked, departments: checked ? [] : (act.signing_parties?.departments || []) } })
                                }
                                values={act.signing_parties?.departments || []}
                                onValuesChange={(vals) =>
                                    updateAction(actIdx, { signing_parties: { ...act.signing_parties, departments: vals } })
                                }
                                options={(divisions.length > 0 ? divisions : departments).map((d: any) => ({ value: String(d.id), label: d.name }))}
                                placeholder="Pilih Unit / Departemen / Divisi..."
                            />
                        </div>
                    </div>
                )}

                {/* Cell 6: Assignee Config (Conditional) */}
                {isAssignOrForwardAction && (
                    <div className="col-span-1 space-y-3 rounded-lg border border-indigo-100/50 bg-indigo-50/50 p-3 sm:col-span-2 dark:border-indigo-800/30 dark:bg-indigo-900/10">
                        <div className="flex items-center gap-1.5">
                            <UsersIcon size={12} className="text-indigo-500" />
                            <label className="text-sm font-semibold text-indigo-600  dark:text-indigo-500">
                                {isForwardAction ? 'Lingkup Reviewer Tambahan' : 'Konfigurasi Penugasan (Assignee)'}
                            </label>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {isForwardAction && (
                                <div className={isForwardAction && isSignatureAction ? "space-y-1" : "space-y-1 sm:col-span-2"}>
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ">Target Langkah (Insert To)</label>
                                    <Select
                                        value={act.next_step_id || 'current'}
                                        onValueChange={(val) => {
                                            updateAction(actIdx, {
                                                next_step_id: val === 'current' ? null : val,
                                            });
                                        }}
                                    >
                                        <SelectTrigger className="h-10 py-2 px-3 rounded-lg border-slate-200 bg-white text-sm font-medium  focus:border-slate-900 dark:border-slate-800 dark:bg-slate-950">
                                            <SelectValue placeholder="Pilih Tahap Target" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-lg bg-white dark:bg-slate-950">
                                            <SelectItem value="current" className="text-sm font-medium ">
                                                Langkah Saat Ini (Default)
                                            </SelectItem>
                                            {allWorkflowSteps.map((s: any, sIdx: number) => (
                                                <SelectItem key={s.id} value={String(s.id)} className="text-sm font-medium ">
                                                    Tahap {sIdx + 1}: {s.label || `Langkah ${sIdx + 1}`}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {isSignatureAction && (
                                <div className={isForwardAction && isSignatureAction ? "space-y-1" : "space-y-1 sm:col-span-2"}>
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ">
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
                                        <SelectTrigger className="h-10 py-2 px-3 rounded-lg border-slate-200 bg-white text-sm font-medium  focus:border-slate-900 dark:border-slate-800 dark:bg-slate-950">
                                            <SelectValue placeholder="Pilih Tahap Target" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-lg bg-white dark:bg-slate-950">
                                            {allWorkflowSteps.map((s: any, sIdx: number) => (
                                                <SelectItem key={s.id} value={String(s.id)} className="text-sm font-medium ">
                                                    Tahap {sIdx + 1}: {s.label || `Langkah ${sIdx + 1}`}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {/* Divider line if targets are present */}
                            {(isForwardAction || isSignatureAction) && (
                                <div className="sm:col-span-2 border-b border-indigo-200/20 my-1"></div>
                            )}

                            {/* 1. Custom Targets */}
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-1.5 px-0.5">
                                    <Settings2 size={11} className="text-slate-400" />
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 ">Aktor Kustom</span>
                                </div>
                                <SearchableMultiSelect
                                    values={act.assignee_config?.custom || []}
                                    onValuesChange={(vals) =>
                                        updateAction(actIdx, { assignee_config: { ...act.assignee_config, custom: vals } })
                                    }
                                    options={[
                                        { value: 'initiator', label: 'INISIATOR' },
                                        { value: 'assigned_pic', label: 'PIC DITUGASKAN' },
                                        { value: 'creator', label: 'PEMBUAT' }
                                    ]}
                                    placeholder="Pilih Aktor..."
                                />
                            </div>

                            {/* 2. User Spesifik */}
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-1.5 px-0.5">
                                    <UsersIcon size={11} className="text-slate-400" />
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 ">User Spesifik</span>
                                </div>
                                <SearchableMultiSelect
                                    values={act.assignee_config?.users || []}
                                    onValuesChange={(vals) =>
                                        updateAction(actIdx, { assignee_config: { ...act.assignee_config, users: vals } })
                                    }
                                    options={users.map((u: any) => ({ value: String(u.id), label: `${u.name} (${u.role})` }))}
                                    placeholder="Pilih User..."
                                />
                            </div>

                            {/* 3. Role Pool */}
                            <AuthoritySelector
                                label="Berdasarkan Role"
                                idPrefix={`act-init-role-${actIdx}`}
                                isInitiator={act.assignee_config?.is_initiator_role === true}
                                onIsInitiatorChange={(checked) =>
                                    updateAction(actIdx, { assignee_config: { ...act.assignee_config, is_initiator_role: checked, roles: checked ? [] : (act.assignee_config?.roles || []) } })
                                }
                                values={act.assignee_config?.roles || []}
                                onValuesChange={(vals) =>
                                    updateAction(actIdx, { assignee_config: { ...act.assignee_config, roles: vals } })
                                }
                                options={roles.map((r: any) => ({ value: r.name, label: r.name }))}
                                placeholder="Pilih Role..."
                            />

                            {/* 4. Departemen / Divisi Pool */}
                            <AuthoritySelector
                                label="Departemen / Divisi Pool"
                                idPrefix={`act-init-dept-${actIdx}`}
                                isInitiator={act.assignee_config?.is_initiator_department === true}
                                onIsInitiatorChange={(checked) =>
                                    updateAction(actIdx, { assignee_config: { ...act.assignee_config, is_initiator_department: checked, departments: checked ? [] : (act.assignee_config?.departments || []) } })
                                }
                                values={act.assignee_config?.departments || []}
                                onValuesChange={(vals) =>
                                    updateAction(actIdx, { assignee_config: { ...act.assignee_config, departments: vals } })
                                }
                                options={(divisions.length > 0 ? divisions : departments).map((d: any) => ({ value: String(d.id), label: d.name }))}
                                placeholder="Pilih Unit / Departemen / Divisi..."
                            />
                        </div>

                        <p className="text-xs text-indigo-500/70 italic">
                            {isForwardAction
                                ? 'Tentukan siapa saja yang boleh dipilih untuk memberikan approval tambahan.'
                                : 'Konfigurasi siapa yang dapat dipilih atau ditugaskan pada saat aksi ini dijalankan.'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
