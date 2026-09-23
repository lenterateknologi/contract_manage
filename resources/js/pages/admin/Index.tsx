import { Head, router } from '@inertiajs/react';
import React, { lazy, Suspense, useState, useMemo, useEffect } from 'react';
import LoadingLottie from '@/components/ui/feedback/LoadingLottie';
import { ToastProvider } from '@/components/ui/feedback/Toast';
import {
    Network,
    Layers,
    Sparkles,
    SlidersHorizontal,
    Search,
    X,
    RefreshCw,
    ChevronDown,
    ChevronUp,
    Filter,
    RotateCcw,
    FolderClosed,
    MapPin,
    Building2,
    Building,
    Briefcase,
    FolderTree,
    GitBranch,
    Tags,
    UserCheck,
    Shield,
    Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/ui/navigation/PageHeader';
import {
    ALL_LEVELS,
    HierarchyLevelKey,
    MultiSelectDropdown,
} from '@/pages/admin/components/OrgHierarchyFlow';
import {
    SENIORITY_TIERS,
    ROLE_TIERS,
    SeniorityTierKey,
} from '@/pages/admin/components/JobHierarchyFlow';

const MasterDataSync = lazy(() => import('@/pages/admin/components/MasterDataSync').then(m => ({ default: m.MasterDataSync })));
const NavigationManagement = lazy(() => import('@/pages/admin/components/NavigationManagement').then(m => ({ default: m.NavigationManagement })));
const NumberingFormatManagement = lazy(() => import('@/pages/admin/components/NumberingFormatManagement').then(m => ({ default: m.NumberingFormatManagement })));
const OrgHierarchyFlow = lazy(() => import('@/pages/admin/components/OrgHierarchyFlow').then(m => ({ default: m.OrgHierarchyFlow })));
const JobHierarchyFlow = lazy(() => import('@/pages/admin/components/JobHierarchyFlow').then(m => ({ default: m.JobHierarchyFlow })));
const WorkflowManagement = lazy(() => import('@/pages/admin/components/WorkflowManagement').then(m => ({ default: m.WorkflowManagement })));

const MEMBERS_FILTER_STORAGE_KEY = 'admin_members_filter_settings_v1';

interface SavedMembersFilterSettings {
    isFilterExpanded?: boolean;
    usedFilter?: 'used_only' | 'all';
    searchQuery?: string;
    enabledLevelKeys?: HierarchyLevelKey[];
    visibleTiers?: Record<string, boolean>;
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
}

const loadSavedMembersFilterSettings = (): SavedMembersFilterSettings => {
    if (typeof window === 'undefined') return {};
    try {
        const saved = localStorage.getItem(MEMBERS_FILTER_STORAGE_KEY);
        if (saved) return JSON.parse(saved);
    } catch {
        // ignore
    }
    return {};
};

interface MembersViewOrchestratorProps {
    membersTab: 'org' | 'job';
    handleTabChange: (tab: 'org' | 'job') => void;
    usersList: any[];
    companyGroups: any[];
    organizationGroups: any[];
    regions: any[];
    locations: any[];
    companies: any[];
    divisions: any[];
    departments: any[];
    subdepartments: any[];
    sections: any[];
    jobTitles: any[];
    jobLevels: any[];
    jobLevelGroups: any[];
    rolesArray: any[];
}

function MembersViewOrchestrator({
    membersTab,
    handleTabChange,
    usersList,
    companyGroups = [],
    organizationGroups = [],
    regions = [],
    locations = [],
    companies = [],
    divisions = [],
    departments = [],
    subdepartments = [],
    sections = [],
    jobTitles = [],
    jobLevels = [],
    jobLevelGroups = [],
    rolesArray = [],
}: MembersViewOrchestratorProps) {
    const saved = useMemo(() => loadSavedMembersFilterSettings(), []);

    // Filter collapse/expand state (Default: true / open, can be minimized)
    const [isFilterExpanded, setIsFilterExpanded] = useState<boolean>(() => {
        return saved.isFilterExpanded !== undefined ? saved.isFilterExpanded : true;
    });

    // Toolbar Header Controls (is_used, search, sync)
    const [usedFilter, setUsedFilter] = useState<'used_only' | 'all'>(() => {
        return saved.usedFilter || 'used_only';
    });
    const [searchQuery, setSearchQuery] = useState<string>(() => saved.searchQuery || '');
    const [isSyncing, setIsSyncing] = useState(false);

    // Multi-select dropdown values
    const [selectedGroups, setSelectedGroups] = useState<string[]>(() => saved.selectedGroups || []);
    const [selectedOrganizationGroups, setSelectedOrganizationGroups] = useState<string[]>(() => saved.selectedOrganizationGroups || []);
    const [selectedRegions, setSelectedRegions] = useState<string[]>(() => saved.selectedRegions || []);
    const [selectedLocations, setSelectedLocations] = useState<string[]>(() => saved.selectedLocations || []);
    const [selectedCompanies, setSelectedCompanies] = useState<string[]>(() => saved.selectedCompanies || []);
    const [selectedDivisions, setSelectedDivisions] = useState<string[]>(() => saved.selectedDivisions || []);
    const [selectedDepartments, setSelectedDepartments] = useState<string[]>(() => saved.selectedDepartments || []);
    const [selectedSubdepartments, setSelectedSubdepartments] = useState<string[]>(() => saved.selectedSubdepartments || []);
    const [selectedSections, setSelectedSections] = useState<string[]>(() => saved.selectedSections || []);
    const [selectedJobLevelGroups, setSelectedJobLevelGroups] = useState<string[]>(() => saved.selectedJobLevelGroups || []);
    const [selectedJobLevels, setSelectedJobLevels] = useState<string[]>(() => saved.selectedJobLevels || []);
    const [selectedJobTitles, setSelectedJobTitles] = useState<string[]>(() => saved.selectedJobTitles || []);
    const [selectedRoles, setSelectedRoles] = useState<string[]>(() => saved.selectedRoles || []);

    // Org level keys toggle
    const [enabledLevelKeys, setEnabledLevelKeys] = useState<HierarchyLevelKey[]>(() => {
        return saved.enabledLevelKeys && saved.enabledLevelKeys.length > 0
            ? saved.enabledLevelKeys
            : ['group', 'employee'];
    });

    // Job seniority tier toggles
    const [visibleTiers, setVisibleTiers] = useState<Record<string, boolean>>(() => {
        return (
            saved.visibleTiers || {
                tier_1_c_level: true,
                tier_2_vp: true,
                tier_3_head: true,
                tier_4_gm: true,
                tier_5_manager: true,
                tier_6_asst_manager: true,
                tier_7_supervisor: true,
                tier_8_staff: true,
                tier_9_non_staff: true,
            }
        );
    });

    // Group By Mode for Job Hierarchy: 'job_title' (default) vs 'role'
    const [groupByMode, setGroupByMode] = useState<'job_title' | 'role'>(() => {
        return (saved as any).groupByMode || 'job_title';
    });

    // Save to localStorage whenever filter state changes
    useEffect(() => {
        try {
            const dataToSave: SavedMembersFilterSettings & { groupByMode?: 'job_title' | 'role' } = {
                isFilterExpanded,
                groupByMode,
                usedFilter,
                searchQuery,
                enabledLevelKeys,
                visibleTiers,
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
            };
            localStorage.setItem(MEMBERS_FILTER_STORAGE_KEY, JSON.stringify(dataToSave));
        } catch {
            // Ignore
        }
    }, [
        isFilterExpanded,
        groupByMode,
        usedFilter,
        searchQuery,
        enabledLevelKeys,
        visibleTiers,
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
    ]);

    const handleSyncData = () => {
        setIsSyncing(true);
        router.get(
            '/admin/members',
            { refresh: 1, tab: membersTab },
            {
                preserveState: false,
                preserveScroll: true,
                onFinish: () => setIsSyncing(false),
            }
        );
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
            localStorage.removeItem(MEMBERS_FILTER_STORAGE_KEY);
        } catch {
            // ignore
        }
    };

    // Filter master options based on usedFilter
    const getFilteredMaster = (items: any[]) => {
        if (!Array.isArray(items)) return [];
        if (usedFilter === 'used_only') {
            return items.filter((i) => (i.is_used !== undefined ? Boolean(i.is_used) : true));
        }
        return items;
    };

    const optGroups = useMemo(() => getFilteredMaster(companyGroups), [companyGroups, usedFilter]);
    const optOrganizationGroups = useMemo(() => getFilteredMaster(organizationGroups), [organizationGroups, usedFilter]);
    const optRegions = useMemo(() => getFilteredMaster(regions), [regions, usedFilter]);
    const optLocations = useMemo(() => getFilteredMaster(locations), [locations, usedFilter]);
    const optCompanies = useMemo(() => getFilteredMaster(companies), [companies, usedFilter]);
    const optDivisions = useMemo(() => getFilteredMaster(divisions), [divisions, usedFilter]);
    const optDepartments = useMemo(() => getFilteredMaster(departments), [departments, usedFilter]);
    const optSubdepartments = useMemo(() => getFilteredMaster(subdepartments), [subdepartments, usedFilter]);
    const optSections = useMemo(() => getFilteredMaster(sections), [sections, usedFilter]);
    const optJobLevelGroups = useMemo(() => getFilteredMaster(jobLevelGroups), [jobLevelGroups, usedFilter]);
    const optJobLevels = useMemo(() => getFilteredMaster(jobLevels), [jobLevels, usedFilter]);
    const optJobTitles = useMemo(() => getFilteredMaster(jobTitles), [jobTitles, usedFilter]);
    const optRoles = useMemo(() => (Array.isArray(rolesArray) ? rolesArray : []), [rolesArray]);

    // Compute live count of filtered users
    const filteredCount = useMemo(() => {
        return usersList.filter((u) => {
            if (usedFilter === 'used_only' && !u.is_used) return false;
            if (selectedGroups.length > 0 && !selectedGroups.some((g) => g.toLowerCase() === u.group_name?.toLowerCase())) return false;
            if (selectedOrganizationGroups.length > 0 && !selectedOrganizationGroups.some((og) => og.toLowerCase() === (u.org_group_name || '').toLowerCase())) return false;
            if (selectedRegions.length > 0 && !selectedRegions.some((r) => r.toLowerCase() === u.region_name?.toLowerCase())) return false;
            if (selectedLocations.length > 0 && !selectedLocations.some((l) => l.toLowerCase() === u.location_name?.toLowerCase())) return false;
            if (selectedCompanies.length > 0 && !selectedCompanies.some((c) => c.toLowerCase() === u.company_name?.toLowerCase())) return false;
            if (selectedDivisions.length > 0 && !selectedDivisions.some((d) => d.toLowerCase() === (u.division_name || '').toLowerCase())) return false;
            if (selectedDepartments.length > 0 && !selectedDepartments.some((d) => d.toLowerCase() === u.department_name?.toLowerCase())) return false;
            if (selectedSubdepartments.length > 0 && !selectedSubdepartments.some((s) => s.toLowerCase() === (u.subdepartment_name || '').toLowerCase())) return false;
            if (selectedSections.length > 0 && !selectedSections.some((s) => s.toLowerCase() === (u.section_name || '').toLowerCase())) return false;
            if (selectedJobLevelGroups.length > 0 && !selectedJobLevelGroups.some((jlg) => jlg.toLowerCase() === (u.job_level_group_name || '').toLowerCase())) return false;
            if (selectedJobLevels.length > 0 && !selectedJobLevels.some((jl) => jl.toLowerCase() === (u.job_level_name || '').toLowerCase())) return false;
            if (selectedJobTitles.length > 0 && !selectedJobTitles.some((jt) => jt.toLowerCase() === u.job_title_name?.toLowerCase())) return false;
            if (selectedRoles.length > 0 && !selectedRoles.some((r) => r.toLowerCase() === (u.role_name || '').toLowerCase())) return false;

            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const match =
                    u.name?.toLowerCase().includes(q) ||
                    u.nik?.toLowerCase().includes(q) ||
                    u.email?.toLowerCase().includes(q) ||
                    u.group_name?.toLowerCase().includes(q) ||
                    u.company_name?.toLowerCase().includes(q) ||
                    u.department_name?.toLowerCase().includes(q) ||
                    u.job_title_name?.toLowerCase().includes(q);
                if (!match) return false;
            }
            return true;
        }).length;
    }, [
        usersList,
        usedFilter,
        searchQuery,
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
    ]);

    const toggleOrgLevel = (key: HierarchyLevelKey) => {
        setEnabledLevelKeys((prev) => {
            if (prev.includes(key)) {
                if (prev.length === 1) return prev;
                return prev.filter((k) => k !== key);
            }
            const next = [...prev, key];
            return ALL_LEVELS.filter((l) => next.includes(l.key)).map((l) => l.key);
        });
    };

    return (
        <div className="flex flex-col h-full w-full overflow-hidden">
            {/* Header Utama dengan Toolbar Actions */}
            <PageHeader
                title="Struktur & Anggota Organisasi"
                subtitle="Visualisasi hierarki struktur unit organisasi, pemetaan personil, dan pohon jenjang jabatan"
                icon={Network}
                actions={
                    <div className="flex items-center gap-2">
                        {/* Is Used Filter Selector */}
                        <div className="flex items-center rounded-xl border border-slate-200 bg-slate-100 p-0.5 dark:border-zinc-800 dark:bg-zinc-800/80">
                            <button
                                type="button"
                                onClick={() => setUsedFilter('used_only')}
                                className={cn(
                                    'px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer',
                                    usedFilter === 'used_only'
                                        ? 'bg-white text-primary shadow-xs dark:bg-zinc-900 dark:text-primary'
                                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                                )}
                                title="Tampilkan hanya entitas dengan is_used = true"
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
                                className="h-8 pl-8 pr-7 text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary w-44 sm:w-56"
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
                            <RefreshCw size={13} className={cn('text-primary', isSyncing && 'animate-spin')} />
                            <span className="hidden sm:inline">{isSyncing ? 'Menyinkronkan...' : 'Sync Data'}</span>
                        </button>
                    </div>
                }
            />

            {/* Tab Mode Switcher Row + Minimize/Expand Section */}
            <div className="flex items-center justify-between px-5 py-2.5 bg-slate-50/90 dark:bg-zinc-900/90 border-b border-slate-200 dark:border-zinc-800 shrink-0 backdrop-blur-sm z-10">
                {/* Left: Tab Buttons */}
                <div className="inline-flex p-1 bg-slate-200/60 dark:bg-zinc-800/80 rounded-xl border border-slate-200 dark:border-zinc-700/60 shadow-xs">
                    <button
                        type="button"
                        onClick={() => handleTabChange('org')}
                        className={cn(
                            "flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                            membersTab === 'org'
                                ? "bg-white dark:bg-zinc-900 text-primary shadow-xs"
                                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                        )}
                    >
                        <Network className="w-3.5 h-3.5" />
                        <span>Struktur Unit Organisasi</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => handleTabChange('job')}
                        className={cn(
                            "flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                            membersTab === 'job'
                                ? "bg-white dark:bg-zinc-900 text-primary shadow-xs"
                                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                        )}
                    >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Pohon Jenjang Jabatan & Level</span>
                    </button>
                </div>

                {/* Right: Active Filter Stats & Minimize/Expand Button */}
                <div className="flex items-center gap-2.5">
                    <span className="text-xs font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-lg border border-primary/20 flex items-center gap-1.5">
                        <Users size={13} />
                        {filteredCount} Anggota Terfilter
                    </span>

                    {/* Minimize / Expand Toggle Button */}
                    <button
                        type="button"
                        onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                        className={cn(
                            'inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer',
                            isFilterExpanded
                                ? 'bg-primary text-white border-primary shadow-xs'
                                : 'bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-zinc-700'
                        )}
                        title={isFilterExpanded ? 'Sembunyikan filter untuk memperluas ruang tampilan' : 'Tampilkan panel filter'}
                    >
                        <SlidersHorizontal size={13} />
                        <span>{isFilterExpanded ? 'Sembunyikan Filter' : 'Buka Filter'}</span>
                        {isFilterExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>
                </div>
            </div>

            {/* Collapsible Filter Section (Multi-Select & Level Toggles) */}
            {isFilterExpanded && (
                <div className="border-b border-slate-200 bg-slate-50/95 dark:bg-zinc-900/95 backdrop-blur-md px-5 py-3 dark:border-zinc-800 z-10 space-y-3 shrink-0 animate-in slide-in-from-top duration-150">
                    {/* Row 1: Multiple Select Criteria */}
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mr-1">
                            <Filter size={13} className="text-primary" /> Filter Entitas (Multi-Select):
                        </span>

                        <MultiSelectDropdown
                            title="Group"
                            options={optGroups}
                            selectedValues={selectedGroups}
                            onChange={setSelectedGroups}
                            icon={Layers}
                        />

                        <MultiSelectDropdown
                            title="Group Organisasi"
                            options={optOrganizationGroups}
                            selectedValues={selectedOrganizationGroups}
                            onChange={setSelectedOrganizationGroups}
                            icon={FolderClosed}
                        />

                        <MultiSelectDropdown
                            title="Region"
                            options={optRegions}
                            selectedValues={selectedRegions}
                            onChange={setSelectedRegions}
                            icon={MapPin}
                        />

                        <MultiSelectDropdown
                            title="Location"
                            options={optLocations}
                            selectedValues={selectedLocations}
                            onChange={setSelectedLocations}
                            icon={Building2}
                        />

                        <MultiSelectDropdown
                            title="Company"
                            options={optCompanies}
                            selectedValues={selectedCompanies}
                            onChange={setSelectedCompanies}
                            icon={Building}
                        />

                        <MultiSelectDropdown
                            title="Division"
                            options={optDivisions}
                            selectedValues={selectedDivisions}
                            onChange={setSelectedDivisions}
                            icon={Network}
                        />

                        <MultiSelectDropdown
                            title="Department"
                            options={optDepartments}
                            selectedValues={selectedDepartments}
                            onChange={setSelectedDepartments}
                            icon={Briefcase}
                        />

                        <MultiSelectDropdown
                            title="Sub-Departemen"
                            options={optSubdepartments}
                            selectedValues={selectedSubdepartments}
                            onChange={setSelectedSubdepartments}
                            icon={FolderTree}
                        />

                        <MultiSelectDropdown
                            title="Seksi / Rayon"
                            options={optSections}
                            selectedValues={selectedSections}
                            onChange={setSelectedSections}
                            icon={GitBranch}
                        />

                        <MultiSelectDropdown
                            title="Group Level"
                            options={optJobLevelGroups}
                            selectedValues={selectedJobLevelGroups}
                            onChange={setSelectedJobLevelGroups}
                            icon={Layers}
                        />

                        <MultiSelectDropdown
                            title="Job Level"
                            options={optJobLevels}
                            selectedValues={selectedJobLevels}
                            onChange={setSelectedJobLevels}
                            icon={Tags}
                        />

                        <MultiSelectDropdown
                            title="Job Title"
                            options={optJobTitles}
                            selectedValues={selectedJobTitles}
                            onChange={setSelectedJobTitles}
                            icon={UserCheck}
                        />

                        <MultiSelectDropdown
                            title="Role Akses"
                            options={optRoles}
                            selectedValues={selectedRoles}
                            onChange={setSelectedRoles}
                            icon={Shield}
                        />

                        {/* Reset Filter Button */}
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

                    {/* Row 2: Level or Seniority Toggles */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200/80 dark:border-zinc-800">
                        {membersTab === 'org' ? (
                            <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 mr-2">
                                    Tampilkan Level:
                                </span>
                                {ALL_LEVELS.map((lvl) => {
                                    const isEnabled = enabledLevelKeys.includes(lvl.key);
                                    const IconComponent = lvl.icon;
                                    return (
                                        <button
                                            key={lvl.key}
                                            type="button"
                                            onClick={() => toggleOrgLevel(lvl.key)}
                                            className={cn(
                                                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer',
                                                isEnabled
                                                    ? 'bg-white dark:bg-zinc-800 border-primary text-primary shadow-xs ring-1 ring-primary/20'
                                                    : 'bg-white/40 dark:bg-zinc-800/40 border-slate-200 dark:border-zinc-800 text-slate-400 dark:text-zinc-500 hover:border-slate-300'
                                            )}
                                        >
                                            <IconComponent className="w-3.5 h-3.5" />
                                            <span>{lvl.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-wrap items-center justify-between gap-3 w-full">
                                {/* Seniority Tiers (for Jabatan mode) OR Simplified Chips (for Role mode: Role, Divisi, Personil) */}
                                <div className="flex flex-wrap items-center gap-1.5">
                                    {groupByMode === 'role' ? (
                                        <>
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 mr-1.5 flex items-center gap-1">
                                                <Shield className="w-3.5 h-3.5 text-violet-500" />
                                                <span>Hierarki Alur:</span>
                                            </span>
                                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-violet-100 text-violet-800 dark:bg-violet-950/80 dark:text-violet-300 border border-violet-300 dark:border-violet-800 shadow-xs">
                                                <Shield className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                                                <span>1. Role Akses</span>
                                            </div>
                                            <span className="text-slate-400 dark:text-zinc-600 font-bold">→</span>
                                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-300 dark:border-purple-800 shadow-xs">
                                                <Network className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                                                <span>2. Divisi / Unit</span>
                                            </div>
                                            <span className="text-slate-400 dark:text-zinc-600 font-bold">→</span>
                                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300 border border-sky-300 dark:border-sky-800 shadow-xs">
                                                <Users className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                                                <span>3. Personil / Anggota ({filteredCount})</span>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 mr-1.5 flex items-center gap-1">
                                                <Briefcase className="w-3.5 h-3.5 text-cyan-500" />
                                                <span>Jenjang Senioritas:</span>
                                            </span>
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
                                                            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer',
                                                            isVisible
                                                                ? 'bg-white dark:bg-zinc-800 border-primary text-primary shadow-xs ring-1 ring-primary/20'
                                                                : 'bg-white/40 dark:bg-zinc-800/40 border-slate-200 dark:border-zinc-800 text-slate-400 dark:text-zinc-500 hover:border-slate-300'
                                                        )}
                                                    >
                                                        <IconComponent className="w-3.5 h-3.5" />
                                                        <span>{tier.title.split(' ')[0]} {tier.title.split(' ')[1] || ''}</span>
                                                    </button>
                                                );
                                            })}
                                        </>
                                    )}
                                </div>

                                {/* Card Utama Group By Mode: Jabatan vs Role Akses */}
                                <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-zinc-800/80 p-1 rounded-xl border border-slate-200 dark:border-zinc-700 shrink-0">
                                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 px-1.5">
                                        Kartu Utama:
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setGroupByMode('job_title')}
                                        className={cn(
                                            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer',
                                            groupByMode === 'job_title'
                                                ? 'bg-white dark:bg-zinc-900 text-cyan-600 dark:text-cyan-400 shadow-xs border border-slate-200/80 dark:border-zinc-700'
                                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                                        )}
                                    >
                                        <Briefcase className="w-3.5 h-3.5" />
                                        <span>Jabatan / Posisi</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setGroupByMode('role')}
                                        className={cn(
                                            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer',
                                            groupByMode === 'role'
                                                ? 'bg-white dark:bg-zinc-900 text-violet-600 dark:text-violet-400 shadow-xs border border-slate-200/80 dark:border-zinc-700'
                                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                                        )}
                                    >
                                        <Shield className="w-3.5 h-3.5" />
                                        <span>Role Akses</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Visualizer Content (pure canvas taking 100% remaining vertical space) */}
            <div className="flex-1 min-h-0 w-full overflow-hidden relative">
                {membersTab === 'org' ? (
                    <OrgHierarchyFlow
                        users={usersList}
                        masterGroups={companyGroups}
                        masterOrganizationGroups={organizationGroups}
                        masterRegions={regions}
                        masterLocations={locations}
                        masterCompanies={companies}
                        masterDivisions={divisions}
                        masterDepartments={departments}
                        masterSubdepartments={subdepartments}
                        masterSections={sections}
                        masterJobTitles={jobTitles}
                        masterJobLevels={jobLevels}
                        masterRoles={rolesArray}
                        enabledLevelKeys={enabledLevelKeys}
                        usedFilter={usedFilter}
                        searchQuery={searchQuery}
                        selectedGroups={selectedGroups}
                        selectedOrganizationGroups={selectedOrganizationGroups}
                        selectedRegions={selectedRegions}
                        selectedLocations={selectedLocations}
                        selectedCompanies={selectedCompanies}
                        selectedDivisions={selectedDivisions}
                        selectedDepartments={selectedDepartments}
                        selectedSubdepartments={selectedSubdepartments}
                        selectedSections={selectedSections}
                        selectedJobLevels={selectedJobLevels}
                        selectedJobTitles={selectedJobTitles}
                        selectedRoles={selectedRoles}
                    />
                ) : (
                    <JobHierarchyFlow
                        users={usersList}
                        masterGroups={companyGroups}
                        masterOrganizationGroups={organizationGroups}
                        masterRegions={regions}
                        masterLocations={locations}
                        masterCompanies={companies}
                        masterDivisions={divisions}
                        masterDepartments={departments}
                        masterSubdepartments={subdepartments}
                        masterSections={sections}
                        masterJobLevelGroups={jobLevelGroups}
                        masterJobLevels={jobLevels}
                        masterJobTitles={jobTitles}
                        masterRoles={rolesArray}
                        groupByMode={groupByMode}
                        onGroupByModeChange={setGroupByMode}
                        usedFilter={usedFilter}
                        searchQuery={searchQuery}
                        selectedGroups={selectedGroups}
                        selectedOrganizationGroups={selectedOrganizationGroups}
                        selectedRegions={selectedRegions}
                        selectedLocations={selectedLocations}
                        selectedCompanies={selectedCompanies}
                        selectedDivisions={selectedDivisions}
                        selectedDepartments={selectedDepartments}
                        selectedSubdepartments={selectedSubdepartments}
                        selectedSections={selectedSections}
                        selectedJobLevelGroups={selectedJobLevelGroups}
                        selectedJobLevels={selectedJobLevels}
                        selectedJobTitles={selectedJobTitles}
                        selectedRoles={selectedRoles}
                        visibleTiers={visibleTiers}
                    />
                )}
            </div>
        </div>
    );
}

