/**
 * Application Route Constants
 */
export const ROUTES = {
    DASHBOARD: '/dashboard',
    CONTRACTS: {
        INDEX: '/contracts',
        SHOW: (id: string | number) => `/contracts/${id}`,
        CREATE: '/contracts/create',
        EDIT: (id: string | number) => `/contracts/${id}/edit`,
    },
    WORKFLOWS: {
        INDEX: '/workflows',
        SHOW: (id: string | number) => `/workflows/${id}`,
    },
    CORE: {
        VENDORS: '/core/vendors',
        DEPARTMENTS: '/core/departments',
        DIVISIONS: '/core/divisions',
        COMPANIES: '/core/companies',
    },
    TEMPLATES: '/contract-templates',
    REPORTS: '/reports',
    SETTINGS: {
        PROFILE: '/settings/profile',
        GENERAL: '/settings/general',
    },
} as const;

export default ROUTES;
