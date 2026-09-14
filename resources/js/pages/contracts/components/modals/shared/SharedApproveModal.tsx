import { Button } from '@/components/ui/buttons/Button';
import { FormTextarea } from '@/components/ui/inputs/FormTextarea';
import { Modal } from '@/components/ui/dialogs/Modal';
import { ChipIcon, getFileIcon, AttachmentCategoryBadge } from '@/components/ui';
import { contractApi } from '@/pages/contracts/utils';
import { cn } from '@/lib/utils';
import { formatFileSize } from '@/lib/formatters';
import { matchUserAgainstWorkflowPool } from '@/pages/workflows/workflow-filter';
import { CheckCircle2, Gavel, Loader2, Paperclip, Plus, Send, Trash2, UserPen, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface Props {
    open: boolean;
    onClose: () => void;
    onSubmit: (
        note: string,
        attachment?: File | File[],
        assignedPicId?: string,
        executionOrder?: string,
        signerUserIds?: string[],
        actionCode?: string,
        isFinal?: boolean,
        targetStepId?: string,
        actionId?: string,
    ) => Promise<void>;
    contract: any;
    onUpdate: (c: any) => void;
    actionCode?: string;
    actionId?: string;
    actionAlias?: string;
    users?: any[];
    isSubStep?: boolean;
}

export function SharedApproveModal({ open, onClose, onSubmit, contract, onUpdate, actionCode, actionId, actionAlias, users: initialUsers, isSubStep }: Props) {
    const [note, setNote] = useState('');
    const [attachments, setAttachments] = useState<File[]>([]);
    const [executionOrder, setExecutionOrder] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState<any[]>(initialUsers || []);
    const [fetchingUsers, setFetchingUsers] = useState(false);
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
            fetchUsers();
            setNote('');
            setAttachments([]);
            setExecutionOrder('');
        }
    }, [open]);

    const activeAction = actionId
        ? contract?.workflow_step?.actions?.find((a: any) => a.id === actionId)
        : contract?.workflow_step?.actions?.find((a: any) => a.action_code === actionCode);

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
        if (!isSubStep) {
            // Validation check for required step documents (require_f1, require_f2, require_agreement or action_configs.required_fields)
            let stepMeta = contract?.workflow_step?.meta;
            let actions = contract?.workflow_step?.action_configs || contract?.workflow_step?.actions || [];

            if (!stepMeta && contract?.workflow?.steps) {
                const currentStepSeq = contract?.current_step || contract?.workflow_step?.step || 1;
                const matchedStep = contract.workflow.steps.find((s: any) => s.step === currentStepSeq || s.id === contract?.workflow_step_id);
                if (matchedStep) {
                    stepMeta = matchedStep.meta;
                    if (!actions.length) actions = matchedStep.action_configs || matchedStep.actions || [];
                }
            }
            stepMeta = stepMeta || {};

            const actionReqFields: string[] = actions.flatMap((act: any) => act.required_fields || []);

            const requirePic = !!stepMeta.require_pic || actionReqFields.includes('pic') || actionReqFields.includes('assigned_pic');
            const requireF1 = !!stepMeta.require_f1 || actionReqFields.includes('f1');
            const requireF2 = !!stepMeta.require_f2 || actionReqFields.includes('f2');
            const requireAgreement = !!stepMeta.require_agreement || actionReqFields.includes('agreement');

            const missingDocs: string[] = [];

            if (requirePic) {
                const hasPic = !!(contract?.assigned_pic_id || contract?.metadata?.assigned_pic_id || (contract as any)?.assigned_pic || (contract as any)?.assignedPic);
                if (!hasPic) missingDocs.push('Data PIC (Penanggung Jawab)');
            }

            if (requireF1) {
                const hasF1 = !!(
                    contract.f1_file ||
                    contract.metadata?.f1_file ||
                    (contract.form_submissions || (contract as any).formSubmissions || []).some((fs: any) => fs.document_type === 'f1') ||
                    (contract as any).f1_submission ||
                    (contract as any).f1_form_data ||
                    contract.metadata?.f1_form_data ||
                    (contract?.versions && contract.versions.some((v: any) => v.document_type === 'f1')) ||
                    (contract.f1_items && contract.f1_items.length > 0)
                );
                if (!hasF1) missingDocs.push('Sub-dokumen F1 (Permohonan)');
            }

            if (requireF2) {
                const hasF2 = !!(
                    contract.f2_file ||
                    contract.metadata?.f2_file ||
                    (contract.form_submissions || (contract as any).formSubmissions || []).some((fs: any) => fs.document_type === 'f2') ||
                    (contract as any).f2_submission ||
                    (contract as any).f2_form_data ||
                    contract.metadata?.f2_form_data ||
                    (contract?.versions && contract.versions.some((v: any) => v.document_type === 'f2')) ||
                    contract.contract_no ||
                    contract.price
                );
                if (!hasF2) missingDocs.push('Sub-dokumen F2 (Ringkasan)');
            }

            if (requireAgreement) {
                const hasAgreement = !!(
                    contract.agreement_file ||
                    contract.metadata?.agreement_file ||
                    (contract.form_submissions || (contract as any).formSubmissions || []).some((fs: any) => fs.document_type === 'agreement' || fs.document_type === 'contract') ||
                    (contract as any).agreement_submission ||
                    contract.agreement_content ||
                    contract.metadata?.agreement_content ||
                    (contract.versions && (contract.versions as any[]).some((v: any) => v.document_type === 'agreement' || v.document_type === 'contract'))
                );
                if (!hasAgreement) missingDocs.push('Sub-dokumen Perjanjian / Draft');
            }

            if (stepMeta.require_title && !contract.title) {
                missingDocs.push('Field Judul Kontrak');
            }
            if (stepMeta.require_vendor && !contract.vendor_id && !contract.vendor?.id) {
                missingDocs.push('Field Pihak Kedua ');
            }
            if (stepMeta.require_category && !contract.contract_type_id && !contract.contract_type) {
                missingDocs.push('Field Kategori Kontrak');
            }
            if (stepMeta.require_f2_contract_no && !contract.contract_no) {
                missingDocs.push('Field Nomor Kontrak');
            }
            if (stepMeta.require_tax_toggle && contract.tax_required === undefined && contract.metadata?.tax_required === undefined) {
                missingDocs.push('Field Penentuan Pajak');
            }
            if (stepMeta.require_price && (contract.price === undefined || contract.price === null || contract.price === '')) {
                missingDocs.push('Field Nilai / Harga Kontrak');
            }
            if (stepMeta.require_period && ((!contract.contract_date && !contract.start_date) || !contract.end_date)) {
                missingDocs.push('Field Masa Berlaku Kontrak');
            }

            if (missingDocs.length > 0) {
                alert(`Tidak dapat melanjutkan persetujuan. Data/dokumen berikut wajib diisi terlebih dahulu:\n- ${missingDocs.join('\n- ')}`);
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
                attachments.length > 0 ? (attachments.length === 1 ? attachments[0] : attachments) : undefined,
                undefined, // assignedPicId
                executionOrder || undefined,
                undefined, // signerUserIds
                actionCode,
                undefined, // isFinal
                undefined, // targetStepId
                actionId || activeAction?.id,
            );
            onClose();
        } finally {
            setLoading(false);
        }
    };

    const isBranch = actionCode === 'branch';
    const titleText = actionAlias || (isBranch ? 'Pindah Workflow (Cabang)' : isSubStep ? 'Setujui Penelaahan' : (contract?.workflow_step?.step === 1 ? 'Kirim Persetujuan' : 'Setujui Kontrak'));
    const subtitleText = isBranch
        ? 'Konfirmasi untuk mengarahkan alur kerja kontrak ke workflow cabang'
        : isSubStep
            ? 'Konfirmasi untuk menyetujui penelaahan / persetujuan tambahan pada kontrak ini'
            : contract?.workflow_step?.step === 1
                ? 'Konfirmasi untuk mengirim draft kontrak ke tahap persetujuan berikutnya'
                : 'Berikan persetujuan atau catatan untuk memproses tahap kontrak ini';

    const checkIsSubmitDisabled = () => {
        if (isSubStep) return false;
        let stepMeta = contract?.workflow_step?.meta;
        let actions = contract?.workflow_step?.action_configs || contract?.workflow_step?.actions || [];

        if (!stepMeta && contract?.workflow?.steps) {
            const currentStepSeq = contract?.current_step || contract?.workflow_step?.step || 1;
            const matchedStep = contract.workflow.steps.find((s: any) => s.step === currentStepSeq || s.id === contract?.workflow_step_id);
            if (matchedStep) {
                stepMeta = matchedStep.meta;
                if (!actions.length) actions = matchedStep.action_configs || matchedStep.actions || [];
            }
        }
        stepMeta = stepMeta || {};

        const actionReqFields: string[] = actions.flatMap((act: any) => act.required_fields || []);
        const requirePic = !!stepMeta.require_pic || actionReqFields.includes('pic') || actionReqFields.includes('assigned_pic');
        const requireF1 = !!stepMeta.require_f1 || actionReqFields.includes('f1');
        const requireF2 = !!stepMeta.require_f2 || actionReqFields.includes('f2');
        const requireAgreement = !!stepMeta.require_agreement || actionReqFields.includes('agreement');

        if (requirePic) {
            const hasPic = !!(
                contract?.assigned_pic_id ||
                contract?.metadata?.assigned_pic_id ||
                (contract as any)?.assigned_pic ||
                (contract as any)?.assignedPic
            );
            if (!hasPic) return true;
        }

        // Waktu saat step persetujuan saat ini dimulai
        const currentApproval = (contract?.approvals || []).find((a: any) => a.status === 'pending');
        const stepStartTime = currentApproval?.created_at || contract?.workflow_step?.created_at;

        const hasDocUploadedInCurrentStep = (type: string) => {
            const hasVersion = contract?.versions && contract.versions.some((v: any) => {
                if (v.document_type !== type && !(type === 'agreement' && v.document_type === 'contract')) return false;
                if (!stepStartTime || !v.created_at_raw) return true;
                return new Date(v.created_at_raw).getTime() >= new Date(stepStartTime).getTime() - 5000;
            });
            if (hasVersion) return true;

            const hasForm = (contract?.form_submissions || (contract as any)?.formSubmissions || []).some((fs: any) => {
                if (fs.document_type !== type && !(type === 'agreement' && fs.document_type === 'contract')) return false;
                return (fs.current_version ?? 0) > 0 || !!fs.id;
            });
            if (hasForm) return true;

            return false;
        };

        if (requireF1) {
            const hasF1 = hasDocUploadedInCurrentStep('f1') || !!(
                contract?.f1_file ||
                contract?.metadata?.f1_file ||
                (contract?.form_submissions || (contract as any).formSubmissions || []).some((fs: any) => fs.document_type === 'f1') ||
                (contract as any)?.f1_submission ||
                (contract as any)?.f1_form_data ||
                contract?.metadata?.f1_form_data ||
                (contract?.f1_items && contract.f1_items.length > 0)
            );
            if (!hasF1) return true;
        }

        if (requireF2) {
            const hasF2 = hasDocUploadedInCurrentStep('f2') || !!(
                contract?.f2_file ||
                contract?.metadata?.f2_file ||
                (contract?.form_submissions || (contract as any).formSubmissions || []).some((fs: any) => fs.document_type === 'f2') ||
                (contract as any)?.f2_submission ||
                (contract as any)?.f2_form_data ||
                contract?.metadata?.f2_form_data ||
                contract?.contract_no ||
                contract?.price
            );
            if (!hasF2) return true;
        }

        if (requireAgreement) {
            const hasAgreement = hasDocUploadedInCurrentStep('agreement') || !!(
                contract?.agreement_file ||
                contract?.metadata?.agreement_file ||
                (contract?.form_submissions || (contract as any).formSubmissions || []).some((fs: any) => fs.document_type === 'agreement' || fs.document_type === 'contract') ||
                (contract as any)?.agreement_submission ||
                (contract as any)?.agreement_content ||
                contract?.metadata?.agreement_content ||
                (contract?.versions && (contract.versions as any[]).some((v: any) => v.document_type === 'agreement' || v.document_type === 'contract'))
            );
            if (!hasAgreement) return true;
        }

        if (stepMeta.require_title && !contract?.title) return true;
        if (stepMeta.require_vendor && !contract?.vendor_id && !contract?.vendor?.id) return true;
        if (stepMeta.require_category && !contract?.contract_type_id && !contract?.contract_type) return true;
        if (stepMeta.require_f2_contract_no && !contract?.contract_no) return true;
        if (stepMeta.require_tax_toggle && contract?.tax_required === undefined && contract?.metadata?.tax_required === undefined) return true;
        if (stepMeta.require_price && (contract?.price === undefined || contract?.price === null || contract?.price === '')) return true;
        if (stepMeta.require_period && ((!contract?.contract_date && !contract?.start_date) || !contract?.end_date)) return true;

        return false;
    };

    const isSubmitDisabled = loading || checkIsSubmitDisabled();

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
                        disabled={isSubmitDisabled}
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
                        {isBranch ? 'Pindah Workflow' : contract?.workflow_step?.step === 1 ? 'Kirim Sekarang' : 'Konfirmasi Setuju'}
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
                        {isBranch
                            ? 'Konfirmasi untuk melanjutkan proses ke workflow cabang / alur kerja yang dikonfigurasikan pada aksi ini.'
                            : contract?.workflow_step?.step === 1
                                ? 'Konfirmasi untuk mengirim draft kontrak ini ke tahap persetujuan berikutnya. Pastikan dokumen sudah lengkap.'
                                : 'Apakah Anda yakin ingin menyetujui kontrak ini? Anda dapat memberikan catatan approval dan lampiran (opsional).'}
                    </p>

                    {/* Check-list Syarat Dokumen / Data Wajib Tahap Ini */}
                    {(() => {
                        let stepMeta = contract?.workflow_step?.meta;
                        let actions = contract?.workflow_step?.action_configs || contract?.workflow_step?.actions || [];

                        // Fallback ke contract.workflow.steps apabila contract.workflow_step belum memuat meta
                        if (!stepMeta && contract?.workflow?.steps) {
                            const currentStepSeq = contract?.current_step || contract?.workflow_step?.step || 1;
                            const matchedStep = contract.workflow.steps.find((s: any) => s.step === currentStepSeq || s.id === contract?.workflow_step_id);
                            if (matchedStep) {
                                stepMeta = matchedStep.meta;
                                if (!actions.length) actions = matchedStep.action_configs || matchedStep.actions || [];
                            }
                        }
                        stepMeta = stepMeta || {};

                        const actionReqFields: string[] = actions.flatMap((act: any) => act.required_fields || []);

                        const requirePic = !!stepMeta.require_pic || actionReqFields.includes('pic') || actionReqFields.includes('assigned_pic');
                        const requireF1 = !!stepMeta.require_f1 || actionReqFields.includes('f1');
                        const requireF2 = !!stepMeta.require_f2 || actionReqFields.includes('f2');
                        const requireAgreement = !!stepMeta.require_agreement || actionReqFields.includes('agreement');

                        const currentApproval = (contract?.approvals || []).find((a: any) => a.status === 'pending');
                        const stepStartTime = currentApproval?.created_at || contract?.workflow_step?.created_at;

                        const hasDocUploadedInCurrentStep = (type: string) => {
                            const hasVersion = contract?.versions && contract.versions.some((v: any) => {
                                if (v.document_type !== type && !(type === 'agreement' && v.document_type === 'contract')) return false;
                                if (!stepStartTime || !v.created_at_raw) return true;
                                return new Date(v.created_at_raw).getTime() >= new Date(stepStartTime).getTime() - 5000;
                            });
                            if (hasVersion) return true;

                            const hasForm = (contract?.form_submissions || (contract as any)?.formSubmissions || []).some((fs: any) => {
                                if (fs.document_type !== type && !(type === 'agreement' && fs.document_type === 'contract')) return false;
                                return (fs.current_version ?? 0) > 0 || !!fs.id;
                            });
                            if (hasForm) return true;

                            return false;
                        };

                        const reqList: any[] = [];

                        if (requirePic) {
                            const isFilled = !!(
                                contract.assigned_pic_id ||
                                contract.metadata?.assigned_pic_id ||
                                (contract as any)?.assigned_pic ||
                                (contract as any)?.assignedPic
                            );
                            reqList.push({ label: 'Data PIC (Penanggung Jawab)', isFilled });
                        }
                        if (requireF1) {
                            const isFilled = hasDocUploadedInCurrentStep('f1') || !!(
                                contract.f1_file ||
                                contract.metadata?.f1_file ||
                                (contract.form_submissions || (contract as any).formSubmissions || []).some((fs: any) => fs.document_type === 'f1') ||
                                (contract as any).f1_submission ||
                                (contract as any).f1_form_data ||
                                contract.metadata?.f1_form_data ||
                                (contract.f1_items && contract.f1_items.length > 0)
                            );
                            reqList.push({ label: 'Sub-dokumen F1 (Permohonan)', isFilled });
                        }
                        if (requireF2) {
                            const isFilled = hasDocUploadedInCurrentStep('f2') || !!(
                                contract.f2_file ||
                                contract.metadata?.f2_file ||
                                (contract.form_submissions || (contract as any).formSubmissions || []).some((fs: any) => fs.document_type === 'f2') ||
                                (contract as any).f2_submission ||
                                (contract as any).f2_form_data ||
                                contract.metadata?.f2_form_data ||
                                contract.contract_no ||
                                contract.price
                            );
                            reqList.push({ label: 'Sub-dokumen F2 (Ringkasan)', isFilled });
                        }
                        if (requireAgreement) {
                            const isFilled = hasDocUploadedInCurrentStep('agreement') || !!(
                                contract.agreement_file ||
                                contract.metadata?.agreement_file ||
                                (contract.form_submissions || (contract as any).formSubmissions || []).some((fs: any) => fs.document_type === 'agreement' || fs.document_type === 'contract') ||
                                (contract as any).agreement_submission ||
                                (contract as any).agreement_content ||
                                contract.metadata?.agreement_content ||
                                (contract.versions && (contract.versions as any[]).some((v: any) => v.document_type === 'agreement' || v.document_type === 'contract'))
                            );
                            reqList.push({ label: 'Sub-dokumen Perjanjian / Draft', isFilled });
                        }

                        if (stepMeta.require_title) {
                            reqList.push({ label: 'Judul Kontrak', isFilled: !!contract.title });
                        }
                        if (stepMeta.require_vendor) {
                            reqList.push({ label: 'Pihak Kedua ', isFilled: !!(contract.vendor_id || contract.vendor?.id) });
                        }
                        if (stepMeta.require_category) {
                            reqList.push({ label: 'Kategori Kontrak', isFilled: !!(contract.contract_type_id || contract.contract_type) });
                        }
                        if (stepMeta.require_f2_contract_no) {
                            reqList.push({ label: 'No. Kontrak (F2)', isFilled: !!contract.contract_no });
                        }
                        if (stepMeta.require_tax_toggle) {
                            reqList.push({ label: 'Penentuan Pajak', isFilled: contract.tax_required !== undefined || contract.metadata?.tax_required !== undefined });
                        }
                        if (stepMeta.require_price) {
                            reqList.push({ label: 'Nilai / Harga', isFilled: contract.price !== undefined && contract.price !== null && contract.price !== '' });
                        }
                        if (stepMeta.require_period) {
                            reqList.push({ label: 'Masa Berlaku', isFilled: !!((contract.contract_date || contract.start_date) && contract.end_date) });
                        }

                        if (reqList.length === 0) return null;

                        return (
                            <div className="rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-900/60 p-2.5 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-zinc-400">
                                        Checklist Syarat Wajib
                                    </span>
                                    <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-slate-200/80 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                                        {reqList.filter(r => r.isFilled).length} / {reqList.length} Terisi
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                                    {reqList.map((req, idx) => (
                                        <div
                                            key={idx}
                                            className={cn(
                                                'flex items-center justify-between px-2.5 py-1.5 rounded-md border text-[11px] font-semibold transition-colors',
                                                req.isFilled
                                                    ? 'bg-emerald-50/90 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800/60 dark:text-emerald-300'
                                                    : 'bg-rose-50/90 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800/60 dark:text-rose-300'
                                            )}
                                        >
                                            <span className="flex items-center gap-1.5 truncate">
                                                {req.isFilled ? (
                                                    <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                                                ) : (
                                                    <X size={13} className="text-rose-600 dark:text-rose-400 shrink-0" />
                                                )}
                                                <span className="truncate">{req.label}</span>
                                            </span>
                                            <span className="text-[9px] uppercase font-bold tracking-tight shrink-0 ml-1">
                                                {req.isFilled ? '✓' : '✗'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })()}

                <div className="space-y-3">
                    {/* Urutan Eksekusi Joint Upload jika Next Step adalah joint_upload dan belum di-set */}
                    {contract?.next_step?.step_category === 'joint_upload' && !contract?.metadata?.step_12_order && (
                        <div className="space-y-2 rounded-xl border border-primary/20 bg-primary/5 p-3.5">
                            <label className="text-xs font-bold text-primary flex items-center gap-1.5">
                                <UserPen size={14} />
                                Pilih Urutan Unggah Dokumen Bersama
                            </label>
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                                Tahap berikutnya memerlukan unggahan berkas oleh Inisiator dan Reviewer. Tentukan siapa yang harus mengunggah terlebih dahulu.
                            </p>
                            <div className="grid grid-cols-2 gap-2.5 pt-1">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setExecutionOrder('reviewer_first')}
                                    className={cn(
                                        'flex flex-col items-center justify-center p-3 h-auto gap-1.5 rounded-xl border-2 transition-all',
                                        executionOrder === 'reviewer_first'
                                            ? 'border-primary bg-primary/10 text-primary shadow-xs'
                                            : 'border-surface-border bg-surface hover:bg-surface-muted opacity-80',
                                    )}
                                >
                                    <div
                                        className={cn(
                                            'flex h-10 w-10 items-center justify-center rounded-xl transition-colors',
                                            executionOrder === 'reviewer_first'
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-surface-muted text-text-soft',
                                        )}
                                    >
                                        <Gavel size={18} />
                                    </div>
                                    <span
                                        className={cn(
                                            'text-xs font-bold tracking-tight uppercase',
                                            executionOrder === 'reviewer_first' ? 'text-primary' : 'text-text-main',
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
                                        'flex flex-col items-center justify-center p-3 h-auto gap-1.5 rounded-xl border-2 transition-all',
                                        executionOrder === 'initiator_first'
                                            ? 'border-primary bg-primary/10 text-primary shadow-xs'
                                            : 'border-surface-border bg-surface hover:bg-surface-muted opacity-80',
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
                        <div className="flex items-center justify-between">
                            <label className="text-text-desc text-[11px] font-bold uppercase">Lampiran Berkas Pendukung (Opsional)</label>
                            {attachments.length > 0 && (
                                <span className="text-[10px] font-bold text-primary">
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
                                        "border-surface-border text-text-desc hover:border-primary hover:text-primary hover:bg-surface-muted flex h-auto w-full flex-col items-center justify-center gap-1.5 border-2 border-dashed py-5 transition-all rounded-lg cursor-pointer",
                                        isDragging && "border-primary bg-primary/10 scale-[0.99]"
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
                                            "w-full text-xs font-semibold flex items-center justify-center gap-1.5 border border-dashed border-primary/40 text-primary hover:bg-primary/5 h-8 mt-1 rounded-md cursor-pointer transition-all",
                                            isDragging && "bg-primary/15 border-primary"
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
            </div>
        </div>
    </Modal>
);
}