interface PaginatedData<T> {
    data: T[];
    meta: {
        current_page: number;
        last_page: number;
        total: number;
        per_page: number;
    };
}

interface Props {
    currentView: string;
    users?: PaginatedData<any>;
    roles?: any;
    contractTypes?: any;
    types?: any;
    workflows?: any;
    statuses?: any;
    departments?: any;
    vendors?: any;
    formats?: any;
    groups?: any;
    modules?: any;
    moduleGroups?: any;
    formTemplates?: any;
    contractTemplates?: any;
    contractStatuses?: any;
    companyGroups?: any;
    regions?: any;
    companies?: any;
    filters?: any;
    counts?: {
        company_groups: number;
        regions: number;
        companies: number;
        departments: number;
        divisions?: number;
        contract_statuses: number;
        contract_types: number;
        workflows: number;
        contracts?: number;
        roles: number;
        modules?: number;
        access_mappings: number;
        navigation_mappings: number;
        form_templates: number;
        form_fields: number;
        users?: number;
    };
}

/**
 * Admin Index Page (Modular Orchestrator)
 * ─────────────────────────────────────────────────────────────────────────────
 * This page acts as a clean orchestrator for administrative modules.
 * Each administrative view is extracted into its own component for better
 * performance, maintainability, and clean state isolation.
 */
