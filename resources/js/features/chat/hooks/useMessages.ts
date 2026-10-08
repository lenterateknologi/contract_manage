import { useCallback, useEffect, useRef, useState } from 'react';
import { chatService } from '../services/chatService';
import { ChatMessage } from '../types/message.types';

export function useMessages(contractId?: string | null, searchQuery?: string) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isSending, setIsSending] = useState<boolean>(false);
    const prevContractIdRef = useRef<string | null>(null);

    const loadMessages = useCallback(
        async (isBackground = false) => {
            if (!contractId) {
                setMessages([]);
                return;
            }
            if (!isBackground) setIsLoading(true);
            try {
                const list = await chatService.fetchMessages(contractId, searchQuery);
                setMessages(list);
            } catch (err) {
                console.error('Failed to load messages for contract:', contractId, err);
            } finally {
                if (!isBackground) setIsLoading(false);
            }
        },
        [contractId, searchQuery],
    );

    // Reload when contractId or search query changes
    useEffect(() => {
        if (contractId !== prevContractIdRef.current) {
            prevContractIdRef.current = contractId || null;
            loadMessages(false);
        } else {
            loadMessages(true);
        }
    }, [contractId, loadMessages]);

    // Polling active thread every 4s
    useEffect(() => {
        if (!contractId) return;
        const interval = setInterval(() => {
            loadMessages(true);
        }, 4000);
        return () => clearInterval(interval);
    }, [contractId, loadMessages]);

    const sendMessage = useCallback(
        async (messageText: string, file?: File | null) => {
            if (!contractId || (!messageText.trim() && !file)) return;
            setIsSending(true);
            try {
                const newMsg = await chatService.sendMessage({
                    contractId,
                    message: messageText,
                    file,
                });
                setMessages((prev) => [...prev, newMsg]);
                return newMsg;
            } catch (err) {
                console.error('Failed to send message:', err);
                throw err;
            } finally {
                setIsSending(false);
            }
        },
        [contractId],
    );

    const toggleReaction = useCallback(
        async (messageId: string, emoji: string) => {
            try {
                const res = await chatService.toggleReaction(messageId, emoji);
                const reactions = res?.reactions || res?.data?.reactions;
                if (reactions) {
                    setMessages((prev) =>
                        prev.map((m) => (m.id === messageId ? { ...m, reactions } : m)),
                    );
                }
            } catch (err) {
                console.error('Failed to toggle reaction on message:', messageId, err);
            }
        },
        [],
    );

    return {
        messages,
        isLoading,
        isSending,
        sendMessage,
        toggleReaction,
        refresh: loadMessages,
    };
}
