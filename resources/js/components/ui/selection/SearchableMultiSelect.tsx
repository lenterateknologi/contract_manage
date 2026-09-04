import * as React from 'react';
import { createPortal } from 'react-dom';
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
    options = [],
    placeholder = 'Pilih...',
    searchPlaceholder = 'Cari opsi...',
    className,
    triggerClassName,
    emptyText = 'Tidak ada hasil ditemukan',
    disabled = false,
    showOrder = false,
}: SearchableMultiSelectProps) {
    const [open, setOpen] = React.useState(false);
    const [search, setSearch] = React.useState('');
    const [dropdownStyle, setDropdownStyle] = React.useState<React.CSSProperties>({});
    const [mountNode, setMountNode] = React.useState<HTMLElement | null>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    // Merge values that are not in static options so they appear in the list
    const mergedOptions = React.useMemo(() => {
        const list = [...(options || [])];
        for (const val of values || []) {
            if (!list.some(o => o.value === val)) {
                list.push({
                    value: val,
                    label: val,
                    italic: true,
                });
            }
        }
        return list;
    }, [options, values]);

    const filtered = React.useMemo(() => {
        if (!search) return mergedOptions;
        return mergedOptions.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));
    }, [mergedOptions, search]);

    const allFilteredSelected = filtered.length > 0 && filtered.every(opt => (values || []).includes(opt.value));

    const handleSelectAllFiltered = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (allFilteredSelected) {
            const filteredSet = new Set(filtered.map(o => o.value));
            onValuesChange((values || []).filter(v => !filteredSet.has(v)));
        } else {
            const newValues = Array.from(new Set([...(values || []), ...filtered.map(o => o.value)]));
            onValuesChange(newValues);
        }
    };

    const toggleOption = (val: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if ((values || []).includes(val)) {
            onValuesChange((values || []).filter(v => v !== val));
        } else {
            onValuesChange([...(values || []), val]);
        }
    };

    const removeOption = (e: React.MouseEvent, val: string) => {
        e.preventDefault();
        e.stopPropagation();
        onValuesChange((values || []).filter(v => v !== val));
    };

    // Calculate position for dropdown (smart above/below positioning considering scroll parents and dialogs)
    React.useEffect(() => {
        if (!open) return;
        const updatePosition = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                const viewportHeight = window.innerHeight;
                const dropdownEstimatedHeight = 220;

                // Find nearest scrollable container or modal dialog
                let scrollParent: HTMLElement | null = containerRef.current.parentElement;
                while (scrollParent && scrollParent !== document.body) {
                    const style = window.getComputedStyle(scrollParent);
                    if (
                        style.overflowY === 'auto' ||
                        style.overflowY === 'scroll' ||
                        scrollParent.getAttribute('role') === 'dialog' ||
                        scrollParent.classList.contains('overflow-y-auto')
                    ) {
                        break;
                    }
                    scrollParent = scrollParent.parentElement;
                }

                const spaceBelowViewport = viewportHeight - rect.bottom;
                const spaceAboveViewport = rect.top;

                let spaceBelow = spaceBelowViewport;
                let spaceAbove = spaceAboveViewport;

                if (scrollParent && scrollParent !== document.body) {
                    const parentRect = scrollParent.getBoundingClientRect();
                    spaceBelow = Math.min(spaceBelowViewport, parentRect.bottom - rect.bottom);
                    spaceAbove = Math.min(spaceAboveViewport, rect.top - parentRect.top);
                }

                const showAbove = spaceBelow < dropdownEstimatedHeight && spaceAbove > 100;
                const availableSpace = showAbove ? spaceAbove : spaceBelow;
                const maxHeight = Math.min(220, Math.max(120, availableSpace - 12));

                setDropdownStyle({
                    ...(showAbove ? { bottom: 'calc(100% + 4px)' } : { top: 'calc(100% + 4px)' }),
                    maxHeight: `${maxHeight}px`,
                });
            }
        };

        updatePosition();
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);
        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [open]);

    // Close dropdown on outside click
    React.useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (
                containerRef.current &&
                !containerRef.current.contains(e.target as Node) &&
                (!dropdownRef.current || !dropdownRef.current.contains(e.target as Node))
            ) {
                setOpen(false);
                setSearch('');
            }
        }
        if (open) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [open]);

    return (
        <div
            ref={containerRef}
            className={cn('relative w-full', open ? 'z-50' : 'z-auto', disabled && 'opacity-60 cursor-not-allowed', className)}
        >
            {/* Trigger Button (shadcn style) */}
            <div
                role="button"
                tabIndex={disabled ? -1 : 0}
                onClick={() => {
                    if (!disabled) {
                        setOpen(prev => !prev);
                        setSearch('');
                    }
                }}
                className={cn(
                    'flex min-h-[38px] w-full items-center justify-between rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-left text-xs font-medium text-slate-800 dark:text-zinc-100 transition-all outline-none select-none shadow-2xs',
                    !disabled && 'cursor-pointer hover:border-slate-300 dark:hover:border-zinc-600 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary',
                    open && 'border-primary ring-2 ring-primary/20 dark:border-primary',
                    disabled && 'bg-slate-50 border-slate-100 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-500 opacity-60 cursor-not-allowed',
                    triggerClassName
                )}
            >
                <div className="flex flex-wrap gap-1.5 pr-2 min-w-0 flex-1 max-h-[58px] overflow-y-auto custom-scrollbar">
                    {(!values || values.length === 0) ? (
                        <span className="text-slate-400 dark:text-zinc-500 py-0.5 text-xs font-normal truncate">
                            {placeholder}
                        </span>
                    ) : (
                        values.map((val, idx) => {
                            const option = mergedOptions.find(o => o.value === val);
                            const displayLabel = option ? option.label : val;
                            return (
                                <span
                                    key={val}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onClick={(e) => e.stopPropagation()}
                                    className="inline-flex items-center gap-1 rounded-md border border-slate-200/80 bg-slate-100 dark:border-zinc-700/80 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 px-2 py-0.5 text-[11px] font-medium transition-colors hover:bg-slate-200/70 dark:hover:bg-zinc-700/70 cursor-default"
                                >
                                    <span className="truncate max-w-[180px]">
                                        {showOrder ? `${idx + 1}. ${displayLabel}` : displayLabel}
                                    </span>
                                    <button
                                        type="button"
                                        onMouseDown={(e) => removeOption(e, val)}
                                        onClick={(e) => removeOption(e, val)}
                                        className="text-slate-400 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors focus:outline-none ml-0.5 cursor-pointer rounded-sm"
                                    >
                                        <X size={11} />
                                    </button>
                                </span>
                            );
                        })
                    )}
                </div>
                <ChevronsUpDown size={14} className="text-slate-400 dark:text-zinc-500 shrink-0 ml-1.5 opacity-60" />
            </div>

            {/* Dropdown Panel (shadcn Popover / Command style) */}
            {open && (
                <div
                    ref={dropdownRef}
                    style={{
                        zIndex: 99999,
                        ...dropdownStyle,
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute left-0 w-full rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 shadow-2xl overflow-hidden focus:outline-none animate-in fade-in-0 zoom-in-95 duration-150 p-1"
                >
                    {/* Search Input (Command header style) */}
                    {mergedOptions.length > 3 && (
                        <div className="flex items-center border-b border-slate-100 dark:border-zinc-800/80 px-2.5 py-1">
                            <Search size={13} className="mr-2 shrink-0 opacity-40 text-slate-500 dark:text-zinc-400" />
                            <input
                                autoFocus
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                onKeyDown={(e) => e.stopPropagation()}
                                onClick={(e) => e.stopPropagation()}
                                placeholder={searchPlaceholder}
                                className="h-7.5 w-full bg-transparent text-xs font-medium text-slate-900 dark:text-zinc-100 outline-none placeholder:text-slate-400 dark:placeholder:text-zinc-500"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSearch('');
                                    }}
                                    className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 p-0.5 cursor-pointer"
                                >
                                    <X size={11} />
                                </button>
                            )}
                        </div>
                    )}

                    {/* Select All Toolbar */}
                    {filtered.length > 0 && (
                        <div className="flex items-center justify-between px-2.5 py-1 text-[10.5px] font-medium text-slate-500 dark:text-zinc-400 border-b border-slate-100 dark:border-zinc-800/60 bg-slate-50/60 dark:bg-zinc-900/40 rounded-t-md">
                            <span>
                                {search ? `${filtered.length} ditemukan` : `${mergedOptions.length} opsi`}
                            </span>
                            <button
                                type="button"
                                onMouseDown={(e) => handleSelectAllFiltered(e)}
                                className="text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer select-none"
                            >
                                {allFilteredSelected
                                    ? 'Batal Pilih Semua'
                                    : search
                                    ? `Pilih Semua (${filtered.length})`
                                    : 'Pilih Semua'}
                            </button>
                        </div>
                    )}

                    {/* Option list (Command Item style) */}
                    <div className="max-h-[190px] overflow-y-auto p-1 custom-scrollbar space-y-0.5">
                        {filtered.length === 0 && (
                            <div className="py-6 text-center text-xs font-normal text-slate-400 dark:text-zinc-500">
                                {emptyText}
                            </div>
                        )}
                        {filtered.map(opt => {
                            const isSelected = (values || []).includes(opt.value);
                            return (
                                <div
                                    key={opt.value}
                                    role="button"
                                    onMouseDown={(e) => toggleOption(opt.value, e)}
                                    className={cn(
                                        'relative flex w-full cursor-pointer select-none items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium outline-hidden transition-colors',
                                        isSelected
                                            ? 'bg-primary/10 text-primary font-semibold dark:bg-primary/20 dark:text-primary-foreground'
                                            : 'text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800/80',
                                        opt.italic && 'italic text-slate-500 dark:text-zinc-400'
                                    )}
                                >
                                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                        <div className={cn(
                                            "flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border transition-colors",
                                            isSelected
                                                ? "border-primary bg-primary text-white"
                                                : "border-slate-300 dark:border-zinc-600 bg-transparent"
                                        )}>
                                            {isSelected && <Check size={11} className="stroke-[3]" />}
                                        </div>
                                        <span className="truncate">{opt.label}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
