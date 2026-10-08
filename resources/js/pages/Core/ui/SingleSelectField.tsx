import { Label } from '@/components/ui/forms/Label';
import LucideIcons from '@/lib/lucide-dynamic';
import { cn } from '@/lib/utils';
import React, { useEffect, useState } from 'react';

interface SingleSelectFieldProps {
    field: any;
    value: any;
    onChange: (val: any) => void;
    error?: string;
    disabled?: boolean;
}

export function SingleSelectField({
    field,
    value,
    onChange,
    error,
    disabled = false,
}: SingleSelectFieldProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [pageSize, setPageSize] = useState(10);
    const containerRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        setPageSize(10);
    }, [search]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const optionsList = Array.isArray(field.options) ? field.options : Object.entries(field.options || {});
    const filteredOptions = optionsList.filter((option: any) => {
        const label = Array.isArray(field.options) ? option : option[1];
        return String(label).toLowerCase().includes(search.toLowerCase());
    });

    const paginatedOptions = filteredOptions.slice(0, pageSize);

    const selectedLabel = (() => {
        if (value === undefined || value === null || value === '') return '';
        const found = optionsList.find((option: any) => {
            const optVal = Array.isArray(field.options) ? option : option[0];
            return String(optVal) === String(value);
        });
        return found ? (Array.isArray(field.options) ? found : found[1]) : value;
    })();

    return (
        <div ref={containerRef} className="relative w-full space-y-1.5">
            <Label htmlFor={field.name} className="text-[11px] font-bold tracking-wider text-slate-700 uppercase dark:text-zinc-200">
                {field.label} {field.required && <span className="text-rose-500">*</span>}
            </Label>

            <button
                type="button"
                disabled={disabled}
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    'border-border bg-surface-base flex h-10 w-full items-center justify-between rounded-lg border px-3.5 py-2 text-left text-sm font-normal outline-hidden transition-all',
                    disabled
                        ? 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-500 opacity-50 dark:bg-slate-900'
                        : 'hover:border-primary/50 focus-visible:ring-primary focus-visible:border-primary cursor-pointer focus-visible:ring-1',
                    isOpen && 'border-primary ring-primary ring-1',
                )}
            >
                <span className={cn('truncate text-sm', selectedLabel ? 'text-foreground font-normal' : 'text-muted-foreground font-normal')}>
                    {selectedLabel ? String(selectedLabel) : field.placeholder || `Pilih ${field.label}...`}
                </span>
                <LucideIcons.ChevronDown className="text-muted-foreground h-4 w-4 shrink-0" />
            </button>

            {isOpen && (
                <div className="border-border bg-popover text-popover-foreground animate-in fade-in-0 zoom-in-95 absolute top-full left-0 z-50 mt-1 flex max-h-64 w-full flex-col gap-2 rounded-lg border p-2 shadow-lg">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={`Cari ${field.label}...`}
                        className="border-border bg-background focus-visible:ring-primary focus-visible:border-primary placeholder:text-muted-foreground text-foreground flex h-9 w-full rounded-md border px-3 py-1 text-sm outline-hidden focus-visible:ring-1"
                        onClick={(e) => e.stopPropagation()}
                    />
                    <div className="custom-scrollbar flex flex-col gap-0.5 overflow-y-auto pr-1">
                        {paginatedOptions.map((option: any) => {
                            const val = Array.isArray(field.options) ? option : option[0];
                            const label = Array.isArray(field.options) ? option : option[1];
                            const isSelected = String(value) === String(val);
                            return (
                                <button
                                    key={val}
                                    type="button"
                                    onClick={() => {
                                        onChange(val);
                                        setIsOpen(false);
                                    }}
                                    className={cn(
                                        'text-foreground hover:bg-accent flex w-full cursor-pointer items-center justify-between rounded-md px-2.5 py-2 text-left text-sm font-normal transition-colors',
                                        isSelected && 'bg-accent text-accent-foreground font-medium',
                                    )}
                                >
                                    <span className="truncate">{label}</span>
                                    {isSelected && <LucideIcons.Check className="text-primary ml-2 h-4 w-4 shrink-0" />}
                                </button>
                            );
                        })}
                        {filteredOptions.length > pageSize && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setPageSize((prev) => prev + 15);
                                }}
                                className="text-primary hover:text-primary-hover bg-muted/50 border-border mt-1 cursor-pointer rounded-md border py-2 text-center text-[11px] font-bold hover:underline"
                            >
                                Tampilkan Lebih Banyak... (+{filteredOptions.length - pageSize} Data)
                            </button>
                        )}
                        {filteredOptions.length === 0 && <span className="text-muted-foreground py-4 text-center text-xs">Tidak ada data</span>}
                    </div>
                </div>
            )}
            {error && <span className="mt-1 block text-[10px] font-bold text-rose-500 uppercase">{error}</span>}
        </div>
    );
}
export default SingleSelectField;
