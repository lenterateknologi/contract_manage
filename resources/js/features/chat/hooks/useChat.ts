import { useState } from 'react';
import { useConversations } from './useConversations';
import { useMessages } from './useMessages';

export function useChat(initialContractId?: string) {
    const [threadSearchQuery, setThreadSearchQuery] = useState<string>('');
    const [isSearchingInThread, setIsSearchingInThread] = useState<boolean>(false);

    const conversationsState = useConversations(initialContractId);
    const messagesState = useMessages(
        conversationsState.selectedId,
        isSearchingInThread ? threadSearchQuery : undefined,
    );

    return {
        ...conversationsState,
        ...messagesState,
        threadSearchQuery,
        setThreadSearchQuery,
        isSearchingInThread,
        setIsSearchingInThread,
    };
}
