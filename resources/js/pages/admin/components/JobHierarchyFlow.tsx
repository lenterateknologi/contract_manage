import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
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
    applyNodeChanges,
    applyEdgeChanges,
    OnNodesChange,
    OnEdgesChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
    Building2,
    MapPin,
    Building,
    Briefcase,
    Users,
    ChevronRight,
    Search,
    SlidersHorizontal,
    Layers,
    UserCheck,
    Mail,
    IdCard,
    X,
    Filter,
    Check,
    User as UserIcon,
    UserX,
    ChevronDown,
    RotateCcw,
    ChevronUp,
    Crosshair,
    Navigation,
    Network,
    Shield,
    FolderClosed,
    FolderTree,
    GitBranch,
    Tags,
    Sparkles,
    RefreshCw,
    Award,
    Crown,
    Flame,
    Workflow,
    ArrowDown,
    ExternalLink,
} from 'lucide-react';
import { router } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import { HierarchyUser, MultiSelectDropdown } from './OrgHierarchyFlow';

const JOB_STORAGE_KEY = 'job_hierarchy_view_settings_v3';

interface SavedJobHierarchySettings {
    usedFilter?: 'used_only' | 'all';
    selectedGroups?: string[];
    selectedOrganizationGroups?: string[];
    selectedRegions?: string[];
    selectedLocations?: string[];
    selectedCompanies?: string[];
    selectedDivisions?: string[];
    selectedDepartments?: string[];
    selectedSubdepartments?: string[];
    selectedSections?: string[];
    selectedJobLevelGroups?: string[];
    selectedJobLevels?: string[];
    selectedJobTitles?: string[];
    selectedRoles?: string[];
    isConfigOpen?: boolean;
    visibleTiers?: Record<string, boolean>;
}

const loadSavedJobSettings = (): SavedJobHierarchySettings => {
    if (typeof window === 'undefined') return {};
    try {
        const saved = localStorage.getItem(JOB_STORAGE_KEY);
        if (saved) {
            return JSON.parse(saved);
        }
    } catch {
        // Ignore JSON parse errors
    }
    return {};
};

interface MasterItem {
    id: string;
    name: string;
    code?: string;
    job_level_id?: string;
    job_level_group_id?: string;
    group_name?: string;
    idjoblevel?: number;
    is_used?: boolean;
}

interface Props {
    users: HierarchyUser[];
    masterGroups?: MasterItem[];
    masterOrganizationGroups?: MasterItem[];
    masterRegions?: MasterItem[];
    masterLocations?: MasterItem[];
    masterCompanies?: MasterItem[];
    masterDivisions?: MasterItem[];
    masterDepartments?: MasterItem[];
    masterSubdepartments?: MasterItem[];
    masterSections?: MasterItem[];
    masterJobLevelGroups?: MasterItem[];
    masterJobLevels?: MasterItem[];
    masterJobTitles?: MasterItem[];
    masterRoles?: MasterItem[];
}

export type SeniorityTierKey =
    | 'tier_1_executive'
    | 'tier_2_gm'
    | 'tier_3_manager'
    | 'tier_4_asst_manager'
    | 'tier_5_supervisor'
    | 'tier_6_staff'
    | 'tier_7_non_staff';

interface TierDefinition {
    key: SeniorityTierKey;
    rank: number;
    title: string;
    subtitle: string;
    icon: React.ElementType;
    headerColor: string;
    headerBorder: string;
    badgeBg: string;
    edgeColor: string;
}

const SENIORITY_TIERS: TierDefinition[] = [
    {
        key: 'tier_1_executive',
        rank: 1,
        title: 'Direksi & Executive (VP / Head / Director)',
        subtitle: 'CEO, MD, DMD, VP, Head, Chief, Director, Management',
        icon: Crown,
        headerColor: 'from-amber-500/15 via-amber-500/5 to-transparent text-amber-600 dark:text-amber-400',
        headerBorder: 'border-amber-400/50 dark:border-amber-500/50',
        badgeBg: 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300/80 dark:border-amber-800/80',
        edgeColor: '#f59e0b',
    },
    {
        key: 'tier_2_gm',
        rank: 2,
        title: 'Senior Manager & General Manager (GM)',
        subtitle: 'General Manager (GM), Senior Manager, Group Manager',
        icon: Award,
        headerColor: 'from-purple-500/15 via-purple-500/5 to-transparent text-purple-600 dark:text-purple-400',
        headerBorder: 'border-purple-400/50 dark:border-purple-500/50',
        badgeBg: 'bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border-purple-300/80 dark:border-purple-800/80',
        edgeColor: '#a855f7',
    },
    {
        key: 'tier_3_manager',
        rank: 3,
        title: 'Manager',
        subtitle: 'Manager, Manager Kebun, Department Manager',
        icon: Briefcase,
        headerColor: 'from-blue-500/15 via-blue-500/5 to-transparent text-blue-600 dark:text-blue-400',
        headerBorder: 'border-blue-400/50 dark:border-blue-500/50',
        badgeBg: 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border-blue-300/80 dark:border-blue-800/80',
        edgeColor: '#3b82f6',
    },
    {
        key: 'tier_4_asst_manager',
        rank: 4,
        title: 'Assistant Manager & Superintendent (Askep)',
        subtitle: 'Assistant Manager, Askep, Superintendent',
        icon: Workflow,
        headerColor: 'from-teal-500/15 via-teal-500/5 to-transparent text-teal-600 dark:text-teal-400',
        headerBorder: 'border-teal-400/50 dark:border-teal-500/50',
        badgeBg: 'bg-teal-100 text-teal-800 dark:bg-teal-950/70 dark:text-teal-300 border-teal-300/80 dark:border-teal-800/80',
        edgeColor: '#14b8a6',
    },
    {
        key: 'tier_5_supervisor',
        rank: 5,
        title: 'Supervisor & Senior Officer',
        subtitle: 'Supervisor, Senior Officer, Senior Assistant',
        icon: UserCheck,
        headerColor: 'from-emerald-500/15 via-emerald-500/5 to-transparent text-emerald-600 dark:text-emerald-400',
        headerBorder: 'border-emerald-400/50 dark:border-emerald-500/50',
        badgeBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300/80 dark:border-emerald-800/80',
        edgeColor: '#10b981',
    },
    {
        key: 'tier_6_staff',
        rank: 6,
        title: 'Staff & Officer',
        subtitle: 'Officer, Assistant, Staff, Specialist, Pelaksana Staff',
        icon: Users,
        headerColor: 'from-sky-500/15 via-sky-500/5 to-transparent text-sky-600 dark:text-sky-400',
        headerBorder: 'border-sky-400/50 dark:border-sky-500/50',
        badgeBg: 'bg-sky-100 text-sky-800 dark:bg-sky-950/70 dark:text-sky-300 border-sky-300/80 dark:border-sky-800/80',
        edgeColor: '#0ea5e9',
    },
    {
        key: 'tier_7_non_staff',
        rank: 7,
        title: 'Pelaksana & Non-Staff',
        subtitle: 'Foreman, Operator, Harian, Magang / Mahasiswa',
        icon: Layers,
        headerColor: 'from-slate-500/15 via-slate-500/5 to-transparent text-slate-600 dark:text-slate-400',
        headerBorder: 'border-slate-300/60 dark:border-slate-700/60',
        badgeBg: 'bg-slate-100 text-slate-800 dark:bg-zinc-800 dark:text-slate-300 border-slate-300/60 dark:border-zinc-700/60',
        edgeColor: '#64748b',
    },
];

