import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ContractApproval } from '@/pages/contracts/types';
import { Check, Clock, ChevronDown, ChevronUp } from 'lucide-react';
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
                'group bg-surface-base relative flex flex-col justify-center gap-1.5 rounded-lg border-2 px-3 py-2 shadow-2xs transition-all duration-300 w-fit max-w-[95%] sm:max-w-xl',
                isApproved &&
                'border-emerald-500/60 bg-emerald-500/10 hover:border-emerald-500/80 dark:bg-emerald-950/30 dark:border-emerald-500/60',
                isRejected &&
                'border-rose-500/60 bg-rose-500/10 hover:border-rose-500/80 dark:bg-rose-950/30 dark:border-rose-500/60',
                isPending &&
                'border-amber-500/70 bg-amber-500/15 shadow-sm ring-2 ring-amber-500/20 hover:border-amber-500 dark:bg-amber-950/40 dark:border-amber-500/70',
                isSkipped &&
                'border-slate-300 dark:border-zinc-700 bg-surface-muted/20 opacity-50 grayscale',
                (isWaiting || isStaged) &&
                !isSkipped &&
                'border-dashed border-slate-300 dark:border-zinc-700 bg-surface-muted/30 opacity-80 hover:border-slate-400 dark:hover:border-zinc-600',
                'hover:shadow-xs',
            )}
        >
            {/* Visual indicator bar on the left */}
            <div
                className={cn(
                    'absolute top-1.5 bottom-1.5 left-0 w-0.5 rounded-r-full transition-all',
                    isApproved && 'bg-emerald-500',
                    isRejected && 'bg-rose-500',
                    isPending && 'animate-pulse bg-amber-500',
                    isSkipped && 'bg-surface-border',
                    (isWaiting || isStaged) && !isSkipped && 'bg-surface-border',
                )}
            />

            {/* Row 1: Approver Details + Status Badge */}
            <div className="flex items-center justify-between gap-3 w-full pl-1">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {a.approver ? (
                        <>
                            <Avatar user={a.approver} size="sm" className="h-6 w-6 shadow-2xs ring-1 ring-surface-base shrink-0" />
                            <div className="flex items-center gap-2 overflow-hidden min-w-0 flex-1 flex-wrap">
                                <span className="text-text-main truncate text-[11.5px] leading-tight font-bold">{a.approver.name}</span>
                                {isApproved && <Check size={11} className="shrink-0 text-emerald-500" strokeWidth={2.5} />}
                                <span className="text-text-soft truncate text-[10.5px] font-medium opacity-80">{a.approver.email}</span>
                                {a.decided_at && (
                                    <span className="text-text-soft flex shrink-0 items-center gap-1 text-[10.5px] font-normal opacity-70">
                                        <Clock size={9} /> {a.decided_at}
                                    </span>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-muted text-text-soft">
                                <Clock size={12} strokeWidth={2} />
                            </div>
                            <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden flex-wrap">
                                {(() => {
                                    const approverList = a.target_approvers ? a.target_approvers.split(',').map(name => name.trim()).filter(Boolean) : [];
                                    if (approverList.length > 1) {
                                        const visibleApprovers = isApproverListExpanded ? approverList : approverList.slice(0, 3);
                                        const remainingCount = approverList.length - 3;

                                        return (
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                {visibleApprovers.map((name, idx) => (
                                                    <span key={idx} className="inline-flex items-center rounded-md bg-surface-muted/90 border border-surface-border px-1.5 py-0.5 text-[10px] font-medium text-text-main">
                                                        {name}
                                                    </span>
                                                ))}
                                                {remainingCount > 0 && !isApproverListExpanded && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setIsApproverListExpanded(true);
                                                        }}
                                                        className="inline-flex items-center gap-1 rounded-md bg-primary/10 border border-primary/25 hover:bg-primary/20 px-1.5 py-0.5 text-[10px] font-semibold text-primary transition-all cursor-pointer"
                                                    >
                                                        +{remainingCount} <ChevronDown size={10} strokeWidth={2} />
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    }
                                    return (
                                        <span className="text-text-main truncate text-[11.5px] leading-tight font-bold">
                                            {a.target_approvers || `Semua ${a.role || 'Approver'}`}
                                        </span>
                                    );
                                })()}
                            </div>
                        </>
                    )}
                </div>

                <div className="shrink-0">
                    <StatusBadge status={a.status} size="sm" />
                </div>
            </div>

            {/* Row 2: Comment Section (If Present) */}
            {a.comment && (
                <div className="w-full pl-1 pt-1 border-t border-surface-border/40 text-[10.5px] italic text-text-soft leading-normal">
                    "{a.comment}"
                </div>
            )}
        </div>
    );
}
