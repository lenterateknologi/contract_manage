import { Button } from '@/components/ui/buttons/Button';
import { SearchInput } from '@/components/ui/inputs/SearchInput';
import { useDebounce } from '@/hooks/use-debounce';
import { cn, formatDateTime } from '@/lib/utils';
import { Contract, ContractApproval, UserProfile } from '@/pages/contracts/types';
import { Badge } from '@/components/ui/feedback/Badge';
import { Popover, PopoverButton, PopoverPanel, Portal } from '@headlessui/react';
import { Download, GitCommit, Layers, Workflow, ArrowRight, ArrowDownRight, Clock, UserCheck, CheckCircle2, AlertCircle, Hourglass, User as UserIcon, Users, ChevronDown, LogIn } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { ApprovalCard } from './ApprovalCard';
import { InitiatorStepCard } from './InitiatorStepCard';
import { ProjectedStepCard } from './ProjectedStepCard';
import { UserAvatarIcon } from '@/components/profile/UserAvatar';

import { Timeline, TimelineItem, TimelineIcon, TimelineContent } from '../ui/timeline';
import { ApprovalStepsLite } from './ApprovalStepsLite';

interface Props {
    contract: Contract;
    approvals: ContractApproval[];
    creator: UserProfile;
    submittedAt?: string;
    meId?: string;
    onApprove: (note: string, attachment?: File) => Promise<void>;
}

type ViewTab = 'lite' | 'pro';
type SortBy = 'time' | 'step';

