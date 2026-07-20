import { Button } from '@/components/ui/buttons/Button';
import { FilterCategory, FilterPopover } from '@/components/ui/selection/FilterPopover';
import { useToast } from '@/components/ui/feedback/Toast';
import { SearchInput } from '@/components/ui/inputs/SearchInput';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils';
import { Contract, ContractApproval, UserProfile } from '@/pages/contracts/types';
import { Download, ListFilter } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ApprovalCard } from './ApprovalCard';
import { InitiatorStepCard } from './InitiatorStepCard';
import { ProjectedStepCard } from './ProjectedStepCard';

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
            <div className="mb-1 flex items-center gap-3">
                <div className="flex-1">
                    <SearchInput
                        placeholder="CARI NAMA / ROLE..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-8.5 text-[9px] uppercase"
                    />
                </div>

                <div className="flex items-center gap-2">
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
                                'border-surface-border text-text-main hover:bg-surface-muted h-8.5 gap-1.5 px-3 transition-all',
                                activeCount > 0 && 'border-primary bg-primary text-primary-foreground',
                            )}
                        >
                            <ListFilter size={12} strokeWidth={3} />
                            <span className="text-[9px] uppercase">Filter</span>
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
                        className="dark:bg-sidebar border-surface-border bg-surface-base text-text-desc hover:text-text-main animate-in fade-in h-8.5 w-8.5 p-0 transition-all"
                    >
                        <Download size={14} strokeWidth={2.5} />
                    </Button>
                </div>
            </div>

            <div className="relative space-y-8 px-1">
                {!activeCount && !search && !approvals.some((a) => a.sequence === 1) && (
                    <InitiatorStepCard isOnly={stepTree.length === 0 && !showProjectedManager} creator={creator} submittedAt={submittedAt} />
                )}
                {!activeCount && !search && showProjectedManager && <ProjectedStepCard creator={creator} />}

                {stepTree.map((block, bIdx) => {
                    const isLastBlock = bIdx === stepTree.length - 1;

                    return (
                        <div
                            key={block.workflowId + bIdx}
                            className={cn(
                                'relative space-y-6',
                                block.isSubWorkflow &&
                                'ml-4 rounded-r-xl border-l-2 border-dashed border-indigo-200 bg-indigo-50/20 py-2 pl-4 dark:border-indigo-900/40 dark:bg-indigo-950/5',
                            )}
                        >
                            {block.isSubWorkflow && (
                                <div className="mb-4 flex items-center gap-2">
                                    <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-500" />
                                    <span className="text-[10px] font-semibold tracking-tighter text-indigo-600 uppercase dark:text-indigo-400">
                                        Sub-Workflow: {block.workflowName}
                                    </span>
                                </div>
                            )}

                            {block.groups.map(
                                (group: { sequence: number; stepName: string; stepDescription?: string; items: ContractApproval[] }, idx: number) => {
                                    const isLastGroup = idx === block.groups.length - 1 && isLastBlock;

                                    const currentStep = contract.workflow_step?.step ?? 1;
                                    const allApprovedItems = group.items.length > 0 && group.items.every((a) => a.status === 'approved');
                                    const isCompleted = contract.status === 'approved' || group.sequence < currentStep || allApprovedItems;
                                    const isActive =
                                        contract.status !== 'approved' &&
                                        !isCompleted &&
                                        (group.sequence === currentStep || group.items.some((a) => a.status === 'pending' && a.is_active));
                                    const isRejectedState = group.items.some((a) => a.status === 'rejected');

                                    return (
                                        <div key={group.sequence + idx} className="relative pb-1.5 pl-7">
                                            {/* Step connector line */}
                                            {!(idx === block.groups.length - 1 && isLastBlock) && (
                                                <div
                                                    className={cn(
                                                        'absolute top-5 bottom-0 left-[9px] w-0.5 transition-colors duration-300',
                                                        isCompleted
                                                            ? 'bg-emerald-500 dark:bg-emerald-600'
                                                            : isActive
                                                                ? 'bg-amber-400/40 dark:bg-amber-500/30'
                                                                : 'bg-slate-200 dark:bg-slate-800',
                                                    )}
                                                />
                                            )}

                                            {/* Step Sequence Number Indicator */}
                                            <div
                                                className={cn(
                                                    'absolute top-0.5 left-0 z-10 flex h-5 w-5 items-center justify-center rounded-full border text-[9px] font-extrabold shadow-2xs transition-all duration-300',
                                                    isCompleted
                                                        ? 'border-emerald-500 bg-emerald-500 text-white dark:border-emerald-600 dark:bg-emerald-600'
                                                        : isRejectedState
                                                            ? 'border-rose-500 bg-rose-500 text-white dark:border-rose-600 dark:bg-rose-600'
                                                            : isActive
                                                                ? 'animate-pulse border-amber-500 bg-amber-500 text-white shadow-md ring-2 shadow-amber-500/20 ring-amber-500/15 dark:border-amber-600 dark:bg-amber-600'
                                                                : block.isSubWorkflow
                                                                    ? 'border-indigo-300 bg-indigo-100 text-indigo-600 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-400'
                                                                    : 'border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400',
                                                )}
                                            >
                                                {group.sequence}
                                            </div>

                                            <div className="space-y-2">
                                                {/* Step Group Title & Details */}
                                                <div className="flex flex-col">
                                                    <h3
                                                        className={cn(
                                                            'text-[11px] font-semibold transition-colors duration-300',
                                                            isCompleted
                                                                ? 'text-emerald-700 dark:text-emerald-400'
                                                                : isActive
                                                                    ? 'font-extrabold text-amber-600 dark:text-amber-400'
                                                                    : isRejectedState
                                                                        ? 'text-rose-600 dark:text-rose-400'
                                                                        : 'text-text-main',
                                                        )}
                                                    >
                                                        {group.stepName === 'Persetujuan Tambahan' ? 'Persetujuan Tambahan' : `${group.stepName}`}
                                                    </h3>
                                                    {group.stepDescription && group.stepDescription !== group.stepName && (
                                                        <p
                                                            className={cn(
                                                                'mt-0.5 text-[9px] leading-relaxed font-medium italic transition-colors duration-300',
                                                                isCompleted
                                                                    ? 'text-emerald-600/70 dark:text-emerald-400/70'
                                                                    : isActive
                                                                        ? 'text-amber-600/70 dark:text-amber-400/70'
                                                                        : 'text-text-soft',
                                                            )}
                                                        >
                                                            {group.stepDescription}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Approvals listed under this group with L-shaped tree branches for ad-hoc items */}
                                                <div className="space-y-1.5">
                                                    {(() => {
                                                        const subStepItems = group.items.filter((item: ContractApproval) => item.sub_step != null);
                                                        const hasMainStep = group.items.some((item: ContractApproval) => item.sub_step == null);
                                                        const groupKey = `${block.workflowId}_${group.sequence}`;
                                                        const isExpanded = !!expandedGroups[groupKey];
                                                        const visibleItems = isExpanded ? group.items : group.items.slice(0, 3);

                                                        return (
                                                            <>
                                                                {visibleItems.map((a: ContractApproval) => {
                                                                    const isSubStep = a.sub_step != null;
                                                                    const itemIdx = group.items.indexOf(a);
                                                                    const isLastItemInGroup = itemIdx === group.items.length - 1;
                                                                    const isFirstInGroup = itemIdx === 0;

                                                                    if (!isSubStep) {
                                                                        const stepNumber = `${group.sequence}`;
                                                                        return (
                                                                            <div key={a.id} className="relative animate-in fade-in duration-200">
                                                                                {isFirstInGroup && subStepItems.length > 0 && (
                                                                                    <div className="absolute top-6 bottom-0 left-[9px] w-0.5 bg-slate-200 dark:bg-slate-800" />
                                                                                )}
                                                                                <ApprovalCard approval={a} stepNumber={stepNumber} displaySubSteps={false} />
                                                                            </div>
                                                                        );
                                                                    } else {
                                                                        const stepNumber = `${group.sequence}.${a.sub_step}`;
                                                                        const isApproved = a.status === 'approved';
                                                                        const isPending = a.status === 'pending' && a.is_active;

                                                                        return (
                                                                            <div key={a.id} className="animate-in fade-in relative mt-2 pl-12 duration-200">
                                                                                {/* Tree connector branch */}
                                                                                <div className="pointer-events-none absolute top-0 bottom-0 left-[9px]">
                                                                                    {/* Vertical line segment */}
                                                                                    <div
                                                                                        className={cn(
                                                                                            'absolute left-0 w-0.5 transition-colors duration-300',
                                                                                            isApproved
                                                                                                ? 'bg-emerald-500 dark:bg-emerald-600'
                                                                                                : isPending
                                                                                                    ? 'bg-amber-400 dark:bg-amber-500/50'
                                                                                                    : 'bg-slate-200 dark:bg-slate-800',
                                                                                            !hasMainStep && isFirstInGroup ? '-top-6' : 'top-0',
                                                                                            isLastItemInGroup ? 'h-[16px]' : 'bottom-0',
                                                                                        )}
                                                                                    />
                                                                                    {/* Horizontal branch line segment */}
                                                                                    <div
                                                                                        className={cn(
                                                                                            'absolute top-[16px] left-0 h-0.5 w-[39px] transition-colors duration-300',
                                                                                            isApproved
                                                                                                ? 'bg-emerald-500 dark:bg-emerald-600'
                                                                                                : isPending
                                                                                                    ? 'bg-amber-400 dark:bg-amber-500/50'
                                                                                                    : 'bg-slate-200 dark:bg-slate-800',
                                                                                        )}
                                                                                    />
                                                                                </div>
                                                                                <ApprovalCard approval={a} stepNumber={stepNumber} displaySubSteps={false} />
                                                                            </div>
                                                                        );
                                                                    }
                                                                })}
                                                                {group.items.length > 3 && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setExpandedGroups(prev => ({ ...prev, [groupKey]: !prev[groupKey] }))}
                                                                        className="text-primary hover:underline mt-2 flex items-center gap-1.5 px-1 text-[9px] font-extrabold tracking-wider uppercase"
                                                                    >
                                                                        {isExpanded ? 'Sembunyikan' : `+ Tampilkan ${group.items.length - 3} Penerima Persetujuan Lainnya`}
                                                                    </button>
                                                                )}
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                },
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
