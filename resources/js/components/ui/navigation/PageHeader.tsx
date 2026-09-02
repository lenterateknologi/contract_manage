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
        <div className="flex h-16 min-h-[64px] max-h-[64px] shrink-0 items-center justify-between border-b border-border bg-background px-5 dark:bg-zinc-900/50 box-border">
            {/* Title and Icon */}
            <div className="flex items-center gap-2.5 min-w-0 mr-4">
                {Icon && (
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground">
                        <Icon size={16} className="text-foreground/80" />
                    </div>
                )}
                <div className="flex flex-col justify-center min-w-0">
                    <h1 className="text-[13.5px] font-bold tracking-tight text-foreground leading-tight truncate">
                        {title}
                    </h1>
                    {subtitle && (
                        <p className="text-[10.5px] text-muted-foreground leading-tight truncate mt-0.5">
                            {subtitle}
                        </p>
                    )}
                </div>
            </div>

            {/* Search, Filter & Actions Row */}
            <div className="flex items-center gap-2 md:ml-auto shrink-0">
                {/* Search Input */}
                {onSearchChange !== undefined && (
                    <div className="w-48 sm:w-56 md:w-64 lg:w-72">
                        <SearchInput
                            placeholder={searchPlaceholder}
                            value={localSearch}
                            onChange={(e) => {
                                setLocalSearch(e.target.value);
                                onSearchChange(e.target.value);
                            }}
                            className="h-9 text-xs"
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
    );
}
