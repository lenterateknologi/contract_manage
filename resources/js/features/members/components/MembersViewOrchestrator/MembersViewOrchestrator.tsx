import React from 'react';
import { useMembersFilter } from '../../hooks/useMembersFilter';
import { MembersViewOrchestratorProps } from '../../types';
import { JobHierarchyFlow } from '../JobHierarchy/JobHierarchyFlow';
import { MembersFilterToolbar } from '../MembersFilter/MembersFilterToolbar';
import { OrgHierarchyFlow } from '../OrgHierarchy/OrgHierarchyFlow';

export function MembersViewOrchestrator({
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
    departmentTraffic = {},
}: MembersViewOrchestratorProps) {
    const filterState = useMembersFilter({
        usersList,
        membersTab,
        companyGroups,
        organizationGroups,
        regions,
        locations,
        companies,
        divisions,
        departments,
        subdepartments,
        sections,
        jobTitles,
        jobLevels,
        jobLevelGroups,
        rolesArray,
    });

    return (
        <div className="flex h-full w-full flex-col overflow-hidden">
            <MembersFilterToolbar
                membersTab={membersTab}
                handleTabChange={handleTabChange}
                usedFilter={filterState.usedFilter}
                setUsedFilter={filterState.setUsedFilter}
                searchQuery={filterState.searchQuery}
                setSearchQuery={filterState.setSearchQuery}
                isSyncing={filterState.isSyncing}
                handleSyncData={filterState.handleSyncData}
                isFilterExpanded={filterState.isFilterExpanded}
                setIsFilterExpanded={filterState.setIsFilterExpanded}
                filteredCount={filterState.filteredCount}
                hasActiveMultiFilters={filterState.hasActiveMultiFilters}
                resetAllFilters={filterState.resetAllFilters}
                optGroups={filterState.optGroups}
                selectedGroups={filterState.selectedGroups}
                setSelectedGroups={filterState.setSelectedGroups}
                optOrganizationGroups={filterState.optOrganizationGroups}
                selectedOrganizationGroups={filterState.selectedOrganizationGroups}
                setSelectedOrganizationGroups={filterState.setSelectedOrganizationGroups}
                optRegions={filterState.optRegions}
                selectedRegions={filterState.selectedRegions}
                setSelectedRegions={filterState.setSelectedRegions}
                optLocations={filterState.optLocations}
                selectedLocations={filterState.selectedLocations}
                setSelectedLocations={filterState.setSelectedLocations}
                optCompanies={filterState.optCompanies}
                selectedCompanies={filterState.selectedCompanies}
                setSelectedCompanies={filterState.setSelectedCompanies}
                optDivisions={filterState.optDivisions}
                selectedDivisions={filterState.selectedDivisions}
                setSelectedDivisions={filterState.setSelectedDivisions}
                optDepartments={filterState.optDepartments}
                selectedDepartments={filterState.selectedDepartments}
                setSelectedDepartments={filterState.setSelectedDepartments}
                optSubdepartments={filterState.optSubdepartments}
                selectedSubdepartments={filterState.selectedSubdepartments}
                setSelectedSubdepartments={filterState.setSelectedSubdepartments}
                optSections={filterState.optSections}
                selectedSections={filterState.selectedSections}
                setSelectedSections={filterState.setSelectedSections}
                optJobLevelGroups={filterState.optJobLevelGroups}
                selectedJobLevelGroups={filterState.selectedJobLevelGroups}
                setSelectedJobLevelGroups={filterState.setSelectedJobLevelGroups}
                optJobLevels={filterState.optJobLevels}
                selectedJobLevels={filterState.selectedJobLevels}
                setSelectedJobLevels={filterState.setSelectedJobLevels}
                optJobTitles={filterState.optJobTitles}
                selectedJobTitles={filterState.selectedJobTitles}
                setSelectedJobTitles={filterState.setSelectedJobTitles}
                optRoles={filterState.optRoles}
                selectedRoles={filterState.selectedRoles}
                setSelectedRoles={filterState.setSelectedRoles}
                enabledLevelKeys={filterState.enabledLevelKeys}
                setEnabledLevelKeys={filterState.setEnabledLevelKeys}
                visibleTiers={filterState.visibleTiers}
                setVisibleTiers={filterState.setVisibleTiers}
                groupByMode={filterState.groupByMode}
                setGroupByMode={filterState.setGroupByMode}
            />

            {/* Canvas Diagram View */}
            <div className="relative min-h-0 flex-1 overflow-hidden">
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
                        masterJobLevelGroups={jobLevelGroups}
                        masterJobLevels={jobLevels}
                        masterJobTitles={jobTitles}
                        masterRoles={rolesArray}
                        departmentTraffic={departmentTraffic}
                        usedFilter={filterState.usedFilter}
                        searchQuery={filterState.searchQuery}
                        selectedGroups={filterState.selectedGroups}
                        selectedOrganizationGroups={filterState.selectedOrganizationGroups}
                        selectedRegions={filterState.selectedRegions}
                        selectedLocations={filterState.selectedLocations}
                        selectedCompanies={filterState.selectedCompanies}
                        selectedDivisions={filterState.selectedDivisions}
                        selectedDepartments={filterState.selectedDepartments}
                        selectedSubdepartments={filterState.selectedSubdepartments}
                        selectedSections={filterState.selectedSections}
                        selectedJobLevelGroups={filterState.selectedJobLevelGroups}
                        selectedJobLevels={filterState.selectedJobLevels}
                        selectedJobTitles={filterState.selectedJobTitles}
                        selectedRoles={filterState.selectedRoles}
                        enabledLevelKeys={filterState.enabledLevelKeys}
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
                        groupByMode={filterState.groupByMode}
                        onGroupByModeChange={filterState.setGroupByMode}
                        usedFilter={filterState.usedFilter}
                        searchQuery={filterState.searchQuery}
                        selectedGroups={filterState.selectedGroups}
                        selectedOrganizationGroups={filterState.selectedOrganizationGroups}
                        selectedRegions={filterState.selectedRegions}
                        selectedLocations={filterState.selectedLocations}
                        selectedCompanies={filterState.selectedCompanies}
                        selectedDivisions={filterState.selectedDivisions}
                        selectedDepartments={filterState.selectedDepartments}
                        selectedSubdepartments={filterState.selectedSubdepartments}
                        selectedSections={filterState.selectedSections}
                        selectedJobLevelGroups={filterState.selectedJobLevelGroups}
                        selectedJobLevels={filterState.selectedJobLevels}
                        selectedJobTitles={filterState.selectedJobTitles}
                        selectedRoles={filterState.selectedRoles}
                        visibleTiers={filterState.visibleTiers}
                    />
                )}
            </div>
        </div>
    );
}
