import * as React from 'react';
import { PageHeader } from './PageHeader';
import { PageFooter } from './PageFooter';

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
    onFilterChange?: (key: string, value: any) => void;
    onResetFilters?: () => void;
    totalResults?: number;
    actions?: React.ReactNode;

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
    activeFilters,
    onFilterChange,
    onResetFilters,
    totalResults,
    actions,
    children,
    pagination,
    standalone = true,
}: PageTableProps) {
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
                actions={actions}
            />
            <div className="flex-1 min-h-0 w-full p-0 m-0 flex flex-col overflow-hidden">
                {children}
            </div>
            <PageFooter pagination={pagination} />
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
