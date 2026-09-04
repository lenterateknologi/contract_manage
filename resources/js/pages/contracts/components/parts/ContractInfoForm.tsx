import React from 'react';
import { ContractType } from '@/pages/contracts/types';
import { Input } from '@/components/ui/inputs/Input';
import { SearchableSelect } from '@/components/ui/selection/SearchableSelect';
import { TreeSelect } from '@/components/ui/selection/TreeSelect';
import { Checkbox } from '@/components/ui/selection/Checkbox';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/formatters';
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
} from 'lucide-react';

interface ContractInfoFormProps {
    isDraft: boolean;
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
}

const FieldLabel = ({ icon: Icon, children }: { icon?: any; children: React.ReactNode }) => (
    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {Icon && <Icon size={12} className="text-muted-foreground/80 shrink-0" />}
        <span>{children}</span>
    </div>
);

export const MetaBadge = () => null;

export function ContractInfoForm({
    isDraft,
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
}: ContractInfoFormProps) {
    const vendorOptions = Array.isArray(vendors)
        ? vendors.map((v) => ({ value: String(v.id), label: v.name }))
        : [];

    const formattedPrice = React.useMemo(() => {
        const val = price || (selected.metadata?.meta_harga ?? selected.metadata?.f2_price ?? selected.meta?.f2_price);
        if (val === undefined || val === null || val === '') return null;
        const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^\d.]/g, ''));
        return isNaN(num)
            ? String(val)
            : new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
    }, [price, selected]);

    // ── READ-ONLY PRESENTATION (WHEN NOT EDITABLE) ──
    if (!isDraft) {
        return (
            <div className="flex flex-col">
                {/* 1. Judul Kontrak */}
                {selected.show_title !== false && (
                    <div className="pb-3 mb-1 border-b border-border/60 flex flex-col gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Judul Pengajuan
                        </span>
                        <p className="text-xs font-semibold text-foreground leading-relaxed">
                            {title || selected.title || '—'}
                        </p>
                    </div>
                )}

                {/* 2. Key-Value List */}
                <div className="divide-y divide-border/40 text-xs">
                    {/* No. Kontrak F2 */}
                    {selected.show_f2_contract_no !== false && (
                        <div className="py-2.5 flex items-center justify-between gap-3">
                            <FieldLabel icon={Hash}>No. Kontrak</FieldLabel>
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
                            <FieldLabel icon={Tag}>Kategori Dokumen</FieldLabel>
                            <span className="font-semibold text-foreground text-right">
                                {selected.contract_type || '—'}
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
                            <FieldLabel icon={Building2}>Pihak Kedua (Vendor)</FieldLabel>
                            <span className="font-semibold text-foreground text-right truncate max-w-[220px]">
                                {selected.vendor?.name || 'Tanpa Vendor'}
                            </span>
                        </div>
                    )}

                    {/* Masa Berlaku */}
                    {selected.show_period !== false && (
                        <div className="py-2.5 flex items-center justify-between gap-3">
                            <FieldLabel icon={Calendar}>Masa Berlaku</FieldLabel>
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
                            <FieldLabel icon={Coins}>Nilai Kontrak</FieldLabel>
                            <span className="font-mono font-bold text-foreground text-right">
                                {formattedPrice || '—'}
                            </span>
                        </div>
                    )}

                    {/* Ketentuan Pajak */}
                    {selected.show_tax_toggle !== false && (
                        <div className="py-2.5 flex items-center justify-between gap-3">
                            <FieldLabel icon={Receipt}>Pajak</FieldLabel>
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
            {/* Judul Kontrak */}
            {selected.show_title !== false && (
                <div className="flex flex-col gap-1.5">
                    <FieldLabel icon={FileText}>Judul Kontrak</FieldLabel>
                    <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Masukkan judul kontrak..."
                        size="sm"
                    />
                </div>
            )}

            {/* No. Kontrak F2 */}
            {selected.show_f2_contract_no !== false && (
                <div className="flex flex-col gap-1.5">
                    <FieldLabel icon={Hash}>No. Kontrak (F2)</FieldLabel>
                    {selected.allow_f2_contract_no_edit !== false ? (
                        <Input
                            value={contractNo}
                            onChange={(e) => setContractNo(e.target.value)}
                            placeholder="Nomor kontrak F2..."
                            size="sm"
                        />
                    ) : (
                        <span className="font-mono text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-lg w-fit">
                            {selected.contract_no || 'Belum diterbitkan'}
                        </span>
                    )}
                </div>
            )}

            {/* Pihak Kedua (Vendor) */}
            {selected.show_vendor !== false && (
                <div className="flex flex-col gap-1.5">
                    <FieldLabel icon={Building2}>Pihak Kedua (Vendor)</FieldLabel>
                    <SearchableSelect
                        value={vendorId}
                        onValueChange={setVendorId}
                        options={vendorOptions}
                        placeholder="Pilih Vendor"
                        searchPlaceholder="Cari vendor..."
                    />
                </div>
            )}

            {/* Kategori Kontrak */}
            {selected.show_category !== false && (
                <div className="flex flex-col gap-1.5">
                    <FieldLabel icon={Tag}>Kategori Kontrak</FieldLabel>
                    <TreeSelect
                        value={typeId}
                        onValueChange={(val) => setTypeId(val)}
                        items={types}
                        placeholder="Pilih Kategori"
                        disableParentSelection={true}
                    />
                </div>
            )}

            {/* Alur Kerja (Workflow) Info */}
            <div className="flex flex-col gap-1.5">
                <FieldLabel icon={GitBranch}>Alur Kerja</FieldLabel>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-muted/30 text-xs font-medium text-foreground">
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                        {selected.workflow?.name || selected.workflow_step?.workflow?.name || 'Alur Standar'}
                    </span>
                    {selected.workflow_step?.step && (
                        <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded ml-auto">
                            Tahap {selected.workflow_step.step}: {selected.workflow_step.name || selected.workflow_step.label || 'Berjalan'}
                        </span>
                    )}
                </div>
            </div>

            {/* Masa Berlaku Kontrak */}
            {selected.show_period !== false && (
                <div className="flex flex-col gap-1.5">
                    <FieldLabel icon={Calendar}>Masa Berlaku Kontrak</FieldLabel>
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
                </div>
            )}

            {/* Nilai / Harga Kontrak */}
            {selected.show_price !== false && (
                <div className="flex flex-col gap-1.5">
                    <FieldLabel icon={Coins}>Nilai / Harga Kontrak</FieldLabel>
                    <Input
                        value={(() => {
                            if (!price) return '';
                            const clean = String(price).replace(/\D/g, '');
                            if (!clean) return '';
                            return new Intl.NumberFormat('id-ID').format(parseInt(clean, 10));
                        })()}
                        onChange={(e) => {
                            const raw = e.target.value.replace(/\D/g, '');
                            setPrice(raw);
                        }}
                        placeholder="Contoh: 510.000.000..."
                        size="sm"
                    />
                </div>
            )}

            {/* Pajak */}
            {selected.show_tax_toggle !== false && (
                <div className="flex flex-col gap-1.5">
                    <FieldLabel icon={Receipt}>Penentuan Pajak</FieldLabel>
                    <label
                        htmlFor="tax_required_checkbox"
                        className="flex items-center gap-2.5 cursor-pointer rounded-xl border border-border bg-muted/30 px-3.5 py-2.5 hover:bg-muted/60 transition-colors"
                    >
                        <Checkbox
                            id="tax_required_checkbox"
                            checked={taxRequired}
                            onCheckedChange={(c) => onTaxRequiredChange(!!c)}
                        />
                        <span className="text-xs font-medium text-foreground select-none">
                            Dikenakan Pajak (PPN/PPh)
                        </span>
                    </label>
                </div>
            )}
        </div>
    );
}
