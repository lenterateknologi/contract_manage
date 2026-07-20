import React, { useState, useEffect } from 'react';
import { Head, useForm, Link, router, usePage } from '@inertiajs/react';
import { FormInput } from '@/components/ui/inputs/FormInput';
import { FormTextarea } from '@/components/ui/inputs/FormTextarea';
import { Button } from '@/components/ui/buttons/Button';
import { Label } from '@/components/ui/forms/Label';
import { ArrowLeft, Shield, Plus, Pencil, Trash2 } from 'lucide-react';
import LucideIcons from '@/lib/lucide-dynamic';
import { TreeSelect } from '@/components/ui/selection/TreeSelect';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialogs/Dialog';
import { SearchableMultiSelect } from '@/components/ui/selection/SearchableMultiSelect';
import { SearchableSelect } from '@/components/ui/selection/SearchableSelect';
import { Checkbox } from '@/components/ui/selection/Checkbox';

const COMMON_ICONS = [
    'Clock', 'CheckCircle2', 'XCircle', 'AlertCircle', 'AlertTriangle',
    'FileText', 'FileCheck', 'FileX', 'FileClock', 'FileEdit', 'FileQuestion',
    'Folder', 'FolderClosed', 'FolderOpen', 'Inbox', 'Send', 'User', 'Users',
    'Settings', 'Shield', 'Database', 'Key', 'Lock', 'Unlock', 'Eye', 'EyeOff',
    'Trash2', 'Plus', 'Check', 'X', 'HelpCircle', 'Info', 'CheckSquare',
    'Square', 'Minus', 'ChevronRight', 'ChevronDown', 'Search'
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
                                    className={`flex flex-col items-center justify-center p-2 rounded-md hover:bg-primary/10 hover:text-primary transition-all gap-1 text-[10px] font-normal text-center border border-transparent ${
                                        value === iconName ? 'bg-primary/10 text-primary border-primary/20' : 'text-text-main'
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
    toggleName,
    toggleValue,
    onToggleChange,
    disabled = false
}: {
    field: any;
    value: any[];
    onChange: (val: any[]) => void;
    error?: string;
    toggleName?: string | null;
    toggleValue?: boolean;
    onToggleChange?: (val: boolean) => void;
    disabled?: boolean;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [pageSize, setPageSize] = useState(10);
    const [dropdownDirection, setDropdownDirection] = useState<'down' | 'up'>('down');
    const containerRef = React.useRef<HTMLDivElement>(null);
    const buttonRef = React.useRef<HTMLButtonElement>(null);

    // Reset page size when search query changes
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

    useEffect(() => {
        if (isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            if (spaceBelow < 280) {
                setDropdownDirection('up');
            } else {
                setDropdownDirection('down');
            }
        }
    }, [isOpen]);

    const { auth } = usePage().props as any;
    const loginUser = auth?.user;

    const optionsList = React.useMemo(() => {
        const list = Array.isArray(field.options) 
            ? [...field.options].map(item => Array.isArray(item) ? item : [String(item), String(item)])
            : Object.entries(field.options || {}).map(([k, v]) => [k, v]);
        return list;
    }, [field.options, field.name]);

    const filteredOptions = optionsList.filter((option: any) => {
        const label = Array.isArray(optionsList[0]) ? option[1] : option;
        return String(label).toLowerCase().includes(search.toLowerCase());
    });

    const paginatedOptions = filteredOptions.slice(0, pageSize);

    const selectedLabels = value.map((val: any) => {
        const found = optionsList.find((option: any) => {
            const optVal = Array.isArray(option) ? option[0] : option;
            return String(optVal) === String(val);
        });
        return found ? (Array.isArray(found) ? found[1] : found) : val;
    });

    const isDisabled = disabled || (toggleName ? !toggleValue : false);
 
    // Reset list selection when toggle is disabled
    useEffect(() => {
        if (isDisabled && value.length > 0 && !disabled) {
            onChange([]);
        }
    }, [isDisabled]);
 
    return (
        <div ref={containerRef} className={cn("flex flex-col gap-1.5 w-full relative", disabled && "opacity-60")}>
            <div className="flex items-center justify-between w-full">
                <Label className="text-[11px] font-normal text-text-main uppercase px-0.5">
                    {field.label} {field.required && <span className="text-rose-500">*</span>}
                </Label>
                {toggleName && onToggleChange && (
                    <div className={cn("flex items-center gap-2", disabled && "pointer-events-none")}>
                        <span className="text-[9px] text-text-main font-normal uppercase">Dapat Mengubah</span>
                        <button
                            type="button"
                            role="switch"
                            disabled={disabled}
                            aria-checked={!!toggleValue}
                            onClick={() => onToggleChange(!toggleValue)}
                            className={cn(
                                "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-all duration-300 outline-hidden active:scale-95",
                                toggleValue ? 'bg-primary dark:bg-white' : 'bg-slate-200 dark:bg-slate-800',
                                disabled && "cursor-not-allowed"
                            )}
                        >
                            <span
                                className={`pointer-events-none block h-3 w-3 rounded-full shadow-lg transition-transform duration-300 ring-0 ${
                                    toggleValue ? 'translate-x-5 bg-white dark:bg-primary' : 'translate-x-1 bg-white dark:bg-white/50'
                                }`}
                            />
                        </button>
                    </div>
                )}
            </div>
            
            <button
                ref={buttonRef}
                type="button"
                disabled={isDisabled}
                onClick={() => setIsOpen(!isOpen)}
                className={`flex h-11 w-full items-center justify-between rounded-lg border border-surface-border bg-surface-base px-3 py-2 text-sm font-normal shadow-xs transition-all text-left ${
                    isDisabled 
                        ? 'opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-900 border-slate-200' 
                        : 'hover:bg-surface-muted/30 hover:border-surface-border cursor-pointer'
                }`}
            >
                <span className="truncate text-text-main">
                    {disabled
                        ? 'Filter Terkunci (Mengikuti Filter Bawaan Role)'
                        : isDisabled
                        ? 'Filter Terkunci (Mengikuti Profil User)'
                        : selectedLabels.length > 0
                        ? `${selectedLabels.length} terpilih (${selectedLabels.slice(0, 2).join(', ')}${selectedLabels.length > 2 ? '...' : ''})`
                        : `Pilih ${field.label}...`}
                </span>
                <LucideIcons.ChevronDown className="h-4 w-4 text-text-main shrink-0" />
            </button>
 
            {isOpen && (
                <div className={cn(
                    "absolute left-0 z-50 w-full rounded-lg border border-surface-border bg-surface-base shadow-lg p-2.5 flex flex-col gap-2.5 max-h-64",
                    dropdownDirection === 'down' ? 'top-full mt-1' : 'bottom-full mb-1'
                )}>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={`Cari ${field.label}...`}
                        className="flex h-9 w-full rounded-md border border-surface-border bg-surface-base px-3 py-1 text-xs outline-hidden focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary"
                        onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex flex-col gap-2 overflow-y-auto pr-1">
                        {paginatedOptions.map((option: any) => {
                            const val = Array.isArray(field.options) ? option : option[0];
                            const label = Array.isArray(field.options) ? option : option[1];
                            const isChecked = value.includes(String(val));
                            return (
                                <label
                                    key={val}
                                    className="flex items-center gap-2 cursor-pointer text-xs font-normal text-text-main hover:text-foreground py-1 px-1 rounded-md hover:bg-surface-muted/30"
                                >
                                    <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                onChange([...value, String(val)]);
                                            } else {
                                                onChange(value.filter((v: any) => String(v) !== String(val)));
                                            }
                                        }}
                                        className="rounded border-surface-border text-primary focus:ring-primary h-4 w-4"
                                    />
                                    <span>{label}</span>
                                </label>
                            );
                        })}
                        {filteredOptions.length > pageSize && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setPageSize(prev => prev + 15);
                                }}
                                className="text-[10px] font-bold text-primary hover:text-primary-hover hover:underline text-center py-1.5 mt-1 cursor-pointer bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-md"
                            >
                                Lihat Lebih Banyak... (+{filteredOptions.length - pageSize} Data)
                            </button>
                        )}
                        {filteredOptions.length === 0 && (
                            <span className="text-xs text-text-main/60 text-center py-2">
                                Tidak ada data
                            </span>
                        )}
                    </div>
                </div>
            )}
            {error && (
                <span className="text-rose-500 text-[10px] font-normal uppercase mt-1">
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
        <div ref={containerRef} className="flex flex-col gap-1.5 w-full relative">
            <Label htmlFor={field.name} className="text-[11px] font-normal text-text-main uppercase px-0.5">
                {field.label} {field.required && <span className="text-rose-500">*</span>}
            </Label>
            
            <button
                type="button"
                disabled={disabled}
                onClick={() => setIsOpen(!isOpen)}
                className={`flex h-11 w-full items-center justify-between rounded-lg border border-surface-border bg-surface-base px-3 py-2 text-sm font-normal shadow-xs transition-all text-left ${
                    disabled 
                        ? 'opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-900 border-slate-200' 
                        : 'hover:bg-surface-muted/30 hover:border-surface-border cursor-pointer'
                }`}
            >
                <span className="truncate text-text-main">
                    {selectedLabel ? String(selectedLabel) : (field.placeholder || `Pilih ${field.label.toLowerCase()}...`)}
                </span>
                <LucideIcons.ChevronDown className="h-4 w-4 text-text-main shrink-0" />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 z-50 mt-1 w-full rounded-lg border border-surface-border bg-surface-base shadow-lg p-2.5 flex flex-col gap-2.5 max-h-64">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={`Cari ${field.label}...`}
                        className="flex h-9 w-full rounded-md border border-surface-border bg-surface-base px-3 py-1 text-xs outline-hidden focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary"
                        onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex flex-col gap-1 overflow-y-auto pr-1">
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
                                    className={`w-full flex items-center justify-between p-2 rounded-md text-left transition-all text-xs font-normal text-text-main hover:bg-surface-muted/30 ${
                                        isSelected ? 'bg-primary-muted text-primary font-semibold' : ''
                                    }`}
                                >
                                    <span>{label}</span>
                                    {isSelected && <LucideIcons.Check className="h-3.5 w-3.5 text-primary shrink-0" />}
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
                                className="text-[10px] font-bold text-primary hover:text-primary-hover hover:underline text-center py-1.5 mt-1 cursor-pointer bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-md"
                            >
                                Tampilkan Lebih Banyak... (+{filteredOptions.length - pageSize} Data)
                            </button>
                        )}
                        {filteredOptions.length === 0 && (
                            <span className="text-xs text-text-main/60 text-center py-2">
                                Tidak ada data
                            </span>
                        )}
                    </div>
                </div>
            )}
            {error && (
                <span className="text-rose-500 text-[10px] font-normal uppercase mt-1">
                    {error}
                </span>
            )}
        </div>
    );
}

// ─── Konfigurasi Filter Kontrak Tree Select ──────────────────────────────────
function OrgTreeFilterConfig({
    organizationTree, data, setData, disabled
}: {
    organizationTree: any[];
    data: any;
    setData: (name: string, val: any) => void;
    disabled?: boolean;
}) {
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const toggle = (key: string) => setExpanded(p => ({ ...p, [key]: !p[key] }));

    const allowedGroups = Array.isArray(data.allowed_company_groups) ? data.allowed_company_groups.map(String) : [];
    const allowedRegions = Array.isArray(data.allowed_regions) ? data.allowed_regions.map(String) : [];
    const allowedCompanies = Array.isArray(data.allowed_companies) ? data.allowed_companies.map(String) : [];

    const handleGroupToggle = (gId: string) => {
        const group = organizationTree.find(g => String(g.id) === gId);
        if (!group) return;

        const isChecking = !allowedGroups.includes(gId);
        const childRegionIds: string[] = [];
        const childCompanyIds: string[] = [];

        if (group.children) {
            group.children.forEach((region: any) => {
                const match = String(region.id).match(/^r_(.*?)_g_(.*)$/);
                const rId = match ? match[1] : String(region.id).replace(/^r_/, '');
                if (rId !== 'null') {
                    childRegionIds.push(`${gId}|${rId}`);
                }
                if (region.children) {
                    region.children.forEach((company: any) => {
                        const cleanCId = String(company.id).replace(/^c_/, '');
                        childCompanyIds.push(`${gId}|${rId}|${cleanCId}`);
                    });
                }
            });
        }

        let nextGroups = [...allowedGroups];
        let nextRegions = [...allowedRegions];
        let nextCompanies = [...allowedCompanies];

        if (isChecking) {
            if (!nextGroups.includes(gId)) nextGroups.push(gId);
            childRegionIds.forEach(id => { if (!nextRegions.includes(id)) nextRegions.push(id); });
            childCompanyIds.forEach(id => { if (!nextCompanies.includes(id)) nextCompanies.push(id); });
            
            // Auto enable toggle can_change_company_group
            setData('can_change_company_group', true);
        } else {
            nextGroups = nextGroups.filter(v => v !== gId);
            nextRegions = nextRegions.filter(v => !childRegionIds.includes(v));
            nextCompanies = nextCompanies.filter(v => !childCompanyIds.includes(v));
        }

        setData('allowed_company_groups', nextGroups);
        setData('allowed_regions', nextRegions);
        setData('allowed_companies', nextCompanies);
    };

    const handleRegionToggle = (gId: string, rId: string) => {
        const group = organizationTree.find(g => String(g.id) === gId);
        const regionNode = group?.children?.find((r: any) => {
            const match = String(r.id).match(/^r_(.*?)_g_(.*)$/);
            const cleanRId = match ? match[1] : String(r.id).replace(/^r_/, '');
            return cleanRId === rId;
        });

        const compositeRegion = `${gId}|${rId}`;
        const isChecking = !allowedRegions.includes(compositeRegion);
        const childCompanyIds: string[] = [];

        if (regionNode && regionNode.children) {
            regionNode.children.forEach((company: any) => {
                const cleanCId = String(company.id).replace(/^c_/, '');
                childCompanyIds.push(`${gId}|${rId}|${cleanCId}`);
            });
        }

        let nextGroups = [...allowedGroups];
        let nextRegions = [...allowedRegions];
        let nextCompanies = [...allowedCompanies];

        if (isChecking) {
            if (!nextRegions.includes(compositeRegion)) nextRegions.push(compositeRegion);
            if (!nextGroups.includes(gId)) nextGroups.push(gId);
            childCompanyIds.forEach(id => { if (!nextCompanies.includes(id)) nextCompanies.push(id); });
            
            // Auto enable toggles
            setData('can_change_region', true);
            setData('can_change_company_group', true);
        } else {
            nextRegions = nextRegions.filter(v => v !== compositeRegion);
            nextCompanies = nextCompanies.filter(v => !childCompanyIds.includes(v));
        }

        setData('allowed_company_groups', nextGroups);
        setData('allowed_regions', nextRegions);
        setData('allowed_companies', nextCompanies);
    };

    const handleCompanyToggle = (gId: string, rId: string, cId: string) => {
        const compositeCompany = `${gId}|${rId}|${cId}`;
        const compositeRegion = `${gId}|${rId}`;
        const isChecking = !allowedCompanies.includes(compositeCompany);

        let nextGroups = [...allowedGroups];
        let nextRegions = [...allowedRegions];
        let nextCompanies = [...allowedCompanies];

        if (isChecking) {
            nextCompanies.push(compositeCompany);
            if (rId !== 'null' && !nextRegions.includes(compositeRegion)) {
                nextRegions.push(compositeRegion);
            }
            if (!nextGroups.includes(gId)) {
                nextGroups.push(gId);
            }
            
            // Auto enable toggles
            setData('can_change_company', true);
            if (rId !== 'null') setData('can_change_region', true);
            setData('can_change_company_group', true);
        } else {
            nextCompanies = nextCompanies.filter(v => v !== compositeCompany);
        }

        setData('allowed_company_groups', nextGroups);
        setData('allowed_regions', nextRegions);
        setData('allowed_companies', nextCompanies);
    };

    const Cb = ({ checked, disabled }: { checked: boolean; disabled?: boolean }) => (
        <span className={cn(
            'w-[15px] h-[15px] rounded border-[1.5px] flex items-center justify-center shrink-0 transition-all cursor-pointer',
            checked
                ? 'bg-primary border-primary'
                : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800',
            disabled && 'opacity-40'
        )}>
            {checked && <LucideIcons.Check size={9} strokeWidth={3.5} className="text-white" />}
        </span>
    );

    const isGroupChangeable = true;
    const isRegionChangeable = true;
    const isCompanyChangeable = true;

    return (
        <div className={cn(
            "flex flex-col gap-3 w-full border border-surface-border rounded-2xl p-4 bg-surface-base/30 transition-all duration-200",
            disabled && "opacity-60 pointer-events-none select-none bg-surface-muted/20"
        )}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2">
                        <Label className="text-xs font-semibold text-text-main uppercase">
                            Whitelist Hak Akses Organisasi (Tree View)
                        </Label>
                        {disabled && (
                            <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 shrink-0">
                                Mengikuti Filter Role
                            </span>
                        )}
                    </div>
                    <p className="text-[10px] text-text-desc mt-0.5">
                        Tentukan Holding, Wilayah, dan Perusahaan mana saja yang boleh diakses dan dipilih oleh user ini.
                    </p>
                </div>
                
                {/* Control Actions */}
                <div className="flex items-center gap-1.5 shrink-0 bg-surface-muted/30 p-1.5 rounded-xl border border-surface-border">
                    <button
                        type="button"
                        onClick={() => {
                            const nextGroups: string[] = [];
                            const nextRegions: string[] = [];
                            const nextCompanies: string[] = [];
                            
                            organizationTree.forEach(group => {
                                const gId = String(group.id);
                                nextGroups.push(gId);
                                if (group.children) {
                                    group.children.forEach((region: any) => {
                                        const match = String(region.id).match(/^r_(.*?)_g_(.*)$/);
                                        const rId = match ? match[1] : String(region.id).replace(/^r_/, '');
                                        if (rId !== 'null') {
                                            nextRegions.push(`${gId}|${rId}`);
                                        }
                                        if (region.children) {
                                            region.children.forEach((company: any) => {
                                                const cleanCId = String(company.id).replace(/^c_/, '');
                                                nextCompanies.push(`${gId}|${rId}|${cleanCId}`);
                                            });
                                        }
                                    });
                                }
                            });
                            
                            if (isGroupChangeable) setData('allowed_company_groups', nextGroups);
                            if (isRegionChangeable) setData('allowed_regions', nextRegions);
                            if (isCompanyChangeable) setData('allowed_companies', nextCompanies);
                        }}
                        className="px-2 py-1 text-[9px] font-bold uppercase rounded-md bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-white transition-all cursor-pointer"
                    >
                        Check All
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            if (isGroupChangeable) setData('allowed_company_groups', []);
                            if (isRegionChangeable) setData('allowed_regions', []);
                            if (isCompanyChangeable) setData('allowed_companies', []);
                        }}
                        className="px-2 py-1 text-[9px] font-bold uppercase rounded-md border border-surface-border text-text-desc hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200 transition-all cursor-pointer"
                    >
                        Uncheck All
                    </button>
                    <div className="w-px h-3 bg-surface-border mx-0.5" />
                    <button
                        type="button"
                        onClick={() => {
                            const next: Record<string, boolean> = {};
                            organizationTree.forEach(group => {
                                const gId = String(group.id);
                                next[`g_${gId}`] = true;
                                if (group.children) {
                                    group.children.forEach((region: any) => {
                                        next[`r_${region.id}`] = true;
                                    });
                                }
                            });
                            setExpanded(next);
                        }}
                        className="p-1 rounded-md text-text-desc hover:bg-surface-muted hover:text-text-main transition-all cursor-pointer"
                        title="Expand All"
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m15 18 3 3 3-3"/><path d="M18 21V10"/><path d="m15 6-3-3-3 3"/><path d="M12 3v14"/><path d="m9 18-3 3-3-3"/><path d="M6 21V10"/>
                        </svg>
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            const next: Record<string, boolean> = {};
                            organizationTree.forEach(group => {
                                const gId = String(group.id);
                                next[`g_${gId}`] = false;
                                if (group.children) {
                                    group.children.forEach((region: any) => {
                                        next[`r_${region.id}`] = false;
                                    });
                                }
                            });
                            setExpanded(next);
                        }}
                        className="p-1 rounded-md text-text-desc hover:bg-surface-muted hover:text-text-main transition-all cursor-pointer"
                        title="Collapse All"
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m18 15 3-3 3 3"/><path d="M21 12V3"/><path d="m12 6 3 3 3-3"/><path d="M15 9V3"/><path d="m6 15 3-3 3 3"/><path d="M9 12V3"/>
                        </svg>
                    </button>
                </div>
            </div>

            <div className="h-px bg-surface-border my-0.5" />

            <div className="max-h-[380px] overflow-y-auto pr-1 flex flex-col gap-1 select-none">
    
                {organizationTree.map((group) => {
                    const gId = String(group.id);
                    const gSelected = allowedGroups.includes(gId);
                    const gExpanded = expanded[`g_${gId}`] !== false; // default true
                    const hasChildren = group.children && group.children.length > 0;

                    return (
                        <div key={gId} className="mb-1">
                            {/* Group level */}
                            <div className="flex items-center gap-2 hover:bg-surface-muted/30 rounded-lg p-1.5 transition-all">
                                {hasChildren ? (
                                    <button
                                        type="button"
                                        onClick={() => toggle(`g_${gId}`)}
                                        className="flex items-center justify-center w-5 h-5 text-text-desc hover:text-text-main"
                                    >
                                        <LucideIcons.ChevronDown size={11} className={cn('transition-transform', gExpanded ? '' : '-rotate-90')} />
                                    </button>
                                ) : (
                                    <span className="w-5 shrink-0" />
                                )}

                                <div 
                                    className="flex items-center gap-2.5 flex-1 cursor-pointer"
                                    onClick={() => isGroupChangeable && handleGroupToggle(gId)}
                                >
                                    <Cb checked={gSelected} disabled={!isGroupChangeable} />
                                    <div className="flex items-center gap-1.5 min-w-0">
                                        {group.code && (
                                            <span className="text-[9px] px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-text-desc font-bold uppercase shrink-0">
                                                {group.code}
                                            </span>
                                        )}
                                        <span className="text-xs font-semibold text-text-main truncate">{group.name}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Regions level */}
                            {gExpanded && group.children && group.children.map((region: any) => {
                                const rId = String(region.id);
                                const match = rId.match(/^r_(.*?)_g_(.*)$/);
                                const cleanRId = match ? match[1] : rId.replace(/^r_/, '');
                                
                                const rComposite = `${gId}|${cleanRId}`;
                                const rSelected = allowedRegions.includes(rComposite);
                                const rExpanded = expanded[`r_${rId}`] === true; // default false
                                const rHasChildren = region.children && region.children.length > 0;

                                return (
                                    <div key={rId} className="ml-6 mt-1 border-l border-slate-200/50 dark:border-slate-800/50 pl-2">
                                        <div className="flex items-center gap-2 hover:bg-surface-muted/30 rounded-lg p-1.5 transition-all">
                                            {rHasChildren ? (
                                                <button
                                                    type="button"
                                                    onClick={() => toggle(`r_${rId}`)}
                                                    className="flex items-center justify-center w-5 h-5 text-text-desc hover:text-text-main"
                                                >
                                                    <LucideIcons.ChevronDown size={10} className={cn('transition-transform', rExpanded ? '' : '-rotate-90')} />
                                                </button>
                                            ) : (
                                                <span className="w-5 shrink-0" />
                                            )}

                                            <div 
                                                className="flex items-center gap-2.5 flex-1 cursor-pointer"
                                                onClick={() => isRegionChangeable && cleanRId !== 'null' && handleRegionToggle(gId, cleanRId)}
                                            >
                                                <Cb checked={rSelected} disabled={!isRegionChangeable || cleanRId === 'null'} />
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    {region.code && region.code !== '-' && (
                                                        <span className="text-[9px] px-1 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-text-desc font-bold uppercase tracking-wide shrink-0">
                                                            {region.code}
                                                        </span>
                                                    )}
                                                    <span className="text-xs font-medium text-text-main truncate">{region.name}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Companies level */}
                                        {rExpanded && region.children && region.children.map((company: any) => {
                                            const cId = String(company.id);
                                            const cleanCId = cId.replace(/^c_/, '');
                                            
                                            const cComposite = `${gId}|${cleanRId}|${cleanCId}`;
                                            const cSelected = allowedCompanies.includes(cComposite);

                                            return (
                                                <div 
                                                    key={cId} 
                                                    className="ml-6 mt-1 border-l border-slate-200/50 dark:border-slate-800/50 pl-2 flex items-center gap-2.5 hover:bg-surface-muted/30 rounded-lg p-1.5 transition-all cursor-pointer"
                                                    onClick={() => isCompanyChangeable && handleCompanyToggle(gId, cleanRId, cleanCId)}
                                                >
                                                    <div className="w-5 shrink-0" />
                                                    <Cb checked={cSelected} disabled={!isCompanyChangeable} />
                                                    <div className="flex items-center gap-1.5 min-w-0">
                                                        {company.code && (
                                                            <span className="text-[9px] text-text-desc font-mono shrink-0">
                                                                {company.code}
                                                            </span>
                                                        )}
                                                        <span className="text-xs text-text-desc truncate">{company.name}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

interface Props {
    resourceSlug: string;
    title: string;
    formSchema: any[];
    formColumns?: number;
    record: any | null;
    organizationTree?: any[] | null;
}

export default function ResourceForm({ resourceSlug, title, formSchema, formColumns = 1, record, organizationTree }: Props) {
    const isEdit = !!record;
    const [activeTab, setActiveTab] = useState<'info' | 'docs'>('info');
    const [localAccessTypes, setLocalAccessTypes] = useState<Record<string, string>>({});

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

    const openFilterModal = () => {
        setLocalFilterData({
            can_change_company_group: data.can_change_company_group === true || data.can_change_company_group === 1 || String(data.can_change_company_group) === 'true',
            allowed_company_groups: Array.isArray(data.allowed_company_groups) ? [...data.allowed_company_groups] : [],
            can_change_region: data.can_change_region === true || data.can_change_region === 1 || String(data.can_change_region) === 'true',
            allowed_regions: Array.isArray(data.allowed_regions) ? [...data.allowed_regions] : [],
            can_change_company: data.can_change_company === true || data.can_change_company === 1 || String(data.can_change_company) === 'true',
            allowed_companies: Array.isArray(data.allowed_companies) ? [...data.allowed_companies] : [],
            can_change_division: data.can_change_division === true || data.can_change_division === 1 || String(data.can_change_division) === 'true',
            allowed_divisions: Array.isArray(data.allowed_divisions) ? [...data.allowed_divisions] : [],
            can_change_department: data.can_change_department === true || data.can_change_department === 1 || String(data.can_change_department) === 'true',
            allowed_departments: Array.isArray(data.allowed_departments) ? [...data.allowed_departments] : [],
        });
        setIsFilterModalOpen(true);
    };

    const saveFilterData = () => {
        Object.entries(localFilterData).forEach(([key, val]) => {
            setData(key, val);
        });
        setIsFilterModalOpen(false);
    };

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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEdit) {
            put(`/admin/core/${resourceSlug}/${record.id}`);
        } else {
            post(`/admin/core/${resourceSlug}`);
        }
    };

    // Dynamic grid columns configuration
    const getGridClass = () => {
        if (formColumns === 2) return 'grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 w-full';
        if (formColumns === 3) return 'grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5 w-full';
        if (formColumns >= 4) return 'grid grid-cols-1 md:grid-cols-4 gap-x-6 gap-y-5 w-full';
        return 'flex flex-col gap-5 w-full';
    };

    const getSpanClass = (field: any) => {
        if (formColumns <= 1) return 'w-full';
        if (['allowed_company_groups', 'allowed_regions', 'allowed_companies', 'allowed_divisions', 'allowed_departments'].includes(field.name)) {
            return 'col-span-full';
        }
        if (!field.columnSpan || field.columnSpan === 1) return 'col-span-1';
        if (field.columnSpan >= formColumns) return 'col-span-full';
        return `md:col-span-${field.columnSpan}`;
    };

    const renderField = (field: any) => {
        const IconComponent = field.icon && (LucideIcons as any)[field.icon]
            ? (LucideIcons as any)[field.icon]
            : undefined;

        return (
            <div key={field.name} className={getSpanClass(field)}>
                {field.type === 'text' && (
                    <FormInput
                        label={field.label}
                        value={data[field.name]}
                        onChange={(e) => setData(field.name, e.target.value)}
                        error={errors[field.name]}
                        required={field.required}
                        placeholder={field.placeholder}
                        icon={IconComponent}
                    />
                )}
                {field.type === 'textarea' && (
                    <FormTextarea
                        label={field.label}
                        value={data[field.name]}
                        onChange={(e) => setData(field.name, e.target.value)}
                        error={errors[field.name]}
                        required={field.required}
                        placeholder={field.placeholder}
                    />
                )}
                {field.type === 'color' && (
                    <div className="flex flex-col gap-1.5 w-full">
                        <Label className="text-[11px] font-normal text-text-main uppercase px-0.5">
                            {field.label} {field.required && <span className="text-rose-500">*</span>}
                        </Label>
                        <div className="flex items-center gap-2">
                            <input
                                type="color"
                                value={data[field.name] || '#ffffff'}
                                onChange={(e) => setData(field.name, e.target.value)}
                                className="h-11 w-14 cursor-pointer rounded-lg border border-surface-border bg-surface-base p-1"
                                required={field.required}
                            />
                            <input
                                type="text"
                                value={data[field.name] || ''}
                                onChange={(e) => setData(field.name, e.target.value)}
                                className="flex h-11 w-full rounded-lg border border-surface-border bg-surface-base px-3 py-2 text-sm font-normal focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary"
                                placeholder="#hexcode"
                            />
                            {data[field.name] && (
                                <button
                                    type="button"
                                    onClick={() => setData(field.name, '')}
                                    className="h-11 px-3 flex items-center justify-center rounded-lg border border-surface-border bg-surface-base hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200 text-text-main transition-all shadow-xs"
                                    title="Hapus Warna"
                                >
                                    <LucideIcons.X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                        {errors[field.name] && (
                            <span className="text-rose-500 text-[10px] font-normal uppercase mt-1">
                                {errors[field.name]}
                            </span>
                        )}
                    </div>
                )}
                {field.type === 'icon' && (
                    <div className="flex flex-col gap-1.5 w-full relative">
                        <Label className="text-[11px] font-normal text-text-main uppercase px-0.5">
                            {field.label} {field.required && <span className="text-rose-500">*</span>}
                        </Label>
                        <IconPicker
                            value={data[field.name] || ''}
                            onChange={(val) => setData(field.name, val)}
                        />
                        {errors[field.name] && (
                            <span className="text-rose-500 text-[10px] font-normal uppercase mt-1">
                                {errors[field.name]}
                            </span>
                        )}
                    </div>
                )}
                {field.type === 'select' && field.multiple ? (() => {
                    // ponytail: simplifikasi whitelist filter organisasi jadi dropdown biasa
                    const toggleName = field.name === 'allowed_company_groups' ? 'can_change_company_group'
                                     : field.name === 'allowed_regions' ? 'can_change_region'
                                     : field.name === 'allowed_companies' ? 'can_change_company'
                                     : field.name === 'allowed_divisions' ? 'can_change_division'
                                     : field.name === 'allowed_departments' ? 'can_change_department'
                                     : null;
                    const toggleVal = toggleName ? (
                        data[toggleName] === true || data[toggleName] === 1 || data[toggleName] === '1' || data[toggleName] === 'true'
                    ) : false;
                    return (
                        <MultiSelectField
                            field={field}
                            value={Array.isArray(data[field.name]) ? data[field.name] : []}
                            onChange={(val) => setData(field.name, val)}
                            error={errors[field.name]}
                            toggleName={toggleName}
                            toggleValue={toggleVal}
                            onToggleChange={toggleName ? (val) => setData(toggleName, val) : undefined}
                            disabled={isFieldDisabled(field.name)}
                        />
                    );
                })() : field.type === 'select' && (
                    <SingleSelectField
                        field={field}
                        value={data[field.name]}
                        onChange={(val) => setData(field.name, val)}
                        error={errors[field.name]}
                        disabled={isFieldDisabled(field.name)}
                    />
                )}
                {field.type === 'tree_select' && (
                    <div className="flex flex-col gap-1.5 w-full">
                        <Label className="text-[11px] font-normal text-text-main uppercase px-0.5">
                            {field.label} {field.required && <span className="text-rose-500">*</span>}
                        </Label>
                        <TreeSelect
                            value={data[field.name]}
                            onValueChange={(val) => setData(field.name, val)}
                            items={field.options}
                            placeholder={field.placeholder || `Pilih ${field.label}...`}
                            disabled={isFieldDisabled(field.name)}
                        />
                        {errors[field.name] && (
                            <span className="text-rose-500 text-[10px] font-normal uppercase mt-1">
                                {errors[field.name]}
                            </span>
                        )}
                    </div>
                )}
                {field.type === 'switch' && (() => {
                    const isChecked = data[field.name] === true || data[field.name] === 1 || data[field.name] === '1' || data[field.name] === 'true';
                    return (
                        <div className="flex flex-col gap-1.5 w-full">
                            <Label className="text-[11px] font-normal text-text-main uppercase px-0.5">
                                {field.label}
                            </Label>
                            <div className="flex items-center h-11">
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={isChecked}
                                    onClick={() => setData(field.name, !isChecked)}
                                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-all duration-300 outline-hidden active:scale-95 ${
                                        isChecked ? 'bg-primary dark:bg-white' : 'bg-slate-200 dark:bg-slate-800'
                                    }`}
                                >
                                    <span
                                        className={`pointer-events-none block h-4 w-4 rounded-full shadow-lg transition-transform duration-300 ring-0 ${
                                            isChecked ? 'translate-x-6 bg-white dark:bg-primary' : 'translate-x-1 bg-white dark:bg-white/50'
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

            <div className="flex flex-col gap-6 p-6 w-full">
                <div className="flex items-center gap-4">
                    <Link
                        href={`/admin/core/${resourceSlug}`}
                        className="p-2 border border-surface-border rounded-xl hover:bg-surface-muted transition-all text-text-main"
                    >
                        <ArrowLeft size={16} />
                    </Link>
                    <div>
                        <h1 className="text-lg font-normal text-text-main">
                             {isEdit ? `Edit ${title}` : `Tambah ${title}`}
                        </h1>
                        <p className="text-xs text-text-main">
                            {isEdit ? 'Ubah informasi data yang sudah ada.' : 'Tambahkan data master baru ke sistem.'}
                        </p>
                    </div>
                </div>

                {resourceSlug === 'vendors' && isEdit && (
                    <div className="flex border-b border-surface-border -mb-2">
                        <button
                            type="button"
                            onClick={() => setActiveTab('info')}
                            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-normal uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                                activeTab === 'info'
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-text-main hover:text-foreground'
                            }`}
                        >
                            <LucideIcons.User size={14} />
                            Informasi Vendor
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('docs')}
                            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-normal uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                                activeTab === 'docs'
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-text-main hover:text-foreground'
                            }`}
                        >
                            <LucideIcons.FileCheck size={14} />
                            Dokumen Legalitas
                        </button>
                    </div>
                )}

                {(!isEdit || resourceSlug !== 'vendors' || activeTab === 'info') && (
                    <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full animate-in fade-in duration-200">
                        <div className={getGridClass()}>
                        {formSchema.map((field: any) => {
                            if (field.isGroup) {
                                const GroupIcon = field.icon && (LucideIcons as any)[field.icon]
                                    ? (LucideIcons as any)[field.icon]
                                    : undefined;

                                return (
                                    <div key={field.label} className="col-span-full border border-surface-border bg-surface-muted/5 dark:bg-surface-muted/10 rounded-2xl p-6 flex flex-col gap-5">
                                        <div className="flex items-center justify-between pb-3 border-b border-surface-border gap-4">
                                            <div className="flex items-center gap-2">
                                                {GroupIcon && <GroupIcon className="h-4 w-4 text-primary shrink-0 opacity-80" />}
                                                <div>
                                                    <h3 className="text-xs font-normal uppercase tracking-wider text-text-main">{field.label}</h3>
                                                    {field.description && (
                                                        <p className="text-[11px] text-text-main mt-0.5">{field.description}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                         {field.label === 'Konfigurasi Filter Kontrak' ? (
                                             <div className="space-y-5 w-full animate-in fade-in duration-200">
                                                 {field.schema && field.schema.some((s: any) => !['can_change_company_group', 'allowed_company_groups', 'can_change_region', 'allowed_regions', 'can_change_company', 'allowed_companies', 'can_change_division', 'allowed_divisions', 'can_change_department', 'allowed_departments', 'use_role_filter'].includes(s.name)) && (
                                                     <div className="grid grid-cols-1 gap-4 pb-2">
                                                         {field.schema
                                                             .filter((s: any) => !['can_change_company_group', 'allowed_company_groups', 'can_change_region', 'allowed_regions', 'can_change_company', 'allowed_companies', 'can_change_division', 'allowed_divisions', 'can_change_department', 'allowed_departments', 'use_role_filter'].includes(s.name))
                                                             .map((s: any) => renderField(s))}
                                                     </div>
                                                 )}

                                                 <div className="flex items-center gap-2 border-b border-slate-100 pb-2 dark:border-slate-800">
                                                     <Shield size={14} className="text-primary" />
                                                     <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                                                         Pengaturan Dimensi Organisasi
                                                     </h3>
                                                 </div>

                                                 <div className="divide-y divide-slate-100 dark:divide-slate-800/40">
                                                     {(() => {
                                                         const DIMENSIONS = [
                                                             { key: 'company_group', label: 'Grup Perusahaan (Holding)', toggleName: 'can_change_company_group', allowedName: 'allowed_company_groups' },
                                                             { key: 'region', label: 'Wilayah (Region)', toggleName: 'can_change_region', allowedName: 'allowed_regions' },
                                                             { key: 'company', label: 'Perusahaan (Company)', toggleName: 'can_change_company', allowedName: 'allowed_companies' },
                                                             { key: 'division', label: 'Divisi', toggleName: 'can_change_division', allowedName: 'allowed_divisions' },
                                                             { key: 'department', label: 'Departemen', toggleName: 'can_change_department', allowedName: 'allowed_departments' },
                                                         ];

                                                         const getFormattedOptions = (fieldOptions: any) => {
                                                             if (!fieldOptions) return [];
                                                             if (Array.isArray(fieldOptions)) {
                                                                 return fieldOptions.map(opt => ({ value: String(opt), label: String(opt) }));
                                                             }
                                                             return Object.entries(fieldOptions).map(([k, v]) => ({ value: String(k), label: String(v) }));
                                                         };

                                                         return DIMENSIONS.map(dim => {
                                                             const dimField = field.schema.find((s: any) => s.name === dim.allowedName);
                                                             if (!dimField) return null;
                                                             
                                                             const isAllowedToChange = data[dim.toggleName] === true || data[dim.toggleName] === 1 || String(data[dim.toggleName]) === 'true';
                                                             const currentValues = data[dim.allowedName] || [];
                                                             
                                                             const accessType = localAccessTypes[dim.key] || (isAllowedToChange ? (currentValues.length > 0 ? 'custom' : 'full_access') : 'user_data');

                                                             return (
                                                                 <div key={dim.key} className="grid grid-cols-[200px_180px_1fr] items-center gap-4 py-3 first:pt-0 last:pb-0">
                                                                     <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{dim.label}</label>
                                                                     
                                                                     <div>
                                                                         <select
                                                                             value={accessType}
                                                                             onChange={(e) => {
                                                                                 const type = e.target.value;
                                                                                 setLocalAccessTypes(prev => ({
                                                                                     ...prev,
                                                                                     [dim.key]: type
                                                                                 }));
                                                                                 if (type === 'user_data') {
                                                                                     setData(prev => ({
                                                                                         ...prev,
                                                                                         [dim.toggleName]: false,
                                                                                         [dim.allowedName]: []
                                                                                     }));
                                                                                 } else if (type === 'full_access') {
                                                                                     setData(prev => ({
                                                                                         ...prev,
                                                                                         [dim.toggleName]: true,
                                                                                         [dim.allowedName]: []
                                                                                     }));
                                                                                 } else if (type === 'custom') {
                                                                                     setData(prev => ({
                                                                                         ...prev,
                                                                                         [dim.toggleName]: true,
                                                                                         [dim.allowedName]: []
                                                                                     }));
                                                                                 }
                                                                             }}
                                                                             className="flex h-9 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1 text-xs font-semibold focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-primary cursor-pointer"
                                                                         >
                                                                             <option value="user_data">Sesuai Data User</option>
                                                                             <option value="full_access">Buka Semua (Full Access)</option>
                                                                             <option value="custom">Pilih Data Tertentu</option>
                                                                         </select>
                                                                     </div>
                                                                     
                                                                     {accessType === 'custom' ? (
                                                                         <div>
                                                                             <SearchableMultiSelect
                                                                                 values={currentValues}
                                                                                 onValuesChange={(vals) => {
                                                                                     setData(dim.allowedName, vals);
                                                                                 }}
                                                                                 options={getFormattedOptions(dimField.options)}
                                                                                 placeholder={`Pilih ${dim.label}...`}
                                                                                 disabled={false}
                                                                             />
                                                                         </div>
                                                                     ) : (
                                                                         <div className="opacity-50 pointer-events-none">
                                                                             <SearchableMultiSelect
                                                                                 values={[]}
                                                                                 onValuesChange={() => {}}
                                                                                 options={[]}
                                                                                 placeholder={accessType === 'user_data' ? 'Filter Terkunci (Mengikuti Filter Bawaan Role)' : 'Seluruh Data Diizinkan (Akses Terbuka)'}
                                                                                 disabled={true}
                                                                             />
                                                                         </div>
                                                                     )}
                                                                 </div>
                                                             );
                                                         });
                                                     })()}
                                                 </div>
                                             </div>
                                        ) : (
                                            <div className={getGridClass()}>
                                                {field.schema
                                                    .filter((subField: any) => !['can_change_company_group', 'can_change_region', 'can_change_company', 'can_change_division', 'can_change_department', 'use_role_filter'].includes(subField.name))
                                                    .map((subField: any) => renderField(subField))}
                                            </div>
                                        )}
                                    </div>
                                );
                            }

                            return renderField(field);
                        })}
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-surface-border mt-4">
                        <Link href={`/admin/core/${resourceSlug}`}>
                            <Button type="button" variant="white">
                                Batal
                            </Button>
                        </Link>
                        <Button type="submit" variant="primary" disabled={processing}>
                            Simpan Data
                        </Button>
                    </div>
                </form>
                )}

                {/* ponytail: Vendor Documents Section */}
                {resourceSlug === 'vendors' && isEdit && activeTab === 'docs' && (
                    <div className="border border-surface-border bg-surface-base rounded-2xl p-6 flex flex-col gap-5 animate-in fade-in duration-200">
                        <div className="flex items-center gap-2 pb-3 border-b border-surface-border">
                            <LucideIcons.FileCheck className="h-4 w-4 text-primary shrink-0 opacity-80" />
                            <div>
                                <h3 className="text-xs font-normal uppercase tracking-wider text-text-main">Dokumen Legalitas Vendor</h3>
                                <p className="text-[11px] text-text-main mt-0.5">Kelola berkas legalitas dan lampiran wajib untuk vendor ini.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                                { type: 'NIB', label: 'Nomor Induk Berusaha (NIB)' },
                                { type: 'SIUP', label: 'Surat Izin Usaha Perdagangan (SIUP)' },
                                { type: 'NPWP', label: 'Nomor Pokok Wajib Pajak (NPWP)' },
                                { type: 'Akta Pendirian', label: 'Akta Pendirian Perusahaan' },
                                { type: 'KTP Direktur', label: 'KTP Direktur / PIC' },
                                { type: 'SPPKP', label: 'Surat Pengukuhan Pengusaha Kena Pajak (SPPKP)' },
                            ].map((docType) => {
                                const doc = record?.documents?.find((d: any) => d.document_type === docType.type);

                                return (
                                    <div key={docType.type} className="flex flex-col justify-between gap-2 p-4 border border-surface-border rounded-xl bg-surface-base min-h-[120px]">
                                        <span className="text-[10px] font-normal text-text-main uppercase tracking-wider">{docType.label}</span>
                                        {doc ? (
                                            <div className="flex items-center justify-between gap-3 mt-1">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <LucideIcons.FileText className="h-5 w-5 text-emerald-500 shrink-0" />
                                                    <span className="text-xs font-normal text-text-main truncate" title={doc.document_name}>
                                                        {doc.document_name}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1 shrink-0">
                                                    <a
                                                        href={doc.file_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-1.5 rounded-lg hover:bg-slate-50 text-text-main hover:text-primary transition-all"
                                                        title="Lihat / Download"
                                                    >
                                                        <LucideIcons.Download className="h-4 w-4" />
                                                    </a>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (confirm(`Hapus dokumen ${docType.type}?`)) {
                                                                router.delete(`/admin/vendors/${record.id}/documents/${doc.id}`, {
                                                                    preserveScroll: true
                                                                 });
                                                            }
                                                        }}
                                                        className="p-1.5 rounded-lg hover:bg-rose-50 text-text-main hover:text-rose-600 transition-all"
                                                        title="Hapus"
                                                    >
                                                        <LucideIcons.Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col gap-2 mt-1">
                                                <div className="flex items-center gap-1.5 text-rose-500 text-[10px] font-normal uppercase tracking-wider">
                                                    <LucideIcons.AlertCircle className="h-3.5 w-3.5" />
                                                    <span>Belum Dilengkapi</span>
                                                </div>
                                                <div className="relative">
                                                    <input
                                                        type="file"
                                                        accept=".pdf,.docx,.jpg,.jpeg,.png"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) {
                                                                const fd = new FormData();
                                                                fd.append('document_file', file);
                                                                fd.append('document_type', docType.type);
                                                                router.post(`/admin/vendors/${record.id}/documents`, fd, {
                                                                    preserveScroll: true
                                                                });
                                                            }
                                                        }}
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                    />
                                                    <div className="flex h-9 items-center justify-center gap-2 rounded-lg border border-dashed border-surface-border bg-primary/5 text-xs font-normal text-text-main hover:bg-primary/10 transition-all cursor-pointer">
                                                        <LucideIcons.Upload className="h-3.5 w-3.5" /> Upload File
                                                    </div>
                                                </div>
                                                <span className="text-[9px] text-text-main font-normal tracking-wide mt-0.5">Format: PDF, DOCX, JPG, PNG (Maks. 5MB)</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
