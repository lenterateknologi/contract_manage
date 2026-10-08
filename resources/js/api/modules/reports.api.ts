import { apiClient, unwrapResponse } from '../client';
import { API_ENDPOINTS } from '../endpoints';

export interface ReportFilterParams {
    date_from?: string;
    date_to?: string;
    contract_type_ids?: string[];
    creator_ids?: string[];
    involved_ids?: string[];
    contract_ids?: string[];
    statuses?: string[];
    actions?: string[];
    search?: string;
    page?: number;
    per_page?: number;
    contracts_page?: number;
    audit_page?: number;
    [key: string]: any;
}

export interface AnalyticsReportResponse {
    metrics: {
        avgCycleTime: number;
        totalContracts: number;
        pendingApprovals: number;
        approvedThisMonth: number;
    };
    contracts: {
        data: any[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
    };
    bottlenecks: { role: string; count: number }[];
    statusDistribution: { status: string; count: number }[];
    monthlyTrend: any[];
    users: { id: string; name: string }[];
    types: { id: string; name: string }[];
    companies: any[];
}

export interface AuditReportResponse {
    histories: {
        data: any[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
    };
    users: { id: string; name: string }[];
    types?: { id: string; name: string }[];
    contracts?: { id: string; name: string }[];
    actions?: string[];
}

export interface DivisionMatrixItem {
    division_id?: string;
    division_name?: string;
    division_code?: string;
    org_group_id?: string;
    org_group_name?: string;
    org_group_code?: string;
    months: Record<number, number>;
    total: number;
    average: number;
}

export interface DivisionReportSummary {
    totalSubmissions: number;
    avgPerMonth: number;
    activeDivisionsCount: number;
    totalDivisions: number;
    topDivision: { name: string; total: number; code?: string } | null;
    peakMonth: { month: number; name: string; total: number } | null;
}

export interface DivisionReportResponse {
    status: string;
    year: number;
    availableYears: number[];
    groupBy: 'division' | 'org_group';
    divisions: { id: string; name: string; code?: string }[];
    organizationGroups: { id: string; name: string; code?: string }[];
    types: { id: string; name: string }[];
    statuses: { code: string; label: string }[];
    matrix: DivisionMatrixItem[];
    monthlyTotals: Record<number, number>;
    summary: DivisionReportSummary;
    matrixDivision?: DivisionMatrixItem[];
    monthlyTotalsDivision?: Record<number, number>;
    summaryDivision?: DivisionReportSummary;
    matrixOrgGroup?: DivisionMatrixItem[];
    monthlyTotalsOrgGroup?: Record<number, number>;
    summaryOrgGroup?: DivisionReportSummary;
    submissions: Array<{
        id: string;
        contract_no: string;
        title: string;
        status: string;
        created_at: string;
        creator_name: string;
        division_name: string;
        division_code: string;
        org_group_name?: string;
        org_group_code?: string;
        contract_type_name: string;
    }>;
}

export interface TeamMatrixItem {
    user_id: string;
    user_name: string;
    user_email?: string;
    user_nik?: string;
    department_name?: string;
    department_code?: string;
    division_name?: string;
    org_group_name?: string;
    months: Record<number, number>;
    total: number;
    average: number;
}

export interface TeamReportResponse {
    status: string;
    year: number;
    availableYears: number[];
    roleType: 'creator' | 'pic';
    currentOrgGroup?: { id: string; name: string; code?: string; user_count?: number } | null;
    organizationGroups: { id: string; name: string; code?: string; user_count?: number }[];
    matrix: TeamMatrixItem[];
    monthlyTotals: Record<number, number>;
    summary: {
        totalSubmissions: number;
        activeUsersCount: number;
        totalUsers: number;
        topUser: { name: string; total: number; email?: string; division?: string } | null;
        peakMonth: { month: number; name: string; total: number } | null;
    };
}

export const reportsApi = {
    /**
     * Get Monthly Submissions by Division or Org Group Report Data
     */
    getDivisionMonthly: (
        params: {
            year?: number;
            group_by?: 'division' | 'org_group';
            division_ids?: string[];
            organization_group_ids?: string[];
            org_group_ids?: string[];
            contract_type_ids?: string[];
            statuses?: string[];
            search?: string;
        } = {},
    ): Promise<DivisionReportResponse> => unwrapResponse(apiClient.post(API_ENDPOINTS.REPORTS.DIVISIONS, params)),

    /**
     * Build download URL for Division Monthly Report CSV Export
     */
    getExportDivisionsUrl: (
        params: {
            year?: number;
            group_by?: 'division' | 'org_group';
            division_ids?: string[];
            organization_group_ids?: string[];
            org_group_ids?: string[];
            contract_type_ids?: string[];
            statuses?: string[];
            search?: string;
        } = {},
    ): string => {
        const queryParams = new URLSearchParams();
        if (params.year) queryParams.append('year', String(params.year));
        if (params.group_by) queryParams.append('group_by', params.group_by);
        if (params.division_ids && Array.isArray(params.division_ids)) {
            params.division_ids.forEach((id) => queryParams.append('division_ids[]', id));
        }
        if (params.organization_group_ids && Array.isArray(params.organization_group_ids)) {
            params.organization_group_ids.forEach((id) => queryParams.append('organization_group_ids[]', id));
        }
        if (params.org_group_ids && Array.isArray(params.org_group_ids)) {
            params.org_group_ids.forEach((id) => queryParams.append('org_group_ids[]', id));
        }
        if (params.contract_type_ids && Array.isArray(params.contract_type_ids)) {
            params.contract_type_ids.forEach((id) => queryParams.append('contract_type_ids[]', id));
        }
        if (params.statuses && Array.isArray(params.statuses)) {
            params.statuses.forEach((s) => queryParams.append('statuses[]', s));
        }
        if (params.search) queryParams.append('search', params.search);

        const qs = queryParams.toString();
        return `${API_ENDPOINTS.REPORTS.EXPORT_DIVISIONS}${qs ? `?${qs}` : ''}`;
    },

    /**
     * Get Monthly Submissions / PIC Tasks by Org Group Team Report Data
     */
    getTeamMonthly: (
        params: {
            year?: number;
            role_type?: 'creator' | 'pic';
            org_group_id?: string;
            search?: string;
        } = {},
    ): Promise<TeamReportResponse> => unwrapResponse(apiClient.post(API_ENDPOINTS.REPORTS.TEAM, params)),

    /**
     * Build download URL for Team Monthly Report CSV Export
     */
    getExportTeamUrl: (
        params: {
            year?: number;
            role_type?: 'creator' | 'pic';
            org_group_id?: string;
            search?: string;
        } = {},
    ): string => {
        const queryParams = new URLSearchParams();
        if (params.year) queryParams.append('year', String(params.year));
        if (params.role_type) queryParams.append('role_type', params.role_type);
        if (params.org_group_id) queryParams.append('org_group_id', params.org_group_id);
        if (params.search) queryParams.append('search', params.search);

        const qs = queryParams.toString();
        return `${API_ENDPOINTS.REPORTS.EXPORT_TEAM}${qs ? `?${qs}` : ''}`;
    },

    /**
     * Get Contract Analytics Report Data
     */
    getAnalytics: (params: ReportFilterParams = {}): Promise<AnalyticsReportResponse> =>
        unwrapResponse(apiClient.post(API_ENDPOINTS.REPORTS.ANALYTICS, params)),

    /**
     * Get Audit Trail Report Data
     */
    getAuditLogs: (params: ReportFilterParams = {}): Promise<AuditReportResponse> =>
        unwrapResponse(apiClient.post(API_ENDPOINTS.REPORTS.AUDIT, params)),

    /**
     * Build download URL for Analytics Excel Export
     */
    getExportAnalyticsUrl: (params: ReportFilterParams = {}): string => {
        const queryParams = new URLSearchParams();
        if (params.date_from) queryParams.append('date_from', params.date_from);
        if (params.date_to) queryParams.append('date_to', params.date_to);
        if (params.contract_type_ids && Array.isArray(params.contract_type_ids)) {
            params.contract_type_ids.forEach((id) => queryParams.append('contract_type_ids[]', id));
        }
        if (params.creator_ids && Array.isArray(params.creator_ids)) {
            params.creator_ids.forEach((id) => queryParams.append('creator_ids[]', id));
        }
        if (params.involved_ids && Array.isArray(params.involved_ids)) {
            params.involved_ids.forEach((id) => queryParams.append('involved_ids[]', id));
        }
        if (params.contract_ids && Array.isArray(params.contract_ids)) {
            params.contract_ids.forEach((id) => queryParams.append('contract_ids[]', id));
        }
        if (params.statuses && Array.isArray(params.statuses)) {
            params.statuses.forEach((s) => queryParams.append('statuses[]', s));
        }
        if (params.search) queryParams.append('search', params.search);

        const qs = queryParams.toString();
        return `${API_ENDPOINTS.REPORTS.EXPORT_ANALYTICS}${qs ? `?${qs}` : ''}`;
    },

    /**
     * Build download URL for Audit Trail Excel Export
     */
    getExportAuditUrl: (params: ReportFilterParams = {}): string => {
        const queryParams = new URLSearchParams();
        if (params.date_from) queryParams.append('date_from', params.date_from);
        if (params.date_to) queryParams.append('date_to', params.date_to);
        if (params.creator_ids && Array.isArray(params.creator_ids)) {
            params.creator_ids.forEach((id) => queryParams.append('creator_ids[]', id));
        }
        if (params.contract_type_ids && Array.isArray(params.contract_type_ids)) {
            params.contract_type_ids.forEach((id) => queryParams.append('contract_type_ids[]', id));
        }
        if (params.contract_ids && Array.isArray(params.contract_ids)) {
            params.contract_ids.forEach((id) => queryParams.append('contract_ids[]', id));
        }
        if (params.actions && Array.isArray(params.actions)) {
            params.actions.forEach((act) => queryParams.append('actions[]', act));
        }
        if (params.search) queryParams.append('search', params.search);

        const qs = queryParams.toString();
        return `${API_ENDPOINTS.REPORTS.EXPORT_AUDIT}${qs ? `?${qs}` : ''}`;
    },

    /**
     * Backward-compatible combined data fetch
     */
    getData: (params: ReportFilterParams = {}) => unwrapResponse(apiClient.post(API_ENDPOINTS.REPORTS.DATA, params)),
};

export default reportsApi;
