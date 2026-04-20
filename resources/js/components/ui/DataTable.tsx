import React, { useState, useMemo } from 'react';
import { 
    ChevronDown, ChevronUp, ChevronsUpDown, 
    Search, Filter, MoreHorizontal, 
    RefreshCcw, ChevronLeft, ChevronRight,
    Loader2, Inbox, Trash2, CheckCircle2,
    Check
} from 'lucide-react';
import { Button } from './button';
import { Input } from './input';
import { Checkbox } from './checkbox';
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuPortal,
    DropdownMenuSubContent,
    DropdownMenuSeparator,
    DropdownMenuCheckboxItem
} from './dropdown-menu';
import { cn } from '@/lib/utils';
import { Badge } from './badge';
import { FilterPills } from './FilterPills';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './dialog';

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
        
        setActiveFilters({
            ...activeFilters,
            [key]: newValues
        });
    };

    const handleResetAll = () => {
        const reset: any = {};
        filters?.forEach(f => reset[f.key] = []);
        setActiveFilters(reset);
    };

    const handleResetCategory = (key: string) => {
        setActiveFilters({
            ...activeFilters,
            [key]: []
        });
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
        <div className="flex flex-col h-full bg-white overflow-hidden border border-slate-200 rounded-xl shadow-sm">
            {/* Toolbar */}
            <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
                <div className="flex items-center gap-3 flex-1 max-w-md">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input 
                            placeholder={searchPlaceholder} 
                            className="pl-9 h-10 border-slate-200 focus:ring-primary/20 rounded-lg bg-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {onRefresh && (
                        <Button variant="outline" size="icon" onClick={onRefresh} disabled={loading} className="shrink-0 h-10 w-10 bg-white shadow-sm">
                            <RefreshCcw className={cn("h-4 w-4", loading && "animate-spin")} />
                        </Button>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {filters && filters.length > 0 && (
                        <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
                            <DialogTrigger asChild>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className={cn(
                                        "h-10 gap-2 border-slate-200 bg-white px-4 font-bold transition-all shadow-sm",
                                        Object.values(activeFilters).flat().filter(Boolean).length > 0 ? "text-primary border-primary/30 bg-primary/5" : "text-slate-700 hover:bg-slate-50"
                                    )}
                                >
                                    <Filter className="h-3.5 w-3.5" />
                                    <span className="text-[10px] uppercase tracking-wider">Set Filter</span>
                                    {Object.values(activeFilters).flat().filter(Boolean).length > 0 && (
                                        <Badge className="h-4 min-w-[1rem] bg-primary px-1 text-[8px] font-black">
                                            {Object.values(activeFilters).flat().filter(Boolean).length}
                                        </Badge>
                                    )}
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-lg p-0 overflow-hidden rounded-2xl">
                                <DialogHeader className="p-6 border-b border-slate-100">
                                    <DialogTitle className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-base font-bold text-slate-800">
                                            <Filter className="h-4 w-4 text-primary" />
                                            Filter Data
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={handleResetAll} className="h-8 text-[10px] font-bold uppercase text-slate-400 hover:text-red-500">
                                            Reset Semua
                                        </Button>
                                    </DialogTitle>
                                </DialogHeader>
                                
                                <div className="p-6 space-y-8 max-h-[60vh] overflow-auto bg-white">
                                    {filters.map((category) => (
                                        <div key={category.key} className="space-y-4">
                                            <h4 className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-400">{category.label}</h4>
                                            <div className="grid grid-cols-2 gap-3">
                                                {category.options.map((opt) => {
                                                    const isSelected = Array.isArray(activeFilters[category.key]) 
                                                        ? activeFilters[category.key].includes(opt.value)
                                                        : activeFilters[category.key] === opt.value;
                                                    
                                                    return (
                                                        <label 
                                                            key={String(opt.value)} 
                                                            className={cn(
                                                                "flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer group",
                                                                isSelected 
                                                                    ? "border-primary/30 bg-primary/5 ring-1 ring-primary/20" 
                                                                    : "border-slate-100 bg-slate-50/30 hover:border-slate-200 hover:bg-slate-50"
                                                            )}
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                toggleFilterValue(category.key, opt.value);
                                                            }}
                                                        >
                                                            <div className={cn(
                                                                "h-4 w-4 rounded border flex items-center justify-center transition-all",
                                                                isSelected ? "bg-primary border-primary text-white" : "bg-white border-slate-300 group-hover:border-slate-400"
                                                            )}>
                                                                {isSelected && <Check size={10} strokeWidth={4} />}
                                                            </div>
                                                            <span className={cn(
                                                                "text-[12px] font-bold transition-colors truncate",
                                                                isSelected ? "text-primary" : "text-slate-600"
                                                            )}>
                                                                {opt.label}
                                                            </span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="p-4 px-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                                    <span className="text-[11px] font-bold text-slate-400 uppercase">
                                        {Object.values(activeFilters).flat().filter(Boolean).length} Filter Terpilih
                                    </span>
                                    <div className="flex gap-2">
                                        <Button variant="ghost" className="font-bold text-[11px] uppercase" onClick={() => setIsFilterDialogOpen(false)}>Batal</Button>
                                        <Button className="font-bold text-[11px] uppercase px-8 shadow-lg shadow-primary/20" onClick={() => setIsFilterDialogOpen(false)}>Terapkan</Button>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    )}
                    
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

            {/* Filter Pills */}
            {filters && (
                <FilterPills 
                    filters={filters}
                    activeFilters={activeFilters}
                    onRemove={(key, val) => toggleFilterValue(key, val)}
                    onClearAll={handleResetAll}
                />
            )}

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
                                        {columns.map((col, j) => (
                                            <td key={j} className={cn("p-4 text-[13px] font-medium text-slate-700", col.className)}>
                                                {col.cell ? col.cell(row) : (String(row[col.accessorKey]) || '-')}
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
                <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4 mt-auto">
                    <div className="flex items-center gap-4 text-[11px] font-bold text-slate-500 uppercase tracking-tight">
                        <span>Showing {pagination.from}-{pagination.to} of {pagination.total}</span>
                        <div className="flex items-center gap-2 border-l pl-4">
                            <span>Show</span>
                            <select 
                                value={pagination.perPage}
                                onChange={(e) => pagination.onPerPageChange(Number(e.target.value))}
                                className="bg-white border rounded px-1 py-0.5 outline-none focus:border-primary font-bold text-slate-700"
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
                            className="h-8 w-8 rounded-lg bg-white"
                        >
                            <ChevronLeft size={16} />
                        </Button>
                        
                        {/* Page Numbers - Simplified */}
                        <div className="flex items-center gap-1 mx-2">
                            {Array.from({ length: Math.min(pagination.lastPage, 5) }, (_, i) => {
                                let pageNum = i + 1;
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
                            className="h-8 w-8 rounded-lg bg-white"
                        >
                            <ChevronRight size={16} />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
