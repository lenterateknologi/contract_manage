import * as React from 'react';
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/buttons/Button';
import { Checkbox } from '@/components/ui/selection/Checkbox';
import { SearchInput } from '@/components/ui/inputs/SearchInput';
import { useDebounce } from '@/hooks/use-debounce';
import { FilterPopover } from '@/components/ui/selection/FilterPopover';
import LoadingLottie from '@/components/ui/feedback/LoadingLottie';
import { router } from '@inertiajs/react';
import { ConfirmationModal } from '@/components/ui/dialogs/ConfirmationModal';

/**
 * Unified Column Configuration
 */
export interface Column<T> {
    header: React.ReactNode;
    accessorKey: keyof T | string;
    cell?: (row: T) => React.ReactNode;
    className?: string;
    sortable?: boolean;
}

/**
 * Unified Table Props satisfying all modules
 */
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
    bulkActions?: any; // Component or Array of action objects
    searchKey?: string;
    searchPlaceholder?: string;
    searchValue?: string;
    onSearchChange?: (value: string) => void;

    // Filtering integration
    filters?: any[];
    activeFilters?: Record<string, any>;
    onFilterChange?: (filters: Record<string, any>) => void;

    // Layout & Extras
    headerActions?: React.ReactNode;
    rowActions?: (row: T) => React.ReactNode;
    borderless?: boolean;
    skeleton?: React.ReactNode;

    // Sorting (Server-side)
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
    onSortChange?: (sortBy: string, sortDir: 'asc' | 'desc') => void;
    isRowSelectable?: (row: T) => boolean;
}

/**
 * Unified Data Table Scaffold
 * Primary structural reference: TableContract style
 * Premium aesthetics, lightened typography, centralized logic.
 */
