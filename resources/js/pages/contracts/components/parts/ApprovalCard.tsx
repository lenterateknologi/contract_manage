import { useState } from 'react';
import { cn, formatDateTime } from '@/lib/utils';
import { Contract, ContractApproval } from '@/pages/contracts/types';
import { Check, Clock, ChevronDown, CheckCircle2, X, Lock } from 'lucide-react';
import { UserAvatarIcon } from '@/components/profile/UserAvatar';
import { Badge } from '@/components/ui/feedback/Badge';
import { StatusBadge } from '../ui/ui';

interface ApprovalCardProps {
    approval: ContractApproval;
    stepNumber: string;
    displaySubSteps?: boolean;
    contract?: Contract;
    showDetails?: boolean;
    isLite?: boolean;
    isSubStep?: boolean;
}

export function ApprovalCard({ approval: a, stepNumber, displaySubSteps = false, contract, showDetails = false, isLite = false, isSubStep = false }: ApprovalCardProps) {
    const [isApproverListExpanded, setIsApproverListExpanded] = useState(false);
    const isStaged = !a.is_active || (a.status as string) === 'SELANJUTNYA';
    const isApproved = a.status === 'approved';
    const isRejected = a.status === 'rejected';
    // Aktif = step ini adalah step kontrak saat ini (tidak bergantung pada nilai 'pending'/'waiting')
    const isCurrent = !isApproved && !isRejected && !!contract?.workflow_step_id && a.workflow_step_id === contract.workflow_step_id;
    const isSkipped = (a.status as string) === 'SKIPPED';
    const hasSubStep = isSubStep || a.sub_step != null;

    const finalStepNumber = displaySubSteps && a.sub_step ? `${stepNumber}.${a.sub_step}` : stepNumber;

    // Cari workflow step yang cocok untuk card ini
    const matchedStep = contract?.workflow?.steps?.find((s: any) => s.step === a.sequence || s.id === a.workflow_step_id) || a.workflow_step;
    const stepMeta = (matchedStep as any)?.meta || {};
    const stepActions: any[] = (matchedStep as any)?.actions || (matchedStep as any)?.action_configs || [];

    // Ambil target status: jika sudah diputuskan (approved/rejected), cari action terkait jika ada, atau gunakan target_status dari step
    const targetStatusCode = stepMeta.target_status || null;
    const statusColor = (isCurrent && contract?.status_info?.color) ? contract.status_info.color : null;

    return (
        <div
            className={cn(
                'group relative flex flex-col w-full transition-all duration-200 py-0.5',
                isLite ? 'gap-1' : 'gap-1.5',
            )}
        >

            {/* Top row */}
            <div className="flex items-center justify-between gap-1.5 w-full pl-0.5">
                <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
                    {/* Avatar */}
                    <div className="shrink-0">
                        {(() => {
                            const approverName = a.approver?.name || a.approver_name || (a.target_approvers ? a.target_approvers.split(',')[0].trim() : null);
                            if (a.approver || approverName) {
                                return (
                                    <UserAvatarIcon
                                        user={a.approver}
                                        name={approverName}
                                        size="sm"
                                        className="h-6 w-6 ring-1 ring-surface-base shrink-0 text-[10px]"
                                    />
                                );
                            }
                            return (
                                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground ring-1 ring-surface-base shadow-2xs">
                                    <Clock size={12} strokeWidth={2.5} />
                                </div>
                            );
                        })()}
                    </div>

                    {/* Approver Details */}
                    {a.approver ? (
                        <div className={cn("flex min-w-0", isLite ? "flex-row items-center gap-1.5 flex-wrap" : "flex-col")}>
                            <div className="flex items-center gap-1 min-w-0">
                                <span className={cn("text-text-main truncate font-bold leading-tight", isLite ? "text-[11px]" : "text-[11px]")}>
                                    {a.approver.name}
                                </span>
                                {isApproved && <Check size={11} className="shrink-0 text-emerald-500" strokeWidth={2.5} />}
                            </div>
                            <div className="flex items-center gap-1.5 text-[9.5px] text-text-soft flex-wrap">
                                {hasSubStep && (
                                    <Badge variant="outline" className="px-1 py-0 font-bold uppercase text-indigo-700 dark:text-indigo-300 border-indigo-500/25 bg-indigo-500/10 text-[8px] tracking-wider rounded-xs">
                                        Sub {finalStepNumber}
                                    </Badge>
                                )}
                                {!isLite && a.approver.email && <span className="truncate opacity-75">{a.approver.email}</span>}
                                {a.role && (
                                    <Badge variant="outline" className={cn(
                                        "px-1.5 py-0 font-semibold uppercase text-muted-foreground border-border bg-muted/50 rounded-xs",
                                        isLite ? "text-[8px]" : "text-[8.5px]"
                                    )}>
                                        {a.role}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1">
                                {(() => {
                                    if (a.target_approvers && a.target_approvers.includes(',')) {
                                        const names = a.target_approvers.split(',').map((s) => s.trim()).filter(Boolean);
                                        const maxVisible = isLite ? 1 : 2;
                                        const visible = isApproverListExpanded ? names : names.slice(0, maxVisible);
                                        const remaining = names.length - maxVisible;

                                        return (
                                            <div className="flex flex-wrap items-center gap-1">
                                                {visible.map((name, i) => (
                                                    <span
                                                        key={i}
                                                        className="inline-flex items-center rounded bg-surface-muted px-1 py-0.2 text-[9.5px] font-medium text-text-main"
                                                    >
                                                        {name}
                                                    </span>
                                                ))}
                                                {!isApproverListExpanded && remaining > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); setIsApproverListExpanded(true); }}
                                                        className="inline-flex items-center gap-0.5 rounded bg-primary/10 border border-primary/25 hover:bg-primary/20 px-1 py-0.2 text-[9px] font-semibold text-primary cursor-pointer"
                                                    >
                                                        +{remaining} <ChevronDown size={8} strokeWidth={2} />
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    }
                                    return (
                                        <span className="text-text-main truncate text-[11px] font-bold leading-tight">
                                            {a.target_approvers || 'Not Set'}
                                        </span>
                                    );
                                })()}
                            </div>
                        </div>
                    )}
                </div>

                {/* Status & Timestamp */}
                <div className="flex items-center gap-1.5 shrink-0">
                    {/* Status Badge */}
                    {a.status === 'waiting' ? (
                        <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 border border-amber-500/25 px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase text-amber-600 dark:text-amber-400">
                            <Lock size={9} className="shrink-0" />
                            <span>Menunggu Giliran</span>
                        </span>
                    ) : a.status === 'pending' && isCurrent ? (
                        <span className="inline-flex items-center gap-1 rounded bg-sky-500/10 border border-sky-500/25 px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase text-sky-600 dark:text-sky-400 animate-pulse">
                            <Clock size={9} className="shrink-0" />
                            <span>Giliran Meninjau</span>
                        </span>
                    ) : (a.status !== 'pending' && a.status !== 'waiting') ? (
                        <StatusBadge status={a.status} size="sm" />
                    ) : null}

                    {a.decided_at ? (
                        <span className="text-text-soft flex items-center gap-1 text-[10px] font-medium" title="Waktu Keputusan / Aksi">
                            <Clock size={10} className="text-text-soft shrink-0" /> {formatDateTime(a.decided_at)}
                        </span>
                    ) : (a.created_at || a.step_entry_at) ? (
                        <span className="text-text-soft flex items-center gap-1 text-[10px] font-medium" title="Waktu Masuk Step">
                            <Clock size={10} className="text-text-soft shrink-0" /> {formatDateTime(a.step_entry_at || a.created_at)}
                        </span>
                    ) : null}
                </div>
            </div>

            {/* Syarat Dokumen Wajib untuk Step Card Ini (Hanya di mode detail / full) */}
            {showDetails && (() => {
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
                const actionReqFields: string[] = actions.flatMap((act: any) => act.required_fields || []);
                const requirePic = !!stepMeta.require_pic || actionReqFields.includes('pic') || actionReqFields.includes('assigned_pic');
                const requireF1 = !!stepMeta.require_f1 || actionReqFields.includes('f1');
                const requireF2 = !!stepMeta.require_f2 || actionReqFields.includes('f2');
                const requireAgreement = !!stepMeta.require_agreement || actionReqFields.includes('agreement');

                const reqList = [];

                if (requirePic) {
                    const isFilled = !!(contract?.assigned_pic_id || contract?.metadata?.assigned_pic_id || (contract as any)?.assigned_pic || (contract as any)?.assignedPic);
                    reqList.push({ label: 'Data PIC', isFilled });
                }

                // Untuk step yang sudah selesai/diproses atau sedang berlangsung, kita periksa apakah ada pengunggahan dokumen pada/setelah step tersebut dimulai
                const stepStartTime = a.step_entry_at || a.created_at;

                const hasDocUploadedInStep = (type: string) => {
                    if (!contract?.versions) return false;
                    return contract.versions.some((v: any) => {
                        if (v.document_type !== type && !(type === 'agreement' && v.document_type === 'contract')) return false;
                        if (!stepStartTime || !v.created_at_raw) return true;
                        return new Date(v.created_at_raw).getTime() >= new Date(stepStartTime).getTime() - 5000;
                    });
                };

                if (requireF1) {
                    const isFilled = hasDocUploadedInStep('f1') || (a.sequence === 1 && !!(
                        contract?.f1_file ||
                        contract?.metadata?.f1_file ||
                        (contract as any)?.f1_submission ||
                        (contract as any)?.f1_form_data ||
                        contract?.metadata?.f1_form_data ||
                        (contract?.f1_items && contract.f1_items.length > 0)
                    ));
                    reqList.push({ label: 'Sub-dokumen F1', isFilled });
                }
                if (requireF2) {
                    const isFilled = hasDocUploadedInStep('f2') || (a.sequence === 1 && !!(
                        contract?.f2_file ||
                        contract?.metadata?.f2_file ||
                        (contract as any)?.f2_submission ||
                        (contract as any)?.f2_form_data ||
                        contract?.metadata?.f2_form_data ||
                        contract?.contract_no ||
                        contract?.price
                    ));
                    reqList.push({ label: 'Sub-dokumen F2', isFilled });
                }
                if (requireAgreement) {
                    const isFilled = hasDocUploadedInStep('agreement') || (a.sequence === 1 && !!(
                        contract?.agreement_file ||
                        contract?.metadata?.agreement_file ||
                        (contract as any)?.agreement_submission ||
                        contract?.agreement_content ||
                        contract?.metadata?.agreement_content
                    ));
                    reqList.push({ label: 'Sub-dokumen Perjanjian', isFilled });
                }

                if (reqList.length === 0) return null;

                return (
                    <div className="mt-1 w-full pl-1">
                        <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-md border border-slate-200/80 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-900/60">
                            <span className="text-[9.5px] font-bold text-slate-600 dark:text-zinc-400 uppercase mr-0.5">
                                Syarat Wajib:
                            </span>
                            {reqList.map((req, rIdx) => (
                                <span
                                    key={rIdx}
                                    className={cn(
                                        'px-2 py-0.5 rounded text-[9.5px] font-bold tracking-wide flex items-center gap-1 border',
                                        req.isFilled
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                                            : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                                    )}
                                >
                                    {req.isFilled ? (
                                        <CheckCircle2 size={11} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                                    ) : (
                                        <X size={11} className="text-rose-600 dark:text-rose-400 shrink-0" />
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
                    <div className={cn(
                        "rounded-md border text-black dark:bg-white dark:text-black",
                        isLite ? "p-1.5 bg-slate-50/90 border-slate-200/80 text-[10px]" : "p-2 bg-white border-slate-200 text-[11px] shadow-xs"
                    )}>
                        {!isLite && (
                            <div className="text-[8.5px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">
                                Catatan:
                            </div>
                        )}
                        <div className="leading-relaxed font-normal whitespace-pre-wrap">
                            {isLite ? `“${a.comment}”` : a.comment}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
