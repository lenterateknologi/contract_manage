import { Button } from '@/components/ui/buttons/Button';
import { FilterCategory, FilterPopover } from '@/components/ui/selection/FilterPopover';
import { useToast } from '@/components/ui/feedback/Toast';
import { SearchInput } from '@/components/ui/inputs/SearchInput';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils';
import { Contract, ContractApproval, UserProfile } from '@/pages/contracts/types';
import { Download, ListFilter } from 'lucide-react';
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

export default function ApprovalSteps({ contract, approvals, creator, submittedAt, meId, onApprove }: Props) {
    const { showToast } = useToast();
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [roleFilter, setRoleFilter] = useState<string>('');
    const [deptFilter, setDeptFilter] = useState<string>('');
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 500);
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

    const roles = useMemo(
        () =>
            Array.from(new Set(approvals.map((a) => a.role)))
                .filter(Boolean)
                .sort(),
        [approvals],
    );
    const depts = useMemo(
        () =>
            Array.from(new Set(approvals.map((a) => a.department_name)))
                .filter(Boolean)
                .sort(),
        [approvals],
    );

    const filteredSteps = useMemo(() => {
        let result = [...approvals];
        if (statusFilter) result = result.filter((a) => a.status === statusFilter);
        if (roleFilter) result = result.filter((a) => a.role === roleFilter);
        if (deptFilter) result = result.filter((a) => a.department_name === deptFilter);
        if (debouncedSearch) {
            const s = debouncedSearch.toLowerCase();
            result = result.filter(
                (a) =>
                    a.role?.toLowerCase().includes(s) || a.department_name?.toLowerCase().includes(s) || a.approver?.name?.toLowerCase().includes(s),
            );
        }
        // Sort primarily by sort_order if available, then by creation time or id
        return result.sort((a, b) => {
            if (a.sort_order !== undefined && b.sort_order !== undefined && a.sort_order !== b.sort_order) {
                return (a.sort_order || 0) - (b.sort_order || 0);
            }
            if (a.created_at && b.created_at) {
                return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            }
            return a.id.localeCompare(b.id);
        });
    }, [approvals, statusFilter, roleFilter, deptFilter, debouncedSearch]);

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

        // After grouping, ensure each group is named correctly and items are sorted properly
        blocks.forEach((block) => {
            block.groups.forEach((group: any) => {
                // Find the main step (the one that is not a sub-step, i.e., sub_step is null)
                const mainStep = group.items.find((a: any) => a.sub_step == null) || group.items[0];
                group.stepName = mainStep.step_name || mainStep.role || 'Persetujuan';
                group.stepDescription = mainStep.step_description;

                // Sort items so the main step (sub_step == null) is ALWAYS LAST
                group.items.sort((a: any, b: any) => {
                    if (a.sub_step == null && b.sub_step != null) return 1;
                    if (a.sub_step != null && b.sub_step == null) return -1;

                    if (a.sub_step != null && b.sub_step != null) {
                        return Number(a.sub_step) - Number(b.sub_step);
                    }

                    // Fallback to ID or created_at if both are main steps (shouldn't happen)
                    if (a.created_at && b.created_at) {
                        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                    }
                    return a.id.localeCompare(b.id);
                });
            });

            // Also ensure groups are sorted by sequence
            block.groups.sort((a: any, b: any) => Number(a.sequence) - Number(b.sequence));
        });
        return blocks;
    }, [filteredSteps, contract.workflow_id, contract.workflow?.name]);

    const showProjectedManager = approvals.length === 0 && creator.role?.toLowerCase() === 'staff';

    const handleExportPdf = () => {
        const params = new URLSearchParams({
            status: statusFilter || '',
            role: roleFilter || '',
            department: deptFilter || '',
        }).toString();
        window.open(`/api/contracts/${contract.id}/approval/pdf?${params}`, '_blank');
    };

    const filterCategories: FilterCategory[] = [
        {
            label: 'STATUS',
            key: 'status',
            options: [
                { label: 'DISETUJUI', value: 'approved' },
                { label: 'DITOLAK', value: 'rejected' },
                { label: 'PENDING', value: 'pending' },
                { label: 'WAITING', value: 'waiting' },
            ],
        },
        {
            label: 'ROLE',
            key: 'role',
            type: 'searchable',
            options: roles.map((r) => ({ label: r || 'UNNAMED ROLE', value: r || '' })),
        },
        {
            label: 'DEPARTEMEN',
            key: 'department',
            type: 'searchable',
            options: depts.map((d) => ({ label: d || 'UMUM', value: d || '' })),
        },
    ];

    const activeCount = (statusFilter ? 1 : 0) + (roleFilter ? 1 : 0) + (deptFilter ? 1 : 0);

    return (
        <div className="animate-in fade-in relative flex min-w-0 flex-col gap-4 overflow-x-hidden duration-500">
            {/* Clean 1-Row Toolbar with compact search bar */}
            <div className="flex items-center justify-between gap-2 w-full">
                <div className="w-48 sm:w-60 shrink-0">
                    <SearchInput
                        placeholder="CARI NAMA / ROLE..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-8 text-[10px] uppercase"
                    />
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                    <FilterPopover
                        categories={filterCategories}
                        activeFilters={{
                            status: statusFilter ? [statusFilter] : [],
                            role: roleFilter ? [roleFilter] : [],
                            department: deptFilter ? [deptFilter] : [],
                        }}
                        onFilterChange={(key, val) => {
                            const firstVal = Array.isArray(val) ? val[0] || '' : val;
                            if (key === 'status') setStatusFilter(statusFilter === firstVal ? '' : firstVal);
                            if (key === 'role') setRoleFilter(roleFilter === firstVal ? '' : firstVal);
                            if (key === 'department') setDeptFilter(deptFilter === firstVal ? '' : firstVal);
                        }}
                        onReset={() => {
                            setStatusFilter('');
                            setRoleFilter('');
                            setDeptFilter('');
                        }}
                        totalResults={filteredSteps.length}
                    >
                        <Button
                            variant="outline"
                            size="sm"
                            className={cn(
                                'border-surface-border text-text-main hover:bg-surface-muted h-8 gap-1.5 px-2.5 transition-all text-[10px] font-semibold uppercase rounded-lg',
                                activeCount > 0 && 'border-primary bg-primary text-primary-foreground',
                            )}
                        >
                            <ListFilter size={13} strokeWidth={2.5} />
                            <span>Filter</span>
                            {activeCount > 0 && (
                                <span className="text-primary ml-1 flex h-3.5 w-3.5 items-center justify-center rounded-md bg-white text-[8px] font-bold">
                                    {activeCount}
                                </span>
                            )}
                        </Button>
                    </FilterPopover>

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
                    {!activeCount && !search && !approvals.some((a) => a.sequence === 1) && (
                        <TimelineItem status="completed">
                            <InitiatorStepCard isOnly={stepTree.length === 0 && !showProjectedManager} creator={creator} submittedAt={submittedAt} />
                        </TimelineItem>
                    )}
                    {!activeCount && !search && showProjectedManager && (
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
