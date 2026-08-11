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
        // Legacy: PageTable owns the full-page layout (bg, height, padding, card wrapper)
        return (
            <div className="flex flex-col h-[calc(100svh-76px)] overflow-hidden bg-slate-100/60 dark:bg-zinc-950 w-full p-4">
                <div className="flex flex-col flex-1 min-h-0 w-full rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 overflow-hidden">
                    {inner}
                </div>
            </div>
        );
    }

    // Non-standalone: parent (MasterPageLayout + FloatingPanel) provides outer shell
    return inner;
}
