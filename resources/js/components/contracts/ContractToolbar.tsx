import { FilterChips } from '@/components/contracts/FilterChips';
import { AdvancedFilters } from '@/components/ui/AdvancedSearch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SimpleFilters } from '@/components/ui/SimpleFilters';
import { router } from '@inertiajs/react';
import { LayoutGrid, List as ListIcon, RefreshCcw, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
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
        <div className="mb-4 flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div className="flex max-w-md flex-1 items-center gap-3">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground/50" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={placeholder}
                            className="pl-10 h-10 border-border bg-background focus:ring-primary/20 text-sm placeholder:text-muted-foreground/40 transition-all font-medium"
                        />
                    </div>

                    <SimpleFilters
                        types={types}
                        currentFilters={{
                            status: Array.isArray(statusFilter) ? statusFilter : statusFilter !== 'all' ? [statusFilter] : [],
                            type: Array.isArray(typeFilter) ? typeFilter : typeFilter !== 'all' ? [typeFilter] : [],
                            date_from: undefined,
                            date_to: undefined,
                        }}
                        onApply={(fs) => {
                            const updates: any = {};
                            if (fs.status) updates.status = fs.status;
                            if (fs.type) updates.contract_type_id = fs.type;
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
                        className="h-10 w-10 shrink-0 border-border bg-background"
                    >
                        <RefreshCcw className="h-4 w-4" />
                    </Button>
                </div>

                <div className="flex h-10 overflow-hidden rounded-lg border border-border bg-background shadow-sm">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setLayout('list')}
                        className={cn(
                            "px-2.5 transition-colors",
                            layout === 'list' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                        )}
                    >
                        <ListIcon size={16} />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setLayout('card')}
                        className={cn(
                            "px-2.5 transition-colors",
                            layout === 'card' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                        )}
                    >
                        <LayoutGrid size={16} />
                    </Button>
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
