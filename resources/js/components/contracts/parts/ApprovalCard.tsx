import { cn } from '@/lib/utils';
import { ContractApproval } from '@/types/contracts';
import { Check, Clock } from 'lucide-react';
import { Avatar, StatusBadge } from '../ui/ui';

interface ApprovalCardProps {
    approval: ContractApproval;
    stepNumber: string;
    displaySubSteps?: boolean;
}

export function ApprovalCard({ approval: a, stepNumber, displaySubSteps = false }: ApprovalCardProps) {
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
                'group bg-surface-base relative flex min-h-[90px] flex-col justify-between rounded-xl border p-3 shadow-xs transition-all duration-300',
                isApproved &&
                    'border-emerald-500/35 bg-emerald-500/[0.05] hover:border-emerald-500/50 hover:bg-emerald-500/[0.08] dark:bg-emerald-500/[0.02]',
                isRejected && 'border-rose-500/35 bg-rose-50/50 hover:border-rose-500/50 hover:bg-rose-500/[0.08] dark:bg-rose-500/[0.02]',
                isPending &&
                    'border-amber-500/45 bg-amber-500/[0.08] shadow-md ring-2 ring-amber-500/15 hover:border-amber-500/60 hover:bg-amber-500/[0.12] dark:bg-amber-500/[0.04]',
                isSkipped && 'border-slate-200 bg-slate-50/10 opacity-50 grayscale dark:border-slate-800 dark:bg-slate-900/10',
                (isWaiting || isStaged) &&
                    !isSkipped &&
                    'border-dashed border-slate-300 bg-slate-50/20 opacity-60 grayscale dark:border-slate-800 dark:bg-slate-950/20',
                'hover:shadow-sm',
            )}
        >
            {/* Visual indicator bar on the left */}
            <div
                className={cn(
                    'absolute top-3 bottom-3 left-0 w-1 rounded-r-full transition-all',
                    isApproved && 'bg-emerald-500',
                    isRejected && 'bg-rose-500',
                    isPending && 'animate-pulse bg-amber-500',
                    isSkipped && 'bg-slate-200 dark:bg-slate-700',
                    (isWaiting || isStaged) && !isSkipped && 'bg-slate-300 dark:bg-slate-700',
                )}
            />

            <div className="flex flex-col gap-2.5">
                {/* Header: Step & Role */}
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <div
                            className={cn(
                                'flex h-5 min-w-8 items-center justify-center rounded-md px-1.5 text-[9px] font-black tracking-tighter transition-colors',
                                isApproved
                                    ? 'bg-emerald-500 text-white'
                                    : isRejected
                                      ? 'bg-rose-500 text-white'
                                      : isPending
                                        ? 'bg-amber-500 text-white'
                                        : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
                            )}
                        >
                            {finalStepNumber}
                        </div>
                        <span className="text-text-main text-[10px] font-bold tracking-widest uppercase">{a.role || 'Reviewer'}</span>
                    </div>
                    <div className="flex shrink-0 items-center">
                        {(isStaged || isWaiting) && !isSkipped ? (
                            <div className="flex items-center gap-1 rounded-full border border-slate-300 bg-slate-100 px-2 py-0.5 text-[8px] font-black tracking-wider text-slate-500 uppercase dark:border-slate-700 dark:bg-slate-800">
                                <Clock size={8} /> Draft
                            </div>
                        ) : (
                            <StatusBadge status={a.status} />
                        )}
                    </div>
                </div>

                {/* Approver Details */}
                <div
                    className={cn(
                        'flex items-center gap-3 rounded-lg border p-2 transition-all',
                        a.approver
                            ? isApproved
                                ? 'border-emerald-500/10 bg-white/70 dark:border-emerald-500/10 dark:bg-slate-950/60'
                                : isRejected
                                  ? 'border-rose-500/10 bg-white/70 dark:border-rose-500/10 dark:bg-slate-950/60'
                                  : isPending
                                    ? 'border-amber-500/15 bg-white/75 dark:border-amber-500/15 dark:bg-slate-950/60'
                                    : 'border-slate-100 bg-white/60 dark:border-slate-800/50 dark:bg-slate-950/40'
                            : 'border-dashed border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/30',
                    )}
                >
                    {a.approver ? (
                        <>
                            <Avatar user={a.approver} size="sm" className="h-6 w-6 shadow-sm ring-2 ring-white dark:ring-slate-900" />
                            <div className="flex flex-col overflow-hidden">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-text-main truncate text-[10px] leading-tight font-black">{a.approver.name}</span>
                                    {isApproved && <Check size={10} className="shrink-0 text-emerald-500" strokeWidth={4} />}
                                </div>
                                <div className="mt-0.5 flex items-center gap-2">
                                    <span className="text-text-soft truncate text-[8.5px] leading-none font-medium">{a.approver.email}</span>
                                    {a.decided_at && (
                                        <>
                                            <div className="h-0.5 w-0.5 shrink-0 rounded-full bg-slate-300 dark:bg-slate-600" />
                                            <span className="text-text-soft flex shrink-0 items-center gap-1 text-[8.5px] leading-none font-bold">
                                                <Clock size={8} /> {a.decided_at}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200/50 text-slate-400 dark:bg-slate-800/50 dark:text-slate-600">
                                <Clock size={12} strokeWidth={2.5} />
                            </div>
                            <div className="flex flex-col overflow-hidden">
                                <span className="text-text-main truncate text-[10px] leading-tight font-black">
                                    {a.target_approvers || `Semua ${a.role || 'Approver'}`}
                                </span>
                                {a.target_emails && (
                                    <span className="text-text-soft mt-1 truncate text-[8.5px] leading-none font-medium">{a.target_emails}</span>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Comment Section */}
                {a.comment && (
                    <div className="relative mt-0.5">
                        <div
                            className={cn(
                                'absolute top-2 -left-1 h-2 w-2 rotate-45 border-b border-l transition-colors duration-300',
                                isApproved && 'border-emerald-100 bg-emerald-50 dark:border-indigo-900/30 dark:bg-emerald-950/20',
                                isRejected && 'border-rose-100 bg-rose-50 dark:border-indigo-900/30 dark:bg-rose-950/20',
                                isPending && 'border-amber-100 bg-amber-50 dark:border-indigo-900/30 dark:bg-amber-950/20',
                                (isWaiting || isStaged) && 'border-slate-100 bg-slate-50 dark:border-indigo-900/30 dark:bg-slate-950/20',
                            )}
                        />
                        <div
                            className={cn(
                                'rounded-lg border px-3 py-2 text-[9px] leading-relaxed font-medium italic shadow-xs transition-all duration-300',
                                isApproved &&
                                    'border-emerald-100 bg-emerald-50/50 text-emerald-700/90 dark:border-emerald-900/30 dark:bg-emerald-950/20 dark:text-emerald-300',
                                isRejected &&
                                    'border-rose-100 bg-rose-50/50 text-rose-700/90 dark:border-rose-900/30 dark:border-rose-950/20 dark:text-rose-300',
                                isPending &&
                                    'border-amber-100 bg-amber-50/50 text-amber-700/90 dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-300',
                                (isWaiting || isStaged) &&
                                    'border-slate-100 bg-slate-50/50 text-slate-700/90 dark:border-slate-900/30 dark:bg-slate-950/20 dark:text-slate-300',
                            )}
                        >
                            <span className="mr-1 font-serif text-[12px] leading-none opacity-50">"</span>
                            {a.comment}
                            <span className="ml-1 font-serif text-[12px] leading-none opacity-50">"</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
