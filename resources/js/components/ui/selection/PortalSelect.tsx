import { cn } from '@/lib/utils';
import { useFloatingDropdown } from '@/hooks/use-floating-dropdown';
import { Check, ChevronDown, Search, Lock, X } from 'lucide-react';
import * as React from 'react';
import ReactDOM from 'react-dom';

export interface PortalSelectOption {
    value: string;
    label: string;
    disabled?: boolean;
    description?: string;
    badge?: string;
}

interface PortalSelectProps {
    value: string;
    onValueChange: (value: string) => void;
    options: PortalSelectOption[];
    placeholder?: string;
    searchPlaceholder?: string;
    emptyText?: string;
    triggerClassName?: string;
    disabled?: boolean;
    size?: 'default' | 'sm';
}

interface PortalSearchInputProps {
    value: string;
    onSearch: (value: string) => void;
    placeholder?: string;
    autoFocus?: boolean;
}

const PortalSearchInput = React.memo(function PortalSearchInput({
    value,
    onSearch,
    placeholder = 'Cari...',
    autoFocus = true,
}: PortalSearchInputProps) {
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
        <div className="flex items-center px-2.5 py-1.5 border-b border-border bg-muted/20 rounded-t-lg shrink-0 mb-1">
            <Search size={14} className="mr-2 shrink-0 text-muted-foreground" />
            <input
                ref={inputRef}
                type="text"
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                onKeyUp={(e) => e.stopPropagation()}
                placeholder={placeholder}
                className="flex h-7 w-full bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground focus:outline-none"
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
                    className="p-0.5 text-muted-foreground hover:text-foreground cursor-pointer shrink-0 ml-1"
                >
                    <X size={12} />
                </button>
            )}
        </div>
    );
});

export function PortalSelect({
    value,
    onValueChange,
    options = [],
    placeholder = 'Pilih...',
    searchPlaceholder = 'Cari...',
    emptyText = 'Tidak ada hasil',
    triggerClassName,
    disabled = false,
    size = 'default',
}: PortalSelectProps) {
    const [open, setOpen] = React.useState(false);
    const [search, setSearch] = React.useState('');
    const containerRef = React.useRef<HTMLDivElement>(null);
    const dropdownRef = React.useRef<HTMLDivElement>(null);
    const isSmall = size === 'sm';

    const coords = useFloatingDropdown(containerRef, open, {
        minWidth: 280,
        preferredMaxHeight: 400,
    });

    const selectedOption = React.useMemo(() => {
        return options.find(opt => String(opt.value) === String(value));
    }, [options, value]);

    const filteredOptions = React.useMemo(() => {
        if (!search.trim()) return options;
        const searchLower = search.toLowerCase().trim();
        return options.filter(opt => {
            const labelStr = (opt.label || '').toString().toLowerCase();
            const descStr = (opt.description || '').toString().toLowerCase();
            return labelStr.includes(searchLower) || descStr.includes(searchLower);
        });
    }, [options, search]);

    React.useEffect(() => {
        function handler(e: MouseEvent | PointerEvent) {
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
            document.addEventListener('pointerdown', handler);
            document.addEventListener('keydown', handleKeyDown, true);
        }
        return () => {
            document.removeEventListener('pointerdown', handler);
            document.removeEventListener('keydown', handleKeyDown, true);
        };
    }, [open]);

    return (
        <div ref={containerRef} className="relative w-full">
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
                    !disabled && 'cursor-pointer hover:border-primary/50 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary',
                    disabled && 'bg-slate-100/70 dark:bg-zinc-900/80 border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 cursor-not-allowed shadow-none',
                    open && 'border-primary ring-1 ring-primary',
                    triggerClassName
                )}
            >
                <span className={cn('truncate', isSmall ? 'text-xs' : 'text-sm', selectedOption ? 'text-foreground font-normal' : 'text-muted-foreground font-normal')}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <div className="flex items-center shrink-0 ml-2">
                    {disabled ? (
                        <Lock size={isSmall ? 13 : 14} className="text-slate-400 dark:text-zinc-500 opacity-70" />
                    ) : (
                        <ChevronDown size={15} className={cn('text-muted-foreground transition-transform duration-200', open && 'rotate-180')} />
                    )}
                </div>
            </button>

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
                    className="flex flex-col overflow-hidden rounded-xl border border-border bg-white dark:bg-zinc-950 text-foreground shadow-2xl animate-in fade-in zoom-in-95 duration-100 p-1 pointer-events-auto"
                    onPointerDown={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                >
                    <PortalSearchInput
                        value={search}
                        onSearch={setSearch}
                        placeholder={searchPlaceholder}
                        autoFocus={open}
                    />

                    <div 
                        data-scroll-locked="allow"
                        onWheel={(e) => e.stopPropagation()}
                        className="flex-1 min-h-0 overflow-y-auto p-0.5 custom-scrollbar overscroll-contain"
                    >
                        {filteredOptions.length === 0 ? (
                            <div className="py-6 text-center text-xs text-muted-foreground italic">{emptyText}</div>
                        ) : (
                            filteredOptions.map(opt => {
                                const isSelected = String(value) === String(opt.value);
                                const isDisabled = !!opt.disabled;
                                return (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        disabled={isDisabled}
                                        onPointerDown={(e) => e.stopPropagation()}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            if (isDisabled) return;
                                            onValueChange(opt.value);
                                            setOpen(false);
                                            setSearch('');
                                        }}
                                        className={cn(
                                            'flex w-full items-center justify-between px-3 py-2 text-left text-xs rounded-md transition-all',
                                            isDisabled && 'opacity-60 cursor-not-allowed bg-slate-100/50 dark:bg-zinc-800/40 text-slate-400 dark:text-zinc-500',
                                            !isDisabled && isSelected && 'bg-primary/10 text-primary font-semibold',
                                            !isDisabled && !isSelected && 'text-foreground/80 hover:bg-accent hover:text-accent-foreground cursor-pointer'
                                        )}
                                    >
                                        <div className="flex flex-col min-w-0 pr-2">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <span className={cn(isSelected && 'font-semibold', isDisabled && 'text-slate-400 dark:text-zinc-500')}>
                                                    {opt.label}
                                                </span>
                                                {opt.badge && (
                                                    <span className="rounded bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.2 text-[9px] font-bold">
                                                        {opt.badge}
                                                    </span>
                                                )}
                                            </div>
                                            {opt.description && (
                                                <span className="text-[10px] text-muted-foreground font-medium mt-0.5">
                                                    {opt.description}
                                                </span>
                                            )}
                                        </div>
                                        {isSelected && <Check size={12} className="text-primary shrink-0 ml-2" />}
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
