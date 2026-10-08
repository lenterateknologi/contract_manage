import { Conversation, ConversationCategoryCounts, ConversationFilterParams } from '../types/conversation.types';

export function calculateCategoryCounts(conversations: Conversation[]): ConversationCategoryCounts {
    const counts: ConversationCategoryCounts = {
        all: { total: conversations.length, unread: 0 },
        kontrak: { total: 0, unread: 0 },
        non_kontrak: { total: 0, unread: 0 },
        nda: { total: 0, unread: 0 },
    };

    conversations.forEach((c) => {
        const unread = Number(c.unread_count || 0);
        if (unread > 0) {
            counts.all.unread += unread;
        }

        const cat = (c.parent_category as keyof ConversationCategoryCounts) || 'kontrak';
        if (counts[cat]) {
            counts[cat].total += 1;
            if (unread > 0) {
                counts[cat].unread += unread;
            }
        }
    });

    return counts;
}

export function filterConversations(
    conversations: Conversation[],
    filters: ConversationFilterParams,
): Conversation[] {
    const { search = '', category = 'all', dateFrom, dateTo } = filters;
    const lowerSearch = search.toLowerCase().trim();

    return conversations.filter((c) => {
        // Category Filter
        if (category !== 'all') {
            const cat = c.parent_category || 'kontrak';
            if (cat !== category) return false;
        }

        // Search Filter
        if (lowerSearch) {
            const titleMatch = (c.title || '').toLowerCase().includes(lowerSearch);
            const formNoMatch = (c.form_no || '').toLowerCase().includes(lowerSearch);
            const contractNoMatch = (c.contract_no || '').toLowerCase().includes(lowerSearch);
            const lastMsgMatch = (c.last_message?.message || '').toLowerCase().includes(lowerSearch);
            const picMatch = (c.assigned_pic_name || '').toLowerCase().includes(lowerSearch);
            if (!titleMatch && !formNoMatch && !contractNoMatch && !lastMsgMatch && !picMatch) {
                return false;
            }
        }

        // Date Range Filter
        if (dateFrom || dateTo) {
            const rawDate = c.updated_at || c.created_at || '';
            const cDate = rawDate ? new Date(rawDate).getTime() : 0;
            if (dateFrom) {
                const fromTime = new Date(`${dateFrom}T00:00:00`).getTime();
                if (cDate < fromTime) return false;
            }
            if (dateTo) {
                const toTime = new Date(`${dateTo}T23:59:59`).getTime();
                if (cDate > toTime) return false;
            }
        }

        return true;
    });
}
