import LoadingLottie from '@/components/ui/feedback/LoadingLottie';
import { ToastProvider } from '@/components/ui/feedback/Toast';
import { Head } from '@inertiajs/react';
import { lazy, Suspense, useState } from 'react';

const MasterDataSync = lazy(() => import('../components/MasterDataSync').then((m) => ({ default: m.MasterDataSync })));
const NavigationManagement = lazy(() => import('../components/NavigationManagement').then((m) => ({ default: m.NavigationManagement })));
const NumberingFormatManagement = lazy(() =>
    import('../components/NumberingFormatManagement').then((m) => ({ default: m.NumberingFormatManagement })),
);
const WorkflowManagement = lazy(() => import('@/features/workflows').then((m) => ({ default: m.WorkflowManagement })));
const MembersViewOrchestrator = lazy(() =>
    import('@/features/members').then((m) => ({ default: m.MembersViewOrchestrator })),
);

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
    users?: PaginatedData<any> | any[];
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
    locations?: any;
    divisions?: any;
    subdepartments?: any;
    sections?: any;
    jobTitles?: any;
    jobLevels?: any;
    jobLevelGroups?: any;
    organizationGroups?: any;
    departmentTraffic?: any;
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
 * Each administrative view is encapsulated into its own dedicated feature component.
 */
export default function AdminIndex({
    currentView,
    users,
    roles,
    contractTypes,
    types,
    workflows,
    departments,
    formats,
    groups,
    modules,
    moduleGroups,
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
    departmentTraffic,
    filters = {},
    counts,
}: Readonly<Props>) {
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

    const rolesArray = Array.isArray(roles) ? roles : roles?.data || [];
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
                        departmentTraffic={departmentTraffic}
                    />
                );
            }
            case 'master-data-sync':
                return <MasterDataSync counts={counts} />;
            default:
                return (
                    <div className="flex h-full items-center justify-center text-xs font-semibold uppercase text-slate-400">
                        Pilih menu administrasi untuk mengelola sistem
                    </div>
                );
        }
    };

    return (
        <ToastProvider>
            <Head title={`Admin - ${viewTitle}`} />

            <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
                <div className="flex h-full min-h-0 flex-1 flex-col">
                    <Suspense
                        fallback={
                            <div className="flex min-h-[400px] w-full flex-1 items-center justify-center p-6">
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
