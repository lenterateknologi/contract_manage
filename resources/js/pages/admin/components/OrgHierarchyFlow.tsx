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
    Save,
    Shield,
    RefreshCw,
    FolderClosed,
    FolderTree,
    GitBranch,
} from 'lucide-react';
import { router } from '@inertiajs/react';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'org_hierarchy_view_settings_v1';

interface SavedHierarchySettings {
    enabledLevelKeys?: HierarchyLevelKey[];
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
    selectedJobLevels?: string[];
    selectedJobTitles?: string[];
    selectedRoles?: string[];
    isConfigOpen?: boolean;
}

const loadSavedSettings = (): SavedHierarchySettings => {
    if (typeof window === 'undefined') return {};
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            return JSON.parse(saved);
        }
    } catch {
        // Ignore JSON parse errors
    }
    return {};
};

export interface HierarchyUser {
    id: string;
    name: string;
    email: string;
    nik: string;
    is_used?: boolean;
    group_id?: string;
    group_name: string;
    org_group_name?: string;
    region_id?: string;
    region_name: string;
    location_id?: string;
    location_name: string;
    company_id?: string;
    company_name: string;
    division_id?: string;
    division_name?: string;
    department_id?: string;
    department_name: string;
    subdepartment_id?: string;
    subdepartment_name?: string;
    section_id?: string;
    section_name?: string;
    job_title_id?: string;
    job_title_name: string;
    job_level_id?: string;
    job_level_name?: string;
    job_level_code?: string;
    job_level_rank?: number;
    job_level_group_id?: string;
    job_level_group_name?: string;
    role_name?: string;
    reporting_to?: string;
    idreporting_to?: string | number;
}

export type HierarchyLevelKey = 'group' | 'org_group' | 'region' | 'location' | 'company' | 'division' | 'department' | 'subdepartment' | 'section' | 'job_level' | 'job_title' | 'role' | 'employee';

export interface LevelConfig {
    key: HierarchyLevelKey;
    label: string;
    field?: keyof HierarchyUser;
    icon: React.ElementType;
    color: string;
    badgeBg: string;
}

