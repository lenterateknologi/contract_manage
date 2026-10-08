import { StatusBadge } from '@/components/ui';
import { Button } from '@/components/ui/buttons/Button';
import { ChevronLeft, RefreshCw, Search, X } from 'lucide-react';
import React from 'react';
import { Conversation } from '../../types/conversation.types';

interface ChatHeaderProps {
    conversation: Conversation;
    isSearchingInThread?: boolean;
    threadSearchQuery?: string;
    onToggleSearchInThread?: () => void;
    onThreadSearchQueryChange?: (q: string) => void;
    onRefresh?: () => void;
    onBack?: () => void;
}

export function ChatHeader({
    conversation,
    isSearchingInThread,
    threadSearchQuery = '',
    onToggleSearchInThread,
    onThreadSearchQueryChange,
    onRefresh,
    onBack,
}: ChatHeaderProps) {
    const title = conversation.title || conversation.form_no || conversation.contract_no || 'Detail Percakapan';
    const subTitle = conversation.contract_no || conversation.form_no || '';
    const status = conversation.status || 'draft';

    return (
        <div className="flex flex-col border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-2xs">
            <div className="flex h-14 items-center justify-between px-4">
                <div className="flex items-center gap-3 min-w-0">
                    {onBack && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onBack}
                            className="h-8 w-8 md:hidden text-slate-500"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                    )}

                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <h3 className="truncate text-xs font-bold text-slate-900 dark:text-slate-100 max-w-[280px] sm:max-w-md">
                                {title}
                            </h3>
                            <StatusBadge status={status} className="scale-90 origin-left" />
                        </div>
                        {subTitle && (
                            <p className="truncate text-[10px] font-medium text-slate-400">
                                {subTitle}
                                {conversation.assigned_pic_name && ` • PIC: ${conversation.assigned_pic_name}`}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onToggleSearchInThread}
                        className="h-8 w-8 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                        title="Cari dalam pesan"
                    >
                        <Search className="h-4 w-4" />
                    </Button>

                    {onRefresh && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onRefresh}
                            className="h-8 w-8 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                            title="Segarkan Pesan"
                        >
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            {/* In-thread search box */}
            {isSearchingInThread && (
                <div className="flex items-center gap-2 border-t border-slate-100 bg-slate-50 px-4 py-2 dark:border-slate-800 dark:bg-slate-800/50">
                    <Search className="h-3.5 w-3.5 text-slate-400" />
                    <input
                        type="text"
                        value={threadSearchQuery}
                        onChange={(e) => onThreadSearchQueryChange?.(e.target.value)}
                        placeholder="Cari teks dalam pesan..."
                        className="flex-1 bg-transparent text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none dark:text-slate-200"
                        autoFocus
                    />
                    {threadSearchQuery && (
                        <button
                            type="button"
                            onClick={() => onThreadSearchQueryChange?.('')}
                            className="rounded p-1 text-slate-400 hover:text-slate-600"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
