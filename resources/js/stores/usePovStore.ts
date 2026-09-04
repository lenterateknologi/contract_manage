import { useSyncExternalStore, useMemo } from 'react';
import { type PovOptions } from '@/types';

export interface NavPovOption {
    id: string;
    label: string;
    roleName: string;
    badge: string;
    description: string;
    allowedRoutes?: string[];
    can_create_on_behalf?: boolean;
}

export interface DashboardTypePovOption {
    id: string;
    label: string;
    badge: string;
    description: string;
    config?: {
        show_overview: boolean;
        show_workload: boolean;
        show_master_data: boolean;
    };
}

export interface ContractFilterPovOption {
    id: string;
    label: string;
    badge: string;
    description: string;
    permissions?: {
        can_change_company_group: boolean;
        can_change_region: boolean;
        can_change_company: boolean;
        can_change_division: boolean;
        can_change_department: boolean;
    };
}

export const FALLBACK_NAV_OPTIONS: NavPovOption[] = [
    {
        id: 'super-admin',
        label: 'Super Admin',
        roleName: 'Super Admin',
        badge: 'All Access',
        description: 'Semua modul navigasi, pengaturan sistem & master data lengkap',
        allowedRoutes: undefined,
    },
    {
        id: 'admin',
        label: 'Admin',
        roleName: 'Admin',
        badge: 'Admin',
        description: 'Akses operasional, master data & portal',
        allowedRoutes: [
            '/dashboard',
            '/contracts',
            '/contracts/mine',
            '/contracts/pending',
            '/contracts/expiry',
            '/admin/chat',
            '/admin/templates',
            '/admin/core/vendors',
            '/admin/core/users',
            '/admin/core/regions',
            '/admin/core/roles',
            '/admin/form-templates',
            '/admin/core/departments',
            '/admin/core/companies',
            '/admin/core/company-groups',
            '/admin/core/divisions',
            '/admin/core/contract-types',
            '/admin/core/contract-statuses',
            '/admin/core/locations',
            '/admin/core/business-units',
            '/admin/core/job-levels',
            '/admin/core/job-titles',
            '/admin/reports/analytics',
            '/admin/reports/audit',
        ],
    },
    {
        id: 'manager',
        label: 'Manager / Approver',
        roleName: 'Manager',
        badge: 'Approver',
        description: 'Persetujuan pengajuan, monitoring dan laporan',
        allowedRoutes: [
            '/dashboard',
            '/contracts',
            '/contracts/mine',
            '/contracts/pending',
            '/admin/chat',
            '/admin/templates',
            '/admin/reports/analytics',
            '/admin/reports/audit',
        ],
    },
    {
        id: 'staff',
        label: 'Staff / Pemohon',
        roleName: 'Staff',
        badge: 'Staff',
        description: 'Pembuatan pengajuan baru, dokumen & diskusi',
        allowedRoutes: [
            '/dashboard',
            '/contracts',
            '/contracts/mine',
            '/contracts/pending',
            '/admin/chat',
            '/admin/templates',
            '/admin/reports/analytics',
            '/admin/reports/audit',
        ],
    },
];

export const FALLBACK_DASHBOARD_OPTIONS: DashboardTypePovOption[] = [
    {
        id: 'default',
        label: 'Default (Ikuti Setting)',
        badge: 'Original',
        description: 'Tampilan dashboard asli sesuai konfigurasi peran pengguna di sistem',
        config: undefined,
    },
    {
        id: 'all',
        label: 'Semua Tab Aktif',
        badge: 'Full Tabs',
        description: 'Menampilkan seluruh tab: Ringkasan, Beban Kerja, dan Master Data',
        config: {
            show_overview: true,
            show_workload: true,
            show_master_data: true,
        },
    },
    {
        id: 'overview-workload',
        label: 'Ringkasan & Beban Kerja',
        badge: 'Manager POV',
        description: 'Menampilkan tab Ringkasan Metrik dan tab Beban Kerja Tim',
        config: {
            show_overview: true,
            show_workload: true,
            show_master_data: false,
        },
    },
    {
        id: 'overview-only',
        label: 'Hanya Ringkasan (Overview)',
        badge: 'Staff POV',
        description: 'Hanya menampilkan tab Ringkasan metriks status kontrak',
        config: {
            show_overview: true,
            show_workload: false,
            show_master_data: false,
        },
    },
];

