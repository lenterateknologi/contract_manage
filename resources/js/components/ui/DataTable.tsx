import React, { useState, useMemo } from 'react';
import {
    ChevronDown, ChevronUp, ChevronsUpDown,
    Filter,
    RefreshCcw, ChevronLeft, ChevronRight,
    Loader2, Inbox
} from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';
import { Checkbox } from './checkbox';
import { FilterSheet } from './FilterSheet';
import { SearchInput } from './search-input';

/**
 * DataTable Standard Component
 * ----------------------------
 * Komponen ini adalah standar tunggal untuk semua tabel di dalam proyek.
 * Dilarang membuat implementasi tabel baru secara manual.
 * Gunakan props yang tersedia untuk kustomisasi.
 */
export interface Column<T> {
    header: string;
    accessorKey: keyof T | string;
    cell?: (row: T) => React.ReactNode;
    sortable?: boolean;
    className?: string;
    thClassName?: string;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    loading?: boolean;
    onRefresh?: () => void;
    searchPlaceholder?: string;
    searchKey?: string;
    filters?: {
        label: string;
        key: string;
        type?: 'grid' | 'searchable' | 'date-range';
        options?: { label: string; value: any }[];
    }[];
    rowActions?: (row: T) => React.ReactNode;
    bulkActions?: ((selectedRows: T[]) => React.ReactNode) | {
        label: string;
        icon: any;
        onClick: (ids: (string | number)[], rows: T[]) => void;
        variant?: 'default' | 'destructive' | 'outline' | 'ghost' | 'link';
    }[];
    pagination?: {
        currentPage: number;
        lastPage: number;
        total: number;
        from: number;
        to: number;
        onPageChange: (page: number) => void;
        perPage: number;
        onPerPageChange: (perPage: number) => void;
    };
    onRowClick?: (row: T) => void;
    selectedRowId?: string | number;
    getRowId?: (row: T) => string | number;
    renderExpandedRow?: (row: T) => React.ReactNode;
    isRowExpanded?: (row: T) => boolean;
    headerActions?: React.ReactNode;
    title?: React.ReactNode;

    // Controlled Search/Filter
    searchValue?: string;
    onSearchChange?: (value: string) => void;
    activeFilters?: Record<string, any>;
    onFilterChange?: (filters: Record<string, any>) => void;
}

