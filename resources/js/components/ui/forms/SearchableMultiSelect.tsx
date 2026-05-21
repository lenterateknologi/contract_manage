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

    const toggleOption = (val: string) => {
        if (values.includes(val)) {
            onValuesChange(values.filter(v => v !== val));
        } else {
            onValuesChange([...values, val]);
        }
    };

    const removeOption = (e: React.MouseEvent, val: string) => {
        e.stopPropagation();
        onValuesChange(values.filter(v => v !== val));
    };

    return (
        <div ref={containerRef} className={cn("relative w-full", open && "z-50", disabled && "opacity-60 cursor-not-allowed", className)}>
            <div
                onClick={() => { if (!disabled) { setOpen(o => !o); setSearch(''); } }}
                className={cn(
                    'flex min-h-10 w-full items-center justify-between border border-slate-200 bg-white px-3 py-1.5 text-left text-[11px] font-bold uppercase tracking-tight transition-colors rounded-lg',
                    !disabled && 'cursor-pointer hover:border-slate-400',
                    open && 'border-black',
                    disabled && 'bg-slate-50 border-slate-100',
                    triggerClassName
                )}
            >
                <div className="flex flex-wrap gap-1.5 pr-2">
                    {values.length === 0 ? (
                        <span className="text-slate-400 py-0.5">{placeholder}</span>
                    ) : (
                        values.map(val => {
                            const option = options.find(o => o.value === val);
                            return (
                                <span
                                    key={val}
                                    className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[10px] hover:bg-slate-200 transition-colors"
                                >
                                    {option ? option.label : val}
                                    <button
                                        type="button"
                                        onClick={(e) => removeOption(e, val)}
                                        className="text-slate-400 hover:text-slate-600 focus:outline-none"
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
                <div className="absolute left-0 right-0 top-full z-50 mt-1 border border-slate-200 bg-white shadow-xl rounded-xl overflow-hidden dark:border-slate-800 dark:bg-slate-950">
                    {/* Search input */}
                    <div className="relative border-b border-slate-100 dark:border-slate-800">
                        <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            autoFocus
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder={searchPlaceholder}
                            className="h-9 w-full bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100 pl-8 pr-3 text-[10px] font-bold uppercase tracking-tight outline-none placeholder:text-slate-300 dark:placeholder:text-slate-700"
                        />
                    </div>

                    {/* Option list */}
                    <div className="max-h-52 overflow-y-auto bg-white dark:bg-slate-950">
                        {filtered.length === 0 && !search && (
                            <div className="py-6 text-center text-[9px] font-black uppercase text-slate-300 dark:text-slate-700 italic">{emptyText}</div>
                        )}
                        {filtered.map(opt => {
                            const isSelected = values.includes(opt.value);
                            return (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => toggleOption(opt.value)}
                                    className={cn(
                                        'flex w-full items-center justify-between px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-tight transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/50',
                                        isSelected 
                                            ? 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200' 
                                            : 'text-slate-700 dark:text-slate-300',
                                        opt.italic && 'italic text-slate-400 dark:text-slate-600'
                                    )}
                                >
                                    {opt.label}
                                    {isSelected && <Check size={11} className="shrink-0" />}
                                </button>
                            );
                        })}
                        {search && !mergedOptions.some(o => o.value.toLowerCase() === search.toLowerCase() || o.label.toLowerCase() === search.toLowerCase()) && (
                            <button
                                type="button"
                                onClick={() => {
                                    const val = search.trim();
                                    if (val) {
                                        toggleOption(val);
                                        setSearch('');
                                    }
                                }}
                                className="flex w-full items-center justify-between px-3 py-2.5 text-left text-[11px] font-black uppercase tracking-tight text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30 transition-colors"
                            >
                                <span>+ Tambah Kustom: "{search}"</span>
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
