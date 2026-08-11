import * as React from 'react';
import { cn } from '@/lib/utils';
import { SearchInput } from '@/components/ui/inputs/SearchInput';
import { FilterPopover } from '@/components/ui/selection/FilterPopover';
import { Button } from '@/components/ui/buttons/Button';
import { SlidersHorizontal } from 'lucide-react';

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    icon?: React.ComponentType<{ size?: number; className?: string }>;
    
    // Search
    searchValue?: string;
    onSearchChange?: (value: string) => void;
    searchPlaceholder?: string;

    // Filter
    filters?: any[];
    activeFilters?: Record<string, any>;
    onFilterChange?: (key: string, value: any) => void;
    onResetFilters?: () => void;
    totalResults?: number;

    // Actions
    actions?: React.ReactNode;
}

export function PageHeader({
    title,
    subtitle,
    icon: Icon,
    searchValue,
    onSearchChange,
    searchPlaceholder = "Cari data...",
    filters = [],
    activeFilters = {},
    onFilterChange,
    onResetFilters,
    totalResults,
    actions
}: PageHeaderProps) {
    const [localSearch, setLocalSearch] = React.useState(searchValue || '');

    React.useEffect(() => {
        setLocalSearch(searchValue || '');
    }, [searchValue]);

    const activeCount = React.useMemo(() => {
        let count = 0;
        filters.forEach(f => {
            const val = activeFilters[f.key];
            if (Array.isArray(val)) {
                count += val.filter(v => v !== '' && v !== null).length;
            } else if (val !== undefined && val !== '' && val !== null) {
                count += 1;
            }
        });
        return count;
    }, [activeFilters, filters]);

    return (
        <div className="flex flex-col gap-4 border-b border-border bg-white px-6 py-5 dark:bg-zinc-900/50">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                {/* Title and Icon */}
                <div className="flex items-start gap-3">
                    {Icon && (
                        <Icon size={22} className="text-muted-foreground shrink-0 mt-0.5" />
                    )}
                    <div className="flex flex-col gap-0.5">
                        <h1 className="text-base font-semibold tracking-tight text-foreground">
                            {title}
                        </h1>
                        {subtitle && (
                            <p className="text-xs text-muted-foreground">
                                {subtitle}
                            </p>
                        )}
                    </div>
                </div>

                {/* Search, Filter & Actions Row */}
                <div className="flex flex-wrap items-center gap-3 md:ml-auto">
                    {/* Search Input */}
                    {onSearchChange !== undefined && (
                        <div className="w-full sm:w-64 md:w-80 lg:w-96">
                            <SearchInput
                                placeholder={searchPlaceholder}
                                value={localSearch}
                                onChange={(e) => {
                                    setLocalSearch(e.target.value);
                                    onSearchChange(e.target.value);
                                }}
                            />
                        </div>
                    )}

                    {/* Actions */}
                    {actions && (
                        <div className="flex items-center gap-2">
                            {actions}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
