import { Head } from '@inertiajs/react';
import React, { lazy, Suspense, useState } from 'react';
import LoadingLottie from '@/components/ui/feedback/LoadingLottie';
import { ToastProvider } from '@/components/ui/feedback/Toast';
import { Network, Layers, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const MasterDataSync = lazy(() => import('@/pages/admin/components/MasterDataSync').then(m => ({ default: m.MasterDataSync })));
const NavigationManagement = lazy(() => import('@/pages/admin/components/NavigationManagement').then(m => ({ default: m.NavigationManagement })));
const NumberingFormatManagement = lazy(() => import('@/pages/admin/components/NumberingFormatManagement').then(m => ({ default: m.NumberingFormatManagement })));
const OrgHierarchyFlow = lazy(() => import('@/pages/admin/components/OrgHierarchyFlow').then(m => ({ default: m.OrgHierarchyFlow })));
const JobHierarchyFlow = lazy(() => import('@/pages/admin/components/JobHierarchyFlow').then(m => ({ default: m.JobHierarchyFlow })));
const WorkflowManagement = lazy(() => import('@/pages/admin/components/WorkflowManagement').then(m => ({ default: m.WorkflowManagement })));

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
                    <div className="flex flex-col h-full w-full gap-3">
                        {/* Tab Mode Switcher */}
                        <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-800">
                            <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-inner">
                                <button
                                    type="button"
                                    onClick={() => handleTabChange('org')}
                                    className={cn(
                                        "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all",
                                        membersTab === 'org'
                                            ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                                    )}
                                >
                                    <Network className="w-3.5 h-3.5" />
                                    Struktur Unit Organisasi
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleTabChange('job')}
                                    className={cn(
                                        "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all",
                                        membersTab === 'job'
                                            ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                                    )}
                                >
                                    <Sparkles className="w-3.5 h-3.5" />
                                    Pohon Jenjang Jabatan & Level
                                </button>
                            </div>
                        </div>

                        {/* Visualizer Content */}
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
                            />
                        )}
                    </div>
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
