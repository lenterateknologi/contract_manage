import * as React from 'react';
import { Search, ChevronsUpDown, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SearchableSelectOption {
    value: string;
    label: string;
    italic?: boolean;
}

interface SearchableMultiSelectProps {
    values: string[];
    onValuesChange: (values: string[]) => void;
    options: SearchableSelectOption[];
    placeholder?: string;
    searchPlaceholder?: string;
    className?: string;
    triggerClassName?: string;
    emptyText?: string;
    disabled?: boolean;
    showOrder?: boolean;
}

export function SearchableMultiSelect({
    values = [],
    onValuesChange,
    options,
    placeholder = 'Pilih...',
    searchPlaceholder = 'Cari...',
    className,
    triggerClassName,
    emptyText = 'Tidak ada hasil',
    disabled = false,
    showOrder = false,
}: SearchableMultiSelectProps) {
    const [open, setOpen] = React.useState(false);
    const [search, setSearch] = React.useState('');
    const containerRef = React.useRef<HTMLDivElement>(null);

    // Merge values that are not in static options so they appear in the list
    const mergedOptions = React.useMemo(() => {
        const list = [...options];
        for (const val of values) {
            if (!list.some(o => o.value === val)) {
                list.push({
                    value: val,
                    label: val,
                    italic: true
                });
            }
        }
        return list;
    }, [options, values]);

    const filtered = React.useMemo(() => {
        if (!search) return mergedOptions;
        return mergedOptions.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));
    }, [mergedOptions, search]);

    const toggleOption = (val: string) => {
        if (values.includes(val)) {
            onValuesChange(values.filter(v => v !== val));
        } else {
            onValuesChange([...values, val]);
        }
    };

    const removeOption = (e: React.MouseEvent, val: string) => {
        e.preventDefault();
        e.stopPropagation();
        onValuesChange(values.filter(v => v !== val));
    };

    // Close on outside click
    React.useEffect(() => {
        function handler(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
                setSearch('');
            }
        }
        if (open) document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    return (
        <div ref={containerRef} className={cn("relative w-full", disabled && "opacity-60 cursor-not-allowed", open && "z-50", className)}>
            <div
                onClick={(e) => {
                    if (disabled) e.preventDefault();
                    else {
                        setOpen(!open);
                        setSearch('');
                    }
                }}
                className={cn(
                    'flex min-h-[40px] w-full items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-left text-sm font-semibold text-foreground transition-all outline-none',
                    !disabled && 'cursor-pointer hover:border-primary/50 focus:border-primary focus:ring-1 focus:ring-primary',
                    open && 'border-black dark:border-slate-100',
                    disabled && 'bg-slate-50 border-slate-100 dark:bg-slate-950 dark:border-slate-900 dark:text-slate-500',
                    triggerClassName
                )}
            >
                <div className="flex flex-wrap gap-1.5 pr-2">
                    {values.length === 0 ? (
                        <span className="text-slate-400 dark:text-slate-500 py-0.5 text-sm font-medium">{placeholder}</span>
                    ) : (
                        values.map((val, idx) => {
                            const option = options.find(o => o.value === val);
                            const displayLabel = option ? option.label : val;
                            return (
                                <span
                                    key={val}
                                    onClick={(e) => e.stopPropagation()}
                                    className="inline-flex items-center gap-1 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-2 py-0.5 rounded text-[10px] hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
                                >
                                    {showOrder ? `${idx + 1}. ${displayLabel}` : displayLabel}
                                    <button
                                        type="button"
                                        onClick={(e) => removeOption(e, val)}
                                        className="text-white/70 hover:text-white dark:text-slate-900/70 dark:hover:text-slate-900 focus:outline-none"
                                    >
                                        <X size={10} />
                                    </button>
                                </span>
                            );
                        })
                    )}
                </div>
                <ChevronsUpDown size={13} className="text-slate-400 shrink-0 ml-2" />
            </div>

            {open && (
                <div className="absolute left-0 right-0 top-full z-[9999] mt-1 border border-slate-200 bg-white shadow-xl rounded-lg overflow-hidden dark:border-slate-800 dark:bg-slate-950">
                    {/* Search input */}
                    <div className="relative border-b border-slate-100 dark:border-slate-800">
                        <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            autoFocus
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder={searchPlaceholder}
                            className="h-10 w-full bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100 pl-8 pr-3 text-sm font-medium uppercase tracking-tight outline-none placeholder:text-slate-300 dark:placeholder:text-slate-700"
                        />
                    </div>

                    {/* Option list */}
                    <div className="max-h-52 overflow-y-auto bg-white dark:bg-slate-950">
                        {filtered.length === 0 && !search && (
                            <div className="py-6 text-center text-[9px] font-semibold uppercase text-slate-300 dark:text-slate-700 italic">{emptyText}</div>
                        )}
                        {filtered.map(opt => {
                            const isSelected = values.includes(opt.value);
                            return (
                                <div
                                    key={opt.value}
                                    role="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        toggleOption(opt.value);
                                    }}
                                    className={cn(
                                        'flex w-full cursor-pointer items-center justify-between px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-tight transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/50',
                                        isSelected
                                            ? 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200'
                                            : 'text-slate-900 dark:text-slate-100',
                                        opt.italic && 'italic text-slate-500 dark:text-slate-500'
                                    )}
                                >
                                    {opt.label}
                                    {isSelected && <Check size={11} className="shrink-0" />}
                                </div>
                            );
                        })}
                        {search && !mergedOptions.some(o => o.value.toLowerCase() === search.toLowerCase() || o.label.toLowerCase() === search.toLowerCase()) && (
                            <div
                                role="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    const val = search.trim();
                                    if (val) {
                                        toggleOption(val);
                                        setSearch('');
                                    }
                                }}
                                className="flex w-full cursor-pointer items-center justify-between px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-tight text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30 transition-colors"
                            >
                                <span>+ Tambah Kustom: "{search}"</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
