import { Checkbox } from '@/components/ui/selection/Checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/selection/Select';
import { Building2, Globe, Landmark, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface OrgScopeItem {
    value: string;
    is_initiator: boolean;
}

// ponytail: section-level is_initiator, same pattern as InitiatorAuthorityTable
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

interface ScopeTableProps {
    label: string;
    icon: React.ReactNode;
    section: OrgScopeSection;
    onSectionChange: (s: OrgScopeSection) => void;
    options: { value: string; label: string }[];
    placeholder?: string;
    disabled?: boolean;
}

function ScopeTable({ label, icon, section, onSectionChange, options, placeholder, disabled }: ScopeTableProps) {
    const [selectedValue, setSelectedValue] = useState('');
    const { is_initiator, items } = section;

    const toggleIsInitiator = (checked: boolean) =>
        onSectionChange({ is_initiator: checked, items: checked ? [] : items });

    const addItem = (val: string) => {
        if (!val || items.some((i) => i.value === val)) return;
        onSectionChange({ ...section, items: [...items, { value: val, is_initiator: false }] });
        setSelectedValue('');
    };

    const removeItem = (val: string) =>
        onSectionChange({ ...section, items: items.filter((i) => i.value !== val) });

    const getLabel = (val: string) => options.find((o) => o.value === val)?.label ?? val;
    const available = options.filter((o) => !items.some((i) => i.value === o.value));
    const isDisabled = disabled || is_initiator;

    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                    {icon} {label}
                </label>
                <label className="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                    <Checkbox
                        id={`org_is_initiator_${label}`}
                        checked={is_initiator}
                        onCheckedChange={(c) => toggleIsInitiator(!!c)}
                        className="h-3.5 w-3.5"
                    />
                    <span className="text-[11px]">Sesuai Initiator</span>
                </label>
            </div>

            <Select value={selectedValue} onValueChange={addItem} disabled={isDisabled}>
                <SelectTrigger className="h-9 rounded-xl border-slate-200 bg-white text-xs font-medium disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-800 dark:bg-card">
                    <SelectValue
                        placeholder={
                            is_initiator
                                ? 'Diisi otomatis dari initiator'
                                : disabled
                                    ? `Pilih ${label} (pilih level atas dulu)...`
                                    : (placeholder ?? `Tambah ${label}...`)
                        }
                    />
                </SelectTrigger>
                <SelectContent className="z-[100] rounded-xl border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-card">
                    {available.map((o) => (
                        <SelectItem key={o.value} value={o.value} className="py-2 text-xs font-medium">
                            {o.label}
                        </SelectItem>
                    ))}
                    {available.length === 0 && (
                        <div className="px-3 py-2 text-xs text-slate-400">Semua sudah dipilih</div>
                    )}
                </SelectContent>
            </Select>

            {!is_initiator && items.length > 0 && (
                <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-xs">

                        <tbody>
                            {items.map((item) => (
                                <tr key={item.value} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                                    <td className="px-3 py-2 font-medium text-slate-700 dark:text-slate-300">
                                        {getLabel(item.value)}
                                    </td>
                                    <td className="px-2 py-2 text-center">
                                        <button
                                            type="button"
                                            onClick={() => removeItem(item.value)}
                                            className="text-slate-400 transition-colors hover:text-red-500"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// Helper: convert flat OrgScopeItem[] to OrgScopeSection
function toSection(raw: any[]): OrgScopeSection {
    const arr: OrgScopeItem[] = raw.map((i) =>
        typeof i === 'object' ? i : { value: String(i), is_initiator: false },
    );
    const is_initiator = arr.length > 0 && arr.every((i) => i.is_initiator);
    return { is_initiator, items: is_initiator ? [] : arr };
}

// Helper: convert OrgScopeSection back to OrgScopeItem[] for form data
function fromSection(s: OrgScopeSection): OrgScopeItem[] {
    if (s.is_initiator) return [{ value: '__initiator__', is_initiator: true }];
    return s.items;
}

export default function OrgScopeSelector({ form, companyGroups = [], regions = [], companies = [] }: OrgScopeSelectorProps) {
    const groupSection = toSection(Array.isArray(form.data.company_group_ids) ? form.data.company_group_ids : []);
    const regionSection = toSection(Array.isArray(form.data.region_ids) ? form.data.region_ids : []);
    const companySection = toSection(Array.isArray(form.data.company_ids) ? form.data.company_ids : []);

    const selectedGroupValues = groupSection.items.map((i) => String(i.value));
    const selectedRegionValues = regionSection.items.map((i) => String(i.value));

    const groupOptions = companyGroups.map((g: any) => ({ value: String(g.id), label: g.name }));

    const filteredRegions = regions.filter((r: any) => {
        if (selectedGroupValues.length === 0) return true;
        const validRegionIds = companies
            .filter((c: any) => selectedGroupValues.includes(String(c.company_group_id)))
            .map((c: any) => c.region_id)
            .filter(Boolean);
        return validRegionIds.includes(r.id);
    });
    const regionOptions = filteredRegions.map((r: any) => ({ value: String(r.id), label: r.name }));

    const filteredCompanies = companies.filter((c: any) => {
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
                    <ScopeTable
                        label="Group"
                        icon={<Landmark size={10} />}
                        section={groupSection}
                        onSectionChange={(s) =>
                            form.setData({
                                ...form.data,
                                company_group_ids: fromSection(s),
                                region_ids: [],
                                company_ids: [],
                            })
                        }
                        options={groupOptions}
                        placeholder="Tambah Group..."
                    />

                    <ScopeTable
                        label="Region"
                        icon={<Globe size={10} />}
                        section={regionSection}
                        onSectionChange={(s) =>
                            form.setData({
                                ...form.data,
                                region_ids: fromSection(s),
                                company_ids: [],
                            })
                        }
                        options={regionOptions}
                        placeholder="Tambah Region..."
                        disabled={selectedGroupValues.length === 0 && !groupSection.is_initiator}
                    />

                    <ScopeTable
                        label="Perusahaan"
                        icon={<Building2 size={10} />}
                        section={companySection}
                        onSectionChange={(s) => form.setData('company_ids', fromSection(s))}
                        options={companyOptions}
                        placeholder="Tambah Perusahaan..."
                        disabled={selectedRegionValues.length === 0 && !regionSection.is_initiator}
                    />
                </div>
            </div>
        </div>
    );
}
