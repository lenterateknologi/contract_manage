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
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {category.label}
                </Label>
                {activeValues.length > 0 && (
                    <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        {activeValues.length} Terpilih
                    </span>
                )}
            </div>

            <div className="relative">
                <Popover>
                    <PopoverTrigger className={cn(
                        "w-full flex items-center justify-between h-11 px-4 rounded-xl border transition-all text-left group active:scale-[0.98]",
                        activeValues.length > 0 
                            ? "border-primary bg-primary/5 text-foreground" 
                            : "border-input bg-background hover:border-primary/40"
                    )}>
                        <div className="flex items-center gap-3 min-w-0">
                            <Search size={15} className={cn("shrink-0 transition-colors", activeValues.length > 0 ? "text-primary" : "text-muted-foreground")} />
                            <div className="truncate">
                                {activeValues.length > 0 ? (
                                    <span className="text-sm font-semibold text-foreground">
                                        {activeOptions.map(o => o.label).join(", ")}
                                    </span>
                                ) : (
                                    <span className="text-sm font-medium text-muted-foreground/60">
                                        Pilih {category.label}
                                    </span>
                                )}
                            </div>
                        </div>
                        <ChevronDown size={15} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                    </PopoverTrigger>
                    <PopoverContent 
                        align="start" 
                        onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
                        className="w-[300px] p-0 overflow-hidden rounded-xl border-border bg-popover text-popover-foreground shadow-xl z-[9999]"
                    >
                        <div className="p-2 border-b border-border bg-muted/20">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" size={14} />
                                <Input 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={(e: React.KeyboardEvent) => e.stopPropagation()}
                                    onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
                                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                                    placeholder="Cari opsi..."
                                    className="h-9 pl-9 text-xs font-medium bg-background border-input rounded-lg focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all"
                                />
                            </div>
                        </div>
                        
                        <ScrollArea className="h-[240px]">
                            <div className="p-1 space-y-0.5">
                                {filteredOptions.length === 0 ? (
                                    <div className="py-10 text-center">
                                        <p className="text-xs text-muted-foreground font-medium uppercase">Opsi tidak ditemukan</p>
                                    </div>
                                ) : (
                                    filteredOptions.map((opt) => {
                                        const isSelected = activeValues.includes(String(opt.value));
                                        const Icon = opt.icon;
                                        return (
                                            <button 
                                                key={String(opt.value)}
                                                onMouseDown={(e: React.MouseEvent) => {
                                                    e.preventDefault();
                                                    onToggle(opt.value);
                                                }}
                                                className={cn(
                                                    "w-full flex items-center justify-between p-2.5 rounded-lg text-left transition-all group",
                                                    isSelected 
                                                        ? "bg-primary text-primary-foreground shadow-sm font-medium" 
                                                        : "text-foreground/80 hover:bg-muted hover:text-foreground"
                                                )}
                                            >
                                                <div className="flex items-center gap-2 min-w-0">
                                                    {Icon && (
                                                        <Icon className={cn(
                                                            "h-4 w-4 shrink-0 transition-colors",
                                                            isSelected ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary"
                                                        )} />
                                                    )}
                                                    {opt.color && (
                                                        <div 
                                                            className="h-2 w-2 rounded-full shrink-0" 
                                                            style={{ backgroundColor: opt.color }}
                                                        />
                                                    )}
                                                    <span className="text-sm font-medium">
                                                        {opt.label}
                                                    </span>
                                                </div>
                                                {isSelected ? (
                                                    <Check size={15} strokeWidth={2.5} />
                                                ) : (
                                                    <div className="h-4 w-4 rounded-full border border-input group-hover:border-primary transition-colors" />
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
                        className="absolute right-10 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center text-muted-foreground hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all rounded-lg z-10"
                        title="Reset Kategori"
                    >
                        <X size={14} strokeWidth={2} />
                    </button>
                )}
            </div>

            {activeValues.length > 0 && (
                <div className="flex flex-wrap gap-1 px-1 pt-0.5">
                    {activeOptions.map(opt => (
                        <Badge 
                            key={String(opt.value)}
                            className="bg-primary text-primary-foreground border-none hover:opacity-80 cursor-pointer text-xs font-medium px-2 py-1 rounded-lg transition-all gap-1.5 shadow-sm active:scale-95"
                            onClick={() => onToggle(opt.value)}
                        >
                            {opt.label}
                            <X size={11} strokeWidth={3} />
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
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {category.label}
                </Label>
                {hasValue && (
                    <button 
                        onClick={() => {
                            onFilterChange(fromKey, '');
                            onFilterChange(toKey, '');
                        }}
                        className="text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 hover:underline uppercase tracking-wider"
                    >
                        RESET
                    </button>
                )}
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <span className="ml-1 text-xs font-medium text-muted-foreground/70 uppercase">Mulai</span>
                    <div className="relative group">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-hover:text-primary transition-colors pointer-events-none" size={14} />
                        <input 
                            type="date"
                            value={fromVal}
                            onChange={(e) => onFilterChange(fromKey, e.target.value)}
                            className="w-full h-11 pl-9 pr-2 text-xs font-semibold bg-background border border-input rounded-xl text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm group-hover:border-primary/40"
                        />
                    </div>
                </div>
                <div className="space-y-1">
                    <span className="ml-1 text-xs font-medium text-muted-foreground/70 uppercase">Sampai</span>
                    <div className="relative group">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-hover:text-primary transition-colors pointer-events-none" size={14} />
                        <input 
                            type="date"
                            value={toVal}
                            onChange={(e) => onFilterChange(toKey, e.target.value)}
                            className="w-full h-11 pl-9 pr-2 text-xs font-semibold bg-background border border-input rounded-xl text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm group-hover:border-primary/40"
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
            <SheetContent side="right" className="w-full sm:max-w-[360px] p-0 flex flex-col border-l border-border bg-background shadow-2xl overflow-hidden">
                {/* Header - Professional Premium Design */}
                <div className="relative p-6 pb-6 space-y-4 overflow-hidden border-b border-border bg-muted/20">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                                <Settings2 size={18} strokeWidth={2} />
                            </div>
                            <div>
                                <SheetTitle className="text-lg font-bold text-foreground">Filter</SheetTitle>
                                <p className="text-xs font-medium text-muted-foreground/60 mt-0.5">Parameter Saringan</p>
                            </div>
                        </div>
                        {hasActiveFilters && (
                            <button 
                                onClick={onReset}
                                className="flex h-9 px-3 items-center gap-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-600 text-white transition-all shadow-sm active:scale-95 mr-8"
                            >
                                <RotateCcw size={12} strokeWidth={2.5} />
                                <span className="text-xs font-semibold tracking-wider uppercase">Reset</span>
                            </button>
                        )}
                    </div>
                    
                    <div>
                        <p className="text-xs font-medium leading-relaxed text-muted-foreground">
                            {description}
                        </p>
                    </div>
                </div>

                {/* Categories - Compact Layout */}
                <ScrollArea className="flex-1 px-6 py-4">
                    <div className="space-y-6 pb-6">
                        {categories.map((category) => (
                            <div key={category.key} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                {category.type === 'searchable' ? (
                                    <SearchableCategory 
                                        category={category} 
                                        activeValues={Array.isArray(activeFilters[category.key]) ? activeFilters[category.key] : activeFilters[category.key] ? [activeFilters[category.key]] : []} 
                                        onToggle={(val) => {
                                            const current = Array.isArray(activeFilters[category.key]) 
                                                ? activeFilters[category.key] 
                                                : activeFilters[category.key] 
                                                    ? [activeFilters[category.key]] 
                                                    : [];
                                            const valStr = String(val);
                                            const next = current.map(String).includes(valStr)
                                                ? current.filter((v: any) => String(v) !== valStr)
                                                : [...current, valStr];
                                            onFilterChange(category.key, next);
                                        }}
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
                                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                {category.label}
                                            </Label>
                                            {((Array.isArray(activeFilters[category.key]) && activeFilters[category.key].length > 0) || (!Array.isArray(activeFilters[category.key]) && activeFilters[category.key])) && (
                                                <button 
                                                    onClick={() => {
                                                        if (Array.isArray(activeFilters[category.key])) {
                                                            onFilterChange(category.key, []);
                                                        } else {
                                                            onFilterChange(category.key, '');
                                                        }
                                                    }}
                                                    className="text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 uppercase tracking-wider hover:underline"
                                                >
                                                    HAPUS
                                                </button>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-1 gap-1.5">
                                            {category.options?.map((opt) => {
                                                const currentVals = Array.isArray(activeFilters[category.key]) ? activeFilters[category.key] : activeFilters[category.key] ? [activeFilters[category.key]] : [];
                                                const isSelected = currentVals.includes(String(opt.value));
                                                const Icon = opt.icon;
                                                return (
                                                    <button 
                                                        key={String(opt.value)}
                                                        onClick={() => {
                                                            const current = Array.isArray(activeFilters[category.key]) 
                                                                ? activeFilters[category.key] 
                                                                : activeFilters[category.key] 
                                                                    ? [activeFilters[category.key]] 
                                                                    : [];
                                                            const valStr = String(opt.value);
                                                            const next = current.map(String).includes(valStr)
                                                                ? current.filter((v: any) => String(v) !== valStr)
                                                                : [...current, valStr];
                                                            onFilterChange(category.key, next);
                                                        }}
                                                        className={cn(
                                                            "flex items-center justify-between p-3 rounded-xl border transition-all text-left group active:scale-[0.99]",
                                                            isSelected 
                                                                ? "border-primary bg-primary text-primary-foreground font-medium shadow-sm" 
                                                                : "border-input bg-background hover:border-primary/40 hover:bg-muted/50"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-2.5 min-w-0">
                                                            {Icon && (
                                                                <Icon className={cn(
                                                                    "h-4 w-4 shrink-0 transition-colors",
                                                                    isSelected ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary"
                                                                )} />
                                                            )}
                                                            {opt.color && (
                                                                <div 
                                                                    className="h-2.5 w-2.5 rounded-full shrink-0" 
                                                                    style={{ backgroundColor: opt.color }}
                                                                />
                                                            )}
                                                            <span className="text-sm font-medium">
                                                                {opt.label}
                                                            </span>
                                                        </div>
                                                        <div className={cn(
                                                            "h-4 w-4 rounded border flex items-center justify-center transition-all",
                                                            isSelected 
                                                                ? "border-primary-foreground bg-primary-foreground/20 text-primary-foreground" 
                                                                : "border-input group-hover:border-primary"
                                                        )}>
                                                            {isSelected && <Check size={12} strokeWidth={3} />}
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

                {/* Footer - Impactful CTA */}
                <div className="p-6 bg-background border-t border-border grid grid-cols-2 gap-3">
                    {hasActiveFilters ? (
                        <Button 
                            variant="outline"
                            onClick={() => {
                                onReset();
                                onOpenChange(false);
                            }}
                            className="h-11 rounded-xl text-sm font-bold border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30 dark:hover:text-rose-400 text-rose-600 dark:text-rose-400 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            <RotateCcw size={14} strokeWidth={2} />
                            RESET
                        </Button>
                    ) : (
                        <Button 
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="h-11 rounded-xl text-sm font-bold border-border hover:bg-muted text-muted-foreground transition-all active:scale-95"
                        >
                            TUTUP
                        </Button>
                    )}
                    <Button 
                        onClick={() => onOpenChange(false)}
                        className="h-11 rounded-xl text-sm font-bold bg-primary hover:bg-primary/90 text-primary-foreground transition-all shadow-md border-none active:scale-95"
                    >
                        {totalResults !== undefined ? `${applyText} (${totalResults})` : applyText}
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
