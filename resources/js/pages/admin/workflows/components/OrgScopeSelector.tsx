import { SearchableMultiSelect } from '@/components/ui/forms/SearchableMultiSelect';
import { cn } from '@/lib/utils';
import { Building2, Globe, Landmark } from 'lucide-react';
import React from 'react';

interface OrgScopeSelectorProps {
    form: any;
    companyGroups: any[];
    regions: any[];
    companies: any[];
    // Keep for compatibility, though no longer used for collapsing
    isOrgExpanded?: boolean;
    setIsOrgExpanded?: (expanded: boolean) => void;
}

export default function OrgScopeSelector({
    form,
    companyGroups = [],
    regions = [],
    companies = [],
}: OrgScopeSelectorProps) {
    // 1. Group options
    const groupOptions = companyGroups.map((g: any) => ({
        value: String(g.id),
        label: g.name,
    }));

    // 2. Region options - dependent on selected groups (if any selected)
    const filteredRegions = regions.filter((r: any) => {
        if (!form.data.company_group_ids || form.data.company_group_ids.length === 0) {
            return true;
        }
        // find region ids linked to companies in the selected groups
        const validRegionIds = companies
            .filter((c: any) => form.data.company_group_ids.includes(String(c.company_group_id)))
            .map((c: any) => c.region_id)
            .filter(Boolean);
        return validRegionIds.includes(r.id);
    });

    const regionOptions = filteredRegions.map((r: any) => ({
        value: String(r.id),
        label: r.name,
    }));

    // 3. Company options - dependent on selected regions (if any selected)
    const filteredCompanies = companies.filter((c: any) => {
        if (!form.data.region_ids || form.data.region_ids.length === 0) {
            // also filter by selected groups if no regions selected
            if (!form.data.company_group_ids || form.data.company_group_ids.length === 0) {
                return true;
            }
            return form.data.company_group_ids.includes(String(c.company_group_id));
        }
        return form.data.region_ids.includes(String(c.region_id));
    });

    const companyOptions = filteredCompanies.map((c: any) => ({
        value: String(c.id),
        label: c.name,
    }));

    return (
        <div className="lg:col-span-1">
            <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900/50">
                <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20">
                        <Building2 size={16} />
                    </div>
                    <span className="text-[11px] font-black text-slate-900 uppercase dark:text-white">Ruang Lingkup Organisasi</span>
                </div>

                <div className="space-y-4">
                    {/* Selector 1: Group */}
                    <div className="space-y-1.5">
                        <label className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                            <Landmark size={10} /> Group
                        </label>
                        <SearchableMultiSelect
                            values={form.data.company_group_ids?.map(String) || []}
                            onValuesChange={(vals: string[]) => {
                                form.setData({
                                    ...form.data,
                                    company_group_ids: vals,
                                    region_ids: [],
                                    company_ids: [],
                                });
                            }}
                            options={groupOptions}
                            placeholder="Semua Group..."
                            triggerClassName="min-h-8 h-auto py-1 text-[10px] font-black uppercase bg-slate-50/50 border-slate-200 focus:border-slate-900 dark:bg-slate-900/50 dark:border-slate-800"
                        />
                    </div>

                    {/* Selector 2: Region */}
                    <div className="space-y-1.5">
                        <label className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                            <Globe size={10} /> Region
                        </label>
                        <SearchableMultiSelect
                            values={form.data.region_ids?.map(String) || []}
                            onValuesChange={(vals: string[]) => {
                                form.setData({
                                    ...form.data,
                                    region_ids: vals,
                                    company_ids: [],
                                });
                            }}
                            options={regionOptions}
                            placeholder={
                                !form.data.company_group_ids || form.data.company_group_ids.length === 0
                                    ? "Semua Region (Pilih Group Dulu)..."
                                    : "Semua Region..."
                            }
                            disabled={!form.data.company_group_ids || form.data.company_group_ids.length === 0}
                            triggerClassName="min-h-8 h-auto py-1 text-[10px] font-black uppercase bg-slate-50/50 border-slate-200 focus:border-slate-900 dark:bg-slate-900/50 dark:border-slate-800"
                        />
                    </div>

                    {/* Selector 3: Perusahaan */}
                    <div className="space-y-1.5">
                        <label className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                            <Building2 size={10} /> Perusahaan
                        </label>
                        <SearchableMultiSelect
                            values={form.data.company_ids?.map(String) || []}
                            onValuesChange={(vals: string[]) => {
                                form.setData('company_ids', vals);
                            }}
                            options={companyOptions}
                            placeholder={
                                !form.data.region_ids || form.data.region_ids.length === 0
                                    ? "Semua Perusahaan (Pilih Region Dulu)..."
                                    : "Semua Perusahaan..."
                            }
                            disabled={!form.data.region_ids || form.data.region_ids.length === 0}
                            triggerClassName="min-h-8 h-auto py-1 text-[10px] font-black uppercase bg-slate-50/50 border-slate-200 focus:border-slate-900 dark:bg-slate-900/50 dark:border-slate-800"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
