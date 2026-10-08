import { useEffect, useMemo, useState } from 'react';
import { membersService } from '../services/membersService';
import { HierarchyLevelKey, HierarchyUser, SavedMembersFilterSettings } from '../types';
import { getFilteredMaster, loadSavedMembersFilterSettings, MEMBERS_FILTER_STORAGE_KEY } from '../utils/membersUtils';

interface UseMembersFilterProps {
    usersList: HierarchyUser[];
    membersTab: 'org' | 'job';
    companyGroups?: any[];
    organizationGroups?: any[];
    regions?: any[];
    locations?: any[];
    companies?: any[];
    divisions?: any[];
    departments?: any[];
    subdepartments?: any[];
    sections?: any[];
    jobTitles?: any[];
    jobLevels?: any[];
    jobLevelGroups?: any[];
    rolesArray?: any[];
}

export function useMembersFilter({
    usersList,
    membersTab,
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
}: UseMembersFilterProps) {
    const saved = useMemo(() => loadSavedMembersFilterSettings(), []);

    // Filter collapse/expand state
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
        return saved.enabledLevelKeys && saved.enabledLevelKeys.length > 0 ? saved.enabledLevelKeys : ['group', 'employee'];
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
        membersService.refreshAdminMembers(membersTab, () => setIsSyncing(false));
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

    const optGroups = useMemo(() => getFilteredMaster(companyGroups, usedFilter), [companyGroups, usedFilter]);
    const optOrganizationGroups = useMemo(() => getFilteredMaster(organizationGroups, usedFilter), [organizationGroups, usedFilter]);
    const optRegions = useMemo(() => getFilteredMaster(regions, usedFilter), [regions, usedFilter]);
    const optLocations = useMemo(() => getFilteredMaster(locations, usedFilter), [locations, usedFilter]);
    const optCompanies = useMemo(() => getFilteredMaster(companies, usedFilter), [companies, usedFilter]);
    const optDivisions = useMemo(() => getFilteredMaster(divisions, usedFilter), [divisions, usedFilter]);
    const optDepartments = useMemo(() => getFilteredMaster(departments, usedFilter), [departments, usedFilter]);
    const optSubdepartments = useMemo(() => getFilteredMaster(subdepartments, usedFilter), [subdepartments, usedFilter]);
    const optSections = useMemo(() => getFilteredMaster(sections, usedFilter), [sections, usedFilter]);
    const optJobLevelGroups = useMemo(() => getFilteredMaster(jobLevelGroups, usedFilter), [jobLevelGroups, usedFilter]);
    const optJobLevels = useMemo(() => getFilteredMaster(jobLevels, usedFilter), [jobLevels, usedFilter]);
    const optJobTitles = useMemo(() => getFilteredMaster(jobTitles, usedFilter), [jobTitles, usedFilter]);
    const optRoles = useMemo(() => (Array.isArray(rolesArray) ? rolesArray : []), [rolesArray]);

    // Live count of filtered users
    const filteredCount = useMemo(() => {
        return usersList.filter((u) => {
            if (usedFilter === 'used_only' && !u.is_used) return false;
            if (selectedGroups.length > 0 && !selectedGroups.some((g) => g.toLowerCase() === u.group_name?.toLowerCase())) return false;
            if (
                selectedOrganizationGroups.length > 0 &&
                !selectedOrganizationGroups.some((og) => og.toLowerCase() === u.org_group_name?.toLowerCase())
            )
                return false;
            if (selectedRegions.length > 0 && !selectedRegions.some((r) => r.toLowerCase() === u.region_name?.toLowerCase())) return false;
            if (selectedLocations.length > 0 && !selectedLocations.some((l) => l.toLowerCase() === u.location_name?.toLowerCase())) return false;
            if (selectedCompanies.length > 0 && !selectedCompanies.some((c) => c.toLowerCase() === u.company_name?.toLowerCase())) return false;
            if (selectedDivisions.length > 0 && !selectedDivisions.some((d) => d.toLowerCase() === u.division_name?.toLowerCase())) return false;
            if (selectedDepartments.length > 0 && !selectedDepartments.some((dp) => dp.toLowerCase() === u.department_name?.toLowerCase()))
                return false;
            if (
                selectedSubdepartments.length > 0 &&
                !selectedSubdepartments.some((sd) => sd.toLowerCase() === u.subdepartment_name?.toLowerCase())
            )
                return false;
            if (selectedSections.length > 0 && !selectedSections.some((sec) => sec.toLowerCase() === u.section_name?.toLowerCase())) return false;
            if (
                selectedJobLevelGroups.length > 0 &&
                !selectedJobLevelGroups.some((jlg) => jlg.toLowerCase() === u.job_level_group_name?.toLowerCase())
            )
                return false;
            if (selectedJobLevels.length > 0 && !selectedJobLevels.some((jl) => jl.toLowerCase() === u.job_level_name?.toLowerCase()))
                return false;
            if (selectedJobTitles.length > 0 && !selectedJobTitles.some((jt) => jt.toLowerCase() === u.job_title_name?.toLowerCase()))
                return false;
            if (selectedRoles.length > 0 && !selectedRoles.some((r) => r.toLowerCase() === u.role_name?.toLowerCase())) return false;

            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchName = u.name?.toLowerCase().includes(q);
                const matchNik = u.nik?.toLowerCase().includes(q);
                const matchEmail = u.email?.toLowerCase().includes(q);
                const matchJob = u.job_title_name?.toLowerCase().includes(q);
                const matchDept = u.department_name?.toLowerCase().includes(q);
                const matchComp = u.company_name?.toLowerCase().includes(q);
                if (!matchName && !matchNik && !matchEmail && !matchJob && !matchDept && !matchComp) return false;
            }

            return true;
        }).length;
    }, [
        usersList,
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

    return {
        isFilterExpanded,
        setIsFilterExpanded,
        usedFilter,
        setUsedFilter,
        searchQuery,
        setSearchQuery,
        isSyncing,
        handleSyncData,
        selectedGroups,
        setSelectedGroups,
        selectedOrganizationGroups,
        setSelectedOrganizationGroups,
        selectedRegions,
        setSelectedRegions,
        selectedLocations,
        setSelectedLocations,
        selectedCompanies,
        setSelectedCompanies,
        selectedDivisions,
        setSelectedDivisions,
        selectedDepartments,
        setSelectedDepartments,
        selectedSubdepartments,
        setSelectedSubdepartments,
        selectedSections,
        setSelectedSections,
        selectedJobLevelGroups,
        setSelectedJobLevelGroups,
        selectedJobLevels,
        setSelectedJobLevels,
        selectedJobTitles,
        setSelectedJobTitles,
        selectedRoles,
        setSelectedRoles,
        enabledLevelKeys,
        setEnabledLevelKeys,
        visibleTiers,
        setVisibleTiers,
        groupByMode,
        setGroupByMode,
        hasActiveMultiFilters,
        resetAllFilters,
        filteredCount,
        optGroups,
        optOrganizationGroups,
        optRegions,
        optLocations,
        optCompanies,
        optDivisions,
        optDepartments,
        optSubdepartments,
        optSections,
        optJobLevelGroups,
        optJobLevels,
        optJobTitles,
        optRoles,
    };
}