export function DataTable<T extends Record<string, any>>({
    columns,
    data,
    loading = false,
    onRefresh,
    searchPlaceholder = "Cari data...",
    searchKey,
    filters,
    rowActions,
    bulkActions,
    pagination,
    onRowClick,
    selectedRowId,
    getRowId = (row) => row.id,
    renderExpandedRow,
    isRowExpanded,
    headerActions,
    title,
    searchValue,
    onSearchChange,
    activeFilters: controlledActiveFilters,
    onFilterChange,
}: DataTableProps<T>) {
    const [internalSearchTerm, setInternalSearchTerm] = useState("");
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' | null }>({ key: '', direction: null });
    const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
    const [internalActiveFilters, setInternalActiveFilters] = useState<Record<string, any>>({});

    const searchTerm = searchValue !== undefined ? searchValue : internalSearchTerm;
    const setSearchTerm = onSearchChange || setInternalSearchTerm;
    const activeFilters = controlledActiveFilters !== undefined ? controlledActiveFilters : internalActiveFilters;
    const setActiveFilters = (newFilters: Record<string, any>) => {
        if (onFilterChange) onFilterChange(newFilters);
        else setInternalActiveFilters(newFilters);
    };

    const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);

    const toggleFilterValue = (key: string, value: any) => {
        const currentValues = Array.isArray(activeFilters[key])
            ? activeFilters[key]
            : (activeFilters[key] ? [activeFilters[key]] : []);

        const stringValue = String(value);
        const newValues = currentValues.includes(stringValue)
            ? currentValues.filter((v: any) => String(v) !== stringValue)
            : [...currentValues, stringValue];

        setActiveFilters({ ...activeFilters, [key]: newValues });
    };

    const handleResetAll = () => {
        const reset: any = {};
        filters?.forEach(f => reset[f.key] = []);
        setActiveFilters(reset);
    };

    const processedData = useMemo(() => {
        let result = [...data];
        if (searchTerm && searchKey) {
            result = result.filter(item =>
                String(item[searchKey]).toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        if (sortConfig.key && sortConfig.direction) {
            result.sort((a, b) => {
                const aVal = a[sortConfig.key];
                const bVal = b[sortConfig.key];
                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return result;
    }, [data, searchTerm, searchKey, sortConfig]);

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' | null = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        else if (sortConfig.key === key && sortConfig.direction === 'desc') direction = null;
        setSortConfig({ key: direction ? key : '', direction });
    };

    const activeFilterCount = Object.values(activeFilters).flat().filter(Boolean).length;

    const hasToolbar = title || searchKey || (filters && filters.length > 0) || onRefresh || headerActions || (bulkActions && selectedIds.size > 0);

    return (
        <div className="flex flex-col h-full bg-white dark:bg-background overflow-hidden shadow-none font-sans border-none">
            {/* Premium Header Toolbar — Unified with Daftar Kontrak Style */}
            {hasToolbar && (
                <div className="px-5 py-4 flex items-center justify-between gap-6 border-b border-black/[0.05] dark:border-white/[0.05] bg-white dark:bg-background sticky top-0 z-20">
                    <div className="flex items-center gap-6 flex-1">
                        {searchKey && (
                            <SearchInput
                                containerClassName="max-w-sm flex-1"
                                placeholder={searchPlaceholder}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        )}


                    </div>

                    <div className="flex items-center gap-2">
                        {bulkActions && selectedIds.size > 0 && (
                            <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-4 duration-300 mr-4 pr-4 border-r border-black/[0.05] dark:border-white/[0.05]">
                                <div className="flex flex-col items-end">
                                    <span className="text-[9px] font-black text-black dark:text-white tracking-widest leading-none">{selectedIds.size} Selected</span>
                                    <button onClick={() => setSelectedIds(new Set())} className="text-[8px] font-bold text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white transition-colors mt-1">Clear</button>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    {typeof bulkActions === 'function' ? (
                                        bulkActions(data.filter(row => selectedIds.has(getRowId(row))))
                                    ) : (
                                        bulkActions.map((action, idx) => (
                                            <Button
                                                key={idx}
                                                variant={action.variant || 'outline'}
                                                size="sm"
                                                className="h-8 gap-2 rounded-lg text-[9px] font-black uppercase tracking-widest border-black/10 dark:border-white/10"
                                                onClick={() => {
                                                    const selectedRows = data.filter(row => selectedIds.has(getRowId(row)));
                                                    action.onClick(Array.from(selectedIds), selectedRows);
                                                }}
                                            >
                                                {action.icon && <action.icon className="h-3 w-3" />}
                                                {action.label}
                                            </Button>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {filters && filters.length > 0 && (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={() => setIsFilterDialogOpen(true)}
                                    className={cn(
                                        "relative h-10 px-4 transition-all active:scale-95",
                                        activeFilterCount > 0 && "bg-[var(--primary)] text-white border-[var(--primary)]"
                                    )}
                                >
                                    <Filter size={14} />
                                    Filter
                                    {activeFilterCount > 0 && (
                                        <span className={cn(
                                            "ml-1 flex h-4 min-w-[16px] items-center justify-center rounded-md px-1 text-[9px] font-bold",
                                            activeFilterCount > 0 ? "bg-white text-[var(--primary)]" : "bg-[var(--primary)] text-white"
                                        )}>
                                            {activeFilterCount}
                                        </span>
                                    )}
                                </Button>

                                <FilterSheet
                                    isOpen={isFilterDialogOpen}
                                    onOpenChange={setIsFilterDialogOpen}
                                    title="Filter Parameters"
                                    description="Refine your dataset with specific criteria."
                                    categories={filters as any}
                                    activeFilters={activeFilters}
                                    onFilterChange={toggleFilterValue}
                                    onReset={handleResetAll}
                                    totalResults={pagination?.total}
                                />
                            </>
                        )}

                        {onRefresh && (
                            <Button variant="ghost" size="icon" onClick={onRefresh} disabled={loading} className="h-10 w-10 rounded-lg text-black/40 dark:text-white/40 hover:bg-black/5 dark:hover:bg-white/5 border border-black/[0.05] dark:border-white/[0.05]">
                                <RefreshCcw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
                            </Button>
                        )}

                        {headerActions && <div className="flex items-center gap-2">{headerActions}</div>}
                    </div>
                </div>
            )}


            {/* Table */}
            <div className="flex-1 overflow-auto relative bg-white dark:bg-background">
                {loading && (
                    <div className="absolute inset-0 bg-white/50 dark:bg-background/50 backdrop-blur-[2px] z-20 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 text-black dark:text-white animate-spin" />
                    </div>
                )}

                <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead className="sticky top-0 z-10 bg-white dark:bg-background border-b border-black/[0.05] dark:border-white/[0.05]">
                        <tr>
                            {bulkActions && (
                                <th className="w-12 px-6 py-6">
                                    <div className="flex justify-center">
                                        <Checkbox
                                            className="h-4 w-4 rounded-md border-black/20 dark:border-white/20 data-[state=checked]:bg-black dark:data-[state=checked]:bg-white data-[state=checked]:border-black dark:data-[state=checked]:border-white"
                                            checked={selectedIds.size > 0 && selectedIds.size === data.length}
                                            onCheckedChange={(checked) => {
                                                if (checked) setSelectedIds(new Set(data.map(row => getRowId(row))));
                                                else setSelectedIds(new Set());
                                            }}
                                        />
                                    </div>
                                </th>
                            )}
                            {columns.map((col, i) => (
                                <th
                                    key={i}
                                    className={cn(
                                        "px-6 py-6 text-[10px] font-black text-black/40 dark:text-white/40 uppercase tracking-[0.2em]",
                                        col.thClassName
                                    )}
                                >
                                    <div className="flex items-center gap-2 group/th">
                                        {col.header}
                                        {col.sortable && (
                                            <button
                                                onClick={() => handleSort(col.accessorKey as string)}
                                                className={cn(
                                                    "opacity-0 group-hover/th:opacity-100 transition-all active:scale-90",
                                                    sortConfig.key === col.accessorKey && "opacity-100"
                                                )}
                                            >
                                                {sortConfig.key === col.accessorKey ? (
                                                    sortConfig.direction === 'asc' ? <ChevronUp size={12} className="text-black dark:text-white" /> : <ChevronDown size={12} className="text-black dark:text-white" />
                                                ) : <ChevronsUpDown size={12} />}
                                            </button>
                                        )}
                                    </div>
                                </th>
                            ))}
                            {rowActions && <th className="px-6 py-6 text-right text-[10px] font-black text-black/40 dark:text-white/40 uppercase tracking-[0.2em]">Aksi</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-black/[0.02] dark:divide-white/[0.02]">
                        {processedData.length === 0 && !loading ? (
                            <tr>
                                <td colSpan={columns.length + (rowActions ? 2 : 1)} className="py-24 text-center">
                                    <div className="flex flex-col items-center gap-4 text-black/20 dark:text-white/20">
                                        <Inbox size={40} strokeWidth={1.5} />
                                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Data Kosong</span>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            processedData.map((row) => (
                                <React.Fragment key={getRowId(row)}>
                                    <tr
                                        onClick={() => onRowClick?.(row)}
                                        className={cn(
                                            "hover:bg-black/[0.01] dark:hover:bg-white/[0.01] transition-all group cursor-pointer active:scale-[0.999]",
                                            (selectedRowId === getRowId(row) || (isRowExpanded && isRowExpanded(row))) && "bg-black/[0.02] dark:bg-white/[0.02]",
                                            selectedIds.has(getRowId(row)) && "bg-black/[0.03] dark:bg-white/[0.03]"
                                        )}
                                    >
                                        {bulkActions && (
                                            <td className="px-6 py-5" onClick={e => e.stopPropagation()}>
                                                <div className="flex justify-center">
                                                    <Checkbox
                                                        className="h-4 w-4 rounded-md border-black/10 dark:border-white/10 data-[state=checked]:bg-black dark:data-[state=checked]:bg-white data-[state=checked]:border-black dark:data-[state=checked]:border-white"
                                                        checked={selectedIds.has(getRowId(row))}
                                                        onCheckedChange={(checked) => {
                                                            const newSelection = new Set(selectedIds);
                                                            if (checked) newSelection.add(getRowId(row));
                                                            else newSelection.delete(getRowId(row));
                                                            setSelectedIds(newSelection);
                                                        }}
                                                    />
                                                </div>
                                            </td>
                                        )}
                                        {columns.map((col, j) => (
                                            <td key={j} className={cn("px-6 py-5 text-[12px] text-black dark:text-white font-bold tracking-tight", col.className)}>
                                                {col.cell ? col.cell(row) : (String(row[col.accessorKey]) || '—')}
                                            </td>
                                        ))}
                                        {rowActions && (
                                            <td className="px-6 py-5 text-right" onClick={e => e.stopPropagation()}>
                                                <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                                                    {rowActions(row)}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                    {renderExpandedRow && isRowExpanded?.(row) && (
                                        <tr>
                                            <td colSpan={columns.length + (rowActions ? 2 : 1)} className="p-0 bg-black/[0.02] dark:bg-white/[0.02]">
                                                {renderExpandedRow(row)}
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Professional Pagination — Minimalist Text Focused */}
            {pagination && (
                <div className="mt-auto px-8 py-8 w-full flex items-center justify-between border-t border-black/[0.05] dark:border-white/[0.05] bg-white dark:bg-background">
                    {/* Left: Info & Rows Per Page */}
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-black/30 dark:text-white/30 uppercase tracking-widest">Rows:</span>
                            <select
                                value={pagination.perPage}
                                onChange={(e) => pagination.onPerPageChange(Number(e.target.value))}
                                className="bg-transparent border-none text-black dark:text-white font-black focus:ring-0 rounded-lg px-1 py-1 text-[10px] outline-none cursor-pointer hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                            >
                                {[10, 25, 50, 100].map(v => <option key={v} value={v} className="bg-white dark:bg-background">{v}</option>)}
                            </select>
                        </div>

                        <div className="flex items-center gap-2 text-black/60 dark:text-white/60 text-[10px] font-black uppercase tracking-widest">
                            <span className="opacity-40">Showing</span>
                            <span>{pagination.from} - {pagination.to} / {pagination.total}</span>
                        </div>
                    </div>

                    {/* Right: Modern Text Navigation */}
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={pagination.currentPage === 1}
                            onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
                            className="h-9 px-4 flex items-center gap-2 disabled:opacity-20 transition-all text-[10px]"
                        >
                            <ChevronLeft className="h-4 w-4" /> Prev
                        </Button>

                        <div className="flex items-center gap-1.5 px-3">
                            <span className="text-[10px] font-black text-black dark:text-white">{pagination.currentPage}</span>
                            <span className="text-[10px] font-black text-black/20 dark:text-white/20">/</span>
                            <span className="text-[10px] font-black text-black/40 dark:text-white/40">{pagination.lastPage}</span>
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            disabled={pagination.currentPage === pagination.lastPage}
                            onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
                            className="h-9 px-4 flex items-center gap-2 disabled:opacity-20 transition-all text-[10px]"
                        >
                            Next <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
