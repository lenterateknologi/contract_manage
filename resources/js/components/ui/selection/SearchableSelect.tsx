import * as React from 'react';
import { Search, ChevronsUpDown, Check, X, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/dialogs/Popover';

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
    size?: 'default' | 'sm';
    align?: 'start' | 'end' | 'center';
}

export function SearchableSelect({
    value,
    onValueChange,
    options = [],
    placeholder = 'Pilih...',
    searchPlaceholder = 'Cari...',
    className,
    triggerClassName,
    emptyText = 'Tidak ada hasil',
    disabled = false,
    allowClear = false,
    size = 'default',
    align = 'start',
}: SearchableSelectProps) {
    const [search, setSearch] = React.useState('');
    const isSmall = size === 'sm';

    const selected = options.find(o => o.value === value);

    const filtered = React.useMemo(() => {
        if (!search) return options;
        return options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));
    }, [options, search]);

    return (
        <div className={cn('relative w-full', disabled && 'cursor-not-allowed', className)}>
            <Popover className="w-full">
                {({ open, close }) => (
                    <>
                        <div className="relative w-full flex items-center">
                            <PopoverTrigger asChild disabled={disabled}>
                                <button
                                    type="button"
                                    disabled={disabled}
                                    className={cn(
                                        'flex w-full items-center justify-between rounded-lg border border-border bg-surface-base font-normal ring-offset-background transition-all outline-hidden text-left',
                                        isSmall ? 'h-9 px-3 text-xs' : 'h-10 px-3.5 py-2 text-sm',
                                        'placeholder:text-muted-foreground',
                                        !disabled && 'cursor-pointer hover:border-primary/50 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary',
                                        disabled && 'cursor-not-allowed bg-slate-100/70 dark:bg-zinc-900/80 border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 shadow-none',
                                        open && 'border-primary ring-1 ring-primary',
                                        triggerClassName
                                    )}
                                >
                                    <span className={cn('block truncate', isSmall ? 'text-xs' : 'text-sm', selected ? 'text-foreground font-normal' : 'text-muted-foreground font-normal')}>
                                        {selected ? selected.label : placeholder}
                                    </span>
                                    {disabled ? (
                                        <Lock size={isSmall ? 12 : 13} className="text-slate-400 dark:text-zinc-500 shrink-0 ml-2 opacity-70" />
                                    ) : (
                                        <ChevronsUpDown size={15} className="text-muted-foreground shrink-0 ml-2" />
                                    )}
                                </button>
                            </PopoverTrigger>

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

                        <PopoverContent
                            align={align}
                            className="w-[var(--button-width)] min-w-[200px] max-w-[340px] p-1 bg-white dark:bg-zinc-950 border border-border shadow-2xl rounded-xl z-[999999]"
                        >
                            {options.length > 3 && (
                                <div className={cn("flex items-center border-b border-border px-3 bg-muted/20", isSmall ? "py-1" : "py-1.5")}>
                                    <Search size={isSmall ? 13 : 14} className="mr-2 shrink-0 text-muted-foreground" />
                                    <input
                                        autoFocus
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        onKeyDown={(e) => e.stopPropagation()}
                                        placeholder={searchPlaceholder}
                                        className={cn(
                                            "flex w-full bg-transparent outline-hidden placeholder:text-muted-foreground text-foreground",
                                            isSmall ? "h-7 py-1 text-xs" : "h-8 py-1.5 text-sm"
                                        )}
                                    />
                                    {search && (
                                        <button
                                            type="button"
                                            onClick={() => setSearch('')}
                                            className="text-muted-foreground hover:text-foreground p-0.5 cursor-pointer"
                                        >
                                            <X size={11} />
                                        </button>
                                    )}
                                </div>
                            )}

                            <div className="max-h-[220px] overflow-y-auto p-1 custom-scrollbar">
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
                                                    setSearch('');
                                                    close();
                                                }}
                                                className={cn(
                                                    'relative flex w-full cursor-pointer select-none items-center rounded-md outline-hidden transition-colors text-left',
                                                    isSmall ? 'py-1.5 pl-7 pr-2 text-xs' : 'py-2 pl-8 pr-2 text-sm',
                                                    'hover:bg-accent hover:text-accent-foreground',
                                                    isSelected && 'bg-accent text-accent-foreground font-medium',
                                                    opt.italic && 'italic text-muted-foreground'
                                                )}
                                            >
                                                <span className={cn("absolute flex items-center justify-center", isSmall ? "left-2 h-3 w-3" : "left-2.5 h-3.5 w-3.5")}>
                                                    {isSelected && <Check size={isSmall ? 12 : 14} className="text-primary" />}
                                                </span>
                                                <span className="truncate">{opt.label}</span>
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </PopoverContent>
                    </>
                )}
            </Popover>
        </div>
    );
}
