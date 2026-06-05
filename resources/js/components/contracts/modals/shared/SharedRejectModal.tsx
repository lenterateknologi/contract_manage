import { contractApi } from '@/lib/contract-api';
import { Paperclip, X } from 'lucide-react';
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

    if (!open) return null;

    const handleSubmit = async () => {
        if (!reason.trim()) return;
        setLoading(true);
        try {
            await onSubmit(reason, attachment || undefined);
            onClose();
            setReason('');
            setAttachment(null);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div
                className="dark:bg-sidebar w-[800px] max-w-[95vw] rounded-xl border border-black/10 bg-white shadow-2xl dark:border-white/10"
                style={{ animation: 'modal-in .18s ease' }}
            >
                <div className="flex items-center justify-between border-b border-black/5 px-5 py-4 dark:border-white/5">
                    <h6 className="flex items-center gap-2 text-[14px] font-semibold tracking-tight text-black uppercase dark:text-white">
                        <i className="fa-solid fa-circle-xmark text-[13px]" /> {actionAlias || 'Tolak Kontrak'}
                    </h6>
                    <button
                        onClick={onClose}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-[13px] text-black/40 hover:bg-black/5 dark:text-white/40 dark:hover:bg-white/5"
                    >
                        <i className="fa-solid fa-xmark" />
                    </button>
                </div>
                <div className="space-y-4 p-5">
                    {preview && (
                        <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-3.5 text-left dark:border-rose-950/30 dark:bg-rose-950/10">
                            <div className="flex items-center gap-2 text-[10px] font-extrabold tracking-wider text-rose-700 dark:text-rose-400 uppercase">
                                <span className="relative flex h-2 w-2">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"></span>
                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500"></span>
                                </span>
                                Proyeksi Mundur Alur Kerja
                            </div>
                            <div className="mt-1.5 flex flex-col gap-0.5">
                                <span className="text-[9px] font-medium text-slate-400 uppercase">{preview.label}</span>
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{preview.target}</span>
                            </div>
                        </div>
                    )}

                    <div className="space-y-1">
                        <p className="mb-3 text-[12px] font-medium tracking-tight text-black/50 uppercase dark:text-white/50">
                            Berikan alasan penolakan agar initiator dapat melakukan revisi.
                        </p>
                        <label className="mb-1 block text-[11px] font-bold text-black/40 uppercase dark:text-white/40">Alasan Penolakan *</label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={3}
                            placeholder="Jelaskan alasan penolakan..."
                            className="w-full resize-none rounded-lg border border-black/10 bg-black/[0.02] px-3 py-2 text-[12px] text-black shadow-inner transition-all outline-none placeholder:text-black/20 focus:border-black dark:border-white/10 dark:bg-white/[0.02] dark:text-white dark:placeholder:text-white/20 dark:focus:border-white"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="mb-1 block text-[11px] font-bold text-black/40 uppercase dark:text-white/40">
                            Lampiran Pendukung (Optional)
                        </label>
                        <div className="mt-1">
                            {!attachment ? (
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-black/10 py-4 text-black/40 transition-all hover:border-black hover:text-black dark:border-white/10 dark:text-white/40 dark:hover:border-white dark:hover:text-white"
                                >
                                    <Paperclip size={14} />
                                    <span className="text-[10px] font-bold uppercase">Lampirkan File</span>
                                </button>
                            ) : (
                                <div className="flex items-center justify-between rounded-lg border border-black/10 bg-black/[0.02] p-3 dark:border-white/10 dark:bg-white/[0.02]">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <Paperclip size={12} className="shrink-0 text-black/40 dark:text-white/40" />
                                        <span className="truncate text-[10px] font-bold text-black dark:text-white">{attachment.name}</span>
                                    </div>
                                    <button
                                        onClick={() => setAttachment(null)}
                                        className="text-black/40 transition-colors hover:text-rose-500 dark:text-white/40"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            )}
                            <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => setAttachment(e.target.files?.[0] || null)} />
                        </div>
                    </div>
                </div>
                <div className="flex justify-end gap-2 border-t border-black/5 bg-black/[0.01] px-5 py-3 dark:border-white/5 dark:bg-white/[0.01]">
                    <button
                        onClick={onClose}
                        className="rounded-lg px-4 py-2 text-[11px] font-bold text-black/40 uppercase transition-all hover:text-black dark:text-white/40 dark:hover:text-white"
                    >
                        Batal
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !reason.trim()}
                        className="flex items-center gap-1.5 rounded-lg bg-black px-5 py-2 text-[11px] font-semibold tracking-[0.2em] text-white uppercase shadow-lg transition-all active:scale-95 disabled:opacity-30 dark:bg-white dark:text-black"
                    >
                        <i className="fa-solid fa-xmark text-[11px]" />{' '}
                        {loading ? 'Mengirim...' : actionAlias ? `Konfirmasi ${actionAlias}` : 'Konfirmasi Tolak'}
                    </button>
                </div>
            </div>
        </div>
    );
}
