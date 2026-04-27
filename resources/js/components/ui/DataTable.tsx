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
        <div className="flex flex-col h-full bg-white overflow-hidden shadow-none">
            {/* Toolbar — only rendered when there is content */}
            {hasToolbar && (
                <div className="px-4 py-3 flex items-center gap-4 border-b border-slate-100 bg-white">
                    {title && (
                        <div className="flex-shrink-0">
                            {typeof title === 'string' ? (
                                <h2 className="text-[12px] font-black uppercase tracking-widest text-slate-900">{title}</h2>
                            ) : title}
                        </div>
                    )}
                    
                    {searchKey && (
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder={searchPlaceholder}
                                className="pl-10 h-10 border-slate-100 focus:border-primary/30 rounded-xl bg-slate-50/50 text-xs placeholder:text-slate-400"
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
                                        "relative inline-flex items-center gap-2 h-9 px-4 rounded-none border text-[11px] font-black uppercase tracking-tight transition-all active:scale-95 shadow-sm",
                                        activeFilterCount > 0
                                            ? "border-black bg-black text-white"
                                            : "border-slate-200 bg-white text-slate-600 hover:border-black hover:text-black"
                                    )}
                                >
                                    <SlidersHorizontal className="h-3.5 w-3.5" />
                                    Filter
                                    {activeFilterCount > 0 && (
                                        <span className={cn(
                                            "flex h-4 w-4 items-center justify-center rounded-none text-[8px] font-black border",
                                            activeFilterCount > 0 ? "bg-white text-black border-white" : "bg-black text-white border-black"
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
                            <Button variant="ghost" size="icon" onClick={onRefresh} disabled={loading} className="h-8 w-8 text-slate-400 hover:text-black hover:bg-slate-50">
                                <RefreshCcw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
                            </Button>
                        )}

                        {headerActions && <div className="flex items-center gap-1.5">{headerActions}</div>}

                        {bulkActions && selectedIds.size > 0 && (
                            <div className="flex items-center gap-3 animate-in fade-in">
                                <div className="h-4 w-px bg-slate-200" />
                                {bulkActions(data.filter(row => selectedIds.has(getRowId(row))))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="flex-1 overflow-auto relative bg-white">
                {loading && (
                    <div className="absolute inset-0 bg-white/70 z-20 flex items-center justify-center">
                        <Loader2 className="h-5 w-5 text-black animate-spin" />
                    </div>
                )}

                <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead className="sticky top-0 z-10 bg-slate-50/80 backdrop-blur-sm border-b border-slate-100">
                        <tr>
                            {columns.map((col, i) => (
                                <th
                                    key={i}
                                    className={cn(
                                        "px-4 py-2 text-[9px] font-black uppercase tracking-[0.1em] text-slate-400",
                                        col.thClassName
                                    )}
                                >
                                    <div className="flex items-center gap-1 group/th">
                                        {col.header}
                                        {col.sortable && (
                                            <button
                                                onClick={() => handleSort(col.accessorKey as string)}
                                                className="opacity-0 group-hover/th:opacity-100 transition-opacity"
                                            >
                                                {sortConfig.key === col.accessorKey ? (
                                                    sortConfig.direction === 'asc' ? <ChevronUp size={10} className="text-black" /> : <ChevronDown size={10} className="text-black" />
                                                ) : <ChevronsUpDown size={10} />}
                                            </button>
                                        )}
                                    </div>
                                </th>
                            ))}
                            {rowActions && <th className="px-4 py-2 text-right text-[9px] font-black uppercase tracking-[0.1em] text-slate-400">Aksi</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {processedData.length === 0 && !loading ? (
                            <tr>
                                <td colSpan={columns.length + (rowActions ? 2 : 1)} className="py-20 text-center">
                                    <div className="flex flex-col items-center gap-3 opacity-20">
                                        <Inbox size={40} strokeWidth={1} />
                                        <span className="text-[11px] font-black uppercase tracking-widest">Database Kosong</span>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            processedData.map((row) => (
                                <React.Fragment key={getRowId(row)}>
                                    <tr
                                        onClick={() => onRowClick?.(row)}
                                        className={cn(
                                            "hover:bg-slate-50/50 transition-colors group cursor-pointer border-l-2 border-l-transparent",
                                            (selectedRowId === getRowId(row) || (isRowExpanded && isRowExpanded(row))) && "bg-slate-50 border-l-black"
                                        )}
                                    >
                                        {columns.map((col, j) => (
                                            <td key={j} className={cn("px-4 py-2 text-[11px] text-slate-700 font-medium tracking-tight", col.className)}>
                                                {col.cell ? col.cell(row) : (String(row[col.accessorKey]) || '—')}
                                            </td>
                                        ))}
                                        {rowActions && (
                                            <td className="px-4 py-1.5 text-right" onClick={e => e.stopPropagation()}>
                                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {rowActions(row)}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                    {renderExpandedRow && isRowExpanded?.(row) && (
                                        <tr>
                                            <td colSpan={columns.length + (rowActions ? 2 : 1)} className="p-0 border-b border-slate-100 bg-slate-50/30">
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
                <div className="mt-auto flex flex-col items-center justify-between gap-4 border-t border-slate-100 px-4 py-4 sm:flex-row w-full bg-white">
                    <div className="flex items-center gap-5">
                        <div className="text-slate-400 text-[10px] font-bold tracking-widest uppercase">
                            Showing <span className="text-black">{pagination.from}</span> to <span className="text-black">{pagination.to}</span> of{' '}
                            <span className="text-black">{pagination.total}</span> Results
                        </div>

                        <div className="flex items-center gap-2 border-l border-slate-100 pl-5">
                            <span className="text-slate-400 text-[9px] font-black uppercase tracking-tighter">Rows per page</span>
                            <select
                                value={pagination.perPage}
                                onChange={(e) => pagination.onPerPageChange(Number(e.target.value))}
                                className="bg-slate-50 border-none text-black font-black focus:ring-0 rounded px-2 py-1 text-[10px] outline-none cursor-pointer"
                            >
                                {[10, 25, 50, 100].map(v => <option key={v} value={v}>{v}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <button
                            disabled={pagination.currentPage === 1}
                            onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
                            className={cn(
                                "h-8 px-4 rounded-none border text-[10px] font-black uppercase transition-all tracking-tighter",
                                "border-slate-100 bg-white text-slate-400 hover:text-black hover:border-black active:scale-95 disabled:opacity-20 disabled:pointer-events-none"
                            )}
                        >
                            Prev
                        </button>

                        <div className="flex items-center gap-1 mx-2">
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
                                            "h-8 min-w-[32px] rounded-none text-[10px] font-black transition-all",
                                            isActive
                                                ? "bg-black text-white"
                                                : "bg-white text-slate-400 hover:text-black"
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
                                "h-8 px-4 rounded-none border text-[10px] font-black uppercase transition-all tracking-tighter",
                                "border-slate-100 bg-white text-slate-400 hover:text-black hover:border-black active:scale-95 disabled:opacity-20 disabled:pointer-events-none"
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
