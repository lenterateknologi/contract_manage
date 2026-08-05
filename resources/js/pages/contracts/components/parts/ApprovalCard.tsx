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
                'group bg-surface-base relative flex items-center gap-2 rounded-md border px-2.5 py-1.5 transition-all duration-200 w-fit max-w-[95%] sm:max-w-xl',
                isApproved && 'border-emerald-500/50 bg-emerald-500/8 hover:border-emerald-500/70 dark:bg-emerald-950/20 dark:border-emerald-500/40',
                isRejected && 'border-rose-500/50 bg-rose-500/8 hover:border-rose-500/70 dark:bg-rose-950/20 dark:border-rose-500/40',
                isPending && 'border-amber-500/60 bg-amber-500/10 ring-1 ring-amber-500/20 hover:border-amber-500 dark:bg-amber-950/30 dark:border-amber-500/50',
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

            {/* Avatar */}
            <div className="pl-1 shrink-0">
                {a.approver ? (
                    <Avatar user={a.approver} size="sm" className="h-5 w-5 ring-1 ring-surface-base" />
                ) : (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-surface-muted text-text-soft">
                        <Clock size={10} strokeWidth={2} />
                    </div>
                )}
            </div>

            {/* Main content row */}
            <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
                {a.approver ? (
                    <>
                        <span className="text-text-main truncate text-[11px] font-semibold leading-tight">{a.approver.name}</span>
                        {isApproved && <Check size={10} className="shrink-0 text-emerald-500" strokeWidth={2.5} />}
                        <span className="text-text-soft truncate text-[10px] opacity-60 hidden sm:inline">{a.approver.email}</span>
                        {a.decided_at && (
                            <span className="text-text-soft flex shrink-0 items-center gap-0.5 text-[9px] opacity-50">
                                <Clock size={8} /> {a.decided_at}
                            </span>
                        )}
                    </>
                ) : (
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
                                                className="inline-flex items-center rounded bg-surface-muted/90 border border-surface-border px-1 py-0 text-[10px] font-medium text-text-main"
                                            >
                                                {name}
                                            </span>
                                        ))}
                                        {remaining > 0 && !isApproverListExpanded && (
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); setIsApproverListExpanded(true); }}
                                                className="inline-flex items-center gap-0.5 rounded bg-primary/10 border border-primary/25 hover:bg-primary/20 px-1 py-0 text-[10px] font-semibold text-primary cursor-pointer"
                                            >
                                                +{remaining} <ChevronDown size={9} strokeWidth={2} />
                                            </button>
                                        )}
                                    </div>
                                );
                            }
                            return (
                                <span className="text-text-main truncate text-[11px] font-semibold leading-tight">
                                    {a.target_approvers || `Semua ${a.role || 'Approver'}`}
                                </span>
                            );
                        })()}
                    </div>
                )}
            </div>

            {/* Status badge */}
            <div className="shrink-0">
                <StatusBadge status={a.status} size="sm" />
            </div>

            {/* Comment row */}
            {a.comment && (
                <div className="w-full col-span-full pl-6 pt-0.5 text-[9.5px] italic text-text-soft truncate opacity-60 border-t border-surface-border/40">
                    "{a.comment}"
                </div>
            )}
        </div>
    );
}
