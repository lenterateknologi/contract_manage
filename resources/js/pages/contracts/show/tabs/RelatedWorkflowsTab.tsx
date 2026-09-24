import React, { useMemo, useState } from 'react';
import { Contract, ContractApproval } from '@/pages/contracts/types';
import { ApprovalCard } from '@/pages/contracts/components/parts/ApprovalCard';
import { InitiatorStepCard } from '@/pages/contracts/components/parts/InitiatorStepCard';
import { Timeline, TimelineItem, TimelineIcon, TimelineContent } from '@/pages/contracts/components/ui/timeline';
import { SearchInput } from '@/components/ui/inputs/SearchInput';
import { useDebounce } from '@/hooks/use-debounce';
import { Badge } from '@/components/ui/feedback/Badge';
import { Button } from '@/components/ui/buttons/Button';
import { cn, formatDateTime } from '@/lib/utils';
import {
    Workflow,
    GitBranch,
    CheckCircle2,
    Clock,
    Layers,
    ListFilter,
    Download,
    ArrowRight,
    Sparkles,
} from 'lucide-react';

interface RelatedWorkflowsTabProps {
    contract: Contract;
    meId?: string;
    showToast: (msg: string, type: any) => void;
}

interface WorkflowBlock {
    id: string;
    name: string;
    workflowType?: string;
    isOrigin: boolean;
    isCurrent: boolean;
    approvals: ContractApproval[];
    totalSteps: number;
    completedCount: number;
    hasRejected: boolean;
    isActive: boolean;
    firstTimestamp?: string | null;
    lastTimestamp?: string | null;
}