/**
 * Classify any user into one of the 7 hierarchical seniority tiers
 * Uses database mapping (hierarchy_tier from m_job_levels) first, with smart fallback.
 */
function classifyUserTier(u: HierarchyUser): SeniorityTierKey {
    // 1. Direct database master tier mapping from m_job_levels (editable in /admin/core/job-levels)
    const dbTier = (u as any).hierarchy_tier;
    if (dbTier) {
        const tierMap: Record<number, SeniorityTierKey> = {
            1: 'tier_1_executive',
            2: 'tier_2_gm',
            3: 'tier_3_manager',
            4: 'tier_4_asst_manager',
            5: 'tier_5_supervisor',
            6: 'tier_6_staff',
            7: 'tier_7_non_staff',
        };
        if (tierMap[dbTier]) {
            return tierMap[dbTier];
        }
    }

    const rank = (u as any).job_level_rank || 0;
    const searchString = `${u.job_level_name || ''} ${(u as any).job_level_code || ''} ${u.job_title_name || ''}`.toUpperCase();

    // 1. Executive / VP / Head / Director / CEO / MD / DMD
    if (
        [76, 74, 73, 66, 65, 52, 51, 50, 49, 48, 47, 46, 45, 44].includes(rank) ||
        /\b(VP|DIRECTOR|HEAD|CHIEF|CEO|MD|DMD|MANAGEMENT|PRESIDENT|DIREKSI)\b/.test(searchString)
    ) {
        return 'tier_1_executive';
    }

    // 2. Senior Manager & General Manager
    if (
        [72, 71, 43, 42, 41, 40].includes(rank) ||
        /\b(GM|GENERAL MANAGER|SENIOR MANAGER|SR\. MANAGER|GROUP MANAGER)\b/.test(searchString)
    ) {
        return 'tier_2_gm';
    }

    // 3. Manager
    if (
        [70, 69, 68, 39, 38, 37, 36, 35].includes(rank) ||
        (searchString.includes('MANAGER') &&
            !searchString.includes('ASSISTANT') &&
            !searchString.includes('ASST') &&
            !searchString.includes('SENIOR') &&
            !searchString.includes('GENERAL') &&
            !searchString.includes('GROUP'))
    ) {
        return 'tier_3_manager';
    }

    // 4. Assistant Manager & Superintendent (Askep)
    if (
        [64, 63, 62, 61, 60, 59, 34, 33, 32, 31, 30].includes(rank) ||
        /\b(ASSISTANT MANAGER|ASST\. MANAGER|ASST MANAGER|ASKEP|SUPERINTENDENT)\b/.test(searchString)
    ) {
        return 'tier_4_asst_manager';
    }

    // 5. Supervisor & Senior Officer
    if (
        [58, 57, 56, 55, 54, 53, 29, 28].includes(rank) ||
        /\b(SUPERVISOR|SENIOR OFFICER|SENIOR ASSISTAN|SR\. OFFICER|SPV)\b/.test(searchString)
    ) {
        return 'tier_5_supervisor';
    }

    // 7. Non-Staff / Foreman / Operator / Mahasiswa / KHT
    if (
        (rank >= 1 && rank <= 23) ||
        (u as any).job_level_group_name === 'NON STAFF' ||
        /\b(NON STAFF|NON-STAFF|OPERATOR|FOREMAN|KHT|HARIAN|MAHASISWA|MAGANG|INTERN|MHS)\b/.test(searchString)
    ) {
        return 'tier_7_non_staff';
    }

    // 6. Default to Staff & Officer
    return 'tier_6_staff';
}

interface JobTreeNodeData extends Record<string, unknown> {
    nodeId?: string;
    title: string;
    label?: string;
    subtitle?: string;
    levelKey: string;
    levelLabel: string;
    code?: string;
    color?: string;
    badgeBg?: string;
    users: HierarchyUser[];
    totalUsers: number;
    subItemsCount?: number;
    hasChildren?: boolean;
    isExpanded?: boolean;
    onToggle?: () => void;
    onSelect?: (data: JobTreeNodeData) => void;
    onSelectUser?: (user: HierarchyUser) => void;
}

// 1. Tier Header Card (Level 1: Direksi/VP, Level 2: GM, Level 3: Manager, etc.)
const JobTierNode = ({ data }: NodeProps<Node<JobTreeNodeData>>) => {
    const isExpanded = data.isExpanded !== false;
    const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

    return (
        <div
            className={cn(
                'relative px-5 py-4 rounded-2xl border-2 shadow-xl transition-all min-w-[360px] max-w-[440px] cursor-grab active:cursor-grabbing backdrop-blur-md',
                isDark
                    ? 'bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-950/95 border-amber-500/40 text-slate-100 shadow-amber-950/30'
                    : 'bg-gradient-to-br from-white via-amber-50/25 to-white border-amber-300/70 text-slate-900 shadow-amber-100/60'
            )}
            onClick={() => {
                if (typeof data.onSelect === 'function') data.onSelect(data);
            }}
        >
            <Handle type="target" position={Position.Top} className="!bg-amber-500 !w-3.5 !h-3.5 !-top-2 border-2 border-white dark:border-slate-900" />

            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
                        <Crown className="w-5 h-5" />
                    </div>
                    <div>
                        <span className={cn('text-[10px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded-md border', data.badgeBg || 'bg-amber-100 text-amber-800 border-amber-300')}>
                            {data.levelLabel || 'JENJANG JABATAN'}
                        </span>
                        <h4 className="font-extrabold text-sm tracking-tight mt-1 line-clamp-1">
                            {String(data.title || data.label || 'Jenjang Jabatan')}
                        </h4>
                        {data.subtitle && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                                {data.subtitle}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-300">
                    <Briefcase className="w-3.5 h-3.5 text-amber-500" />
                    {Number(data.subItemsCount || 0)} Posisi Jabatan
                </span>
                <span className="flex items-center gap-1.5 font-extrabold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                    <Users className="w-3.5 h-3.5" />
                    {Number(data.totalUsers || 0)} Karyawan
                </span>
            </div>

            {Boolean(data.hasChildren) && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (typeof data.onToggle === 'function') (data.onToggle as () => void)();
                    }}
                    className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-amber-600 text-white shadow-md hover:bg-amber-500 transition-colors z-10 cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                    title={isExpanded ? 'Sembunyikan Posisi' : 'Tampilkan Posisi'}
                >
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    <span>{isExpanded ? 'Sembunyikan' : 'Buka Posisi'}</span>
                </button>
            )}

            <Handle type="source" position={Position.Bottom} className="!bg-amber-500 !w-3.5 !h-3.5 !-bottom-2 border-2 border-white dark:border-slate-900" />
        </div>
    );
};

