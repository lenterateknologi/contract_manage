import { Input } from '@/components/ui/inputs/Input';
import { SearchableSelect } from '@/components/ui/selection/SearchableSelect';
import { formatCurrency, formatDate, formatNumber } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { ContractType } from '@/pages/contracts/types';
import { resolveVendorTaxPkp } from '@/pages/contracts/utils';
import { Building2, Calendar, CheckCircle2, Coins, Edit3, Eye, FileText, Hash, Lock, Receipt, XCircle } from 'lucide-react';
import React from 'react';

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
    canEditFirstParty?: boolean;
    canEditVendor?: boolean;
    canEditCategory?: boolean;
    canEditPrice?: boolean;
    canEditPeriod?: boolean;
    canEditTaxToggle?: boolean;
}

const FieldConfigHeader = ({
    icon: Icon,
    label,
    required = false,
    canEdit = true,
    isVisible = true,
}: {
    icon?: any;
    label: string;
    required?: boolean;
    canEdit?: boolean;
    isVisible?: boolean;
}) => (
    <div className="flex items-center justify-between gap-2 text-[10px]">
        <div className="text-muted-foreground flex items-center gap-1.5 font-bold tracking-wider uppercase">
            {Icon && <Icon size={12} className="text-muted-foreground/80 shrink-0" />}
            <span>{label}</span>
            {required && (
                <span className="ml-0.5 font-black text-rose-500" title="Wajib Diisi">
                    *
                </span>
            )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
            {isVisible && (
                <span
                    className="inline-flex h-4 w-4 items-center justify-center rounded border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                    title="Visible (Tampil)"
                >
                    <Eye size={10} className="shrink-0" />
                </span>
            )}
            {canEdit ? (
                <span
                    className="inline-flex h-4 w-4 items-center justify-center rounded border border-indigo-500/20 bg-indigo-500/10 text-indigo-700 dark:text-indigo-400"
                    title="Editable (Dapat Diedit)"
                >
                    <Edit3 size={9} className="shrink-0" />
                </span>
            ) : (
                <span
                    className="bg-surface-muted text-muted-foreground border-surface-border inline-flex h-4 w-4 items-center justify-center rounded border"
                    title="Read-Only (Hanya Baca)"
                >
                    <Lock size={9} className="shrink-0" />
                </span>
            )}
        </div>
    </div>
);

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
    canEditFirstParty = true,
    canEditVendor = true,
    canEditCategory = true,
    canEditPrice = true,
    canEditPeriod = true,
    canEditTaxToggle = true,
}: ContractInfoFormProps) {
    const activeType = React.useMemo(() => types.find((t) => String(t.id) === String(typeId)), [types, typeId]);
    const activeSubmissionType = React.useMemo(
        () => submissionTypes.find((st) => String(st.id) === String(submissionTypeId)),
        [submissionTypes, submissionTypeId],
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
            return { isPkp: false, pkpStatus: 'Non-PKP' };
        }
        return resolveVendorTaxPkp(firstPartyVendor);
    }, [firstPartyId, firstPartyVendor]);

    const p2TaxInfo = React.useMemo(() => {
        if (!vendorId || vendorId === 'internal') {
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

    // Current active tax info based on which party is selected
    const activeSelectedTaxInfo = taxRequired ? p1TaxInfo : p2TaxInfo;

    const formattedPrice = React.useMemo(() => {
        const val = price || (selected.metadata?.meta_harga ?? selected.metadata?.f2_price ?? selected.meta?.f2_price);
        if (val === undefined || val === null || val === '') return null;
        return formatCurrency(val);
    }, [price, selected]);

    const showMap = selected.show || {};
    const allowMap = selected.allow || {};
    const reqMap = selected.required || {};

    const showTitle = showMap.title !== undefined ? showMap.title : selected.show_title !== false;
    const showF2ContractNo = showMap.f2_contract_no !== undefined ? showMap.f2_contract_no : selected.show_f2_contract_no !== false;
    const showFirstParty = showMap.first_party !== undefined ? showMap.first_party : selected.show_first_party !== false;
    const showVendor = showMap.vendor !== undefined ? showMap.vendor : selected.show_vendor !== false;
    const showPeriod = showMap.period !== undefined ? showMap.period : selected.show_period !== false;
    const showPrice = showMap.price !== undefined ? showMap.price : selected.show_price !== false;
    const showTaxToggle = showMap.tax_toggle !== undefined ? showMap.tax_toggle : selected.show_tax_toggle !== false;

    const reqTitle = !!(reqMap.title ?? (selected.require_title || selected.workflow_step?.meta?.require_title));
    const reqF2ContractNo = !!(reqMap.f2_contract_no ?? (selected.require_f2_contract_no || selected.workflow_step?.meta?.require_f2_contract_no));
    const reqFirstParty = !!(reqMap.first_party ?? (selected.require_first_party || selected.workflow_step?.meta?.require_first_party));
    const reqVendor = !!(reqMap.vendor ?? (selected.require_vendor || selected.workflow_step?.meta?.require_vendor));
    const reqPeriod = !!(reqMap.period ?? (selected.require_period || selected.workflow_step?.meta?.require_period));
    const reqPrice = !!(reqMap.price ?? (selected.require_price || selected.workflow_step?.meta?.require_price));
    const reqTaxToggle = !!(reqMap.tax_toggle ?? (selected.require_tax_toggle || selected.workflow_step?.meta?.require_tax_toggle));

    const allowTitleEdit = allowMap.title_edit !== undefined ? allowMap.title_edit : selected.allow_title_edit !== false;
    const allowF2ContractNoEdit =
        allowMap.f2_contract_no_edit !== undefined ? allowMap.f2_contract_no_edit : selected.allow_f2_contract_no_edit !== false;

    // ── READ-ONLY PRESENTATION (WHEN is_readonly) ──
    if (is_readonly) {
        return (
            <div className="flex flex-col gap-3">
                {/* 1. Judul Kontrak */}
                {showTitle && (
                    <div className="border-border/40 flex flex-col gap-1 border-b pb-2">
                        <FieldConfigHeader icon={FileText} label="Judul Pengajuan" required={reqTitle} canEdit={false} isVisible={true} />
                        <p className="text-foreground pt-0.5 text-xs leading-relaxed font-semibold">{title || selected.title || '—'}</p>
                    </div>
                )}

                {/* No. Dokumen F2 */}
                {showF2ContractNo && (
                    <div className="border-border/40 flex flex-col gap-1 border-b pb-2">
                        <FieldConfigHeader icon={Hash} label="No. Dokumen (F2)" required={reqF2ContractNo} canEdit={false} isVisible={true} />
                        <div className="pt-0.5">
                            {selected.contract_no ? (
                                <span className="text-primary bg-primary/10 rounded-md px-2 py-0.5 font-mono text-xs font-bold">
                                    {selected.contract_no}
                                </span>
                            ) : (
                                <span className="text-muted-foreground text-xs italic">Belum diterbitkan</span>
                            )}
                        </div>
                    </div>
                )}

                {/* Pihak Pertama */}
                {showFirstParty && (
                    <div className="border-border/40 flex flex-col gap-1 border-b pb-2">
                        <FieldConfigHeader icon={Building2} label="Pihak Pertama" required={reqFirstParty} canEdit={false} isVisible={true} />
                        <span className="text-foreground truncate pt-0.5 text-xs font-semibold">{firstPartyDisplayName}</span>
                    </div>
                )}

                {/* Pihak Kedua */}
                {showVendor && (
                    <div className="border-border/40 flex flex-col gap-1 border-b pb-2">
                        <FieldConfigHeader icon={Building2} label="Pihak Kedua" required={reqVendor} canEdit={false} isVisible={true} />
                        <span className="text-foreground truncate pt-0.5 text-xs font-semibold">{secondPartyDisplayName}</span>
                    </div>
                )}

                {/* Masa Berlaku */}
                {showPeriod && (
                    <div className="border-border/40 flex flex-col gap-1 border-b pb-2">
                        <FieldConfigHeader icon={Calendar} label="Masa Berlaku" required={reqPeriod} canEdit={false} isVisible={true} />
                        <span className="text-foreground pt-0.5 text-xs font-medium">
                            {selected.contract_date || selected.end_date
                                ? `${selected.contract_date ? formatDate(selected.contract_date) : '—'} s/d ${selected.end_date ? formatDate(selected.end_date) : '—'}`
                                : '—'}
                        </span>
                    </div>
                )}

                {/* Nilai / Harga */}
                {showPrice && (
                    <div className="border-border/40 flex flex-col gap-1 border-b pb-2">
                        <FieldConfigHeader icon={Coins} label="Nilai / Estimasi Biaya" required={reqPrice} canEdit={false} isVisible={true} />
                        <span className="text-foreground pt-0.5 font-mono text-xs font-bold">{formattedPrice || '—'}</span>
                    </div>
                )}

                {/* Ketentuan Pajak */}
                {showTaxToggle && (
                    <div className="flex flex-col gap-1">
                        <FieldConfigHeader icon={Receipt} label="Penentuan Pajak" required={reqTaxToggle} canEdit={false} isVisible={true} />
                        <div className="flex flex-col gap-1 pt-0.5">
                            <span className="text-foreground text-xs font-semibold">
                                {taxRequired ? `Pihak I (${firstPartyDisplayName})` : `Pihak II (${secondPartyDisplayName})`}
                            </span>
                            <span
                                className={cn(
                                    'inline-flex w-fit items-center gap-1 rounded border px-2 py-0.5 text-[9.5px] font-semibold',
                                    activeSelectedTaxInfo.isPkp
                                        ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                                        : 'border-slate-500/20 bg-slate-500/10 text-slate-700 dark:text-slate-400',
                                )}
                            >
                                {activeSelectedTaxInfo.isPkp ? (
                                    <>
                                        <CheckCircle2 size={10} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                                        <span>Kena Pajak ({activeSelectedTaxInfo.pkpStatus || 'PKP'})</span>
                                    </>
                                ) : (
                                    <>
                                        <XCircle size={10} className="shrink-0 text-slate-500 dark:text-slate-400" />
                                        <span>Bebas Pajak ({activeSelectedTaxInfo.pkpStatus || 'Non-PKP'})</span>
                                    </>
                                )}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ── EDITABLE FORM PRESENTATION (CLEAN SPACING WITH INLINE VISIBLE CONFIG HEADER) ──
    return (
        <div className="flex flex-col gap-3.5">
            {/* Judul Pengajuan */}
            {showTitle && (
                <div className="flex flex-col gap-1.5">
                    <FieldConfigHeader icon={FileText} label="Judul Pengajuan" required={reqTitle} canEdit={allowTitleEdit} isVisible={true} />
                    <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Masukkan judul pengajuan..."
                        size="sm"
                        disabled={!allowTitleEdit}
                    />
                </div>
            )}

            {/* No. Dokumen F2 */}
            {showF2ContractNo && (
                <div className="flex flex-col gap-1.5">
                    <FieldConfigHeader
                        icon={Hash}
                        label="No. Dokumen (F2)"
                        required={reqF2ContractNo}
                        canEdit={allowF2ContractNoEdit}
                        isVisible={true}
                    />
                    <Input
                        value={contractNo || selected.contract_no || ''}
                        onChange={(e) => setContractNo(e.target.value)}
                        placeholder={allowF2ContractNoEdit ? 'Nomor dokumen / F2...' : 'Belum diterbitkan'}
                        size="sm"
                        disabled={!allowF2ContractNoEdit}
                    />
                </div>
            )}

            {/* Pihak Pertama */}
            {showFirstParty && (
                <div className="flex flex-col gap-1.5">
                    <FieldConfigHeader icon={Building2} label="Pihak Pertama" required={reqFirstParty} canEdit={canEditFirstParty} isVisible={true} />
                    <SearchableSelect
                        value={firstPartyId || ''}
                        onValueChange={(val) => setFirstPartyId?.(val)}
                        options={partyOptions}
                        placeholder="Pilih Pihak Pertama"
                        searchPlaceholder="Cari pihak pertama..."
                        size="sm"
                        disabled={!canEditFirstParty}
                    />
                </div>
            )}

            {/* Pihak Kedua */}
            {showVendor && (
                <div className="flex flex-col gap-1.5">
                    <FieldConfigHeader icon={Building2} label="Pihak Kedua" required={reqVendor} canEdit={canEditVendor} isVisible={true} />
                    <SearchableSelect
                        value={vendorId || ''}
                        onValueChange={setVendorId}
                        options={partyOptions}
                        placeholder="Pilih Pihak Kedua"
                        searchPlaceholder="Cari pihak kedua..."
                        size="sm"
                        disabled={!canEditVendor}
                    />
                </div>
            )}

            {/* Masa Berlaku */}
            {showPeriod && (
                <div className="flex flex-col gap-1.5">
                    <FieldConfigHeader icon={Calendar} label="Masa Berlaku" required={reqPeriod} canEdit={canEditPeriod} isVisible={true} />
                    <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col gap-1">
                            <span className="text-muted-foreground text-[10px] font-medium">Tanggal Mulai</span>
                            <Input
                                type="date"
                                value={contractDate}
                                onChange={(e) => setContractDate(e.target.value)}
                                size="sm"
                                disabled={!canEditPeriod}
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-muted-foreground text-[10px] font-medium">Tanggal Selesai</span>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                size="sm"
                                disabled={!canEditPeriod}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Nilai / Estimasi Biaya */}
            {showPrice && (
                <div className="flex flex-col gap-1.5">
                    <FieldConfigHeader icon={Coins} label="Nilai / Estimasi Biaya" required={reqPrice} canEdit={canEditPrice} isVisible={true} />
                    <Input
                        value={price ? formatNumber(price) : ''}
                        onChange={(e) => {
                            const raw = e.target.value.replace(/\D/g, '');
                            setPrice(raw);
                        }}
                        placeholder={canEditPrice ? 'Contoh: 510.000.000...' : '—'}
                        size="sm"
                        disabled={!canEditPrice}
                    />
                </div>
            )}

            {/* Ketentuan Pajak */}
            {showTaxToggle && (
                <div className="flex flex-col gap-1.5">
                    <FieldConfigHeader icon={Receipt} label="Penentuan Pajak" required={reqTaxToggle} canEdit={canEditTaxToggle} isVisible={true} />
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
                        disabled={!canEditTaxToggle}
                    />
                    <div className="mt-0.5 flex items-center gap-2">
                        <span
                            className={cn(
                                'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-semibold',
                                activeSelectedTaxInfo.isPkp
                                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                                    : 'border-slate-500/30 bg-slate-500/10 text-slate-700 dark:text-slate-400',
                            )}
                        >
                            {activeSelectedTaxInfo.isPkp ? (
                                <>
                                    <CheckCircle2 size={12} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                                    <span>
                                        Status: <strong>Kena Pajak ({activeSelectedTaxInfo.pkpStatus || 'PKP'})</strong>
                                    </span>
                                </>
                            ) : (
                                <>
                                    <XCircle size={12} className="shrink-0 text-slate-500 dark:text-slate-400" />
                                    <span>
                                        Status: <strong>Tidak Kena Pajak / Bebas ({activeSelectedTaxInfo.pkpStatus || 'Non-PKP'})</strong>
                                    </span>
                                </>
                            )}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
