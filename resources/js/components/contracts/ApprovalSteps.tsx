import { ContractApproval, UserProfile } from '@/types/contracts';
import { Avatar, StatusBadge } from './ui';

interface Props {
    approvals: ContractApproval[];
    creator: UserProfile;
    submittedAt?: string;
}

export default function ApprovalSteps({ approvals, creator, submittedAt }: Props) {
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
    const bySeq: Record<number, ContractApproval> = {};
    approvals.forEach((a) => {
        bySeq[a.sequence] = a;
    });
    const steps = Object.values(bySeq).sort((a, b) => a.sequence - b.sequence);

    // Projected step for Drafts (if creator is Staff, they will need Manager approval first)
    const showProjectedManager = approvals.length === 0 && (creator.role?.toLowerCase() === 'staff');
    const projectedManagerStep = showProjectedManager ? (
        <div key="projected" className="flex gap-2.5 relative pb-4 opacity-70">
            <div className="bg-border absolute top-7 bottom-0 left-3 w-px" />
            <div className="relative z-10 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border bg-muted text-muted-foreground border-border">
                <i className="fa-solid fa-user-shield" style={{ fontSize: 8 }} />
            </div>
            <div className="flex-1 pt-0.5">
                <div className="text-foreground text-[12px] font-semibold">
                    Direct Supervisor <span className="text-muted-foreground text-[10px] font-normal">· Phase 1</span>
                </div>
                <div className="text-muted-foreground mt-0.5 flex items-center gap-1.5 text-[11px]">
                    <i className="fa-solid fa-circle-info opacity-50" /> Manager (Dept: {creator.department_id ? 'Matching' : 'Unknown'})
                </div>
                <div className="text-muted-foreground mt-1 text-[10px] italic">
                    Will be assigned upon submission
                </div>
            </div>
        </div>
    ) : null;

    // Initial item for the Initiator
    const initiatorStep = (
        <div key="initiator" className="flex gap-2.5 relative pb-4">
            {(steps.length > 0 || showProjectedManager) && <div className="bg-border absolute top-7 bottom-0 left-3 w-px" />}
            <div className="relative z-10 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30">
                <i className="fa-solid fa-paper-plane" style={{ fontSize: 8 }} />
            </div>
            <div className="flex-1 pt-0.5">
                <div className="text-foreground text-[12px] font-black uppercase tracking-widest">
                    Initiator <span className="text-muted-foreground text-[10px] font-normal">· Phase 0</span>
                </div>
                <div className="text-muted-foreground mt-0.5 flex items-center gap-1.5 text-[11px]">
                    <Avatar user={creator} size="sm" /> {creator?.name}
                </div>
                <div className="text-muted-foreground mt-1 text-[10px]">
                    {submittedAt ? `Submitted at ${submittedAt}` : <span className="italic opacity-50 text-[9px]">Submission pending</span>}
                </div>
            </div>
        </div>
    );

    return (
        <div>
            {initiatorStep}
            {projectedManagerStep}
            {steps.map((a, i) => (
                <div key={a.id} className={`flex gap-2.5 ${i < steps.length - 1 ? 'relative pb-4' : ''}`}>
                    {i < steps.length - 1 && <div className="bg-border absolute top-7 bottom-0 left-3 w-px" />}
                    <div
                        className={`relative z-10 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border ${dotCls[a.status] ?? dotCls.waiting}`}
                    >
                        <i className={`fa-solid ${iconMap[a.status] ?? 'fa-minus'}`} style={{ fontSize: 8 }} />
                    </div>
                    <div className="flex-1 pt-0.5">
                        <div className="text-foreground text-[12px] font-semibold flex items-center gap-1.5 flex-wrap">
                            {a.role} - {a.department_name ?? 'Matching Dept'}
                            <span className="text-muted-foreground text-[10px] font-normal opacity-70">· Seq {a.sequence}</span>
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
            ))}
        </div>
    );
}
