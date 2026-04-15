import React, { useState, useMemo } from 'react';
import { 
    ChevronDown, ChevronUp, ChevronsUpDown, 
    Search, Filter, MoreHorizontal, 
    RefreshCcw, ChevronLeft, ChevronRight,
    Loader2, Inbox, Trash2, CheckCircle2
} from 'lucide-react';
import { Button } from './button';
import { Input } from './input';
import { Checkbox } from './checkbox';
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger 
} from './dropdown-menu';
import { cn } from '@/lib/utils';
import { Badge } from './badge';

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

    // Filtering & Searching (Client-side fallback if no server-side info)
    const processedData = useMemo(() => {
        let result = [...data];

        // Client-side search if needed
        if (searchTerm && searchKey) {
            result = result.filter(item => 
                String(item[searchKey]).toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Sorting
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

    const toggleSelectAll = () => {
        if (selectedIds.size === data.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(data.map(getRowId)));
        }
    };

    const toggleSelectRow = (id: string | number) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) newSelected.delete(id);
        else newSelected.add(id);
        setSelectedIds(newSelected);
    };

    return (
        <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Toolbar */}
            <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
                <div className="flex items-center gap-3 flex-1 max-w-md">
                    <div className="relative flex-1">
                        {/* <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input 
                            placeholder={searchPlaceholder} 
                            className="pl-9 h-10 border-slate-200 focus:ring-primary/20 rounded-lg bg-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        /> */}
                    </div>
                    {onRefresh && (
                        <Button variant="outline" size="icon" onClick={onRefresh} disabled={loading} className="shrink-0 h-10 w-10">
                            <RefreshCcw className={cn("h-4 w-4", loading && "animate-spin")} />
                        </Button>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {/* Filters moved to Sidebar */}
                    
                    {headerActions && (
                        <div className="flex items-center gap-2">
                            {headerActions}
                        </div>
                    )}
                    
                    {bulkActions && selectedIds.size > 0 && (
                        <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-200">
                             <div className="h-8 w-[1px] bg-slate-200 mx-1" />
                             {bulkActions(data.filter(row => selectedIds.has(getRowId(row))))}
                        </div>
                    )}
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-auto relative min-h-[400px]">
                {loading && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-20 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 className="h-8 w-8 text-primary animate-spin" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Loading Data...</span>
                        </div>
                    </div>
                )}

                <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 shadow-[0_1px_0_rgba(0,0,0,0.05)]">
                        <tr>
                            {/* <th className="w-10 p-4">
                                <Checkbox 
                                    checked={selectedIds.size === data.length && data.length > 0}
                                    onCheckedChange={toggleSelectAll}
                                />
                            </th> */}
                            {columns.map((col, i) => (
                                <th 
                                    key={i} 
                                    className={cn(
                                        "p-4 text-[10px] font-black uppercase tracking-widest text-slate-500",
                                        col.thClassName
                                    )}
                                >
                                    <div className="flex items-center gap-1.5 group/th">
                                        {col.header}
                                        {col.sortable && (
                                            <button 
                                                onClick={() => handleSort(col.accessorKey as string)}
                                                className="opacity-0 group-hover/th:opacity-100 transition-opacity hover:bg-slate-200 p-1 rounded"
                                            >
                                                {sortConfig.key === col.accessorKey ? (
                                                    sortConfig.direction === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                                                ) : <ChevronsUpDown size={12} />}
                                            </button>
                                        )}
                                    </div>
                                </th>
                            ))}
                            {rowActions && <th className="p-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-500">Aksi</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {processedData.length === 0 && !loading ? (
                            <tr>
                                <td colSpan={columns.length + (rowActions ? 2 : 1)} className="py-20 text-center">
                                    <div className="flex flex-col items-center gap-3 opacity-40">
                                        <Inbox size={40} strokeWidth={1.5} />
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-slate-900">Tidak ada data ditemukan</span>
                                            <span className="text-[11px] font-medium text-slate-500">Coba ubah filter atau kata kunci pencarian Anda</span>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            processedData.map((row, i) => (
                                <React.Fragment key={getRowId(row)}>
                                    <tr 
                                        onClick={() => onRowClick?.(row)}
                                        className={cn(
                                            "hover:bg-slate-50/70 transition-colors group cursor-pointer",
                                            (selectedRowId === getRowId(row) || (isRowExpanded && isRowExpanded(row))) && "bg-primary/5"
                                        )}
                                    >
                                        {/* <td className="p-4 w-10" onClick={e => e.stopPropagation()}>
                                            <Checkbox 
                                                checked={selectedIds.has(getRowId(row))}
                                                onCheckedChange={() => toggleSelectRow(getRowId(row))}
                                            />
                                        </td> */}
                                        {columns.map((col, j) => (
                                            <td key={j} className={cn("p-4 text-[13px] font-medium text-slate-700", col.className)}>
                                                {col.cell ? col.cell(row) : (row[col.accessorKey] || '-')}
                                            </td>
                                        ))}
                                        {rowActions && (
                                            <td className="p-4 text-right" onClick={e => e.stopPropagation()}>
                                                <div className="flex justify-end gap-1 opacity-10 group-hover:opacity-100 transition-opacity">
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

            {/* Footer / Pagination */}
            {pagination && (
                <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4 text-[11px] font-bold text-slate-500 uppercase tracking-tight">
                        <span>Showing {pagination.from}-{pagination.to} of {pagination.total}</span>
                        <div className="flex items-center gap-2 border-l pl-4">
                            <span>Show</span>
                            <select 
                                value={pagination.perPage}
                                onChange={(e) => pagination.onPerPageChange(Number(e.target.value))}
                                className="bg-white border rounded px-1 py-0.5 outline-none focus:border-primary"
                            >
                                {[10, 25, 50, 100].map(v => <option key={v} value={v}>{v}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center gap-1">
                        <Button 
                            variant="outline" 
                            size="icon" 
                            disabled={pagination.currentPage === 1}
                            onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
                            className="h-8 w-8 rounded-lg"
                        >
                            <ChevronLeft size={16} />
                        </Button>
                        
                        {/* Page Numbers - Simplified */}
                        <div className="flex items-center gap-1 mx-2">
                            {Array.from({ length: Math.min(pagination.lastPage, 5) }, (_, i) => {
                                let pageNum = i + 1;
                                // Basic sliding window logic
                                if (pagination.lastPage > 5 && pagination.currentPage > 3) {
                                    pageNum = pagination.currentPage - 3 + i;
                                    if (pageNum > pagination.lastPage) pageNum = pagination.lastPage - (4 - i);
                                }
                                
                                return (
                                    <Button
                                        key={pageNum}
                                        variant={pagination.currentPage === pageNum ? "default" : "ghost"}
                                        size="sm"
                                        onClick={() => pagination.onPageChange(pageNum)}
                                        className="h-8 w-8 rounded-lg text-[11px] font-bold"
                                    >
                                        {pageNum}
                                    </Button>
                                );
                            })}
                        </div>

                        <Button 
                            variant="outline" 
                            size="icon" 
                            disabled={pagination.currentPage === pagination.lastPage}
                            onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
                            className="h-8 w-8 rounded-lg"
                        >
                            <ChevronRight size={16} />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
