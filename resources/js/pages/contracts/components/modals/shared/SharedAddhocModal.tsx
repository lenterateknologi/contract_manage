import { Button } from '@/components/ui/buttons/Button';
import { StatusBadge } from '@/components/ui/feedback/StatusBadge';
import { CompactSwitch } from '@/components/ui/selection/CompactSwitch';
import { FormTextarea } from '@/components/ui/inputs/FormTextarea';
import { SearchableMultiSelect } from '@/components/ui/selection/SearchableMultiSelect';
import { Modal } from '@/components/ui/dialogs/Modal';
import { getFileIcon, AttachmentCategoryBadge } from '@/components/ui';
import { cn } from '@/lib/utils';
import { formatFileSize } from '@/lib/formatters';
import { contractApi } from '@/pages/contracts/utils';
import { matchUserAgainstWorkflowPool } from '@/pages/workflows/workflow-filter';
import { CheckCircle2, Loader2, Paperclip, Plus, UserPlus, Users, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

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
    const [attachments, setAttachments] = useState<File[]>([]);
    const [isSequential, setIsSequential] = useState(false);
    const [approvalRule, setApprovalRule] = useState<'all' | 'any' | 'quorum'>('all');
    const [minApprovals, setMinApprovals] = useState<number>(1);
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState<any[]>([]);
    const [fetchingUsers, setFetchingUsers] = useState(false);
    const [selectedTargetStepId, setSelectedTargetStepId] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            setAttachments((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
        }
    };

    // Helper to accurately resolve target step (supports custom_actions settings, relative transition, next_step_id, and adhoc authority lookup)
    const resolveTargetStepId = (contractData: any, actCode?: string): string | null => {
        const currentStep = contractData?.workflow_step;
        const steps = contractData?.workflow?.steps || [];
        const customActions: any[] = 
            contractData?.workflow?.meta?.custom_actions || 
            contractData?.origin_workflow?.meta?.custom_actions || 
            contractData?.workflow_step?.workflow?.meta?.custom_actions || [];
        const customAction = customActions.find((ca: any) => 
            ca.id === 'action_adhoc' || 
            ca.action_code === 'forward' || 
            (actCode && ca.action_code === actCode)
        );

        // 1. Check custom action target_step configuration
        if (customAction && (customAction.target_step_mode || customAction.target_step_position)) {
            let anchorStep = currentStep;
            if (customAction.target_step_mode === 'specific_step' && customAction.target_step_id) {
                const foundAnchor = steps.find((s: any) => String(s.id) === String(customAction.target_step_id) || Number(s.step) === Number(customAction.target_step_id));
                if (foundAnchor) anchorStep = foundAnchor;
            }

            const position = customAction.target_step_position || (customAction.target_step_mode === 'next_step' ? 'after' : 'at');
            const anchorSeq = Number(anchorStep?.step) || 1;

            if (position === 'before') {
                const targetSeq = Math.max(1, anchorSeq - 1);
                const matched = steps.find((s: any) => Number(s.step) === targetSeq);
                if (matched) return String(matched.id);
            } else if (position === 'after') {
                const targetSeq = anchorSeq + 1;
                const matched = steps.find((s: any) => Number(s.step) === targetSeq);
                if (matched) return String(matched.id);
            } else {
                // 'at' (pada tahap acuan)
                if (anchorStep?.id && (!customAction.target_step_id || String(anchorStep.id) === String(customAction.target_step_id))) {
                    return String(anchorStep.id);
                }
            }
        }

        // 2. Check step activeAction configuration
        const activeAction = (currentStep?.actions || []).find((a: any) => {
            if (actCode) return a.action_code === actCode || a.master_action_code === actCode || a.master_action?.code === actCode;
            return (
                a.master_action_code?.toLowerCase() === 'forward' ||
                a.action_code?.toLowerCase() === 'forward' ||
                a.master_action?.code?.toLowerCase() === 'forward'
            );
        });

        const config = activeAction?.assignee_config || {};
        let targetStepId = activeAction?.next_step_id || config.default_target_step || null;

        if (!targetStepId && activeAction?.transition_config) {
            const tCfg = activeAction.transition_config;
            if (tCfg.type === 'relative') {
                const targetSeq = (currentStep?.step || 1) + (tCfg.offset ?? 1);
                const matched = steps.find((s: any) => s.step === targetSeq);
                if (matched) targetStepId = String(matched.id);
            } else if (tCfg.type === 'absolute') {
                const matched = steps.find((s: any) => s.step === tCfg.sequence);
                if (matched) targetStepId = String(matched.id);
            }
        }

        // 3. Look for explicit adhoc steps in the current workflow
        if (!targetStepId && steps.length > 0) {
            const adhocStep = steps.find((s: any) => 
                s.approver_type === 'adhoc' ||
                s.step_category === 'adhoc' ||
                s.step_category === 'adhoc_review' ||
                (s.approver_authorities || s.authorities || []).some((auth: any) => 
                    auth.authority_type === 'adhoc_approvers' || auth.authority_type === 'adhoc' || auth.user_id === 'adhoc_approvers'
                )
            );
            if (adhocStep) {
                targetStepId = String(adhocStep.id);
            }
        }

        return targetStepId ? String(targetStepId) : (contractData?.workflow_step_id ? String(contractData.workflow_step_id) : null);
    };

    // Initial setup when modal opens
    useEffect(() => {
        if (open) {
            const initialTargetStepId = resolveTargetStepId(contract, actionCode);

            setSelectedTargetStepId(initialTargetStepId);
            setNote('');
            setAttachments([]);

            // Read saved adhoc settings from contract metadata if available
            const savedAdhocMeta = contract?.metadata?.adhoc_steps?.[initialTargetStepId || ''] || {};
            setIsSequential(savedAdhocMeta.is_sequential ?? false);
            setApprovalRule(savedAdhocMeta.approval_rule ?? 'all');
            setMinApprovals(savedAdhocMeta.min_approvals ?? 1);
        } else {
            // Reset state when closed
            setSelectedUserIds([]);
            setAttachments([]);
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

            // 1. Check custom action configuration from workflow meta (e.g. action_adhoc or forward action)
            const customActions: any[] = contract?.workflow?.meta?.custom_actions || contract?.workflow_step?.workflow?.meta?.custom_actions || [];
            const customAction = customActions.find((ca: any) => 
                ca.id === 'action_adhoc' || 
                ca.action_code === 'forward' || 
                (actionCode && ca.action_code === actionCode)
            );

            // 2. Check step action configuration
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

            const hasCustomPersonnel = customAction?.eligible_personnel && Array.isArray(customAction.eligible_personnel) && customAction.eligible_personnel.length > 0;

            let config: any = null;
            if (hasCustomPersonnel) {
                config = { authorities: customAction.eligible_personnel };
            } else if (hasAssigneeConfig) {
                config = activeAction.assignee_config;
            }

            const finalTargetStepId = targetStepIdVal || contract?.workflow_step_id;
            const targetStep = (contract?.workflow?.steps || []).find((s: any) => String(s.id) === String(finalTargetStepId))
                || contract?.workflow_step;

            // Existing ad-hoc approvers should be pre-selected
            const existingAdhocUserIds = (contract?.approvals || [])
                .filter(
                    (a: any) =>
                        String(a.workflow_step_id) === String(finalTargetStepId) &&
                        a.role === 'Persetujuan Tambahan' &&
                        a.status !== 'rejected' &&
                        a.user_id != null &&
                        String(a.user_id) !== 'null' &&
                        String(a.user_id) !== 'undefined',
                )
                .map((a: any) => String(a.user_id));

            let availableUsers: any[] = [];
            if (config && Object.keys(config).length > 0) {
                availableUsers = allUsers.filter((u: any) => {
                    return matchUserAgainstWorkflowPool(u, config, contract);
                });
            }

            const uniqueUsers = Array.from(new Map(availableUsers.map((u: any) => [u.id, u])).values());
            setUsers(uniqueUsers);

            // Set initial selected users based on existing ones
            // Use unique array to prevent double entries from state + db
            setSelectedUserIds((prev) => {
                const combined = [...prev, ...existingAdhocUserIds].filter(
                    (uid) => Boolean(uid) && uid !== 'null' && uid !== 'undefined'
                );
                return Array.from(new Set(combined));
            });
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setFetchingUsers(false);
        }
    };

    const handleUpdateSelectedUsers = (val: string[]) => {
        // Force unique values and exclude null strings
        setSelectedUserIds(Array.from(new Set(val.filter((uid) => Boolean(uid) && uid !== 'null' && uid !== 'undefined'))));
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
            const finalTargetStepId = selectedTargetStepId || resolveTargetStepId(contract, actionCode);

            const updatedContract = await contractApi.addAdhocApprover(
                contract.id,
                selectedUserIds,
                note,
                isSequential,
                finalTargetStepId || undefined,
                undefined,
                approvalRule,
                approvalRule === 'quorum' ? minApprovals : undefined,
                attachments.length > 0 ? (attachments.length === 1 ? attachments[0] : attachments) : undefined,
            );
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
            maxWidth="xl"
            headerVariant="primary"
            headerIcon={<UserPlus size={16} className="text-white" />}
            title={actionAlias || 'Persetujuan Tambahan'}
            description="Tentukan pihak tambahan untuk menelaah dan menyetujui dokumen ini"
            footer={
                <div className="flex w-full justify-end gap-2">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        disabled={loading}
                        className="h-8 px-3 text-xs bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-800/50 font-medium"
                    >
                        Batal
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading || selectedUserIds.length === 0}
                        className="min-w-[130px] h-8 px-3 text-xs font-semibold"
                    >
                        {loading ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <CheckCircle2 size={14} className="mr-1.5" />}
                        Simpan Approver
                    </Button>
                </div>
            }
        >
            <div className="space-y-3 pt-0.5">
                {/* --- EXISTING APPROVERS (IF ANY) --- */}
                {currentStepDelegates.length > 0 && (
                    <div className="rounded-lg border border-slate-200/80 bg-slate-50/70 p-2.5 dark:border-slate-800 dark:bg-slate-900/40">
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                            <span className="flex items-center gap-1">
                                <Users size={12} className="text-indigo-500" />
                                Approver Terdaftar ({currentStepDelegates.length})
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {currentStepDelegates.map((a: any) => (
                                <div
                                    key={a.id}
                                    className="group flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 shadow-2xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                >
                                    <span>{a.approver_name}</span>
                                    <span className="text-[9px] text-slate-400">({a.job_title || a.role})</span>
                                    <StatusBadge status={a.status} />
                                    <button
                                        type="button"
                                        disabled={loading}
                                        onClick={async () => {
                                            if (confirm(`Hapus ${a.approver_name} dari persetujuan tambahan?`)) {
                                                try {
                                                    const updated = await contractApi.removeAdhocApprover(contract.id, a.id);
                                                    onUpdate(updated);
                                                    showToast('Approver berhasil dihapus.', 'success');
                                                } catch (err: any) {
                                                    showToast(err.response?.data?.message || 'Gagal menghapus.', 'danger');
                                                }
                                            }
                                        }}
                                        className="ml-0.5 text-slate-400 hover:text-rose-600 transition-colors"
                                        title="Hapus"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- TARGET STEP INFO (COMPACT INLINE) --- */}
                <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-1.5 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400">
                    <span className="text-[11px] font-medium text-slate-500">Tahap Penelaahan:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-[11px]">
                        {(() => {
                            const targetStepId = resolveTargetStepId(contract, actionCode);
                            if (targetStepId && String(targetStepId) === String(contract?.workflow_step_id)) {
                                return `Tahap ${contract?.workflow_step?.step || 1} (Tahap Saat Ini)`;
                            }
                            const targetStep = (contract?.workflow?.steps || []).find((s: any) => String(s.id) === String(targetStepId));
                            if (targetStep) {
                                return `Tahap ${targetStep.step} - ${targetStep.description || targetStep.label || ''}`;
                            }
                            return 'Tahap Saat Ini';
                        })()}
                    </span>
                </div>

                {/* --- SELECT USERS --- */}
                <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        Pilih Karyawan / Approver <span className="text-rose-500">*</span>
                    </label>
                    {fetchingUsers ? (
                        <div className="flex items-center gap-2 py-1 text-xs text-slate-400">
                            <Loader2 size={13} className="animate-spin text-indigo-500" /> Memuat daftar karyawan...
                        </div>
                    ) : users.length === 0 ? (
                        <p className="text-xs text-rose-500 font-medium">Tidak ada karyawan yang tersedia.</p>
                    ) : (
                        <SearchableMultiSelect
                            values={selectedUserIds}
                            onValuesChange={handleUpdateSelectedUsers}
                            showOrder={true}
                            options={users.map((u: any) => ({
                                value: u.id,
                                label: `${u.name} (${u.role}${u.department_name ? ` - ${u.department_name}` : ''})`,
                            }))}
                            placeholder="-- Cari nama karyawan --"
                        />
                    )}
                </div>

                {/* --- EXECUTION & APPROVAL RULES (COMPACT) --- */}
                <div className="space-y-2.5 rounded-lg border border-slate-200 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-900/30">
                    {/* 1. Urutan Persetujuan */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Urutan Persetujuan
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setIsSequential(false)}
                                className={`flex items-center justify-between rounded-md border px-2.5 py-1.5 text-left text-xs font-medium transition-all ${
                                    !isSequential
                                        ? 'border-indigo-600 bg-indigo-50/80 text-indigo-900 font-semibold dark:border-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-200'
                                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400'
                                }`}
                            >
                                <span>Serentak (Bersamaan)</span>
                                {!isSequential && <CheckCircle2 size={13} className="text-indigo-600 dark:text-indigo-400" />}
                            </button>

                            <button
                                type="button"
                                disabled={selectedUserIds.length <= 1}
                                onClick={() => setIsSequential(true)}
                                className={`flex items-center justify-between rounded-md border px-2.5 py-1.5 text-left text-xs font-medium transition-all ${
                                    selectedUserIds.length <= 1
                                        ? 'cursor-not-allowed opacity-50 border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-800 dark:bg-slate-900/20'
                                        : isSequential
                                        ? 'border-indigo-600 bg-indigo-50/80 text-indigo-900 font-semibold dark:border-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-200'
                                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400'
                                }`}
                            >
                                <span>Berurutan (Satu per satu)</span>
                                {isSequential && <CheckCircle2 size={13} className="text-indigo-600 dark:text-indigo-400" />}
                            </button>
                        </div>
                    </div>

                    {/* 2. Syarat Selesai */}
                    <div className="space-y-1 pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Syarat Penyelesaian
                        </label>
                        <div className="grid grid-cols-3 gap-1.5">
                            <button
                                type="button"
                                onClick={() => setApprovalRule('all')}
                                className={`rounded-md border px-2 py-1.5 text-center text-xs font-medium transition-all ${
                                    approvalRule === 'all'
                                        ? 'border-indigo-600 bg-indigo-50/80 text-indigo-900 font-semibold dark:border-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-200'
                                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400'
                                }`}
                            >
                                Semua Wajib Setuju
                            </button>

                            <button
                                type="button"
                                onClick={() => setApprovalRule('any')}
                                className={`rounded-md border px-2 py-1.5 text-center text-xs font-medium transition-all ${
                                    approvalRule === 'any'
                                        ? 'border-indigo-600 bg-indigo-50/80 text-indigo-900 font-semibold dark:border-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-200'
                                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400'
                                }`}
                            >
                                Cukup 1 Orang
                            </button>

                            <button
                                type="button"
                                onClick={() => setApprovalRule('quorum')}
                                className={`rounded-md border px-2 py-1.5 text-center text-xs font-medium transition-all ${
                                    approvalRule === 'quorum'
                                        ? 'border-indigo-600 bg-indigo-50/80 text-indigo-900 font-semibold dark:border-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-200'
                                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400'
                                }`}
                            >
                                Minimal N Orang
                            </button>
                        </div>

                        {approvalRule === 'quorum' && (
                            <div className="flex items-center gap-2 pt-1 px-0.5 animate-in fade-in">
                                <span className="text-xs text-slate-600 dark:text-slate-400">Minimal persetujuan:</span>
                                <input
                                    type="number"
                                    min={1}
                                    max={Math.max(1, selectedUserIds.length)}
                                    value={minApprovals}
                                    onChange={(e) => setMinApprovals(Math.max(1, Math.min(selectedUserIds.length || 99, parseInt(e.target.value) || 1)))}
                                    className="w-16 rounded border border-slate-300 bg-white px-2 py-0.5 text-xs font-bold text-center text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                />
                                <span className="text-xs text-slate-400 font-normal">
                                    dari {selectedUserIds.length || 1} orang
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* --- NOTE (COMPACT) --- */}
                <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        Catatan / Instruksi <span className="text-slate-400 font-normal">(Opsional)</span>
                    </label>
                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={2}
                        placeholder="Tuliskan catatan atau alasan penambahan approver..."
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 resize-none"
                    />
                </div>

                {/* File Upload Section */}
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <label className="text-slate-700 dark:text-zinc-200 text-[10.5px] font-bold uppercase">Lampiran Berkas Pendukung (Opsional)</label>
                        {attachments.length > 0 && (
                            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                                {attachments.length} Berkas Baru Dipilih
                            </span>
                        )}
                    </div>

                    {/* Existing Contract Attachments notice if any */}
                    {contract?.attachments && contract.attachments.length > 0 && (
                        <div className="rounded-lg border border-slate-200/80 bg-slate-50/50 dark:border-zinc-800 dark:bg-zinc-900/40 p-2 text-xs">
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Berkas Kontrak Saat Ini ({contract.attachments.length})
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                                {contract.attachments.map((at: any, i: number) => (
                                    <div key={at.id || i} className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-[11px] text-slate-700 dark:text-slate-300 shadow-2xs">
                                        {getFileIcon(at.file_name || at.label || '')}
                                        <span className="truncate max-w-[150px] font-medium">{at.file_name || at.label}</span>
                                        <AttachmentCategoryBadge item={at} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="mt-1 space-y-2">
                        {attachments.length === 0 ? (
                            <div
                                role="button"
                                tabIndex={0}
                                onClick={() => fileInputRef.current?.click()}
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    setIsDragging(true);
                                }}
                                onDragLeave={(e) => {
                                    e.preventDefault();
                                    setIsDragging(false);
                                }}
                                onDrop={handleFileDrop}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        fileInputRef.current?.click();
                                    }
                                }}
                                className={cn(
                                    "border-slate-200 text-slate-600 hover:border-indigo-500 hover:text-indigo-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:border-indigo-400 flex h-auto w-full flex-col items-center justify-center gap-1 border-2 border-dashed py-3.5 transition-all rounded-lg cursor-pointer",
                                    isDragging && "border-indigo-500 bg-indigo-50/20 scale-[0.99]"
                                )}
                            >
                                <div className="flex items-center gap-1.5">
                                    <Paperclip size={14} className="opacity-60" />
                                    <span className="text-xs font-bold tracking-wide">Pilih / Drag & Drop Berkas</span>
                                </div>
                                <span className="text-[10px] text-muted-foreground font-normal">Mendukung format PDF, Gambar, Dokumen, dan Spreadsheet</span>
                            </div>
                        ) : (
                            <div className="space-y-1.5">
                                {attachments.map((file, idx) => (
                                    <div key={idx} className="border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/40 flex items-center justify-between rounded-lg border px-3 py-1.5">
                                        <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
                                            {getFileIcon(file.name)}
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-slate-800 dark:text-slate-200 truncate text-xs font-semibold">{file.name}</span>
                                                <span className="text-slate-500 dark:text-slate-400 text-[10px] font-medium">{formatFileSize(file.size)}</span>
                                            </div>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                                            className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 h-7 w-7 shrink-0"
                                        >
                                            <X size={14} />
                                        </Button>
                                    </div>
                                ))}

                                <div
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => fileInputRef.current?.click()}
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        setIsDragging(true);
                                    }}
                                    onDragLeave={(e) => {
                                        e.preventDefault();
                                        setIsDragging(false);
                                    }}
                                    onDrop={handleFileDrop}
                                    className={cn(
                                        "w-full text-xs font-semibold flex items-center justify-center gap-1.5 border border-dashed border-indigo-400/40 text-indigo-600 hover:bg-indigo-50/50 dark:text-indigo-400 h-7 mt-1 rounded-md cursor-pointer transition-all",
                                        isDragging && "bg-indigo-50/30 border-indigo-500"
                                    )}
                                >
                                    <Plus size={13} />
                                    <span>Tambah Berkas Lainnya</span>
                                </div>
                            </div>
                        )}
                        <input
                            type="file"
                            ref={fileInputRef}
                            multiple
                            className="hidden"
                            onChange={(e) => {
                                if (e.target.files && e.target.files.length > 0) {
                                    setAttachments((prev) => [...prev, ...Array.from(e.target.files!)]);
                                }
                                e.target.value = '';
                            }}
                        />
                    </div>
                </div>
            </div>
        </Modal>
    );
}
