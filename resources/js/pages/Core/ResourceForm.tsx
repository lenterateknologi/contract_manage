import { Button } from '@/components/ui/buttons/Button';
import { Label } from '@/components/ui/forms/Label';
import { FormInput } from '@/components/ui/inputs/FormInput';
import { FormTextarea } from '@/components/ui/inputs/FormTextarea';
import { Checkbox } from '@/components/ui/selection/Checkbox';
import { TreeSelect } from '@/components/ui/selection/TreeSelect';
import LucideIcons from '@/lib/lucide-dynamic';
import { cn } from '@/lib/utils';
import AuthorityTableManager from '@/pages/workflows/components/AuthorityTableManager';
import { SlaSimulationModal } from '@/pages/contracts/components/parts/SlaSimulationModal';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Calculator, ExternalLink, Plus, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';

const COMMON_ICONS = [
    'Clock', 'CheckCircle', 'CheckCircle2', 'CheckCheck', 'XCircle', 'AlertCircle', 'AlertTriangle',
    'FileText', 'FileCheck', 'FileX', 'FileClock', 'FileEdit', 'FileQuestion',
    'Folder', 'FolderClosed', 'FolderOpen', 'Inbox', 'Send', 'User', 'Users',
    'Settings', 'Shield', 'Database', 'Key', 'Lock', 'Unlock', 'Eye', 'EyeOff',
    'Trash2', 'Plus', 'Check', 'X', 'HelpCircle', 'Info', 'CheckSquare',
    'Square', 'Minus', 'ChevronRight', 'ChevronDown', 'Search', 'Zap', 'Ban',
    'RefreshCw', 'Archive', 'ListOrdered'
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

    const filteredIcons = COMMON_ICONS.filter(icon =>
        icon.toLowerCase().includes(search.toLowerCase())
    );

    const SelectedIcon = value && (LucideIcons as any)[value]
        ? (LucideIcons as any)[value]
        : null;

    return (
        <div ref={containerRef} className="relative w-full">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex h-11 w-full items-center justify-between rounded-lg border border-surface-border bg-surface-base px-3 py-2 text-sm font-normal shadow-xs hover:bg-surface-muted/30 transition-all text-left"
            >
                <div className="flex items-center gap-2">
                    {SelectedIcon ? (
                        <SelectedIcon className="h-4 w-4 text-primary" />
                    ) : (
                        <div className="h-4 w-4 rounded-full border border-dashed border-muted-foreground/55" />
                    )}
                    <span className={value ? 'text-foreground font-normal' : 'text-text-main font-normal'}>
                        {value || 'Pilih Ikon...'}
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    {value && (
                        <span
                            onClick={(e) => {
                                e.stopPropagation();
                                onChange('');
                            }}
                            className="p-1 rounded-md hover:bg-rose-50 text-text-main hover:text-rose-500 transition-all cursor-pointer"
                            title="Hapis Ikon"
                        >
                            <LucideIcons.X className="h-3.5 w-3.5" />
                        </span>
                    )}
                    <LucideIcons.ChevronDown className="h-4 w-4 text-text-main animate-all duration-200" />
                </div>
            </button>

            {isOpen && (
                <div className="absolute z-50 mt-1 w-full rounded-lg border border-surface-border bg-surface-base shadow-lg p-2 flex flex-col gap-2 max-h-60 overflow-y-auto">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Cari ikon..."
                        className="flex h-9 w-full rounded-md border border-surface-border bg-surface-base px-3 py-1 text-xs outline-hidden focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary"
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
                                    className={`flex flex-col items-center justify-center p-2 rounded-md hover:bg-primary/10 hover:text-primary transition-all gap-1 text-[10px] font-normal text-center border border-transparent ${value === iconName ? 'bg-primary/10 text-primary border-primary/20' : 'text-text-main'
                                        }`}
                                >
                                    {Icon && <Icon className="h-4 w-4" />}
                                    <span className="truncate w-full text-[9px]">{iconName}</span>
                                </button>
                            );
                        })}
                        {filteredIcons.length === 0 && (
                            <div className="col-span-full py-4 text-center text-xs font-normal text-text-main">
                                Tidak ada ikon ditemukan
                            </div>
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
    isInputDisabled = false
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
            ? [...field.options].map(item => Array.isArray(item) ? item : [String(item), String(item)])
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
        <div ref={containerRef} className={cn("space-y-1.5 w-full relative", disabled && "opacity-60")}>
            <div className="flex items-center justify-between w-full">
                <Label className="text-[11px] font-bold uppercase text-slate-700 dark:text-zinc-200">
                    {field.label} {field.required && <span className="text-rose-500">*</span>}
                </Label>
                {toggleName && onToggleChange && (
                    <div className={cn("flex items-center gap-2", disabled && "pointer-events-none")}>
                        <span className={cn(
                            "text-[9.5px] font-bold uppercase tracking-tight transition-colors",
                            toggleValue ? "text-primary dark:text-primary-foreground font-semibold" : "text-muted-foreground"
                        )}>
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
                                "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-all duration-300 outline-hidden active:scale-95",
                                toggleValue ? 'bg-primary dark:bg-white' : 'bg-slate-200 dark:bg-slate-800',
                                disabled && "cursor-not-allowed"
                            )}
                        >
                            <span
                                className={`pointer-events-none block h-3 w-3 rounded-full shadow-lg transition-transform duration-300 ring-0 ${toggleValue ? 'translate-x-5 bg-white dark:bg-primary' : 'translate-x-1 bg-white dark:bg-white/50'
                                    }`}
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
                    "flex h-10 w-full items-center justify-between rounded-lg border border-border bg-surface-base px-3.5 py-2 text-sm font-normal transition-all text-left outline-hidden",
                    isButtonDisabled
                        ? 'opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-900 border-slate-200 text-slate-500'
                        : 'hover:border-primary/50 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary cursor-pointer'
                )}
            >
                <span className={cn(
                    "truncate text-sm",
                    selectedLabels.length > 0 ? "text-foreground font-normal" : "text-muted-foreground font-normal"
                )}>
                    {disabled
                        ? 'Filter Terkunci (Mengikuti Filter Bawaan Role)'
                        : isInputDisabled
                            ? 'Otomatis Mengikuti Profil User Login'
                            : isTemplateLocked
                                ? 'Filter Terkunci (Mengikuti Profil User)'
                                : selectedLabels.length > 0
                                    ? `${selectedLabels.length} terpilih (${selectedLabels.slice(0, 2).join(', ')}${selectedLabels.length > 2 ? '...' : ''})`
                                    : (field.placeholder || `Pilih ${field.label}...`)}
                </span>
                <LucideIcons.ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
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
                                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/20 max-w-full"
                            >
                                <span className="truncate max-w-[220px]">{label}</span>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        onChange(value.filter((v: any) => String(v) !== String(val)));
                                    }}
                                    className="hover:bg-primary/20 rounded-full p-0.5 cursor-pointer text-primary transition-colors shrink-0"
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
                            className="text-[10.5px] font-medium text-rose-500 hover:text-rose-600 hover:underline px-1.5 py-0.5 cursor-pointer"
                        >
                            Hapus Semua ({value.length})
                        </button>
                    )}
                </div>
            )}

            {isOpen && (
                <div className={cn(
                    "absolute left-0 z-50 w-full rounded-lg border border-border bg-popover text-popover-foreground shadow-lg p-2.5 flex flex-col gap-2 max-h-80 animate-in fade-in-0 zoom-in-95",
                    dropdownDirection === 'down' ? 'top-full mt-1' : 'bottom-full mb-1'
                )}>
                    {/* Search & Tabs Header */}
                    <div className="flex flex-col gap-1.5">
                        <div className="relative">
                            <LucideIcons.Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder={`Cari ${field.label}...`}
                                className="flex h-9 w-full rounded-md border border-border bg-background pl-8.5 pr-3 py-1 text-sm outline-hidden focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary placeholder:text-muted-foreground text-foreground"
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>

                        {/* Filter Tabs: Semua vs Terpilih */}
                        <div className="flex items-center justify-between bg-muted/50 p-1 rounded-md border border-border/50 text-xs">
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setFilterTab('all');
                                    }}
                                    className={cn(
                                        "px-2.5 py-1 rounded text-xs font-medium transition-all cursor-pointer",
                                        filterTab === 'all'
                                            ? "bg-background text-foreground shadow-xs"
                                            : "text-muted-foreground hover:text-foreground"
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
                                        "px-2.5 py-1 rounded text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5",
                                        filterTab === 'selected'
                                            ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <span>Hanya Terpilih</span>
                                    <span className={cn(
                                        "px-1.5 py-0.2 rounded-full text-[10px]",
                                        filterTab === 'selected' ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
                                    )}>
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
                                    className="text-[11px] text-rose-500 hover:text-rose-600 hover:underline px-1.5 cursor-pointer"
                                >
                                    Reset
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col gap-0.5 overflow-y-auto pr-1 custom-scrollbar max-h-52">
                        {paginatedOptions.map((option: any) => {
                            const val = Array.isArray(field.options) ? option : option[0];
                            const label = Array.isArray(field.options) ? option : option[1];
                            const isChecked = value.includes(String(val));
                            return (
                                <label
                                    key={val}
                                    className={cn(
                                        "flex items-center gap-2.5 cursor-pointer text-sm font-normal text-foreground hover:bg-accent py-2 px-2.5 rounded-md transition-colors",
                                        isChecked && "bg-primary/10 text-primary font-medium"
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
                                    setPageSize(prev => prev + 25);
                                }}
                                className="text-[11px] font-bold text-primary hover:text-primary-hover hover:underline text-center py-2 mt-1 cursor-pointer bg-muted/50 border border-border rounded-md"
                            >
                                Lihat Lebih Banyak... (+{filteredOptions.length - pageSize} Data)
                            </button>
                        )}
                        {filteredOptions.length === 0 && (
                            <span className="text-xs text-muted-foreground text-center py-4">
                                {filterTab === 'selected' ? 'Belum ada data yang dipilih' : 'Tidak ada data ditemukan'}
                            </span>
                        )}
                    </div>
                </div>
            )}
            {error && (
                <span className="text-rose-500 text-[10px] font-bold uppercase mt-1 block">
                    {error}
                </span>
            )}
        </div>
    );
}

