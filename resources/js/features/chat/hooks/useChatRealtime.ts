import { useEffect } from 'react';
import { chatRealtimeService, RealtimeSubscriptionOptions } from '../services/chatRealtimeService';

export function useChatRealtime(contractId?: string | null, options?: RealtimeSubscriptionOptions) {
    useEffect(() => {
        if (!contractId || !options) return;
        const unsubscribe = chatRealtimeService.subscribeToContractChat(contractId, options);
        return () => {
            unsubscribe();
        };
    }, [contractId, options]);

    const whisperTyping = (user: { id: string; name: string }) => {
        if (!contractId) return;
        chatRealtimeService.whisperTyping(contractId, user);
    };

    return {
        whisperTyping,
    };
}
