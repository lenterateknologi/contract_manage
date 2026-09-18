import React from 'react';
import { ContractType } from '@/pages/contracts/types';
import { Input } from '@/components/ui/inputs/Input';
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
    const activeVendor = React.useMemo(() => vendors.find((v) => String(v.id) === String(vendorId)) || selected.vendor, [vendors, vendorId, selected.vendor]);
    const vendorTaxInfo = React.useMemo(() => resolveVendorTaxPkp(activeVendor), [activeVendor]);

    const vendorOptions = Array.isArray(vendors)
        ? vendors.map((v) => ({ value: String(v.id), label: v.name }))
        : [];

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

                    {/* Kategori Dokumen */}
                    {selected.show_category !== false && (
                        <div className="py-2.5 flex items-center justify-between gap-3">
                            <FieldLabel icon={Tag} required={!!(selected.require_category || selected.workflow_step?.meta?.require_category)}>Kategori Dokumen</FieldLabel>
                            <span className="font-semibold text-foreground text-right">
                                {categoryDisplayName}
                            </span>
                        </div>
                    )}

                    {/* Alur Kerja (Workflow) */}
                    <div className="py-2.5 flex items-center justify-between gap-3">
                        <FieldLabel icon={GitBranch}>Alur Kerja</FieldLabel>
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold text-xs border border-indigo-200/60 dark:border-indigo-800/40">
                            {selected.workflow?.name || selected.workflow_step?.workflow?.name || 'Alur Standar'}
                        </span>
                    </div>

                    {/* Vendor */}
                    {selected.show_vendor !== false && (
                        <div className="py-2.5 flex items-center justify-between gap-3">
                            <FieldLabel icon={Building2} required={!!(selected.require_vendor || selected.workflow_step?.meta?.require_vendor)}>Pihak Kedua </FieldLabel>
                            <span className="font-semibold text-foreground text-right truncate max-w-[220px]">
                                {selected.vendor?.name || 'Tanpa Vendor'}
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
                            <div className="flex items-center gap-2">
                                <FieldLabel icon={Receipt} required={!!(selected.require_tax_toggle || selected.workflow_step?.meta?.require_tax_toggle)}>Pajak</FieldLabel>
                                {vendorTaxInfo.pkpStatus && vendorTaxInfo.pkpStatus !== '-' && (
                                    <span className={cn(
                                        "text-[10px] font-bold px-1.5 py-0.2 rounded border",
                                        taxRequired
                                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                            : "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20"
                                    )}>
                                        PKP: {vendorTaxInfo.pkpStatus}
                                    </span>
                                )}
                            </div>
                            {taxRequired ? (
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                    <CheckCircle2 size={13} className="shrink-0" />
                                    Dikenakan Pajak (PPN/PPh)
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                                    <XCircle size={13} className="shrink-0" />
                                    Tanpa Pajak
                                </span>
                            )}
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

            {/* Pihak Kedua  */}
            {selected.show_vendor !== false && (
                <div className="flex flex-col gap-1.5">
                    <FieldLabel icon={Building2} required={!!(selected.require_vendor || selected.workflow_step?.meta?.require_vendor)}>Pihak Kedua </FieldLabel>
                    {canEditVendor ? (
                        <SearchableSelect
                            value={vendorId}
                            onValueChange={setVendorId}
                            options={vendorOptions}
                            placeholder="Pilih Vendor"
                            searchPlaceholder="Cari vendor..."
                            size="sm"
                        />
                    ) : (
                        <span className="text-xs font-semibold text-foreground truncate">
                            {selected.vendor?.name || vendorOptions.find((o) => o.value === vendorId)?.label || 'Tanpa Vendor'}
                        </span>
                    )}
                </div>
            )}

            {/* Kategori Dokumen */}
            {selected.show_category !== false && (
                <div className="flex flex-col gap-1.5">
                    <FieldLabel icon={Tag} required={!!(selected.require_category || selected.workflow_step?.meta?.require_category)}>Kategori Dokumen</FieldLabel>
                    {canEditCategory ? (
                        <TreeSelect
                            value={typeId}
                            onValueChange={(val) => setTypeId(val)}
                            items={types}
                            placeholder="Pilih Kategori"
                            disableParentSelection={true}
                            size="sm"
                        />
                    ) : (
                        <span className="text-xs font-semibold text-foreground">
                            {categoryDisplayName}
                        </span>
                    )}
                </div>
            )}

            {/* Alur Kerja (Workflow) Info */}
            <div className="flex flex-col gap-1.5">
                <FieldLabel icon={GitBranch}>Alur Kerja</FieldLabel>
                <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                    <span className="font-semibold text-foreground">
                        {selected.workflow?.name || selected.workflow_step?.workflow?.name || 'Alur Standar'}
                    </span>
                    {selected.workflow_step?.step && (
                        <span className="text-[10px] text-muted-foreground">
                            • Tahap {selected.workflow_step.step}: {selected.workflow_step.name || selected.workflow_step.label || 'Berjalan'}
                        </span>
                    )}
                </div>
            </div>

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
                    <div className="flex items-center justify-between">
                        <FieldLabel icon={Receipt} required={!!(selected.require_tax_toggle || selected.workflow_step?.meta?.require_tax_toggle)}>Penentuan Pajak</FieldLabel>
                        {vendorTaxInfo.pkpStatus && vendorTaxInfo.pkpStatus !== '-' && (
                            <span className={cn(
                                "text-[10px] font-bold px-1.5 py-0.5 rounded border",
                                taxRequired
                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                    : "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20"
                            )}>
                                Status PKP: {vendorTaxInfo.pkpStatus}
                            </span>
                        )}
                    </div>
                    {canEditTaxToggle ? (
                        <label
                            htmlFor="tax_required_checkbox"
                            className="flex items-center justify-between cursor-pointer rounded-xl border border-border bg-muted/30 px-3.5 py-2.5 hover:bg-muted/60 transition-colors"
                        >
                            <div className="flex items-center gap-2.5">
                                <Checkbox
                                    id="tax_required_checkbox"
                                    checked={taxRequired}
                                    onCheckedChange={(c) => onTaxRequiredChange(!!c)}
                                />
                                <span className="text-xs font-medium text-foreground select-none">
                                    Dikenakan Pajak (PPN/PPh)
                                </span>
                            </div>

                            <span className="text-[10px] font-bold text-muted-foreground">
                                {taxRequired ? 'Kena Pajak' : 'Bebas Pajak'}
                            </span>
                        </label>
                    ) : (
                        <span className={cn(
                            "inline-flex items-center gap-1.5 text-xs font-medium",
                            taxRequired ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-muted-foreground"
                        )}>
                            {taxRequired ? (
                                <>
                                    <CheckCircle2 size={13} className="shrink-0" />
                                    Dikenakan Pajak (PPN/PPh)
                                </>
                            ) : (
                                <>
                                    <XCircle size={13} className="shrink-0" />
                                    Tanpa Pajak
                                </>
                            )}
                        </span>
                    )}
                    {vendorTaxInfo.pkpStatus && vendorTaxInfo.pkpStatus !== '-' && (
                        <p className="text-[10px] text-muted-foreground italic">
                            * Pajak disinkronkan otomatis dari status PKP pihak kedua ({vendorTaxInfo.pkpStatus}).
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

