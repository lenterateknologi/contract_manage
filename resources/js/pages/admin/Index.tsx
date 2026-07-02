import { Head } from '@inertiajs/react';

import { MasterDataSync } from '@/pages/admin/components/MasterDataSync';
import { NavigationManagement } from '@/pages/admin/components/NavigationManagement';
import { NumberingFormatManagement } from '@/pages/admin/components/NumberingFormatManagement';
import { WorkflowManagement } from '@/pages/admin/components/WorkflowManagement';
import { MembersPerDivision } from '@/pages/dashboard/components/MembersPerDivision';
import { ToastProvider } from '@/components/ui/feedback/Toast';

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
    contractStatuses,
    companyGroups,
    regions,
    companies,
    filters = {},
    counts,
}: Readonly<Props>) {
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
            case 'members':
                return <MembersPerDivision />;
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

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <div>{renderView()}</div>
            </div>
        </ToastProvider>
    );
}
