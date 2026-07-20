import * as React from 'react';
import { FilterPopover, FilterCategory } from '@/components/ui/selection/FilterPopover';

interface PageFilterProps {
    categories: FilterCategory[];
    activeFilters: Record<string, any>;
    onFilterChange: (key: string, value: any) => void;
    onReset: () => void;
    className?: string;
}

export function PageFilter({
    categories,
    activeFilters,
    onFilterChange,
    onReset,
    className,
}: PageFilterProps) {
    return (
        <div className={className}>
            <FilterPopover
                categories={categories}
                activeFilters={activeFilters}
                onFilterChange={onFilterChange}
                onReset={onReset}
            />
        </div>
    );
}
