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
    disabled?: boolean;
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
        <div ref={containerRef} className={cn('relative w-full', open && 'z-[999999]', className)}>
            {/* Shadcn-style trigger */}
            <button
                type="button"
                disabled={disabled}
                onClick={() => { if (!disabled) { setOpen(o => !o); setSearch(''); } }}
                className={cn(
                    'flex h-9 w-full items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background transition-all outline-none',
                    'placeholder:text-muted-foreground',
                    !disabled && 'cursor-pointer hover:border-primary/60 focus:ring-2 focus:ring-primary/20',
                    disabled && 'cursor-not-allowed opacity-50 bg-muted',
                    open && 'border-primary ring-2 ring-primary/20',
                    triggerClassName
                )}
            >
                <span className={cn('block truncate text-sm', selected ? 'text-foreground' : 'text-muted-foreground')}>
                    {selected ? selected.label : placeholder}
                </span>
                <ChevronsUpDown size={14} className="text-muted-foreground shrink-0 ml-2" />
            </button>

            {/* Shadcn-style dropdown */}
            {open && (
                <div className="absolute left-0 right-0 top-full z-[999999] mt-1 overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95">
                    {/* Search (only shown if options > 5) */}
                    {options.length > 5 && (
                        <div className="flex items-center border-b border-border px-3">
                            <Search size={13} className="mr-2 shrink-0 text-muted-foreground" />
                            <input
                                autoFocus
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder={searchPlaceholder}
                                className="flex h-9 w-full bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
                            />
                        </div>
                    )}

                    {/* Items */}
                    <div className="max-h-52 overflow-y-auto p-1">
                        {filtered.length === 0 ? (
                            <div className="py-6 text-center text-sm text-muted-foreground">{emptyText}</div>
                        ) : (
                            filtered.map(opt => {
                                const isSelected = opt.value === value;
                                return (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => { onValueChange(opt.value); setOpen(false); setSearch(''); }}
                                        className={cn(
                                            'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors',
                                            'hover:bg-accent hover:text-accent-foreground',
                                            isSelected && 'bg-accent text-accent-foreground',
                                            opt.italic && 'italic text-muted-foreground'
                                        )}
                                    >
                                        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                                            {isSelected && <Check size={14} />}
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