export default function AdminIndex({
    currentView,
    users,
    roles,
    contractTypes,
    types,
    workflows,
    statuses,
    departments,
    vendors,
    formats,
    groups,
    modules,
    moduleGroups,
    formTemplates,
    contractTemplates,
    companyGroups,
    regions,
    companies,
    locations,
    divisions,
    subdepartments,
    sections,
    jobTitles,
    jobLevels,
    jobLevelGroups,
    organizationGroups,
    filters = {},
    counts,
}: Readonly<Props & { locations?: any; divisions?: any; subdepartments?: any; sections?: any; jobTitles?: any; jobLevels?: any; jobLevelGroups?: any; organizationGroups?: any }>) {
    const [membersTab, setMembersTab] = useState<'org' | 'job'>(() => {
        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            const tabParam = urlParams.get('tab');
            if (tabParam === 'org' || tabParam === 'job') return tabParam;
            const savedTab = localStorage.getItem('admin_members_active_tab');
            if (savedTab === 'org' || savedTab === 'job') return savedTab;
        }
        return 'org';
    });

    const handleTabChange = (tab: 'org' | 'job') => {
        setMembersTab(tab);
        if (typeof window !== 'undefined') {
            localStorage.setItem('admin_members_active_tab', tab);
            const url = new URL(window.location.href);
            url.searchParams.set('tab', tab);
            window.history.replaceState({}, '', url.toString());
        }
    };

    // View Metadata Mapping
    const viewTitleMap: Record<string, string> = {
        users: 'Manajemen Pengguna',
        roles: 'Manajemen Role',
        'contract-types': 'Tipe Kontrak',
        workflows: 'Alur Kerja Approval',
        'contract-statuses': 'Master Status',
        departments: 'Master Departemen',
        vendors: 'Master Vendor',
        'module-groups': 'Grup Modul',
        modules: 'Modul & Menu',
        'numbering-formats': 'Pengaturan Penomoran',
        'company-groups': 'Data Group',
        regions: 'Data Region',
        companies: 'Data Company',
        members: 'Struktur & Anggota Organisasi',
        'master-data-sync': 'Ekspor Impor Master',
    };

    const viewTitle = viewTitleMap[currentView] || 'Administrasi Sistem';

    // Helper to ensure we have roles and departments as simple arrays for selects
    const rolesArray = Array.isArray(roles) ? roles : roles?.data || [];
    const deptsArray = Array.isArray(departments) ? departments : departments?.data || [];
    const typesArray = Array.isArray(contractTypes || types) ? contractTypes || types : (contractTypes || types)?.data || [];
    const navigationsArray = Array.isArray(groups || moduleGroups) ? groups || moduleGroups : (groups || moduleGroups)?.data || [];

    const renderView = () => {
        switch (currentView) {
            case 'workflows':
                return <WorkflowManagement workflows={workflows} contractTypes={typesArray} filters={filters} />;
            case 'module-groups':
                return <NavigationManagement groups={navigationsArray} modules={modules} isModuleView={false} filters={filters} />;
            case 'modules':
                return <NavigationManagement groups={navigationsArray} modules={modules} isModuleView={true} filters={filters} />;
            case 'numbering-formats':
                return <NumberingFormatManagement formats={formats} />;
            case 'members': {
                const usersList = Array.isArray(users) ? users : users?.data || [];
                return (
                    <MembersViewOrchestrator
                        membersTab={membersTab}
                        handleTabChange={handleTabChange}
                        usersList={usersList}
                        companyGroups={companyGroups}
                        organizationGroups={organizationGroups}
                        regions={regions}
                        locations={locations}
                        companies={companies}
                        divisions={divisions}
                        departments={departments}
                        subdepartments={subdepartments}
                        sections={sections}
                        jobTitles={jobTitles}
                        jobLevels={jobLevels}
                        jobLevelGroups={jobLevelGroups}
                        rolesArray={rolesArray}
                    />
                );
            }
            case 'master-data-sync':
                return <MasterDataSync counts={counts} />;
            default:
                return (
                    <div className="flex h-full items-center justify-center text-xs font-semibold text-slate-400 uppercase">
                        Pilih menu administrasi untuk mengelola sistem
                    </div>
                );
        }
    };

    return (
        <ToastProvider>
            <Head title={`Admin - ${viewTitle}`} />

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden h-full">
                <div className="flex-1 min-h-0 flex flex-col h-full">
                    <Suspense
                        fallback={
                            <div className="flex flex-1 items-center justify-center min-h-[400px] w-full p-6">
                                <LoadingLottie width={120} height={120} />
                            </div>
                        }
                    >
                        {renderView()}
                    </Suspense>
                </div>
            </div>
        </ToastProvider>
    );
}