function SingleSelectField({
    field,
    value,
    onChange,
    error,
    disabled = false
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
        <div ref={containerRef} className="space-y-1.5 w-full relative">
            <Label htmlFor={field.name} className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-200">
                {field.label} {field.required && <span className="text-rose-500">*</span>}
            </Label>

            <button
                type="button"
                disabled={disabled}
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex h-10 w-full items-center justify-between rounded-lg border border-border bg-surface-base px-3.5 py-2 text-sm font-normal transition-all text-left outline-hidden",
                    disabled
                        ? 'opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-900 border-slate-200 text-slate-500'
                        : 'hover:border-primary/50 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary cursor-pointer',
                    isOpen && 'border-primary ring-1 ring-primary'
                )}
            >
                <span className={cn(
                    "truncate text-sm",
                    selectedLabel ? "text-foreground font-normal" : "text-muted-foreground font-normal"
                )}>
                    {selectedLabel ? String(selectedLabel) : (field.placeholder || `Pilih ${field.label}...`)}
                </span>
                <LucideIcons.ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 z-50 mt-1 w-full rounded-lg border border-border bg-popover text-popover-foreground shadow-lg p-2 flex flex-col gap-2 max-h-64 animate-in fade-in-0 zoom-in-95">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={`Cari ${field.label}...`}
                        className="flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm outline-hidden focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary placeholder:text-muted-foreground text-foreground"
                        onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex flex-col gap-0.5 overflow-y-auto pr-1 custom-scrollbar">
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
                                        "w-full flex items-center justify-between py-2 px-2.5 rounded-md text-left transition-colors text-sm font-normal text-foreground hover:bg-accent cursor-pointer",
                                        isSelected && "bg-accent text-accent-foreground font-medium"
                                    )}
                                >
                                    <span className="truncate">{label}</span>
                                    {isSelected && <LucideIcons.Check className="h-4 w-4 text-primary shrink-0 ml-2" />}
                                </button>
                            );
                        })}
                        {filteredOptions.length > pageSize && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setPageSize(prev => prev + 15);
                                }}
                                className="text-[11px] font-bold text-primary hover:text-primary-hover hover:underline text-center py-2 mt-1 cursor-pointer bg-muted/50 border border-border rounded-md"
                            >
                                Tampilkan Lebih Banyak... (+{filteredOptions.length - pageSize} Data)
                            </button>
                        )}
                        {filteredOptions.length === 0 && (
                            <span className="text-xs text-muted-foreground text-center py-4">
                                Tidak ada data
                            </span>
                        )}
                    </div>
                </div>
            )}
            {error && (
                <span className="text-rose-500 text-[10px] font-bold uppercase mt-1 block">
                    {error}
                </span>
            )}
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
    const [dashboardTab, setDashboardTab] = useState<'setting' | 'authority' | 'filtering'>('setting');
    const [userTab, setUserTab] = useState<'profile' | 'policy'>('profile');
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

    if (resourceSlug === 'dashboard-types') {
        initialFormState['authorities'] = record?.authorities || [];
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
            const companyField = flattenedFields.find(f => f.name === 'company_id');
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
            const companyField = flattenedFields.find(f => f.name === 'company_name');
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
            const locField = flattenedFields.find(f => f.name === 'location_id');
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
            const jobField = flattenedFields.find(f => f.name === 'job_position_id');
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
        const endpoint = returnUrl
            ? `/admin/core/${resourceSlug}${isEdit ? `/${record.id}` : ''}?return_url=${encodeURIComponent(returnUrl)}`
            : `/admin/core/${resourceSlug}${isEdit ? `/${record.id}` : ''}`;

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
        if (['allowed_company_groups', 'allowed_regions', 'allowed_companies', 'allowed_divisions', 'allowed_departments', 'sla_stages'].includes(field.name)) {
            return 'col-span-full';
        }
        if (field.columnSpan === 'full' || field.columnSpan >= formColumns) return 'col-span-full';
        if (field.columnSpan === 2) return 'col-span-1 md:col-span-2';
        if (field.columnSpan === 3) return 'col-span-1 md:col-span-2 xl:col-span-3';
        return 'col-span-1';
    };

    const renderField = (field: any) => {
        const IconComponent = field.icon && (LucideIcons as any)[field.icon]
            ? (LucideIcons as any)[field.icon]
            : undefined;

        return (
            <div key={field.name} className={getSpanClass(field)}>
                {field.name === 'sla_stages' ? (() => {
                    const stages: Array<{ id?: string; contract_status?: string; status?: string; duration_hours: number; is_active?: boolean }> = Array.isArray(data.sla_stages) && data.sla_stages.length > 0
                        ? data.sla_stages
                        : [
                            { contract_status: 'draft', duration_hours: 24, is_active: true },
                            { contract_status: 'in_review', duration_hours: 48, is_active: true },
                            { contract_status: 'pending', duration_hours: 48, is_active: true }
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
                        const totalH = newStages.reduce((sum, item) => sum + (item.is_active !== false ? (Number(item.duration_hours) || 0) : 0), 0);
                        setData('sla_total_hours', totalH);
                    };

                    const handleAddStage = () => {
                        const newStages = [
                            ...stages,
                            { contract_status: 'in_review', duration_hours: 24, duration_days: 1, is_active: true }
                        ];
                        setData('sla_stages', newStages);
                        const totalH = newStages.reduce((sum, item) => sum + (item.is_active !== false ? (Number(item.duration_hours) || 0) : 0), 0);
                        setData('sla_total_hours', totalH);
                    };

                    const handleRemoveStage = (idx: number) => {
                        if (stages.length <= 1) return;
                        const newStages = stages.filter((_, i) => i !== idx);
                        setData('sla_stages', newStages);
                        const totalH = newStages.reduce((sum, item) => sum + (item.is_active !== false ? (Number(item.duration_hours) || 0) : 0), 0);
                        setData('sla_total_hours', totalH);
                    };

                    const activeStagesCount = stages.filter(st => st.is_active !== false).length;
                    const totalAccumulatedHours = stages.reduce((sum, item) => sum + (item.is_active !== false ? (Number(item.duration_hours) || 0) : 0), 0);
                    const totalDaysFormatted = (totalAccumulatedHours / 24).toFixed(1).replace(/\.0$/, '');

                    return (
                        <div className="space-y-2.5 w-full">
                            {/* Action & Summary Header */}
                            <div className="flex items-center justify-between gap-3 pb-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
                                        {activeStagesCount}/{stages.length} Tahap Aktif
                                    </span>
                                    <span className="text-xs text-muted-foreground hidden sm:inline">
                                        Total Target SLA: <strong className="text-foreground font-semibold">{totalDaysFormatted} Hari</strong>
                                    </span>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <span className="text-xs text-muted-foreground sm:hidden font-semibold">
                                        {totalDaysFormatted} Hari
                                    </span>
                                    <Button
                                        type="button"
                                        variant="white"
                                        className="h-8 text-xs font-bold gap-1 rounded-lg border-primary/30 text-primary hover:bg-primary/10 cursor-pointer shadow-none"
                                        onClick={handleAddStage}
                                    >
                                        <Plus className="w-3.5 h-3.5" /> Tambah Status
                                    </Button>
                                </div>
                            </div>

                            {/* Column Header for Desktop */}
                            <div className="hidden md:grid md:grid-cols-12 gap-3 px-1 pb-1.5 border-b border-border/60 text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                                <div className="col-span-7">Status Kontrak</div>
                                <div className="col-span-3">Target Durasi</div>
                                <div className="col-span-2 text-right pr-1">Status & Aksi</div>
                            </div>

                            {/* Item List Rows (Flat Divider-separated rows) */}
                            <div className="divide-y divide-border/40 border-b border-border/40">
                                {stages.map((st, idx) => {
                                    const rawH = Number(st.duration_hours) || 0;
                                    const dVal = (st as any).duration_days ?? (rawH > 0 ? (rawH / 24).toFixed(1).replace(/\.0$/, '') : '');
                                    const isStageActive = st.is_active !== false;

                                    // Resolve current values with fallback compatibility
                                    const currentContractStatus = st.contract_status || (
                                        ['draft', 'in_review', 'review_f1', 'review_f2', 'review_agreement', 'review_legal', 'review_finance', 'review_compliance', 'review_vendor', 'pending', 'revision', 'approved', 'signed', 'queue', 'active', 'completed', 'closed', 'rejected', 'cancelled', 'expired', 'all'].includes(st.status || '')
                                            ? st.status
                                            : 'draft'
                                    );

                                    return (
                                        <div
                                            key={idx}
                                            className={cn(
                                                "grid grid-cols-1 md:grid-cols-12 gap-3 items-center py-2 px-1 transition-colors",
                                                isStageActive
                                                    ? "hover:bg-surface-muted/30"
                                                    : "opacity-60 hover:opacity-80"
                                            )}
                                        >
                                            {/* 1. Status Kontrak (col-span-7) */}
                                            <div className="md:col-span-7">
                                                <span className="text-[10px] font-bold uppercase text-muted-foreground block md:hidden mb-1">
                                                    #{idx + 1} Status Kontrak
                                                </span>
                                                <div className="relative flex items-center">
                                                    <span className="hidden md:inline-flex text-[10px] font-mono font-bold text-muted-foreground mr-1.5 w-4 shrink-0 text-right">
                                                        {idx + 1}.
                                                    </span>
                                                    <div className="relative w-full">
                                                        <div className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-muted-foreground">
                                                            <LucideIcons.FileText className="w-3.5 h-3.5 shrink-0 text-slate-500 dark:text-zinc-400" />
                                                        </div>
                                                        <select
                                                            value={currentContractStatus}
                                                            onChange={(e) => handleStageChange(idx, 'contract_status', e.target.value)}
                                                            className="w-full h-8.5 rounded-md border border-border/80 bg-background pl-8 pr-3 text-xs font-semibold text-foreground focus:ring-1 focus:ring-primary focus:outline-none cursor-pointer"
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
                                                <span className="text-[10px] font-bold uppercase text-muted-foreground block md:hidden mb-1">
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
                                                    rightAction={<span className="text-[11px] font-medium text-muted-foreground pr-2">Hari</span>}
                                                />
                                            </div>

                                            {/* 3. Status Aktif Toggle & Delete Action (col-span-2) */}
                                            <div className="md:col-span-2 flex items-center justify-end gap-1.5 pt-1 md:pt-0">
                                                <button
                                                    type="button"
                                                    onClick={() => handleStageChange(idx, 'is_active', !isStageActive)}
                                                    className={cn(
                                                        "h-8 px-2.5 rounded-md border flex items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer select-none",
                                                        isStageActive
                                                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20"
                                                            : "bg-surface-muted border-border text-muted-foreground hover:bg-surface-border"
                                                    )}
                                                    title={isStageActive ? "Tahap Aktif (Dihitung)" : "Tahap Nonaktif"}
                                                >
                                                    <span className={cn(
                                                        "w-1.5 h-1.5 rounded-full",
                                                        isStageActive ? "bg-emerald-500" : "bg-muted-foreground/50"
                                                    )} />
                                                    <span>{isStageActive ? 'Aktif' : 'Off'}</span>
                                                </button>

                                                <button
                                                    type="button"
                                                    disabled={stages.length <= 1}
                                                    onClick={() => handleRemoveStage(idx)}
                                                    className={cn(
                                                        "w-8 h-8 rounded-md flex items-center justify-center border transition-all shrink-0",
                                                        stages.length <= 1
                                                            ? "opacity-25 cursor-not-allowed border-border text-muted-foreground"
                                                            : "border-border hover:border-rose-300 text-muted-foreground hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                                                    )}
                                                    title={stages.length <= 1 ? "Minimal 1 status SLA" : "Hapus status ini"}
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Summary Footer */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-1 px-1 text-[11px] text-muted-foreground gap-1">
                                <span>* Klik &ldquo;Tambah Status&rdquo; untuk menambah tahapan alur kontrak.</span>
                                <span className="font-semibold text-foreground">
                                    Total Target SLA: <span className="text-primary font-bold">{totalDaysFormatted} Hari</span>
                                </span>
                            </div>
                        </div>
                    );
                })() : (field.name === 'sla_drafting_hours' || field.name === 'sla_total_hours' || field.name === 'sla_review_hours') ? (() => {
                    const rawVal = Number(data[field.name]) || 0;
                    const daysVal = rawVal > 0 ? (rawVal / 24).toFixed(1).replace(/\.0$/, '') : '';
                    return (
                        <div className="space-y-1 w-full">
                            <div className="flex items-center justify-between px-0.5">
                                <Label className="text-[11px] font-bold uppercase text-slate-700 dark:text-zinc-200">
                                    {field.label} {field.required && <span className="text-rose-500">*</span>}
                                </Label>
                                {rawVal > 0 && (
                                    <span className="text-[9.5px] font-bold text-primary bg-primary/10 px-1.5 py-0.2 rounded">
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
                                        rightAction={<span className="text-[11px] font-semibold text-muted-foreground pr-2">Hari</span>}
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
                                        rightAction={<span className="text-[11px] font-semibold text-muted-foreground pr-2">Jam</span>}
                                        error={errors[field.name]}
                                    />
                                </div>
                            </div>
                            {field.helperText && !errors[field.name] && (
                                <p className="text-[10px] text-muted-foreground px-0.5 font-normal">
                                    {field.helperText}
                                </p>
                            )}
                        </div>
                    );
                })() : field.name === 'sla_cutoff_hour' ? (() => {
                    const cutoffVal = data['sla_cutoff_hour'] !== '' && data['sla_cutoff_hour'] !== null && data['sla_cutoff_hour'] !== undefined ? Number(data['sla_cutoff_hour']) : '';
                    const cutoffTimeFormatted = cutoffVal !== '' && !isNaN(cutoffVal) ? `${String(cutoffVal).padStart(2, '0')}:00 WIB` : '';
                    return (
                        <div className="space-y-1 w-full">
                            <div className="flex items-center justify-between px-0.5">
                                <Label className="text-[11px] font-bold uppercase text-slate-700 dark:text-zinc-200">
                                    {field.label} {field.required && <span className="text-rose-500">*</span>}
                                </Label>
                                {cutoffTimeFormatted && (
                                    <span className="text-[9.5px] font-bold text-primary bg-primary/10 px-1.5 py-0.2 rounded font-mono">
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
                                rightAction={<span className="text-[11px] font-semibold text-muted-foreground pr-2 font-mono">:00 WIB</span>}
                                error={errors['sla_cutoff_hour']}
                            />
                            {field.helperText && !errors['sla_cutoff_hour'] && (
                                <p className="text-[10px] text-muted-foreground px-0.5 font-normal">
                                    {field.helperText}
                                </p>
                            )}
                        </div>
                    );
                })() : field.name === 'working_days' ? (() => {
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
                        <div className="space-y-1 w-full">
                            <div className="flex items-center justify-between px-0.5">
                                <Label className="text-[11px] font-bold uppercase text-slate-700 dark:text-zinc-200">
                                    {field.label}
                                </Label>
                                <span className="text-[9.5px] font-bold text-primary bg-primary/10 px-1.5 py-0.2 rounded font-mono">
                                    {activeDaysCount} Hari Aktif / Minggu
                                </span>
                            </div>
                            <div className="grid grid-cols-7 gap-1 h-9 items-center">
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
                                                "h-9 rounded-md border text-xs font-bold transition-all cursor-pointer select-none flex flex-col items-center justify-center",
                                                isSelected
                                                    ? "bg-primary text-primary-foreground border-primary shadow-xs font-semibold"
                                                    : "bg-surface-muted/40 text-muted-foreground border-border/80 hover:bg-surface-muted hover:text-foreground"
                                            )}
                                            title={`${d.label} (${isSelected ? 'Aktif dihitung SLA' : 'Libur / Tidak dihitung'})`}
                                        >
                                            <span className="text-[11px] leading-none">{d.short}</span>
                                        </button>
                                    );
                                })}
                            </div>
                            {field.helperText && !errors['working_days'] && (
                                <p className="text-[10px] text-muted-foreground px-0.5 font-normal">
                                    {field.helperText}
                                </p>
                            )}
                        </div>
                    );
                })() : (field.name === 'sla_cutoff_hour' || field.name === 'working_days') ? null : (field.type === 'text' || field.type === 'number' || field.type === 'integer' || field.type === 'email' || field.type === 'password') && (
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
                    <div className="space-y-1.5 w-full">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-zinc-200 uppercase px-0.5 tracking-wider">
                            {field.label}
                        </label>
                        <div className="flex h-10 w-full items-center rounded-lg border border-border bg-muted px-3 text-xs font-medium text-foreground select-all cursor-default">
                            {data[field.name] ?? <span className="italic text-muted-foreground">{field.placeholder || '—'}</span>}
                        </div>
                        {field.helperText && (
                            <p className="text-[11px] text-muted-foreground px-0.5 mt-1 font-normal">
                                {field.helperText}
                            </p>
                        )}
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
                    <div className="space-y-1.5 w-full">
                        <Label className="text-[11px] font-bold uppercase text-slate-700 dark:text-zinc-200 px-0.5">
                            {field.label} {field.required && <span className="text-rose-500">*</span>}
                        </Label>
                        <div className="flex items-center gap-2">
                            <input
                                type="color"
                                value={data[field.name] || '#ffffff'}
                                onChange={(e) => setData(field.name, e.target.value)}
                                className="h-9 w-12 cursor-pointer rounded-lg border border-border bg-background p-1 shrink-0"
                                required={field.required}
                            />
                            <input
                                type="text"
                                value={data[field.name] || ''}
                                onChange={(e) => setData(field.name, e.target.value)}
                                className="flex h-9 w-full rounded-lg border border-border bg-background px-3 py-1 text-xs font-mono font-semibold uppercase focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-primary"
                                placeholder="#hexcode"
                            />
                            {data[field.name] && (
                                <button
                                    type="button"
                                    onClick={() => setData(field.name, '')}
                                    className="h-9 px-2.5 flex items-center justify-center rounded-lg border border-border bg-background hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200 text-muted-foreground transition-all shadow-xs shrink-0 cursor-pointer"
                                    title="Hapus Warna"
                                >
                                    <LucideIcons.X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>
                        {field.helperText && !errors[field.name] && (
                            <p className="text-[11px] text-muted-foreground px-0.5 mt-1 font-normal">
                                {field.helperText}
                            </p>
                        )}
                        {errors[field.name] && (
                            <span className="text-rose-500 text-[10px] font-bold uppercase mt-1 block">
                                {errors[field.name]}
                            </span>
                        )}
                    </div>
                )}
                {field.type === 'icon' && (
                    <div className="space-y-1.5 w-full relative">
                        <Label className="text-[11px] font-bold uppercase text-slate-700 dark:text-zinc-200 px-0.5">
                            {field.label} {field.required && <span className="text-rose-500">*</span>}
                        </Label>
                        <IconPicker
                            value={data[field.name] || ''}
                            onChange={(val) => setData(field.name, val)}
                        />
                        {field.helperText && !errors[field.name] && (
                            <p className="text-[11px] text-muted-foreground px-0.5 mt-1 font-normal">
                                {field.helperText}
                            </p>
                        )}
                        {errors[field.name] && (
                            <span className="text-rose-500 text-[10px] font-bold uppercase mt-1 block">
                                {errors[field.name]}
                            </span>
                        )}
                    </div>
                )}
                {field.type === 'select' && field.multiple && field.name !== 'working_days' ? (() => {
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

                    const toggleVal = toggleName ? (
                        data[toggleName] === true || data[toggleName] === 1 || data[toggleName] === '1' || data[toggleName] === 'true'
                    ) : false;

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
                                <p className="text-[11px] text-muted-foreground px-0.5 mt-1 font-normal">
                                    {isScopedToUser ? `Otomatis mengikuti ${field.label.toLowerCase()} dari profil user login.` : field.helperText}
                                </p>
                            )}
                        </div>
                    );
                })() : field.type === 'select' && field.name !== 'working_days' && (
                    <div className="space-y-1">
                        <SingleSelectField
                            field={field}
                            value={data[field.name]}
                            onChange={(val) => setData(field.name, val)}
                            error={errors[field.name]}
                            disabled={isFieldDisabled(field.name)}
                        />
                        {field.helperText && !errors[field.name] && (
                            <p className="text-[11px] text-muted-foreground px-0.5 mt-1 font-normal">
                                {field.helperText}
                            </p>
                        )}
                    </div>
                )}
                {field.type === 'tree_select' && (
                    <div className="space-y-1.5 w-full">
                        <Label className="text-[11px] font-bold uppercase text-slate-700 dark:text-zinc-200 px-0.5">
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
                        />
                        {field.helperText && !errors[field.name] && (
                            <p className="text-[11px] text-muted-foreground px-0.5 mt-1 font-normal">
                                {field.helperText}
                            </p>
                        )}
                        {errors[field.name] && (
                            <span className="text-rose-500 text-[10px] font-bold uppercase mt-1 block">
                                {errors[field.name]}
                            </span>
                        )}
                    </div>
                )}
                {field.type === 'switch' && (() => {
                    const isChecked = data[field.name] === true || data[field.name] === 1 || data[field.name] === '1' || data[field.name] === 'true';
                    return (
                        <div
                            onClick={() => setData(field.name, !isChecked)}
                            className={cn(
                                "group relative flex items-start justify-between p-4 rounded-xl border transition-all cursor-pointer select-none",
                                isChecked
                                    ? "bg-primary/5 border-primary/40 shadow-xs ring-1 ring-primary/20 dark:bg-primary/10 dark:border-primary/50"
                                    : "bg-surface-base border-border hover:border-slate-300 dark:hover:border-zinc-700 hover:bg-surface-muted/30"
                            )}
                        >
                            <div className="flex items-start gap-3 pr-2">
                                <div className={cn(
                                    "p-2 rounded-lg transition-colors shrink-0",
                                    isChecked
                                        ? "bg-primary/15 text-primary dark:bg-primary/25"
                                        : "bg-surface-muted text-muted-foreground group-hover:text-foreground"
                                )}>
                                    {IconComponent ? (
                                        <IconComponent className="h-4 w-4" />
                                    ) : (
                                        <LucideIcons.Eye className="h-4 w-4" />
                                    )}
                                </div>
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                        <h4 className={cn(
                                            "text-xs font-bold leading-tight transition-colors",
                                            isChecked ? "text-foreground font-semibold" : "text-slate-700 dark:text-zinc-200"
                                        )}>
                                            {field.label}
                                        </h4>
                                        {isChecked && (
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-primary/10 text-primary uppercase font-mono">
                                                Aktif
                                            </span>
                                        )}
                                    </div>
                                    {field.helperText && (
                                        <p className="text-[10.5px] text-muted-foreground line-clamp-2 leading-relaxed font-normal">
                                            {field.helperText}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="shrink-0 pt-0.5" onClick={(e) => e.stopPropagation()}>
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={isChecked}
                                    onClick={() => setData(field.name, !isChecked)}
                                    className={cn(
                                        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-all duration-300 outline-hidden active:scale-95",
                                        isChecked ? 'bg-primary dark:bg-white' : 'bg-slate-200 dark:bg-slate-800'
                                    )}
                                >
                                    <span
                                        className={`pointer-events-none block h-3 w-3 rounded-full shadow-lg transition-transform duration-300 ring-0 ${isChecked ? 'translate-x-5 bg-white dark:bg-primary' : 'translate-x-1 bg-white dark:bg-white/50'
                                            }`}
                                    />
                                </button>
                            </div>
                        </div>
                    );
                })()}
            </div>
        );
    };

    return (
        <>
            <Head title={isEdit ? `Edit ${title}` : `Tambah ${title}`} />

            <div className="flex flex-col h-svh max-h-svh overflow-hidden bg-background w-full p-0 m-0">
                <div className="flex flex-col flex-1 min-h-0 w-full rounded-none border-0 bg-background shadow-none overflow-hidden">
                    {/* Sticky Header with Tabs */}
                    <div className="flex flex-col border-b border-surface-border bg-background shrink-0">
                        <div className="flex h-16 min-h-[64px] max-h-[64px] items-center justify-between px-6 box-border">
                            <div className="flex items-center gap-3">
                                <Link
                                    href={returnUrl || `/admin/core/${resourceSlug}`}
                                    className="p-2 border border-surface-border rounded-xl hover:bg-surface-muted transition-all text-text-main"
                                >
                                    <ArrowLeft size={16} />
                                </Link>
                                <div className="flex flex-col justify-center">
                                    <h1 className="text-[13.5px] font-bold text-text-main tracking-tight leading-tight">
                                        {isEdit ? `Edit ${title}` : `Tambah ${title}`}
                                    </h1>
                                    <p className="text-[10.5px] text-text-muted leading-tight mt-0.5">
                                        {isEdit ? 'Ubah informasi data yang sudah ada.' : 'Tambahkan data master baru ke sistem.'}
                                    </p>
                                </div>
                            </div>

                            {resourceSlug === 'contract-sla-configs' && (
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="white"
                                        className="h-8 gap-1.5 text-xs font-semibold border-border hover:bg-surface-muted text-primary"
                                        onClick={() => setIsSlaSimOpen(true)}
                                    >
                                        <Calculator size={14} className="text-primary" /> Simulasi SLA
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Navigation Tabs for Dashboard Types */}
                        {resourceSlug === 'dashboard-types' && (
                            <div className="flex items-center gap-2 px-6 border-t border-surface-border/60 pt-2 bg-surface-base">
                                <button
                                    type="button"
                                    onClick={() => setDashboardTab('setting')}
                                    className={cn(
                                        "px-4 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5",
                                        dashboardTab === 'setting'
                                            ? "border-primary text-primary font-bold"
                                            : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                                    )}
                                >
                                    <LucideIcons.LayoutDashboard size={14} className={dashboardTab === 'setting' ? 'text-primary' : 'text-slate-400'} />
                                    1. Pengaturan & Visibilitas Tab
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDashboardTab('authority')}
                                    className={cn(
                                        "px-4 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5",
                                        dashboardTab === 'authority'
                                            ? "border-primary text-primary font-bold"
                                            : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                                    )}
                                >
                                    <LucideIcons.Users size={14} className={dashboardTab === 'authority' ? 'text-primary' : 'text-slate-400'} />
                                    2. Target Pengguna & Matriks Organisasi
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDashboardTab('filtering')}
                                    className={cn(
                                        "px-4 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5",
                                        dashboardTab === 'filtering'
                                            ? "border-primary text-primary font-bold"
                                            : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                                    )}
                                >
                                    <LucideIcons.FileText size={14} className={dashboardTab === 'filtering' ? 'text-primary' : 'text-slate-400'} />
                                    3. Cakupan Dokumen & Pengajuan
                                </button>
                            </div>
                        )}

                        {/* Navigation Tabs for Users */}
                        {resourceSlug === 'users' && isEdit && (
                            <div className="flex items-center gap-2 px-6 border-t border-surface-border/60 pt-2 bg-surface-base">
                                <button
                                    type="button"
                                    onClick={() => setUserTab('profile')}
                                    className={cn(
                                        "px-4 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5",
                                        userTab === 'profile'
                                            ? "border-primary text-primary font-bold"
                                            : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                                    )}
                                >
                                    <LucideIcons.UserCheck size={14} className={userTab === 'profile' ? 'text-primary' : 'text-slate-400'} />
                                    1. Profil & Akses Pengguna
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setUserTab('policy')}
                                    className={cn(
                                        "px-4 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5",
                                        userTab === 'policy'
                                            ? "border-primary text-primary font-bold"
                                            : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                                    )}
                                >
                                    <LucideIcons.SlidersHorizontal size={14} className={userTab === 'policy' ? 'text-primary' : 'text-slate-400'} />
                                    2. Kebijakan Dashboard & Filter Dokumen
                                    <span className="ml-1 px-1.5 py-0.2 text-[9px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 rounded-full">
                                        View Only
                                    </span>
                                </button>
                            </div>
                        )}

                        {/* Navigation Tabs for Vendors */}
                        {resourceSlug === 'vendors' && isEdit && (
                            <div className="flex items-center gap-2 px-6 border-t border-surface-border/60 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('info')}
                                    className={cn(
                                        "px-4 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer",
                                        activeTab === 'info'
                                            ? "border-primary text-primary font-bold"
                                            : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                                    )}
                                >
                                    1. Form Edit Data
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('detail')}
                                    className={cn(
                                        "px-4 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer",
                                        activeTab === 'detail'
                                            ? "border-primary text-primary font-bold"
                                            : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                                    )}
                                >
                                    2. Detail Profil & Legalitas Vendor
                                </button>
                            </div>
                        )}
                    </div>

                    {activeTab === 'info' && (resourceSlug !== 'users' || userTab === 'profile') && (
                        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden animate-in fade-in duration-200">
                            {/* Scrollable Form Body */}
                            <div className="flex-1 overflow-y-auto p-6 pb-8 space-y-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                {resourceSlug === 'dashboard-types' && dashboardTab === 'authority' ? (
                                    <div className="col-span-full space-y-4">
                                        <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-start gap-3">
                                            <LucideIcons.ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                            <div>
                                                <h4 className="text-xs font-bold text-text-main">Matriks Otoritas & Target Pengguna Terpadu</h4>
                                                <p className="text-[11px] text-text-muted mt-0.5">
                                                    Tentukan satu atau beberapa kombinasi kriteria (Role, Level Jabatan, Divisi, Departemen, Lokasi, atau Akun Spesifik) yang dapat menggunakan profil dashboard ini.
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
                                            title="Matriks Target Pengguna Profil"
                                            showCustom={false}
                                            showCombinations={true}
                                            showInitiatorOption={false}
                                        />
                                    </div>
                                ) : (
                                    <div className={getGridClass()}>
                                        {formSchema
                                            .filter((field: any) => {
                                                if (resourceSlug !== 'dashboard-types') return true;
                                                const label = (field.label || '').toLowerCase();
                                                if (dashboardTab === 'setting') {
                                                    return label.includes('identitas') || label.includes('informasi') || label.includes('visibility') || label.includes('visibilitas');
                                                }
                                                if (dashboardTab === 'filtering') {
                                                    return label.includes('cakupan dokumen') || label.includes('kuncian tipe') || label.includes('dokumen & pengajuan') || (label.includes('scoping') && !label.includes('organisasi') && !label.includes('dynamic'));
                                                }
                                                return true;
                                            })
                                            .map((field: any) => {
                                                if (field.isGroup) {
                                                    const GroupIcon = field.icon && (LucideIcons as any)[field.icon]
                                                        ? (LucideIcons as any)[field.icon]
                                                        : undefined;

                                                    return (
                                                        <div key={field.label} className="col-span-full flex flex-col gap-4 pt-2">
                                                            <div className="flex items-center justify-between pb-2 border-b border-surface-border gap-4">
                                                                <div className="flex items-center gap-2">
                                                                    {GroupIcon && <GroupIcon className="h-4 w-4 text-primary shrink-0 opacity-80" />}
                                                                    <div>
                                                                        <h3 className="text-xs font-semibold uppercase tracking-wider text-text-main">{field.label}</h3>
                                                                        {field.description && (
                                                                            <p className="text-[11px] text-text-muted mt-0.5">{field.description}</p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className={getGridClass()}>
                                                                {field.schema
                                                                    .filter((subField: any) => !['can_change_company_group', 'can_change_region', 'can_change_company', 'can_change_division', 'can_change_department', 'use_role_filter'].includes(subField.name))
                                                                    .map((subField: any) => renderField(subField))}
                                                            </div>
                                                        </div>
                                                    );
                                                }

                                                return renderField(field);
                                            })}
                                    </div>
                                )}
                            </div>

                            {/* Sticky Footer */}
                            <div className="flex items-center justify-end gap-3 px-6 py-3.5 border-t border-surface-border bg-surface-muted/30 shrink-0">
                                <Link href={returnUrl || `/admin/core/${resourceSlug}`}>
                                    <Button type="button" variant="white" className="h-9 text-xs rounded-xl border-surface-border">
                                        Batal
                                    </Button>
                                </Link>
                                <Button type="submit" variant="primary" disabled={processing} className="h-9 text-xs rounded-xl">
                                    Simpan Data
                                </Button>
                            </div>
                        </form>
                    )}

                    {/* Tab 2: User Resolved Policy View (Read Only & Compact) */}
                    {resourceSlug === 'users' && isEdit && userTab === 'policy' && record?.resolved_policy && (() => {
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
                            <div className="flex flex-col flex-1 min-h-0 overflow-hidden animate-in fade-in duration-200">
                                <div className="flex-1 overflow-y-auto p-6 pb-8 space-y-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                    {/* User Context Header Banner */}
                                    <div className="p-4 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 via-surface-base to-surface-muted/30 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
                                        <div className="flex items-center gap-3.5">
                                            <div className="h-10 w-10 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                                                {(record.name || 'U').substring(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h3 className="text-sm font-bold text-text-main">{record.name}</h3>
                                                    <span className="px-2 py-0.5 text-[10px] font-bold bg-primary/10 text-primary rounded-md border border-primary/20">
                                                        {record.roleRelation?.name || record.role || 'User'}
                                                    </span>
                                                    {record.division?.name && (
                                                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md">
                                                            Divisi: {record.division.name}
                                                        </span>
                                                    )}
                                                    {record.department?.name && (
                                                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md">
                                                            Dept: {record.department.name}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[11px] text-text-muted mt-0.5">
                                                    NIK: {record.nik || '-'} &bull; Email: {record.email || '-'} &bull; Perusahaan: {record.company_name || '-'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0 md:self-center">
                                            <span className="px-2.5 py-1 text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                                                {policy.dashboard_type_name}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Compact Policy Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                                        {/* Card 1: Profil & Visibilitas Dashboard */}
                                        <div className="p-4 rounded-xl border border-surface-border bg-surface-base flex flex-col justify-between gap-3 shadow-2xs">
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                                        <LucideIcons.LayoutDashboard size={13} className="text-primary" /> Profil Dashboard
                                                    </span>
                                                    <span className="px-1.5 py-0.2 text-[9px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 rounded">
                                                        Aktif
                                                    </span>
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-bold text-text-main leading-snug">{policy.dashboard_type_name}</h4>
                                                    <p className="text-[11px] text-text-muted mt-1 leading-relaxed">{policy.dashboard_type_description}</p>
                                                </div>
                                            </div>

                                            {activeTabs.length > 0 && (
                                                <div className="pt-2.5 border-t border-surface-border/60">
                                                    <span className="text-[10px] font-semibold text-text-muted block mb-1.5">Visibilitas Tab Aktif:</span>
                                                    <div className="flex flex-wrap gap-1">
                                                        {activeTabs.map((tab: string) => (
                                                            <span key={tab} className="px-2 py-0.5 text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900 rounded">
                                                                {tab}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Card 2: Cakupan Organisasi (Dynamic Scope) */}
                                        <div className="p-4 rounded-xl border border-surface-border bg-surface-base flex flex-col justify-between gap-3 shadow-2xs">
                                            <div className="space-y-2.5">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                                        <LucideIcons.ShieldCheck size={13} className="text-primary" /> Cakupan Organisasi
                                                    </span>
                                                    <span className="px-1.5 py-0.2 text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded">
                                                        Dynamic Scope
                                                    </span>
                                                </div>
                                                <div className="space-y-1.5 text-xs">
                                                    <div className="flex items-center justify-between py-1 border-b border-surface-border/50">
                                                        <span className="text-text-muted text-[11px]">Cakupan Divisi:</span>
                                                        <span className={cn(
                                                            "font-semibold text-[11px]",
                                                            policy.scope_to_user_division ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
                                                        )}>
                                                            {policy.scope_to_user_division ? `Terkunci (${record.division?.name || 'Divisi User'})` : 'Lintas Divisi (Bebas)'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between py-1 border-b border-surface-border/50">
                                                        <span className="text-text-muted text-[11px]">Cakupan Dept:</span>
                                                        <span className={cn(
                                                            "font-semibold text-[11px]",
                                                            policy.scope_to_user_department ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
                                                        )}>
                                                            {policy.scope_to_user_department ? `Terkunci (${record.department?.name || 'Dept User'})` : 'Semua Dept di Divisi'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between py-1">
                                                        <span className="text-text-muted text-[11px]">Cakupan PT/Group:</span>
                                                        <span className={cn(
                                                            "font-semibold text-[11px]",
                                                            policy.scope_to_user_company ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
                                                        )}>
                                                            {policy.scope_to_user_company ? 'Terkunci PT Sendiri' : 'Lintas Perusahaan'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Card 3: Filter Dokumen & Pengajuan */}
                                        <div className="p-4 rounded-xl border border-surface-border bg-surface-base flex flex-col justify-between gap-3 shadow-2xs">
                                            <div className="space-y-2.5">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                                        <LucideIcons.FileText size={13} className="text-primary" /> Filter Pengajuan Dokumen
                                                    </span>
                                                    <span className="px-1.5 py-0.2 text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded">
                                                        Filter
                                                    </span>
                                                </div>
                                                <div className="space-y-2">
                                                    <div>
                                                        <span className="text-[10.5px] text-text-muted block mb-1">Kategori Dokumen Terbuka:</span>
                                                        <div className="flex flex-wrap gap-1">
                                                            {categories.map((cat: string) => (
                                                                <span key={cat} className="px-2 py-0.5 text-[10px] font-semibold bg-primary/10 text-primary rounded border border-primary/20">
                                                                    {cat}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="pt-2 border-t border-surface-border/50 flex items-center justify-between text-xs">
                                                        <span className="text-text-muted text-[11px]">Tipe Dokumen:</span>
                                                        <span className="font-semibold text-[11px] text-text-main">
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
                                    <div className="p-3.5 rounded-xl border border-surface-border/80 bg-surface-muted/30 flex items-center gap-3">
                                        <LucideIcons.Info size={16} className="text-primary shrink-0" />
                                        <p className="text-[11px] text-text-muted leading-relaxed">
                                            Pengaturan kebijakan dashboard ini dihitung secara dinamis oleh sistem berdasarkan matriks Role dan Divisi pengguna. Untuk menyesuaikan otoritas, Anda dapat mengubah <strong>Role</strong> atau <strong>Divisi</strong> pada Tab Profil, atau mengubah matriks di menu <Link href="/admin/core/dashboard-types" className="text-primary font-semibold hover:underline">Tipe Dashboard</Link>.
                                        </p>
                                    </div>
                                </div>

                                {/* Tab 2 Footer */}
                                <div className="flex items-center justify-between gap-3 px-6 py-3.5 border-t border-surface-border bg-surface-muted/30 shrink-0">
                                    <Link href={returnUrl || `/admin/core/${resourceSlug}`}>
                                        <Button type="button" variant="white" className="h-9 text-xs rounded-xl border-surface-border">
                                            Kembali ke Registri Pengguna
                                        </Button>
                                    </Link>
                                    <Button
                                        type="button"
                                        variant="primary"
                                        onClick={() => setUserTab('profile')}
                                        className="h-9 text-xs rounded-xl gap-1.5"
                                    >
                                        <LucideIcons.Pencil size={13} />
                                        Ubah Profil Pengguna
                                    </Button>
                                </div>
                            </div>
                        );
                    })()}

                    {/* Tab 2: Vendor Detail View */}
                    {activeTab === 'detail' && (() => {
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
                                } else if (isFile || (typeof value === 'string' && (/\.(pdf|png|jpe?g|jfif|webp|gif|svg|docx?|xlsx?|pptx?|zip|rar|txt|csv)$/i.test(value) || value.includes('__')))) {
                                    const valStr = String(value);
                                    display = (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const fileUrl = valStr.startsWith('http') || valStr.startsWith('/')
                                                    ? valStr
                                                    : `/admin/core/vendors/file-download?fileName=${encodeURIComponent(valStr)}`;
                                                window.open(fileUrl, '_blank');
                                            }}
                                            className="inline-flex items-center gap-1.5 font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline hover:no-underline transition-all cursor-pointer text-left"
                                            title="Klik untuk membuka/preview dokumen"
                                        >
                                            <LucideIcons.FileText className="w-3.5 h-3.5 shrink-0" />
                                            <span>{valStr}</span>
                                            <ExternalLink className="w-3 h-3 shrink-0 opacity-70" />
                                        </button>
                                    );
                                } else {
                                    display = String(value);
                                }
                            }

                            return (
                                <div key={label} className="py-2 grid grid-cols-3 gap-4 border-b border-slate-100 dark:border-slate-800/60 last:border-none text-xs">
                                    <span className="font-medium text-slate-500 dark:text-slate-400">{label}</span>
                                    <span className="col-span-2 font-normal text-slate-900 dark:text-slate-100 break-words">{display}</span>
                                </div>
                            );
                        };

                        return (
                            <div className="flex-1 overflow-y-auto p-6 space-y-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden animate-in fade-in duration-200 w-full">
                                <div className="w-full space-y-8">
                                    {/* Document Header */}
                                    <div className="border-b-2 border-slate-900 dark:border-slate-100 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                        <div>
                                            <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">
                                                <LucideIcons.Building2 className="w-4 h-4" /> Profil & Dokumen Legalitas Rekanan
                                            </div>
                                            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                                                {r?.vendor_name || detail.name || 'Nama Vendor Tidak Tersedia'}
                                            </h2>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                Kode Vendor: <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{r?.vendor_code || detail.registrationNumber || '-'}</span>
                                            </p>
                                        </div>
                                    </div>

                                    {/* Section 1: Profil & Identitas Perusahaan */}
                                    <div className="space-y-2">
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-1">
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
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-1">
                                            II. Alamat & Kontak Resmi
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Alamat Utama</h4>
                                                {renderDocRow('Alamat', detail.address)}
                                                {renderDocRow('Kota', detail.city)}
                                                {renderDocRow('Provinsi', detail.region)}
                                                {renderDocRow('Negara', detail.country)}
                                                {renderDocRow('Kode Pos', detail.postalCode)}
                                            </div>
                                            <div>
                                                <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Alamat Surat Menyurat</h4>
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
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-1">
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
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-1">
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
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-1">
                                                V. Bidang Usaha
                                            </h3>
                                            <div className="space-y-2">
                                                <p className="text-xs font-medium text-slate-500">Lokal:</p>
                                                <ul className="list-disc list-inside text-xs text-slate-800 dark:text-slate-200 space-y-1">
                                                    {businessFields.length > 0 ? businessFields.map((bf, idx) => (
                                                        <li key={idx}>{bf.businessField}</li>
                                                    )) : <li>-</li>}
                                                </ul>
                                                {detail.businessFieldsForeign && (
                                                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                                                        <p className="text-xs font-medium text-slate-500">Asing:</p>
                                                        <p className="text-xs text-slate-800 dark:text-slate-200">{detail.businessFieldsForeign}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-1">
                                                VI. Perbankan & Pembayaran
                                            </h3>
                                            <div className="space-y-2">
                                                <div>
                                                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Rekening Bank</p>
                                                    {bankList.length > 0 ? bankList.map((b, idx) => (
                                                        <div key={idx} className="text-xs border-b border-slate-200/60 dark:border-slate-800/60 py-1 last:border-none">
                                                            <p className="font-semibold text-slate-900 dark:text-slate-100">{b.bankName}</p>
                                                            <p className="text-slate-600 dark:text-slate-400">No. Rek: <span className="font-mono font-semibold">{b.accountNumber}</span> a/n {b.accountName}</p>
                                                        </div>
                                                    )) : <p className="text-xs text-slate-500">-</p>}
                                                </div>
                                                <div>
                                                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Metode Pembayaran</p>
                                                    {paymentMethods.length > 0 ? paymentMethods.map((p, idx) => (
                                                        <p key={idx} className="text-xs text-slate-700 dark:text-slate-300">
                                                            TOP: <strong>{p.top ?? '-'} hari</strong> | Full Payment: <strong>{p.fullPayment ?? '-'}%</strong>
                                                        </p>
                                                    )) : <p className="text-xs text-slate-500">-</p>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section 6: Legalitas & Berkas */}
                                    <div className="space-y-2">
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-1">
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
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-1">
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
