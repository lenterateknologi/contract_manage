import { useCallback, useEffect, useRef, useState } from 'react';
import { chatService } from '../services/chatService';
import { ChatMessage } from '../types/message.types';

// In-memory cache across switching conversations for instant zero-latency rendering
const messageCache = new Map<string, ChatMessage[]>();

export async function prefetchMessages(contractId: string) {
    if (!contractId || messageCache.has(contractId)) return;
    try {
        const list = await chatService.fetchMessages(contractId);
        messageCache.set(contractId, list);
    } catch {
        // ignore background prefetch errors
    }
}

export function useMessages(contractId?: string | null, searchQuery?: string) {
    const [messages, setMessages] = useState<ChatMessage[]>(() => {
        if (contractId && !searchQuery && messageCache.has(contractId)) {
            return messageCache.get(contractId) || [];
        }
        return [];
    });
    const [isLoading, setIsLoading] = useState<boolean>(() => {
        if (!contractId) return false;
        if (!searchQuery && messageCache.has(contractId)) return false;
        return true;
    });
    const [isSending, setIsSending] = useState<boolean>(false);
    const prevContractIdRef = useRef<string | null>(null);
    const prevSearchQueryRef = useRef<string | undefined>(undefined);

    const loadMessages = useCallback(
        async (isBackground = false) => {
            if (!contractId) {
                setMessages([]);
                setIsLoading(false);
                return;
            }

            const hasCache = !searchQuery && messageCache.has(contractId);
            if (!isBackground && !hasCache) {
                setIsLoading(true);
            }

            try {
                const list = await chatService.fetchMessages(contractId, searchQuery);
                setMessages(list);
                if (!searchQuery) {
                    messageCache.set(contractId, list);
                }
            } catch (err) {
                console.error('Failed to load messages for contract:', contractId, err);
            } finally {
                setIsLoading(false);
            }
        },
        [contractId, searchQuery],
    );

    // Initial load on mount and handle contractId/searchQuery changes
    useEffect(() => {
        const contractChanged = contractId !== prevContractIdRef.current;
        const searchChanged = searchQuery !== prevSearchQueryRef.current;

        if (contractChanged || searchChanged) {
            prevContractIdRef.current = contractId || null;
            prevSearchQueryRef.current = searchQuery;

            if (contractId) {
                const hasCache = !searchQuery && messageCache.has(contractId);
                if (hasCache) {
                    // Instant load from cache (0ms latency)
                    setMessages(messageCache.get(contractId)!);
                    setIsLoading(false);
                    // Fetch latest in background silently
                    loadMessages(true);
                } else {
                    setMessages([]);
                    setIsLoading(true);
                    loadMessages(false);
                }
            } else {
                setMessages([]);
                setIsLoading(false);
            }
        }
    }, [contractId, searchQuery, loadMessages]);

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
                setMessages((prev) => {
                    const updated = [...prev, newMsg];
                    if (!searchQuery) {
                        messageCache.set(contractId, updated);
                    }
                    return updated;
                });
                return newMsg;
            } catch (err) {
                console.error('Failed to send message:', err);
                throw err;
            } finally {
                setIsSending(false);
            }
        },
        [contractId, searchQuery],
    );

    const toggleReaction = useCallback(
        async (messageId: string, emoji: string) => {
            if (!contractId) return;
            try {
                const res = await chatService.toggleReaction(messageId, emoji);
                const reactions = res?.reactions || res?.data?.reactions;
                if (reactions) {
                    setMessages((prev) => {
                        const updated = prev.map((m) => (m.id === messageId ? { ...m, reactions } : m));
                        if (!searchQuery) {
                            messageCache.set(contractId, updated);
                        }
                        return updated;
                    });
                }
            } catch (err) {
                console.error('Failed to toggle reaction on message:', messageId, err);
            }
        },
        [contractId, searchQuery],
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
