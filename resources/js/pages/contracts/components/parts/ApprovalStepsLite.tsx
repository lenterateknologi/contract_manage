import React, { useMemo } from 'react';
import { cn, formatDateTime } from '@/lib/utils';
import { Contract, ContractApproval, UserProfile } from '@/pages/contracts/types';
import { Check, X, Clock, Hourglass, Workflow, Users, ArrowDownRight, LogIn } from 'lucide-react';
import { ApprovalCard } from './ApprovalCard';
import { InitiatorStepCard } from './InitiatorStepCard';
import { ProjectedStepCard } from './ProjectedStepCard';
import { Timeline, TimelineItem, TimelineIcon, TimelineContent } from '../ui/timeline';

interface ApprovalStepsLiteProps {
    contract: Contract;
    approvals: ContractApproval[];
    creator: UserProfile;
    submittedAt?: string;
    meId?: string;
    onApprove: (note: string, attachment?: File) => Promise<void>;
    search?: string;
    activePendingApproval?: ContractApproval | null;
    expandedGroups: Record<string, boolean>;
    setExpandedGroups: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

export function ApprovalStepsLite({
    contract,
    approvals,
    creator,
    submittedAt,
    search = '',
    activePendingApproval,
    expandedGroups,
    setExpandedGroups,
}: ApprovalStepsLiteProps) {
    const rootWorkflowId = contract.origin_workflow_id || contract.workflow_id;

    // Filter approvals for Lite mode (only executed steps or current pending step)
    const filteredSteps = useMemo(() => {
        let result = [...approvals];
        const currentStepId = contract.workflow_step_id;
        const currentWorkflowId = contract.workflow_id;
        const pendingSeq = activePendingApproval?.sequence;
        const pendingStepId = activePendingApproval?.workflow_step_id;
        const pendingWfId = activePendingApproval?.workflow_step?.workflow_id || (activePendingApproval as any)?.workflow_id;

        result = result.filter(
            (a) =>
                a.status === 'approved' ||
                a.status === 'rejected' ||
                (currentStepId && a.workflow_step_id === currentStepId) ||
                (pendingStepId && a.workflow_step_id === pendingStepId) ||
                (pendingSeq != null &&
                    a.sequence === pendingSeq &&
                    ((a.workflow_step?.workflow_id || (a as any).workflow_id) === (pendingWfId || currentWorkflowId))) ||
                a.id === activePendingApproval?.id,
        );

        if (search) {
            const s = search.toLowerCase();
            result = result.filter(
                (a) =>
                    a.role?.toLowerCase().includes(s) ||
                    a.department_name?.toLowerCase().includes(s) ||
                    a.approver?.name?.toLowerCase().includes(s) ||
                    a.target_approvers?.toLowerCase().includes(s) ||
                    a.step_name?.toLowerCase().includes(s),
            );
        }

        return result.sort((a, b) => {
            const aExecTime = a.decided_at ? new Date(a.decided_at).getTime() : 0;
            const bExecTime = b.decided_at ? new Date(b.decided_at).getTime() : 0;

            // Items without execution time (un-executed / pending) always go to the very bottom
            if (aExecTime === 0 && bExecTime !== 0) return 1;
            if (bExecTime === 0 && aExecTime !== 0) return -1;
            if (aExecTime !== bExecTime && aExecTime !== 0 && bExecTime !== 0) {
                return aExecTime - bExecTime;
            }

            // For unexecuted items or items executed at the exact same timestamp, fallback to sequence / sort_order
            if (a.sequence !== b.sequence) {
                return (a.sequence || 0) - (b.sequence || 0);
            }
            if (a.sort_order !== undefined && b.sort_order !== undefined && a.sort_order !== b.sort_order) {
                return (a.sort_order || 0) - (b.sort_order || 0);
            }
            return a.id.localeCompare(b.id);
        });
    }, [approvals, activePendingApproval, contract.workflow_step_id, contract.workflow_id, search]);

    // Group filtered steps into flat chronological step items (unifying main and sub-workflow)
    const stepGroups = useMemo(() => {
        const groups: Array<{
            key: string;
            workflowId: string;
            workflowName: string;
            batchNo?: number;
            isSubWorkflow: boolean;
            sequence: number;
            stepName: string;
            stepDescription?: string;
            items: ContractApproval[];
        }> = [];

        filteredSteps.forEach((a) => {
            const wfId = a.workflow_step?.workflow_id || contract.workflow_id;
            const wfName = a.workflow_step?.workflow?.name || contract.workflow?.name || 'Alur Kerja';
            const wfObj = a.workflow_step?.workflow as any;
            const batchNo = a.batch_no ?? 1;

            const isExplicitSubWorkflow = wfObj?.workflow_type === 'sub_workflow' || Boolean(wfObj?.is_sub_workflow);
            const isExplicitMainWorkflow = wfObj?.workflow_type === 'main';
            const isSubWf = isExplicitSubWorkflow || (!isExplicitMainWorkflow && Boolean(rootWorkflowId && wfId !== rootWorkflowId));

            const stepName = a.step_name || a.workflow_step?.label || a.workflow_step?.name || a.role || `Tahap Persetujuan ${a.sequence}`;
            const stepDescription = a.step_description || a.workflow_step?.description;

            const existingGroup = groups.find(
                (g) => g.workflowId === wfId && g.batchNo === batchNo && g.sequence === a.sequence,
            );

            if (existingGroup) {
                existingGroup.items.push(a);
            } else {
                groups.push({
                    key: `${wfId}_${batchNo}_${a.sequence}_${a.id}`,
                    workflowId: wfId,
                    workflowName: wfName,
                    batchNo: batchNo,
                    isSubWorkflow: isSubWf,
                    sequence: a.sequence,
                    stepName: stepName,
                    stepDescription: stepDescription,
                    items: [a],
                });
            }
        });

        return groups;
    }, [filteredSteps, contract.workflow_id, contract.workflow?.name, rootWorkflowId]);

    const showProjectedManager = approvals.length === 0 && creator.role?.toLowerCase() === 'staff';

    return (
        <div className="relative">
            <Timeline>
                {/* Initiator initial step */}
                {!search && !approvals.some((a) => a.sequence === 1) && (
                    <TimelineItem status="completed">
                        <TimelineIcon status="completed">
                            <Check size={11} strokeWidth={3} className="text-white" />
                        </TimelineIcon>
                        <TimelineContent>
                            <InitiatorStepCard
                                isOnly={stepGroups.length === 0 && !showProjectedManager}
                                creator={creator}
                                submittedAt={submittedAt || contract.submitted_at || contract.created_at || (creator as any)?.created_at}
                                isLite={true}
                            />
                            <div className="mt-2 w-full border-b border-border/40" />
                        </TimelineContent>
                    </TimelineItem>
                )}

                {/* Projected step if applicable */}
                {!search && showProjectedManager && (
                    <TimelineItem status="waiting">
                        <TimelineIcon status="waiting">
                            <Hourglass size={10} className="text-muted-foreground" />
                        </TimelineIcon>
                        <TimelineContent>
                            <ProjectedStepCard creator={creator} />
                            <div className="mt-2 w-full border-b border-border/40" />
                        </TimelineContent>
                    </TimelineItem>
                )}

                {/* Unified Step items (Both Main and Sub-Workflow render identical structure) */}
                {stepGroups.map((group, idx) => {
                    const currentStepId = contract.workflow_step_id;
                    const currentWfId = contract.workflow_id;
                    const allApprovedItems = group.items.length > 0 && group.items.every((a) => a.status === 'approved');
                    const isGroupCurrentStep = group.items.some((a) => a.workflow_step_id === currentStepId);
                    const isCompleted = contract.status === 'approved' || allApprovedItems;

                    const pendingWfId = activePendingApproval?.workflow_step?.workflow_id || (activePendingApproval as any)?.workflow_id;
                    const isSameWorkflow = group.workflowId === (pendingWfId || currentWfId);
                    const isPendingStep = activePendingApproval && isSameWorkflow && (
                        group.sequence === activePendingApproval.sequence ||
                        group.items.some((a) => a.id === activePendingApproval.id || a.workflow_step_id === activePendingApproval.workflow_step_id)
                    );
                    const isActive = contract.status !== 'approved' && !isCompleted && (isGroupCurrentStep || Boolean(isPendingStep));
                    const isRejectedState = group.items.some((a) => a.status === 'rejected');

                    const itemStatus = isCompleted
                        ? 'completed'
                        : isRejectedState
                            ? 'rejected'
                            : isActive
                                ? 'active'
                                : 'waiting';

                    const mainItem = group.items[0];
                    const matchedStep = contract?.workflow?.steps?.find((s: any) => s.step === group.sequence || s.id === mainItem?.workflow_step_id) || mainItem?.workflow_step;
                    const stepMeta = (matchedStep as any)?.meta || {};
                    const statusColor = (isActive && contract.status_info?.color)
                        ? contract.status_info.color
                        : stepMeta.status_color || null;

                    // Render dynamic icon based on step status instead of step numbers (counting)
                    const renderStatusIcon = () => {
                        if (itemStatus === 'completed') {
                            return <Check size={11} strokeWidth={3} className="text-white" />;
                        }
                        if (itemStatus === 'rejected') {
                            return <X size={11} strokeWidth={3} className="text-white" />;
                        }
                        if (itemStatus === 'active') {
                            return <Clock size={11} strokeWidth={2.5} className="text-white animate-pulse" />;
                        }
                        return <Hourglass size={10} className="text-muted-foreground" />;
                    };

                    const groupKey = `${group.workflowId}_${group.batchNo || 1}_${group.sequence}`;
                    const isExpanded = !!expandedGroups[groupKey];
                    const allItems = group.items;
                    const visibleItems = isExpanded ? allItems : allItems.slice(0, 10);

                    return (
                        <TimelineItem key={group.key || idx} status={itemStatus}>
                            <TimelineIcon
                                status={itemStatus}
                                style={statusColor ? { backgroundColor: statusColor, borderColor: 'transparent' } : undefined}
                            >
                                {renderStatusIcon()}
                            </TimelineIcon>

                            <TimelineContent>
                                <div className="flex items-center justify-between gap-1.5 flex-wrap">
                                    <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                                        <h4 className="font-bold text-text-main text-[11px] truncate">
                                            {group.stepName}
                                        </h4>

                                        {/* Sub-workflow indicator badge (Unified visual presentation) */}
                                        {group.isSubWorkflow && (
                                            <span className="inline-flex items-center gap-1 rounded bg-indigo-500/10 border border-indigo-500/25 px-1.5 py-0.2 text-[8.5px] font-bold tracking-wider uppercase text-indigo-700 dark:text-indigo-300">
                                                <Workflow size={9} className="shrink-0" />
                                                <span>{group.workflowName}</span>
                                            </span>
                                        )}

                                        {/* Batch tag if batch > 1 */}
                                        {group.batchNo && group.batchNo > 1 && (
                                            <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 border border-amber-500/25 px-1.5 py-0.2 text-[8.5px] font-bold tracking-wider uppercase text-amber-700 dark:text-amber-300">
                                                <span>Batch #{group.batchNo}</span>
                                            </span>
                                        )}

                                        {/* Sequential / Concurrent Badges */}
                                        {(() => {
                                            if (group.items.length <= 1) return null;
                                            const adhocMeta = contract?.metadata?.adhoc_steps?.[mainItem?.workflow_step_id || ''];
                                            const isSigningGroup = group.items.some(it => it.role === 'Pihak 1' || it.role === 'Pihak 2' || it.role === 'Penandatangan');
                                            const isAdhocGroup = group.items.some(it => it.role === 'Persetujuan Tambahan' || it.is_adhoc);

                                            let isSequential = false;
                                            if (adhocMeta && typeof adhocMeta.is_sequential === 'boolean') {
                                                isSequential = adhocMeta.is_sequential;
                                            } else if (isSigningGroup) {
                                                isSequential = group.items.some(it => it.sub_step != null);
                                            }

                                            if (isSequential) {
                                                return (
                                                    <span className="inline-flex items-center gap-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 px-1 py-0.2 text-[8px] font-bold uppercase text-indigo-600 dark:text-indigo-400">
                                                        <ArrowDownRight size={9} />
                                                        <span>Berurutan</span>
                                                    </span>
                                                );
                                            }

                                            if (isAdhocGroup) {
                                                return (
                                                    <span className="inline-flex items-center gap-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 px-1 py-0.2 text-[8px] font-bold uppercase text-emerald-600 dark:text-emerald-400">
                                                        <Users size={9} />
                                                        <span>Serentak</span>
                                                    </span>
                                                );
                                            }

                                            return null;
                                        })()}
                                    </div>

                                    {/* Waktu Masuk Step setara Label Step */}
                                    {(() => {
                                        const stepEntryAt = group.items.find(it => it.step_entry_at || it.created_at)?.step_entry_at || group.items.find(it => it.created_at)?.created_at;
                                        if (!stepEntryAt) return null;
                                        return (
                                            <span className="text-text-soft flex items-center gap-1 font-mono text-[9px] tabular-nums uppercase shrink-0" title="Waktu Masuk Tahap">
                                                <LogIn size={9.5} className="text-muted-foreground shrink-0" />
                                                <span className="text-text-soft font-normal">Masuk:</span> {formatDateTime(stepEntryAt)}
                                            </span>
                                        );
                                    })()}
                                </div>

                                {/* Approver items */}
                                <div className="mt-1 space-y-1">
                                    {visibleItems.map((a: ContractApproval) => {
                                        const hasSub = a.sub_step !== null && a.sub_step !== undefined && String(a.sub_step).trim() !== '' && String(a.sub_step) !== 'null' && String(a.sub_step) !== 'undefined';
                                        const isItemPending = Boolean(
                                            activePendingApproval &&
                                            !isCompleted &&
                                            a.status !== 'waiting' &&
                                            (a.id === activePendingApproval.id || a.status === 'pending')
                                        );

                                        return (
                                            <ApprovalCard
                                                key={a.id}
                                                approval={a}
                                                stepNumber={hasSub ? `${group.sequence}.${a.sub_step}` : `${group.sequence}`}
                                                displaySubSteps={false}
                                                contract={contract}
                                                showDetails={false}
                                                isLite={true}
                                                isSubStep={hasSub}
                                                isPending={isItemPending}
                                            />
                                        );
                                    })}

                                    {allItems.length > 10 && (
                                        <button
                                            type="button"
                                            onClick={() => setExpandedGroups(prev => ({ ...prev, [groupKey]: !prev[groupKey] }))}
                                            className="text-primary hover:underline mt-0.5 flex items-center gap-1 text-[9px] font-extrabold tracking-wider uppercase cursor-pointer"
                                        >
                                            {isExpanded ? 'Sembunyikan' : `+ Tampilkan ${allItems.length - 10} Penerima Persetujuan Lainnya`}
                                        </button>
                                    )}
                                </div>

                                <div className="mt-2 w-full border-b border-border/40" />
                            </TimelineContent>
                        </TimelineItem>
                    );
                })}
            </Timeline>
        </div>
    );
}
