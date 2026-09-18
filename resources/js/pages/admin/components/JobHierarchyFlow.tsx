import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    Handle,
    Position,
    Node,
    Edge,
    BackgroundVariant,
    NodeProps,
    MarkerType,
    ReactFlowInstance,
    getNodesBounds,
    getViewportForBounds,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { toPng } from 'html-to-image';
import {
    Briefcase,
    Layers,
    Tags,
    Users,
    ChevronRight,
    Search,
    SlidersHorizontal,
    UserCheck,
    Mail,
    IdCard,
    X,
    Filter,
    Check,
    User as UserIcon,
    ChevronDown,
    RotateCcw,
    ChevronUp,
    Crosshair,
    Download,
    Building2,
    Shield,
    Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { HierarchyUser } from './OrgHierarchyFlow';

interface MasterItem {
    id: string;
    name: string;
    code?: string;
    job_level_id?: string;
    job_level_group_id?: string;
    group_name?: string;
    is_used?: boolean;
}

interface Props {
    users: HierarchyUser[];
    masterJobLevelGroups?: MasterItem[];
    masterJobLevels?: MasterItem[];
    masterJobTitles?: MasterItem[];
    masterCompanies?: MasterItem[];
    masterDepartments?: MasterItem[];
}

type JobLevelKey = 'job_level_group' | 'job_level' | 'job_title' | 'user';

// Custom Node Components
const JobLevelGroupNode = ({ data }: NodeProps) => {
    const isExpanded = data.isExpanded !== false;
    const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

    return (
        <div className={cn(
            "relative px-4 py-3 rounded-xl border shadow-lg transition-all min-w-[280px] max-w-[340px]",
            isDark 
                ? "bg-gradient-to-br from-indigo-950/80 via-slate-900/90 to-slate-950 border-indigo-500/40 text-slate-100 shadow-indigo-950/40" 
                : "bg-gradient-to-br from-indigo-50 via-white to-indigo-50/30 border-indigo-200 text-slate-900 shadow-indigo-100"
        )}>
            <Handle type="target" position={Position.Top} className="!bg-indigo-500 !w-3 !h-3 !-top-1.5" />
            
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                        <Layers className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div>
                        <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
                            GROUP LEVEL
                        </span>
                        <h4 className="font-bold text-sm tracking-tight mt-1 line-clamp-1">
                            {String(data.label || 'Group Level')}
                        </h4>
                    </div>
                </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-indigo-500/10 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1">
                    <Tags className="w-3.5 h-3.5 text-indigo-400" />
                    {Number(data.levelsCount || 0)} Level
                </span>
                <span className="flex items-center gap-1 font-semibold text-indigo-400">
                    <Users className="w-3.5 h-3.5" />
                    {Number(data.usersCount || 0)} Karyawan
                </span>
            </div>

            {Boolean(data.hasChildren) && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (typeof data.onToggle === 'function') (data.onToggle as () => void)();
                    }}
                    className="absolute -bottom-3 left-1/2 -translate-x-1/2 p-1 rounded-full bg-indigo-600 text-white shadow-md hover:bg-indigo-500 transition-colors z-10"
                    title={isExpanded ? "Collapse" : "Expand"}
                >
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
            )}

            <Handle type="source" position={Position.Bottom} className="!bg-indigo-500 !w-3 !h-3 !-bottom-1.5" />
        </div>
    );
};

const JobLevelNode = ({ data }: NodeProps) => {
    const isExpanded = data.isExpanded !== false;
    const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

    return (
        <div className={cn(
            "relative px-4 py-3 rounded-xl border shadow-md transition-all min-w-[260px] max-w-[320px]",
            isDark 
                ? "bg-gradient-to-br from-purple-950/70 via-slate-900/90 to-slate-950 border-purple-500/30 text-slate-100" 
                : "bg-gradient-to-br from-purple-50/80 via-white to-purple-50/20 border-purple-200 text-slate-900 shadow-purple-50"
        )}>
            <Handle type="target" position={Position.Top} className="!bg-purple-500 !w-3 !h-3 !-top-1.5" />

            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">
                        <Tags className="w-4 h-4 text-purple-500" />
                    </div>
                    <div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-400 border border-purple-500/20">
                                {String(data.code || 'GRADE')}
                            </span>
                        </div>
                        <h4 className="font-semibold text-xs tracking-tight mt-1 line-clamp-1">
                            {String(data.label || 'Job Level')}
                        </h4>
                    </div>
                </div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-purple-500/10 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                    <Briefcase className="w-3 h-3 text-purple-400" />
                    {Number(data.titlesCount || 0)} Posisi
                </span>
                <span className="flex items-center gap-1 font-medium text-purple-400">
                    <Users className="w-3 h-3" />
                    {Number(data.usersCount || 0)} Orang
                </span>
            </div>

            {Boolean(data.hasChildren) && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (typeof data.onToggle === 'function') (data.onToggle as () => void)();
                    }}
                    className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 p-0.5 rounded-full bg-purple-600 text-white shadow hover:bg-purple-500 transition-colors z-10"
                >
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
            )}

            <Handle type="source" position={Position.Bottom} className="!bg-purple-500 !w-3 !h-3 !-bottom-1.5" />
        </div>
    );
};

