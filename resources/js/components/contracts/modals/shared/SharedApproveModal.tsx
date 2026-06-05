import { Button } from '@/components/ui/base/Button';
import { StatusBadge } from '@/components/ui/data/StatusBadge';
import { FormTextarea } from '@/components/ui/forms/FormTextarea';
import { SearchableMultiSelect } from '@/components/ui/forms/SearchableMultiSelect';
import { SearchableSelect } from '@/components/ui/forms/SearchableSelect';
import { Modal } from '@/components/ui/overlays/Modal';
import { contractApi } from '@/lib/contract-api';
import { cn } from '@/lib/utils';
import { CheckCircle2, Gavel, Loader2, Paperclip, PenTool, Send, UserCheck, UserPen, Users, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface Props {
    open: boolean;
    onClose: () => void;
    onSubmit: (
        note: string,
        attachment?: File,
        assignedPicId?: string,
        executionOrder?: string,
        signerUserIds?: string[],
        actionCode?: string,
        isFinal?: boolean,
        targetStepId?: string,
    ) => Promise<void>;
    isAssign?: boolean;
    contract: any;
    onUpdate: (c: any) => void;
    actionCode?: string;
    actionAlias?: string;
    users?: any[];
}

export function SharedApproveModal({ open, onClose, onSubmit, isAssign, contract, onUpdate, actionCode, actionAlias, users: initialUsers }: Props) {
    const [note, setNote] = useState('');
    const [attachment, setAttachment] = useState<File | null>(null);
    const [assignedPicId, setAssignedPicId] = useState<string>('');
    const [executionOrder, setExecutionOrder] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState<any[]>(initialUsers || []);
    const [fetchingUsers, setFetchingUsers] = useState(false);
    const [signerUserIds, setSignerUserIds] = useState<string[]>([]);
    const [selectedTargetStepId, setSelectedTargetStepId] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [allWorkflows, setAllWorkflows] = useState<any[]>([]);

    useEffect(() => {
        if (open) {
            contractApi.getWorkflows().then(setAllWorkflows).catch(console.error);
        }
    }, [open]);

    const activeAction = contract?.workflow_step?.actions?.find((a: any) => a.action_code === actionCode);
    const signingParties = activeAction?.signing_parties || [];

    const getTransitionPreview = () => {
        if (!contract) return null;

        let transition = activeAction?.transition_config;
        if (!activeAction && actionCode === 'reject') {
            const rejectAction = contract?.workflow_step?.actions?.find((a: any) => a.action_code === 'reject');
            if (rejectAction) {
                transition = rejectAction.transition_config;
            }
        }

        const currentStep = contract?.workflow_step;
        if (!currentStep) return null;

        const currentStepSeq = Number(currentStep.step || 1);
        const steps = contract?.workflow?.steps || [];

        const formatStepInfo = (stepObj: any) => {
            if (!stepObj) return 'Selesai / Disetujui (Langkah Terakhir)';
            return `Tahap ${stepObj.step} - ${stepObj.description || stepObj.label || 'Tanpa Keterangan'}`;
        };

        if (transition && typeof transition === 'object') {
            const { type, offset, sequence, workflow_id } = transition;
            if (type === 'relative') {
                const offNum = Number(offset ?? 1);
                if (offNum === 1) {
                    const nextStep = steps.find((s: any) => Number(s.step) > currentStepSeq);
                    return {
                        label: 'Maju ke Langkah Berikutnya (Sequential +1)',
                        target: formatStepInfo(nextStep)
                    };
                } else if (offNum === 0) {
                    return {
                        label: 'Tetap di Tahap Ini (Stay / Offset 0)',
                        target: formatStepInfo(currentStep)
                    };
                } else if (offNum < 0) {
                    const targetSeq = Math.max(1, currentStepSeq + offNum);
                    const prevStep = steps.find((s: any) => Number(s.step) === targetSeq) || steps.find((s: any) => Number(s.step) < currentStepSeq);
                    return {
                        label: `Mundur ${Math.abs(offNum)} Langkah (Offset ${offNum})`,
                        target: formatStepInfo(prevStep)
                    };
                } else {
                    const targetSeq = currentStepSeq + offNum;
                    const nextStep = steps.find((s: any) => Number(s.step) === targetSeq) || steps.find((s: any) => Number(s.step) > currentStepSeq);
                    return {
                        label: `Maju ${offNum} Langkah (Offset +${offNum})`,
                        target: formatStepInfo(nextStep)
                    };
                }
            } else if (type === 'absolute') {
                const targetSeq = Number(sequence ?? 1);
                const targetStep = steps.find((s: any) => Number(s.step) === targetSeq);
                return {
                    label: `Lompat ke Tahap Spesifik (Tahap ${targetSeq})`,
                    target: formatStepInfo(targetStep)
                };
            } else if (type === 'cross_workflow') {
                const targetWf = allWorkflows.find((w: any) => String(w.id) === String(workflow_id));
                const targetStep = targetWf?.steps?.find((s: any) => Number(s.step) === Number(sequence));
                const wfName = targetWf?.name || 'Alur Kerja Target';
                const stepLabel = targetStep ? `Tahap ${targetStep.step} - ${targetStep.description || targetStep.label || 'Tanpa Keterangan'}` : `Tahap ${sequence}`;
                return {
                    label: `Pindah ke Alur Kerja: ${wfName}`,
                    target: stepLabel
                };
            }
        }

        if (actionCode === 'reject') {
            const step1 = steps.find((s: any) => Number(s.step) === 1);
            return {
                label: 'Kembali untuk Revisi (Default Reject)',
                target: formatStepInfo(step1)
            };
        }

        const nextStep = steps.find((s: any) => Number(s.step) > currentStepSeq);
        return {
            label: 'Maju ke Langkah Berikutnya (Default Sequential)',
            target: formatStepInfo(nextStep)
        };
    };

    const preview = getTransitionPreview();

    const isSigningSetup =
        ['sign', 'signature'].includes(actionCode?.toLowerCase() || '') ||
        contract?.approvals?.some((a: any) => a.role === 'Staff Legal (Setup)' && ['pending', 'waiting'].includes(a.status)) ||
        (contract?.workflow_step?.step_category === 'signing' &&
            contract?.approvals?.some(
                (a: any) => a.workflow_step_id === contract.workflow_step_id && a.sub_step == null && ['pending', 'waiting'].includes(a.status),
            ));

    useEffect(() => {
        if (open && (isAssign || isSigningSetup)) {
            fetchUsers();
        }

        if (open && isSigningSetup) {
            const activeAction = contract?.workflow_step?.actions?.find((a: any) => a.action_code === actionCode);
            const defaultTargetStepId = activeAction?.assignee_config?.signature_target_step || contract?.workflow_step_id;
            setSelectedTargetStepId(defaultTargetStepId ? String(defaultTargetStepId) : '');

            // Identify users already in the "Terdaftar" list
            const existingUserIds = new Set(
                (contract?.approvals || [])
                    .filter(
                        (a: any) =>
                            String(a.workflow_step_id) === String(defaultTargetStepId || contract?.workflow_step_id) && a.status !== 'rejected',
                    )
                    .map((a: any) => String(a.user_id)),
            );

            // Auto-resolve based on signing_parties configuration from the workflow action
            if (signerUserIds.length === 0 && signingParties.length > 0) {
                const ids: string[] = [];

                if (signingParties.includes('initiator') && contract.initiator?.id) {
                    // Only add if NOT already registered
                    if (!existingUserIds.has(String(contract.initiator.id))) {
                        ids.push(contract.initiator.id);
                    }
                }

                if (signingParties.includes('assigned_pic') && contract.assigned_pic?.id) {
                    // Only add if NOT already registered
                    if (!existingUserIds.has(String(contract.assigned_pic.id))) {
                        ids.push(contract.assigned_pic.id);
                    }
                }

                const validIds = Array.from(new Set(ids.filter(Boolean)));
                if (validIds.length > 0) {
                    setSignerUserIds(validIds);
                }
            }
        }
    }, [open, isAssign, contract, isSigningSetup, signingParties]);

    const fetchUsers = async () => {
        if (initialUsers && initialUsers.length > 0) return;

        setFetchingUsers(true);
        try {
            const allUsers = await contractApi.getUsers();

            if (isSigningSetup) {
                // For signing, we usually want all active users, or specifically those with signing authority
                setUsers(allUsers.filter((u: any) => u.is_active));
                return;
            }

            // Filter users based on next step requirements (Department and Roles)
            let requirements = contract.next_step;

            const actionAssigneeConfig = activeAction?.assignee_config;
            if (actionAssigneeConfig && actionAssigneeConfig.type === 'role') {
                requirements = {
                    department_ids: actionAssigneeConfig.department_ids || [],
                    roles: actionAssigneeConfig.roles || [],
                };
            }

            const filtered = allUsers.filter((u: any) => {
                // Backend returns department_ids array or department_id singular
                const nextDeptIds = requirements?.department_ids || (requirements?.department_id ? [requirements.department_id] : []);
                const matchesDept = nextDeptIds.length === 0 || nextDeptIds.includes(u.department_id);

                // Backend returns roles as an array of role names
                const nextRoles = requirements?.roles || [];
                const matchesRole = nextRoles.length === 0 || nextRoles.some((r: string) => r.toLowerCase() === u.role?.toLowerCase());

                return matchesDept && matchesRole;
            });

            // Fallback to all Staff if filter returns nothing, but prefer filtered
            if (filtered.length > 0) {
                setUsers(filtered);
            } else {
                setUsers(allUsers);
            }
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setFetchingUsers(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setAttachment(e.target.files[0]);
        }
    };

    const handleSubmit = async () => {
        if (isAssign && !assignedPicId) {
            alert('Harap pilih PIC Staff Legal terlebih dahulu.');
            return;
        }

        if (isSigningSetup) {
            if (signerUserIds.length < 1) {
                alert('Harap pilih minimal 1 personil penandatangan.');
                return;
            }
        }

        const isJointUpload = contract?.next_step?.step_category === 'joint_upload';
        const hasOrderSet = !!contract?.metadata?.step_12_order;
        const showOrderSelection = isJointUpload && !hasOrderSet;

        if (showOrderSelection && !executionOrder) {
            alert('Harap pilih urutan penyelesaian terlebih dahulu.');
            return;
        }

        setLoading(true);
        try {
            await onSubmit(
                note,
                attachment || undefined,
                assignedPicId || undefined,
                executionOrder || undefined,
                signerUserIds, // Unified array of signers
                actionCode,
                undefined, // isFinal
                selectedTargetStepId || undefined, // targetStepId
            );
            onClose();
            setNote('');
            setAttachment(null);
            setAssignedPicId('');
            setExecutionOrder('');
            setSignerUserIds([]);
            setSelectedTargetStepId('');
        } finally {
            setLoading(false);
        }
    };

    const renderTitle = () => {
        if (isSigningSetup) {
            return (
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 shadow-inner">
                        <PenTool size={20} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold  text-slate-900 uppercase dark:text-white">
                            {actionAlias || 'Upload Tanda Tangan'}
                        </h3>
                        <p className="mt-0.5 text-[10px] font-medium text-slate-400 uppercase">Tentukan Pihak Penandatangan</p>
                    </div>
                </div>
            );
        }
        if (actionAlias)
            return (
                <>
                    <CheckCircle2 size={18} className="text-primary" /> {actionAlias}
                </>
            );
        if (isAssign)
            return (
                <>
                    <UserCheck size={18} className="text-primary" /> Tugaskan & Setujui
                </>
            );
        if (contract?.workflow_step?.step === 1)
            return (
                <>
                    <Send size={18} className="text-primary" /> Kirim Persetujuan
                </>
            );
        return (
            <>
                <CheckCircle2 size={18} className="text-success" /> Setujui Kontrak
            </>
        );
    };

    return (
        <Modal
            isOpen={open}
            onClose={onClose}
            maxWidth={isSigningSetup ? 'xl' : '3xl'}
            title={renderTitle()}
            footer={
                <div className="flex w-full gap-3">
                    <Button variant="outline" onClick={onClose} disabled={loading} className="flex-1 rounded-xl">
                        Batal
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading || (isAssign && !assignedPicId) || (isSigningSetup && signerUserIds.length === 0)}
                        className={cn(
                            'flex-1 rounded-xl shadow-lg transition-all',
                            isSigningSetup ? 'bg-blue-600 text-white shadow-blue-600/20 hover:bg-blue-700' : 'shadow-primary/20',
                        )}
                    >
                        {loading ? (
                            <Loader2 size={16} className="mr-2 animate-spin" />
                        ) : (
                            <>
                                {isSigningSetup ? (
                                    <PenTool size={16} className="mr-2" />
                                ) : isAssign ? (
                                    <UserCheck size={16} className="mr-2" />
                                ) : contract?.workflow_step?.step === 1 ? (
                                    <Send size={16} className="mr-2" />
                                ) : (
                                    <CheckCircle2 size={16} className="mr-2" />
                                )}
                            </>
                        )}
                        {isSigningSetup
                            ? 'Proses Penugasan'
                            : isAssign
                                ? 'Tugaskan & Setujui'
                                : contract?.workflow_step?.step === 1
                                    ? 'Kirim Sekarang'
                                    : 'Konfirmasi Setuju'}
                    </Button>
                </div>
            }
        >
            <div className="space-y-5">
                {preview && (
                    <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3.5 text-left dark:border-slate-800 dark:bg-slate-900/40">
                        <div className=" flex flex-col gap-0.5">
                            <span className="text-[9px] font-medium text-slate-400 uppercase">{preview.label}</span>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{preview.target}</span>
                        </div>
                    </div>
                )}

                {isSigningSetup ? (
                    <div className="space-y-5 text-left">
                        <p className="text-text-desc text-sm leading-relaxed font-medium">
                            Pilih satu atau beberapa personil yang memiliki otoritas untuk menarik dokumen dari sistem dan memproses penandatanganan
                            (Basah/Digital).
                        </p>

                        {/* --- EXISTING DELEGATES LIST --- */}
                        {(() => {
                            const targetId = activeAction?.assignee_config?.signature_target_step || contract?.workflow_step_id;
                            const currentStepDelegates = (contract?.approvals || []).filter(
                                (a: any) =>
                                    String(a.workflow_step_id) === String(targetId) &&
                                    ['Persetujuan Tambahan', 'Penandatangan'].includes(a.role) &&
                                    a.status !== 'rejected',
                            );

                            if (currentStepDelegates.length === 0) return null;

                            return (
                                <div className="space-y-2.5">
                                    <div className="text-text-soft flex items-center justify-between text-[10px] font-bold  uppercase">
                                        <div className="flex items-center gap-1.5">
                                            <Users size={12} className="text-blue-500" />
                                            Penandatangan Terdaftar
                                        </div>
                                        <span className="rounded bg-blue-50 px-1.5 py-0.5 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                                            {currentStepDelegates.length} Orang
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                        {currentStepDelegates.map((a: any) => (
                                            <div
                                                key={a.id}
                                                className="group border-surface-border bg-surface-muted/20 relative flex items-center gap-3 rounded-xl border p-2 transition-all hover:border-blue-200"
                                            >
                                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
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
                                                            if (confirm(`Hapus delegasi penandatangan untuk ${a.approver_name}?`)) {
                                                                try {
                                                                    const updated = await contractApi.removeAdhocApprover(contract.id, a.id);
                                                                    onUpdate(updated);
                                                                } catch (err) {
                                                                    console.error(err);
                                                                    alert('Gagal menghapus penandatangan.');
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
                            );
                        })()}
                        {/* ------------------------------ */}

                        <div className="space-y-1.5">
                            <label className="text-text-desc text-[11px] font-bold  uppercase">
                                Tambah Penandatangan Baru <span className="text-danger">*</span>
                            </label>
                            <SearchableMultiSelect
                                values={signerUserIds}
                                onValuesChange={setSignerUserIds}
                                showOrder={true}
                                options={(() => {
                                    // 1. Identify users already in the "Terdaftar" list (Wajib difilter keluar)
                                    const targetId = activeAction?.assignee_config?.signature_target_step || contract?.workflow_step_id;
                                    const existingUserIds = new Set(
                                        (contract?.approvals || [])
                                            .filter((a: any) => String(a.workflow_step_id) === String(targetId) && a.status !== 'rejected')
                                            .map((a: any) => String(a.user_id)),
                                    );

                                    // 2. Kumpulkan semua kandidat (Users, Initiator, PIC)
                                    const candidates = new Map();

                                    users.forEach((u) => candidates.set(String(u.id), { id: String(u.id), name: u.name, role: u.role || 'User' }));
                                    if (contract?.initiator?.id)
                                        candidates.set(String(contract.initiator.id), {
                                            id: String(contract.initiator.id),
                                            name: contract.initiator.name,
                                            role: contract.initiator.role || 'Initiator',
                                        });
                                    if (contract?.assigned_pic?.id)
                                        candidates.set(String(contract.assigned_pic.id), {
                                            id: String(contract.assigned_pic.id),
                                            name: contract.assigned_pic.name,
                                            role: contract.assigned_pic.role || 'PIC',
                                        });

                                    // 3. Filter: Hanya tampilkan yang BELUM ada di database (Penandatangan Terdaftar)
                                    // KECUALI jika ID tersebut sedang dipilih di UI (signerUserIds),
                                    // maka kita wajib mengembalikannya agar komponen bisa merender LABEL nya (bukan UUID).
                                    const baseOptions = Array.from(candidates.values())
                                        .filter((u) => !existingUserIds.has(u.id) || signerUserIds.includes(u.id))
                                        .map((u) => ({
                                            value: u.id,
                                            label: `${u.name} (${u.role})`,
                                        }));

                                    // 4. Tambahan: Filter berdasarkan signing_parties jika ada konfigurasi
                                    if (signingParties.length > 0) {
                                        return baseOptions.filter((opt) => {
                                            // WAJIB: Selalu tampilkan yang sedang dipilih di UI agar label tidak hilang/uuid
                                            if (signerUserIds.includes(opt.value)) return true;

                                            const roleLower = opt.label.toLowerCase();
                                            return signingParties.some((party: string) => {
                                                if (party === 'initiator') return opt.value === String(contract?.initiator?.id);
                                                if (party === 'assigned_pic') return opt.value === String(contract?.assigned_pic?.id);
                                                return roleLower.includes(party.toLowerCase());
                                            });
                                        });
                                    }

                                    return baseOptions;
                                })()}
                                placeholder="Cari dan pilih penandatangan..."
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-text-desc text-[11px] font-bold  uppercase">Sisipkan Ke Langkah</label>
                            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400">
                                {(() => {
                                    const targetId = activeAction?.assignee_config?.signature_target_step || contract?.workflow_step_id;
                                    if (String(targetId) === String(contract?.workflow_step_id)) {
                                        return `(Step Saat Ini) Tahap ${contract?.workflow_step?.step} - ${contract?.workflow_step?.description || contract?.workflow_step?.label || ''}`;
                                    }
                                    const targetStep = (contract?.workflow?.steps || []).find((s: any) => String(s.id) === String(targetId));
                                    if (targetStep) {
                                        return `Tahap ${targetStep.step} - ${targetStep.description || targetStep.label || ''}`;
                                    }
                                    return 'Tahap Terkonfigurasi';
                                })()}
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-text-desc text-[11px] font-bold  uppercase">Catatan / Instruksi (Opsional)</label>
                            <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="Tulis instruksi khusus mengenai penandatanganan ini..."
                                className="min-h-[100px] w-full resize-none rounded-2xl border border-slate-200 bg-slate-50/50 p-4 text-[11px] font-bold transition-all outline-none focus:border-blue-500 focus:bg-white dark:border-slate-800 dark:bg-black/20 dark:text-white"
                            />
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <p className="text-text-desc text-sm leading-relaxed font-medium">
                            {isAssign
                                ? `Harap pilih ${actionAlias || 'Assignee'} yang akan mengerjakan tugas ini.`
                                : contract?.workflow_step?.step === 1
                                    ? 'Konfirmasi untuk mengirim draft kontrak ini ke tahap persetujuan berikutnya. Pastikan dokumen sudah lengkap.'
                                    : 'Apakah Anda yakin ingin menyetujui kontrak ini? Anda dapat memberikan catatan approval dan lampiran (opsional).'}
                        </p>

                        {isAssign && (
                            <div className="space-y-1.5">
                                <label className="text-text-desc text-[11px] font-bold  uppercase">
                                    Pilih {actionAlias || 'Assignee'} <span className="text-danger">*</span>
                                </label>
                                {fetchingUsers ? (
                                    <div className="text-text-desc flex animate-pulse items-center gap-2 text-[10px]">
                                        <Loader2 size={10} className="animate-spin" /> Memuat daftar assignee...
                                    </div>
                                ) : users.length === 0 ? (
                                    <p className="text-danger text-[10px] font-medium">Tidak ada assignee ditemukan.</p>
                                ) : (
                                    <SearchableSelect
                                        value={assignedPicId}
                                        onValueChange={setAssignedPicId}
                                        options={users.map((u) => ({
                                            value: u.id,
                                            label: `${u.name} (${u.email})`,
                                        }))}
                                        placeholder={`-- Pilih ${actionAlias || 'Assignee'} --`}
                                    />
                                )}
                            </div>
                        )}

                        {contract?.next_step?.step_category === 'joint_upload' && !contract?.metadata?.step_12_order && (
                            <div className="space-y-3">
                                <label className="text-text-desc text-[11px] font-bold  uppercase">
                                    Urutan Penyelesaian <span className="text-danger">*</span>
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setExecutionOrder('legal_first')}
                                        className={cn(
                                            'flex h-auto flex-col items-center justify-center gap-2 border p-4 transition-all duration-300',
                                            executionOrder === 'legal_first'
                                                ? 'border-primary bg-primary/[0.03] ring-primary/20 shadow-primary/5 shadow-lg ring-1'
                                                : 'border-surface-border bg-surface-muted/50 hover:bg-surface-muted',
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                'flex h-10 w-10 items-center justify-center rounded-xl transition-colors',
                                                executionOrder === 'legal_first'
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'bg-surface-muted text-text-desc',
                                            )}
                                        >
                                            <Gavel size={18} />
                                        </div>
                                        <span
                                            className={cn(
                                                'text-xs font-bold tracking-tight uppercase',
                                                executionOrder === 'legal_first' ? 'text-primary' : 'text-text-desc',
                                            )}
                                        >
                                            Legal Dulu
                                        </span>
                                        <span className="text-center text-[9px] leading-tight font-medium opacity-50">Legal upload, lalu Inisiator</span>
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setExecutionOrder('initiator_first')}
                                        className={cn(
                                            'flex h-auto flex-col items-center justify-center gap-2 border p-4 transition-all duration-300',
                                            executionOrder === 'initiator_first'
                                                ? 'border-primary bg-primary/[0.03] ring-primary/20 shadow-primary/5 shadow-lg ring-1'
                                                : 'border-surface-border bg-surface-muted/50 hover:bg-surface-muted',
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                'flex h-10 w-10 items-center justify-center rounded-xl transition-colors',
                                                executionOrder === 'initiator_first'
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'bg-surface-muted text-text-desc',
                                            )}
                                        >
                                            <UserPen size={18} />
                                        </div>
                                        <span
                                            className={cn(
                                                'text-xs font-bold tracking-tight uppercase',
                                                executionOrder === 'initiator_first' ? 'text-primary' : 'text-text-desc',
                                            )}
                                        >
                                            Inisiator Dulu
                                        </span>
                                        <span className="text-center text-[9px] leading-tight font-medium opacity-50">Inisiator upload, lalu Legal</span>
                                    </Button>
                                </div>
                            </div>
                        )}

                        <FormTextarea
                            label={`Catatan Approval ${isAssign ? '(Optional)' : ''}`}
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            rows={3}
                            placeholder={isAssign ? 'Tambahkan instruksi penugasan (opsional)...' : 'Tambahkan catatan approval...'}
                        />

                        <div className="space-y-1.5">
                            <label className="text-text-desc text-[11px] font-bold  uppercase">Lampiran Pendukung (Optional)</label>
                            <div className="mt-1">
                                {!attachment ? (
                                    <Button
                                        variant="outline"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="border-surface-border text-text-desc hover:border-primary hover:text-primary hover:bg-surface-muted flex h-auto w-full items-center justify-center gap-2 border-2 border-dashed py-6 transition-all"
                                    >
                                        <Paperclip size={18} className="opacity-40" />
                                        <span className="text-xs font-bold tracking-wide uppercase">Lampirkan File</span>
                                    </Button>
                                ) : (
                                    <div className="border-surface-border bg-surface-muted flex items-center justify-between rounded-xl border p-4">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="bg-primary/10 rounded-lg p-2">
                                                <Paperclip size={16} className="text-primary" />
                                            </div>
                                            <span className="text-text-main truncate text-xs font-bold">{attachment.name}</span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setAttachment(null)}
                                            className="text-text-desc hover:text-danger hover:bg-danger/10 h-8 w-8"
                                        >
                                            <X size={16} />
                                        </Button>
                                    </div>
                                )}
                                <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => setAttachment(e.target.files?.[0] || null)} />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Modal >
    );
}
