export interface RealtimeSubscriptionOptions {
    onNewMessage?: (data: any) => void;
    onReactionUpdated?: (data: any) => void;
    onUserTyping?: (user: any) => void;
}

export const chatRealtimeService = {
    subscribeToContractChat(contractId: string, options: RealtimeSubscriptionOptions): () => void {
        const echo = (window as any).Echo;
        if (!echo || !contractId) return () => {};

        const channelName = `contract.${contractId}`;
        const channel = echo.private(channelName);

        if (options.onNewMessage) {
            channel.listen('.message.created', options.onNewMessage);
        }
        if (options.onReactionUpdated) {
            channel.listen('.message.reaction', options.onReactionUpdated);
        }
        if (options.onUserTyping) {
            channel.listenForWhisper('typing', options.onUserTyping);
        }

        return () => {
            echo.leave(channelName);
        };
    },

    whisperTyping(contractId: string, user: { id: string; name: string }): void {
        const echo = (window as any).Echo;
        if (!echo || !contractId) return;
        echo.private(`contract.${contractId}`).whisper('typing', user);
    },
};
