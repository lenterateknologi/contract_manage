import React from 'react';
import { Building2, Calendar, MessageSquare, Search, X } from 'lucide-react';
import { SearchInput } from '@/components/ui/inputs/SearchInput';
import { Contract } from '@/pages/contracts/types';
import { ContractListItem } from '../ui/ContractListItem';

interface ContractListSidebarProps {
    search: string;
    setSearch: (val: string) => void;
    showChatSearch: boolean;
    setShowChatSearch: (val: boolean) => void;
    dateFrom: string;
    setDateFrom: (val: string) => void;
    dateTo: string;
    setDateTo: (val: string) => void;
    groupedContracts: Record<string, Contract[]>;
    selectedContractId: string | null;
    onSelectContract: (contractId: string) => void;
}

export function ContractListSidebar({
    search,
    setSearch,
    showChatSearch,
    setShowChatSearch,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    groupedContracts,
    selectedContractId,
    onSelectContract,
}: ContractListSidebarProps) {
    const hasActiveFilters = Boolean(dateFrom || dateTo);

    return (
        <div className="w-full md:w-80 lg:w-96 flex flex-col border-r border-border bg-background shrink-0 h-full overflow-hidden">
            {/* Sidebar Header & Search */}
            <div className="p-3 border-b border-border flex flex-col gap-2.5 bg-muted/20">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <MessageSquare size={16} className="text-primary" />
                        <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                            Percakapan Dokumen
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={() => setShowChatSearch(!showChatSearch)}
                        className={`p-1.5 rounded-lg border text-xs transition-all cursor-pointer ${
                            showChatSearch || hasActiveFilters
                                ? 'bg-primary/10 border-primary/30 text-primary font-bold'
                                : 'bg-background hover:bg-muted border-border text-muted-foreground'
                        }`}
                        title="Filter Tanggal"
                    >
                        <Calendar size={13} />
                    </button>
                </div>

                <SearchInput
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cari no. kontrak, judul..."
                    className="h-8.5 text-xs bg-background"
                />

                {/* Date Filter Collapsible Box */}
                {showChatSearch && (
                    <div className="p-2.5 rounded-xl border border-border bg-background space-y-2 text-xs animate-in fade-in duration-150">
                        <div className="flex items-center justify-between pb-1 border-b border-border/40">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">Filter Tanggal</span>
                            {hasActiveFilters && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setDateFrom('');
                                        setDateTo('');
                                    }}
                                    className="text-[10px] text-rose-500 hover:underline cursor-pointer"
                                >
                                    Reset
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-[9.5px] text-muted-foreground block mb-0.5">Dari</label>
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    className="w-full text-xs px-2 py-1 rounded-lg border border-border bg-muted/40 text-foreground focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-[9.5px] text-muted-foreground block mb-0.5">Sampai</label>
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    className="w-full text-xs px-2 py-1 rounded-lg border border-border bg-muted/40 text-foreground focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Contract List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-4">
                {Object.keys(groupedContracts).length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground text-xs">
                        Tidak ada dokumen percakapan ditemukan.
                    </div>
                ) : (
                    Object.entries(groupedContracts).map(([dateLabel, items]) => (
                        <div key={dateLabel} className="space-y-1">
                            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                                {dateLabel}
                            </div>
                            <div className="space-y-1">
                                {items.map((c) => (
                                    <ContractListItem
                                        key={c.id}
                                        contract={c}
                                        isSelected={c.id === selectedContractId}
                                        onClick={() => onSelectContract(c.id)}
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
