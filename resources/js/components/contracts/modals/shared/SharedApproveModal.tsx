import { Button } from '@/components/ui/base/Button';
import { SearchableMultiSelect } from '@/components/ui/forms/SearchableMultiSelect';
import { SearchableSelect } from '@/components/ui/forms/SearchableSelect';
import { Modal } from '@/components/ui/overlays/Modal';
import { FormTextarea } from '@/components/ui/forms/FormTextarea';
import { StatusBadge } from '@/components/ui/data/StatusBadge';
import { contractApi } from '@/lib/contract-api';
import { Paperclip, Send, UserCheck, X, CheckCircle2, PenTool, Gavel, UserPen, Loader2, AlertCircle, Info, FileText, Users } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

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

    const activeAction = contract?.workflow_step?.actions?.find((a: any) => a.action_code === actionCode);
    const signingParties = activeAction?.signing_parties || [];

    const isSigningSetup =
        ['sign', 'signature'].includes(actionCode?.toLowerCase() || '') ||
        contract?.approvals?.some((a: any) => a.role === 'Staff Legal (Setup)' && ['pending', 'waiting'].includes(a.status)) ||
        (contract?.workflow_step?.step_category === 'signing' &&
            contract?.approvals?.some(
                (a: any) =>
                    a.workflow_step_id === contract.workflow_step_id &&
                    a.sub_step == null &&
                    ['pending', 'waiting'].includes(a.status)
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
                    .filter((a: any) => String(a.workflow_step_id) === String(defaultTargetStepId || contract?.workflow_step_id) && a.status !== 'rejected')
                    .map((a: any) => String(a.user_id))
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
                    roles: actionAssigneeConfig.roles || []
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
                undefined,
                selectedTargetStepId || undefined,
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
                        <h3 className="text-sm font-bold tracking-wider text-slate-900 uppercase dark:text-white">
                            {actionAlias || 'Upload Tanda Tangan'}
                        </h3>
                        <p className="mt-0.5 text-[10px] font-medium text-slate-400 uppercase">
                            Tentukan Pihak Penandatangan
                        </p>
                    </div>
                </div>
            );
        }
        if (actionAlias) return <><CheckCircle2 size={18} className="text-primary" /> {actionAlias}</>;
        if (isAssign) return <><UserCheck size={18} className="text-primary" /> Tugaskan & Setujui</>;
        if (contract?.workflow_step?.step === 1) return <><Send size={18} className="text-primary" /> Kirim Persetujuan</>;
        return <><CheckCircle2 size={18} className="text-success" /> Setujui Kontrak</>;
    };

    return (
        <Modal
            isOpen={open}
            onClose={onClose}
            maxWidth={isSigningSetup ? "xl" : "3xl"}
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
                            "flex-1 rounded-xl shadow-lg transition-all",
                            isSigningSetup ? "bg-blue-600 shadow-blue-600/20 hover:bg-blue-700 text-white" : "shadow-primary/20"
                        )}
                    >
                        {loading ? (
                            <Loader2 size={16} className="mr-2 animate-spin" />
                        ) : (
                            <>
                                {isSigningSetup ? <PenTool size={16} className="mr-2" /> : isAssign ? <UserCheck size={16} className="mr-2" /> : contract?.workflow_step?.step === 1 ? <Send size={16} className="mr-2" /> : <CheckCircle2 size={16} className="mr-2" />}
                            </>
                        )}
                        {isSigningSetup ? 'Proses Penugasan' : isAssign ? 'Tugaskan & Setujui' : contract?.workflow_step?.step === 1 ? 'Kirim Sekarang' : 'Konfirmasi Setuju'}
                    </Button>
                </div>
            }
        >
            {isSigningSetup ? (
                <div className="space-y-5 text-left">
                    <p className="text-text-desc text-sm font-medium leading-relaxed">
                        Pilih satu atau beberapa personil yang memiliki otoritas untuk menarik dokumen dari sistem dan memproses penandatanganan (Basah/Digital).
                    </p>

                    {/* --- EXISTING DELEGATES LIST --- */}
                    {(() => {
                        const targetId = activeAction?.assignee_config?.signature_target_step || contract?.workflow_step_id;
                        const currentStepDelegates = (contract?.approvals || []).filter((a: any) => 
                            String(a.workflow_step_id) === String(targetId) && 
                            ['Persetujuan Tambahan', 'Penandatangan'].includes(a.role) &&
                            a.status !== 'rejected'
                        );

                        if (currentStepDelegates.length === 0) return null;

                        return (
                            <div className="space-y-2.5">
                                <div className="text-text-soft flex items-center justify-between text-[10px] font-bold tracking-wider uppercase">
                                    <div className="flex items-center gap-1.5">
                                        <Users size={12} className="text-blue-500" />
                                        Penandatangan Terdaftar
                                    </div>
                                    <span className="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-1.5 py-0.5 rounded">
                                        {currentStepDelegates.length} Orang
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {currentStepDelegates.map((a: any) => (
                                        <div key={a.id} className="group relative flex items-center gap-3 p-2 rounded-xl border border-surface-border bg-surface-muted/20 transition-all hover:border-blue-200">
                                            <div className="h-7 w-7 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-[10px] font-bold text-blue-600 dark:text-blue-400">
                                                {a.approver_name?.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-xs font-bold truncate text-text-main leading-tight">{a.approver_name}</span>
                                                <span className="text-[9px] text-text-soft uppercase tracking-tighter">{a.job_title || a.role}</span>
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
                                                    className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-text-soft hover:text-danger hover:bg-danger/10 transition-all"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="h-px bg-surface-border/50 my-2" />
                            </div>
                        );
                    })()}
                    {/* ------------------------------ */}

                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-text-desc">
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
                                        .map((a: any) => String(a.user_id))
                                );

                                // 2. Kumpulkan semua kandidat (Users, Initiator, PIC)
                                const candidates = new Map();
                                
                                users.forEach(u => candidates.set(String(u.id), { id: String(u.id), name: u.name, role: u.role || 'User' }));
                                if (contract?.initiator?.id) candidates.set(String(contract.initiator.id), { id: String(contract.initiator.id), name: contract.initiator.name, role: contract.initiator.role || 'Initiator' });
                                if (contract?.assigned_pic?.id) candidates.set(String(contract.assigned_pic.id), { id: String(contract.assigned_pic.id), name: contract.assigned_pic.name, role: contract.assigned_pic.role || 'PIC' });

                                // 3. Filter: Hanya tampilkan yang BELUM ada di database (Penandatangan Terdaftar)
                                // KECUALI jika ID tersebut sedang dipilih di UI (signerUserIds), 
                                // maka kita wajib mengembalikannya agar komponen bisa merender LABEL nya (bukan UUID).
                                const baseOptions = Array.from(candidates.values())
                                    .filter(u => !existingUserIds.has(u.id) || signerUserIds.includes(u.id))
                                    .map(u => ({
                                        value: u.id,
                                        label: `${u.name} (${u.role})`
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
                        <label className="text-[11px] font-bold uppercase tracking-wider text-text-desc">
                            Sisipkan Ke Langkah
                        </label>
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
                        <label className="text-[11px] font-bold uppercase tracking-wider text-text-desc">
                            Catatan / Instruksi (Opsional)
                        </label>
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
                    <p className="text-text-desc text-sm font-medium leading-relaxed">
                        {isAssign
                            ? `Harap pilih ${actionAlias || 'Assignee'} yang akan mengerjakan tugas ini.`
                            : contract?.workflow_step?.step === 1
                                ? 'Konfirmasi untuk mengirim draft kontrak ini ke tahap persetujuan berikutnya. Pastikan dokumen sudah lengkap.'
                                : 'Apakah Anda yakin ingin menyetujui kontrak ini? Anda dapat memberikan catatan approval dan lampiran (opsional).'}
                    </p>

                    {isAssign && (
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-text-desc">
                                Pilih {actionAlias || 'Assignee'} <span className="text-danger">*</span>
                            </label>
                            {fetchingUsers ? (
                                <div className="flex items-center gap-2 text-text-desc animate-pulse text-[10px]">
                                    <Loader2 size={10} className="animate-spin" /> Memuat daftar assignee...
                                </div>
                            ) : users.length === 0 ? (
                                <p className="text-[10px] font-medium text-danger">Tidak ada assignee ditemukan.</p>
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
                            <label className="text-[11px] font-bold uppercase tracking-wider text-text-desc">
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
                                            ? 'border-primary bg-primary/[0.03] ring-1 ring-primary/20 shadow-lg shadow-primary/5'
                                            : 'border-surface-border bg-surface-muted/50 hover:bg-surface-muted'
                                    )}
                                >
                                    <div className={cn(
                                        'flex h-10 w-10 items-center justify-center rounded-xl transition-colors',
                                        executionOrder === 'legal_first' ? 'bg-primary text-primary-foreground' : 'bg-surface-muted text-text-desc'
                                    )}>
                                        <Gavel size={18} />
                                    </div>
                                    <span className={cn('text-xs font-bold uppercase tracking-tight', executionOrder === 'legal_first' ? 'text-primary' : 'text-text-desc')}>Legal Dulu</span>
                                    <span className="text-center text-[9px] font-medium leading-tight opacity-50">Legal upload, lalu Inisiator</span>
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setExecutionOrder('initiator_first')}
                                    className={cn(
                                        'flex h-auto flex-col items-center justify-center gap-2 border p-4 transition-all duration-300',
                                        executionOrder === 'initiator_first'
                                            ? 'border-primary bg-primary/[0.03] ring-1 ring-primary/20 shadow-lg shadow-primary/5'
                                            : 'border-surface-border bg-surface-muted/50 hover:bg-surface-muted'
                                    )}
                                >
                                    <div className={cn(
                                        'flex h-10 w-10 items-center justify-center rounded-xl transition-colors',
                                        executionOrder === 'initiator_first' ? 'bg-primary text-primary-foreground' : 'bg-surface-muted text-text-desc'
                                    )}>
                                        <UserPen size={18} />
                                    </div>
                                    <span className={cn('text-xs font-bold uppercase tracking-tight', executionOrder === 'initiator_first' ? 'text-primary' : 'text-text-desc')}>Inisiator Dulu</span>
                                    <span className="text-center text-[9px] font-medium leading-tight opacity-50">Inisiator upload, lalu Legal</span>
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
                        <label className="text-[11px] font-bold uppercase tracking-wider text-text-desc">Lampiran Pendukung (Optional)</label>
                        <div className="mt-1">
                            {!attachment ? (
                                <Button
                                    variant="outline"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-surface-border text-text-desc hover:border-primary hover:text-primary flex h-auto w-full items-center justify-center gap-2 border-2 border-dashed py-6 transition-all hover:bg-surface-muted"
                                >
                                    <Paperclip size={18} className="opacity-40" />
                                    <span className="text-xs font-bold uppercase tracking-wide">Lampirkan File</span>
                                </Button>
                            ) : (
                                <div className="border-surface-border bg-surface-muted flex items-center justify-between rounded-xl border p-4">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="bg-primary/10 rounded-lg p-2">
                                            <Paperclip size={16} className="text-primary" />
                                        </div>
                                        <span className="truncate text-xs font-bold text-text-main">{attachment.name}</span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setAttachment(null)}
                                        className="h-8 w-8 text-text-desc hover:text-danger hover:bg-danger/10"
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
        </Modal>
    );
}
