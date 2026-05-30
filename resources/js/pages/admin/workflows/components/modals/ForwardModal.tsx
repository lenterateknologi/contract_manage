import { Modal } from '@/components/ui/overlays/Modal';
import { SearchableMultiSelect } from '@/components/ui/forms/SearchableMultiSelect';
import { UserPlus, Info, CheckCircle2, Loader2, X, Users } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/base/Button';
import { FormTextarea } from '@/components/ui/forms/FormTextarea';
import { CompactSwitch } from '@/components/ui/forms/CompactSwitch';

interface ForwardModalProps {
    isOpen: boolean;
    onClose: () => void;
    step: any;
    idx: number;
    userOptions: any[];
    showToast: (message: string, type?: 'success' | 'danger' | 'info') => void;
    allWorkflowSteps?: any[];
}

export function ForwardModal({ isOpen, onClose, step, idx, userOptions, showToast, allWorkflowSteps = [] }: ForwardModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [note, setNote] = useState('');
    const [isSequential, setIsSequential] = useState(false);
    const [selectedTargetStepId, setSelectedTargetStepId] = useState<string | null>(null);

    const activeAction = (step?.actions || []).find((a: any) => 
        (a.master_action?.code?.toLowerCase() === 'forward') || 
        (a.action_code === 'forward') ||
        (a.master_action_id === 'forward')
    );
    const config = activeAction?.assignee_config || {};
    const targetStepId = activeAction?.next_step_id;
    const defaultTargetStepId = targetStepId || step?.id;
    const resolvedTargetStepId = selectedTargetStepId || String(defaultTargetStepId);
    
    // For visual display of selected target
    const getTargetStepLabel = () => {
        if (!config.allow_user_select_step) {
            return targetStepId ? `Ke Langkah ${idx + 1}` : 'Ke Langkah Saat Ini';
        }
        if (resolvedTargetStepId === String(step?.id)) return 'Ke Langkah Saat Ini';
        const targetWfStep = allWorkflowSteps.find(s => String(s.id) === resolvedTargetStepId);
        return targetWfStep ? `Ke Tahap ${targetWfStep.step}` : 'Ke Langkah Saat Ini';
    };

    // Filter userOptions based on the simulation config
    const filteredOptions = userOptions.filter(u => {
        // If no specific config type is set, or if it's set to 'all', allow any user
        if (!config.type || config.type === 'all') {
            return true;
        }

        // 1. Direct User Pool
        if (config.type === 'user') {
            if (!config.user_ids || config.user_ids.length === 0) return false;
            return config.user_ids.map(String).includes(String(u.value));
        }

        // 2. Role/Dept filter
        if (config.type === 'role') {
            const targetRoles = config.roles || [];
            const targetDeptIds = config.department_ids || [];
            
            // u.label usually contains role info: "Name (Role)"
            // userOptions might not have department_id in simulation if it only has value/label
            // but if it does, we can check it. Let's rely on label matching for role at least.
            const matchesRole = targetRoles.length === 0 || targetRoles.some((r: string) => u.label.toLowerCase().includes(r.toLowerCase()));
            
            // Require strict department match if targetDeptIds are configured
            const matchesDept = targetDeptIds.length === 0 || (u.department_id && targetDeptIds.map(String).includes(String(u.department_id)));

            return matchesRole && matchesDept;
        }

        return false;
    });

    const handleClose = () => {
        setSelectedUserIds([]);
        setNote('');
        setIsSequential(false);
        setSelectedTargetStepId(null);
        onClose();
    };

    const handleRemoveUser = (id: string) => {
        setSelectedUserIds((prev) => prev.filter((uid) => uid !== id));
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 shadow-inner">
                        <UserPlus size={20} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold tracking-wider text-slate-900 uppercase dark:text-white">Simulasi Approval Tambahan</h3>
                        <p className="mt-0.5 text-[10px] font-medium text-slate-400 uppercase">Tahap {idx + 1} • {getTargetStepLabel()}</p>
                    </div>
                </div>
            }
            maxWidth="lg"
        >
            <div className="space-y-6 text-left">
                <div className="rounded-xl border border-indigo-100 bg-indigo-50/20 p-4 dark:border-indigo-950/40 dark:bg-indigo-950/10">
                    <div className="flex gap-3">
                        <Info size={16} className="mt-0.5 shrink-0 text-indigo-500" />
                        <p className="text-[11px] leading-relaxed font-medium text-indigo-700/80 dark:text-indigo-300/80">
                            <strong>Simulasi Forward:</strong> Anda dapat meminta persetujuan tambahan di luar alur kerja template. User yang dipilih akan ditambahkan ke tahapan persetujuan aktif saat ini.
                        </p>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                        Pilih Approval Tambahan <span className="text-rose-500">*</span>
                    </label>
                    <SearchableMultiSelect
                        values={selectedUserIds}
                        onValuesChange={setSelectedUserIds}
                        options={filteredOptions}
                        placeholder="-- Cari & Pilih User --"
                    />
                </div>

                {config.allow_user_select_step && allWorkflowSteps && allWorkflowSteps.length > 0 && (
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                            Sisipkan Ke Langkah
                        </label>
                        <select
                            value={resolvedTargetStepId}
                            onChange={(e) => setSelectedTargetStepId(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-medium text-slate-700 shadow-sm transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
                        >
                            <option value={String(step?.id)}>Langkah Saat Ini</option>
                            {allWorkflowSteps
                                .filter((s: any) => s.step_category !== 'condition')
                                .map((s: any) => (
                                <option key={s.id} value={String(s.id)}>Tahap {s.step}: {s.label || s.description || s.name}</option>
                            ))}
                        </select>
                        <p className="text-[9px] text-slate-400 italic">Pilih langkah tujuan untuk approver tambahan ini.</p>
                    </div>
                )}

                {selectedUserIds.length > 1 && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                        <CompactSwitch
                            label={isSequential ? 'Mode: Berurutan (Sequential)' : 'Mode: Serentak (Parallel)'}
                            description={
                                isSequential
                                    ? 'Approver akan diminta menyetujui satu per satu.'
                                    : 'Semua approver dapat menyetujui secara bersamaan.'
                            }
                            checked={isSequential}
                            onCheckedChange={setIsSequential}
                        />
                    </div>
                )}

                {selectedUserIds.length > 0 && (
                    <div className="animate-in fade-in slide-in-from-top-1 space-y-2.5 duration-200">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                            <Users size={12} />
                            <span>User Terpilih ({selectedUserIds.length})</span>
                        </div>
                        <div className="flex flex-wrap gap-2 rounded-xl border border-slate-100 bg-slate-50/30 p-3 dark:border-slate-800 dark:bg-black/10">
                            {selectedUserIds.map((uid) => {
                                const u = userOptions.find((opt) => opt.value === uid);
                                if (!u) return null;
                                return (
                                    <div
                                        key={uid}
                                        className="group flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50/50 px-3 py-1 text-[10px] font-bold text-indigo-700 transition-all hover:bg-indigo-50/80 dark:border-indigo-900/50 dark:bg-indigo-950/20 dark:text-indigo-400 dark:hover:bg-indigo-950/30"
                                    >
                                        <span className="max-w-[200px] truncate">{u.label}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveUser(uid)}
                                            className="ml-1 rounded-full p-0.5 text-indigo-500/50 transition-colors hover:bg-indigo-100 hover:text-indigo-700 dark:text-indigo-400/50 dark:hover:bg-indigo-900/60 dark:hover:text-indigo-300"
                                        >
                                            <X size={10} strokeWidth={2.5} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                <FormTextarea
                    label="Catatan / Instruksi (Opsional)"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    placeholder="Tuliskan catatan atau instruksi khusus..."
                />
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-6 dark:border-slate-800">
                <button
                    type="button"
                    onClick={handleClose}
                    className="rounded-xl border border-slate-200 px-5 py-2.5 text-[10px] font-black text-slate-500 uppercase transition-all hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-900"
                >
                    Batal
                </button>
                <button
                    type="button"
                    disabled={isSubmitting || selectedUserIds.length === 0}
                    onClick={() => {
                        setIsSubmitting(true);
                        setTimeout(() => {
                            setIsSubmitting(false);
                            showToast('Simulasi Approval Tambahan berhasil dikonfigurasi!', 'success');
                            handleClose();
                        }, 850);
                    }}
                    className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-[10px] font-black text-white uppercase shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.02] hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-50"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 size={12} className="animate-spin" />
                            Memproses...
                        </>
                    ) : (
                        <>
                            <CheckCircle2 size={12} />
                            Simpan Approval Tambahan
                        </>
                    )}
                </button>
            </div>
        </Modal>
    );
}
