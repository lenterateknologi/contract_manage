import { Checkbox } from '@/components/ui/selection/Checkbox';
import { Label } from '@/components/ui/forms/Label';
import LucideIcons from '@/lib/lucide-dynamic';
import { cn } from '@/lib/utils';
import React, { useEffect, useState } from 'react';

interface MultiSelectFieldProps {
    field: any;
    value?: any[];
    onChange: (val: any[]) => void;
    error?: string;
    toggleLabel?: string;
    toggleName?: string | null;
    toggleValue?: boolean;
    onToggleChange?: (val: boolean) => void;
    disabled?: boolean;
    isInputDisabled?: boolean;
}

export function MultiSelectField({
    field,
    value = [],
    onChange,
    error,
    toggleLabel,
    toggleName,
    toggleValue,
    onToggleChange,
    disabled = false,
    isInputDisabled = false,
}: MultiSelectFieldProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [pageSize, setPageSize] = useState(15);
    const [filterTab, setFilterTab] = useState<'all' | 'selected'>('all');
    const [dropdownDirection, setDropdownDirection] = useState<'down' | 'up'>('down');
    const containerRef = React.useRef<HTMLDivElement>(null);
    const buttonRef = React.useRef<HTMLButtonElement>(null);

    // Reset page size when search query or tab changes
    useEffect(() => {
        setPageSize(15);
    }, [search, filterTab]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            if (spaceBelow < 300) {
                setDropdownDirection('up');
            } else {
                setDropdownDirection('down');
            }
        }
    }, [isOpen]);

    const optionsList = React.useMemo(() => {
        const list = Array.isArray(field.options)
            ? [...field.options].map((item) => (Array.isArray(item) ? item : [String(item), String(item)]))
            : Object.entries(field.options || {}).map(([k, v]) => [k, v]);
        return list;
    }, [field.options, field.name]);

    const filteredOptions = React.useMemo(() => {
        return optionsList.filter((option: any) => {
            const val = Array.isArray(option) ? option[0] : option;
            const label = Array.isArray(option) ? option[1] : option;
            const matchesSearch = String(label).toLowerCase().includes(search.toLowerCase());
            if (!matchesSearch) return false;

            if (filterTab === 'selected') {
                return value.includes(String(val));
            }
            return true;
        });
    }, [optionsList, search, filterTab, value]);

    const paginatedOptions = filteredOptions.slice(0, pageSize);

    const selectedLabels = value.map((val: any) => {
        const found = optionsList.find((option: any) => {
            const optVal = Array.isArray(option) ? option[0] : option;
            return String(optVal) === String(val);
        });
        return found ? (Array.isArray(found) ? found[1] : found) : val;
    });

    const isTemplateLocked = toggleName && !toggleName.startsWith('scope_to_user_') ? !toggleValue : false;
    const isButtonDisabled = disabled || isInputDisabled || isTemplateLocked;

    useEffect(() => {
        if (isTemplateLocked && value.length > 0 && !disabled) {
            onChange([]);
        }
    }, [isTemplateLocked]);

    return (
        <div ref={containerRef} className={cn('relative w-full space-y-1.5', disabled && 'opacity-60')}>
            <div className="flex w-full items-center justify-between">
                <Label className="text-[11px] font-bold text-slate-700 uppercase dark:text-zinc-200">
                    {field.label} {field.required && <span className="text-rose-500">*</span>}
                </Label>
                {toggleName && onToggleChange && (
                    <div className={cn('flex items-center gap-2', disabled && 'pointer-events-none')}>
                        <span
                            className={cn(
                                'text-[10.5px] font-bold uppercase transition-colors',
                                toggleValue ? 'text-primary' : 'text-slate-600 dark:text-zinc-400',
                            )}
                        >
                            {toggleLabel || 'Filter Aktif'}
                        </span>
                        <button
                            type="button"
                            role="switch"
                            aria-checked={toggleValue}
                            onClick={() => onToggleChange(!toggleValue)}
                            className={cn(
                                'focus-visible:ring-primary/40 relative inline-flex h-4 w-7 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 outline-none focus-visible:ring-2',
                                toggleValue ? 'bg-primary' : 'bg-slate-200 dark:bg-zinc-700',
                            )}
                        >
                            <span
                                className={cn(
                                    'pointer-events-none block h-3 w-3 rounded-full bg-white shadow-xs transition-transform duration-200 dark:bg-zinc-100',
                                    toggleValue ? 'translate-x-3.5' : 'translate-x-0.5',
                                )}
                            />
                        </button>
                    </div>
                )}
            </div>

            <button
                ref={buttonRef}
                type="button"
                disabled={isButtonDisabled}
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    'border-border bg-surface-base flex h-10 w-full items-center justify-between rounded-lg border px-3.5 py-2 text-left text-sm font-normal outline-hidden transition-all',
                    isButtonDisabled
                        ? 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-500 opacity-50 dark:bg-slate-900'
                        : 'hover:border-primary/50 focus-visible:ring-primary focus-visible:border-primary cursor-pointer focus-visible:ring-1',
                    isOpen && 'border-primary ring-primary ring-1',
                )}
            >
                <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
                    {value.length > 0 ? (
                        <div className="flex items-center gap-1.5 overflow-hidden">
                            <span className="bg-primary/10 text-primary shrink-0 rounded-md px-1.5 py-0.5 font-mono text-[11px] font-bold">
                                {value.length} Terpilih
                            </span>
                            <span className="text-foreground truncate text-sm font-normal">
                                {selectedLabels.slice(0, 3).join(', ')}
                                {value.length > 3 ? `, +${value.length - 3} lainnya` : ''}
                            </span>
                        </div>
                    ) : (
                        <span className="text-muted-foreground truncate text-sm font-normal">
                            {isTemplateLocked
                                ? 'Pilihan terkunci (Filter Dinonaktifkan)'
                                : isInputDisabled
                                  ? 'Mengikuti Data Pengguna (Terkunci)'
                                  : field.placeholder || `Pilih ${field.label}...`}
                        </span>
                    )}
                </div>
                <LucideIcons.ChevronDown className="text-muted-foreground h-4 w-4 shrink-0" />
            </button>

            {/* Selected Tags Preview */}
            {value.length > 0 && !isButtonDisabled && (
                <div className="flex flex-wrap items-center gap-1 pt-1">
                    {value.slice(0, 8).map((val: any) => {
                        const found = optionsList.find((option: any) => {
                            const optVal = Array.isArray(option) ? option[0] : option;
                            return String(optVal) === String(val);
                        });
                        const label = found ? (Array.isArray(found) ? found[1] : found) : val;

                        return (
                            <span
                                key={val}
                                className="bg-muted text-muted-foreground border-border inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10.5px] font-medium"
                            >
                                <span className="max-w-[120px] truncate">{label}</span>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        onChange(value.filter((v: any) => String(v) !== String(val)));
                                    }}
                                    className="hover:text-foreground text-muted-foreground/80 cursor-pointer"
                                >
                                    <LucideIcons.X className="h-3 w-3" />
                                </button>
                            </span>
                        );
                    })}
                    {value.length > 8 && (
                        <span className="text-muted-foreground px-1 text-[10.5px] font-medium">+{value.length - 8} lainnya</span>
                    )}
                    {value.length > 0 && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onChange([]);
                            }}
                            className="cursor-pointer px-1.5 py-0.5 text-[10.5px] font-medium text-rose-500 hover:text-rose-600 hover:underline"
                        >
                            Hapus Semua ({value.length})
                        </button>
                    )}
                </div>
            )}

            {isOpen && (
                <div
                    className={cn(
                        'border-border bg-popover text-popover-foreground animate-in fade-in-0 zoom-in-95 absolute left-0 z-50 flex max-h-80 w-full flex-col gap-2 rounded-lg border p-2.5 shadow-lg',
                        dropdownDirection === 'down' ? 'top-full mt-1' : 'bottom-full mb-1',
                    )}
                >
                    {/* Search & Tabs Header */}
                    <div className="flex flex-col gap-1.5">
                        <div className="relative">
                            <LucideIcons.Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder={`Cari ${field.label}...`}
                                className="border-border bg-background focus-visible:ring-primary focus-visible:border-primary placeholder:text-muted-foreground text-foreground flex h-9 w-full rounded-md border py-1 pr-3 pl-8.5 text-sm outline-hidden focus-visible:ring-1"
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>

                        {/* Filter Tabs: Semua vs Terpilih */}
                        <div className="bg-muted/50 border-border/50 flex items-center justify-between rounded-md border p-1 text-xs">
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setFilterTab('all');
                                    }}
                                    className={cn(
                                        'cursor-pointer rounded px-2.5 py-1 text-xs font-medium transition-all',
                                        filterTab === 'all'
                                            ? 'bg-background text-foreground shadow-xs'
                                            : 'text-muted-foreground hover:text-foreground',
                                    )}
                                >
                                    Semua
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setFilterTab('selected');
                                    }}
                                    className={cn(
                                        'flex cursor-pointer items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-all',
                                        filterTab === 'selected'
                                            ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                                            : 'text-muted-foreground hover:text-foreground',
                                    )}
                                >
                                    <span>Hanya Terpilih</span>
                                    <span
                                        className={cn(
                                            'py-0.2 rounded-full px-1.5 text-[10px]',
                                            filterTab === 'selected' ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary',
                                        )}
                                    >
                                        {value.length}
                                    </span>
                                </button>
                            </div>

                            {value.length > 0 && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onChange([]);
                                    }}
                                    className="cursor-pointer px-1.5 text-[11px] text-rose-500 hover:text-rose-600 hover:underline"
                                >
                                    Reset
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="custom-scrollbar flex max-h-52 flex-col gap-0.5 overflow-y-auto pr-1">
                        {paginatedOptions.map((option: any) => {
                            const val = Array.isArray(field.options) ? option : option[0];
                            const label = Array.isArray(field.options) ? option : option[1];
                            const isChecked = value.includes(String(val));
                            return (
                                <label
                                    key={val}
                                    className={cn(
                                        'text-foreground hover:bg-accent flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-normal transition-colors',
                                        isChecked && 'bg-primary/10 text-primary font-medium',
                                    )}
                                >
                                    <Checkbox
                                        checked={isChecked}
                                        onCheckedChange={(checked) => {
                                            if (checked) {
                                                onChange([...value, String(val)]);
                                            } else {
                                                onChange(value.filter((v: any) => String(v) !== String(val)));
                                            }
                                        }}
                                    />
                                    <span className="truncate">{label}</span>
                                </label>
                            );
                        })}
                        {filteredOptions.length > pageSize && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setPageSize((prev) => prev + 25);
                                }}
                                className="text-primary hover:text-primary-hover bg-muted/50 border-border mt-1 cursor-pointer rounded-md border py-2 text-center text-[11px] font-bold hover:underline"
                            >
                                Lihat Lebih Banyak... (+{filteredOptions.length - pageSize} Data)
                            </button>
                        )}
                        {filteredOptions.length === 0 && (
                            <span className="text-muted-foreground py-4 text-center text-xs">
                                {filterTab === 'selected' ? 'Belum ada data yang dipilih' : 'Tidak ada data ditemukan'}
                            </span>
                        )}
                    </div>
                </div>
            )}
            {error && <span className="mt-1 block text-[10px] font-bold text-rose-500 uppercase">{error}</span>}
        </div>
    );
}
export default MultiSelectField;
