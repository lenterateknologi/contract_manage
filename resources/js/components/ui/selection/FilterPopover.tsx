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
    Check
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
    const options = category.options || [];

    const filteredOptions = useMemo(() => {
        if (!query) return options;
        return options.filter((opt) =>
            opt.label.toLowerCase().includes(query.toLowerCase())
        );
    }, [options, query]);

    return (
        <Combobox
            multiple
            value={activeValues}
            onChange={(newValues: string[]) => onToggle(newValues)}
            onClose={() => setQuery('')}
        >
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
                                    onClick={() =>
                                        onToggle(activeValues.filter((v) => v !== val))
                                    }
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary text-white text-[10px] font-semibold hover:bg-primary/80 transition-colors"
                                >
                                    {opt?.label ?? val}
                                    <X size={9} strokeWidth={3} />
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Search input — Headless UI opens options automatically on focus */}
                <div className="relative">
                    <Search
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-soft pointer-events-none"
                        size={13}
                    />
                    <ComboboxInput
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={`Cari & pilih ${category.label.toLowerCase()}...`}
                        className="w-full h-8 pl-8 pr-3 text-xs bg-surface-muted/50 border border-surface-border rounded-lg focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none"
                    />
                </div>

                {/* Dropdown — shown automatically by Headless UI when input is focused */}
                <ComboboxOptions
                    anchor={{ to: 'bottom start', gap: 4 }}
                    className={cn(
                        'z-[99999] w-[var(--input-width)] min-w-[14rem]',
                        'border border-surface-border/60 rounded-lg bg-surface-base shadow-xl overflow-hidden empty:hidden',
                        'transition data-[leave]:data-[closed]:opacity-0 data-[leave]:duration-100'
                    )}
                >
                    <div className="p-1 space-y-0.5 max-h-52 overflow-auto">
                        {filteredOptions.length === 0 && (
                            <div className="py-5 text-center">
                                <p className="text-[10px] text-text-soft font-bold uppercase">
                                    Tidak ditemukan
                                </p>
                            </div>
                        )}
                        {filteredOptions.map((opt) => (
                            <ComboboxOption
                                key={String(opt.value)}
                                value={String(opt.value)}
                                className={({ focus, selected }) =>
                                    cn(
                                        'flex items-center justify-between p-1.5 rounded-md cursor-pointer transition-all text-xs font-semibold uppercase tracking-wide',
                                        selected
                                            ? 'bg-primary-muted text-primary'
                                            : 'text-text-main',
                                        focus && !selected && 'bg-surface-muted'
                                    )
                                }
                            >
                                {({ selected }) => (
                                    <>
                                        <span className="truncate">{opt.label}</span>
                                        <div
                                            className={cn(
                                                'h-3.5 w-3.5 rounded border flex items-center justify-center transition-all shrink-0',
                                                selected
                                                    ? 'border-primary bg-primary text-white'
                                                    : 'border-surface-border bg-white'
                                            )}
                                        >
                                            {selected && <Check size={10} strokeWidth={3} />}
                                        </div>
                                    </>
                                )}
                            </ComboboxOption>
                        ))}
                    </div>
                </ComboboxOptions>
            </div>
        </Combobox>
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
        <div className="space-y-2">
            <Label className="text-[10px] font-bold text-text-desc uppercase ">
                {category.label}
            </Label>
            <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                    <span className="text-[9px] font-bold text-text-soft uppercase">Mulai</span>
                    <input
                        type="date"
                        value={fromVal}
                        onChange={(e) => onFilterChange(fromKey, e.target.value)}
                        className="w-full h-8 px-2 text-[10px] font-bold bg-surface-muted/30 border border-surface-border rounded-lg text-text-main focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm"
                    />
                </div>
                <div className="space-y-1">
                    <span className="text-[9px] font-bold text-text-soft uppercase">Sampai</span>
                    <input
                        type="date"
                        value={toVal}
                        onChange={(e) => onFilterChange(toKey, e.target.value)}
                        className="w-full h-8 px-2 text-[10px] font-bold bg-surface-muted/30 border border-surface-border rounded-lg text-text-main focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm"
                    />
                </div>
            </div>
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
    const activeCount = React.useMemo(() => {
        const keys = categories.map(c => c.key);
        let count = 0;
        keys.forEach(key => {
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
                         className="w-80 sm:w-96 p-0 border border-surface-border/80 bg-surface-base/95 backdrop-blur-md shadow-2xl rounded-2xl overflow-hidden z-[9999]"
                     >
                         {/* Header */}
                         <div className="p-4 border-b border-surface-border bg-surface-muted/30 space-y-3">
                             <div className="flex items-center justify-between">
                                 <div className="flex items-center gap-2">
                                     <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-white shadow-sm">
                                         <Settings2 size={14} />
                                     </div>
                                     <div>
                                         <h4 className="text-xs font-bold text-text-main">Saringan Data</h4>
                                         <p className="text-[9px] font-medium text-text-desc">Persempit hasil pencarian</p>
                                     </div>
                                 </div>

                                 {hasActiveFilters && (
                                     <button
                                         type="button"
                                         onClick={onReset}
                                         className="flex h-7 px-2 items-center gap-1 rounded-lg bg-danger/10 hover:bg-danger hover:text-white text-danger transition-all shadow-sm"
                                     >
                                         <RotateCcw size={10} />
                                         <span className="text-[9px] font-bold uppercase ">Reset</span>
                                     </button>
                                 )}
                             </div>

                             {/* Search bar inside Filter Popover — sticky in header */}
                             <div className="relative">
                                 <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-soft pointer-events-none" size={13} />
                                 <input
                                     type="text"
                                     placeholder="Cari opsi penyaringan..."
                                     className="w-full h-8 pl-8 pr-3 text-xs bg-surface-muted/30 border border-surface-border rounded-lg text-text-main focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                     onChange={(e) => {
                                         const query = e.target.value.toLowerCase();
                                         // Simple local state dispatch/filtering for standard grid categories
                                         const buttons = document.querySelectorAll('[data-filter-opt]');
                                         buttons.forEach((el) => {
                                             const label = el.getAttribute('data-filter-opt') || '';
                                             if (label.toLowerCase().includes(query)) {
                                                 (el as HTMLElement).style.display = '';
                                             } else {
                                                 (el as HTMLElement).style.display = 'none';
                                             }
                                         });
                                     }}
                                 />
                             </div>
                         </div>

                         {/* Body - Filter Categories */}
                         <div className="p-4 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">

                             {categories.map((category) => {
                                const currentVals = Array.isArray(activeFilters[category.key])
                                    ? activeFilters[category.key]
                                    : activeFilters[category.key]
                                        ? [activeFilters[category.key]]
                                        : [];

                                return (
                                    <div key={category.key} className="space-y-2">
                                        {category.type === 'searchable' ? (
                                            <SearchableCategoryOptions
                                                category={category}
                                                activeValues={currentVals.map(String)}
                                                onToggle={(val) => {
                                                    const valStr = String(val);
                                                    const next = currentVals.map(String).includes(valStr)
                                                        ? currentVals.filter((v: any) => String(v) !== valStr)
                                                        : [...currentVals, valStr];
                                                    onFilterChange(category.key, next);
                                                }}
                                            />
                                        ) : category.type === 'date-range' ? (
                                            <DateRangeCategoryOptions
                                                category={category}
                                                activeFilters={activeFilters}
                                                onFilterChange={onFilterChange}
                                            />
                                        ) : (
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-bold text-text-desc uppercase ">
                                                    {category.label}
                                                </Label>
                                                <div className="grid grid-cols-1 gap-1 border border-surface-border/40 rounded-lg p-1 bg-surface-muted/5">
                                                    {category.options?.map((opt) => {
                                                        const isSelected = currentVals.map(String).includes(String(opt.value));
                                                        return (
                                                            <button
                                                                key={String(opt.value)}
                                                                type="button"
                                                                data-filter-opt={opt.label}
                                                                onClick={() => {
                                                                    const valStr = String(opt.value);
                                                                    const next = currentVals.map(String).includes(valStr)
                                                                        ? currentVals.filter((v: any) => String(v) !== valStr)
                                                                        : [...currentVals, valStr];
                                                                    onFilterChange(category.key, next);
                                                                }}
                                                                className={cn(
                                                                    "w-full flex items-center justify-between p-1.5 rounded-md text-left transition-all text-xs font-semibold uppercase tracking-wide",
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
                                            </div>
                                        )}
                                    </div>
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
                                className="h-8 text-[10px] font-bold px-3 rounded-lg"
                            >
                                BATAL
                            </Button>
                            <Button
                                type="button"
                                onClick={() => {
                                    close();
                                }}
                                className="h-8 text-[10px] font-bold px-3 rounded-lg"
                            >
                                {totalResults !== undefined ? `TERAPKAN (${totalResults})` : 'TERAPKAN'}
                            </Button>
                        </div>
                    </PopoverContent>
                </>
            )}
        </Popover>
    );
}
