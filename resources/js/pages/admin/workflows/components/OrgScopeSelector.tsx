import { Button } from '@/components/ui/base/Button';
import { cn } from '@/lib/utils';
import { Building2, CheckCircle2, ChevronUp, Globe, Info, Search, Settings2 } from 'lucide-react';
import { useState } from 'react';

interface OrgScopeSelectorProps {
    form: any;
    companyGroups: any[];
    regions: any[];
    companies: any[];
    isOrgExpanded: boolean;
    setIsOrgExpanded: (expanded: boolean) => void;
}

export default function OrgScopeSelector({
    form,
    companyGroups = [],
    regions = [],
    companies = [],
    isOrgExpanded,
    setIsOrgExpanded,
}: OrgScopeSelectorProps) {
    const [groupSearchText, setGroupSearchText] = useState('');
    const [regionSearchText, setRegionSearchText] = useState('');
    const [companySearchText, setCompanySearchText] = useState('');

    return (
        <div className={cn('transition-all duration-300', isOrgExpanded ? 'lg:col-span-2' : 'lg:col-span-1')}>
            <div
                className={cn(
                    'flex h-full flex-col rounded-2xl border bg-slate-50 p-5 transition-all dark:bg-slate-900/50',
                    form.data.company_group_ids?.length > 0 || form.data.region_ids?.length > 0 || form.data.company_ids?.length > 0
                        ? 'border-slate-200 dark:border-slate-800'
                        : 'border-dashed border-slate-200 dark:border-slate-800',
                )}
            >
                <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20">
                            <Building2 size={16} />
                        </div>
                        <span className="text-[11px] font-black text-slate-900 uppercase dark:text-white">Ruang Lingkup Organisasi</span>
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsOrgExpanded(!isOrgExpanded)}
                        className={cn(
                            'h-8 gap-2 rounded-lg px-4 text-[10px] font-bold tracking-tight uppercase transition-all',
                            isOrgExpanded
                                ? 'border-slate-900 bg-slate-900 text-white'
                                : 'border-slate-200 text-slate-600 dark:border-slate-800 dark:text-slate-400',
                        )}
                    >
                        {isOrgExpanded ? <ChevronUp size={12} /> : <Settings2 size={12} />}
                        {isOrgExpanded ? 'TUTUP' : 'ATUR'}
                    </Button>
                </div>

                {/* Summary View */}
                {!isOrgExpanded && (
                    <div className="flex flex-wrap gap-2">
                        {(() => {
                            const activeGroups = companyGroups.filter((g: any) => form.data.company_group_ids?.includes(g.id));
                            const activeRegions = regions.filter((r: any) => form.data.region_ids?.includes(r.id));
                            const activeCompanies = companies.filter((c: any) => form.data.company_ids?.includes(c.id));

                            if (activeGroups.length === 0 && activeRegions.length === 0 && activeCompanies.length === 0) {
                                return (
                                    <div className="flex items-center gap-2 px-3 py-2 text-[11px] font-medium text-slate-400 italic">
                                        <Info size={12} /> Seluruh Organisasi (Global)
                                    </div>
                                );
                            }

                            return (
                                <>
                                    {activeGroups.map((group: any) => (
                                        <div
                                            key={group.id}
                                            className="flex items-center gap-1.5 rounded-lg border border-blue-100 bg-blue-50 px-3 py-1.5 text-[11px] font-bold text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400"
                                        >
                                            <span className="text-[9px] opacity-50">GRP:</span> {group.name}
                                        </div>
                                    ))}
                                    {activeRegions.map((region: any) => (
                                        <div
                                            key={region.id}
                                            className="flex items-center gap-1.5 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-[11px] font-bold text-indigo-700 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-400"
                                        >
                                            <span className="text-[9px] opacity-50">REG:</span> {region.name}
                                        </div>
                                    ))}
                                    {activeCompanies.map((company: any) => (
                                        <div
                                            key={company.id}
                                            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-[11px] font-bold text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                                        >
                                            <span className="text-[9px] opacity-50">CO:</span> {company.name}
                                        </div>
                                    ))}
                                </>
                            );
                        })()}
                    </div>
                )}

                {/* Expanded Edit View */}
                {isOrgExpanded && (
                    <div className="mt-6 flex-1 border-t border-slate-200 pt-6 dark:border-slate-800">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                            {/* Group Column */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 px-1">
                                    <Building2 size={12} className="text-slate-400" />
                                    <span className="text-[10px] font-black text-slate-500 uppercase">GROUP</span>
                                </div>
                                <div className="group/search relative">
                                    <Search className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-300" size={13} />
                                    <input
                                        placeholder="CARI GROUP..."
                                        value={groupSearchText}
                                        onChange={(e) => setGroupSearchText(e.target.value)}
                                        className="h-9 w-full rounded-xl border border-slate-200 bg-white pr-3 pl-10 text-[10px] font-bold uppercase outline-none focus:border-slate-900 dark:border-slate-800 dark:bg-black/50"
                                    />
                                </div>
                                <div className="custom-scrollbar max-h-[200px] space-y-1 overflow-y-auto pr-2">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            form.setData({
                                                ...form.data,
                                                company_group_ids: [],
                                                region_ids: [],
                                                company_ids: [],
                                            })
                                        }
                                        className={cn(
                                            'flex w-full items-center justify-between rounded-xl border p-2 text-left transition-all',
                                            !form.data.company_group_ids || form.data.company_group_ids.length === 0
                                                ? 'border-slate-900 bg-slate-900 text-white shadow-lg'
                                                : 'border-transparent text-slate-400 italic hover:bg-slate-100',
                                        )}
                                    >
                                        <span className="text-[10px] font-bold uppercase">SEMUA GROUP</span>
                                        {(!form.data.company_group_ids || form.data.company_group_ids.length === 0) && <CheckCircle2 size={10} />}
                                    </button>
                                    {companyGroups
                                        .filter((g: any) => !groupSearchText || g.name.toLowerCase().includes(groupSearchText.toLowerCase()))
                                        .map((group: any) => {
                                            const isSelected = form.data.company_group_ids?.includes(group.id);
                                            return (
                                                <button
                                                    key={group.id}
                                                    type="button"
                                                    onClick={() => {
                                                        const newGroups = isSelected
                                                            ? form.data.company_group_ids.filter((id: string) => id !== group.id)
                                                            : [...(form.data.company_group_ids || []), group.id];
                                                        form.setData({
                                                            ...form.data,
                                                            company_group_ids: newGroups,
                                                            region_ids: [],
                                                            company_ids: [],
                                                        });
                                                    }}
                                                    className={cn(
                                                        'flex w-full items-center justify-between rounded-xl border p-2 text-left transition-all',
                                                        isSelected
                                                            ? 'border-slate-900 bg-slate-900 text-white shadow-lg'
                                                            : 'border-transparent hover:bg-slate-100',
                                                    )}
                                                >
                                                    <span className="text-[10px] font-bold uppercase">{group.name}</span>
                                                    {isSelected && <CheckCircle2 size={10} />}
                                                </button>
                                            );
                                        })}
                                </div>
                            </div>

                            {/* Region Column */}
                            <div className="space-y-4 border-l border-slate-100 pl-6 dark:border-slate-800">
                                <div className="flex items-center gap-2 px-1">
                                    <Globe size={12} className="text-slate-400" />
                                    <span className="text-[10px] font-black text-slate-500 uppercase">REGION</span>
                                </div>
                                <div className="group/search relative">
                                    <Search className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-300" size={13} />
                                    <input
                                        placeholder="CARI REGION..."
                                        value={regionSearchText}
                                        onChange={(e) => setRegionSearchText(e.target.value)}
                                        disabled={!form.data.company_group_ids || form.data.company_group_ids.length === 0}
                                        className="h-9 w-full rounded-xl border border-slate-200 bg-white pr-3 pl-10 text-[10px] font-bold uppercase outline-none focus:border-slate-900 disabled:opacity-30 dark:border-slate-800 dark:bg-black/50"
                                    />
                                </div>
                                <div className="custom-scrollbar max-h-[200px] space-y-1 overflow-y-auto pr-2">
                                    <button
                                        type="button"
                                        onClick={() => form.setData({ ...form.data, region_ids: [], company_ids: [] })}
                                        disabled={!form.data.company_group_ids || form.data.company_group_ids.length === 0}
                                        className={cn(
                                            'flex w-full items-center justify-between rounded-xl border p-2 text-left transition-all',
                                            !form.data.region_ids || form.data.region_ids.length === 0
                                                ? 'border-slate-900 bg-slate-900 text-white shadow-lg'
                                                : 'border-transparent text-slate-400 italic hover:bg-slate-100',
                                        )}
                                    >
                                        <span className="text-[10px] font-bold uppercase">SEMUA REGION</span>
                                        {(!form.data.region_ids || form.data.region_ids.length === 0) && <CheckCircle2 size={10} />}
                                    </button>
                                    {regions
                                        .filter((r: any) => {
                                            if (!form.data.company_group_ids || form.data.company_group_ids.length === 0) return true;
                                            const validRegionIds = companies
                                                .filter((c: any) => form.data.company_group_ids.includes(c.company_group_id))
                                                .map((c: any) => c.region_id)
                                                .filter(Boolean);
                                            return validRegionIds.includes(r.id);
                                        })
                                        .filter((r: any) => !regionSearchText || r.name.toLowerCase().includes(regionSearchText.toLowerCase()))
                                        .map((region: any) => {
                                            const isSelected = form.data.region_ids?.includes(region.id);
                                            return (
                                                <button
                                                    key={region.id}
                                                    type="button"
                                                    onClick={() => {
                                                        const newRegions = isSelected
                                                            ? form.data.region_ids.filter((id: string) => id !== region.id)
                                                            : [...(form.data.region_ids || []), region.id];
                                                        form.setData({
                                                            ...form.data,
                                                            region_ids: newRegions,
                                                            company_ids: [],
                                                        });
                                                    }}
                                                    className={cn(
                                                        'flex w-full items-center justify-between rounded-xl border p-2 text-left transition-all',
                                                        isSelected
                                                            ? 'border-slate-900 bg-slate-900 text-white shadow-lg'
                                                            : 'border-transparent hover:bg-slate-100',
                                                    )}
                                                >
                                                    <span className="text-[10px] font-bold uppercase">{region.name}</span>
                                                    {isSelected && <CheckCircle2 size={10} />}
                                                </button>
                                            );
                                        })}
                                </div>
                            </div>

                            {/* Company Column */}
                            <div className="space-y-4 border-l border-slate-100 pl-6 dark:border-slate-800">
                                <div className="flex items-center gap-2 px-1">
                                    <Building2 size={12} className="text-slate-400" />
                                    <span className="text-[10px] font-black text-slate-500 uppercase">PERUSAHAAN</span>
                                </div>
                                <div className="group/search relative">
                                    <Search className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-300" size={13} />
                                    <input
                                        placeholder="CARI PERUSAHAAN..."
                                        value={companySearchText}
                                        onChange={(e) => setCompanySearchText(e.target.value)}
                                        disabled={!form.data.region_ids || form.data.region_ids.length === 0}
                                        className="h-9 w-full rounded-xl border border-slate-200 bg-white pr-3 pl-10 text-[10px] font-bold uppercase outline-none focus:border-slate-900 disabled:opacity-30 dark:border-slate-800 dark:bg-black/50"
                                    />
                                </div>
                                <div className="custom-scrollbar max-h-[200px] space-y-1 overflow-y-auto pr-2">
                                    <button
                                        type="button"
                                        onClick={() => form.setData('company_ids', [])}
                                        disabled={!form.data.region_ids || form.data.region_ids.length === 0}
                                        className={cn(
                                            'flex w-full items-center justify-between rounded-xl border p-2 text-left transition-all',
                                            !form.data.company_ids || form.data.company_ids.length === 0
                                                ? 'border-slate-900 bg-slate-900 text-white shadow-lg'
                                                : 'border-transparent text-slate-400 italic hover:bg-slate-100',
                                        )}
                                    >
                                        <span className="text-[10px] font-bold uppercase">SEMUA PERUSAHAAN</span>
                                        {(!form.data.company_ids || form.data.company_ids.length === 0) && <CheckCircle2 size={10} />}
                                    </button>
                                    {companies
                                        .filter((c: any) => form.data.region_ids.includes(c.region_id))
                                        .filter((c: any) => !companySearchText || c.name.toLowerCase().includes(companySearchText.toLowerCase()))
                                        .map((company: any) => {
                                            const isSelected = form.data.company_ids?.includes(company.id);
                                            return (
                                                <button
                                                    key={company.id}
                                                    type="button"
                                                    onClick={() => {
                                                        const newCompanies = isSelected
                                                            ? form.data.company_ids.filter((id: string) => id !== company.id)
                                                            : [...(form.data.company_ids || []), company.id];
                                                        form.setData('company_ids', newCompanies);
                                                    }}
                                                    className={cn(
                                                        'flex w-full items-center justify-between rounded-xl border p-2 text-left transition-all',
                                                        isSelected
                                                            ? 'border-slate-900 bg-slate-900 text-white shadow-lg'
                                                            : 'border-transparent hover:bg-slate-100',
                                                    )}
                                                >
                                                    <span className="text-[10px] font-bold uppercase">{company.name}</span>
                                                    {isSelected && <CheckCircle2 size={10} />}
                                                </button>
                                            );
                                        })}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
