import React, { useMemo, useState } from 'react';
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
    ShieldCheck,
    Briefcase,
    Eye,
    EyeOff,
    Sparkles,
    GitCommit,
    Layers,
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

    // Hitung koridor X horizontal terpisah untuk setiap garis agar selalu sejajar siku & tidak tumpang tindih
    const outX = sourceX - (36 + lane * laneSpacing);

    // SVG Path Siku 90 derajat dengan radius sudut halus
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
                        <div className="flex items-center gap-1 rounded-md border border-rose-300 dark:border-rose-900 bg-white/95 dark:bg-zinc-900/95 px-2 py-0.5 text-[9px] font-bold text-rose-700 dark:text-rose-300 shadow-xs whitespace-nowrap backdrop-blur-xs">
                            <CornerUpLeft size={10} className="text-rose-500" />
                            <span>{label}</span>
                        </div>
                    </div>
                </EdgeLabelRenderer>
            )}
        </>
    );
};

// --- Custom Step Node Component ---
const CustomStepNode = ({ data, selected }: NodeProps) => {
    const { step, isFirst, isLast } = data as any;
    const approverType = step?.approver_type || 'role';
    const appStyle = APPROVER_TYPE_STYLES[approverType] || {
        label: String(approverType).toUpperCase(),
        badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200',
        borderClass: 'border-l-slate-400',
    };

    const targetStatus = step?.meta?.target_status || (isLast ? 'archived' : isFirst ? 'draft' : 'in_review');

    // Parse role/authority details
    const roleNames: string[] = [];
    if (Array.isArray(step?.role)) {
        step.role.forEach((r: any) => {
            if (typeof r === 'string' && r.trim()) roleNames.push(r.trim());
            else if (r && typeof r === 'object' && r.name) roleNames.push(r.name);
        });
    } else if (Array.isArray(step?.approver_config?.roles)) {
        step.approver_config.roles.forEach((r: any) => {
            if (typeof r === 'string' && r.trim()) roleNames.push(r.trim());
        });
    }

    let roleDetailText = '';
    if (approverType === 'initiator') {
        roleDetailText = 'Inisiator Dokumen';
    } else if (approverType === 'assigned_pic') {
        roleDetailText = 'PIC Legal yang Ditugaskan';
    } else if (approverType === 'creator') {
        roleDetailText = 'Pembuat Draft (Creator)';
    } else if (roleNames.length > 0) {
        roleDetailText = roleNames.join(', ');
    } else {
        roleDetailText = appStyle.label;
    }

    // Parse reject rollback target
    const rejectAction = (step?.actions || []).find((a: any) => {
        const c = getActionCode(a).toLowerCase();
        return c === 'reject' || c.includes('tolak');
    });

    let rollbackTargetLabel = 'Step 1 (Inisiator)';
    if (rejectAction) {
        const config = parseTransitionConfig(rejectAction);
        if (config) {
            if (config.type === 'absolute') {
                rollbackTargetLabel = `Step ${config.sequence || 1}`;
            } else if (config.type === 'relative') {
                const seq = Math.max(1, (Number(step?.step) || 1) + (Number(config.offset) || -1));
                rollbackTargetLabel = `Step ${seq}`;
            }
        }
    }

    return (
        <div
            className={cn(
                'w-[310px] rounded-xl border bg-white dark:bg-zinc-900 shadow-md transition-all font-sans select-none',
                selected
                    ? 'border-primary ring-2 ring-primary/40 shadow-xl scale-102'
                    : 'border-slate-200/90 dark:border-zinc-800 hover:border-slate-400 dark:hover:border-zinc-700',
                isFirst && 'border-t-4 border-t-emerald-500',
                isLast && 'border-t-4 border-t-purple-500',
                !isFirst && !isLast && 'border-t-4 border-t-blue-500'
            )}
        >
            {/* Top Target Handle (Incoming Forward Flow) */}
            <Handle
                type="target"
                position={Position.Top}
                id="top-target"
                className="!h-3.5 !w-3.5 !rounded-full !border-2 !border-white !bg-slate-600 dark:!border-zinc-900"
            />
            {/* Left Target Handle (Incoming Rollback Target) */}
            <Handle
                type="target"
                position={Position.Left}
                id="left-target"
                className="!h-3.5 !w-3.5 !rounded-full !border-2 !border-white !bg-rose-500 dark:!border-zinc-900"
            />

            {/* Card Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800/80 px-3.5 py-2.5 bg-slate-50/70 dark:bg-zinc-900/70 rounded-t-lg">
                <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white text-[10px] font-bold shadow-xs">
                        {step?.step || 1}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-200">
                        {isFirst ? 'Start / Inisiasi' : isLast ? 'Final / Selesai' : `Tahapan ${step?.step || 1}`}
                    </span>
                </div>

                <span
                    className={cn(
                        'rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider',
                        targetStatus === 'draft' && 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200',
                        targetStatus === 'in_review' && 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200',
                        targetStatus === 'archived' && 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200'
                    )}
                >
                    {targetStatus}
                </span>
            </div>

            {/* Card Body */}
            <div className="p-3.5 space-y-2.5">
                <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug line-clamp-2">
                        {step?.description || step?.label || `Tahap ${step?.step || 1}`}
                    </h4>
                    {step?.label && step?.description && step.label !== step.description && (
                        <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5 truncate">
                            {step.label}
                        </p>
                    )}
                </div>

                {/* Approver Type & Role Badge */}
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                    <span className={cn('inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-semibold border shadow-2xs', appStyle.badgeClass)}>
                        <Users size={11} />
                        {appStyle.label}
                    </span>

                    {roleDetailText && (
                        <span className="inline-flex items-center gap-1 rounded bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 px-2 py-0.5 text-[10px] font-medium border border-slate-200/60 dark:border-zinc-700/60 truncate max-w-[180px]">
                            <Briefcase size={10} className="text-slate-400" />
                            {roleDetailText}
                        </span>
                    )}
                </div>

                {/* Available Actions in this Step */}
                <div className="border-t border-slate-100 dark:border-zinc-800 pt-2 flex flex-wrap gap-1.5 items-center">
                    {(step?.actions || []).map((act: any, aIdx: number) => {
                        const rawCode = getActionCode(act);
                        const codeLower = rawCode.toLowerCase();
                        const isApprove = codeLower === 'approve' || codeLower.includes('setuju');
                        const isReject = codeLower === 'reject' || codeLower.includes('tolak');
                        const isAssign = codeLower === 'assign' || codeLower.includes('tugas');
                        const isSign = codeLower === 'signature' || codeLower === 'sign' || codeLower.includes('tanda tangan');

                        const displayLabel = isReject
                            ? `Tolak -> ${rollbackTargetLabel}`
                            : act?.alias || act?.label || act?.name || (rawCode ? rawCode.toUpperCase() : `AKSI ${aIdx + 1}`);

                        return (
                            <span
                                key={aIdx}
                                className={cn(
                                    'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold shadow-2xs',
                                    isApprove && 'bg-emerald-100/80 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200/60',
                                    isReject && 'bg-rose-100/80 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200/60',
                                    isAssign && 'bg-blue-100/80 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200/60',
                                    isSign && 'bg-purple-100/80 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-200/60',
                                    !isApprove && !isReject && !isAssign && !isSign && 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 border border-slate-200'
                                )}
                            >
                                {isApprove && <CheckCircle2 size={10} />}
                                {isReject && <CornerUpLeft size={10} />}
                                {isAssign && <UserCheck size={10} />}
                                {isSign && <PenTool size={10} />}
                                {displayLabel}
                            </span>
                        );
                    })}
                </div>
            </div>

            {/* Bottom Source Handle (Outgoing Forward Flow) */}
            <Handle
                type="source"
                position={Position.Bottom}
                id="bottom-source"
                className="!h-3.5 !w-3.5 !rounded-full !border-2 !border-white !bg-emerald-500 dark:!border-zinc-900"
            />
            {/* Left Source Handle (Outgoing Rollback Flow) */}
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
    workflowStepNode: CustomStepNode,
};

const edgeTypes = {
    orthogonalSikuRollbackEdge: OrthogonalSikuRollbackEdge,
};

interface WorkflowFlowVisualizerProps {
    steps: any[];
    workflow?: any;
}

export function WorkflowFlowVisualizer({ steps = [], workflow }: WorkflowFlowVisualizerProps) {
    // --- Layout & Route Display Settings ---
    const [routeFilter, setRouteFilter] = useState<'all' | 'forward_only' | 'rollback_only'>('all');
    const [laneSpacing, setLaneSpacing] = useState<number>(30); // px antar lajur siku
    const [animatedLines, setAnimatedLines] = useState<boolean>(true);
    const [showLabels, setShowLabels] = useState<boolean>(true);

    const sortedSteps = useMemo(() => {
        return [...steps].sort((a, b) => (Number(a.step) || 0) - (Number(b.step) || 0));
    }, [steps]);

    // Build Nodes & Edges with Clean Siku-Siku Staggered Multi-Lanes
    const { nodes, edges, rollbackCount } = useMemo(() => {
        const generatedNodes: Node[] = [];
        const generatedEdges: Edge[] = [];
        let rollbacks = 0;

        const NODE_HEIGHT = 160;
        const VERTICAL_GAP = 95;
        const START_X = 420; // Ruang lapang di sebelah kiri untuk lajur-lajur siku bertingkat
        const START_Y = 40;

        // Map untuk menghitung lajur rollback per step target
        const targetRollbackCountMap: Record<number, number> = {};

        sortedSteps.forEach((step, index) => {
            const stepNum = Number(step.step) || index + 1;
            const nodeId = `step-${stepNum}`;

            // Posisi node vertikal teratur
            const x = START_X;
            const y = START_Y + index * (NODE_HEIGHT + VERTICAL_GAP);

            generatedNodes.push({
                id: nodeId,
                type: 'workflowStepNode',
                position: { x, y },
                data: {
                    step,
                    totalSteps: sortedSteps.length,
                    isFirst: index === 0,
                    isLast: index === sortedSteps.length - 1,
                },
            });

            // 1. Jalur Maju (Approve / Maju ke Tahap Berikutnya - Siku Lurus Vertikal)
            if (routeFilter !== 'rollback_only' && index < sortedSteps.length - 1) {
                const nextStep = sortedSteps[index + 1];
                const nextStepNum = Number(nextStep.step) || index + 2;
                const nextNodeId = `step-${nextStepNum}`;

                generatedEdges.push({
                    id: `edge-forward-${stepNum}->${nextStepNum}`,
                    source: nodeId,
                    target: nextNodeId,
                    sourceHandle: 'bottom-source',
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
                    label: showLabels ? 'Setujui (Maju)' : undefined,
                    labelStyle: { fill: '#047857', fontWeight: 700, fontSize: 10 },
                    labelBgStyle: { fill: '#ecfdf5', fillOpacity: 0.95, rx: 6, ry: 6 },
                    labelBgPadding: [6, 4],
                });
            }

            // 2. Jalur Mundur (Reject / Rollback - Siku 90 Derajat Berjenjang Tanpa Tumpang Tindih)
            if (routeFilter !== 'forward_only') {
                const rejectAction = (step?.actions || []).find((a: any) => {
                    const c = getActionCode(a).toLowerCase();
                    return c === 'reject' || c.includes('tolak');
                });

                if (rejectAction) {
                    let targetStepNum = 1; // Default rollback ke Step 1 (Inisiator)
                    const config = parseTransitionConfig(rejectAction);

                    if (config) {
                        if (config.type === 'absolute' && config.sequence) {
                            targetStepNum = Number(config.sequence);
                        } else if (config.type === 'relative') {
                            targetStepNum = Math.max(1, stepNum + (Number(config.offset) || -1));
                        }
                    } else if (rejectAction.next_step_id) {
                        const matchedStep = sortedSteps.find((s) => s.id === rejectAction.next_step_id);
                        if (matchedStep) {
                            targetStepNum = Number(matchedStep.step) || 1;
                        }
                    }

                    // Hanya gambar jika target mundur sebelum step saat ini
                    if (targetStepNum < stepNum) {
                        rollbacks++;
                        const targetNodeId = `step-${targetStepNum}`;

                        // Berikan indeks lajur terpisah agar garis vertikal siku tidak saling menimpa
                        const currentLane = targetRollbackCountMap[targetStepNum] || 0;
                        targetRollbackCountMap[targetStepNum] = currentLane + 1;

                        generatedEdges.push({
                            id: `edge-rollback-${stepNum}->${targetStepNum}`,
                            source: nodeId,
                            target: targetNodeId,
                            sourceHandle: 'left-source',
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
                            label: showLabels ? `Revisi -> Step ${targetStepNum}` : undefined,
                        });
                    }
                }
            }
        });

        return { nodes: generatedNodes, edges: generatedEdges, rollbackCount: rollbacks };
    }, [sortedSteps, routeFilter, laneSpacing, animatedLines, showLabels]);

    return (
        <div className="flex flex-col h-[780px] w-full rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950 overflow-hidden shadow-xs font-sans">
            {/* Toolbar / Settings Header */}
            <div className="flex flex-wrap items-center justify-between border-b border-slate-200/80 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 px-4 py-2.5 backdrop-blur-md z-10 gap-3">
                <div className="flex items-center gap-2.5">
                    <div className="bg-primary/10 text-primary p-2 rounded-xl font-bold flex items-center justify-center">
                        <Activity size={16} />
                    </div>
                    <div>
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            Visualisasi Alur Kerja Siku-Siku (Orthogonal Multi-Lanes)
                        </h3>
                        <p className="text-[10px] text-slate-500 dark:text-zinc-400">
                            Garis maju lurus vertikal & garis mundur siku-siku 90° berjenjang tanpa tumpang tindih
                        </p>
                    </div>
                </div>

                {/* Interactive Settings Bar */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                    {/* Filter Route Toggle */}
                    <div className="flex items-center bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl border border-slate-200 dark:border-zinc-700">
                        <button
                            type="button"
                            onClick={() => setRouteFilter('all')}
                            className={cn(
                                'px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer',
                                routeFilter === 'all'
                                    ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-xs'
                                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200'
                            )}
                        >
                            Semua Rute
                        </button>
                        <button
                            type="button"
                            onClick={() => setRouteFilter('forward_only')}
                            className={cn(
                                'px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer',
                                routeFilter === 'forward_only'
                                    ? 'bg-emerald-500 text-white shadow-xs'
                                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200'
                            )}
                        >
                            Maju Saja
                        </button>
                        <button
                            type="button"
                            onClick={() => setRouteFilter('rollback_only')}
                            className={cn(
                                'px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer',
                                routeFilter === 'rollback_only'
                                    ? 'bg-rose-500 text-white shadow-xs'
                                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200'
                            )}
                        >
                            Rollback Saja
                        </button>
                    </div>

                    {/* Lane Spacing Controller */}
                    <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-zinc-800 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-zinc-700 text-[10px] font-semibold text-slate-600 dark:text-zinc-300">
                        <span>Jarak Siku:</span>
                        {[
                            { label: 'Rapat', val: 22 },
                            { label: 'Ideal', val: 30 },
                            { label: 'Lebar', val: 42 },
                        ].map((sp) => (
                            <button
                                key={sp.val}
                                type="button"
                                onClick={() => setLaneSpacing(sp.val)}
                                className={cn(
                                    'px-1.5 py-0.5 rounded cursor-pointer transition-colors',
                                    laneSpacing === sp.val
                                        ? 'bg-primary text-white font-bold'
                                        : 'hover:bg-slate-200 dark:hover:bg-zinc-700'
                                )}
                            >
                                {sp.label}
                            </button>
                        ))}
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
                    nodeTypes={nodeTypes}
                    edgeTypes={edgeTypes}
                    fitView
                    fitViewOptions={{ padding: 0.3 }}
                    minZoom={0.2}
                    maxZoom={1.5}
                >
                    <Background variant={BackgroundVariant.Dots} gap={18} size={1.2} color="#94a3b8" />
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
