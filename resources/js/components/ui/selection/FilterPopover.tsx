import React, { useState, useMemo, Fragment } from 'react';
import {
    Combobox,
    ComboboxInput,
    ComboboxOption,
    ComboboxOptions,
} from '@headlessui/react';
import {
    Search,
    RotateCcw,
    X,
    Calendar,
    Settings2,
    Check,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/buttons/Button';
import { Label } from '@/components/ui/forms/Label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/dialogs/Popover';

export interface FilterOption {
    label: string;
    value: string | number;
    icon?: React.ElementType;
    color?: string;
}

export interface FilterCategory {
    label: string;
    key: string;
    options?: FilterOption[];
    type?: 'grid' | 'searchable' | 'date-range';
}

export interface FilterPopoverProps {
    categories: FilterCategory[];
    activeFilters: Record<string, any>;
    onFilterChange: (key: string, value: any) => void;
    onReset: () => void;
    totalResults?: number;
    children: React.ReactNode;
}

function SearchableCategoryOptions({
    category,
    activeValues = [],
    onToggle,
}: {
    category: FilterCategory;
    activeValues: string[];
    onToggle: (val: any) => void;
}) {
    const [query, setQuery] = useState('');
    const [pageSize, setPageSize] = useState(5);
    const options = category.options || [];

    // Reset pagination size when search query changes
    React.useEffect(() => {
        setPageSize(5);
    }, [query]);

    const filteredOptions = useMemo(() => {
        if (!query) return options;
        return options.filter((opt) =>
            opt.label.toLowerCase().includes(query.toLowerCase())
        );
    }, [options, query]);

    const paginatedOptions = useMemo(() => {
        return filteredOptions.slice(0, pageSize);
    }, [filteredOptions, pageSize]);

    return (
        <div className="space-y-2">
            {/* Label + count */}
            <div className="flex items-center justify-between">
                <Label className="text-[10px] font-bold text-text-desc uppercase ">
                    {category.label}
                </Label>
                {activeValues.length > 0 && (
                    <span className="text-[9px] font-bold text-primary bg-primary-muted px-1.5 py-0.5 rounded-md">
                        {activeValues.length} Terpilih
                    </span>
                )}
            </div>

            {/* Selected chips — always visible */}
            {activeValues.length > 0 && (
                <div className="flex flex-wrap gap-1">
                    {activeValues.map((val) => {
                        const opt = options.find((o) => String(o.value) === val);
                        return (
                            <button
                                key={val}
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    onToggle(activeValues.filter((v) => v !== val));
                                }}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary text-white text-[10px] font-semibold hover:bg-primary/80 transition-colors cursor-pointer"
                            >
                                {opt?.label ?? val}
                                <X size={9} strokeWidth={3} />
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Search input */}
            <div className="relative">
                <Search
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-soft pointer-events-none"
                    size={13}
                />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={`Cari & pilih ${category.label.toLowerCase()}...`}
                    className="w-full h-8 pl-8 pr-3 text-xs bg-surface-muted/50 border border-surface-border rounded-lg focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none"
                />
            </div>

            {/* Options List - Rendered Inline (Always Visible) */}
            <div className="border border-surface-border/40 rounded-lg p-1 bg-surface-muted/5 max-h-36 overflow-y-auto space-y-0.5 custom-scrollbar flex flex-col">
                {filteredOptions.length === 0 && (
                    <div className="py-4 text-center">
                        <p className="text-[10px] text-text-soft font-bold uppercase">
                            Tidak ditemukan
                        </p>
                    </div>
                )}
                {paginatedOptions.map((opt) => {
                    const isSelected = activeValues.includes(String(opt.value));
                    return (
                        <button
                            key={String(opt.value)}
                            type="button"
                            onClick={() => {
                                const valStr = String(opt.value);
                                const next = activeValues.includes(valStr)
                                    ? activeValues.filter((v) => v !== valStr)
                                    : [...activeValues, valStr];
                                onToggle(next);
                            }}
                            className={cn(
                                "w-full flex items-center justify-between p-1.5 rounded-md text-left transition-all text-xs font-semibold uppercase tracking-wide cursor-pointer",
                                isSelected
                                    ? "bg-primary-muted text-primary"
                                    : "text-text-main hover:bg-surface-muted"
                            )}
                        >
                            <span className="truncate">{opt.label}</span>
                            <div className={cn(
                                "h-3.5 w-3.5 rounded border flex items-center justify-center transition-all shrink-0",
                                isSelected
                                    ? "border-primary bg-primary text-white"
                                    : "border-surface-border bg-white"
                            )}>
                                {isSelected && <Check size={10} strokeWidth={3} />}
                            </div>
                        </button>
                    );
                })}
                {filteredOptions.length > pageSize && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setPageSize(prev => prev + 10);
                        }}
                        className="text-[9px] font-bold text-primary hover:text-primary-hover hover:underline text-center py-1 mt-1 cursor-pointer bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-md shrink-0"
                    >
                        Tampilkan Lebih Banyak... (+{filteredOptions.length - pageSize} Data)
                    </button>
                )}
            </div>
        </div>
    );
}

function DateRangeCategoryOptions({
    category,
    activeFilters,
    onFilterChange
}: {
    category: FilterCategory;
    activeFilters: Record<string, any>;
    onFilterChange: (key: string, value: any) => void
}) {
    const fromKey = `${category.key}_from`;
    const toKey = `${category.key}_to`;
    const fromVal = typeof activeFilters[fromKey] === 'string' ? activeFilters[fromKey].split('T')[0] : '';
    const toVal = typeof activeFilters[toKey] === 'string' ? activeFilters[toKey].split('T')[0] : '';

    return (
        <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
                <span className="text-[9px] font-bold text-text-soft uppercase">Mulai</span>
                <input
                    type="date"
                    value={fromVal}
                    max={toVal || undefined}
                    onChange={(e) => {
                        const val = e.target.value;
                        onFilterChange(fromKey, val);
                        if (toVal && val && new Date(val) > new Date(toVal)) {
                            onFilterChange(toKey, val);
                        }
                    }}
                    className="w-full h-8 px-2 text-[10px] font-bold bg-surface-muted/30 border border-surface-border rounded-lg text-text-main focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm"
                />
            </div>
            <div className="space-y-1">
                <span className="text-[9px] font-bold text-text-soft uppercase">Sampai</span>
                <input
                    type="date"
                    value={toVal}
                    min={fromVal || undefined}
                    onChange={(e) => {
                        const val = e.target.value;
                        onFilterChange(toKey, val);
                        if (fromVal && val && new Date(val) < new Date(fromVal)) {
                            onFilterChange(fromKey, val);
                        }
                    }}
                    className="w-full h-8 px-2 text-[10px] font-bold bg-surface-muted/30 border border-surface-border rounded-lg text-text-main focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm"
                />
            </div>
        </div>
    );
}

function FilterCategoryAccordion({
    title,
    activeCount,
    children,
    defaultOpen = true
}: {
    title: string;
    activeCount?: number;
    children: React.ReactNode;
    defaultOpen?: boolean;
}) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="border border-surface-border/60 rounded-xl overflow-hidden bg-surface-base/40 dark:bg-zinc-900/40">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-2.5 bg-surface-muted/30 hover:bg-surface-muted/60 transition-colors text-left cursor-pointer select-none"
            >
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-text-desc uppercase tracking-wider">
                        {title}
                    </span>
                    {activeCount !== undefined && activeCount > 0 && (
                        <span className="text-[9px] font-bold text-primary bg-primary-muted px-1.5 py-0.2 rounded-md">
                            {activeCount}
                        </span>
                    )}
                </div>
                <div className="text-text-desc hover:text-text-main transition-transform duration-200">
                    {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </div>
            </button>

            {isOpen && (
                <div className="p-2.5 pt-1 space-y-2 border-t border-surface-border/30">
                    {children}
                </div>
            )}
        </div>
    );
}