export const FALLBACK_FILTER_OPTIONS: ContractFilterPovOption[] = [
    {
        id: 'default',
        label: 'Default (Ikuti Setting)',
        badge: 'Original',
        description: 'Hak akses filter asli sesuai profil pengguna & template aktif',
        permissions: undefined,
    },
    {
        id: 'open-all',
        label: 'Open All (Akses Penuh)',
        badge: 'Super Admin',
        description: 'Bebas memilih & mengubah semua Grup, Region, Perusahaan, Divisi, dan Departemen',
        permissions: {
            can_change_company_group: true,
            can_change_region: true,
            can_change_company: true,
            can_change_division: true,
            can_change_department: true,
        },
    },
    {
        id: 'staff-biasa',
        label: 'Staff Biasa (Terkunci ke Unit)',
        badge: 'Strict Scope',
        description: 'Seluruh dropdown organisasi terkunci hanya pada unit/departemen milik user sendiri',
        permissions: {
            can_change_company_group: false,
            can_change_region: false,
            can_change_company: false,
            can_change_division: false,
            can_change_department: false,
        },
    },
];

export interface PovState {
    navPovId: string;
    dashboardPovId: string;
    filterPovId: string;
}

const getInitialState = (): PovState => {
    if (typeof window === 'undefined') {
        return {
            navPovId: 'super-admin',
            dashboardPovId: 'default',
            filterPovId: 'default',
        };
    }
    return {
        navPovId: localStorage.getItem('sidebar_nav_pov') || 'super-admin',
        dashboardPovId: localStorage.getItem('dashboard_type_pov') || 'default',
        filterPovId: localStorage.getItem('contract_filter_pov') || 'default',
    };
};

let currentPovState: PovState = getInitialState();
const povListeners = new Set<() => void>();

function notifyListeners() {
    povListeners.forEach((listener) => listener());
}

export const povStore = {
    getState: () => currentPovState,
    setNavPov: (id: string) => {
        currentPovState = { ...currentPovState, navPovId: id };
        if (typeof window !== 'undefined') {
            localStorage.setItem('sidebar_nav_pov', id);
        }
        notifyListeners();
    },
    setDashboardPov: (id: string) => {
        currentPovState = { ...currentPovState, dashboardPovId: id };
        if (typeof window !== 'undefined') {
            localStorage.setItem('dashboard_type_pov', id);
        }
        notifyListeners();
    },
    setFilterPov: (id: string) => {
        currentPovState = { ...currentPovState, filterPovId: id };
        if (typeof window !== 'undefined') {
            localStorage.setItem('contract_filter_pov', id);
        }
        notifyListeners();
    },
    resetAll: () => {
        currentPovState = {
            navPovId: 'super-admin',
            dashboardPovId: 'default',
            filterPovId: 'default',
        };
        if (typeof window !== 'undefined') {
            localStorage.setItem('sidebar_nav_pov', 'super-admin');
            localStorage.setItem('dashboard_type_pov', 'default');
            localStorage.setItem('contract_filter_pov', 'default');
        }
        notifyListeners();
    },
    subscribe: (listener: () => void) => {
        povListeners.add(listener);
        return () => povListeners.delete(listener);
    },
};

