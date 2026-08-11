import { Button } from '@/components/ui/buttons/Button';
import { SearchInput } from '@/components/ui/inputs/SearchInput';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils';
import { Contract, ContractApproval, UserProfile } from '@/pages/contracts/types';
import { Download } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { ApprovalCard } from './ApprovalCard';
import { InitiatorStepCard } from './InitiatorStepCard';
import { ProjectedStepCard } from './ProjectedStepCard';

import { Timeline, TimelineItem, TimelineIcon, TimelineContent } from '../ui/timeline';

interface Props {
    contract: Contract;
    approvals: ContractApproval[];
    creator: UserProfile;
    submittedAt?: string;
    meId?: string;
    onApprove: (note: string, attachment?: File) => Promise<void>;
}

type ViewTab = 'all' | 'eligible' | 'active' | 'no_skipped';

export default function ApprovalSteps({ contract, approvals, creator, submittedAt, meId, onApprove }: Props) {
    const [viewTab, setViewTab] = useState<ViewTab>('eligible');
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 500);
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

    const filteredSteps = useMemo(() => {
        let result = [...approvals];

        // Tab: Syarat Terpenuhi = hanya approved / rejected / pending+active
        if (viewTab === 'eligible') {
            result = result.filter(
                (a) =>
                    a.status === 'approved' ||
                    a.status === 'rejected' ||
                    (a.status === 'pending' && a.is_active),
            );
        }

        // Tab: Semua Kecuali Tidak Terpenuhi
        // = hide step yang is_active=false, waiting, SELANJUTNYA (sesuai logika ApprovalCard isStaged/isWaiting)
        if (viewTab === 'active') {
            result = result.filter(
                (a) =>
                    a.is_active === true &&
                    a.status !== 'waiting' &&
                    (a.status as string) !== 'SELANJUTNYA' &&
                    (a.status as string) !== 'SKIPPED',
            );
        }

        // Tab: Tanpa Dilewati = hide SKIPPED saja, tampilkan sisanya
        if (viewTab === 'no_skipped') {
            result = result.filter(
                (a) => (a.status as string) !== 'SKIPPED',
            );
        }

        if (debouncedSearch) {
            const s = debouncedSearch.toLowerCase();
            result = result.filter(
                (a) =>
                    a.role?.toLowerCase().includes(s) ||
                    a.department_name?.toLowerCase().includes(s) ||
                    a.approver?.name?.toLowerCase().includes(s),
            );
        }

        return result.sort((a, b) => {
            if (a.sort_order !== undefined && b.sort_order !== undefined && a.sort_order !== b.sort_order) {
                return (a.sort_order || 0) - (b.sort_order || 0);
            }
            if (a.created_at && b.created_at) {
                return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            }
            return a.id.localeCompare(b.id);
        });
    }, [approvals, viewTab, meId, debouncedSearch]);

    // Build a hierarchical tree of steps
    const stepTree = useMemo(() => {
        const blocks: any[] = [];
        let currentBlock: any = null;

        filteredSteps.forEach((a) => {
            const wfId = a.workflow_step?.workflow_id || contract.workflow_id;
            const wfName = a.workflow_step?.workflow?.name || contract.workflow?.name || 'Alur Kerja';

            if (!currentBlock || currentBlock.workflowId !== wfId) {
                currentBlock = {
                    workflowId: wfId,
                    workflowName: wfName,
                    isSubWorkflow: wfId !== contract.workflow_id,
                    groups: [],
                };
                blocks.push(currentBlock);
            }

            const seq = a.sequence;
            let group = currentBlock.groups.find((g: any) => g.sequence === seq);
            if (!group) {
                group = {
                    sequence: seq,
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
                group.stepName = mainStep.step_name || mainStep.role || 'Persetujuan';
                group.stepDescription = mainStep.step_description;

                group.items.sort((a: any, b: any) => {
                    if (a.sub_step == null && b.sub_step != null) return 1;
                    if (a.sub_step != null && b.sub_step == null) return -1;
                    if (a.sub_step != null && b.sub_step != null) {
                        return Number(a.sub_step) - Number(b.sub_step);
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
    }, [filteredSteps, contract.workflow_id, contract.workflow?.name]);

    const showProjectedManager = approvals.length === 0 && creator.role?.toLowerCase() === 'staff';

    const handleExportPdf = () => {
        window.open(`/api/contracts/${contract.id}/approval/pdf`, '_blank');
    };

    const tabs: { key: ViewTab; label: string }[] = [
        { key: 'eligible', label: 'Syarat Terpenuhi' },
        { key: 'no_skipped', label: 'Semua (Tanpa Dilewati)' },
        { key: 'all', label: 'Semua Alur' },
    ];

    return (
        <div className="animate-in fade-in relative flex min-w-0 flex-col gap-4 overflow-x-hidden duration-500">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 w-full">
                {/* Tab buttons */}
                <div className="flex items-center gap-0 rounded-lg border border-surface-border bg-surface-muted p-0.5">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => setViewTab(tab.key)}
                            className={cn(
                                'rounded-md px-3 py-1 text-[10px] font-semibold uppercase tracking-wide transition-all duration-150 cursor-pointer',
                                viewTab === tab.key
                                    ? 'bg-primary text-white shadow-xs'
                                    : 'text-text-soft hover:text-text-main',
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                    <div className="w-44 sm:w-56">
                        <SearchInput
                            placeholder="CARI NAMA / ROLE..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-8 text-[10px] uppercase"
                        />
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportPdf}
                        className="border-surface-border bg-surface-base text-text-main hover:bg-surface-muted h-8 gap-1.5 px-2.5 rounded-lg transition-all text-[10px] font-semibold uppercase"
                        title="Unduh PDF Alur Persetujuan"
                    >
                        <Download size={13} strokeWidth={2.5} />
                        <span>Export</span>
                    </Button>
                </div>
            </div>

            <div className="relative px-1">
                <Timeline>
                    {!search && !approvals.some((a) => a.sequence === 1) && (
                        <TimelineItem status="completed">
                            <InitiatorStepCard isOnly={stepTree.length === 0 && !showProjectedManager} creator={creator} submittedAt={submittedAt} />
                        </TimelineItem>
                    )}
                    {!search && showProjectedManager && (
                        <TimelineItem status="waiting">
                            <ProjectedStepCard creator={creator} />
                        </TimelineItem>
                    )}

                    {stepTree.map((block, bIdx) => {
                        const isLastBlock = bIdx === stepTree.length - 1;

                        return (
                            <React.Fragment key={block.workflowId + bIdx}>
                                {block.isSubWorkflow && (
                                    <div className="mb-2 flex items-center gap-2 pl-2">
                                        <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-500" />
                                        <span className="text-[10px] font-semibold tracking-tighter text-indigo-600 uppercase dark:text-indigo-400">
                                            Sub-Workflow: {block.workflowName}
                                        </span>
                                    </div>
                                )}

                                {block.groups.map(
                                    (group: { sequence: number; stepName: string; stepDescription?: string; items: ContractApproval[] }, idx: number) => {
                                        const currentStep = contract.workflow_step?.step ?? 1;
                                        const allApprovedItems = group.items.length > 0 && group.items.every((a) => a.status === 'approved');
                                        const isCompleted = contract.status === 'approved' || group.sequence < currentStep || allApprovedItems;
                                        const isActive =
                                            contract.status !== 'approved' &&
                                            !isCompleted &&
                                            (group.sequence === currentStep || group.items.some((a) => a.status === 'pending' && a.is_active));
                                        const isRejectedState = group.items.some((a) => a.status === 'rejected');

                                        const itemStatus = isCompleted
                                            ? 'completed'
                                            : isRejectedState
                                                ? 'rejected'
                                                : isActive
                                                    ? 'active'
                                                    : 'waiting';

                                        return (
                                            <TimelineItem key={group.sequence + idx} status={itemStatus}>
                                                <TimelineIcon status={itemStatus}>
                                                    {group.sequence}
                                                </TimelineIcon>

                                                <TimelineContent>
                                                    {group.stepName && group.stepName !== 'Persetujuan Tambahan' && (
                                                        <span className={cn(
                                                            'text-[11px] font-bold tracking-tight uppercase transition-colors duration-300',
                                                            isCompleted
                                                                ? 'text-emerald-700 dark:text-emerald-400'
                                                                : isActive
                                                                    ? 'text-amber-600 dark:text-amber-400'
                                                                    : isRejectedState
                                                                        ? 'text-rose-600 dark:text-rose-400'
                                                                        : 'text-text-soft',
                                                        )}>
                                                            {group.stepName}
                                                        </span>
                                                    )}

                                                    <div className="space-y-1 mt-0.5">
                                                        {(() => {
                                                            const groupKey = `${block.workflowId}_${group.sequence}`;
                                                            const isExpanded = !!expandedGroups[groupKey];
                                                            const visibleItems = isExpanded ? group.items : group.items.slice(0, 3);

                                                            return (
                                                                <>
                                                                    {visibleItems.map((a: ContractApproval) => {
                                                                        const stepNumber = a.sub_step != null ? `${group.sequence}.${a.sub_step}` : `${group.sequence}`;
                                                                        return (
                                                                            <ApprovalCard key={a.id} approval={a} stepNumber={stepNumber} displaySubSteps={false} />
                                                                        );
                                                                    })}
                                                                    {group.items.length > 3 && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setExpandedGroups(prev => ({ ...prev, [groupKey]: !prev[groupKey] }))}
                                                                            className="text-primary hover:underline mt-1 flex items-center gap-1.5 text-[9.5px] font-extrabold tracking-wider uppercase cursor-pointer"
                                                                        >
                                                                            {isExpanded ? 'Sembunyikan' : `+ Tampilkan ${group.items.length - 3} Penerima Persetujuan Lainnya`}
                                                                        </button>
                                                                    )}
                                                                </>
                                                            );
                                                        })()}
                                                    </div>
                                                </TimelineContent>
                                            </TimelineItem>
                                        );
                                    },
                                )}
                            </React.Fragment>
                        );
                    })}
                </Timeline>
            </div>
        </div>
    );
}
