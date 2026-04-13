import React from 'react';
import { Search, Filter, RefreshCcw, List as ListIcon, LayoutGrid, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SimpleFilters } from '@/components/ui/SimpleFilters';
import { AdvancedFilters } from '@/components/ui/AdvancedSearch';
import { FilterChips } from '@/components/contracts/FilterChips';
import { router } from '@inertiajs/react';

interface ContractToolbarProps {
    search: string;
    setSearch: (val: string) => void;
    advancedFilters: AdvancedFilters;
    setAdvancedFilters: (val: AdvancedFilters) => void;
    handleFilterChange: (filters: any) => void;
    layout: 'list' | 'card';
    setLayout: (val: 'list' | 'card') => void;
    types: any[];
    statusFilter: any;
    setStatusFilter: (val: any) => void;
    typeFilter: any;
    setTypeFilter: (val: any) => void;
    placeholder?: string;
    primaryAction?: React.ReactNode;
}

export function ContractToolbar({
    search,
    setSearch,
    advancedFilters,
    setAdvancedFilters,
    handleFilterChange,
    layout,
    setLayout,
    types,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    placeholder = "Cari kontrak...",
    primaryAction
}: ContractToolbarProps) {
    return (
        <div className="p-4 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col gap-4 bg-slate-50/50 mb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 max-w-md">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input 
                            value={search} 
                            onChange={e => setSearch(e.target.value)} 
                            placeholder={placeholder}
                            className="pl-9 h-10 border-slate-200 focus:ring-primary/20 rounded-lg bg-white" 
                        />
                    </div>

                    <SimpleFilters 
                        types={types}
                        currentFilters={{
                            status: Array.isArray(statusFilter) ? statusFilter : (statusFilter !== 'all' ? [statusFilter] : []),
                            type: Array.isArray(typeFilter) ? typeFilter : (typeFilter !== 'all' ? [typeFilter] : []),
                            date_from: undefined, // Will be handled if we store date in state
                            date_to: undefined
                        }}
                        onApply={(fs) => {
                            const updates: any = {};
                            if (fs.status) updates.status = fs.status;
                            if (fs.type) updates.contract_type_id = fs.type;
                            // handleFilterChange already handles routing
                            handleFilterChange(updates);
                        }}
                        onAdvancedApply={(af) => {
                            setAdvancedFilters(af);
                            handleFilterChange({ advanced_filters: af });
                        }}
                    />

                    <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => router.reload({ preserveScroll: true, preserveState: true } as any)} 
                        className="shrink-0 h-10 w-10 border-slate-200 bg-white"
                    >
                        <RefreshCcw className="h-4 w-4" />
                    </Button>
                </div>

                <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-white h-10 shadow-sm">
                    <button onClick={() => setLayout('list')} className={`px-2.5 transition-colors ${layout === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-slate-100 text-slate-500'}`} title="List View">
                        <ListIcon size={16} />
                    </button>
                    <button onClick={() => setLayout('card')} className={`px-2.5 transition-colors ${layout === 'card' ? 'bg-primary text-primary-foreground' : 'hover:bg-slate-100 text-slate-500'}`} title="Grid View">
                        <LayoutGrid size={16} />
                    </button>
                </div>

                {primaryAction && (
                    <div className="shrink-0">
                        {primaryAction}
                    </div>
                )}
            </div>

            <FilterChips 
                statusFilter={statusFilter}
                typeFilter={typeFilter}
                types={types}
                setStatusFilter={setStatusFilter}
                setTypeFilter={setTypeFilter}
                advancedFilters={advancedFilters}
                setAdvancedFilters={setAdvancedFilters}
                handleFilterChange={handleFilterChange}
            />
        </div>
    );
}
