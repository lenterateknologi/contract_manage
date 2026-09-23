import React from 'react';
import { ContractType } from '@/pages/contracts/types';
import { Input } from '@/components/ui/inputs/Input';
import { Textarea } from '@/components/ui/inputs/Textarea';
import { SearchableSelect } from '@/components/ui/selection/SearchableSelect';
import { TreeSelect } from '@/components/ui/selection/TreeSelect';
import { Checkbox } from '@/components/ui/selection/Checkbox';
import { cn } from '@/lib/utils';
import { formatDate, formatCurrency, formatNumber } from '@/lib/formatters';
import {
    Building2,
    Calendar,
    Coins,
    FileText,
    GitBranch,
    Hash,
    Receipt,
    Tag,
    CheckCircle2,
    XCircle,
    Sparkles,
} from 'lucide-react';
import { resolveVendorTaxPkp } from '@/pages/contracts/utils';

interface ContractInfoFormProps {
    is_readonly?: boolean;
    title: string;
    setTitle: (val: string) => void;
    contractNo: string;
    setContractNo: (val: string) => void;
    contractDate: string;
    setContractDate: (val: string) => void;
    endDate: string;
    setEndDate: (val: string) => void;
    price: string;
    setPrice: (val: string) => void;
    typeId: string;
    setTypeId: (val: string) => void;
    submissionTypeId: string;
    setSubmissionTypeId: (val: string) => void;
    firstPartyId?: string;
    setFirstPartyId?: (val: string) => void;
    vendorId: string;
    setVendorId: (val: string) => void;
    types: ContractType[];
    submissionTypes: any[];
    vendors: any[];
    selected: any;
    inputCls: string;
    taxRequired: boolean;
    onTaxRequiredChange: (val: boolean) => void;
    /** Per-field granular edit permissions (from workflow step meta) */
    canEditVendor?: boolean;
    canEditCategory?: boolean;
    canEditPrice?: boolean;
    canEditPeriod?: boolean;
    canEditTaxToggle?: boolean;
}

const FieldLabel = ({ icon: Icon, required = false, children }: { icon?: any; required?: boolean; children: React.ReactNode }) => (
    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {Icon && <Icon size={12} className="text-muted-foreground/80 shrink-0" />}
        <span>{children}</span>
        {required && <span className="text-rose-500 font-black ml-0.5" title="Wajib Diisi">*</span>}
    </div>
);

export const MetaBadge = () => null;

