import * as React from 'react';
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/base/Button';
import { Checkbox } from '@/components/ui/base/Checkbox';
import { SearchInput } from '@/components/ui/forms/SearchInput';
import { useDebounce } from '@/hooks/use-debounce';
import { FilterSheet } from './FilterSheet';
import LoadingLottie from '@/components/ui/feedback/LoadingLottie';
import { router } from '@inertiajs/react';
import { ConfirmationModal } from '@/components/ui/overlays/ConfirmationModal';

export interface Column<T> {
    header: string;
    accessorKey: keyof T | string;
    cell?: (row: T) => React.ReactNode;
    className?: string;
    sortable?: boolean;
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
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
    onSortChange?: (sortBy: string, sortDir: 'asc' | 'desc') => void;
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
    sortBy,
    sortDir,
    onSortChange,
}: TableMasterDataProps<T>) {
    const [isFilterOpen, setIsFilterOpen] = React.useState(false);
    const [localPerPage, setLocalPerPage] = React.useState(pagination?.perPage || 10);
    const [localSearch, setLocalSearch] = React.useState(searchValue);
    const debouncedSearch = useDebounce(localSearch, 500);
    const [internalSelectedRows, setInternalSelectedRows] = React.useState<T[]>([]);
    const [confirmAction, setConfirmAction] = React.useState<{
        label: string;
        onClick: () => void;
        count: number;
    } | null>(null);

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

    // Trigger onSearchChange when debounced value changes
    React.useEffect(() => {
        if (debouncedSearch !== (searchValue || '')) {
            onSearchChange?.(debouncedSearch);
        }
    }, [debouncedSearch, onSearchChange, searchValue]);

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
                            <h2 className="text-base font-semibold tracking-tight text-text-main uppercase">{title}</h2>
                        </div>
                    )}

                    <div className="flex items-center gap-2 ml-auto">
                        {(onSearchChange || !onSearchChange) && (
                            <div className="w-full md:w-64">
                                <SearchInput
                                    placeholder={searchPlaceholder}
                                    value={localSearch}
                                    onChange={(e) => setLocalSearch(e.target.value)}
                                />
                            </div>
                        )}

                        {filters.length > 0 && (
                            <Button
                                variant={activeCount > 0 ? "primary" : "white"}
                                onClick={() => setIsFilterOpen(true)}
                                className="relative"
                            >
                                <SlidersHorizontal size={14} />
                                Filter
                                {activeCount > 0 && (
                                    <span className={cn(
                                        "ml-1 flex h-4 min-w-[16px] items-center justify-center rounded-md px-1 text-[9px] font-semibold bg-primary-foreground text-primary",
                                    )}>
                                        {activeCount}
                                    </span>
                                )}
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
                        <span className="text-xs font-black text-primary-foreground uppercase tracking-wide">
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
                                    onClick={() => {
                                        const ids = activeSelectedRows.map(r => r.id);
                                        if (action.variant === 'destructive') {
                                            setConfirmAction({
                                                label: action.label,
                                                onClick: () => action.onClick?.(ids),
                                                count: ids.length
                                            });
                                        } else {
                                            action.onClick?.(ids);
                                        }
                                    }}
                                    className="h-8 px-3 text-xs font-semibold uppercase tracking-wide bg-primary-foreground text-primary hover:bg-primary-foreground/90 rounded-xl"
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
                "overflow-hidden bg-surface-base/40 backdrop-blur-sm",
                borderless ? "rounded-none border-0 shadow-none" : "rounded-2xl border border-surface-border/60 shadow-sm"
            )}>
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="border-b border-surface-border/60 bg-surface-muted/40 backdrop-blur-md select-none">
                                <th className="py-3.5 px-4 w-10">
                                    <Checkbox
                                        checked={isAllSelected}
                                        onCheckedChange={handleSelectAll}
                                        className="border-surface-border data-[state=checked]:bg-primary"
                                    />
                                </th>
                                {columns.map((col, idx) => {
                                    const isSortable = col.sortable;
                                    const isSorted = sortBy === col.accessorKey;
                                    return (
                                        <th
                                            key={idx}
                                            className={cn(
                                                "py-3.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-text-desc select-none",
                                                isSortable && "cursor-pointer hover:text-text-main transition-colors",
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
                                                <span>{col.header}</span>
                                                {isSortable && (
                                                    <span className="flex flex-col text-[8px] leading-[6px] opacity-60">
                                                        <span className={cn(isSorted && sortDir === 'asc' ? "text-primary" : "text-text-soft")}>▲</span>
                                                        <span className={cn(isSorted && sortDir === 'desc' ? "text-primary" : "text-text-soft")}>▼</span>
                                                    </span>
                                                )}
                                            </div>
                                        </th>
                                    );
                                })}
                                {rowActions && <th className="py-3.5 px-4 w-24 text-right text-[11px] font-semibold uppercase tracking-wider text-text-desc select-none">Aksi</th>}
                            </tr>
                        </thead>
                        <tbody className="relative">
                            {loading && (
                                <tr>
                                    <td colSpan={columns.length + 1 + (rowActions ? 1 : 0)} className="p-0">
                                        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-surface-base/80 backdrop-blur-sm py-10 gap-3">
                                            <LoadingLottie width={80} height={80} />
                                            <p className="text-xs font-black uppercase tracking-wide text-primary animate-pulse">Memuat data...</p>
                                        </div>
                                    </td>
                                </tr>
                            )}

                            {filteredData.length === 0 && !loading ? (
                                <tr>
                                    <td colSpan={columns.length + 1 + (rowActions ? 1 : 0)} className="p-16 text-center">
                                        <div className="flex flex-col items-center gap-3 opacity-40 select-none">
                                            <Search size={40} strokeWidth={1} className="text-text-desc" />
                                            <p className="text-xs font-bold uppercase tracking-wider text-text-desc">Tidak ada data ditemukan</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredData.map((row, rowIdx) => (
                                    <tr
                                        key={row.id || rowIdx}
                                        onClick={() => onRowClick?.(row)}
                                        className={cn(
                                            "border-b border-surface-border/30 transition-all hover:bg-surface-muted/30 cursor-pointer group select-none",
                                            activeSelectedRows.some(r => r.id === row.id) ? "bg-surface-muted/50" : ""
                                        )}
                                    >
                                        <td className="py-3.5 px-4 w-10" onClick={(e) => e.stopPropagation()}>
                                            <Checkbox
                                                checked={activeSelectedRows.some(r => r.id === row.id)}
                                                onCheckedChange={(checked) => handleSelectRow(row, !!checked)}
                                                className="border-surface-border"
                                            />
                                        </td>
                                        {columns.map((col, colIdx) => (
                                            <td key={colIdx} className={cn("py-3.5 px-4 align-middle text-sm font-medium text-text-main", col.className)}>
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
                <div className="flex flex-col sm:flex-row ml-8 mr-8 items-center justify-between gap-4 px-1 py-2 select-none animate-in fade-in duration-200">
                    <div className="flex items-center gap-3 order-2 sm:order-1">
                        <span className="text-xs font-medium text-text-desc uppercase">
                            Menampilkan <span className="font-semibold text-text-main">{filteredData.length}</span> dari <span className="font-semibold text-text-main">{pagination.total}</span> baris
                        </span>
                    </div>

                    <div className="flex items-center gap-4 order-1 sm:order-2">
                        <div className="flex items-center gap-2">
                            <select
                                className="bg-surface-base/60 border border-surface-border/80 rounded-xl text-xs font-semibold text-text-main px-3 py-1.5 outline-none focus:border-primary transition-all cursor-pointer shadow-sm select-none"
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
                                className="h-9 px-3.5 flex items-center gap-1.5 disabled:opacity-30 text-xs font-semibold border-surface-border/80 hover:bg-surface-muted"
                            >
                                <ChevronLeft className="h-4 w-4 text-text-main" />
                            </Button>

                            <div className="flex items-center gap-2 px-3 h-9 bg-surface-muted/40 rounded-xl border border-surface-border/60">
                                <span className="text-xs font-semibold text-primary">{pagination.currentPage}</span>
                                <span className="text-xs font-semibold text-text-soft">/</span>
                                <span className="text-xs font-semibold text-primary">{pagination.lastPage || 1}</span>
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                disabled={pagination.currentPage === pagination.lastPage || pagination.lastPage === 0}
                                onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
                                className="h-9 px-3.5 flex items-center gap-1.5 disabled:opacity-30 text-xs font-semibold border-surface-border/80 hover:bg-surface-muted"
                            >
                                <ChevronRight className="h-4 w-4 text-text-main" />
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

            {confirmAction && (
                <ConfirmationModal
                    open={confirmAction !== null}
                    onClose={() => setConfirmAction(null)}
                    onConfirm={() => {
                        const originalConfirm = globalThis.confirm;
                        const originalWindowConfirm = window.confirm;
                        globalThis.confirm = () => true;
                        window.confirm = () => true;
                        try {
                            confirmAction.onClick();
                        } finally {
                            globalThis.confirm = originalConfirm;
                            window.confirm = originalWindowConfirm;
                        }
                        setConfirmAction(null);
                    }}
                    title="Konfirmasi Hapus Massal"
                    description={`Apakah Anda yakin ingin menghapus ${confirmAction.count} data terpilih secara permanen?`}
                    confirmText="Hapus Terpilih"
                    cancelText="Batal"
                    variant="danger"
                />
            )}
        </div>
    );
}
