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

    async fetchMessages(contractId: string, search?: string, type?: string): Promise<ChatMessage[]> {
        const res: any = await unwrapResponse(
            apiClient.get(API_ENDPOINTS.DISCUSSIONS.CONTRACT_MESSAGES(contractId), {
                params: {
                    search: search || undefined,
                    type: type || undefined,
                },
            }),
        );
        const list = Array.isArray(res) ? res : (res?.data ?? []);
        return list as ChatMessage[];
    },

    async sendMessage({ contractId, message, type, file }: SendMessagePayload): Promise<ChatMessage> {
        const fd = new FormData();
        fd.append('message', message);
        if (type) fd.append('type', type);
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

    async fetchUsers(): Promise<any[]> {
        try {
            const res: any = await unwrapResponse(
                apiClient.get(API_ENDPOINTS.CONTRACTS.USERS),
            );
            return Array.isArray(res) ? res : (res?.data ?? []);
        } catch {
            return [];
        }
    },

    async fetchContractMembers(contractId: string, type?: string): Promise<any[]> {
        try {
            const res: any = await unwrapResponse(
                apiClient.get(API_ENDPOINTS.SUBRESOURCES.MEMBERS(contractId), {
                    params: { type: type || undefined },
                }),
            );
            const list = Array.isArray(res) ? res : (res?.data ?? []);
            return list.map((item: any) => {
                const u = item.user || item;
                const roleStr = Array.isArray(item.roles) ? item.roles.join(', ') : (item.roles || u.role);
                return {
                    ...u,
                    role: roleStr || u.role,
                };
            });
        } catch {
            return [];
        }
    },

    async getMentionableUsers(contractId?: string | null, type?: string): Promise<any[]> {
        if (!contractId) return [];
        try {
            const members = await this.fetchContractMembers(contractId, type);
            const userMap = new Map<string, any>();
            members.forEach((m: any) => {
                if (m?.id && !userMap.has(String(m.id))) {
                    userMap.set(String(m.id), m);
                }
            });
            return Array.from(userMap.values());
        } catch (e) {
            console.error('Failed to load mentionable users', e);
            return [];
        }
    },
};

export default chatService;
