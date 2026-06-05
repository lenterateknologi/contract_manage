import { SearchableMultiSelect } from '@/components/ui/forms/SearchableMultiSelect';
import { Building2, Globe, Landmark } from 'lucide-react';

interface OrgScopeSelectorProps {
    form: any;
    companyGroups: any[];
    regions: any[];
    companies: any[];
    // Keep for compatibility, though no longer used for collapsing
    isOrgExpanded?: boolean;
    setIsOrgExpanded?: (expanded: boolean) => void;
}

export default function OrgScopeSelector({ form, companyGroups = [], regions = [], companies = [] }: OrgScopeSelectorProps) {
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

    // 3. Company options - dependent on selected regions and groups
    const filteredCompanies = companies.filter((c: any) => {
        const matchesGroup =
            !form.data.company_group_ids ||
            form.data.company_group_ids.length === 0 ||
            form.data.company_group_ids.includes(String(c.company_group_id));
        const matchesRegion = !form.data.region_ids || form.data.region_ids.length === 0 || form.data.region_ids.includes(String(c.region_id));
        return matchesGroup && matchesRegion;
    });

    const companyOptions = filteredCompanies.map((c: any) => ({
        value: String(c.id),
        label: c.name,
    }));

    return (
        <div className="lg:col-span-1">
            <div className="flex h-full flex-col">
                <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-2 dark:border-slate-800">
                    <Building2 size={14} className="text-primary" />
                    <h3 className="text-[11px] font-semibold text-slate-900 uppercase dark:text-white">Ruang Lingkup Organisasi</h3>
                </div>

                <div className="space-y-3">
                    {/* Selector 1: Group */}
                    <div className="space-y-1.5">
                        <label className="flex items-center gap-1.5 text-[11px] font-semi-bold">
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
                            triggerClassName="min-h-9 h-auto py-1.5 px-3 rounded-xl text-[11px] font-bold uppercase bg-white border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary dark:bg-slate-900/50 dark:border-slate-800 dark:focus:border-primary"
                        />
                    </div>

                    {/* Selector 2: Region */}
                    <div className="space-y-1.5">

                        <label className="flex items-center gap-1.5 text-[11px] font-semi-bold">
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
                                    ? 'Semua Region (Pilih Group Dulu)...'
                                    : 'Semua Region...'
                            }
                            disabled={!form.data.company_group_ids || form.data.company_group_ids.length === 0}
                            triggerClassName="min-h-9 h-auto py-1.5 px-3 rounded-xl text-[11px] font-bold uppercase bg-white border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary dark:bg-slate-900/50 dark:border-slate-800 dark:focus:border-primary"
                        />
                    </div>

                    {/* Selector 3: Perusahaan */}
                    <div className="space-y-1.5">

                        <label className="flex items-center gap-1.5 text-[11px] font-semi-bold">
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
                                    ? 'Semua Perusahaan (Pilih Region Dulu)...'
                                    : 'Semua Perusahaan...'
                            }
                            disabled={!form.data.region_ids || form.data.region_ids.length === 0}
                            triggerClassName="min-h-9 h-auto py-1.5 px-3 rounded-xl text-[11px] font-bold uppercase bg-white border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary dark:bg-slate-900/50 dark:border-slate-800 dark:focus:border-primary"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
