import { Button } from '@/components/ui/base/Button';
import { FormTextarea } from '@/components/ui/forms/FormTextarea';
import { Modal } from '@/components/ui/overlays/Modal';
import { contractApi } from '@/lib/contract-api';
import { cn } from '@/lib/utils';
import { AlertCircle, Loader2, Paperclip, X, XCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface Props {
    open: boolean;
    onClose: () => void;
    onSubmit: (reason: string, attachment?: File) => Promise<void>;
    actionAlias?: string;
    contract?: any;
}

export function SharedRejectModal({ open, onClose, onSubmit, actionAlias, contract }: Props) {
    const [reason, setReason] = useState('');
    const [attachment, setAttachment] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [allWorkflows, setAllWorkflows] = useState<any[]>([]);

    useEffect(() => {
        if (open) {
            contractApi.getWorkflows().then(setAllWorkflows).catch(console.error);
            setReason('');
            setAttachment(null);
        }
    }, [open]);

    const getTransitionPreview = () => {
        if (!contract) return null;

        const rejectAction = contract?.workflow_step?.actions?.find((a: any) => a.action_code === 'reject');
        let transition = rejectAction?.transition_config;

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
                const offNum = Number(offset ?? -1);
                if (offNum === 0) {
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
                    const nextStep = steps.find((s: any) => Number(s.step) === targetSeq);
                    return {
                        label: `Maju ${offNum} Langkah (Offset +${offNum})`,
                        target: formatStepInfo(nextStep)
                    };
                }
            } else if (type === 'absolute') {
                const targetSeq = Number(sequence ?? 1);
                const targetStep = steps.find((s: any) => Number(s.step) === targetSeq);
                return {
                    label: `Kembali ke Tahap Spesifik (Tahap ${targetSeq})`,
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

        const step1 = steps.find((s: any) => Number(s.step) === 1);
        return {
            label: 'Kembali untuk Revisi (Default Reject)',
            target: formatStepInfo(step1)
        };
    };

    const preview = getTransitionPreview();

    const handleSubmit = async () => {
        if (!reason.trim()) return;
        setLoading(true);
        try {
            await onSubmit(reason, attachment || undefined);
            onClose();
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={open}
            onClose={onClose}
            maxWidth="2xl"
            title={
                <div className="flex items-center gap-3">
                    <div className="bg-danger/10 text-danger flex h-10 w-10 items-center justify-center rounded-2xl shadow-inner">
                        <XCircle size={20} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-900 uppercase dark:text-white">
                            {actionAlias || 'Tolak Kontrak'}
                        </h3>
                        <p className="mt-0.5 text-[10px] font-medium text-slate-400 uppercase">Berikan alasan penolakan</p>
                    </div>
                </div>
            }
            footer={
                <div className="flex w-full gap-3">
                    <Button variant="outline" onClick={onClose} disabled={loading} className="flex-1 rounded-xl">
                        Batal
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleSubmit}
                        disabled={loading || !reason.trim()}
                        className="shadow-destructive/20 flex-1 rounded-xl shadow-lg"
                    >
                        {loading ? <Loader2 size={16} className="mr-2 animate-spin" /> : <XCircle size={16} className="mr-2" />}
                        Konfirmasi Penolakan
                    </Button>
                </div>
            }
        >
            <div className="space-y-6">
                {preview && (
                    <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-3.5 text-left dark:border-rose-950/30 dark:bg-rose-950/10">
                        <div className="flex items-center gap-2 text-[10px] font-extrabold tracking-wider text-rose-700 dark:text-rose-400 uppercase">
                            <AlertCircle size={12} />
                            Proyeksi Mundur Alur Kerja
                        </div>
                        <div className="mt-1.5 flex flex-col gap-0.5">
                            <span className="text-[9px] font-medium text-slate-400 uppercase">{preview.label}</span>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{preview.target}</span>
                        </div>
                    </div>
                )}

                <p className="text-text-desc text-sm leading-relaxed font-medium">
                    Mohon jelaskan alasan penolakan kontrak ini agar pihak inisiator dapat melakukan perbaikan yang diperlukan.
                </p>

                <FormTextarea
                    label="Alasan Penolakan"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={4}
                    placeholder="Jelaskan alasan penolakan secara detail..."
                    required
                />

                <div className="space-y-1.5">
                    <label className="text-text-desc text-[11px] font-bold uppercase">Lampiran Pendukung (Optional)</label>
                    <div className="mt-1">
                        {!attachment ? (
                            <Button
                                variant="outline"
                                onClick={() => fileInputRef.current?.click()}
                                className="border-surface-border text-text-desc hover:border-danger hover:text-danger hover:bg-danger/5 flex h-auto w-full items-center justify-center gap-2 border-2 border-dashed py-6 transition-all"
                            >
                                <Paperclip size={18} className="opacity-40" />
                                <span className="text-xs font-bold tracking-wide uppercase">Lampirkan File</span>
                            </Button>
                        ) : (
                            <div className="border-surface-border bg-surface-muted flex items-center justify-between rounded-xl border p-4">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="bg-danger/10 rounded-lg p-2">
                                        <Paperclip size={16} className="text-danger" />
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
        </Modal>
    );
}
