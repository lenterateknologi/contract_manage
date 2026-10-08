import { cn } from '@/lib/utils';
import { ChevronDown, Search } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MultiSelectDropdownProps } from '../../types';

export function MultiSelectDropdown({ title, options, selectedValues, onChange, icon: Icon }: MultiSelectDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as HTMLElement)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOptions = useMemo(() => {
        if (!searchTerm.trim()) return options;
        const q = searchTerm.toLowerCase();
        return options.filter((o) => o.name?.toLowerCase().includes(q));
    }, [options, searchTerm]);

    const toggleOption = (name: string) => {
        if (selectedValues.includes(name)) {
            onChange(selectedValues.filter((v) => v !== name));
        } else {
            onChange([...selectedValues, name]);
        }
    };

    const displayedOptionNames = useMemo(() => {
        return filteredOptions.map((o) => o.name).filter(Boolean);
    }, [filteredOptions]);

    const isAllFilteredChecked = displayedOptionNames.length > 0 && displayedOptionNames.every((name) => selectedValues.includes(name));

    const handleSelectAll = () => {
        if (isAllFilteredChecked) {
            const displayedSet = new Set(displayedOptionNames);
            onChange(selectedValues.filter((v) => !displayedSet.has(v)));
        } else {
            const combined = Array.from(new Set([...selectedValues, ...displayedOptionNames]));
            onChange(combined);
        }
    };

    return (
        <div className="relative" ref={containerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    'inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-xl border bg-white px-2.5 text-xs font-semibold transition-all dark:bg-zinc-800',
                    selectedValues.length > 0
                        ? 'border-primary text-primary ring-primary/10 ring-2'
                        : 'border-slate-200 text-slate-700 hover:border-slate-300 dark:border-zinc-700 dark:text-slate-200',
                )}
            >
                <Icon size={12} className={selectedValues.length > 0 ? 'text-primary' : 'text-slate-400'} />
                <span>
                    {title} {selectedValues.length > 0 ? `(${selectedValues.length})` : ''}
                </span>
                <ChevronDown size={12} className="text-slate-400" />
            </button>

            {isOpen && (
                <div className="animate-in fade-in absolute left-0 z-50 mt-1 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-xl duration-100 dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="relative mb-2">
                        <Search size={12} className="absolute top-1/2 left-2.5 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder={`Cari ${title}...`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="focus:border-primary h-7 w-full rounded-lg border border-slate-200 bg-slate-50 pr-2 pl-7 text-xs focus:outline-none dark:border-zinc-800 dark:bg-zinc-800 dark:text-slate-100"
                        />
                    </div>

                    <div className="mb-1 flex items-center justify-between border-b border-slate-100 px-1 py-1 text-[11px] font-semibold dark:border-zinc-800">
                        <button
                            type="button"
                            onClick={handleSelectAll}
                            className="text-primary hover:text-primary/80 cursor-pointer font-bold"
                        >
                            {isAllFilteredChecked ? 'Batalkan Semua' : 'Pilih Semua'}
                        </button>
                        <span className="text-slate-400 dark:text-slate-500">{filteredOptions.length} opsi</span>
                    </div>

                    <div className="custom-scrollbar max-h-48 space-y-0.5 overflow-y-auto">
                        {filteredOptions.length === 0 ? (
                            <div className="py-3 text-center text-xs text-slate-400">Tidak ada opsi ditemukan</div>
                        ) : (
                            filteredOptions.map((opt) => {
                                const isChecked = selectedValues.includes(opt.name);
                                return (
                                    <label
                                        key={opt.id || opt.name}
                                        className="hover:bg-primary/5 flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs select-none dark:hover:bg-zinc-800"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={() => toggleOption(opt.name)}
                                            className="text-primary focus:ring-primary rounded border-slate-300 dark:border-zinc-700"
                                        />
                                        <span
                                            className={cn(
                                                'truncate',
                                                isChecked ? 'font-bold text-slate-900 dark:text-slate-100' : 'text-slate-600 dark:text-slate-300',
                                            )}
                                        >
                                            {opt.name}
                                        </span>
                                    </label>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
