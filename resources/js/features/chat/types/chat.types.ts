import { Conversation, ConversationCategory, ConversationCategoryCounts } from './conversation.types';
import { ChatMessage } from './message.types';

export * from './conversation.types';
export * from './message.types';

export interface ChatState {
    conversations: Conversation[];
    selectedConversationId: string | null;
    selectedConversation: Conversation | null;
    messages: ChatMessage[];
    isLoadingConversations: boolean;
    isLoadingMessages: boolean;
    isSending: boolean;
    search: string;
    activeCategory: ConversationCategory;
    dateFrom: string;
    dateTo: string;
    showChatSearch: boolean;
    chatSearchQuery: string;
    categoryCounts: ConversationCategoryCounts;
}

export interface ChatProps {
    initialContractId?: string;
    breadcrumbs?: any[];
}
