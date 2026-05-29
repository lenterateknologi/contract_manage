import React from 'react';
import { Trash2, FileSignature, Users as UsersIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/forms/Select';
import { SearchableMultiSelect } from '@/components/ui/forms/SearchableMultiSelect';
import { MASTER_ACTIONS, AVAILABLE_FIELDS, AUTOFILLED_PARAMS } from '../constants';

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
    return (
        <div className="relative rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-950/40 space-y-2">
            {/* Card Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 dark:border-slate-800">
                <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase">
                    Aksi #{actIdx + 1}
                </span>
                <button
                    type="button"
                    onClick={() => removeAction(actIdx)}
                    className="text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                >
                    <Trash2 size={13} />
                </button>
            </div>

            {/* Grid Input 2x2 */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* Cell 1: Nama Aksi */}
                <div className="space-y-1">
                    <div className="flex items-center justify-between">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Nama Aksi</label>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Select
                            value={act.master_action_id || ''}
                            onValueChange={(val) => {
                                const matched = MASTER_ACTIONS.find((m: any) => m.id === val || m.code === val);
                                updateAction(actIdx, {
                                    master_action_id: val,
                                    master_action_name: '',
                                    master_action: matched || null
                                });
                            }}
                        >
                            <SelectTrigger className="h-8 rounded-lg border-slate-200 bg-slate-50/50 text-[10px] font-black uppercase tracking-tight focus:border-slate-900 dark:border-slate-800 dark:bg-slate-900">
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
                                }
                                else if (val === 'initial') {
                                    updateAction(actIdx, {
                                        next_step_id: null,
                                        next_workflow_id: null,
                                        next_workflow_step_id: null
                                    });
                                }
                                else if (val === 'jump_step') {
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
                                <SelectItem value="initial" className="text-[9px] font-bold uppercase">
                                    LANGKAH AWAL (INTIAL STEP)
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
                                    <SelectContent className="rounded-lg bg-white dark:bg-slate-950 z-[9999]">
                                        {allWorkflows.map((w: any) => (
                                            <SelectItem key={w.id} value={String(w.id)} className="text-[9px] font-bold uppercase">
                                                {w.name} {w.contract_type ? `[${w.contract_type.name}]` : '[SEMUA JENIS]'}
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
                {(['assign', 'forward'].includes(act.master_action?.code?.toLowerCase())) && (
                    <div className="space-y-3 col-span-1 sm:col-span-2 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/50 dark:bg-indigo-900/10 dark:border-indigo-800/30">
                        <div className="flex items-center gap-1.5">
                            <UsersIcon size={12} className="text-indigo-500" />
                            <label className="text-[9px] font-bold text-indigo-600 uppercase tracking-tight dark:text-indigo-500">
                                {act.master_action?.code?.toLowerCase() === 'forward' ? 'Lingkup Reviewer Tambahan' : 'Konfigurasi Penugasan (Assignee)'}
                            </label>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {act.master_action?.code?.toLowerCase() === 'forward' && (
                                <div className="space-y-1 md:col-span-2">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Target Langkah (Insert To)</label>
                                    <Select
                                        value={act.next_step_id || 'current'}
                                        onValueChange={(val) => {
                                            updateAction(actIdx, {
                                                next_step_id: val === 'current' ? null : val
                                            });
                                        }}
                                    >
                                        <SelectTrigger className="h-8 rounded-lg border-slate-200 bg-white text-[10px] font-black uppercase focus:border-slate-900 dark:border-slate-800 dark:bg-slate-950">
                                            <SelectValue placeholder="PILIH TAHAP TARGET" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-lg bg-white dark:bg-slate-950">
                                            <SelectItem value="current" className="text-[9px] font-bold uppercase">LANGKAH SAAT INI (DEFAULT)</SelectItem>
                                            {allWorkflowSteps.map((s: any, sIdx: number) => (
                                                <SelectItem key={s.id} value={String(s.id)} className="text-[9px] font-bold uppercase">
                                                    TAHAP {sIdx + 1}: {s.label || `Langkah ${sIdx + 1}`}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-[9px] text-slate-400 italic">Tentukan pada langkah mana approver tambahan ini akan disisipkan.</p>
                                </div>
                            )}

                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                                    {act.master_action?.code?.toLowerCase() === 'forward' ? 'Kategori Reviewer' : 'Tipe Assignee'}
                                </label>
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
                                        <SelectValue placeholder={act.master_action?.code?.toLowerCase() === 'forward' ? "PILIH KATEGORI" : "PILIH TIPE ASSIGNEE"} />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-lg bg-white dark:bg-slate-950">
                                        {act.master_action?.code?.toLowerCase() === 'forward' ? (
                                            <>
                                                <SelectItem value="role" className="text-[9px] font-bold uppercase">BERDASARKAN ROLE / UNIT</SelectItem>
                                                <SelectItem value="user" className="text-[9px] font-bold uppercase">DAFTAR USER SPESIFIK</SelectItem>
                                            </>
                                        ) : (
                                            <>
                                                <SelectItem value="initiator" className="text-[9px] font-bold uppercase">INISIATOR</SelectItem>
                                                <SelectItem value="assigned_pic" className="text-[9px] font-bold uppercase">PIC DITUGASKAN</SelectItem>
                                                <SelectItem value="role" className="text-[9px] font-bold uppercase">BERDASARKAN ROLE / UNIT</SelectItem>
                                                <SelectItem value="user" className="text-[9px] font-bold uppercase">DAFTAR USER SPESIFIK</SelectItem>
                                            </>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            {act.assignee_config?.type === 'role' && (
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

                            {act.assignee_config?.type === 'user' && (
                                <div className="space-y-1 md:col-span-2">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                                        {act.master_action?.code?.toLowerCase() === 'forward' ? 'Pilih User Khusus' : 'User Tujuan'}
                                    </label>
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
                            {act.master_action?.code?.toLowerCase() === 'forward' 
                                ? 'Tentukan siapa saja yang boleh dipilih untuk memberikan approval tambahan.'
                                : 'Konfigurasi siapa yang dapat dipilih atau ditugaskan pada saat aksi ini dijalankan.'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
