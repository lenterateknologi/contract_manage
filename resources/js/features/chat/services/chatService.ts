import { apiClient, unwrapResponse } from '@/api/client';
import { API_ENDPOINTS } from '@/api/endpoints';
import { Conversation } from '../types/conversation.types';
import { ChatMessage, SendMessagePayload } from '../types/message.types';

export const chatService = {
    async fetchConversations(): Promise<Conversation[]> {
        const res: any = await unwrapResponse(
            apiClient.get(API_ENDPOINTS.DISCUSSIONS.BASE, {
                params: { page: 1, per_page: 100 },
            }),
        );
        const list = Array.isArray(res) ? res : (res?.data ?? []);
        return list as Conversation[];
    },

    async fetchMessages(contractId: string, search?: string): Promise<ChatMessage[]> {
        const res: any = await unwrapResponse(
            apiClient.get(API_ENDPOINTS.DISCUSSIONS.CONTRACT_MESSAGES(contractId), {
                params: { search: search || undefined },
            }),
        );
        const list = Array.isArray(res) ? res : (res?.data ?? []);
        return list as ChatMessage[];
    },

    async sendMessage({ contractId, message, file }: SendMessagePayload): Promise<ChatMessage> {
        const fd = new FormData();
        fd.append('message', message);
        if (file) fd.append('attachment', file);
        const res: any = await unwrapResponse(
            apiClient.post(API_ENDPOINTS.DISCUSSIONS.CONTRACT_MESSAGES(contractId), fd),
        );
        return (res?.data || res) as ChatMessage;
    },

    async toggleReaction(messageId: string, emoji: string): Promise<any> {
        return unwrapResponse(
            apiClient.post(API_ENDPOINTS.DISCUSSIONS.MESSAGE_REACTION(messageId), { emoji }),
        );
    },

    async markConversationAsRead(contractId: string): Promise<void> {
        await unwrapResponse(
            apiClient.post(API_ENDPOINTS.DISCUSSIONS.CONTRACT_MESSAGES_READ(contractId)),
        ).catch(console.error);
    },
};

export default chatService;
