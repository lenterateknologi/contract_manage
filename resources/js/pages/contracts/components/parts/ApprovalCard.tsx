import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ContractApproval } from '@/pages/contracts/types';
import { Check, Clock, ChevronDown } from 'lucide-react';
import { Avatar, StatusBadge } from '../ui/ui';

interface ApprovalCardProps {
    approval: ContractApproval;
    stepNumber: string;
    displaySubSteps?: boolean;
}

export function ApprovalCard({ approval: a, stepNumber, displaySubSteps = false }: ApprovalCardProps) {
    const [isApproverListExpanded, setIsApproverListExpanded] = useState(false);
    const isStaged = !a.is_active || (a.status as string) === 'SELANJUTNYA';
    const isApproved = a.status === 'approved';
    const isRejected = a.status === 'rejected';
    const isPending = a.status === 'pending' && a.is_active;
    const isWaiting = a.status === 'waiting';
    const isSkipped = (a.status as string) === 'SKIPPED';

    const finalStepNumber = displaySubSteps && a.sub_step ? `${stepNumber}.${a.sub_step}` : stepNumber;

    return (
        <div
            className={cn(
                'group bg-surface-base relative flex flex-col gap-1.5 rounded-lg border p-2 transition-all duration-200 w-full shadow-2xs',
                isApproved && 'border-emerald-500/40 bg-emerald-500/5 hover:border-emerald-500/60 dark:bg-emerald-950/20 dark:border-emerald-500/40',
                isRejected && 'border-rose-500/40 bg-rose-500/5 hover:border-rose-500/60 dark:bg-rose-950/20 dark:border-rose-500/40',
                isPending && 'border-amber-500/50 bg-amber-500/8 ring-1 ring-amber-500/20 hover:border-amber-500 dark:bg-amber-950/30 dark:border-amber-500/50',
                isSkipped && 'border-slate-300 dark:border-zinc-700 bg-surface-muted/20 opacity-50 grayscale',
                (isWaiting || isStaged) && !isSkipped && 'border-dashed border-slate-300 dark:border-zinc-700 bg-surface-muted/20 opacity-75',
            )}
        >
            {/* Left indicator bar */}
            <div className={cn(
                'absolute top-1 bottom-1 left-0 w-0.5 rounded-r-full',
                isApproved && 'bg-emerald-500',
                isRejected && 'bg-rose-500',
                isPending && 'animate-pulse bg-amber-500',
                (isWaiting || isStaged || isSkipped) && 'bg-surface-border',
            )} />

            {/* Top row */}
            <div className="flex items-center justify-between gap-2 w-full pl-1">
                <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
                    {/* Avatar */}
                    <div className="shrink-0">
                        {a.approver ? (
                            <Avatar user={a.approver} size="sm" className="h-6 w-6 ring-1 ring-surface-base" />
                        ) : (
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-muted text-text-soft">
                                <Clock size={12} strokeWidth={2} />
                            </div>
                        )}
                    </div>

                    {/* Approver Details */}
                    {a.approver ? (
                        <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5">
                                <span className="text-text-main truncate text-[11px] font-bold leading-tight">
                                    {a.approver.name}
                                </span>
                                {isApproved && <Check size={12} className="shrink-0 text-emerald-500" strokeWidth={2.5} />}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-text-soft">
                                {a.approver.email && <span className="truncate opacity-75">{a.approver.email}</span>}
                                {a.role && (
                                    <span className="shrink-0 rounded bg-surface-muted px-1.5 py-0.5 text-[9px] font-semibold uppercase text-text-soft">
                                        {a.role}
                                    </span>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col min-w-0">
                            <div className="flex flex-wrap items-center gap-1">
                                {(() => {
                                    const approverList = a.target_approvers
                                        ? a.target_approvers.split(',').map((n) => n.trim()).filter(Boolean)
                                        : [];
                                    if (approverList.length > 1) {
                                        const visible = isApproverListExpanded ? approverList : approverList.slice(0, 3);
                                        const remaining = approverList.length - 3;
                                        return (
                                            <div className="flex flex-wrap items-center gap-1">
                                                {visible.map((name, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="inline-flex items-center rounded bg-surface-muted/90 border border-surface-border px-1.5 py-0.5 text-[10px] font-medium text-text-main"
                                                    >
                                                        {name}
                                                    </span>
                                                ))}
                                                {remaining > 0 && !isApproverListExpanded && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); setIsApproverListExpanded(true); }}
                                                        className="inline-flex items-center gap-0.5 rounded bg-primary/10 border border-primary/25 hover:bg-primary/20 px-1.5 py-0.5 text-[10px] font-semibold text-primary cursor-pointer"
                                                    >
                                                        +{remaining} <ChevronDown size={9} strokeWidth={2} />
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    }
                                    return (
                                        <span className="text-text-main truncate text-[11px] font-bold leading-tight">
                                            {a.target_approvers || `Semua ${a.role || 'Approver'}`}
                                        </span>
                                    );
                                })()}
                            </div>
                        </div>
                    )}
                </div>

                {/* Status & Timestamp */}
                <div className="flex flex-col items-end shrink-0 gap-0.5">
                    <StatusBadge status={a.status} size="sm" />
                    {a.decided_at && (
                        <span className="text-text-soft flex items-center gap-1 text-[9.5px] font-medium opacity-75 mt-0.5">
                            <Clock size={10} /> {a.decided_at}
                        </span>
                    )}
                </div>
            </div>

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
                <div className="mt-1 w-full pl-1">
                    <div className="rounded-md bg-white border border-slate-200 p-2 shadow-xs text-black dark:bg-white dark:text-black">
                        <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">
                            Catatan:
                        </div>
                        <div className="text-[11px] leading-relaxed font-normal whitespace-pre-wrap">
                            {a.comment}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
