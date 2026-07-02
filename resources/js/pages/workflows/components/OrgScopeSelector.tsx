import { SearchableMultiSelect } from '@/components/ui/selection/SearchableMultiSelect';
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
    // Normalize fields as arrays of strings
    const companyGroupIds = Array.isArray(form.data.company_group_ids)
        ? form.data.company_group_ids.map(String)
        : [];
    const regionIds = Array.isArray(form.data.region_ids)
        ? form.data.region_ids.map(String)
        : [];
    const companyIds = Array.isArray(form.data.company_ids)
        ? form.data.company_ids.map(String)
        : [];

    // 1. Group options
    const groupOptions = companyGroups.map((g: any) => ({
        value: String(g.id),
        label: g.name,
    }));

    // 2. Region options - dependent on selected groups (if any selected)
    const filteredRegions = regions.filter((r: any) => {
        if (companyGroupIds.length === 0) {
            return true;
        }
        // find region ids linked to companies in the selected groups
        const validRegionIds = companies
            .filter((c: any) => companyGroupIds.includes(String(c.company_group_id)))
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
            companyGroupIds.length === 0 ||
            companyGroupIds.includes(String(c.company_group_id));
        const matchesRegion = regionIds.length === 0 || regionIds.includes(String(c.region_id));
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
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Ruang Lingkup Organisasi</h3>
                </div>

                <div className="space-y-3">
                    {/* Selector 1: Group */}
                    <div className="space-y-1.5">
                        <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                            <Landmark size={10} /> Group
                        </label>
                        <SearchableMultiSelect
                            values={companyGroupIds}
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
                            triggerClassName="min-h-9 h-auto py-1.5 px-3 rounded-xl text-xs font-medium bg-white border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary dark:bg-slate-900/50 dark:border-slate-800 dark:focus:border-primary"
                        />
                    </div>

                    {/* Selector 2: Region */}
                    <div className="space-y-1.5">
                        <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                            <Globe size={10} /> Region
                        </label>
                        <SearchableMultiSelect
                            values={regionIds}
                            onValuesChange={(vals: string[]) => {
                                form.setData({
                                    ...form.data,
                                    region_ids: vals,
                                    company_ids: [],
                                });
                            }}
                            options={regionOptions}
                            placeholder={
                                companyGroupIds.length === 0
                                    ? 'Semua Region (Pilih Group Dulu)...'
                                    : 'Semua Region...'
                            }
                            disabled={companyGroupIds.length === 0}
                            triggerClassName="min-h-9 h-auto py-1.5 px-3 rounded-xl text-xs font-medium bg-white border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary dark:bg-slate-900/50 dark:border-slate-800 dark:focus:border-primary"
                        />
                    </div>

                    {/* Selector 3: Perusahaan */}
                    <div className="space-y-1.5">
                        <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                            <Building2 size={10} /> Perusahaan
                        </label>
                        <SearchableMultiSelect
                            values={companyIds}
                            onValuesChange={(vals: string[]) => {
                                form.setData('company_ids', vals);
                            }}
                            options={companyOptions}
                            placeholder={
                                regionIds.length === 0
                                    ? 'Semua Perusahaan (Pilih Region Dulu)...'
                                    : 'Semua Perusahaan...'
                            }
                            disabled={regionIds.length === 0}
                            triggerClassName="min-h-9 h-auto py-1.5 px-3 rounded-xl text-xs font-medium bg-white border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary dark:bg-slate-900/50 dark:border-slate-800 dark:focus:border-primary"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
