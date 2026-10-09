import * as React from 'react';
import ReactDOM from 'react-dom';
import { Search, ChevronsUpDown, Check, X, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFloatingDropdown } from '@/hooks/use-floating-dropdown';

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

interface SearchableSelectSearchInputProps {
    value: string;
    onSearch: (value: string) => void;
    placeholder?: string;
    isSmall?: boolean;
    autoFocus?: boolean;
}

const SearchableSelectSearchInput = React.memo(function SearchableSelectSearchInput({
    value,
    onSearch,
    placeholder = 'Cari...',
    isSmall = false,
    autoFocus = true,
}: SearchableSelectSearchInputProps) {
    const [localValue, setLocalValue] = React.useState(value);
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        setLocalValue(value);
    }, [value]);

    React.useEffect(() => {
        const timer = setTimeout(() => {
            onSearch(localValue);
        }, 200);
        return () => clearTimeout(timer);
    }, [localValue, onSearch]);

    React.useEffect(() => {
        if (autoFocus) {
            const timer = setTimeout(() => {
                inputRef.current?.focus();
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [autoFocus]);

    return (
        <div className={cn("flex items-center border-b border-border px-3 bg-muted/20 shrink-0", isSmall ? "py-1" : "py-1.5")}>
            <Search size={isSmall ? 13 : 14} className="mr-2 shrink-0 text-muted-foreground" />
            <input
                ref={inputRef}
                type="text"
                value={localValue}
                onChange={e => setLocalValue(e.target.value)}
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                onKeyUp={(e) => e.stopPropagation()}
                placeholder={placeholder}
                className={cn(
                    "flex w-full bg-transparent outline-hidden placeholder:text-muted-foreground text-foreground focus:outline-none",
                    isSmall ? "h-7 py-1 text-xs" : "h-8 py-1.5 text-sm"
                )}
            />
            {localValue && (
                <button
                    type="button"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                        e.stopPropagation();
                        setLocalValue('');
                        onSearch('');
                        inputRef.current?.focus();
                    }}
                    className="text-muted-foreground hover:text-foreground p-0.5 cursor-pointer"
                >
                    <X size={11} />
                </button>
            )}
        </div>
    );
});

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
    const [open, setOpen] = React.useState(false);
    const [search, setSearch] = React.useState('');
    const containerRef = React.useRef<HTMLDivElement>(null);
    const dropdownRef = React.useRef<HTMLDivElement>(null);
    const isSmall = size === 'sm';

    const coords = useFloatingDropdown(containerRef, open, {
        align,
        preferredMaxHeight: 400,
    });

    const selected = options.find(o => o.value === value);

    const filtered = React.useMemo(() => {
        if (!search) return options;
        return options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));
    }, [options, search]);

    // Handle outside click & escape key
    React.useEffect(() => {
        function handleClickOutside(e: MouseEvent | PointerEvent) {
            const target = e.target as HTMLElement | null;
            if (!target) return;
            if (
                containerRef.current?.contains(target) ||
                dropdownRef.current?.contains(target)
            ) {
                return;
            }
            setOpen(false);
            setSearch('');
        }

        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                setOpen(false);
                setSearch('');
            }
        }

        if (open) {
            document.addEventListener('pointerdown', handleClickOutside);
            document.addEventListener('keydown', handleKeyDown, true);
        }
        return () => {
            document.removeEventListener('pointerdown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown, true);
        };
    }, [open]);

    return (
        <div ref={containerRef} className={cn('relative w-full', disabled && 'cursor-not-allowed', className)}>
            <div className="relative w-full flex items-center">
                <button
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                        if (!disabled) {
                            setOpen(!open);
                            setSearch('');
                        }
                    }}
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

            {open && coords && ReactDOM.createPortal(
                <div
                    data-portal-dropdown="true"
                    ref={dropdownRef}
                    style={{
                        position: 'fixed',
                        top: coords.placement === 'top' ? undefined : `${coords.top}px`,
                        bottom: coords.placement === 'top' ? `${window.innerHeight - coords.top}px` : undefined,
                        left: `${coords.left}px`,
                        width: `${coords.width}px`,
                        maxHeight: `${coords.maxHeight}px`,
                        zIndex: 99999,
                        pointerEvents: 'auto',
                    }}
                    className="flex flex-col p-1 bg-white dark:bg-zinc-950 border border-border shadow-2xl rounded-xl animate-in fade-in zoom-in-95 duration-100 overflow-hidden pointer-events-auto"
                    onPointerDown={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                >
                    {options.length > 3 && (
                        <SearchableSelectSearchInput
                            value={search}
                            onSearch={setSearch}
                            placeholder={searchPlaceholder}
                            isSmall={isSmall}
                            autoFocus={open}
                        />
                    )}

                    <div 
                        data-scroll-locked="allow"
                        onWheel={(e) => e.stopPropagation()}
                        className="flex-1 min-h-0 overflow-y-auto p-1 custom-scrollbar overscroll-contain"
                    >
                        {filtered.length === 0 ? (
                            <div className="py-6 text-center text-xs text-muted-foreground">{emptyText}</div>
                        ) : (
                            filtered.map(opt => {
                                const isSelected = opt.value === value;
                                return (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        disabled={opt.disabled}
                                        onPointerDown={(e) => e.stopPropagation()}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            if (opt.disabled) return;
                                            onValueChange(opt.value);
                                            setSearch('');
                                            setOpen(false);
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
                </div>,
                (containerRef.current?.closest('[role="dialog"]') as HTMLElement) || document.body
            )}
        </div>
    );
}