export function FilterPopover({
    categories,
    activeFilters,
    onFilterChange,
    onReset,
    totalResults,
    children
}: FilterPopoverProps) {
    const [isMinimized, setIsMinimized] = useState(false);

    const activeCount = React.useMemo(() => {
        const keys = categories.map(c => c.key);
        let count = 0;
        keys.forEach(key => {
            if (key === 'created') {
                if (activeFilters['created_from']) count += 1;
                if (activeFilters['created_to']) count += 1;
                return;
            }
            const val = activeFilters[key];
            if (Array.isArray(val)) {
                count += val.filter(v => v !== '' && v !== null).length;
            } else if (val !== undefined && val !== '' && val !== null) {
                count += 1;
            }
        });
        return count;
    }, [activeFilters, categories]);
    const hasActiveFilters = activeCount > 0;

    return (
        <Popover>
            {({ open, close }) => (
                <>
                    <PopoverTrigger as={Fragment}>
                        {children}
                    </PopoverTrigger>

                    <PopoverContent
                        align="start"
                        className="w-80 sm:w-96 p-0 border border-surface-border/80 bg-surface-base/95 backdrop-blur-md shadow-2xl rounded-2xl overflow-hidden z-[9999] transition-all duration-300"
                    >
                        {/* Header */}
                        <div className="p-3.5 border-b border-surface-border bg-surface-muted/30 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-white shadow-sm">
                                    <Settings2 size={14} />
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-text-main flex items-center gap-1.5">
                                        Saringan Data
                                        {hasActiveFilters && (
                                            <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-extrabold bg-primary text-primary-foreground">
                                                {activeCount}
                                            </span>
                                        )}
                                    </h4>
                                    <p className="text-[9px] font-medium text-text-desc">Persempit hasil pencarian</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                                {hasActiveFilters && (
                                    <button
                                        type="button"
                                        onClick={onReset}
                                        className="flex h-7 px-2 items-center gap-1 rounded-lg bg-danger/10 hover:bg-danger hover:text-white text-danger transition-all shadow-sm cursor-pointer"
                                        title="Reset Filter"
                                    >
                                        <RotateCcw size={10} />
                                        <span className="text-[9px] font-bold uppercase">Reset</span>
                                    </button>
                                )}

                                {/* Expand / Minimize Header Button */}
                                <button
                                    type="button"
                                    onClick={() => setIsMinimized(!isMinimized)}
                                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-surface-border hover:bg-surface-muted text-text-desc hover:text-text-main transition-all cursor-pointer"
                                    title={isMinimized ? "Perluas Filter" : "Ciutkan Filter"}
                                >
                                    {isMinimized ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                                </button>
                            </div>
                        </div>

                        {/* Body & Footer container */}
                        {!isMinimized && (
                            <>
                                {/* Body - Filter Categories */}
                                <div className="p-3 space-y-2.5 max-h-[70vh] overflow-y-auto custom-scrollbar">
                                    {categories.map((category) => {
                                        if (category.type === 'searchable' && (!category.options || category.options.length === 0)) {
                                            return null;
                                        }

                                        const currentVals = Array.isArray(activeFilters[category.key])
                                            ? activeFilters[category.key]
                                            : activeFilters[category.key]
                                                ? [activeFilters[category.key]]
                                                : [];

                                        return (
                                            <FilterCategoryAccordion
                                                key={category.key}
                                                title={category.label}
                                                activeCount={currentVals.length}
                                            >
                                                {category.type === 'searchable' ? (
                                                    <SearchableCategoryOptions
                                                        category={category}
                                                        activeValues={currentVals.map(String)}
                                                        onToggle={(next) => onFilterChange(category.key, next)}
                                                    />
                                                ) : category.type === 'date-range' ? (
                                                    <DateRangeCategoryOptions
                                                        category={category}
                                                        activeFilters={activeFilters}
                                                        onFilterChange={onFilterChange}
                                                    />
                                                ) : (
                                                    <div className="grid grid-cols-1 gap-1 border border-surface-border/40 rounded-lg p-1 bg-surface-muted/5">
                                                        {category.options?.map((opt) => {
                                                            const isSelected = currentVals.map(String).includes(String(opt.value));
                                                            return (
                                                                <button
                                                                    key={String(opt.value)}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const valStr = String(opt.value);
                                                                        const next = currentVals.map(String).includes(valStr)
                                                                            ? currentVals.filter((v: any) => String(v) !== valStr)
                                                                            : [...currentVals, valStr];
                                                                        onFilterChange(category.key, next);
                                                                    }}
                                                                    className={cn(
                                                                        "w-full flex items-center justify-between p-1.5 rounded-md text-left transition-all text-xs font-semibold uppercase tracking-wide cursor-pointer",
                                                                        isSelected
                                                                            ? "bg-primary-muted text-primary"
                                                                            : "text-text-main hover:bg-surface-muted"
                                                                    )}
                                                                >
                                                                    <span>{opt.label}</span>
                                                                    <div className={cn(
                                                                        "h-3.5 w-3.5 rounded border flex items-center justify-center transition-all shrink-0",
                                                                        isSelected
                                                                            ? "border-primary bg-primary text-white"
                                                                            : "border-surface-border bg-white"
                                                                    )}>
                                                                        {isSelected && <Check size={10} strokeWidth={3} />}
                                                                    </div>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </FilterCategoryAccordion>
                                        );
                                    })}
                                </div>

                                {/* Footer */}
                                <div className="p-3 border-t border-surface-border bg-surface-muted/20 flex justify-end gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            close();
                                        }}
                                        className="h-8 text-[10px] font-bold px-3 rounded-lg cursor-pointer"
                                    >
                                        BATAL
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={() => {
                                            close();
                                        }}
                                        className="h-8 text-[10px] font-bold px-3 rounded-lg cursor-pointer"
                                    >
                                        {totalResults !== undefined ? `TERAPKAN (${totalResults})` : 'TERAPKAN'}
                                    </Button>
                                </div>
                            </>
                        )}
                    </PopoverContent>
                </>
            )}
        </Popover>
    );
}
