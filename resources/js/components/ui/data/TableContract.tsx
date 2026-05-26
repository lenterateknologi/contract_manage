import * as React from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/base/Button';
import { Checkbox } from '@/components/ui/base/Checkbox';
import LoadingLottie from '@/components/ui/feedback/LoadingLottie';
import { router } from '@inertiajs/react';

export interface Column<T> {
    header: string;
    accessorKey: keyof T | string;
    cell?: (row: T) => React.ReactNode;
    className?: string;
}

export interface TableContractProps<T> {
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
}

export function TableContract<T extends Record<string, any>>({
    columns,
    data,
    loading = false,
    pagination,
    onRowClick,
    onSelectionChange,
    selectedRows = [],
    bulkActions,
}: TableContractProps<T>) {
    const [localPerPage, setLocalPerPage] = React.useState(pagination?.perPage || 10);

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

    return (
        <div className="flex flex-col gap-4 antialiased text-foreground select-none animate-in fade-in duration-200">
            {/* Bulk Actions Bar */}
            {selectedRows.length > 0 && bulkActions && (
                <div className="flex items-center justify-between p-3 bg-primary rounded-2xl shadow-lg border border-primary/20 animate-in slide-in-from-top-2 duration-300 mx-1">
                    <div className="flex items-center gap-3 pl-2">
                        <div className="h-2 w-2 rounded-full bg-primary-foreground animate-pulse" />
                        <span className="text-xs font-bold text-primary-foreground uppercase tracking-wide">
                            {selectedRows.length} Terpilih
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        {bulkActions}
                    </div>
                </div>
            )}

            {/* Table Container - Integrated into the page background or a soft surface */}
            <div className="overflow-hidden bg-surface-base/40 backdrop-blur-sm  border-surface-border/60 shadow-sm ">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="border-b border-surface-border/60 bg-surface-muted/40 backdrop-blur-md select-none">
                                {onSelectionChange && (
                                    <th className="py-3.5 px-4 w-10">
                                        <Checkbox
                                            checked={isAllSelected}
                                            onCheckedChange={handleSelectAll}
                                            className="border-surface-border data-[state=checked]:bg-primary"
                                        />
                                    </th>
                                )}
                                {columns.map((col, idx) => (
                                    <th
                                        key={idx}
                                        className={cn(
                                            "py-3.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-text-desc select-none",
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
                                        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-surface-base/80 backdrop-blur-sm py-10 gap-3">
                                            <LoadingLottie width={80} height={80} />
                                            <p className="text-xs font-bold uppercase tracking-wide text-primary animate-pulse">Memuat data...</p>
                                        </div>
                                    </td>
                                </tr>
                            )}

                            {data.length === 0 && !loading ? (
                                <tr>
                                    <td colSpan={columns.length + (onSelectionChange ? 1 : 0)} className="p-16 text-center">
                                        <div className="flex flex-col items-center gap-3 opacity-40 select-none">
                                            <Search size={40} strokeWidth={1} className="text-text-desc" />
                                            <p className="text-xs font-semibold uppercase tracking-wider text-text-desc">Tidak ada data ditemukan</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                data.map((row, rowIdx) => (
                                    <tr
                                        key={row.id || rowIdx}
                                        onClick={() => onRowClick?.(row)}
                                        className={cn(
                                            "border-b border-surface-border/30 transition-all hover:bg-surface-muted/30 cursor-pointer group select-none",
                                            selectedRows.some(r => r.id === row.id) ? "bg-surface-muted/50" : ""
                                        )}
                                    >
                                        {onSelectionChange && (
                                            <td className="py-3.5 px-4 w-10" onClick={(e) => e.stopPropagation()}>
                                                <Checkbox
                                                    checked={selectedRows.some(r => r.id === row.id)}
                                                    onCheckedChange={(checked) => handleSelectRow(row, !!checked)}
                                                    className="border-surface-border"
                                                />
                                            </td>
                                        )}
                                        {columns.map((col, colIdx) => (
                                            <td key={colIdx} className={cn("py-3.5 px-4 align-middle text-sm font-medium text-text-main", col.className)}>
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

            {/* Pagination */}
            {pagination && (
                <div className="flex flex-col sm:flex-row ml-8 mr-8 items-center justify-between gap-4 px-1 py-2 select-none animate-in fade-in duration-200">
                    <div className="flex items-center gap-3 order-2 sm:order-1">
                        <span className="text-xs font-medium text-text-desc uppercase">
                            Menampilkan <span className="font-semibold text-text-main">{data.length}</span> dari <span className="font-semibold text-text-main">{pagination.total}</span> data
                        </span>
                    </div>

                    <div className="flex items-center gap-4 order-1 sm:order-2">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-text-desc tracking-wider uppercase">Baris:</span>
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
        </div>
    );
}
