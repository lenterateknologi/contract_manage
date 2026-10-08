import { Icons } from '@/components/ui';
import { DateRangePicker } from '@/components/ui/inputs/DateRangePicker';
import { SearchableMultiSelect } from '@/components/ui/selection/SearchableMultiSelect';
import { cn } from '@/lib/utils';
import React, { useMemo } from 'react';

const { Calendar, ChevronDown, RotateCcw, SlidersHorizontal, X } = Icons;

export interface FilterOption {
    label: string;
    value: string | number;
    icon?: React.ElementType;
    color?: string;
}

export interface FilterCategory {
    key: string;
    label: string;
    type?: 'multiselect' | 'searchable' | 'date-range';
    options?: FilterOption[];
    placeholder?: string;
}

export interface PageFilterProps {
    categories: FilterCategory[];
    activeFilters: Record<string, any>;
    onFilterChange: (keyOrObj: string | Record<string, any>, value?: any) => void;
    onReset: () => void;
    totalResults?: number;
    className?: string;
}

const ensureArray = (val: any): string[] => {
    if (val === undefined || val === null || val === '') return [];
    if (typeof val === 'string' && val.includes(',')) {
        return val
            .split(',')
            .map((v) => v.trim())
            .filter(Boolean);
    }
    const arr = Array.isArray(val) ? val : [val];
    return arr.filter((v) => v !== undefined && v !== null && v !== '').map(String);
};

function DateRangeField({
    category,
    activeFilters,
    onFilterChange,
}: {
    category: FilterCategory;
    activeFilters: Record<string, any>;
    onFilterChange: (keyOrObj: string | Record<string, any>, value?: any) => void;
}) {
    const fromKey = `${category.key}_from`;
    const toKey = `${category.key}_to`;
    const fromVal = typeof activeFilters[fromKey] === 'string' ? activeFilters[fromKey].split('T')[0] : '';
    const toVal = typeof activeFilters[toKey] === 'string' ? activeFilters[toKey].split('T')[0] : '';

    return (
        <div className="w-full space-y-1.5">
            <div className="flex items-center justify-between">
                <label className="text-text-desc block truncate text-xs font-semibold">{category.label}</label>
            </div>
            <DateRangePicker
                from={fromVal}
                to={toVal}
                label={category.label}
                variant="dropdown-field"
                onChange={(f, t) => {
                    onFilterChange({ [fromKey]: f, [toKey]: t });
                }}
            />
        </div>
    );
}

export function PageFilter({ categories, activeFilters, onFilterChange, onReset, totalResults, className }: PageFilterProps) {
    const activeCount = useMemo(() => {
        let count = 0;
        categories.forEach((cat) => {
            if (cat.type === 'date-range') {
                const fromVal = activeFilters[`${cat.key}_from`];
                const toVal = activeFilters[`${cat.key}_to`];
                if (fromVal || toVal) count += 1;
            } else {
                const vals = ensureArray(activeFilters[cat.key]);
                count += vals.length;
            }
        });
        return count;
    }, [activeFilters, categories]);

    return (
        <div
            className={cn(
                'border-surface-border bg-surface-card/70 animate-in fade-in slide-in-from-top-2 shrink-0 border-b p-4 backdrop-blur-sm duration-200 dark:bg-zinc-900/70',
                className,
            )}
        >
            <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <SlidersHorizontal size={14} className="text-primary" />
                    <span className="text-text-main text-xs font-bold tracking-tight uppercase">Filter Data Kontrak</span>
                    {totalResults !== undefined && <span className="text-text-desc text-[11px] font-medium">({totalResults} hasil ditemukan)</span>}
                </div>

                {activeCount > 0 && (
                    <button
                        type="button"
                        onClick={onReset}
                        className="text-danger hover:text-danger/80 inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold transition-colors"
                    >
                        <RotateCcw size={12} />
                        <span>Reset Semua Filter ({activeCount})</span>
                    </button>
                )}
            </div>

            {/* Filter Grid */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {categories.map((category) => {
                    if (category.type === 'date-range') {
                        return (
                            <DateRangeField key={category.key} category={category} activeFilters={activeFilters} onFilterChange={onFilterChange} />
                        );
                    }

                    const activeValues = ensureArray(activeFilters[category.key]);
                    const options = (category.options || []).map((opt) => ({
                        value: String(opt.value),
                        label: opt.label,
                    }));

                    return (
                        <div key={category.key} className="space-y-1.5">
                            <label className="text-text-desc block truncate text-xs font-semibold">{category.label}</label>
                            <SearchableMultiSelect
                                values={activeValues}
                                onValuesChange={(vals) => onFilterChange(category.key, vals)}
                                options={options}
                                placeholder={category.placeholder || `Semua ${category.label}`}
                                searchPlaceholder={`Cari ${category.label.toLowerCase()}...`}
                                className="w-full"
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
