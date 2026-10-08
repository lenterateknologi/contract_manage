import React from 'react';

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
    hierarchy_tier?: string;
    tier_name?: string;
    role_name?: string;
    reporting_to?: string;
    idreporting_to?: string | number;
}

export type HierarchyLevelKey =
    | 'group'
    | 'org_group'
    | 'region'
    | 'location'
    | 'company'
    | 'division'
    | 'department'
    | 'subdepartment'
    | 'section'
    | 'job_level'
    | 'job_title'
    | 'role'
    | 'employee';

export interface LevelConfig {
    key: HierarchyLevelKey;
    label: string;
    field?: keyof HierarchyUser;
    icon: React.ElementType;
    color: string;
    badgeBg: string;
}

export interface SeniorityTier {
    id: string;
    code: string;
    name: string;
    shortName: string;
    rank: number;
    color: string;
    badgeBg: string;
    border: string;
    headerBg: string;
    iconBg: string;
    bgHover: string;
    glow: string;
}

export interface MasterItem {
    id: string;
    name: string;
    code?: string;
    job_level_id?: string;
    job_level_group_id?: string;
    group_name?: string;
    idjoblevel?: number;
    is_used?: boolean;
    company_id?: string;
    company_group_id?: string;
    region_id?: string;
    hierarchy_tier?: string;
    tier_name?: string;
}

export interface SavedMembersFilterSettings {
    isFilterExpanded?: boolean;
    usedFilter?: 'used_only' | 'all';
    searchQuery?: string;
    enabledLevelKeys?: HierarchyLevelKey[];
    visibleTiers?: Record<string, boolean>;
    groupByMode?: 'job_title' | 'role';
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

export interface MultiSelectDropdownProps {
    title: string;
    options: { id: string; name: string; is_used?: boolean }[];
    selectedValues: string[];
    onChange: (selected: string[]) => void;
    icon: React.ElementType;
}

export interface OrgHierarchyFlowProps {
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
    departmentTraffic?: Record<string, any>;
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
    selectedJobLevelGroups?: string[];
    selectedJobLevels?: string[];
    selectedJobTitles?: string[];
    selectedRoles?: string[];
    enabledLevelKeys?: HierarchyLevelKey[];
}

export interface JobHierarchyFlowProps {
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
    groupByMode?: 'job_title' | 'role';
    onGroupByModeChange?: (mode: 'job_title' | 'role') => void;
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
    selectedJobLevelGroups?: string[];
    selectedJobLevels?: string[];
    selectedJobTitles?: string[];
    selectedRoles?: string[];
    visibleTiers?: Record<string, boolean>;
}

export interface MembersViewOrchestratorProps {
    membersTab: 'org' | 'job';
    handleTabChange: (tab: 'org' | 'job') => void;
    usersList: any[];
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
    departmentTraffic?: Record<string, any>;
}

export interface ContractMemberEntry {
    user: {
        id: string;
        name: string;
        email?: string;
        department_name?: string;
        role?: string;
        avatar?: string;
        initials?: string;
        [key: string]: any;
    };
    roles: string[];
}

export interface ContractMembersProps {
    contract: any;
    users?: any[];
}
