import { PaginatedData } from '@/pages/contracts/types';
import { apiClient, unwrapResponse } from '../client';
import { API_ENDPOINTS } from '../endpoints';

export interface DiscussionMessage {
    id: string;
    contract_id: string;
    user_id: string;
    message: string;
    attachment_path?: string;
    attachment_name?: string;
    reactions?: Record<string, string[]>;
    created_at: string;
    user?: {
        id: string;
        name: string;
        avatar_url?: string;
        role?: string;
    };
}

export const discussionsApi = {
    // 1. Thread Discussions Overview
    list: (params?: { page?: number; per_page?: number; category?: string; search?: string; unread_only?: boolean }): Promise<PaginatedData<any>> =>
        unwrapResponse(apiClient.get(API_ENDPOINTS.DISCUSSIONS.BASE, { params })),

    detail: (contractId: string, params?: { limit?: number; search?: string }): Promise<any> =>
        unwrapResponse(apiClient.get(API_ENDPOINTS.DISCUSSIONS.DETAIL(contractId), { params })),

    send: (contractId: string, message: string, file?: File): Promise<DiscussionMessage> => {
        const fd = new FormData();
        fd.append('message', message);
        if (file) fd.append('attachment', file);
        return unwrapResponse(apiClient.post(API_ENDPOINTS.DISCUSSIONS.SEND(contractId), fd));
    },

    markRead: (contractId: string): Promise<any> => unwrapResponse(apiClient.post(API_ENDPOINTS.DISCUSSIONS.MARK_READ(contractId))),

    // 2. Direct Contract Discussion Messages
    messages: {
        list: (contractId: string, params?: { limit?: number; search?: string }): Promise<DiscussionMessage[]> =>
            unwrapResponse(apiClient.get(API_ENDPOINTS.DISCUSSIONS.CONTRACT_MESSAGES(contractId), { params })),

        detail: (messageId: string): Promise<DiscussionMessage> => unwrapResponse(apiClient.get(API_ENDPOINTS.DISCUSSIONS.MESSAGE_DETAIL(messageId))),

        send: (contractId: string, message: string, file?: File): Promise<DiscussionMessage> => {
            const fd = new FormData();
            fd.append('message', message);
            if (file) fd.append('attachment', file);
            return unwrapResponse(apiClient.post(API_ENDPOINTS.DISCUSSIONS.CONTRACT_MESSAGES(contractId), fd));
        },

        react: (messageId: string, emoji: string): Promise<DiscussionMessage> =>
            unwrapResponse(apiClient.post(API_ENDPOINTS.DISCUSSIONS.MESSAGE_REACTION(messageId), { emoji })),

        markRead: (contractId: string): Promise<any> => unwrapResponse(apiClient.post(API_ENDPOINTS.DISCUSSIONS.CONTRACT_MESSAGES_READ(contractId))),
    },
};
