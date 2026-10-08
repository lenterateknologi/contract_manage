import { Button } from '@/components/ui/buttons/Button';
import { ArrowDown, MessageSquare } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChatMessage } from '../../types/message.types';
import { groupMessages } from '../../utils/messageUtils';
import { MessageItem } from '../MessageItem/MessageItem';

interface MessageListProps {
    messages: ChatMessage[];
    isLoading?: boolean;
    currentUserId?: string;
    searchQuery?: string;
    onPreviewAttachment: (url: string, name: string) => void;
    onToggleReaction?: (messageId: string, emoji: string) => void;
}

export function MessageList({
    messages,
    isLoading,
    currentUserId,
    searchQuery,
    onPreviewAttachment,
    onToggleReaction,
}: MessageListProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [showScrollBottom, setShowScrollBottom] = useState(false);

    const grouped = useMemo(() => groupMessages(messages), [messages]);

    const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({
                top: scrollContainerRef.current.scrollHeight,
                behavior,
            });
        }
    };

    // Auto-scroll to bottom on messages count change
    useEffect(() => {
        scrollToBottom('auto');
    }, [messages.length]);

    const handleScroll = () => {
        if (!scrollContainerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 120;
        setShowScrollBottom(!isNearBottom);
    };

    if (isLoading && messages.length === 0) {
        return (
            <div className="flex flex-1 items-center justify-center">
                <div className="flex flex-col items-center gap-2 text-slate-400">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <span className="text-xs">Memuat pesan...</span>
                </div>
            </div>
        );
    }

    if (messages.length === 0) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                    <MessageSquare className="h-7 w-7" />
                </div>
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Belum Ada Diskusi</h4>
                <p className="mt-1 max-w-xs text-xs text-slate-400">
                    Kirim pesan pertama Anda untuk memulai koordinasi dokumen kontrak ini.
                </p>
            </div>
        );
    }

    return (
        <div className="relative flex-1 overflow-hidden">
            <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="custom-scrollbar h-full overflow-y-auto px-4 py-4 space-y-1"
            >
                {grouped.map(({ msg, isFirstInGroup, isLastInGroup, showDateSeparator, dateLabel }) => {
                    const isMe = Boolean(currentUserId && String(msg.user_id) === String(currentUserId));

                    return (
                        <React.Fragment key={msg.id}>
                            {showDateSeparator && (
                                <div className="my-4 flex items-center justify-center">
                                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-semibold text-slate-500 shadow-xs dark:bg-slate-800 dark:text-slate-400">
                                        {dateLabel}
                                    </span>
                                </div>
                            )}

                            <MessageItem
                                msg={msg}
                                isMe={isMe}
                                highlight={searchQuery}
                                onPreview={onPreviewAttachment}
                                onToggleReaction={(emoji) => onToggleReaction?.(msg.id, emoji)}
                                isFirstInGroup={isFirstInGroup}
                                isLastInGroup={isLastInGroup}
                            />
                        </React.Fragment>
                    );
                })}
            </div>

            {showScrollBottom && (
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => scrollToBottom('smooth')}
                    className="absolute right-4 bottom-4 h-8 w-8 rounded-full shadow-lg bg-white/90 backdrop-blur-xs border-slate-200 dark:bg-slate-800 dark:border-slate-700"
                >
                    <ArrowDown className="h-4 w-4" />
                </Button>
            )}
        </div>
    );
}
