import { SearchableMultiSelect } from '@/components/ui/forms/SearchableMultiSelect';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/forms/Select';
import { FileSignature, Trash2, Users as UsersIcon } from 'lucide-react';
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
                <span className="text-[9px] font-semibold tracking-widest text-slate-400 uppercase">Aksi #{actIdx + 1}</span>
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
                        <label className="text-[9px] font-bold tracking-tight text-slate-400 uppercase">Nama Aksi</label>
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
                            <SelectTrigger className="h-8 rounded-lg border-slate-200 bg-slate-50/50 text-[10px] font-semibold tracking-tight uppercase focus:border-slate-900 dark:border-slate-800 dark:bg-slate-900">
                                <SelectValue placeholder="PILIH AKSI" />
                            </SelectTrigger>
                            <SelectContent className="rounded-lg border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
                                {MASTER_ACTIONS.map((ma: any) => (
                                    <SelectItem key={ma.id} value={ma.id} className="text-[9px] font-bold uppercase">
                                        {ma.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Cell 1b: Alias Aksi */}
                <div className="space-y-1">
                    <label className="text-[9px] font-bold tracking-tight text-slate-400 uppercase">Alias Aksi (Label Tombol)</label>
                    <input
                        type="text"
                        value={act.alias || ''}
                        onChange={(e) => updateAction(actIdx, { alias: e.target.value })}
                        className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 text-[10px] font-bold transition-all focus:border-slate-900 focus:bg-white dark:border-slate-800 dark:bg-slate-900"
                        placeholder="Contoh: Kirim Review, Kembalikan ke Legal"
                    />
                </div>

                {/* Cell 2: Transisi Ke & Conditional Details */}
                <div className="space-y-3 sm:col-span-2">
                    <div className="space-y-1">
                        <label className="text-[9px] font-bold tracking-tight text-slate-400 uppercase">Transisi Ke</label>
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
                            <SelectTrigger className="h-8 rounded-lg border-slate-200 bg-slate-50/50 text-left text-[10px] font-semibold tracking-tight uppercase focus:border-slate-900 dark:border-slate-800 dark:bg-slate-900 [&>span]:w-full [&>span]:text-left">
                                <SelectValue placeholder="PILIH TRANSISI" />
                            </SelectTrigger>
                            <SelectContent className="rounded-lg border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
                                <SelectItem value="sequential" className="text-[9px] font-bold uppercase">
                                    LANGKAH + 1 (DEFAULT)
                                </SelectItem>
                                <SelectItem value="stay" className="text-[9px] font-bold uppercase">
                                    TETAP DI LANGKAH SAAT INI (STAY)
                                </SelectItem>
                                <SelectItem value="back" className="text-[9px] font-bold uppercase">
                                    LANGKAH - 1 (BACK)
                                </SelectItem>
                                <SelectItem value="initial" className="text-[9px] font-bold uppercase">
                                    LANGKAH AWAL (INITIAL STEP)
                                </SelectItem>
                                <SelectItem value="cross_workflow" className="text-[9px] font-bold uppercase">
                                    LANGKAH KE WORKFLOW N & STEP N
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {showCrossWorkflowSelector && (
                        <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-100 bg-slate-50/40 p-2.5 sm:grid-cols-2 dark:border-slate-800 dark:bg-slate-900/10">
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold tracking-tight text-slate-400 uppercase">Target Alur Kerja</label>
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
                                    <SelectTrigger className="h-8 rounded-lg border-slate-200 bg-white text-[10px] font-semibold uppercase focus:border-slate-900 dark:border-slate-800 dark:bg-slate-950">
                                        <SelectValue placeholder="PILIH WORKFLOW" />
                                    </SelectTrigger>
                                    <SelectContent className="z-[9999] rounded-lg bg-white dark:bg-slate-950">
                                        {allWorkflows.map((w: any) => (
                                            <SelectItem key={w.id} value={String(w.id)} className="text-[9px] font-bold uppercase">
                                                {w.name} {w.contract_type ? `[${w.contract_type.name}]` : '[SEMUA JENIS]'}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold tracking-tight text-slate-400 uppercase">Mulai Dari Langkah</label>
                                <Select
                                    value={String(act.transition_config?.sequence || '')}
                                    onValueChange={(val) =>
                                        updateAction(actIdx, {
                                            transition_config: { ...act.transition_config, type: 'cross_workflow', sequence: Number(val) },
                                            next_workflow_step_id: null,
                                        })
                                    }
                                >
                                    <SelectTrigger className="h-8 rounded-lg border-slate-200 bg-white text-[10px] font-semibold uppercase focus:border-slate-900 dark:border-slate-800 dark:bg-slate-950">
                                        <SelectValue placeholder="PILIH TAHAP TARGET" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-lg bg-white dark:bg-slate-950">
                                        {(
                                            allWorkflows.find(
                                                (w: any) => String(w.id) === (act.transition_config?.workflow_id || act.next_workflow_id),
                                            )?.steps || []
                                        ).map((s: any, sIdx: number) => (
                                            <SelectItem key={s.id} value={String(s.step || sIdx + 1)} className="text-[9px] font-bold uppercase">
                                                TAHAP {s.step || sIdx + 1}: {s.label || `Langkah ${sIdx + 1}`}
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
                    <label className="text-[9px] font-bold tracking-tight text-slate-400 uppercase">Deskripsi Aksi (Tooltip)</label>
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
                    <label className="text-[9px] font-bold tracking-tight text-slate-400 uppercase">Kolom Wajib Diisi (Required)</label>
                    <SearchableMultiSelect
                        values={act.required_fields || []}
                        onValuesChange={(vals: string[]) => updateAction(actIdx, { required_fields: vals })}
                        options={AVAILABLE_FIELDS}
                        placeholder="Pilih Kolom..."
                    />
                </div>

                {/* Cell 4: Autofill Fields */}
                <div className="space-y-1">
                    <label className="text-[9px] font-bold tracking-tight text-slate-400 uppercase">Kolom Isi Otomatis (Autofill)</label>
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
                            <label className="text-[9px] font-bold tracking-tight text-amber-600 uppercase dark:text-amber-500">
                                Konfigurasi Upload Tanda Tangan
                            </label>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold tracking-tight text-slate-400 uppercase">
                                    Pilihan Penandatangan (Signers)
                                </label>
                                <SearchableMultiSelect
                                    values={act.signing_parties || []}
                                    onValuesChange={(vals: string[]) => updateAction(actIdx, { signing_parties: vals })}
                                    options={[
                                        { value: 'initiator', label: 'INISIATOR (PIC / PEMBUAT)' },
                                        { value: 'pic', label: 'PIC DITUGASKAN' },
                                    ]}
                                    placeholder="Pilih Pemeran Penandatangan..."
                                />
                                <p className="text-[9px] leading-tight text-amber-600/70 italic dark:text-amber-500/70">
                                    Pilih peran yang diizinkan untuk menandatangani dokumen pada aksi ini.
                                </p>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[9px] font-bold tracking-tight text-slate-400 uppercase">Target Langkah (Sub-Step)</label>
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
                                    <SelectTrigger className="h-8 rounded-lg border-slate-200 bg-white text-[10px] font-semibold uppercase focus:border-slate-900 dark:border-slate-800 dark:bg-slate-950">
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
                                <p className="text-[9px] leading-tight text-amber-600/70 italic dark:text-amber-500/70">
                                    Penandatangan akan dimasukkan sebagai sub-step pada langkah yang dipilih ini.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Cell 6: Assignee Config (Conditional) */}
                {isAssignOrForwardAction && (
                    <div className="col-span-1 space-y-3 rounded-xl border border-indigo-100/50 bg-indigo-50/50 p-3 sm:col-span-2 dark:border-indigo-800/30 dark:bg-indigo-900/10">
                        <div className="flex items-center gap-1.5">
                            <UsersIcon size={12} className="text-indigo-500" />
                            <label className="text-[9px] font-bold tracking-tight text-indigo-600 uppercase dark:text-indigo-500">
                                {isForwardAction ? 'Lingkup Reviewer Tambahan' : 'Konfigurasi Penugasan (Assignee)'}
                            </label>
                        </div>
                        <div className="space-y-4">
                            {isSignatureAction && (
                                <div className="mt-4 space-y-1 border-t border-slate-100 pt-4 dark:border-slate-800">
                                    <label className="text-[9px] font-bold tracking-tight text-slate-400 uppercase">
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
                                        <SelectTrigger className="h-8 rounded-lg border-slate-200 bg-white text-[10px] font-semibold uppercase focus:border-slate-900 dark:border-slate-800 dark:bg-slate-950">
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
                                    <p className="text-[9px] text-slate-400 italic">
                                        Langkah di mana Pihak 1 & 2 akan disisipkan sebagai sub-step (contoh: 2.1, 2.2).
                                    </p>
                                </div>
                            )}

                            {isForwardAction && (
                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold tracking-tight text-slate-400 uppercase">Target Langkah (Insert To)</label>
                                    <Select
                                        value={act.next_step_id || 'current'}
                                        onValueChange={(val) => {
                                            updateAction(actIdx, {
                                                next_step_id: val === 'current' ? null : val,
                                            });
                                        }}
                                    >
                                        <SelectTrigger className="h-8 rounded-lg border-slate-200 bg-white text-[10px] font-semibold uppercase focus:border-slate-900 dark:border-slate-800 dark:bg-slate-950">
                                            <SelectValue placeholder="PILIH TAHAP TARGET" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-lg bg-white dark:bg-slate-950">
                                            <SelectItem value="current" className="text-[9px] font-bold uppercase">
                                                LANGKAH SAAT INI (DEFAULT)
                                            </SelectItem>
                                            {allWorkflowSteps.map((s: any, sIdx: number) => (
                                                <SelectItem key={s.id} value={String(s.id)} className="text-[9px] font-bold uppercase">
                                                    TAHAP {sIdx + 1}: {s.label || `Langkah ${sIdx + 1}`}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-[9px] text-slate-400 italic">
                                        Tentukan pada langkah mana approver tambahan ini akan disisipkan.
                                    </p>
                                </div>
                            )}

                            <div className="space-y-1">
                                <label className="text-[9px] font-bold tracking-tight text-slate-400 uppercase">
                                    {isForwardAction ? 'Kategori Reviewer' : 'Tipe Assignee'}
                                </label>
                                <Select
                                    value={act.assignee_config?.type || ''}
                                    onValueChange={(val) => {
                                        updateAction(actIdx, {
                                            assignee_config: {
                                                ...(act.assignee_config || {}),
                                                type: val,
                                            },
                                        });
                                    }}
                                >
                                    <SelectTrigger className="h-8 rounded-lg border-slate-200 bg-white text-[10px] font-semibold uppercase focus:border-slate-900 dark:border-slate-800 dark:bg-slate-950">
                                        <SelectValue placeholder={isForwardAction ? 'PILIH KATEGORI' : 'PILIH TIPE ASSIGNEE'} />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-lg bg-white dark:bg-slate-950">
                                        {isForwardAction ? (
                                            <>
                                                <SelectItem value="role" className="text-[9px] font-bold uppercase">
                                                    BERDASARKAN ROLE / UNIT
                                                </SelectItem>
                                                <SelectItem value="user" className="text-[9px] font-bold uppercase">
                                                    DAFTAR USER SPESIFIK
                                                </SelectItem>
                                            </>
                                        ) : (
                                            <>
                                                <SelectItem value="initiator" className="text-[9px] font-bold uppercase">
                                                    INISIATOR
                                                </SelectItem>
                                                <SelectItem value="assigned_pic" className="text-[9px] font-bold uppercase">
                                                    PIC DITUGASKAN
                                                </SelectItem>
                                                <SelectItem value="role" className="text-[9px] font-bold uppercase">
                                                    BERDASARKAN ROLE / UNIT
                                                </SelectItem>
                                                <SelectItem value="user" className="text-[9px] font-bold uppercase">
                                                    DAFTAR USER SPESIFIK
                                                </SelectItem>
                                            </>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            {act.assignee_config?.type === 'role' && (
                                <>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-bold tracking-tight text-slate-400 uppercase">Role Tujuan</label>
                                        <SearchableMultiSelect
                                            values={act.assignee_config?.roles || []}
                                            onValuesChange={(vals) =>
                                                updateAction(actIdx, { assignee_config: { ...act.assignee_config, roles: vals } })
                                            }
                                            options={roles.map((r: any) => ({ value: r.name, label: r.name }))}
                                            placeholder="Pilih Role..."
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-bold tracking-tight text-slate-400 uppercase">
                                            Unit / Department Tujuan
                                        </label>
                                        <SearchableMultiSelect
                                            values={act.assignee_config?.department_ids || []}
                                            onValuesChange={(vals) =>
                                                updateAction(actIdx, { assignee_config: { ...act.assignee_config, department_ids: vals } })
                                            }
                                            options={departments.map((d: any) => ({ value: String(d.id), label: d.name }))}
                                            placeholder="Pilih Unit..."
                                        />
                                    </div>
                                </>
                            )}

                            {act.assignee_config?.type === 'user' && (
                                <div className="space-y-1 md:col-span-2">
                                    <label className="text-[9px] font-bold tracking-tight text-slate-400 uppercase">
                                        {isForwardAction ? 'Pilih User Khusus' : 'User Tujuan'}
                                    </label>
                                    <SearchableMultiSelect
                                        values={act.assignee_config?.user_ids || []}
                                        onValuesChange={(vals) =>
                                            updateAction(actIdx, { assignee_config: { ...act.assignee_config, user_ids: vals } })
                                        }
                                        options={users.map((u: any) => ({ value: String(u.id), label: `${u.name} (${u.role})` }))}
                                        placeholder="Pilih User..."
                                    />
                                </div>
                            )}
                        </div>
                        <p className="text-[9px] leading-tight text-indigo-600/70 italic dark:text-indigo-500/70">
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
