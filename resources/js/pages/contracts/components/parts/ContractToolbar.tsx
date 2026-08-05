import { FilterChips } from '@/pages/contracts/components/parts/FilterChips';
import { Button } from '@/components/ui/buttons/Button';
import { Input } from '@/components/ui/inputs/Input';
import { SimpleFilters } from '@/components/ui/selection/SimpleFilters';
import { cn } from '@/lib/utils';
import { AdvancedFilters } from '@/types/filters';
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
        <div className="border-border bg-card mb-4 flex flex-col gap-4 rounded-xl border p-4 shadow-sm">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div className="flex max-w-md flex-1 items-center gap-3">
                    <div className="relative max-w-md flex-1">
                        <Search className="text-muted-foreground/50 absolute top-2.5 left-3 h-4 w-4" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={placeholder}
                            className="border-border bg-background focus:ring-primary/20 placeholder:text-muted-foreground/40 h-10 pl-10 text-sm font-medium transition-all"
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
                        className="border-border bg-background h-10 w-10 shrink-0"
                    >
                        <RefreshCcw className="h-4 w-4" />
                    </Button>
                </div>

                <div className="border-surface-border bg-surface-muted flex h-10 overflow-hidden rounded-xl border p-1 gap-1">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setLayout('list')}
                        className={cn(
                            'h-8 px-3 rounded-lg transition-all text-[10px] font-bold uppercase',
                            layout === 'list' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-text-desc hover:text-text-main hover:bg-surface-base/60',
                        )}
                        title="Tampilan Tabel"
                    >
                        <ListIcon size={15} />
                        Tabel
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setLayout('card')}
                        className={cn(
                            'h-8 px-3 rounded-lg transition-all text-[10px] font-bold uppercase',
                            layout === 'card' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-text-desc hover:text-text-main hover:bg-surface-base/60',
                        )}
                        title="Tampilan Kartu"
                    >
                        <LayoutGrid size={15} />
                        Kartu
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
