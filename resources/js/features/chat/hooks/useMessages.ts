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

export function useMessages(contractId?: string | null, searchQuery?: string, type?: string) {
    const cacheKey = contractId ? `${contractId}_${type || 'all'}` : '';

    const [messages, setMessages] = useState<ChatMessage[]>(() => {
        if (cacheKey && !searchQuery && messageCache.has(cacheKey)) {
            return messageCache.get(cacheKey) || [];
        }
        return [];
    });
    const [isLoading, setIsLoading] = useState<boolean>(() => {
        if (!contractId) return false;
        if (!searchQuery && cacheKey && messageCache.has(cacheKey)) return false;
        return true;
    });
    const [isSending, setIsSending] = useState<boolean>(false);
    const prevContractIdRef = useRef<string | null>(null);
    const prevSearchQueryRef = useRef<string | undefined>(undefined);
    const prevTypeRef = useRef<string | undefined>(undefined);

    const loadMessages = useCallback(
        async (isBackground = false) => {
            if (!contractId) {
                setMessages([]);
                setIsLoading(false);
                return;
            }

            const currentCacheKey = `${contractId}_${type || 'all'}`;
            const hasCache = !searchQuery && messageCache.has(currentCacheKey);
            if (!isBackground && !hasCache) {
                setIsLoading(true);
            }

            try {
                const list = await chatService.fetchMessages(contractId, searchQuery, type);
                setMessages(list);
                if (!searchQuery) {
                    messageCache.set(currentCacheKey, list);
                }
            } catch (err) {
                console.error('Failed to load messages for contract:', contractId, err);
            } finally {
                setIsLoading(false);
            }
        },
        [contractId, searchQuery, type],
    );

    // Initial load on mount and handle contractId/searchQuery/type changes
    useEffect(() => {
        const contractChanged = contractId !== prevContractIdRef.current;
        const searchChanged = searchQuery !== prevSearchQueryRef.current;
        const typeChanged = type !== prevTypeRef.current;

        if (contractChanged || searchChanged || typeChanged) {
            prevContractIdRef.current = contractId || null;
            prevSearchQueryRef.current = searchQuery;
            prevTypeRef.current = type;

            if (contractId) {
                const currentCacheKey = `${contractId}_${type || 'all'}`;
                const hasCache = !searchQuery && messageCache.has(currentCacheKey);
                if (hasCache) {
                    // Instant load from cache (0ms latency)
                    setMessages(messageCache.get(currentCacheKey)!);
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
    }, [contractId, searchQuery, type, loadMessages]);

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
                    type,
                    file,
                });
                setMessages((prev) => {
                    const updated = [...prev, newMsg];
                    if (!searchQuery) {
                        const currentCacheKey = `${contractId}_${type || 'all'}`;
                        messageCache.set(currentCacheKey, updated);
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
        [contractId, searchQuery, type],
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
