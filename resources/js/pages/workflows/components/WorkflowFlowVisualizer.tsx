import { cn } from '@/lib/utils';
import {
    Background,
    BackgroundVariant,
    BaseEdge,
    Controls,
    Edge,
    EdgeLabelRenderer,
    EdgeProps,
    Handle,
    MarkerType,
    MiniMap,
    Node,
    NodeProps,
    Position,
    ReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
    Activity,
    ArrowRight,
    ArrowRightLeft,
    CheckCircle2,
    CheckSquare,
    ChevronDown,
    ChevronUp,
    CornerDownLeft,
    CornerUpLeft,
    ExternalLink,
    Eye,
    EyeOff,
    GitFork,
    Layers,
    Move,
    Network,
    PenTool,
    RotateCcw,
    Sparkles,
    Square,
    UserCheck,
    Zap,
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

const getActionCode = (act: any): string => {
    if (!act) return '';
    return String(act.action_code || act.code || act.master_action_id || act.master_action?.code || act.alias || act.name || '').trim();
};

const parseTransitionConfig = (act: any) => {
    if (!act) return null;
    let config = act.transition_config;
    if (typeof config === 'string') {
        try {
            config = JSON.parse(config);
        } catch {
            config = null;
        }
    }
    return config;
};

export interface ActionTargetResolution {
    targetStepNum: number | null;
    isCrossWf: boolean;
    isOriginReturn: boolean;
    targetWfId?: string;
    targetStepSeq?: number;
    flowDestinationText: string;
    isRollbackDirection: boolean;
    isForwardDirection: boolean;
    isFinish: boolean;
    isStay: boolean;
}

const resolveActionTarget = (
    act: any,
    currentStepNum: number,
    isLastStep: boolean,
    allSteps: any[] = [],
    allWorkflows: any[] = [],
): ActionTargetResolution => {
    const rawCode = getActionCode(act);
    const codeLower = rawCode.toLowerCase();
    const isApprove =
        codeLower === 'approve' ||
        codeLower.includes('setuju') ||
        codeLower.includes('kirim') ||
        codeLower.includes('ajukan') ||
        codeLower.includes('selesai');
    const isReject = codeLower === 'reject' || codeLower.includes('tolak') || codeLower.includes('revisi') || codeLower.includes('kembali');
    const isAssign = codeLower === 'assign' || codeLower.includes('tugas');
    const isSign = codeLower === 'signature' || codeLower === 'sign' || codeLower.includes('tanda tangan');

    const tConfig = parseTransitionConfig(act);
    const isCrossWf = tConfig?.type === 'cross_workflow' || tConfig?.type === 'origin_return' || Boolean(act?.next_workflow_id);

    if (isCrossWf) {
        const targetWfId = String(tConfig?.workflow_id || act?.next_workflow_id || '');
        const isOriginReturn = targetWfId === 'origin_workflow' || tConfig?.type === 'origin_return';
        let targetSeq = Number(tConfig?.sequence || 0);

        if (!targetSeq && act?.next_workflow_step_id) {
            const targetWf = (allWorkflows || []).find((w: any) => String(w.id) === targetWfId);
            const matchedStep = (targetWf?.steps || []).find((s: any) => String(s.id) === String(act.next_workflow_step_id));
            if (matchedStep) {
                targetSeq = Number(matchedStep.step) || 1;
            }
        }
        if (!targetSeq) targetSeq = 1;

        let flowDestinationText = '';
        if (isOriginReturn) {
            const returnMode = tConfig?.return_mode;
            if (returnMode === 'branch_next') {
                flowDestinationText = 'Kembali ke Workflow Asal (Step Asal + 1)';
            } else if (returnMode === 'branch_origin') {
                flowDestinationText = 'Kembali ke Workflow Asal (Step Asal)';
            } else {
                flowDestinationText = `Kembali ke Workflow Asal (Tahap ${tConfig?.sequence || 1})`;
            }
        } else {
            const targetWf = (allWorkflows || []).find((w: any) => String(w.id) === targetWfId);
            flowDestinationText = `Beralih ke ${targetWf?.name || 'Alur Lain'} (Tahap ${targetSeq})`;
        }

        return {
            targetStepNum: null,
            isCrossWf: true,
            isOriginReturn,
            targetWfId,
            targetStepSeq: targetSeq,
            flowDestinationText,
            isRollbackDirection: false,
            isForwardDirection: false,
            isFinish: false,
            isStay: false,
        };
    }

    let targetStepNum: number | null = null;
    let isFinish = false;
    let isStay = false;

    if (tConfig?.type === 'finish') {
        isFinish = true;
        targetStepNum = null;
    } else if (tConfig?.type === 'initial_step') {
        targetStepNum = 1;
    } else if (tConfig?.type === 'absolute') {
        if (tConfig.step_id || act?.next_step_id) {
            const searchId = String(tConfig.step_id || act.next_step_id);
            const matched = (allSteps || []).find((s: any) => String(s.id) === searchId);
            if (matched) {
                targetStepNum = Number(matched.step) || null;
            }
        }
        if (targetStepNum === null && (tConfig.sequence !== undefined || tConfig.step !== undefined)) {
            const seq = Number(tConfig.sequence ?? tConfig.step);
            const matchedBySeq = (allSteps || []).find((s: any) => Number(s.step) === seq);
            if (matchedBySeq) {
                targetStepNum = Number(matchedBySeq.step) || seq;
            } else if (seq >= 1 && seq <= allSteps.length) {
                targetStepNum = seq;
            }
        }
    } else if (tConfig?.type === 'relative' && tConfig.offset !== undefined) {
        targetStepNum = Math.max(1, currentStepNum + Number(tConfig.offset));
    } else if (tConfig?.type === 'sequential' || tConfig?.type === 'next') {
        targetStepNum = isLastStep ? null : currentStepNum + 1;
    } else if (tConfig?.type === 'back' || tConfig?.type === 'prev' || tConfig?.type === 'previous') {
        targetStepNum = Math.max(1, currentStepNum - 1);
    } else if (tConfig?.type === 'stay') {
        targetStepNum = currentStepNum;
        isStay = true;
    } else if (act?.next_step_id) {
        const matched = (allSteps || []).find((s: any) => String(s.id) === String(act.next_step_id));
        if (matched) {
            targetStepNum = Number(matched.step) || null;
        } else {
            const parsed = Number(act.next_step_id);
            targetStepNum = !isNaN(parsed) ? parsed : null;
        }
    } else {
        // Fallback default ketika tConfig hanya berisi properti non-type seperti {"order": 1}
        if (isReject) {
            targetStepNum = currentStepNum > 1 ? currentStepNum - 1 : 1;
        } else if (isApprove || (!isAssign && !isSign)) {
            targetStepNum = isLastStep ? null : currentStepNum + 1;
        } else if (isAssign || isSign) {
            targetStepNum = currentStepNum;
            isStay = true;
        }
    }

    const isRollbackDirection = targetStepNum !== null && targetStepNum < currentStepNum;
    const isForwardDirection = targetStepNum !== null && targetStepNum > currentStepNum;

    let flowDestinationText = '';
    if (isFinish || (isLastStep && isApprove)) {
        flowDestinationText = 'Selesai / Final';
    } else if (isRollbackDirection) {
        flowDestinationText = `Mundur ke Step ${targetStepNum}`;
    } else if (isForwardDirection) {
        flowDestinationText = `Lanjut ke Step ${targetStepNum}`;
    } else if (targetStepNum === currentStepNum || isStay) {
        if (isAssign) flowDestinationText = 'Tugaskan Personil';
        else if (isSign) flowDestinationText = 'Tanda Tangan Dokumen';
        else flowDestinationText = `Tetap di Step ${currentStepNum}`;
    } else if (isAssign) {
        flowDestinationText = 'Tugaskan Personil';
    } else if (isSign) {
        flowDestinationText = 'Tanda Tangan Dokumen';
    }

    return {
        targetStepNum,
        isCrossWf: false,
        isOriginReturn: false,
        flowDestinationText,
        isRollbackDirection,
        isForwardDirection,
        isFinish,
        isStay,
    };
};

// --- Workflow Color Themes for Multi-Workflow Visual Grouping ---
const WORKFLOW_THEMES = [
    {
        name: 'blue',
        border: 'border-blue-300 dark:border-blue-900/80',
        bg: 'bg-blue-50/30 dark:bg-blue-950/20',
        headerBg: 'border-blue-200/80 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/40',
        badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/70 dark:text-blue-300',
        iconBg: 'bg-blue-600',
        stepBorder: 'border-t-blue-500',
        edgeColor: '#2563eb',
    },
    {
        name: 'emerald',
        border: 'border-emerald-300 dark:border-emerald-900/80',
        bg: 'bg-emerald-50/30 dark:bg-emerald-950/20',
        headerBg: 'border-emerald-200/80 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/40',
        badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/70 dark:text-emerald-300',
        iconBg: 'bg-emerald-600',
        stepBorder: 'border-t-emerald-500',
        edgeColor: '#059669',
    },
    {
        name: 'violet',
        border: 'border-purple-300 dark:border-purple-900/80',
        bg: 'bg-purple-50/30 dark:bg-purple-950/20',
        headerBg: 'border-purple-200/80 dark:border-purple-900/60 bg-purple-50/50 dark:bg-purple-950/40',
        badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/70 dark:text-purple-300',
        iconBg: 'bg-purple-600',
        stepBorder: 'border-t-purple-500',
        edgeColor: '#7c3aed',
    },
    {
        name: 'amber',
        border: 'border-amber-300 dark:border-amber-900/80',
        bg: 'bg-amber-50/30 dark:bg-amber-950/20',
        headerBg: 'border-amber-200/80 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/40',
        badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/70 dark:text-amber-300',
        iconBg: 'bg-amber-600',
        stepBorder: 'border-t-amber-500',
        edgeColor: '#d97706',
    },
    {
        name: 'cyan',
        border: 'border-cyan-300 dark:border-cyan-900/80',
        bg: 'bg-cyan-50/30 dark:bg-cyan-950/20',
        headerBg: 'border-cyan-200/80 dark:border-cyan-900/60 bg-cyan-50/50 dark:bg-cyan-950/40',
        badge: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/70 dark:text-cyan-300',
        iconBg: 'bg-cyan-600',
        stepBorder: 'border-t-cyan-500',
        edgeColor: '#0891b2',
    },
    {
        name: 'rose',
        border: 'border-rose-300 dark:border-rose-900/80',
        bg: 'bg-rose-50/30 dark:bg-rose-950/20',
        headerBg: 'border-rose-200/80 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/40',
        badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/70 dark:text-rose-300',
        iconBg: 'bg-rose-600',
        stepBorder: 'border-t-rose-500',
        edgeColor: '#e11d48',
    },
];

// --- Custom Workflow Group / Container Node Component ---
const WorkflowGroupNode = ({ data }: NodeProps) => {
    const { title, subtitle, badge, isPrimary = false, stepCount = 0, themeIndex = 0 } = data as any;

    const theme = WORKFLOW_THEMES[themeIndex % WORKFLOW_THEMES.length];

    return (
        <div
            className={cn(
                'pointer-events-none flex h-full w-full flex-col justify-between rounded-2xl border-2 p-4 shadow-sm backdrop-blur-xs transition-all select-none',
                theme.border,
                theme.bg,
            )}
        >
            {/* Header Group */}
            <div
                className={cn(
                    'pointer-events-auto -mx-2 -mt-2 flex items-center justify-between rounded-xl border-b px-3 py-2 pb-3 shadow-2xs',
                    theme.headerBg,
                )}
            >
                <div className="flex min-w-0 flex-1 items-center gap-2.5">
                    <div
                        className={cn(
                            'flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white shadow-2xs',
                            theme.iconBg,
                        )}
                    >
                        {isPrimary ? <Layers size={14} /> : <GitFork size={14} />}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <h3 className="truncate text-xs font-bold text-slate-800 dark:text-zinc-100" title={title}>
                                {title}
                            </h3>
                            <span className={cn('shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase', theme.badge)}>
                                {badge}
                            </span>
                        </div>
                        {subtitle && <p className="text-muted-foreground truncate text-[10px]">{subtitle}</p>}
                    </div>
                </div>

                <div className="ml-2 shrink-0 rounded-md border border-slate-200 bg-white/90 px-2.5 py-0.5 text-[10.5px] font-semibold text-slate-600 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900/90 dark:text-zinc-300">
                    {stepCount} Tahapan
                </div>
            </div>

            {/* Footer Group Indicator */}
            <div className="pt-2 text-right">
                <span className="text-[9px] font-medium tracking-wider text-slate-400 uppercase dark:text-zinc-500">
                    {isPrimary ? '• Alur Kerja Utama •' : '• Sub-Alur Terhubung •'}
                </span>
            </div>
        </div>
    );
};

// --- Custom Cross-Workflow Target Node Component (Fallback) ---
const CrossWorkflowTargetNode = ({ data, selected }: NodeProps) => {
    const { targetWorkflow, targetSequence = 1 } = data as any;

    return (
        <div
            className={cn(
                'w-[330px] cursor-grab rounded-xl border border-t-4 border-t-indigo-500 bg-white font-sans shadow-lg transition-all select-none active:cursor-grabbing dark:bg-zinc-900',
                selected
                    ? 'scale-102 border-indigo-500 shadow-xl ring-2 ring-indigo-500/40'
                    : 'border-slate-200/90 hover:border-indigo-400 dark:border-zinc-800 dark:hover:border-indigo-600',
            )}
        >
            <Handle
                type="target"
                position={Position.Top}
                id="top-target"
                className="!h-3.5 !w-3.5 !rounded-full !border-2 !border-white !bg-indigo-600 dark:!border-zinc-900"
            />
            <Handle
                type="target"
                position={Position.Left}
                id="left-target"
                className="!h-3.5 !w-3.5 !rounded-full !border-2 !border-white !bg-indigo-600 dark:!border-zinc-900"
            />

            <div className="flex items-center justify-between rounded-t-lg border-b border-slate-100 bg-indigo-50/70 px-3.5 py-2 dark:border-zinc-800/80 dark:bg-indigo-950/40">
                <div className="flex min-w-0 flex-1 items-center gap-1.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-indigo-600 text-[10px] font-medium text-white shadow-2xs">
                        <ExternalLink size={11} />
                    </span>
                    <span className="truncate text-[10px] font-bold tracking-wider text-indigo-900 uppercase dark:text-indigo-200">
                        Alur Kerja Eksternal
                    </span>
                </div>
                <span className="shrink-0 rounded-md border border-indigo-200/60 bg-indigo-100 px-1.5 py-0.5 text-[9px] font-semibold text-indigo-700 uppercase dark:bg-indigo-900/50 dark:text-indigo-300">
                    Cross-Workflow
                </span>
            </div>

            <div className="space-y-2 p-3">
                <div>
                    <h4 className="truncate text-xs leading-snug font-bold text-slate-900 dark:text-white">
                        {targetWorkflow?.name || 'Alur Kerja Lain'}
                    </h4>
                    {targetWorkflow?.contract_type && (
                        <p className="text-muted-foreground mt-0.5 truncate text-[10px]">Jenis: {targetWorkflow.contract_type.name}</p>
                    )}
                </div>

                <div className="space-y-1 rounded-lg border border-indigo-100 bg-indigo-50/60 p-2 text-[10.5px] text-indigo-900 dark:border-indigo-900/40 dark:bg-indigo-950/30 dark:text-indigo-200">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold tracking-wide uppercase">Mulai Pada Tahap:</span>
                        <span className="py-0.2 rounded bg-indigo-600 px-1.5 text-[10px] font-bold text-white">Tahap {targetSequence}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Custom Siku-Siku (Orthogonal Multi-Lane) Forward Edge ---
const OrthogonalForwardEdge = ({ id, sourceX, sourceY, targetX, targetY, style = {}, markerEnd, label, data }: EdgeProps) => {
    const isSequentialNext = Boolean(data?.isSequentialNext);
    const lane = Number(data?.lane || 0);
    const laneSpacing = Number(data?.laneSpacing || 28);
    const cornerRadius = 10;

    // Untuk langkah sekuensial (langsung 1 tahap di bawahnya): garis vertikal lurus halus dari kanan membelok ke atas
    if (isSequentialNext) {
        const outX = sourceX + 24;
        const edgePath = `M ${sourceX} ${sourceY} L ${outX - cornerRadius} ${sourceY} Q ${outX} ${sourceY} ${outX} ${sourceY + cornerRadius} L ${outX} ${targetY - cornerRadius} Q ${outX} ${targetY} ${outX - cornerRadius} ${targetY} L ${targetX} ${targetY}`;
        const labelX = outX;
        const labelY = (sourceY + targetY) / 2;

        return (
            <>
                <BaseEdge id={id} path={edgePath} style={style} markerEnd={markerEnd} />
                {label && (
                    <EdgeLabelRenderer>
                        <div
                            style={{
                                position: 'absolute',
                                transform: `translate(0%, -50%) translate(${labelX + 8}px, ${labelY}px)`,
                                pointerEvents: 'all',
                            }}
                            className="nodrag nopan select-none"
                        >
                            <div className="flex items-center gap-1 rounded-md border border-emerald-300 bg-white/95 px-2 py-0.5 text-[9px] font-medium whitespace-nowrap text-emerald-700 shadow-2xs backdrop-blur-xs dark:border-emerald-900 dark:bg-zinc-900/95 dark:text-emerald-300">
                                <ArrowRight size={10} className="text-emerald-500" />
                                <span>{label}</span>
                            </div>
                        </div>
                    </EdgeLabelRenderer>
                )}
            </>
        );
    }

    // Untuk loncatan forward multi-step (misal Step 1 -> Step 4): alokasikan jalur orthogonal terpisah di sisi kanan
    const maxX = Math.max(sourceX, targetX);
    const outX = maxX + (32 + lane * laneSpacing);

    const edgePath = `M ${sourceX} ${sourceY} L ${outX - cornerRadius} ${sourceY} Q ${outX} ${sourceY} ${outX} ${sourceY + cornerRadius} L ${outX} ${targetY - cornerRadius} Q ${outX} ${targetY} ${outX - cornerRadius} ${targetY} L ${targetX} ${targetY}`;

    const labelX = outX;
    const labelY = (sourceY + targetY) / 2;

    return (
        <>
            <BaseEdge id={id} path={edgePath} style={style} markerEnd={markerEnd} />
            {label && (
                <EdgeLabelRenderer>
                    <div
                        style={{
                            position: 'absolute',
                            transform: `translate(0%, -50%) translate(${labelX + 8}px, ${labelY}px)`,
                            pointerEvents: 'all',
                        }}
                        className="nodrag nopan select-none"
                    >
                        <div className="flex items-center gap-1 rounded-md border border-emerald-300 bg-white/95 px-2 py-0.5 text-[9px] font-medium whitespace-nowrap text-emerald-700 shadow-2xs backdrop-blur-xs dark:border-emerald-900 dark:bg-zinc-900/95 dark:text-emerald-300">
                            <ArrowRight size={10} className="text-emerald-500" />
                            <span>{label}</span>
                        </div>
                    </div>
                </EdgeLabelRenderer>
            )}
        </>
    );
};

// --- Custom Siku-Siku (Orthogonal Multi-Lane) Rollback Edge ---
const OrthogonalSikuRollbackEdge = ({ id, sourceX, sourceY, targetX, targetY, style = {}, markerEnd, label, data }: EdgeProps) => {
    const lane = Number(data?.lane || 0);
    const laneSpacing = Number(data?.laneSpacing || 32);
    const targetOffset = Number(data?.targetOffset || 0);
    const cornerRadius = 10;

    const baseX = Math.min(sourceX, targetX);
    const outX = baseX - (42 + lane * laneSpacing);
    const adjustedTargetY = targetY + targetOffset;

    const edgePath = `M ${sourceX} ${sourceY} L ${outX + cornerRadius} ${sourceY} Q ${outX} ${sourceY} ${outX} ${sourceY - cornerRadius} L ${outX} ${adjustedTargetY + cornerRadius} Q ${outX} ${adjustedTargetY} ${outX + cornerRadius} ${adjustedTargetY} L ${targetX} ${adjustedTargetY}`;

    const labelX = outX;
    const labelY = (sourceY + adjustedTargetY) / 2;

    return (
        <>
            <BaseEdge id={id} path={edgePath} style={style} markerEnd={markerEnd} />
            {label && (
                <EdgeLabelRenderer>
                    <div
                        style={{
                            position: 'absolute',
                            transform: `translate(-100%, -50%) translate(${labelX - 8}px, ${labelY}px)`,
                            pointerEvents: 'all',
                        }}
                        className="nodrag nopan select-none"
                    >
                        <div className="flex items-center gap-1 rounded-md border border-rose-300 bg-white/95 px-2 py-0.5 text-[9px] font-medium whitespace-nowrap text-rose-700 shadow-2xs backdrop-blur-xs dark:border-rose-900 dark:bg-zinc-900/95 dark:text-rose-300">
                            <CornerUpLeft size={10} className="text-rose-500" />
                            <span>{label}</span>
                        </div>
                    </div>
                </EdgeLabelRenderer>
            )}
        </>
    );
};

// --- Custom Step Node Component (Draggable) ---
const CustomStepNode = ({ data, selected }: NodeProps) => {
    const {
        step,
        allSteps = [],
        allWorkflows = [],
        isFirst,
        isLast,
        showUsers = true,
        eligibleUsers = [],
        dynamicRoles = [],
        themeIndex = 0,
    } = data as any;

    const [isUsersExpanded, setIsUsersExpanded] = useState(false);
    const theme = WORKFLOW_THEMES[themeIndex % WORKFLOW_THEMES.length];

    const targetStatus = step?.meta?.target_status || (isLast ? 'archived' : isFirst ? 'draft' : 'in_review');

    const totalEligibleCount = eligibleUsers.length;
    const displayedUsers = isUsersExpanded ? eligibleUsers : eligibleUsers.slice(0, 3);
    const remainingCount = eligibleUsers.length - displayedUsers.length;

    return (
        <div
            className={cn(
                'w-[330px] cursor-grab rounded-xl border bg-white font-sans shadow-md transition-all select-none active:cursor-grabbing dark:bg-zinc-900',
                selected
                    ? 'border-primary ring-primary/40 scale-102 shadow-xl ring-2'
                    : 'border-slate-200/90 hover:border-slate-400 dark:border-zinc-800 dark:hover:border-zinc-700',
                isFirst && 'border-t-4 border-t-emerald-500',
                isLast && 'border-t-4 border-t-purple-500',
                !isFirst && !isLast && (theme.stepBorder ? `border-t-4 ${theme.stepBorder}` : 'border-t-4 border-t-blue-500'),
            )}
        >
            {/* Top Target Handle (Incoming Forward Flow) */}
            <Handle
                type="target"
                position={Position.Top}
                id="top-target"
                className="!h-3.5 !w-3.5 !rounded-full !border-2 !border-white !bg-slate-600 dark:!border-zinc-900"
            />
            {/* Left Target Handle (Incoming Rollback or Cross-Workflow Target) */}
            <Handle
                type="target"
                position={Position.Left}
                id="left-target"
                className="!h-3.5 !w-3.5 !rounded-full !border-2 !border-white !bg-indigo-600 dark:!border-zinc-900"
            />
            {/* Right Target Handle (Incoming Multi-Step Forward Flow) */}
            <Handle
                type="target"
                position={Position.Right}
                id="right-target"
                className="!h-3.5 !w-3.5 !rounded-full !border-2 !border-white !bg-emerald-600 dark:!border-zinc-900"
            />

            {/* Card Header */}
            <div className="flex items-center justify-between rounded-t-lg border-b border-slate-100 bg-slate-50/70 px-3.5 py-2 dark:border-zinc-800/80 dark:bg-zinc-900/70">
                <div className="flex min-w-0 flex-1 items-center gap-1.5">
                    <span
                        className={cn(
                            'flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-medium text-white shadow-2xs',
                            theme.iconBg,
                        )}
                    >
                        {step?.step || 1}
                    </span>
                    <div className="min-w-0 flex-1 truncate">
                        <span className="block truncate text-[10px] font-medium tracking-wider text-slate-700 uppercase dark:text-zinc-200">
                            {isFirst ? 'Start / Inisiasi' : isLast ? 'Final / Selesai' : `Tahapan ${step?.step || 1}`}
                        </span>
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                    <span
                        className={cn(
                            'rounded-md px-2 py-0.5 text-[9px] font-medium tracking-wider uppercase',
                            targetStatus === 'draft' &&
                                'border border-emerald-200/60 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
                            targetStatus === 'in_review' &&
                                'border border-blue-200/60 bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300',
                            targetStatus === 'pending' &&
                                'border border-amber-200/60 bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
                            targetStatus === 'archived' &&
                                'border border-purple-200/60 bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300',
                        )}
                    >
                        {targetStatus}
                    </span>
                    <span title="Bisa Digeser (Drag & Drop)" className="inline-flex items-center">
                        <Move size={11} className="text-slate-400 opacity-60" />
                    </span>
                </div>
            </div>

            {/* Card Body */}
            <div className="space-y-2.5 p-3">
                <div>
                    <h4 className="line-clamp-2 text-xs leading-snug font-medium text-slate-900 dark:text-white">
                        {step?.description || step?.label || `Tahap ${step?.step || 1}`}
                    </h4>
                    {step?.label && step?.description && step.label !== step.description && (
                        <p className="text-muted-foreground mt-0.5 truncate text-[10px]">{step.label}</p>
                    )}
                </div>

                {/* Section Daftar Orang / Personil Berhak Akses */}
                {showUsers && (
                    <div className="nodrag space-y-1.5 rounded-lg border border-slate-200/70 bg-slate-50/80 p-2 dark:border-zinc-800 dark:bg-zinc-950/60">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 text-[10px] font-medium text-slate-700 dark:text-zinc-300">
                                <UserCheck size={11} className="text-indigo-600 dark:text-indigo-400" />
                                <span>Personil Berhak Akses</span>
                            </div>
                            <span className="py-0.2 rounded-md bg-indigo-500/10 px-1.5 text-[9.5px] font-medium text-indigo-700 dark:text-indigo-300">
                                {totalEligibleCount} Orang
                            </span>
                        </div>

                        {/* Dynamic Roles Info */}
                        {dynamicRoles.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-0.5">
                                {dynamicRoles.map((dr: any, dIdx: number) => (
                                    <span
                                        key={dIdx}
                                        className="inline-flex items-center gap-1 rounded-md border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-medium text-amber-800 dark:text-amber-300"
                                    >
                                        <Sparkles size={9} className="text-amber-600" />
                                        <span>{dr.label}</span>
                                        {dr.activeUser && <span className="text-emerald-700 dark:text-emerald-400">({dr.activeUser.name})</span>}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* User List */}
                        {eligibleUsers.length > 0 ? (
                            <div className="space-y-1 pt-0.5">
                                {displayedUsers.map(({ user }: any, uIdx: number) => (
                                    <div
                                        key={user.id || uIdx}
                                        className="flex items-center justify-between gap-1.5 rounded-md border border-slate-200/50 bg-white px-2 py-1 text-[10.5px] shadow-2xs dark:border-zinc-800 dark:bg-zinc-900"
                                    >
                                        <div className="flex min-w-0 flex-1 items-center gap-1.5">
                                            <div className="bg-secondary text-secondary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[9px] font-medium uppercase">
                                                {(user.name || 'U').substring(0, 2)}
                                            </div>
                                            <div className="min-w-0 flex-1 truncate">
                                                <span className="block truncate leading-tight font-medium text-slate-800 dark:text-zinc-200">
                                                    {user.name}
                                                </span>
                                                <span className="text-muted-foreground block truncate text-[9px] leading-tight">
                                                    {user.role || 'User'}
                                                    {user.department_name ? ` • ${user.department_name}` : ''}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {eligibleUsers.length > 3 && (
                                    <button
                                        type="button"
                                        onClick={() => setIsUsersExpanded(!isUsersExpanded)}
                                        className="flex w-full cursor-pointer items-center justify-center gap-0.5 py-0.5 text-center text-[9.5px] font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                                    >
                                        {isUsersExpanded ? (
                                            <>
                                                <span>Ciutkan</span>
                                                <ChevronUp size={10} />
                                            </>
                                        ) : (
                                            <>
                                                <span>+{remainingCount} orang lainnya</span>
                                                <ChevronDown size={10} />
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        ) : (
                            dynamicRoles.length === 0 && (
                                <p className="text-muted-foreground text-[9.5px] italic">Belum ada aktor/otoritas yang dikonfigurasi</p>
                            )
                        )}
                    </div>
                )}

                {/* Available Actions in this Step */}
                <div className="nodrag space-y-1.5 border-t border-slate-100 pt-2.5 dark:border-zinc-800/80">
                    <div className="flex items-center justify-between px-0.5 text-[9.5px] font-semibold tracking-wider text-slate-500 uppercase dark:text-zinc-400">
                        <span>Aksi & Alur Tahap</span>
                        <span className="text-[9px] font-normal text-slate-400">({(step?.actions || []).length} Aksi)</span>
                    </div>

                    <div className="space-y-1.5">
                        {(step?.actions || []).map((act: any, aIdx: number) => {
                            const rawCode = getActionCode(act);
                            const codeLower = rawCode.toLowerCase();
                            const isApprove =
                                codeLower === 'approve' ||
                                codeLower.includes('setuju') ||
                                codeLower.includes('kirim') ||
                                codeLower.includes('ajukan') ||
                                codeLower.includes('selesai');
                            const isReject =
                                codeLower === 'reject' ||
                                codeLower.includes('tolak') ||
                                codeLower.includes('revisi') ||
                                codeLower.includes('kembali');
                            const isAssign = codeLower === 'assign' || codeLower.includes('tugas');
                            const isSign = codeLower === 'signature' || codeLower === 'sign' || codeLower.includes('tanda tangan');
                            const isCustomAct = Boolean(act?.is_custom_action || act?.isCustomAction);

                            const displayLabel = act?.alias || act?.label || act?.name || (rawCode ? rawCode.toUpperCase() : `Aksi ${aIdx + 1}`);
                            const currentStepNum = Number(step?.step) || 1;

                            const { isCrossWf, isRollbackDirection, isForwardDirection, flowDestinationText } = resolveActionTarget(
                                act,
                                currentStepNum,
                                Boolean(isLast),
                                allSteps,
                                allWorkflows,
                            );

                            return (
                                <div
                                    key={aIdx}
                                    className={cn(
                                        'relative flex items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-medium shadow-2xs transition-all',
                                        isCrossWf &&
                                            'border-indigo-300 bg-indigo-50/90 text-indigo-950 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-200',
                                        !isCrossWf &&
                                            isApprove &&
                                            'border-emerald-200/90 bg-emerald-50/80 text-emerald-900 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-200',
                                        !isCrossWf &&
                                            isReject &&
                                            'border-rose-200/90 bg-rose-50/80 text-rose-900 dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-200',
                                        !isCrossWf &&
                                            isAssign &&
                                            'border-blue-200/90 bg-blue-50/80 text-blue-900 dark:border-blue-800/60 dark:bg-blue-950/40 dark:text-blue-200',
                                        !isCrossWf &&
                                            isSign &&
                                            'border-purple-200/90 bg-purple-50/80 text-purple-900 dark:border-purple-800/60 dark:bg-purple-950/40 dark:text-purple-200',
                                        !isCrossWf &&
                                            !isApprove &&
                                            !isReject &&
                                            !isAssign &&
                                            !isSign &&
                                            'border-slate-200 bg-slate-50 text-slate-800 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-200',
                                    )}
                                >
                                    {/* Left Handle: untuk aksi Rollback */}
                                    {isRollbackDirection && (
                                        <Handle
                                            type="source"
                                            position={Position.Left}
                                            id={`action-handle-left-${aIdx}`}
                                            className="!-left-2 !h-3 !w-3 !rounded-full !border-2 !border-white !bg-rose-500 shadow-xs dark:!border-zinc-900"
                                        />
                                    )}

                                    {/* Action Info */}
                                    <div className="flex min-w-0 flex-1 items-center gap-2">
                                        <div
                                            className={cn(
                                                'flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] text-white shadow-2xs',
                                                isCrossWf && 'bg-indigo-600',
                                                !isCrossWf && isApprove && 'bg-emerald-600',
                                                !isCrossWf && isReject && 'bg-rose-600',
                                                !isCrossWf && isAssign && 'bg-blue-600',
                                                !isCrossWf && isSign && 'bg-purple-600',
                                                !isCrossWf && !isApprove && !isReject && !isAssign && !isSign && 'bg-slate-600',
                                            )}
                                        >
                                            {isCrossWf && <GitFork size={11} />}
                                            {!isCrossWf && isApprove && <CheckCircle2 size={11} />}
                                            {!isCrossWf && isReject && <CornerUpLeft size={11} />}
                                            {!isCrossWf && isAssign && <UserCheck size={11} />}
                                            {!isCrossWf && isSign && <PenTool size={11} />}
                                            {!isCrossWf && !isApprove && !isReject && !isAssign && !isSign && <Activity size={11} />}
                                        </div>
                                        <div className="min-w-0 flex-1 truncate">
                                            <div className="flex items-center gap-1 truncate leading-tight">
                                                <span className="truncate text-[11px] font-semibold">{displayLabel}</span>
                                                {isCustomAct && (
                                                    <span className="py-0.2 inline-flex shrink-0 items-center gap-0.5 rounded border border-amber-300/40 bg-amber-500/20 px-1 text-[8.5px] font-bold text-amber-700 dark:text-amber-300">
                                                        <Zap size={9} />
                                                        <span>Khusus</span>
                                                    </span>
                                                )}
                                            </div>
                                            {flowDestinationText && (
                                                <span className="mt-0.5 block truncate text-[9.5px] leading-tight font-normal opacity-80">
                                                    {flowDestinationText}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right / Forward Handle: untuk Maju atau Cross-Workflow */}
                                    {(isForwardDirection || isCrossWf || (!isRollbackDirection && !isReject)) && (
                                        <Handle
                                            type="source"
                                            position={Position.Right}
                                            id={`action-handle-right-${aIdx}`}
                                            className={cn(
                                                '!-right-2 !h-3 !w-3 !rounded-full !border-2 !border-white shadow-xs dark:!border-zinc-900',
                                                isCrossWf ? '!bg-indigo-600' : '!bg-emerald-500',
                                            )}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <Handle
                type="source"
                position={Position.Bottom}
                id="bottom-source"
                className="!h-3.5 !w-3.5 !rounded-full !border-2 !border-white !bg-emerald-500 dark:!border-zinc-900"
            />
            <Handle
                type="source"
                position={Position.Left}
                id="left-source"
                className="!h-3.5 !w-3.5 !rounded-full !border-2 !border-white !bg-rose-500 dark:!border-zinc-900"
            />
        </div>
    );
};

const nodeTypes = {
    workflowGroupNode: WorkflowGroupNode,
    workflowStepNode: CustomStepNode,
    crossWorkflowTargetNode: CrossWorkflowTargetNode,
};

const edgeTypes = {
    orthogonalSikuRollbackEdge: OrthogonalSikuRollbackEdge,
    orthogonalForwardEdge: OrthogonalForwardEdge,
};

interface WorkflowFlowVisualizerProps {
    steps: any[];
    workflow?: any;
    allWorkflows?: any[];
    customActions?: any[];
    users?: any[];
    roles?: any[];
    departments?: any[];
    divisions?: any[];
    locations?: any[];
    companyGroups?: any[];
    organizationGroups?: any[];
    companies?: any[];
    regions?: any[];
    simulationContext?: {
        initiatorId?: string;
        picId?: string;
        creatorId?: string;
        adhocId?: string;
        adhocIds?: string[];
    };
    onOpenSimulationModal?: () => void;
}

// Helper to merge standard step actions with workflow custom actions
export const getEffectiveStepActions = (step: any, customActions: any[] = []): any[] => {
    const rawActions = Array.isArray(step?.actions) ? [...step.actions] : [];
    const stepId = String(step?.id || '');
    const currentStepNum = Number(step?.step) || 1;

    const matchedCustomActions: any[] = [];

    (customActions || []).forEach((ca: any) => {
        if (!ca || ca.is_active === false) return;

        const isMatchScope =
            ca.scope === 'all_steps' ||
            (ca.scope === 'specific_steps' &&
                Array.isArray(ca.step_ids) &&
                (ca.step_ids.includes(stepId) || ca.step_ids.includes(String(currentStepNum))));

        if (isMatchScope) {
            matchedCustomActions.push({
                ...ca,
                is_custom_action: true,
                isCustomAction: true,
                name: ca.name || ca.alias || 'Aksi Khusus',
                alias: ca.alias || ca.name || 'Aksi Khusus',
                action_code: ca.action_code || 'custom',
                transition_config: ca.transition_config,
                next_workflow_id: ca.transition_config?.workflow_id || ca.next_workflow_id,
            });
        }
    });

    return [...rawActions, ...matchedCustomActions];
};

export function WorkflowFlowVisualizer({
    steps = [],
    workflow,
    allWorkflows = [],
    customActions: customActionsProp,
    users = [],
    roles = [],
    departments = [],
    divisions = [],
    locations = [],
    companyGroups = [],
    organizationGroups = [],
    companies = [],
    regions = [],
    simulationContext,
}: WorkflowFlowVisualizerProps) {
    const effectiveCustomActions = useMemo(() => {
        if (customActionsProp && Array.isArray(customActionsProp)) {
            return customActionsProp;
        }
        if (workflow?.meta?.custom_actions && Array.isArray(workflow.meta.custom_actions)) {
            return workflow.meta.custom_actions;
        }
        return [];
    }, [customActionsProp, workflow?.meta?.custom_actions]);
    // --- Layout & Mode Settings with LocalStorage Persistence ---
    const [viewMode, _setViewMode] = useState<'connected' | 'all' | 'single'>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('wf_vis_view_mode');
            if (saved === 'connected' || saved === 'all' || saved === 'single') return saved;
        }
        return 'connected';
    });

    const setViewMode = (val: 'connected' | 'all' | 'single') => {
        _setViewMode(val);
        if (typeof window !== 'undefined') {
            localStorage.setItem('wf_vis_view_mode', val);
        }
    };

    // Independent route visibility toggles (checkboxes) with localStorage persistence
    const [showForwardRoutes, _setShowForwardRoutes] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('wf_vis_show_forward');
            if (saved !== null) return saved === 'true';
        }
        return true;
    });

    const setShowForwardRoutes = (updater: boolean | ((prev: boolean) => boolean)) => {
        _setShowForwardRoutes((prev) => {
            const next = typeof updater === 'function' ? updater(prev) : updater;
            if (typeof window !== 'undefined') {
                localStorage.setItem('wf_vis_show_forward', String(next));
            }
            return next;
        });
    };

    const [showRollbackRoutes, _setShowRollbackRoutes] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('wf_vis_show_rollback');
            if (saved !== null) return saved === 'true';
        }
        return true;
    });

    const setShowRollbackRoutes = (updater: boolean | ((prev: boolean) => boolean)) => {
        _setShowRollbackRoutes((prev) => {
            const next = typeof updater === 'function' ? updater(prev) : updater;
            if (typeof window !== 'undefined') {
                localStorage.setItem('wf_vis_show_rollback', String(next));
            }
            return next;
        });
    };

    const [showCrossRoutes, _setShowCrossRoutes] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('wf_vis_show_cross');
            if (saved !== null) return saved === 'true';
        }
        return true;
    });

    const setShowCrossRoutes = (updater: boolean | ((prev: boolean) => boolean)) => {
        _setShowCrossRoutes((prev) => {
            const next = typeof updater === 'function' ? updater(prev) : updater;
            if (typeof window !== 'undefined') {
                localStorage.setItem('wf_vis_show_cross', String(next));
            }
            return next;
        });
    };

    const [laneSpacing, _setLaneSpacing] = useState<number>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('wf_vis_lane_spacing');
            if (saved && !isNaN(Number(saved))) return Number(saved);
        }
        return 30;
    });

    const [animatedLines, _setAnimatedLines] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('wf_vis_animated');
            if (saved !== null) return saved === 'true';
        }
        return true;
    });

    const setAnimatedLines = (updater: boolean | ((prev: boolean) => boolean)) => {
        _setAnimatedLines((prev) => {
            const next = typeof updater === 'function' ? updater(prev) : updater;
            if (typeof window !== 'undefined') {
                localStorage.setItem('wf_vis_animated', String(next));
            }
            return next;
        });
    };

    const [showLabels, _setShowLabels] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('wf_vis_show_labels');
            if (saved !== null) return saved === 'true';
        }
        return true;
    });

    const setShowLabels = (updater: boolean | ((prev: boolean) => boolean)) => {
        _setShowLabels((prev) => {
            const next = typeof updater === 'function' ? updater(prev) : updater;
            if (typeof window !== 'undefined') {
                localStorage.setItem('wf_vis_show_labels', String(next));
            }
            return next;
        });
    };

    const [showUsers, _setShowUsers] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('wf_vis_show_users');
            if (saved !== null) return saved === 'true';
        }
        return true;
    });

    const setShowUsers = (updater: boolean | ((prev: boolean) => boolean)) => {
        _setShowUsers((prev) => {
            const next = typeof updater === 'function' ? updater(prev) : updater;
            if (typeof window !== 'undefined') {
                localStorage.setItem('wf_vis_show_users', String(next));
            }
            return next;
        });
    };

    const [showGroups, _setShowGroups] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('wf_vis_show_groups');
            if (saved !== null) return saved === 'true';
        }
        return true;
    });

    const setShowGroups = (updater: boolean | ((prev: boolean) => boolean)) => {
        _setShowGroups((prev) => {
            const next = typeof updater === 'function' ? updater(prev) : updater;
            if (typeof window !== 'undefined') {
                localStorage.setItem('wf_vis_show_groups', String(next));
            }
            return next;
        });
    };

    // Simulated users
    const simInitiatorUser = useMemo(() => {
        if (!simulationContext?.initiatorId) return null;
        return users.find((u: any) => String(u.id) === String(simulationContext.initiatorId)) || null;
    }, [simulationContext?.initiatorId, users]);

    const simPicUser = useMemo(() => {
        if (!simulationContext?.picId) return null;
        return users.find((u: any) => String(u.id) === String(simulationContext.picId)) || null;
    }, [simulationContext?.picId, users]);

    const simCreatorUser = useMemo(() => {
        if (!simulationContext?.creatorId) return null;
        return users.find((u: any) => String(u.id) === String(simulationContext.creatorId)) || null;
    }, [simulationContext?.creatorId, users]);

    const simAdhocUsers = useMemo(() => {
        const ids = simulationContext?.adhocIds || (simulationContext?.adhocId ? [simulationContext.adhocId] : []);
        if (ids.length === 0) return [];
        return users.filter((u: any) => ids.includes(String(u.id)));
    }, [simulationContext?.adhocIds, simulationContext?.adhocId, users]);

    const sortedPrimarySteps = useMemo(() => {
        return [...steps].sort((a, b) => (Number(a.step) || 0) - (Number(b.step) || 0));
    }, [steps]);

    // Helper calculateStepUsers
    const calculateStepUsers = useCallback(
        (step: any) => {
            const matchedUsersMap = new Map<string, { user: any; reasons: string[] }>();
            const dynamicList: { type: string; label: string; description: string; activeUser?: any }[] = [];
            const criteriaParts: string[] = [];

            const authorities: any[] = step.approver_authorities || [];

            if (authorities && authorities.length > 0) {
                authorities.forEach((auth: any) => {
                    if (
                        auth.authority_type === 'custom' ||
                        ['initiator', 'assigned_pic', 'creator', 'atasan', 'adhoc_approvers', 'adhoc'].includes(auth.authority_type)
                    ) {
                        const customType = auth.authority_type === 'custom' ? auth.role_id || auth.user_id : auth.authority_type;
                        if (customType === 'initiator') {
                            criteriaParts.push('Inisiator');
                            dynamicList.push({
                                type: 'initiator',
                                label: 'Inisiator Kontrak',
                                description: 'Pengguna yang menginisiasi pengajuan kontrak.',
                                activeUser: simInitiatorUser,
                            });
                            if (simInitiatorUser) {
                                const deptName = departments.find((d: any) => String(d.id) === String(simInitiatorUser.department_id))?.name;
                                matchedUsersMap.set(String(simInitiatorUser.id), {
                                    user: { ...simInitiatorUser, department_name: deptName },
                                    reasons: ['Inisiator (Simulasi)'],
                                });
                            }
                        } else if (customType === 'assigned_pic') {
                            criteriaParts.push('PIC Ditugaskan');
                            dynamicList.push({
                                type: 'assigned_pic',
                                label: 'PIC Ditugaskan',
                                description: 'Pengguna yang ditugaskan sebagai PIC kontrak.',
                                activeUser: simPicUser,
                            });
                            if (simPicUser) {
                                const deptName = departments.find((d: any) => String(d.id) === String(simPicUser.department_id))?.name;
                                matchedUsersMap.set(String(simPicUser.id), {
                                    user: { ...simPicUser, department_name: deptName },
                                    reasons: ['PIC Ditugaskan (Simulasi)'],
                                });
                            }
                        } else if (customType === 'creator') {
                            criteriaParts.push('Pembuat Kontrak');
                            dynamicList.push({
                                type: 'creator',
                                label: 'Pembuat Kontrak',
                                description: 'Pengguna yang membuat draf kontrak.',
                                activeUser: simCreatorUser,
                            });
                            if (simCreatorUser) {
                                const deptName = departments.find((d: any) => String(d.id) === String(simCreatorUser.department_id))?.name;
                                matchedUsersMap.set(String(simCreatorUser.id), {
                                    user: { ...simCreatorUser, department_name: deptName },
                                    reasons: ['Pembuat Kontrak (Simulasi)'],
                                });
                            }
                        } else if (customType === 'adhoc_approvers' || customType === 'adhoc') {
                            criteriaParts.push('Approver Tambahan');
                            if (simAdhocUsers.length > 0) {
                                simAdhocUsers.forEach((u: any) => {
                                    const deptName = departments.find((d: any) => String(d.id) === String(u.department_id))?.name;
                                    dynamicList.push({
                                        type: 'adhoc_approvers',
                                        label: 'Approver Tambahan (Ad-Hoc)',
                                        description: 'Pengguna yang ditunjuk sebagai approver tambahan saat pengajuan.',
                                        activeUser: u,
                                    });
                                    matchedUsersMap.set(String(u.id), {
                                        user: { ...u, department_name: deptName },
                                        reasons: ['Approver Tambahan (Simulasi)'],
                                    });
                                });
                            } else {
                                dynamicList.push({
                                    type: 'adhoc_approvers',
                                    label: 'Approver Tambahan (Ad-Hoc)',
                                    description: 'Pengguna yang ditunjuk sebagai approver tambahan saat pengajuan.',
                                });
                            }
                        } else if (customType === 'atasan') {
                            criteriaParts.push('Atasan Langsung');
                            dynamicList.push({
                                type: 'atasan',
                                label: 'Atasan Langsung',
                                description: 'Atasan langsung inisiator.',
                            });
                        }
                    } else if (auth.authority_type === 'user' && auth.user_id) {
                        const u = users.find((user: any) => String(user.id) === String(auth.user_id));
                        if (u) {
                            const deptName = departments.find((d: any) => String(d.id) === String(u.department_id))?.name;
                            matchedUsersMap.set(String(u.id), {
                                user: { ...u, department_name: deptName },
                                reasons: ['User Spesifik'],
                            });
                        }
                    } else {
                        const hasFilters = Boolean(
                            auth.role_id ||
                            auth.role_use_initiator ||
                            auth.department_id ||
                            auth.department_use_initiator ||
                            auth.division_id ||
                            auth.division_use_initiator ||
                            auth.location_id ||
                            auth.location_use_initiator ||
                            auth.company_group_id ||
                            auth.company_group_use_initiator ||
                            auth.company_id ||
                            auth.company_use_initiator ||
                            auth.region_id ||
                            auth.region_use_initiator ||
                            auth.organization_group_id ||
                            auth.organization_group_use_initiator,
                        );

                        if (hasFilters) {
                            users.forEach((user: any) => {
                                const userRoleId = String(user.role_id || user.role || '');
                                const userDeptId = String(user.department_id || user.department?.id || '');
                                const userDivId = String(user.division_id || user.division?.id || user.department?.division_id || '');
                                const userLocId = String(user.location_id || user.idlocation || user.location?.id || '');
                                const userCompId = String(user.company_id || user.company?.id || '');
                                const userCgId = String(user.company_group_id || user.company?.company_group_id || '');
                                const userRegionId = String(user.region_id || user.company?.region_id || '');

                                let match = true;

                                if (auth.role_use_initiator) {
                                    if (!simInitiatorUser) match = false;
                                    else {
                                        const initRoleId = String(simInitiatorUser.role_id || simInitiatorUser.role || '');
                                        if (userRoleId !== initRoleId) match = false;
                                    }
                                } else if (auth.role_id) {
                                    const targetRole = roles.find((r: any) => String(r.id) === String(auth.role_id) || r.name === auth.role_id);
                                    const matchRoleId = targetRole ? String(targetRole.id) : String(auth.role_id);
                                    const matchRoleName = targetRole ? targetRole.name.toLowerCase() : String(auth.role_id).toLowerCase();
                                    const isRoleMatch = userRoleId === matchRoleId || userRoleId.toLowerCase() === matchRoleName;
                                    if (!isRoleMatch) match = false;
                                }

                                if (match && auth.department_use_initiator) {
                                    if (!simInitiatorUser) match = false;
                                    else {
                                        const initDeptId = String(simInitiatorUser.department_id || simInitiatorUser.department?.id || '');
                                        if (userDeptId !== initDeptId) match = false;
                                    }
                                } else if (match && auth.department_id) {
                                    if (userDeptId !== String(auth.department_id)) match = false;
                                }

                                if (match && auth.division_use_initiator) {
                                    if (!simInitiatorUser) match = false;
                                    else {
                                        const initDivId = String(simInitiatorUser.division_id || simInitiatorUser.division?.id || '');
                                        if (userDivId !== initDivId) match = false;
                                    }
                                } else if (match && auth.division_id) {
                                    if (userDivId !== String(auth.division_id)) match = false;
                                }

                                if (match && auth.location_use_initiator) {
                                    if (!simInitiatorUser) match = false;
                                    else {
                                        const initLocId = String(
                                            simInitiatorUser.location_id || simInitiatorUser.idlocation || simInitiatorUser.location?.id || '',
                                        );
                                        const initLocName = (simInitiatorUser.location_name || simInitiatorUser.location?.name || '')
                                            .toLowerCase()
                                            .trim();
                                        const userLocName = (user.location_name || user.location?.name || '').toLowerCase().trim();
                                        const isLocMatch =
                                            (initLocId && userLocId && initLocId === userLocId) ||
                                            (initLocName && userLocName && initLocName === userLocName);
                                        if (!isLocMatch) match = false;
                                    }
                                } else if (match && auth.location_id) {
                                    const targetLocId = String(auth.location_id);
                                    const targetLoc = locations.find(
                                        (l: any) => String(l.id) === targetLocId || l.code === targetLocId || l.name === targetLocId,
                                    );
                                    const matchLocId = targetLoc ? String(targetLoc.id) : targetLocId;
                                    const matchLocName = targetLoc ? targetLoc.name.toLowerCase() : targetLocId.toLowerCase();
                                    const userLocName = (user.location_name || user.location?.name || '').toLowerCase().trim();
                                    const isLocMatch = userLocId === matchLocId || (userLocName && userLocName === matchLocName);
                                    if (!isLocMatch) match = false;
                                }

                                if (match && auth.company_group_use_initiator) {
                                    if (!simInitiatorUser) match = false;
                                    else {
                                        const initCg = String(simInitiatorUser.company_group_id || '');
                                        if (userCgId !== initCg) match = false;
                                    }
                                } else if (match && auth.company_group_id) {
                                    if (userCgId !== String(auth.company_group_id)) match = false;
                                }

                                if (match && auth.company_use_initiator) {
                                    if (!simInitiatorUser) match = false;
                                    else {
                                        const initC = String(simInitiatorUser.company_id || '');
                                        if (userCompId !== initC) match = false;
                                    }
                                } else if (match && auth.company_id) {
                                    if (userCompId !== String(auth.company_id)) match = false;
                                }

                                if (match && auth.region_use_initiator) {
                                    if (!simInitiatorUser) match = false;
                                    else {
                                        const initR = String(simInitiatorUser.region_id || '');
                                        if (userRegionId !== initR) match = false;
                                    }
                                } else if (match && auth.region_id) {
                                    if (userRegionId !== String(auth.region_id)) match = false;
                                }

                                if (match && (auth.organization_group_use_initiator || auth.organization_group_id)) {
                                    const userOrgId = String(user.department?.organization_group_id || user.organization_group_id || '');
                                    const userIdOrgGroup =
                                        user.department?.idorg_group !== undefined && user.department?.idorg_group !== null
                                            ? String(user.department.idorg_group)
                                            : user.idorg_group !== undefined && user.idorg_group !== null
                                              ? String(user.idorg_group)
                                              : '';
                                    const userOrgGroupName = (user.org_group_name || user.department?.org_group_name || '').toLowerCase().trim();

                                    const userOgObj = organizationGroups.find(
                                        (og: any) =>
                                            (userOrgId && String(og.id) === userOrgId) ||
                                            (userIdOrgGroup && String(og.idorg_group) === userIdOrgGroup) ||
                                            (userOrgGroupName && og.name?.toLowerCase().trim() === userOrgGroupName),
                                    );
                                    const resolvedUserOgId = userOgObj ? String(userOgObj.id) : userOrgId;
                                    const resolvedUserIdOrgGroup =
                                        userOgObj && userOgObj.idorg_group !== undefined && userOgObj.idorg_group !== null
                                            ? String(userOgObj.idorg_group)
                                            : userIdOrgGroup;
                                    const resolvedUserOgName = (userOgObj?.name || userOrgGroupName).toLowerCase().trim();

                                    if (auth.organization_group_use_initiator) {
                                        if (!simInitiatorUser) {
                                            match = false;
                                        } else {
                                            const initOrgId = String(
                                                simInitiatorUser.department?.organization_group_id || simInitiatorUser.organization_group_id || '',
                                            );
                                            const initIdOrgGroup =
                                                simInitiatorUser.department?.idorg_group !== undefined &&
                                                simInitiatorUser.department?.idorg_group !== null
                                                    ? String(simInitiatorUser.department.idorg_group)
                                                    : simInitiatorUser.idorg_group !== undefined && simInitiatorUser.idorg_group !== null
                                                      ? String(simInitiatorUser.idorg_group)
                                                      : '';
                                            const initOrgGroupName = (
                                                simInitiatorUser.org_group_name ||
                                                simInitiatorUser.department?.org_group_name ||
                                                ''
                                            )
                                                .toLowerCase()
                                                .trim();

                                            const initOgObj = organizationGroups.find(
                                                (og: any) =>
                                                    (initOrgId && String(og.id) === initOrgId) ||
                                                    (initIdOrgGroup && String(og.idorg_group) === initIdOrgGroup) ||
                                                    (initOrgGroupName && og.name?.toLowerCase().trim() === initOrgGroupName),
                                            );
                                            const resolvedInitOgId = initOgObj ? String(initOgObj.id) : initOrgId;
                                            const resolvedInitIdOrgGroup =
                                                initOgObj && initOgObj.idorg_group !== undefined && initOgObj.idorg_group !== null
                                                    ? String(initOgObj.idorg_group)
                                                    : initIdOrgGroup;
                                            const resolvedInitOgName = (initOgObj?.name || initOrgGroupName).toLowerCase().trim();

                                            const isOrgGroupMatch =
                                                (resolvedInitOgId && resolvedUserOgId && resolvedInitOgId === resolvedUserOgId) ||
                                                (resolvedInitIdOrgGroup &&
                                                    resolvedUserIdOrgGroup &&
                                                    resolvedInitIdOrgGroup === resolvedUserIdOrgGroup) ||
                                                (resolvedInitOgName && resolvedUserOgName && resolvedInitOgName === resolvedUserOgName);

                                            if (!isOrgGroupMatch) match = false;
                                        }
                                    } else if (auth.organization_group_id) {
                                        const targetOg = organizationGroups.find(
                                            (og: any) =>
                                                String(og.id) === String(auth.organization_group_id) ||
                                                String(og.idorg_group) === String(auth.organization_group_id) ||
                                                og.code === auth.organization_group_id ||
                                                og.name === auth.organization_group_id,
                                        );
                                        const targetOgId = targetOg ? String(targetOg.id) : String(auth.organization_group_id);
                                        const targetIdOrgGroup =
                                            targetOg && targetOg.idorg_group !== undefined && targetOg.idorg_group !== null
                                                ? String(targetOg.idorg_group)
                                                : null;
                                        const targetOgName = (targetOg?.name || String(auth.organization_group_id)).toLowerCase().trim();

                                        const isOrgGroupMatch =
                                            (targetOgId && resolvedUserOgId && targetOgId === resolvedUserOgId) ||
                                            (targetIdOrgGroup !== null && resolvedUserIdOrgGroup && targetIdOrgGroup === resolvedUserIdOrgGroup) ||
                                            (targetOgName && resolvedUserOgName && targetOgName === resolvedUserOgName) ||
                                            (targetOgId && resolvedUserIdOrgGroup && targetOgId === resolvedUserIdOrgGroup);

                                        if (!isOrgGroupMatch) match = false;
                                    }
                                }

                                if (match) {
                                    const deptName = departments.find((d: any) => String(d.id) === String(user.department_id))?.name;
                                    matchedUsersMap.set(String(user.id), {
                                        user: { ...user, department_name: deptName },
                                        reasons: ['Otoritas Sesuai'],
                                    });
                                }
                            });
                        }
                    }
                });
            }

            return {
                eligibleUsers: Array.from(matchedUsersMap.values()),
                dynamicRoles: dynamicList,
                criteriaSummary: criteriaParts.join(' • ') || '—',
            };
        },
        [departments, roles, users, simInitiatorUser, simPicUser, simCreatorUser, simAdhocUsers],
    );

    // Generator Node & Edge Layout for Multi-Workflow Grouping
    const generateLayout = useCallback(() => {
        const generatedNodes: Node[] = [];
        const generatedEdges: Edge[] = [];
        let totalRollbacks = 0;
        let totalCrossTransitions = 0;

        const NODE_HEIGHT = showUsers ? 290 : 210;
        const VERTICAL_GAP = 90;
        const START_X = 80;
        const START_Y = 50;
        const GROUP_PADDING_X = 50;
        const GROUP_PADDING_TOP = 80;
        const GROUP_PADDING_BOTTOM = 40;
        const CARD_WIDTH = 330;
        const GROUP_WIDTH = CARD_WIDTH + GROUP_PADDING_X * 2;
        const COLUMN_GAP = 140;

        // 1. Tentukan Workflow Mana Saja yang Dirender berdasarkan viewMode
        interface RenderWorkflowItem {
            id: string;
            workflow: any;
            steps: any[];
            isPrimary: boolean;
        }

        const workflowsToRender: RenderWorkflowItem[] = [];
        const primaryWfId = String(workflow?.id || 'current');

        // Tambahkan primary workflow selalu di posisi pertama
        workflowsToRender.push({
            id: primaryWfId,
            workflow: workflow || { name: 'Alur Kerja Utama' },
            steps: sortedPrimarySteps,
            isPrimary: true,
        });

        const isMasterWorkflow = (wf: any) => {
            if (!wf) return false;
            const type = String(wf.workflow_type || '').toLowerCase();
            if (type === 'main' || type === 'standalone') return true;
            if (type === 'sub_workflow') return false;
            return !wf.parent_workflow_id;
        };

        if (viewMode === 'connected') {
            // Traverse seluruh alur yang terhubung maju (sub-workflow) tanpa mencampur 2 master workflow
            const visitedWfIds = new Set<string>([primaryWfId]);
            const queue: any[] = [{ id: primaryWfId, steps: sortedPrimarySteps, customActions: effectiveCustomActions }];

            while (queue.length > 0) {
                const current = queue.shift();
                const curSteps = current.steps || [];
                const curCustomActions = current.customActions || [];

                curSteps.forEach((s: any) => {
                    const combinedActions = getEffectiveStepActions(s, curCustomActions);
                    combinedActions.forEach((act: any) => {
                        const tConfig = parseTransitionConfig(act);
                        const targetId = tConfig?.workflow_id || act.next_workflow_id;
                        if (targetId && !visitedWfIds.has(String(targetId))) {
                            const foundWf = (allWorkflows || []).find((w: any) => String(w.id) === String(targetId));
                            // Jangan sertakan master workflow lain di kanvas yang sama
                            if (foundWf && (!isMasterWorkflow(foundWf) || String(targetId) === primaryWfId)) {
                                visitedWfIds.add(String(targetId));
                                const sortedSteps = (foundWf.steps || [])
                                    .slice()
                                    .sort((a: any, b: any) => (Number(a.step) || 0) - (Number(b.step) || 0));
                                const subCustomActions = foundWf.meta?.custom_actions || [];
                                workflowsToRender.push({
                                    id: String(targetId),
                                    workflow: foundWf,
                                    steps: sortedSteps,
                                    isPrimary: false,
                                });
                                queue.push({ id: String(targetId), steps: sortedSteps, customActions: subCustomActions });
                            }
                        }
                    });
                });

                // Cek juga custom_actions langsung di level workflow jika ada
                (curCustomActions || []).forEach((ca: any) => {
                    if (ca.is_active === false) return;
                    const targetId = ca.transition_config?.workflow_id || ca.next_workflow_id;
                    if (targetId && !visitedWfIds.has(String(targetId))) {
                        const foundWf = (allWorkflows || []).find((w: any) => String(w.id) === String(targetId));
                        if (foundWf && (!isMasterWorkflow(foundWf) || String(targetId) === primaryWfId)) {
                            visitedWfIds.add(String(targetId));
                            const sortedSteps = (foundWf.steps || []).slice().sort((a: any, b: any) => (Number(a.step) || 0) - (Number(b.step) || 0));
                            const subCustomActions = foundWf.meta?.custom_actions || [];
                            workflowsToRender.push({
                                id: String(targetId),
                                workflow: foundWf,
                                steps: sortedSteps,
                                isPrimary: false,
                            });
                            queue.push({ id: String(targetId), steps: sortedSteps, customActions: subCustomActions });
                        }
                    }
                });

                // Cek hanya sub-workflow anak (parent_workflow_id mengarah ke current)
                (allWorkflows || []).forEach((otherWf: any) => {
                    const otherId = String(otherWf.id);
                    if (!visitedWfIds.has(otherId) && !isMasterWorkflow(otherWf)) {
                        const isChildOfCurrent = String(otherWf.parent_workflow_id) === current.id;
                        if (isChildOfCurrent) {
                            visitedWfIds.add(otherId);
                            const sortedSteps = (otherWf.steps || []).slice().sort((a: any, b: any) => (Number(a.step) || 0) - (Number(b.step) || 0));
                            const subCustomActions = otherWf.meta?.custom_actions || [];
                            workflowsToRender.push({
                                id: otherId,
                                workflow: otherWf,
                                steps: sortedSteps,
                                isPrimary: false,
                            });
                            queue.push({ id: otherId, steps: sortedSteps, customActions: subCustomActions });
                        }
                    }
                });
            }
        } else if (viewMode === 'all') {
            // Render workflow saat ini beserta seluruh sub-workflow (tanpa master workflow lain)
            (allWorkflows || []).forEach((otherWf: any) => {
                const otherId = String(otherWf.id);
                if (otherId !== primaryWfId && !isMasterWorkflow(otherWf)) {
                    const sortedSteps = (otherWf.steps || []).slice().sort((a: any, b: any) => (Number(a.step) || 0) - (Number(b.step) || 0));
                    workflowsToRender.push({
                        id: otherId,
                        workflow: otherWf,
                        steps: sortedSteps,
                        isPrimary: false,
                    });
                }
            });
        }

        // 2. Render Node Containers & Step Nodes
        const nodePositionMap = new Map<string, { nodeId: string; x: number; y: number }>();

        workflowsToRender.forEach((wfItem, colIdx) => {
            const colX = START_X + colIdx * (CARD_WIDTH + COLUMN_GAP);
            const stepCount = Math.max(1, wfItem.steps.length);
            const groupHeight = Math.max(
                400,
                GROUP_PADDING_TOP + stepCount * NODE_HEIGHT + Math.max(0, stepCount - 1) * VERTICAL_GAP + GROUP_PADDING_BOTTOM,
            );
            const groupId = `group-wf-${wfItem.id}`;
            const isPrimary = wfItem.isPrimary;
            const currentWfCustomActions = isPrimary ? effectiveCustomActions : wfItem.workflow?.meta?.custom_actions || [];

            // Group Container Node (Hanya dirender jika showGroups aktif)
            if (showGroups) {
                generatedNodes.push({
                    id: groupId,
                    type: 'workflowGroupNode',
                    position: { x: colX - GROUP_PADDING_X, y: START_Y - GROUP_PADDING_TOP },
                    style: { width: GROUP_WIDTH, height: groupHeight, zIndex: -1 },
                    data: {
                        title: wfItem.workflow.name || `Alur Kerja (${colIdx + 1})`,
                        subtitle: wfItem.workflow.contract_type?.name ? `Kategori: ${wfItem.workflow.contract_type.name}` : undefined,
                        badge: isPrimary ? 'Workflow Utama' : `Sub-Alur #${colIdx}`,
                        isPrimary,
                        stepCount,
                        themeIndex: colIdx,
                    },
                });
            }

            // Kumpulkan kandidat rollback dan forward internal untuk alokasi multi-lane anti-tumpang tindih
            const wfRollbackCandidates: Array<{
                id: string;
                sourceNodeId: string;
                targetNodeId: string;
                sourceStepNum: number;
                targetStepNum: number;
                aIdx: number;
                act: any;
                span: number;
            }> = [];

            const wfForwardCandidates: Array<{
                id: string;
                sourceNodeId: string;
                targetNodeId: string;
                sourceStepNum: number;
                targetStepNum: number;
                aIdx: number;
                act: any;
                span: number;
            }> = [];

            // Render setiap step di kolom workflow ini
            wfItem.steps.forEach((step: any, sIdx: number) => {
                const stepNum = Number(step.step) || sIdx + 1;
                const nodeId = `wf-${wfItem.id}-step-${stepNum}`;
                const stepX = colX;
                const stepY = START_Y + sIdx * (NODE_HEIGHT + VERTICAL_GAP);

                nodePositionMap.set(`${wfItem.id}:${stepNum}`, { nodeId, x: stepX, y: stepY });
                if (isPrimary) {
                    nodePositionMap.set(`primary:${stepNum}`, { nodeId, x: stepX, y: stepY });
                }

                const { eligibleUsers, dynamicRoles, criteriaSummary } = calculateStepUsers(step);
                const effectiveActions = getEffectiveStepActions(step, currentWfCustomActions);
                const stepWithEffectiveActions = {
                    ...step,
                    actions: effectiveActions,
                };

                generatedNodes.push({
                    id: nodeId,
                    type: 'workflowStepNode',
                    position: { x: stepX, y: stepY },
                    data: {
                        step: stepWithEffectiveActions,
                        allSteps: wfItem.steps,
                        allWorkflows,
                        workflowId: wfItem.id,
                        workflowName: wfItem.workflow.name,
                        totalSteps: wfItem.steps.length,
                        isFirst: sIdx === 0,
                        isLast: sIdx === wfItem.steps.length - 1,
                        showUsers,
                        eligibleUsers,
                        dynamicRoles,
                        criteriaSummary,
                        themeIndex: colIdx,
                    },
                });

                // Evaluasi Aksi untuk Forward dan Rollback Internal dalam Workflow ini
                effectiveActions.forEach((act: any, aIdx: number) => {
                    const isLastStep = sIdx === wfItem.steps.length - 1;
                    const { targetStepNum, isCrossWf, isRollbackDirection, isForwardDirection } = resolveActionTarget(
                        act,
                        stepNum,
                        isLastStep,
                        wfItem.steps,
                        allWorkflows,
                    );

                    if (isCrossWf) {
                        // Ditangani di tahap cross-workflow edges
                        return;
                    }

                    if (targetStepNum === null || targetStepNum === stepNum) return;
                    const targetNodeId = `wf-${wfItem.id}-step-${targetStepNum}`;

                    // Internal Forward Edge
                    if (isForwardDirection && showForwardRoutes) {
                        wfForwardCandidates.push({
                            id: `edge-forward-${wfItem.id}-${stepNum}[${aIdx}]->${targetStepNum}`,
                            sourceNodeId: nodeId,
                            targetNodeId,
                            sourceStepNum: stepNum,
                            targetStepNum,
                            aIdx,
                            act,
                            span: Math.abs(targetStepNum - stepNum),
                        });
                    }

                    // Kumpulkan kandidat Rollback Edge untuk dialokasikan jalurnya secara anti tumpang-tindih
                    if (isRollbackDirection && showRollbackRoutes) {
                        wfRollbackCandidates.push({
                            id: `edge-rollback-${wfItem.id}-${stepNum}[${aIdx}]->${targetStepNum}`,
                            sourceNodeId: nodeId,
                            targetNodeId,
                            sourceStepNum: stepNum,
                            targetStepNum,
                            aIdx,
                            act,
                            span: Math.abs(stepNum - targetStepNum),
                        });
                    }
                });
            });

            // Alokasikan Multi-Lane Non-Overlapping untuk Garis Maju (Forward)
            if (showForwardRoutes && wfForwardCandidates.length > 0) {
                // Urutkan rentang forward: langkah berdekatan di dalam, langkah jauh di luar
                wfForwardCandidates.sort((a, b) => {
                    if (a.span !== b.span) return a.span - b.span;
                    return a.sourceStepNum - b.sourceStepNum;
                });

                const occupiedForwardLanes: Array<Array<{ start: number; end: number }>> = [];

                wfForwardCandidates.forEach((cand) => {
                    const isSequential = cand.span === 1 && cand.targetStepNum === cand.sourceStepNum + 1;

                    if (isSequential) {
                        // Maju ke 1 step langsung di bawahnya: sambungkan dari handle kanan ke top-target
                        generatedEdges.push({
                            id: cand.id,
                            source: cand.sourceNodeId,
                            target: cand.targetNodeId,
                            sourceHandle: `action-handle-right-${cand.aIdx}`,
                            targetHandle: 'top-target',
                            type: 'orthogonalForwardEdge',
                            animated: animatedLines,
                            data: {
                                isSequentialNext: true,
                            },
                            style: { stroke: '#10b981', strokeWidth: 2.5 },
                            markerEnd: {
                                type: MarkerType.ArrowClosed,
                                color: '#10b981',
                                width: 18,
                                height: 18,
                            },
                            label: showLabels ? cand.act?.alias || `Maju -> Step ${cand.targetStepNum}` : undefined,
                        });
                    } else {
                        // Loncatan forward multi-step (misal Step 1 -> Step 3): alokasikan jalur orthogonal terpisah di kanan
                        let assignedLane = 0;
                        while (true) {
                            if (!occupiedForwardLanes[assignedLane]) {
                                occupiedForwardLanes[assignedLane] = [];
                                break;
                            }
                            const hasConflict = occupiedForwardLanes[assignedLane].some(
                                (interval) => Math.max(interval.start, cand.sourceStepNum) <= Math.min(interval.end, cand.targetStepNum),
                            );
                            if (!hasConflict) break;
                            assignedLane++;
                        }
                        occupiedForwardLanes[assignedLane].push({ start: cand.sourceStepNum, end: cand.targetStepNum });

                        generatedEdges.push({
                            id: cand.id,
                            source: cand.sourceNodeId,
                            target: cand.targetNodeId,
                            sourceHandle: `action-handle-right-${cand.aIdx}`,
                            targetHandle: 'right-target',
                            type: 'orthogonalForwardEdge',
                            animated: animatedLines,
                            data: {
                                isSequentialNext: false,
                                lane: assignedLane,
                                laneSpacing: 28,
                            },
                            style: { stroke: '#059669', strokeWidth: 2.5 },
                            markerEnd: {
                                type: MarkerType.ArrowClosed,
                                color: '#059669',
                                width: 18,
                                height: 18,
                            },
                            label: showLabels ? cand.act?.alias || `Lompat -> Step ${cand.targetStepNum}` : undefined,
                        });
                    }
                });
            }

            // Alokasikan Multi-Lane Non-Overlapping untuk Garis Rollback/Back
            if (showRollbackRoutes && wfRollbackCandidates.length > 0) {
                // Urutkan rentang rollback: rentang yang lebih panjang di luar (outer), rentang pendek di dalam (inner)
                wfRollbackCandidates.sort((a, b) => {
                    if (b.span !== a.span) return b.span - a.span;
                    return a.targetStepNum - b.targetStepNum;
                });

                const occupiedLanes: Array<Array<{ start: number; end: number }>> = [];
                const targetIncomingCount: Record<number, number> = {};
                const targetIncomingTotal: Record<number, number> = {};

                wfRollbackCandidates.forEach((cand) => {
                    targetIncomingTotal[cand.targetStepNum] = (targetIncomingTotal[cand.targetStepNum] || 0) + 1;
                });

                wfRollbackCandidates.forEach((cand) => {
                    totalRollbacks++;
                    let assignedLane = 0;
                    while (true) {
                        if (!occupiedLanes[assignedLane]) {
                            occupiedLanes[assignedLane] = [];
                            break;
                        }
                        // Bentrok jika rentang interval [targetStepNum, sourceStepNum] tumpang tindih
                        const hasConflict = occupiedLanes[assignedLane].some(
                            (interval) => Math.max(interval.start, cand.targetStepNum) <= Math.min(interval.end, cand.sourceStepNum),
                        );
                        if (!hasConflict) {
                            break;
                        }
                        assignedLane++;
                    }
                    occupiedLanes[assignedLane].push({ start: cand.targetStepNum, end: cand.sourceStepNum });

                    const inIdx = targetIncomingCount[cand.targetStepNum] || 0;
                    targetIncomingCount[cand.targetStepNum] = inIdx + 1;
                    const totalIn = targetIncomingTotal[cand.targetStepNum] || 1;
                    const targetOffset = totalIn > 1 ? (inIdx - (totalIn - 1) / 2) * 12 : 0;

                    generatedEdges.push({
                        id: cand.id,
                        source: cand.sourceNodeId,
                        target: cand.targetNodeId,
                        sourceHandle: `action-handle-left-${cand.aIdx}`,
                        targetHandle: 'left-target',
                        type: 'orthogonalSikuRollbackEdge',
                        animated: animatedLines,
                        data: {
                            lane: assignedLane,
                            laneSpacing: laneSpacing || 32,
                            targetOffset,
                        },
                        style: {
                            stroke: '#f43f5e',
                            strokeWidth: 2.5,
                            strokeDasharray: animatedLines ? '6,4' : undefined,
                        },
                        markerEnd: {
                            type: MarkerType.ArrowClosed,
                            color: '#f43f5e',
                            width: 18,
                            height: 18,
                        },
                        label: showLabels ? cand.act?.alias || `Revisi -> Step ${cand.targetStepNum}` : undefined,
                    });
                });
            }
        });

        // 3. Buat Cross-Workflow Edges Menghubungkan Antar Workflow Container
        if (showCrossRoutes) {
            workflowsToRender.forEach((sourceWfItem) => {
                const sourceWfCustomActions = sourceWfItem.isPrimary ? effectiveCustomActions : sourceWfItem.workflow?.meta?.custom_actions || [];
                sourceWfItem.steps.forEach((step: any) => {
                    const stepNum = Number(step.step) || 1;
                    const sourceNodeId = `wf-${sourceWfItem.id}-step-${stepNum}`;
                    const effectiveActions = getEffectiveStepActions(step, sourceWfCustomActions);

                    effectiveActions.forEach((act: any, aIdx: number) => {
                        const tConfig = parseTransitionConfig(act);
                        const isCrossWf = tConfig?.type === 'cross_workflow' || Boolean(act?.next_workflow_id);

                        if (isCrossWf) {
                            totalCrossTransitions++;
                            const targetWfId = String(tConfig?.workflow_id || act.next_workflow_id || '');
                            let targetSeq = Number(tConfig?.sequence || 0);

                            if (!targetSeq && act.next_workflow_step_id) {
                                const targetWf = (allWorkflows || []).find((w: any) => String(w.id) === targetWfId);
                                const matchedStep = (targetWf?.steps || []).find((s: any) => String(s.id) === String(act.next_workflow_step_id));
                                if (matchedStep) {
                                    targetSeq = Number(matchedStep.step) || 1;
                                }
                            }
                            if (!targetSeq) targetSeq = 1;

                            const isOriginTarget = targetWfId === 'origin_workflow' || tConfig?.type === 'origin_return';
                            const targetWf = isOriginTarget
                                ? { name: 'Workflow Asal (Origin / Pemanggil)' }
                                : (allWorkflows || []).find((w: any) => String(w.id) === targetWfId);
                            const dynamicSeqLabel = isOriginTarget
                                ? tConfig?.return_mode === 'branch_next'
                                    ? 'Step Asal + 1 (Dinamis)'
                                    : tConfig?.return_mode === 'branch_origin'
                                      ? 'Step Asal (Dinamis)'
                                      : `Tahap ${targetSeq}`
                                : targetSeq;

                            const targetLookup = nodePositionMap.get(`${targetWfId}:${targetSeq}`);

                            if (targetLookup) {
                                // Target Workflow dirender di kanvas: hubungkan garis langsung ke node target
                                generatedEdges.push({
                                    id: `edge-cross-${sourceWfItem.id}[${stepNum}]->${targetWfId}[${targetSeq}]-act${aIdx}`,
                                    source: sourceNodeId,
                                    target: targetLookup.nodeId,
                                    sourceHandle: `action-handle-right-${aIdx}`,
                                    targetHandle: 'left-target',
                                    type: 'smoothstep',
                                    animated: animatedLines,
                                    style: { stroke: '#6366f1', strokeWidth: 3, strokeDasharray: '6,4' },
                                    markerEnd: {
                                        type: MarkerType.ArrowClosed,
                                        color: '#6366f1',
                                        width: 18,
                                        height: 18,
                                    },
                                    label: showLabels ? act?.alias || `Beralih -> ${targetWf?.name || 'Sub-Alur'} (Tahap ${targetSeq})` : undefined,
                                    labelStyle: { fill: '#4338ca', fontWeight: 700, fontSize: 10 },
                                    labelBgStyle: { fill: '#e0e7ff', fillOpacity: 0.95, rx: 6, ry: 6 },
                                    labelBgPadding: [6, 4],
                                });
                            } else if (targetWfId) {
                                // Fallback jika target workflow belum berada dalam view rendering: buat kartu external mini
                                const crossFallbackId = `cross-fallback-${targetWfId}-${isOriginTarget ? tConfig?.return_mode || 'origin' : targetSeq}`;
                                if (!generatedNodes.some((n) => n.id === crossFallbackId)) {
                                    const sourcePos = nodePositionMap.get(`${sourceWfItem.id}:${stepNum}`);
                                    const fallbackX = (sourcePos?.x || START_X) + 420;
                                    const fallbackY = sourcePos?.y || START_Y;

                                    generatedNodes.push({
                                        id: crossFallbackId,
                                        type: 'crossWorkflowTargetNode',
                                        position: { x: fallbackX, y: fallbackY },
                                        data: {
                                            targetWorkflow: targetWf || { name: `Alur Kerja (${targetWfId.substring(0, 8)})` },
                                            targetSequence: dynamicSeqLabel,
                                        },
                                    });
                                }

                                generatedEdges.push({
                                    id: `edge-cross-fallback-${sourceWfItem.id}[${stepNum}]->${crossFallbackId}-act${aIdx}`,
                                    source: sourceNodeId,
                                    target: crossFallbackId,
                                    sourceHandle: `action-handle-right-${aIdx}`,
                                    targetHandle: 'left-target',
                                    type: 'smoothstep',
                                    animated: animatedLines,
                                    style: { stroke: '#6366f1', strokeWidth: 2.5, strokeDasharray: '5,5' },
                                    markerEnd: {
                                        type: MarkerType.ArrowClosed,
                                        color: '#6366f1',
                                        width: 18,
                                        height: 18,
                                    },
                                    label: showLabels
                                        ? act?.alias ||
                                          (isOriginTarget
                                              ? `Kembali -> Workflow Asal (${dynamicSeqLabel})`
                                              : `Beralih -> ${targetWf?.name || 'Sub-Alur'}`)
                                        : undefined,
                                    labelStyle: { fill: '#4338ca', fontWeight: 700, fontSize: 10 },
                                    labelBgStyle: { fill: '#e0e7ff', fillOpacity: 0.95, rx: 6, ry: 6 },
                                    labelBgPadding: [6, 4],
                                });
                            }
                        }
                    });
                });
            });
        }

        return {
            nodes: generatedNodes,
            edges: generatedEdges,
            totalWorkflows: workflowsToRender.length,
            totalSteps: generatedNodes.filter((n) => n.type === 'workflowStepNode').length,
            totalRollbacks,
            totalCrossTransitions,
        };
    }, [
        workflow,
        sortedPrimarySteps,
        allWorkflows,
        effectiveCustomActions,
        viewMode,
        showForwardRoutes,
        showRollbackRoutes,
        showCrossRoutes,
        laneSpacing,
        animatedLines,
        showLabels,
        showUsers,
        showGroups,
        calculateStepUsers,
    ]);

    const layout = useMemo(() => generateLayout(), [generateLayout]);

    // Position overrides from user dragging with LocalStorage persistence
    const storageKey = `wf_vis_positions_${workflow?.id || 'default'}`;
    const [dragPositions, setDragPositions] = useState<Record<string, { x: number; y: number }>>(() => {
        if (typeof window !== 'undefined') {
            try {
                const saved = localStorage.getItem(storageKey);
                return saved ? JSON.parse(saved) : {};
            } catch {
                return {};
            }
        }
        return {};
    });

    const nodes = useMemo(() => {
        return layout.nodes.map((node) => ({
            ...node,
            position: dragPositions[node.id] || node.position,
        }));
    }, [layout.nodes, dragPositions]);

    const edges = layout.edges;

    const onNodesChange = useCallback(
        (changes: any[]) => {
            changes.forEach((change: any) => {
                if (change.type === 'position' && change.position && change.id) {
                    setDragPositions((prev) => {
                        const next = {
                            ...prev,
                            [change.id]: change.position,
                        };
                        if (typeof window !== 'undefined') {
                            try {
                                localStorage.setItem(storageKey, JSON.stringify(next));
                            } catch {}
                        }
                        return next;
                    });
                }
            });
        },
        [storageKey],
    );

    const resetLayoutPositions = useCallback(() => {
        setDragPositions({});
        if (typeof window !== 'undefined') {
            localStorage.removeItem(storageKey);
        }
    }, [storageKey]);

    return (
        <div className="flex h-[820px] w-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50/50 font-sans shadow-xs dark:border-zinc-800 dark:bg-zinc-950">
            {/* Toolbar Header */}
            <div className="z-10 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 bg-white/95 px-4 py-2.5 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/95">
                <div className="flex items-center gap-2.5">
                    <div className="bg-primary/10 text-primary flex items-center justify-center rounded-xl p-2 font-medium">
                        <Network size={16} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="flex items-center gap-1.5 text-xs font-medium text-slate-900 dark:text-white">
                                Diagram & Visualisasi Multi-Workflow
                            </h3>
                            <span className="rounded-full border border-indigo-200/80 bg-indigo-50 px-2 py-0.5 text-[9.5px] font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                                {layout.totalWorkflows} Workflow • {layout.totalSteps} Tahap • {layout.totalCrossTransitions} Lintas Alur
                            </span>
                        </div>
                        <p className="text-muted-foreground text-[10px]">
                            Peta visual alur persetujuan, sub-workflow modular, dan transisi lintas alur
                        </p>
                    </div>
                </div>

                {/* Interactive Toolbar Controls */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                    {/* View Mode Switcher (Connected / Show All / Single) */}
                    <div className="flex items-center rounded-xl border border-slate-200 bg-slate-100 p-0.5 dark:border-zinc-700 dark:bg-zinc-800">
                        <button
                            type="button"
                            onClick={() => setViewMode('connected')}
                            className={cn(
                                'flex cursor-pointer items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-medium transition-all',
                                viewMode === 'connected'
                                    ? 'bg-indigo-600 font-semibold text-white shadow-2xs'
                                    : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200',
                            )}
                            title="Tampilkan Workflow Ini dan Seluruh Sub-Workflow yang Terhubung Langsung"
                        >
                            <ArrowRightLeft size={11} />
                            <span>Alur Terhubung</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('all')}
                            className={cn(
                                'flex cursor-pointer items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-medium transition-all',
                                viewMode === 'all'
                                    ? 'bg-indigo-600 font-semibold text-white shadow-2xs'
                                    : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200',
                            )}
                            title="Tampilkan Semua Workflow di Sistem dengan Grouping Berdampingan"
                        >
                            <Layers size={11} />
                            <span>Seluruh Alur (Show All)</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('single')}
                            className={cn(
                                'cursor-pointer rounded-lg px-2.5 py-1 text-[10px] font-medium transition-all',
                                viewMode === 'single'
                                    ? 'bg-white font-semibold text-slate-900 shadow-2xs dark:bg-zinc-900 dark:text-white'
                                    : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200',
                            )}
                            title="Hanya Tampilkan Alur Ini Saja"
                        >
                            <span>Alur Ini Saja</span>
                        </button>
                    </div>

                    {/* Reset Layout Positions */}
                    <button
                        type="button"
                        onClick={resetLayoutPositions}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 px-2.5 py-1.5 text-[10px] font-medium text-slate-600 shadow-2xs transition-all hover:bg-slate-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                        title="Rapikan posisi kartu kembali ke susunan awal"
                    >
                        <RotateCcw size={12} />
                        <span>Rapikan</span>
                    </button>

                    {/* Toggle Personil */}
                    <button
                        type="button"
                        onClick={() => setShowUsers(!showUsers)}
                        className={cn(
                            'inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[10px] font-medium shadow-2xs transition-all',
                            showUsers
                                ? 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300'
                                : 'border-slate-200 bg-slate-100 text-slate-500 hover:text-slate-700 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:text-zinc-300',
                        )}
                        title="Tampilkan / Sembunyikan Personil Berhak Akses"
                    >
                        <UserCheck size={12} className={showUsers ? 'text-indigo-600 dark:text-indigo-400' : ''} />
                        <span>{showUsers ? 'Orang Aktif' : 'Sembunyikan Orang'}</span>
                    </button>

                    {/* Toggle Grouping Container */}
                    <button
                        type="button"
                        onClick={() => setShowGroups(!showGroups)}
                        className={cn(
                            'inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[10px] font-medium shadow-2xs transition-all',
                            showGroups
                                ? 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300'
                                : 'border-slate-200 bg-slate-100 text-slate-500 hover:text-slate-700 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:text-zinc-300',
                        )}
                        title="Tampilkan / Sembunyikan Kotak Pembungkus Grouping Workflow"
                    >
                        <Layers size={12} className={showGroups ? 'text-indigo-600 dark:text-indigo-400' : ''} />
                        <span>{showGroups ? 'Grup Aktif' : 'Sembunyikan Grup'}</span>
                    </button>

                    {/* Filter Rute Checkboxes (Independen: Maju, Rollback, Antar-Alur) */}
                    <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-zinc-700 dark:bg-zinc-800">
                        {/* Checkbox Rute Maju */}
                        <button
                            type="button"
                            onClick={() => setShowForwardRoutes(!showForwardRoutes)}
                            className={cn(
                                'flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-medium transition-all select-none',
                                showForwardRoutes
                                    ? 'bg-emerald-500 font-semibold text-white shadow-2xs'
                                    : 'text-slate-500 opacity-60 hover:text-slate-800 dark:hover:text-zinc-200',
                            )}
                            title="Tampilkan / Sembunyikan Garis Rute Maju (Forward)"
                        >
                            {showForwardRoutes ? <CheckSquare size={12} className="shrink-0" /> : <Square size={12} className="shrink-0" />}
                            <ArrowRight size={11} className="shrink-0" />
                            <span>Maju</span>
                        </button>

                        {/* Checkbox Rute Rollback */}
                        <button
                            type="button"
                            onClick={() => setShowRollbackRoutes(!showRollbackRoutes)}
                            className={cn(
                                'flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-medium transition-all select-none',
                                showRollbackRoutes
                                    ? 'bg-rose-500 font-semibold text-white shadow-2xs'
                                    : 'text-slate-500 opacity-60 hover:text-slate-800 dark:hover:text-zinc-200',
                            )}
                            title="Tampilkan / Sembunyikan Garis Rute Rollback / Revisi"
                        >
                            {showRollbackRoutes ? <CheckSquare size={12} className="shrink-0" /> : <Square size={12} className="shrink-0" />}
                            <CornerDownLeft size={11} className="shrink-0" />
                            <span>Rollback</span>
                        </button>

                        {/* Checkbox Rute Antar-Alur (Cross-Workflow) */}
                        <button
                            type="button"
                            onClick={() => setShowCrossRoutes(!showCrossRoutes)}
                            className={cn(
                                'flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-medium transition-all select-none',
                                showCrossRoutes
                                    ? 'bg-indigo-600 font-semibold text-white shadow-2xs'
                                    : 'text-slate-500 opacity-60 hover:text-slate-800 dark:hover:text-zinc-200',
                            )}
                            title="Tampilkan / Sembunyikan Garis Rute Antar-Alur (Cross-Workflow)"
                        >
                            {showCrossRoutes ? <CheckSquare size={12} className="shrink-0" /> : <Square size={12} className="shrink-0" />}
                            <GitFork size={11} className="shrink-0" />
                            <span>Antar-Alur</span>
                        </button>
                    </div>

                    {/* Animation & Label Toggles */}
                    <button
                        type="button"
                        onClick={() => setAnimatedLines(!animatedLines)}
                        title="Toggle Animasi Aliran Garis"
                        className={cn(
                            'cursor-pointer rounded-xl border p-1.5 transition-all',
                            animatedLines
                                ? 'bg-primary/10 text-primary border-primary/30'
                                : 'border-slate-200 bg-slate-100 text-slate-400 dark:border-zinc-700 dark:bg-zinc-800',
                        )}
                    >
                        <Sparkles size={13} />
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowLabels(!showLabels)}
                        title="Tampilkan / Sembunyikan Label Teks"
                        className={cn(
                            'cursor-pointer rounded-xl border p-1.5 transition-all',
                            showLabels
                                ? 'bg-primary/10 text-primary border-primary/30'
                                : 'border-slate-200 bg-slate-100 text-slate-400 dark:border-zinc-700 dark:bg-zinc-800',
                        )}
                    >
                        {showLabels ? <Eye size={13} /> : <EyeOff size={13} />}
                    </button>
                </div>
            </div>

            {/* React Flow Canvas */}
            <div className="relative h-full w-full flex-1">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    nodesDraggable={true}
                    nodesConnectable={false}
                    elementsSelectable={true}
                    nodeTypes={nodeTypes}
                    edgeTypes={edgeTypes}
                    fitView
                    fitViewOptions={{ padding: 0.25 }}
                    minZoom={0.15}
                    maxZoom={1.6}
                >
                    <Background variant={BackgroundVariant.Dots} gap={20} size={1.2} color="#94a3b8" />
                    <Controls className="overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-700 shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300" />
                    <MiniMap
                        nodeStrokeColor="#0284c7"
                        nodeColor="#f1f5f9"
                        nodeBorderRadius={8}
                        className="rounded-xl border border-slate-200 bg-white/80 shadow-md dark:border-zinc-800 dark:bg-zinc-900/80"
                    />
                </ReactFlow>
            </div>
        </div>
    );
}

export default WorkflowFlowVisualizer;
