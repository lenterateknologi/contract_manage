import { Button } from '@/components/ui/buttons/Button';
import { Badge } from '@/components/ui/feedback/Badge';
import { SearchInput } from '@/components/ui/inputs/SearchInput';
import { useDebounce } from '@/hooks/use-debounce';
import { cn, formatDateTime } from '@/lib/utils';
import { ApprovalCard } from '@/pages/contracts/components/parts/ApprovalCard';
import { Timeline, TimelineContent, TimelineIcon, TimelineItem } from '@/pages/contracts/components/ui/timeline';
import { Contract, ContractApproval } from '@/pages/contracts/types';
import { CheckCircle2, Clock, Download, ListFilter, Workflow } from 'lucide-react';
import React, { useMemo, useState } from 'react';

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

export const RelatedWorkflowsTab: React.FC<RelatedWorkflowsTabProps> = ({ contract }) => {
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
        const registerWorkflow = (id: string, name: string, wfType?: string, isOrigin = false, isCurrent = false, totalSteps = 0) => {
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
                registerWorkflow(wfId, wfName || 'Alur Kerja', (wf as any)?.workflow_type, wfId === originWfId, wfId === currentWfId);
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
        <div className="animate-in fade-in flex h-full min-h-0 flex-1 flex-col gap-3 overflow-hidden p-3 duration-300">
            {/* ═══════════════════════════════════════════════════════════════════
                TOP SECTION: DYNAMIC WORKFLOW LIFECYCLE STEPPER (BY WORKFLOW)
            ═══════════════════════════════════════════════════════════════════ */}
            <div className="border-surface-border/70 flex shrink-0 flex-col gap-2 border-b pb-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <div className="bg-primary/10 text-primary flex h-6 w-6 shrink-0 items-center justify-center rounded-lg font-bold">
                            <Workflow size={13} />
                        </div>
                        <div>
                            <h3 className="text-foreground flex items-center gap-1.5 text-xs leading-tight font-bold">
                                <span>Alur & Sub-Workflow Terkait</span>
                                <span className="py-0.2 bg-surface-muted text-muted-foreground border-surface-border rounded-full border px-2 text-[9.5px] font-semibold">
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
                                'cursor-pointer rounded-full border px-2.5 py-0.5 text-[10px] font-bold transition-all',
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
                <div className="custom-scrollbar w-full overflow-x-auto pt-1 pb-1">
                    <div className="flex min-w-max items-center justify-between gap-0 px-1">
                        {workflowBlocks.map((block, idx) => {
                            const isSelected = selectedWorkflowId === block.id;
                            const isCurrentActive = block.isCurrent;
                            const isCompleted = block.approvals.length > 0 && block.approvals.every((a) => a.status === 'approved');
                            const isLast = idx === workflowBlocks.length - 1;

                            return (
                                <React.Fragment key={block.id || idx}>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedWorkflowId(isSelected ? 'all' : block.id)}
                                        className={cn(
                                            'group relative flex max-w-[140px] cursor-pointer flex-col items-center rounded-xl p-2 text-center transition-all select-none focus:outline-none sm:max-w-[170px]',
                                            isSelected ? 'bg-primary/10 ring-primary shadow-xs ring-2' : 'hover:bg-surface-muted/80',
                                        )}
                                        title={`Klik untuk filter workflow: ${block.name}`}
                                    >
                                        {/* Stepper Node Circle */}
                                        <div
                                            className={cn(
                                                'relative z-10 flex h-7.5 w-7.5 items-center justify-center rounded-full text-xs font-bold transition-all duration-200 group-hover:scale-105',
                                                isCompleted
                                                    ? 'bg-emerald-500 text-white shadow-xs'
                                                    : isCurrentActive
                                                      ? 'bg-primary text-primary-foreground ring-primary/20 animate-pulse shadow-sm ring-4'
                                                      : block.hasRejected
                                                        ? 'bg-rose-500 text-white shadow-xs'
                                                        : 'bg-surface-muted text-muted-foreground border-surface-border border',
                                                isSelected && 'ring-primary dark:ring-offset-surface-base ring-2 ring-offset-2',
                                            )}
                                        >
                                            {isCompleted ? <CheckCircle2 size={15} strokeWidth={2.5} /> : <span>{idx + 1}</span>}
                                        </div>

                                        {/* Workflow Title & Meta Badge */}
                                        <div className="mt-1.5 flex flex-col items-center px-1">
                                            <span
                                                className={cn(
                                                    'line-clamp-2 text-center text-[11px] leading-tight font-bold transition-colors',
                                                    isSelected ? 'text-primary font-extrabold underline underline-offset-2' : '',
                                                    !isSelected && isCurrentActive && 'text-primary font-extrabold',
                                                    !isSelected && isCompleted && 'text-foreground group-hover:text-primary',
                                                    !isSelected && !isCompleted && 'text-muted-foreground/80 group-hover:text-foreground',
                                                )}
                                            >
                                                {block.name}
                                            </span>

                                            <div className="mt-1 flex flex-wrap items-center justify-center gap-1">
                                                {block.isOrigin && (
                                                    <span className="py-0.2 rounded border border-blue-500/20 bg-blue-500/15 px-1.5 text-[8px] font-extrabold text-blue-700 dark:text-blue-300">
                                                        Utama
                                                    </span>
                                                )}
                                                {block.isCurrent && (
                                                    <span className="py-0.2 rounded border border-emerald-500/20 bg-emerald-500/15 px-1.5 text-[8px] font-extrabold text-emerald-700 dark:text-emerald-300">
                                                        Aktif
                                                    </span>
                                                )}
                                                <span className="text-muted-foreground/75 font-mono text-[8.5px]">{block.approvals.length} Step</span>
                                            </div>
                                        </div>
                                    </button>

                                    {/* Connecting Line Between Workflows */}
                                    {!isLast && (
                                        <div className="relative -top-4.5 mx-1.5 h-0.5 min-w-[28px] flex-1 sm:mx-2 sm:min-w-[40px]">
                                            <div
                                                className={cn(
                                                    'h-full w-full rounded-full transition-all duration-300',
                                                    isCompleted
                                                        ? 'bg-emerald-500 dark:bg-emerald-600'
                                                        : isCurrentActive
                                                          ? 'from-primary to-surface-border bg-gradient-to-r'
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
            <div className="bg-surface-muted border-surface-border flex shrink-0 items-center justify-between gap-2 rounded-lg border p-1.5 px-2.5">
                <div className="text-muted-foreground flex flex-wrap items-center gap-1.5 text-xs font-semibold">
                    <ListFilter size={13} />
                    <span>Daftar Tahapan per Workflow</span>
                    {selectedWorkflowId !== 'all' && (
                        <span className="bg-primary/10 text-primary border-primary/20 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold">
                            Workflow: {workflowBlocks.find((b) => b.id === selectedWorkflowId)?.name}
                            <button
                                type="button"
                                onClick={() => setSelectedWorkflowId('all')}
                                className="ml-0.5 cursor-pointer text-xs hover:text-rose-500"
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
                            className="bg-surface-base h-7 text-[10px] uppercase"
                        />
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportPdf}
                        className="border-surface-border bg-surface-base text-text-main hover:bg-surface-muted h-7 gap-1 rounded px-2 text-[10px] font-semibold uppercase shadow-none transition-colors"
                    >
                        <Download size={12} strokeWidth={2.5} />
                        <span className="hidden sm:inline">Export</span>
                    </Button>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════════
                WORKFLOW BLOCKS WITH THEIR STEP CARDS
            ═══════════════════════════════════════════════════════════════════ */}
            <div className="custom-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto pr-1 pb-6">
                {displayedBlocks.map((block, bIdx) => (
                    <div
                        key={block.id || bIdx}
                        className="bg-surface-base border-surface-border flex flex-col gap-3 rounded-xl border p-3 shadow-2xs"
                    >
                        {/* Block Header */}
                        <div className="border-surface-border/60 flex items-center justify-between gap-2 border-b pb-2">
                            <div className="flex items-center gap-2">
                                <div className="bg-primary/10 text-primary flex h-6 w-6 shrink-0 items-center justify-center rounded text-xs font-bold">
                                    {bIdx + 1}
                                </div>
                                <div>
                                    <h4 className="text-foreground flex items-center gap-1.5 text-xs leading-tight font-bold">
                                        <span>{block.name}</span>
                                        {block.isOrigin && (
                                            <Badge
                                                variant="outline"
                                                className="border-blue-500/20 bg-blue-500/10 px-1.5 py-0 text-[9px] text-blue-700"
                                            >
                                                Origin / Alur Awal
                                            </Badge>
                                        )}
                                        {block.isCurrent && (
                                            <Badge
                                                variant="outline"
                                                className="border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0 text-[9px] text-emerald-700"
                                            >
                                                Alur Saat Ini
                                            </Badge>
                                        )}
                                    </h4>
                                    {block.firstTimestamp && (
                                        <span className="text-muted-foreground mt-0.5 flex items-center gap-1 font-mono text-[9px]">
                                            <Clock size={9} />
                                            Masuk: {formatDateTime(block.firstTimestamp)}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                                <span className="text-muted-foreground text-[10px] font-semibold">{block.approvals.length} Tahap</span>
                            </div>
                        </div>

                        {/* Timeline Step Cards inside this Workflow */}
                        <Timeline>
                            {block.approvals.map((approvalItem, aIdx) => {
                                const isDone = approvalItem.status === 'approved';
                                const isRej = approvalItem.status === 'rejected';
                                const isCurr = contract.workflow_step_id && approvalItem.workflow_step_id === contract.workflow_step_id;
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
                                        <TimelineIcon status={itemStatus}>{isDone ? '✓' : isRej ? '✗' : approvalItem.sequence}</TimelineIcon>
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
                                            {aIdx < block.approvals.length - 1 && <div className="border-border/40 mt-2.5 w-full border-b" />}
                                        </TimelineContent>
                                    </TimelineItem>
                                );
                            })}

                            {block.approvals.length === 0 && (
                                <div className="text-muted-foreground py-4 text-center text-xs italic">
                                    Belum ada persetujuan yang dieksekusi pada alur ini.
                                </div>
                            )}
                        </Timeline>
                    </div>
                ))}

                {displayedBlocks.length === 0 && (
                    <div className="text-muted-foreground py-12 text-center text-xs italic">
                        Tidak ada alur kerja atau tahapan yang cocok dengan pencarian.
                    </div>
                )}
            </div>
        </div>
    );
};

export default RelatedWorkflowsTab;
