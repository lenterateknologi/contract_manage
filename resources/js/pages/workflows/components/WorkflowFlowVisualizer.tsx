import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    Handle,
    Position,
    MarkerType,
    Node,
    Edge,
    BackgroundVariant,
    NodeProps,
    EdgeProps,
    BaseEdge,
    EdgeLabelRenderer,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
    CheckCircle2,
    UserCheck,
    PenTool,
    Users,
    CornerUpLeft,
    Activity,
    Briefcase,
    Building2,
    Eye,
    EyeOff,
    Sparkles,
    User,
    ChevronDown,
    ChevronUp,
    RotateCcw,
    Move,
    ExternalLink,
    Layers,
    GitFork,
    Network,
    ArrowRightLeft,
    Check,
    CheckSquare,
    Square,
    ArrowRight,
    CornerDownLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { APPROVER_TYPE_STYLES } from '../constants';

const getActionCode = (act: any): string => {
    if (!act) return '';
    return String(
        act.action_code ||
        act.code ||
        act.master_action_id ||
        act.master_action?.code ||
        act.alias ||
        act.name ||
        ''
    ).trim();
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
    const {
        title,
        subtitle,
        badge,
        isPrimary = false,
        stepCount = 0,
        themeIndex = 0,
    } = data as any;

    const theme = WORKFLOW_THEMES[themeIndex % WORKFLOW_THEMES.length];

    return (
        <div
            className={cn(
                'w-full h-full rounded-2xl border-2 transition-all pointer-events-none select-none flex flex-col justify-between p-4 shadow-sm backdrop-blur-xs',
                theme.border,
                theme.bg
            )}
        >
            {/* Header Group */}
            <div
                className={cn(
                    'flex items-center justify-between pb-3 px-3 py-2 -mx-2 -mt-2 rounded-xl border-b pointer-events-auto shadow-2xs',
                    theme.headerBg
                )}
            >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div
                        className={cn(
                            'flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-white shadow-2xs text-xs font-bold',
                            theme.iconBg
                        )}
                    >
                        {isPrimary ? <Layers size={14} /> : <GitFork size={14} />}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <h3 className="text-xs font-bold text-slate-800 dark:text-zinc-100 truncate" title={title}>
                                {title}
                            </h3>
                            <span
                                className={cn(
                                    'px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider shrink-0',
                                    theme.badge
                                )}
                            >
                                {badge}
                            </span>
                        </div>
                        {subtitle && (
                            <p className="text-[10px] text-muted-foreground truncate">
                                {subtitle}
                            </p>
                        )}
                    </div>
                </div>

                <div className="text-[10.5px] font-semibold text-slate-600 dark:text-zinc-300 bg-white/90 dark:bg-zinc-900/90 px-2.5 py-0.5 rounded-md border border-slate-200 dark:border-zinc-800 shrink-0 shadow-2xs ml-2">
                    {stepCount} Tahapan
                </div>
            </div>

            {/* Footer Group Indicator */}
            <div className="pt-2 text-right">
                <span className="text-[9px] font-medium text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
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
                'w-[330px] rounded-xl border bg-white dark:bg-zinc-900 shadow-lg transition-all font-sans select-none cursor-grab active:cursor-grabbing border-t-4 border-t-indigo-500',
                selected
                    ? 'border-indigo-500 ring-2 ring-indigo-500/40 shadow-xl scale-102'
                    : 'border-slate-200/90 dark:border-zinc-800 hover:border-indigo-400 dark:hover:border-indigo-600'
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

            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800/80 px-3.5 py-2 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-t-lg">
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-indigo-600 text-white text-[10px] font-medium shadow-2xs">
                        <ExternalLink size={11} />
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-200 truncate">
                        Alur Kerja Eksternal
                    </span>
                </div>
                <span className="shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-semibold uppercase bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60">
                    Cross-Workflow
                </span>
            </div>

            <div className="p-3 space-y-2">
                <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug truncate">
                        {targetWorkflow?.name || 'Alur Kerja Lain'}
                    </h4>
                    {targetWorkflow?.contract_type && (
                        <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                            Jenis: {targetWorkflow.contract_type.name}
                        </p>
                    )}
                </div>

                <div className="rounded-lg bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 p-2 text-[10.5px] text-indigo-900 dark:text-indigo-200 space-y-1">
                    <div className="flex items-center justify-between">
                        <span className="font-semibold text-[10px] uppercase tracking-wide">Mulai Pada Tahap:</span>
                        <span className="px-1.5 py-0.2 rounded bg-indigo-600 text-white font-bold text-[10px]">
                            Tahap {targetSequence}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Custom Siku-Siku (Orthogonal Multi-Lane) Rollback Edge ---
const OrthogonalSikuRollbackEdge = ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    style = {},
    markerEnd,
    label,
    data,
}: EdgeProps) => {
    const lane = Number(data?.lane || 0);
    const laneSpacing = Number(data?.laneSpacing || 28);
    const cornerRadius = 10;

    const outX = sourceX - (36 + lane * laneSpacing);
    const edgePath = `M ${sourceX} ${sourceY} L ${outX + cornerRadius} ${sourceY} Q ${outX} ${sourceY} ${outX} ${sourceY - cornerRadius} L ${outX} ${targetY + cornerRadius} Q ${outX} ${targetY} ${outX + cornerRadius} ${targetY} L ${targetX} ${targetY}`;

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
                            transform: `translate(-100%, -50%) translate(${labelX - 8}px, ${labelY}px)`,
                            pointerEvents: 'all',
                        }}
                        className="nodrag nopan select-none"
                    >
                        <div className="flex items-center gap-1 rounded-md border border-rose-300 dark:border-rose-900 bg-white/95 dark:bg-zinc-900/95 px-2 py-0.5 text-[9px] font-medium text-rose-700 dark:text-rose-300 shadow-2xs whitespace-nowrap backdrop-blur-xs">
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
        workflowId,
        workflowName,
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
                'w-[330px] rounded-xl border bg-white dark:bg-zinc-900 shadow-md transition-all font-sans select-none cursor-grab active:cursor-grabbing',
                selected
                    ? 'border-primary ring-2 ring-primary/40 shadow-xl scale-102'
                    : 'border-slate-200/90 dark:border-zinc-800 hover:border-slate-400 dark:hover:border-zinc-700',
                isFirst && 'border-t-4 border-t-emerald-500',
                isLast && 'border-t-4 border-t-purple-500',
                !isFirst && !isLast && (theme.stepBorder ? `border-t-4 ${theme.stepBorder}` : 'border-t-4 border-t-blue-500')
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

            {/* Card Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800/80 px-3.5 py-2 bg-slate-50/70 dark:bg-zinc-900/70 rounded-t-lg">
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-white text-[10px] font-medium shadow-2xs', theme.iconBg)}>
                        {step?.step || 1}
                    </span>
                    <div className="min-w-0 flex-1 truncate">
                        <span className="text-[10px] font-medium uppercase tracking-wider text-slate-700 dark:text-zinc-200 block truncate">
                            {isFirst ? 'Start / Inisiasi' : isLast ? 'Final / Selesai' : `Tahapan ${step?.step || 1}`}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                    <span
                        className={cn(
                            'rounded-md px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider',
                            targetStatus === 'draft' && 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/60',
                            targetStatus === 'in_review' && 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200/60',
                            targetStatus === 'pending' && 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200/60',
                            targetStatus === 'archived' && 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200/60'
                        )}
                    >
                        {targetStatus}
                    </span>
                    <Move size={11} className="text-slate-400 opacity-60" title="Bisa Digeser (Drag & Drop)" />
                </div>
            </div>

            {/* Card Body */}
            <div className="p-3 space-y-2.5">
                <div>
                    <h4 className="text-xs font-medium text-slate-900 dark:text-white leading-snug line-clamp-2">
                        {step?.description || step?.label || `Tahap ${step?.step || 1}`}
                    </h4>
                    {step?.label && step?.description && step.label !== step.description && (
                        <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                            {step.label}
                        </p>
                    )}
                </div>

                {/* Section Daftar Orang / Personil Berhak Akses */}
                {showUsers && (
                    <div className="rounded-lg bg-slate-50/80 dark:bg-zinc-950/60 border border-slate-200/70 dark:border-zinc-800 p-2 space-y-1.5 nodrag">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 text-[10px] font-medium text-slate-700 dark:text-zinc-300">
                                <UserCheck size={11} className="text-indigo-600 dark:text-indigo-400" />
                                <span>Personil Berhak Akses</span>
                            </div>
                            <span className="text-[9.5px] font-medium px-1.5 py-0.2 rounded-md bg-indigo-500/10 text-indigo-700 dark:text-indigo-300">
                                {totalEligibleCount} Orang
                            </span>
                        </div>

                        {/* Dynamic Roles Info */}
                        {dynamicRoles.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-0.5">
                                {dynamicRoles.map((dr: any, dIdx: number) => (
                                    <span
                                        key={dIdx}
                                        className="inline-flex items-center gap-1 text-[9px] font-medium px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20"
                                    >
                                        <Sparkles size={9} className="text-amber-600" />
                                        <span>{dr.label}</span>
                                        {dr.activeUser && (
                                            <span className="text-emerald-700 dark:text-emerald-400">({dr.activeUser.name})</span>
                                        )}
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
                                        className="flex items-center justify-between gap-1.5 text-[10.5px] bg-white dark:bg-zinc-900 px-2 py-1 rounded-md border border-slate-200/50 dark:border-zinc-800 shadow-2xs"
                                    >
                                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground text-[9px] font-medium uppercase">
                                                {(user.name || 'U').substring(0, 2)}
                                            </div>
                                            <div className="min-w-0 flex-1 truncate">
                                                <span className="font-medium text-slate-800 dark:text-zinc-200 truncate block leading-tight">
                                                    {user.name}
                                                </span>
                                                <span className="text-[9px] text-muted-foreground truncate block leading-tight">
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
                                        className="w-full text-center py-0.5 text-[9.5px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center justify-center gap-0.5 cursor-pointer"
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
                                <p className="text-[9.5px] text-muted-foreground italic">
                                    Belum ada aktor/otoritas yang dikonfigurasi
                                </p>
                            )
                        )}
                    </div>
                )}

                {/* Available Actions in this Step */}
                <div className="border-t border-slate-100 dark:border-zinc-800/80 pt-2.5 space-y-1.5 nodrag">
                    <div className="flex items-center justify-between text-[9.5px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider px-0.5">
                        <span>Aksi & Alur Tahap</span>
                        <span className="text-[9px] font-normal text-slate-400">({(step?.actions || []).length} Aksi)</span>
                    </div>

                    <div className="space-y-1.5">
                        {(step?.actions || []).map((act: any, aIdx: number) => {
                            const rawCode = getActionCode(act);
                            const codeLower = rawCode.toLowerCase();
                            const isApprove = codeLower === 'approve' || codeLower.includes('setuju');
                            const isReject = codeLower === 'reject' || codeLower.includes('tolak');
                            const isAssign = codeLower === 'assign' || codeLower.includes('tugas');
                            const isSign = codeLower === 'signature' || codeLower === 'sign' || codeLower.includes('tanda tangan');

                            const displayLabel = act?.alias || act?.label || act?.name || (rawCode ? rawCode.toUpperCase() : `Aksi ${aIdx + 1}`);

                            const currentStepNum = Number(step?.step) || 1;
                            let targetStepNum: number | null = null;
                            const tConfig = parseTransitionConfig(act);

                            if (tConfig) {
                                if (tConfig.type === 'initial_step') {
                                    targetStepNum = 1;
                                } else if (tConfig.type === 'absolute' && tConfig.sequence) {
                                    targetStepNum = Number(tConfig.sequence);
                                } else if (tConfig.type === 'relative') {
                                    targetStepNum = Math.max(1, currentStepNum + Number(tConfig.offset ?? (isReject ? -1 : 1)));
                                } else if (tConfig.type === 'cross_workflow') {
                                    targetStepNum = null;
                                }
                            } else if (act?.next_step_id) {
                                targetStepNum = Number(act.next_step_id);
                            } else {
                                if (isReject) targetStepNum = 1;
                                else if (isApprove) targetStepNum = isLast ? null : currentStepNum + 1;
                            }

                            let flowDestinationText = '';
                            const isRollbackDirection = (targetStepNum !== null && targetStepNum < currentStepNum) || (isReject && tConfig?.type !== 'cross_workflow');
                            const isForwardDirection = targetStepNum !== null && targetStepNum > currentStepNum;
                            const isCrossWf = tConfig?.type === 'cross_workflow' || Boolean(act?.next_workflow_id);

                            if (isCrossWf) {
                                flowDestinationText = `Beralih ke Alur Lain (Tahap ${tConfig?.sequence || 1})`;
                            } else if (isRollbackDirection) {
                                flowDestinationText = `Mundur ke Step ${targetStepNum ?? 1}`;
                            } else if (isForwardDirection) {
                                flowDestinationText = `Lanjut ke Step ${targetStepNum}`;
                            } else if (isLast && !isRollbackDirection) {
                                flowDestinationText = 'Selesai / Final';
                            } else if (isAssign) {
                                flowDestinationText = 'Tugaskan Personil';
                            } else if (isSign) {
                                flowDestinationText = 'Tanda Tangan Dokumen';
                            }

                            return (
                                <div
                                    key={aIdx}
                                    className={cn(
                                        'relative flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all shadow-2xs',
                                        isCrossWf && 'bg-indigo-50/90 border-indigo-300 text-indigo-950 dark:bg-indigo-950/50 dark:border-indigo-800 dark:text-indigo-200',
                                        !isCrossWf && isApprove && 'bg-emerald-50/80 border-emerald-200/90 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800/60 dark:text-emerald-200',
                                        !isCrossWf && isReject && 'bg-rose-50/80 border-rose-200/90 text-rose-900 dark:bg-rose-950/40 dark:border-rose-800/60 dark:text-rose-200',
                                        !isCrossWf && isAssign && 'bg-blue-50/80 border-blue-200/90 text-blue-900 dark:bg-blue-950/40 dark:border-blue-800/60 dark:text-blue-200',
                                        !isCrossWf && isSign && 'bg-purple-50/80 border-purple-200/90 text-purple-900 dark:bg-purple-950/40 dark:border-purple-800/60 dark:text-purple-200',
                                        !isCrossWf && !isApprove && !isReject && !isAssign && !isSign && 'bg-slate-50 border-slate-200 text-slate-800 dark:bg-zinc-800/60 dark:border-zinc-700 dark:text-zinc-200'
                                    )}
                                >
                                    {/* Left Handle: untuk aksi Rollback */}
                                    {isRollbackDirection && (
                                        <Handle
                                            type="source"
                                            position={Position.Left}
                                            id={`action-handle-left-${aIdx}`}
                                            className="!h-3 !w-3 !-left-2 !rounded-full !border-2 !border-white !bg-rose-500 dark:!border-zinc-900 shadow-xs"
                                        />
                                    )}

                                    {/* Action Info */}
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                        <div
                                            className={cn(
                                                'flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-white text-[10px] shadow-2xs',
                                                isCrossWf && 'bg-indigo-600',
                                                !isCrossWf && isApprove && 'bg-emerald-600',
                                                !isCrossWf && isReject && 'bg-rose-600',
                                                !isCrossWf && isAssign && 'bg-blue-600',
                                                !isCrossWf && isSign && 'bg-purple-600',
                                                !isCrossWf && !isApprove && !isReject && !isAssign && !isSign && 'bg-slate-600'
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
                                            <span className="block font-semibold text-[11px] truncate leading-tight">
                                                {displayLabel}
                                            </span>
                                            {flowDestinationText && (
                                                <span className="block text-[9.5px] opacity-80 truncate leading-tight font-normal">
                                                    {flowDestinationText}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right / Forward Handle: untuk Maju atau Cross-Workflow */}
                                    {(isForwardDirection || isCrossWf) && (
                                        <Handle
                                            type="source"
                                            position={Position.Right}
                                            id={`action-handle-right-${aIdx}`}
                                            className={cn(
                                                "!h-3 !w-3 !-right-2 !rounded-full !border-2 !border-white dark:!border-zinc-900 shadow-xs",
                                                isCrossWf ? '!bg-indigo-600' : '!bg-emerald-500'
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
};

interface WorkflowFlowVisualizerProps {
    steps: any[];
    workflow?: any;
    allWorkflows?: any[];
    users?: any[];
    roles?: any[];
    departments?: any[];
    divisions?: any[];
    companyGroups?: any[];
    companies?: any[];
    regions?: any[];
    simulationContext?: {
        initiatorId?: string;
        picId?: string;
        creatorId?: string;
    };
    onOpenSimulationModal?: () => void;
}

export function WorkflowFlowVisualizer({
    steps = [],
    workflow,
    allWorkflows = [],
    users = [],
    roles = [],
    departments = [],
    divisions = [],
    companyGroups = [],
    companies = [],
    regions = [],
    simulationContext,
    onOpenSimulationModal,
}: WorkflowFlowVisualizerProps) {
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

    const setLaneSpacing = (val: number) => {
        _setLaneSpacing(val);
        if (typeof window !== 'undefined') {
            localStorage.setItem('wf_vis_lane_spacing', String(val));
        }
    };

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

    const sortedPrimarySteps = useMemo(() => {
        return [...steps].sort((a, b) => (Number(a.step) || 0) - (Number(b.step) || 0));
    }, [steps]);

    // Helper calculateStepUsers
    const calculateStepUsers = useCallback((step: any) => {
        const matchedUsersMap = new Map<string, { user: any; reasons: string[] }>();
        const dynamicList: { type: string; label: string; description: string; activeUser?: any }[] = [];
        const criteriaParts: string[] = [];

        const authorities: any[] = step.approver_authorities || [];
        const cfg = step.approver_config || {};

        if (authorities && authorities.length > 0) {
            authorities.forEach((auth: any) => {
                if (auth.authority_type === 'custom' || ['initiator', 'assigned_pic', 'creator', 'atasan'].includes(auth.authority_type)) {
                    const customType = auth.authority_type === 'custom' ? (auth.role_id || auth.user_id) : auth.authority_type;
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
                        auth.company_group_id ||
                        auth.company_group_use_initiator ||
                        auth.company_id ||
                        auth.company_use_initiator ||
                        auth.region_id ||
                        auth.region_use_initiator
                    );

                    if (hasFilters) {
                        users.forEach((user: any) => {
                            const userRoleId = String(user.role_id || user.role || '');
                            const userDeptId = String(user.department_id || user.department?.id || '');
                            const userDivId = String(user.division_id || user.division?.id || user.department?.division_id || '');
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
    }, [departments, roles, users, simInitiatorUser, simPicUser, simCreatorUser]);

    // Generator Node & Edge Layout for Multi-Workflow Grouping
    const generateLayout = useCallback(() => {
        const generatedNodes: Node[] = [];
        const generatedEdges: Edge[] = [];
        let totalRollbacks = 0;
        let totalCrossTransitions = 0;

        const NODE_HEIGHT = showUsers ? 290 : 210;
        const VERTICAL_GAP = 90;
        const START_X = 60;
        const START_Y = 50;
        const GROUP_PADDING_X = 30;
        const GROUP_PADDING_TOP = 80;
        const GROUP_PADDING_BOTTOM = 40;
        const CARD_WIDTH = 330;
        const GROUP_WIDTH = CARD_WIDTH + GROUP_PADDING_X * 2;
        const COLUMN_GAP = 120;

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

        if (viewMode === 'connected') {
            // Traverse seluruh alur yang terhubung baik maju maupun mundur via cross_workflow
            const visitedWfIds = new Set<string>([primaryWfId]);
            const queue: any[] = [{ id: primaryWfId, steps: sortedPrimarySteps }];

            while (queue.length > 0) {
                const current = queue.shift();
                const curSteps = current.steps || [];

                curSteps.forEach((s: any) => {
                    (s.actions || []).forEach((act: any) => {
                        const tConfig = parseTransitionConfig(act);
                        const targetId = tConfig?.workflow_id || act.next_workflow_id;
                        if (targetId && !visitedWfIds.has(String(targetId))) {
                            const foundWf = (allWorkflows || []).find((w: any) => String(w.id) === String(targetId));
                            if (foundWf) {
                                visitedWfIds.add(String(targetId));
                                const sortedSteps = (foundWf.steps || []).slice().sort((a: any, b: any) => (Number(a.step) || 0) - (Number(b.step) || 0));
                                workflowsToRender.push({
                                    id: String(targetId),
                                    workflow: foundWf,
                                    steps: sortedSteps,
                                    isPrimary: false,
                                });
                                queue.push({ id: String(targetId), steps: sortedSteps });
                            }
                        }
                    });
                });

                // Cek juga workflow luar yang mengarah ke current workflow atau memiliki parent_workflow_id yang sama
                (allWorkflows || []).forEach((otherWf: any) => {
                    const otherId = String(otherWf.id);
                    if (!visitedWfIds.has(otherId)) {
                        const pointsToCurrent = (otherWf.steps || []).some((s: any) =>
                            (s.actions || []).some((a: any) => {
                                const tc = parseTransitionConfig(a);
                                return String(tc?.workflow_id || a.next_workflow_id) === current.id;
                            })
                        );

                        const isChildOfCurrent = String(otherWf.parent_workflow_id) === current.id;
                        const isSibling = otherWf.parent_workflow_id && String(otherWf.parent_workflow_id) === String(workflow?.parent_workflow_id);
                        const isParentOfCurrent = String(workflow?.parent_workflow_id) === otherId;

                        if (pointsToCurrent || isChildOfCurrent || isSibling || isParentOfCurrent) {
                            visitedWfIds.add(otherId);
                            const sortedSteps = (otherWf.steps || []).slice().sort((a: any, b: any) => (Number(a.step) || 0) - (Number(b.step) || 0));
                            workflowsToRender.push({
                                id: otherId,
                                workflow: otherWf,
                                steps: sortedSteps,
                                isPrimary: false,
                            });
                            queue.push({ id: otherId, steps: sortedSteps });
                        }
                    }
                });
            }
        } else if (viewMode === 'all') {
            // Render seluruh workflow yang ada di database
            (allWorkflows || []).forEach((otherWf: any) => {
                const otherId = String(otherWf.id);
                if (otherId !== primaryWfId) {
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

        // Peta node ID per workflow dan step number untuk menghubungkan edges secara akurat
        const nodePositionMap = new Map<string, { nodeId: string; x: number; y: number }>();

        // 2. Buat Group Nodes dan Step Nodes per Kolom Workflow
        workflowsToRender.forEach((wfItem, colIdx) => {
            const colX = START_X + colIdx * (GROUP_WIDTH + COLUMN_GAP);
            const stepCount = Math.max(1, wfItem.steps.length);
            const groupHeight = GROUP_PADDING_TOP + (stepCount * (NODE_HEIGHT + VERTICAL_GAP)) - VERTICAL_GAP + GROUP_PADDING_BOTTOM;
            const groupId = `group-workflow-${wfItem.id}`;
            const isPrimary = wfItem.isPrimary;

            // Workflow Group Container Node (Background)
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

            // Target Rollback Count Map untuk Multi-Lane Siku di setiap workflow
            const targetRollbackCountMap: Record<number, number> = {};

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

                generatedNodes.push({
                    id: nodeId,
                    type: 'workflowStepNode',
                    position: { x: stepX, y: stepY },
                    data: {
                        step,
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
                (step.actions || []).forEach((act: any, aIdx: number) => {
                    const rawCode = getActionCode(act);
                    const codeLower = rawCode.toLowerCase();
                    const isApprove = codeLower === 'approve' || codeLower.includes('setuju');
                    const isReject = codeLower === 'reject' || codeLower.includes('tolak');

                    const tConfig = parseTransitionConfig(act);
                    let targetStepNum: number | null = null;
                    const isCrossWf = tConfig?.type === 'cross_workflow' || Boolean(act?.next_workflow_id);

                    if (isCrossWf) {
                        // Ditangani di tahap cross-workflow edges
                        return;
                    }

                    if (tConfig) {
                        if (tConfig.type === 'initial_step') {
                            targetStepNum = 1;
                        } else if (tConfig.type === 'absolute' && tConfig.sequence) {
                            targetStepNum = Number(tConfig.sequence);
                        } else if (tConfig.type === 'relative') {
                            targetStepNum = Math.max(1, stepNum + Number(tConfig.offset ?? (isReject ? -1 : 1)));
                        }
                    } else if (act?.next_step_id) {
                        const matched = wfItem.steps.find((s: any) => s.id === act.next_step_id);
                        if (matched) targetStepNum = Number(matched.step) || null;
                    } else {
                        if (isReject && sIdx > 0) targetStepNum = 1;
                        else if (isApprove && sIdx < wfItem.steps.length - 1) targetStepNum = stepNum + 1;
                    }

                    if (targetStepNum === null || targetStepNum === stepNum) return;

                    const isRollback = targetStepNum < stepNum;
                    const isForward = targetStepNum > stepNum;
                    const targetNodeId = `wf-${wfItem.id}-step-${targetStepNum}`;

                    // Internal Forward Edge
                    if (isForward && showForwardRoutes) {
                        generatedEdges.push({
                            id: `edge-forward-${wfItem.id}-${stepNum}[${aIdx}]->${targetStepNum}`,
                            source: nodeId,
                            target: targetNodeId,
                            sourceHandle: `action-handle-right-${aIdx}`,
                            targetHandle: 'top-target',
                            type: 'smoothstep',
                            animated: animatedLines,
                            style: { stroke: '#10b981', strokeWidth: 2.5 },
                            markerEnd: {
                                type: MarkerType.ArrowClosed,
                                color: '#10b981',
                                width: 18,
                                height: 18,
                            },
                            label: showLabels ? (act?.alias || `Maju -> Step ${targetStepNum}`) : undefined,
                            labelStyle: { fill: '#047857', fontWeight: 500, fontSize: 10 },
                            labelBgStyle: { fill: '#ecfdf5', fillOpacity: 0.95, rx: 6, ry: 6 },
                            labelBgPadding: [6, 4],
                        });
                    }

                    // Internal Rollback Edge (Siku-Siku Multi-Lane)
                    if (isRollback && showRollbackRoutes) {
                        totalRollbacks++;
                        const currentLane = targetRollbackCountMap[targetStepNum] || 0;
                        targetRollbackCountMap[targetStepNum] = currentLane + 1;

                        generatedEdges.push({
                            id: `edge-rollback-${wfItem.id}-${stepNum}[${aIdx}]->${targetStepNum}`,
                            source: nodeId,
                            target: targetNodeId,
                            sourceHandle: `action-handle-left-${aIdx}`,
                            targetHandle: 'left-target',
                            type: 'orthogonalSikuRollbackEdge',
                            animated: animatedLines,
                            data: {
                                lane: currentLane,
                                laneSpacing,
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
                            label: showLabels ? (act?.alias || `Revisi -> Step ${targetStepNum}`) : undefined,
                        });
                    }
                });
            });
        });

        // 3. Buat Cross-Workflow Edges Menghubungkan Antar Workflow Container
        if (showCrossRoutes) {
            workflowsToRender.forEach((sourceWfItem) => {
                sourceWfItem.steps.forEach((step: any) => {
                    const stepNum = Number(step.step) || 1;
                    const sourceNodeId = `wf-${sourceWfItem.id}-step-${stepNum}`;

                    (step.actions || []).forEach((act: any, aIdx: number) => {
                        const tConfig = parseTransitionConfig(act);
                        const isCrossWf = tConfig?.type === 'cross_workflow' || Boolean(act?.next_workflow_id);

                        if (isCrossWf) {
                            totalCrossTransitions++;
                            const targetWfId = String(tConfig?.workflow_id || act.next_workflow_id || '');
                            const targetSeq = Number(tConfig?.sequence || 1);
                            const targetLookup = nodePositionMap.get(`${targetWfId}:${targetSeq}`);
                            const targetWf = (allWorkflows || []).find((w: any) => String(w.id) === targetWfId);

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
                                    label: showLabels ? (act?.alias || `Beralih -> ${targetWf?.name || 'Sub-Alur'} (Tahap ${targetSeq})`) : undefined,
                                    labelStyle: { fill: '#4338ca', fontWeight: 700, fontSize: 10 },
                                    labelBgStyle: { fill: '#e0e7ff', fillOpacity: 0.95, rx: 6, ry: 6 },
                                    labelBgPadding: [6, 4],
                                });
                            } else if (targetWfId) {
                                // Fallback jika target workflow belum berada dalam view rendering: buat kartu external mini
                                const crossFallbackId = `cross-fallback-${targetWfId}-${targetSeq}`;
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
                                            targetSequence: targetSeq,
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
                                    label: showLabels ? (act?.alias || `Beralih ke ${targetWf?.name || 'Sub-Alur'}`) : undefined,
                                    labelStyle: { fill: '#4338ca', fontWeight: 600, fontSize: 9.5 },
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
        viewMode,
        showForwardRoutes,
        showRollbackRoutes,
        showCrossRoutes,
        laneSpacing,
        animatedLines,
        showLabels,
        showUsers,
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

    const onNodesChange = useCallback((changes: any[]) => {
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
    }, [storageKey]);

    const resetLayoutPositions = useCallback(() => {
        setDragPositions({});
        if (typeof window !== 'undefined') {
            localStorage.removeItem(storageKey);
        }
    }, [storageKey]);

    return (
        <div className="flex flex-col h-[820px] w-full rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950 overflow-hidden shadow-xs font-sans">
            {/* Toolbar Header */}
            <div className="flex flex-wrap items-center justify-between border-b border-slate-200/80 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 px-4 py-2.5 backdrop-blur-md z-10 gap-3">
                <div className="flex items-center gap-2.5">
                    <div className="bg-primary/10 text-primary p-2 rounded-xl font-medium flex items-center justify-center">
                        <Network size={16} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-xs font-medium text-slate-900 dark:text-white flex items-center gap-1.5">
                                Diagram & Visualisasi Multi-Workflow
                            </h3>
                            <span className="px-2 py-0.5 rounded-full text-[9.5px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/80">
                                {layout.totalWorkflows} Workflow • {layout.totalSteps} Tahap • {layout.totalCrossTransitions} Lintas Alur
                            </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                            Peta visual alur persetujuan, sub-workflow modular, dan transisi lintas alur
                        </p>
                    </div>
                </div>

                {/* Interactive Toolbar Controls */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                    {/* View Mode Switcher (Connected / Show All / Single) */}
                    <div className="flex items-center bg-slate-100 dark:bg-zinc-800 p-0.5 rounded-xl border border-slate-200 dark:border-zinc-700">
                        <button
                            type="button"
                            onClick={() => setViewMode('connected')}
                            className={cn(
                                'px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all cursor-pointer flex items-center gap-1',
                                viewMode === 'connected'
                                    ? 'bg-indigo-600 text-white shadow-2xs font-semibold'
                                    : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200'
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
                                'px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all cursor-pointer flex items-center gap-1',
                                viewMode === 'all'
                                    ? 'bg-indigo-600 text-white shadow-2xs font-semibold'
                                    : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200'
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
                                'px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all cursor-pointer',
                                viewMode === 'single'
                                    ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-2xs font-semibold'
                                    : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200'
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
                        className="px-2.5 py-1.5 rounded-xl border text-[10px] font-medium transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-2xs bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:bg-slate-200 dark:hover:bg-zinc-700"
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
                            'px-2.5 py-1.5 rounded-xl border text-[10px] font-medium transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-2xs',
                            showUsers
                                ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                                : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 border-slate-200 dark:border-zinc-700 hover:text-slate-700 dark:hover:text-zinc-300'
                        )}
                        title="Tampilkan / Sembunyikan Personil Berhak Akses"
                    >
                        <UserCheck size={12} className={showUsers ? 'text-indigo-600 dark:text-indigo-400' : ''} />
                        <span>{showUsers ? 'Orang Aktif' : 'Sembunyikan Orang'}</span>
                    </button>

                    {/* Filter Rute Checkboxes (Independen: Maju, Rollback, Antar-Alur) */}
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl border border-slate-200 dark:border-zinc-700">
                        {/* Checkbox Rute Maju */}
                        <button
                            type="button"
                            onClick={() => setShowForwardRoutes(!showForwardRoutes)}
                            className={cn(
                                'px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all cursor-pointer flex items-center gap-1.5 select-none',
                                showForwardRoutes
                                    ? 'bg-emerald-500 text-white shadow-2xs font-semibold'
                                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200 opacity-60'
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
                                'px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all cursor-pointer flex items-center gap-1.5 select-none',
                                showRollbackRoutes
                                    ? 'bg-rose-500 text-white shadow-2xs font-semibold'
                                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200 opacity-60'
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
                                'px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all cursor-pointer flex items-center gap-1.5 select-none',
                                showCrossRoutes
                                    ? 'bg-indigo-600 text-white shadow-2xs font-semibold'
                                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200 opacity-60'
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
                            'p-1.5 rounded-xl border transition-all cursor-pointer',
                            animatedLines
                                ? 'bg-primary/10 text-primary border-primary/30'
                                : 'bg-slate-100 dark:bg-zinc-800 text-slate-400 border-slate-200 dark:border-zinc-700'
                        )}
                    >
                        <Sparkles size={13} />
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowLabels(!showLabels)}
                        title="Tampilkan / Sembunyikan Label Teks"
                        className={cn(
                            'p-1.5 rounded-xl border transition-all cursor-pointer',
                            showLabels
                                ? 'bg-primary/10 text-primary border-primary/30'
                                : 'bg-slate-100 dark:bg-zinc-800 text-slate-400 border-slate-200 dark:border-zinc-700'
                        )}
                    >
                        {showLabels ? <Eye size={13} /> : <EyeOff size={13} />}
                    </button>
                </div>
            </div>

            {/* React Flow Canvas */}
            <div className="flex-1 w-full h-full relative">
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
                    <Controls className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-md overflow-hidden text-slate-700 dark:text-zinc-300" />
                    <MiniMap
                        nodeStrokeColor="#0284c7"
                        nodeColor="#f1f5f9"
                        nodeBorderRadius={8}
                        className="bg-white/80 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-md"
                    />
                </ReactFlow>
            </div>
        </div>
    );
}

export default WorkflowFlowVisualizer;
