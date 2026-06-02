import { Button } from '@/components/ui/base/Button';
import { CompactSwitch } from '@/components/ui/forms/CompactSwitch';
import { FormTextarea } from '@/components/ui/forms/FormTextarea';
import { SearchableMultiSelect } from '@/components/ui/forms/SearchableMultiSelect';
import { SearchableSelect } from '@/components/ui/forms/SearchableSelect';
import { Modal } from '@/components/ui/overlays/Modal';
import { contractApi } from '@/lib/contract-api';
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

    useEffect(() => {
        if (open) {
            fetchUsers();
            setSelectedUserIds([]);
            setNote('');
            setIsSequential(false);
            setSelectedTargetStepId(null);
        }
    }, [open, contract?.id]);

    const fetchUsers = async () => {
        setFetchingUsers(true);
        try {
            // Get all active users
            const allUsers = await contractApi.getUsers({ all: true });

            // Filter out users who are already part of the approvals on the current step
            const currentStepId = contract?.workflow_step_id;
            const existingUserIds = new Set(
                (contract?.approvals || []).filter((a: any) => a.workflow_step_id === currentStepId).map((a: any) => a.user_id),
            );

            // Scoped Selection: Filter based on current workflow step or specific action configuration
            const currentStep = contract?.workflow_step;
            const activeAction = (currentStep?.actions || []).find((a: any) => a.action_code === actionCode);

            // Priority: action-level assignee_config -> step-level requirements
            const config = activeAction?.assignee_config || {};
            const requirements = currentStep;

            const availableUsers = allUsers.filter((u: any) => {
                if (existingUserIds.has(u.id)) return false;

                // If no specific config type is set, or if it's set to 'all', allow any user
                if (!config.type || config.type === 'all') {
                    return true;
                }

                // 1. Direct User Pool (specific user IDs)
                if (config.type === 'user') {
                    if (!config.user_ids || config.user_ids.length === 0) return false;
                    const allowedUserIds = config.user_ids.map(String);
                    return allowedUserIds.includes(String(u.id));
                }

                // 2. Role/Dept filter
                if (config.type === 'role') {
                    const targetRoles = config.roles || [];
                    const matchesRole = targetRoles.length === 0 || targetRoles.some((r: string) => r.toLowerCase() === u.role?.toLowerCase());

                    const targetDeptIds = config.department_ids || [];
                    const currentUDeptId = String(u.department_id);
                    const matchesDept = targetDeptIds.length === 0 || targetDeptIds.map(String).includes(currentUDeptId);

                    return matchesDept && matchesRole;
                }

                // Fallback for any other type
                return false;
            });

            // Ensure uniqueness by ID to prevent duplicate key errors in UI
            const uniqueUsers = Array.from(new Map(availableUsers.map((u: any) => [u.id, u])).values());

            setUsers(uniqueUsers);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setFetchingUsers(false);
        }
    };

    const handleRemoveUser = (id: string) => {
        setSelectedUserIds((prev) => prev.filter((uid) => uid !== id));
    };

    const handleSubmit = async () => {
        if (selectedUserIds.length === 0) {
            alert('Harap pilih minimal satu user.');
            return;
        }

        setLoading(true);
        try {
            // Get the target step ID from the action configuration
            const currentStep = contract?.workflow_step;
            const activeAction = (currentStep?.actions || []).find((a: any) =>
                (a.action_code === actionCode) ||
                (a.master_action?.code?.toLowerCase() === 'forward') ||
                (a.action_code === 'forward')
            );
            const config = activeAction?.assignee_config || {};
            const defaultTargetStepId = config.default_target_step || contract.workflow_step_id;
            const finalTargetStepId = config.allow_user_select_step && selectedTargetStepId ? selectedTargetStepId : defaultTargetStepId;

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
                    <span className="text-text-main text-sm font-bold tracking-tight uppercase">Persetujuan Tambahan</span>
                </div>
            }
            footer={
                <div className="flex w-full gap-3">
                    <Button variant="outline" onClick={onClose} disabled={loading} className="flex-1 text-[10px] tracking-wider uppercase">
                        Batal
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading || selectedUserIds.length === 0}
                        className="flex-1 bg-indigo-600 text-[10px] tracking-wider text-white uppercase transition-all duration-200 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                    >
                        {loading ? <Loader2 size={14} className="mr-2 animate-spin" /> : <CheckCircle2 size={14} className="mr-2" />}
                        Simpan Approver ({selectedUserIds.length})
                    </Button>
                </div>
            }
        >
            <div className="space-y-6">
                <div className="rounded-xl border border-indigo-100 bg-indigo-50/20 p-4 dark:border-indigo-950/40 dark:bg-indigo-950/10">
                    <p className="text-[11px] leading-relaxed font-medium text-indigo-700/80 dark:text-indigo-300/80">
                        Anda dapat meminta persetujuan tambahan di luar alur kerja template saat ini. User yang dipilih akan ditambahkan ke tahapan
                        persetujuan aktif saat ini dan **wajib** menyetujui dokumen sebelum alur kerja dapat berlanjut ke tahap berikutnya.
                    </p>
                </div>

                <div className="space-y-2">
                    <label className="text-text-soft text-[10px] font-bold tracking-wider uppercase">
                        Pilih Approver Tambahan <span className="text-danger">*</span>
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
                            onValuesChange={setSelectedUserIds}
                            options={users.map((u) => ({
                                value: u.id,
                                label: `${u.name} (${u.role}${u.department_name ? ` - ${u.department_name}` : ''})`,
                            }))}
                            placeholder="-- Cari & Pilih User --"
                        />
                    )}
                </div>

                {(() => {
                    const currentStep = contract?.workflow_step;
                    const activeAction = (currentStep?.actions || []).find((a: any) => {
                        if (actionCode) return (a.action_code === actionCode) || (a.master_action_code === actionCode);
                        return (a.master_action_code?.toLowerCase() === 'forward') || (a.action_code?.toLowerCase() === 'forward');
                    });
                    const config = activeAction?.assignee_config || {};
                    const defaultTargetStepId = activeAction?.next_step_id || config.default_target_step || contract?.workflow_step_id;
                    const resolvedTargetStepId = selectedTargetStepId || String(defaultTargetStepId);

                    return (
                        <>
                            {config.allow_user_select_step && contract?.workflow?.steps && contract.workflow.steps.length > 0 ? (
                                <div className="space-y-2">
                                    <label className="text-text-soft text-[10px] font-bold tracking-wider uppercase">
                                        Sisipkan Ke Langkah
                                    </label>
                                    <SearchableSelect
                                        value={resolvedTargetStepId}
                                        onValueChange={setSelectedTargetStepId}
                                        placeholder="Pilih Langkah Target"
                                        options={[
                                            {
                                                value: String(contract?.workflow_step_id),
                                                label: `(Step Saat Ini) ${contract?.workflow_step?.step} - ${contract?.workflow_step?.description}`,
                                            },
                                            ...(contract?.workflow?.steps || [])
                                                .filter(
                                                    (step: any) =>
                                                        step.id !== contract?.workflow_step_id && step.step_category !== 'Condition'
                                                )
                                                .map((step: any) => ({
                                                    value: String(step.id),
                                                    label: `Step ${step.step} - ${step.description}`,
                                                })),
                                        ].filter(opt => {
                                            if (config.selectable_steps && config.selectable_steps.length > 0) {
                                                return config.selectable_steps.includes(opt.value);
                                            }
                                            return true;
                                        })}
                                    />
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <label className="text-text-soft text-[10px] font-bold tracking-wider uppercase">
                                        Disisipkan Ke Langkah
                                    </label>
                                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400">
                                        {(() => {
                                            if (defaultTargetStepId === contract?.workflow_step_id) {
                                                return `(Step Saat Ini) Tahap ${contract?.workflow_step?.step} - ${contract?.workflow_step?.description || contract?.workflow_step?.label || ''}`;
                                            }
                                            const targetStep = contract?.workflow?.steps?.find((s: any) => s.id === defaultTargetStepId);
                                            if (targetStep) {
                                                return `Tahap ${targetStep.step} - ${targetStep.description || targetStep.label || ''}`;
                                            }
                                            return 'Tahap Saat Ini (Default)';
                                        })()}
                                    </div>
                                </div>
                            )}
                        </>
                    );
                })()}

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
                        <div className="text-text-soft flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase">
                            <Users size={12} />Persetujuan Tambahan
                            <span>Approver Terpilih ({selectedUserIds.length})</span>
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
