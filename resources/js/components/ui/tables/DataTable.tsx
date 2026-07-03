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
}: DataTableProps<T>) {

    const [localPerPage, setLocalPerPage] = React.useState(pagination?.perPage || 10);
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
        const value = checked ? data : [];
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
        <div className="flex flex-col gap-0 antialiased text-foreground select-none animate-in fade-in duration-200">
            {/* Title display */}
            {title && (
                <div className="ml-5 mr-5">
                    <div className="flex items-center gap-4">
                        <div>
                            <h1 className="text-lg font-bold text-text-main">
                                {title}
                            </h1>
                            <p className="text-xs text-text-soft">
                                Kelola data master, konfigurasi, dan otorisasi modul
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* --- TOP HEADER SECTION --- */}
            {(title || onSearchChange || localSearch !== undefined || headerActions || filters.length > 0 || pagination) && (
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-1 ml-5 mr-5">
                    {/* Left side: Search input, Filter & Pagination */}
                    <div className="flex items-center gap-3">
                        {onSearchChange !== undefined && (
                            <div className="w-full md:w-96">
                                <SearchInput
                                    placeholder={searchPlaceholder}
                                    value={localSearch}
                                    onChange={(e) => setLocalSearch(e.target.value)}
                                />
                            </div>
                        )}

                        {filters.length > 0 && (
                            <FilterPopover
                                categories={filters}
                                activeFilters={activeFilters}
                                onFilterChange={(key, value) => {
                                    if (onFilterChange) {
                                        onFilterChange({ ...activeFilters, [key]: value });
                                    }
                                }}
                                onReset={() => onFilterChange?.(Object.keys(activeFilters).reduce((acc, key) => ({ ...acc, [key]: [] }), {}))}
                                totalResults={pagination?.total}
                            >
                                <Button
                                    variant={activeCount > 0 ? "primary" : "white"}
                                    size="icon"
                                    className="relative h-10 w-10 rounded-lg animate-all duration-200 shadow-none"
                                    title="Filter Data"
                                >
                                    <SlidersHorizontal size={14} />
                                    {activeCount > 0 && (
                                        <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-md px-1 text-[8px] font-bold bg-primary text-primary-foreground ring-2 ring-surface-base">
                                            {activeCount}
                                        </span>
                                    )}
                                </Button>
                            </FilterPopover>
                        )}

                        {/* ponytail: inline pagination controls next to filters */}
                        {pagination && (
                            <div className="flex items-center gap-2 select-none">
                                <Button
                                    variant="white"
                                    size="icon"
                                    disabled={pagination.currentPage === 1}
                                    onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
                                    className="h-10 w-10 rounded-lg border border-surface-border/80 hover:bg-surface-muted shadow-none shrink-0"
                                    title="Halaman Sebelumnya"
                                >
                                    <ChevronLeft className="h-4 w-4 text-text-main" />
                                </Button>

                                <div className="flex items-center gap-2 px-3 h-10 bg-surface-muted/60 rounded-lg border border-surface-border/40 shrink-0">
                                    <span className="text-xs font-medium text-primary">{pagination.currentPage}</span>
                                    <span className="text-xs font-medium text-text-soft">/</span>
                                    <span className="text-xs font-medium text-primary">{pagination.lastPage || 1}</span>
                                </div>

                                <Button
                                    variant="white"
                                    size="icon"
                                    disabled={pagination.currentPage === pagination.lastPage || pagination.lastPage === 0}
                                    onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
                                    className="h-10 w-10 rounded-lg border border-surface-border/80 hover:bg-surface-muted shadow-none shrink-0"
                                    title="Halaman Berikutnya"
                                >
                                    <ChevronRight className="h-4 w-4 text-text-main" />
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Right side: other actions */}
                    {headerActions && (
                        <div className="flex items-center gap-2 ml-auto">
                            {headerActions}
                        </div>
                    )}
                </div>
            )}

            {/* --- BULK ACTIONS HUD --- */}
            {activeSelectedRows.length > 0 && bulkActions && (
                <div className="flex items-center justify-between p-3 bg-primary! rounded-2xl shadow-lg border border-primary/20 animate-in slide-in-from-top-2 duration-300 mx-1" style={{ backgroundColor: 'var(--primary)' }}>
                    <div className="flex items-center gap-3 pl-2">
                        <div className="h-2 w-2 rounded-full bg-primary-foreground animate-pulse" />
                        <span className="text-xs font-semibold text-primary-foreground uppercase tracking-wide">
                            {activeSelectedRows.length} Terpilih
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        {typeof bulkActions === 'function' ? bulkActions(activeSelectedRows) : bulkActions}
                    </div>
                </div>
            )}

            {/* --- TABLE CONTENT AREA --- */}
            <div className={cn(
                "overflow-hidden bg-surface-base/40 backdrop-blur-sm",

            )}>
                <div className="overflow-x-auto custom-scrollbar min-h-[calc(100vh-280px)]">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="border-b border-primary/20 bg-primary! select-none text-white" style={{ backgroundColor: 'var(--primary)' }}>
                                {onSelectionChange && (
                                    <th className="py-3.5 px-4 w-10">
                                        <Checkbox
                                            checked={isAllSelected}
                                            onCheckedChange={handleSelectAll}
                                            className="border-white/30 data-[state=checked]:bg-white data-[state=checked]:text-primary"
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
                                                "py-3.5 px-4 text-[11px] font-bold uppercase text-white select-none",
                                                isSortable && "cursor-pointer transition-colors",
                                                col.className
                                            )}
                                            onClick={() => {
                                                if (isSortable && onSortChange) {
                                                    const nextDir = isSorted && sortDir === 'asc' ? 'desc' : 'asc';
                                                    onSortChange(col.accessorKey as string, nextDir);
                                                }
                                            }}
                                        >
                                            <div className="flex items-center gap-1.5 text-white">
                                                <span>{col.header}</span>
                                            </div>
                                        </th>
                                    );
                                })}
                                {rowActions && <th className="py-3.5 px-4 w-24 text-right text-[11px] font-bold uppercase text-white select-none">Aksi</th>}
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
                                displayData.map((row, rowIdx) => (
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
                                                <Checkbox
                                                    checked={activeSelectedRows.some(r => r.id === row.id)}
                                                    onCheckedChange={(checked) => handleSelectRow(row, !!checked)}
                                                    className="border-surface-border"
                                                />
                                            </td>
                                        )}
                                        {columns.map((col, colIdx) => (
                                            <td key={colIdx} className={cn("py-3.5 px-4 align-middle text-sm font-normal text-text-main", col.className)}>
                                                {col.cell ? col.cell(row) : ((col.accessorKey as string).split('.').reduce((acc: any, part: string) => acc && acc[part], row) as React.ReactNode)}
                                            </td>
                                        ))}
                                        {rowActions && (
                                            <td className="py-3.5 px-4 text-right align-middle" onClick={(e) => e.stopPropagation()}>
                                                {rowActions(row)}
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ponytail: pagination footer removed from here to clean up the bottom layout */}


        </div>
    );
}
