import { apiClient, unwrapResponse } from '@/api/client';
import { API_ENDPOINTS } from '@/api/endpoints';
import { PaginatedData } from '@/features/Contracts/types';

export interface AppNotification {
    id: string;
    type: 'message' | 'approval' | 'system' | 'mention';
    title: string;
    description?: string;
    contract_id?: string;
    message_id?: string;
    contract_title?: string;
    contract_no?: string;
    sender?: {
        id: string;
        name: string;
        email?: string;
        avatar_url?: string;
    };
    created_at: string;
    is_read: boolean;
}

export const notificationsService = {
    /**
     * Get paginated notifications
     */
    list: (params?: { page?: number; per_page?: number; unread_only?: boolean }): Promise<PaginatedData<AppNotification>> =>
        unwrapResponse(apiClient.get(API_ENDPOINTS.NOTIFICATIONS.BASE, { params })),

    /**
     * Get unread notifications count
     */
    getUnreadCount: (): Promise<{ count: number }> =>
        unwrapResponse(apiClient.get(API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT)),

    /**
     * Mark all notifications as read
     */
    markAllRead: (): Promise<{ marked_count: number }> =>
        unwrapResponse(apiClient.post(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ)),

    /**
     * Mark single notification as read
     */
    markSingleRead: (id: string): Promise<AppNotification> =>
        unwrapResponse(apiClient.post(API_ENDPOINTS.NOTIFICATIONS.MARK_READ(id))),

    /**
     * Dismiss / delete notification
     */
    dismiss: (id: string): Promise<any> =>
        unwrapResponse(apiClient.delete(API_ENDPOINTS.NOTIFICATIONS.DISMISS(id))),
};

export const notificationsApi = notificationsService;
export default notificationsService;
