import { ChatMessage, MessageReactionItem } from '../types/message.types';

export function getAttachmentExtension(path?: string | null): string {
    if (!path) return '';
    const parts = path.split('.');
    return parts.length > 1 ? (parts.pop()?.toLowerCase() ?? '') : '';
}

export function isImageAttachment(path?: string | null): boolean {
    const ext = getAttachmentExtension(path);
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext);
}

export function isPdfAttachment(path?: string | null): boolean {
    const ext = getAttachmentExtension(path);
    return ext === 'pdf';
}

export function normalizeAttachmentUrl(urlOrPath?: string | null): string {
    if (!urlOrPath) return '';
    if (urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://') || urlOrPath.startsWith('/')) {
        return urlOrPath;
    }
    return `/storage/${urlOrPath}`;
}

export function formatMessageTime(createdAt: string): string {
    if (!createdAt) return '';
    const parts = createdAt.split(' ');
    if (parts.length > 1) {
        return parts[1].substring(0, 5);
    }
    const date = new Date(createdAt);
    if (!isNaN(date.getTime())) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return createdAt;
}

export function computeReactionCounts(
    reactions?: MessageReactionItem[] | Record<string, string[]> | null,
): Record<string, number> {
    const counts: Record<string, number> = {};
    if (!reactions) return counts;

    if (Array.isArray(reactions)) {
        reactions.forEach((r) => {
            if (r && r.emoji) {
                counts[r.emoji] = (counts[r.emoji] || 0) + 1;
            }
        });
    } else if (typeof reactions === 'object') {
        Object.entries(reactions).forEach(([emoji, userIds]) => {
            if (Array.isArray(userIds)) {
                counts[emoji] = userIds.length;
            }
        });
    }

    return counts;
}

export interface GroupedMessageItem {
    msg: ChatMessage;
    isFirstInGroup: boolean;
    isLastInGroup: boolean;
    showDateSeparator?: boolean;
    dateLabel?: string;
}

export function groupMessages(messages: ChatMessage[]): GroupedMessageItem[] {
    return messages.map((msg, index) => {
        const prevMsg = messages[index - 1];
        const nextMsg = messages[index + 1];

        const isSameUserAsPrev = prevMsg && String(prevMsg.user_id) === String(msg.user_id);
        const isSameUserAsNext = nextMsg && String(nextMsg.user_id) === String(msg.user_id);

        const isFirstInGroup = !isSameUserAsPrev;
        const isLastInGroup = !isSameUserAsNext;

        // Check date change
        let showDateSeparator = false;
        let dateLabel = '';
        if (msg.created_at) {
            const currentDate = msg.created_at.split(' ')[0];
            const prevDate = prevMsg?.created_at?.split(' ')[0];
            if (currentDate !== prevDate) {
                showDateSeparator = true;
                dateLabel = currentDate;
            }
        }

        return {
            msg,
            isFirstInGroup,
            isLastInGroup,
            showDateSeparator,
            dateLabel,
        };
    });
}
