import { Button } from '@/components/ui/buttons/Button';
import { Label } from '@/components/ui/forms/Label';
import { FormInput } from '@/components/ui/inputs/FormInput';
import { FormTextarea } from '@/components/ui/inputs/FormTextarea';
import { Checkbox } from '@/components/ui/selection/Checkbox';
import { TreeSelect } from '@/components/ui/selection/TreeSelect';
import LucideIcons from '@/lib/lucide-dynamic';
import { cn } from '@/lib/utils';
import { SlaSimulationModal } from '@/pages/contracts/components/parts/SlaSimulationModal';
import AuthorityTableManager from '@/pages/workflows/components/AuthorityTableManager';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Calculator, ExternalLink, Lock, Plus, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';

const COMMON_ICONS = [
    'Clock',
    'CheckCircle',
    'CheckCircle2',
    'CheckCheck',
    'XCircle',
    'AlertCircle',
    'AlertTriangle',
    'FileText',
    'FileCheck',
    'FileX',
    'FileClock',
    'FileEdit',
    'FileQuestion',
    'Folder',
    'FolderClosed',
    'FolderOpen',
    'Inbox',
    'Send',
    'User',
    'Users',
    'Settings',
    'Shield',
    'Database',
    'Key',
    'Lock',
    'Unlock',
    'Eye',
    'EyeOff',
    'Trash2',
    'Plus',
    'Check',
    'X',
    'HelpCircle',
    'Info',
    'CheckSquare',
    'Square',
    'Minus',
    'ChevronRight',
    'ChevronDown',
    'Search',
    'Zap',
    'Ban',
    'RefreshCw',
    'Archive',
    'ListOrdered',
];

