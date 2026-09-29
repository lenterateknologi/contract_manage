import { apiClient, unwrapResponse } from '../client';
import { API_ENDPOINTS } from '../endpoints';
import { Contract, PaginatedData } from '@/pages/contracts/types';

export const contractsApi = {
    /**
     * Get paginated list of contracts
     */
    list: (params?: any): Promise<PaginatedData<Contract>> =>
        unwrapResponse(apiClient.get(API_ENDPOINTS.CONTRACTS.BASE, { params })),

    /**
     * Get single contract detail
     */
    get: (id: string): Promise<Contract> =>
        unwrapResponse(apiClient.get(API_ENDPOINTS.CONTRACTS.DETAIL(id))),

    /**
     * Create a new contract draft
     */
    create: (data: FormData | Record<string, any>): Promise<Contract> =>
        unwrapResponse(apiClient.post(API_ENDPOINTS.CONTRACTS.CREATE, data)),

    /**
     * Update contract details
     */
    update: (id: string, data: any): Promise<Contract> =>
        unwrapResponse(apiClient.patch(API_ENDPOINTS.CONTRACTS.UPDATE(id), data)),

    /**
     * Mark a document (f1/f2/agreement) as reviewed
     */
    reviewDoc: (id: string, doc: 'f1' | 'f2' | 'agreement'): Promise<{ message?: string; metadata?: any; contract?: Contract }> =>
        unwrapResponse(apiClient.post(API_ENDPOINTS.CONTRACTS.REVIEW_DOC(id), { doc })),

    /**
     * Delete contract draft
     */
    delete: (id: string): Promise<any> =>
        unwrapResponse(apiClient.delete(API_ENDPOINTS.CONTRACTS.DELETE(id))),

    /**
     * Bulk delete contracts
     */
    bulkDelete: (ids: string[]): Promise<any> =>
        unwrapResponse(apiClient.post(API_ENDPOINTS.CONTRACTS.BULK_DELETE, { ids })),

    /**
     * Get contract types master
     */
    getTypes: (): Promise<any[]> =>
        unwrapResponse(apiClient.get(API_ENDPOINTS.CONTRACTS.TYPES)),

    /**
     * Get submission types master
     */
    getSubmissionTypes: (): Promise<any[]> =>
        unwrapResponse(apiClient.get(API_ENDPOINTS.CONTRACTS.SUBMISSION_TYPES)),

    /**
     * Get available workflows for user and contract type
     */
    getWorkflows: (contractType?: string, userId?: string): Promise<any[]> =>
        unwrapResponse(apiClient.get(API_ENDPOINTS.CONTRACTS.WORKFLOWS, { params: { contract_type: contractType, user_id: userId } })),

    /**
     * Get users list
     */
    getUsers: (params?: any): Promise<any[]> =>
        unwrapResponse(apiClient.get(API_ENDPOINTS.CONTRACTS.USERS, { params })),

    /**
     * Get roles list
     */
    getRoles: (): Promise<any[]> =>
        unwrapResponse(apiClient.get(API_ENDPOINTS.CONTRACTS.ROLES)),

    /**
     * Get dashboard metrics
     */
    getDashboardMetrics: (params?: any): Promise<any> =>
        unwrapResponse(apiClient.get(API_ENDPOINTS.CONTRACTS.DASHBOARD_METRICS, { params })),
};