export default function ApprovalSteps({ contract, approvals, creator, submittedAt, meId, onApprove }: Props) {
    const [viewTab, setViewTab] = useState<ViewTab>('lite');
    const [sortBy, setSortBy] = useState<SortBy>('time');
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 500);
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

    // ── Dynamic Resolution: Active / Next Pending Approver Step ──
    const isContractApproved = contract.status === 'approved';
    const isContractRejected = contract.status === 'rejected';
    const isContractCompleted = isContractApproved || isContractRejected || contract.status === 'archived' || contract.status === 'closed';

    const activePendingApproval = useMemo(() => {
        if (isContractCompleted) {
            return null;
        }

        // 1. If contract has workflow_step_id, find approval matching current active step
        if (contract.workflow_step_id) {
            const match = approvals.find(
                (a) => a.workflow_step_id === contract.workflow_step_id && a.status !== 'approved' && a.status !== 'rejected',
            );
            if (match) return match;
        }

        // 2. Otherwise find the first unapproved/unrejected step in workflow order
        return (
            approvals.find(
                (a) => a.status !== 'approved' && a.status !== 'rejected' && (a.status as string) !== 'SKIPPED',
            ) || null
        );
    }, [approvals, contract.workflow_step_id, isContractCompleted]);

    const pendingApproverList = useMemo(() => {
        if (!activePendingApproval) return [];
        if (activePendingApproval.approver?.name) {
            return [{ name: activePendingApproval.approver.name, email: activePendingApproval.approver.email, user: activePendingApproval.approver }];
        }
        if (activePendingApproval.target_approvers) {
            const names = activePendingApproval.target_approvers.split(',').map((s) => s.trim()).filter(Boolean);
            return names.map((name) => ({ name, email: undefined, user: undefined }));
        }
        if (activePendingApproval.approver_name && activePendingApproval.approver_name !== activePendingApproval.role) {
            return [{ name: activePendingApproval.approver_name, email: undefined, user: undefined }];
        }
        return [];
    }, [activePendingApproval]);

    const filteredSteps = useMemo(() => {
        let result = [...approvals];

        // Tab: Lite (Sederhana - Hanya yang sudah dieksekusi atau step aktif sekarang)
        if (viewTab === 'lite') {
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
        }

        // Tab: Pro = Full information (Semua step approval termasuk yang belum aktif / dilewati)

        if (debouncedSearch) {
            const s = debouncedSearch.toLowerCase();
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
            if (sortBy === 'time') {
                const aExecTime = a.decided_at ? new Date(a.decided_at).getTime() : 0;
                const bExecTime = b.decided_at ? new Date(b.decided_at).getTime() : 0;
                
                // If one has no timestamp (aExecTime === 0) and the other has one, put the untimed item at the very bottom
                if (aExecTime === 0 && bExecTime !== 0) return 1;
                if (bExecTime === 0 && aExecTime !== 0) return -1;

                if (aExecTime !== bExecTime && aExecTime !== 0 && bExecTime !== 0) {
                    return aExecTime - bExecTime;
                }
            }
            if (a.sequence !== b.sequence) {
                return (a.sequence || 0) - (b.sequence || 0);
            }
            if (a.sort_order !== undefined && b.sort_order !== undefined && a.sort_order !== b.sort_order) {
                return (a.sort_order || 0) - (b.sort_order || 0);
            }
            if (a.created_at && b.created_at) {
                return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            }
            return a.id.localeCompare(b.id);
        });
    }, [approvals, viewTab, sortBy, debouncedSearch, contract.workflow_step_id, activePendingApproval]);

    // Build a hierarchical tree of steps
    const stepTree = useMemo(() => {
        const rootWorkflowId = contract.origin_workflow_id || contract.workflow_id;

        if (sortBy === 'time') {
            // Chronological execution grouping: merge consecutive steps belonging to the same sub-workflow under a single header
            const blocks: any[] = [];
            let currentBlock: any = null;

            filteredSteps.forEach((a) => {
                const wfId = a.workflow_step?.workflow_id || contract.workflow_id;
                const wfName = a.workflow_step?.workflow?.name || contract.workflow?.name || 'Alur Kerja';
                const wfObj = a.workflow_step?.workflow as any;
                const batchNo = a.batch_no ?? 1;
                
                // Determine whether this step is part of an actual sub-workflow
                const isExplicitSubWorkflow = wfObj?.workflow_type === 'sub_workflow' || Boolean(wfObj?.is_sub_workflow);
                const isExplicitMainWorkflow = wfObj?.workflow_type === 'main';
                const isSubWf = isExplicitSubWorkflow || (!isExplicitMainWorkflow && Boolean(rootWorkflowId && wfId !== rootWorkflowId));

                const stepName = a.step_name || a.workflow_step?.label || a.workflow_step?.name || a.role || `Persetujuan Step ${a.sequence}`;
                const stepDescription = a.step_description || a.workflow_step?.description;

                // Merge adjacent items if they share the exact same sub-workflow and batch
                if (
                    currentBlock &&
                    currentBlock.workflowId === wfId &&
                    currentBlock.batchNo === batchNo &&
                    isSubWf
                ) {
                    currentBlock.groups.push({
                        sequence: a.sequence,
                        batchNo: batchNo,
                        stepName: stepName,
                        stepDescription: stepDescription,
                        items: [a],
                    });
                } else {
                    currentBlock = {
                        workflowId: wfId,
                        workflowName: wfName,
                        batchNo: batchNo,
                        isSubWorkflow: isSubWf,
                        groups: [
                            {
                                sequence: a.sequence,
                                batchNo: batchNo,
                                stepName: stepName,
                                stepDescription: stepDescription,
                                items: [a],
                            },
                        ],
                    };
                    blocks.push(currentBlock);
                }
            });
            return blocks;
        }

        // Structural Grouping by workflow block and sequence
        const blocks: any[] = [];
        let currentBlock: any = null;

        filteredSteps.forEach((a) => {
            const wfId = a.workflow_step?.workflow_id || contract.workflow_id;
            const wfName = a.workflow_step?.workflow?.name || contract.workflow?.name || 'Alur Kerja';
            const wfObj = a.workflow_step?.workflow as any;
            const batchNo = a.batch_no ?? 1;

            const isExplicitSubWorkflow = wfObj?.workflow_type === 'sub_workflow' || Boolean(wfObj?.is_sub_workflow);
            const isExplicitMainWorkflow = wfObj?.workflow_type === 'main';
            const isSubWf = isExplicitSubWorkflow || (!isExplicitMainWorkflow && Boolean(rootWorkflowId && wfId !== rootWorkflowId));

            if (!currentBlock || currentBlock.workflowId !== wfId || currentBlock.batchNo !== batchNo) {
                currentBlock = {
                    workflowId: wfId,
                    workflowName: wfName,
                    batchNo: batchNo,
                    isSubWorkflow: isSubWf,
                    groups: [],
                };
                blocks.push(currentBlock);
            }

            const seq = a.sequence;
            let group = currentBlock.groups.find((g: any) => g.sequence === seq);
            if (!group) {
                group = {
                    sequence: seq,
                    batchNo: batchNo,
                    stepName: '',
                    stepDescription: '',
                    items: [],
                };
                currentBlock.groups.push(group);
            }
            group.items.push(a);
        });

        blocks.forEach((block) => {
            block.groups.forEach((group: any) => {
                const mainStep = group.items.find((a: any) => a.sub_step == null) || group.items[0];
                group.stepName = mainStep.step_name || mainStep.workflow_step?.label || mainStep.workflow_step?.name || mainStep.role || `Persetujuan Step ${group.sequence}`;
                group.stepDescription = mainStep.step_description || mainStep.workflow_step?.description;

                group.items.sort((a: any, b: any) => {
                    if (a.sub_step != null && b.sub_step != null && Number(a.sub_step) !== Number(b.sub_step)) {
                        return Number(a.sub_step) - Number(b.sub_step);
                    }
                    if (a.sort_order !== undefined && b.sort_order !== undefined && a.sort_order !== b.sort_order) {
                        return (a.sort_order || 0) - (b.sort_order || 0);
                    }
                    if (a.created_at && b.created_at) {
                        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                    }
                    return a.id.localeCompare(b.id);
                });
            });

            block.groups.sort((a: any, b: any) => Number(a.sequence) - Number(b.sequence));
        });
        return blocks;
    }, [filteredSteps, sortBy, contract.workflow_id, contract.origin_workflow_id, contract.workflow?.name]);

    const showProjectedManager = approvals.length === 0 && creator.role?.toLowerCase() === 'staff';

    const handleExportPdf = () => {
        window.open(`/api/contracts/${contract.id}/approval/pdf`, '_blank');
    };

    const tabs: { key: ViewTab; label: string }[] = [
        { key: 'lite', label: 'Lite' },
        { key: 'pro', label: 'Pro' },
    ];

    // ── Current Step Information Details ──
    const totalStepsCount = useMemo(() => {
        const uniqueSeqs = new Set(approvals.map((a) => a.sequence));
        return Math.max(uniqueSeqs.size, contract.workflow?.steps?.length || 0);
    }, [approvals, contract.workflow]);

    const currentStepInfo = useMemo(() => {
        if (isContractApproved) {
            return null;
        }

        if (isContractRejected) {
            return {
                isRejected: true,
                title: 'Kontrak Ditolak / Perlu Revisi',
                description: 'Terdapat penolakan pada salah satu tahap alur kerja. Silakan periksa catatan revisi.',
                statusLabel: 'Ditolak / Perlu Revisi',
                stepNumber: activePendingApproval?.sequence || 1,
                totalSteps: totalStepsCount,
                approvers: pendingApproverList,
                category: null,
                role: activePendingApproval?.role || null,
                department: activePendingApproval?.department_name || null,
            };
        }

        // Active pending step
        if (activePendingApproval) {
            const stepObj = contract.workflow?.steps?.find((s: any) => s.step === activePendingApproval.sequence || s.id === activePendingApproval.workflow_step_id) || activePendingApproval.workflow_step;
            const category = (stepObj as any)?.step_category || activePendingApproval.step_category || (activePendingApproval.step_name?.includes('[F1]') ? 'F1' : activePendingApproval.step_name?.includes('[F2]') ? 'F2' : activePendingApproval.step_name?.includes('[Aggrement]') ? 'Agreement' : activePendingApproval.step_name?.includes('[Finalisasi]') ? 'Finalisasi' : null);

            return {
                isCompleted: false,
                isRejected: false,
                stepNumber: activePendingApproval.sequence,
                totalSteps: totalStepsCount,
                name: activePendingApproval.step_name || (stepObj as any)?.name || (stepObj as any)?.label || `Step ${activePendingApproval.sequence}`,
                description: activePendingApproval.step_description || (stepObj as any)?.description || `Menunggu tindakan persetujuan untuk melangkah ke tahap selanjutnya.`,
                role: activePendingApproval.role,
                department: activePendingApproval.department_name,
                category: category,
                approvers: pendingApproverList,
                statusLabel: 'Pending (Sedang Berjalan)',
            };
        }

        return null;
    }, [isContractApproved, isContractRejected, activePendingApproval, totalStepsCount, contract.workflow, pendingApproverList]);

    // ── Workflow Steps Pipeline Overview for Popover ──
    const workflowStepsPipeline = useMemo(() => {
        const wf = contract.origin_workflow || contract.workflow;
        const steps = (wf?.steps || []).slice().sort((a: any, b: any) => Number(a.step) - Number(b.step));
        return steps.map((s: any) => {
            const stepNum = s.step;
            const stepName = s.name || s.label || s.title || `Tahap ${stepNum}`;
            const stepApprover = s.target_approvers || (s.role ? `${s.role}` : 'Sesuai alur');
            const stepCat = s.step_category;
            
            // Check matching approvals
            const stepApprovals = approvals.filter((a) => (a.workflow_step_id && a.workflow_step_id === s.id) || a.sequence === stepNum);
            const isApproved = stepApprovals.length > 0 && stepApprovals.every((a) => a.status === 'approved');
            const isRejected = stepApprovals.some((a) => a.status === 'rejected');
            const isCurrent = (contract.workflow_step_id && contract.workflow_step_id === s.id) || (!isApproved && !isRejected && activePendingApproval?.sequence === stepNum);

            let status: 'completed' | 'active' | 'rejected' | 'waiting' = 'waiting';
            if (isApproved) status = 'completed';
            else if (isRejected) status = 'rejected';
            else if (isCurrent) status = 'active';

            return {
                id: s.id,
                step: stepNum,
                name: stepName,
                description: s.description,
                approver: stepApprover,
                category: stepCat,
                status,
                approvals: stepApprovals,
            };
        });
    }, [contract.origin_workflow, contract.workflow, contract.workflow_step_id, approvals, activePendingApproval]);

    return (
        <div className="animate-in fade-in flex flex-col flex-1 min-h-0 h-full overflow-hidden duration-300 p-2.5 lg:p-3 gap-2">
            {/* Unified Clean Header Bar - Compact & Solid */}
            <div className="shrink-0 flex items-center justify-between gap-2 bg-surface-muted border border-surface-border p-1 px-2 rounded-lg">
                {/* Left: View Mode Tabs (Lite / Pro) & Workflow Steps Popover */}
                <div className="flex items-center gap-1.5 flex-wrap">
                    <div className="flex items-center gap-0.5 rounded border border-surface-border bg-surface-base p-0.5">
                        {tabs.map((tab) => (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => setViewTab(tab.key)}
                                className={cn(
                                    'rounded px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer',
                                    viewTab === tab.key
                                        ? 'bg-primary text-primary-foreground'
                                        : 'text-text-soft hover:text-text-main',
                                )}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Popover Timeline Vertikal Alur Kerja */}
                    {workflowStepsPipeline.length > 0 && (
                        <Popover className="relative inline-block">
                            {({ open }) => (
                                <>
                                    <PopoverButton
                                        className={cn(
                                            'inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs focus:outline-none select-none',
                                            open
                                                ? 'bg-primary text-primary-foreground border-primary'
                                                : 'bg-surface-base border-surface-border text-foreground hover:bg-surface-muted'
                                        )}
                                        title="Klik untuk melihat timeline vertikal seluruh alur kerja"
                                    >
                                        <GitCommit size={12} className="shrink-0 text-primary" />
                                        <span>Alur Kerja ({workflowStepsPipeline.length} Tahap)</span>
                                        <ChevronDown size={11} className={cn('transition-transform duration-200 opacity-70', open && 'rotate-180')} />
                                    </PopoverButton>

                                    <Portal>
                                        <PopoverPanel
                                            anchor="bottom start"
                                            className="z-[999999] mt-2 w-80 sm:w-96 rounded-xl border border-border bg-background p-3.5 shadow-2xl backdrop-blur-md focus:outline-none animate-in fade-in zoom-in-95 duration-150"
                                        >
                                            {/* Header Popover */}
                                            <div className="flex items-center justify-between pb-2.5 border-b border-border">
                                                <div className="flex items-center gap-2">
                                                    <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                                                        <Workflow size={15} />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-xs font-bold text-foreground leading-none">
                                                            {contract.origin_workflow?.name || contract.workflow?.name || 'Alur Kerja Utama'}
                                                        </h4>
                                                        <p className="text-[10px] text-muted-foreground mt-0.5">
                                                            Timeline Vertikal Tahapan Alur Kerja
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className="text-[9.5px] font-extrabold px-2 py-0.5 rounded-full bg-surface-muted text-muted-foreground border border-surface-border uppercase tracking-wider">
                                                    {workflowStepsPipeline.length} Tahap
                                                </span>
                                            </div>

                                            {/* Vertical Timeline List */}
                                            <div className="mt-3 max-h-[60vh] overflow-y-auto custom-scrollbar pr-1">
                                                <Timeline className="pl-1">
                                                    {workflowStepsPipeline.map((stepItem, sIdx) => {
                                                        const isStepActive = stepItem.status === 'active';
                                                        const isStepDone = stepItem.status === 'completed';
                                                        const isStepRejected = stepItem.status === 'rejected';

                                                        return (
                                                            <TimelineItem key={stepItem.id || sIdx} status={stepItem.status} className="pb-3">
                                                                <TimelineIcon
                                                                    status={stepItem.status}
                                                                    className={cn(
                                                                        'h-5 w-5 text-[10px] font-bold',
                                                                        isStepActive && 'ring-2 ring-primary/30 ring-offset-1 bg-primary text-primary-foreground',
                                                                        isStepDone && 'bg-emerald-500 text-white',
                                                                        isStepRejected && 'bg-rose-500 text-white',
                                                                        stepItem.status === 'waiting' && 'bg-muted text-muted-foreground'
                                                                    )}
                                                                >
                                                                    {isStepDone ? '✓' : isStepRejected ? '✗' : stepItem.step}
                                                                </TimelineIcon>
                                                                <TimelineContent className="flex-1 min-w-0">
                                                                    <div className={cn(
                                                                        'rounded-lg border p-2 text-xs flex flex-col gap-1 transition-all',
                                                                        isStepActive
                                                                            ? 'border-primary/40 bg-primary/5 shadow-2xs'
                                                                            : isStepDone
                                                                            ? 'border-emerald-500/25 bg-emerald-500/5'
                                                                            : isStepRejected
                                                                            ? 'border-rose-500/25 bg-rose-500/5'
                                                                            : 'border-border/60 bg-surface-muted/30 opacity-75'
                                                                    )}>
                                                                        <div className="flex items-center justify-between gap-1.5 flex-wrap">
                                                                            <div className="flex items-center gap-1.5 min-w-0">
                                                                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-surface-base text-foreground border border-surface-border">
                                                                                    Tahap {stepItem.step}
                                                                                </span>
                                                                                {stepItem.category && (
                                                                                    <span className="text-[8.5px] font-bold uppercase tracking-wider px-1 py-0.2 rounded bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                                                                                        {stepItem.category}
                                                                                    </span>
                                                                                )}
                                                                                <span className="font-bold text-foreground text-[11px] truncate">
                                                                                    {stepItem.name}
                                                                                </span>
                                                                            </div>
                                                                            <span className={cn(
                                                                                'text-[8.5px] font-bold px-1.5 py-0.2 rounded uppercase tracking-wider shrink-0',
                                                                                isStepDone
                                                                                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                                                                                    : isStepRejected
                                                                                    ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                                                                                    : isStepActive
                                                                                    ? 'bg-amber-500/15 text-amber-800 dark:text-amber-200 border border-amber-500/30'
                                                                                    : 'bg-muted text-muted-foreground border border-border'
                                                                            )}>
                                                                                {isStepDone ? 'Disetujui' : isStepRejected ? 'Ditolak' : isStepActive ? 'Sedang Berjalan' : 'Menunggu'}
                                                                            </span>
                                                                        </div>

                                                                        {stepItem.description && (
                                                                            <p className="text-[10px] text-muted-foreground leading-tight">
                                                                                {stepItem.description}
                                                                            </p>
                                                                        )}

                                                                        <div className="flex items-center justify-between gap-2 text-[9.5px] text-muted-foreground pt-1 border-t border-border/40 mt-0.5">
                                                                            <span className="flex items-center gap-1 font-medium truncate">
                                                                                <UserCheck size={11} className="text-primary shrink-0" />
                                                                                {stepItem.approver}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </TimelineContent>
                                                            </TimelineItem>
                                                        );
                                                    })}
                                                </Timeline>
                                            </div>
                                        </PopoverPanel>
                                    </Portal>
                                </>
                            )}
                        </Popover>
                    )}

                    {currentStepInfo && !currentStepInfo.isCompleted && !currentStepInfo.isRejected && (
                        <span className="hidden sm:inline-flex items-center gap-1 text-[9.5px] font-bold uppercase tracking-wider text-amber-900 dark:text-amber-100 bg-amber-200 dark:bg-amber-950 border border-amber-400 dark:border-amber-700 px-1.5 py-0.5 rounded">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                            Tahap {currentStepInfo.stepNumber}/{currentStepInfo.totalSteps}
                        </span>
                    )}
                </div>

                {/* Right: Search & Export */}
                <div className="flex items-center gap-1.5">
                    <div className="w-28 sm:w-40">
                        <SearchInput
                            placeholder="CARI..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-7 text-[10px] uppercase bg-surface-base"
                        />
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportPdf}
                        className="border-surface-border bg-surface-base text-text-main hover:bg-surface-muted h-7 gap-1 px-2 rounded transition-colors text-[10px] font-semibold uppercase shadow-none"
                        title="Unduh PDF Alur Persetujuan"
                    >
                        <Download size={12} strokeWidth={2.5} />
                        <span className="hidden sm:inline">Export</span>
                    </Button>
                </div>
            </div>

            {/* ── INFORMASI CURRENT STEP (TAHAP SAAT INI) - SOLID & COMPACT ── */}
            {currentStepInfo && (
                <div className="shrink-0 rounded-lg border border-surface-border bg-surface-base p-2 space-y-1.5 transition-colors max-h-[35vh] sm:max-h-[40vh] overflow-y-auto custom-scrollbar">
                    {/* Header Row: Step info & Approvers on single/compact line */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-surface-muted text-foreground border border-surface-border">
                                Tahap {currentStepInfo.stepNumber}/{currentStepInfo.totalSteps}
                            </span>
                            {currentStepInfo.category && (
                                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-surface-muted text-foreground border border-surface-border">
                                    {currentStepInfo.category}
                                </span>
                            )}
                            <h4 className="text-xs font-bold text-foreground truncate">
                                {currentStepInfo.name || currentStepInfo.title}
                            </h4>
                        </div>

                        {/* Status badge */}
                        <div className="flex items-center gap-1 shrink-0">
                            {currentStepInfo.isCompleted ? (
                                <span className="bg-surface-muted text-foreground border border-surface-border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded">
                                    Disetujui ✓
                                </span>
                            ) : currentStepInfo.isRejected ? (
                                <span className="bg-surface-muted text-foreground border border-surface-border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded">
                                    Ditolak ✗
                                </span>
                            ) : (() => {
                                const activeStepObj = contract.workflow?.steps?.find((s: any) => s.step === activePendingApproval?.sequence || s.id === activePendingApproval?.workflow_step_id) || activePendingApproval?.workflow_step;
                                const activeStepActions: any[] = (activeStepObj as any)?.action_configs || (activeStepObj as any)?.actions || [];
                                const hasActiveActions = activeStepActions.length > 0 || Boolean(activePendingApproval?.action_code || activePendingApproval?.action_alias);
                                if (!hasActiveActions) return null;
                                return (
                                    <span className="inline-flex items-center gap-1 rounded bg-surface-muted text-foreground border border-surface-border px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                        <span>Pending</span>
                                    </span>
                                );
                            })()}
                        </div>
                    </div>

                    {/* Approvers Row: Single compact bar */}
                    {!currentStepInfo.isCompleted && !currentStepInfo.isRejected && (
                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-surface-border flex-wrap text-[10px]">
                            <div className="flex items-center gap-1.5 flex-wrap max-h-[25vh] overflow-y-auto custom-scrollbar">
                                <span className="font-semibold text-muted-foreground shrink-0 flex items-center gap-1">
                                    <UserCheck size={11} />
                                    Approver:
                                </span>
                                {currentStepInfo.approvers && currentStepInfo.approvers.length > 0 ? (
                                    <div className="flex items-center gap-1.5 flex-wrap max-h-[20vh] overflow-y-auto custom-scrollbar">
                                        {currentStepInfo.approvers.map((appr: any, idx: number) => (
                                            <div
                                                key={idx}
                                                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-surface-muted border border-surface-border text-foreground font-semibold text-[11px]"
                                            >
                                                <UserAvatarIcon
                                                    user={appr.user}
                                                    name={appr.name}
                                                    size="sm"
                                                    className="h-6 w-6 text-[10px] ring-1 ring-surface-base shrink-0"
                                                />
                                                <span className="truncate max-w-[160px]">{appr.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <span className="text-muted-foreground italic font-medium">
                                        {currentStepInfo.role ? `Role: ${currentStepInfo.role}` : 'Sesuai alur'}
                                    </span>
                                )}
                            </div>

                            {currentStepInfo.role && (
                                <div className="flex items-center gap-1 text-[9px] font-medium text-muted-foreground">
                                    <span className="font-bold text-foreground">{currentStepInfo.role}</span>
                                    {currentStepInfo.department && <span>• {currentStepInfo.department}</span>}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Scrollable Timeline Area */}
            <div className="flex-1 min-h-0 overflow-y-auto space-y-2.5 custom-scrollbar pr-1 pb-4">
                {viewTab === 'lite' ? (
                    <ApprovalStepsLite
                        contract={contract}
                        approvals={approvals}
                        creator={creator}
                        submittedAt={submittedAt}
                        meId={meId}
                        onApprove={onApprove}
                        search={debouncedSearch}
                        activePendingApproval={activePendingApproval}
                        expandedGroups={expandedGroups}
                        setExpandedGroups={setExpandedGroups}
                    />
                ) : (
                    <div className="relative">
                        <Timeline>
                    {!search && !approvals.some((a) => a.sequence === 1) && (
                        <TimelineItem status="completed">
                            <TimelineIcon status="completed">
                                ✓
                            </TimelineIcon>
                            <TimelineContent>
                                <InitiatorStepCard
                                    isOnly={stepTree.length === 0 && !showProjectedManager}
                                    creator={creator}
                                    submittedAt={submittedAt || contract.submitted_at || contract.created_at || (creator as any)?.created_at}
                                    isLite={viewTab === 'lite'}
                                />
                                <div className="mt-2.5 w-full border-b border-border/40" />
                            </TimelineContent>
                        </TimelineItem>
                    )}
                    {!search && showProjectedManager && (
                        <TimelineItem status="waiting">
                            <TimelineIcon status="waiting">
                                ?
                            </TimelineIcon>
                            <TimelineContent>
                                <ProjectedStepCard creator={creator} />
                                <div className="mt-2.5 w-full border-b border-border/40" />
                            </TimelineContent>
                        </TimelineItem>
                    )}

                    {stepTree.map((block, bIdx) => {
                        const isSubWf = block.isSubWorkflow;

                        const content = (
                            <React.Fragment key={block.workflowId + bIdx}>
                                {block.groups.map(
                                    (group: { sequence: number; stepName: string; stepDescription?: string; items: ContractApproval[] }, idx: number) => {
                                        const currentStepId = contract.workflow_step_id;
                                        const currentWfId = contract.workflow_id;
                                        const allApprovedItems = group.items.length > 0 && group.items.every((a) => a.status === 'approved');
                                        const isGroupCurrentStep = group.items.some((a) => a.workflow_step_id === currentStepId);
                                        const isCompleted = contract.status === 'approved' || allApprovedItems;
                                        
                                        const pendingWfId = activePendingApproval?.workflow_step?.workflow_id || (activePendingApproval as any)?.workflow_id;
                                        const isSameWorkflow = block.workflowId === (pendingWfId || currentWfId);
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

                                        // Cari status target dari workflow step
                                        const mainItem = group.items[0];
                                        const matchedStep = contract?.workflow?.steps?.find((s: any) => s.step === group.sequence || s.id === mainItem?.workflow_step_id) || mainItem?.workflow_step;
                                        const stepMeta = (matchedStep as any)?.meta || {};
                                        const targetStatus = stepMeta.target_status || (isActive ? (contract.status_info?.code || contract.status) : null);
                                        const statusColor = (isActive && contract.status_info?.color) ? contract.status_info.color : null;

                                        return (
                                            <TimelineItem key={group.sequence + idx} status={itemStatus}>
                                                <TimelineIcon
                                                    status={itemStatus}
                                                    style={isActive && statusColor ? { backgroundColor: statusColor, borderColor: 'transparent' } : undefined}
                                                >
                                                    {isSubWf ? `${group.sequence}` : group.sequence}
                                                </TimelineIcon>

                                                <TimelineContent>
                                                    <div className={cn(
                                                        "flex items-center justify-between gap-1",
                                                        viewTab === 'lite' ? 'mb-0' : 'mb-2 pb-1.5 border-b border-surface-border/60'
                                                    )}>
                                                        <div className="space-y-0.5">
                                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                                <h4 className={cn(
                                                                    "font-bold text-text-main",
                                                                    viewTab === 'lite' ? 'text-[11px]' : 'text-xs'
                                                                )}>
                                                                    {group.stepName}
                                                                </h4>
                                                                 {viewTab === 'pro' && targetStatus && (
                                                                    <span
                                                                        className="px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide border uppercase"
                                                                        style={
                                                                            statusColor
                                                                                ? { backgroundColor: `${statusColor}15`, color: statusColor, borderColor: `${statusColor}40` }
                                                                                : undefined
                                                                        }
                                                                    >
                                                                        {targetStatus}
                                                                    </span>
                                                                )}
                                                                {group.batchNo && group.batchNo > 1 && (
                                                                    <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 border border-amber-500/25 px-1.5 py-0.5 text-[8.5px] font-bold tracking-wider uppercase text-amber-700 dark:text-amber-300">
                                                                        <span>Batch {group.batchNo}</span>
                                                                    </span>
                                                                )}
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
                                                                            <span className="inline-flex items-center gap-1 rounded bg-indigo-500/10 border border-indigo-500/25 px-1.5 py-0.5 text-[8.5px] font-bold tracking-wider uppercase text-indigo-700 dark:text-indigo-300">
                                                                                <ArrowDownRight size={10} className="shrink-0" />
                                                                                <span>Persetujuan Berurutan</span>
                                                                            </span>
                                                                        );
                                                                    }

                                                                    if (isAdhocGroup) {
                                                                        const rule = adhocMeta?.approval_rule;
                                                                        const ruleLabel = rule === 'quorum' ? `Kuorum (${adhocMeta?.min_approvals ?? 1})` : rule === 'any' ? 'Salah Satu' : 'Semua';
                                                                        return (
                                                                            <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 border border-emerald-500/25 px-1.5 py-0.5 text-[8.5px] font-bold tracking-wider uppercase text-emerald-700 dark:text-emerald-300">
                                                                                <Users size={10} className="shrink-0" />
                                                                                <span>Persetujuan Serentak ({ruleLabel})</span>
                                                                            </span>
                                                                        );
                                                                    }

                                                                    return null;
                                                                })()}
                                                            </div>
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
                                                                        <p className="text-[10px] text-indigo-600/90 dark:text-indigo-400 font-medium mt-0.5">
                                                                            Setiap peninjau harus menyetujui secara berurutan sebelum peninjau berikutnya dapat melakukan tindakan persetujuan.
                                                                        </p>
                                                                    );
                                                                }

                                                                if (isAdhocGroup) {
                                                                    const rule = adhocMeta?.approval_rule;
                                                                    const desc = rule === 'quorum'
                                                                        ? `Persetujuan dapat dilakukan bersamaan. Membutuhkan minimal ${adhocMeta?.min_approvals ?? 1} persetujuan untuk melanjutkan tahap.`
                                                                        : rule === 'any'
                                                                        ? 'Persetujuan dapat dilakukan bersamaan. Cukup salah satu peninjau menyetujui untuk melanjutkan tahap.'
                                                                        : 'Persetujuan dapat dilakukan bersamaan oleh seluruh peninjau.';
                                                                    return (
                                                                        <p className="text-[10px] text-emerald-600/90 dark:text-emerald-400 font-medium mt-0.5">
                                                                            {desc}
                                                                        </p>
                                                                    );
                                                                }

                                                                return null;
                                                            })()}
                                                            {viewTab === 'pro' && group.stepDescription && (
                                                                 <p className="text-[11px] text-text-muted leading-relaxed">
                                                                     {group.stepDescription}
                                                                 </p>
                                                             )}
                                                         </div>

                                                         {viewTab === 'pro' && (() => {
                                                            let actions = mainItem?.workflow_step?.action_configs || [];

                                                            if (matchedStep) {
                                                                if (!actions.length) actions = matchedStep.action_configs || [];
                                                            }

                                                             const actionReqFields: string[] = actions
                                                                .filter((act: any) => !['reject', 'revisi', 'return'].includes((act.action_code || act.master_action_code || '').toLowerCase()))
                                                                .flatMap((act: any) => act.required_fields || []);
                                                             const requirePic = !!stepMeta.require_pic || actionReqFields.includes('pic') || actionReqFields.includes('assigned_pic');
                                                             const requireF1 = !!stepMeta.require_f1 || actionReqFields.includes('f1');
                                                             const requireF2 = !!stepMeta.require_f2 || actionReqFields.includes('f2');
                                                             const requireAgreement = !!stepMeta.require_agreement || actionReqFields.includes('agreement');
                                                             const requireTitle = !!stepMeta.require_title || actionReqFields.includes('title');
                                                             const requireVendor = !!stepMeta.require_vendor || actionReqFields.includes('vendor');
                                                             const requireCategory = !!stepMeta.require_category || actionReqFields.includes('category');
                                                             const requireContractNo = !!stepMeta.require_f2_contract_no || actionReqFields.includes('contract_no') || actionReqFields.includes('f2_contract_no');
                                                             const requireTax = !!stepMeta.require_tax_toggle || actionReqFields.includes('tax_toggle') || actionReqFields.includes('tax');
                                                             const requirePrice = !!stepMeta.require_price || actionReqFields.includes('price');
                                                             const requirePeriod = !!stepMeta.require_period || actionReqFields.includes('period');

                                                             const reqList = [];

                                                             if (requirePic) {
                                                                 const isFilled = !!(
                                                                     contract.assigned_pic_id ||
                                                                     contract.metadata?.assigned_pic_id ||
                                                                     (contract as any)?.assigned_pic ||
                                                                     (contract as any)?.assignedPic
                                                                 );
                                                                 reqList.push({ label: 'PIC', isFilled });
                                                             }
                                                             if (requireTitle) {
                                                                 const isFilled = !!contract.title;
                                                                 reqList.push({ label: 'Judul', isFilled });
                                                             }
                                                             if (requireVendor) {
                                                                 const isFilled = !!(contract.vendor_id || (contract as any)?.vendor);
                                                                 reqList.push({ label: 'Vendor', isFilled });
                                                             }
                                                             if (requireCategory) {
                                                                 const isFilled = !!(contract.contract_type_id || (contract as any)?.contract_type);
                                                                 reqList.push({ label: 'Kategori', isFilled });
                                                             }
                                                             if (requireContractNo) {
                                                                 const isFilled = !!contract.contract_no;
                                                                 reqList.push({ label: 'No. Kontrak', isFilled });
                                                             }
                                                             if (requireTax) {
                                                                 const isFilled = (contract.tax_required !== null && contract.tax_required !== undefined) || contract.metadata?.tax_required !== undefined;
                                                                 reqList.push({ label: 'Pajak', isFilled });
                                                             }
                                                             if (requirePrice) {
                                                                 const isFilled = contract.price !== null && contract.price !== undefined && contract.price !== '';
                                                                 reqList.push({ label: 'Nilai', isFilled });
                                                             }
                                                             if (requirePeriod) {
                                                                 const isFilled = (!!contract.contract_date || !!contract.start_date) && !!contract.end_date;
                                                                 reqList.push({ label: 'Masa Berlaku', isFilled });
                                                             }
                                                             if (requireF1) {
                                                                 const isFilled = !!(
                                                                     contract.f1_file ||
                                                                     contract.metadata?.f1_file ||
                                                                     (contract.form_submissions || (contract as any).formSubmissions || []).some((fs: any) => fs.document_type === 'f1') ||
                                                                     (contract as any)?.f1_submission ||
                                                                     (contract as any)?.f1_form_data ||
                                                                     contract.metadata?.f1_form_data ||
                                                                     (contract?.versions && contract.versions.some((v: any) => v.document_type === 'f1')) ||
                                                                     (contract.f1_items && contract.f1_items.length > 0)
                                                                 );
                                                                 reqList.push({ label: 'F1', isFilled });
                                                             }
                                                             if (requireF2) {
                                                                 const isFilled = !!(
                                                                     contract.f2_file ||
                                                                     contract.metadata?.f2_file ||
                                                                     (contract.form_submissions || (contract as any).formSubmissions || []).some((fs: any) => fs.document_type === 'f2') ||
                                                                     (contract as any)?.f2_submission ||
                                                                     (contract as any)?.f2_form_data ||
                                                                     contract.metadata?.f2_form_data ||
                                                                     (contract?.versions && contract.versions.some((v: any) => v.document_type === 'f2')) ||
                                                                     contract.contract_no ||
                                                                     contract.price
                                                                 );
                                                                 reqList.push({ label: 'F2', isFilled });
                                                             }
                                                             if (requireAgreement) {
                                                                 const isFilled = !!(
                                                                     contract.agreement_file ||
                                                                     contract.metadata?.agreement_file ||
                                                                     (contract.form_submissions || (contract as any).formSubmissions || []).some((fs: any) => fs.document_type === 'agreement' || fs.document_type === 'contract') ||
                                                                     (contract as any)?.agreement_submission ||
                                                                     contract.agreement_content ||
                                                                     contract.metadata?.agreement_content ||
                                                                     (contract?.versions && contract.versions.some((v: any) => v.document_type === 'agreement' || v.document_type === 'contract'))
                                                                 );
                                                                 reqList.push({ label: 'Draft', isFilled });
                                                             }

                                                             if (reqList.length === 0) return null;

                                                             return (
                                                                 <div className="flex items-center gap-1.5">
                                                                     {reqList.map((req, rIdx) => (
                                                                         <span
                                                                             key={rIdx}
                                                                             className={cn(
                                                                                 'px-2 py-0.5 rounded text-[9.5px] font-bold tracking-wide flex items-center gap-1 border',
                                                                                 req.isFilled
                                                                                     ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                                                                                     : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                                                                             )}
                                                                             title={`Syarat ${req.label}: ${req.isFilled ? 'Sudah Diisi' : 'Wajib Diisi / Belum Ada'}`}
                                                                         >
                                                                             <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', req.isFilled ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse')} />
                                                                             Wajib {req.label}: {req.isFilled ? '✓' : '✗'}
                                                                         </span>
                                                                     ))}
                                                                 </div>
                                                             );
                                                         })()}

                                                         {/* Waktu Masuk Step setara Label Step */}
                                                         {(() => {
                                                             const stepEntryAt = group.items.find((it: any) => it.step_entry_at || it.created_at)?.step_entry_at || group.items.find((it: any) => it.created_at)?.created_at;
                                                             if (!stepEntryAt) return null;
                                                             return (
                                                                 <span className="text-text-soft flex items-center gap-1 font-mono text-[9px] tabular-nums uppercase shrink-0" title="Waktu Masuk Tahap">
                                                                     <LogIn size={9.5} className="text-muted-foreground shrink-0" />
                                                                     <span className="text-text-soft font-normal">Masuk:</span> {formatDateTime(stepEntryAt)}
                                                                 </span>
                                                             );
                                                         })()}
                                                    </div>

                                                    <div className="mt-0.5 space-y-1.5">
                                                        {(() => {
                                                            const groupKey = `${block.workflowId}_${group.sequence}`;
                                                            const isExpanded = !!expandedGroups[groupKey];
                                                            const allItems = group.items;
                                                            const visibleItems = isExpanded ? allItems : allItems.slice(0, 10);

                                                            return (
                                                                 <>
                                                                    {/* Render all approver items for this step directly */}
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
                                                                                showDetails={viewTab === 'pro'}
                                                                                isLite={viewTab === 'lite'}
                                                                                isSubStep={hasSub}
                                                                                isPending={isItemPending}
                                                                            />
                                                                        );
                                                                    })}

                                                                    {allItems.length > 10 && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setExpandedGroups(prev => ({ ...prev, [groupKey]: !prev[groupKey] }))}
                                                                            className="text-primary hover:underline mt-1 flex items-center gap-1.5 text-[9.5px] font-extrabold tracking-wider uppercase cursor-pointer"
                                                                        >
                                                                            {isExpanded ? 'Sembunyikan' : `+ Tampilkan ${allItems.length - 10} Penerima Persetujuan Lainnya`}
                                                                        </button>
                                                                    )}
                                                                </>
                                                            );
                                                        })()}
                                                    </div>
                                                    <div className="mt-2.5 w-full border-b border-border/40" />
                                                </TimelineContent>
                                            </TimelineItem>
                                        );
                                    },
                                )}
                            </React.Fragment>
                        );

                        if (isSubWf) {
                            return (
                                <TimelineItem key={block.workflowId + bIdx} status="active" className={cn(viewTab === 'lite' ? 'pb-2' : 'pb-4', 'w-full min-w-0')}>
                                    <TimelineIcon 
                                        status="active" 
                                        className="bg-indigo-600 text-white dark:bg-indigo-500 shadow-xs"
                                    >
                                        <Layers size={13} strokeWidth={2} />
                                    </TimelineIcon>
                                    <TimelineContent className="w-full min-w-0 flex-1">
                                        <div className="rounded-xl border border-indigo-200/60 dark:border-indigo-800/60 bg-card p-3 sm:p-3.5 shadow-xs space-y-2.5 w-full min-w-0">
                                            {/* Simple Sub-Workflow Card Header */}
                                            <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <div className="flex h-5.5 w-5.5 items-center justify-center rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
                                                        <Workflow size={12} strokeWidth={2} />
                                                    </div>
                                                    <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                                                        <span className="text-[9px] font-bold tracking-wider uppercase bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded font-mono">
                                                            Sub-Workflow
                                                        </span>
                                                        {block.batchNo && block.batchNo > 1 && (
                                                            <span className="text-[9px] font-bold tracking-wider uppercase bg-amber-500/15 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded font-mono border border-amber-500/30">
                                                                Sesi #{block.batchNo}
                                                            </span>
                                                        )}
                                                        <h4 className="text-xs font-bold text-foreground truncate">
                                                            {block.workflowName}
                                                        </h4>
                                                    </div>
                                                </div>
                                                <span className="text-[10px] text-muted-foreground font-medium shrink-0">
                                                    {block.groups.length} Tahap
                                                </span>
                                            </div>

                                            {/* Simple Nested Timeline */}
                                            <div className="relative pt-0.5 w-full min-w-0">
                                                <Timeline className="border-border/60 ml-1 pl-2.5 gap-2 w-full">
                                                    {content}
                                                </Timeline>
                                            </div>
                                        </div>
                                    </TimelineContent>
                                </TimelineItem>
                            );
                        }

                        return content;
                    })}
                </Timeline>
                </div>
                )}
            </div>
        </div>
    );
}
