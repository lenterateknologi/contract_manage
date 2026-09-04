import * as React from 'react';
import { PageHeader } from './PageHeader';
import { PageFooter } from './PageFooter';
import { PageFilter } from './PageFilter';

interface PageTableProps {
    // Header props
    title: string;
    subtitle?: string;
    icon?: React.ComponentType<{ size?: number; className?: string }>;
    searchValue?: string;
    onSearchChange?: (value: string) => void;
    searchPlaceholder?: string;
    filters?: any[];
    activeFilters?: Record<string, any>;
    onFilterChange?: (keyOrObj: string | Record<string, any>, value?: any) => void;
    onResetFilters?: () => void;
    totalResults?: number;
    actions?: React.ReactNode;
    isFilterExpanded?: boolean;
    onToggleFilter?: () => void;

    // Content props
    children: React.ReactNode;

    // Pagination/Footer props
    pagination?: {
        currentPage: number;
        lastPage: number;
        total: number;
        from?: number;
        to?: number;
        onPageChange: (page: number) => void;
        perPage?: number;
        onPerPageChange?: (perPage: number) => void;
    };

    resourceKey?: string;
    showFooter?: boolean;

    /**
     * standalone (default: true)
     * When true  → PageTable owns the outer bg/height/padding (legacy standalone usage).
     * When false → Parent (MasterPageLayout + FloatingPanel) provides the outer shell;
     *              PageTable renders only the inner content layout.
     */
    standalone?: boolean;
}

export function PageTable({
    title,
    subtitle,
    icon,
    searchValue,
    onSearchChange,
    searchPlaceholder,
    filters,
    activeFilters = {},
    onFilterChange,
    onResetFilters,
    totalResults,
    actions,
    isFilterExpanded: controlledIsFilterExpanded,
    onToggleFilter: controlledOnToggleFilter,
    children,
    pagination,
    resourceKey,
    showFooter = true,
    standalone = true,
}: PageTableProps) {
    const hasActiveFilters = React.useMemo(() => {
        if (!filters || filters.length === 0) return false;
        return filters.some(f => {
            const val = activeFilters[f.key];
            const fromVal = activeFilters[`${f.key}_from`];
            const toVal = activeFilters[`${f.key}_to`];
            if (fromVal || toVal) return true;
            if (Array.isArray(val)) return val.some(v => v !== '' && v !== null);
            return val !== undefined && val !== '' && val !== null;
        });
    }, [activeFilters, filters]);

    const [internalFilterExpanded, setInternalFilterExpanded] = React.useState(false);

    const isExpanded = controlledIsFilterExpanded !== undefined ? controlledIsFilterExpanded : internalFilterExpanded;
    const handleToggle = controlledOnToggleFilter || (() => setInternalFilterExpanded(prev => !prev));

    const inner = (
        <div className="flex flex-col flex-1 min-h-0 w-full h-full overflow-hidden">
            <PageHeader
                title={title}
                subtitle={subtitle}
                icon={icon}
                searchValue={searchValue}
                onSearchChange={onSearchChange}
                searchPlaceholder={searchPlaceholder}
                filters={filters}
                activeFilters={activeFilters}
                onFilterChange={onFilterChange}
                onResetFilters={onResetFilters}
                totalResults={totalResults}
                isFilterExpanded={isExpanded}
                onToggleFilter={filters && filters.length > 0 ? handleToggle : undefined}
                actions={actions}
            />

            {/* Expandable Page Filter Banner (Identical to Contract Page) */}
            {isExpanded && filters && filters.length > 0 && onFilterChange && onResetFilters && (
                <div className="relative z-30">
                    <PageFilter
                        categories={filters}
                        activeFilters={activeFilters}
                        onFilterChange={onFilterChange}
                        onReset={onResetFilters}
                        totalResults={totalResults}
                        title={`Filter Data ${title}`}
                        resourceKey={resourceKey}
                    />
                </div>
            )}

            <div className="flex-1 min-h-0 w-full p-0 m-0 flex flex-col overflow-hidden relative z-10">
                {children}
            </div>
            {showFooter && <PageFooter pagination={pagination} />}
        </div>
    );

    if (standalone) {
        // Fullscreen: PageTable owns the full-page layout without outer padding or border
        return (
            <div className="flex flex-col h-svh max-h-svh overflow-hidden bg-background w-full p-0 m-0 rounded-none border-0">
                <div className="flex flex-col flex-1 min-h-0 w-full rounded-none border-0 bg-background overflow-hidden">
                    {inner}
                </div>
            </div>
        );
    }

    // Non-standalone: parent (MasterPageLayout + FloatingPanel) provides outer shell
    return inner;
}
