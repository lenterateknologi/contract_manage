import React, { useState, useMemo } from 'react';
import {
    Search,
    RotateCcw,
    X,
    Settings2,
    Check,
    ChevronDown,
    ChevronUp,
    SlidersHorizontal,
    Filter,
    Calendar,
    MoreVertical
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/buttons/Button';
import { Label } from '@/components/ui/forms/Label';
import { DateRangePicker } from '@/components/ui/inputs/DateRangePicker';
import { SearchableMultiSelect } from '@/components/ui/selection/SearchableMultiSelect';
import type { FilterCategory, FilterOption } from './FilterPopover';

export interface SideFilterCardProps {
    categories: FilterCategory[];
    activeFilters: Record<string, any>;
    onFilterChange: (keyOrObj: string | Record<string, any>, value?: any) => void;
    onReset: () => void;
    totalResults?: number;
    actions?: React.ReactNode;
    className?: string;
    defaultExpanded?: boolean;
    storageKey?: string;
}

function SearchableCategoryOptions({
    category,
    activeValues,
    onToggle,
}: {
    category: FilterCategory;
    activeValues: string[];
    onToggle: (val: any) => void;
}) {
    const options = category.options || [];
    const searchableOptions = useMemo(() => {
        return options.map(opt => ({
            value: String(opt.value),
            label: opt.label
        }));
    }, [options]);

    return (
        <div className="w-full space-y-2">
            <SearchableMultiSelect
                values={activeValues}
                onValuesChange={onToggle}
                options={searchableOptions}
                placeholder={`Pilih ${category.label.toLowerCase()}...`}
                searchPlaceholder={`Cari ${category.label.toLowerCase()}...`}
                className="w-full"
            />
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
    onFilterChange: (keyOrObj: string | Record<string, any>, value?: any) => void
}) {
    const fromKey = `${category.key}_from`;
    const toKey = `${category.key}_to`;
    const fromVal = typeof activeFilters[fromKey] === 'string' ? activeFilters[fromKey].split('T')[0] : '';
    const toVal = typeof activeFilters[toKey] === 'string' ? activeFilters[toKey].split('T')[0] : '';

    return (
        <div className="w-full">
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

function CategoryAccordion({
    title,
    activeCount,
    onClear,
    children,
    defaultOpen = true
}: {
    title: string;
    activeCount?: number;
    onClear?: () => void;
    children: React.ReactNode;
    defaultOpen?: boolean;
}) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="border-b border-surface-border/40 pb-2.5">
            <div className="w-full flex items-center justify-between py-1.5 transition-colors text-left select-none">
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-1.5 flex-1 cursor-pointer"
                >
                    <span className="text-[10px] font-bold text-text-desc uppercase tracking-wider">
                        {title}
                    </span>
                    {activeCount !== undefined && activeCount > 0 && (
                        <span className="text-[9px] font-bold text-primary bg-primary-muted px-1.5 py-0.2 rounded-md">
                            {activeCount}
                        </span>
                    )}
                </button>
                <div className="flex items-center gap-1.5">
                    {activeCount !== undefined && activeCount > 0 && onClear && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onClear();
                            }}
                            className="text-[9px] font-semibold text-muted-foreground hover:text-danger px-1 py-0.5 rounded hover:bg-danger/10 transition-all cursor-pointer uppercase"
                            title={`Reset ${title}`}
                        >
                            Clear
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => setIsOpen(!isOpen)}
                        className="text-text-desc hover:text-text-main cursor-pointer"
                    >
                        {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                </div>
            </div>

            {isOpen && (
                <div className="pt-1.5 space-y-2">
                    {children}
                </div>
            )}
        </div>
    );
}

