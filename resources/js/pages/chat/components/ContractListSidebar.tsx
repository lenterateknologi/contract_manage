import { SearchInput } from '@/components/ui/inputs/SearchInput';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/selection/Select';
import { Contract } from '@/pages/contracts/types';
import { Calendar, FileCheck, FileText, Layers, LayoutGrid, MessageSquare } from 'lucide-react';
import { ContractListItem } from '../ui/ContractListItem';

interface ContractListSidebarProps {
    search: string;
    setSearch: (val: string) => void;
    activeCategory: 'all' | 'kontrak' | 'non_kontrak' | 'nda';
    setActiveCategory: (cat: 'all' | 'kontrak' | 'non_kontrak' | 'nda') => void;
    categoryCounts: {
        all: { total: number; unread: number };
        kontrak: { total: number; unread: number };
        non_kontrak: { total: number; unread: number };
        nda: { total: number; unread: number };
    };
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
    activeCategory,
    setActiveCategory,
    categoryCounts,
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
        <div className="border-border bg-background flex h-full w-full shrink-0 flex-col overflow-hidden border-r md:w-80 lg:w-96">
            {/* Sidebar Header, Dropdown & Search */}
            <div className="border-border bg-muted/20 flex flex-col gap-2.5 border-b p-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <MessageSquare size={16} className="text-primary" />
                        <span className="text-foreground text-xs font-bold tracking-wider uppercase">Percakapan Dokumen</span>
                    </div>

                    <button
                        type="button"
                        onClick={() => setShowChatSearch(!showChatSearch)}
                        className={`cursor-pointer rounded-lg border p-1.5 text-xs transition-all ${
                            showChatSearch || hasActiveFilters
                                ? 'bg-primary/10 border-primary/30 text-primary font-bold'
                                : 'bg-background hover:bg-muted border-border text-muted-foreground'
                        }`}
                        title="Filter Tanggal"
                    >
                        <Calendar size={13} />
                    </button>
                </div>

                {/* Category Dropdown (Semua / Kontrak / Non Kontrak / NDA) */}
                <div className="w-full">
                    <Select value={activeCategory} onValueChange={(val: any) => setActiveCategory(val)}>
                        <SelectTrigger className="bg-background border-border focus:ring-primary h-8.5 rounded-xl px-3 text-xs font-medium focus:ring-1">
                            <SelectValue placeholder="Pilih Kategori Dokumen" />
                        </SelectTrigger>
                        <SelectContent className="border-border bg-popover rounded-xl text-xs shadow-lg">
                            <SelectItem value="all">
                                <div className="flex w-full items-center justify-between gap-4 py-0.5">
                                    <div className="flex items-center gap-2">
                                        <LayoutGrid size={13} className="text-muted-foreground" />
                                        <span className="text-xs font-semibold">Semua Pengajuan</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="py-0.2 bg-muted text-muted-foreground rounded-full px-1.5 text-[10px] font-bold tabular-nums">
                                            {categoryCounts.all.total}
                                        </span>
                                        {categoryCounts.all.unread > 0 && (
                                            <span
                                                className="h-2 w-2 rounded-full bg-rose-500"
                                                title={`${categoryCounts.all.unread} pesan belum dibaca`}
                                            />
                                        )}
                                    </div>
                                </div>
                            </SelectItem>
                            <SelectItem value="kontrak">
                                <div className="flex w-full items-center justify-between gap-4 py-0.5">
                                    <div className="flex items-center gap-2">
                                        <FileText size={13} className="text-primary" />
                                        <span className="text-xs font-semibold">Kontrak</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="py-0.2 bg-muted text-muted-foreground rounded-full px-1.5 text-[10px] font-bold tabular-nums">
                                            {categoryCounts.kontrak.total}
                                        </span>
                                        {categoryCounts.kontrak.unread > 0 && (
                                            <span
                                                className="h-2 w-2 rounded-full bg-rose-500"
                                                title={`${categoryCounts.kontrak.unread} pesan belum dibaca`}
                                            />
                                        )}
                                    </div>
                                </div>
                            </SelectItem>
                            <SelectItem value="non_kontrak">
                                <div className="flex w-full items-center justify-between gap-4 py-0.5">
                                    <div className="flex items-center gap-2">
                                        <Layers size={13} className="text-primary" />
                                        <span className="text-xs font-semibold">Non Kontrak</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="py-0.2 bg-muted text-muted-foreground rounded-full px-1.5 text-[10px] font-bold tabular-nums">
                                            {categoryCounts.non_kontrak.total}
                                        </span>
                                        {categoryCounts.non_kontrak.unread > 0 && (
                                            <span
                                                className="h-2 w-2 rounded-full bg-rose-500"
                                                title={`${categoryCounts.non_kontrak.unread} pesan belum dibaca`}
                                            />
                                        )}
                                    </div>
                                </div>
                            </SelectItem>
                            <SelectItem value="nda">
                                <div className="flex w-full items-center justify-between gap-4 py-0.5">
                                    <div className="flex items-center gap-2">
                                        <FileCheck size={13} className="text-primary" />
                                        <span className="text-xs font-semibold">NDA</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="py-0.2 bg-muted text-muted-foreground rounded-full px-1.5 text-[10px] font-bold tabular-nums">
                                            {categoryCounts.nda.total}
                                        </span>
                                        {categoryCounts.nda.unread > 0 && (
                                            <span
                                                className="h-2 w-2 rounded-full bg-rose-500"
                                                title={`${categoryCounts.nda.unread} pesan belum dibaca`}
                                            />
                                        )}
                                    </div>
                                </div>
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <SearchInput
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cari no. kontrak, judul..."
                    className="bg-background h-8.5 text-xs"
                />

                {/* Date Filter Collapsible Box */}
                {showChatSearch && (
                    <div className="border-border bg-background animate-in fade-in space-y-2 rounded-xl border p-2.5 text-xs duration-150">
                        <div className="border-border/40 flex items-center justify-between border-b pb-1">
                            <span className="text-muted-foreground text-[10px] font-bold uppercase">Filter Tanggal</span>
                            {hasActiveFilters && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setDateFrom('');
                                        setDateTo('');
                                    }}
                                    className="cursor-pointer text-[10px] text-rose-500 hover:underline"
                                >
                                    Reset
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-muted-foreground mb-0.5 block text-[9.5px]">Dari</label>
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    className="border-border bg-muted/40 text-foreground w-full rounded-lg border px-2 py-1 text-xs focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-muted-foreground mb-0.5 block text-[9.5px]">Sampai</label>
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    className="border-border bg-muted/40 text-foreground w-full rounded-lg border px-2 py-1 text-xs focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Contract List */}
            <div className="flex-1 space-y-4 overflow-y-auto p-2">
                {Object.keys(groupedContracts).length === 0 ? (
                    <div className="text-muted-foreground py-12 text-center text-xs">Tidak ada dokumen percakapan ditemukan.</div>
                ) : (
                    Object.entries(groupedContracts).map(([dateLabel, items]) => (
                        <div key={dateLabel} className="space-y-1">
                            <div className="text-muted-foreground/70 px-2 py-1 text-[10px] font-bold tracking-wider uppercase">{dateLabel}</div>
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
