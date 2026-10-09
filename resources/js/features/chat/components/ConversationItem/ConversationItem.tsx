import { cn } from '@/lib/utils';
import { FileText } from 'lucide-react';
import React from 'react';
import { prefetchMessages } from '../../hooks/useMessages';
import { Conversation } from '../../types/conversation.types';
import { formatMessageTime } from '../../utils/messageUtils';

interface ConversationItemProps {
    conversation: Conversation;
    isSelected: boolean;
    onSelect: (id: string) => void;
}

export function ConversationItem({ conversation, isSelected, onSelect }: ConversationItemProps) {
    const unreadCount = Number(conversation.unread_count || 0);
    const hasUnread = unreadCount > 0;
    const title = conversation.title || conversation.form_no || conversation.contract_no || 'Kontrak';
    const subTitle = conversation.contract_no || conversation.form_no || '';
    const lastMsg = conversation.last_message;
    const time = lastMsg?.created_at ? formatMessageTime(lastMsg.created_at) : '';

    return (
        <button
            type="button"
            onClick={() => onSelect(conversation.id)}
            onMouseEnter={() => prefetchMessages(conversation.id)}
            className={cn(
                'group relative flex w-full items-start gap-3 rounded-xl p-3 text-left transition-all cursor-pointer',
                isSelected
                    ? 'bg-primary/10 border-primary/20 text-slate-900 shadow-xs dark:bg-primary/20 dark:text-slate-100'
                    : 'hover:bg-slate-100/80 border-transparent text-slate-700 dark:hover:bg-slate-800/60 dark:text-slate-300',
                hasUnread && !isSelected && 'bg-slate-50/80 font-medium dark:bg-slate-800/40',
            )}
        >
            {/* Left Icon / Avatar */}
            <div
                className={cn(
                    'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors',
                    isSelected
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : hasUnread
                          ? 'bg-primary/20 text-primary'
                          : 'bg-slate-100 text-slate-500 group-hover:bg-white dark:bg-slate-800 dark:group-hover:bg-slate-700',
                )}
            >
                <FileText className="h-4 w-4" />
            </div>

            {/* Middle Content */}
            <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                    <h4
                        className={cn(
                            'truncate text-xs',
                            isSelected || hasUnread ? 'font-bold text-slate-900 dark:text-slate-100' : 'font-semibold text-slate-700 dark:text-slate-200',
                        )}
                    >
                        {title}
                    </h4>
                    {time && <span className="text-[10px] text-slate-400 shrink-0">{time}</span>}
                </div>

                {subTitle && (
                    <p className="truncate text-[10px] text-slate-400">
                        {subTitle}
                    </p>
                )}

                <div className="mt-1 flex items-center justify-between gap-2">
                    <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                        {lastMsg?.message ? (
                            <>
                                {lastMsg.user_name && <span className="font-semibold text-slate-700 dark:text-slate-300">{lastMsg.user_name}: </span>}
                                {lastMsg.message}
                            </>
                        ) : (
                            <span className="italic text-slate-400">Belum ada pesan</span>
                        )}
                    </p>

                    {/* Unread Counter Badge */}
                    {hasUnread && (
                        <span className="flex h-4 min-w-[16px] shrink-0 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground shadow-xs">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </div>
            </div>
        </button>
    );
}
