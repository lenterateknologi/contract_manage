import * as React from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PortalSelectOption {
    value: string;
    label: string;
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
}

export function PortalSelect({
    value,
    onValueChange,
    options = [],
    placeholder = 'Pilih...',
    searchPlaceholder = 'Cari...',
    emptyText = 'Tidak ada hasil',
    triggerClassName,
    disabled = false,
}: PortalSelectProps) {
    const [open, setOpen] = React.useState(false);
    const [search, setSearch] = React.useState('');
    const containerRef = React.useRef<HTMLDivElement>(null);

    const selectedOption = React.useMemo(() => {
        return options.find(opt => String(opt.value) === String(value));
    }, [options, value]);

    const filteredOptions = React.useMemo(() => {
        if (!search.trim()) return options;
        const searchLower = search.toLowerCase();
        return options.filter(opt => opt.label.toLowerCase().includes(searchLower));
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

    const dropdownContent = open && (
        <div
            id="portal-select-dropdown"
            className="absolute left-0 right-0 top-full z-50 border-sidebar-border bg-sidebar mt-1 max-h-[250px] flex flex-col overflow-hidden rounded-lg border shadow-xl animate-in fade-in slide-in-from-top-1 duration-100"
        >
            <div className="relative border-b border-sidebar-border/50 bg-sidebar-accent/10 px-3 py-2">
                <Search size={14} className="absolute left-6 top-1/2 -translate-y-1/2 text-sidebar-foreground/40" />
                <input
                    autoFocus
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="h-8 w-full bg-transparent pl-8 pr-3 text-[12px] text-sidebar-foreground outline-none placeholder:text-sidebar-foreground/30 border border-sidebar-border/50 rounded-md focus:border-sidebar-primary/50"
                />
            </div>

            <div className="flex-1 overflow-y-auto p-1 custom-scrollbar">
                {filteredOptions.length === 0 ? (
                    <div className="py-6 text-center text-[12px] text-sidebar-foreground/40 italic">{emptyText}</div>
                ) : (
                    filteredOptions.map(opt => {
                        const isSelected = String(value) === String(opt.value);
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
                                    'flex w-full items-center justify-between px-3 py-2 text-left text-[12px] rounded-md transition-all',
                                    isSelected
                                        ? 'bg-sidebar-primary/10 text-sidebar-primary font-semibold'
                                        : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/30'
                                )}
                            >
                                <span>{opt.label}</span>
                                {isSelected && <Check size={12} className="text-sidebar-primary shrink-0 ml-2" />}
                            </button>
                        );
                    })
                )}
            </div>
        </div>
    );

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
                    'flex min-h-[44px] w-full items-center justify-between rounded-lg border border-border bg-surface-base px-4 py-2 text-left text-sm font-semibold text-foreground transition-all outline-none',
                    !disabled && 'cursor-pointer hover:border-primary/50 focus:border-primary focus:ring-1 focus:ring-primary',
                    disabled && 'bg-slate-50 dark:bg-zinc-900/50 border-slate-200 dark:border-zinc-800 text-slate-400 dark:text-zinc-500 opacity-60 cursor-not-allowed shadow-none',
                    triggerClassName
                )}
            >
                <span className={cn(selectedOption ? 'text-text-main font-semibold' : 'text-slate-400 dark:text-zinc-400 font-normal')}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown size={14} className={cn("text-sidebar-foreground/60 shrink-0 ml-2 transition-transform duration-200", open && "rotate-180")} />
            </button>

            {dropdownContent}
        </div>
    );
}
