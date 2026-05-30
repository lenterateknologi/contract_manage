import * as React from 'react';
import { Search, ChevronsUpDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SearchableSelectOption {
    value: string;
    label: string;
    italic?: boolean;
}

interface SearchableSelectProps {
    value: string;
    onValueChange: (value: string) => void;
    options: SearchableSelectOption[];
    placeholder?: string;
    searchPlaceholder?: string;
    className?: string;
    triggerClassName?: string;
    emptyText?: string;
}

export function SearchableSelect({
    value,
    onValueChange,
    options,
    placeholder = 'Pilih...',
    searchPlaceholder = 'Cari...',
    triggerClassName,
    emptyText = 'Tidak ada hasil',
}: SearchableSelectProps) {
    const [open, setOpen] = React.useState(false);
    const [search, setSearch] = React.useState('');
    const containerRef = React.useRef<HTMLDivElement>(null);

    const selected = options.find(o => o.value === value);

    const filtered = React.useMemo(() => {
        if (!search) return options;
        return options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));
    }, [options, search]);

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
        <div ref={containerRef} className={cn("relative w-full", open && "z-50")}>
            <button
                type="button"
                onClick={() => { setOpen(o => !o); setSearch(''); }}
                className={cn(
                    'flex min-h-10 w-full items-center justify-between border border-slate-200 bg-white px-3 py-1.5 text-left text-[11px] font-bold uppercase tracking-tight transition-colors rounded-lg cursor-pointer hover:border-slate-400',
                    open && 'border-black',
                    triggerClassName
                )}
            >
                <div className="flex flex-wrap gap-1.5 pr-2">
                    {selected ? (
                        <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[10px] hover:bg-slate-200 transition-colors">
                            {selected.label}
                        </span>
                    ) : (
                        <span className="text-slate-400 py-0.5">{placeholder}</span>
                    )}
                </div>
                <ChevronsUpDown size={13} className="text-slate-400 shrink-0 ml-2" />
            </button>

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
                        {filtered.length === 0 ? (
                            <div className="py-6 text-center text-[9px] font-black uppercase text-slate-300 dark:text-slate-700 italic">{emptyText}</div>
                        ) : (
                            filtered.map(opt => {
                                const isSelected = opt.value === value;
                                return (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => { onValueChange(opt.value); setOpen(false); setSearch(''); }}
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
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
