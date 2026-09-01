import { Building2 } from 'lucide-react';
import AuthoritySelector from './AuthoritySelector';

interface OrgScopeItem {
    value: string;
    is_initiator: boolean;
}

interface OrgScopeSection {
    is_initiator: boolean;
    items: OrgScopeItem[];
}

interface OrgScopeSelectorProps {
    form: any;
    companyGroups: any[];
    regions: any[];
    companies: any[];
    isOrgExpanded?: boolean;
    setIsOrgExpanded?: (expanded: boolean) => void;
}

function toSection(raw: any[]): OrgScopeSection {
    const arr: OrgScopeItem[] = raw.map((i) =>
        typeof i === 'object' ? i : { value: String(i), is_initiator: false },
    );
    const is_initiator = arr.length > 0 && arr.every((i) => i.is_initiator);
    return { is_initiator, items: is_initiator ? [] : arr };
}

export default function OrgScopeSelector({ form, companyGroups = [], regions = [], companies = [] }: OrgScopeSelectorProps) {
    const groupSection = toSection(Array.isArray(form.data.company_group_ids) ? form.data.company_group_ids : []);
    const regionSection = toSection(Array.isArray(form.data.region_ids) ? form.data.region_ids : []);
    const companySection = toSection(Array.isArray(form.data.company_ids) ? form.data.company_ids : []);

    const selectedGroupValues = groupSection.items.map((i) => String(i.value));
    const selectedRegionValues = regionSection.items.map((i) => String(i.value));

    const activeCompanyGroups = companyGroups.filter((g: any) => g.is_used !== false && g.is_used !== 0 && String(g.is_used) !== '0');
    const activeRegions = regions.filter((r: any) => r.is_used !== false && r.is_used !== 0 && String(r.is_used) !== '0');
    const activeCompanies = companies.filter((c: any) => c.is_used !== false && c.is_used !== 0 && String(c.is_used) !== '0');

    const groupOptions = activeCompanyGroups.map((g: any) => ({ value: String(g.id), label: g.name }));

    const filteredRegions = activeRegions.filter((r: any) => {
        if (selectedGroupValues.length === 0) return true;
        const validRegionIds = activeCompanies
            .filter((c: any) => selectedGroupValues.includes(String(c.company_group_id)))
            .map((c: any) => c.region_id)
            .filter(Boolean);
        return validRegionIds.includes(r.id);
    });
    const regionOptions = filteredRegions.map((r: any) => ({ value: String(r.id), label: r.name }));

    const filteredCompanies = activeCompanies.filter((c: any) => {
        const matchesGroup = selectedGroupValues.length === 0 || selectedGroupValues.includes(String(c.company_group_id));
        const matchesRegion = selectedRegionValues.length === 0 || selectedRegionValues.includes(String(c.region_id));
        return matchesGroup && matchesRegion;
    });
    const companyOptions = filteredCompanies.map((c: any) => ({ value: String(c.id), label: c.name }));

    return (
        <div className="lg:col-span-1">
            <div className="flex h-full flex-col">
                <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-2 dark:border-slate-800">
                    <Building2 size={14} className="text-primary" />
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Ruang Lingkup Organisasi</h3>
                </div>

                <div className="space-y-3">
                    <AuthoritySelector
                        label="Group"
                        idPrefix="org-group"
                        isInitiator={groupSection.is_initiator}
                        onIsInitiatorChange={(checked) =>
                            form.setData((prev: any) => ({
                                ...prev,
                                company_group_ids: checked ? [{ value: '__initiator__', is_initiator: true }] : [],
                                region_ids: [],
                                company_ids: [],
                            }))
                        }
                        values={selectedGroupValues}
                        onValuesChange={(vals) =>
                            form.setData((prev: any) => ({
                                ...prev,
                                company_group_ids: vals.map(v => ({ value: v, is_initiator: false })),
                                region_ids: [],
                                company_ids: [],
                            }))
                        }
                        options={groupOptions}
                        placeholder="Tambah Group..."
                    />

                    <AuthoritySelector
                        label="Region"
                        idPrefix="org-region"
                        isInitiator={regionSection.is_initiator}
                        onIsInitiatorChange={(checked) =>
                            form.setData((prev: any) => ({
                                ...prev,
                                region_ids: checked ? [{ value: '__initiator__', is_initiator: true }] : [],
                                company_ids: [],
                            }))
                        }
                        values={selectedRegionValues}
                        onValuesChange={(vals) =>
                            form.setData((prev: any) => ({
                                ...prev,
                                region_ids: vals.map(v => ({ value: v, is_initiator: false })),
                                company_ids: [],
                            }))
                        }
                        options={regionOptions}
                        placeholder="Tambah Region..."
                        disabled={selectedGroupValues.length === 0 && !groupSection.is_initiator}
                    />

                    <AuthoritySelector
                        label="Perusahaan"
                        idPrefix="org-company"
                        isInitiator={companySection.is_initiator}
                        onIsInitiatorChange={(checked) =>
                            form.setData('company_ids', checked ? [{ value: '__initiator__', is_initiator: true }] : [])
                        }
                        values={companySection.items.map((i) => String(i.value))}
                        onValuesChange={(vals) =>
                            form.setData('company_ids', vals.map(v => ({ value: v, is_initiator: false })))
                        }
                        options={companyOptions}
                        placeholder="Tambah Perusahaan..."
                        disabled={selectedRegionValues.length === 0 && !regionSection.is_initiator}
                    />
                </div>
            </div>
        </div>
    );
}
