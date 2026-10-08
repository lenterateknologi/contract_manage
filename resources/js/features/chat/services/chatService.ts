import { discussionsApi } from '@/api';
import { contractApi } from '@/features/Contracts/utils';
import { Conversation } from '../types/conversation.types';
import { ChatMessage, SendMessagePayload } from '../types/message.types';

export const chatService = {
    async fetchConversations(): Promise<Conversation[]> {
        const res: any = await contractApi.discussions.list({
            page: 1,
            per_page: 100,
        });
        const list = Array.isArray(res) ? res : (res?.data ?? []);
        return list as Conversation[];
    },

    async fetchMessages(contractId: string, search?: string): Promise<ChatMessage[]> {
        const res: any = await contractApi.messages.list(contractId, {
            search: search || undefined,
        });
        const list = Array.isArray(res) ? res : (res?.data ?? []);
        return list as ChatMessage[];
    },

    async sendMessage({ contractId, message, file }: SendMessagePayload): Promise<ChatMessage> {
        const res: any = await discussionsApi.messages.send(contractId, message, file || undefined);
        return (res?.data || res) as ChatMessage;
    },

    async toggleReaction(messageId: string, emoji: string): Promise<any> {
        return discussionsApi.messages.react(messageId, emoji);
    },

    async markConversationAsRead(contractId: string): Promise<void> {
        await contractApi.messages.markRead(contractId).catch(console.error);
    },
};
