import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { chatService } from '../services/chatService';
import { Conversation, ConversationCategory, ConversationCategoryCounts } from '../types/conversation.types';
import { calculateCategoryCounts, filterConversations } from '../utils/conversationUtils';

export function useConversations(initialContractId?: string) {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [selectedId, setSelectedId] = useState<string | null>(initialContractId || null);
    const [search, setSearch] = useState<string>('');
    const [activeCategory, setActiveCategory] = useState<ConversationCategory>('all');
    const [dateFrom, setDateFrom] = useState<string>('');
    const [dateTo, setDateTo] = useState<string>('');
    const [showChatSearch, setShowChatSearch] = useState<boolean>(false);

    // Track previous initialContractId so we only sync when prop really changes externally
    const prevInitialRef = useRef<string | undefined>(initialContractId);

    // Fetch conversation list
    const fetchConversations = useCallback(async (isBackground = false) => {
        if (!isBackground) setIsLoading(true);
        try {
            const list = await chatService.fetchConversations();
            setConversations(list);
        } catch (e) {
            console.error('Failed to load conversations list', e);
        } finally {
            if (!isBackground) setIsLoading(false);
        }
    }, []);

    // Initial load
    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    // Polling every 5 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            fetchConversations(true);
        }, 5000);
        return () => clearInterval(interval);
    }, [fetchConversations]);

    // Sync selectedId ONLY when initialContractId changes externally (e.g. browser navigation)
    useEffect(() => {
        if (initialContractId !== prevInitialRef.current) {
            prevInitialRef.current = initialContractId;
            if (initialContractId) {
                setSelectedId(initialContractId);
            }
        }
    }, [initialContractId]);

    // Auto-switch category if selected contract is not in the currently selected specific category
    useEffect(() => {
        if (selectedId && activeCategory !== 'all') {
            const found = conversations.find((c) => String(c.id) === String(selectedId));
            if (found && found.parent_category && found.parent_category !== activeCategory) {
                setActiveCategory('all');
            }
        }
    }, [selectedId, conversations, activeCategory]);

    // Mark as read and synchronize URL
    useEffect(() => {
        if (selectedId) {
            chatService.markConversationAsRead(selectedId);
            setConversations((prev) =>
                prev.map((c) => (String(c.id) === String(selectedId) ? { ...c, unread_count: 0 } : c)),
            );
            const newUrl = `/admin/chat/${selectedId}`;
            if (window.location.pathname !== newUrl) {
                window.history.pushState({}, '', newUrl);
            }
        } else {
            const defaultUrl = '/admin/chat';
            if (window.location.pathname !== defaultUrl) {
                window.history.pushState({}, '', defaultUrl);
            }
        }
    }, [selectedId]);

    const categoryCounts: ConversationCategoryCounts = useMemo(
        () => calculateCategoryCounts(conversations),
        [conversations],
    );

    const filteredConversations: Conversation[] = useMemo(
        () =>
            filterConversations(conversations, {
                search,
                category: activeCategory,
                dateFrom,
                dateTo,
            }),
        [conversations, search, activeCategory, dateFrom, dateTo],
    );

    const selectedConversation = useMemo(
        () => (selectedId ? conversations.find((c) => String(c.id) === String(selectedId)) || null : null),
        [conversations, selectedId],
    );

    const selectConversation = useCallback((id: string | null) => {
        setSelectedId(id);
    }, []);

    const resetFilters = useCallback(() => {
        setSearch('');
        setDateFrom('');
        setDateTo('');
        setActiveCategory('all');
    }, []);

    return {
        conversations: filteredConversations,
        rawConversations: conversations,
        selectedId,
        selectedConversation,
        isLoading,
        search,
        setSearch,
        activeCategory,
        setActiveCategory,
        dateFrom,
        setDateFrom,
        dateTo,
        setDateTo,
        showChatSearch,
        setShowChatSearch,
        categoryCounts,
        selectConversation,
        resetFilters,
        refresh: fetchConversations,
    };
}