const JobTitleNode = ({ data }: NodeProps) => {
    const isExpanded = data.isExpanded !== false;
    const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

    return (
        <div className={cn(
            "relative px-3.5 py-2.5 rounded-xl border shadow-sm transition-all min-w-[240px] max-w-[300px]",
            isDark 
                ? "bg-gradient-to-br from-cyan-950/60 via-slate-900/90 to-slate-950 border-cyan-500/30 text-slate-100" 
                : "bg-gradient-to-br from-cyan-50/70 via-white to-cyan-50/20 border-cyan-200 text-slate-900 shadow-cyan-50"
        )}>
            <Handle type="target" position={Position.Top} className="!bg-cyan-500 !w-2.5 !h-2.5 !-top-1.5" />

            <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                    <Briefcase className="w-3.5 h-3.5 text-cyan-500" />
                </div>
                <div className="min-w-0 flex-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-cyan-500">
                        POSISI / JABATAN
                    </span>
                    <h5 className="font-semibold text-xs truncate leading-tight mt-0.5">
                        {String(data.label || 'Job Title')}
                    </h5>
                </div>
            </div>

            <div className="mt-2 pt-1.5 border-t border-cyan-500/10 flex items-center justify-between text-[11px] text-slate-400">
                <span className="truncate max-w-[140px] text-[10px]">
                    {String(data.code || '')}
                </span>
                <span className="font-semibold text-cyan-400 flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {Number(data.usersCount || 0)} Orang
                </span>
            </div>

            {Boolean(data.hasChildren) && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (typeof data.onToggle === 'function') (data.onToggle as () => void)();
                    }}
                    className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 p-0.5 rounded-full bg-cyan-600 text-white shadow hover:bg-cyan-500 transition-colors z-10"
                >
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
            )}

            <Handle type="source" position={Position.Bottom} className="!bg-cyan-500 !w-2.5 !h-2.5 !-bottom-1.5" />
        </div>
    );
};

const UserNode = ({ data }: NodeProps) => {
    const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
    const user = data.user as HierarchyUser | undefined;

    return (
        <div className={cn(
            "px-3 py-2 rounded-lg border shadow-sm transition-all min-w-[220px] max-w-[270px]",
            isDark 
                ? "bg-slate-900/90 border-slate-700/60 text-slate-100 hover:border-slate-500" 
                : "bg-white border-slate-200 text-slate-800 hover:border-slate-300 shadow-slate-100"
        )}>
            <Handle type="target" position={Position.Top} className="!bg-emerald-500 !w-2 !h-2 !-top-1" />

            <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-inner">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="min-w-0 flex-1">
                    <h6 className="font-semibold text-xs truncate leading-tight">
                        {user?.name || 'User Name'}
                    </h6>
                    <p className="text-[10px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                        <IdCard className="w-2.5 h-2.5 text-slate-500" />
                        {user?.nik || '-'}
                    </p>
                </div>
            </div>

            <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                <span className="truncate max-w-[130px]" title={user?.department_name || '-'}>
                    {user?.department_name || '-'}
                </span>
                <span className="truncate max-w-[100px] text-right font-medium text-slate-500" title={user?.company_name || '-'}>
                    {user?.company_name || ''}
                </span>
            </div>
        </div>
    );
};

const nodeTypes = {
    job_level_group: JobLevelGroupNode,
    job_level: JobLevelNode,
    job_title: JobTitleNode,
    user: UserNode,
};

