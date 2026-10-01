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

export const reportsApi = {
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
    getData: (params: ReportFilterParams = {}) =>
        unwrapResponse(apiClient.post(API_ENDPOINTS.REPORTS.DATA, params)),
};

export default reportsApi;
