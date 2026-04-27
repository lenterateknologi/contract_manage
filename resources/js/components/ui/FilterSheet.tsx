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
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block px-0.5">
                {category.label}
            </Label>

            <div className="relative">
                <Popover>
                    <PopoverTrigger className={cn(
                        "w-full flex items-center justify-between h-10 pl-3 pr-10 rounded-none border transition-all text-left overflow-hidden relative",
                        activeValues.length > 0 ? "border-black bg-white" : "border-slate-200 bg-white hover:border-black"
                    )}>
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                            <Search size={14} className="text-slate-400 shrink-0" />
                            <div className="flex-1 truncate">
                                {activeValues.length > 0 ? (
                                    <span className="text-[11px] font-black uppercase tracking-tight text-slate-900">
                                        {activeValues.length} DIPILIH: {activeOptions.map(o => o.label).join(", ")}
                                    </span>
                                ) : (
                                    <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                                        PILIH {category.label}...
                                    </span>
                                )}
                            </div>
                        </div>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300" />
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-[300px] p-0 overflow-hidden rounded-none border-black shadow-2xl ring-1 ring-black/10">
                        <div className="p-2 border-b border-slate-100 bg-white">
                            <div className="relative">
                                <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                <Input 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="CARI..."
                                    className="h-8 pl-8 text-[11px] bg-slate-50 border-none rounded-none focus-visible:ring-1 focus-visible:ring-black placeholder:text-slate-400"
                                />
                            </div>
                        </div>
                        
                        <ScrollArea className="h-[240px]">
                            <div className="p-1 grid gap-0.5">
                                {filteredOptions.length === 0 ? (
                                    <div className="py-8 text-center">
                                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Tidak ada hasil</p>
                                    </div>
                                ) : (
                                    filteredOptions.map((opt) => {
                                        const isSelected = activeValues.includes(String(opt.value));
                                        return (
                                            <button 
                                                key={String(opt.value)}
                                                onClick={() => onToggle(opt.value)}
                                                className={cn(
                                                    "flex items-center gap-3 p-2.5 rounded-none text-left transition-all border border-transparent",
                                                    isSelected ? "bg-black text-white" : "hover:bg-slate-100"
                                                )}
                                            >
                                                <div className={cn(
                                                    "h-3.5 w-3.5 rounded-none border flex items-center justify-center shrink-0",
                                                    isSelected ? "bg-white border-white" : "bg-white border-slate-300 shadow-sm"
                                                )}>
                                                    {isSelected && <Check size={10} className="text-black" strokeWidth={5} />}
                                                </div>
                                                <span className="text-[11px] font-black truncate uppercase tracking-tight">
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
                        className="absolute right-8 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center text-slate-300 hover:text-black hover:bg-slate-100 transition-all rounded-sm z-10"
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
                            className="bg-slate-100 text-slate-600 border border-slate-200 hover:border-black hover:text-black cursor-pointer text-[9px] font-black px-1.5 py-0 rounded-none transition-all gap-1 uppercase tracking-tighter"
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
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                    {category.label}
                </Label>
                {hasValue && (
                    <button 
                        onClick={() => {
                            onFilterChange(fromKey, '');
                            onFilterChange(toKey, '');
                        }}
                        className="text-[10px] font-bold text-slate-400 hover:text-black uppercase tracking-tighter"
                    >
                        HAPUS
                    </button>
                )}
            </div>

            <div className="grid grid-cols-2 gap-px bg-slate-200 border border-slate-200">
                <div className="relative bg-white">
                    <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={12} />
                    <input 
                        type="date"
                        value={fromVal}
                        onChange={(e) => onFilterChange(fromKey, e.target.value)}
                        className="w-full h-10 pl-8 pr-2 text-[10px] font-black uppercase border-none focus:ring-1 focus:ring-inset focus:ring-black outline-none"
                    />
                </div>
                <div className="relative bg-white">
                    <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={12} />
                    <input 
                        type="date"
                        value={toVal}
                        onChange={(e) => onFilterChange(toKey, e.target.value)}
                        className="w-full h-10 pl-8 pr-2 text-[10px] font-black uppercase border-none focus:ring-1 focus:ring-inset focus:ring-black outline-none"
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
            <SheetContent side="right" className="w-[320px] p-0 flex flex-col border-l border-black bg-white">
                {/* Header - Unified Monochrome */}
                <div className="p-4 bg-black text-white flex-shrink-0 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ListFilter size={16} />
                        <SheetTitle className="text-xs font-black uppercase tracking-[0.2em] text-white m-0">FILTER</SheetTitle>
                    </div>
                    {hasActiveFilters && (
                        <button 
                            onClick={onReset}
                            className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all bg-white/10 px-2 py-1 rounded-none border border-white/10 hover:border-white/20"
                        >
                            <Trash2 size={10} />
                            HAPUS SEMUA
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
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
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
                                                    className="text-[10px] font-bold text-slate-400 hover:text-black uppercase tracking-tighter"
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
                                                            isSelected ? "border-black bg-black text-white" : "border-slate-100 bg-white hover:border-black"
                                                        )}
                                                    >
                                                        <div className={cn(
                                                            "h-3.5 w-3.5 rounded-none border flex items-center justify-center shrink-0",
                                                            isSelected ? "bg-white border-white" : "bg-white border-slate-200 group-hover:border-black"
                                                        )}>
                                                            {isSelected && <Check size={10} className="text-black" strokeWidth={5} />}
                                                        </div>
                                                        <span className="text-[11px] font-black uppercase tracking-tight">
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

                {/* Footer - Solid Monochrome */}
                <SheetFooter className="p-4 bg-white border-t border-slate-100 flex-shrink-0">
                    <Button 
                        onClick={() => onOpenChange(false)}
                        className="h-11 w-full rounded-none text-[11px] font-black uppercase tracking-[0.2em] bg-black text-white hover:bg-slate-800 transition-all shadow-none border-none"
                    >
                        {totalResults !== undefined ? `${applyText} (${totalResults})` : applyText}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
