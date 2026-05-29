import { Button } from '@/components/ui/base/Button';
import { SearchableSelect } from '@/components/ui/forms/SearchableSelect';
import { Modal } from '@/components/ui/overlays/Modal';
import { FormTextarea } from '@/components/ui/forms/FormTextarea';
import { contractApi } from '@/lib/contract-api';
import { Paperclip, Send, UserCheck, X, CheckCircle2, PenTool, Gavel, UserPen, Loader2 } from 'lucide-react';
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
        p1UserId?: string,
        p2UserId?: string,
        actionCode?: string,
    ) => Promise<void>;
    isAssign?: boolean;
    contract: any;
    actionCode?: string;
    actionAlias?: string;
}

export default function ApproveModal({ open, onClose, onSubmit, isAssign, contract, actionCode, actionAlias }: Props) {
    const [note, setNote] = useState('');
    const [attachment, setAttachment] = useState<File | null>(null);
    const [assignedPicId, setAssignedPicId] = useState<string>('');
    const [executionOrder, setExecutionOrder] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState<any[]>([]);
    const [fetchingUsers, setFetchingUsers] = useState(false);
    const [p1UserId, setP1UserId] = useState<string>('');
    const [p2UserId, setP2UserId] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const isSigningSetup =
            contract?.next_step?.step_type === 'SIGNING' &&
            (contract?.metadata?.signing_state?.phase === 'SETUP' || !contract?.metadata?.signing_state);

        if (open && (isAssign || isSigningSetup)) {
            fetchUsers();
        }

        if (open && isSigningSetup) {
            const meta = contract?.next_step?.meta || {};
            // Auto-resolve P1
            if (meta.signing_p1_type === 'initiator') setP1UserId(contract.initiator?.id || '');
            else if (meta.signing_p1_type === 'pic') setP1UserId(contract.assigned_pic?.id || '');

            // Auto-resolve P2
            if (meta.signing_p2_type === 'initiator') setP2UserId(contract.initiator?.id || '');
            else if (meta.signing_p2_type === 'pic') setP2UserId(contract.assigned_pic?.id || '');
        }
    }, [open, isAssign, contract]);

    const fetchUsers = async () => {
        setFetchingUsers(true);
        try {
            const allUsers = await contractApi.getUsers();

            // Filter users based on next step requirements (Department and Roles)
            const requirements = contract.next_step;
            const filtered = allUsers.filter((u) => {
                // Backend returns department_id (singular) for the next step requirement
                const nextDeptId = requirements?.department_id;
                const matchesDept = !nextDeptId || u.department_id === nextDeptId;

                // Backend returns roles as an array of role names
                const nextRoles = requirements?.roles || [];
                const matchesRole = nextRoles.length === 0 || nextRoles.some((r: string) => r.toLowerCase() === u.role?.toLowerCase());

                return matchesDept && matchesRole;
            });

            // Fallback to all Staff if filter returns nothing, but prefer filtered
            if (filtered.length > 0) {
                setUsers(filtered);
            } else {
                setUsers(allUsers.filter((u) => u.role?.toLowerCase() === 'staff'));
            }
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setFetchingUsers(false);
        }
    };

    const handleSubmit = async () => {
        if (isAssign && !assignedPicId) {
            alert('Harap pilih PIC Staff Legal terlebih dahulu.');
            return;
        }

        const isSigningSetup =
            contract?.next_step?.step_type === 'SIGNING' &&
            (contract?.metadata?.signing_state?.phase === 'SETUP' || !contract?.metadata?.signing_state);
        if (isSigningSetup) {
            if (!p1UserId || !p2UserId) {
                alert('Harap tentukan Pihak 1 dan Pihak 2 untuk penandatanganan.');
                return;
            }
            if (p1UserId === p2UserId) {
                alert('Pihak 1 dan Pihak 2 tidak boleh orang yang sama.');
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
                p1UserId || undefined,
                p2UserId || undefined,
                actionCode,
            );
            onClose();
            setNote('');
            setAttachment(null);
            setAssignedPicId('');
            setExecutionOrder('');
            setP1UserId('');
            setP2UserId('');
        } finally {
            setLoading(false);
        }
    };

    const renderTitle = () => {
        if (actionAlias) return <><CheckCircle2 size={18} className="text-primary" /> {actionAlias}</>;
        if (isAssign) return <><UserCheck size={18} className="text-primary" /> Tugaskan & Setujui</>;
        if (contract?.workflow_step?.step === 1) return <><Send size={18} className="text-primary" /> Kirim Persetujuan</>;
        if (contract?.next_step?.step_type === 'SIGNING' && (contract?.metadata?.signing_state?.phase === 'SETUP' || !contract?.metadata?.signing_state)) {
            return <><PenTool size={18} className="text-primary" /> Setup Penandatanganan</>;
        }
        return <><CheckCircle2 size={18} className="text-success" /> Setujui Kontrak</>;
    };

    return (
        <Modal
            isOpen={open}
            onClose={onClose}
            title={renderTitle()}
            footer={
                <div className="flex w-full gap-3">
                    <Button variant="outline" onClick={onClose} disabled={loading} className="flex-1">
                        Batal
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading || (isAssign && !assignedPicId)}
                        className="flex-1"
                    >
                        {loading ? (
                            <Loader2 size={16} className="mr-2 animate-spin" />
                        ) : (
                            <>
                                {isAssign ? <UserCheck size={16} className="mr-2" /> : contract?.workflow_step?.step === 1 ? <Send size={16} className="mr-2" /> : <CheckCircle2 size={16} className="mr-2" />}
                            </>
                        )}
                        {isAssign ? 'Tugaskan & Setujui' : contract?.workflow_step?.step === 1 ? 'Kirim Sekarang' : 'Konfirmasi Setuju'}
                    </Button>
                </div>
            }
        >
            <div className="space-y-6">
                <p className="text-text-desc text-sm font-medium leading-relaxed">
                    {isAssign
                        ? 'Harap pilih PIC Staff Legal yang akan mengerjakan drafting agreement ini.'
                        : contract?.workflow_step?.step === 1
                          ? 'Konfirmasi untuk mengirim draft kontrak ini ke tahap persetujuan berikutnya. Pastikan dokumen sudah lengkap.'
                          : contract?.next_step?.step_type === 'SIGNING' &&
                              (contract?.metadata?.signing_state?.phase === 'SETUP' || !contract?.metadata?.signing_state)
                            ? 'Tentukan siapa yang akan menandatangani dokumen ini (Pihak 1 & Pihak 2).'
                            : 'Apakah Anda yakin ingin menyetujui kontrak ini? Anda dapat memberikan catatan approval dan lampiran (opsional).'}
                </p>

                {isAssign && (
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-text-desc">
                            Pilih PIC Staff Legal <span className="text-danger">*</span>
                        </label>
                        {fetchingUsers ? (
                            <div className="flex items-center gap-2 text-text-desc animate-pulse text-[10px]">
                                <Loader2 size={10} className="animate-spin" /> Memuat daftar staff...
                            </div>
                        ) : users.length === 0 ? (
                            <p className="text-[10px] font-medium text-danger">Tidak ada staff legal ditemukan.</p>
                        ) : (
                            <SearchableSelect
                                value={assignedPicId}
                                onValueChange={setAssignedPicId}
                                options={users.map((u) => ({
                                    value: u.id,
                                    label: `${u.name} (${u.email})`,
                                }))}
                                placeholder="-- Pilih Staff Legal --"
                            />
                        )}
                    </div>
                )}

                {contract?.next_step?.step_type === 'SIGNING' &&
                    (contract?.metadata?.signing_state?.phase === 'SETUP' || !contract?.metadata?.signing_state) && (
                        <div className="space-y-5 rounded-2xl border border-primary/10 bg-primary/5 p-5">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-primary uppercase tracking-wide">
                                    Pihak 1 (Download & Upload Awal) <span className="text-danger">*</span>
                                </label>
                                <SearchableSelect
                                    value={p1UserId}
                                    onValueChange={setP1UserId}
                                    options={users.map((u) => ({
                                        value: u.id,
                                        label: `${u.name} (${u.email})`,
                                    }))}
                                    placeholder="-- Pilih Pihak 1 --"
                                />
                                <p className="text-text-desc text-[9px] italic font-medium">Biasanya Inisiator atau Vendor (PIC Request).</p>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-primary uppercase tracking-wide">
                                    Pihak 2 (Download TTD P1 & Finalisasi) <span className="text-danger">*</span>
                                </label>
                                <SearchableSelect
                                    value={p2UserId}
                                    onValueChange={setP2UserId}
                                    options={users.map((u) => ({
                                        value: u.id,
                                        label: `${u.name} (${u.email})`,
                                    }))}
                                    placeholder="-- Pilih Pihak 2 --"
                                />
                                <p className="text-text-desc text-[9px] italic font-medium">Biasanya Direksi atau Management.</p>
                            </div>
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
        </Modal>
    );
}
