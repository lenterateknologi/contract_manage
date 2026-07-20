import React, { useState, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/buttons/Button';
import { Check, ChevronDown, ChevronRight, X, Calendar, Search } from 'lucide-react';
import { DateRangeCalendar } from '@/components/ui/inputs/DateRangeCalendar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/selection/DropdownMenu';

interface DBContractType {
    id: string;
    name: string;
    parent_id?: string | null;
    level?: number;
}

const ensureArray = (val: any): any[] => {
    if (val === undefined || val === null) return [];
    return Array.isArray(val) ? val : [val];
};

// ─── Multi Select Filter Dropdown (Divisi / Departemen / Perusahaan dll) ──────
function MultiSelectFilterDropdown({
    label, hasActive, options, activeIds, onToggle, onReset
}: {
    label: string;
    hasActive: boolean;
    options: { id: string; name: string }[];
    activeIds: string[];
    onToggle: (id: string) => void;
    onReset: () => void;
}) {
    const [search, setSearch] = useState('');
    const filtered = options.filter(opt => 
        opt.name.toLowerCase().includes(search.toLowerCase())
    );

    const Cb = ({ checked }: { checked: boolean }) => (
        <span className={cn(
            'w-[14px] h-[14px] rounded border flex items-center justify-center shrink-0 transition-all',
            checked
                ? 'bg-primary border-primary'
                : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
        )}>
            {checked && <Check size={8} strokeWidth={4} className="text-white" />}
        </span>
    );

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant={hasActive ? 'primary' : 'white'}
                    className="relative flex h-9 items-center justify-center gap-1.5 rounded-xl px-3 text-[11px] font-semibold border"
                >
                    <span>{label}</span>
                    <ChevronDown size={12} className="opacity-60" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl p-3 w-[260px] flex flex-col gap-2 max-h-[380px]">
                {/* Search */}
                <div className="relative">
                    <Search size={11} className="absolute left-2.5 top-2.5 text-text-desc" />
                    <input
                        type="text"
                        placeholder="Cari..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-7 pr-2 py-1.5 text-[10px] outline-none focus:border-primary text-text-main"
                    />
                </div>

                <div className="h-px bg-surface-border my-0.5" />

                {/* Items List */}
                <div className="flex-1 overflow-y-auto max-h-[220px] pr-1 flex flex-col gap-0.5 custom-scrollbar">
                    {filtered.map(opt => {
                        const isChecked = activeIds.includes(String(opt.id));
                        return (
                            <button
                                key={opt.id}
                                type="button"
                                onClick={() => onToggle(String(opt.id))}
                                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] text-left text-text-desc hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-text-main transition-all cursor-pointer font-medium"
                            >
                                <Cb checked={isChecked} />
                                <span className="truncate">{opt.name}</span>
                            </button>
                        );
                    })}
                    {filtered.length === 0 && (
                        <span className="text-[10px] text-text-desc text-center py-4">Tidak ada data</span>
                    )}
                </div>

                {hasActive && (
                    <>
                        <div className="h-px bg-surface-border my-0.5" />
                        <button
                            type="button"
                            onClick={onReset}
                            className="w-full flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] text-danger hover:bg-danger/10 transition-all font-semibold cursor-pointer"
                        >
                            Reset Filter
                        </button>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

interface PageFilterProps {
    filters: any;
    types: DBContractType[];
    departments: any[];
    divisions: any[];
    regions: any[];
    companies: any[];
    companyGroups: any[];
    meUser: any;
    handleFilterChange: (newFilters: any) => void;
}

export function PageFilter({
    filters,
    types,
    departments,
    divisions,
    regions,
    companies,
    companyGroups,
    meUser,
    handleFilterChange,
}: PageFilterProps) {

    const isDescendantOrSelf = useCallback((targetId: string | string[] | undefined, parentId: string): boolean => {
        if (!targetId) return false;
        if (Array.isArray(targetId)) {
            return targetId.some(id => isDescendantOrSelf(id, parentId));
        }
        if (targetId === parentId) return true;
        const target = types.find(t => t.id === targetId);
        if (!target || !target.parent_id) return false;
        return isDescendantOrSelf(target.parent_id, parentId);
    }, [types]);

    const canChangeCompanyGroup = useMemo(() => {
        const settings = meUser?.filter_settings;
        if (settings && typeof settings.can_change_company_group !== 'undefined') {
            return !!settings.can_change_company_group;
        }
        const role = meUser?.role;
        return role === 'Admin' || role === 'Super Admin' || !!meUser?.is_admin;
    }, [meUser]);

    const canChangeRegion = useMemo(() => {
        const settings = meUser?.filter_settings;
        if (settings && typeof settings.can_change_region !== 'undefined') {
            return !!settings.can_change_region;
        }
        const role = meUser?.role;
        return role === 'Admin' || role === 'Super Admin' || !!meUser?.is_admin;
    }, [meUser]);

    const canChangeCompany = useMemo(() => {
        const settings = meUser?.filter_settings;
        if (settings && typeof settings.can_change_company !== 'undefined') {
            return !!settings.can_change_company;
        }
        const role = meUser?.role;
        return role === 'Admin' || role === 'Super Admin' || !!meUser?.is_admin;
    }, [meUser]);

    return (
        <div className="border-surface-border bg-surface-base/40 sticky top-0 z-10 flex scrollbar-none items-center gap-1.5 overflow-x-auto border-b px-5 py-2 backdrop-blur-md">
            {/* Kategori Kontrak - Single Tree Dropdown */}
            {(() => {
                const isAnyTypeActive = !!filters.contract_type_id;
                const activeType = isAnyTypeActive
                    ? types.find(t => t.id === filters.contract_type_id)
                    : null;

                const renderTreeItems = (parentId: string | null, depth = 0): React.ReactNode => {
                    const children = types.filter(t => t.parent_id === parentId);
                    if (!children.length) return null;
                    return children.map(child => {
                        const hasChildren = types.some(t => t.parent_id === child.id);
                        const isSelected = filters.contract_type_id === child.id ||
                            isDescendantOrSelf(filters.contract_type_id, child.id);
                        return (
                            <div key={child.id}>
                                <button
                                    onClick={() => handleFilterChange({ contract_type_id: child.id, page: 1 })}
                                    className={cn(
                                        'w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md text-left text-xs transition-all cursor-pointer',
                                        isSelected
                                            ? 'bg-primary text-white font-semibold'
                                            : 'text-text-main hover:bg-surface-muted'
                                    )}
                                    style={{ paddingLeft: `${8 + depth * 16}px` }}
                                >
                                    {hasChildren && (
                                        <ChevronRight size={11} className="shrink-0 opacity-40" />
                                    )}
                                    <span className="truncate">{child.name}</span>
                                </button>
                                {hasChildren && renderTreeItems(child.id, depth + 1)}
                            </div>
                        );
                    });
                };

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant={isAnyTypeActive ? 'primary' : 'white'}
                                className="relative flex h-9 items-center justify-center gap-1.5 rounded-xl px-3 text-[11px] font-semibold border"
                            >
                                <span>{activeType ? activeType.name : 'Kategori Kontrak'}</span>
                                <ChevronDown size={12} className="opacity-60" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl p-2 min-w-[220px] max-h-[60vh] overflow-y-auto custom-scrollbar">
                            <button
                                onClick={() => handleFilterChange({ contract_type_id: undefined, page: 1 })}
                                className={cn(
                                    'w-full flex items-center px-2 py-1.5 rounded-md text-left text-xs transition-all cursor-pointer font-semibold mb-1',
                                    !isAnyTypeActive
                                        ? 'bg-primary text-white'
                                        : 'text-text-desc hover:bg-surface-muted'
                                )}
                            >
                                Semua Kontrak
                            </button>
                            <div className="h-px bg-surface-border mb-1" />
                            {renderTreeItems(null)}
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            })()}

            {/* Divider */}
            <div className="h-5 w-px bg-surface-border shrink-0 mx-1" />

            {/* Status Dokumen - Single Multi-Select Dropdown */}
            {(() => {
                const statusList = [
                    { value: 'draft', label: 'Draft' },
                    { value: 'pending', label: 'Pending' },
                    { value: 'in_review', label: 'In Review' },
                    { value: 'revision', label: 'Revisi' },
                    { value: 'approved', label: 'Disetujui' },
                    { value: 'rejected', label: 'Ditolak' },
                ];
                const activeStatuses = ensureArray(filters.status).map(String);
                const hasActive = activeStatuses.length > 0;
                const label = hasActive
                    ? activeStatuses.length === 1
                        ? (statusList.find(s => s.value === activeStatuses[0])?.label ?? activeStatuses[0])
                        : `${activeStatuses.length} Status`
                    : 'Status';

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant={hasActive ? 'primary' : 'white'}
                                className="relative flex h-9 items-center justify-center gap-1.5 rounded-xl px-3 text-[11px] font-semibold border"
                            >
                                <span>{label}</span>
                                <ChevronDown size={12} className="opacity-60" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl p-2 min-w-[180px]">
                            {hasActive && (
                                <>
                                    <button
                                        onClick={() => handleFilterChange({ status: [], page: 1 })}
                                        className="w-full flex items-center px-2 py-1.5 rounded-md text-left text-xs text-text-desc hover:bg-surface-muted transition-all cursor-pointer mb-1"
                                    >
                                        <X size={11} className="mr-1.5 shrink-0" /> Reset Status
                                    </button>
                                    <div className="h-px bg-surface-border mb-1" />
                                </>
                            )}
                            {statusList.map(({ value, label: sLabel }) => {
                                const isSelected = activeStatuses.includes(value);
                                return (
                                    <button
                                        key={value}
                                        onClick={() => {
                                            const next = isSelected
                                                ? activeStatuses.filter(v => v !== value)
                                                : [...activeStatuses, value];
                                            handleFilterChange({ status: next, page: 1 });
                                        }}
                                        className={cn(
                                            'w-full flex items-center justify-between px-2 py-1.5 rounded-md text-left text-xs transition-all cursor-pointer',
                                            isSelected ? 'bg-primary text-white font-semibold' : 'text-text-main hover:bg-surface-muted'
                                        )}
                                    >
                                        <span>{sLabel}</span>
                                        {isSelected && <Check size={11} strokeWidth={3} className="shrink-0" />}
                                    </button>
                                );
                            })}
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            })()}

            {/* Date Range - Dropdown Card */}
            {(() => {
                const hasDate = !!(filters.created_from || filters.created_to);
                const fmt = (d: Date) => d.toISOString().split('T')[0];

                const presets = [
                    {
                        label: 'Hari Ini', key: 'today',
                        get: () => { const t = fmt(new Date()); return { from: t, to: t }; }
                    },
                    {
                        label: 'Minggu Ini', key: 'week',
                        get: () => {
                            const now = new Date();
                            const day = now.getDay();
                            const mon = new Date(now); mon.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
                            const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
                            return { from: fmt(mon), to: fmt(sun) };
                        }
                    },
                    {
                        label: 'Bulan Ini', key: 'month',
                        get: () => {
                            const now = new Date();
                            const first = new Date(now.getFullYear(), now.getMonth(), 1);
                            const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                            return { from: fmt(first), to: fmt(last) };
                        }
                    },
                    {
                        label: '3 Bulan Ini', key: '3month',
                        get: () => {
                            const now = new Date();
                            const first = new Date(now.getFullYear(), now.getMonth() - 2, 1);
                            const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                            return { from: fmt(first), to: fmt(last) };
                        }
                    },
                ];

                const activePreset = presets.find(p => {
                    const range = p.get();
                    return filters.created_from === range.from && filters.created_to === range.to;
                });

                const buttonLabel = activePreset
                    ? activePreset.label
                    : hasDate
                        ? filters.created_from && filters.created_to
                            ? `${filters.created_from} – ${filters.created_to}`
                            : filters.created_from || filters.created_to
                        : 'Tanggal';

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant={hasDate ? 'primary' : 'white'}
                                className="relative flex h-9 items-center justify-center gap-1.5 rounded-xl px-3 text-[11px] font-semibold border"
                            >
                                <Calendar size={12} className="shrink-0" />
                                <span>{buttonLabel}</span>
                                <ChevronDown size={12} className="opacity-60" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl p-4 w-[580px]">
                            {/* Quick Presets */}
                            <p className="text-[9px] font-bold text-text-desc uppercase mb-2 px-1">Pilih Cepat</p>
                            <div className="grid grid-cols-4 gap-1 mb-4">
                                {presets.map(preset => {
                                    const isActive = activePreset?.key === preset.key;
                                    return (
                                        <button
                                            key={preset.key}
                                            onClick={() => {
                                                const range = preset.get();
                                                handleFilterChange({ created_from: range.from, created_to: range.to, page: 1 });
                                            }}
                                            className={cn(
                                                'flex items-center justify-center px-2 py-2 rounded-xl text-[11px] font-medium border transition-all cursor-pointer',
                                                isActive
                                                    ? 'bg-primary text-white border-primary font-semibold shadow-sm'
                                                    : 'border-surface-border text-text-main hover:bg-surface-muted'
                                            )}
                                        >
                                            {preset.label}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Divider */}
                            <div className="h-px bg-surface-border mb-4" />

                            {/* Calendar */}
                            <DateRangeCalendar
                                from={filters.created_from || ''}
                                to={filters.created_to || ''}
                                onChange={(from, to) => handleFilterChange({ created_from: from || undefined, created_to: to || undefined, page: 1 })}
                            />

                            {/* Reset */}
                            {hasDate && (
                                <>
                                    <div className="h-px bg-surface-border mt-4 mb-2" />
                                    <button
                                        onClick={() => handleFilterChange({ created_from: undefined, created_to: undefined, page: 1 })}
                                        className="w-full flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-[11px] text-danger hover:bg-danger/10 border border-transparent hover:border-danger/20 transition-all cursor-pointer font-medium"
                                    >
                                        <X size={11} strokeWidth={2.5} /> Reset Tanggal
                                    </button>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            })()}

            {/* Filter Grup Perusahaan */}
            {canChangeCompanyGroup && (() => {
                const activeGroups = ensureArray(filters.company_group_id).map(String);
                const hasActive = activeGroups.length > 0;
                const label = hasActive ? `Grup (${activeGroups.length})` : 'Grup';

                return (
                    <>
                        <div className="h-5 w-px bg-surface-border shrink-0 mx-1" />
                        <MultiSelectFilterDropdown
                            label={label}
                            hasActive={hasActive}
                            options={companyGroups}
                            activeIds={activeGroups}
                            onToggle={(id) => {
                                const next = activeGroups.includes(id) 
                                    ? activeGroups.filter(v => v !== id) 
                                    : [...activeGroups, id];
                                handleFilterChange({ company_group_id: next, page: 1 });
                            }}
                            onReset={() => handleFilterChange({ company_group_id: [], page: 1 })}
                        />
                    </>
                );
            })()}

            {/* Filter Wilayah */}
            {canChangeRegion && (() => {
                const activeRegions = ensureArray(filters.region_id).map(String);
                const hasActive = activeRegions.length > 0;
                const label = hasActive ? `Wilayah (${activeRegions.length})` : 'Wilayah';

                return (
                    <>
                        <div className="h-5 w-px bg-surface-border shrink-0 mx-1" />
                        <MultiSelectFilterDropdown
                            label={label}
                            hasActive={hasActive}
                            options={regions}
                            activeIds={activeRegions}
                            onToggle={(id) => {
                                const next = activeRegions.includes(id) 
                                    ? activeRegions.filter(v => v !== id) 
                                    : [...activeRegions, id];
                                handleFilterChange({ region_id: next, page: 1 });
                            }}
                            onReset={() => handleFilterChange({ region_id: [], page: 1 })}
                        />
                    </>
                );
            })()}

            {/* Filter Perusahaan */}
            {canChangeCompany && (() => {
                const activeCompanies = ensureArray(filters.company_id).map(String);
                const hasActive = activeCompanies.length > 0;
                const label = hasActive ? `Perusahaan (${activeCompanies.length})` : 'Perusahaan';

                return (
                    <>
                        <div className="h-5 w-px bg-surface-border shrink-0 mx-1" />
                        <MultiSelectFilterDropdown
                            label={label}
                            hasActive={hasActive}
                            options={companies}
                            activeIds={activeCompanies}
                            onToggle={(id) => {
                                const next = activeCompanies.includes(id) 
                                    ? activeCompanies.filter(v => v !== id) 
                                    : [...activeCompanies, id];
                                handleFilterChange({ company_id: next, page: 1 });
                            }}
                            onReset={() => handleFilterChange({ company_id: [], page: 1 })}
                        />
                    </>
                );
            })()}

            {/* Divider */}
            <div className="h-5 w-px bg-surface-border shrink-0 mx-1" />

            {/* Filter Divisi */}
            {(() => {
                const activeDivs = ensureArray(filters.division_id).map(String);
                const hasActive = activeDivs.length > 0;
                const label = hasActive ? `Divisi (${activeDivs.length})` : 'Divisi';

                let optionsList = divisions ? [...divisions] : [];
                const loginDivId = meUser?.division_id ? String(meUser.division_id) : null;
                if (loginDivId) {
                    optionsList = optionsList.filter(o => String(o.id) !== loginDivId);
                    optionsList.unshift({
                        id: loginDivId,
                        name: `User Login (Divisi: ${meUser.division_name || meUser.division?.name || 'Milik Saya'})`
                    });
                }

                return (
                    <MultiSelectFilterDropdown
                        label={label}
                        hasActive={hasActive}
                        options={optionsList}
                        activeIds={activeDivs}
                        onToggle={(id) => {
                            const next = activeDivs.includes(id) 
                                ? activeDivs.filter(v => v !== id) 
                                : [...activeDivs, id];
                            handleFilterChange({ division_id: next, page: 1 });
                        }}
                        onReset={() => handleFilterChange({ division_id: [], page: 1 })}
                    />
                );
            })()}

            {/* Filter Departemen */}
            {(() => {
                const activeDeps = ensureArray(filters.department_id).map(String);
                const hasActive = activeDeps.length > 0;
                const label = hasActive ? `Departemen (${activeDeps.length})` : 'Departemen';

                let optionsList = departments ? [...departments] : [];
                const loginDepId = meUser?.department_id ? String(meUser.department_id) : null;
                if (loginDepId) {
                    optionsList = optionsList.filter(o => String(o.id) !== loginDepId);
                    optionsList.unshift({
                        id: loginDepId,
                        name: `User Login (Departemen: ${meUser.department_name || meUser.department?.name || 'Milik Saya'})`
                    });
                }

                return (
                    <MultiSelectFilterDropdown
                        label={label}
                        hasActive={hasActive}
                        options={optionsList}
                        activeIds={activeDeps}
                        onToggle={(id) => {
                            const next = activeDeps.includes(id) 
                                ? activeDeps.filter(v => v !== id) 
                                : [...activeDeps, id];
                            handleFilterChange({ department_id: next, page: 1 });
                        }}
                        onReset={() => handleFilterChange({ department_id: [], page: 1 })}
                    />
                );
            })()}
        </div>
    );
}
