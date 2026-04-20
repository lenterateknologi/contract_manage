import React from 'react';
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Checkbox } from './checkbox';
import { Button } from './button';
import { ScrollArea } from './scroll-area';
import { cn } from '@/lib/utils';
import { Badge } from './badge';
import { Separator } from './separator';

export interface FilterOption {
    label: string;
    value: any;
}

export interface FilterCategory {
    label: string;
    key: string;
    options: FilterOption[];
}

interface FilterSidebarProps {
    filters: FilterCategory[];
    activeFilters: Record<string, any>;
    onFilterChange: (key: string, value: any) => void;
    onReset: () => void;
    onResetCategory: (key: string) => void;
    className?: string;
}

export function FilterSidebar({
    filters,
    activeFilters,
    onFilterChange,
    onReset,
    onResetCategory,
    className
}: FilterSidebarProps) {
    const hasActiveFilters = Object.values(activeFilters).some(
        v => Array.isArray(v) ? v.length > 0 : (v !== '' && v !== null && v !== undefined)
    );

    return (
        <aside className={cn("flex flex-col h-full w-72 bg-white border-r border-slate-200", className)}>
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                        <Filter className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest text-slate-700">Filter Data</span>
                </div>
                {hasActiveFilters && (
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={onReset}
                        className="h-7 px-2 text-[10px] font-bold text-red-500 hover:text-red-600 hover:bg-red-50 uppercase tracking-tight"
                    >
                        Reset All
                    </Button>
                )}
            </div>

            <ScrollArea className="flex-1">
                <div className="p-4 space-y-8">
                    {filters.map((filter) => {
                        const currentValues = Array.isArray(activeFilters[filter.key]) 
                            ? activeFilters[filter.key] 
                            : (activeFilters[filter.key] ? [activeFilters[filter.key]] : []);
                        
                        return (
                            <div key={filter.key} className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                                        {filter.label}
                                    </h4>
                                    {currentValues.length > 0 && (
                                        <button 
                                            onClick={() => onResetCategory(filter.key)}
                                            className="text-[9px] font-bold text-primary hover:underline uppercase tracking-tighter"
                                        >
                                            Bersihkan
                                        </button>
                                    )}
                                </div>
                                
                                <div className="grid gap-2.5">
                                    {filter.options.map((opt) => {
                                        const isChecked = currentValues.includes(String(opt.value));
                                        
                                        return (
                                            <label 
                                                key={opt.value}
                                                className={cn(
                                                    "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all border border-transparent",
                                                    isChecked 
                                                        ? "bg-primary/5 border-primary/10 shadow-sm" 
                                                        : "hover:bg-slate-50"
                                                )}
                                            >
                                                <Checkbox 
                                                    id={`${filter.key}-${opt.value}`}
                                                    checked={isChecked}
                                                    onCheckedChange={() => onFilterChange(filter.key, opt.value)}
                                                    className={cn(
                                                        "h-4 w-4 border-slate-300",
                                                        isChecked && "border-primary bg-primary text-white"
                                                    )}
                                                />
                                                <span className={cn(
                                                    "text-[12px] font-medium transition-colors uppercase tracking-tight",
                                                    isChecked ? "text-primary font-bold" : "text-slate-600"
                                                )}>
                                                    {opt.label}
                                                </span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </ScrollArea>

            <div className="p-4 border-t border-slate-100 bg-slate-50/30">
                <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center px-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Terpilih</span>
                        <Badge variant="outline" className="text-[10px] bg-white border-slate-200">
                            {Object.values(activeFilters).flat().filter(Boolean).length} Item
                        </Badge>
                    </div>
                </div>
            </div>
        </aside>
    );
}
