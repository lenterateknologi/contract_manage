import * as React from 'react';
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/base/Button';
import { Checkbox } from '@/components/ui/base/Checkbox';
import { SearchInput } from '@/components/ui/forms/SearchInput';
import { FilterSheet } from './FilterSheet';
import LoadingLottie from '@/components/ui/feedback/LoadingLottie';
import { router } from '@inertiajs/react';

export interface Column<T> {
    header: string;
    accessorKey: keyof T | string;
    cell?: (row: T) => React.ReactNode;
    className?: string;
}

export interface TableMasterDataProps<T> {
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
    bulkActions?: any;
    searchKey?: string;
    searchPlaceholder?: string;
    searchValue?: string;
    onSearchChange?: (value: string) => void;
    filters?: any[];
    activeFilters?: Record<string, any>;
    onFilterChange?: (filters: Record<string, any>) => void;
    headerActions?: React.ReactNode;
    rowActions?: (row: T) => React.ReactNode;
    borderless?: boolean;
}

export function TableMasterData<T extends Record<string, any>>({
    title,
    columns,
    data,
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
}: TableMasterDataProps<T>) {
    const [isFilterOpen, setIsFilterOpen] = React.useState(false);
    const [localPerPage, setLocalPerPage] = React.useState(pagination?.perPage || 10);
    const [localSearch, setLocalSearch] = React.useState(searchValue);
    const [internalSelectedRows, setInternalSelectedRows] = React.useState<T[]>([]);

    const hasSelectionFromProps = typeof onSelectionChange === 'function' && Array.isArray(selectedRows);
    const activeSelectedRows = hasSelectionFromProps ? selectedRows : internalSelectedRows;

    const defaultBulkActions = [
        {
            label: "Hapus Terpilih",
            variant: "destructive",
            onClick: (ids: any[]) => {
                if (globalThis.confirm(`Apakah Anda yakin ingin menghapus ${ids.length} data terpilih?`)) {
                    router.delete(`${globalThis.location.pathname}/bulk-delete`, {
                        data: { ids },
                        onSuccess: () => {
                            if (hasSelectionFromProps) {
                                onSelectionChange?.([]);
                            } else {
                                setInternalSelectedRows([]);
                            }
                        }
                    });
                }
            }
        }
    ];

    const activeBulkActions = bulkActions || defaultBulkActions;

    React.useEffect(() => {
        if (pagination?.perPage) {
            setLocalPerPage(pagination.perPage);
        }
    }, [pagination?.perPage]);

    React.useEffect(() => {
        setLocalSearch(searchValue);
    }, [searchValue]);

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            if (hasSelectionFromProps) {
                onSelectionChange?.(data);
            } else {
                setInternalSelectedRows(data);
            }
        } else {
            if (hasSelectionFromProps) {
                onSelectionChange?.([]);
            } else {
                setInternalSelectedRows([]);
            }
        }
    };

    const handleSelectRow = (row: T, checked: boolean) => {
        if (checked) {
            if (hasSelectionFromProps) {
                onSelectionChange?.([...activeSelectedRows, row]);
            } else {
                setInternalSelectedRows([...activeSelectedRows, row]);
            }
        } else {
            const updated = activeSelectedRows.filter((r) => r.id !== row.id);
            if (hasSelectionFromProps) {
                onSelectionChange?.(updated);
            } else {
                setInternalSelectedRows(updated);
            }
        }
    };

    const isAllSelected = data.length > 0 && activeSelectedRows.length === data.length;

    const activeCount = Object.values(activeFilters).flat().filter(v => v !== '' && v !== null).length;

    // Filter logic for client-side fallback if onSearchChange is not provided
    const filteredData = React.useMemo(() => {
        if (onSearchChange || !localSearch) return data;
        const query = localSearch.toLowerCase();
        return data.filter((row) => {
            const val = row[searchKey];
            if (typeof val === 'string') {
                return val.toLowerCase().includes(query);
            }
            return false;
        });
    }, [data, localSearch, searchKey, onSearchChange]);

    return (
        <div className="flex flex-col gap-4 antialiased text-foreground select-none animate-in fade-in duration-200">
            {/* Premium Header Section without any extra decorative lines */}
            {(title || onSearchChange || localSearch !== undefined || headerActions || filters.length > 0) && (
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-1 mb-1">
                    {title && (
                        <div className="space-y-0.5">
                            <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100">{title}</h2>
                        </div>
                    )}

                    <div className="flex items-center gap-2 ml-auto">
                        {(onSearchChange || !onSearchChange) && (
                            <div className="w-full md:w-64">
                                <SearchInput
                                    placeholder={searchPlaceholder}
                                    value={localSearch}
                                    onChange={(e) => {
                                        const v = e.target.value;
                                        setLocalSearch(v);
                                        onSearchChange?.(v);
                                    }}
                                    className="h-10 bg-card/60 dark:bg-slate-900/60 backdrop-blur-md border border-border/80 dark:border-slate-800/80 text-xs text-foreground placeholder:text-muted-foreground/60 transition-all rounded-xl focus-within:border-primary/50"
                                />
                            </div>
                        )}

                        {filters.length > 0 && (
                            <Button
                                variant={activeCount > 0 ? "primary" : "white"}
                                onClick={() => setIsFilterOpen(true)}
                                className={cn(
                                    "h-10 px-4 rounded-xl gap-2 text-xs font-bold tracking-wide transition-all duration-200 border border-border/80 dark:border-slate-800/80 bg-card dark:bg-slate-900/60 text-foreground shadow-sm hover:bg-muted/60 dark:hover:bg-slate-800/60 hover:border-border hover:shadow-md",
                                    activeCount > 0 && "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 border-0"
                                )}
                            >
                                <SlidersHorizontal size={14} />
                                Filter
                                {activeCount > 0 && <span className="ml-1 h-4 min-w-[16px] px-1 flex items-center justify-center bg-background text-primary rounded-full text-[10px] font-bold">{activeCount}</span>}
                            </Button>
                        )}

                        {headerActions}
                    </div>
                </div>
            )}

            {/* Bulk Actions Bar */}
            {activeSelectedRows.length > 0 && activeBulkActions && (
                <div className="flex items-center justify-between p-3 bg-primary rounded-2xl shadow-lg border border-primary/20 animate-in slide-in-from-top-2 duration-300 mx-1">
                    <div className="flex items-center gap-3 pl-2">
                        <div className="h-2 w-2 rounded-full bg-primary-foreground animate-pulse" />
                        <span className="text-xs font-bold text-primary-foreground uppercase tracking-wide">
                            {activeSelectedRows.length} Terpilih
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        {Array.isArray(activeBulkActions) ? activeBulkActions.map((action: any, actionIdx: number) => {
                            const Icon = action.icon;
                            return (
                                <Button
                                    key={actionIdx}
                                    variant={action.variant || 'default'}
                                    size="sm"
                                    onClick={() => action.onClick?.(activeSelectedRows.map(r => r.id))}
                                    className="h-8 px-3 text-xs font-bold uppercase tracking-wide bg-primary-foreground text-primary hover:bg-primary-foreground/90 rounded-xl"
                                >
                                    {Icon && <Icon className="mr-1.5 h-3.5 w-3.5" />}
                                    {action.label}
                                </Button>
                            );
                        }) : activeBulkActions}
                    </div>
                </div>
            )}

            {/* Table Container */}
            <div className={cn(
                "overflow-hidden bg-card/40 dark:bg-slate-900/20 backdrop-blur-sm",
                borderless ? "rounded-none border-0 shadow-none" : "rounded-2xl border border-border/60 dark:border-slate-800/60 shadow-sm"
            )}>
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="border-b border-border/60 dark:border-slate-800/60 bg-muted/40 dark:bg-slate-800/40 backdrop-blur-md select-none">
                                <th className="py-3.5 px-4 w-10">
                                    <Checkbox
                                        checked={isAllSelected}
                                        onCheckedChange={handleSelectAll}
                                        className="border-border dark:border-slate-700 data-[state=checked]:bg-primary"
                                    />
                                </th>
                                {columns.map((col, idx) => (
                                    <th
                                        key={idx}
                                        className={cn(
                                            "py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-400 select-none",
                                            col.className
                                        )}
                                    >
                                        {col.header}
                                    </th>
                                ))}
                                {rowActions && <th className="py-3.5 px-4 w-24 text-right text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-400 select-none">Aksi</th>}
                            </tr>
                        </thead>
                        <tbody className="relative">
                            {loading && (
                                <tr>
                                    <td colSpan={columns.length + 1 + (rowActions ? 1 : 0)} className="p-0">
                                        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm py-10 gap-3">
                                            <LoadingLottie width={80} height={80} />
                                            <p className="text-xs font-bold uppercase tracking-wide text-primary animate-pulse">Memuat data...</p>
                                        </div>
                                    </td>
                                </tr>
                            )}

                            {filteredData.length === 0 && !loading ? (
                                <tr>
                                    <td colSpan={columns.length + 1 + (rowActions ? 1 : 0)} className="p-16 text-center">
                                        <div className="flex flex-col items-center gap-3 opacity-40 dark:opacity-30 select-none">
                                            <Search size={40} strokeWidth={1} className="text-muted-foreground" />
                                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground dark:text-slate-500">Tidak ada data</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredData.map((row, rowIdx) => (
                                    <tr
                                        key={row.id || rowIdx}
                                        onClick={() => onRowClick?.(row)}
                                        className={cn(
                                            "border-b border-border/30 dark:border-slate-800/30 transition-all hover:bg-muted/30 dark:hover:bg-slate-800/30 cursor-pointer group select-none",
                                            activeSelectedRows.some(r => r.id === row.id) ? "bg-muted/50 dark:bg-slate-800/50" : ""
                                        )}
                                    >
                                        <td className="py-3.5 px-4 w-10" onClick={(e) => e.stopPropagation()}>
                                            <Checkbox
                                                checked={activeSelectedRows.some(r => r.id === row.id)}
                                                onCheckedChange={(checked) => handleSelectRow(row, !!checked)}
                                                className="border-border dark:border-slate-700"
                                            />
                                        </td>
                                        {columns.map((col, colIdx) => (
                                            <td key={colIdx} className={cn("py-3.5 px-4 align-middle text-sm font-medium text-slate-800 dark:text-slate-200", col.className)}>
                                                {col.cell ? col.cell(row) : (row[col.accessorKey as keyof T] as React.ReactNode)}
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

            {/* Pagination */}
            {pagination && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-1 py-2 select-none animate-in fade-in duration-200">
                    <div className="flex items-center gap-3 order-2 sm:order-1">
                        <span className="text-xs font-medium text-muted-foreground dark:text-slate-400">
                            Menampilkan <span className="font-bold text-foreground dark:text-slate-200">{filteredData.length}</span> dari <span className="font-bold text-foreground dark:text-slate-200">{pagination.total}</span> data
                        </span>
                    </div>

                    <div className="flex items-center gap-4 order-1 sm:order-2">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-muted-foreground dark:text-slate-400 tracking-wide uppercase">Baris:</span>
                            <select
                                className="bg-card dark:bg-slate-900/60 border border-border/80 dark:border-slate-800/80 rounded-xl text-xs font-bold text-foreground px-3 py-1.5 outline-none focus:border-primary transition-all cursor-pointer shadow-sm select-none"
                                value={localPerPage}
                                onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setLocalPerPage(val);
                                    if (pagination.onPerPageChange) {
                                        pagination.onPerPageChange(val);
                                    } else {
                                        const url = new URL(globalThis.location.href);
                                        url.searchParams.set('per_page', String(val));
                                        url.searchParams.set('page', '1');
                                        router.get(url.pathname + url.search, {}, { preserveState: true, preserveScroll: true });
                                    }
                                }}
                            >
                                {[10, 25, 50, 100].map(n => (
                                    <option key={n} value={n}>{n}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center gap-1.5">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={pagination.currentPage === 1}
                                onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
                                className="h-9 px-3.5 flex items-center gap-1.5 disabled:opacity-30 text-xs font-bold border-border/80 dark:border-slate-800/80 hover:bg-muted/60 dark:hover:bg-slate-800/60"
                            >
                                <ChevronLeft className="h-4 w-4 text-slate-700 dark:text-slate-300" />
                            </Button>

                            <div className="flex items-center gap-2 px-3 h-9 bg-muted/40 dark:bg-slate-800/40 rounded-xl border border-border/60 dark:border-slate-800/60">
                                <span className="text-xs font-bold text-primary">{pagination.currentPage}</span>
                                <span className="text-xs font-bold text-muted-foreground/30 dark:text-slate-600">/</span>
                                <span className="text-xs font-bold text-primary">{pagination.lastPage || 1}</span>
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                disabled={pagination.currentPage === pagination.lastPage || pagination.lastPage === 0}
                                onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
                                className="h-9 px-3.5 flex items-center gap-1.5 disabled:opacity-30 text-xs font-bold border-border/80 dark:border-slate-800/80 hover:bg-muted/60 dark:hover:bg-slate-800/60"
                            >
                                <ChevronRight className="h-4 w-4 text-slate-700 dark:text-slate-300" />
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
