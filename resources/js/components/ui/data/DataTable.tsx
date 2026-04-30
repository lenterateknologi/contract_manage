import * as React from 'react';
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/base/Button';
import { Checkbox } from '@/components/ui/base/Checkbox';
import { SearchInput } from '@/components/ui/forms/SearchInput';
import { FilterSheet } from './FilterSheet';
import LoadingLottie from '@/components/ui/feedback/LoadingLottie';

export interface Column<T> {
    header: string;
    accessorKey: keyof T | string;
    cell?: (row: T) => React.ReactNode;
    className?: string;
}

export interface DataTableProps<T> {
    title?: string;
    columns: Column<T>[];
    data: T[];
    loading?: boolean;
    pagination?: {
        currentPage: number;
        lastPage: number;
        total: number;
        onPageChange: (page: number) => void;
        from?: number;
        to?: number;
        perPage?: number;
        onPerPageChange?: (perPage: number) => void;
    };
    onRowClick?: (row: T) => void;
    onSelectionChange?: (selectedRows: T[]) => void;
    selectedRows?: T[];
    bulkActions?: any[];

    // Search & Filter
    searchPlaceholder?: string;
    searchValue?: string;
    onSearchChange?: (value: string) => void;
    filters?: any[];
    activeFilters?: Record<string, any>;
    onFilterChange?: (filters: Record<string, any>) => void;
    headerActions?: React.ReactNode;
}

