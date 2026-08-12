import { Button } from '@/components/ui/buttons/Button';
import { FormTextarea } from '@/components/ui/inputs/FormTextarea';
import { Modal } from '@/components/ui/dialogs/Modal';
import { contractApi } from '@/pages/contracts/utils';
import { cn } from '@/lib/utils';
import { matchUserAgainstWorkflowPool } from '@/pages/workflows/workflow-filter';
import { CheckCircle2, Gavel, Loader2, Paperclip, Send, UserPen, X } from 'lucide-react';
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
    contract: any;
    onUpdate: (c: any) => void;
    actionCode?: string;
    actionAlias?: string;
    users?: any[];
}

export function SharedApproveModal({ open, onClose, onSubmit, contract, onUpdate, actionCode, actionAlias, users: initialUsers }: Props) {
    const [note, setNote] = useState('');
    const [attachment, setAttachment] = useState<File | null>(null);
    const [executionOrder, setExecutionOrder] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState<any[]>(initialUsers || []);
    const [fetchingUsers, setFetchingUsers] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [allWorkflows, setAllWorkflows] = useState<any[]>([]);

    useEffect(() => {
        if (open) {
            contractApi.getWorkflows().then(setAllWorkflows).catch(console.error);
            fetchUsers();
            setNote('');
            setAttachment(null);
            setExecutionOrder('');
        }
    }, [open]);

    const activeAction = contract?.workflow_step?.actions?.find((a: any) => a.action_code === actionCode);

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

    const fetchUsers = async () => {
        if (initialUsers && initialUsers.length > 0) return;

        setFetchingUsers(true);
        try {
            const allUsers = await contractApi.getUsers({ all: true });
            const config = activeAction?.assignee_config || contract.next_step;

            const filtered = allUsers.filter((u: any) => {
                if (!u.is_active) return false;
                return matchUserAgainstWorkflowPool(u, config, contract);
            });

            if (filtered.length > 0) {
                setUsers(filtered);
            } else {
                setUsers(allUsers.filter((u: any) => u.is_active));
            }
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setFetchingUsers(false);
        }
    };

    const handleSubmit = async () => {
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
                undefined, // assignedPicId
                executionOrder || undefined,
                undefined, // signerUserIds
                actionCode,
                undefined, // isFinal
                undefined, // targetStepId
            );
            onClose();
        } finally {
            setLoading(false);
        }
    };

    const titleText = actionAlias || (contract?.workflow_step?.step === 1 ? 'Kirim Persetujuan' : 'Setujui Kontrak');
    const subtitleText = contract?.workflow_step?.step === 1 
        ? 'Konfirmasi untuk mengirim draft kontrak ke tahap persetujuan berikutnya'
        : 'Berikan persetujuan atau catatan untuk memproses tahap kontrak ini';

    return (
        <Modal
            isOpen={open}
            onClose={onClose}
            maxWidth="2xl"
            headerVariant="default"
            headerIcon={
                contract?.workflow_step?.step === 1 ? (
                    <Send size={18} className="text-white" />
                ) : (
                    <CheckCircle2 size={18} className="text-white" />
                )
            }
            title={titleText}
            description={subtitleText}
            footer={
                <div className="flex w-full justify-end gap-2.5">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        disabled={loading}
                        className="h-9 text-xs bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-800/50 font-semibold"
                    >
                        Batal
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="min-w-[140px] h-9 text-xs"
                    >
                        {loading ? (
                            <Loader2 size={15} className="mr-1.5 animate-spin" />
                        ) : (
                            <>
                                {contract?.workflow_step?.step === 1 ? (
                                    <Send size={15} className="mr-1.5" />
                                ) : (
                                    <CheckCircle2 size={15} className="mr-1.5" />
                                )}
                            </>
                        )}
                        {contract?.workflow_step?.step === 1 ? 'Kirim Sekarang' : 'Konfirmasi Setuju'}
                    </Button>
                </div>
            }
        >
            <div className="space-y-3.5 pt-1">
                {preview && (
                    <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-2.5 text-left dark:border-slate-800 dark:bg-slate-900/40">
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[9px] font-medium text-slate-400 uppercase">{preview.label}</span>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{preview.target}</span>
                        </div>
                    </div>
                )}

                <div className="space-y-6">
                    <p className="text-text-desc text-sm leading-relaxed font-medium">
                        {contract?.workflow_step?.step === 1
                            ? 'Konfirmasi untuk mengirim draft kontrak ini ke tahap persetujuan berikutnya. Pastikan dokumen sudah lengkap.'
                            : 'Apakah Anda yakin ingin menyetujui kontrak ini? Anda dapat memberikan catatan approval dan lampiran (opsional).'}
                    </p>

                    {contract?.next_step?.step_category === 'joint_upload' && !contract?.metadata?.step_12_order && (
                        <div className="space-y-3">
                            <label className="text-text-desc text-[11px] font-bold uppercase">
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
                                                : 'bg-surface-muted text-text-soft',
                                        )}
                                    >
                                        <Gavel size={18} />
                                    </div>
                                    <span
                                        className={cn(
                                            'text-xs font-bold tracking-tight uppercase',
                                            executionOrder === 'legal_first' ? 'text-primary' : 'text-text-main',
                                        )}
                                    >
                                        Reviewer Dulu
                                    </span>
                                    <span className="text-center text-[9px] leading-tight font-medium opacity-50">Reviewer upload, lalu Inisiator</span>
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
                                                : 'bg-surface-muted text-text-soft',
                                        )}
                                    >
                                        <UserPen size={18} />
                                    </div>
                                    <span
                                        className={cn(
                                            'text-xs font-bold tracking-tight uppercase',
                                            executionOrder === 'initiator_first' ? 'text-primary' : 'text-text-main',
                                        )}
                                    >
                                        Inisiator Dulu
                                    </span>
                                    <span className="text-center text-[9px] leading-tight font-medium opacity-50">Inisiator upload, lalu Reviewer</span>
                                </Button>
                            </div>
                        </div>
                    )}

                    <FormTextarea
                        label="Catatan Approval"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={3}
                        placeholder="Tambahkan catatan approval..."
                    />

                    <div className="space-y-1.5">
                        <label className="text-text-desc text-[11px] font-bold uppercase">Lampiran Pendukung (Optional)</label>
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
            </div>
        </Modal>
    );
}
