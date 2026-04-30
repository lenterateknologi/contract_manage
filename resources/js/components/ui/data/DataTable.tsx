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
        <div className="flex flex-col gap-3 antialiased px-2 py-5 bg-white">
            {/* Premium Header Section - More Compact */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-1 mb-1">
                <div className="space-y-0.5">
                {title && <h2 className="text-sm font-semibold tracking-tight text-sidebar-primary uppercase leading-none font-sans">{title}</h2>}
                    <div className="flex items-center gap-2">
                        <div className="h-0.5 w-8 bg-sidebar-primary/30 rounded-full" />
                        <span className="text-[8px] font-bold tracking-[0.2em] text-sidebar-foreground/30 uppercase">Repositori Data</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {onSearchChange && (
                        <div className="w-full md:w-64">
                                <SearchInput
                                    placeholder={searchPlaceholder}
                                    value={searchValue}
                                    onChange={(e) => onSearchChange?.(e.target.value)}
                                    className="h-9 bg-sidebar-accent border-sidebar-border text-[11px]"
                                />
                            </div>
                    )}

                    {filters.length > 0 && (
                        <Button
                                variant="outline"
                                onClick={() => setIsFilterOpen(true)}
                                className={cn(
                                    "h-9 px-3.5 rounded-xl border-sidebar-border gap-2 text-[10px] font-semibold uppercase tracking-widest transition-all font-sans",
                                    activeCount > 0
                                        ? "bg-sidebar-primary text-white border-sidebar-primary shadow-md shadow-sidebar-primary/20"
                                        : "bg-sidebar-accent hover:border-sidebar-primary/30"
                                )}
                            >
                                <SlidersHorizontal size={13} />
                                Filter
                                {activeCount > 0 && <span className="ml-1 h-4 min-w-[16px] px-1 flex items-center justify-center bg-white text-sidebar-primary rounded-full text-[8px] font-bold">{activeCount}</span>}
                            </Button>
                    )}

                    {headerActions}
                </div>
            </div>

            {/* Bulk Actions Bar - More Compact */}
            {selectedRows.length > 0 && bulkActions.length > 0 && (
                <div className="flex items-center justify-between p-2 bg-sidebar-primary rounded-xl shadow-xl animate-in slide-in-from-top-2 duration-300 mx-1">
                    <div className="flex items-center gap-3 pl-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                        <span className="text-[9px] font-semibold text-white uppercase tracking-[0.15em] font-sans">
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
                                    "h-8 px-4 rounded-lg text-[9px] font-semibold uppercase tracking-widest transition-all font-sans",
                                    action.variant === 'destructive'
                                        ? "bg-rose-500 text-white hover:bg-rose-600 border-none shadow-sm"
                                        : "text-white hover:bg-white/10"
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
            <div className="rounded-2xl border border-sidebar-border overflow-hidden shadow-sm">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="border-b border-sidebar-border/60 bg-sidebar-accent/50">
                                {onSelectionChange && (
                                    <th className="p-3 w-10">
                                            <Checkbox
                                                checked={isAllSelected}
                                                onCheckedChange={handleSelectAll}
                                                className="border-sidebar-border"
                                            />
                                        </th>
                                )}
                                {columns.map((col, idx) => (
                                    <th
                                            key={idx}
                                            className={cn(
                                                "p-3 text-[9px] font-bold uppercase tracking-[0.2em] text-sidebar-foreground/40 font-sans",
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
                                        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm py-10 gap-3">
                                            <LoadingLottie width={80} height={80} />
                                            <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-sidebar-primary animate-pulse font-sans">Memuat data...</p>
                                        </div>
                                    </td>
                                </tr>
                            )}

                            {data.length === 0 && !loading ? (
                                <tr>
                                    <td colSpan={columns.length + (onSelectionChange ? 1 : 0)} className="p-16 text-center">
                                        <div className="flex flex-col items-center gap-3 opacity-20">
                                            <Search size={40} strokeWidth={1} />
                                            <p className="text-[10px] font-semibold uppercase tracking-widest font-sans text-sidebar-foreground">Tidak ada data</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                data.map((row, rowIdx) => (
                                    <tr
                                        key={row.id || rowIdx}
                                        onClick={() => onRowClick?.(row)}
                                        className={cn(
                                            "border-b border-sidebar-border/30 transition-all hover:bg-sidebar-accent/40 cursor-pointer group",
                                            selectedRows.some(r => r.id === row.id) ? "bg-sidebar-accent" : ""
                                        )}
                                    >
                                        {onSelectionChange && (
                                            <td className="p-3 w-10" onClick={(e) => e.stopPropagation()}>
                                                <Checkbox
                                                    checked={selectedRows.some(r => r.id === row.id)}
                                                    onCheckedChange={(checked) => handleSelectRow(row, !!checked)}
                                                    className="border-sidebar-border"
                                                />
                                            </td>
                                        )}
                                        {columns.map((col, colIdx) => (
                                            <td key={colIdx} className={cn("p-3 align-middle text-[12px] font-medium text-sidebar-foreground/80 font-sans", col.className)}>
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
                        <span className="text-[10px] font-medium text-sidebar-foreground/30 tracking-tight font-sans">
                            Menampilkan <span className="font-bold text-sidebar-foreground">{data.length}</span> dari <span className="font-bold text-sidebar-foreground">{pagination.total}</span> data
                        </span>
                    </div>

                    <div className="flex items-center gap-4 order-1 sm:order-2">
                        {pagination.onPerPageChange && (
                            <div className="flex items-center gap-2 mr-2">
                                <span className="text-[9px] font-semibold uppercase text-sidebar-foreground/30 tracking-widest font-sans">Baris:</span>
                                <select
                                    className="bg-sidebar-accent border border-sidebar-border rounded-lg text-[10px] font-semibold text-sidebar-foreground px-2 py-1 outline-none focus:border-sidebar-primary transition-all cursor-pointer font-sans"
                                    value={pagination.perPage || 10}
                                    onChange={(e) => pagination.onPerPageChange?.(Number(e.target.value))}
                                >
                                    {[10, 25, 50, 100].map(n => (
                                        <option key={n} value={n}>{n}</option>
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
                                className="h-8 px-3.5 flex items-center gap-1.5 disabled:opacity-30 text-[9px] font-semibold uppercase tracking-widest border-sidebar-border font-sans"
                            >
                                <ChevronLeft className="h-3 w-3" /> Sebelumnya
                            </Button>

                            <div className="flex items-center gap-2 px-3 h-8 bg-sidebar-accent rounded-lg border border-sidebar-border">
                                <span className="text-[10px] font-bold text-sidebar-primary font-sans">{pagination.currentPage}</span>
                                <span className="text-[9px] font-bold text-sidebar-foreground/20">/</span>
                                <span className="text-[10px] font-bold text-sidebar-primary font-sans">{pagination.lastPage}</span>
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                disabled={pagination.currentPage === pagination.lastPage}
                                onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
                                className="h-8 px-3.5 flex items-center gap-1.5 disabled:opacity-30 text-[9px] font-semibold uppercase tracking-widest border-sidebar-border font-sans"
                            >
                                Berikutnya <ChevronRight className="h-3 w-3" />
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
