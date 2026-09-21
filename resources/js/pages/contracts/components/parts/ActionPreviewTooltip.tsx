import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/feedback/Tooltip';
import { Contract } from '@/pages/contracts/types';
import { ArrowRight } from 'lucide-react';
import React from 'react';

export interface TransitionPreviewInfo {
    label: string;
    targetStepText: string;
    targetStatus?: string;
    description?: string;
}

export function getActionTransitionPreview(
    action: any,
    contract?: Contract,
    options?: {
        isSubStep?: boolean;
        actionCode?: string;
        isSigner?: boolean;
    }
): TransitionPreviewInfo | null {
    if (!contract) return null;

    const currentStep = contract.workflow_step;
    const currentStepSeq = Number(currentStep?.step || 1);
    const steps = contract.workflow?.steps || [];

    const formatStepInfo = (stepObj: any) => {
        if (!stepObj) return 'Selesai / Disetujui (Langkah Terakhir)';
        const desc = stepObj.description || stepObj.label || stepObj.step_name;
        return `Tahap ${stepObj.step}${desc ? ` - ${desc}` : ''}`;
    };

    // 1. Sub-step review actions (when no explicit custom action passed or fallback)
    if (options?.isSubStep && (!action || !action.transition_config)) {
        const code = (options?.actionCode || action?.action_code || 'approve').toLowerCase();
        if (code === 'reject') {
            return {
                label: 'Tolak / Kembalikan Penelaahan',
                targetStepText: `Tetap di Tahap ${currentStepSeq} (Catatan penolakan akan dicatat)`,
            };
        }

        // Find if there is a next sub-step
        const pendingApprovals = contract.approvals?.filter((a: any) => a.workflow_step_id === currentStep?.id && a.sub_step != null) || [];
        const currentPending = pendingApprovals.find((a: any) => a.status === 'pending');
        const nextSubStep = pendingApprovals.find((a: any) => a.status === 'waiting' && Number(a.sub_step) > Number(currentPending?.sub_step || 0));

        if (nextSubStep) {
            return {
                label: 'Lanjut ke Penyetuju Tambahan Berikutnya',
                targetStepText: `Sub-Tahap ${currentStepSeq}.${nextSubStep.sub_step} (${nextSubStep.approver?.name || nextSubStep.approver_name || 'Penelaah Berikutnya'})`,
            };
        }

        // Last sub-step -> transitions to main approver of current step
        const mainApprover = contract.approvals?.find((a: any) => a.workflow_step_id === currentStep?.id && a.sub_step == null);
        return {
            label: 'Selesai Penelaahan Tambahan',
            targetStepText: `Buka Tahap Utama ${currentStepSeq} (${mainApprover?.role || currentStep?.description || 'Penyetuju Utama'})`,
        };
    }

    // 2. Signer actions
    if (options?.isSigner) {
        const nextStep = steps.find((s: any) => Number(s.step) > currentStepSeq);
        return {
            label: 'Unggah TTD & Selesaikan Tahap',
            targetStepText: formatStepInfo(nextStep),
        };
    }

    const code = (action?.action_code || options?.actionCode || '').toLowerCase();
    const transition = action?.transition_config;

    // 3. Custom / structured transition
    if (transition && typeof transition === 'object') {
        const { type, offset, sequence, workflow_id } = transition;
        if (type === 'relative') {
            const offNum = Number(offset ?? 1);
            if (offNum === 1) {
                const nextStep = steps.find((s: any) => Number(s.step) > currentStepSeq);
                return {
                    label: 'Maju ke Langkah Berikutnya (+1)',
                    targetStepText: formatStepInfo(nextStep),
                    targetStatus: action?.target_status,
                };
            } else if (offNum === 0) {
                return {
                    label: 'Tetap di Tahap Ini (Stay / Offset 0)',
                    targetStepText: formatStepInfo(currentStep),
                    targetStatus: action?.target_status,
                };
            } else if (offNum < 0) {
                const targetSeq = Math.max(1, currentStepSeq + offNum);
                const prevStep = steps.find((s: any) => Number(s.step) === targetSeq) || steps.find((s: any) => Number(s.step) < currentStepSeq);
                return {
                    label: `Mundur ${Math.abs(offNum)} Langkah (Offset ${offNum})`,
                    targetStepText: formatStepInfo(prevStep),
                    targetStatus: action?.target_status,
                };
            } else {
                const targetSeq = currentStepSeq + offNum;
                const nextStep = steps.find((s: any) => Number(s.step) === targetSeq) || steps.find((s: any) => Number(s.step) > currentStepSeq);
                return {
                    label: `Maju ${offNum} Langkah (Offset +${offNum})`,
                    targetStepText: formatStepInfo(nextStep),
                    targetStatus: action?.target_status,
                };
            }
        } else if (type === 'absolute') {
            const targetSeq = Number(sequence ?? 1);
            const targetStep = steps.find((s: any) => Number(s.step) === targetSeq);
            return {
                label: `Lompat ke Tahap Spesifik (${targetSeq})`,
                targetStepText: formatStepInfo(targetStep),
                targetStatus: action?.target_status,
            };
        } else if (type === 'cross_workflow') {
            const isOrigin = workflow_id === 'origin_workflow' || workflow_id === 'origin' || workflow_id === contract.origin_workflow_id;
            const returnMode = transition.return_mode;
            let targetText = `Sub-Workflow (Tahap ${sequence || 1})`;
            let previewLabel = 'Pindah ke Sub-Workflow Cabang';

            if (isOrigin) {
                previewLabel = 'Kembali ke Alur Kerja Utama';
                if (returnMode === 'branch_origin' || returnMode === 'origin_step') {
                    targetText = 'Kembali ke Tahap Semula di Alur Utama';
                } else if (returnMode === 'branch_next') {
                    targetText = 'Lanjut ke Tahap Berikutnya di Alur Utama';
                } else if (sequence) {
                    targetText = `Kembali ke Alur Utama (Tahap ${sequence})`;
                } else {
                    targetText = 'Kembali ke Alur Utama';
                }
            }

            return {
                label: previewLabel,
                targetStepText: targetText,
                targetStatus: action?.target_status,
            };
        }
    }

    // 4. Default heuristics based on action_code
    switch (code) {
        case 'reject': {
            const step1 = steps.find((s: any) => Number(s.step) === 1);
            return {
                label: action?.alias || 'Kembali untuk Revisi (Tolak)',
                targetStepText: formatStepInfo(step1),
                targetStatus: action?.target_status || 'REVISED',
            };
        }

        case 'add_adhoc': {
            const nextStep = (action?.next_step_id ? steps.find((s: any) => String(s.id) === String(action.next_step_id)) : null)
                || steps.find((s: any) => Number(s.step) > currentStepSeq);
            return {
                label: action?.alias || 'Approval Tambahan',
                targetStepText: formatStepInfo(nextStep),
                targetStatus: action?.target_status,
            };
        }

        case 'assign':
        case 'assign_pic': {
            const nextStep = (action?.next_step_id ? steps.find((s: any) => String(s.id) === String(action.next_step_id)) : null)
                || steps.find((s: any) => Number(s.step) > currentStepSeq);
            return {
                label: action?.alias || 'Tugaskan PIC & Lanjutkan',
                targetStepText: formatStepInfo(nextStep),
                targetStatus: action?.target_status,
            };
        }

        default: {
            const nextStep = (action?.next_step_id ? steps.find((s: any) => String(s.id) === String(action.next_step_id)) : null)
                || steps.find((s: any) => Number(s.step) > currentStepSeq);
            return {
                label: action?.alias || (currentStepSeq === 1 ? 'Kirim Persetujuan' : 'Setujui & Lanjut ke Langkah Berikutnya'),
                targetStepText: formatStepInfo(nextStep),
                targetStatus: action?.target_status,
            };
        }
    }
}

