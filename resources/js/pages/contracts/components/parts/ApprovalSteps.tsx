import { Button } from '@/components/ui/buttons/Button';
import { SearchInput } from '@/components/ui/inputs/SearchInput';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils';
import { Contract, ContractApproval, UserProfile } from '@/pages/contracts/types';
import { Download, GitCommit } from 'lucide-react';
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

        // Tab: Syarat Terpenuhi = approved, rejected, dan step yang sedang aktif (berdasarkan workflow_step_id kontrak)
        if (viewTab === 'eligible') {
            const currentStepId = contract.workflow_step_id;
            result = result.filter(
                (a) =>
                    a.status === 'approved' ||
                    a.status === 'rejected' ||
                    a.workflow_step_id === currentStepId,
            );
        }

        // Tab: Semua Kecuali Tidak Terpenuhi
        // = hide step yang bukan current dan belum ada hasilnya
        if (viewTab === 'active') {
            const currentStepId = contract.workflow_step_id;
            result = result.filter(
                (a) =>
                    a.status === 'approved' ||
                    a.status === 'rejected' ||
                    a.workflow_step_id === currentStepId,
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
                group.stepName = mainStep.step_name || mainStep.workflow_step?.label || mainStep.workflow_step?.name || mainStep.role || `Persetujuan Step ${group.sequence}`;
                group.stepDescription = mainStep.step_description || mainStep.workflow_step?.description;

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
        <div className="animate-in fade-in flex flex-col flex-1 min-h-0 h-full overflow-hidden duration-300 p-3 lg:p-4 gap-3">
            {/* Compact Primary Header */}
            <div className="bg-primary text-primary-foreground shrink-0 flex h-9.5 min-h-[38px] max-h-[38px] items-center justify-between px-4 rounded-xl shadow-xs">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <GitCommit size={15} className="text-primary-foreground/90" />
                        <h4 className="text-xs font-semibold tracking-tight text-primary-foreground uppercase">
                            Alur Persetujuan
                        </h4>
                    </div>
                </div>
            </div>

            {/* Scrollable Timeline Area */}
            <div className="flex-1 min-h-0 overflow-y-auto space-y-3 custom-scrollbar">

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
                                        const currentStepId = contract.workflow_step_id;
                                        const allApprovedItems = group.items.length > 0 && group.items.every((a) => a.status === 'approved');
                                        const isGroupCurrentStep = group.items.some((a) => a.workflow_step_id === currentStepId);
                                        const isCompleted = contract.status === 'approved' || allApprovedItems;
                                        const isActive = contract.status !== 'approved' && !isCompleted && isGroupCurrentStep;
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
                                                    {group.sequence}
                                                </TimelineIcon>

                                                 <TimelineContent>
                                                     <div className="flex flex-wrap items-center justify-between gap-2">
                                                         <div className="flex items-center gap-2">
                                                             <span
                                                                 style={isActive && statusColor ? { color: statusColor } : undefined}
                                                                 className={cn(
                                                                     'text-[11px] font-bold tracking-tight uppercase transition-colors duration-300',
                                                                     isCompleted
                                                                         ? 'text-emerald-700 dark:text-emerald-400'
                                                                         : isActive
                                                                             ? (!statusColor && 'text-amber-600 dark:text-amber-400')
                                                                             : isRejectedState
                                                                                 ? 'text-rose-600 dark:text-rose-400'
                                                                                 : 'text-text-soft',
                                                                 )}
                                                             >
                                                                 {group.stepName || `Tahap ${group.sequence}`}
                                                             </span>
                                                             {isActive && (
                                                                 <span
                                                                     style={statusColor ? {
                                                                         backgroundColor: `${statusColor}18`,
                                                                         color: statusColor,
                                                                     } : undefined}
                                                                     className={cn(
                                                                         'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wide',
                                                                         !statusColor && 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                                                                     )}
                                                                 >
                                                                     <span
                                                                         style={statusColor ? { backgroundColor: statusColor } : undefined}
                                                                         className={cn(
                                                                             'h-1.5 w-1.5 rounded-full animate-pulse shrink-0',
                                                                             !statusColor && 'bg-amber-500'
                                                                         )}
                                                                     />
                                                                     Sekarang
                                                                 </span>
                                                             )}
                                                         </div>

                                                         {/* Required Sub-Documents Badge Pills for Step */}
                                                         {(() => {
                                                             const mainItem = group.items[0];
                                                             let stepMeta = mainItem?.workflow_step?.meta;
                                                             let actions = mainItem?.workflow_step?.action_configs || [];

                                                             if (!stepMeta && contract?.workflow?.steps) {
                                                                 const matchedStep = contract.workflow.steps.find((s: any) => s.step === group.sequence || s.id === mainItem?.workflow_step_id);
                                                                 if (matchedStep) {
                                                                     stepMeta = matchedStep.meta;
                                                                     if (!actions.length) actions = matchedStep.action_configs || [];
                                                                 }
                                                             }
                                                             stepMeta = stepMeta || {};

                                                             const actionReqFields: string[] = actions.flatMap((act: any) => act.required_fields || []);
                                                             const requirePic = !!stepMeta.require_pic || actionReqFields.includes('pic') || actionReqFields.includes('assigned_pic');
                                                             const requireF1 = !!stepMeta.require_f1 || actionReqFields.includes('f1');
                                                             const requireF2 = !!stepMeta.require_f2 || actionReqFields.includes('f2');
                                                             const requireAgreement = !!stepMeta.require_agreement || actionReqFields.includes('agreement');

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
                                                             if (requireF1) {
                                                                 const isFilled = !!(
                                                                     contract.f1_file ||
                                                                     contract.metadata?.f1_file ||
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
                                                     </div>

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
                                                                            <ApprovalCard key={a.id} approval={a} stepNumber={stepNumber} displaySubSteps={false} contract={contract} />
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
        </div>
    );
}
