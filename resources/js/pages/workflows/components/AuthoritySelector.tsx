import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronsUpDown, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// ponytail: Unified lightweight searchable multi-select with an optional 'Sesuai Inisiator' checkbox
interface AuthoritySelectorProps {
    label: string;
    idPrefix: string;
    isInitiator: boolean;
    onIsInitiatorChange?: (checked: boolean) => void;
    values: string[];
    onValuesChange: (values: string[]) => void;
    options: { value: string; label: string }[];
    placeholder?: string;
    disabled?: boolean;
    showCheckbox?: boolean;
}

export default function AuthoritySelector({
    label,
    idPrefix,
    isInitiator,
    onIsInitiatorChange,
    values = [],
    onValuesChange,
    options = [],
    placeholder = 'Pilih...',
    disabled = false,
    showCheckbox = true,
}: AuthoritySelectorProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    console.log(`AuthoritySelector [${label}]: isInitiator =`, isInitiator, 'values =', values);

    const toggleOption = (val: string) => {
        if (values.includes(val)) {
            onValuesChange(values.filter((v) => v !== val));
        } else {
            onValuesChange([...values, val]);
        }
    };

    const removeOption = (e: React.MouseEvent, val: string) => {
        e.preventDefault();
        e.stopPropagation();
        onValuesChange(values.filter((v) => v !== val));
    };

    const getLabel = (val: string) => options.find((o) => o.value === val)?.label ?? val;

    const filtered = useMemo(() => {
        if (!search) return options;
        return options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()));
    }, [options, search]);

    useEffect(() => {
        function handler(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
                setSearch('');
            }
        }
        if (open) document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const isDisabled = disabled || (showCheckbox && isInitiator);

    return (
        <div ref={containerRef} className="space-y-1.5 w-full">
            <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {label}
                </span>
                {showCheckbox && onIsInitiatorChange && (
                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                        <input
                            type="checkbox"
                            id={`${idPrefix}-is-initiator`}
                            checked={!!isInitiator}
                            onChange={(e) => {
                                const checked = e.target.checked;
                                console.log(`Checkbox clicked [${label}]: target.checked =`, checked);
                                onIsInitiatorChange(checked);
                                if (checked) onValuesChange([]);
                            }}
                            disabled={disabled}
                            className="h-3.5 w-3.5 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer accent-slate-950 dark:accent-slate-50"
                        />
                        <span
                            onClick={() => {
                                console.log(`Text clicked [${label}]: next =`, !isInitiator);
                                if (!disabled) {
                                    const next = !isInitiator;
                                    onIsInitiatorChange(next);
                                    if (next) onValuesChange([]);
                                }
                            }}
                            className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none animate-none"
                        >
                            Sesuai Inisiator
                        </span>
                    </div>
                )}
            </div>

            <div className={cn("relative w-full", isDisabled && "opacity-60 cursor-not-allowed", open && "z-50")}>
                <div
                    onClick={(e) => {
                        if (isDisabled) e.preventDefault();
                        else {
                            setOpen(!open);
                            setSearch('');
                        }
                    }}
                    className={cn(
                        'flex min-h-[40px] w-full items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-left text-xs font-semibold text-foreground transition-all outline-none',
                        !isDisabled && 'cursor-pointer hover:border-primary/50 focus:border-primary focus:ring-1 focus:ring-primary',
                        open && 'border-black dark:border-slate-100',
                        isDisabled && 'bg-slate-50 border-slate-100 dark:bg-slate-950 dark:border-slate-900 dark:text-slate-500',
                    )}
                >
                    <div className="flex flex-wrap gap-1.5 pr-2">
                        {isInitiator ? (
                            <span className="text-slate-400 dark:text-slate-500 py-0.5 text-xs font-medium">Diisi otomatis dari initiator</span>
                        ) : values.length === 0 ? (
                            <span className="text-slate-400 dark:text-slate-500 py-0.5 text-xs font-medium">{placeholder}</span>
                        ) : (
                            values.map((val) => (
                                <span
                                    key={val}
                                    onClick={(e) => e.stopPropagation()}
                                    className="inline-flex items-center gap-1 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-2 py-0.5 rounded text-[10px] hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
                                >
                                    {getLabel(val)}
                                    <button
                                        type="button"
                                        onClick={(e) => removeOption(e, val)}
                                        className="text-white/70 hover:text-white dark:text-slate-900/70 dark:hover:text-slate-900 focus:outline-none"
                                    >
                                        <X size={10} />
                                    </button>
                                </span>
                            ))
                        )}
                    </div>
                    <ChevronsUpDown size={13} className="text-slate-400 shrink-0 ml-2" />
                </div>

                {open && (
                    <div className="absolute left-0 right-0 top-full z-[9999] mt-1 border border-slate-200 bg-white shadow-xl rounded-lg overflow-hidden dark:border-slate-800 dark:bg-slate-950">
                        <div className="relative border-b border-slate-100 dark:border-slate-800">
                            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                autoFocus
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari..."
                                className="h-10 w-full bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100 pl-8 pr-3 text-xs font-medium outline-none"
                            />
                        </div>

                        <div className="max-h-52 overflow-y-auto bg-white dark:bg-slate-950">
                            {filtered.length === 0 && (
                                <div className="py-6 text-center text-xs text-slate-400 italic">Tidak ada data ditemukan</div>
                            )}
                            {filtered.map((opt) => {
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
                                            'flex w-full cursor-pointer items-center justify-between px-3 py-2.5 text-left text-xs font-bold transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/50',
                                            isSelected
                                                ? 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200'
                                                : 'text-slate-900 dark:text-slate-100',
                                        )}
                                    >
                                        {opt.label}
                                        {isSelected && <Check size={11} className="shrink-0" />}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
