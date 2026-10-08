import { Contract, PaginatedData } from '@/features/Contracts/types';
import { apiClient, unwrapResponse } from '@/api/client';
import { API_ENDPOINTS } from '@/api/endpoints';

export const contractsApi = {
    /**
     * Get paginated list of contracts
     */
    list: (params?: any): Promise<PaginatedData<Contract>> => unwrapResponse(apiClient.get(API_ENDPOINTS.CONTRACTS.BASE, { params })),

    /**
     * Get single contract detail
     */
    get: (id: string): Promise<Contract> => unwrapResponse(apiClient.get(API_ENDPOINTS.CONTRACTS.DETAIL(id))),

    /**
     * Create a new contract draft
     */
    create: (data: FormData | Record<string, any>): Promise<Contract> => unwrapResponse(apiClient.post(API_ENDPOINTS.CONTRACTS.CREATE, data)),

    /**
     * Update contract details
     */
    update: (id: string, data: any): Promise<Contract> => unwrapResponse(apiClient.patch(API_ENDPOINTS.CONTRACTS.UPDATE(id), data)),

    /**
     * Mark a document (f1/f2/agreement) as reviewed
     */
    reviewDoc: (id: string, doc: 'f1' | 'f2' | 'agreement'): Promise<{ message?: string; metadata?: any; contract?: Contract }> =>
        unwrapResponse(apiClient.post(API_ENDPOINTS.CONTRACTS.REVIEW_DOC(id), { doc })),

    /**
     * Delete contract draft
     */
    delete: (id: string): Promise<any> => unwrapResponse(apiClient.delete(API_ENDPOINTS.CONTRACTS.DELETE(id))),

    /**
     * Bulk delete contracts
     */
    bulkDelete: (ids: string[]): Promise<any> => unwrapResponse(apiClient.post(API_ENDPOINTS.CONTRACTS.BULK_DELETE, { ids })),

    /**
     * Get contract types master
     */
    getTypes: (): Promise<any[]> => unwrapResponse(apiClient.get(API_ENDPOINTS.CONTRACTS.TYPES)),

    /**
     * Get submission types master
     */
    getSubmissionTypes: (): Promise<any[]> => unwrapResponse(apiClient.get(API_ENDPOINTS.CONTRACTS.SUBMISSION_TYPES)),

    /**
     * Get available workflows for user and contract type
     */
    getWorkflows: (contractType?: string, userId?: string): Promise<any[]> =>
        unwrapResponse(apiClient.get(API_ENDPOINTS.CONTRACTS.WORKFLOWS, { params: { contract_type: contractType, user_id: userId } })),

    /**
     * Get users list
     */
    getUsers: (params?: any): Promise<any[]> => unwrapResponse(apiClient.get(API_ENDPOINTS.CONTRACTS.USERS, { params })),

    /**
     * Get roles list
     */
    getRoles: (): Promise<any[]> => unwrapResponse(apiClient.get(API_ENDPOINTS.CONTRACTS.ROLES)),

    /**
     * Get dashboard metrics (all or filtered by section)
     */
    getDashboardMetrics: (params?: any): Promise<any> => unwrapResponse(apiClient.get(API_ENDPOINTS.CONTRACTS.DASHBOARD.METRICS, { params })),

    /**
     * Get dashboard summary & KPIs
     */
    getDashboardSummary: (params?: any): Promise<any> => unwrapResponse(apiClient.get(API_ENDPOINTS.CONTRACTS.DASHBOARD.SUMMARY, { params })),

    /**
     * Get dashboard overview
     */
    getDashboardOverview: (params?: any): Promise<any> => unwrapResponse(apiClient.get(API_ENDPOINTS.CONTRACTS.DASHBOARD.OVERVIEW, { params })),

    /**
     * Get dashboard distributions
     */
    getDashboardDistributions: (params?: any): Promise<any> =>
        unwrapResponse(apiClient.get(API_ENDPOINTS.CONTRACTS.DASHBOARD.DISTRIBUTIONS, { params })),

    /**
     * Get dashboard trends
     */
    getDashboardTrends: (params?: any): Promise<any> => unwrapResponse(apiClient.get(API_ENDPOINTS.CONTRACTS.DASHBOARD.TRENDS, { params })),

    /**
     * Get dashboard analysis
     */
    getDashboardAnalysis: (params?: any): Promise<any> => unwrapResponse(apiClient.get(API_ENDPOINTS.CONTRACTS.DASHBOARD.ANALYSIS, { params })),

    /**
     * Get dashboard workload
     */
    getDashboardWorkload: (params?: any): Promise<any> => unwrapResponse(apiClient.get(API_ENDPOINTS.CONTRACTS.DASHBOARD.WORKLOAD, { params })),

    /**
     * Get dashboard master data
     */
    getDashboardMasterData: (params?: any): Promise<any> => unwrapResponse(apiClient.get(API_ENDPOINTS.CONTRACTS.DASHBOARD.MASTER_DATA, { params })),

    /**
     * Get dashboard recent activity
     */
    getDashboardRecentActivity: (params?: any): Promise<any> =>
        unwrapResponse(apiClient.get(API_ENDPOINTS.CONTRACTS.DASHBOARD.RECENT_ACTIVITY, { params })),

    /**
     * Get document types & mechanisms configuration for a contract submission
     */
    getDocumentTypes: (id: string, type?: string): Promise<any> => unwrapResponse(apiClient.get(API_ENDPOINTS.SUBRESOURCES.DOCUMENT_TYPES(id, type))),
};
