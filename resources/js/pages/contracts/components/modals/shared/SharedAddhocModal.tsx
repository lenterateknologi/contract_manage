import { Button } from '@/components/ui/buttons/Button';
import { StatusBadge } from '@/components/ui/feedback/StatusBadge';
import { CompactSwitch } from '@/components/ui/selection/CompactSwitch';
import { FormTextarea } from '@/components/ui/inputs/FormTextarea';
import { SearchableMultiSelect } from '@/components/ui/selection/SearchableMultiSelect';
import { Modal } from '@/components/ui/dialogs/Modal';
import { contractApi } from '@/pages/contracts/utils';
import { matchUserAgainstWorkflowPool } from '@/pages/workflows/workflow-filter';
import { CheckCircle2, Loader2, UserPlus, Users, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Props {
    open: boolean;
    onClose: () => void;
    contract: any;
    onUpdate: (c: any) => void;
    showToast: (msg: string, type: any) => void;
    actionCode?: string;
    actionAlias?: string;
}

export function SharedAddhocModal({ open, onClose, contract, onUpdate, showToast, actionCode, actionAlias }: Props) {
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [note, setNote] = useState('');
    const [isSequential, setIsSequential] = useState(false);
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState<any[]>([]);
    const [fetchingUsers, setFetchingUsers] = useState(false);
    const [selectedTargetStepId, setSelectedTargetStepId] = useState<string | null>(null);

    // Initial setup when modal opens
    useEffect(() => {
        if (open) {
            const currentStep = contract?.workflow_step;
            const activeAction = (currentStep?.actions || []).find((a: any) => {
                if (actionCode) return a.action_code === actionCode || a.master_action_code === actionCode || a.master_action?.code === actionCode;
                return (
                    a.master_action_code?.toLowerCase() === 'forward' ||
                    a.action_code?.toLowerCase() === 'forward' ||
                    a.master_action?.code?.toLowerCase() === 'forward'
                );
            });
            const config = activeAction?.assignee_config || {};
            const defaultTargetStepId = activeAction?.next_step_id || config.default_target_step || contract?.workflow_step_id;
            const initialTargetStepId = defaultTargetStepId ? String(defaultTargetStepId) : null;

            setSelectedTargetStepId(initialTargetStepId);
            setNote('');
            setIsSequential(false);
        } else {
            // Reset state when closed
            setSelectedUserIds([]);
        }
    }, [open, contract?.id]);

    // Re-fetch users and pre-select existing ones when target step changes
    useEffect(() => {
        if (open) {
            fetchUsers(selectedTargetStepId);
        }
    }, [open, selectedTargetStepId]);

    const fetchUsers = async (targetStepIdVal: string | null) => {
        setFetchingUsers(true);
        try {
            const allUsers = await contractApi.getUsers({ all: true });

            const currentStep = contract?.workflow_step;
            const activeAction = (currentStep?.actions || []).find((a: any) => {
                if (actionCode) return a.action_code === actionCode || a.master_action_code === actionCode || a.master_action?.code === actionCode;
                return (
                    a.master_action_code?.toLowerCase() === 'forward' ||
                    a.action_code?.toLowerCase() === 'forward' ||
                    a.master_action?.code?.toLowerCase() === 'forward'
                );
            });

            const hasAssigneeConfig = activeAction?.assignee_config && (
                (activeAction.assignee_config.custom && activeAction.assignee_config.custom.length > 0) ||
                (activeAction.assignee_config.users && activeAction.assignee_config.users.length > 0) ||
                (activeAction.assignee_config.roles && activeAction.assignee_config.roles.length > 0) ||
                (activeAction.assignee_config.departments && activeAction.assignee_config.departments.length > 0) ||
                (activeAction.assignee_config.divisions && activeAction.assignee_config.divisions.length > 0) ||
                (activeAction.assignee_config.company_groups && activeAction.assignee_config.company_groups.length > 0) ||
                (activeAction.assignee_config.regions && activeAction.assignee_config.regions.length > 0) ||
                (activeAction.assignee_config.authorities && activeAction.assignee_config.authorities.length > 0) ||
                activeAction.assignee_config.is_initiator_role ||
                activeAction.assignee_config.is_initiator_department ||
                activeAction.assignee_config.is_initiator_user
            );

            const finalTargetStepId = targetStepIdVal || contract?.workflow_step_id;
            const targetStep = (contract?.workflow?.steps || []).find((s: any) => String(s.id) === String(finalTargetStepId))
                || contract?.workflow_step;

            const config = hasAssigneeConfig
                ? activeAction.assignee_config
                : {};

            // Existing ad-hoc approvers should be pre-selected
            const existingAdhocUserIds = (contract?.approvals || [])
                .filter(
                    (a: any) =>
                        String(a.workflow_step_id) === String(finalTargetStepId) && a.role === 'Persetujuan Tambahan' && a.status !== 'rejected',
                )
                .map((a: any) => String(a.user_id));

            const availableUsers = allUsers.filter((u: any) => {
                return matchUserAgainstWorkflowPool(u, config, contract);
            });

            const uniqueUsers = Array.from(new Map(availableUsers.map((u: any) => [u.id, u])).values());
            setUsers(uniqueUsers);

            // Set initial selected users based on existing ones
            // Use unique array to prevent double entries from state + db
            setSelectedUserIds((prev) => {
                const combined = [...prev, ...existingAdhocUserIds];
                return Array.from(new Set(combined));
            });
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setFetchingUsers(false);
        }
    };

    const handleUpdateSelectedUsers = (val: string[]) => {
        // Force unique values just in case
        setSelectedUserIds(Array.from(new Set(val)));
    };

    const handleRemoveUser = (id: string) => {
        setSelectedUserIds((prev) => prev.filter((uid) => uid !== id));
    };

    const handleSubmit = async () => {
        if (selectedUserIds.length === 0) {
            showToast('Silakan pilih minimal satu user.', 'warning');
            return;
        }

        // Simulation Mode Check
        if (!contract?.id) {
            onUpdate(contract);
            showToast('Simulasi penambahan persetujuan tambahan berhasil.', 'success');
            onClose();
            return;
        }

        setLoading(true);
        try {
            // Get the target step ID from the action configuration
            const currentStep = contract?.workflow_step;
            const activeAction = (currentStep?.actions || []).find((a: any) => {
                if (actionCode) return a.action_code === actionCode || a.master_action_code === actionCode || a.master_action?.code === actionCode;
                return (
                    a.master_action_code?.toLowerCase() === 'forward' ||
                    a.action_code?.toLowerCase() === 'forward' ||
                    a.master_action?.code?.toLowerCase() === 'forward'
                );
            });
            const config = activeAction?.assignee_config || {};
            const defaultTargetStepId = activeAction?.next_step_id || config.default_target_step || contract.workflow_step_id;
            const finalTargetStepId = selectedTargetStepId || defaultTargetStepId;

            const updatedContract = await contractApi.addAdhocApprover(contract.id, selectedUserIds, note, isSequential, finalTargetStepId);
            onUpdate(updatedContract);
            showToast('Persetujuan tambahan berhasil dikaitkan.', 'success');
            onClose();
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Gagal menambahkan persetujuan tambahan.';
            showToast(msg, 'danger');
        } finally {
            setLoading(false);
        }
    };

    const currentStepDelegates = (contract?.approvals || []).filter(
        (a: any) =>
            String(a.workflow_step_id) === String(selectedTargetStepId || contract?.workflow_step_id) &&
            a.role === 'Persetujuan Tambahan' &&
            a.status !== 'rejected',
    );

    return (
        <Modal
            isOpen={open}
            onClose={onClose}
            maxWidth="3xl"
            title={
                <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500 dark:bg-indigo-500/20">
                        <UserPlus size={16} />
                    </div>
                    <span className="text-text-main text-sm font-bold tracking-tight uppercase">
                        {actionAlias || 'Persetujuan Tambahan'}
                    </span>
                </div>
            }
            footer={
                <div className="flex w-full gap-3">
                    <Button variant="outline" onClick={onClose} disabled={loading} className="flex-1 text-[10px]  uppercase">
                        Batal
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading || selectedUserIds.length === 0}
                        className="flex-1 bg-indigo-600 text-[10px]  text-white uppercase transition-all duration-200 hover:bg-indigo-700 dark:bg-indigo-50 dark:text-black dark:hover:bg-indigo-100"
                    >
                        {loading ? <Loader2 size={14} className="mr-2 animate-spin" /> : <CheckCircle2 size={14} className="mr-2" />}
                        Simpan Perubahan
                    </Button>
                </div>
            }
        >
            <div className="space-y-6">
                <div className="rounded-xl border border-indigo-100 bg-indigo-50/20 p-4 dark:border-indigo-950/40 dark:bg-indigo-950/10">
                    <p className="text-[11px] leading-relaxed font-medium text-indigo-700/80 dark:text-indigo-300/80">
                        Anda dapat meminta persetujuan tambahan di luar alur kerja template saat ini. User yang dipilih wajib menyetujui dokumen sebelum lanjut.
                    </p>
                </div>

                {/* --- EXISTING DELEGATES LIST --- */}
                {currentStepDelegates.length > 0 && (
                    <div className="space-y-2.5">
                        <div className="text-text-soft flex items-center justify-between text-[10px] font-bold  uppercase">
                            <div className="flex items-center gap-1.5">
                                <Users size={12} className="text-indigo-500" />
                                Approver Terdaftar
                            </div>
                            <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                                {currentStepDelegates.length} Orang
                            </span>
                        </div>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            {currentStepDelegates.map((a: any) => (
                                <div key={a.id} className="group border-surface-border bg-surface-muted/20 relative flex items-center gap-3 rounded-xl border p-2 transition-all hover:border-indigo-200">
                                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                                        {a.approver_name?.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div className="flex min-w-0 flex-col">
                                        <span className="text-text-main truncate text-xs leading-tight font-bold">{a.approver_name}</span>
                                        <span className="text-text-soft text-[9px] tracking-tighter uppercase">{a.job_title || a.role}</span>
                                    </div>
                                    <div className="ml-auto flex items-center gap-1.5">
                                        <StatusBadge status={a.status} />
                                        <button
                                            type="button"
                                            disabled={loading}
                                            onClick={async () => {
                                                if (confirm(`Hapus persetujuan tambahan untuk ${a.approver_name}?`)) {
                                                    try {
                                                        const updated = await contractApi.removeAdhocApprover(contract.id, a.id);
                                                        onUpdate(updated);
                                                        showToast('Persetujuan berhasil dihapus.', 'success');
                                                    } catch (err: any) {
                                                        showToast(err.response?.data?.message || 'Gagal menghapus.', 'danger');
                                                    }
                                                }
                                            }}
                                            className="text-text-soft hover:text-danger hover:bg-danger/10 rounded-md p-1 opacity-0 transition-all group-hover:opacity-100"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="bg-surface-border/50 my-2 h-px" />
                    </div>
                )}
                {/* ------------------------------ */}

                <div className="space-y-2">
                    <label className="text-text-soft text-[10px] font-bold  uppercase">
                        Tambah Approver Baru <span className="text-danger">*</span>
                    </label>
                    {fetchingUsers ? (
                        <div className="text-text-soft flex animate-pulse items-center gap-2 py-1 text-[10px]">
                            <Loader2 size={12} className="animate-spin" /> Memuat daftar user...
                        </div>
                    ) : users.length === 0 ? (
                        <p className="text-danger py-1 text-[10px] font-medium">Tidak ada user tambahan yang tersedia.</p>
                    ) : (
                        <SearchableMultiSelect
                            values={selectedUserIds}
                            onValuesChange={handleUpdateSelectedUsers}
                            showOrder={true}
                            options={users.map((u: any) => ({
                                value: u.id,
                                label: `${u.name} (${u.role}${u.department_name ? ` - ${u.department_name}` : ''})`,
                            }))}
                            placeholder="-- Cari & Pilih User --"
                        />
                    )}
                </div>

                <div className="space-y-2">
                    <label className="text-text-soft text-[10px] font-bold  uppercase">Disisipkan Ke Langkah</label>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400">
                        {(() => {
                            const currentStep = contract?.workflow_step;
                            const activeAction = (currentStep?.actions || []).find((a: any) => {
                                if (actionCode) return a.action_code === actionCode || a.master_action_code === actionCode;
                                return a.master_action_code?.toLowerCase() === 'forward' || a.action_code?.toLowerCase() === 'forward';
                            });
                            const config = activeAction?.assignee_config || {};
                            const targetStepId = activeAction?.next_step_id || config.default_target_step || contract?.workflow_step_id;

                            if (String(targetStepId) === String(contract?.workflow_step_id)) {
                                return `(Step Saat Ini) Tahap ${contract?.workflow_step?.step} - ${contract?.workflow_step?.description || contract?.workflow_step?.label || ''}`;
                            }
                            const targetStep = (contract?.workflow?.steps || []).find((s: any) => String(s.id) === String(targetStepId));
                            if (targetStep) {
                                return `Tahap ${targetStep.step} - ${targetStep.description || targetStep.label || ''}`;
                            }
                            return 'Tahap Saat Ini (Default)';
                        })()}
                    </div>
                </div>

                {selectedUserIds.length > 1 && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                        <CompactSwitch
                            label={isSequential ? 'Mode: Berurutan (Sequential)' : 'Mode: Serentak (Parallel)'}
                            description={
                                isSequential
                                    ? 'Approver akan diminta menyetujui satu per satu sesuai urutan di bawah.'
                                    : 'Semua approver dapat menyetujui secara bersamaan (kapan saja).'
                            }
                            checked={isSequential}
                            onCheckedChange={setIsSequential}
                        />
                    </div>
                )}

                {/* Selected Users Detailed List */}
                {selectedUserIds.length > 0 && (
                    <div className="animate-in fade-in slide-in-from-top-1 space-y-2.5 duration-200">
                        <div className="text-text-soft flex items-center gap-1.5 text-[10px] font-bold  uppercase">
                            <Users size={12} />
                            Approver Terpilih ({selectedUserIds.length})
                        </div>
                        <div className="border-surface-border bg-surface-muted/30 flex flex-wrap gap-2 rounded-xl border p-3">
                            {selectedUserIds.map((uid) => {
                                const u = users.find((user) => user.id === uid);
                                if (!u) return null;
                                return (
                                    <div
                                        key={uid}
                                        className="group flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50/50 px-3 py-1 text-xs font-bold text-indigo-700 transition-all hover:bg-indigo-50/80 dark:border-indigo-900/50 dark:bg-indigo-950/20 dark:text-indigo-400 dark:hover:bg-indigo-950/30"
                                    >
                                        <span className="max-w-[200px] truncate">
                                            {u.name}
                                            <span className="ml-1 text-[9px] font-medium text-indigo-600/70 dark:text-indigo-400/60">({u.role})</span>
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveUser(uid)}
                                            className="ml-1 rounded-full p-0.5 text-indigo-500/50 transition-colors hover:bg-indigo-100 hover:text-indigo-700 dark:text-indigo-400/50 dark:hover:bg-indigo-900/60 dark:hover:text-indigo-300"
                                        >
                                            <X size={12} strokeWidth={2.5} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                <FormTextarea
                    label="Catatan / Alasan Permintaan (Opsional)"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    placeholder="Tuliskan catatan atau instruksi khusus mengapa persetujuan tambahan dibutuhkan..."
                />
            </div>
        </Modal>
    );
}