export const RelatedWorkflowsTab: React.FC<RelatedWorkflowsTabProps> = ({
    contract,
    meId,
    showToast,
}) => {
    const [search, setSearch] = useState('');
    const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | 'all'>('all');
    const debouncedSearch = useDebounce(search, 400);

    const approvals = contract.approvals || [];
    const originWfId = contract.origin_workflow_id;
    const currentWfId = contract.workflow_id;

    // ── 1. Group Approvals and Metadata per Distinct Workflow ──
    const workflowBlocks: WorkflowBlock[] = useMemo(() => {
        const map = new Map<string, WorkflowBlock>();

        // Helper to register workflow entry
        const registerWorkflow = (
            id: string,
            name: string,
            wfType?: string,
            isOrigin = false,
            isCurrent = false,
            totalSteps = 0,
        ) => {
            if (!map.has(id)) {
                map.set(id, {
                    id,
                    name,
                    workflowType: wfType,
                    isOrigin,
                    isCurrent,
                    approvals: [],
                    totalSteps,
                    completedCount: 0,
                    hasRejected: false,
                    isActive: isCurrent,
                    firstTimestamp: null,
                    lastTimestamp: null,
                });
            }
        };

        // Register Origin Workflow if present
        if (contract.origin_workflow) {
            registerWorkflow(
                contract.origin_workflow.id,
                contract.origin_workflow.name,
                (contract.origin_workflow as any).workflow_type,
                true,
                contract.workflow_id === contract.origin_workflow.id,
                (contract.origin_workflow as any).steps?.length || 0,
            );
        }

        // Register Current Workflow
        if (contract.workflow) {
            registerWorkflow(
                contract.workflow.id,
                contract.workflow.name,
                contract.workflow.meta?.workflow_type || (contract.workflow as any).workflow_type,
                contract.origin_workflow_id === contract.workflow.id,
                true,
                contract.workflow.steps?.length || 0,
            );
        }

        // Associate Approvals with their respective workflows
        approvals.forEach((a) => {
            const wf = a.workflow_step?.workflow;
            const wfId = wf?.id || a.workflow_step?.workflow_id || contract.workflow_id || 'main';
            const wfName = wf?.name || (wfId === contract.workflow_id ? contract.workflow?.name : 'Alur Kerja Terkait');

            if (!map.has(wfId)) {
                registerWorkflow(
                    wfId,
                    wfName || 'Alur Kerja',
                    (wf as any)?.workflow_type,
                    wfId === originWfId,
                    wfId === currentWfId,
                );
            }

            const block = map.get(wfId)!;
            block.approvals.push(a);

            if (a.status === 'approved') {
                block.completedCount++;
            }
            if (a.status === 'rejected') {
                block.hasRejected = true;
            }

            const decidedOrCreated = a.decided_at || a.created_at;
            if (decidedOrCreated) {
                if (!block.firstTimestamp || new Date(decidedOrCreated) < new Date(block.firstTimestamp)) {
                    block.firstTimestamp = decidedOrCreated;
                }
                if (!block.lastTimestamp || new Date(decidedOrCreated) > new Date(block.lastTimestamp)) {
                    block.lastTimestamp = decidedOrCreated;
                }
            }
        });

        // Convert Map to Array sorted: Origin first, then chronological
        return Array.from(map.values()).sort((a, b) => {
            if (a.isOrigin && !b.isOrigin) return -1;
            if (!a.isOrigin && b.isOrigin) return 1;

            const aTime = a.firstTimestamp ? new Date(a.firstTimestamp).getTime() : 0;
            const bTime = b.firstTimestamp ? new Date(b.firstTimestamp).getTime() : 0;
            return aTime - bTime;
        });
    }, [contract, approvals, originWfId, currentWfId]);

    // ── 2. Filtered Workflows & Approvals ──
    const displayedBlocks = useMemo(() => {
        let blocks = workflowBlocks;
        if (selectedWorkflowId !== 'all') {
            blocks = blocks.filter((b) => b.id === selectedWorkflowId);
        }

        if (!debouncedSearch) return blocks;

        const s = debouncedSearch.toLowerCase();
        return blocks
            .map((b) => {
                const matchesWf = b.name.toLowerCase().includes(s);
                const matchingApprovals = b.approvals.filter(
                    (a) =>
                        a.step_name?.toLowerCase().includes(s) ||
                        a.role?.toLowerCase().includes(s) ||
                        a.approver_name?.toLowerCase().includes(s) ||
                        a.approver?.name?.toLowerCase().includes(s) ||
                        a.department_name?.toLowerCase().includes(s),
                );

                if (matchesWf) return b;
                if (matchingApprovals.length > 0) {
                    return { ...b, approvals: matchingApprovals };
                }
                return null;
            })
            .filter(Boolean) as WorkflowBlock[];
    }, [workflowBlocks, selectedWorkflowId, debouncedSearch]);

    const handleExportPdf = () => {
        window.open(`/api/contracts/${contract.id}/approval/pdf`, '_blank');
    };

    return (
        <div className="flex flex-col flex-1 min-h-0 h-full overflow-hidden p-3 gap-3 animate-in fade-in duration-300">
            {/* ═══════════════════════════════════════════════════════════════════
                TOP SECTION: DYNAMIC WORKFLOW LIFECYCLE STEPPER (BY WORKFLOW)
            ═══════════════════════════════════════════════════════════════════ */}
            <div className="shrink-0 flex flex-col gap-2 pb-2.5 border-b border-surface-border/70">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold shrink-0">
                            <Workflow size={13} />
                        </div>
                        <div>
                            <h3 className="text-xs font-bold text-foreground leading-tight flex items-center gap-1.5">
                                <span>Alur & Sub-Workflow Terkait</span>
                                <span className="text-[9.5px] font-semibold px-2 py-0.2 rounded-full bg-surface-muted text-muted-foreground border border-surface-border">
                                    {workflowBlocks.length} Alur Kerja
                                </span>
                            </h3>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => setSelectedWorkflowId('all')}
                            className={cn(
                                'text-[10px] font-bold px-2.5 py-0.5 rounded-full border transition-all cursor-pointer',
                                selectedWorkflowId === 'all'
                                    ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                                    : 'bg-surface-muted text-muted-foreground hover:text-foreground border-surface-border',
                            )}
                        >
                            Semua Alur ({workflowBlocks.length})
                        </button>
                    </div>
                </div>

                {/* Horizontal Stepper: PER WORKFLOW (Pengajuan Kontrak F1 -> Sub-Workflow -> F2 -> Sign) */}
                <div className="w-full overflow-x-auto custom-scrollbar pb-1 pt-1">
                    <div className="flex items-center min-w-max gap-0 justify-between px-1">
                        {workflowBlocks.map((block, idx) => {
                            const isSelected = selectedWorkflowId === block.id;
                            const isCurrentActive = block.isCurrent;
                            const isCompleted =
                                block.approvals.length > 0 &&
                                block.approvals.every((a) => a.status === 'approved');
                            const isLast = idx === workflowBlocks.length - 1;

                            return (
                                <React.Fragment key={block.id || idx}>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setSelectedWorkflowId(isSelected ? 'all' : block.id)
                                        }
                                        className={cn(
                                            'group flex flex-col items-center text-center relative max-w-[140px] sm:max-w-[170px] p-2 rounded-xl transition-all cursor-pointer select-none focus:outline-none',
                                            isSelected
                                                ? 'bg-primary/10 ring-2 ring-primary shadow-xs'
                                                : 'hover:bg-surface-muted/80',
                                        )}
                                        title={`Klik untuk filter workflow: ${block.name}`}
                                    >
                                        {/* Stepper Node Circle */}
                                        <div
                                            className={cn(
                                                'relative flex h-7.5 w-7.5 items-center justify-center rounded-full text-xs font-bold transition-all duration-200 z-10 group-hover:scale-105',
                                                isCompleted
                                                    ? 'bg-emerald-500 text-white shadow-xs'
                                                    : isCurrentActive
                                                    ? 'bg-primary text-primary-foreground ring-4 ring-primary/20 shadow-sm animate-pulse'
                                                    : block.hasRejected
                                                    ? 'bg-rose-500 text-white shadow-xs'
                                                    : 'bg-surface-muted text-muted-foreground border border-surface-border',
                                                isSelected && 'ring-2 ring-primary ring-offset-2 dark:ring-offset-surface-base',
                                            )}
                                        >
                                            {isCompleted ? (
                                                <CheckCircle2 size={15} strokeWidth={2.5} />
                                            ) : (
                                                <span>{idx + 1}</span>
                                            )}
                                        </div>

                                        {/* Workflow Title & Meta Badge */}
                                        <div className="flex flex-col items-center mt-1.5 px-1">
                                            <span
                                                className={cn(
                                                    'text-[11px] font-bold leading-tight line-clamp-2 text-center transition-colors',
                                                    isSelected ? 'text-primary font-extrabold underline underline-offset-2' : '',
                                                    !isSelected && isCurrentActive && 'text-primary font-extrabold',
                                                    !isSelected && isCompleted && 'text-foreground group-hover:text-primary',
                                                    !isSelected && !isCompleted && 'text-muted-foreground/80 group-hover:text-foreground',
                                                )}
                                            >
                                                {block.name}
                                            </span>

                                            <div className="flex items-center gap-1 mt-1 flex-wrap justify-center">
                                                {block.isOrigin && (
                                                    <span className="text-[8px] font-extrabold bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/20 px-1.5 py-0.2 rounded">
                                                        Utama
                                                    </span>
                                                )}
                                                {block.isCurrent && (
                                                    <span className="text-[8px] font-extrabold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 px-1.5 py-0.2 rounded">
                                                        Aktif
                                                    </span>
                                                )}
                                                <span className="text-[8.5px] text-muted-foreground/75 font-mono">
                                                    {block.approvals.length} Step
                                                </span>
                                            </div>
                                        </div>
                                    </button>

                                    {/* Connecting Line Between Workflows */}
                                    {!isLast && (
                                        <div className="flex-1 mx-1.5 sm:mx-2 h-0.5 min-w-[28px] sm:min-w-[40px] relative -top-4.5">
                                            <div
                                                className={cn(
                                                    'h-full w-full rounded-full transition-all duration-300',
                                                    isCompleted
                                                        ? 'bg-emerald-500 dark:bg-emerald-600'
                                                        : isCurrentActive
                                                        ? 'bg-gradient-to-r from-primary to-surface-border'
                                                        : 'bg-surface-border',
                                                )}
                                            />
                                        </div>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════════
                FILTER & SEARCH BAR
            ═══════════════════════════════════════════════════════════════════ */}
            <div className="shrink-0 flex items-center justify-between gap-2 bg-surface-muted border border-surface-border p-1.5 px-2.5 rounded-lg">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold flex-wrap">
                    <ListFilter size={13} />
                    <span>Daftar Tahapan per Workflow</span>
                    {selectedWorkflowId !== 'all' && (
                        <span className="inline-flex items-center gap-1 bg-primary/10 text-primary border border-primary/20 text-[10px] px-2 py-0.5 rounded-full font-bold">
                            Workflow: {workflowBlocks.find((b) => b.id === selectedWorkflowId)?.name}
                            <button
                                type="button"
                                onClick={() => setSelectedWorkflowId('all')}
                                className="hover:text-rose-500 ml-0.5 text-xs cursor-pointer"
                                title="Hapus filter"
                            >
                                ×
                            </button>
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-1.5">
                    <div className="w-32 sm:w-48">
                        <SearchInput
                            placeholder="CARI TAHAP / PIC..."
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
                    >
                        <Download size={12} strokeWidth={2.5} />
                        <span className="hidden sm:inline">Export</span>
                    </Button>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════════
                WORKFLOW BLOCKS WITH THEIR STEP CARDS
            ═══════════════════════════════════════════════════════════════════ */}
            <div className="flex-1 min-h-0 overflow-y-auto space-y-4 custom-scrollbar pr-1 pb-6">
                {displayedBlocks.map((block, bIdx) => (
                    <div
                        key={block.id || bIdx}
                        className="flex flex-col bg-surface-base border border-surface-border rounded-xl p-3 shadow-2xs gap-3"
                    >
                        {/* Block Header */}
                        <div className="flex items-center justify-between gap-2 border-b border-surface-border/60 pb-2">
                            <div className="flex items-center gap-2">
                                <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-primary font-bold text-xs shrink-0">
                                    {bIdx + 1}
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-foreground leading-tight flex items-center gap-1.5">
                                        <span>{block.name}</span>
                                        {block.isOrigin && (
                                            <Badge variant="outline" className="text-[9px] py-0 px-1.5 bg-blue-500/10 text-blue-700 border-blue-500/20">
                                                Origin / Alur Awal
                                            </Badge>
                                        )}
                                        {block.isCurrent && (
                                            <Badge variant="outline" className="text-[9px] py-0 px-1.5 bg-emerald-500/10 text-emerald-700 border-emerald-500/20">
                                                Alur Saat Ini
                                            </Badge>
                                        )}
                                    </h4>
                                    {block.firstTimestamp && (
                                        <span className="text-[9px] text-muted-foreground flex items-center gap-1 mt-0.5 font-mono">
                                            <Clock size={9} />
                                            Masuk: {formatDateTime(block.firstTimestamp)}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-semibold text-muted-foreground">
                                    {block.approvals.length} Tahap
                                </span>
                            </div>
                        </div>

                        {/* Timeline Step Cards inside this Workflow */}
                        <Timeline>
                            {block.approvals.map((approvalItem, aIdx) => {
                                const isDone = approvalItem.status === 'approved';
                                const isRej = approvalItem.status === 'rejected';
                                const isCurr =
                                    contract.workflow_step_id &&
                                    approvalItem.workflow_step_id === contract.workflow_step_id;
                                const itemStatus = isDone
                                    ? 'completed'
                                    : isRej
                                    ? 'rejected'
                                    : isCurr || approvalItem.status === 'pending'
                                    ? 'active'
                                    : 'waiting';

                                const stepNoStr = String(approvalItem.sequence || aIdx + 1);

                                return (
                                    <TimelineItem key={approvalItem.id || aIdx} status={itemStatus}>
                                        <TimelineIcon status={itemStatus}>
                                            {isDone ? '✓' : isRej ? '✗' : approvalItem.sequence}
                                        </TimelineIcon>
                                        <TimelineContent className="w-full min-w-0">
                                            <ApprovalCard
                                                approval={approvalItem}
                                                stepNumber={stepNoStr}
                                                contract={contract}
                                                showDetails={true}
                                                isLite={false}
                                                displaySubSteps={true}
                                                isPending={itemStatus === 'active'}
                                            />
                                            {aIdx < block.approvals.length - 1 && (
                                                <div className="mt-2.5 w-full border-b border-border/40" />
                                            )}
                                        </TimelineContent>
                                    </TimelineItem>
                                );
                            })}

                            {block.approvals.length === 0 && (
                                <div className="text-center py-4 text-xs italic text-muted-foreground">
                                    Belum ada persetujuan yang dieksekusi pada alur ini.
                                </div>
                            )}
                        </Timeline>
                    </div>
                ))}

                {displayedBlocks.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground text-xs italic">
                        Tidak ada alur kerja atau tahapan yang cocok dengan pencarian.
                    </div>
                )}
            </div>
        </div>
    );
};

export default RelatedWorkflowsTab;
