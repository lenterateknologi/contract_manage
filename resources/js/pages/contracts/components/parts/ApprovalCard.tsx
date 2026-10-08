import { UserAvatarIcon } from '@/components/profile/UserAvatar';
import { ActionBadge, FileChipIcon, getActionConfig } from '@/components/ui';
import { Badge } from '@/components/ui/feedback/Badge';
import { formatFileSize } from '@/lib/formatters';
import { cn, formatDateTime } from '@/lib/utils';
import DocumentPreviewModal from '@/pages/contracts/components/modals/DocumentPreviewModal';
import { Contract, ContractApproval } from '@/pages/contracts/types';
import { StatusBadge } from '@/components/ui/feedback/StatusBadge';

interface ApprovalCardProps {
    approval: ContractApproval;
    stepNumber: string;
    displaySubSteps?: boolean;
    contract?: Contract;
    showDetails?: boolean;
    isLite?: boolean;
    isSubStep?: boolean;
    isPending?: boolean;
}

export function ApprovalCard({
    approval: a,
    stepNumber,
    displaySubSteps = false,
    contract,
    showDetails = false,
    isLite = false,
    isSubStep = false,
    isPending = false,
}: ApprovalCardProps) {
    const [isApproverListExpanded, setIsApproverListExpanded] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const isApproved = a.status === 'approved';
    const isRejected = a.status === 'rejected';
    const isSkipped = (a.status as string) === 'SKIPPED';
    const cleanActionAlias = (a.action_alias || '').toLowerCase().trim();
    const cleanActionCode = (a.action_code || '').toLowerCase().trim();
    const isEffectivelyRejected =
        isRejected || cleanActionCode === 'reject' || cleanActionAlias.includes('tolak') || cleanActionAlias.includes('reject');

    // Status is truly Pending if explicitly marked as pending or passed via isPending prop
    const isCardPending = !isApproved && !isRejected && !isSkipped && Boolean(isPending || a.status === 'pending');
    const isCardWaiting = !isApproved && !isRejected && !isSkipped && !isCardPending;

    const hasValidSubStep = a.sub_step != null && String(a.sub_step) !== '' && String(a.sub_step) !== 'null' && String(a.sub_step) !== 'undefined';
    const hasSubStep = Boolean(isSubStep || hasValidSubStep);

    const finalStepNumber = displaySubSteps && hasValidSubStep ? `${stepNumber}.${a.sub_step}` : stepNumber;

    // Cari workflow step yang cocok untuk card ini (prioritaskan data workflow_step yang sudah di-attach pada approval)
    const matchedStep =
        a.workflow_step || contract?.workflow?.steps?.find((s: any) => (a.workflow_step_id && s.id === a.workflow_step_id) || s.step === a.sequence);
    const stepMeta = (matchedStep as any)?.meta || {};
    const stepActions: any[] = (matchedStep as any)?.action_configs || (matchedStep as any)?.actions || [];

    const isAutoStep = Boolean(
        a.approver_type === 'auto' ||
        a.action_code === 'auto' ||
        a.role === 'Sistem' ||
        a.approver_name === 'System' ||
        (matchedStep?.label || '').includes('Kembali ke Alur Utama') ||
        (a.step_name || '').includes('Kembali ke Alur Utama'),
    );

    // Cari action spesifik yang dieksekusi approver
    const executedAction =
        stepActions.find((act: any) => {
            if (a.action_id && act.id === a.action_id) return true;
            if (a.action_alias && act.alias && act.alias.toLowerCase() === a.action_alias.toLowerCase()) return true;
            return false;
        }) || (a.action_code ? stepActions.find((act: any) => (act.action_code || act.code)?.toLowerCase() === a.action_code?.toLowerCase()) : null);

    // Prioritaskan target_status dari executed action, lalu target_status dari step meta
    const targetStatusCode = executedAction?.target_status || stepMeta.target_status || null;

    // Resolve konfigurasi action & warna spesifik kartu
    const actionConfig = getActionConfig(
        a.action_code || (isRejected ? 'reject' : 'approve'),
        a.action_alias,
        isApproved,
        isEffectivelyRejected,
        targetStatusCode,
        null,
    );

    const cardCustomStyle =
        (isApproved || isRejected || isEffectivelyRejected) && actionConfig.hexColor
            ? {
                  backgroundColor: `${actionConfig.hexColor}08`,
                  borderColor: `${actionConfig.hexColor}30`,
              }
            : undefined;

    // Check if step or approval has configured actions
    const hasActions = Boolean(a.action_code || a.action_alias || (stepActions && stepActions.length > 0));

    return (
        <div
            style={cardCustomStyle}
            className={cn(
                'group relative flex w-full flex-col rounded-lg border border-transparent px-1.5 py-1 transition-all duration-200',
                isCardPending && hasActions ? 'border-amber-500/25 bg-amber-500/5 shadow-2xs' : '',
                isApproved && !isEffectivelyRejected && !cardCustomStyle ? 'border-emerald-500/20 bg-emerald-500/5' : '',
                (isRejected || isEffectivelyRejected) && !cardCustomStyle ? 'border-rose-500/20 bg-rose-500/5' : '',
                isLite ? 'gap-1' : 'gap-1.5',
            )}
        >
            {/* Top row */}
            <div className="flex w-full items-center justify-between gap-1.5 pl-0.5">
                <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
                    {/* Avatar */}
                    <div className="shrink-0">
                        {(() => {
                            if (isAutoStep) {
                                return (
                                    <div className="ring-surface-base flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-violet-500/30 bg-violet-500/15 text-violet-600 shadow-2xs ring-1 dark:text-violet-400">
                                        <Bot size={13} strokeWidth={2.2} />
                                    </div>
                                );
                            }
                            const approverName =
                                a.approver?.name || a.approver_name || (a.target_approvers ? a.target_approvers.split(',')[0].trim() : null);
                            if (a.approver || approverName) {
                                return (
                                    <UserAvatarIcon
                                        user={a.approver}
                                        name={approverName}
                                        size="sm"
                                        className={cn(
                                            'h-6 w-6 shrink-0 text-[10px] ring-1',
                                            isCardPending && hasActions ? 'ring-amber-500/50' : 'ring-surface-base',
                                        )}
                                    />
                                );
                            }
                            return (
                                <div
                                    className={cn(
                                        'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border shadow-2xs',
                                        isCardPending && hasActions
                                            ? 'border-amber-500/40 bg-amber-500/15 text-amber-600 ring-2 ring-amber-500/20 dark:text-amber-400'
                                            : 'border-border bg-muted text-muted-foreground ring-surface-base ring-1',
                                    )}
                                >
                                    {isCardPending && hasActions ? (
                                        <Clock size={12} strokeWidth={2.5} className="animate-pulse" />
                                    ) : (
                                        <Lock size={11} strokeWidth={2} />
                                    )}
                                </div>
                            );
                        })()}
                    </div>

                    {/* Approver Details */}
                    {isAutoStep ? (
                        <div className={cn('flex min-w-0', isLite ? 'flex-row flex-wrap items-center gap-1.5' : 'flex-col')}>
                            <div className="flex min-w-0 items-center gap-1">
                                <span className={cn('text-text-main truncate leading-tight font-bold', isLite ? 'text-[11px]' : 'text-[11px]')}>
                                    System
                                </span>
                            </div>
                            <div className="text-text-soft flex flex-wrap items-center gap-1.5 text-[9.5px]">
                                <Badge
                                    variant="outline"
                                    className="rounded-xs border-violet-500/25 bg-violet-500/10 px-1.5 py-0 text-[8.5px] font-semibold text-violet-700 uppercase dark:text-violet-300"
                                >
                                    Sistem (Otomatis)
                                </Badge>
                            </div>
                        </div>
                    ) : a.approver ? (
                        <div className={cn('flex min-w-0', isLite ? 'flex-row flex-wrap items-center gap-1.5' : 'flex-col')}>
                            <div className="flex min-w-0 items-center gap-1">
                                <span className={cn('text-text-main truncate leading-tight font-bold', isLite ? 'text-[11px]' : 'text-[11px]')}>
                                    {a.approver.name}
                                </span>
                            </div>
                            <div className="text-text-soft flex flex-wrap items-center gap-1.5 text-[9.5px]">
                                {a.batch_no && a.batch_no > 1 && (
                                    <Badge
                                        variant="outline"
                                        className="rounded-xs border-amber-500/25 bg-amber-500/10 px-1 py-0 text-[8px] font-bold tracking-wider text-amber-700 uppercase dark:text-amber-300"
                                    >
                                        Batch {a.batch_no}
                                    </Badge>
                                )}
                                {hasSubStep && (
                                    <Badge
                                        variant="outline"
                                        className="rounded-xs border-indigo-500/25 bg-indigo-500/10 px-1 py-0 text-[8px] font-bold tracking-wider text-indigo-700 uppercase dark:text-indigo-300"
                                    >
                                        Sub {finalStepNumber}
                                    </Badge>
                                )}
                                {!isLite && a.approver.email && <span className="truncate opacity-75">{a.approver.email}</span>}
                                {!isLite && a.role && (
                                    <Badge
                                        variant="outline"
                                        className="text-muted-foreground border-border bg-muted/50 rounded-xs px-1.5 py-0 text-[8.5px] font-semibold uppercase"
                                    >
                                        {a.role}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex min-w-0 flex-col">
                            <div className="flex items-center gap-1">
                                {(() => {
                                    if (a.target_approvers && a.target_approvers.includes(',')) {
                                        const names = a.target_approvers
                                            .split(',')
                                            .map((s) => s.trim())
                                            .filter(Boolean);
                                        const maxVisible = isLite ? 1 : 2;
                                        const visible = isApproverListExpanded ? names : names.slice(0, maxVisible);
                                        const remaining = names.length - maxVisible;

                                        return (
                                            <div className="custom-scrollbar flex max-h-[100px] flex-wrap items-center gap-1 overflow-y-auto">
                                                {visible.map((name, i) => (
                                                    <span
                                                        key={i}
                                                        className={cn(
                                                            'py-0.2 inline-flex items-center rounded border px-1.5 text-[9.5px] font-bold',
                                                            isCardPending
                                                                ? 'border-amber-500/40 bg-amber-500/15 text-amber-900 dark:text-amber-200'
                                                                : 'bg-surface-muted border-border/40 text-text-main',
                                                        )}
                                                    >
                                                        {name}
                                                    </span>
                                                ))}
                                                {!isApproverListExpanded && remaining > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setIsApproverListExpanded(true);
                                                        }}
                                                        className="bg-primary/10 border-primary/25 hover:bg-primary/20 py-0.2 text-primary inline-flex cursor-pointer items-center gap-0.5 rounded border px-1 text-[9px] font-semibold"
                                                    >
                                                        +{remaining} <ChevronDown size={8} strokeWidth={2} />
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    }
                                    return (
                                        <span
                                            className={cn(
                                                'truncate text-[11px] leading-tight font-bold',
                                                isCardPending ? 'font-extrabold text-amber-900 dark:text-amber-200' : 'text-text-main',
                                            )}
                                        >
                                            {a.target_approvers || a.approver_name || (a.role ? `Menunggu ${a.role}` : 'Belum Ditentukan')}
                                        </span>
                                    );
                                })()}
                            </div>
                            {a.role && (
                                <div className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-1.5 text-[9px]">
                                    {a.batch_no && a.batch_no > 1 && (
                                        <Badge
                                            variant="outline"
                                            className="rounded-xs border-amber-500/25 bg-amber-500/10 px-1 py-0 text-[8px] font-bold tracking-wider text-amber-700 uppercase dark:text-amber-300"
                                        >
                                            Batch {a.batch_no}
                                        </Badge>
                                    )}
                                    {hasSubStep && (
                                        <Badge
                                            variant="outline"
                                            className="rounded-xs border-indigo-500/25 bg-indigo-500/10 px-1 py-0 text-[8px] font-bold tracking-wider text-indigo-700 uppercase dark:text-indigo-300"
                                        >
                                            Sub {finalStepNumber}
                                        </Badge>
                                    )}
                                    <span className="font-semibold uppercase">{a.role}</span>
                                    {a.department_name && <span>• {a.department_name}</span>}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Status & Timestamps */}
                <div className="flex shrink-0 items-center gap-2">
                    {/* Status Badge */}
                    {(a.action_alias || (a.action_code && a.action_code !== 'approve')) && (isApproved || isRejected || isEffectivelyRejected) ? (
                        <ActionBadge
                            actionCode={a.action_code || (isEffectivelyRejected ? 'reject' : 'approve')}
                            alias={a.action_alias}
                            targetStatus={targetStatusCode}
                            size="xs"
                            isApproved={isApproved}
                            isRejected={isEffectivelyRejected}
                        />
                    ) : isApproved ? (
                        <ActionBadge actionCode="approve" alias="Setujui" targetStatus={targetStatusCode} size="xs" isApproved={true} />
                    ) : isRejected || isEffectivelyRejected ? (
                        <ActionBadge actionCode="reject" alias="Tolak" targetStatus={targetStatusCode || 'rejected'} size="xs" isRejected={true} />
                    ) : isCardPending && hasActions ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 text-[9px] font-bold tracking-wider text-amber-700 uppercase shadow-2xs dark:text-amber-300">
                            <span className="h-1.5 w-1.5 shrink-0 animate-ping rounded-full bg-amber-500" />
                            <span>Pending</span>
                        </span>
                    ) : isCardWaiting ? (
                        <span className="bg-muted/60 border-border/60 text-muted-foreground inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[8.5px] font-bold tracking-wider uppercase">
                            <Lock size={8.5} className="shrink-0" />
                            <span>Waiting</span>
                        </span>
                    ) : (a.status as string) !== 'pending' && (a.status as string) !== 'waiting' ? (
                        <StatusBadge status={a.status} size="sm" />
                    ) : targetStatusCode ? (
                        <StatusBadge status={targetStatusCode} size="sm" />
                    ) : null}

                    {/* Timestamps: Waktu Eksekusi (Jika sudah diputuskan) */}
                    {a.decided_at && (
                        <div className="flex flex-col items-end gap-0.5 text-[9.5px]">
                            <span className="text-text-main flex items-center gap-1 font-semibold" title="Waktu Eksekusi / Keputusan">
                                <Clock size={10} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                                <span className="text-text-soft font-normal">Selesai:</span> {formatDateTime(a.decided_at)}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Syarat Dokumen Wajib untuk Step Card Ini (Hanya di mode detail / full dan BUKAN untuk sub-step dan HANYA untuk current actor) */}
            {showDetails &&
                !hasSubStep &&
                (contract?.is_current_actor ?? contract?.can_approve) &&
                (() => {
                    let stepMeta = a.workflow_step?.meta;
                    let actions = a.workflow_step?.action_configs || [];

                    if (!stepMeta && contract?.workflow?.steps) {
                        const matchedStep = contract.workflow.steps.find((s: any) => s.step === a.sequence || s.id === a.workflow_step_id);
                        if (matchedStep) {
                            stepMeta = matchedStep.meta;
                            if (!actions.length) actions = matchedStep.action_configs || [];
                        }
                    }
                    stepMeta = stepMeta || {};

                    // Ambil required fields dari stepMeta (checkbox Wajib Diisi) ATAU dari action_configs
                    const actionReqFields: string[] = actions
                        .filter(
                            (act: any) => !['reject', 'revisi', 'return'].includes((act.action_code || act.master_action_code || '').toLowerCase()),
                        )
                        .flatMap((act: any) => act.required_fields || []);
                    const requirePic = !!stepMeta.require_pic || actionReqFields.includes('pic') || actionReqFields.includes('assigned_pic');
                    const requireF1 = !!stepMeta.require_f1 || actionReqFields.includes('f1');
                    const requireF2 = !!stepMeta.require_f2 || actionReqFields.includes('f2');
                    const requireAgreement = !!stepMeta.require_agreement || actionReqFields.includes('agreement');
                    const requireTitle = !!stepMeta.require_title || actionReqFields.includes('title');
                    const requireVendor = !!stepMeta.require_vendor || actionReqFields.includes('vendor');
                    const requireCategory = !!stepMeta.require_category || actionReqFields.includes('category');
                    const requireContractNo =
                        !!stepMeta.require_f2_contract_no || actionReqFields.includes('contract_no') || actionReqFields.includes('f2_contract_no');
                    const requireTax = !!stepMeta.require_tax_toggle || actionReqFields.includes('tax_toggle') || actionReqFields.includes('tax');
                    const requirePrice = !!stepMeta.require_price || actionReqFields.includes('price');
                    const requirePeriod = !!stepMeta.require_period || actionReqFields.includes('period');

                    const reqList = [];

                    if (requirePic) {
                        const isFilled = !!(
                            contract?.assigned_pic_id ||
                            contract?.metadata?.assigned_pic_id ||
                            (contract as any)?.assigned_pic ||
                            (contract as any)?.assignedPic
                        );
                        reqList.push({ label: 'Data PIC', isFilled });
                    }

                    if (requireTitle) {
                        const isFilled = !!contract?.title;
                        reqList.push({ label: 'Judul Pengajuan', isFilled });
                    }
                    if (requireVendor) {
                        const isFilled = !!(contract?.vendor_id || (contract as any)?.vendor);
                        reqList.push({ label: 'Pihak Kedua ', isFilled });
                    }
                    if (requireCategory) {
                        const isFilled = !!(contract?.contract_type_id || (contract as any)?.contract_type);
                        reqList.push({ label: 'Kategori Dokumen', isFilled });
                    }
                    if (requireContractNo) {
                        const isFilled = !!contract?.contract_no;
                        reqList.push({ label: 'No. Dokumen', isFilled });
                    }
                    if (requireTax) {
                        const isFilled =
                            (contract?.tax_required !== null && contract?.tax_required !== undefined) ||
                            contract?.metadata?.tax_required !== undefined;
                        reqList.push({ label: 'Penentuan Pajak', isFilled });
                    }
                    if (requirePrice) {
                        const isFilled = contract?.price !== null && contract?.price !== undefined && contract?.price !== '';
                        reqList.push({ label: 'Nilai / Estimasi Biaya', isFilled });
                    }
                    if (requirePeriod) {
                        const isFilled = (!!contract?.contract_date || !!contract?.start_date) && !!contract?.end_date;
                        reqList.push({ label: 'Masa Berlaku', isFilled });
                    }

                    // Untuk step yang sudah selesai/diproses atau sedang berlangsung, kita periksa apakah ada pengunggahan dokumen pada/setelah step tersebut dimulai
                    const stepStartTime = a.step_entry_at || a.created_at;

                    const hasDocUploadedInStep = (type: string) => {
                        const hasVersion =
                            contract?.versions &&
                            contract.versions.some((v: any) => {
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
                        const isFilled =
                            hasDocUploadedInStep('f1') ||
                            !!(
                                contract?.f1_file ||
                                contract?.metadata?.f1_file ||
                                (contract?.form_submissions || (contract as any)?.formSubmissions || []).some(
                                    (fs: any) => fs.document_type === 'f1',
                                ) ||
                                (contract as any)?.f1_submission ||
                                (contract as any)?.f1_form_data ||
                                contract?.metadata?.f1_form_data ||
                                (contract?.f1_items && contract.f1_items.length > 0)
                            );
                        reqList.push({ label: 'Sub-dokumen F1', isFilled });
                    }
                    if (requireF2) {
                        const isFilled =
                            hasDocUploadedInStep('f2') ||
                            !!(
                                contract?.f2_file ||
                                contract?.metadata?.f2_file ||
                                (contract?.form_submissions || (contract as any)?.formSubmissions || []).some(
                                    (fs: any) => fs.document_type === 'f2',
                                ) ||
                                (contract as any)?.f2_submission ||
                                (contract as any)?.f2_form_data ||
                                contract?.metadata?.f2_form_data ||
                                contract?.contract_no ||
                                contract?.price
                            );
                        reqList.push({ label: 'Sub-dokumen F2', isFilled });
                    }
                    if (requireAgreement) {
                        const isFilled =
                            hasDocUploadedInStep('agreement') ||
                            !!(
                                contract?.agreement_file ||
                                contract?.metadata?.agreement_file ||
                                (contract?.form_submissions || (contract as any)?.formSubmissions || []).some(
                                    (fs: any) => fs.document_type === 'agreement' || fs.document_type === 'contract',
                                ) ||
                                (contract as any)?.agreement_submission ||
                                contract?.agreement_content ||
                                contract?.metadata?.agreement_content ||
                                (contract?.versions &&
                                    (contract.versions as any[]).some((v: any) => v.document_type === 'agreement' || v.document_type === 'contract'))
                            );
                        reqList.push({ label: 'Sub-dokumen Perjanjian', isFilled });
                    }

                    if (reqList.length === 0) return null;

                    return (
                        <div className="mt-1 w-full pl-1">
                            <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-slate-200/80 bg-slate-50/80 p-1.5 dark:border-zinc-800 dark:bg-zinc-900/60">
                                <span className="mr-0.5 text-[9.5px] font-bold text-slate-600 uppercase dark:text-zinc-400">Syarat Wajib:</span>
                                {reqList.map((req, rIdx) => (
                                    <span
                                        key={rIdx}
                                        className={cn(
                                            'flex items-center gap-1 rounded border px-2 py-0.5 text-[9.5px] font-bold tracking-wide',
                                            req.isFilled
                                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                                                : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300',
                                        )}
                                    >
                                        {req.isFilled ? (
                                            <CheckCircle2 size={11} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                                        ) : (
                                            <X size={11} className="shrink-0 text-rose-600 dark:text-rose-400" />
                                        )}
                                        {req.label}: {req.isFilled ? 'Sudah Diisi' : 'Wajib Diisi'}
                                    </span>
                                ))}
                            </div>
                        </div>
                    );
                })()}

            {/* Otoritas Langkah Badges (Hidden)
            {a.approver_authorities && a.approver_authorities.length > 0 && (
                <div className="mt-1.5 w-full pl-1">
                    <div className="flex flex-col gap-1.5 rounded-lg border border-primary/15 bg-primary/5 p-2 dark:border-primary/20 dark:bg-primary/10">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary uppercase tracking-wide">
                            <i className="fa-solid fa-shield-halved text-[10px]" />
                            <span>Otoritas Langkah Terkonfigurasi:</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1">
                            {a.approver_authorities.map((auth: any, idx: number) => (
                                <div key={idx} className="flex flex-wrap items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md px-2 py-1 text-[10px]">
                                    <span className="font-bold text-slate-700 dark:text-slate-300 uppercase">
                                        [{auth.authority_type}]
                                    </span>
                                    <span className="text-slate-600 dark:text-slate-400">
                                        Role: <strong className="text-slate-800 dark:text-slate-200">{auth.role_use_initiator ? 'Sesuai Inisiator' : (auth.role_name || '-')}</strong>
                                    </span>
                                    <span className="text-slate-300 dark:text-slate-700">•</span>
                                    <span className="text-slate-600 dark:text-slate-400">
                                        Dept: <strong className="text-slate-800 dark:text-slate-200">{auth.department_use_initiator ? 'Sesuai Inisiator' : (auth.department_name || '-')}</strong>
                                    </span>
                                    <span className="text-slate-300 dark:text-slate-700">•</span>
                                    <span className="text-slate-600 dark:text-slate-400">
                                        Holding/Group: <strong className="text-slate-800 dark:text-slate-200">{auth.company_group_use_initiator ? 'Sesuai Inisiator' : (auth.company_group_name || '-')}</strong>
                                    </span>
                                    <span className="text-slate-300 dark:text-slate-700">•</span>
                                    <span className="text-slate-600 dark:text-slate-400">
                                        PT: <strong className="text-slate-800 dark:text-slate-200">{auth.company_use_initiator ? 'Sesuai Inisiator' : (auth.company_name || '-')}</strong>
                                    </span>
                                    <span className="text-slate-300 dark:text-slate-700">•</span>
                                    <span className="text-slate-600 dark:text-slate-400">
                                        Wilayah: <strong className="text-slate-800 dark:text-slate-200">{auth.region_use_initiator ? 'Sesuai Inisiator' : (auth.region_name || '-')}</strong>
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            */}

            {/* Debug SQL Query Display (Hidden)
            {a.debug_sql_queries && a.debug_sql_queries.length > 0 && (
                <div className="mt-1.5 w-full pl-1">
                    <div className="rounded-lg border border-slate-300 dark:border-slate-800 bg-slate-900 p-2 text-slate-200">
                        <div className="flex items-center gap-1.5 text-[9.5px] font-mono font-bold text-amber-400 uppercase tracking-wider mb-1">
                            <i className="fa-solid fa-code text-[10px]" />
                            <span>SQL Query Debugger:</span>
                        </div>
                        <div className="flex flex-col gap-1 font-mono text-[10px] leading-relaxed break-all">
                            {a.debug_sql_queries.map((sql, idx) => (
                                <div key={idx} className="bg-slate-950 p-1.5 rounded border border-slate-800 text-emerald-400 select-all">
                                    <span className="text-slate-500 font-bold mr-1">[{idx + 1}]</span>
                                    {sql}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            */}

            {/* Comment card */}
            {a.comment && (
                <div className="mt-0.5 w-full pl-0.5">
                    <div
                        className={cn(
                            'rounded-md border',
                            isLite
                                ? 'border-slate-200/80 bg-slate-50/90 p-1.5 text-[10px] dark:border-zinc-800 dark:bg-zinc-900/80'
                                : 'border-slate-200 bg-white p-2 text-[11px] shadow-xs dark:border-zinc-800 dark:bg-zinc-900/90',
                        )}
                    >
                        {!isLite && (
                            <div className="mb-0.5 text-[8.5px] font-bold tracking-wider text-slate-500 uppercase dark:text-zinc-400">Catatan:</div>
                        )}
                        <div className="leading-relaxed font-normal whitespace-pre-wrap text-slate-800 dark:text-zinc-200">
                            {isLite ? `“${a.comment}”` : a.comment}
                        </div>
                    </div>
                </div>
            )}

            {/* Action Attachment */}
            {a.attachment_path &&
                contract &&
                (() => {
                    const fileName = a.attachment_name || a.attachment_path || '';
                    const isPdf = /\.pdf$/i.test(fileName);
                    const isImage = /\.(jpe?g|png|gif|webp|svg)$/i.test(fileName);
                    const canPreview = isPdf || isImage;
                    const previewUrl = isPdf
                        ? `/api/contracts/${contract.id}/attachment-pdf/${a.id}`
                        : `/api/contracts/${contract.id}/attachment/${a.id}`;

                    return (
                        <div className="mt-0.5 w-full pl-0.5">
                            <div
                                className={cn(
                                    'border-primary/20 bg-primary/5 flex items-center justify-between gap-2 rounded-md border px-2.5 py-1.5 transition-colors',
                                    isLite ? 'text-[9.5px]' : 'text-[10.5px]',
                                )}
                            >
                                <div
                                    onClick={() => canPreview && setPreviewOpen(true)}
                                    className={cn('group/attach flex min-w-0 items-center gap-2', canPreview && 'cursor-pointer')}
                                    title={canPreview ? 'Klik untuk pratinjau lampiran' : undefined}
                                >
                                    <FileChipIcon fileName={fileName} size="xs" />
                                    <div className="flex min-w-0 flex-col">
                                        <span
                                            className={cn(
                                                'text-primary flex max-w-[180px] items-center gap-1.5 truncate font-semibold sm:max-w-[280px]',
                                                canPreview && 'group-hover/attach:underline',
                                            )}
                                        >
                                            <span className="truncate">{a.attachment_name || 'Lampiran Aksi'}</span>
                                            {a.file_size ? (
                                                <span className="text-muted-foreground/80 shrink-0 text-[9px] font-normal">
                                                    ({formatFileSize(a.file_size)})
                                                </span>
                                            ) : null}
                                        </span>
                                        <span className="text-muted-foreground text-[8.5px] font-bold uppercase">
                                            Lampiran{' '}
                                            {a.action_alias || a.action_code || (isApproved ? 'Persetujuan' : isRejected ? 'Penolakan' : 'Aksi')}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex shrink-0 items-center gap-1.5">
                                    {canPreview && (
                                        <button
                                            type="button"
                                            onClick={() => setPreviewOpen(true)}
                                            className="bg-primary/10 hover:bg-primary/20 text-primary flex cursor-pointer items-center gap-1 rounded px-2 py-0.5 text-[8.5px] font-bold uppercase transition-all"
                                            title="Lihat Pratinjau"
                                        >
                                            <Eye size={10} />
                                            <span>Lihat</span>
                                        </button>
                                    )}
                                    <a
                                        href={`/api/contracts/${contract.id}/attachment/${a.id}?download=1`}
                                        download
                                        className="bg-primary/10 hover:bg-primary/20 text-primary flex cursor-pointer items-center gap-1 rounded px-2 py-0.5 text-[8.5px] font-bold uppercase transition-all"
                                        title="Unduh Lampiran"
                                    >
                                        <Download size={10} />
                                        <span>Unduh</span>
                                    </a>
                                </div>
                            </div>

                            {canPreview && previewOpen && (
                                <DocumentPreviewModal
                                    isOpen={previewOpen}
                                    onClose={() => setPreviewOpen(false)}
                                    url={previewUrl}
                                    fileName={a.attachment_name || 'Lampiran Aksi'}
                                />
                            )}
                        </div>
                    );
                })()}
        </div>
    );
}
