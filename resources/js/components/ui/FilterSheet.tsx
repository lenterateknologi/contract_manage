import React, { useState, useMemo } from 'react';
import { 
    Filter as FilterIcon, 
    X, 
    RotateCcw,
    Search,
    ChevronDown,
    Check,
    ListFilter,
    Trash2,
    Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from "@/components/ui/sheet";
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

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

export interface FilterSheetProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    categories: FilterCategory[];
    activeFilters: Record<string, any>; // Relaxed for date ranges
    onFilterChange: (key: string, value: any) => void;
    onReset: () => void;
    totalResults?: number;
    applyText?: string;
}

function SearchableCategory({ 
    category, 
    activeValues = [], 
    onToggle 
}: { 
    category: FilterCategory; 
    activeValues: string[]; 
    onToggle: (val: any) => void 
}) {
    const [searchTerm, setSearchTerm] = useState('');
    const options = category.options || [];

    const filteredOptions = useMemo(() => {
        if (!searchTerm) return options;
        return options.filter(opt => 
            opt.label.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [options, searchTerm]);

    const activeOptions = useMemo(() => {
        return options.filter(opt => activeValues.includes(String(opt.value)));
    }, [options, activeValues]);

    return (
        <div className="space-y-1.5 font-sans">
            <Label className="text-[11px] font-semibold text-black/50 dark:text-white/50 block px-0.5">
                {category.label}
            </Label>

            <div className="relative">
                <Popover>
                    <PopoverTrigger className={cn(
                        "w-full flex items-center justify-between h-10 pl-3 pr-10 rounded-lg border transition-all text-left overflow-hidden relative",
                        activeValues.length > 0 
                            ? "border-black dark:border-white bg-black/5 dark:bg-white/5 text-black dark:text-white" 
                            : "border-black/20 dark:border-white/20 bg-white dark:bg-sidebar text-black dark:text-white hover:border-black dark:hover:border-white"
                    )}>
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                            <Search size={14} className="text-black/40 dark:text-white/40 shrink-0" />
                            <div className="flex-1 truncate">
                                {activeValues.length > 0 ? (
                                    <span className="text-[11px] font-bold text-black dark:text-white">
                                        {activeValues.length} Terpilih: {activeOptions.map(o => o.label).join(", ")}
                                    </span>
                                ) : (
                                    <span className="text-[11px] text-black dark:text-white font-medium">
                                        Pilih {category.label}...
                                    </span>
                                )}
                            </div>
                        </div>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-black/40 dark:text-white/40" />
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-[300px] p-0 overflow-hidden rounded-xl border-black/20 dark:border-white/20 bg-white dark:bg-sidebar shadow-2xl ring-1 ring-black/10">
                        <div className="p-2 border-b border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-black/40 dark:text-white/40" size={14} />
                                <Input 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Cari..."
                                    className="h-9 pl-8 text-[12px] bg-white dark:bg-sidebar border-black/20 dark:border-white/20 rounded-md focus-visible:ring-1 focus-visible:ring-black dark:focus-visible:ring-white placeholder:text-black/30 dark:placeholder:text-white/30 font-medium text-black dark:text-white"
                                />
                            </div>
                        </div>
                        
                        <ScrollArea className="h-[240px]">
                            <div className="p-1 grid gap-0.5">
                                {filteredOptions.length === 0 ? (
                                    <div className="py-8 text-center">
                                        <p className="text-[10px] text-black/40 dark:text-white/40 font-bold uppercase tracking-widest">Tidak ada hasil</p>
                                    </div>
                                ) : (
                                    filteredOptions.map((opt) => {
                                        const isSelected = activeValues.includes(String(opt.value));
                                        return (
                                            <button 
                                                key={String(opt.value)}
                                                onClick={() => onToggle(opt.value)}
                                                className={cn(
                                                    "flex items-center gap-3 p-3 rounded-none text-left transition-all border-b border-black/5 dark:border-white/5",
                                                    isSelected 
                                                        ? "bg-black/5 dark:bg-white/5 text-black dark:text-white" 
                                                        : "text-black/70 dark:text-white/70 hover:bg-black/10 dark:hover:bg-white/10"
                                                )}
                                            >
                                                <div className={cn(
                                                    "h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-all",
                                                    isSelected 
                                                        ? "bg-black dark:bg-white border-black dark:border-white" 
                                                        : "bg-white dark:bg-sidebar border-black/20 dark:border-white/20 hover:border-black dark:hover:border-white"
                                                )}>
                                                    {isSelected && <Check size={12} className="text-white dark:text-black" strokeWidth={4} />}
                                                </div>
                                                <span className={cn(
                                                    "text-[11px] font-semibold truncate",
                                                    isSelected ? "text-black dark:text-white" : "text-black dark:text-white"
                                                )}>
                                                    {opt.label}
                                                </span>
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </ScrollArea>
                    </PopoverContent>
                </Popover>

                {activeValues.length > 0 && (
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            activeValues.forEach(v => onToggle(v));
                        }}
                        className="absolute right-8 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center text-black/30 dark:text-white/30 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all rounded-sm z-10"
                        title="Kosongkan"
                    >
                        <X size={14} strokeWidth={3} />
                    </button>
                )}
            </div>

            {activeValues.length > 0 && (
                <div className="flex flex-wrap gap-1 px-0.5 pt-0.5">
                    {activeOptions.map(opt => (
                        <Badge 
                            key={String(opt.value)}
                            className="bg-black/5 dark:bg-white/5 text-black dark:text-white border border-black/10 dark:border-white/10 hover:border-black dark:hover:border-white cursor-pointer text-[9px] font-black px-1.5 py-0 rounded-none transition-all gap-1 uppercase tracking-tighter"
                            onClick={() => onToggle(opt.value)}
                        >
                            {opt.label}
                            <X size={10} strokeWidth={3} />
                        </Badge>
                    ))}
                </div>
            )}
        </div>
    );
}

function DateRangeCategory({ 
    category, 
    activeFilters, 
    onFilterChange 
}: { 
    category: FilterCategory; 
    activeFilters: Record<string, any>; 
    onFilterChange: (key: string, value: any) => void 
}) {
    // We expect keys like 'created_from' and 'created_to' for a category with base key 'created'
    const fromKey = `${category.key}_from`;
    const toKey = `${category.key}_to`;
    const fromValRaw = activeFilters[fromKey] || '';
    const toValRaw = activeFilters[toKey] || '';
    const fromVal = typeof fromValRaw === 'string' ? fromValRaw.split('T')[0] : '';
    const toVal = typeof toValRaw === 'string' ? toValRaw.split('T')[0] : '';

    const hasValue = fromVal || toVal;

    return (
        <div className="space-y-1.5 font-sans">
            <div className="flex items-center justify-between px-0.5">
                <Label className="text-[11px] font-bold text-black dark:text-white block">
                    {category.label}
                </Label>
                {hasValue && (
                    <button 
                        onClick={() => {
                            onFilterChange(fromKey, '');
                            onFilterChange(toKey, '');
                        }}
                        className="text-[10px] font-bold text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white uppercase tracking-tighter"
                    >
                        HAPUS
                    </button>
                )}
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-black/30 dark:text-white/30 pointer-events-none" size={14} />
                    <input 
                        type="date"
                        value={fromVal}
                        onChange={(e) => onFilterChange(fromKey, e.target.value)}
                        className="w-full h-11 pl-9 pr-2 text-[10px] font-bold uppercase bg-white dark:bg-sidebar border border-black/20 dark:border-white/20 rounded-lg text-black dark:text-white focus:ring-1 focus:ring-black dark:focus:ring-white outline-none transition-all"
                    />
                </div>
                <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-black/30 dark:text-white/30 pointer-events-none" size={14} />
                    <input 
                        type="date"
                        value={toVal}
                        onChange={(e) => onFilterChange(toKey, e.target.value)}
                        className="w-full h-11 pl-9 pr-2 text-[11px] font-medium bg-white dark:bg-sidebar border border-black/20 dark:border-white/20 rounded-lg text-black dark:text-white focus:ring-1 focus:ring-black dark:focus:ring-white outline-none transition-all"
                    />
                </div>
            </div>
        </div>
    );
}

export function FilterSheet({
    isOpen,
    onOpenChange,
    title,
    description,
    categories,
    activeFilters,
    onFilterChange,
    onReset,
    totalResults,
    applyText = "TERAPKAN"
}: FilterSheetProps) {
    const activeCount = Object.values(activeFilters).flat().filter(v => v !== '' && v !== null).length;
    const hasActiveFilters = activeCount > 0;

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-[340px] p-0 flex flex-col border-l border-black/10 dark:border-white/10 bg-white dark:bg-sidebar shadow-2xl">
                {/* Header - Unified Theme */}
                <div className="p-6 border-b border-black/10 dark:border-white/10 flex-shrink-0 flex items-center justify-between bg-black/5 dark:bg-white/5">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-black dark:text-white">
                            <ListFilter size={18} strokeWidth={2.5} />
                            <SheetTitle className="text-sm font-bold text-black dark:text-white m-0">Filter</SheetTitle>
                        </div>
                        <p className="text-[11px] font-semibold text-black dark:text-white">{description}</p>
                    </div>
                    {hasActiveFilters && (
                        <button 
                            onClick={onReset}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all border border-rose-500/20"
                            title="Reset Semua"
                        >
                            <RotateCcw size={14} strokeWidth={2.5} />
                        </button>
                    )}
                </div>

                {/* Categories - Compact Monochrome */}
                <ScrollArea className="flex-1">
                    <div className="p-4 space-y-8">
                        {categories.map((category) => (
                            <React.Fragment key={category.key}>
                                {category.type === 'searchable' ? (
                                    <SearchableCategory 
                                        category={category} 
                                        activeValues={Array.isArray(activeFilters[category.key]) ? activeFilters[category.key] : activeFilters[category.key] ? [activeFilters[category.key]] : []} 
                                        onToggle={(val) => onFilterChange(category.key, val)}
                                    />
                                ) : category.type === 'date-range' ? (
                                    <DateRangeCategory 
                                        category={category} 
                                        activeFilters={activeFilters} 
                                        onFilterChange={onFilterChange}
                                    />
                                ) : (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between px-0.5">
                                            <Label className="text-[11px] font-bold text-black dark:text-white block">
                                                {category.label}
                                            </Label>
                                            {((Array.isArray(activeFilters[category.key]) && activeFilters[category.key].length > 0) || (!Array.isArray(activeFilters[category.key]) && activeFilters[category.key])) && (
                                                <button 
                                                    onClick={() => {
                                                        if (Array.isArray(activeFilters[category.key])) {
                                                            activeFilters[category.key].forEach((v: any) => onFilterChange(category.key, v));
                                                        } else {
                                                            onFilterChange(category.key, '');
                                                        }
                                                    }}
                                                    className="text-[10px] font-bold text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white uppercase tracking-tighter"
                                                >
                                                    HAPUS
                                                </button>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-1 gap-1">
                                            {category.options?.map((opt) => {
                                                const currentVals = Array.isArray(activeFilters[category.key]) ? activeFilters[category.key] : activeFilters[category.key] ? [activeFilters[category.key]] : [];
                                                const isSelected = currentVals.includes(String(opt.value));
                                                return (
                                                    <button 
                                                        key={String(opt.value)}
                                                        onClick={() => onFilterChange(category.key, opt.value)}
                                                        className={cn(
                                                            "flex items-center gap-3 p-2.5 rounded-none border transition-all text-left group",
                                                            isSelected ? "border-black dark:border-white bg-black dark:bg-white text-white dark:text-black" : "border-black/10 dark:border-white/10 bg-white dark:bg-sidebar hover:border-black dark:hover:border-white"
                                                        )}
                                                    >
                                                        <div className={cn(
                                                            "h-3.5 w-3.5 rounded-none border flex items-center justify-center shrink-0",
                                                            isSelected ? "bg-white dark:bg-black border-white dark:border-black" : "bg-white dark:bg-sidebar border-black/20 dark:border-white/20 group-hover:border-black dark:group-hover:border-white"
                                                        )}>
                                                            {isSelected && <Check size={10} className="text-black dark:text-white" strokeWidth={5} />}
                                                        </div>
                                                        <span className="text-[12px] font-semibold">
                                                            {opt.label}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </ScrollArea>

                {/* Footer - Solid Theme */}
                <SheetFooter className="p-6 bg-black/5 dark:bg-white/5 border-t border-black/10 dark:border-white/10 flex-shrink-0">
                    <Button 
                        onClick={() => onOpenChange(false)}
                        className="h-12 w-full rounded-xl text-[12px] font-bold bg-black dark:bg-white text-white dark:text-black hover:opacity-90 transition-all shadow-xl border-none"
                    >
                        {totalResults !== undefined ? `Terapkan (${totalResults})` : 'Terapkan'}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
