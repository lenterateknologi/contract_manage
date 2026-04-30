import { Head } from '@inertiajs/react';

import { ContractTypeManagement } from '@/components/admin/ContractTypeManagement';
import { DepartmentManagement } from '@/components/admin/DepartmentManagement';
import { NavigationManagement } from '@/components/admin/NavigationManagement';
import { NumberingFormatManagement } from '@/components/admin/NumberingFormatManagement';
import { RoleManagement } from '@/components/admin/RoleManagement';
import { StatusManagement } from '@/components/admin/StatusManagement';
import { UserManagement } from '@/components/admin/UserManagement';
import { VendorManagement } from '@/components/admin/VendorManagement';
import { WorkflowManagement } from '@/components/admin/WorkflowManagement';
import { ToastProvider } from '@/components/contracts/Toast';

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
    filters?: any;
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
    filters = {},
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
    };

    const viewTitle = viewTitleMap[currentView] || 'Administrasi Sistem';

    // Helper to ensure we have roles and departments as simple arrays for selects
    const rolesArray = Array.isArray(roles) ? roles : roles?.data || [];
    const deptsArray = Array.isArray(departments) ? departments : departments?.data || [];
    const typesArray = Array.isArray(contractTypes || types) ? contractTypes || types : (contractTypes || types)?.data || [];
    const usersArray = Array.isArray(users) ? users : users?.data || [];
    const navigationsArray = Array.isArray(groups || moduleGroups) ? groups || moduleGroups : (groups || moduleGroups)?.data || [];

    const renderView = () => {
        switch (currentView) {
            case 'users':
                return <UserManagement users={users} roles={rolesArray} departments={deptsArray} filters={filters} />;
            case 'roles':
                return <RoleManagement roles={roles} filters={filters} />;
            case 'workflows':
                return (
                    <WorkflowManagement
                        workflows={workflows}
                        contractTypes={typesArray}
                        departments={deptsArray}
                        roles={rolesArray}
                        users={usersArray}
                        contractStatuses={contractStatuses || []}
                        filters={filters}
                    />
                );
            case 'departments':
                return <DepartmentManagement departments={departments} filters={filters} />;
            case 'contract-types':
                return (
                    <ContractTypeManagement
                        contractTypes={contractTypes || types}
                        formTemplates={formTemplates}
                        contractTemplates={contractTemplates}
                        filters={filters}
                    />
                );
            case 'contract-statuses':
                return <StatusManagement statuses={statuses} filters={filters} />;
            case 'module-groups':
                return <NavigationManagement groups={navigationsArray} modules={modules} isModuleView={false} filters={filters} />;
            case 'modules':
                return <NavigationManagement groups={navigationsArray} modules={modules} isModuleView={true} filters={filters} />;
            case 'vendors':
                return <VendorManagement vendors={vendors} filters={filters} />;
            case 'numbering-formats':
                return <NumberingFormatManagement formats={formats} />;
            default:
                return (
                    <div className="flex h-full items-center justify-center text-xs font-black tracking-widest text-slate-400 uppercase">
                        Pilih menu administrasi untuk mengelola sistem
                    </div>
                );
        }
    };

    return (
        <ToastProvider>
            <Head title={`Admin - ${viewTitle}`} />

            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden bg-[var(--background)]">
                <div className="flex-1 overflow-hidden">{renderView()}</div>
            </div>
        </ToastProvider>
    );
}