export function DataTable<T extends Record<string, any>>({
    title,
    columns,
    data = [],
    loading = false,
    pagination,
    onRowClick,
    onSelectionChange,
    selectedRows = [],
    bulkActions,
    searchKey = "name",
    searchPlaceholder = "Cari data...",
    searchValue = "",
    onSearchChange,
    filters = [],
    activeFilters = {},
    onFilterChange,
    headerActions,
    rowActions,
    borderless = false,
    skeleton,
    sortBy,
    sortDir,
    onSortChange,
    isRowSelectable,
}: DataTableProps<T>) {

    const [localPerPage, setLocalPerPage] = React.useState(pagination?.perPage || 15);
    const [localSearch, setLocalSearch] = React.useState(searchValue);
    const debouncedSearch = useDebounce(localSearch, 500);
    const [internalSelectedRows, setInternalSelectedRows] = React.useState<T[]>([]);
    const [confirmAction, setConfirmAction] = React.useState<{
        label: string;
        onClick: () => void;
        count: number;
    } | null>(null);

    const hasSelectionFromProps = typeof onSelectionChange === 'function';
    const activeSelectedRows = hasSelectionFromProps ? selectedRows : internalSelectedRows;

    // Sync local per page when prop changes
    React.useEffect(() => {
        if (pagination?.perPage) setLocalPerPage(pagination.perPage);
    }, [pagination?.perPage]);

    // Sync local search when prop changes
    React.useEffect(() => {
        setLocalSearch(searchValue);
    }, [searchValue]);

    // Trigger debounced search callback
    React.useEffect(() => {
        if (debouncedSearch !== (searchValue || '')) {
            onSearchChange?.(debouncedSearch);
        }
    }, [debouncedSearch, onSearchChange, searchValue]);

    const handleSelectAll = (checked: boolean) => {
        const selectable = isRowSelectable ? data.filter(isRowSelectable) : data;
        const value = checked ? selectable : [];
        if (hasSelectionFromProps) onSelectionChange?.(value);
        else setInternalSelectedRows(value);
    };

    const handleSelectRow = (row: T, checked: boolean) => {
        let updated;
        if (checked) {
            updated = [...activeSelectedRows, row];
        } else {
            updated = activeSelectedRows.filter((r) => r.id !== row.id);
        }

        if (hasSelectionFromProps) onSelectionChange?.(updated);
        else setInternalSelectedRows(updated);
    };

    const isAllSelected = data.length > 0 && activeSelectedRows.length === data.length;
    const filterKeys = React.useMemo(() => filters.map(f => f.key), [filters]);
    const activeCount = React.useMemo(() => {
        let count = 0;
        filterKeys.forEach(key => {
            const val = activeFilters[key];
            if (Array.isArray(val)) {
                count += val.filter(v => v !== '' && v !== null).length;
            } else if (val !== undefined && val !== '' && val !== null) {
                count += 1;
            }
        });
        return count;
    }, [activeFilters, filterKeys]);

    // Fallback client-side filter
    const displayData = React.useMemo(() => {
        if (onSearchChange || !localSearch) return data;
        const query = localSearch.toLowerCase();
        return data.filter((row) => {
            const val = row[searchKey];
            if (typeof val === 'string') return val.toLowerCase().includes(query);
            return false;
        });
    }, [data, localSearch, searchKey, onSearchChange]);

    return (
        <div className="flex flex-col flex-1 min-h-0 h-full antialiased text-foreground select-none animate-in fade-in duration-200">
            {/* ponytail: Bulk Actions Toolbar between Header and Table */}
            {bulkActions && activeSelectedRows.length > 0 && (
                <div className="flex items-center justify-between gap-3 px-4 py-2 bg-primary/5 dark:bg-primary/10 border-b border-primary/15 dark:border-primary/20 animate-in slide-in-from-top-1 duration-150 shrink-0">
                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-md shadow-xs">
                            {activeSelectedRows.length}
                        </span>
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
                            data dipilih
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        {typeof bulkActions === 'function' ? bulkActions(activeSelectedRows) : bulkActions}
                    </div>
                </div>
            )}

            {/* --- TABLE CONTENT AREA --- */}
            <div className={cn(
                "flex-1 min-h-0 bg-surface-base/40 backdrop-blur-sm flex flex-col overflow-hidden",
            )}>
                <div className="flex-1 overflow-auto custom-scrollbar min-h-0">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead className="bg-primary dark:bg-zinc-800/90 text-white dark:text-zinc-200">
                            <tr className="h-11 border-b border-primary/20 dark:border-zinc-700/80 select-none bg-primary dark:bg-zinc-800/90 text-white dark:text-zinc-200">
                                {onSelectionChange && (
                                    <th className="h-11 py-2 px-4 w-10 sticky top-0 z-10 bg-primary dark:bg-zinc-800/90 text-white dark:text-zinc-200 align-middle">
                                        <Checkbox
                                            checked={isAllSelected}
                                            onCheckedChange={handleSelectAll}
                                            className="border-white/50 dark:border-zinc-500 data-[state=checked]:bg-white data-[state=checked]:text-primary"
                                        />
                                    </th>
                                )}
                                {columns.map((col, idx) => {
                                    const isSortable = col.sortable;
                                    const isSorted = sortBy === col.accessorKey;
                                    return (
                                        <th
                                            key={idx}
                                            className={cn(
                                                "h-11 py-2 px-4 text-[11px] font-bold uppercase text-white dark:text-zinc-200 select-none sticky top-0 z-10 bg-primary dark:bg-zinc-800/90 border-b border-primary/20 dark:border-zinc-700/80 align-middle",
                                                isSortable && "cursor-pointer hover:text-white/80 dark:hover:text-white transition-colors",
                                                col.className
                                            )}
                                            onClick={() => {
                                                if (isSortable && onSortChange) {
                                                    const nextDir = isSorted && sortDir === 'asc' ? 'desc' : 'asc';
                                                    onSortChange(col.accessorKey as string, nextDir);
                                                }
                                            }}
                                        >
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-white dark:text-zinc-200 font-bold">{col.header}</span>
                                                {isSortable && (
                                                    <span className="flex flex-col text-[8px] leading-[6px] opacity-80">
                                                        <span className={cn(isSorted && sortDir === 'asc' ? "text-white dark:text-white font-bold" : "text-white/50 dark:text-zinc-500")}>▲</span>
                                                        <span className={cn(isSorted && sortDir === 'desc' ? "text-white dark:text-white font-bold" : "text-white/50 dark:text-zinc-500")}>▼</span>
                                                    </span>
                                                )}
                                            </div>
                                        </th>
                                    );
                                })}
                                {rowActions && <th className="h-11 py-2 px-2 w-14 text-center text-[11px] font-bold uppercase text-white dark:text-zinc-200 select-none sticky top-0 z-10 bg-primary dark:bg-zinc-800/90 border-b border-primary/20 dark:border-zinc-700/80 align-middle">Aksi</th>}
                            </tr>
                        </thead>
                        <tbody className="relative">
                            {loading && (
                                <tr>
                                    <td colSpan={columns.length + (onSelectionChange ? 1 : 0) + (rowActions ? 1 : 0)} className="p-0">
                                        {skeleton ? (
                                            <div className="animate-in fade-in duration-500">{skeleton}</div>
                                        ) : (
                                            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-surface-base/80 backdrop-blur-sm py-10 gap-3">
                                                <LoadingLottie width={80} height={80} />
                                                <p className="text-xs font-semibold uppercase tracking-wide text-primary animate-pulse">Memuat data...</p>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            )}

                            {displayData.length === 0 && !loading ? (
                                <tr>
                                    <td colSpan={columns.length + (onSelectionChange ? 1 : 0) + (rowActions ? 1 : 0)} className="p-16 text-center">
                                        <div className="flex flex-col items-center gap-3 opacity-40 select-none">
                                            <Search size={40} strokeWidth={1} className="text-text-desc" />
                                            <p className="text-xs font-medium uppercase  text-text-desc">Tidak ada data ditemukan</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                displayData.map((row, rowIdx) => {
                                    if (row.isParent) {
                                        return (
                                            <tr
                                                key={row.id || rowIdx}
                                                onClick={() => onRowClick?.(row)}
                                                className="border-y border-surface-border/40 transition-all hover:bg-surface-muted/30 cursor-pointer group select-none bg-surface-muted/20"
                                            >
                                                <td
                                                    colSpan={columns.length + (onSelectionChange ? 1 : 0) + (rowActions ? 1 : 0)}
                                                    className="py-2 px-4 align-middle text-sm font-semibold text-text-main"
                                                >
                                                    {columns[0].cell ? columns[0].cell(row) : (row.name || '')}
                                                </td>
                                            </tr>
                                        );
                                    }
                                    return (
                                        <tr
                                            key={row.id || rowIdx}
                                            onClick={() => onRowClick?.(row)}
                                            className={cn(
                                                "border-b border-surface-border/30 transition-all hover:bg-surface-muted/30 cursor-pointer group select-none",
                                                activeSelectedRows.some(r => r.id === row.id) ? "bg-surface-muted/50" : ""
                                            )}
                                        >
                                            {onSelectionChange && (
                                                <td className="py-3.5 px-4 w-10" onClick={(e) => e.stopPropagation()}>
                                                    {(!isRowSelectable || isRowSelectable(row)) ? (
                                                        <Checkbox
                                                            checked={activeSelectedRows.some(r => r.id === row.id)}
                                                            onCheckedChange={(checked) => handleSelectRow(row, !!checked)}
                                                            className="border-surface-border"
                                                        />
                                                    ) : (
                                                        <span className="text-text-soft/20 text-xs select-none flex items-center justify-center font-bold">—</span>
                                                    )}
                                                </td>
                                            )}
                                            {columns.map((col, colIdx) => (
                                                <td key={colIdx} className={cn("py-3.5 px-4 align-middle text-sm font-normal text-text-main", col.className)}>
                                                    {col.cell ? col.cell(row) : ((col.accessorKey as string).split('.').reduce((acc: any, part: string) => acc && acc[part], row) as React.ReactNode)}
                                                </td>
                                            ))}
                                            {rowActions && (
                                                <td className="py-2 px-2 w-14 text-center align-middle" onClick={(e) => e.stopPropagation()}>
                                                    {rowActions(row)}
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- PAGINATION FOOTER --- */}
            {pagination && (
                <div className="flex flex-col sm:flex-row ml-8 mr-8 items-center justify-between gap-4 px-1 py-2 select-none animate-in fade-in duration-200">
                    <div className="flex items-center gap-3 order-2 sm:order-1">
                        <span className="text-xs font-medium text-text-desc uppercase">
                            Menampilkan <span className="font-medium text-text-main">{displayData.length}</span> dari <span className="font-medium text-text-main">{pagination.total}</span> data
                        </span>
                    </div>

                    <div className="flex items-center gap-4 order-1 sm:order-2">
                        <div className="flex items-center gap-2">
                            <select
                                className="bg-surface-base/60 border border-surface-border/80 rounded-xl text-xs font-medium text-text-main px-3 py-1.5 outline-none focus:border-primary transition-all cursor-pointer shadow-sm select-none"
                                value={localPerPage}
                                onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setLocalPerPage(val);
                                    pagination.onPerPageChange?.(val);
                                }}
                            >
                                {[10, 25, 50, 100, 500, 1000, 9999].map(n => (
                                    <option key={n} value={n}>{n}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center gap-1.5">
                            <Button
                                variant="white"
                                size="icon"
                                disabled={pagination.currentPage === 1}
                                onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
                                className="h-9 w-9 rounded-xl border border-surface-border/80 hover:bg-surface-muted"
                            >
                                <ChevronLeft className="h-4 w-4 text-text-main" />
                            </Button>

                            <div className="flex items-center gap-2 px-3 h-9 bg-surface-muted/60 rounded-xl border border-surface-border/40">
                                <span className="text-xs font-medium text-primary">{pagination.currentPage}</span>
                                <span className="text-xs font-medium text-text-soft">/</span>
                                <span className="text-xs font-medium text-primary">{pagination.lastPage || 1}</span>
                            </div>

                            <Button
                                variant="white"
                                size="icon"
                                disabled={pagination.currentPage === pagination.lastPage || pagination.lastPage === 0}
                                onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
                                className="h-9 w-9 rounded-xl border border-surface-border/80 hover:bg-surface-muted"
                            >
                                <ChevronRight className="h-4 w-4 text-text-main" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}


        </div>
    );
}
