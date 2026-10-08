import { PageHeader } from '@/components/ui/navigation/PageHeader';
import { cn } from '@/lib/utils';
import {
    Briefcase,
    Building,
    Building2,
    ChevronDown,
    ChevronUp,
    Filter,
    FolderClosed,
    FolderTree,
    GitBranch,
    Layers,
    MapPin,
    Network,
    RefreshCw,
    RotateCcw,
    Search,
    Shield,
    SlidersHorizontal,
    Sparkles,
    Tags,
    UserCheck,
    Users,
    X,
} from 'lucide-react';
import React from 'react';
import { SENIORITY_TIERS } from '../../components/JobHierarchy/JobHierarchyFlow';
import { ALL_LEVELS } from '../../components/OrgHierarchy/OrgHierarchyFlow';
import { HierarchyLevelKey } from '../../types';
import { MultiSelectDropdown } from './MultiSelectDropdown';

export interface MembersFilterToolbarProps {
    membersTab: 'org' | 'job';
    handleTabChange: (tab: 'org' | 'job') => void;
    usedFilter: 'used_only' | 'all';
    setUsedFilter: (val: 'used_only' | 'all') => void;
    searchQuery: string;
    setSearchQuery: (val: string) => void;
    isSyncing: boolean;
    handleSyncData: () => void;
    isFilterExpanded: boolean;
    setIsFilterExpanded: (val: boolean) => void;
    filteredCount: number;
    hasActiveMultiFilters: boolean;
    resetAllFilters: () => void;
    // Options and Selections
    optGroups: any[];
    selectedGroups: string[];
    setSelectedGroups: (val: string[]) => void;
    optOrganizationGroups: any[];
    selectedOrganizationGroups: string[];
    setSelectedOrganizationGroups: (val: string[]) => void;
    optRegions: any[];
    selectedRegions: string[];
    setSelectedRegions: (val: string[]) => void;
    optLocations: any[];
    selectedLocations: string[];
    setSelectedLocations: (val: string[]) => void;
    optCompanies: any[];
    selectedCompanies: string[];
    setSelectedCompanies: (val: string[]) => void;
    optDivisions: any[];
    selectedDivisions: string[];
    setSelectedDivisions: (val: string[]) => void;
    optDepartments: any[];
    selectedDepartments: string[];
    setSelectedDepartments: (val: string[]) => void;
    optSubdepartments: any[];
    selectedSubdepartments: string[];
    setSelectedSubdepartments: (val: string[]) => void;
    optSections: any[];
    selectedSections: string[];
    setSelectedSections: (val: string[]) => void;
    optJobLevelGroups: any[];
    selectedJobLevelGroups: string[];
    setSelectedJobLevelGroups: (val: string[]) => void;
    optJobLevels: any[];
    selectedJobLevels: string[];
    setSelectedJobLevels: (val: string[]) => void;
    optJobTitles: any[];
    selectedJobTitles: string[];
    setSelectedJobTitles: (val: string[]) => void;
    optRoles: any[];
    selectedRoles: string[];
    setSelectedRoles: (val: string[]) => void;
    enabledLevelKeys: HierarchyLevelKey[];
    setEnabledLevelKeys: React.Dispatch<React.SetStateAction<HierarchyLevelKey[]>>;
    visibleTiers: Record<string, boolean>;
    setVisibleTiers: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
    groupByMode: 'job_title' | 'role';
    setGroupByMode: (mode: 'job_title' | 'role') => void;
}

