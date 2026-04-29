import React, { useState, useMemo } from 'react';
import {
    ChevronDown, ChevronUp, ChevronsUpDown,
    Search, Filter, SlidersHorizontal, X,
    RefreshCcw, ChevronLeft, ChevronRight,
    Loader2, Inbox,
    Check
} from 'lucide-react';
import { Button } from './button';
import { Input } from './input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from './dropdown-menu';
import { cn } from '@/lib/utils';
import { Badge } from './badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from './dialog';
import { FilterSheet } from './FilterSheet';

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
    bulkActions?: (selectedRows: T[]) => React.ReactNode;
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
        <div className="flex flex-col h-full bg-white dark:bg-black overflow-hidden shadow-none font-sans">
            {/* Toolbar — only rendered when there is content */}
            {hasToolbar && (
                <div className="px-4 py-3 flex items-center gap-4 border-b border-black dark:border-white bg-white dark:bg-black">
                    {title && (
                        <div className="flex-shrink-0">
                            {typeof title === 'string' ? (
                                <h2 className="text-[13px] font-bold text-black dark:text-white">{title}</h2>
                            ) : title}
                        </div>
                    )}

                    {searchKey && (
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-black/30 dark:text-white/30 transition-colors" />
                            <Input
                                placeholder={searchPlaceholder}
                                className="pl-10 h-10 border-black dark:border-white bg-white dark:bg-black focus:ring-0 rounded-none text-xs font-bold text-black dark:text-white placeholder:text-black/30 dark:placeholder:text-white/30"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    )}
                    <div className="flex items-center gap-1.5 ml-auto">
                        {filters && filters.length > 0 && (
                            <>
                                <button
                                    onClick={() => setIsFilterDialogOpen(true)}
                                    className={cn(
                                        "relative inline-flex items-center gap-2 h-9 px-4 rounded-none border text-[11px] font-bold transition-all active:scale-95 shadow-none",
                                        activeFilterCount > 0
                                            ? "border-black dark:border-white bg-black dark:bg-white text-white dark:text-black"
                                            : "border-black dark:border-white bg-white dark:bg-black text-black dark:text-white hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black"
                                    )}
                                >
                                    <SlidersHorizontal className="h-3.5 w-3.5" />
                                    Filter
                                    {activeFilterCount > 0 && (
                                        <span className={cn(
                                            "flex h-4 w-4 items-center justify-center text-[8px] font-bold border border-current",
                                            activeFilterCount > 0 ? "bg-transparent" : ""
                                        )}>
                                            {activeFilterCount}
                                        </span>
                                    )}
                                </button>

                                <FilterSheet
                                    isOpen={isFilterDialogOpen}
                                    onOpenChange={setIsFilterDialogOpen}
                                    title="Filter Data"
                                    description="Sesuaikan parameter untuk memfilter hasil pada tabel."
                                    categories={filters as any}
                                    activeFilters={activeFilters}
                                    onFilterChange={toggleFilterValue}
                                    onReset={handleResetAll}
                                    totalResults={pagination?.total}
                                />
                            </>
                        )}

                        {onRefresh && (
                            <Button variant="ghost" size="icon" onClick={onRefresh} disabled={loading} className="h-9 w-9 rounded-none text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5">
                                <RefreshCcw className={cn("h-4 w-4", loading && "animate-spin")} />
                            </Button>
                        )}

                        {headerActions && <div className="flex items-center gap-1.5">{headerActions}</div>}

                        {bulkActions && selectedIds.size > 0 && (
                            <div className="flex items-center gap-3 animate-in fade-in">
                                <div className="h-4 w-px bg-sidebar-border" />
                                {bulkActions(data.filter(row => selectedIds.has(getRowId(row))))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="flex-1 overflow-auto relative bg-white dark:bg-black">
                {loading && (
                    <div className="absolute inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-[2px] z-20 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 text-black dark:text-white animate-spin" />
                    </div>
                )}

                <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead className="sticky top-0 z-10 bg-white dark:bg-black border-b border-black dark:border-white">
                        <tr>
                            {columns.map((col, i) => (
                                <th
                                    key={i}
                                    className={cn(
                                        "px-4 py-4 text-[11px] font-bold text-black dark:text-white uppercase tracking-wider",
                                        col.thClassName
                                    )}
                                >
                                    <div className="flex items-center gap-1.5 group/th">
                                        {col.header}
                                        {col.sortable && (
                                            <button
                                                onClick={() => handleSort(col.accessorKey as string)}
                                                className="opacity-20 group-hover/th:opacity-100 transition-opacity"
                                            >
                                                {sortConfig.key === col.accessorKey ? (
                                                    sortConfig.direction === 'asc' ? <ChevronUp size={12} className="text-black dark:text-white" /> : <ChevronDown size={12} className="text-black dark:text-white" />
                                                ) : <ChevronsUpDown size={12} />}
                                            </button>
                                        )}
                                    </div>
                                </th>
                            ))}
                            {rowActions && <th className="px-4 py-4 text-right text-[11px] font-medium text-black dark:text-white">Opsi</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-sidebar-border/30">
                        {processedData.length === 0 && !loading ? (
                            <tr>
                                <td colSpan={columns.length + (rowActions ? 2 : 1)} className="py-32 text-center">
                                    <div className="flex flex-col items-center gap-4 opacity-100 text-black dark:text-white">
                                        <Inbox size={48} strokeWidth={1} />
                                        <span className="text-[12px] font-bold uppercase tracking-widest">Tidak ada data ditemukan</span>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            processedData.map((row) => (
                                <React.Fragment key={getRowId(row)}>
                                    <tr
                                        onClick={() => onRowClick?.(row)}
                                        className={cn(
                                            "hover:bg-black/5 dark:hover:bg-white/5 transition-all group cursor-pointer border-l-[3px] border-l-transparent active:scale-[0.998]",
                                            (selectedRowId === getRowId(row) || (isRowExpanded && isRowExpanded(row))) && "bg-black/5 dark:bg-white/10 border-l-black dark:border-l-white"
                                        )}
                                    >
                                        {columns.map((col, j) => (
                                            <td key={j} className={cn("px-4 py-4 text-[12px] text-black dark:text-white font-bold tracking-tight", col.className)}>
                                                {col.cell ? col.cell(row) : (String(row[col.accessorKey]) || '—')}
                                            </td>
                                        ))}
                                        {rowActions && (
                                            <td className="px-4 py-2 text-right" onClick={e => e.stopPropagation()}>
                                                <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                                                    {rowActions(row)}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                    {renderExpandedRow && isRowExpanded?.(row) && (
                                        <tr>
                                            <td colSpan={columns.length + (rowActions ? 2 : 1)} className="p-0 border-b border-black dark:border-white bg-black/5 dark:bg-white/5">
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

            {/* Pagination — Unified Industrial Style */}
            {pagination && (
                <div className="mt-auto flex flex-col items-center justify-between gap-4 border-t border-black dark:border-white px-6 py-4 sm:flex-row w-full bg-white dark:bg-black">
                    <div className="flex items-center gap-6">
                        <div className="text-black dark:text-white text-[11px] font-bold uppercase tracking-wider">
                            {pagination.from} - {pagination.to} / {pagination.total}
                        </div>

                        <div className="flex items-center gap-3 border-l border-black dark:border-white pl-6">
                            <span className="text-black dark:text-white text-[11px] font-bold uppercase">Rows</span>
                            <select
                                value={pagination.perPage}
                                onChange={(e) => pagination.onPerPageChange(Number(e.target.value))}
                                className="bg-transparent border-none text-black dark:text-white font-black focus:ring-0 rounded-none px-3 py-1.5 text-[11px] outline-none cursor-pointer"
                            >
                                {[10, 25, 50, 100].map(v => <option key={v} value={v} className="bg-white dark:bg-black">{v}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            disabled={pagination.currentPage === 1}
                            onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
                            className={cn(
                                "h-9 px-4 rounded-none border text-[11px] font-bold uppercase transition-all disabled:opacity-20",
                                "border-black dark:border-white bg-white dark:bg-black text-black dark:text-white hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black"
                            )}
                        >
                            Back
                        </button>

                        <div className="flex items-center gap-1.5 mx-3">
                             {Array.from({ length: Math.min(pagination.lastPage, 5) }, (_, i) => {
                                let pageNum = i + 1;
                                if (pagination.lastPage > 5 && pagination.currentPage > 3) {
                                    pageNum = pagination.currentPage - 3 + i;
                                    if (pageNum > pagination.lastPage) pageNum = pagination.lastPage - (4 - i);
                                }
                                const isActive = pagination.currentPage === pageNum;
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => pagination.onPageChange(pageNum)}
                                        className={cn(
                                            "h-9 min-w-[36px] rounded-none text-[11px] font-black transition-all",
                                            isActive
                                                ? "bg-black dark:bg-white text-white dark:text-black"
                                                : "bg-transparent text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5"
                                        )}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            disabled={pagination.currentPage === pagination.lastPage}
                            onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
                            className={cn(
                                "h-9 px-4 rounded-none border text-[11px] font-bold uppercase transition-all disabled:opacity-20",
                                "border-black dark:border-white bg-white dark:bg-black text-black dark:text-white hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black"
                            )}
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
