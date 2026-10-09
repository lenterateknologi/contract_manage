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

export interface DateGroupedConversations {
    label: string;
    conversations: Conversation[];
}

export function groupConversationsByDate(conversations: Conversation[]): DateGroupedConversations[] {
    if (!conversations || conversations.length === 0) return [];

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterday = today - 86400000;
    const last7Days = today - 7 * 86400000;
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    const groupsMap: Record<string, Conversation[]> = {
        'Hari Ini': [],
        'Kemarin': [],
        'Minggu Ini': [],
        'Bulan Ini': [],
        'Lebih Lama': [],
    };

    conversations.forEach((conv) => {
        const rawDate = conv.last_message?.created_at || conv.updated_at || conv.created_at;
        if (!rawDate) {
            groupsMap['Lebih Lama'].push(conv);
            return;
        }

        const dateObj = new Date(rawDate);
        const time = isNaN(dateObj.getTime()) ? 0 : dateObj.getTime();

        if (time >= today) {
            groupsMap['Hari Ini'].push(conv);
        } else if (time >= yesterday) {
            groupsMap['Kemarin'].push(conv);
        } else if (time >= last7Days) {
            groupsMap['Minggu Ini'].push(conv);
        } else if (time >= thisMonth) {
            groupsMap['Bulan Ini'].push(conv);
        } else {
            groupsMap['Lebih Lama'].push(conv);
        }
    });

    const result: DateGroupedConversations[] = [];
    ['Hari Ini', 'Kemarin', 'Minggu Ini', 'Bulan Ini', 'Lebih Lama'].forEach((label) => {
        if (groupsMap[label] && groupsMap[label].length > 0) {
            result.push({
                label,
                conversations: groupsMap[label],
            });
        }
    });

    return result;
}