// 2. UNIFIED Position Card (1 Single Card containing Position Name, Grade, AND its List of Employees)
const UnifiedJobPositionCard = ({ data }: NodeProps<Node<JobTreeNodeData>>) => {
    const { title, users, totalUsers, onSelect, onSelectUser } = data;
    const [filterText, setFilterText] = useState('');
    const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

    const displayed = useMemo(() => {
        if (!filterText.trim()) return users.slice(0, 50);
        const q = filterText.toLowerCase();
        return users
            .filter(
                (u) =>
                    u.name?.toLowerCase().includes(q) ||
                    u.nik?.toLowerCase().includes(q) ||
                    u.department_name?.toLowerCase().includes(q)
            )
            .slice(0, 50);
    }, [users, filterText]);

    const gradeLabel = users[0]?.job_level_name || 'Level Terstandar';

    return (
        <div
            className={cn(
                'w-[350px] rounded-2xl border-2 shadow-lg transition-all text-left relative cursor-grab active:cursor-grabbing backdrop-blur-md overflow-hidden',
                isDark
                    ? 'bg-gradient-to-b from-slate-900 via-zinc-900 to-zinc-950 border-cyan-500/30 text-slate-100 shadow-cyan-950/40'
                    : 'bg-gradient-to-b from-white via-slate-50/50 to-white border-cyan-200 text-slate-900 shadow-slate-200/80'
            )}
        >
            <Handle
                type="target"
                position={Position.Top}
                className="!w-3 !h-3 !bg-cyan-500 border-2 border-white dark:border-zinc-900 !-top-1.5"
            />

            {/* Position Header */}
            <div
                className="p-3.5 bg-gradient-to-r from-cyan-500/10 via-sky-500/5 to-transparent border-b border-cyan-500/15 cursor-pointer hover:bg-cyan-500/15 transition-colors"
                onClick={() => {
                    if (typeof onSelect === 'function') onSelect(data);
                }}
            >
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="p-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/25 text-cyan-600 dark:text-cyan-400 shrink-0">
                            <Briefcase className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <span className="text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/25">
                                {gradeLabel}
                            </span>
                            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate mt-1 leading-tight" title={title}>
                                {title}
                            </h4>
                        </div>
                    </div>
                    <span className="text-[10px] font-extrabold text-cyan-700 dark:text-cyan-300 bg-cyan-100/80 dark:bg-cyan-950/70 border border-cyan-300/80 dark:border-cyan-800 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {totalUsers} orang
                    </span>
                </div>
            </div>

            {/* In-Card Search (shown if > 2 people) */}
            {totalUsers > 2 && (
                <div className="px-3 pt-2.5 pb-1 bg-slate-50/50 dark:bg-zinc-900/50 border-b border-slate-100 dark:border-zinc-800/80">
                    <div className="relative">
                        <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder={`Cari di ${totalUsers} orang...`}
                            value={filterText}
                            onChange={(e) => setFilterText(e.target.value)}
                            className="h-6 w-full rounded-lg border border-slate-200/80 bg-white pl-7 pr-2 text-[10px] text-slate-900 focus:border-cyan-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-800 dark:text-slate-100"
                        />
                    </div>
                </div>
            )}

            {/* Employee List inside the Unified Card */}
            <div className="p-2 max-h-[260px] overflow-y-auto space-y-1.5 [scrollbar-width:thin]">
                {displayed.length === 0 ? (
                    <div className="py-5 text-center text-xs text-slate-400">
                        Tidak ada orang ditemukan.
                    </div>
                ) : (
                    displayed.map((u) => (
                        <div
                            key={u.id}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (typeof onSelectUser === 'function') {
                                    onSelectUser(u);
                                } else if (typeof onSelect === 'function') {
                                    onSelect(data);
                                }
                            }}
                            className="p-1.5 rounded-xl bg-slate-50/80 dark:bg-zinc-800/50 hover:bg-cyan-500/10 dark:hover:bg-cyan-950/40 border border-transparent hover:border-cyan-500/20 flex items-center gap-2 cursor-pointer transition-all group"
                        >
                            <div className="h-6 w-6 rounded-full bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 flex items-center justify-center font-extrabold text-[10px] shrink-0 border border-cyan-500/25 group-hover:scale-105 transition-transform">
                                {u.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="text-[11px] font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                                    {u.name}
                                </div>
                                <div className="text-[9px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                                    <span className="font-medium text-slate-600 dark:text-slate-300 truncate">{u.department_name}</span>
                                    <span>·</span>
                                    <span className="font-mono text-[9px] text-slate-400">{u.nik}</span>
                                </div>
                                {u.reporting_to && (
                                    <div className="text-[8.5px] text-amber-600 dark:text-amber-400 truncate font-semibold flex items-center gap-1 mt-0.5">
                                        <UserCheck size={9} className="shrink-0" />
                                        <span>Atasan: {u.reporting_to}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}

                {totalUsers > 50 && !filterText && (
                    <div
                        onClick={(e) => {
                            e.stopPropagation();
                            if (typeof onSelect === 'function') onSelect(data);
                        }}
                        className="text-center py-1.5 text-[10px] font-bold text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
                    >
                        + Buka {totalUsers - 50} orang lainnya di panel...
                    </div>
                )}
            </div>

            <Handle
                type="source"
                position={Position.Bottom}
                className="!w-3 !h-3 !bg-cyan-500 border-2 border-white dark:border-zinc-900 !-bottom-1.5"
            />
        </div>
    );
};

const nodeTypes = {
    job_tier_node: JobTierNode,
    job_position_card: UnifiedJobPositionCard,
};

export function JobHierarchyFlow({
    users,
    masterGroups = [],
    masterOrganizationGroups = [],
    masterRegions = [],
    masterLocations = [],
    masterCompanies = [],
    masterDivisions = [],
    masterDepartments = [],
    masterSubdepartments = [],
    masterSections = [],
    masterJobLevelGroups = [],
    masterJobLevels = [],
    masterJobTitles = [],
    masterRoles = [],
}: Readonly<Props>) {
    const savedInitial = useMemo(() => loadSavedJobSettings(), []);

    const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [userSearchText, setUserSearchText] = useState('');
    const [selectedNode, setSelectedNode] = useState<JobTreeNodeData | null>(null);
    const [collapsedNodeIds, setCollapsedNodeIds] = useState<Set<string>>(new Set());
    const [isSyncing, setIsSyncing] = useState(false);

    // Filter is_used: 'used_only' | 'all'
    const [usedFilter, setUsedFilter] = useState<'used_only' | 'all'>(() => {
        return savedInitial.usedFilter || 'used_only';
    });

    const [isConfigOpen, setIsConfigOpen] = useState<boolean>(() => {
        return savedInitial.isConfigOpen !== undefined ? savedInitial.isConfigOpen : true;
    });

    // Multi-select state filters
    const [selectedGroups, setSelectedGroups] = useState<string[]>(() => savedInitial.selectedGroups || []);
    const [selectedOrganizationGroups, setSelectedOrganizationGroups] = useState<string[]>(() => savedInitial.selectedOrganizationGroups || []);
    const [selectedRegions, setSelectedRegions] = useState<string[]>(() => savedInitial.selectedRegions || []);
    const [selectedLocations, setSelectedLocations] = useState<string[]>(() => savedInitial.selectedLocations || []);
    const [selectedCompanies, setSelectedCompanies] = useState<string[]>(() => savedInitial.selectedCompanies || []);
    const [selectedDivisions, setSelectedDivisions] = useState<string[]>(() => savedInitial.selectedDivisions || []);
    const [selectedDepartments, setSelectedDepartments] = useState<string[]>(() => savedInitial.selectedDepartments || []);
    const [selectedSubdepartments, setSelectedSubdepartments] = useState<string[]>(() => savedInitial.selectedSubdepartments || []);
    const [selectedSections, setSelectedSections] = useState<string[]>(() => savedInitial.selectedSections || []);
    const [selectedJobLevelGroups, setSelectedJobLevelGroups] = useState<string[]>(() => savedInitial.selectedJobLevelGroups || []);
    const [selectedJobLevels, setSelectedJobLevels] = useState<string[]>(() => savedInitial.selectedJobLevels || []);
    const [selectedJobTitles, setSelectedJobTitles] = useState<string[]>(() => savedInitial.selectedJobTitles || []);
    const [selectedRoles, setSelectedRoles] = useState<string[]>(() => savedInitial.selectedRoles || []);

    const [visibleTiers, setVisibleTiers] = useState<Record<string, boolean>>(() => {
        return (
            savedInitial.visibleTiers || {
                tier_1_executive: true,
                tier_2_gm: true,
                tier_3_manager: true,
                tier_4_asst_manager: true,
                tier_5_supervisor: true,
                tier_6_staff: true,
                tier_7_non_staff: true,
            }
        );
    });

    // Auto-save client-side cache to localStorage
    useEffect(() => {
        try {
            const stateToSave: SavedJobHierarchySettings = {
                usedFilter,
                selectedGroups,
                selectedOrganizationGroups,
                selectedRegions,
                selectedLocations,
                selectedCompanies,
                selectedDivisions,
                selectedDepartments,
                selectedSubdepartments,
                selectedSections,
                selectedJobLevelGroups,
                selectedJobLevels,
                selectedJobTitles,
                selectedRoles,
                isConfigOpen,
                visibleTiers,
            };
            localStorage.setItem(JOB_STORAGE_KEY, JSON.stringify(stateToSave));
        } catch {
            // Handle quota or permission errors silently
        }
    }, [
        usedFilter,
        selectedGroups,
        selectedOrganizationGroups,
        selectedRegions,
        selectedLocations,
        selectedCompanies,
        selectedDivisions,
        selectedDepartments,
        selectedSubdepartments,
        selectedSections,
        selectedJobLevelGroups,
        selectedJobLevels,
        selectedJobTitles,
        selectedRoles,
        isConfigOpen,
        visibleTiers,
    ]);

    // Available options filtered by usedFilter
    const getFilteredMaster = (items: MasterItem[]) => {
        if (usedFilter === 'used_only') {
            return items.filter((i) => (i.is_used !== undefined ? Boolean(i.is_used) : true));
        }
        return items;
    };

    const optGroups = useMemo(() => getFilteredMaster(masterGroups), [masterGroups, usedFilter]);
    const optOrganizationGroups = useMemo(() => getFilteredMaster(masterOrganizationGroups), [masterOrganizationGroups, usedFilter]);
    const optRegions = useMemo(() => getFilteredMaster(masterRegions), [masterRegions, usedFilter]);
    const optLocations = useMemo(() => getFilteredMaster(masterLocations), [masterLocations, usedFilter]);
    const optCompanies = useMemo(() => getFilteredMaster(masterCompanies), [masterCompanies, usedFilter]);
    const optDivisions = useMemo(() => getFilteredMaster(masterDivisions), [masterDivisions, usedFilter]);
    const optDepartments = useMemo(() => getFilteredMaster(masterDepartments), [masterDepartments, usedFilter]);
    const optSubdepartments = useMemo(() => getFilteredMaster(masterSubdepartments), [masterSubdepartments, usedFilter]);
    const optSections = useMemo(() => getFilteredMaster(masterSections), [masterSections, usedFilter]);
    const optJobLevelGroups = useMemo(() => getFilteredMaster(masterJobLevelGroups), [masterJobLevelGroups, usedFilter]);
    const optJobLevels = useMemo(() => getFilteredMaster(masterJobLevels), [masterJobLevels, usedFilter]);
    const optJobTitles = useMemo(() => getFilteredMaster(masterJobTitles), [masterJobTitles, usedFilter]);
    const optRoles = useMemo(() => masterRoles, [masterRoles]);

    // Reset all multiple filters & clear client-side saved cache
    const resetAllFilters = () => {
        setSelectedGroups([]);
        setSelectedOrganizationGroups([]);
        setSelectedRegions([]);
        setSelectedLocations([]);
        setSelectedCompanies([]);
        setSelectedDivisions([]);
        setSelectedDepartments([]);
        setSelectedSubdepartments([]);
        setSelectedSections([]);
        setSelectedJobLevelGroups([]);
        setSelectedJobLevels([]);
        setSelectedJobTitles([]);
        setSelectedRoles([]);
        setSearchQuery('');
        try {
            localStorage.removeItem(JOB_STORAGE_KEY);
        } catch {
            // Ignore
        }
    };

    const hasActiveMultiFilters =
        selectedGroups.length > 0 ||
        selectedOrganizationGroups.length > 0 ||
        selectedRegions.length > 0 ||
        selectedLocations.length > 0 ||
        selectedCompanies.length > 0 ||
        selectedDivisions.length > 0 ||
        selectedDepartments.length > 0 ||
        selectedSubdepartments.length > 0 ||
        selectedSections.length > 0 ||
        selectedJobLevelGroups.length > 0 ||
        selectedJobLevels.length > 0 ||
        selectedJobTitles.length > 0 ||
        selectedRoles.length > 0 ||
        Boolean(searchQuery.trim());

    const toggleCollapse = (id: string) => {
        setCollapsedNodeIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const handleSyncData = () => {
        setIsSyncing(true);
        router.get(
            '/admin/members',
            { refresh: 1, tab: 'job' },
            {
                preserveState: false,
                preserveScroll: true,
                onFinish: () => setIsSyncing(false),
            }
        );
    };

    // Filter users by full multi-select criteria
    const filteredUsers = useMemo(() => {
        return users.filter((u) => {
            // Strictly check employee's own is_used status when usedFilter is 'used_only'
            if (usedFilter === 'used_only' && !u.is_used) {
                return false;
            }

            // Group Filter
            if (selectedGroups.length > 0 && !selectedGroups.some((g) => g.toLowerCase() === u.group_name?.toLowerCase())) {
                return false;
            }
            // Organization Group Filter
            if (selectedOrganizationGroups.length > 0 && !selectedOrganizationGroups.some((og) => og.toLowerCase() === (u.org_group_name || '').toLowerCase())) {
                return false;
            }
            // Region Filter
            if (selectedRegions.length > 0 && !selectedRegions.some((r) => r.toLowerCase() === u.region_name?.toLowerCase())) {
                return false;
            }
            // Location Filter
            if (selectedLocations.length > 0 && !selectedLocations.some((l) => l.toLowerCase() === u.location_name?.toLowerCase())) {
                return false;
            }
            // Company Filter
            if (selectedCompanies.length > 0 && !selectedCompanies.some((c) => c.toLowerCase() === u.company_name?.toLowerCase())) {
                return false;
            }
            // Division Filter
            if (selectedDivisions.length > 0 && !selectedDivisions.some((div) => div.toLowerCase() === (u.division_name || '').toLowerCase())) {
                return false;
            }
            // Department Filter
            if (selectedDepartments.length > 0 && !selectedDepartments.some((d) => d.toLowerCase() === u.department_name?.toLowerCase())) {
                return false;
            }
            // Subdepartment Filter
            if (selectedSubdepartments.length > 0 && !selectedSubdepartments.some((sub) => sub.toLowerCase() === (u.subdepartment_name || '').toLowerCase())) {
                return false;
            }
            // Section Filter
            if (selectedSections.length > 0 && !selectedSections.some((sec) => sec.toLowerCase() === (u.section_name || '').toLowerCase())) {
                return false;
            }
            // Job Level Group Filter
            if (selectedJobLevelGroups.length > 0 && !selectedJobLevelGroups.some((jlg) => jlg.toLowerCase() === ((u as any).job_level_group_name || '').toLowerCase())) {
                return false;
            }
            // Job Level Filter
            if (selectedJobLevels.length > 0 && !selectedJobLevels.some((jl) => jl.toLowerCase() === (u.job_level_name || '').toLowerCase())) {
                return false;
            }
            // Job Title Filter
            if (selectedJobTitles.length > 0 && !selectedJobTitles.some((j) => j.toLowerCase() === u.job_title_name?.toLowerCase())) {
                return false;
            }
            // Role Access Filter
            if (selectedRoles.length > 0 && !selectedRoles.some((r) => r.toLowerCase() === (u.role_name || '').toLowerCase())) {
                return false;
            }

            // Global search filter
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matches =
                    u.name?.toLowerCase().includes(q) ||
                    u.nik?.toLowerCase().includes(q) ||
                    u.email?.toLowerCase().includes(q) ||
                    u.group_name?.toLowerCase().includes(q) ||
                    (u.org_group_name && u.org_group_name.toLowerCase().includes(q)) ||
                    u.region_name?.toLowerCase().includes(q) ||
                    u.company_name?.toLowerCase().includes(q) ||
                    (u.division_name && u.division_name.toLowerCase().includes(q)) ||
                    u.department_name?.toLowerCase().includes(q) ||
                    (u.subdepartment_name && u.subdepartment_name.toLowerCase().includes(q)) ||
                    (u.section_name && u.section_name.toLowerCase().includes(q)) ||
                    ((u as any).job_level_group_name && (u as any).job_level_group_name.toLowerCase().includes(q)) ||
                    (u.job_level_name && u.job_level_name.toLowerCase().includes(q)) ||
                    u.job_title_name?.toLowerCase().includes(q) ||
                    (u.role_name && u.role_name.toLowerCase().includes(q));
                if (!matches) return false;
            }

            return true;
        });
    }, [
        users,
        usedFilter,
        selectedGroups,
        selectedOrganizationGroups,
        selectedRegions,
        selectedLocations,
        selectedCompanies,
        selectedDivisions,
        selectedDepartments,
        selectedSubdepartments,
        selectedSections,
        selectedJobLevelGroups,
        selectedJobLevels,
        selectedJobTitles,
        selectedRoles,
        searchQuery,
    ]);

    /**
     * Compute Initial Layout for Nodes and Edges
     * Unified clean layout: Tier Node -> Unified Position Cards (1 card per position)
     */
    const computedFlow = useMemo(() => {
        const generatedNodes: Node<JobTreeNodeData>[] = [];
        const generatedEdges: Edge[] = [];

        // 1. Group filtered users by Seniority Tier
        const usersByTier = new Map<SeniorityTierKey, HierarchyUser[]>();
        SENIORITY_TIERS.forEach((t) => usersByTier.set(t.key, []));

        filteredUsers.forEach((u) => {
            const tierKey = classifyUserTier(u);
            usersByTier.get(tierKey)!.push(u);
        });

        // 2. Filter active tiers that have users and are enabled in visibleTiers
        const activeTiers = SENIORITY_TIERS.filter((t) => {
            if (visibleTiers[t.key] === false) return false;
            const count = (usersByTier.get(t.key) || []).length;
            return count > 0;
        });

        let currentY = 0;
        const POSITION_CARD_WIDTH = 350;
        const POSITION_HORIZONTAL_GAP = 30;
        const POSITION_STEP = POSITION_CARD_WIDTH + POSITION_HORIZONTAL_GAP;

        let previousTierNodeId: string | null = null;

        activeTiers.forEach((tierDef) => {
            const tierUsers = usersByTier.get(tierDef.key) || [];
            const tierNodeId = `tier__${tierDef.key}`;
            const isTierCollapsed = collapsedNodeIds.has(tierNodeId);

            // Group users in this tier by Job Title
            const titleMap = new Map<string, HierarchyUser[]>();
            tierUsers.forEach((u) => {
                const tName = u.job_title_name || 'Tanpa Posisi';
                if (!titleMap.has(tName)) titleMap.set(tName, []);
                titleMap.get(tName)!.push(u);
            });

            const distinctTitles = Array.from(titleMap.keys()).sort();
            const totalPositionsWidth = Math.max(1, distinctTitles.length) * POSITION_STEP - POSITION_HORIZONTAL_GAP;

            // Tier Header Node
            const tierCenterX = Math.max(0, (totalPositionsWidth / 2) - 190);
            generatedNodes.push({
                id: tierNodeId,
                type: 'job_tier_node',
                position: { x: tierCenterX, y: currentY },
                draggable: true,
                data: {
                    nodeId: tierNodeId,
                    title: tierDef.title,
                    label: tierDef.title,
                    subtitle: tierDef.subtitle,
                    levelKey: tierDef.key,
                    levelLabel: `LEVEL ${tierDef.rank} · ${tierDef.title.split(' ')[0]}`,
                    badgeBg: tierDef.badgeBg,
                    users: tierUsers,
                    totalUsers: tierUsers.length,
                    subItemsCount: distinctTitles.length,
                    hasChildren: distinctTitles.length > 0,
                    isExpanded: !isTierCollapsed,
                    onToggle: () => toggleCollapse(tierNodeId),
                    onSelect: (d) => setSelectedNode(d),
                },
            });

            // Connect from previous higher Tier down to this Tier (Hierarchy Seniority Edge)
            if (previousTierNodeId) {
                generatedEdges.push({
                    id: `edge_seniority_${previousTierNodeId}_${tierNodeId}`,
                    source: previousTierNodeId,
                    target: tierNodeId,
                    type: 'smoothstep',
                    animated: true,
                    style: { stroke: tierDef.edgeColor, strokeWidth: 2.5 },
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                        color: tierDef.edgeColor,
                    },
                });
            }
            previousTierNodeId = tierNodeId;

            // Render Unified Position Cards (1 card per position) if Tier is expanded
            if (!isTierCollapsed) {
                let positionX = 0;

                distinctTitles.forEach((tName) => {
                    const positionUsers = titleMap.get(tName) || [];
                    const positionId = `position__${tierDef.key}__${tName}`;

                    // Unified Position Card (contains Position info + its Employees list in 1 card)
                    generatedNodes.push({
                        id: positionId,
                        type: 'job_position_card',
                        position: { x: positionX, y: currentY + 120 },
                        draggable: true,
                        data: {
                            nodeId: positionId,
                            title: tName,
                            label: tName,
                            levelKey: 'job_title',
                            levelLabel: 'Posisi / Jabatan',
                            users: positionUsers,
                            totalUsers: positionUsers.length,
                            onSelect: (d) => setSelectedNode(d),
                            onSelectUser: (u) => {
                                setSelectedNode({
                                    title: u.name,
                                    label: u.name,
                                    levelKey: 'user',
                                    levelLabel: u.job_title_name || 'Karyawan',
                                    users: [u],
                                    totalUsers: 1,
                                    badgeBg: 'bg-cyan-100 text-cyan-800 border-cyan-300',
                                });
                            },
                        },
                    });

                    // Edge from Tier Header directly to Unified Position Card
                    generatedEdges.push({
                        id: `edge_${tierNodeId}_${positionId}`,
                        source: tierNodeId,
                        target: positionId,
                        type: 'smoothstep',
                        style: { stroke: '#06b6d4', strokeWidth: 1.8 },
                    });

                    positionX += POSITION_STEP;
                });
            }

            // Advance Y coordinate for the next lower tier
            const tierBlockHeight = !isTierCollapsed ? 440 : 160;
            currentY += tierBlockHeight;
        });

        return { nodes: generatedNodes, edges: generatedEdges };
    }, [filteredUsers, collapsedNodeIds, visibleTiers]);

    // Live Node & Edge States for interactive Drag & Drop
    const [nodes, setNodes] = useState<Node<JobTreeNodeData>[]>(computedFlow.nodes);
    const [edges, setEdges] = useState<Edge[]>(computedFlow.edges);

    useEffect(() => {
        setNodes(computedFlow.nodes);
        setEdges(computedFlow.edges);
    }, [computedFlow]);

    const onNodesChange: OnNodesChange = useCallback(
        (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
        []
    );

    const onEdgesChange: OnEdgesChange = useCallback(
        (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
        []
    );

    // Filter people list in the open drawer
    const displayedUsersInDrawer = useMemo(() => {
        if (!selectedNode) return [];
        if (!userSearchText.trim()) return selectedNode.users;
        const q = userSearchText.toLowerCase();
        return selectedNode.users.filter(
            (u) =>
                u.name?.toLowerCase().includes(q) ||
                u.nik?.toLowerCase().includes(q) ||
                u.email?.toLowerCase().includes(q) ||
                u.department_name?.toLowerCase().includes(q) ||
                u.job_title_name?.toLowerCase().includes(q)
        );
    }, [selectedNode, userSearchText]);

    return (
        <div className="flex flex-col h-full w-full bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-xs relative">
            {/* Header & Controls Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-5 py-3 dark:border-zinc-800 dark:bg-zinc-900 z-10">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
                        <Crown className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            Pohon Jenjang Hierarki Jabatan
                            <span className="text-[10px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/20">
                                {filteredUsers.length} Karyawan Terfilter
                            </span>
                        </h3>
                        <p className="text-[11px] text-slate-500">
                            Piramida Senioritas: Direksi &rarr; GM &rarr; Manager &rarr; Asst. Manager &rarr; Supervisor &rarr; Staff &rarr; Non-Staff (Bebas Drag & Drop)
                        </p>
                    </div>
                </div>

                {/* Right Action Tools */}
                <div className="flex items-center gap-2">
                    {/* Filter Is Used Selector */}
                    <div className="flex items-center rounded-xl border border-slate-200 bg-slate-100 p-0.5 dark:border-zinc-800 dark:bg-zinc-800/80">
                        <button
                            type="button"
                            onClick={() => setUsedFilter('used_only')}
                            className={cn(
                                'px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer',
                                usedFilter === 'used_only'
                                    ? 'bg-white text-indigo-600 shadow-xs dark:bg-zinc-900 dark:text-indigo-400'
                                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                            )}
                            title="Tampilkan hanya entitas dengan is_used = true di semua level hierarki"
                        >
                            Is Used: True
                        </button>
                        <button
                            type="button"
                            onClick={() => setUsedFilter('all')}
                            className={cn(
                                'px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer',
                                usedFilter === 'all'
                                    ? 'bg-white text-slate-900 shadow-xs dark:bg-zinc-900 dark:text-slate-100'
                                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                            )}
                            title="Tampilkan semua master data"
                        >
                            Semua Data
                        </button>
                    </div>

                    {/* Search Input */}
                    <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari nama, NIK, jabatan..."
                            className="h-8 pl-8 pr-7 text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 w-44 sm:w-56"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                    {/* Server-side Sync Button */}
                    <button
                        type="button"
                        onClick={handleSyncData}
                        disabled={isSyncing}
                        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-zinc-700 text-xs font-semibold shadow-2xs transition-all cursor-pointer disabled:opacity-60"
                        title="Segarkan data hierarki langsung dari database"
                    >
                        <RefreshCw size={13} className={cn('text-indigo-600', isSyncing && 'animate-spin')} />
                        <span>{isSyncing ? 'Menyinkronkan...' : 'Sync Data'}</span>
                    </button>

                    {/* Filter & Level Panel Toggle Button */}
                    <button
                        type="button"
                        onClick={() => setIsConfigOpen(!isConfigOpen)}
                        className={cn(
                            'inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer',
                            isConfigOpen
                                ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                                : 'bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50'
                        )}
                    >
                        <SlidersHorizontal size={13} />
                        <span>Filter & Level</span>
                    </button>
                </div>
            </div>

            {/* Filter Controls Panel (Multi-Select Filters & Level Toggles) */}
            {isConfigOpen && (
                <div className="border-b border-slate-200 bg-slate-50/95 dark:bg-zinc-900/95 backdrop-blur-md px-5 py-3 dark:border-zinc-800 z-10 space-y-3 animate-in slide-in-from-top duration-150">
                    {/* Row 1: Multiple Select Criteria */}
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mr-1">
                            <Filter size={13} className="text-amber-600" /> Filter Organisasi (Multi-Select):
                        </span>

                        {/* Multi Select Groups */}
                        <MultiSelectDropdown
                            title="Group"
                            options={optGroups}
                            selectedValues={selectedGroups}
                            onChange={setSelectedGroups}
                            icon={Layers}
                        />

                        {/* Multi Select Organization Groups */}
                        <MultiSelectDropdown
                            title="Group Organisasi"
                            options={optOrganizationGroups}
                            selectedValues={selectedOrganizationGroups}
                            onChange={setSelectedOrganizationGroups}
                            icon={FolderClosed}
                        />

                        {/* Multi Select Regions */}
                        <MultiSelectDropdown
                            title="Region"
                            options={optRegions}
                            selectedValues={selectedRegions}
                            onChange={setSelectedRegions}
                            icon={MapPin}
                        />

                        {/* Multi Select Locations */}
                        <MultiSelectDropdown
                            title="Lokasi"
                            options={optLocations}
                            selectedValues={selectedLocations}
                            onChange={setSelectedLocations}
                            icon={Navigation}
                        />

                        {/* Multi Select Companies */}
                        <MultiSelectDropdown
                            title="Company"
                            options={optCompanies}
                            selectedValues={selectedCompanies}
                            onChange={setSelectedCompanies}
                            icon={Building2}
                        />

                        {/* Multi Select Divisions */}
                        <MultiSelectDropdown
                            title="Divisi"
                            options={optDivisions}
                            selectedValues={selectedDivisions}
                            onChange={setSelectedDivisions}
                            icon={Network}
                        />

                        {/* Multi Select Departments */}
                        <MultiSelectDropdown
                            title="Departemen"
                            options={optDepartments}
                            selectedValues={selectedDepartments}
                            onChange={setSelectedDepartments}
                            icon={Building}
                        />

                        {/* Multi Select Subdepartments */}
                        <MultiSelectDropdown
                            title="Subdepartemen"
                            options={optSubdepartments}
                            selectedValues={selectedSubdepartments}
                            onChange={setSelectedSubdepartments}
                            icon={FolderTree}
                        />

                        {/* Multi Select Sections */}
                        <MultiSelectDropdown
                            title="Seksi / Rayon"
                            options={optSections}
                            selectedValues={selectedSections}
                            onChange={setSelectedSections}
                            icon={GitBranch}
                        />

                        {/* Multi Select Group Level */}
                        <MultiSelectDropdown
                            title="Group Level"
                            options={optJobLevelGroups}
                            selectedValues={selectedJobLevelGroups}
                            onChange={setSelectedJobLevelGroups}
                            icon={Layers}
                        />

                        {/* Multi Select Job Level */}
                        <MultiSelectDropdown
                            title="Job Level (Grade)"
                            options={optJobLevels}
                            selectedValues={selectedJobLevels}
                            onChange={setSelectedJobLevels}
                            icon={Tags}
                        />

                        {/* Multi Select Job Title */}
                        <MultiSelectDropdown
                            title="Job Title"
                            options={optJobTitles}
                            selectedValues={selectedJobTitles}
                            onChange={setSelectedJobTitles}
                            icon={UserCheck}
                        />

                        {/* Multi Select Role Akses */}
                        <MultiSelectDropdown
                            title="Role Akses"
                            options={optRoles}
                            selectedValues={selectedRoles}
                            onChange={setSelectedRoles}
                            icon={Shield}
                        />

                        {/* Reset All Filters Button */}
                        {hasActiveMultiFilters && (
                            <button
                                type="button"
                                onClick={resetAllFilters}
                                className="inline-flex items-center gap-1 h-8 px-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-semibold cursor-pointer transition-colors"
                            >
                                <RotateCcw size={12} />
                                Reset Filter
                            </button>
                        )}
                    </div>

                    {/* Row 2: Hierarchical Tier Toggles */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/80 dark:border-zinc-800 text-xs text-slate-600 dark:text-slate-400">
                        <span className="font-bold text-slate-700 dark:text-slate-300">Jenjang Senioritas:</span>

                        {SENIORITY_TIERS.map((tier) => {
                            const isVisible = visibleTiers[tier.key] !== false;
                            const IconComponent = tier.icon;
                            return (
                                <button
                                    key={tier.key}
                                    type="button"
                                    onClick={() =>
                                        setVisibleTiers((prev) => ({
                                            ...prev,
                                            [tier.key]: !isVisible,
                                        }))
                                    }
                                    className={cn(
                                        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold border transition-all cursor-pointer',
                                        isVisible
                                            ? 'bg-white dark:bg-zinc-800 border-slate-300 dark:border-zinc-700 text-slate-800 dark:text-slate-200 shadow-2xs'
                                            : 'bg-slate-100 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-400 opacity-50'
                                    )}
                                >
                                    <IconComponent className="w-3.5 h-3.5 text-amber-500" />
                                    <span>{tier.title.split(' ')[0]} {tier.title.split(' ')[1] || ''}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Flow Canvas with Drag & Drop */}
            <div className="flex-1 w-full h-full min-h-[500px] relative">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    nodeTypes={nodeTypes}
                    onInit={setReactFlowInstance}
                    nodesDraggable={true}
                    elementsSelectable={true}
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
                            if (n.type === 'job_tier_node') return '#f59e0b';
                            return '#06b6d4';
                        }}
                        className="!bg-white/80 dark:!bg-slate-900/80 !border-slate-200 dark:!border-slate-800 !rounded-lg !shadow-md"
                    />
                </ReactFlow>
            </div>

            {/* Right Side Drawer for Detailed People List when Node Clicked */}
            {selectedNode && (
                <div className="absolute inset-y-0 right-0 w-96 max-w-full bg-white dark:bg-zinc-900 border-l border-slate-200 dark:border-zinc-800 shadow-2xl z-40 flex flex-col animate-in slide-in-from-right duration-200">
                    {/* Drawer Header */}
                    <div className="p-4 border-b border-slate-200 dark:border-zinc-800 flex items-start justify-between bg-slate-50 dark:bg-zinc-900">
                        <div>
                            <span className={cn('text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border', selectedNode.badgeBg || 'bg-amber-100 text-amber-800 border-amber-300')}>
                                {selectedNode.levelLabel}
                            </span>
                            <h2 className="text-sm font-bold text-slate-900 dark:text-white mt-1 break-words">
                                {selectedNode.title}
                            </h2>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                                Total <strong>{selectedNode.totalUsers}</strong> orang terdaftar di hierarki ini
                            </p>
                        </div>
                        <button
                            onClick={() => setSelectedNode(null)}
                            className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Search inside Drawer */}
                    <div className="p-3 border-b border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                        <div className="relative">
                            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Filter nama atau NIK di list ini..."
                                value={userSearchText}
                                onChange={(e) => setUserSearchText(e.target.value)}
                                className="h-8 w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 text-xs text-slate-900 focus:border-primary focus:bg-white focus:outline-none dark:border-zinc-800 dark:bg-zinc-800 dark:text-slate-100"
                            />
                            {userSearchText && (
                                <button
                                    onClick={() => setUserSearchText('')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                                >
                                    <X size={12} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* List of People */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-slate-100 dark:divide-zinc-800/60 [scrollbar-width:thin]">
                        {displayedUsersInDrawer.length === 0 ? (
                            <div className="text-center py-10 text-xs text-slate-400">
                                Tidak ada orang ditemukan dengan filter pencarian ini.
                            </div>
                        ) : (
                            displayedUsersInDrawer.map((u) => (
                                <div key={u.id} className="pt-2.5 first:pt-0 flex items-start gap-3">
                                    <div className="h-8 w-8 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 border border-amber-500/20">
                                        {u.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-1">
                                            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate" title={u.name}>
                                                {u.name}
                                            </h4>
                                            <span className="text-[10px] font-semibold px-1.5 py-0.2 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300 rounded">
                                                {u.role_name || 'Staff'}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <p className="text-[11px] font-medium text-amber-600 dark:text-amber-400 truncate">
                                                {u.job_title_name}
                                            </p>
                                            {u.job_level_name && (
                                                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-purple-50 border border-purple-200 text-purple-700 dark:bg-purple-950/40 dark:border-purple-800 dark:text-purple-300 shrink-0">
                                                    {u.job_level_name}
                                                </span>
                                            )}
                                        </div>

                                        <div className="mt-1 space-y-0.5 text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                                            {u.reporting_to && (
                                                <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-sans font-semibold">
                                                    <UserCheck size={11} className="shrink-0" />
                                                    <span className="truncate">Atasan Langsung: {u.reporting_to}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-1.5">
                                                <IdCard size={11} className="text-slate-400 shrink-0" />
                                                <span>NIK: {u.nik}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 truncate">
                                                <Mail size={11} className="text-slate-400 shrink-0" />
                                                <a href={`mailto:${u.email}`} className="hover:text-primary truncate">
                                                    {u.email}
                                                </a>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-slate-400">
                                                <Building size={11} className="shrink-0" />
                                                <span className="truncate">
                                                    {u.company_name}
                                                    {u.org_group_name ? ` · Org: ${u.org_group_name}` : ''}
                                                    {u.division_name ? ` · Div: ${u.division_name}` : ''}
                                                    {` · Dept: ${u.department_name}`}
                                                    {u.subdepartment_name ? ` · Sub: ${u.subdepartment_name}` : ''}
                                                    {u.section_name ? ` · Sec: ${u.section_name}` : ''}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Drawer Footer */}
                    <div className="p-3 border-t border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-right">
                        <button
                            onClick={() => setSelectedNode(null)}
                            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
                        >
                            Tutup Panel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
