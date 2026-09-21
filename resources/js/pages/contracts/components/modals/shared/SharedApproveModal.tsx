import { getFileIcon } from '@/components/ui';
import { Button } from '@/components/ui/buttons/Button';
import { Modal } from '@/components/ui/dialogs/Modal';
import { FormTextarea } from '@/components/ui/inputs/FormTextarea';
import { formatFileSize } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { contractApi, resolveTransitionPreview } from '@/pages/contracts/utils';
import { resolveContractRequirements } from '@/pages/contracts/utils/requirements';
import { AlertCircle, CheckCircle2, Eye, Gavel, Loader2, Paperclip, Plus, Send, UserPen, X, XCircle } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

export interface SharedActionModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (
        note: string,
        attachment?: File | File[],
        assignedPicId?: string,
        executionOrder?: string,
        actionCode?: string,
        isFinal?: boolean,
        targetStepId?: string,
        actionId?: string,
    ) => Promise<void>;
    contract: any;
    onUpdate?: (c: any) => void;
    actionCode?: string;
    actionId?: string;
    actionAlias?: string;
    users?: any[];
    isSubStep?: boolean;
}

export function SharedActionModal({
    open,
    onClose,
    onSubmit,
    contract,
    actionCode = 'approve',
    actionId,
    actionAlias,
    users: initialUsers,
    isSubStep,
}: SharedActionModalProps) {
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

    const customActionsList = [
        ...(contract?.workflow?.meta?.custom_actions || []),
        ...(contract?.origin_workflow?.meta?.custom_actions || []),
        ...(((contract?.workflow_step as any)?.workflow as any)?.meta?.custom_actions || []),
    ];

    const activeAction = actionId
        ? (contract?.workflow_step?.actions?.find((a: any) => a.id === actionId) ||
            customActionsList.find((a: any) => a.id === actionId || a.action_code === actionCode))
        : (contract?.workflow_step?.actions?.find((a: any) => a.action_code === actionCode) ||
            customActionsList.find((a: any) => a.action_code === actionCode));

    const preview = resolveTransitionPreview({
        contract,
        action: activeAction,
        actionCode,
        allWorkflows,
    });

    const fetchUsers = async () => {
        if (initialUsers && initialUsers.length > 0) return;
        setFetchingUsers(true);
        try {
            const data = await contractApi.getUsers();
            if (Array.isArray(data)) {
                setUsers(data);
            }
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setFetchingUsers(false);
        }
    };

    const isReject = actionCode === 'reject';
    const isBranch = actionCode === 'branch';

    const modalConfig = useMemo(() => {
        if (isReject) {
            return {
                headerVariant: 'danger' as const,
                headerIcon: <XCircle size={18} className="text-white" />,
                title: actionAlias || 'Tolak Kontrak',
                description: 'Berikan catatan atau alasan penolakan kontrak',
                btnVariant: 'destructive' as const,
                btnIcon: <XCircle size={15} className="mr-1.5" />,
                btnText: 'Konfirmasi Penolakan',
                noteLabel: 'Alasan Penolakan',
                notePlaceholder: 'Jelaskan alasan penolakan secara detail...',
                noteRequired: true,
                infoText: 'Mohon jelaskan alasan penolakan kontrak ini agar pihak inisiator dapat melakukan perbaikan yang diperlukan.',
            };
        }
        if (isBranch) {
            return {
                headerVariant: 'default' as const,
                headerIcon: <CheckCircle2 size={18} className="text-white" />,
                title: actionAlias || 'Pindah Workflow (Cabang)',
                description: 'Konfirmasi untuk mengarahkan alur kerja kontrak ke workflow cabang',
                btnVariant: 'default' as const,
                btnIcon: <CheckCircle2 size={15} className="mr-1.5" />,
                btnText: 'Pindah Workflow',
                noteLabel: 'Catatan Aksi (Opsional)',
                notePlaceholder: 'Tambahkan catatan aksi...',
                noteRequired: false,
                infoText: 'Konfirmasi untuk melanjutkan proses ke workflow cabang / alur kerja yang dikonfigurasikan pada aksi ini.',
            };
        }
        if (isSubStep) {
            return {
                headerVariant: 'default' as const,
                headerIcon: <CheckCircle2 size={18} className="text-white" />,
                title: actionAlias || 'Setujui Penelaahan',
                description: 'Konfirmasi untuk menyetujui penelaahan / persetujuan tambahan pada kontrak ini',
                btnVariant: 'default' as const,
                btnIcon: <CheckCircle2 size={15} className="mr-1.5" />,
                btnText: 'Konfirmasi Setuju',
                noteLabel: 'Catatan Approval (Opsional)',
                notePlaceholder: 'Tambahkan catatan approval...',
                noteRequired: false,
                infoText: 'Apakah Anda yakin ingin menyetujui penelaahan ini? Anda dapat memberikan catatan approval dan lampiran (opsional).',
            };
        }
        if (contract?.workflow_step?.step === 1 && (actionCode === 'approve' || actionCode === 'send_approval' || !actionCode)) {
            return {
                headerVariant: 'default' as const,
                headerIcon: <Send size={18} className="text-white" />,
                title: actionAlias || 'Kirim Persetujuan',
                description: 'Konfirmasi untuk mengirim draft kontrak ke tahap persetujuan berikutnya',
                btnVariant: 'default' as const,
                btnIcon: <Send size={15} className="mr-1.5" />,
                btnText: 'Kirim Sekarang',
                noteLabel: 'Catatan Pengajuan (Opsional)',
                notePlaceholder: 'Tambahkan catatan pengajuan...',
                noteRequired: false,
                infoText: 'Konfirmasi untuk mengirim draft kontrak ini ke tahap persetujuan berikutnya. Pastikan dokumen sudah lengkap.',
            };
        }
        return {
            headerVariant: 'default' as const,
            headerIcon: <CheckCircle2 size={18} className="text-white" />,
            title: actionAlias || 'Setujui Kontrak',
            description: 'Berikan persetujuan atau catatan untuk memproses tahap kontrak ini',
            btnVariant: 'default' as const,
            btnIcon: <CheckCircle2 size={15} className="mr-1.5" />,
            btnText: actionAlias ? `Konfirmasi ${actionAlias}` : 'Konfirmasi Setuju',
            noteLabel: 'Catatan Approval (Opsional)',
            notePlaceholder: 'Tambahkan catatan approval...',
            noteRequired: false,
            infoText: 'Apakah Anda yakin ingin menyetujui kontrak ini? Anda dapat memberikan catatan approval dan lampiran (opsional).',
        };
    }, [isReject, isBranch, isSubStep, actionAlias, actionCode, contract?.workflow_step?.step]);

    const getActionRequiredFields = () => {
        if (isSubStep || isReject) return [];
        const code = (actionCode || activeAction?.action_code || '').toLowerCase();
        const isNonStandardAction = ['reject', 'branch', 'add_adhoc', 'cross_workflow'].includes(code);

        if (activeAction?.required_fields && Array.isArray(activeAction.required_fields)) {
            return activeAction.required_fields;
        }

        if (isNonStandardAction) {
            return [];
        }

        let stepMeta = contract?.workflow_step?.meta;
        if (!stepMeta && contract?.workflow?.steps) {
            const currentStepSeq = contract?.current_step || contract?.workflow_step?.step || 1;
            const matchedStep = contract.workflow.steps.find((s: any) => s.step === currentStepSeq || s.id === contract?.workflow_step_id);
            if (matchedStep) stepMeta = matchedStep.meta;
        }
        stepMeta = stepMeta || {};

        const list: string[] = [];
        if (stepMeta.require_pic) list.push('pic');
        if (stepMeta.require_f1) list.push('f1');
        if (stepMeta.require_f2) list.push('f2');
        if (stepMeta.require_agreement) list.push('agreement');
        if (stepMeta.require_title) list.push('title');
        if (stepMeta.require_vendor) list.push('vendor');
        if (stepMeta.require_category) list.push('category');
        if (stepMeta.require_f2_contract_no) list.push('contract_no');
        if (stepMeta.require_tax_toggle) list.push('tax_toggle');
        if (stepMeta.require_price) list.push('price');
        if (stepMeta.require_period) list.push('period');
        return list;
    };

    const handleSubmit = async () => {
        if (isReject) {
            if (!note.trim()) return;
            setLoading(true);
            try {
                await onSubmit(
                    note,
                    attachments.length > 0 ? (attachments.length === 1 ? attachments[0] : attachments) : undefined,
                    undefined,
                    undefined,
                    undefined,
                    'reject',
                    undefined,
                    undefined,
                    actionId || activeAction?.id,
                );
                onClose();
            } finally {
                setLoading(false);
            }
            return;
        }

        if (!isSubStep) {
            const requiredFields = getActionRequiredFields();
            const requirePic = requiredFields.includes('pic') || requiredFields.includes('assigned_pic');
            const requireF1 = requiredFields.includes('f1');
            const requireF2 = requiredFields.includes('f2');
            const requireAgreement = requiredFields.includes('agreement');

            const missingDocs: string[] = [];

            if (requirePic) {
                const hasPic = !!(contract?.assigned_pic_id || contract?.metadata?.assigned_pic_id || (contract as any)?.assigned_pic || (contract as any)?.assignedPic);
                if (!hasPic) missingDocs.push('Data PIC (Penanggung Jawab)');
            }

            const currentApproval = (contract?.approvals || []).find((a: any) => a.status === 'pending');
            const currentStepId = contract?.workflow_step_id || contract?.workflow_step?.id;
            const currentStepNo = contract?.workflow_step?.step || contract?.current_step_number || (currentApproval?.sequence ?? currentApproval?.step_number);
            const iteration = contract?.workflow_iteration || 1;
            const stepStartTime = currentApproval?.created_at || contract?.workflow_step?.created_at;

            const checkDocFulfillment = (type: string) => {
                const types = type === 'agreement' ? ['agreement', 'contract'] : [type];

                const hasVersionMatch = contract?.versions && contract.versions.some((v: any) => {
                    if (!types.includes(v.document_type)) return false;
                    if (currentStepId && v.workflow_step_id === currentStepId) return true;
                    if (currentStepNo !== undefined && v.step_number === currentStepNo) return true;
                    if (v.workflow_iteration === iteration && !v.workflow_step_id && !v.step_number) return true;
                    if (stepStartTime && v.created_at_raw) {
                        return new Date(v.created_at_raw).getTime() >= new Date(stepStartTime).getTime() - 5000;
                    }
                    return false;
                });
                if (hasVersionMatch) return true;

                const hasFormMatch = (contract?.form_submissions || (contract as any)?.formSubmissions || []).some((fs: any) => {
                    if (!types.includes(fs.document_type)) return false;
                    if (currentStepId && fs.workflow_step_id === currentStepId) return true;
                    if (currentStepNo !== undefined && fs.step_number === currentStepNo) return true;
                    if (fs.workflow_iteration === iteration && !fs.workflow_step_id && !fs.step_number) return true;
                    return (fs.current_version ?? 0) > 0 || !!fs.id;
                });
                if (hasFormMatch) return true;

                if (!currentStepNo || currentStepNo <= 1) {
                    if (contract?.versions && contract.versions.some((v: any) => types.includes(v.document_type))) return true;
                    if ((contract?.form_submissions || (contract as any)?.formSubmissions || []).some((fs: any) => types.includes(fs.document_type))) return true;
                }

                return false;
            };

            if (requireF1) {
                const hasF1 = checkDocFulfillment('f1') || !!(
                    contract.f1_file ||
                    contract.metadata?.f1_file ||
                    contract.metadata?.f1_form_data ||
                    (contract.f1_items && contract.f1_items.length > 0)
                );
                if (!hasF1) missingDocs.push('Sub-dokumen F1 (Permohonan)');
            }

            if (requireF2) {
                const hasF2 = checkDocFulfillment('f2') || !!(
                    contract.f2_file ||
                    contract.metadata?.f2_file ||
                    contract.metadata?.f2_form_data
                );
                if (!hasF2) missingDocs.push('Sub-dokumen F2 (Ringkasan)');
            }

            if (requireAgreement) {
                const hasAgreement = checkDocFulfillment('agreement') || !!(
                    contract.agreement_file ||
                    contract.metadata?.agreement_file ||
                    contract.metadata?.agreement_content ||
                    (contract as any).agreement_content
                );
                if (!hasAgreement) missingDocs.push('Sub-dokumen Perjanjian / Draft');
            }

            if (requiredFields.includes('title') && !contract.title) {
                missingDocs.push('Field Judul Kontrak');
            }
            if (requiredFields.includes('vendor') && !contract.vendor_id && !contract.vendor?.id) {
                missingDocs.push('Field Pihak Kedua ');
            }
            if (requiredFields.includes('category') && !contract.contract_type_id && !contract.contract_type) {
                missingDocs.push('Field Kategori Kontrak');
            }
            if ((requiredFields.includes('contract_no') || requiredFields.includes('f2_contract_no')) && !contract.contract_no) {
                missingDocs.push('Field Nomor Kontrak');
            }
            if ((requiredFields.includes('tax_toggle') || requiredFields.includes('tax')) && contract.tax_required === undefined && contract.metadata?.tax_required === undefined) {
                missingDocs.push('Field Penentuan Pajak');
            }
            if (requiredFields.includes('price') && (contract.price === undefined || contract.price === null || contract.price === '')) {
                missingDocs.push('Field Nilai / Harga Kontrak');
            }
            if (requiredFields.includes('period') && ((!contract.contract_date && !contract.start_date) || !contract.end_date)) {
                missingDocs.push('Field Masa Berlaku Kontrak');
            }

            // Review / Flag Checks
            const stepKey = contract?.workflow_step_id ? `step_${contract.workflow_step_id}` : 'general';
            const reviews = ((contract as any)?.doc_reviews?.[stepKey] || contract?.metadata?.doc_reviews?.[stepKey] || contract?.metadata?.[`doc_reviews_${stepKey}`] || {}) as Record<string, any>;

            if (requiredFields.includes('review_f1') && !reviews.f1?.reviewed) {
                missingDocs.push('Wajib Ditinjau: F1 (Permohonan belum dibuka)');
            }
            if (requiredFields.includes('review_f2') && !reviews.f2?.reviewed) {
                missingDocs.push('Wajib Ditinjau: F2 (Ringkasan belum dibuka)');
            }
            if (requiredFields.includes('review_agreement') && !reviews.agreement?.reviewed) {
                missingDocs.push('Wajib Ditinjau: Draft Perjanjian (Draft belum dibuka)');
            }
            if (requiredFields.includes('review_all_docs')) {
                const meta = contract?.workflow_step?.meta || {};
                const hasF1 = meta.show_tab_f1 !== false && ((contract as any)?.f1_mode || 'upload') !== 'none';
                const hasF2 = meta.show_tab_f2 !== false && ((contract as any)?.f2_mode || 'upload') !== 'none';
                const hasAgreement = meta.show_tab_agreement !== false && ((contract as any)?.contract_mode || 'upload') !== 'none';

                if (hasF1 && !reviews.f1?.reviewed) missingDocs.push('Wajib Ditinjau: F1 (Permohonan)');
                if (hasF2 && !reviews.f2?.reviewed) missingDocs.push('Wajib Ditinjau: F2 (Ringkasan)');
                if (hasAgreement && !reviews.agreement?.reviewed) missingDocs.push('Wajib Ditinjau: Draft Perjanjian');
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

    const reqStatus = useMemo(() => {
        if (isReject || isSubStep) {
            return { items: [], allFilled: true, totalCount: 0, filledCount: 0, hasRequirements: false };
        }
        return resolveContractRequirements(contract, activeAction);
    }, [contract, activeAction, isReject, isSubStep]);

    const isSubmitDisabled = loading || (isReject ? !note.trim() : !reqStatus.allFilled);

    return (
        <Modal
            isOpen={open}
            onClose={onClose}
            maxWidth="2xl"
            headerVariant={modalConfig.headerVariant}
            headerIcon={modalConfig.headerIcon}
            title={modalConfig.title}
            description={modalConfig.description}
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
                        variant={modalConfig.btnVariant}
                        onClick={handleSubmit}
                        disabled={isSubmitDisabled}
                        className="min-w-[140px] h-9 text-xs"
                    >
                        {loading ? (
                            <Loader2 size={15} className="mr-1.5 animate-spin" />
                        ) : (
                            modalConfig.btnIcon
                        )}
                        {modalConfig.btnText}
                    </Button>
                </div>
            }
        >
            <div className="space-y-3.5 pt-1">
                {preview && (
                    <div className={cn(
                        "rounded-lg border p-2.5 text-left",
                        isReject
                            ? "border-rose-100 bg-rose-50/50 dark:border-rose-950/30 dark:bg-rose-950/10"
                            : "border-blue-100 bg-blue-50/50 dark:border-slate-800 dark:bg-slate-900/40"
                    )}>
                        {isReject && (
                            <div className="flex items-center gap-2 text-[10px] font-extrabold tracking-wider text-rose-700 dark:text-rose-400 uppercase mb-1">
                                <AlertCircle size={12} />
                                Proyeksi Mundur Alur Kerja
                            </div>
                        )}
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[9px] font-medium text-slate-400 uppercase">{preview.label}</span>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{preview.target}</span>
                        </div>
                    </div>
                )}

                <div className="space-y-6">
                    <p className="text-text-desc text-sm leading-relaxed font-medium">
                        {modalConfig.infoText}
                    </p>

                    {/* Status Peninjauan Dokumen (Document Review Tracking) */}
                    {(() => {
                        if (isReject) return null;
                        const meta = contract?.workflow_step?.meta || {};
                        const hasF1 = meta.show_tab_f1 !== false && ((contract as any)?.f1_mode || 'upload') !== 'none';
                        const hasF2 = meta.show_tab_f2 !== false && ((contract as any)?.f2_mode || 'upload') !== 'none';
                        const hasAgreement = meta.show_tab_agreement !== false && ((contract as any)?.contract_mode || 'upload') !== 'none';

                        if (!hasF1 && !hasF2 && !hasAgreement) return null;

                        const stepKey = contract?.workflow_step_id ? `step_${contract.workflow_step_id}` : 'general';
                        const reviews = ((contract as any)?.doc_reviews?.[stepKey] || contract?.metadata?.doc_reviews?.[stepKey] || contract?.metadata?.[`doc_reviews_${stepKey}`] || {}) as Record<string, any>;

                        const docList: any[] = [];
                        if (hasF1) {
                            const isRev = !!reviews.f1?.reviewed;
                            docList.push({ id: 'f1', label: 'F1 (Permohonan)', isReviewed: isRev, info: reviews.f1 });
                        }
                        if (hasF2) {
                            const isRev = !!reviews.f2?.reviewed;
                            docList.push({ id: 'f2', label: 'F2 (Ringkasan)', isReviewed: isRev, info: reviews.f2 });
                        }
                        if (hasAgreement) {
                            const isRev = !!reviews.agreement?.reviewed;
                            docList.push({ id: 'agreement', label: 'Draft Perjanjian', isReviewed: isRev, info: reviews.agreement });
                        }

                        const reviewedCount = docList.filter(d => d.isReviewed).length;

                        return (
                            <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/50 p-3 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                                        <Eye size={13} className="text-primary" />
                                        Peninjauan Dokumen Tahap Ini
                                    </span>
                                    <span className={cn(
                                        'text-[9.5px] font-bold px-2 py-0.5 rounded-full',
                                        reviewedCount === docList.length
                                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold'
                                            : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold'
                                    )}>
                                        {reviewedCount} / {docList.length} Ditinjau
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                                    {docList.map((doc) => (
                                        <div
                                            key={doc.id}
                                            className={cn(
                                                'flex items-center justify-between p-2 rounded-lg border text-xs font-medium transition-colors',
                                                doc.isReviewed
                                                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-800/50 dark:text-emerald-300'
                                                    : 'bg-amber-50/80 border-amber-200 text-amber-800 dark:bg-amber-950/30 dark:border-amber-800/50 dark:text-amber-300'
                                            )}
                                        >
                                            <div className="flex items-center gap-1.5 truncate">
                                                {doc.isReviewed ? (
                                                    <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                                                ) : (
                                                    <AlertCircle size={13} className="text-amber-600 dark:text-amber-400 shrink-0" />
                                                )}
                                                <span className="truncate text-[11px] font-semibold">{doc.label}</span>
                                            </div>
                                            <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-white/70 dark:bg-black/30 shrink-0 ml-1">
                                                {doc.isReviewed ? 'Sudah Dibuka' : 'Belum Dibuka'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })()}

                    {/* Check-list Syarat Dokumen / Data Wajib Aksi Ini */}
                    {reqStatus.hasRequirements && (
                        <div className="rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-900/60 p-2.5 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-zinc-400">
                                    Checklist Syarat Wajib
                                </span>
                                <span className={cn(
                                    "text-[9px] font-bold px-2 py-0.5 rounded",
                                    reqStatus.allFilled
                                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                        : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                                )}>
                                    {reqStatus.filledCount} / {reqStatus.totalCount} Terisi
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                                {reqStatus.items.map((req) => (
                                    <div
                                        key={req.id}
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
                    )}

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
                            label={modalConfig.noteLabel}
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            rows={3}
                            placeholder={modalConfig.notePlaceholder}
                            required={modalConfig.noteRequired}
                        />

                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-text-desc text-[11px] font-bold uppercase">Lampiran Berkas Pendukung (Opsional)</label>
                                {attachments.length > 0 && (
                                    <span className={cn("text-[10px] font-bold", isReject ? "text-danger" : "text-primary")}>
                                        {attachments.length} Berkas Baru Dipilih
                                    </span>
                                )}
                            </div>

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
                                            "border-surface-border text-text-desc flex h-auto w-full flex-col items-center justify-center gap-1.5 border-2 border-dashed py-5 transition-all rounded-lg cursor-pointer",
                                            isReject
                                                ? "hover:border-danger hover:text-danger hover:bg-danger/5"
                                                : "hover:border-primary hover:text-primary hover:bg-surface-muted",
                                            isDragging && (isReject ? "border-danger bg-danger/10 scale-[0.99]" : "border-primary bg-primary/10 scale-[0.99]")
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
                                                "w-full text-xs font-semibold flex items-center justify-center gap-1.5 border border-dashed h-8 mt-1 rounded-md cursor-pointer transition-all",
                                                isReject
                                                    ? "border-danger/40 text-danger hover:bg-danger/5"
                                                    : "border-primary/40 text-primary hover:bg-primary/5",
                                                isDragging && (isReject ? "bg-danger/15 border-danger" : "bg-primary/15 border-primary")
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

export const SharedApproveModal = SharedActionModal;

export interface SharedRejectModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (reason: string, attachment?: File | File[]) => Promise<void>;
    actionAlias?: string;
    actionId?: string;
    contract?: any;
}

export function SharedRejectModal({
    open,
    onClose,
    onSubmit,
    actionAlias,
    actionId,
    contract,
}: SharedRejectModalProps) {
    return (
        <SharedActionModal
            open={open}
            onClose={onClose}
            contract={contract}
            actionCode="reject"
            actionId={actionId}
            actionAlias={actionAlias || 'Tolak Kontrak'}
            onSubmit={async (reason, attachment) => {
                await onSubmit(reason, attachment);
            }}
        />
    );
}