export function SideFilterCard({
    categories,
    activeFilters,
    onFilterChange,
    onReset,
    totalResults,
    actions,
    className,
    defaultExpanded = false,
    storageKey = 'side_filter'
}: SideFilterCardProps) {
    const expandedStorageKey = `${storageKey}_expanded`;
    const modeStorageKey = `${storageKey}_mode`;

    const [isExpanded, setIsExpanded] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(expandedStorageKey);
            return saved !== null ? saved === 'true' : defaultExpanded;
        }
        return defaultExpanded;
    });
    const [activeMode, setActiveMode] = useState<'filter' | 'actions'>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(modeStorageKey);
            return (saved === 'filter' || saved === 'actions') ? saved : 'filter';
        }
        return 'filter';
    });
    const [draftFilters, setDraftFilters] = useState<Record<string, any>>(activeFilters);

    // Sync draft filters whenever activeFilters props change externally
    React.useEffect(() => {
        setDraftFilters(activeFilters);
    }, [activeFilters]);

    const handleLocalToggle = (keyOrObj: string | Record<string, any>, value?: any) => {
        if (typeof keyOrObj === 'object') {
            setDraftFilters(prev => ({ ...prev, ...keyOrObj }));
        } else {
            setDraftFilters(prev => ({ ...prev, [keyOrObj]: value }));
        }
    };

    const handleApply = () => {
        onFilterChange(draftFilters);
    };

    const handleResetAll = () => {
        setDraftFilters({});
        onReset();
    };

    const activeCount = React.useMemo(() => {
        const keys = categories.map(c => c.key);
        let count = 0;
        keys.forEach(key => {
            if (key === 'created') {
                if (draftFilters['created_from']) count += 1;
                if (draftFilters['created_to']) count += 1;
                return;
            }
            const val = draftFilters[key];
            if (Array.isArray(val)) {
                count += val.filter(v => v !== '' && v !== null).length;
            } else if (val !== undefined && val !== '' && val !== null) {
                count += 1;
            }
        });
        return count;
    }, [draftFilters, categories]);

    const hasActiveFilters = activeCount > 0;

    const handleOpenMode = (mode: 'filter' | 'actions') => {
        if (isExpanded && activeMode === mode) {
            setIsExpanded(false);
            localStorage.setItem(expandedStorageKey, 'false');
        } else {
            setActiveMode(mode);
            setIsExpanded(true);
            localStorage.setItem(modeStorageKey, mode);
            localStorage.setItem(expandedStorageKey, 'true');
        }
    };

    return (
        <div
            className={cn(
                "transition-all duration-300 shrink-0 select-none flex flex-col h-full overflow-hidden",
                isExpanded ? "w-68" : "w-10",
                className
            )}
        >
            {/* Header */}
            <div className="pb-3 border-b border-surface-border flex items-center justify-between">
                {isExpanded ? (
                    <>
                        <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-white shadow-none shrink-0">
                                {activeMode === 'actions' ? <MoreVertical size={13} /> : <Settings2 size={13} />}
                            </div>
                            <div className="truncate">
                                <h4 className="text-xs font-bold text-text-main flex items-center gap-1.5">
                                    {activeMode === 'actions' ? 'Aksi' : 'Filter'}
                                    {activeMode === 'filter' && hasActiveFilters && (
                                        <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-extrabold bg-primary text-primary-foreground">
                                            {activeCount}
                                        </span>
                                    )}
                                </h4>
                            </div>
                        </div>

                        <div className="flex items-center gap-1">
                            {activeMode === 'filter' && hasActiveFilters && (
                                <button
                                    type="button"
                                    onClick={handleResetAll}
                                    className="flex h-6 px-2 items-center gap-1 rounded-md bg-danger/10 hover:bg-danger hover:text-white text-danger transition-all cursor-pointer"
                                    title="Reset Filter"
                                >
                                    <RotateCcw size={10} />
                                    <span className="text-[9px] font-bold uppercase">Reset</span>
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={() => setIsExpanded(false)}
                                className="flex h-7 w-7 items-center justify-center rounded-lg border border-amber-200/80 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-all duration-200 shadow-2xs cursor-pointer mr-2"
                                title="Ciutkan"
                            >
                                <ChevronUp size={14} className="rotate-90" />
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="w-full flex flex-col items-center justify-center gap-3 py-1">
                        {/* Filter Button Icon */}
                        <button
                            type="button"
                            onClick={() => handleOpenMode('filter')}
                            className={cn(
                                "relative flex items-center justify-center p-2 rounded-xl transition-all duration-200 cursor-pointer shadow-xs",
                                isExpanded && activeMode === 'filter'
                                    ? "bg-primary text-white"
                                    : "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-primary hover:text-white"
                            )}
                            title="Buka Filter"
                        >
                            <SlidersHorizontal size={16} />
                            {hasActiveFilters && (
                                <span className="absolute -top-1 -right-1 flex h-3.5 min-w-[14px] items-center justify-center rounded-full px-1 text-[8px] font-extrabold bg-primary text-primary-foreground ring-2 ring-white dark:ring-zinc-900">
                                    {activeCount}
                                </span>
                            )}
                        </button>

                        {/* More Button Icon */}
                        {actions && (
                            <button
                                type="button"
                                onClick={() => handleOpenMode('actions')}
                                className={cn(
                                    "flex items-center justify-center p-2 rounded-xl transition-all duration-200 cursor-pointer shadow-xs",
                                    isExpanded && activeMode === 'actions'
                                        ? "bg-primary text-white"
                                        : "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-primary hover:text-white"
                                )}
                                title="Buka Aksi (More)"
                            >
                                <MoreVertical size={16} />
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Body */}
            {isExpanded && activeMode === 'actions' && actions && (
                <div className="pt-3 space-y-2 flex-1 overflow-y-auto custom-scrollbar">
                    <span className="text-[10px] font-bold text-text-soft uppercase tracking-wider block px-1">Opsi Terkait</span>
                    <div>
                        {actions}
                    </div>
                </div>
            )}

            {/* Body */}
            {isExpanded && activeMode === 'filter' && (
                <>
                    <div className="pt-3 space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-1">
                        {categories.map((category) => {
                            if (category.type !== 'date-range') {
                                if (!category.options || category.options.length <= 1) {
                                    return null;
                                }
                            }

                            const currentVals = Array.isArray(draftFilters[category.key])
                                ? draftFilters[category.key]
                                : draftFilters[category.key]
                                    ? [draftFilters[category.key]]
                                    : [];

                            const isDateRange = category.type === 'date-range';
                            const dateFromKey = `${category.key}_from`;
                            const dateToKey = `${category.key}_to`;
                            const hasDateVal = Boolean(draftFilters[dateFromKey] || draftFilters[dateToKey]);
                            const activeCountForCat = isDateRange ? Number(hasDateVal) : currentVals.length;

                            return (
                                <CategoryAccordion
                                    key={category.key}
                                    title={category.label}
                                    activeCount={activeCountForCat}
                                    onClear={() => {
                                        if (isDateRange) {
                                            handleLocalToggle({ [dateFromKey]: '', [dateToKey]: '' });
                                        } else {
                                            handleLocalToggle(category.key, []);
                                        }
                                    }}
                                    defaultOpen={true}
                                >
                                    {category.type === 'date-range' ? (
                                        <DateRangeCategoryOptions
                                            category={category}
                                            activeFilters={draftFilters}
                                            onFilterChange={handleLocalToggle}
                                        />
                                    ) : (
                                        <SearchableCategoryOptions
                                            category={category}
                                            activeValues={currentVals.map(String)}
                                            onToggle={(next) => handleLocalToggle(category.key, next)}
                                        />
                                    )}
                                </CategoryAccordion>
                            );
                        })}
                    </div>

                    {/* Fixed Bottom Apply Button Container */}
                    <div className="pt-3 mt-auto border-t border-border bg-transparent">
                        <Button
                            type="button"
                            variant="primary"
                            onClick={handleApply}
                            className="w-full h-9 text-xs font-bold uppercase tracking-wider rounded-xl shadow-none cursor-pointer"
                        >
                            <Filter size={13} className="mr-1.5" />
                            {totalResults !== undefined ? `Terapkan Filter (${totalResults})` : 'Terapkan Filter'}
                        </Button>
                    </div>
                </>
            )}
        </div>
    );
}
