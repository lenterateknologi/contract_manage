import { FilterChips } from '@/components/contracts/FilterChips';
import { AdvancedFilters } from '@/components/ui/AdvancedSearch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SimpleFilters } from '@/components/ui/SimpleFilters';
import { router } from '@inertiajs/react';
import { LayoutGrid, List as ListIcon, RefreshCcw, Search } from 'lucide-react';
import React from 'react';

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
    placeholder = 'Cari kontrak...',
    primaryAction,
}: ContractToolbarProps) {
    return (
        <div className="mb-4 flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50/50 bg-white p-4 shadow-sm">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div className="flex max-w-md flex-1 items-center gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={placeholder}
                            className="focus:ring-primary/20 h-10 rounded-lg border-slate-200 bg-white pl-9"
                        />
                    </div>

                    <SimpleFilters
                        types={types}
                        currentFilters={{
                            status: Array.isArray(statusFilter) ? statusFilter : statusFilter !== 'all' ? [statusFilter] : [],
                            type: Array.isArray(typeFilter) ? typeFilter : typeFilter !== 'all' ? [typeFilter] : [],
                            date_from: undefined, // Will be handled if we store date in state
                            date_to: undefined,
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
                        className="h-10 w-10 shrink-0 border-slate-200 bg-white"
                    >
                        <RefreshCcw className="h-4 w-4" />
                    </Button>
                </div>

                <div className="flex h-10 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                    <button
                        onClick={() => setLayout('list')}
                        className={`px-2.5 transition-colors ${layout === 'list' ? 'bg-primary text-primary-foreground' : 'text-slate-500 hover:bg-slate-100'}`}
                        title="List View"
                    >
                        <ListIcon size={16} />
                    </button>
                    <button
                        onClick={() => setLayout('card')}
                        className={`px-2.5 transition-colors ${layout === 'card' ? 'bg-primary text-primary-foreground' : 'text-slate-500 hover:bg-slate-100'}`}
                        title="Grid View"
                    >
                        <LayoutGrid size={16} />
                    </button>
                </div>

                {primaryAction && <div className="shrink-0">{primaryAction}</div>}
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
