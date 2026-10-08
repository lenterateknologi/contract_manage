import { apiClient, unwrapResponse } from '../client';
import { API_ENDPOINTS } from '../endpoints';

export const workflowsApi = {
    /**
     * List admin workflows
     */
    list: (params?: any): Promise<any> => unwrapResponse(apiClient.get(API_ENDPOINTS.WORKFLOWS.BASE, { params })),

    /**
     * Get single workflow detail
     */
    get: (id: string): Promise<any> => unwrapResponse(apiClient.get(API_ENDPOINTS.WORKFLOWS.DETAIL(id))),

    /**
     * Create workflow
     */
    create: (data: any): Promise<any> => unwrapResponse(apiClient.post(API_ENDPOINTS.WORKFLOWS.BASE, data)),

    /**
     * Update workflow
     */
    update: (id: string, data: any): Promise<any> => unwrapResponse(apiClient.put(API_ENDPOINTS.WORKFLOWS.DETAIL(id), data)),

    /**
     * Delete workflow
     */
    delete: (id: string): Promise<any> => unwrapResponse(apiClient.delete(API_ENDPOINTS.WORKFLOWS.DETAIL(id))),

    /**
     * Toggle workflow field (is_default, is_selectable, is_active)
     */
    toggle: (id: string, field: 'is_default' | 'is_selectable' | 'is_active', value: boolean): Promise<any> =>
        unwrapResponse(apiClient.patch(API_ENDPOINTS.WORKFLOWS.TOGGLE(id), { field, value })),

    /**
     * Toggle active state shortcut
     */
    toggleActive: (id: string, isActive: boolean): Promise<any> =>
        unwrapResponse(apiClient.patch(API_ENDPOINTS.WORKFLOWS.TOGGLE(id), { field: 'is_active', value: isActive })),

    /**
     * Duplicate workflow
     */
    duplicate: (id: string): Promise<any> => unwrapResponse(apiClient.post(API_ENDPOINTS.WORKFLOWS.DUPLICATE(id))),

    /**
     * Bulk delete workflows
     */
    bulkDelete: (ids: string[]): Promise<any> => unwrapResponse(apiClient.post(API_ENDPOINTS.WORKFLOWS.BULK_DELETE, { ids })),

    /**
     * Preview workflow step simulation
     */
    preview: (id: string): Promise<any> => unwrapResponse(apiClient.get(API_ENDPOINTS.WORKFLOWS.PREVIEW(id))),

    /**
     * Presets management
     */
    presets: {
        list: (): Promise<any[]> => unwrapResponse(apiClient.get(API_ENDPOINTS.WORKFLOWS.PRESETS)),
        create: (data: any): Promise<any> => unwrapResponse(apiClient.post(API_ENDPOINTS.WORKFLOWS.PRESETS, data)),
        update: (id: string, data: any): Promise<any> => unwrapResponse(apiClient.put(API_ENDPOINTS.WORKFLOWS.PRESET_DETAIL(id), data)),
        delete: (id: string): Promise<any> => unwrapResponse(apiClient.delete(API_ENDPOINTS.WORKFLOWS.PRESET_DETAIL(id))),
    },
};