function IconPicker({ value, onChange }: { value: string; onChange: (val: string) => void }) {
    const [search, setSearch] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredIcons = COMMON_ICONS.filter((icon) => icon.toLowerCase().includes(search.toLowerCase()));

    const SelectedIcon = value && (LucideIcons as any)[value] ? (LucideIcons as any)[value] : null;

    return (
        <div ref={containerRef} className="relative w-full">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="border-surface-border bg-surface-base hover:bg-surface-muted/30 flex h-11 w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm font-normal shadow-xs transition-all"
            >
                <div className="flex items-center gap-2">
                    {SelectedIcon ? (
                        <SelectedIcon className="text-primary h-4 w-4" />
                    ) : (
                        <div className="border-muted-foreground/55 h-4 w-4 rounded-full border border-dashed" />
                    )}
                    <span className={value ? 'text-foreground font-normal' : 'text-text-main font-normal'}>{value || 'Pilih Ikon...'}</span>
                </div>
                <div className="flex items-center gap-1">
                    {value && (
                        <span
                            onClick={(e) => {
                                e.stopPropagation();
                                onChange('');
                            }}
                            className="text-text-main cursor-pointer rounded-md p-1 transition-all hover:bg-rose-50 hover:text-rose-500"
                            title="Hapis Ikon"
                        >
                            <LucideIcons.X className="h-3.5 w-3.5" />
                        </span>
                    )}
                    <LucideIcons.ChevronDown className="text-text-main animate-all h-4 w-4 duration-200" />
                </div>
            </button>

            {isOpen && (
                <div className="border-surface-border bg-surface-base absolute z-50 mt-1 flex max-h-60 w-full flex-col gap-2 overflow-y-auto rounded-lg border p-2 shadow-lg">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Cari ikon..."
                        className="border-surface-border bg-surface-base focus-visible:ring-primary focus-visible:border-primary flex h-9 w-full rounded-md border px-3 py-1 text-xs outline-hidden focus-visible:ring-1"
                        onClick={(e) => e.stopPropagation()}
                    />
                    <div className="grid grid-cols-4 gap-1 overflow-y-auto pr-1">
                        {filteredIcons.map((iconName) => {
                            const Icon = (LucideIcons as any)[iconName];
                            return (
                                <button
                                    key={iconName}
                                    type="button"
                                    onClick={() => {
                                        onChange(iconName);
                                        setIsOpen(false);
                                        setSearch('');
                                    }}
                                    className={`hover:bg-primary/10 hover:text-primary flex flex-col items-center justify-center gap-1 rounded-md border border-transparent p-2 text-center text-[10px] font-normal transition-all ${
                                        value === iconName ? 'bg-primary/10 text-primary border-primary/20' : 'text-text-main'
                                    }`}
                                >
                                    {Icon && <Icon className="h-4 w-4" />}
                                    <span className="w-full truncate text-[9px]">{iconName}</span>
                                </button>
                            );
                        })}
                        {filteredIcons.length === 0 && (
                            <div className="text-text-main col-span-full py-4 text-center text-xs font-normal">Tidak ada ikon ditemukan</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function MultiSelectField({
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
}: {
    field: any;
    value: any[];
    onChange: (val: any[]) => void;
    error?: string;
    toggleLabel?: string;
    toggleName?: string | null;
    toggleValue?: boolean;
    onToggleChange?: (val: boolean) => void;
    disabled?: boolean;
    isInputDisabled?: boolean;
}) {
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

    // For contract filter template: if toggle is OFF (can_change_* = false), dropdown is disabled
    // For dashboard types scoping: if isInputDisabled is true (scope_to_user_* = true), dropdown is disabled
    const isTemplateLocked = toggleName && !toggleName.startsWith('scope_to_user_') ? !toggleValue : false;
    const isButtonDisabled = disabled || isInputDisabled || isTemplateLocked;

    // Reset list selection when toggle is disabled (only for contract-filter-templates)
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
                                'text-[9.5px] font-bold tracking-tight uppercase transition-colors',
                                toggleValue ? 'text-primary dark:text-primary-foreground font-semibold' : 'text-muted-foreground',
                            )}
                        >
                            {toggleLabel || 'Dapat Mengubah'}
                        </span>
                        <button
                            type="button"
                            role="switch"
                            disabled={disabled}
                            aria-checked={!!toggleValue}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onToggleChange(!toggleValue);
                            }}
                            className={cn(
                                'relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 outline-none active:scale-95',
                                toggleValue ? 'bg-primary' : 'bg-slate-200 dark:bg-zinc-700',
                                disabled && 'cursor-not-allowed opacity-60',
                            )}
                        >
                            <span
                                className={cn(
                                    'pointer-events-none block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform duration-200 dark:bg-zinc-100',
                                    toggleValue ? 'translate-x-4.5' : 'translate-x-1',
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
                )}
            >
                <span
                    className={cn(
                        'truncate text-sm',
                        selectedLabels.length > 0 ? 'text-foreground font-normal' : 'text-muted-foreground font-normal',
                    )}
                >
                    {disabled
                        ? 'Filter Terkunci (Mengikuti Filter Bawaan Role)'
                        : isInputDisabled
                          ? 'Otomatis Mengikuti Profil User Login'
                          : isTemplateLocked
                            ? 'Filter Terkunci (Mengikuti Profil User)'
                            : selectedLabels.length > 0
                              ? `${selectedLabels.length} terpilih (${selectedLabels.slice(0, 2).join(', ')}${selectedLabels.length > 2 ? '...' : ''})`
                              : field.placeholder || `Pilih ${field.label}...`}
                </span>
                <LucideIcons.ChevronDown className="text-muted-foreground h-4 w-4 shrink-0" />
            </button>

            {/* Selected Chips / Badges preview */}
            {value.length > 0 && !isButtonDisabled && (
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {value.map((val: any) => {
                        const found = optionsList.find((option: any) => {
                            const optVal = Array.isArray(option) ? option[0] : option;
                            return String(optVal) === String(val);
                        });
                        const label = found ? (Array.isArray(found) ? found[1] : found) : val;
                        return (
                            <span
                                key={val}
                                className="bg-primary/10 text-primary border-primary/20 inline-flex max-w-full items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium"
                            >
                                <span className="max-w-[220px] truncate">{label}</span>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        onChange(value.filter((v: any) => String(v) !== String(val)));
                                    }}
                                    className="hover:bg-primary/20 text-primary shrink-0 cursor-pointer rounded-full p-0.5 transition-colors"
                                    title="Hapus pilihan ini"
                                >
                                    <LucideIcons.X className="h-3 w-3" />
                                </button>
                            </span>
                        );
                    })}
                    {value.length > 1 && (
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

function SingleSelectField({
    field,
    value,
    onChange,
    error,
    disabled = false,
}: {
    field: any;
    value: any;
    onChange: (val: any) => void;
    error?: string;
    disabled?: boolean;
}) {
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

// ─── Konfigurasi Filter Kontrak Tree Select ──────────────────────────────────

interface Props {
    resourceSlug: string;
    title: string;
    formSchema: any[];
    formColumns?: number;
    record: any | null;
    organizationTree?: any[] | null;
    returnUrl?: string | null;
    roles?: any[];
    departments?: any[];
    divisions?: any[];
    locations?: any[];
    users?: any[];
    companyGroups?: any[];
    organizationGroups?: any[];
    regions?: any[];
    companies?: any[];
}

export default function ResourceForm({
    resourceSlug,
    title,
    formSchema,
    formColumns = 1,
    record,
    returnUrl,
    roles = [],
    departments = [],
    divisions = [],
    locations = [],
    users = [],
    companyGroups = [],
    organizationGroups = [],
    regions = [],
    companies = [],
}: Props) {
    const isEdit = !!record;
    const [activeTab, setActiveTab] = useState<'info' | 'detail'>('info');

    // Helper to get initial tab from URL query params
    const getInitialTab = <T extends string>(allowedTabs: T[], defaultTab: T): T => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const tabParam = params.get('tab') as T;
            if (tabParam && allowedTabs.includes(tabParam)) {
                return tabParam;
            }
        }
        return defaultTab;
    };

    const [dashboardTab, setDashboardTab] = useState<'authority' | 'visibility' | 'template_authority' | 'on_behalf'>(() =>
        getInitialTab(['authority', 'visibility', 'template_authority', 'on_behalf'], 'authority'),
    );
    const [slaTab, setSlaTab] = useState<'config' | 'overdue_authority'>(() => getInitialTab(['config', 'overdue_authority'], 'config'));
    const [userTab, setUserTab] = useState<'profile' | 'policy'>(() => getInitialTab(['profile', 'policy'], 'profile'));

    const handleDashboardTabChange = (newTab: 'authority' | 'visibility' | 'template_authority' | 'on_behalf') => {
        setDashboardTab(newTab);
        if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.set('tab', newTab);
            window.history.replaceState({}, '', url.toString());
        }
    };

    const handleSlaTabChange = (newTab: 'config' | 'overdue_authority') => {
        setSlaTab(newTab);
        if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.set('tab', newTab);
            window.history.replaceState({}, '', url.toString());
        }
    };

    const handleUserTabChange = (newTab: 'profile' | 'policy') => {
        setUserTab(newTab);
        if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.set('tab', newTab);
            window.history.replaceState({}, '', url.toString());
        }
    };

    useEffect(() => {
        const handlePopState = () => {
            const params = new URLSearchParams(window.location.search);
            const currentTab = params.get('tab');
            if (
                resourceSlug === 'dashboard-types' &&
                currentTab &&
                ['authority', 'visibility', 'template_authority', 'on_behalf'].includes(currentTab)
            ) {
                setDashboardTab(currentTab as any);
            } else if (resourceSlug === 'contract-sla-configs' && currentTab && ['config', 'overdue_authority'].includes(currentTab)) {
                setSlaTab(currentTab as any);
            } else if (resourceSlug === 'users' && currentTab && ['profile', 'policy'].includes(currentTab)) {
                setUserTab(currentTab as any);
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [resourceSlug]);

    const [localAccessTypes, setLocalAccessTypes] = useState<Record<string, string>>({});
    const [isSlaSimOpen, setIsSlaSimOpen] = useState(false);

    // States for custom contract filter table manager dialog
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [localFilterData, setLocalFilterData] = useState({
        can_change_company_group: false,
        allowed_company_groups: [] as string[],
        can_change_region: false,
        allowed_regions: [] as string[],
        can_change_company: false,
        allowed_companies: [] as string[],
        can_change_division: false,
        allowed_divisions: [] as string[],
        can_change_department: false,
        allowed_departments: [] as string[],
    });

    // Helper to get flattened fields for initial state and validation
    const getFlattenedFields = (schema: any[]): any[] => {
        let fields: any[] = [];
        schema.forEach((item) => {
            if (item.isGroup && Array.isArray(item.schema)) {
                fields = [...fields, ...getFlattenedFields(item.schema)];
            } else {
                fields.push(item);
            }
        });
        return fields;
    };

    const flattenedFields = getFlattenedFields(formSchema);

    // Initial form state based on schema and existing record values
    const initialFormState = flattenedFields.reduce((acc: any, field: any) => {
        const isBool = field.type === 'switch' || field.type === 'toggle' || field.name.startsWith('can_change_');
        acc[field.name] = isEdit ? (record[field.name] ?? (isBool ? false : '')) : (field.defaultValue ?? (isBool ? false : ''));
        return acc;
    }, {});

    if (resourceSlug === 'dashboard-types' || resourceSlug === 'contract-sla-configs') {
        initialFormState['authorities'] = record?.authorities || [];
    }

    if (resourceSlug === 'dashboard-types') {
        initialFormState['on_behalf_authorities'] = record?.on_behalf_authorities || [];
    }

    const { data, setData, post, put, errors, processing } = useForm(initialFormState);

    // ponytail: disable template selection if input mechanism is upload (digital) or none
    const isFieldDisabled = (fieldName: string) => {
        if (fieldName === 'f1_form_template_id') return data.f1_input_mechanism === 'digital' || data.f1_input_mechanism === 'none';
        if (fieldName === 'f2_form_template_id') return data.f2_input_mechanism === 'digital' || data.f2_input_mechanism === 'none';
        if (fieldName === 'contract_form_template_id') return data.contract_input_mechanism === 'digital' || data.contract_input_mechanism === 'none';

        return false;
    };

    useEffect(() => {
        if ((data.f1_input_mechanism === 'digital' || data.f1_input_mechanism === 'none') && data.f1_form_template_id !== '') {
            setData('f1_form_template_id', '');
        }
    }, [data.f1_input_mechanism]);

    useEffect(() => {
        if ((data.f2_input_mechanism === 'digital' || data.f2_input_mechanism === 'none') && data.f2_form_template_id !== '') {
            setData('f2_form_template_id', '');
        }
    }, [data.f2_input_mechanism]);

    useEffect(() => {
        if ((data.contract_input_mechanism === 'digital' || data.contract_input_mechanism === 'none') && data.contract_form_template_id !== '') {
            setData('contract_form_template_id', '');
        }
    }, [data.contract_input_mechanism]);

    // ponytail: auto-sync group & region live in form when company is changed
    useEffect(() => {
        if (resourceSlug === 'users' && data.company_id) {
            const companyField = flattenedFields.find((f) => f.name === 'company_id');
            const companyMap = companyField?.meta?.company_map;
            if (companyMap && companyMap[data.company_id]) {
                const info = companyMap[data.company_id];
                setData((prev: any) => ({
                    ...prev,
                    company_name: info.name || '',
                    idcompany: info.idcompany ?? null,
                    company_group_name: info.company_group_name || '',
                    company_group_id: info.company_group_id || '',
                    region_name: info.region_name || '',
                    region_id: info.region_id || '',
                }));
            }
        } else if (resourceSlug === 'users' && data.company_name) {
            const companyField = flattenedFields.find((f) => f.name === 'company_name');
            const companyMap = companyField?.meta?.company_map;
            if (companyMap && companyMap[data.company_name]) {
                const info = companyMap[data.company_name];
                setData((prev: any) => ({
                    ...prev,
                    company_group_name: info.group_name || '',
                    region_name: info.region_name || '',
                }));
            }
        }
    }, [data.company_id, data.company_name, resourceSlug]);

    // ponytail: auto-sync company, group & region live in form when location_id is changed
    useEffect(() => {
        if (resourceSlug === 'users' && data.location_id) {
            const locField = flattenedFields.find((f) => f.name === 'location_id');
            const locMap = locField?.meta?.location_map;
            if (locMap && locMap[data.location_id]) {
                const info = locMap[data.location_id];
                setData((prev: any) => ({
                    ...prev,
                    location_name: info.location_name || '',
                    idlocation: info.idlocation ?? null,
                    business_unit_id: info.business_unit_id || '',
                    company_name: info.company_name || '',
                    company_id: info.company_id || '',
                    idcompany: info.idcompany ?? null,
                    company_group_name: info.company_group_name || '',
                    company_group_id: info.company_group_id || '',
                    region_name: info.region_name || '',
                    region_id: info.region_id || '',
                }));
            }
        }
    }, [data.location_id, resourceSlug]);

    // ponytail: auto-sync job level live in form when job position/title is changed
    useEffect(() => {
        if (resourceSlug === 'users' && data.job_position_id) {
            const jobField = flattenedFields.find((f) => f.name === 'job_position_id');
            const jobMap = jobField?.meta?.job_title_map;
            if (jobMap && jobMap[data.job_position_id]) {
                const info = jobMap[data.job_position_id];
                setData((prev: any) => ({
                    ...prev,
                    job_level_id: info.job_level_id || '',
                    joblevel_name: info.job_level_name || '',
                }));
            }
        }
    }, [data.job_position_id, resourceSlug]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const urlParams = new URLSearchParams();
        if (returnUrl) {
            urlParams.set('return_url', returnUrl);
        }
        if (resourceSlug === 'dashboard-types') {
            urlParams.set('tab', dashboardTab);
        } else if (resourceSlug === 'contract-sla-configs') {
            urlParams.set('tab', slaTab);
        } else if (resourceSlug === 'users' && isEdit) {
            urlParams.set('tab', userTab);
        }

        const queryString = urlParams.toString() ? `?${urlParams.toString()}` : '';
        const endpoint = `/admin/core/${resourceSlug}${isEdit ? `/${record.id}` : ''}${queryString}`;

        if (isEdit) {
            put(endpoint);
        } else {
            post(endpoint);
        }
    };

    // Dynamic grid columns configuration
    const getGridClass = () => {
        if (formColumns === 2) return 'grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 w-full';
        if (formColumns === 3) return 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-4 w-full';
        if (formColumns >= 4) return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-4 w-full';
        return 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-4 w-full';
    };

    const getSpanClass = (field: any) => {
        if (
            ['allowed_company_groups', 'allowed_regions', 'allowed_companies', 'allowed_divisions', 'allowed_departments', 'sla_stages'].includes(
                field.name,
            )
        ) {
            return 'col-span-full';
        }
        if (field.columnSpan === 'full' || field.columnSpan >= formColumns) return 'col-span-full';
        if (field.columnSpan === 2) return 'col-span-1 md:col-span-2';
        if (field.columnSpan === 3) return 'col-span-1 md:col-span-2 xl:col-span-3';
        return 'col-span-1';
    };

    const renderField = (field: any) => {
        const IconComponent = field.icon && (LucideIcons as any)[field.icon] ? (LucideIcons as any)[field.icon] : undefined;

        return (
            <div key={field.name} className={getSpanClass(field)}>
                {field.name === 'sla_stages'
                    ? (() => {
                          const stages: Array<{
                              id?: string;
                              contract_status?: string;
                              status?: string;
                              duration_hours: number;
                              is_active?: boolean;
                          }> =
                              Array.isArray(data.sla_stages) && data.sla_stages.length > 0
                                  ? data.sla_stages
                                  : [
                                        { contract_status: 'draft', duration_hours: 24, is_active: true },
                                        { contract_status: 'in_review', duration_hours: 48, is_active: true },
                                        { contract_status: 'pending', duration_hours: 48, is_active: true },
                                    ];

                          const CONTRACT_STATUSES = [
                              { value: 'all', label: 'Semua Status (Global)' },
                              { value: 'draft', label: 'Draft (Pengajuan Awal)' },
                              { value: 'in_review', label: 'Dalam Review (Umum)' },
                              { value: 'review_f1', label: 'Review F1 (Formulir 1)' },
                              { value: 'review_f2', label: 'Review F2 (Formulir 2)' },
                              { value: 'review_agreement', label: 'Review Agreement (Draft Perjanjian)' },
                              { value: 'review_legal', label: 'Review Legal (Hukum & Kepatuhan)' },
                              { value: 'review_finance', label: 'Review Keuangan & Pajak' },
                              { value: 'review_compliance', label: 'Review Kepatuhan & Risiko' },
                              { value: 'review_vendor', label: 'Review Mitra / Vendor' },
                              { value: 'pending', label: 'Menunggu Persetujuan (Approval)' },
                              { value: 'revision', label: 'Revisi Dokumen (Revision)' },
                              { value: 'approved', label: 'Disetujui (Approved)' },
                              { value: 'signed', label: 'Proses Tanda Tangan (Signing)' },
                              { value: 'queue', label: 'Antrian Pemrosesan (Queue)' },
                              { value: 'active', label: 'Kontrak Aktif (Active)' },
                              { value: 'completed', label: 'Selesai (Completed)' },
                              { value: 'closed', label: 'Ditutup (Closed)' },
                              { value: 'rejected', label: 'Ditolak (Rejected)' },
                              { value: 'cancelled', label: 'Dibatalkan (Cancelled)' },
                              { value: 'expired', label: 'Kedaluwarsa (Expired)' },
                          ];

                          const handleStageChange = (idx: number, key: string, val: any) => {
                              const newStages = [...stages];
                              newStages[idx] = { ...newStages[idx], [key]: val };
                              if (key === 'duration_days') {
                                  const days = parseFloat(val) || 0;
                                  newStages[idx].duration_hours = Math.round(days * 24);
                              }
                              setData('sla_stages', newStages);

                              // Auto-calculate sla_total_hours from active stage hours
                              const totalH = newStages.reduce(
                                  (sum, item) => sum + (item.is_active !== false ? Number(item.duration_hours) || 0 : 0),
                                  0,
                              );
                              setData('sla_total_hours', totalH);
                          };

                          const handleAddStage = () => {
                              const newStages = [...stages, { contract_status: 'in_review', duration_hours: 24, duration_days: 1, is_active: true }];
                              setData('sla_stages', newStages);
                              const totalH = newStages.reduce(
                                  (sum, item) => sum + (item.is_active !== false ? Number(item.duration_hours) || 0 : 0),
                                  0,
                              );
                              setData('sla_total_hours', totalH);
                          };

                          const handleRemoveStage = (idx: number) => {
                              if (stages.length <= 1) return;
                              const newStages = stages.filter((_, i) => i !== idx);
                              setData('sla_stages', newStages);
                              const totalH = newStages.reduce(
                                  (sum, item) => sum + (item.is_active !== false ? Number(item.duration_hours) || 0 : 0),
                                  0,
                              );
                              setData('sla_total_hours', totalH);
                          };

                          const activeStagesCount = stages.filter((st) => st.is_active !== false).length;
                          const totalAccumulatedHours = stages.reduce(
                              (sum, item) => sum + (item.is_active !== false ? Number(item.duration_hours) || 0 : 0),
                              0,
                          );
                          const totalDaysFormatted = (totalAccumulatedHours / 24).toFixed(1).replace(/\.0$/, '');

                          return (
                              <div className="w-full space-y-2.5">
                                  {/* Action & Summary Header */}
                                  <div className="flex items-center justify-between gap-3 pb-1">
                                      <div className="flex items-center gap-2">
                                          <span className="text-primary bg-primary/10 border-primary/20 rounded-full border px-2.5 py-0.5 text-[11px] font-bold">
                                              {activeStagesCount}/{stages.length} Tahap Aktif
                                          </span>
                                          <span className="text-muted-foreground hidden text-xs sm:inline">
                                              Total Target SLA: <strong className="text-foreground font-semibold">{totalDaysFormatted} Hari</strong>
                                          </span>
                                      </div>
                                      <div className="flex items-center gap-2.5">
                                          <span className="text-muted-foreground text-xs font-semibold sm:hidden">{totalDaysFormatted} Hari</span>
                                          <Button
                                              type="button"
                                              variant="white"
                                              className="border-primary/30 text-primary hover:bg-primary/10 h-8 cursor-pointer gap-1 rounded-lg text-xs font-bold shadow-none"
                                              onClick={handleAddStage}
                                          >
                                              <Plus className="h-3.5 w-3.5" /> Tambah Status
                                          </Button>
                                      </div>
                                  </div>

                                  {/* Column Header for Desktop */}
                                  <div className="border-border/60 text-muted-foreground hidden gap-3 border-b px-1 pb-1.5 text-[10px] font-bold tracking-wider uppercase md:grid md:grid-cols-12">
                                      <div className="col-span-7">Status Kontrak</div>
                                      <div className="col-span-3">Target Durasi</div>
                                      <div className="col-span-2 pr-1 text-right">Status & Aksi</div>
                                  </div>

                                  {/* Item List Rows (Flat Divider-separated rows) */}
                                  <div className="divide-border/40 border-border/40 divide-y border-b">
                                      {stages.map((st, idx) => {
                                          const rawH = Number(st.duration_hours) || 0;
                                          const dVal = (st as any).duration_days ?? (rawH > 0 ? (rawH / 24).toFixed(1).replace(/\.0$/, '') : '');
                                          const isStageActive = st.is_active !== false;

                                          // Resolve current values with fallback compatibility
                                          const currentContractStatus =
                                              st.contract_status ||
                                              ([
                                                  'draft',
                                                  'in_review',
                                                  'review_f1',
                                                  'review_f2',
                                                  'review_agreement',
                                                  'review_legal',
                                                  'review_finance',
                                                  'review_compliance',
                                                  'review_vendor',
                                                  'pending',
                                                  'revision',
                                                  'approved',
                                                  'signed',
                                                  'queue',
                                                  'active',
                                                  'completed',
                                                  'closed',
                                                  'rejected',
                                                  'cancelled',
                                                  'expired',
                                                  'all',
                                              ].includes(st.status || '')
                                                  ? st.status
                                                  : 'draft');

                                          return (
                                              <div
                                                  key={idx}
                                                  className={cn(
                                                      'grid grid-cols-1 items-center gap-3 px-1 py-2 transition-colors md:grid-cols-12',
                                                      isStageActive ? 'hover:bg-surface-muted/30' : 'opacity-60 hover:opacity-80',
                                                  )}
                                              >
                                                  {/* 1. Status Kontrak (col-span-7) */}
                                                  <div className="md:col-span-7">
                                                      <span className="text-muted-foreground mb-1 block text-[10px] font-bold uppercase md:hidden">
                                                          #{idx + 1} Status Kontrak
                                                      </span>
                                                      <div className="relative flex items-center">
                                                          <span className="text-muted-foreground mr-1.5 hidden w-4 shrink-0 text-right font-mono text-[10px] font-bold md:inline-flex">
                                                              {idx + 1}.
                                                          </span>
                                                          <div className="relative w-full">
                                                              <div className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 flex -translate-y-1/2 items-center">
                                                                  <LucideIcons.FileText className="h-3.5 w-3.5 shrink-0 text-slate-500 dark:text-zinc-400" />
                                                              </div>
                                                              <select
                                                                  value={currentContractStatus}
                                                                  onChange={(e) => handleStageChange(idx, 'contract_status', e.target.value)}
                                                                  className="border-border/80 bg-background text-foreground focus:ring-primary h-8.5 w-full cursor-pointer rounded-md border pr-3 pl-8 text-xs font-semibold focus:ring-1 focus:outline-none"
                                                              >
                                                                  {CONTRACT_STATUSES.map((opt) => (
                                                                      <option key={opt.value} value={opt.value}>
                                                                          {opt.label}
                                                                      </option>
                                                                  ))}
                                                              </select>
                                                          </div>
                                                      </div>
                                                  </div>

                                                  {/* 2. Duration Days Input (col-span-3) */}
                                                  <div className="md:col-span-3">
                                                      <span className="text-muted-foreground mb-1 block text-[10px] font-bold uppercase md:hidden">
                                                          Target Durasi (Hari)
                                                      </span>
                                                      <FormInput
                                                          type="number"
                                                          step="0.5"
                                                          min="0"
                                                          placeholder="0"
                                                          value={dVal}
                                                          onChange={(e) => {
                                                              const days = parseFloat(e.target.value);
                                                              handleStageChange(idx, 'duration_days', isNaN(days) ? '' : days);
                                                          }}
                                                          rightAction={
                                                              <span className="text-muted-foreground pr-2 text-[11px] font-medium">Hari</span>
                                                          }
                                                      />
                                                  </div>

                                                  {/* 3. Status Aktif Toggle & Delete Action (col-span-2) */}
                                                  <div className="flex items-center justify-end gap-1.5 pt-1 md:col-span-2 md:pt-0">
                                                      <button
                                                          type="button"
                                                          onClick={() => handleStageChange(idx, 'is_active', !isStageActive)}
                                                          className={cn(
                                                              'flex h-8 cursor-pointer items-center gap-1.5 rounded-md border px-2.5 text-xs font-semibold transition-all select-none',
                                                              isStageActive
                                                                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-400'
                                                                  : 'bg-surface-muted border-border text-muted-foreground hover:bg-surface-border',
                                                          )}
                                                          title={isStageActive ? 'Tahap Aktif (Dihitung)' : 'Tahap Nonaktif'}
                                                      >
                                                          <span
                                                              className={cn(
                                                                  'h-1.5 w-1.5 rounded-full',
                                                                  isStageActive ? 'bg-emerald-500' : 'bg-muted-foreground/50',
                                                              )}
                                                          />
                                                          <span>{isStageActive ? 'Aktif' : 'Off'}</span>
                                                      </button>

                                                      <button
                                                          type="button"
                                                          disabled={stages.length <= 1}
                                                          onClick={() => handleRemoveStage(idx)}
                                                          className={cn(
                                                              'flex h-8 w-8 shrink-0 items-center justify-center rounded-md border transition-all',
                                                              stages.length <= 1
                                                                  ? 'border-border text-muted-foreground cursor-not-allowed opacity-25'
                                                                  : 'border-border text-muted-foreground cursor-pointer hover:border-rose-300 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950/30',
                                                          )}
                                                          title={stages.length <= 1 ? 'Minimal 1 status SLA' : 'Hapus status ini'}
                                                      >
                                                          <Trash2 className="h-3.5 w-3.5" />
                                                      </button>
                                                  </div>
                                              </div>
                                          );
                                      })}
                                  </div>

                                  {/* Summary Footer */}
                                  <div className="text-muted-foreground flex flex-col items-start justify-between gap-1 px-1 pt-1 text-[11px] sm:flex-row sm:items-center">
                                      <span>* Klik &ldquo;Tambah Status&rdquo; untuk menambah tahapan alur kontrak.</span>
                                      <span className="text-foreground font-semibold">
                                          Total Target SLA: <span className="text-primary font-bold">{totalDaysFormatted} Hari</span>
                                      </span>
                                  </div>
                              </div>
                          );
                      })()
                    : field.name === 'sla_drafting_hours' || field.name === 'sla_total_hours' || field.name === 'sla_review_hours'
                      ? (() => {
                            const rawVal = Number(data[field.name]) || 0;
                            const daysVal = rawVal > 0 ? (rawVal / 24).toFixed(1).replace(/\.0$/, '') : '';
                            return (
                                <div className="w-full space-y-1">
                                    <div className="flex items-center justify-between px-0.5">
                                        <Label className="text-[11px] font-bold text-slate-700 uppercase dark:text-zinc-200">
                                            {field.label} {field.required && <span className="text-rose-500">*</span>}
                                        </Label>
                                        {rawVal > 0 && (
                                            <span className="text-primary bg-primary/10 py-0.2 rounded px-1.5 text-[9.5px] font-bold">
                                                = {daysVal} Hari ({rawVal} Jam)
                                            </span>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-1.5">
                                        <div className="relative">
                                            <FormInput
                                                type="number"
                                                placeholder="0"
                                                value={daysVal}
                                                onChange={(e) => {
                                                    const days = parseFloat(e.target.value);
                                                    const h = isNaN(days) ? '' : Math.round(days * 24);
                                                    setData(field.name, h);
                                                }}
                                                rightAction={<span className="text-muted-foreground pr-2 text-[11px] font-semibold">Hari</span>}
                                            />
                                        </div>
                                        <div className="relative">
                                            <FormInput
                                                type="number"
                                                placeholder="0"
                                                value={data[field.name] ?? ''}
                                                onChange={(e) => {
                                                    const hours = parseInt(e.target.value, 10);
                                                    setData(field.name, isNaN(hours) ? '' : hours);
                                                }}
                                                rightAction={<span className="text-muted-foreground pr-2 text-[11px] font-semibold">Jam</span>}
                                                error={errors[field.name]}
                                            />
                                        </div>
                                    </div>
                                    {field.helperText && !errors[field.name] && (
                                        <p className="text-muted-foreground px-0.5 text-[10px] font-normal">{field.helperText}</p>
                                    )}
                                </div>
                            );
                        })()
                      : field.name === 'sla_cutoff_hour'
                        ? (() => {
                              const cutoffVal =
                                  data['sla_cutoff_hour'] !== '' && data['sla_cutoff_hour'] !== null && data['sla_cutoff_hour'] !== undefined
                                      ? Number(data['sla_cutoff_hour'])
                                      : '';
                              const cutoffTimeFormatted = cutoffVal !== '' && !isNaN(cutoffVal) ? `${String(cutoffVal).padStart(2, '0')}:00 WIB` : '';
                              return (
                                  <div className="w-full space-y-1">
                                      <div className="flex items-center justify-between px-0.5">
                                          <Label className="text-[11px] font-bold text-slate-700 uppercase dark:text-zinc-200">
                                              {field.label} {field.required && <span className="text-rose-500">*</span>}
                                          </Label>
                                          {cutoffTimeFormatted && (
                                              <span className="text-primary bg-primary/10 py-0.2 rounded px-1.5 font-mono text-[9.5px] font-bold">
                                                  = {cutoffTimeFormatted}
                                              </span>
                                          )}
                                      </div>
                                      <FormInput
                                          type="number"
                                          min="0"
                                          max="23"
                                          placeholder="0-23"
                                          value={data['sla_cutoff_hour'] ?? ''}
                                          onChange={(e) => {
                                              const h = parseInt(e.target.value, 10);
                                              setData('sla_cutoff_hour', isNaN(h) ? '' : Math.max(0, Math.min(23, h)));
                                          }}
                                          rightAction={
                                              <span className="text-muted-foreground pr-2 font-mono text-[11px] font-semibold">:00 WIB</span>
                                          }
                                          error={errors['sla_cutoff_hour']}
                                      />
                                      {field.helperText && !errors['sla_cutoff_hour'] && (
                                          <p className="text-muted-foreground px-0.5 text-[10px] font-normal">{field.helperText}</p>
                                      )}
                                  </div>
                              );
                          })()
                        : field.name === 'working_days'
                          ? (() => {
                                const DAYS = [
                                    { key: '1', short: 'Sen', label: 'Senin' },
                                    { key: '2', short: 'Sel', label: 'Selasa' },
                                    { key: '3', short: 'Rab', label: 'Rabu' },
                                    { key: '4', short: 'Kam', label: 'Kamis' },
                                    { key: '5', short: 'Jum', label: 'Jumat' },
                                    { key: '6', short: 'Sab', label: 'Sabtu' },
                                    { key: '7', short: 'Min', label: 'Minggu' },
                                ];
                                const currentDays: string[] = Array.isArray(data['working_days'])
                                    ? data['working_days'].map(String)
                                    : ['1', '2', '3', '4', '5'];
                                const activeDaysCount = currentDays.length;

                                return (
                                    <div className="w-full space-y-1">
                                        <div className="flex items-center justify-between px-0.5">
                                            <Label className="text-[11px] font-bold text-slate-700 uppercase dark:text-zinc-200">{field.label}</Label>
                                            <span className="text-primary bg-primary/10 py-0.2 rounded px-1.5 font-mono text-[9.5px] font-bold">
                                                {activeDaysCount} Hari Aktif / Minggu
                                            </span>
                                        </div>
                                        <div className="grid h-9 grid-cols-7 items-center gap-1">
                                            {DAYS.map((d) => {
                                                const isSelected = currentDays.includes(d.key);
                                                return (
                                                    <button
                                                        key={d.key}
                                                        type="button"
                                                        onClick={() => {
                                                            const next = isSelected
                                                                ? currentDays.filter((k) => k !== d.key)
                                                                : [...currentDays, d.key].sort();
                                                            setData('working_days', next);
                                                        }}
                                                        className={cn(
                                                            'flex h-9 cursor-pointer flex-col items-center justify-center rounded-md border text-xs font-bold transition-all select-none',
                                                            isSelected
                                                                ? 'bg-primary text-primary-foreground border-primary font-semibold shadow-xs'
                                                                : 'bg-surface-muted/40 text-muted-foreground border-border/80 hover:bg-surface-muted hover:text-foreground',
                                                        )}
                                                        title={`${d.label} (${isSelected ? 'Aktif dihitung SLA' : 'Libur / Tidak dihitung'})`}
                                                    >
                                                        <span className="text-[11px] leading-none">{d.short}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        {field.helperText && !errors['working_days'] && (
                                            <p className="text-muted-foreground px-0.5 text-[10px] font-normal">{field.helperText}</p>
                                        )}
                                    </div>
                                );
                            })()
                          : field.name === 'sla_cutoff_hour' || field.name === 'working_days'
                            ? null
                            : (field.type === 'text' ||
                                  field.type === 'number' ||
                                  field.type === 'integer' ||
                                  field.type === 'email' ||
                                  field.type === 'password') && (
                                  <FormInput
                                      label={field.label}
                                      type={field.type === 'integer' ? 'number' : field.type}
                                      value={data[field.name]}
                                      onChange={(e) => setData(field.name, e.target.value)}
                                      error={errors[field.name]}
                                      helperText={field.helperText}
                                      required={field.required}
                                      placeholder={field.placeholder}
                                      icon={IconComponent}
                                  />
                              )}
                {field.type === 'readonly' && (
                    <div className="w-full space-y-1.5">
                        <div className="flex items-center justify-between px-0.5">
                            <label className="text-[11px] font-bold tracking-wider text-slate-700 uppercase dark:text-zinc-200">{field.label}</label>
                            <span className="text-muted-foreground flex items-center gap-1 text-[10px] font-normal">
                                <Lock size={10} className="opacity-70" />
                                <span>Terkunci</span>
                            </span>
                        </div>
                        <div className="relative">
                            <div className="border-border text-foreground flex h-10 w-full cursor-default items-center rounded-lg border bg-slate-100/70 px-3 pr-9 text-xs font-medium select-all dark:bg-zinc-900/80">
                                {data[field.name] ?? <span className="text-muted-foreground italic">{field.placeholder || '—'}</span>}
                            </div>
                            <div
                                className="pointer-events-none absolute top-0 right-3 bottom-0 flex items-center text-slate-400 dark:text-zinc-500"
                                title="Field tidak dapat diedit"
                            >
                                <Lock size={14} className="opacity-70" />
                            </div>
                        </div>
                        {field.helperText && <p className="text-muted-foreground mt-1 px-0.5 text-[11px] font-normal">{field.helperText}</p>}
                    </div>
                )}
                {field.type === 'textarea' && (
                    <FormTextarea
                        label={field.label}
                        value={data[field.name]}
                        onChange={(e) => setData(field.name, e.target.value)}
                        error={errors[field.name]}
                        helperText={field.helperText}
                        required={field.required}
                        placeholder={field.placeholder}
                    />
                )}
                {field.type === 'color' && (
                    <div className="w-full space-y-1.5">
                        <Label className="px-0.5 text-[11px] font-bold text-slate-700 uppercase dark:text-zinc-200">
                            {field.label} {field.required && <span className="text-rose-500">*</span>}
                        </Label>
                        <div className="flex items-center gap-2">
                            <input
                                type="color"
                                value={data[field.name] || '#ffffff'}
                                onChange={(e) => setData(field.name, e.target.value)}
                                className="border-border bg-background h-9 w-12 shrink-0 cursor-pointer rounded-lg border p-1"
                                required={field.required}
                            />
                            <input
                                type="text"
                                value={data[field.name] || ''}
                                onChange={(e) => setData(field.name, e.target.value)}
                                className="border-border bg-background focus-visible:ring-primary flex h-9 w-full rounded-lg border px-3 py-1 font-mono text-xs font-semibold uppercase focus-visible:ring-1 focus-visible:outline-hidden"
                                placeholder="#hexcode"
                            />
                            {data[field.name] && (
                                <button
                                    type="button"
                                    onClick={() => setData(field.name, '')}
                                    className="border-border bg-background text-muted-foreground flex h-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border px-2.5 shadow-xs transition-all hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500"
                                    title="Hapus Warna"
                                >
                                    <LucideIcons.X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>
                        {field.helperText && !errors[field.name] && (
                            <p className="text-muted-foreground mt-1 px-0.5 text-[11px] font-normal">{field.helperText}</p>
                        )}
                        {errors[field.name] && <span className="mt-1 block text-[10px] font-bold text-rose-500 uppercase">{errors[field.name]}</span>}
                    </div>
                )}
                {field.type === 'icon' && (
                    <div className="relative w-full space-y-1.5">
                        <Label className="px-0.5 text-[11px] font-bold text-slate-700 uppercase dark:text-zinc-200">
                            {field.label} {field.required && <span className="text-rose-500">*</span>}
                        </Label>
                        <IconPicker value={data[field.name] || ''} onChange={(val) => setData(field.name, val)} />
                        {field.helperText && !errors[field.name] && (
                            <p className="text-muted-foreground mt-1 px-0.5 text-[11px] font-normal">{field.helperText}</p>
                        )}
                        {errors[field.name] && <span className="mt-1 block text-[10px] font-bold text-rose-500 uppercase">{errors[field.name]}</span>}
                    </div>
                )}
                {field.type === 'select' && field.multiple && field.name !== 'working_days'
                    ? (() => {
                          let toggleName: string | null = null;
                          let toggleLabel: string | undefined = undefined;

                          if (resourceSlug === 'dashboard-types') {
                              if (field.name === 'company_group_ids') {
                                  toggleName = 'scope_to_user_company_group';
                                  toggleLabel = 'Sesuai Profil User';
                              } else if (field.name === 'region_ids') {
                                  toggleName = 'scope_to_user_region';
                                  toggleLabel = 'Sesuai Profil User';
                              } else if (field.name === 'company_ids') {
                                  toggleName = 'scope_to_user_company';
                                  toggleLabel = 'Sesuai Profil User';
                              } else if (field.name === 'division_ids') {
                                  toggleName = 'scope_to_user_division';
                                  toggleLabel = 'Sesuai Profil User';
                              } else if (field.name === 'department_ids') {
                                  toggleName = 'scope_to_user_department';
                                  toggleLabel = 'Sesuai Profil User';
                              }
                          } else {
                              if (field.name === 'allowed_company_groups') toggleName = 'can_change_company_group';
                              else if (field.name === 'allowed_regions') toggleName = 'can_change_region';
                              else if (field.name === 'allowed_companies') toggleName = 'can_change_company';
                              else if (field.name === 'allowed_divisions') toggleName = 'can_change_division';
                              else if (field.name === 'allowed_departments') toggleName = 'can_change_department';
                          }

                          const toggleVal = toggleName
                              ? data[toggleName] === true || data[toggleName] === 1 || data[toggleName] === '1' || data[toggleName] === 'true'
                              : false;

                          // If dashboard-types scoping toggle is active (Sesuai Profil User), disable specific list dropdown
                          const isScopedToUser = resourceSlug === 'dashboard-types' && Boolean(toggleVal);

                          return (
                              <div className="space-y-1">
                                  <MultiSelectField
                                      field={field}
                                      value={Array.isArray(data[field.name]) ? data[field.name] : []}
                                      onChange={(val) => setData(field.name, val)}
                                      error={errors[field.name]}
                                      toggleName={toggleName}
                                      toggleLabel={toggleLabel}
                                      toggleValue={toggleVal}
                                      onToggleChange={toggleName ? (val) => setData(toggleName, val) : undefined}
                                      disabled={isFieldDisabled(field.name)}
                                      isInputDisabled={isScopedToUser}
                                  />
                                  {field.helperText && !errors[field.name] && (
                                      <p className="text-muted-foreground mt-1 px-0.5 text-[11px] font-normal">
                                          {isScopedToUser
                                              ? `Otomatis mengikuti ${field.label.toLowerCase()} dari profil user login.`
                                              : field.helperText}
                                      </p>
                                  )}
                              </div>
                          );
                      })()
                    : field.type === 'select' &&
                      field.name !== 'working_days' && (
                          <div className="space-y-1">
                              <SingleSelectField
                                  field={field}
                                  value={data[field.name]}
                                  onChange={(val) => setData(field.name, val)}
                                  error={errors[field.name]}
                                  disabled={isFieldDisabled(field.name)}
                              />
                              {field.helperText && !errors[field.name] && (
                                  <p className="text-muted-foreground mt-1 px-0.5 text-[11px] font-normal">{field.helperText}</p>
                              )}
                          </div>
                      )}
                {field.type === 'tree_select' && (
                    <div className="w-full space-y-1.5">
                        <Label className="px-0.5 text-[11px] font-bold text-slate-700 uppercase dark:text-zinc-200">
                            {field.label} {field.required && <span className="text-rose-500">*</span>}
                        </Label>
                        <TreeSelect
                            value={data[field.name]}
                            onValueChange={(val) => setData(field.name, val)}
                            items={field.options}
                            placeholder={field.placeholder || `Pilih ${field.label}...`}
                            disabled={isFieldDisabled(field.name)}
                            multiple={field.multiple ?? false}
                            inline={field.inline ?? false}
                            disableParentSelection={field.disableParentSelection ?? false}
                            allowClear={field.allowClear ?? true}
                            rootOptionLabel={
                                field.rootOptionLabel || (field.name === 'parent_id' ? 'Tanpa Parent (Jadikan Kategori Utama / Root)' : undefined)
                            }
                            disabledId={record?.id}
                        />
                        {field.helperText && !errors[field.name] && (
                            <p className="text-muted-foreground mt-1 px-0.5 text-[11px] font-normal">{field.helperText}</p>
                        )}
                        {errors[field.name] && <span className="mt-1 block text-[10px] font-bold text-rose-500 uppercase">{errors[field.name]}</span>}
                    </div>
                )}
                {(field.type === 'switch' || field.type === 'toggle') &&
                    (() => {
                        const isChecked =
                            data[field.name] === true || data[field.name] === 1 || data[field.name] === '1' || data[field.name] === 'true';
                        return (
                            <div
                                key={field.name}
                                onClick={() => setData(field.name, !isChecked)}
                                className={cn(
                                    'group relative flex h-full cursor-pointer flex-col justify-between rounded-xl border p-3.5 transition-all duration-150 select-none',
                                    isChecked
                                        ? 'border-primary/40 bg-primary/[0.04] dark:bg-primary/[0.08] shadow-2xs'
                                        : 'border-border bg-surface-base hover:border-border/80 hover:bg-surface-muted/30',
                                )}
                            >
                                <div className="mb-1.5 flex items-start justify-between gap-2.5">
                                    <div className="flex min-w-0 items-center gap-2.5">
                                        {IconComponent && (
                                            <div
                                                className={cn(
                                                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors',
                                                    isChecked ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
                                                )}
                                            >
                                                <IconComponent className="h-3.5 w-3.5" />
                                            </div>
                                        )}
                                        <span
                                            className={cn(
                                                'line-clamp-1 text-xs font-bold tracking-tight transition-colors',
                                                isChecked ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground',
                                            )}
                                        >
                                            {field.label}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        role="switch"
                                        aria-checked={isChecked}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setData(field.name, !isChecked);
                                        }}
                                        className={cn(
                                            'focus-visible:ring-primary/40 relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 outline-none focus-visible:ring-2',
                                            isChecked ? 'bg-primary' : 'bg-slate-200 dark:bg-zinc-700',
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                'pointer-events-none block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform duration-200 dark:bg-zinc-100',
                                                isChecked ? 'translate-x-4.5' : 'translate-x-1',
                                            )}
                                        />
                                    </button>
                                </div>
                                {field.helperText && <p className="text-muted-foreground mt-1 text-[10.5px] leading-relaxed">{field.helperText}</p>}
                                {errors[field.name] && (
                                    <span className="mt-1 block text-[10px] font-bold text-rose-500 uppercase">{errors[field.name]}</span>
                                )}
                            </div>
                        );
                    })()}
            </div>
        );
    };

    return (
        <>
            <Head title={isEdit ? `Edit ${title}` : `Tambah ${title}`} />

            <div className="bg-background m-0 flex h-svh max-h-svh w-full flex-col overflow-hidden p-0">
                <div className="bg-background flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-none border-0 shadow-none">
                    {/* Sticky Header with Tabs */}
                    <div className="border-surface-border bg-background flex shrink-0 flex-col border-b">
                        <div className="box-border flex h-16 max-h-[64px] min-h-[64px] items-center justify-between px-6">
                            <div className="flex items-center gap-3">
                                <Link
                                    href={returnUrl || `/admin/core/${resourceSlug}`}
                                    className="border-surface-border hover:bg-surface-muted text-text-main rounded-xl border p-2 transition-all"
                                >
                                    <ArrowLeft size={16} />
                                </Link>
                                <div className="flex flex-col justify-center">
                                    <h1 className="text-text-main text-[13.5px] leading-tight font-bold tracking-tight">
                                        {isEdit ? `Edit ${title}` : `Tambah ${title}`}
                                    </h1>
                                    <p className="text-text-muted mt-0.5 text-[10.5px] leading-tight">
                                        {isEdit ? 'Ubah informasi data yang sudah ada.' : 'Tambahkan data master baru ke sistem.'}
                                    </p>
                                </div>
                            </div>

                            {resourceSlug === 'contract-sla-configs' && (
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="white"
                                        className="border-border hover:bg-surface-muted text-primary h-8 gap-1.5 text-xs font-semibold"
                                        onClick={() => setIsSlaSimOpen(true)}
                                    >
                                        <Calculator size={14} className="text-primary" /> Simulasi SLA
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Navigation Tabs for Dashboard Types */}
                        {resourceSlug === 'dashboard-types' && (
                            <div className="border-surface-border/60 bg-surface-base flex items-center gap-2 border-t px-6 pt-2">
                                <button
                                    type="button"
                                    onClick={() => handleDashboardTabChange('authority')}
                                    className={cn(
                                        'flex cursor-pointer items-center gap-1.5 border-b-2 px-4 py-2 text-xs font-semibold transition-all',
                                        dashboardTab === 'authority'
                                            ? 'border-primary text-primary font-bold'
                                            : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200',
                                    )}
                                >
                                    <LucideIcons.ShieldCheck size={14} className={dashboardTab === 'authority' ? 'text-primary' : 'text-slate-400'} />
                                    1. Identitas & Target
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleDashboardTabChange('visibility')}
                                    className={cn(
                                        'flex cursor-pointer items-center gap-1.5 border-b-2 px-4 py-2 text-xs font-semibold transition-all',
                                        dashboardTab === 'visibility'
                                            ? 'border-primary text-primary font-bold'
                                            : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200',
                                    )}
                                >
                                    <LucideIcons.LayoutDashboard
                                        size={14}
                                        className={dashboardTab === 'visibility' ? 'text-primary' : 'text-slate-400'}
                                    />
                                    2. Visibilitas Dashboard
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleDashboardTabChange('template_authority')}
                                    className={cn(
                                        'flex cursor-pointer items-center gap-1.5 border-b-2 px-4 py-2 text-xs font-semibold transition-all',
                                        dashboardTab === 'template_authority'
                                            ? 'border-primary text-primary font-bold'
                                            : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200',
                                    )}
                                >
                                    <LucideIcons.FileSpreadsheet
                                        size={14}
                                        className={dashboardTab === 'template_authority' ? 'text-primary' : 'text-slate-400'}
                                    />
                                    3. Otoritas Template
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleDashboardTabChange('on_behalf')}
                                    className={cn(
                                        'flex cursor-pointer items-center gap-1.5 border-b-2 px-4 py-2 text-xs font-semibold transition-all',
                                        dashboardTab === 'on_behalf'
                                            ? 'border-primary text-primary font-bold'
                                            : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200',
                                    )}
                                >
                                    <LucideIcons.UserCheck size={14} className={dashboardTab === 'on_behalf' ? 'text-primary' : 'text-slate-400'} />
                                    4. Otoritas On-Behalf
                                </button>
                            </div>
                        )}

                        {/* Navigation Tabs for SLA Configs */}
                        {resourceSlug === 'contract-sla-configs' && (
                            <div className="border-surface-border/60 bg-surface-base flex items-center gap-2 border-t px-6 pt-2">
                                <button
                                    type="button"
                                    onClick={() => handleSlaTabChange('config')}
                                    className={cn(
                                        'flex cursor-pointer items-center gap-1.5 border-b-2 px-4 py-2 text-xs font-semibold transition-all',
                                        slaTab === 'config'
                                            ? 'border-primary text-primary font-bold'
                                            : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200',
                                    )}
                                >
                                    <LucideIcons.Clock size={14} className={slaTab === 'config' ? 'text-primary' : 'text-slate-400'} />
                                    1. Target SLA & Hari Kerja
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleSlaTabChange('overdue_authority')}
                                    className={cn(
                                        'flex cursor-pointer items-center gap-1.5 border-b-2 px-4 py-2 text-xs font-semibold transition-all',
                                        slaTab === 'overdue_authority'
                                            ? 'border-primary text-primary font-bold'
                                            : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200',
                                    )}
                                >
                                    <LucideIcons.BellRing size={14} className={slaTab === 'overdue_authority' ? 'text-primary' : 'text-slate-400'} />
                                    2. Otoritas Notifikasi Overdue
                                    <span className="py-0.2 bg-primary/10 text-primary ml-1 rounded-full px-1.5 text-[9px] font-bold">
                                        {(data.authorities || []).length}
                                    </span>
                                </button>
                            </div>
                        )}

                        {/* Navigation Tabs for Users */}
                        {resourceSlug === 'users' && isEdit && (
                            <div className="border-surface-border/60 bg-surface-base flex items-center gap-2 border-t px-6 pt-2">
                                <button
                                    type="button"
                                    onClick={() => handleUserTabChange('profile')}
                                    className={cn(
                                        'flex cursor-pointer items-center gap-1.5 border-b-2 px-4 py-2 text-xs font-semibold transition-all',
                                        userTab === 'profile'
                                            ? 'border-primary text-primary font-bold'
                                            : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200',
                                    )}
                                >
                                    <LucideIcons.UserCheck size={14} className={userTab === 'profile' ? 'text-primary' : 'text-slate-400'} />
                                    1. Profil & Akses Pengguna
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleUserTabChange('policy')}
                                    className={cn(
                                        'flex cursor-pointer items-center gap-1.5 border-b-2 px-4 py-2 text-xs font-semibold transition-all',
                                        userTab === 'policy'
                                            ? 'border-primary text-primary font-bold'
                                            : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200',
                                    )}
                                >
                                    <LucideIcons.SlidersHorizontal size={14} className={userTab === 'policy' ? 'text-primary' : 'text-slate-400'} />
                                    2. Kebijakan Dashboard & Filter Dokumen
                                    <span className="py-0.2 ml-1 rounded-full bg-emerald-100 px-1.5 text-[9px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                        View Only
                                    </span>
                                </button>
                            </div>
                        )}

                        {/* Navigation Tabs for Vendors */}
                        {resourceSlug === 'vendors' && isEdit && (
                            <div className="border-surface-border/60 flex items-center gap-2 border-t px-6 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('info')}
                                    className={cn(
                                        'cursor-pointer border-b-2 px-4 py-2 text-xs font-semibold transition-all',
                                        activeTab === 'info'
                                            ? 'border-primary text-primary font-bold'
                                            : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200',
                                    )}
                                >
                                    1. Form Edit Data
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('detail')}
                                    className={cn(
                                        'cursor-pointer border-b-2 px-4 py-2 text-xs font-semibold transition-all',
                                        activeTab === 'detail'
                                            ? 'border-primary text-primary font-bold'
                                            : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200',
                                    )}
                                >
                                    2. Detail Profil & Legalitas Vendor
                                </button>
                            </div>
                        )}
                    </div>

                    {activeTab === 'info' && (resourceSlug !== 'users' || userTab === 'profile') && (
                        <form onSubmit={handleSubmit} className="animate-in fade-in flex min-h-0 flex-1 flex-col overflow-hidden duration-200">
                            {/* Scrollable Form Body */}
                            <div className="flex-1 [scrollbar-width:none] space-y-6 overflow-y-auto p-6 pb-8 [&::-webkit-scrollbar]:hidden">
                                {resourceSlug === 'contract-sla-configs' && slaTab === 'overdue_authority' ? (
                                    <div className="col-span-full space-y-4">
                                        <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                                            <LucideIcons.BellRing className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                                            <div>
                                                <h4 className="text-text-main text-xs font-bold">
                                                    Penerima Notifikasi SLA Terlewat (Overdue Escalation)
                                                </h4>
                                                <p className="text-text-muted mt-0.5 text-[11px]">
                                                    Tentukan personil, peran, atau atasan terkait yang akan otomatis menerima email alert ketika
                                                    pengajuan kontrak pada konfigurasi SLA ini melewati batas waktu.
                                                </p>
                                            </div>
                                        </div>

                                        <AuthorityTableManager
                                            authorities={data.authorities || []}
                                            onChange={(newAuths) => setData('authorities', newAuths)}
                                            roles={roles}
                                            departments={departments}
                                            divisions={divisions}
                                            locations={locations}
                                            users={users}
                                            companyGroups={companyGroups}
                                            organizationGroups={organizationGroups}
                                            regions={regions}
                                            companies={companies}
                                            title="Matriks Penerima Notifikasi Overdue"
                                            showCustom={true}
                                            showCombinations={true}
                                            showInitiatorOption={true}
                                        />
                                    </div>
                                ) : resourceSlug === 'dashboard-types' && dashboardTab === 'authority' ? (
                                    <div className="space-y-6">
                                        <div className="border-primary/20 bg-primary/5 flex items-start gap-3 rounded-xl border p-4">
                                            <LucideIcons.ShieldCheck className="text-primary mt-0.5 h-5 w-5 shrink-0" />
                                            <div>
                                                <h4 className="text-text-main text-xs font-bold">Identitas Profil & Matriks Target Pengguna</h4>
                                                <p className="text-text-muted mt-0.5 text-[11px]">
                                                    Atur nama profil, tingkat prioritas evaluasi, dan tentukan satu atau beberapa kombinasi kriteria
                                                    pengguna (Role, Level Jabatan, Divisi, Departemen, Lokasi, atau Akun Spesifik) yang mendapatkan
                                                    profil dashboard ini.
                                                </p>
                                            </div>
                                        </div>

                                        <div className={getGridClass()}>
                                            {formSchema
                                                .filter((field: any) => {
                                                    const label = (field.label || '').toLowerCase();
                                                    return label.includes('identitas') || label.includes('informasi');
                                                })
                                                .map((field: any) => {
                                                    if (field.isGroup) {
                                                        const GroupIcon =
                                                            field.icon && (LucideIcons as any)[field.icon]
                                                                ? (LucideIcons as any)[field.icon]
                                                                : undefined;

                                                        return (
                                                            <div key={field.label} className="col-span-full flex flex-col gap-4 pt-2">
                                                                <div className="border-surface-border flex items-center justify-between gap-4 border-b pb-2">
                                                                    <div className="flex items-center gap-2">
                                                                        {GroupIcon && (
                                                                            <GroupIcon className="text-primary h-4 w-4 shrink-0 opacity-80" />
                                                                        )}
                                                                        <div>
                                                                            <h3 className="text-text-main text-xs font-semibold tracking-wider uppercase">
                                                                                {field.label}
                                                                            </h3>
                                                                            {field.description && (
                                                                                <p className="text-text-muted mt-0.5 text-[11px]">
                                                                                    {field.description}
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className={getGridClass()}>
                                                                    {field.schema
                                                                        .filter(
                                                                            (subField: any) =>
                                                                                ![
                                                                                    'can_change_company_group',
                                                                                    'can_change_region',
                                                                                    'can_change_company',
                                                                                    'can_change_division',
                                                                                    'can_change_department',
                                                                                    'use_role_filter',
                                                                                ].includes(subField.name),
                                                                        )
                                                                        .map((subField: any) => renderField(subField))}
                                                                </div>
                                                            </div>
                                                        );
                                                    }
                                                    return renderField(field);
                                                })}
                                        </div>

                                        <div className="col-span-full pt-2">
                                            <AuthorityTableManager
                                                authorities={data.authorities || []}
                                                onChange={(newAuths) => setData('authorities', newAuths)}
                                                roles={roles}
                                                departments={departments}
                                                divisions={divisions}
                                                locations={locations}
                                                users={users}
                                                companyGroups={companyGroups}
                                                organizationGroups={organizationGroups}
                                                regions={regions}
                                                companies={companies}
                                                title="Matriks Target Pengguna Profil"
                                                showCustom={false}
                                                showCombinations={true}
                                                showInitiatorOption={false}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {resourceSlug === 'dashboard-types' && dashboardTab === 'visibility' && (
                                            <div className="border-primary/20 bg-primary/5 flex items-start gap-3 rounded-xl border p-4">
                                                <LucideIcons.LayoutDashboard className="text-primary mt-0.5 h-5 w-5 shrink-0" />
                                                <div>
                                                    <h4 className="text-text-main text-xs font-bold">Visibilitas Tab Ringkasan & Modul Dashboard</h4>
                                                    <p className="text-text-muted mt-0.5 text-[11px]">
                                                        Tentukan tab statistik ringkasan dan modul dashboard apa saja yang dapat dilihat dan diakses
                                                        oleh pengguna dengan profil ini.
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                        {resourceSlug === 'dashboard-types' && dashboardTab === 'template_authority' && (
                                            <div className="border-primary/20 bg-primary/5 flex items-start gap-3 rounded-xl border p-4">
                                                <LucideIcons.FileSpreadsheet className="text-primary mt-0.5 h-5 w-5 shrink-0" />
                                                <div>
                                                    <h4 className="text-text-main text-xs font-bold">
                                                        Hak Akses & Otoritas Template Dokumen (/admin/templates)
                                                    </h4>
                                                    <p className="text-text-muted mt-0.5 text-[11px]">
                                                        Tentukan hak akses pengguna profil ini terhadap berkas template kontrak, pembuatan folder
                                                        direktori, download file, upload berkas, ubah nama, atur visibilitas, hingga penghapusan
                                                        berkas.
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                        {resourceSlug === 'dashboard-types' && dashboardTab === 'on_behalf' && (
                                            <div className="border-primary/20 bg-primary/5 flex items-start gap-3 rounded-xl border p-4">
                                                <LucideIcons.UserCheck className="text-primary mt-0.5 h-5 w-5 shrink-0" />
                                                <div>
                                                    <h4 className="text-text-main text-xs font-bold">
                                                        Otoritas Buat Pengajuan Atas Nama Orang Lain (On-Behalf)
                                                    </h4>
                                                    <p className="text-text-muted mt-0.5 text-[11px]">
                                                        Izinkan pengguna dengan profil dashboard ini untuk membuat dan mengajukan draft kontrak baru
                                                        atas nama personil atau pemohon (requester) lain.
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                        <div className={getGridClass()}>
                                            {formSchema
                                                .filter((field: any) => {
                                                    if (resourceSlug !== 'dashboard-types') return true;
                                                    const label = (field.label || '').toLowerCase();
                                                    if (dashboardTab === 'visibility') {
                                                        return (
                                                            label.includes('visibilitas tab') ||
                                                            label.includes('visibility') ||
                                                            label.includes('visibilitas')
                                                        );
                                                    }
                                                    if (dashboardTab === 'template_authority') {
                                                        return label.includes('template dokumen') || label.includes('otoritas & akses template');
                                                    }
                                                    if (dashboardTab === 'on_behalf') {
                                                        return (
                                                            label.includes('on-behalf') || label.includes('on_behalf') || label.includes('atas nama')
                                                        );
                                                    }
                                                    return false;
                                                })
                                                .map((field: any) => {
                                                    if (field.isGroup) {
                                                        const GroupIcon =
                                                            field.icon && (LucideIcons as any)[field.icon]
                                                                ? (LucideIcons as any)[field.icon]
                                                                : undefined;

                                                        return (
                                                            <div key={field.label} className="col-span-full flex flex-col gap-4 pt-2">
                                                                <div className="border-surface-border flex items-center justify-between gap-4 border-b pb-2">
                                                                    <div className="flex items-center gap-2">
                                                                        {GroupIcon && (
                                                                            <GroupIcon className="text-primary h-4 w-4 shrink-0 opacity-80" />
                                                                        )}
                                                                        <div>
                                                                            <h3 className="text-text-main text-xs font-semibold tracking-wider uppercase">
                                                                                {field.label}
                                                                            </h3>
                                                                            {field.description && (
                                                                                <p className="text-text-muted mt-0.5 text-[11px]">
                                                                                    {field.description}
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className={getGridClass()}>
                                                                    {field.schema
                                                                        .filter(
                                                                            (subField: any) =>
                                                                                ![
                                                                                    'can_change_company_group',
                                                                                    'can_change_region',
                                                                                    'can_change_company',
                                                                                    'can_change_division',
                                                                                    'can_change_department',
                                                                                    'use_role_filter',
                                                                                ].includes(subField.name),
                                                                        )
                                                                        .map((subField: any) => renderField(subField))}
                                                                </div>
                                                            </div>
                                                        );
                                                    }

                                                    return renderField(field);
                                                })}
                                        </div>

                                        {resourceSlug === 'dashboard-types' && dashboardTab === 'on_behalf' && data.can_create_on_behalf && (
                                            <div className="border-surface-border col-span-full border-t pt-4">
                                                <AuthorityTableManager
                                                    authorities={data.on_behalf_authorities || []}
                                                    onChange={(newAuths) => setData('on_behalf_authorities', newAuths)}
                                                    roles={roles}
                                                    departments={departments}
                                                    divisions={divisions}
                                                    locations={locations}
                                                    users={users}
                                                    companyGroups={companyGroups}
                                                    organizationGroups={organizationGroups}
                                                    regions={regions}
                                                    companies={companies}
                                                    title="Matriks Target Initiator yang Boleh Diwakili (On-Behalf)"
                                                    showCustom={false}
                                                    showCombinations={true}
                                                    showInitiatorOption={false}
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Sticky Footer */}
                            <div className="border-surface-border bg-surface-muted/30 flex shrink-0 items-center justify-end gap-3 border-t px-6 py-3.5">
                                <Link href={returnUrl || `/admin/core/${resourceSlug}`}>
                                    <Button type="button" variant="white" className="border-surface-border h-9 rounded-xl text-xs">
                                        Batal
                                    </Button>
                                </Link>
                                <Button type="submit" variant="primary" disabled={processing} className="h-9 rounded-xl text-xs">
                                    Simpan Data
                                </Button>
                            </div>
                        </form>
                    )}

                    {/* Tab 2: User Resolved Policy View (Read Only & Compact) */}
                    {resourceSlug === 'users' &&
                        isEdit &&
                        userTab === 'policy' &&
                        record?.resolved_policy &&
                        (() => {
                            const policy = record.resolved_policy;
                            const activeTabs = [
                                policy.show_overview && 'Overview Kontrak & Metrik',
                                policy.show_overview_contract && 'Overview Kontrak',
                                policy.show_overview_non_contract && 'Overview Non-Kontrak',
                                policy.show_overview_nda && 'Overview NDA',
                                policy.show_workload && 'Workload Tim & Approval',
                                policy.show_master_data && 'Master Data Terkait',
                            ].filter(Boolean);

                            const categories = (policy.categories || []).map((cat: string) => {
                                if (cat === 'contract') return 'Kontrak (Contract)';
                                if (cat === 'non-contract') return 'Non-Kontrak';
                                if (cat === 'nda') return 'Kerahasiaan (NDA)';
                                return cat;
                            });

                            return (
                                <div className="animate-in fade-in flex min-h-0 flex-1 flex-col overflow-hidden duration-200">
                                    <div className="flex-1 [scrollbar-width:none] space-y-4 overflow-y-auto p-6 pb-8 [&::-webkit-scrollbar]:hidden">
                                        {/* User Context Header Banner */}
                                        <div className="border-primary/20 from-primary/5 via-surface-base to-surface-muted/30 flex flex-col justify-between gap-3 rounded-xl border bg-gradient-to-r p-4 shadow-2xs md:flex-row md:items-center">
                                            <div className="flex items-center gap-3.5">
                                                <div className="bg-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white shadow-xs">
                                                    {(record.name || 'U').substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <h3 className="text-text-main text-sm font-bold">{record.name}</h3>
                                                        <span className="bg-primary/10 text-primary border-primary/20 rounded-md border px-2 py-0.5 text-[10px] font-bold">
                                                            {record.roleRelation?.name || record.role || 'User'}
                                                        </span>
                                                        {record.division?.name && (
                                                            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                                Divisi: {record.division.name}
                                                            </span>
                                                        )}
                                                        {record.department?.name && (
                                                            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                                                Dept: {record.department.name}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-text-muted mt-0.5 text-[11px]">
                                                        NIK: {record.nik || '-'} &bull; Email: {record.email || '-'} &bull; Perusahaan:{' '}
                                                        {record.company_name || '-'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex shrink-0 items-center gap-2 md:self-center">
                                                <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                                                    {policy.dashboard_type_name}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Compact Policy Grid */}
                                        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
                                            {/* Card 1: Profil & Visibilitas Dashboard */}
                                            <div className="border-surface-border bg-surface-base flex flex-col justify-between gap-3 rounded-xl border p-4 shadow-2xs">
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                                                            <LucideIcons.LayoutDashboard size={13} className="text-primary" /> Profil Dashboard
                                                        </span>
                                                        <span className="py-0.2 rounded bg-emerald-100 px-1.5 text-[9px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                                            Aktif
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-text-main text-xs leading-snug font-bold">
                                                            {policy.dashboard_type_name}
                                                        </h4>
                                                        <p className="text-text-muted mt-1 text-[11px] leading-relaxed">
                                                            {policy.dashboard_type_description}
                                                        </p>
                                                    </div>
                                                </div>

                                                {activeTabs.length > 0 && (
                                                    <div className="border-surface-border/60 border-t pt-2.5">
                                                        <span className="text-text-muted mb-1.5 block text-[10px] font-semibold">
                                                            Visibilitas Tab Aktif:
                                                        </span>
                                                        <div className="flex flex-wrap gap-1">
                                                            {activeTabs.map((tab: string) => (
                                                                <span
                                                                    key={tab}
                                                                    className="rounded border border-blue-200/80 bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300"
                                                                >
                                                                    {tab}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Card 2: Cakupan Organisasi (Dynamic Scope) */}
                                            <div className="border-surface-border bg-surface-base flex flex-col justify-between gap-3 rounded-xl border p-4 shadow-2xs">
                                                <div className="space-y-2.5">
                                                    <div className="flex items-center justify-between">
                                                        <span className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                                                            <LucideIcons.ShieldCheck size={13} className="text-primary" /> Cakupan Organisasi
                                                        </span>
                                                        <span className="py-0.2 rounded bg-slate-100 px-1.5 text-[9px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                                            Dynamic Scope
                                                        </span>
                                                    </div>
                                                    <div className="space-y-1.5 text-xs">
                                                        <div className="border-surface-border/50 flex items-center justify-between border-b py-1">
                                                            <span className="text-text-muted text-[11px]">Cakupan Divisi:</span>
                                                            <span
                                                                className={cn(
                                                                    'text-[11px] font-semibold',
                                                                    policy.scope_to_user_division
                                                                        ? 'text-amber-600 dark:text-amber-400'
                                                                        : 'text-emerald-600 dark:text-emerald-400',
                                                                )}
                                                            >
                                                                {policy.scope_to_user_division
                                                                    ? `Terkunci (${record.division?.name || 'Divisi User'})`
                                                                    : 'Lintas Divisi (Bebas)'}
                                                            </span>
                                                        </div>
                                                        <div className="border-surface-border/50 flex items-center justify-between border-b py-1">
                                                            <span className="text-text-muted text-[11px]">Cakupan Dept:</span>
                                                            <span
                                                                className={cn(
                                                                    'text-[11px] font-semibold',
                                                                    policy.scope_to_user_department
                                                                        ? 'text-amber-600 dark:text-amber-400'
                                                                        : 'text-emerald-600 dark:text-emerald-400',
                                                                )}
                                                            >
                                                                {policy.scope_to_user_department
                                                                    ? `Terkunci (${record.department?.name || 'Dept User'})`
                                                                    : 'Semua Dept di Divisi'}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center justify-between py-1">
                                                            <span className="text-text-muted text-[11px]">Cakupan PT/Group:</span>
                                                            <span
                                                                className={cn(
                                                                    'text-[11px] font-semibold',
                                                                    policy.scope_to_user_company
                                                                        ? 'text-amber-600 dark:text-amber-400'
                                                                        : 'text-emerald-600 dark:text-emerald-400',
                                                                )}
                                                            >
                                                                {policy.scope_to_user_company ? 'Terkunci PT Sendiri' : 'Lintas Perusahaan'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Card 3: Filter Dokumen & Pengajuan */}
                                            <div className="border-surface-border bg-surface-base flex flex-col justify-between gap-3 rounded-xl border p-4 shadow-2xs">
                                                <div className="space-y-2.5">
                                                    <div className="flex items-center justify-between">
                                                        <span className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                                                            <LucideIcons.FileText size={13} className="text-primary" /> Filter Pengajuan Dokumen
                                                        </span>
                                                        <span className="py-0.2 rounded bg-slate-100 px-1.5 text-[9px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                                            Filter
                                                        </span>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <div>
                                                            <span className="text-text-muted mb-1 block text-[10.5px]">
                                                                Kategori Dokumen Terbuka:
                                                            </span>
                                                            <div className="flex flex-wrap gap-1">
                                                                {categories.map((cat: string) => (
                                                                    <span
                                                                        key={cat}
                                                                        className="bg-primary/10 text-primary border-primary/20 rounded border px-2 py-0.5 text-[10px] font-semibold"
                                                                    >
                                                                        {cat}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div className="border-surface-border/50 flex items-center justify-between border-t pt-2 text-xs">
                                                            <span className="text-text-muted text-[11px]">Tipe Dokumen:</span>
                                                            <span className="text-text-main text-[11px] font-semibold">
                                                                {policy.contract_type_ids?.length > 0
                                                                    ? `${policy.contract_type_ids.length} Tipe Dokumen Terpilih`
                                                                    : 'Semua Tipe Dokumen'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Informational Callout */}
                                        <div className="border-surface-border/80 bg-surface-muted/30 flex items-center gap-3 rounded-xl border p-3.5">
                                            <LucideIcons.Info size={16} className="text-primary shrink-0" />
                                            <p className="text-text-muted text-[11px] leading-relaxed">
                                                Pengaturan kebijakan dashboard ini dihitung secara dinamis oleh sistem berdasarkan matriks Role dan
                                                Divisi pengguna. Untuk menyesuaikan otoritas, Anda dapat mengubah <strong>Role</strong> atau{' '}
                                                <strong>Divisi</strong> pada Tab Profil, atau mengubah matriks di menu{' '}
                                                <Link href="/admin/core/dashboard-types" className="text-primary font-semibold hover:underline">
                                                    Tipe Dashboard
                                                </Link>
                                                .
                                            </p>
                                        </div>
                                    </div>

                                    {/* Tab 2 Footer */}
                                    <div className="border-surface-border bg-surface-muted/30 flex shrink-0 items-center justify-between gap-3 border-t px-6 py-3.5">
                                        <Link href={returnUrl || `/admin/core/${resourceSlug}`}>
                                            <Button type="button" variant="white" className="border-surface-border h-9 rounded-xl text-xs">
                                                Kembali ke Registri Pengguna
                                            </Button>
                                        </Link>
                                        <Button
                                            type="button"
                                            variant="primary"
                                            onClick={() => setUserTab('profile')}
                                            className="h-9 gap-1.5 rounded-xl text-xs"
                                        >
                                            <LucideIcons.Pencil size={13} />
                                            Ubah Profil Pengguna
                                        </Button>
                                    </div>
                                </div>
                            );
                        })()}

                    {/* Tab 2: Vendor Detail View */}
                    {activeTab === 'detail' &&
                        (() => {
                            const r = record as Record<string, any>;
                            const detail = (r?.vendor_detail || {}) as Record<string, any>;
                            const tax = (detail.tax || {}) as Record<string, any>;
                            const legality = (detail.legality || {}) as Record<string, any>;
                            const bankList = (Array.isArray(detail.bank) ? detail.bank : []) as Record<string, any>[];
                            const paymentMethods = (Array.isArray(detail.paymentMethod) ? detail.paymentMethod : []) as Record<string, any>[];
                            const businessFields = (Array.isArray(detail.businessFields) ? detail.businessFields : []) as Record<string, any>[];

                            const renderDocRow = (label: string, value: any, isFile = false) => {
                                let display: React.ReactNode = '-';
                                const hasValue = value !== null && value !== undefined && value !== '';

                                if (hasValue) {
                                    if (typeof value === 'boolean') {
                                        display = value ? 'Ya' : 'Tidak';
                                    } else if (Array.isArray(value)) {
                                        display = value.length > 0 ? value.join(', ') : '-';
                                    } else if (
                                        isFile ||
                                        (typeof value === 'string' &&
                                            (/\.(pdf|png|jpe?g|jfif|webp|gif|svg|docx?|xlsx?|pptx?|zip|rar|txt|csv)$/i.test(value) ||
                                                value.includes('__')))
                                    ) {
                                        const valStr = String(value);
                                        display = (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const fileUrl =
                                                        valStr.startsWith('http') || valStr.startsWith('/')
                                                            ? valStr
                                                            : `/admin/core/vendors/file-download?fileName=${encodeURIComponent(valStr)}`;
                                                    window.open(fileUrl, '_blank');
                                                }}
                                                className="inline-flex cursor-pointer items-center gap-1.5 text-left font-semibold text-blue-600 underline transition-all hover:text-blue-800 hover:no-underline dark:text-blue-400 dark:hover:text-blue-300"
                                                title="Klik untuk membuka/preview dokumen"
                                            >
                                                <LucideIcons.FileText className="h-3.5 w-3.5 shrink-0" />
                                                <span>{valStr}</span>
                                                <ExternalLink className="h-3 w-3 shrink-0 opacity-70" />
                                            </button>
                                        );
                                    } else {
                                        display = String(value);
                                    }
                                }

                                return (
                                    <div
                                        key={label}
                                        className="grid grid-cols-3 gap-4 border-b border-slate-100 py-2 text-xs last:border-none dark:border-slate-800/60"
                                    >
                                        <span className="font-medium text-slate-500 dark:text-slate-400">{label}</span>
                                        <span className="col-span-2 font-normal break-words text-slate-900 dark:text-slate-100">{display}</span>
                                    </div>
                                );
                            };

                            return (
                                <div className="animate-in fade-in w-full flex-1 [scrollbar-width:none] space-y-8 overflow-y-auto p-6 duration-200 [&::-webkit-scrollbar]:hidden">
                                    <div className="w-full space-y-8">
                                        {/* Document Header */}
                                        <div className="flex flex-col items-start justify-between gap-4 border-b-2 border-slate-900 pb-4 md:flex-row md:items-center dark:border-slate-100">
                                            <div>
                                                <div className="mb-1 inline-flex items-center gap-2 text-xs font-semibold tracking-widest text-slate-500 uppercase">
                                                    <LucideIcons.Building2 className="h-4 w-4" /> Profil & Dokumen Legalitas Rekanan
                                                </div>
                                                <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                                                    {r?.vendor_name || detail.name || 'Nama Vendor Tidak Tersedia'}
                                                </h2>
                                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                    Kode Vendor:{' '}
                                                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                                                        {r?.vendor_code || detail.registrationNumber || '-'}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>

                                        {/* Section 1: Profil & Identitas Perusahaan */}
                                        <div className="space-y-2">
                                            <h3 className="border-b border-slate-200 pb-1 text-xs font-bold tracking-wider text-slate-900 uppercase dark:border-slate-800 dark:text-slate-100">
                                                I. Profil & Identitas Rekanan
                                            </h3>
                                            <div>
                                                {renderDocRow('Nama Resmi', detail.name || r?.vendor_name)}
                                                {renderDocRow('Tipe Bentuk Usaha', detail.businessTypeName)}
                                                {renderDocRow('Nama Cabang', detail.branchName)}
                                                {renderDocRow('Nomor Registrasi', detail.registrationNumber)}
                                                {renderDocRow('Nomor Perjanjian', detail.agreementNumber)}
                                                {renderDocRow('Tanggal Perjanjian', detail.agreementDate)}
                                                {renderDocRow('Tanggal Disetujui', detail.approvedDate)}
                                                {renderDocRow('Total Karyawan', detail.totalEmployees)}
                                                {renderDocRow('Cakupan Wilayah (Coverage Area)', detail.coverageArea)}
                                                {renderDocRow('Compliance Level', detail.complianceLevel)}
                                                {renderDocRow('Integrity Pact', detail.integrityPact)}
                                                {renderDocRow('Master Agreement', detail.masterAgreement)}
                                                {renderDocRow('Single Vendor', detail.isSingleVendor)}
                                            </div>
                                        </div>

                                        {/* Section 2: Alamat & Kontak Resmi */}
                                        <div className="space-y-2">
                                            <h3 className="border-b border-slate-200 pb-1 text-xs font-bold tracking-wider text-slate-900 uppercase dark:border-slate-800 dark:text-slate-100">
                                                II. Alamat & Kontak Resmi
                                            </h3>
                                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                                <div>
                                                    <h4 className="mb-1 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                                                        Alamat Utama
                                                    </h4>
                                                    {renderDocRow('Alamat', detail.address)}
                                                    {renderDocRow('Kota', detail.city)}
                                                    {renderDocRow('Provinsi', detail.region)}
                                                    {renderDocRow('Negara', detail.country)}
                                                    {renderDocRow('Kode Pos', detail.postalCode)}
                                                </div>
                                                <div>
                                                    <h4 className="mb-1 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                                                        Alamat Surat Menyurat
                                                    </h4>
                                                    {renderDocRow('Alamat Surat', detail.mailingAddress)}
                                                    {renderDocRow('Kota Surat', detail.mailingCity)}
                                                    {renderDocRow('Provinsi Surat', detail.mailingRegion)}
                                                    {renderDocRow('Negara Surat', detail.mailingCountry)}
                                                    {renderDocRow('Kode Pos Surat', detail.mailingPostalCode)}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Section 3: Kontak & PIC */}
                                        <div className="space-y-2">
                                            <h3 className="border-b border-slate-200 pb-1 text-xs font-bold tracking-wider text-slate-900 uppercase dark:border-slate-800 dark:text-slate-100">
                                                III. Informasi Kontak & Person in Charge (PIC)
                                            </h3>
                                            <div>
                                                {renderDocRow('Email Perusahaan', detail.companyEmail)}
                                                {renderDocRow('No. Telepon Perusahaan', detail.companyPhone)}
                                                {renderDocRow('Fax Perusahaan', detail.companyFax)}
                                                {renderDocRow('Email Bagian Keuangan', detail.financeEmail)}
                                                {renderDocRow('Email Bagian Perpajakan', detail.taxEmail)}
                                                {renderDocRow('Nama PIC', detail.pic)}
                                                {renderDocRow('Email PIC', detail.picemail)}
                                                {renderDocRow('No. HP / Telepon PIC', detail.picphone)}
                                            </div>
                                        </div>

                                        {/* Section 4: Perpajakan */}
                                        <div className="space-y-2">
                                            <h3 className="border-b border-slate-200 pb-1 text-xs font-bold tracking-wider text-slate-900 uppercase dark:border-slate-800 dark:text-slate-100">
                                                IV. Data Perpajakan
                                            </h3>
                                            <div>
                                                {renderDocRow('Status NPWP', tax.typeNpwp)}
                                                {renderDocRow('Nomor NPWP', tax.npwp)}
                                                {renderDocRow('Status PKP', tax.typePkp)}
                                                {renderDocRow('Nomor PKP', tax.pkp)}
                                                {renderDocRow('Kategori BKP', tax.typeBkp)}
                                                {renderDocRow('Tarif PPN', tax.ppn ? `${tax.ppn}%` : null)}
                                                {renderDocRow('Deskripsi BKP', tax.bkpDesc)}
                                                {renderDocRow('Deskripsi JKP', tax.jkpDesc)}
                                                {renderDocRow('Organisasi', tax.isOrganization)}
                                                {renderDocRow('SIUJK', tax.isSiujk)}
                                                {renderDocRow('Nomor PP23', tax.pp23number)}
                                                {renderDocRow('Masa Berlaku PP23', tax.pp23expiredDate)}
                                            </div>
                                        </div>

                                        {/* Section 5: Bidang Usaha & Bank */}
                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <h3 className="border-b border-slate-200 pb-1 text-xs font-bold tracking-wider text-slate-900 uppercase dark:border-slate-800 dark:text-slate-100">
                                                    V. Bidang Usaha
                                                </h3>
                                                <div className="space-y-2">
                                                    <p className="text-xs font-medium text-slate-500">Lokal:</p>
                                                    <ul className="list-inside list-disc space-y-1 text-xs text-slate-800 dark:text-slate-200">
                                                        {businessFields.length > 0 ? (
                                                            businessFields.map((bf, idx) => <li key={idx}>{bf.businessField}</li>)
                                                        ) : (
                                                            <li>-</li>
                                                        )}
                                                    </ul>
                                                    {detail.businessFieldsForeign && (
                                                        <div className="border-t border-slate-200 pt-2 dark:border-slate-800">
                                                            <p className="text-xs font-medium text-slate-500">Asing:</p>
                                                            <p className="text-xs text-slate-800 dark:text-slate-200">
                                                                {detail.businessFieldsForeign}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <h3 className="border-b border-slate-200 pb-1 text-xs font-bold tracking-wider text-slate-900 uppercase dark:border-slate-800 dark:text-slate-100">
                                                    VI. Perbankan & Pembayaran
                                                </h3>
                                                <div className="space-y-2">
                                                    <div>
                                                        <p className="mb-1 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                                                            Rekening Bank
                                                        </p>
                                                        {bankList.length > 0 ? (
                                                            bankList.map((b, idx) => (
                                                                <div
                                                                    key={idx}
                                                                    className="border-b border-slate-200/60 py-1 text-xs last:border-none dark:border-slate-800/60"
                                                                >
                                                                    <p className="font-semibold text-slate-900 dark:text-slate-100">{b.bankName}</p>
                                                                    <p className="text-slate-600 dark:text-slate-400">
                                                                        No. Rek: <span className="font-mono font-semibold">{b.accountNumber}</span>{' '}
                                                                        a/n {b.accountName}
                                                                    </p>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <p className="text-xs text-slate-500">-</p>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="mb-1 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                                                            Metode Pembayaran
                                                        </p>
                                                        {paymentMethods.length > 0 ? (
                                                            paymentMethods.map((p, idx) => (
                                                                <p key={idx} className="text-xs text-slate-700 dark:text-slate-300">
                                                                    TOP: <strong>{p.top ?? '-'} hari</strong> | Full Payment:{' '}
                                                                    <strong>{p.fullPayment ?? '-'}%</strong>
                                                                </p>
                                                            ))
                                                        ) : (
                                                            <p className="text-xs text-slate-500">-</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Section 6: Legalitas & Berkas */}
                                        <div className="space-y-2">
                                            <h3 className="border-b border-slate-200 pb-1 text-xs font-bold tracking-wider text-slate-900 uppercase dark:border-slate-800 dark:text-slate-100">
                                                VII. Perizinan Legalitas
                                            </h3>
                                            <div>
                                                {renderDocRow('Nomor Induk Berusaha (NIB)', legality.nib)}
                                                {renderDocRow('Tgl Kadaluarsa NIB', legality.nibexpiredDate)}
                                                {renderDocRow('Izin Usaha (Business Permit)', legality.businessPermit)}
                                                {renderDocRow('SIUP', legality.siup)}
                                                {renderDocRow('Tgl Kadaluarsa SIUP', legality.siupexpiredDate)}
                                                {renderDocRow('TDP', legality.tdp)}
                                                {renderDocRow('Tgl Kadaluarsa TDP', legality.tdpexpiredDate)}
                                                {renderDocRow('Penandatangan Resmi', legality.signing)}
                                                {renderDocRow('Jabatan Penandatangan', legality.jobTitle)}
                                                {renderDocRow('Akta Pendirian', legality.memorandumOfAssociation)}
                                                {renderDocRow('Surat Keputusan Menkumham', legality.decissionLetterMenkumham)}
                                            </div>
                                        </div>

                                        {/* Section 7: File Lampiran */}
                                        <div className="space-y-2">
                                            <h3 className="border-b border-slate-200 pb-1 text-xs font-bold tracking-wider text-slate-900 uppercase dark:border-slate-800 dark:text-slate-100">
                                                VIII. Berkas & Lampiran Dokumen
                                            </h3>
                                            <div>
                                                {renderDocRow('File KTP (ID Card File)', detail.idCardFile)}
                                                {renderDocRow('File Master Agreement', detail.masterAgreementAttachment)}
                                                {renderDocRow('File Profile Perusahaan', detail.companyProfileAttachment)}
                                                {renderDocRow('File Single Vendor', detail.singleVendorFile)}
                                                {renderDocRow('File Compliance', detail.complianceFile)}
                                                {renderDocRow('Lampiran NIB', legality.nibattachment)}
                                                {renderDocRow('Lampiran Izin Usaha', legality.businessPermitAttachment)}
                                                {renderDocRow('Lampiran SIUP', legality.siupattachment)}
                                                {renderDocRow('Lampiran TDP', legality.tdpattachment)}
                                                {renderDocRow('Lampiran Akta Pendirian', legality.memorandumOfAssociationAttachment)}
                                                {renderDocRow('Lampiran SK Menkumham', legality.decissionLetterMenkumhamAttachment)}
                                                {renderDocRow('Lampiran Akta Perubahan', legality.memorandumOfAssociationChangingAttachment)}
                                                {renderDocRow('Lampiran SK Menkumham Perubahan', legality.decissionLetterMenkumhamChangingAttachment)}
                                                {renderDocRow('Lampiran Spesimen Tanda Tangan', legality.signingAttachment)}
                                                {renderDocRow('Lampiran Pendaftaran Perusahaan', legality.companyRegistrationAttachment)}
                                                {renderDocRow('Lampiran Surat Domisili', legality.domicileAttachment)}
                                                {renderDocRow('Lampiran Lisensi Usaha', legality.businessLicenceFile)}
                                                {renderDocRow('Lampiran BKPM', legality.investmentCoorBoardFile)}
                                                {renderDocRow('Lampiran Surat Keagenan', legality.agencyLetterFile)}
                                                {renderDocRow('Lampiran Dokumen Lainnya', legality.otherAttachment)}
                                                {renderDocRow('Lampiran NPWP', tax.npwpfile)}
                                                {renderDocRow('Lampiran SK PKP', tax.skpkpfile)}
                                                {renderDocRow('Lampiran JKP', tax.jkfile)}
                                                {renderDocRow('Lampiran PP23', tax.pp23attachment)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                </div>
            </div>

            {resourceSlug === 'contract-sla-configs' && (
                <SlaSimulationModal
                    open={isSlaSimOpen}
                    onOpenChange={setIsSlaSimOpen}
                    currentConfig={{
                        name: data.name,
                        contract_type_id: data.contract_type_id,
                        topic: data.topic,
                        sla_drafting_hours: data.sla_drafting_hours,
                        sla_review_hours: data.sla_review_hours,
                        sla_total_hours: data.sla_total_hours,
                        sla_start_hour: data.sla_start_hour,
                        sla_cutoff_hour: data.sla_cutoff_hour,
                        working_days: data.working_days,
                        warning_threshold_percent: data.warning_threshold_percent,
                    }}
                />
            )}
        </>
    );
}
