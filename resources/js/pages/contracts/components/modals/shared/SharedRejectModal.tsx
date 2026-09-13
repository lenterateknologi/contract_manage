import { Button } from '@/components/ui/buttons/Button';
import { FormTextarea } from '@/components/ui/inputs/FormTextarea';
import { Modal } from '@/components/ui/dialogs/Modal';
import { getFileIcon, AttachmentCategoryBadge } from '@/components/ui';
import { contractApi } from '@/pages/contracts/utils';
import { cn } from '@/lib/utils';
import { formatFileSize } from '@/lib/formatters';
import { AlertCircle, Loader2, Paperclip, Plus, X, XCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface Props {
    open: boolean;
    onClose: () => void;
    onSubmit: (reason: string, attachment?: File | File[]) => Promise<void>;
    actionAlias?: string;
    actionId?: string;
    contract?: any;
}

export function SharedRejectModal({ open, onClose, onSubmit, actionAlias, actionId, contract }: Props) {
    const [reason, setReason] = useState('');
    const [attachments, setAttachments] = useState<File[]>([]);
    const [loading, setLoading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [allWorkflows, setAllWorkflows] = useState<any[]>([]);

    const handleFileDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            setAttachments((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
        }
    };

    useEffect(() => {
        if (open) {
            contractApi.getWorkflows().then(setAllWorkflows).catch(console.error);
            setReason('');
            setAttachments([]);
        }
    }, [open]);

    const getTransitionPreview = () => {
        if (!contract) return null;

        const rejectAction = actionId
            ? contract?.workflow_step?.actions?.find((a: any) => a.id === actionId)
            : contract?.workflow_step?.actions?.find((a: any) => a.action_code === 'reject');
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
                const isOrigin = workflow_id === 'origin_workflow' || workflow_id === 'origin' || workflow_id === contract.origin_workflow_id;
                const returnMode = transition.return_mode;
                const targetWfId = isOrigin ? (contract.origin_workflow_id || contract.workflow_id) : workflow_id;
                const targetWf = allWorkflows.find((w: any) => String(w.id) === String(targetWfId));
                const wfName = targetWf?.name || (isOrigin ? 'Alur Kerja Utama' : 'Alur Kerja Target');

                let stepLabel = `Tahap ${sequence || 1}`;
                if (isOrigin) {
                    if (returnMode === 'branch_origin' || returnMode === 'origin_step') {
                        stepLabel = 'Kembali ke Tahap Semula di Alur Utama';
                    } else if (returnMode === 'branch_next') {
                        stepLabel = 'Lanjut ke Tahap Berikutnya di Alur Utama';
                    } else if (sequence) {
                        stepLabel = `Tahap ${sequence} di Alur Utama`;
                    } else {
                        stepLabel = 'Kembali ke Alur Utama';
                    }
                } else {
                    const targetStep = targetWf?.steps?.find((s: any) => Number(s.step) === Number(sequence));
                    if (targetStep) {
                        stepLabel = `Tahap ${targetStep.step} - ${targetStep.description || targetStep.label || 'Tanpa Keterangan'}`;
                    }
                }

                return {
                    label: isOrigin ? 'Kembali ke Alur Kerja Utama' : `Pindah ke Alur Kerja: ${wfName}`,
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
            await onSubmit(
                reason,
                attachments.length === 0 ? undefined : attachments.length === 1 ? attachments[0] : attachments,
            );
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
            headerVariant="danger"
            headerIcon={<XCircle size={18} className="text-white" />}
            title={actionAlias || 'Tolak Kontrak'}
            description="Berikan catatan atau alasan penolakan kontrak"
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
                        variant="destructive"
                        onClick={handleSubmit}
                        disabled={loading || !reason.trim()}
                        className="min-w-[140px] h-9 text-xs text-white"
                    >
                        {loading ? <Loader2 size={15} className="mr-1.5 animate-spin" /> : <XCircle size={15} className="mr-1.5" />}
                        Konfirmasi Penolakan
                    </Button>
                </div>
            }
        >
            <div className="space-y-3.5 pt-1">
                {preview && (
                    <div className="rounded-lg border border-rose-100 bg-rose-50/50 p-2.5 text-left dark:border-rose-950/30 dark:bg-rose-950/10">
                        <div className="flex items-center gap-2 text-[10px] font-extrabold tracking-wider text-rose-700 dark:text-rose-400 uppercase">
                            <AlertCircle size={12} />
                            Proyeksi Mundur Alur Kerja
                        </div>
                        <div className="mt-1 flex flex-col gap-0.5">
                            <span className="text-[9px] font-medium text-slate-400 uppercase">{preview.label}</span>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{preview.target}</span>
                        </div>
                    </div>
                )}

                <p className="text-text-desc text-xs leading-relaxed font-normal">
                    Mohon jelaskan alasan penolakan kontrak ini agar pihak inisiator dapat melakukan perbaikan yang diperlukan.
                </p>

                <FormTextarea
                    label="Alasan Penolakan"
                    labelClassName="font-extrabold text-[10.5px] uppercase"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    placeholder="Jelaskan alasan penolakan secara detail..."
                    required
                />

                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <label className="text-slate-700 dark:text-zinc-200 text-[10.5px] font-extrabold uppercase">Lampiran Berkas Pendukung (Opsional)</label>
                        {attachments.length > 0 && (
                            <span className="text-[10px] font-bold text-danger">
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
                                    "border-surface-border text-text-desc hover:border-danger hover:text-danger hover:bg-danger/5 flex h-auto w-full flex-col items-center justify-center gap-1.5 border-2 border-dashed py-5 transition-all rounded-lg cursor-pointer",
                                    isDragging && "border-danger bg-danger/10 scale-[0.99]"
                                )}
                            >
                                <div className="flex items-center gap-2">
                                    <Paperclip size={16} className="opacity-60" />
                                    <span className="text-xs font-bold tracking-wide uppercase">Pilih / Drag & Drop Berkas</span>
                                </div>
                                <span className="text-[10px] text-muted-foreground font-normal">Mendukung format PDF, Gambar, Dokumen, dan Spreadsheet</span>
                            </div>
                        ) : (
                            <div className="space-y-1.5">
                                {attachments.map((file, idx) => (
                                    <div key={idx} className="border-surface-border bg-surface-muted/70 flex items-center justify-between rounded-lg border px-3 py-2">
                                        <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
                                            {getFileIcon(file.name)}
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-text-main truncate text-xs font-bold">{file.name}</span>
                                                <span className="text-text-desc text-[10px] font-medium">{formatFileSize(file.size)}</span>
                                            </div>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                                            className="text-text-desc hover:text-danger hover:bg-danger/10 h-7 w-7 shrink-0"
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
                                        "w-full text-xs font-semibold flex items-center justify-center gap-1.5 border border-dashed border-danger/40 text-danger hover:bg-danger/5 h-8 mt-1 rounded-md cursor-pointer transition-all",
                                        isDragging && "bg-danger/15 border-danger"
                                    )}
                                >
                                    <Plus size={14} />
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
