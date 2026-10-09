import { Button } from '@/components/ui/buttons/Button';
import { SearchInput } from '@/components/ui/inputs/SearchInput';
import { cn } from '@/lib/utils';
import { MessageSquare, Search, X } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import {
    Conversation,
    ConversationCategory,
    ConversationCategoryCounts,
} from '../../types/conversation.types';
import { groupConversationsByDate } from '../../utils/conversationUtils';
import { ConversationItem } from '../ConversationItem/ConversationItem';

interface ConversationListProps {
    conversations: Conversation[];
    selectedId: string | null;
    isLoading?: boolean;
    search: string;
    onSearchChange: (val: string) => void;
    activeCategory?: ConversationCategory;
    onCategoryChange?: (cat: ConversationCategory) => void;
    categoryCounts?: ConversationCategoryCounts;
    dateFrom?: string;
    onDateFromChange?: (val: string) => void;
    dateTo?: string;
    onDateToChange?: (val: string) => void;
    onSelectConversation: (id: string) => void;
}

export function ConversationList({
    conversations,
    selectedId,
    isLoading,
    search,
    onSearchChange,
    categoryCounts,
    onSelectConversation,
}: ConversationListProps) {
    const [isSearchOpen, setIsSearchOpen] = useState(Boolean(search));

    const groupedConversations = useMemo(
        () => groupConversationsByDate(conversations),
        [conversations],
    );

    const handleToggleSearch = () => {
        if (isSearchOpen && search) {
            onSearchChange('');
        }
        setIsSearchOpen((prev) => !prev);
    };

    return (
        <div className="flex h-full flex-col bg-card">
            {/* Header */}
            <div className="flex flex-col border-b border-border bg-card">
                <div className="flex h-14 items-center justify-between px-3.5">
                    <div className="flex items-center gap-2 min-w-0">
                        <MessageSquare className="h-4 w-4 text-primary shrink-0" />
                        <h2 className="text-xs font-bold text-foreground uppercase tracking-wider truncate">
                            Pesan Diskusi
                        </h2>
                        {categoryCounts && categoryCounts.all && categoryCounts.all.unread > 0 && (
                            <span className="rounded-full bg-rose-500/10 px-1.5 py-0.5 text-[9.5px] font-bold text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 shrink-0">
                                {categoryCounts.all.unread}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleToggleSearch}
                            className={cn(
                                'h-8 w-8 text-muted-foreground hover:text-foreground transition-colors cursor-pointer',
                                (isSearchOpen || search) && 'bg-muted text-foreground',
                            )}
                            title={isSearchOpen ? 'Tutup Pencarian' : 'Cari Percakapan'}
                        >
                            {isSearchOpen ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>

                {/* Collapsible Search Input */}
                {isSearchOpen && (
                    <div className="animate-in fade-in slide-in-from-top-1 px-3 pb-2.5 duration-150">
                        <SearchInput
                            value={search}
                            onChange={(e) => onSearchChange(e.target.value)}
                            onClear={() => onSearchChange('')}
                            placeholder="Cari kontrak, PIC, atau isi pesan..."
                            className="h-8 text-xs bg-muted/50 border-border"
                            autoFocus
                        />
                    </div>
                )}
            </div>

            {/* Conversation Items List */}
            <div className="custom-scrollbar flex-1 overflow-y-auto p-2 space-y-3">
                {isLoading && conversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 text-muted-foreground gap-2">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        <span className="text-xs">Memuat daftar...</span>
                    </div>
                ) : conversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                        <p className="text-xs">Tidak ada percakapan ditemukan.</p>
                    </div>
                ) : (
                    groupedConversations.map((group) => (
                        <div key={group.label} className="space-y-1">
                            <div className="px-2 pt-1 pb-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                                {group.label}
                            </div>
                            <div className="space-y-1">
                                {group.conversations.map((conv) => (
                                    <ConversationItem
                                        key={conv.id}
                                        conversation={conv}
                                        isSelected={String(conv.id) === String(selectedId)}
                                        onSelect={onSelectConversation}
                                    />
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default ConversationList;