export function JobHierarchyFlow({
    users,
    masterJobLevelGroups = [],
    masterJobLevels = [],
    masterJobTitles = [],
    masterCompanies = [],
    masterDepartments = [],
}: Readonly<Props>) {
    const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCompany, setSelectedCompany] = useState<string>('all');
    const [selectedDept, setSelectedDept] = useState<string>('all');
    const [selectedGroupLevel, setSelectedGroupLevel] = useState<string>('all');
    const [collapsedNodeIds, setCollapsedNodeIds] = useState<Set<string>>(new Set());
    const [isExporting, setIsExporting] = useState(false);

    const [visibleLevels, setVisibleLevels] = useState<Record<JobLevelKey, boolean>>({
        job_level_group: true,
        job_level: true,
        job_title: true,
        user: true,
    });

    const toggleCollapse = (id: string) => {
        setCollapsedNodeIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    // Filter users by search, company, dept, and group level
    const filteredUsers = useMemo(() => {
        return users.filter(u => {
            if (selectedCompany !== 'all' && u.company_id !== selectedCompany) return false;
            if (selectedDept !== 'all' && u.department_id !== selectedDept) return false;
            if (selectedGroupLevel !== 'all' && u.job_level_group_id !== selectedGroupLevel && u.job_level_group_name !== selectedGroupLevel) return false;

            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchName = u.name?.toLowerCase().includes(q);
                const matchNik = u.nik?.toLowerCase().includes(q);
                const matchTitle = u.job_title_name?.toLowerCase().includes(q);
                const matchLevel = u.job_level_name?.toLowerCase().includes(q);
                const matchDept = u.department_name?.toLowerCase().includes(q);
                if (!matchName && !matchNik && !matchTitle && !matchLevel && !matchDept) return false;
            }

            return true;
        });
    }, [users, selectedCompany, selectedDept, selectedGroupLevel, searchQuery]);

    // Build the hierarchical tree: Group -> Level -> Title -> Users
    const { nodes, edges } = useMemo(() => {
        const generatedNodes: Node[] = [];
        const generatedEdges: Edge[] = [];

        // Group filtered users by group level
        const usersByGroupLevel = new Map<string, HierarchyUser[]>();
        const usersByLevel = new Map<string, HierarchyUser[]>();
        const usersByTitle = new Map<string, HierarchyUser[]>();

        filteredUsers.forEach(u => {
            const groupKey = u.job_level_group_name || 'Tanpa Group';
            if (!usersByGroupLevel.has(groupKey)) usersByGroupLevel.set(groupKey, []);
            usersByGroupLevel.get(groupKey)!.push(u);

            const levelKey = `${groupKey}__${u.job_level_name || 'Tanpa Level'}`;
            if (!usersByLevel.has(levelKey)) usersByLevel.set(levelKey, []);
            usersByLevel.get(levelKey)!.push(u);

            const titleKey = `${levelKey}__${u.job_title_name || 'Tanpa Posisi'}`;
            if (!usersByTitle.has(titleKey)) usersByTitle.set(titleKey, []);
            usersByTitle.get(titleKey)!.push(u);
        });

        // Determine distinct group levels
        const groupLevels = Array.from(usersByGroupLevel.keys());
        if (groupLevels.length === 0 && masterJobLevelGroups.length > 0) {
            masterJobLevelGroups.forEach(g => {
                if (!usersByGroupLevel.has(g.name)) usersByGroupLevel.set(g.name, []);
            });
        }

        const activeGroupLevels = Array.from(usersByGroupLevel.keys());
        let currentX = 0;
        const GROUP_GAP_X = 380;
        const LEVEL_Y_STEP = 160;

        activeGroupLevels.forEach(groupName => {
            const groupUsers = usersByGroupLevel.get(groupName) || [];
            const groupId = `group__${groupName}`;
            const isGroupCollapsed = collapsedNodeIds.has(groupId);

            // Sub levels inside this group
            const levelMap = new Map<string, HierarchyUser[]>();
            groupUsers.forEach(u => {
                const lvlName = u.job_level_name || 'Tanpa Level';
                if (!levelMap.has(lvlName)) levelMap.set(lvlName, []);
                levelMap.get(lvlName)!.push(u);
            });

            const levelNames = Array.from(levelMap.keys());
            const groupSubtreeWidth = Math.max(1, levelNames.length) * 320;

            if (visibleLevels.job_level_group) {
                generatedNodes.push({
                    id: groupId,
                    type: 'job_level_group',
                    position: { x: currentX + (groupSubtreeWidth / 2) - 150, y: 0 },
                    data: {
                        label: groupName,
                        levelsCount: levelNames.length,
                        usersCount: groupUsers.length,
                        hasChildren: levelNames.length > 0,
                        isExpanded: !isGroupCollapsed,
                        onToggle: () => toggleCollapse(groupId),
                    },
                });
            }

            if (!isGroupCollapsed) {
                let levelX = currentX;

                levelNames.forEach(lvlName => {
                    const levelUsers = levelMap.get(lvlName) || [];
                    const levelId = `level__${groupName}__${lvlName}`;
                    const isLevelCollapsed = collapsedNodeIds.has(levelId);

                    // Group by Title inside this Level
                    const titleMap = new Map<string, HierarchyUser[]>();
                    levelUsers.forEach(u => {
                        const titleName = u.job_title_name || 'Tanpa Posisi';
                        if (!titleMap.has(titleName)) titleMap.set(titleName, []);
                        titleMap.get(titleName)!.push(u);
                    });
                    const titleNames = Array.from(titleMap.keys());
                    const levelSubtreeWidth = Math.max(1, titleNames.length) * 280;

                    if (visibleLevels.job_level) {
                        generatedNodes.push({
                            id: levelId,
                            type: 'job_level',
                            position: { x: levelX + (levelSubtreeWidth / 2) - 140, y: LEVEL_Y_STEP },
                            data: {
                                label: lvlName,
                                code: lvlName,
                                titlesCount: titleNames.length,
                                usersCount: levelUsers.length,
                                hasChildren: titleNames.length > 0,
                                isExpanded: !isLevelCollapsed,
                                onToggle: () => toggleCollapse(levelId),
                            },
                        });

                        if (visibleLevels.job_level_group) {
                            generatedEdges.push({
                                id: `edge_${groupId}_${levelId}`,
                                source: groupId,
                                target: levelId,
                                type: 'smoothstep',
                                animated: false,
                                style: { stroke: '#818cf8', strokeWidth: 2 },
                                markerEnd: { type: MarkerType.ArrowClosed, color: '#818cf8' },
                            });
                        }
                    }

                    if (!isLevelCollapsed) {
                        let titleX = levelX;

                        titleNames.forEach(titleName => {
                            const titleUsers = titleMap.get(titleName) || [];
                            const titleId = `title__${groupName}__${lvlName}__${titleName}`;
                            const isTitleCollapsed = collapsedNodeIds.has(titleId);

                            if (visibleLevels.job_title) {
                                generatedNodes.push({
                                    id: titleId,
                                    type: 'job_title',
                                    position: { x: titleX, y: LEVEL_Y_STEP * 2 },
                                    data: {
                                        label: titleName,
                                        code: titleUsers[0]?.nik ? `NIK ${titleUsers[0].nik.substring(0, 4)}...` : '',
                                        usersCount: titleUsers.length,
                                        hasChildren: titleUsers.length > 0,
                                        isExpanded: !isTitleCollapsed,
                                        onToggle: () => toggleCollapse(titleId),
                                    },
                                });

                                const sourceParentId = visibleLevels.job_level ? levelId : groupId;
                                generatedEdges.push({
                                    id: `edge_${sourceParentId}_${titleId}`,
                                    source: sourceParentId,
                                    target: titleId,
                                    type: 'smoothstep',
                                    style: { stroke: '#c084fc', strokeWidth: 1.5 },
                                    markerEnd: { type: MarkerType.ArrowClosed, color: '#c084fc' },
                                });
                            }

                            if (!isTitleCollapsed && visibleLevels.user) {
                                titleUsers.forEach((u, userIdx) => {
                                    const userId = `user__${u.id}_${titleId}_${userIdx}`;
                                    generatedNodes.push({
                                        id: userId,
                                        type: 'user',
                                        position: { x: titleX, y: LEVEL_Y_STEP * 3 + (userIdx * 95) },
                                        data: {
                                            user: u,
                                        },
                                    });

                                    const sourceUserParentId = visibleLevels.job_title ? titleId : (visibleLevels.job_level ? levelId : groupId);
                                    generatedEdges.push({
                                        id: `edge_${sourceUserParentId}_${userId}`,
                                        source: sourceUserParentId,
                                        target: userId,
                                        type: 'smoothstep',
                                        style: { stroke: '#2dd4bf', strokeWidth: 1 },
                                    });
                                });
                            }

                            titleX += 300;
                        });
                    }

                    levelX += Math.max(levelSubtreeWidth, 320);
                });
            }

            currentX += Math.max(groupSubtreeWidth, GROUP_GAP_X);
        });

        return { nodes: generatedNodes, edges: generatedEdges };
    }, [filteredUsers, masterJobLevelGroups, collapsedNodeIds, visibleLevels]);

    const handleExportPng = async () => {
        if (!reactFlowInstance || nodes.length === 0) return;
        setIsExporting(true);

        try {
            const nodesBounds = getNodesBounds(nodes);
            const padding = 80;
            const exportWidth = Math.max(nodesBounds.width + padding * 2, 1024);
            const exportHeight = Math.max(nodesBounds.height + padding * 2, 768);

            const viewport = getViewportForBounds(
                nodesBounds,
                exportWidth,
                exportHeight,
                0.1,
                2,
                padding
            );

            const flowViewportEl = document.querySelector('.react-flow__viewport') as HTMLElement | null;
            if (!flowViewportEl) {
                setIsExporting(false);
                return;
            }

            const isDark = document.documentElement.classList.contains('dark');
            const bgColor = isDark ? '#09090b' : '#f8fafc';

            const dataUrl = await toPng(flowViewportEl, {
                backgroundColor: bgColor,
                width: exportWidth,
                height: exportHeight,
                pixelRatio: 2,
                style: {
                    width: `${exportWidth}px`,
                    height: `${exportHeight}px`,
                    transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
                },
            });

            const link = document.createElement('a');
            link.download = `struktur-jabatan-level-hd-${new Date().toISOString().split('T')[0]}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error('Error exporting PNG:', err);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] min-h-[600px] w-full bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            {/* Header & Controls Toolbar */}
            <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur flex flex-wrap items-center justify-between gap-3 z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                        <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            Pohon Jenjang Jabatan & Level
                            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 font-semibold border border-indigo-500/20">
                                {filteredUsers.length} Karyawan
                            </span>
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Visualisasi hierarki Group Level $\rightarrow$ Job Level $\rightarrow$ Posisi $\rightarrow$ Personil
                        </p>
                    </div>
                </div>

                {/* Filters and Actions */}
                <div className="flex flex-wrap items-center gap-2">
                    {/* Search Input */}
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari nama, NIK, jabatan..."
                            className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48 sm:w-60"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Filter Perusahaan */}
                    <select
                        value={selectedCompany}
                        onChange={(e) => setSelectedCompany(e.target.value)}
                        aria-label="Filter Perusahaan"
                        className="text-xs py-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="all">Semua Perusahaan</option>
                        {masterCompanies.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>

                    {/* Filter Departemen */}
                    <select
                        value={selectedDept}
                        onChange={(e) => setSelectedDept(e.target.value)}
                        aria-label="Filter Departemen"
                        className="text-xs py-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 max-w-[180px]"
                    >
                        <option value="all">Semua Departemen</option>
                        {masterDepartments.map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                    </select>

                    {/* Export HD PNG Button */}
                    <button
                        type="button"
                        onClick={handleExportPng}
                        disabled={isExporting || nodes.length === 0}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs shadow-sm transition-all disabled:opacity-50"
                    >
                        <Download className={cn("w-3.5 h-3.5", isExporting && "animate-bounce")} />
                        {isExporting ? 'Exporting...' : 'Export PNG (HD)'}
                    </button>
                </div>
            </div>

            {/* Level Visibility Checkboxes */}
            <div className="px-4 py-2 bg-slate-100/70 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Tampilkan Level:</span>
                <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={visibleLevels.job_level_group}
                        onChange={(e) => setVisibleLevels(prev => ({ ...prev, job_level_group: e.target.checked }))}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    Group Level
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={visibleLevels.job_level}
                        onChange={(e) => setVisibleLevels(prev => ({ ...prev, job_level: e.target.checked }))}
                        className="rounded text-purple-600 focus:ring-purple-500"
                    />
                    Job Level (Grade)
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={visibleLevels.job_title}
                        onChange={(e) => setVisibleLevels(prev => ({ ...prev, job_title: e.target.checked }))}
                        className="rounded text-cyan-600 focus:ring-cyan-500"
                    />
                    Posisi / Jabatan
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={visibleLevels.user}
                        onChange={(e) => setVisibleLevels(prev => ({ ...prev, user: e.target.checked }))}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    Anggota Karyawan
                </label>
            </div>

            {/* Flow Canvas */}
            <div className="flex-1 w-full h-full relative">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={nodeTypes}
                    onInit={setReactFlowInstance}
                    fitView
                    minZoom={0.1}
                    maxZoom={1.8}
                    attributionPosition="bottom-left"
                >
                    <Background variant={BackgroundVariant.Dots} gap={20} size={1.2} />
                    <Controls position="bottom-right" className="!bg-white dark:!bg-slate-900 !border-slate-200 dark:!border-slate-800 !rounded-lg !shadow-md" />
                    <MiniMap
                        position="bottom-left"
                        nodeColor={(n) => {
                            if (n.type === 'job_level_group') return '#6366f1';
                            if (n.type === 'job_level') return '#a855f7';
                            if (n.type === 'job_title') return '#06b6d4';
                            return '#10b981';
                        }}
                        className="!bg-white/80 dark:!bg-slate-900/80 !border-slate-200 dark:!border-slate-800 !rounded-lg !shadow-md"
                    />
                </ReactFlow>
            </div>
        </div>
    );
}
