import * as React from 'react';
import { FilterPopover, FilterCategory } from '@/components/ui/selection/FilterPopover';
import { Button } from '@/components/ui/buttons/Button';
import { SlidersHorizontal } from 'lucide-react';

interface PageFilterProps {
    categories: FilterCategory[];
    activeFilters: Record<string, any>;
    onFilterChange: (key: string, value: any) => void;
    onReset: () => void;
    className?: string;
    children?: React.ReactNode;
}

export function PageFilter({
    categories,
    activeFilters,
    onFilterChange,
    onReset,
    className,
    children,
}: PageFilterProps) {
    const activeCount = React.useMemo(() => {
        let count = 0;
        categories.forEach(f => {
            const val = activeFilters[f.key];
            if (Array.isArray(val)) {
                count += val.filter(v => v !== '' && v !== null).length;
            } else if (val !== undefined && val !== '' && val !== null) {
                count += 1;
            }
        });
        return count;
    }, [activeFilters, categories]);

    const defaultTrigger = (
        <Button
            variant={activeCount > 0 ? "primary" : "white"}
            size="icon"
            className="relative h-9 w-9 rounded-xl transition-all duration-200"
            title="Filter Data"
        >
            <SlidersHorizontal size={14} />
            {activeCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-md px-1 text-[8px] font-bold bg-primary text-primary-foreground ring-2 ring-surface-base">
                    {activeCount}
                </span>
            )}
        </Button>
    );

    return (
        <div className={className}>
            <FilterPopover
                categories={categories}
                activeFilters={activeFilters}
                onFilterChange={onFilterChange}
                onReset={onReset}
            >
                {children || defaultTrigger}
            </FilterPopover>
        </div>
    );
}
