import { Checkbox } from '@/components/ui/selection/Checkbox';
import { SearchableMultiSelect } from '@/components/ui/selection/SearchableMultiSelect';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/selection/Select';
import { Briefcase, FileSignature, Settings2, Shield, Trash2, Users as UsersIcon } from 'lucide-react';
import { AUTOFILLED_PARAMS, AVAILABLE_FIELDS, MASTER_ACTIONS } from '../constants';

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
}: StepActionConfigCardProps) {
    const actionCode = (act.master_action?.code || act.action_code || act.master_action_id || '').toLowerCase();
    const isForwardAction = actionCode === 'forward';
    const isSignatureAction = ['signature', 'sign'].includes(actionCode);
    const isAssignOrForwardAction = ['assign', 'forward'].includes(actionCode);

    const transitionType = (() => {
        if (act.transition_config?.type) {
            if (act.transition_config.type === 'relative') {
                if (act.transition_config.offset === 1) return 'sequential';
                if (act.transition_config.offset === -1) return 'back';
                if (act.transition_config.offset === 0) return 'stay';
            }
            if (act.transition_config.type === 'absolute') {
                return 'initial';
            }
            if (act.transition_config.type === 'cross_workflow') return 'cross_workflow';
        }

        // Fallback for backward compatibility
        if (act.next_workflow_id) return 'cross_workflow';
        if (act.next_step_id) {
            const firstStep = allWorkflowSteps[0];
            if (firstStep && act.next_step_id === firstStep.id && idx > 0) return 'initial';
            const prevStep = allWorkflowSteps[idx - 1];
            if (prevStep && act.next_step_id === prevStep.id) return 'back';
        }
        return 'sequential';
    })();

    const showCrossWorkflowSelector = transitionType === 'cross_workflow';

    return (
        <div className="relative space-y-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-950/40">
            {/* Card Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 dark:border-slate-800">
                <span className="text-xs font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase">Aksi #{actIdx + 1}</span>
                <button
                    type="button"
                    onClick={() => removeAction(actIdx)}
                    className="cursor-pointer text-slate-400 transition-colors hover:text-rose-500"
                >
                    <Trash2 size={13} />
                </button>
            </div>

            {/* Grid Input 2x2 */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* Cell 1: Nama Aksi */}
                <div className="space-y-1">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-500 uppercase">Nama Aksi</label>
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
                            <SelectTrigger className="h-8 rounded-lg border-slate-200 bg-slate-50/50 text-xs font-medium uppercase focus:border-slate-900 dark:border-slate-800 dark:bg-slate-900">
                                <SelectValue placeholder="PILIH AKSI" />
                            </SelectTrigger>
                            <SelectContent className="rounded-lg border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
                                {MASTER_ACTIONS.map((ma: any) => (
                                    <SelectItem key={ma.id} value={ma.id} className="text-xs font-medium uppercase">
                                        {ma.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Cell 1b: Alias Aksi */}
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase">Alias Aksi (Label Tombol)</label>
                    <input
                        type="text"
                        value={act.alias || ''}
                        onChange={(e) => updateAction(actIdx, { alias: e.target.value })}
                        className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 text-xs font-medium transition-all focus:border-slate-900 focus:bg-white dark:border-slate-800 dark:bg-slate-900"
                        placeholder="Contoh: Kirim Review, Kembalikan ke Legal"
                    />
                </div>

                {/* Cell 2: Transisi Ke */}
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase">Transisi Ke</label>
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
                            } else if (val === 'initial') {
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
                        <SelectTrigger className="h-8 rounded-lg border-slate-200 bg-slate-50/50 text-left text-xs font-medium uppercase focus:border-slate-900 dark:border-slate-800 dark:bg-slate-900 [&>span]:w-full [&>span]:text-left">
                            <SelectValue placeholder="PILIH TRANSISI" />
                        </SelectTrigger>
                        <SelectContent className="rounded-lg border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
                            <SelectItem value="sequential" className="text-xs font-medium uppercase">
                                LANGKAH + 1 (DEFAULT)
                            </SelectItem>
                            <SelectItem value="stay" className="text-xs font-medium uppercase">
                                TETAP DI LANGKAH SAAT INI (STAY)
                            </SelectItem>
                            <SelectItem value="back" className="text-xs font-medium uppercase">
                                LANGKAH - 1 (BACK)
                            </SelectItem>
                            <SelectItem value="initial" className="text-xs font-medium uppercase">
                                LANGKAH AWAL (INITIAL STEP)
                            </SelectItem>
                            <SelectItem value="cross_workflow" className="text-xs font-medium uppercase">
                                LANGKAH KE WORKFLOW N & STEP N
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Cell 2b: Deskripsi Aksi */}
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase">Deskripsi Aksi (Tooltip)</label>
                    <input
                        type="text"
                        value={act.description || ''}
                        onChange={(e) => updateAction(actIdx, { description: e.target.value })}
                        className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 text-xs font-medium transition-all focus:border-slate-900 focus:bg-white dark:border-slate-800 dark:bg-slate-900"
                        placeholder="Deskripsi singkat fungsi tombol ini..."
                    />
                </div>

                {/* Cell 2c: Cross Workflow Selector (Full Width if active) */}
                {showCrossWorkflowSelector && (
                    <div className="sm:col-span-2 rounded-xl border border-slate-100 bg-slate-50/40 p-2.5 dark:border-slate-800 dark:bg-slate-900/10">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase">Target Alur Kerja</label>
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
                                    <SelectTrigger className="h-8 rounded-lg border-slate-200 bg-white text-xs font-medium uppercase focus:border-slate-900 dark:border-slate-800 dark:bg-slate-950">
                                        <SelectValue placeholder="PILIH WORKFLOW" />
                                    </SelectTrigger>
                                    <SelectContent className="z-[9999] rounded-lg bg-white dark:bg-slate-950">
                                        {allWorkflows.map((w: any) => (
                                            <SelectItem key={w.id} value={String(w.id)} className="text-xs font-medium uppercase">
                                                {w.name} {w.contract_type ? `[${w.contract_type.name}]` : '[SEMUA JENIS]'}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase">Mulai Dari Langkah</label>
                                <Select
                                    value={String(act.transition_config?.sequence || '')}
                                    onValueChange={(val) =>
                                        updateAction(actIdx, {
                                            transition_config: { ...act.transition_config, type: 'cross_workflow', sequence: Number(val) },
                                            next_workflow_step_id: null,
                                        })
                                    }
                                >
                                    <SelectTrigger className="h-8 rounded-lg border-slate-200 bg-white text-xs font-medium uppercase focus:border-slate-900 dark:border-slate-800 dark:bg-slate-950">
                                        <SelectValue placeholder="PILIH TAHAP TARGET" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-lg bg-white dark:bg-slate-950">
                                        {(
                                            allWorkflows.find(
                                                (w: any) => String(w.id) === (act.transition_config?.workflow_id || act.next_workflow_id),
                                            )?.steps || []
                                        ).map((s: any, sIdx: number) => (
                                            <SelectItem key={s.id} value={String(s.step || sIdx + 1)} className="text-xs font-medium uppercase">
                                                TAHAP {s.step || sIdx + 1}: {s.label || `Langkah ${sIdx + 1}`}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                )}

                {/* Cell 3: Required Fields */}
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase">Kolom Wajib Diisi (Required)</label>
                    <SearchableMultiSelect
                        values={act.required_fields || []}
                        onValuesChange={(vals: string[]) => updateAction(actIdx, { required_fields: vals })}
                        options={AVAILABLE_FIELDS}
                        placeholder="Pilih Kolom..."
                    />
                </div>

                {/* Cell 4: Autofill Fields */}
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase">Kolom Isi Otomatis (Autofill)</label>
                    <SearchableMultiSelect
                        values={act.autofilled_fields || []}
                        onValuesChange={(vals: string[]) => updateAction(actIdx, { autofilled_fields: vals })}
                        options={AUTOFILLED_PARAMS}
                        placeholder="Pilih Kolom..."
                    />
                </div>

                {/* Cell 5: Signers (Conditional) */}
                {isSignatureAction && (
                    <div className="col-span-1 space-y-3 rounded-xl border border-amber-100/50 bg-amber-50/50 p-3 sm:col-span-2 dark:border-amber-800/30 dark:bg-amber-900/10">
                        <div className="flex items-center gap-1.5">
                            <FileSignature size={12} className="text-amber-500" />
                            <label className="text-xs font-semibold text-amber-600 uppercase dark:text-amber-500">
                                Konfigurasi Upload Tanda Tangan
                            </label>
                        </div>

                        {/* Target Langkah (Sub-Step) - Full Width */}
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500 uppercase">Target Langkah (Sub-Step)</label>
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
                                <SelectTrigger className="h-8 rounded-lg border-slate-200 bg-white text-xs font-medium uppercase focus:border-slate-900 dark:border-slate-800 dark:bg-slate-950">
                                    <SelectValue placeholder="PILIH TAHAP TARGET" />
                                </SelectTrigger>
                                <SelectContent className="rounded-lg bg-white dark:bg-slate-950">
                                    {allWorkflowSteps.map((s: any, sIdx: number) => (
                                        <SelectItem key={s.id} value={String(s.id)} className="text-xs font-medium uppercase">
                                            TAHAP {sIdx + 1}: {s.label || `Langkah ${sIdx + 1}`}
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
                                    <span className="text-xs font-semibold text-slate-500 uppercase">Aktor Kustom</span>
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
                                    <span className="text-xs font-semibold text-slate-500 uppercase">User Spesifik</span>
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
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between px-0.5">
                                    <div className="flex items-center gap-1.5">
                                        <Shield size={11} className="text-slate-400" />
                                        <span className="text-xs font-semibold text-slate-500 uppercase">Berdasarkan Role</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Checkbox
                                            id={`act-sign-role-${actIdx}`}
                                            checked={act.signing_parties?.is_initiator_role === true}
                                            onCheckedChange={(checked) =>
                                                updateAction(actIdx, { signing_parties: { ...act.signing_parties, is_initiator_role: checked === true } })
                                            }
                                        />
                                        <label htmlFor={`act-sign-role-${actIdx}`} className="text-xs font-medium text-slate-400 cursor-pointer uppercase">Sesuai Inisiator</label>
                                    </div>
                                </div>
                                <SearchableMultiSelect
                                    values={act.signing_parties?.roles || []}
                                    onValuesChange={(vals) =>
                                        updateAction(actIdx, { signing_parties: { ...act.signing_parties, roles: vals } })
                                    }
                                    options={roles.map((r: any) => ({ value: r.name, label: r.name }))}
                                    placeholder={act.signing_parties?.is_initiator_role ? "DITENTUKAN DARI ROLE INISIATOR" : "Pilih Role..."}
                                    disabled={act.signing_parties?.is_initiator_role === true}
                                />
                            </div>

                            {/* 4. Departemen / Divisi Pool */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between px-0.5">
                                    <div className="flex items-center gap-1.5">
                                        <Briefcase size={11} className="text-slate-400" />
                                        <span className="text-xs font-semibold text-slate-500 uppercase">Departemen / Divisi Pool</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Checkbox
                                            id={`act-sign-dept-${actIdx}`}
                                            checked={act.signing_parties?.is_initiator_department === true}
                                            onCheckedChange={(checked) =>
                                                updateAction(actIdx, { signing_parties: { ...act.signing_parties, is_initiator_department: checked === true } })
                                            }
                                        />
                                        <label htmlFor={`act-sign-dept-${actIdx}`} className="text-xs font-medium text-slate-400 cursor-pointer uppercase">Sesuai Inisiator</label>
                                    </div>
                                </div>
                                <SearchableMultiSelect
                                    values={act.signing_parties?.departments || []}
                                    onValuesChange={(vals) =>
                                        updateAction(actIdx, { signing_parties: { ...act.signing_parties, departments: vals } })
                                    }
                                    options={(divisions.length > 0 ? divisions : departments).map((d: any) => ({ value: String(d.id), label: d.name }))}
                                    placeholder={act.signing_parties?.is_initiator_department ? "DITENTUKAN DARI DEPT / DIV INISIATOR" : "Pilih Unit / Departemen / Divisi..."}
                                    disabled={act.signing_parties?.is_initiator_department === true}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Cell 6: Assignee Config (Conditional) */}
                {isAssignOrForwardAction && (
                    <div className="col-span-1 space-y-3 rounded-xl border border-indigo-100/50 bg-indigo-50/50 p-3 sm:col-span-2 dark:border-indigo-800/30 dark:bg-indigo-900/10">
                        <div className="flex items-center gap-1.5">
                            <UsersIcon size={12} className="text-indigo-500" />
                            <label className="text-xs font-semibold text-indigo-600 uppercase dark:text-indigo-500">
                                {isForwardAction ? 'Lingkup Reviewer Tambahan' : 'Konfigurasi Penugasan (Assignee)'}
                            </label>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {isForwardAction && (
                                <div className={isForwardAction && isSignatureAction ? "space-y-1" : "space-y-1 sm:col-span-2"}>
                                    <label className="text-xs font-semibold text-slate-500 uppercase">Target Langkah (Insert To)</label>
                                    <Select
                                        value={act.next_step_id || 'current'}
                                        onValueChange={(val) => {
                                            updateAction(actIdx, {
                                                next_step_id: val === 'current' ? null : val,
                                            });
                                        }}
                                    >
                                        <SelectTrigger className="h-8 rounded-lg border-slate-200 bg-white text-xs font-medium uppercase focus:border-slate-900 dark:border-slate-800 dark:bg-slate-950">
                                            <SelectValue placeholder="PILIH TAHAP TARGET" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-lg bg-white dark:bg-slate-950">
                                            <SelectItem value="current" className="text-xs font-medium uppercase">
                                                LANGKAH SAAT INI (DEFAULT)
                                            </SelectItem>
                                            {allWorkflowSteps.map((s: any, sIdx: number) => (
                                                <SelectItem key={s.id} value={String(s.id)} className="text-xs font-medium uppercase">
                                                    TAHAP {sIdx + 1}: {s.label || `Langkah ${sIdx + 1}`}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {isSignatureAction && (
                                <div className={isForwardAction && isSignatureAction ? "space-y-1" : "space-y-1 sm:col-span-2"}>
                                    <label className="text-xs font-semibold text-slate-500 uppercase">
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
                                        <SelectTrigger className="h-8 rounded-lg border-slate-200 bg-white text-xs font-medium uppercase focus:border-slate-900 dark:border-slate-800 dark:bg-slate-950">
                                            <SelectValue placeholder="PILIH TAHAP TARGET" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-lg bg-white dark:bg-slate-950">
                                            {allWorkflowSteps.map((s: any, sIdx: number) => (
                                                <SelectItem key={s.id} value={String(s.id)} className="text-xs font-medium uppercase">
                                                    TAHAP {sIdx + 1}: {s.label || `Langkah ${sIdx + 1}`}
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
                                    <span className="text-xs font-semibold text-slate-500 uppercase">Aktor Kustom</span>
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
                                    <span className="text-xs font-semibold text-slate-500 uppercase">User Spesifik</span>
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
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between px-0.5">
                                    <div className="flex items-center gap-1.5">
                                        <Shield size={11} className="text-slate-400" />
                                        <span className="text-xs font-semibold text-slate-500 uppercase">Berdasarkan Role</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Checkbox
                                            id={`act-init-role-${actIdx}`}
                                            checked={act.assignee_config?.is_initiator_role === true}
                                            onCheckedChange={(checked) =>
                                                updateAction(actIdx, { assignee_config: { ...act.assignee_config, is_initiator_role: checked === true } })
                                            }
                                        />
                                        <label htmlFor={`act-init-role-${actIdx}`} className="text-xs font-medium text-slate-400 cursor-pointer uppercase">Sesuai Inisiator</label>
                                    </div>
                                </div>
                                <SearchableMultiSelect
                                    values={act.assignee_config?.roles || []}
                                    onValuesChange={(vals) =>
                                        updateAction(actIdx, { assignee_config: { ...act.assignee_config, roles: vals } })
                                    }
                                    options={roles.map((r: any) => ({ value: r.name, label: r.name }))}
                                    placeholder={act.assignee_config?.is_initiator_role ? "DITENTUKAN DARI ROLE INISIATOR" : "Pilih Role..."}
                                    disabled={act.assignee_config?.is_initiator_role === true}
                                />
                            </div>

                            {/* 4. Departemen / Divisi Pool */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between px-0.5">
                                    <div className="flex items-center gap-1.5">
                                        <Briefcase size={11} className="text-slate-400" />
                                        <span className="text-xs font-semibold text-slate-500 uppercase">Departemen / Divisi Pool</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Checkbox
                                            id={`act-init-dept-${actIdx}`}
                                            checked={act.assignee_config?.is_initiator_department === true}
                                            onCheckedChange={(checked) =>
                                                updateAction(actIdx, { assignee_config: { ...act.assignee_config, is_initiator_department: checked === true } })
                                            }
                                        />
                                        <label htmlFor={`act-init-dept-${actIdx}`} className="text-xs font-medium text-slate-400 cursor-pointer uppercase">Sesuai Inisiator</label>
                                    </div>
                                </div>
                                <SearchableMultiSelect
                                    values={act.assignee_config?.departments || []}
                                    onValuesChange={(vals) =>
                                        updateAction(actIdx, { assignee_config: { ...act.assignee_config, departments: vals } })
                                    }
                                    options={(divisions.length > 0 ? divisions : departments).map((d: any) => ({ value: String(d.id), label: d.name }))}
                                    placeholder={act.assignee_config?.is_initiator_department ? "DITENTUKAN DARI DEPT / DIV INISIATOR" : "Pilih Unit / Departemen / Divisi..."}
                                    disabled={act.assignee_config?.is_initiator_department === true}
                                />
                            </div>
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