export function DataTable<T extends Record<string, any>>({
    title,
    columns,
    data,
    loading = false,
    pagination,
    onRowClick,
    onSelectionChange,
    selectedRows = [],
    bulkActions = [],
    searchPlaceholder = "Cari data...",
    searchValue = "",
    onSearchChange,
    filters = [],
    activeFilters = {},
    onFilterChange,
    headerActions,
}: DataTableProps<T>) {
    const [isFilterOpen, setIsFilterOpen] = React.useState(false);

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            onSelectionChange?.(data);
        } else {
            onSelectionChange?.([]);
        }
    };

    const handleSelectRow = (row: T, checked: boolean) => {
        if (checked) {
            onSelectionChange?.([...selectedRows, row]);
        } else {
            onSelectionChange?.(selectedRows.filter((r) => r.id !== row.id));
        }
    };

    const isAllSelected = data.length > 0 && selectedRows.length === data.length;

    const activeCount = Object.values(activeFilters).flat().filter(v => v !== '' && v !== null).length;

    return (
        <div className="flex flex-col gap-3 antialiased px-2 py-5 bg-white dark:bg-background">
            {/* Premium Header Section - More Compact */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-1 mb-1">
                <div className="space-y-0.5">
                    {title && <h2 className="text-sm font-black tracking-tight text-primary dark:text-white uppercase leading-none">{title}</h2>}
                    <div className="flex items-center gap-2">
                        <div className="h-0.5 w-8 bg-primary dark:bg-white rounded-full" />
                        <span className="text-[8px] font-black tracking-[0.2em] text-primary dark:text-white uppercase italic">DATA REPOSITORY</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {onSearchChange && (
                        <div className="w-full md:w-64">
                            <SearchInput
                                placeholder={searchPlaceholder}
                                value={searchValue}
                                onChange={(e) => onSearchChange?.(e.target.value)}
                                className="h-9 bg-white dark:bg-primary/[0.03] border-primary/5 text-[11px]"
                            />
                        </div>
                    )}

                    {filters.length > 0 && (
                        <Button
                            variant="outline"
                            onClick={() => setIsFilterOpen(true)}
                            className={cn(
                                "h-9 px-3.5 rounded-xl border-primary/10 dark:border-white/10 gap-2 text-[10px] font-black uppercase tracking-widest transition-all",
                                activeCount > 0
                                    ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                                    : "bg-white dark:bg-primary/[0.03] hover:border-primary dark:hover:border-white"
                            )}
                        >
                            <SlidersHorizontal size={13} />
                            Filter
                            {activeCount > 0 && <span className="ml-1 h-4 min-w-[16px] px-1 flex items-center justify-center bg-white dark:bg-primary text-primary dark:text-white rounded-full text-[8px]">{activeCount}</span>}
                        </Button>
                    )}

                    {headerActions}
                </div>
            </div>

            {/* Bulk Actions Bar - More Compact */}
            {selectedRows.length > 0 && bulkActions.length > 0 && (
                <div className="flex items-center justify-between p-2 bg-primary dark:bg-white rounded-xl shadow-xl animate-in slide-in-from-top-2 duration-300 mx-1">
                    <div className="flex items-center gap-3 pl-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-white dark:bg-primary animate-pulse" />
                        <span className="text-[9px] font-black text-white dark:text-primary uppercase tracking-[0.15em]">
                            {selectedRows.length} Terpilih
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        {bulkActions.map((action, idx) => (
                            <Button
                                key={idx}
                                variant={action.variant || 'ghost'}
                                size="sm"
                                onClick={() => action.onClick(selectedRows.map(r => r.id))}
                                className={cn(
                                    "h-8 px-4 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                                    action.variant === 'destructive'
                                        ? "bg-rose-500 text-white hover:bg-rose-600 border-none shadow-sm"
                                        : "text-white dark:text-primary hover:bg-white/10 dark:hover:bg-primary/5"
                                )}
                            >
                                {action.icon && <action.icon size={12} className="mr-1.5" />}
                                {action.label}
                            </Button>
                        ))}
                    </div>
                </div>
            )}

            {/* Table Container - Consistent Background */}
            <div className="rounded-2xl border border-primary/10 dark:border-white/10 dark:bg-black/10 overflow-hidden shadow-xl shadow-primary/[0.02]">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="border-b border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02]">
                                {onSelectionChange && (
                                    <th className="p-3 w-10">
                                        <Checkbox
                                            checked={isAllSelected}
                                            onCheckedChange={handleSelectAll}
                                            className="border-primary/20 dark:border-white/20"
                                        />
                                    </th>
                                )}
                                {columns.map((col, idx) => (
                                    <th
                                        key={idx}
                                        className={cn(
                                            "p-3 text-[9px] font-black uppercase tracking-[0.2em] text-primary dark:text-white antialiased",
                                            col.className
                                        )}
                                    >
                                        {col.header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="relative">
                            {loading && (
                                <tr>
                                    <td colSpan={columns.length + (onSelectionChange ? 1 : 0)} className="p-0">
                                        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm dark:bg-primary/80 py-10 gap-3">
                                            <LoadingLottie width={80} height={80} />
                                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary dark:text-white animate-pulse">Syncing...</p>
                                        </div>
                                    </td>
                                </tr>
                            )}

                            {data.length === 0 && !loading ? (
                                <tr>
                                    <td colSpan={columns.length + (onSelectionChange ? 1 : 0)} className="p-16 text-center">
                                        <div className="flex flex-col items-center gap-3 opacity-10">
                                            <Search size={40} strokeWidth={1} />
                                            <p className="text-[10px] font-black uppercase tracking-widest">No matching results</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                data.map((row, rowIdx) => (
                                    <tr
                                        key={row.id || rowIdx}
                                        onClick={() => onRowClick?.(row)}
                                        className={cn(
                                            "border-b border-primary/[0.05] dark:border-white/[0.05] transition-all hover:bg-primary/[0.02] dark:hover:bg-white/[0.02] cursor-pointer group",
                                            selectedRows.some(r => r.id === row.id) ? "bg-primary/[0.04] dark:bg-white/[0.04]" : ""
                                        )}
                                    >
                                        {onSelectionChange && (
                                            <td className="p-3 w-10" onClick={(e) => e.stopPropagation()}>
                                                <Checkbox
                                                    checked={selectedRows.some(r => r.id === row.id)}
                                                    onCheckedChange={(checked) => handleSelectRow(row, !!checked)}
                                                    className="border-primary/20 dark:border-white/20"
                                                />
                                            </td>
                                        )}
                                        {columns.map((col, colIdx) => (
                                            <td key={colIdx} className={cn("p-3 align-middle text-[12px] font-medium text-primary/80 dark:text-white/80", col.className)}>
                                                {col.cell ? col.cell(row) : (row[col.accessorKey as keyof T] as React.ReactNode)}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination - Compact */}
            {pagination && pagination.lastPage > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-1 py-1">
                    <div className="flex items-center gap-3 order-2 sm:order-1">
                        <span className="text-[10px] font-bold text-primary/30 dark:text-white/30 tracking-tight">
                            Showing <span className="text-primary dark:text-white">{data.length}</span> of <span className="text-primary dark:text-white">{pagination.total}</span>
                        </span>
                    </div>

                    <div className="flex items-center gap-4 order-1 sm:order-2">
                        {pagination.onPerPageChange && (
                            <div className="flex items-center gap-2 mr-2">
                                <span className="text-[9px] font-black uppercase text-primary/30 dark:text-white/30 tracking-widest">Baris:</span>
                                <select 
                                    className="bg-primary/[0.03] dark:bg-white/[0.03] border border-primary/10 dark:border-white/10 rounded-lg text-[10px] font-black text-primary dark:text-white px-2 py-1 outline-none focus:border-primary dark:focus:border-white transition-all cursor-pointer"
                                    value={pagination.perPage || 10}
                                    onChange={(e) => pagination.onPerPageChange?.(Number(e.target.value))}
                                >
                                    {[10, 25, 50, 100].map(n => (
                                        <option key={n} value={n} className="bg-white dark:bg-primary text-black dark:text-white font-bold">{n}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="flex items-center gap-1.5">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={pagination.currentPage === 1}
                                onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
                                className="h-8 px-4 flex items-center gap-2 disabled:opacity-20 transition-all text-[9px] font-black uppercase tracking-widest border-primary/10 dark:border-white/10 rounded-lg"
                            >
                                <ChevronLeft className="h-3 w-3" /> Prev
                            </Button>

                            <div className="flex items-center gap-2 px-3 h-8 bg-primary/[0.03] dark:bg-white/[0.03] rounded-lg border border-primary/5 dark:border-white/5">
                                <span className="text-[10px] font-black text-primary dark:text-white">{pagination.currentPage}</span>
                                <span className="text-[9px] font-black opacity-10">/</span>
                                <span className="text-[10px] font-black text-primary dark:text-white">{pagination.lastPage}</span>
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                disabled={pagination.currentPage === pagination.lastPage}
                                onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
                                className="h-8 px-4 flex items-center gap-2 disabled:opacity-20 transition-all text-[9px] font-black uppercase tracking-widest border-primary/10 dark:border-white/10 rounded-lg"
                            >
                                Next <ChevronRight className="h-3 w-3" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Filter Sheet Integration */}
            {filters.length > 0 && (
                <FilterSheet
                    isOpen={isFilterOpen}
                    onOpenChange={setIsFilterOpen}
                    title="Filter Data"
                    description="Persempit hasil pencarian data."
                    categories={filters}
                    activeFilters={activeFilters}
                    onFilterChange={(key, value) => {
                        if (onFilterChange) {
                            // Extract values if it's a toggle, or pass directly
                            onFilterChange({ ...activeFilters, [key]: value });
                        }
                    }}
                    onReset={() => onFilterChange?.(Object.keys(activeFilters).reduce((acc, key) => ({ ...acc, [key]: [] }), {}))}
                    totalResults={pagination?.total}
                />
            )}
        </div>
    );
}
