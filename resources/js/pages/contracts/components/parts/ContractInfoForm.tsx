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
    Eye,
    Lock,
    Edit3,
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
        <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-muted-foreground">
            {Icon && <Icon size={12} className="text-muted-foreground/80 shrink-0" />}
            <span>{label}</span>
            {required && <span className="text-rose-500 font-black ml-0.5" title="Wajib Diisi">*</span>}
        </div>
        <div className="flex items-center gap-1 shrink-0">
            {isVisible && (
                <span
                    className="inline-flex items-center justify-center h-4 w-4 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                    title="Visible (Tampil)"
                >
                    <Eye size={10} className="shrink-0" />
                </span>
            )}
            {canEdit ? (
                <span
                    className="inline-flex items-center justify-center h-4 w-4 rounded bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20"
                    title="Editable (Dapat Diedit)"
                >
                    <Edit3 size={9} className="shrink-0" />
                </span>
            ) : (
                <span
                    className="inline-flex items-center justify-center h-4 w-4 rounded bg-surface-muted text-muted-foreground border border-surface-border"
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

    // ── READ-ONLY PRESENTATION (WHEN is_readonly) ──
    if (is_readonly) {
        return (
            <div className="flex flex-col gap-3">
                {/* 1. Judul Kontrak */}
                {selected.show_title !== false && (
                    <div className="flex flex-col gap-1 pb-2 border-b border-border/40">
                        <FieldConfigHeader
                            icon={FileText}
                            label="Judul Pengajuan"
                            required={!!(selected.require_title || selected.workflow_step?.meta?.require_title)}
                            canEdit={false}
                            isVisible={true}
                        />
                        <p className="text-xs font-semibold text-foreground leading-relaxed pt-0.5">
                            {title || selected.title || '—'}
                        </p>
                    </div>
                )}

                {/* No. Dokumen F2 */}
                {selected.show_f2_contract_no !== false && (
                    <div className="flex flex-col gap-1 pb-2 border-b border-border/40">
                        <FieldConfigHeader
                            icon={Hash}
                            label="No. Dokumen (F2)"
                            required={!!(selected.require_f2_contract_no || selected.workflow_step?.meta?.require_f2_contract_no)}
                            canEdit={false}
                            isVisible={true}
                        />
                        <div className="pt-0.5">
                            {selected.contract_no ? (
                                <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                                    {selected.contract_no}
                                </span>
                            ) : (
                                <span className="text-muted-foreground italic text-xs">Belum diterbitkan</span>
                            )}
                        </div>
                    </div>
                )}

                {/* Pihak Pertama */}
                {selected.show_first_party !== false && (
                    <div className="flex flex-col gap-1 pb-2 border-b border-border/40">
                        <FieldConfigHeader
                            icon={Building2}
                            label="Pihak Pertama"
                            required={!!(selected.require_first_party || selected.workflow_step?.meta?.require_first_party)}
                            canEdit={false}
                            isVisible={true}
                        />
                        <span className="font-semibold text-xs text-foreground truncate pt-0.5">
                            {firstPartyDisplayName}
                        </span>
                    </div>
                )}

                {/* Pihak Kedua */}
                {selected.show_vendor !== false && (
                    <div className="flex flex-col gap-1 pb-2 border-b border-border/40">
                        <FieldConfigHeader
                            icon={Building2}
                            label="Pihak Kedua"
                            required={!!(selected.require_vendor || selected.workflow_step?.meta?.require_vendor)}
                            canEdit={false}
                            isVisible={true}
                        />
                        <span className="font-semibold text-xs text-foreground truncate pt-0.5">
                            {secondPartyDisplayName}
                        </span>
                    </div>
                )}

                {/* Masa Berlaku */}
                {selected.show_period !== false && (
                    <div className="flex flex-col gap-1 pb-2 border-b border-border/40">
                        <FieldConfigHeader
                            icon={Calendar}
                            label="Masa Berlaku"
                            required={!!(selected.require_period || selected.workflow_step?.meta?.require_period)}
                            canEdit={false}
                            isVisible={true}
                        />
                        <span className="font-medium text-xs text-foreground pt-0.5">
                            {selected.contract_date || selected.end_date
                                ? `${selected.contract_date ? formatDate(selected.contract_date) : '—'} s/d ${selected.end_date ? formatDate(selected.end_date) : '—'}`
                                : '—'}
                        </span>
                    </div>
                )}

                {/* Nilai / Harga */}
                {selected.show_price !== false && (
                    <div className="flex flex-col gap-1 pb-2 border-b border-border/40">
                        <FieldConfigHeader
                            icon={Coins}
                            label="Nilai / Estimasi Biaya"
                            required={!!(selected.require_price || selected.workflow_step?.meta?.require_price)}
                            canEdit={false}
                            isVisible={true}
                        />
                        <span className="font-mono font-bold text-xs text-foreground pt-0.5">
                            {formattedPrice || '—'}
                        </span>
                    </div>
                )}

                {/* Ketentuan Pajak */}
                {selected.show_tax_toggle !== false && (
                    <div className="flex flex-col gap-1">
                        <FieldConfigHeader
                            icon={Receipt}
                            label="Penentuan Pajak"
                            required={!!(selected.require_tax_toggle || selected.workflow_step?.meta?.require_tax_toggle)}
                            canEdit={false}
                            isVisible={true}
                        />
                        <div className="flex flex-col gap-1 pt-0.5">
                            <span className="font-semibold text-xs text-foreground">
                                {taxRequired
                                    ? `Pihak I (${firstPartyDisplayName})`
                                    : `Pihak II (${secondPartyDisplayName})`}
                            </span>
                            <span className={cn(
                                "inline-flex items-center gap-1 text-[9.5px] font-semibold px-2 py-0.5 rounded border w-fit",
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
        );
    }

    // ── EDITABLE FORM PRESENTATION (CLEAN SPACING WITH INLINE VISIBLE CONFIG HEADER) ──
    return (
        <div className="flex flex-col gap-3.5">
            {/* Judul Pengajuan */}
            {selected.show_title !== false && (
                <div className="flex flex-col gap-1.5">
                    <FieldConfigHeader
                        icon={FileText}
                        label="Judul Pengajuan"
                        required={!!(selected.require_title || selected.workflow_step?.meta?.require_title)}
                        canEdit={selected.allow_title_edit !== false}
                        isVisible={true}
                    />
                    <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Masukkan judul pengajuan..."
                        size="sm"
                        disabled={selected.allow_title_edit === false}
                    />
                </div>
            )}

            {/* No. Dokumen F2 */}
            {selected.show_f2_contract_no !== false && (
                <div className="flex flex-col gap-1.5">
                    <FieldConfigHeader
                        icon={Hash}
                        label="No. Dokumen (F2)"
                        required={!!(selected.require_f2_contract_no || selected.workflow_step?.meta?.require_f2_contract_no)}
                        canEdit={selected.allow_f2_contract_no_edit !== false}
                        isVisible={true}
                    />
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
            {selected.show_first_party !== false && (
                <div className="flex flex-col gap-1.5">
                    <FieldConfigHeader
                        icon={Building2}
                        label="Pihak Pertama"
                        required={!!(selected.require_first_party || selected.workflow_step?.meta?.require_first_party)}
                        canEdit={canEditFirstParty}
                        isVisible={true}
                    />
                    {canEditFirstParty ? (
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
            )}

            {/* Pihak Kedua */}
            {selected.show_vendor !== false && (
                <div className="flex flex-col gap-1.5">
                    <FieldConfigHeader
                        icon={Building2}
                        label="Pihak Kedua"
                        required={!!(selected.require_vendor || selected.workflow_step?.meta?.require_vendor)}
                        canEdit={canEditVendor}
                        isVisible={true}
                    />
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
                    <FieldConfigHeader
                        icon={Calendar}
                        label="Masa Berlaku"
                        required={!!(selected.require_period || selected.workflow_step?.meta?.require_period)}
                        canEdit={canEditPeriod}
                        isVisible={true}
                    />
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
                    <FieldConfigHeader
                        icon={Coins}
                        label="Nilai / Estimasi Biaya"
                        required={!!(selected.require_price || selected.workflow_step?.meta?.require_price)}
                        canEdit={canEditPrice}
                        isVisible={true}
                    />
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

            {/* Ketentuan Pajak */}
            {selected.show_tax_toggle !== false && (
                <div className="flex flex-col gap-1.5">
                    <FieldConfigHeader
                        icon={Receipt}
                        label="Penentuan Pajak"
                        required={!!(selected.require_tax_toggle || selected.workflow_step?.meta?.require_tax_toggle)}
                        canEdit={canEditTaxToggle}
                        isVisible={true}
                    />
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