export function MembersFilterToolbar({
    membersTab,
    handleTabChange,
    usedFilter,
    setUsedFilter,
    searchQuery,
    setSearchQuery,
    isSyncing,
    handleSyncData,
    isFilterExpanded,
    setIsFilterExpanded,
    filteredCount,
    hasActiveMultiFilters,
    resetAllFilters,
    optGroups,
    selectedGroups,
    setSelectedGroups,
    optOrganizationGroups,
    selectedOrganizationGroups,
    setSelectedOrganizationGroups,
    optRegions,
    selectedRegions,
    setSelectedRegions,
    optLocations,
    selectedLocations,
    setSelectedLocations,
    optCompanies,
    selectedCompanies,
    setSelectedCompanies,
    optDivisions,
    selectedDivisions,
    setSelectedDivisions,
    optDepartments,
    selectedDepartments,
    setSelectedDepartments,
    optSubdepartments,
    selectedSubdepartments,
    setSelectedSubdepartments,
    optSections,
    selectedSections,
    setSelectedSections,
    optJobLevelGroups,
    selectedJobLevelGroups,
    setSelectedJobLevelGroups,
    optJobLevels,
    selectedJobLevels,
    setSelectedJobLevels,
    optJobTitles,
    selectedJobTitles,
    setSelectedJobTitles,
    optRoles,
    selectedRoles,
    setSelectedRoles,
    enabledLevelKeys,
    setEnabledLevelKeys,
    visibleTiers,
    setVisibleTiers,
    groupByMode,
    setGroupByMode,
}: MembersFilterToolbarProps) {
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
        <div className="shrink-0">
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
                                    'cursor-pointer rounded-lg px-2.5 py-1 text-xs font-semibold transition-all',
                                    usedFilter === 'used_only'
                                        ? 'text-primary dark:text-primary bg-white shadow-xs dark:bg-zinc-900'
                                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200',
                                )}
                                title="Tampilkan hanya entitas dengan is_used = true"
                            >
                                Is Used: True
                            </button>
                            <button
                                type="button"
                                onClick={() => setUsedFilter('all')}
                                className={cn(
                                    'cursor-pointer rounded-lg px-2.5 py-1 text-xs font-semibold transition-all',
                                    usedFilter === 'all'
                                        ? 'bg-white text-slate-900 shadow-xs dark:bg-zinc-900 dark:text-slate-100'
                                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200',
                                )}
                                title="Tampilkan semua master data"
                            >
                                Semua Data
                            </button>
                        </div>

                        {/* Search Input */}
                        <div className="relative">
                            <Search className="absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Cari nama, NIK, jabatan..."
                                className="focus:ring-primary h-8 w-44 rounded-xl border border-slate-200 bg-white pr-7 pl-8 text-xs text-slate-800 focus:ring-2 focus:outline-none sm:w-56 dark:border-zinc-700 dark:bg-zinc-800 dark:text-slate-200"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer text-slate-400 hover:text-slate-600"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Server-side Sync Button */}
                        <button
                            type="button"
                            onClick={handleSyncData}
                            disabled={isSyncing}
                            className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs transition-all hover:bg-slate-50 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-800 dark:text-slate-200 dark:hover:bg-zinc-700"
                            title="Segarkan data hierarki langsung dari database"
                        >
                            <RefreshCw size={13} className={cn('text-primary', isSyncing && 'animate-spin')} />
                            <span className="hidden sm:inline">{isSyncing ? 'Menyinkronkan...' : 'Sync Data'}</span>
                        </button>
                    </div>
                }
            />

            {/* Tab Mode Switcher Row + Minimize/Expand Section */}
            <div className="z-10 flex shrink-0 items-center justify-between border-b border-slate-200 bg-slate-50/90 px-5 py-2.5 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/90">
                {/* Left: Tab Buttons */}
                <div className="inline-flex rounded-xl border border-slate-200 bg-slate-200/60 p-1 shadow-xs dark:border-zinc-700/60 dark:bg-zinc-800/80">
                    <button
                        type="button"
                        onClick={() => handleTabChange('org')}
                        className={cn(
                            'flex cursor-pointer items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-semibold transition-all',
                            membersTab === 'org'
                                ? 'text-primary bg-white shadow-xs dark:bg-zinc-900'
                                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200',
                        )}
                    >
                        <Network className="h-3.5 w-3.5" />
                        <span>Struktur Unit Organisasi</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => handleTabChange('job')}
                        className={cn(
                            'flex cursor-pointer items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-semibold transition-all',
                            membersTab === 'job'
                                ? 'text-primary bg-white shadow-xs dark:bg-zinc-900'
                                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200',
                        )}
                    >
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Pohon Jenjang Jabatan & Level</span>
                    </button>
                </div>

                {/* Right: Active Filter Stats & Minimize/Expand Button */}
                <div className="flex items-center gap-2.5">
                    <span className="bg-primary/10 text-primary border-primary/20 flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold">
                        <Users size={13} />
                        {filteredCount} Anggota Terfilter
                    </span>

                    {/* Minimize / Expand Toggle Button */}
                    <button
                        type="button"
                        onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                        className={cn(
                            'inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition-all',
                            isFilterExpanded
                                ? 'bg-primary border-primary text-white shadow-xs'
                                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-slate-200 dark:hover:bg-zinc-700',
                        )}
                        title={isFilterExpanded ? 'Sembunyikan filter untuk memperluas ruang tampilan' : 'Tampilkan panel filter'}
                    >
                        <SlidersHorizontal size={13} />
                        <span>{isFilterExpanded ? 'Sembunyikan Filter' : 'Buka Filter'}</span>
                        {isFilterExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>
                </div>
            </div>

            {/* Collapsible Filter Section */}
            {isFilterExpanded && (
                <div className="animate-in slide-in-from-top z-10 shrink-0 space-y-3 border-b border-slate-200 bg-slate-50/95 px-5 py-3 backdrop-blur-md duration-150 dark:border-zinc-800 dark:bg-zinc-900/95">
                    {/* Row 1: Multiple Select Criteria */}
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="mr-1 flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
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
                                className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-2.5 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-100"
                            >
                                <RotateCcw size={12} />
                                Reset Filter
                            </button>
                        )}
                    </div>

                    {/* Row 2: Level or Seniority Toggles */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/80 pt-2 dark:border-zinc-800">
                        {membersTab === 'org' ? (
                            <div className="flex flex-wrap items-center gap-1.5">
                                <span className="mr-2 text-xs font-bold text-slate-700 dark:text-slate-300">Tampilkan Level:</span>
                                {ALL_LEVELS.map((lvl) => {
                                    const isEnabled = enabledLevelKeys.includes(lvl.key);
                                    const IconComponent = lvl.icon;
                                    return (
                                        <button
                                            key={lvl.key}
                                            type="button"
                                            onClick={() => toggleOrgLevel(lvl.key)}
                                            className={cn(
                                                'inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-semibold transition-all',
                                                isEnabled
                                                    ? 'border-primary text-primary ring-primary/20 bg-white shadow-xs ring-1 dark:bg-zinc-800'
                                                    : 'border-slate-200 bg-white/40 text-slate-400 hover:border-slate-300 dark:border-zinc-800 dark:bg-zinc-800/40 dark:text-zinc-500',
                                            )}
                                        >
                                            <IconComponent className="h-3.5 w-3.5" />
                                            <span>{lvl.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex w-full flex-wrap items-center justify-between gap-3">
                                {/* Seniority Tiers */}
                                <div className="flex flex-wrap items-center gap-1.5">
                                    {groupByMode === 'role' ? (
                                        <>
                                            <span className="mr-1.5 flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                                                <Shield className="h-3.5 w-3.5 text-violet-500" />
                                                <span>Hierarki Alur:</span>
                                            </span>
                                            <div className="inline-flex items-center gap-1.5 rounded-xl border border-violet-300 bg-violet-100 px-3 py-1 text-xs font-bold text-violet-800 shadow-xs dark:border-violet-800 dark:bg-violet-950/80 dark:text-violet-300">
                                                <Shield className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                                                <span>1. Role Akses</span>
                                            </div>
                                            <span className="font-bold text-slate-400 dark:text-zinc-600">→</span>
                                            <div className="inline-flex items-center gap-1.5 rounded-xl border border-purple-300 bg-purple-100 px-3 py-1 text-xs font-bold text-purple-800 shadow-xs dark:border-purple-800 dark:bg-purple-950/80 dark:text-purple-300">
                                                <Network className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                                                <span>2. Divisi / Unit</span>
                                            </div>
                                            <span className="font-bold text-slate-400 dark:text-zinc-600">→</span>
                                            <div className="inline-flex items-center gap-1.5 rounded-xl border border-sky-300 bg-sky-100 px-3 py-1 text-xs font-bold text-sky-800 shadow-xs dark:border-sky-800 dark:bg-sky-950/80 dark:text-sky-300">
                                                <Users className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                                                <span>3. Personil / Anggota ({filteredCount})</span>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <span className="mr-1.5 flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                                                <Briefcase className="h-3.5 w-3.5 text-cyan-500" />
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
                                                            'inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-semibold transition-all',
                                                            isVisible
                                                                ? 'border-primary text-primary ring-primary/20 bg-white shadow-xs ring-1 dark:bg-zinc-800'
                                                                : 'border-slate-200 bg-white/40 text-slate-400 hover:border-slate-300 dark:border-zinc-800 dark:bg-zinc-800/40 dark:text-zinc-500',
                                                        )}
                                                    >
                                                        <IconComponent className="h-3.5 w-3.5" />
                                                        <span>
                                                            {tier.title.split(' ')[0]} {tier.title.split(' ')[1] || ''}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </>
                                    )}
                                </div>

                                {/* Card Utama Group By Mode: Jabatan vs Role Akses */}
                                <div className="flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-zinc-700 dark:bg-zinc-800/80">
                                    <span className="px-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400">Kartu Utama:</span>
                                    <button
                                        type="button"
                                        onClick={() => setGroupByMode('job_title')}
                                        className={cn(
                                            'inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all',
                                            groupByMode === 'job_title'
                                                ? 'border border-slate-200/80 bg-white text-cyan-600 shadow-xs dark:border-zinc-700 dark:bg-zinc-900 dark:text-cyan-400'
                                                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200',
                                        )}
                                    >
                                        <Briefcase className="h-3.5 w-3.5" />
                                        <span>Jabatan / Posisi</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setGroupByMode('role')}
                                        className={cn(
                                            'inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all',
                                            groupByMode === 'role'
                                                ? 'border border-slate-200/80 bg-white text-violet-600 shadow-xs dark:border-zinc-700 dark:bg-zinc-900 dark:text-violet-400'
                                                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200',
                                        )}
                                    >
                                        <Shield className="h-3.5 w-3.5" />
                                        <span>Role Akses</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
