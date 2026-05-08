import { useState, useRef, useEffect } from 'react';
import { SearchableSelect } from '@/components/ui/forms/SearchableSelect';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/overlays/Dialog';
import { Button } from '@/components/ui/base/Button';
import { Paperclip, X, UserCheck, Send } from 'lucide-react';
import { contractApi } from '@/lib/contract-api';

interface Props {
    open: boolean;
    onClose: () => void;
    onSubmit: (note: string, attachment?: File, assignedPicId?: string, executionOrder?: string, p1UserId?: string, p2UserId?: string) => Promise<void>;
    isAssign?: boolean;
    contract: any;
}

export default function ApproveModal({ open, onClose, onSubmit, isAssign, contract }: Props) {
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
        const isSigningSetup = contract?.next_step?.step_type === 'SIGNING' && (contract?.metadata?.signing_state?.phase === 'SETUP' || !contract?.metadata?.signing_state);
        
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
            const filtered = allUsers.filter(u => {
                // Backend returns department_id (singular) for the next step requirement
                const nextDeptId = requirements?.department_id;
                const matchesDept = !nextDeptId || u.department_id === nextDeptId;
                
                // Backend returns roles as an array of role names
                const nextRoles = requirements?.roles || [];
                const matchesRole = nextRoles.length === 0 || 
                                   nextRoles.some((r: string) => r.toLowerCase() === u.role?.toLowerCase());
                
                return matchesDept && matchesRole;
            });
            
            // Fallback to all Staff if filter returns nothing, but prefer filtered
            if (filtered.length > 0) {
                setUsers(filtered);
            } else {
                setUsers(allUsers.filter(u => u.role?.toLowerCase() === 'staff'));
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

        const isSigningSetup = contract?.next_step?.step_type === 'SIGNING' && (contract?.metadata?.signing_state?.phase === 'SETUP' || !contract?.metadata?.signing_state);
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
            await onSubmit(note, attachment || undefined, assignedPicId || undefined, executionOrder || undefined, p1UserId || undefined, p2UserId || undefined);
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

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {isAssign ? (
                            <><UserCheck className="text-blue-500" /> Tugaskan & Setujui</>
                        ) : contract?.workflow_step?.step === 1 ? (
                            <><Send className="text-blue-500" /> Kirim Persetujuan</>
                        ) : contract?.next_step?.step_type === 'SIGNING' && (contract?.metadata?.signing_state?.phase === 'SETUP' || !contract?.metadata?.signing_state) ? (
                            <><i className="fa-solid fa-pen-nib text-blue-500" /> Setup Penandatanganan</>
                        ) : (
                            <><i className="fa-solid fa-circle-check text-emerald-500" /> Setujui Kontrak</>
                        )}
                    </DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <p className="text-sm text-muted-foreground">
                        {isAssign 
                            ? 'Harap pilih PIC Staff Legal yang akan mengerjakan drafting agreement ini.'
                            : contract?.workflow_step?.step === 1
                            ? 'Konfirmasi untuk mengirim draft kontrak ini ke tahap persetujuan berikutnya. Pastikan dokumen sudah lengkap.'
                            : contract?.next_step?.step_type === 'SIGNING' && (contract?.metadata?.signing_state?.phase === 'SETUP' || !contract?.metadata?.signing_state)
                            ? 'Tentukan siapa yang akan menandatangani dokumen ini (Pihak 1 & Pihak 2).'
                            : 'Apakah Anda yakin ingin menyetujui kontrak ini? Anda dapat memberikan catatan approval dan lampiran (opsional).'}
                    </p>

                    {isAssign && (
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                Pilih PIC Staff Legal <span className="text-rose-500">*</span>
                            </label>
                            {fetchingUsers ? (
                                <p className="text-[10px] text-muted-foreground animate-pulse">Memuat daftar staff...</p>
                            ) : users.length === 0 ? (
                                <p className="text-[10px] text-rose-500 font-medium">Tidak ada staff legal ditemukan.</p>
                            ) : (
                                <SearchableSelect
                                    value={assignedPicId}
                                    onValueChange={setAssignedPicId}
                                    options={users.map(u => ({
                                        value: u.id,
                                        label: `${u.name} (${u.email})`
                                    }))}
                                    placeholder="-- Pilih Staff Legal --"
                                />
                            )}

                        </div>
                    )}

                    {contract?.next_step?.step_type === 'SIGNING' && (contract?.metadata?.signing_state?.phase === 'SETUP' || !contract?.metadata?.signing_state) && (
                        <div className="space-y-4 rounded-xl border border-blue-100 bg-blue-50/30 p-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">
                                    Pihak 1 (Download & Upload Awal) <span className="text-rose-500">*</span>
                                </label>
                                <SearchableSelect
                                    value={p1UserId}
                                    onValueChange={setP1UserId}
                                    options={users.map(u => ({
                                        value: u.id,
                                        label: `${u.name} (${u.email})`
                                    }))}
                                    placeholder="-- Pilih Pihak 1 --"
                                />
                                <p className="text-[9px] text-muted-foreground italic">Biasanya Inisiator atau Vendor (PIC Request).</p>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">
                                    Pihak 2 (Download TTD P1 & Finalisasi) <span className="text-rose-500">*</span>
                                </label>
                                <SearchableSelect
                                    value={p2UserId}
                                    onValueChange={setP2UserId}
                                    options={users.map(u => ({
                                        value: u.id,
                                        label: `${u.name} (${u.email})`
                                    }))}
                                    placeholder="-- Pilih Pihak 2 --"
                                />
                                <p className="text-[9px] text-muted-foreground italic">Biasanya Direksi atau Management.</p>
                            </div>
                        </div>
                    )}

                    {contract?.next_step?.step_category === 'joint_upload' && !contract?.metadata?.step_12_order && (
                        <div className="space-y-2 pb-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                Urutan Penyelesaian <span className="text-rose-500">*</span>
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setExecutionOrder('legal_first')}
                                    className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-4 transition-all duration-200 ${
                                        executionOrder === 'legal_first' 
                                            ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/20 shadow-lg shadow-primary/5' 
                                            : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:border-muted-foreground/30'
                                    }`}
                                >
                                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${executionOrder === 'legal_first' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                                        <i className="fa-solid fa-gavel text-xs" />
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-tight">Legal Dulu</span>
                                    <span className="text-[10px] opacity-60 leading-tight text-center">Legal upload, lalu Inisiator</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setExecutionOrder('initiator_first')}
                                    className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-4 transition-all duration-200 ${
                                        executionOrder === 'initiator_first' 
                                            ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/20 shadow-lg shadow-primary/5' 
                                            : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:border-muted-foreground/30'
                                    }`}
                                >
                                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${executionOrder === 'initiator_first' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                                        <i className="fa-solid fa-user-pen text-xs" />
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-tight">Inisiator Dulu</span>
                                    <span className="text-[10px] opacity-60 leading-tight text-center">Inisiator upload, lalu Legal</span>
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                            Catatan Approval {isAssign && '(Optional)'}
                        </label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            rows={3}
                            placeholder={isAssign ? "Tambahkan instruksi penugasan (opsional)..." : "Tambahkan catatan approval..."}
                            className="w-full resize-none rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-foreground outline-none focus:border-primary transition-all"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                            Lampiran Pendukung (Optional)
                        </label>
                        <div className="mt-1">
                            {!attachment ? (
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border py-4 text-muted-foreground transition-all hover:border-primary hover:text-primary"
                                >
                                    <Paperclip size={16} />
                                    <span className="text-xs font-medium">Klik untuk lampirkan file</span>
                                </button>
                            ) : (
                                <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <Paperclip size={14} className="text-primary shrink-0" />
                                        <span className="truncate text-xs font-medium">{attachment.name}</span>
                                    </div>
                                    <button
                                        onClick={() => setAttachment(null)}
                                        className="text-muted-foreground hover:text-rose-500 transition-colors"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            )}
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                onChange={(e) => setAttachment(e.target.files?.[0] || null)}
                            />
                        </div>
                    </div>
                </div>
                <DialogFooter className="flex gap-2">
                    <Button variant="outline" onClick={onClose} disabled={loading} className="flex-1">
                        Batal
                    </Button>
                    <Button variant={isAssign ? "primary" : "primary"} onClick={handleSubmit} disabled={loading || (isAssign && !assignedPicId)} className="flex-1">
                        {loading ? <i className="fa-solid fa-spinner fa-spin mr-2" /> : <i className={`fa-solid ${isAssign ? 'fa-user-check' : (contract?.workflow_step?.step === 1 ? 'fa-paper-plane' : 'fa-check')} mr-2`} />}
                        {isAssign ? 'Tugaskan & Setujui' : (contract?.workflow_step?.step === 1 ? 'Kirim Sekarang' : 'Konfirmasi Setuju')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
