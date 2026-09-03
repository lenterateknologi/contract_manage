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
    useNodesState,
    useEdgesState,
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
        isFirst,
        isLast,
        showUsers = true,
        eligibleUsers = [],
        dynamicRoles = [],
        criteriaSummary = '',
    } = data as any;

    const [isUsersExpanded, setIsUsersExpanded] = useState(false);

    const approverType = step?.approver_type || 'role';
    const targetStatus = step?.meta?.target_status || (isLast ? 'archived' : isFirst ? 'draft' : 'in_review');

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
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800/80 px-3.5 py-2 bg-slate-50/70 dark:bg-zinc-900/70 rounded-t-lg">
                <div className="flex items-center gap-1.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-primary text-white text-[10px] font-medium shadow-2xs">
                        {step?.step || 1}
                    </span>
                    <span className="text-[10px] font-medium uppercase tracking-wider text-slate-700 dark:text-zinc-200">
                        {isFirst ? 'Start / Inisiasi' : isLast ? 'Final / Selesai' : `Tahapan ${step?.step || 1}`}
                    </span>
                </div>

                <div className="flex items-center gap-1.5">
                    <span
                        className={cn(
                            'rounded-md px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider',
                            targetStatus === 'draft' && 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/60',
                            targetStatus === 'in_review' && 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200/60',
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

                {/* Section Daftar Orang / Personil Berhak Akses (Bisa di-toggle Show/Hide) */}
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

                        {/* Dynamic Roles Info (Inisiator/PIC/Creator) */}
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
                <div className="border-t border-slate-100 dark:border-zinc-800 pt-2 flex flex-wrap gap-1 items-center nodrag">
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
                                    'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-medium shadow-2xs',
                                    isApprove && 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60',
                                    isReject && 'bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/60',
                                    isAssign && 'bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60',
                                    isSign && 'bg-purple-50 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/60',
                                    !isApprove && !isReject && !isAssign && !isSign && 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 border border-slate-200'
                                )}
                            >
                                {isApprove && <CheckCircle2 size={9} />}
                                {isReject && <CornerUpLeft size={9} />}
                                {isAssign && <UserCheck size={9} />}
                                {isSign && <PenTool size={9} />}
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
    // --- Layout & Route Display Settings ---
    const [routeFilter, setRouteFilter] = useState<'all' | 'forward_only' | 'rollback_only'>('all');
    const [laneSpacing, setLaneSpacing] = useState<number>(30); // px antar lajur siku
    const [animatedLines, setAnimatedLines] = useState<boolean>(true);
    const [showLabels, setShowLabels] = useState<boolean>(true);
    const [showUsers, setShowUsers] = useState<boolean>(true); // Toggle Show/Hide Personil List

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

    const sortedSteps = useMemo(() => {
        return [...steps].sort((a, b) => (Number(a.step) || 0) - (Number(b.step) || 0));
    }, [steps]);

    // Helper untuk menganalisis pengguna berhak akses per tahapan
    const calculateStepUsers = useCallback((step: any) => {
        const matchedUsersMap = new Map<string, { user: any; reasons: string[] }>();
        const dynamicList: { type: string; label: string; description: string; activeUser?: any }[] = [];
        const criteriaParts: string[] = [];

        const authorities: any[] = step.approver_authorities || [];
        const cfg = step.approver_config || {};

        if (authorities && authorities.length > 0) {
            authorities.forEach((auth: any) => {
                if (auth.authority_type === 'custom') {
                    const customType = auth.role_id || auth.user_id || auth.authority_type;
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
        } else {
            const customActors = cfg.custom || (['initiator', 'assigned_pic', 'creator'].includes(step.approver_type) ? [step.approver_type] : []);
            const explicitUsers = cfg.users && cfg.users.length > 0 
                ? cfg.users 
                : (step.approver_type === 'user' ? (step.user_ids || []) : []);
            const targetRoles: string[] = cfg.roles && cfg.roles.length > 0 
                ? cfg.roles 
                : (step.approver_type === 'role' ? (step.role || []) : []);
            const targetDepts: string[] = cfg.departments && cfg.departments.length > 0 
                ? cfg.departments 
                : (step.approver_type === 'role' ? (step.department_ids || []) : []);

            const hasAnyConfig = customActors.length > 0 || explicitUsers.length > 0 || targetRoles.length > 0 || targetDepts.length > 0;

            if (hasAnyConfig) {
                if (customActors.includes('initiator') && simInitiatorUser) {
                    const deptName = departments.find((d: any) => String(d.id) === String(simInitiatorUser.department_id))?.name;
                    matchedUsersMap.set(String(simInitiatorUser.id), {
                        user: { ...simInitiatorUser, department_name: deptName },
                        reasons: ['Inisiator'],
                    });
                }
                if (customActors.includes('assigned_pic') && simPicUser) {
                    const deptName = departments.find((d: any) => String(d.id) === String(simPicUser.department_id))?.name;
                    matchedUsersMap.set(String(simPicUser.id), {
                        user: { ...simPicUser, department_name: deptName },
                        reasons: ['PIC Ditugaskan'],
                    });
                }
                if (customActors.includes('creator') && simCreatorUser) {
                    const deptName = departments.find((d: any) => String(d.id) === String(simCreatorUser.department_id))?.name;
                    matchedUsersMap.set(String(simCreatorUser.id), {
                        user: { ...simCreatorUser, department_name: deptName },
                        reasons: ['Pembuat Kontrak'],
                    });
                }
                if (explicitUsers.length > 0) {
                    explicitUsers.forEach((userId: any) => {
                        const u = users.find((user: any) => String(user.id) === String(userId));
                        if (u) {
                            const deptName = departments.find((d: any) => String(d.id) === String(u.department_id))?.name;
                            matchedUsersMap.set(String(u.id), {
                                user: { ...u, department_name: deptName },
                                reasons: ['User Spesifik'],
                            });
                        }
                    });
                }
                if (targetRoles.length > 0 || targetDepts.length > 0) {
                    users.forEach((u: any) => {
                        let roleMatch = targetRoles.length === 0;
                        let deptMatch = targetDepts.length === 0;

                        if (targetRoles.length > 0) {
                            const userRole = (u.role || '').toLowerCase();
                            roleMatch = targetRoles.some((r: string) => userRole === r.toLowerCase());
                        }

                        if (targetDepts.length > 0) {
                            const uDeptId = String(u.department_id || u.division_id || '');
                            deptMatch = targetDepts.some((dId: string) => String(dId) === uDeptId);
                        }

                        if (roleMatch && deptMatch) {
                            const deptName = departments.find((d: any) => String(d.id) === String(u.department_id))?.name;
                            matchedUsersMap.set(String(u.id), {
                                user: { ...u, department_name: deptName },
                                reasons: ['Role/Divisi Sesuai'],
                            });
                        }
                    });
                }
            }
        }

        return {
            eligibleUsers: Array.from(matchedUsersMap.values()),
            dynamicRoles: dynamicList,
            criteriaSummary: criteriaParts.join(' • ') || '—',
        };
    }, [
        departments,
        roles,
        users,
        simInitiatorUser,
        simPicUser,
        simCreatorUser,
    ]);

    // Generator Node & Edge Layout
    const generateLayout = useCallback(() => {
        const generatedNodes: Node[] = [];
        const generatedEdges: Edge[] = [];
        let rollbacks = 0;

        const NODE_HEIGHT = showUsers ? 220 : 160;
        const VERTICAL_GAP = 95;
        const START_X = 420;
        const START_Y = 40;

        const targetRollbackCountMap: Record<number, number> = {};

        sortedSteps.forEach((step, index) => {
            const stepNum = Number(step.step) || index + 1;
            const nodeId = `step-${stepNum}`;

            const x = START_X;
            const y = START_Y + index * (NODE_HEIGHT + VERTICAL_GAP);

            const { eligibleUsers, dynamicRoles, criteriaSummary } = calculateStepUsers(step);

            generatedNodes.push({
                id: nodeId,
                type: 'workflowStepNode',
                position: { x, y },
                data: {
                    step,
                    totalSteps: sortedSteps.length,
                    isFirst: index === 0,
                    isLast: index === sortedSteps.length - 1,
                    showUsers,
                    eligibleUsers,
                    dynamicRoles,
                    criteriaSummary,
                },
            });

            // 1. Jalur Maju (Approve)
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
                    labelStyle: { fill: '#047857', fontWeight: 500, fontSize: 10 },
                    labelBgStyle: { fill: '#ecfdf5', fillOpacity: 0.95, rx: 6, ry: 6 },
                    labelBgPadding: [6, 4],
                });
            }

            // 2. Jalur Mundur (Rollback)
            if (routeFilter !== 'forward_only') {
                const rejectAction = (step?.actions || []).find((a: any) => {
                    const c = getActionCode(a).toLowerCase();
                    return c === 'reject' || c.includes('tolak');
                });

                if (rejectAction) {
                    let targetStepNum = 1;
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

                    if (targetStepNum < stepNum) {
                        rollbacks++;
                        const targetNodeId = `step-${targetStepNum}`;

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
    }, [
        sortedSteps,
        routeFilter,
        laneSpacing,
        animatedLines,
        showLabels,
        showUsers,
        calculateStepUsers,
    ]);

    const initialLayout = useMemo(() => generateLayout(), [generateLayout]);

    // React Flow State for Draggable nodes & edges
    const [nodes, setNodes, onNodesChange] = useNodesState(initialLayout.nodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialLayout.edges);

    // Sync when steps, showUsers, or routeFilter change
    useEffect(() => {
        const layout = generateLayout();
        setNodes((currentNodes) => {
            const currentPositionMap = new Map(currentNodes.map((n) => [n.id, n.position]));
            return layout.nodes.map((n) => ({
                ...n,
                position: currentPositionMap.get(n.id) || n.position,
            }));
        });
        setEdges(layout.edges);
    }, [generateLayout, setNodes, setEdges]);

    // Reset posisi kembali ke layout rapi
    const resetLayoutPositions = useCallback(() => {
        const layout = generateLayout();
        setNodes(layout.nodes);
        setEdges(layout.edges);
    }, [generateLayout, setNodes, setEdges]);

    return (
        <div className="flex flex-col h-[780px] w-full rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950 overflow-hidden shadow-xs font-sans">
            {/* Toolbar / Settings Header */}
            <div className="flex flex-wrap items-center justify-between border-b border-slate-200/80 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 px-4 py-2.5 backdrop-blur-md z-10 gap-3">
                <div className="flex items-center gap-2.5">
                    <div className="bg-primary/10 text-primary p-2 rounded-xl font-medium flex items-center justify-center">
                        <Activity size={16} />
                    </div>
                    <div>
                        <h3 className="text-xs font-medium text-slate-900 dark:text-white flex items-center gap-1.5">
                            Diagram Alur Kerja
                        </h3>
                        <p className="text-[10px] text-muted-foreground">
                            Peta visual tahapan proses persetujuan dan alur pengembalian revisi
                        </p>
                    </div>
                </div>

                {/* Interactive Settings Bar */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                    {/* Reset / Rapikan Posisi Button */}
                    <button
                        type="button"
                        onClick={resetLayoutPositions}
                        className="px-2.5 py-1.5 rounded-xl border text-[10px] font-medium transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-2xs bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:bg-slate-200 dark:hover:bg-zinc-700"
                        title="Rapikan posisi kartu kembali ke susunan awal"
                    >
                        <RotateCcw size={12} />
                        <span>Rapikan Posisi</span>
                    </button>

                    {/* Toggle Show/Hide Personil List */}
                    <button
                        type="button"
                        onClick={() => setShowUsers(!showUsers)}
                        className={cn(
                            'px-2.5 py-1.5 rounded-xl border text-[10px] font-medium transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-2xs',
                            showUsers
                                ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                                : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 border-slate-200 dark:border-zinc-700 hover:text-slate-700 dark:hover:text-zinc-300'
                        )}
                        title="Tampilkan / Sembunyikan Personil Berhak Akses pada setiap Node"
                    >
                        <UserCheck size={12} className={showUsers ? 'text-indigo-600 dark:text-indigo-400' : ''} />
                        <span>{showUsers ? 'Sembunyikan Orang' : 'Tampilkan Orang'}</span>
                    </button>

                    {/* Filter Route Toggle */}
                    <div className="flex items-center bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl border border-slate-200 dark:border-zinc-700">
                        <button
                            type="button"
                            onClick={() => setRouteFilter('all')}
                            className={cn(
                                'px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all cursor-pointer',
                                routeFilter === 'all'
                                    ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-2xs'
                                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200'
                            )}
                        >
                            Semua Rute
                        </button>
                        <button
                            type="button"
                            onClick={() => setRouteFilter('forward_only')}
                            className={cn(
                                'px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all cursor-pointer',
                                routeFilter === 'forward_only'
                                    ? 'bg-emerald-500 text-white shadow-2xs'
                                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200'
                            )}
                        >
                            Maju Saja
                        </button>
                        <button
                            type="button"
                            onClick={() => setRouteFilter('rollback_only')}
                            className={cn(
                                'px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all cursor-pointer',
                                routeFilter === 'rollback_only'
                                    ? 'bg-rose-500 text-white shadow-2xs'
                                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200'
                            )}
                        >
                            Rollback Saja
                        </button>
                    </div>

                    {/* Lane Spacing Controller */}
                    <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-zinc-800 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-zinc-700 text-[10px] font-medium text-slate-600 dark:text-zinc-300">
                        <span>Jarak Jalur:</span>
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
                                        ? 'bg-primary text-white font-medium'
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
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    nodesDraggable={true}
                    nodesConnectable={false}
                    elementsSelectable={true}
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
