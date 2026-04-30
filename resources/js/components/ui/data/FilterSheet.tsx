import React, { useState, useMemo } from 'react';
import { 
    Filter as FilterIcon, 
    X, 
    RotateCcw,
    Search,
    ChevronDown,
    Check,
    ListFilter,
    Calendar,
    Settings2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/base/Button';
import { Label } from '@/components/ui/base/Label';
import { Badge } from '@/components/ui/base/Badge';
import { ScrollArea } from '@/components/ui/base/ScrollArea';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from "@/components/ui/overlays/Sheet";
import { Input } from '@/components/ui/base/Input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/overlays/Popover';

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
    activeFilters: Record<string, any>;
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
        <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
                <Label className="text-[9px] font-black tracking-[0.2em] text-primary/40 uppercase dark:text-white/40">
                    {category.label}
                </Label>
                {activeValues.length > 0 && (
                    <span className="text-[8px] font-bold text-primary dark:text-white bg-primary/[0.05] dark:bg-white/[0.05] px-2 py-0.5 rounded-full">
                        {activeValues.length} Terpilih
                    </span>
                )}
            </div>

            <div className="relative">
                <Popover>
                    <PopoverTrigger className={cn(
                        "w-full flex items-center justify-between h-10 pl-4 pr-10 rounded-xl border transition-all text-left group active:scale-[0.98]",
                        activeValues.length > 0 
                            ? "border-primary dark:border-white bg-primary/[0.02] dark:bg-white/[0.02] shadow-sm" 
                            : "border-primary/10 dark:border-white/10 bg-white dark:bg-sidebar-accent/5 hover:border-primary dark:hover:border-white"
                    )}>
                            <div className="flex items-center gap-3 min-w-0">
                                <Search size={13} className={cn("shrink-0 transition-colors", activeValues.length > 0 ? "text-primary dark:text-white" : "text-primary/20 dark:text-white/20")} />
                                <div className="truncate">
                                    {activeValues.length > 0 ? (
                                        <span className="text-[10px] font-black tracking-tight text-primary dark:text-white">
                                            {activeOptions.map(o => o.label).join(", ")}
                                        </span>
                                    ) : (
                                        <span className="text-[10px] font-bold text-primary/30 dark:text-white/30 uppercase tracking-widest">
                                            Pilih {category.label}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <ChevronDown size={13} className="absolute right-4 text-primary/20 dark:text-white/20 group-hover:text-primary dark:group-hover:text-white transition-colors" />
                        </PopoverTrigger>
                    <PopoverContent align="start" className="w-[300px] p-0 overflow-hidden rounded-xl border-primary/10 dark:border-white/10 bg-white/80 dark:bg-sidebar/80 backdrop-blur-xl shadow-2xl ring-1 ring-primary/5">
                        <div className="p-2.5 border-b border-primary/5 dark:border-white/5 bg-primary/[0.02] dark:bg-white/[0.02]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/30 dark:text-white/30" size={13} />
                                <Input 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Cari opsi..."
                                    className="h-9 pl-9 text-[10px] font-bold bg-white dark:bg-sidebar border-primary/5 dark:border-white/5 rounded-lg focus-visible:ring-0 focus-visible:border-primary dark:focus-visible:border-white placeholder:text-primary/20 dark:placeholder:text-white/20 uppercase tracking-wider"
                                />
                            </div>
                        </div>
                        
                        <ScrollArea className="h-[240px]">
                            <div className="p-1 space-y-0.5">
                                {filteredOptions.length === 0 ? (
                                    <div className="py-10 text-center">
                                        <p className="text-[8px] text-primary/20 dark:text-white/20 font-black uppercase tracking-[0.3em]">Opsi tidak ditemukan</p>
                                    </div>
                                ) : (
                                    filteredOptions.map((opt) => {
                                        const isSelected = activeValues.includes(String(opt.value));
                                        return (
                                            <button 
                                                key={String(opt.value)}
                                                onClick={() => onToggle(opt.value)}
                                                className={cn(
                                                    "w-full flex items-center justify-between p-3 rounded-lg text-left transition-all group",
                                                    isSelected 
                                                        ? "bg-primary dark:bg-white text-white dark:text-primary shadow-lg shadow-primary/10 dark:shadow-white/5" 
                                                        : "text-primary/60 dark:text-white/60 hover:bg-primary/[0.03] dark:hover:bg-white/[0.03] hover:text-primary dark:hover:text-white"
                                                )}
                                            >
                                                <span className="text-[10px] font-black tracking-tight uppercase">
                                                    {opt.label}
                                                </span>
                                                {isSelected ? (
                                                    <Check size={13} strokeWidth={3} />
                                                ) : (
                                                    <div className="h-3.5 w-3.5 rounded-full border-2 border-primary/10 dark:border-white/10 group-hover:border-primary dark:group-hover:border-white transition-colors" />
                                                )}
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
                        className="absolute right-9 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center text-primary/20 dark:text-white/20 hover:text-rose-500 hover:bg-rose-500/10 transition-all rounded-lg z-10"
                        title="Reset Kategori"
                    >
                        <X size={12} strokeWidth={3} />
                    </button>
                )}
            </div>

            {activeValues.length > 0 && (
                <div className="flex flex-wrap gap-1 px-1 pt-0.5">
                    {activeOptions.map(opt => (
                        <Badge 
                            key={String(opt.value)}
                            className="bg-primary text-white dark:bg-white dark:text-primary border-none hover:opacity-80 cursor-pointer text-[8px] font-black px-2 py-0.5 rounded-lg transition-all gap-1.5 uppercase tracking-widest shadow-sm active:scale-95"
                            onClick={() => onToggle(opt.value)}
                        >
                            {opt.label}
                            <X size={9} strokeWidth={4} />
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
    const fromKey = `${category.key}_from`;
    const toKey = `${category.key}_to`;
    const fromVal = typeof activeFilters[fromKey] === 'string' ? activeFilters[fromKey].split('T')[0] : '';
    const toVal = typeof activeFilters[toKey] === 'string' ? activeFilters[toKey].split('T')[0] : '';

    const hasValue = fromVal || toVal;

    return (
        <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
                <Label className="text-[9px] font-black tracking-[0.2em] text-primary/40 uppercase dark:text-white/40">
                    {category.label}
                </Label>
                {hasValue && (
                    <button 
                        onClick={() => {
                            onFilterChange(fromKey, '');
                            onFilterChange(toKey, '');
                        }}
                        className="text-[8px] font-black text-rose-500 hover:underline uppercase tracking-widest"
                    >
                        RESET
                    </button>
                )}
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <span className="ml-1 text-[7px] font-black tracking-[0.2em] text-primary/20 dark:text-white/20 uppercase">Mulai</span>
                    <div className="relative group">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/20 dark:text-white/20 group-hover:text-primary dark:group-hover:text-white transition-colors pointer-events-none" size={13} />
                        <input 
                            type="date"
                            value={fromVal}
                            onChange={(e) => onFilterChange(fromKey, e.target.value)}
                            className="w-full h-10 pl-9 pr-2 text-[9px] font-black uppercase bg-white dark:bg-sidebar-accent/5 border border-primary/10 dark:border-white/10 rounded-xl text-primary dark:text-white focus:border-primary dark:focus:border-white outline-none transition-all shadow-sm group-hover:border-primary/30 dark:group-hover:border-white/30"
                        />
                    </div>
                </div>
                <div className="space-y-1">
                    <span className="ml-1 text-[7px] font-black tracking-[0.2em] text-primary/20 dark:text-white/20 uppercase">Sampai</span>
                    <div className="relative group">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/20 dark:text-white/20 group-hover:text-primary dark:group-hover:text-white transition-colors pointer-events-none" size={13} />
                        <input 
                            type="date"
                            value={toVal}
                            onChange={(e) => onFilterChange(toKey, e.target.value)}
                            className="w-full h-10 pl-9 pr-2 text-[9px] font-black uppercase bg-white dark:bg-sidebar-accent/5 border border-primary/10 dark:border-white/10 rounded-xl text-primary dark:text-white focus:border-primary dark:focus:border-white outline-none transition-all shadow-sm group-hover:border-primary/30 dark:group-hover:border-white/30"
                        />
                    </div>
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
            <SheetContent side="right" className="w-full sm:max-w-[360px] p-0 flex flex-col border-l border-primary/5 dark:border-white/5 bg-white dark:bg-[#09090b] shadow-2xl overflow-hidden">
                {/* Header - Compact Premium Glassmorphism */}
                <div className="relative p-6 pb-8 space-y-5 overflow-hidden bg-gradient-to-br from-primary/[0.02] to-transparent dark:from-white/[0.02]">
                    <div className="absolute -top-10 -right-10 h-32 w-32 bg-primary/[0.03] dark:bg-white/[0.03] blur-3xl rounded-full" />
                    
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3.5">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary dark:bg-white text-white dark:text-primary shadow-xl shadow-primary/10 dark:shadow-white/5">
                                <Settings2 size={20} strokeWidth={2.5} />
                            </div>
                            <div>
                                <SheetTitle className="text-[16px] font-black tracking-tight text-primary dark:text-white">Filter</SheetTitle>
                                <p className="text-[9px] font-black tracking-[0.2em] text-primary/30 dark:text-white/30 uppercase mt-0.5">Parameter</p>
                            </div>
                        </div>
                        {hasActiveFilters && (
                            <button 
                                onClick={onReset}
                                className="flex h-9 px-3 items-center gap-1.5 rounded-lg bg-rose-500 text-white hover:opacity-90 transition-all shadow-lg shadow-rose-500/20 active:scale-95"
                            >
                                <RotateCcw size={12} strokeWidth={3} />
                                <span className="text-[9px] font-black tracking-widest uppercase">Reset</span>
                            </button>
                        )}
                    </div>
                    
                    <div className="relative">
                        <div className="h-px w-full bg-primary/[0.05] dark:bg-white/[0.05]" />
                        <p className="mt-4 text-[10px] leading-relaxed font-bold text-primary/50 dark:text-white/50 max-w-[240px]">
                            {description}
                        </p>
                    </div>
                </div>

                {/* Categories - Compact Layout */}
                <ScrollArea className="flex-1 px-6 py-2">
                    <div className="space-y-8 pb-8">
                        {categories.map((category) => (
                            <div key={category.key} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
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
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between px-1">
                                            <Label className="text-[9px] font-black tracking-[0.2em] text-primary/40 uppercase dark:text-white/40">
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
                                                    className="text-[8px] font-black text-rose-500 hover:underline uppercase tracking-widest"
                                                >
                                                    HAPUS
                                                </button>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-1 gap-1.5">
                                            {category.options?.map((opt) => {
                                                const currentVals = Array.isArray(activeFilters[category.key]) ? activeFilters[category.key] : activeFilters[category.key] ? [activeFilters[category.key]] : [];
                                                const isSelected = currentVals.includes(String(opt.value));
                                                return (
                                                    <button 
                                                        key={String(opt.value)}
                                                        onClick={() => onFilterChange(category.key, opt.value)}
                                                        className={cn(
                                                            "flex items-center justify-between p-3.5 rounded-xl border transition-all text-left group active:scale-[0.99]",
                                                            isSelected 
                                                                ? "border-primary dark:border-white bg-primary dark:bg-white text-white dark:text-primary shadow-lg shadow-primary/10 dark:shadow-white/5" 
                                                                : "border-primary/[0.05] dark:border-white/[0.05] bg-white dark:bg-sidebar-accent/5 hover:border-primary dark:hover:border-primary"
                                                        )}
                                                    >
                                                        <span className="text-[11px] font-black tracking-tight uppercase">
                                                            {opt.label}
                                                        </span>
                                                        <div className={cn(
                                                            "h-4 w-4 rounded-lg border-2 transition-all flex items-center justify-center",
                                                            isSelected 
                                                                ? "border-white/20 bg-white/10 dark:border-primary/20 dark:bg-primary/10" 
                                                                : "border-primary/10 dark:border-white/10 group-hover:border-primary dark:group-hover:border-white"
                                                        )}>
                                                            {isSelected && <Check size={11} strokeWidth={4} className="text-white dark:text-primary" />}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </ScrollArea>

                {/* Footer - Compact Impactful CTA */}
                <div className="p-6 pb-8 bg-gradient-to-t from-primary/[0.02] to-transparent dark:from-white/[0.02] border-t border-primary/5 dark:border-white/5">
                    <Button 
                        onClick={() => onOpenChange(false)}
                        className="h-12 w-full rounded-xl text-[11px] font-black tracking-[0.2em] bg-primary dark:bg-white text-white dark:text-primary hover:opacity-90 transition-all shadow-2xl shadow-primary/20 dark:shadow-white/10 border-none active:scale-95"
                    >
                        {totalResults !== undefined ? `${applyText} (${totalResults})` : applyText}
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