export function usePov(povOptions?: PovOptions | null) {
    const state = useSyncExternalStore(povStore.subscribe, povStore.getState, povStore.getState);

    // 1. Resolve Navigation POV options (Database Roles or Fallback)
    const navOptions = useMemo<NavPovOption[]>(() => {
        if (povOptions?.roles && povOptions.roles.length > 0) {
            return povOptions.roles.map((r) => ({
                id: r.id || r.name,
                label: r.label || r.name,
                roleName: r.name,
                badge: r.badge || 'Role',
                description: r.description || `Simulasi menu hak akses ${r.name}`,
                allowedRoutes: r.allowed_routes === null ? undefined : (r.allowed_routes || []),
                can_create_on_behalf: r.can_create_on_behalf,
            }));
        }
        return FALLBACK_NAV_OPTIONS;
    }, [povOptions?.roles]);

    // 2. Resolve Dashboard Type POV options (Database Dashboard Types or Fallback)
    const dashboardOptions = useMemo<DashboardTypePovOption[]>(() => {
        const defaultOpt: DashboardTypePovOption = {
            id: 'default',
            label: 'Default (Ikuti Setting)',
            badge: 'Original',
            description: 'Tampilan dashboard asli sesuai konfigurasi peran pengguna di sistem',
            config: undefined,
        };

        if (povOptions?.dashboard_types && povOptions.dashboard_types.length > 0) {
            const dbList: DashboardTypePovOption[] = povOptions.dashboard_types.map((dt) => ({
                id: dt.id,
                label: dt.label || dt.name,
                badge: dt.badge || 'Tipe Dashboard',
                description: dt.description || `Konfigurasi tab untuk ${dt.name}`,
                config: {
                    show_overview: !!dt.show_overview,
                    show_workload: !!dt.show_workload,
                    show_master_data: !!dt.show_master_data,
                },
            }));
            return [defaultOpt, ...dbList];
        }
        return FALLBACK_DASHBOARD_OPTIONS;
    }, [povOptions?.dashboard_types]);

    // 3. Resolve Contract Filter Scope POV options (Database Filter Templates or Fallback)
    const filterOptions = useMemo<ContractFilterPovOption[]>(() => {
        const defaultOpt: ContractFilterPovOption = {
            id: 'default',
            label: 'Default (Ikuti Setting)',
            badge: 'Original',
            description: 'Hak akses filter asli sesuai profil pengguna & template aktif',
            permissions: undefined,
        };

        if (povOptions?.filter_templates && povOptions.filter_templates.length > 0) {
            const dbList: ContractFilterPovOption[] = povOptions.filter_templates.map((ft) => ({
                id: ft.id,
                label: ft.label || ft.name,
                badge: ft.badge || 'Template Scope',
                description: ft.description || `Lingkup filter: ${ft.name}`,
                permissions: {
                    can_change_company_group: !!ft.can_change_company_group,
                    can_change_region: !!ft.can_change_region,
                    can_change_company: !!ft.can_change_company,
                    can_change_division: !!ft.can_change_division,
                    can_change_department: !!ft.can_change_department,
                },
            }));
            return [defaultOpt, ...dbList];
        }
        return FALLBACK_FILTER_OPTIONS;
    }, [povOptions?.filter_templates]);

    const activeNavPov = navOptions.find((p) => p.id === state.navPovId || p.roleName === state.navPovId) || navOptions[0];
    const activeDashboardPov = dashboardOptions.find((p) => p.id === state.dashboardPovId) || dashboardOptions[0];
    const activeFilterPov = filterOptions.find((p) => p.id === state.filterPovId) || filterOptions[0];

    const isSimulatingNav = state.navPovId !== 'super-admin' && activeNavPov?.allowedRoutes !== undefined;
    const isSimulatingDashboard = state.dashboardPovId !== 'default';
    const isSimulatingFilter = state.filterPovId !== 'default';
    const isSimulatingAny = isSimulatingNav || isSimulatingDashboard || isSimulatingFilter;

    return {
        ...state,
        navOptions,
        dashboardOptions,
        filterOptions,
        activeNavPov,
        activeDashboardPov,
        activeFilterPov,
        isSimulatingNav,
        isSimulatingDashboard,
        isSimulatingFilter,
        isSimulatingAny,
        setNavPov: povStore.setNavPov,
        setDashboardPov: povStore.setDashboardPov,
        setFilterPov: povStore.setFilterPov,
        resetAll: povStore.resetAll,
    };
}
