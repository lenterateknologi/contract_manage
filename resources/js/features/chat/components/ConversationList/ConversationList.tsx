import { SearchInput } from '@/components/ui/inputs/SearchInput';
import { cn } from '@/lib/utils';
import { Calendar, FileCheck, FileText, Layers, LayoutGrid, MessageSquare } from 'lucide-react';
import React from 'react';
import {
    Conversation,
    ConversationCategory,
    ConversationCategoryCounts,
} from '../../types/conversation.types';
import { ConversationItem } from '../ConversationItem/ConversationItem';

interface ConversationListProps {
    conversations: Conversation[];
    selectedId: string | null;
    isLoading?: boolean;
    search: string;
    onSearchChange: (val: string) => void;
    activeCategory: ConversationCategory;
    onCategoryChange: (cat: ConversationCategory) => void;
    categoryCounts: ConversationCategoryCounts;
    dateFrom: string;
    onDateFromChange: (val: string) => void;
    dateTo: string;
    onDateToChange: (val: string) => void;
    onSelectConversation: (id: string) => void;
}

const CATEGORIES: Array<{ id: ConversationCategory; label: string; icon: React.ReactNode }> = [
    { id: 'all', label: 'Semua', icon: <LayoutGrid className="h-3.5 w-3.5" /> },
    { id: 'kontrak', label: 'Kontrak', icon: <FileText className="h-3.5 w-3.5" /> },
    { id: 'non_kontrak', label: 'Non-Kontrak', icon: <FileCheck className="h-3.5 w-3.5" /> },
    { id: 'nda', label: 'NDA', icon: <Layers className="h-3.5 w-3.5" /> },
];

export function ConversationList({
    conversations,
    selectedId,
    isLoading,
    search,
    onSearchChange,
    activeCategory,
    onCategoryChange,
    categoryCounts,
    dateFrom,
    onDateFromChange,
    dateTo,
    onDateToChange,
    onSelectConversation,
}: ConversationListProps) {
    return (
        <div className="flex h-full flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            {/* Header / Search */}
            <div className="p-3 border-b border-slate-100 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-primary" />
                        <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                            Pesan Diskusi
                        </h2>
                    </div>
                    {categoryCounts.all.unread > 0 && (
                        <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
                            {categoryCounts.all.unread} Belum Dibaca
                        </span>
                    )}
                </div>

                <SearchInput
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    onClear={() => onSearchChange('')}
                    placeholder="Cari kontrak, PIC, atau isi pesan..."
                    className="h-8 text-xs bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700"
                />

                {/* Category Pills */}
                <div className="flex gap-1 overflow-x-auto pb-0.5 custom-scrollbar">
                    {CATEGORIES.map(({ id, label, icon }) => {
                        const count = categoryCounts[id];
                        const isActive = activeCategory === id;

                        return (
                            <button
                                key={id}
                                type="button"
                                onClick={() => onCategoryChange(id)}
                                className={cn(
                                    'flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap transition-all',
                                    isActive
                                        ? 'bg-primary text-primary-foreground shadow-xs'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700',
                                )}
                            >
                                {icon}
                                <span>{label}</span>
                                {count && count.total > 0 && (
                                    <span
                                        className={cn(
                                            'ml-0.5 rounded-full px-1.5 py-0.2 text-[9px]',
                                            isActive
                                                ? 'bg-white/20 text-white'
                                                : count.unread > 0
                                                  ? 'bg-rose-500 text-white font-bold'
                                                  : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
                                        )}
                                    >
                                        {count.unread > 0 ? count.unread : count.total}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Date range filter bar */}
                <div className="flex items-center gap-1.5 pt-1 text-[10px] text-slate-500">
                    <Calendar className="h-3 w-3 text-slate-400" />
                    <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => onDateFromChange(e.target.value)}
                        className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    />
                    <span>-</span>
                    <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => onDateToChange(e.target.value)}
                        className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    />
                </div>
            </div>

            {/* Conversation Items List */}
            <div className="custom-scrollbar flex-1 overflow-y-auto p-2 space-y-1">
                {isLoading && conversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 text-slate-400 gap-2">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        <span className="text-xs">Memuat daftar...</span>
                    </div>
                ) : conversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400">
                        <p className="text-xs">Tidak ada percakapan ditemukan.</p>
                    </div>
                ) : (
                    conversations.map((conv) => (
                        <ConversationItem
                            key={conv.id}
                            conversation={conv}
                            isSelected={conv.id === selectedId}
                            onSelect={onSelectConversation}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
