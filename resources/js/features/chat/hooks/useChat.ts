import { useEffect, useState } from 'react';
import { chatService } from '../services/chatService';
import { useConversations } from './useConversations';
import { useMessages } from './useMessages';

export function useChat(initialContractId?: string) {
    const [threadSearchQuery, setThreadSearchQuery] = useState<string>('');
    const [isSearchingInThread, setIsSearchingInThread] = useState<boolean>(false);
    const [mentionUsers, setMentionUsers] = useState<any[]>([]);

    const conversationsState = useConversations(initialContractId);
    const messagesState = useMessages(
        conversationsState.selectedId,
        isSearchingInThread ? threadSearchQuery : undefined,
    );

    // Fetch mentionable users (contract members + system users) when selected contract changes
    useEffect(() => {
        let isMounted = true;
        chatService.getMentionableUsers(conversationsState.selectedId).then((users) => {
            if (isMounted) {
                setMentionUsers(users);
            }
        });
        return () => {
            isMounted = false;
        };
    }, [conversationsState.selectedId]);

    return {
        ...conversationsState,
        ...messagesState,
        mentionUsers,
        threadSearchQuery,
        setThreadSearchQuery,
        isSearchingInThread,
        setIsSearchingInThread,
    };
}
