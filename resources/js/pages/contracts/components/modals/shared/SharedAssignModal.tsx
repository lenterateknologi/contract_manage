import { Button } from '@/components/ui/buttons/Button';
import { StatusBadge } from '@/components/ui/feedback/StatusBadge';
import { CompactSwitch } from '@/components/ui/selection/CompactSwitch';
import { FormTextarea } from '@/components/ui/inputs/FormTextarea';
import { SearchableMultiSelect } from '@/components/ui/selection/SearchableMultiSelect';
import { Modal } from '@/components/ui/dialogs/Modal';
import { contractApi } from '@/pages/contracts/utils';
import { matchUserAgainstWorkflowPool } from '@/pages/workflows/workflow-filter';
import { CheckCircle2, Loader2, UserCheck, Users, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Props {
    open: boolean;
    onClose: () => void;
    contract: any;
    onUpdate: (c: any) => void;
    showToast: (msg: string, type: any) => void;
    actionCode?: string;
    actionAlias?: string;
    users?: any[];
}

export function SharedAssignModal({ open, onClose, contract, onUpdate, showToast, actionCode, actionAlias, users: initialUsers }: Props) {
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [note, setNote] = useState('');
    const [isSequential, setIsSequential] = useState(false);
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState<any[]>(initialUsers || []);
    const [fetchingUsers, setFetchingUsers] = useState(false);
    const [selectedTargetStepId, setSelectedTargetStepId] = useState<string | null>(null);

    // Dynamic role name based on alias or default
    const ROLE_NAME = actionAlias || 'Personil';

    useEffect(() => {
        if (open) {
            const currentStep = contract?.workflow_step;
            const activeAction = (currentStep?.actions || []).find((a: any) => {
                if (actionCode) return a.action_code === actionCode || a.master_action_code === actionCode;
                return a.action_code === 'assign' || a.action_code === 'assign_pic';
            });
            const config = activeAction?.assignee_config || {};
            const targetStepId = activeAction?.next_step_id || config.default_target_step || contract?.workflow_step_id;
            
            setSelectedTargetStepId(targetStepId ? String(targetStepId) : null);
            setNote('');
            setIsSequential(false);
        } else {
            setSelectedUserIds([]);
        }
    }, [open, contract?.id]);

    useEffect(() => {
        if (open) {
            fetchUsers(selectedTargetStepId);
        }
    }, [open, selectedTargetStepId]);

    const fetchUsers = async (targetStepIdVal: string | null) => {
        if (initialUsers && initialUsers.length > 0) return;

        setFetchingUsers(true);
        try {
            const allUsers = await contractApi.getUsers({ all: true });
            const currentStep = contract?.workflow_step;
            const activeAction = (currentStep?.actions || []).find((a: any) => {
                if (actionCode) return a.action_code === actionCode || a.master_action_code === actionCode;
                return a.action_code === 'assign' || a.action_code === 'assign_pic';
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

            const config = hasAssigneeConfig
                ? activeAction.assignee_config
                : (contract.next_step?.approver_config || contract.next_step);
            const finalTargetStepId = targetStepIdVal || contract?.workflow_step_id;

            // Existing assignees should be pre-selected from contract.assigned_pic_id
            const existingAssigneeUserIds = contract?.assigned_pic_id ? [String(contract.assigned_pic_id)] : [];

            const availableUsers = allUsers.filter((u: any) => {
                return matchUserAgainstWorkflowPool(u, config, contract);
            });

            const uniqueUsers = Array.from(new Map(availableUsers.map((u: any) => [u.id, u])).values());
            setUsers(uniqueUsers);

            setSelectedUserIds((prev) => {
                const combined = [...prev, ...existingAssigneeUserIds];
                return Array.from(new Set(combined));
            });
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setFetchingUsers(false);
        }
    };

    const handleUpdateSelectedUsers = (val: string[]) => {
        // Only allow 1 user to be selected
        setSelectedUserIds(val.slice(-1));
    };

    const handleRemoveUser = (id: string) => {
        setSelectedUserIds((prev) => prev.filter((uid) => uid !== id));
    };

    const handleSubmit = async () => {
        if (selectedUserIds.length === 0) {
            showToast(`Silakan pilih minimal satu ${ROLE_NAME}.`, 'warning');
            return;
        }

        // Simulation Mode Check
        if (!contract?.id) {
            onUpdate(contract);
            showToast(`Simulasi penugasan ${ROLE_NAME} berhasil.`, 'success');
            onClose();
            return;
        }

        setLoading(true);
        try {
            const updatedContract = await contractApi.approve(
                contract.id,
                note || '',
                undefined, // attachment
                selectedUserIds[0] || undefined, // assignedPicId
                undefined, // executionOrder
                undefined, // signerUserIds
                actionCode || 'assign',
                undefined, // isFinal
                selectedTargetStepId || undefined // targetStepId
            );
            
            onUpdate(updatedContract);
            showToast(`Penugasan ${ROLE_NAME} berhasil diperbarui.`, 'success');
            onClose();
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Gagal memperbarui penugasan.';
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
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <UserCheck size={16} />
                    </div>
                    <span className="text-text-main text-sm font-bold tracking-tight uppercase">
                        {actionAlias || 'Tugaskan PIC'}
                    </span>
                </div>
            }
            footer={
                <div className="flex w-full gap-3">
                    <Button variant="outline" onClick={onClose} disabled={loading} className="flex-1 text-[10px] uppercase">
                        Batal
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading || selectedUserIds.length === 0}
                        className="flex-1 bg-primary text-[10px] text-primary-foreground uppercase transition-all duration-200 shadow-lg shadow-primary/20"
                    >
                        {loading ? <Loader2 size={14} className="mr-2 animate-spin" /> : <CheckCircle2 size={14} className="mr-2" />}
                        Konfirmasi Penugasan
                    </Button>
                </div>
            }
        >
            <div className="space-y-6">
                <div className="rounded-xl border border-primary/10 bg-primary/5 p-4">
                    <p className="text-[11px] leading-relaxed font-medium text-primary/80">
                        Pilih personil yang akan bertanggung jawab untuk memproses dokumen ini pada tahap selanjutnya.
                    </p>
                </div>

                {/* --- CURRENTLY ASSIGNED PIC --- */}
                {contract?.assigned_pic && (
                    <div className="space-y-2.5">
                        <div className="text-text-soft flex items-center justify-between text-[10px] font-bold uppercase">
                            <div className="flex items-center gap-1.5">
                                <Users size={12} className="text-primary" />
                                PIC Ditugaskan Saat Ini
                            </div>
                        </div>
                        <div className="border-surface-border bg-surface-muted/20 relative flex items-center gap-3 rounded-xl border p-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                                {contract.assigned_pic.name?.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="flex min-w-0 flex-col">
                                <span className="text-text-main truncate text-xs leading-tight font-bold">{contract.assigned_pic.name}</span>
                                <span className="text-text-soft text-[9px] tracking-tighter uppercase">{contract.assigned_pic.role}</span>
                            </div>
                            <div className="ml-auto flex items-center gap-1.5">
                                <button
                                    type="button"
                                    disabled={loading}
                                    onClick={async () => {
                                        if (confirm(`Hapus penugasan untuk ${contract.assigned_pic.name}?`)) {
                                            try {
                                                const updated = await contractApi.update(contract.id, { assigned_pic_id: null });
                                                onUpdate(updated);
                                                setSelectedUserIds([]);
                                                showToast('Penugasan berhasil dihapus.', 'success');
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
                        <div className="bg-surface-border/50 my-2 h-px" />
                    </div>
                )}

                <div className="space-y-2">
                    <label className="text-text-soft text-[10px] font-bold uppercase">
                        Pilih {ROLE_NAME} <span className="text-danger">*</span>
                    </label>
                    {fetchingUsers ? (
                        <div className="text-text-soft flex animate-pulse items-center gap-2 py-1 text-[10px]">
                            <Loader2 size={12} className="animate-spin" /> Memuat daftar user...
                        </div>
                    ) : users.length === 0 ? (
                        <p className="text-danger py-1 text-[10px] font-medium">Tidak ada personil yang tersedia untuk ditugaskan.</p>
                    ) : (
                        <SearchableMultiSelect
                            values={selectedUserIds}
                            onValuesChange={handleUpdateSelectedUsers}
                            showOrder={true}
                            options={users.map((u: any) => ({
                                value: u.id,
                                label: `${u.name} (${u.role}${u.department_name ? ` - ${u.department_name}` : ''})`,
                            }))}
                            placeholder={`-- Cari & Pilih ${ROLE_NAME} --`}
                        />
                    )}
                </div>

                <div className="space-y-2">
                    <label className="text-text-soft text-[10px] font-bold uppercase">Disisipkan Ke Langkah</label>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400">
                        {(() => {
                            if (String(selectedTargetStepId) === String(contract?.workflow_step_id)) {
                                return `(Step Saat Ini) Tahap ${contract?.workflow_step?.step} - ${contract?.workflow_step?.description || contract?.workflow_step?.label || ''}`;
                            }
                            const targetStep = (contract?.workflow?.steps || []).find((s: any) => String(s.id) === String(selectedTargetStepId));
                            if (targetStep) {
                                return `Tahap ${targetStep.step} - ${targetStep.description || targetStep.label || ''}`;
                            }
                            return 'Tahap Alur Kerja (Default)';
                        })()}
                    </div>
                </div>

                {selectedUserIds.length > 1 && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                        <CompactSwitch
                            label={isSequential ? 'Mode: Berurutan (Sequential)' : 'Mode: Serentak (Parallel)'}
                            description={
                                isSequential
                                    ? 'Personil akan diminta memproses satu per satu sesuai urutan di bawah.'
                                    : 'Semua personil dapat memproses secara bersamaan (kapan saja).'
                            }
                            checked={isSequential}
                            onCheckedChange={setIsSequential}
                        />
                    </div>
                )}

                {/* Selected Users Detailed List */}
                {selectedUserIds.length > 0 && (
                    <div className="animate-in fade-in slide-in-from-top-1 space-y-2.5 duration-200">
                        <div className="text-text-soft flex items-center gap-1.5 text-[10px] font-bold uppercase">
                            <Users size={12} />
                            {ROLE_NAME} Terpilih ({selectedUserIds.length})
                        </div>
                        <div className="border-surface-border bg-surface-muted/30 flex flex-wrap gap-2 rounded-xl border p-3">
                            {selectedUserIds.map((uid) => {
                                const u = users.find((user) => user.id === uid);
                                if (!u) return null;
                                return (
                                    <div
                                        key={uid}
                                        className="group flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-bold text-primary transition-all hover:bg-primary/10"
                                    >
                                        <span className="max-w-[200px] truncate">
                                            {u.name}
                                            <span className="ml-1 text-[9px] font-medium opacity-70">({u.role})</span>
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveUser(uid)}
                                            className="ml-1 rounded-full p-0.5 opacity-50 transition-colors hover:opacity-100"
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
                    label="Catatan Penugasan (Opsional)"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    placeholder={`Tambahkan instruksi khusus untuk ${ROLE_NAME}...`}
                />
            </div>
        </Modal>
    );
}
