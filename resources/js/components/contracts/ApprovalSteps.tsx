import { ContractApproval, UserProfile } from '@/types/contracts';
import { Avatar, StatusBadge } from './ui';
import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
    approvals: ContractApproval[];
    creator: UserProfile;
    submittedAt?: string;
}

export default function ApprovalSteps({ approvals, creator, submittedAt }: Props) {
    const [isExpanded, setIsExpanded] = useState(false);

    const iconMap: Record<string, string> = {
        approved: 'fa-check',
        pending: 'fa-ellipsis',
        rejected: 'fa-xmark',
        waiting: 'fa-minus',
    };
    const dotCls: Record<string, string> = {
        approved: 'bg-green-50 text-green-600 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30',
        pending: 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/30',
        rejected: 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30',
        waiting: 'bg-muted text-muted-foreground border-border',
    };
    const noteCls: Record<string, string> = {
        approved: 'border-l-green-400 dark:border-l-green-600',
        rejected: 'border-l-red-400 dark:border-l-red-600',
        pending: 'border-l-border',
        waiting: 'border-l-border',
    };

    // Use only the latest approval per sequence
    const steps = useMemo(() => {
        const bySeq: Record<number, ContractApproval> = {};
        approvals.forEach((a) => {
            bySeq[a.sequence] = a;
        });
        return Object.values(bySeq).sort((a, b) => a.sequence - b.sequence);
    }, [approvals]);

    // Projected step for Drafts
    const showProjectedManager = approvals.length === 0 && (creator.role?.toLowerCase() === 'staff');

    // Logic to determine which step to show when minimized
    const activeStepInfo = useMemo(() => {
        // If not submitted yet, Initiator is the active step
        if (!submittedAt) return { type: 'initiator' as const, index: -1 };

        // If there are pending steps, the first pending is active
        const pendingIdx = steps.findIndex(s => s.status === 'pending');
        if (pendingIdx !== -1) return { type: 'step' as const, index: pendingIdx };

        // If everything is approved/archived, show the last step
        if (steps.length > 0) return { type: 'step' as const, index: steps.length - 1 };

        // Fallback
        return { type: 'initiator' as const, index: -1 };
    }, [submittedAt, steps]);

    const renderStep = (a: ContractApproval, i: number, isLast: boolean, isOnly: boolean) => (
        <div key={a.id} className={`flex gap-3 ${!isLast && !isOnly ? 'relative pb-4' : ''}`}>
            {!isLast && !isOnly && <div className="bg-slate-100 absolute top-8 bottom-0 left-3.5 w-px" />}
            <div
                className={`relative z-10 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border shadow-sm ${dotCls[a.status] ?? dotCls.waiting}`}
            >
                <i className={`fa-solid ${iconMap[a.status] ?? 'fa-minus'}`} style={{ fontSize: 10 }} />
            </div>
            <div className="flex-1 pt-0.5">
                <div className="text-slate-900 text-xs font-bold flex items-center gap-1.5 flex-wrap leading-tight">
                    {a.role} · {a.department_name ?? 'Matching Dept'}
                    <span className="text-slate-400 text-[10px] font-normal opacity-70">· Seq {a.sequence}</span>
                </div>
                
                <div className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px]">
                    {a.status === 'approved' || a.status === 'rejected' ? (
                        <div className="flex items-center gap-1.5 font-medium text-foreground/80">
                            <Avatar user={a.approver} size="sm" /> 
                            {a.approver?.name}
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5">
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-muted border border-border/50">
                                <i className="fa-solid fa-user text-[8px] text-muted-foreground/60" />
                            </div>
                            <span className="opacity-70">
                                {a.target_approvers ? `Assigned to: ${a.target_approvers}` : `Approver ${a.role}`}
                            </span>
                        </div>
                    )}
                </div>

                {a.note && (
                    <div
                        className={`text-muted-foreground bg-muted mt-1.5 rounded border-l-2 px-2.5 py-1.5 text-[11px] ${noteCls[a.status] ?? 'border-l-border/30'}`}
                    >
                        {a.note}
                    </div>
                )}
                <div className="text-muted-foreground mt-1.5 text-[10px] flex items-center gap-1.5">
                    {a.approved_at ? (
                        <>
                            <i className="fa-regular fa-clock" />
                            {a.approved_at}
                        </>
                    ) : (
                        <StatusBadge status={a.status} />
                    )}
                </div>
            </div>
        </div>
    );

    const renderInitiator = (isOnly: boolean) => (
        <div key="initiator" className={`flex gap-3 ${!isOnly ? 'relative pb-4' : ''}`}>
            {!isOnly && <div className="bg-slate-100 absolute top-8 bottom-0 left-3.5 w-px" />}
            <div className="relative z-10 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border bg-blue-50 text-blue-600 border-blue-200 shadow-sm shadow-blue-100/50">
                <i className="fa-solid fa-paper-plane" style={{ fontSize: 10 }} />
            </div>
            <div className="flex-1 pt-0.5">
                <div className="text-slate-900 text-xs font-bold leading-tight">
                    Initiator <span className="text-slate-400 text-[10px] font-normal italic ml-1">· Phase 0</span>
                </div>
                <div className="text-slate-400 mt-1 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider">
                    <Avatar user={creator} size="sm" /> {creator?.name}
                </div>
                <div className="text-slate-400 mt-1 text-[10px]">
                    {submittedAt ? `Submitted at ${submittedAt}` : <span className="italic opacity-50 text-[9px]">Submission pending</span>}
                </div>
            </div>
        </div>
    );

    const renderProjected = () => (
        <div key="projected" className="flex gap-3 relative pb-4 opacity-70">
            <div className="bg-slate-100 absolute top-8 bottom-0 left-3.5 w-px" />
            <div className="relative z-10 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border bg-slate-50 text-slate-500 border-slate-200">
                <i className="fa-solid fa-user-shield" style={{ fontSize: 10 }} />
            </div>
            <div className="flex-1 pt-0.5">
                <div className="text-slate-900 text-xs font-bold leading-tight">
                    Direct Supervisor <span className="text-slate-400 text-[10px] font-normal italic ml-1">· Phase 1</span>
                </div>
                <div className="text-slate-400 mt-1 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider leading-none">
                    <i className="fa-solid fa-circle-info opacity-50" /> Manager (Dept: {creator.department_id ? 'Matching' : 'Unknown'})
                </div>
                <div className="text-slate-400 mt-1 text-[10px] italic">
                    Will be assigned upon submission
                </div>
            </div>
        </div>
    );

    const hasMultipleItems = steps.length > 0 || showProjectedManager;

    return (
        <div className="space-y-4">
            <div className="relative">
                {isExpanded ? (
                    <>
                        {renderInitiator(false)}
                        {showProjectedManager && renderProjected()}
                        {steps.map((a, i) => renderStep(a, i, i === steps.length - 1, false))}
                    </>
                ) : (
                    <>
                        {activeStepInfo.type === 'initiator' 
                            ? renderInitiator(true) 
                            : steps[activeStepInfo.index] && renderStep(steps[activeStepInfo.index], activeStepInfo.index, true, true)
                        }
                    </>
                )}
            </div>

            {hasMultipleItems && (
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-primary hover:bg-primary/5 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-primary/20 py-2 text-[11px] font-bold tracking-wider uppercase transition-all"
                >
                    {isExpanded ? (
                        <>
                            <ChevronUp size={14} /> Minimalkan Alur
                        </>
                    ) : (
                        <>
                            <ChevronDown size={14} /> Lihat Seluruh Alur ({steps.length + 1} Tahap)
                        </>
                    )}
                </button>
            )}
        </div>
    );
}
