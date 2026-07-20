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
}: PageTableProps) {
    return (
        <div className="flex flex-col h-[calc(100svh-88px)] overflow-hidden bg-background w-full">
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
}
