import * as React from 'react';
import { Search, ChevronsUpDown, Check, X } from 'lucide-react';
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
    disabled?: boolean;
    allowClear?: boolean;
}

export function SearchableSelect({
    value,
    onValueChange,
    options,
    placeholder = 'Pilih...',
    searchPlaceholder = 'Cari...',
    className,
    triggerClassName,
    emptyText = 'Tidak ada hasil',
    disabled = false,
    allowClear = false,
}: SearchableSelectProps) {
    const [open, setOpen] = React.useState(false);
    const [search, setSearch] = React.useState('');
    const containerRef = React.useRef<HTMLDivElement>(null);

    const selected = options.find(o => o.value === value);

    const filtered = React.useMemo(() => {
        if (!search) return options;
        return options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));
    }, [options, search]);

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
        <div ref={containerRef} className={cn('relative w-full', open ? 'z-50' : 'z-auto', className)}>
            {/* Shadcn-style trigger */}
            <div className="relative w-full flex items-center">
                <button
                    type="button"
                    disabled={disabled}
                    onClick={() => { if (!disabled) { setOpen(o => !o); setSearch(''); } }}
                    className={cn(
                        'flex h-10 w-full items-center justify-between rounded-lg border border-border bg-surface-base px-3.5 py-2 text-sm font-normal ring-offset-background transition-all outline-hidden text-left',
                        'placeholder:text-muted-foreground',
                        !disabled && 'cursor-pointer hover:border-primary/50 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary',
                        disabled && 'cursor-not-allowed opacity-50 bg-slate-50 dark:bg-slate-900 border-slate-200 text-slate-500',
                        open && 'border-primary ring-1 ring-primary',
                        triggerClassName
                    )}
                >
                    <span className={cn('block truncate text-sm', selected ? 'text-foreground font-normal' : 'text-muted-foreground font-normal')}>
                        {selected ? selected.label : placeholder}
                    </span>
                    <ChevronsUpDown size={15} className="text-muted-foreground shrink-0 ml-2" />
                </button>

                {allowClear && value && !disabled && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onValueChange('');
                        }}
                        className="absolute right-8 p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        title="Hapus pilihan"
                    >
                        <X size={13} />
                    </button>
                )}
            </div>

            {/* Shadcn-style dropdown menu (Inline relative/absolute) */}
            {open && (
                <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-2xl animate-in fade-in-0 zoom-in-95"
                >
                    {/* Search (only shown if options > 3) */}
                    {options.length > 3 && (
                        <div className="flex items-center border-b border-border px-3 bg-muted/20">
                            <Search size={14} className="mr-2 shrink-0 text-muted-foreground" />
                            <input
                                autoFocus
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder={searchPlaceholder}
                                className="flex h-9 w-full bg-transparent py-2 text-sm outline-hidden placeholder:text-muted-foreground text-foreground"
                            />
                        </div>
                    )}

                    {/* Items */}
                    <div className="max-h-[200px] overflow-y-auto p-1 custom-scrollbar">
                        {filtered.length === 0 ? (
                            <div className="py-6 text-center text-xs text-muted-foreground">{emptyText}</div>
                        ) : (
                            filtered.map(opt => {
                                const isSelected = opt.value === value;
                                return (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => {
                                            onValueChange(opt.value);
                                            setOpen(false);
                                            setSearch('');
                                        }}
                                        className={cn(
                                            'relative flex w-full cursor-pointer select-none items-center rounded-md py-2 pl-8 pr-2 text-sm outline-hidden transition-colors text-left',
                                            'hover:bg-accent hover:text-accent-foreground',
                                            isSelected && 'bg-accent text-accent-foreground font-medium',
                                            opt.italic && 'italic text-muted-foreground'
                                        )}
                                    >
                                        <span className="absolute left-2.5 flex h-3.5 w-3.5 items-center justify-center">
                                            {isSelected && <Check size={14} className="text-primary" />}
                                        </span>
                                        {opt.label}
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
