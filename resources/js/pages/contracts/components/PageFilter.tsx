import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/buttons/Button';
import { Calendar, ChevronDown, RotateCcw, SlidersHorizontal, X } from 'lucide-react';
import { DateRangeCalendar } from '@/components/ui/inputs/DateRangeCalendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/dialogs/Popover';
import { SearchableMultiSelect } from '@/components/ui/selection/SearchableMultiSelect';

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

    const formatDateText = (s: string) => {
        if (!s) return '';
        const [y, m, d] = s.split('-');
        return `${d}/${m}/${y}`;
    };

    const hasDate = Boolean(fromVal || toVal);

    return (
        <div className="space-y-1.5 w-full">
            <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-text-desc block truncate">{category.label}</label>
            </div>
            <Popover>
                <PopoverTrigger asChild className="w-full">
                    <div
                        className={cn(
                            'flex min-h-[40px] w-full items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-left text-sm font-semibold text-foreground transition-all outline-none cursor-pointer hover:border-primary/50 focus:border-primary focus:ring-1 focus:ring-primary shadow-xs',
                            hasDate && 'border-primary ring-1 ring-primary',
                        )}
                    >
                        <div className="flex flex-wrap gap-1.5 pr-2 min-w-0 flex-1">
                            {hasDate ? (
                                <span
                                    onClick={(e) => e.stopPropagation()}
                                    className="inline-flex items-center gap-1 bg-primary text-primary-foreground px-2 py-0.5 rounded text-[10px] hover:bg-primary/90 transition-colors"
                                >
                                    <Calendar size={10} className="shrink-0" />
                                    <span>
                                        {formatDateText(fromVal) || '-'} – {formatDateText(toVal) || '-'}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            onFilterChange({ [fromKey]: '', [toKey]: '' });
                                        }}
                                        className="text-white/70 hover:text-white dark:text-slate-900/70 dark:hover:text-slate-900 focus:outline-none ml-0.5"
                                        title="Hapus Tanggal"
                                    >
                                        <X size={10} />
                                    </button>
                                </span>
                            ) : (
                                <span className="text-slate-400 dark:text-slate-500 py-0.5 text-sm font-medium truncate">
                                    Semua {category.label}
                                </span>
                            )}
                        </div>
                        <ChevronDown size={13} className="text-slate-400 shrink-0 ml-2" />
                    </div>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-[var(--button-width)] min-w-[260px] max-w-[90vw] p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-lg z-[999999]">
                    <DateRangeCalendar
                        from={fromVal}
                        to={toVal}
                        onChange={(f, t) => {
                            onFilterChange({ [fromKey]: f, [toKey]: t });
                        }}
                    />
                </PopoverContent>
            </Popover>
        </div>
    );
}

export function PageFilter({
    categories,
    activeFilters,
    onFilterChange,
    onReset,
    totalResults,
    className,
}: PageFilterProps) {
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
        <div className={cn('border-b border-surface-border bg-surface-card/70 dark:bg-zinc-900/70 backdrop-blur-sm p-4 animate-in fade-in slide-in-from-top-2 duration-200 shrink-0', className)}>
            <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                    <SlidersHorizontal size={14} className="text-primary" />
                    <span className="text-xs font-bold text-text-main tracking-tight uppercase">Filter Data Kontrak</span>
                    {totalResults !== undefined && (
                        <span className="text-[11px] text-text-desc font-medium">
                            ({totalResults} hasil ditemukan)
                        </span>
                    )}
                </div>

                {activeCount > 0 && (
                    <button
                        type="button"
                        onClick={onReset}
                        className="inline-flex items-center gap-1.5 text-xs text-danger hover:text-danger/80 transition-colors font-semibold cursor-pointer"
                    >
                        <RotateCcw size={12} />
                        <span>Reset Semua Filter ({activeCount})</span>
                    </button>
                )}
            </div>

            {/* Filter Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                {categories.map((category) => {
                    if (category.type === 'date-range') {
                        return (
                            <DateRangeField
                                key={category.key}
                                category={category}
                                activeFilters={activeFilters}
                                onFilterChange={onFilterChange}
                            />
                        );
                    }

                    const activeValues = ensureArray(activeFilters[category.key]);
                    const options = (category.options || []).map((opt) => ({
                        value: String(opt.value),
                        label: opt.label,
                    }));

                    return (
                        <div key={category.key} className="space-y-1.5">
                            <label className="text-xs font-semibold text-text-desc block truncate">
                                {category.label}
                            </label>
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