interface ActionPreviewTooltipProps {
    preview: TransitionPreviewInfo | null;
    children: React.ReactNode;
    missingRequirements?: Array<{ id: string; label: string }>;
    disabledReason?: string;
}

export function ActionPreviewTooltip({ preview, children, missingRequirements, disabledReason }: ActionPreviewTooltipProps) {
    const hasMissingReqs = missingRequirements && missingRequirements.length > 0;
    if (!preview && !hasMissingReqs && !disabledReason) return <>{children}</>;

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <span className="w-full inline-block cursor-default">{children}</span>
            </TooltipTrigger>
            <TooltipContent
                side="left"
                align="center"
                sideOffset={8}
                className="max-w-[280px] w-auto p-2.5 bg-slate-900 text-slate-100 dark:bg-zinc-900 dark:text-zinc-100 border border-slate-700/80 shadow-2xl rounded-lg text-xs space-y-2 z-50 pointer-events-none"
            >
                {hasMissingReqs && (
                    <div className="bg-rose-950/80 p-2 rounded border border-rose-800/80 space-y-1 text-left">
                        <div className="flex items-center gap-1.5 font-bold text-rose-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                            <span>Syarat Wajib Belum Lengkap:</span>
                        </div>
                        <ul className="list-disc list-inside text-[10.5px] text-rose-200/90 space-y-0.5 mt-1">
                            {missingRequirements.map((req) => (
                                <li key={req.id} className="leading-tight">{req.label}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {disabledReason && !hasMissingReqs && (
                    <div className="bg-amber-950/80 p-2 rounded border border-amber-800/80 space-y-1 text-left text-amber-200 text-[11px]">
                        {disabledReason}
                    </div>
                )}

                {preview && (
                    <>
                        <div className="flex items-center gap-1.5 font-bold text-slate-200 dark:text-zinc-200">
                            <ArrowRight size={13} className="text-primary shrink-0" />
                            <span>Pratinjau Alur Langkah:</span>
                        </div>
                        <div className="bg-slate-950/80 dark:bg-black/60 p-2 rounded border border-slate-800/80 space-y-1 text-left">
                            <div className="flex items-center justify-between gap-2 text-[10px] text-slate-400">
                                <span className="font-semibold uppercase tracking-wider">Aksi:</span>
                                <span className="font-bold text-slate-200 truncate">{preview.label}</span>
                            </div>
                            <div className="flex items-start justify-between gap-2 text-[10.5px]">
                                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider shrink-0 mt-0.5">Tujuan:</span>
                                <span className="font-bold text-emerald-400 text-right leading-tight break-words">{preview.targetStepText}</span>
                            </div>
                            {preview.targetStatus && (
                                <div className="flex items-center justify-between gap-2 text-[10px] text-slate-400 pt-0.5 border-t border-slate-800/80">
                                    <span className="font-semibold uppercase tracking-wider">Status Target:</span>
                                    <span className="font-bold text-amber-400 uppercase">{preview.targetStatus}</span>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </TooltipContent>
        </Tooltip>
    );
}