export const ALL_LEVELS: LevelConfig[] = [
    { key: 'group', label: 'Company Group', field: 'group_name', icon: Layers, color: 'text-indigo-600 dark:text-indigo-400', badgeBg: 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-300' },
    { key: 'org_group', label: 'Group Organisasi', field: 'org_group_name', icon: FolderClosed, color: 'text-sky-600 dark:text-sky-400', badgeBg: 'bg-sky-50 border-sky-200 text-sky-700 dark:bg-sky-950/40 dark:border-sky-800 dark:text-sky-300' },
    { key: 'region', label: 'Region', field: 'region_name', icon: MapPin, color: 'text-emerald-600 dark:text-emerald-400', badgeBg: 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300' },
    { key: 'location', label: 'Location', field: 'location_name', icon: Building2, color: 'text-amber-600 dark:text-amber-400', badgeBg: 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300' },
    { key: 'company', label: 'Company', field: 'company_name', icon: Building, color: 'text-blue-600 dark:text-blue-400', badgeBg: 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-300' },
    { key: 'division', label: 'Division', field: 'division_name', icon: Network, color: 'text-teal-600 dark:text-teal-400', badgeBg: 'bg-teal-50 border-teal-200 text-teal-700 dark:bg-teal-950/40 dark:border-teal-800 dark:text-teal-300' },
    { key: 'department', label: 'Department', field: 'department_name', icon: Briefcase, color: 'text-purple-600 dark:text-purple-400', badgeBg: 'bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-950/40 dark:border-purple-800 dark:text-purple-300' },
    { key: 'subdepartment', label: 'Sub-Departemen', field: 'subdepartment_name', icon: FolderTree, color: 'text-fuchsia-600 dark:text-fuchsia-400', badgeBg: 'bg-fuchsia-50 border-fuchsia-200 text-fuchsia-700 dark:bg-fuchsia-950/40 dark:border-fuchsia-800 dark:text-fuchsia-300' },
    { key: 'section', label: 'Seksi / Rayon', field: 'section_name', icon: GitBranch, color: 'text-pink-600 dark:text-pink-400', badgeBg: 'bg-pink-50 border-pink-200 text-pink-700 dark:bg-pink-950/40 dark:border-pink-800 dark:text-pink-300' },
    { key: 'job_level', label: 'Job Level', field: 'job_level_name', icon: Layers, color: 'text-orange-600 dark:text-orange-400', badgeBg: 'bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-950/40 dark:border-orange-800 dark:text-orange-300' },
    { key: 'job_title', label: 'Job Title', field: 'job_title_name', icon: UserCheck, color: 'text-rose-600 dark:text-rose-400', badgeBg: 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300' },
    { key: 'role', label: 'Role Akses', field: 'role_name', icon: Shield, color: 'text-violet-600 dark:text-violet-400', badgeBg: 'bg-violet-50 border-violet-200 text-violet-700 dark:bg-violet-950/40 dark:border-violet-800 dark:text-violet-300' },
    { key: 'employee', label: 'List Employee (Orang)', icon: UserIcon, color: 'text-cyan-600 dark:text-cyan-400', badgeBg: 'bg-cyan-50 border-cyan-200 text-cyan-700 dark:bg-cyan-950/40 dark:border-cyan-800 dark:text-cyan-300' },
];

interface TreeNodeData extends Record<string, unknown> {
    nodeId?: string;
    title: string;
    levelKey: HierarchyLevelKey;
    levelLabel: string;
    color: string;
    badgeBg: string;
    users: HierarchyUser[];
    totalUsers: number;
    hasUser: boolean;
    isMasterUsed: boolean;
    isSelected: boolean;
    isHighlighted?: boolean;
    isCurrentMatch?: boolean;
    onSelect: (data: TreeNodeData) => void;
}

// Custom Node for Standard Org Hierarchy Node
function OrgHierarchyNode({ data }: NodeProps<Node<TreeNodeData>>) {
    const { title, levelLabel, badgeBg, totalUsers, hasUser, isMasterUsed, isSelected, isHighlighted, isCurrentMatch, onSelect } = data;

    return (
        <div
            onClick={() => onSelect(data)}
            className={cn(
                'w-[240px] rounded-2xl border p-3.5 shadow-sm transition-all duration-200 cursor-pointer bg-white dark:bg-zinc-900 relative',
                isCurrentMatch
                    ? 'border-amber-500 ring-4 ring-amber-400/50 shadow-xl scale-105 z-30 bg-amber-50/20 dark:bg-amber-950/30 animate-pulse'
                    : isHighlighted
                        ? 'border-amber-400 ring-2 ring-amber-300/40 shadow-md'
                        : isSelected
                            ? 'border-primary ring-2 ring-primary/20 shadow-md scale-102'
                            : 'border-slate-200/80 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 hover:shadow-md'
            )}
        >
            {isCurrentMatch && (
                <div className="absolute -top-3 -right-2 bg-amber-500 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full shadow-md flex items-center gap-1 z-10 animate-bounce">
                    <Crosshair size={10} /> DITEMUKAN
                </div>
            )}
            <Handle type="target" position={Position.Top} className="!w-2.5 !h-2.5 !bg-slate-400 dark:!bg-zinc-600 border-2 border-white dark:border-zinc-900" />

            <div className="flex items-center justify-between gap-2 mb-2">
                <span className={cn('text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border', badgeBg)}>
                    {levelLabel}
                </span>
                <span className={cn(
                    'inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full',
                    isMasterUsed
                        ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60'
                        : 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-zinc-800'
                )}>
                    {hasUser ? <Users size={11} className="text-slate-400" /> : <UserX size={11} className="text-amber-500" />}
                    {totalUsers} orang
                </span>
            </div>

            <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate leading-tight" title={title}>
                {title}
            </div>

            <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between text-[10px] text-slate-500">
                <span className="font-medium text-slate-400">{hasUser ? 'Klik untuk list lengkap' : 'Belum ada anggota'}</span>
                {hasUser && <ChevronRight size={13} className="text-slate-400" />}
            </div>

            <Handle type="source" position={Position.Bottom} className="!w-2.5 !h-2.5 !bg-slate-400 dark:!bg-zinc-600 border-2 border-white dark:border-zinc-900" />
        </div>
    );
}

// Custom Node for Embedded Employee List directly in canvas tree
function EmployeeListNode({ data }: NodeProps<Node<TreeNodeData>>) {
    const { title, users, totalUsers, isSelected, isHighlighted, isCurrentMatch, onSelect } = data;
    const [filterText, setFilterText] = useState('');

    const displayed = useMemo(() => {
        if (!filterText.trim()) return users.slice(0, 50);
        const q = filterText.toLowerCase();
        return users.filter(u => u.name?.toLowerCase().includes(q) || u.nik?.toLowerCase().includes(q) || u.job_title_name?.toLowerCase().includes(q)).slice(0, 50);
    }, [users, filterText]);

    return (
        <div
            className={cn(
                'w-[340px] rounded-2xl border p-3.5 shadow-lg bg-white dark:bg-zinc-900 text-left transition-all duration-200 relative',
                isCurrentMatch
                    ? 'border-amber-500 ring-4 ring-amber-400/50 shadow-2xl scale-102 z-30 bg-amber-50/10 dark:bg-amber-950/20'
                    : isHighlighted
                        ? 'border-amber-400 ring-2 ring-amber-300/40'
                        : isSelected
                            ? 'border-primary ring-2 ring-primary/20'
                            : 'border-slate-200/90 dark:border-zinc-800 hover:border-slate-300'
            )}
        >
            {isCurrentMatch && (
                <div className="absolute -top-3 -right-2 bg-amber-500 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full shadow-md flex items-center gap-1 z-10 animate-bounce">
                    <Crosshair size={10} /> DITEMUKAN
                </div>
            )}
            <Handle type="target" position={Position.Top} className="!w-2.5 !h-2.5 !bg-slate-400 dark:!bg-zinc-600 border-2 border-white dark:border-zinc-900" />

            <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-100 dark:border-zinc-800">
                <div>
                    <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border bg-cyan-50 border-cyan-200 text-cyan-700 dark:bg-cyan-950/40 dark:border-cyan-800 dark:text-cyan-300">
                        List Employee
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate mt-1">
                        {title}
                    </h4>
                </div>
                <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full shrink-0">
                    {totalUsers} orang
                </span>
            </div>

            {/* Quick mini search within node */}
            <div className="relative mb-2">
                <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                    type="text"
                    placeholder="Cari orang di list ini..."
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    className="h-6 w-full rounded-lg border border-slate-200 bg-slate-50 pl-6 pr-2 text-[10px] text-slate-900 focus:border-primary focus:bg-white focus:outline-none dark:border-zinc-800 dark:bg-zinc-800 dark:text-slate-100"
                />
            </div>

            {/* Scrollable list of people inside the node */}
            <div className="max-h-[360px] overflow-y-auto space-y-1.5 pr-1 [scrollbar-width:thin]">
                {displayed.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400">
                        Belum ada data anggota.
                    </div>
                ) : (
                    displayed.map((u) => (
                        <div
                            key={u.id}
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelect(data);
                            }}
                            className="p-1.5 rounded-lg bg-slate-50 dark:bg-zinc-800/60 hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center gap-2 cursor-pointer transition-colors"
                        >
                            <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px] shrink-0 border border-primary/20">
                                {u.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="text-[11px] font-semibold text-slate-900 dark:text-slate-100 truncate">
                                    {u.name}
                                </div>
                                <div className="text-[9px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                                    <span className="text-primary font-medium truncate">{u.job_title_name}</span>
                                    <span>·</span>
                                    <span className="font-mono">{u.nik}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
                {totalUsers > 50 && !filterText && (
                    <div
                        onClick={() => onSelect(data)}
                        className="text-center py-1.5 text-[10px] font-bold text-primary hover:underline cursor-pointer"
                    >
                        + Lihat {totalUsers - 50} orang lainnya di panel...
                    </div>
                )}
            </div>
        </div>
    );
}

const nodeTypes = {
    orgNode: OrgHierarchyNode,
    employeeListNode: EmployeeListNode,
};

// Reusable Multi-Select Dropdown Component
export interface MultiSelectDropdownProps {
    title: string;
    options: { id: string; name: string; is_used?: boolean }[];
    selectedValues: string[];
    onChange: (selected: string[]) => void;
    icon: React.ElementType;
}

export function MultiSelectDropdown({
    title,
    options,
    selectedValues,
    onChange,
    icon: Icon,
}: MultiSelectDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as HTMLElement)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOptions = useMemo(() => {
        if (!searchTerm.trim()) return options;
        const q = searchTerm.toLowerCase();
        return options.filter((o) => o.name?.toLowerCase().includes(q));
    }, [options, searchTerm]);

    const toggleOption = (name: string) => {
        if (selectedValues.includes(name)) {
            onChange(selectedValues.filter((v) => v !== name));
        } else {
            onChange([...selectedValues, name]);
        }
    };

    const displayedOptionNames = useMemo(() => {
        return filteredOptions.map((o) => o.name).filter(Boolean);
    }, [filteredOptions]);

    const isAllFilteredChecked =
        displayedOptionNames.length > 0 &&
        displayedOptionNames.every((name) => selectedValues.includes(name));

    const handleSelectAll = () => {
        if (isAllFilteredChecked) {
            // Uncheck only the currently displayed/filtered options
            const displayedSet = new Set(displayedOptionNames);
            onChange(selectedValues.filter((v) => !displayedSet.has(v)));
        } else {
            // Add all currently displayed/filtered options to selection
            const combined = Array.from(new Set([...selectedValues, ...displayedOptionNames]));
            onChange(combined);
        }
    };

    return (
        <div className="relative" ref={containerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    'inline-flex items-center gap-1.5 h-8 px-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer bg-white dark:bg-zinc-800',
                    selectedValues.length > 0
                        ? 'border-primary text-primary ring-2 ring-primary/10'
                        : 'border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-slate-200 hover:border-slate-300'
                )}
            >
                <Icon size={12} className={selectedValues.length > 0 ? 'text-primary' : 'text-slate-400'} />
                <span>
                    {title} {selectedValues.length > 0 ? `(${selectedValues.length})` : ''}
                </span>
                <ChevronDown size={12} className="text-slate-400" />
            </button>

            {isOpen && (
                <div className="absolute left-0 mt-1 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 z-50 animate-in fade-in duration-100">
                    <div className="relative mb-2">
                        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder={`Cari ${title}...`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-7 w-full rounded-lg border border-slate-200 bg-slate-50 pl-7 pr-2 text-xs focus:border-primary focus:outline-none dark:border-zinc-800 dark:bg-zinc-800 dark:text-slate-100"
                        />
                    </div>

                    <div className="flex items-center justify-between px-1 py-1 text-[11px] font-semibold border-b border-slate-100 dark:border-zinc-800 mb-1">
                        <button
                            type="button"
                            onClick={handleSelectAll}
                            className={cn('text-xs cursor-pointer hover:underline', isAllFilteredChecked ? 'text-primary font-bold' : 'text-slate-600 hover:text-slate-900')}
                        >
                            {isAllFilteredChecked ? 'Batalkan Semua' : 'Pilih Semua'}
                        </button>
                        {selectedValues.length > 0 && (
                            <button
                                type="button"
                                onClick={() => onChange([])}
                                className="text-xs text-rose-500 hover:underline cursor-pointer"
                            >
                                Reset ({selectedValues.length})
                            </button>
                        )}
                    </div>

                    <div className="max-h-52 overflow-y-auto space-y-1 [scrollbar-width:thin]">
                        {filteredOptions.length === 0 ? (
                            <div className="p-2 text-center text-xs text-slate-400">Tidak ditemukan</div>
                        ) : (
                            filteredOptions.map((opt) => {
                                const isChecked = selectedValues.includes(opt.name);
                                return (
                                    <div
                                        key={opt.id}
                                        onClick={() => toggleOption(opt.name)}
                                        className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer text-xs"
                                    >
                                        <div
                                            className={cn(
                                                'w-3.5 h-3.5 rounded flex items-center justify-center border text-[9px] shrink-0',
                                                isChecked
                                                    ? 'bg-primary text-white border-primary'
                                                    : 'border-slate-300 dark:border-zinc-700'
                                            )}
                                        >
                                            {isChecked && <Check size={10} strokeWidth={3} />}
                                        </div>
                                        <span className="truncate text-slate-800 dark:text-slate-200" title={opt.name}>
                                            {opt.name}
                                        </span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

interface OrgHierarchyFlowProps {
    users: HierarchyUser[];
    masterGroups?: any[];
    masterOrganizationGroups?: any[];
    masterRegions?: any[];
    masterLocations?: any[];
    masterCompanies?: any[];
    masterDivisions?: any[];
    masterDepartments?: any[];
    masterSubdepartments?: any[];
    masterSections?: any[];
    masterJobLevels?: any[];
    masterJobTitles?: any[];
    masterRoles?: any[];
    // External filter props (if controlled by parent Index)
    enabledLevelKeys?: HierarchyLevelKey[];
    usedFilter?: 'used_only' | 'all';
    searchQuery?: string;
    selectedGroups?: string[];
    selectedOrganizationGroups?: string[];
    selectedRegions?: string[];
    selectedLocations?: string[];
    selectedCompanies?: string[];
    selectedDivisions?: string[];
    selectedDepartments?: string[];
    selectedSubdepartments?: string[];
    selectedSections?: string[];
    selectedJobLevels?: string[];
    selectedJobTitles?: string[];
    selectedRoles?: string[];
}

export function OrgHierarchyFlow({
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
    masterJobLevels = [],
    masterJobTitles = [],
    masterRoles = [],
    enabledLevelKeys: extEnabledLevelKeys,
    usedFilter: extUsedFilter,
    searchQuery: extSearchQuery,
    selectedGroups: extSelectedGroups,
    selectedOrganizationGroups: extSelectedOrgGroups,
    selectedRegions: extSelectedRegions,
    selectedLocations: extSelectedLocations,
    selectedCompanies: extSelectedCompanies,
    selectedDivisions: extSelectedDivisions,
    selectedDepartments: extSelectedDepartments,
    selectedSubdepartments: extSelectedSubdepartments,
    selectedSections: extSelectedSections,
    selectedJobLevels: extSelectedJobLevels,
    selectedJobTitles: extSelectedJobTitles,
    selectedRoles: extSelectedRoles,
}: OrgHierarchyFlowProps) {
    const savedInitial = useMemo(() => loadSavedSettings(), []);

    // Enabled levels state (Default: group + employee list or restored from cache)
    const [internalEnabledLevelKeys, setInternalEnabledLevelKeys] = useState<HierarchyLevelKey[]>(() => {
        return savedInitial.enabledLevelKeys && savedInitial.enabledLevelKeys.length > 0
            ? savedInitial.enabledLevelKeys
            : ['group', 'employee'];
    });
    const enabledLevelKeys = extEnabledLevelKeys ?? internalEnabledLevelKeys;

    // Active selected node data for Drawer / Modal list of people
    const [selectedNode, setSelectedNode] = useState<TreeNodeData | null>(null);
    const [internalSearchFilter, setInternalSearchFilter] = useState('');
    const searchFilter = extSearchQuery ?? internalSearchFilter;
    const [userSearchText, setUserSearchText] = useState('');
    const [isConfigOpen, setIsConfigOpen] = useState<boolean>(() => {
        return savedInitial.isConfigOpen !== undefined ? savedInitial.isConfigOpen : true;
    });

    // Card Finder / Jump to Node States
    const [cardFindQuery, setCardFindQuery] = useState('');
    const [currentCardFindIndex, setCurrentCardFindIndex] = useState(0);
    const reactFlowInstanceRef = useRef<ReactFlowInstance<any, any> | null>(null);

    // Filter is_used: 'used_only' (is_used = true across all active levels) | 'all' (all data)
    const [internalUsedFilter, setInternalUsedFilter] = useState<'used_only' | 'all'>(() => {
        return savedInitial.usedFilter || 'used_only';
    });
    const usedFilter = extUsedFilter ?? internalUsedFilter;

    // Minimizable Toolbar State
    const [isToolbarCollapsed, setIsToolbarCollapsed] = useState(false);

    // Server-side cache sync / refresh state
    const [isSyncing, setIsSyncing] = useState(false);
    const handleSyncData = () => {
        setIsSyncing(true);
        router.get(
            '/admin/members',
            { refresh: 1, tab: 'org' },
            {
                preserveState: false,
                preserveScroll: true,
                onFinish: () => setIsSyncing(false),
            }
        );
    };

    // Multiple Select Filter States (restored from cache)
    const [internalSelectedGroups, setInternalSelectedGroups] = useState<string[]>(() => savedInitial.selectedGroups || []);
    const [internalSelectedOrganizationGroups, setInternalSelectedOrganizationGroups] = useState<string[]>(() => savedInitial.selectedOrganizationGroups || []);
    const [internalSelectedRegions, setInternalSelectedRegions] = useState<string[]>(() => savedInitial.selectedRegions || []);
    const [internalSelectedLocations, setInternalSelectedLocations] = useState<string[]>(() => savedInitial.selectedLocations || []);
    const [internalSelectedCompanies, setInternalSelectedCompanies] = useState<string[]>(() => savedInitial.selectedCompanies || []);
    const [internalSelectedDivisions, setInternalSelectedDivisions] = useState<string[]>(() => savedInitial.selectedDivisions || []);
    const [internalSelectedDepartments, setInternalSelectedDepartments] = useState<string[]>(() => savedInitial.selectedDepartments || []);
    const [internalSelectedSubdepartments, setInternalSelectedSubdepartments] = useState<string[]>(() => savedInitial.selectedSubdepartments || []);
    const [internalSelectedSections, setInternalSelectedSections] = useState<string[]>(() => savedInitial.selectedSections || []);
    const [internalSelectedJobLevels, setInternalSelectedJobLevels] = useState<string[]>(() => savedInitial.selectedJobLevels || []);
    const [internalSelectedJobTitles, setInternalSelectedJobTitles] = useState<string[]>(() => savedInitial.selectedJobTitles || []);
    const [internalSelectedRoles, setInternalSelectedRoles] = useState<string[]>(() => savedInitial.selectedRoles || []);

    const selectedGroups = extSelectedGroups ?? internalSelectedGroups;
    const selectedOrganizationGroups = extSelectedOrgGroups ?? internalSelectedOrganizationGroups;
    const selectedRegions = extSelectedRegions ?? internalSelectedRegions;
    const selectedLocations = extSelectedLocations ?? internalSelectedLocations;
    const selectedCompanies = extSelectedCompanies ?? internalSelectedCompanies;
    const selectedDivisions = extSelectedDivisions ?? internalSelectedDivisions;
    const selectedDepartments = extSelectedDepartments ?? internalSelectedDepartments;
    const selectedSubdepartments = extSelectedSubdepartments ?? internalSelectedSubdepartments;
    const selectedSections = extSelectedSections ?? internalSelectedSections;
    const selectedJobLevels = extSelectedJobLevels ?? internalSelectedJobLevels;
    const selectedJobTitles = extSelectedJobTitles ?? internalSelectedJobTitles;
    const selectedRoles = extSelectedRoles ?? internalSelectedRoles;

    // Auto-save client-side cache to localStorage
    useEffect(() => {
        try {
            const stateToSave: SavedHierarchySettings = {
                enabledLevelKeys,
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
                selectedJobLevels,
                selectedJobTitles,
                selectedRoles,
                isConfigOpen,
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
        } catch {
            // Handle quota or permission errors silently
        }
    }, [
        enabledLevelKeys,
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
        selectedJobLevels,
        selectedJobTitles,
        selectedRoles,
        isConfigOpen,
    ]);

    // Create fast lookup maps for is_used status of master records
    const masterIsUsedMaps = useMemo(() => {
        const createMap = (items: any[]) => {
            const map = new Map<string, boolean>();
            items.forEach((item) => {
                if (item.name) {
                    map.set(item.name.trim().toLowerCase(), item.is_used !== undefined ? Boolean(item.is_used) : true);
                }
            });
            return map;
        };

        return {
            group: createMap(masterGroups),
            org_group: createMap(masterOrganizationGroups),
            region: createMap(masterRegions),
            location: createMap(masterLocations),
            company: createMap(masterCompanies),
            division: createMap(masterDivisions),
            department: createMap(masterDepartments),
            subdepartment: createMap(masterSubdepartments),
            section: createMap(masterSections),
            job_level: createMap(masterJobLevels),
            job_title: createMap(masterJobTitles),
            role: createMap(masterRoles),
        };
    }, [masterGroups, masterOrganizationGroups, masterRegions, masterLocations, masterCompanies, masterDivisions, masterDepartments, masterSubdepartments, masterSections, masterJobLevels, masterJobTitles, masterRoles]);

    // Available options filtered by usedFilter
    const getFilteredMaster = (items: any[]) => {
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
        setSelectedJobLevels([]);
        setSelectedJobTitles([]);
        setSelectedRoles([]);
        setSearchFilter('');
        try {
            localStorage.removeItem(STORAGE_KEY);
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
        selectedJobLevels.length > 0 ||
        selectedJobTitles.length > 0 ||
        selectedRoles.length > 0 ||
        Boolean(searchFilter.trim());

    // Toggle level visibility (strictly show ONLY what is checked!)
    const toggleLevel = (key: HierarchyLevelKey) => {
        setEnabledLevelKeys((prev) => {
            if (prev.includes(key)) {
                if (prev.length === 1) return prev; // Keep at least one
                return prev.filter((k) => k !== key);
            }
            const next = [...prev, key];
            return ALL_LEVELS.filter((l) => next.includes(l.key)).map((l) => l.key);
        });
    };

    // Quick presets
    const setPreset = (type: 'group-only' | 'group-employee' | 'company-employee' | 'full') => {
        if (type === 'group-only') {
            setEnabledLevelKeys(['group']);
        } else if (type === 'group-employee') {
            setEnabledLevelKeys(['group', 'employee']);
        } else if (type === 'company-employee') {
            setEnabledLevelKeys(['company', 'employee']);
        } else if (type === 'full') {
            setEnabledLevelKeys(['group', 'org_group', 'region', 'location', 'company', 'division', 'department', 'subdepartment', 'section', 'job_level', 'job_title', 'role', 'employee']);
        }
    };

    // Helper to check if an entity title has is_used true in master tables
    const checkIsMasterUsed = (lvlKey: HierarchyLevelKey, title: string): boolean => {
        const map = masterIsUsedMaps[lvlKey as keyof typeof masterIsUsedMaps];
        if (!map) return false;
        return map.get(title.trim().toLowerCase()) ?? false;
    };

    // Filtered users by is_used flag, multiple selection criteria and main search
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
            // Global text search
            if (searchFilter.trim()) {
                const q = searchFilter.toLowerCase();
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
        selectedJobLevels,
        selectedJobTitles,
        selectedRoles,
        searchFilter,
    ]);

    // Active level configs (Strictly only selected levels)
    const activeLevels = useMemo(() => {
        return ALL_LEVELS.filter((l) => enabledLevelKeys.includes(l.key));
    }, [enabledLevelKeys]);

    // Build hierarchical tree nodes & edges with true subtree centering & independent horizontal columns
    const { nodes, edges } = useMemo(() => {
        if (activeLevels.length === 0) {
            return { nodes: [], edges: [] };
        }

        const nodesList: Node<TreeNodeData>[] = [];
        const edgesList: Edge[] = [];

        interface LevelTreeNode {
            id: string;
            title: string;
            levelIndex: number;
            levelConfig: LevelConfig;
            isMasterUsed: boolean;
            users: HierarchyUser[];
            children: Map<string, LevelTreeNode>;
            subtreeWidth?: number;
            x?: number;
            y?: number;
        }

        const rootMap = new Map<string, LevelTreeNode>();

        const isEmployeeListEnabled = enabledLevelKeys.includes('employee');
        const structuralLevels = activeLevels.filter((l) => l.key !== 'employee');

        // Case 1: Only 'employee' is selected
        if (structuralLevels.length === 0 && isEmployeeListEnabled) {
            const empNodeId = 'node-all-employees';
            nodesList.push({
                id: empNodeId,
                type: 'employeeListNode',
                position: { x: 50, y: 50 },
                data: {
                    title: 'Daftar Anggota Terpilih',
                    levelKey: 'employee',
                    levelLabel: 'Daftar Employee',
                    color: 'text-cyan-600',
                    badgeBg: 'bg-cyan-50 border-cyan-200 text-cyan-700',
                    users: filteredUsers,
                    totalUsers: filteredUsers.length,
                    hasUser: filteredUsers.length > 0,
                    isMasterUsed: true,
                    isSelected: selectedNode?.title === 'Daftar Anggota Terpilih',
                    onSelect: (d: TreeNodeData) => setSelectedNode(d),
                },
            });
            return { nodes: nodesList, edges: edgesList };
        }

        // 1. Group active users into the tree
        filteredUsers.forEach((u) => {
            let currentMap = rootMap;
            let parentPath = '';

            structuralLevels.forEach((lvl, idx) => {
                const field = lvl.field!;
                const rawVal = u[field];
                const val = rawVal && String(rawVal).trim() !== '' ? String(rawVal) : `No ${lvl.label}`;
                const currentPath = parentPath ? `${parentPath}::${val}` : val;
                const isMasterUsed = checkIsMasterUsed(lvl.key, val);

                if (!currentMap.has(val)) {
                    currentMap.set(val, {
                        id: `node-${idx}-${encodeURIComponent(currentPath)}`,
                        title: val,
                        levelIndex: idx,
                        levelConfig: lvl,
                        isMasterUsed,
                        users: [],
                        children: new Map(),
                    });
                }

                const treeNode = currentMap.get(val)!;
                treeNode.users.push(u);

                parentPath = currentPath;
                currentMap = treeNode.children;
            });
        });

        // 2. If usedFilter === 'all', also add empty master data records for level 0
        if (usedFilter === 'all' && structuralLevels.length > 0) {
            const firstLevel = structuralLevels[0];
            let masterList: any[] = [];
            if (firstLevel.key === 'group') {
                masterList =
                    selectedGroups.length > 0
                        ? masterGroups.filter((g) => selectedGroups.some((sg) => sg.toLowerCase() === g.name?.toLowerCase()))
                        : masterGroups;
            } else if (firstLevel.key === 'org_group') {
                masterList =
                    selectedOrganizationGroups.length > 0
                        ? masterOrganizationGroups.filter((og) => selectedOrganizationGroups.some((sog) => sog.toLowerCase() === og.name?.toLowerCase()))
                        : masterOrganizationGroups;
            } else if (firstLevel.key === 'region') masterList = masterRegions;
            else if (firstLevel.key === 'location') masterList = masterLocations;
            else if (firstLevel.key === 'company') masterList = masterCompanies;
            else if (firstLevel.key === 'division') masterList = masterDivisions;
            else if (firstLevel.key === 'department') masterList = masterDepartments;
            else if (firstLevel.key === 'subdepartment') masterList = masterSubdepartments;
            else if (firstLevel.key === 'section') masterList = masterSections;
            else if (firstLevel.key === 'job_level') masterList = masterJobLevels;
            else if (firstLevel.key === 'job_title') masterList = masterJobTitles;
            else if (firstLevel.key === 'role') masterList = masterRoles;

            masterList.forEach((m) => {
                const title = m.name || m.title;
                if (title && !rootMap.has(title)) {
                    rootMap.set(title, {
                        id: `node-0-${encodeURIComponent(title)}`,
                        title,
                        levelIndex: 0,
                        levelConfig: firstLevel,
                        isMasterUsed: m.is_used !== undefined ? Boolean(m.is_used) : true,
                        users: [],
                        children: new Map(),
                    });
                }
            });
        }

        // Layout parameters
        const levelYSpacing = 220;
        const orgNodeWidth = 240;
        const empNodeWidth = 340;
        const nodeGap = 40; // horizontal gap between sibling subtrees

        // Recursively filter tree nodes based on usedFilter (strictly enforcing is_used across all levels!)
        const filterTreeByIsUsed = (treeNode: LevelTreeNode): boolean => {
            if (usedFilter === 'used_only' && !treeNode.isMasterUsed) {
                return false;
            }

            const validChildren = new Map<string, LevelTreeNode>();
            treeNode.children.forEach((child, key) => {
                if (filterTreeByIsUsed(child)) {
                    validChildren.set(key, child);
                }
            });
            treeNode.children = validChildren;
            return true;
        };

        const validRoots: LevelTreeNode[] = [];
        rootMap.forEach((root) => {
            if (filterTreeByIsUsed(root)) {
                validRoots.push(root);
            }
        });

        // Pass 1: Post-order traversal to calculate required subtree widths
        const calculateSubtreeWidth = (treeNode: LevelTreeNode): number => {
            const hasEmpChild = isEmployeeListEnabled && treeNode.children.size === 0 && treeNode.users.length > 0;

            if (treeNode.children.size === 0) {
                const leafWidth = hasEmpChild ? empNodeWidth : orgNodeWidth;
                treeNode.subtreeWidth = leafWidth;
                return leafWidth;
            }

            let totalChildrenWidth = 0;
            const childrenArray = Array.from(treeNode.children.values());
            childrenArray.forEach((child, index) => {
                const childWidth = calculateSubtreeWidth(child);
                totalChildrenWidth += childWidth;
                if (index > 0) {
                    totalChildrenWidth += nodeGap;
                }
            });

            const ownWidth = orgNodeWidth;
            treeNode.subtreeWidth = Math.max(ownWidth, totalChildrenWidth);
            return treeNode.subtreeWidth;
        };

        validRoots.forEach((r) => calculateSubtreeWidth(r));

        // Pass 2: Pre-order traversal to assign exact centered (x, y) coordinates
        const assignCoordinates = (treeNode: LevelTreeNode, leftOffset: number, parentNodeId?: string) => {
            const levelIdx = treeNode.levelIndex;
            const y = levelIdx * levelYSpacing + 50;

            const currentSubtreeWidth = treeNode.subtreeWidth || orgNodeWidth;
            const x = leftOffset + (currentSubtreeWidth - orgNodeWidth) / 2;

            treeNode.x = x;
            treeNode.y = y;

            const isSelected =
                selectedNode?.title === treeNode.title && selectedNode?.levelKey === treeNode.levelConfig.key;

            nodesList.push({
                id: treeNode.id,
                type: 'orgNode',
                position: { x, y },
                data: {
                    title: treeNode.title,
                    levelKey: treeNode.levelConfig.key,
                    levelLabel: treeNode.levelConfig.label,
                    color: treeNode.levelConfig.color,
                    badgeBg: treeNode.levelConfig.badgeBg,
                    users: treeNode.users,
                    totalUsers: treeNode.users.length,
                    hasUser: treeNode.users.length > 0,
                    isMasterUsed: treeNode.isMasterUsed,
                    isSelected,
                    onSelect: (d: TreeNodeData) => setSelectedNode(d),
                },
            });

            if (parentNodeId) {
                edgesList.push({
                    id: `edge-${parentNodeId}-${treeNode.id}`,
                    source: parentNodeId,
                    target: treeNode.id,
                    type: 'smoothstep',
                    animated: false,
                    style: { stroke: '#94a3b8', strokeWidth: 1.5 },
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                        width: 14,
                        height: 14,
                        color: '#94a3b8',
                    },
                });
            }

            // Position and connect children
            if (treeNode.children.size > 0) {
                let currentLeft = leftOffset;
                const childrenTotalWidth = Array.from(treeNode.children.values()).reduce(
                    (acc, c, idx) => acc + (c.subtreeWidth || orgNodeWidth) + (idx > 0 ? nodeGap : 0),
                    0
                );
                if (childrenTotalWidth < currentSubtreeWidth) {
                    currentLeft += (currentSubtreeWidth - childrenTotalWidth) / 2;
                }

                treeNode.children.forEach((child) => {
                    const childSubtreeWidth = child.subtreeWidth || orgNodeWidth;
                    assignCoordinates(child, currentLeft, treeNode.id);
                    currentLeft += childSubtreeWidth + nodeGap;
                });
            } else if (isEmployeeListEnabled && treeNode.users.length > 0) {
                const empLevelIdx = structuralLevels.length;
                const empY = empLevelIdx * levelYSpacing + 50;
                const empX = leftOffset + (currentSubtreeWidth - empNodeWidth) / 2;

                const empNodeId = `emp-${treeNode.id}`;
                const isEmpSelected = selectedNode?.title === `Anggota ${treeNode.title}`;

                nodesList.push({
                    id: empNodeId,
                    type: 'employeeListNode',
                    position: { x: empX, y: empY },
                    data: {
                        title: `Anggota ${treeNode.title}`,
                        levelKey: 'employee',
                        levelLabel: 'List Employee',
                        color: 'text-cyan-600',
                        badgeBg: 'bg-cyan-50 border-cyan-200 text-cyan-700',
                        users: treeNode.users,
                        totalUsers: treeNode.users.length,
                        hasUser: true,
                        isMasterUsed: true,
                        isSelected: isEmpSelected,
                        onSelect: (d: TreeNodeData) => setSelectedNode(d),
                    },
                });

                edgesList.push({
                    id: `edge-${treeNode.id}-${empNodeId}`,
                    source: treeNode.id,
                    target: empNodeId,
                    type: 'smoothstep',
                    animated: false,
                    style: { stroke: '#06b6d4', strokeWidth: 1.5 },
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                        width: 14,
                        height: 14,
                        color: '#06b6d4',
                    },
                });
            }
        };

        // Layout all root nodes side-by-side with appropriate gaps
        let rootLeftOffset = 50;
        validRoots.forEach((root) => {
            const rootWidth = root.subtreeWidth || orgNodeWidth;
            assignCoordinates(root, rootLeftOffset);
            rootLeftOffset += rootWidth + 80;
        });

        return { nodes: nodesList, edges: edgesList };
    }, [
        filteredUsers,
        activeLevels,
        selectedNode,
        enabledLevelKeys,
        usedFilter,
        masterGroups,
        masterRegions,
        masterLocations,
        masterCompanies,
        masterDivisions,
        masterDepartments,
        masterJobLevels,
        masterJobTitles,
        masterIsUsedMaps,
        selectedGroups,
    ]);

    // Find cards matching query
    const matchedNodes = useMemo(() => {
        if (!cardFindQuery.trim()) return [];
        const q = cardFindQuery.toLowerCase().trim();
        return nodes.filter((n) => {
            const titleMatch = n.data?.title?.toLowerCase().includes(q);
            const userMatch = n.data?.users?.some(
                (u) =>
                    u.name?.toLowerCase().includes(q) ||
                    u.nik?.toLowerCase().includes(q) ||
                    u.job_title_name?.toLowerCase().includes(q) ||
                    u.company_name?.toLowerCase().includes(q) ||
                    (u.division_name && u.division_name.toLowerCase().includes(q)) ||
                    u.department_name?.toLowerCase().includes(q)
            );
            return titleMatch || userMatch;
        });
    }, [nodes, cardFindQuery]);

    // Jump / Focus to matching card node with smooth animation
    const jumpToCardNode = (targetIndex: number) => {
        if (matchedNodes.length === 0) return;
        const safeIndex = (targetIndex + matchedNodes.length) % matchedNodes.length;
        setCurrentCardFindIndex(safeIndex);
        const targetNode = matchedNodes[safeIndex];

        if (targetNode && reactFlowInstanceRef.current) {
            const nodeWidth = targetNode.type === 'employeeListNode' ? 340 : 240;
            const nodeHeight = targetNode.type === 'employeeListNode' ? 200 : 100;
            const centerX = targetNode.position.x + nodeWidth / 2;
            const centerY = targetNode.position.y + nodeHeight / 2;

            reactFlowInstanceRef.current.setCenter(centerX, centerY, {
                zoom: Math.max(reactFlowInstanceRef.current.getZoom(), 0.95),
                duration: 700,
            });
        }
    };

    // Auto focus first match when typing query
    useEffect(() => {
        if (matchedNodes.length > 0) {
            setCurrentCardFindIndex(0);
            const firstNode = matchedNodes[0];
            if (firstNode && reactFlowInstanceRef.current) {
                const nodeWidth = firstNode.type === 'employeeListNode' ? 340 : 240;
                const nodeHeight = firstNode.type === 'employeeListNode' ? 200 : 100;
                reactFlowInstanceRef.current.setCenter(
                    firstNode.position.x + nodeWidth / 2,
                    firstNode.position.y + nodeHeight / 2,
                    { zoom: Math.max(reactFlowInstanceRef.current.getZoom(), 0.95), duration: 700 }
                );
            }
        }
    }, [cardFindQuery]);

    // Enhanced nodes with search highlight & current active match flags
    const displayNodes = useMemo(() => {
        if (!cardFindQuery.trim()) return nodes;
        const currentTargetId = matchedNodes[currentCardFindIndex]?.id;
        const matchedIds = new Set(matchedNodes.map((n) => n.id));

        return nodes.map((n) => ({
            ...n,
            data: {
                ...n.data,
                isHighlighted: matchedIds.has(n.id),
                isCurrentMatch: n.id === currentTargetId,
            },
        }));
    }, [nodes, cardFindQuery, matchedNodes, currentCardFindIndex]);

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
                u.job_title_name?.toLowerCase().includes(q)
        );
    }, [selectedNode, userSearchText]);

    return (
        <div className="flex h-full w-full flex-col bg-slate-50 dark:bg-zinc-950 relative overflow-hidden">
            {/* React Flow Viewport Canvas */}
            <div className="flex-1 w-full h-full relative">
                {nodes.length === 0 ? (
                    <div className="flex h-full w-full flex-col items-center justify-center text-center p-8">
                        <Users className="h-12 w-12 text-slate-300 mb-3" />
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Tidak ada data yang cocok</h3>
                        <p className="text-xs text-slate-400 mt-1 max-w-sm">
                            Coba sesuaikan pilihan multi-select filter atau klik tombol "Reset Filter" di atas.
                        </p>
                    </div>
                ) : (
                    <ReactFlow
                        nodes={displayNodes}
                        edges={edges}
                        nodeTypes={nodeTypes}
                        onInit={(instance) => {
                            reactFlowInstanceRef.current = instance;
                        }}
                        fitView
                        minZoom={0.15}
                        maxZoom={1.5}
                        defaultEdgeOptions={{ type: 'smoothstep' }}
                    >
                        <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#94a3b8" className="opacity-40" />
                        <Controls className="!bg-white dark:!bg-zinc-900 !border-slate-200 dark:!border-zinc-800 !rounded-xl !shadow-sm" />
                        <MiniMap
                            className="!bg-white dark:!bg-zinc-900 !border-slate-200 dark:!border-zinc-800 !rounded-xl"
                            nodeStrokeColor="#64748b"
                            nodeColor="#f1f5f9"
                            zoomable
                            pannable
                        />
                    </ReactFlow>
                )}

                {/* Right Slideout Drawer for Data List of People */}
                {selectedNode && (
                    <div className="absolute top-0 right-0 h-full w-full max-w-md bg-white dark:bg-zinc-900 border-l border-slate-200 dark:border-zinc-800 shadow-2xl z-20 flex flex-col animate-in slide-in-from-right duration-200">
                        {/* Drawer Header */}
                        <div className="p-4 border-b border-slate-200 dark:border-zinc-800 flex items-start justify-between bg-slate-50 dark:bg-zinc-900">
                            <div>
                                <span className={cn('text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border', selectedNode.badgeBg)}>
                                    {selectedNode.levelLabel}
                                </span>
                                <h2 className="text-sm font-bold text-slate-900 dark:text-white mt-1 break-words">
                                    {selectedNode.title}
                                </h2>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                    Total <strong>{selectedNode.totalUsers}</strong> orang terdaftar di node ini
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
                                        <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 border border-primary/20">
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
                                                <p className="text-[11px] font-medium text-primary truncate">
                                                    {u.job_title_name}
                                                </p>
                                                {u.job_level_name && (
                                                    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-orange-50 border border-orange-200 text-orange-700 dark:bg-orange-950/40 dark:border-orange-800 dark:text-orange-300 shrink-0">
                                                        {u.job_level_name}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="mt-1 space-y-0.5 text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                                                {u.reporting_to && (
                                                    <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-sans font-semibold">
                                                        <UserCheck size={11} className="shrink-0" />
                                                        <span className="truncate">Atasan: {u.reporting_to}</span>
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
        </div>
    );
}
