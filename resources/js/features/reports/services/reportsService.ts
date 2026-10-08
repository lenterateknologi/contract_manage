import { apiClient, unwrapResponse } from '@/api/client';
import { API_ENDPOINTS } from '@/api/endpoints';
import type {
    AnalyticsReportResponse,
    AuditReportResponse,
    DivisionReportResponse,
    ReportFilterParams,
    TeamReportResponse,
} from '../types/reports.types';

export const reportsService = {
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

export const reportsApi = reportsService;
export default reportsService;