export function ContractInfoForm({
    is_readonly = false,
    title,
    setTitle,
    contractNo,
    setContractNo,
    contractDate,
    setContractDate,
    endDate,
    setEndDate,
    price,
    setPrice,
    typeId,
    setTypeId,
    submissionTypeId,
    setSubmissionTypeId,
    firstPartyId = 'internal',
    setFirstPartyId,
    vendorId,
    setVendorId,
    types,
    submissionTypes,
    vendors,
    selected,
    inputCls,
    taxRequired,
    onTaxRequiredChange,
    canEditVendor = true,
    canEditCategory = true,
    canEditPrice = true,
    canEditPeriod = true,
    canEditTaxToggle = true,
}: ContractInfoFormProps) {
    const activeType = React.useMemo(() => types.find((t) => String(t.id) === String(typeId)), [types, typeId]);
    const activeSubmissionType = React.useMemo(
        () => submissionTypes.find((st) => String(st.id) === String(submissionTypeId)),
        [submissionTypes, submissionTypeId]
    );
    const initUser = selected.initiator || selected.creator;
    const internalCompanyName = initUser?.company?.name || initUser?.company_name || 'PT. Lentera Teknologi';
    const internalUserName = initUser?.name ? ` (${initUser.name})` : '';

    const firstPartyVendor = React.useMemo(() => {
        if (!firstPartyId || firstPartyId === 'internal') return null;
        return vendors.find((v) => String(v.id) === String(firstPartyId)) || null;
    }, [vendors, firstPartyId]);

    const secondPartyVendor = React.useMemo(() => {
        if (!vendorId || vendorId === 'internal') return null;
        return vendors.find((v) => String(v.id) === String(vendorId)) || selected.vendor || null;
    }, [vendors, vendorId, selected.vendor]);

    const p1TaxInfo = React.useMemo(() => {
        if (!firstPartyId || firstPartyId === 'internal') {
            // Internal / User Login has no vendor PKP data -> Not PKP / Non-PKP
            return { isPkp: false, pkpStatus: 'Non-PKP' };
        }
        return resolveVendorTaxPkp(firstPartyVendor);
    }, [firstPartyId, firstPartyVendor]);

    const p2TaxInfo = React.useMemo(() => {
        if (!vendorId || vendorId === 'internal') {
            // Internal / User Login has no vendor PKP data -> Not PKP / Non-PKP
            return { isPkp: false, pkpStatus: 'Non-PKP' };
        }
        return resolveVendorTaxPkp(secondPartyVendor);
    }, [vendorId, secondPartyVendor]);

    const partyOptions = React.useMemo(() => {
        const list = [
            {
                value: 'internal',
                label: `${internalCompanyName}${internalUserName} (Internal / Pemohon)`,
            },
        ];

        if (Array.isArray(vendors)) {
            vendors.forEach((v) => {
                list.push({
                    value: String(v.id),
                    label: v.name || v.vendor_name || `Vendor #${v.id}`,
                });
            });
        }

        return list;
    }, [vendors, internalCompanyName, internalUserName]);

    const firstPartyDisplayName = React.useMemo(() => {
        if (firstPartyId === 'internal') {
            return `${internalCompanyName} (Internal)`;
        }
        const found = partyOptions.find((p) => p.value === firstPartyId);
        if (found) return found.label;
        return selected.p1_entity || `${internalCompanyName} (Internal)`;
    }, [firstPartyId, partyOptions, internalCompanyName, selected.p1_entity]);

    const secondPartyDisplayName = React.useMemo(() => {
        if (vendorId === 'internal') {
            return `${internalCompanyName} (Internal)`;
        }
        const found = partyOptions.find((p) => p.value === vendorId);
        if (found) return found.label;
        return selected.p2_entity || selected.vendor?.name || 'Tanpa Vendor';
    }, [vendorId, partyOptions, internalCompanyName, selected.p2_entity, selected.vendor]);

    // Current active tax info based on which party is selected (taxRequired: true = P1, false = P2)
    const activeSelectedTaxInfo = taxRequired ? p1TaxInfo : p2TaxInfo;

    const formattedPrice = React.useMemo(() => {
        const val = price || (selected.metadata?.meta_harga ?? selected.metadata?.f2_price ?? selected.meta?.f2_price);
        if (val === undefined || val === null || val === '') return null;
        return formatCurrency(val);
    }, [price, selected]);

    const categoryDisplayName = React.useMemo(() => {
        const targetId = typeId || selected.contract_type_id || activeType?.id;
        let item = targetId ? types.find((t) => String(t.id) === String(targetId)) : null;

        // If not found by ID, try finding by name
        if (!item && selected.contract_type) {
            item = types.find((t) => t.name === selected.contract_type) || null;
        }

        if (!item) {
            return selected.contract_type || '—';
        }

        const pathNames = [item.name];
        let current: any = item;

        // Traverse up to include all ancestors
        while (current && current.parent_id && String(current.parent_id) !== String(current.id)) {
            const parent = types.find((t: any) => String(t.id) === String(current.parent_id));
            if (parent && String(parent.id) !== String(current.id)) {
                pathNames.unshift(parent.name);
                current = parent;
            } else {
                break;
            }
        }

        return pathNames.join(' - ');
    }, [typeId, selected.contract_type_id, selected.contract_type, activeType, types]);

    // ── READ-ONLY PRESENTATION (WHEN is_readonly) ──
    if (is_readonly) {
        return (
            <div className="flex flex-col">
                {/* 1. Judul Kontrak */}
                {selected.show_title !== false && (
                    <div className="pb-3 mb-1 border-b border-border/60 flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            <span>Judul Pengajuan</span>
                            {!!(selected.require_title || selected.workflow_step?.meta?.require_title) && (
                                <span className="text-rose-500 font-black ml-0.5" title="Wajib Diisi">*</span>
                            )}
                        </div>
                        <p className="text-xs font-semibold text-foreground leading-relaxed">
                            {title || selected.title || '—'}
                        </p>
                    </div>
                )}

                {/* 2. Key-Value List */}
                <div className="divide-y divide-border/40 text-xs">
                    {/* No. Dokumen F2 */}
                    {selected.show_f2_contract_no !== false && (
                        <div className="py-2.5 flex items-center justify-between gap-3">
                            <FieldLabel icon={Hash} required={!!(selected.require_f2_contract_no || selected.workflow_step?.meta?.require_f2_contract_no)}>No. Dokumen</FieldLabel>
                            {selected.contract_no ? (
                                <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                                    {selected.contract_no}
                                </span>
                            ) : (
                                <span className="text-muted-foreground italic text-xs">Belum diterbitkan</span>
                            )}
                        </div>
                    )}

                    {/* Pihak Pertama */}
                    <div className="py-2.5 flex items-center justify-between gap-3">
                        <FieldLabel icon={Building2}>Pihak Pertama</FieldLabel>
                        <span className="font-semibold text-foreground text-right truncate max-w-[220px]">
                            {firstPartyDisplayName}
                        </span>
                    </div>

                    {/* Pihak Kedua */}
                    {selected.show_vendor !== false && (
                        <div className="py-2.5 flex items-center justify-between gap-3">
                            <FieldLabel icon={Building2} required={!!(selected.require_vendor || selected.workflow_step?.meta?.require_vendor)}>Pihak Kedua</FieldLabel>
                            <span className="font-semibold text-foreground text-right truncate max-w-[220px]">
                                {secondPartyDisplayName}
                            </span>
                        </div>
                    )}

                    {/* Masa Berlaku */}
                    {selected.show_period !== false && (
                        <div className="py-2.5 flex items-center justify-between gap-3">
                            <FieldLabel icon={Calendar} required={!!(selected.require_period || selected.workflow_step?.meta?.require_period)}>Masa Berlaku</FieldLabel>
                            <span className="font-medium text-foreground text-right">
                                {selected.contract_date || selected.end_date
                                    ? `${selected.contract_date ? formatDate(selected.contract_date) : '—'} s/d ${selected.end_date ? formatDate(selected.end_date) : '—'}`
                                    : '—'}
                            </span>
                        </div>
                    )}

                    {/* Nilai / Harga */}
                    {selected.show_price !== false && (
                        <div className="py-2.5 flex items-center justify-between gap-3">
                            <FieldLabel icon={Coins} required={!!(selected.require_price || selected.workflow_step?.meta?.require_price)}>Nilai / Estimasi Biaya</FieldLabel>
                            <span className="font-mono font-bold text-foreground text-right">
                                {formattedPrice || '—'}
                            </span>
                        </div>
                    )}

                    {/* Ketentuan Pajak */}
                    {selected.show_tax_toggle !== false && (
                        <div className="py-2.5 flex items-center justify-between gap-3">
                            <FieldLabel icon={Receipt} required={!!(selected.require_tax_toggle || selected.workflow_step?.meta?.require_tax_toggle)}>Penentuan Pajak</FieldLabel>
                            <div className="flex flex-col items-end gap-1">
                                <span className="font-semibold text-foreground text-right">
                                    {taxRequired
                                        ? `Pihak I (${firstPartyDisplayName})`
                                        : `Pihak II (${secondPartyDisplayName})`}
                                </span>
                                <span className={cn(
                                    "inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded border",
                                    activeSelectedTaxInfo.isPkp
                                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                                        : "bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20"
                                )}>
                                    {activeSelectedTaxInfo.isPkp ? (
                                        <>
                                            <CheckCircle2 size={10} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                                            <span>Kena Pajak ({activeSelectedTaxInfo.pkpStatus || 'PKP'})</span>
                                        </>
                                    ) : (
                                        <>
                                            <XCircle size={10} className="text-slate-500 dark:text-slate-400 shrink-0" />
                                            <span>Bebas Pajak ({activeSelectedTaxInfo.pkpStatus || 'Non-PKP'})</span>
                                        </>
                                    )}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ── EDITABLE FORM PRESENTATION ──
    return (
        <div className="flex flex-col gap-3.5">
            {/* Judul Pengajuan */}
            {selected.show_title !== false && (
                <div className="flex flex-col gap-1.5">
                    <FieldLabel icon={FileText} required={!!(selected.require_title || selected.workflow_step?.meta?.require_title)}>Judul Pengajuan</FieldLabel>
                    <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Masukkan judul pengajuan..."
                        size="sm"
                    />
                </div>
            )}

            {/* No. Dokumen F2 */}
            {selected.show_f2_contract_no !== false && (
                <div className="flex flex-col gap-1.5">
                    <FieldLabel icon={Hash} required={!!(selected.require_f2_contract_no || selected.workflow_step?.meta?.require_f2_contract_no)}>No. Dokumen (F2)</FieldLabel>
                    {selected.allow_f2_contract_no_edit !== false ? (
                        <Input
                            value={contractNo}
                            onChange={(e) => setContractNo(e.target.value)}
                            placeholder="Nomor dokumen / F2..."
                            size="sm"
                        />
                    ) : (
                        <span className="font-mono text-xs font-bold text-foreground">
                            {selected.contract_no || 'Belum diterbitkan'}
                        </span>
                    )}
                </div>
            )}

            {/* Pihak Pertama */}
            <div className="flex flex-col gap-1.5">
                <FieldLabel icon={Building2}>Pihak Pertama</FieldLabel>
                {canEditVendor ? (
                    <SearchableSelect
                        value={firstPartyId}
                        onValueChange={(val) => setFirstPartyId?.(val)}
                        options={partyOptions}
                        placeholder="Pilih Pihak Pertama"
                        searchPlaceholder="Cari pihak pertama..."
                        size="sm"
                    />
                ) : (
                    <span className="text-xs font-semibold text-foreground truncate">
                        {firstPartyDisplayName}
                    </span>
                )}
            </div>

            {/* Pihak Kedua */}
            {selected.show_vendor !== false && (
                <div className="flex flex-col gap-1.5">
                    <FieldLabel icon={Building2} required={!!(selected.require_vendor || selected.workflow_step?.meta?.require_vendor)}>Pihak Kedua</FieldLabel>
                    {canEditVendor ? (
                        <SearchableSelect
                            value={vendorId}
                            onValueChange={setVendorId}
                            options={partyOptions}
                            placeholder="Pilih Pihak Kedua"
                            searchPlaceholder="Cari pihak kedua..."
                            size="sm"
                        />
                    ) : (
                        <span className="text-xs font-semibold text-foreground truncate">
                            {secondPartyDisplayName}
                        </span>
                    )}
                </div>
            )}

            {/* Masa Berlaku */}
            {selected.show_period !== false && (
                <div className="flex flex-col gap-1.5">
                    <FieldLabel icon={Calendar} required={!!(selected.require_period || selected.workflow_step?.meta?.require_period)}>Masa Berlaku</FieldLabel>
                    {canEditPeriod ? (
                        <div className="grid grid-cols-2 gap-2">
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] text-muted-foreground font-medium">Tanggal Mulai</span>
                                <Input
                                    type="date"
                                    value={contractDate}
                                    onChange={(e) => setContractDate(e.target.value)}
                                    size="sm"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] text-muted-foreground font-medium">Tanggal Selesai</span>
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    size="sm"
                                />
                            </div>
                        </div>
                    ) : (
                        <span className="text-xs font-medium text-foreground">
                            {contractDate || endDate
                                ? `${contractDate || '—'} s/d ${endDate || '—'}`
                                : '—'}
                        </span>
                    )}
                </div>
            )}

            {/* Nilai / Estimasi Biaya */}
            {selected.show_price !== false && (
                <div className="flex flex-col gap-1.5">
                    <FieldLabel icon={Coins} required={!!(selected.require_price || selected.workflow_step?.meta?.require_price)}>Nilai / Estimasi Biaya</FieldLabel>
                    {canEditPrice ? (
                        <Input
                            value={formatNumber(price)}
                            onChange={(e) => {
                                const raw = e.target.value.replace(/\D/g, '');
                                setPrice(raw);
                            }}
                            placeholder="Contoh: 510.000.000..."
                            size="sm"
                        />
                    ) : (
                        <span className="font-mono font-bold text-xs text-foreground">
                            {price ? formatCurrency(price) : '—'}
                        </span>
                    )}
                </div>
            )}

            {/* Pajak */}
            {selected.show_tax_toggle !== false && (
                <div className="flex flex-col gap-1.5">
                    <FieldLabel icon={Receipt} required={!!(selected.require_tax_toggle || selected.workflow_step?.meta?.require_tax_toggle)}>Penentuan Pajak</FieldLabel>
                    {canEditTaxToggle ? (
                        <SearchableSelect
                            value={taxRequired ? 'p1' : 'p2'}
                            onValueChange={(val) => onTaxRequiredChange(val === 'p1')}
                            options={[
                                { value: 'p1', label: `Pihak I (${firstPartyDisplayName})` },
                                { value: 'p2', label: `Pihak II (${secondPartyDisplayName})` },
                            ]}
                            placeholder="Pilih Penanggung / Ketentuan Pajak"
                            searchPlaceholder="Cari pihak penanggung pajak..."
                            size="sm"
                        />
                    ) : (
                        <span className="text-xs font-semibold text-foreground">
                            {taxRequired
                                ? `Pihak I (${firstPartyDisplayName})`
                                : `Pihak II (${secondPartyDisplayName})`}
                        </span>
                    )}
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className={cn(
                            "inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-md border",
                            activeSelectedTaxInfo.isPkp
                                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                                : "bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/30"
                        )}>
                            {activeSelectedTaxInfo.isPkp ? (
                                <>
                                    <CheckCircle2 size={12} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                                    <span>Status: <strong>Kena Pajak ({activeSelectedTaxInfo.pkpStatus || 'PKP'})</strong></span>
                                </>
                            ) : (
                                <>
                                    <XCircle size={12} className="text-slate-500 dark:text-slate-400 shrink-0" />
                                    <span>Status: <strong>Tidak Kena Pajak / Bebas ({activeSelectedTaxInfo.pkpStatus || 'Non-PKP'})</strong></span>
                                </>
                            )}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}

