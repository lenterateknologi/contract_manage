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
        options: { label: string; value: any }[];
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

    const hasToolbar = searchKey || (filters && filters.length > 0) || onRefresh || headerActions || (bulkActions && selectedIds.size > 0);

    return (
        <div className="flex flex-col h-full">
            {/* Toolbar — only rendered when there is content */}
            {hasToolbar && (
                <div className="px-3 py-2 flex items-center gap-2 border-b border-slate-100 bg-white">
                    {searchKey && (
                        <div className="relative flex-1 max-w-xs">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                            <Input
                                placeholder={searchPlaceholder}
                                className="pl-8 h-8 border-slate-200 focus:ring-primary/10 rounded-lg bg-slate-50 text-[11px] placeholder:text-slate-400"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    )}
                    <div className="flex items-center gap-1.5 ml-auto">
                        {filters && filters.length > 0 && (
                            <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
                                <DialogTrigger asChild>
                                    <button
                                        className={cn(
                                            "relative inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border text-[10px] font-bold uppercase tracking-wide transition-all duration-200",
                                            activeFilterCount > 0
                                                ? "border-primary/40 bg-primary/8 text-primary shadow-sm shadow-primary/10"
                                                : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700 hover:bg-slate-50"
                                        )}
                                    >
                                        <SlidersHorizontal className="h-3 w-3" />
                                        Filter
                                        {activeFilterCount > 0 && (
                                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-black text-white shadow">
                                                {activeFilterCount}
                                            </span>
                                        )}
                                    </button>
                                </DialogTrigger>

                                <DialogContent className="max-w-sm p-0 overflow-hidden rounded-2xl border-none shadow-2xl gap-0">
                                    {/* Dark header */}
                                    <div className="relative bg-slate-950 px-6 py-5 text-white overflow-hidden">
                                        <div className="pointer-events-none absolute -top-4 -right-4 opacity-10">
                                            <SlidersHorizontal className="h-24 w-24 rotate-12" />
                                        </div>
                                        <DialogTitle className="flex items-center gap-2 text-base font-black tracking-tight">
                                            <div className="bg-primary h-7 w-1.5 rounded-full" />
                                            Filter Data
                                        </DialogTitle>
                                        <DialogDescription className="mt-1 text-[11px] font-medium text-slate-400">
                                            Saring data berdasarkan kategori di bawah ini
                                        </DialogDescription>
                                        {activeFilterCount > 0 && (
                                            <button
                                                onClick={handleResetAll}
                                                className="absolute top-4 right-4 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-red-500/30 text-[10px] font-bold uppercase tracking-wide text-slate-300 hover:text-red-300 transition-all"
                                            >
                                                <X size={10} strokeWidth={3} />
                                                Reset
                                            </button>
                                        )}
                                    </div>

                                    {/* Filter body */}
                                    <div className="px-6 py-5 space-y-6 max-h-[55vh] overflow-auto">
                                        {filters.map((category) => (
                                            <div key={category.key}>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">{category.label}</span>
                                                    <div className="h-px flex-1 bg-slate-100" />
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {category.options.map((opt) => {
                                                        const isSelected = Array.isArray(activeFilters[category.key])
                                                            ? activeFilters[category.key].includes(opt.value)
                                                            : activeFilters[category.key] === opt.value;
                                                        return (
                                                            <button
                                                                key={String(opt.value)}
                                                                onClick={() => toggleFilterValue(category.key, opt.value)}
                                                                className={cn(
                                                                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-semibold transition-all duration-150",
                                                                    isSelected
                                                                        ? "border-primary bg-primary text-white shadow-sm shadow-primary/20"
                                                                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                                                                )}
                                                            >
                                                                {isSelected && <Check size={9} strokeWidth={3.5} />}
                                                                {opt.label}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Footer */}
                                    <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between gap-3">
                                        <p className="text-[10px] text-slate-400 font-medium">
                                            {activeFilterCount > 0 ? `${activeFilterCount} filter aktif` : 'Belum ada filter aktif'}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 px-4 text-[11px] font-semibold text-slate-500"
                                                onClick={() => setIsFilterDialogOpen(false)}
                                            >
                                                Tutup
                                            </Button>
                                            <Button
                                                size="sm"
                                                className="h-8 px-5 text-[11px] font-bold rounded-lg"
                                                onClick={() => setIsFilterDialogOpen(false)}
                                            >
                                                Terapkan
                                            </Button>
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        )}

                        {onRefresh && (
                            <Button variant="ghost" size="icon" onClick={onRefresh} disabled={loading} className="h-8 w-8 text-slate-400 hover:text-slate-700">
                                <RefreshCcw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
                            </Button>
                        )}

                        {headerActions && <div className="flex items-center gap-1.5">{headerActions}</div>}

                        {bulkActions && selectedIds.size > 0 && (
                            <div className="flex items-center gap-1.5 animate-in fade-in">
                                <div className="h-5 w-px bg-slate-200" />
                                {bulkActions(data.filter(row => selectedIds.has(getRowId(row))))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="flex-1 overflow-auto relative">
                {loading && (
                    <div className="absolute inset-0 bg-white/70 z-20 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 text-primary animate-spin" />
                    </div>
                )}

                <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead className="sticky top-0 z-10 bg-slate-100/80 border-b border-slate-200">
                        <tr>
                            {columns.map((col, i) => (
                                <th
                                    key={i}
                                    className={cn(
                                        "px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-slate-600",
                                        col.thClassName
                                    )}
                                >
                                    <div className="flex items-center gap-1 group/th">
                                        {col.header}
                                        {col.sortable && (
                                            <button
                                                onClick={() => handleSort(col.accessorKey as string)}
                                                className="opacity-0 group-hover/th:opacity-60 transition-opacity hover:opacity-100"
                                            >
                                                {sortConfig.key === col.accessorKey ? (
                                                    sortConfig.direction === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />
                                                ) : <ChevronsUpDown size={11} />}
                                            </button>
                                        )}
                                    </div>
                                </th>
                            ))}
                            {rowActions && <th className="px-4 py-2.5 text-right text-[10px] font-black uppercase tracking-wider text-slate-600">Aksi</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {processedData.length === 0 && !loading ? (
                            <tr>
                                <td colSpan={columns.length + (rowActions ? 2 : 1)} className="py-16 text-center">
                                    <div className="flex flex-col items-center gap-2 opacity-30">
                                        <Inbox size={32} strokeWidth={1.5} />
                                        <span className="text-sm font-semibold text-slate-700">Tidak ada data</span>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            processedData.map((row) => (
                                <React.Fragment key={getRowId(row)}>
                                    <tr
                                        onClick={() => onRowClick?.(row)}
                                        className={cn(
                                            "hover:bg-slate-50 transition-colors group cursor-pointer",
                                            (selectedRowId === getRowId(row) || (isRowExpanded && isRowExpanded(row))) && "bg-primary/5"
                                        )}
                                    >
                                        {columns.map((col, j) => (
                                            <td key={j} className={cn("px-4 py-2.5 text-[12px] text-slate-700", col.className)}>
                                                {col.cell ? col.cell(row) : (String(row[col.accessorKey]) || '-')}
                                            </td>
                                        ))}
                                        {rowActions && (
                                            <td className="px-4 py-2.5 text-right" onClick={e => e.stopPropagation()}>
                                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {rowActions(row)}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                    {renderExpandedRow && isRowExpanded?.(row) && (
                                        <tr>
                                            <td colSpan={columns.length + (rowActions ? 2 : 1)} className="p-0 border-b border-slate-200">
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

            {/* Pagination */}
            {pagination && (
                <div className="mt-auto flex flex-col items-center justify-between gap-4 border-t border-slate-100 px-4 py-6 sm:flex-row w-full">
                    <div className="flex items-center gap-4">
                        <div className="text-slate-400 text-[10px] font-bold tracking-widest whitespace-nowrap uppercase">
                            Showing <span className="text-slate-900">{pagination.from}</span> to <span className="text-slate-900">{pagination.to}</span> of{' '}
                            <span className="text-slate-900">{pagination.total}</span> Results
                        </div>

                        <div className="border-slate-200 flex items-center gap-2 border-l pl-4">
                            <span className="text-slate-400 text-[10px] font-bold tracking-widest uppercase">Show</span>
                            <select
                                value={pagination.perPage}
                                onChange={(e) => pagination.onPerPageChange(Number(e.target.value))}
                                className="bg-slate-50 border-slate-200 focus:border-primary/50 rounded border px-1.5 py-0.5 text-[10px] font-bold outline-none"
                            >
                                {[10, 25, 50, 100].map(v => <option key={v} value={v}>{v}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center gap-1">
                        <button
                            disabled={pagination.currentPage === 1}
                            onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
                            className={cn(
                                "h-8 shrink-0 rounded border px-3 text-[10px] font-black tracking-tighter uppercase transition-all",
                                "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900 active:scale-95",
                                pagination.currentPage === 1 && "cursor-not-allowed opacity-30 grayscale"
                            )}
                        >
                            Prev
                        </button>

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
                                        "h-8 shrink-0 rounded border px-3 text-[10px] font-black tracking-tighter uppercase transition-all",
                                        isActive
                                            ? "border-slate-950 bg-slate-950 text-white shadow-sm"
                                            : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900 active:scale-95"
                                    )}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}

                        <button
                            disabled={pagination.currentPage === pagination.lastPage}
                            onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
                            className={cn(
                                "h-8 shrink-0 rounded border px-3 text-[10px] font-black tracking-tighter uppercase transition-all",
                                "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900 active:scale-95",
                                pagination.currentPage === pagination.lastPage && "cursor-not-allowed opacity-30 grayscale"
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
