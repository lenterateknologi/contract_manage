import React from 'react';
import { ContractType } from '@/pages/contracts/types';
import { Input } from '@/components/ui/inputs/Input';
import { SearchableSelect } from '@/components/ui/selection/SearchableSelect';
import { TreeSelect } from '@/components/ui/selection/TreeSelect';
import { Checkbox } from '@/components/ui/selection/Checkbox';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/formatters';

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

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
    <span className="text-[10px] font-bold uppercase tracking-wider text-foreground">{children}</span>
);

const ReadonlyValue = ({ value, empty = 'Belum diisi' }: { value?: string | null; empty?: string }) => (
    <span className={cn('text-sm font-semibold', value ? 'text-text-main' : 'text-text-soft/40 italic text-xs')}>
        {value || empty}
    </span>
);

const FieldRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="flex flex-col gap-1">
        <FieldLabel>{label}</FieldLabel>
        {children}
    </div>
);

// Keep MetaBadge export for backward compat
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

    return (
        <div className="flex flex-col gap-3">
            {/* Judul Kontrak */}
            {selected.show_title !== false && (
                <FieldRow label="Judul Kontrak">
                    {isDraft && selected.allow_title_edit !== false ? (
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Masukkan judul kontrak..."
                            size="sm"
                        />
                    ) : (
                        <ReadonlyValue value={title} />
                    )}
                </FieldRow>
            )}

            {/* No. Kontrak F2 */}
            {selected.show_f2_contract_no !== false && (
                <FieldRow label="No. Kontrak (F2)">
                    {selected.allow_f2_contract_no_edit !== false && (isDraft || selected.allow_f2_edit === true) ? (
                        <Input
                            value={contractNo}
                            onChange={(e) => setContractNo(e.target.value)}
                            placeholder="Nomor kontrak F2..."
                            size="sm"
                        />
                    ) : (
                        <ReadonlyValue value={selected.contract_no} />
                    )}
                </FieldRow>
            )}

            {/* Pihak Kedua (Vendor) */}
            {selected.show_vendor !== false && (
                <FieldRow label="Pihak Kedua (Vendor)">
                    {isDraft && selected.allow_vendor_edit !== false ? (
                        <SearchableSelect
                            value={vendorId}
                            onValueChange={setVendorId}
                            options={vendorOptions}
                            placeholder="Pilih Vendor"
                            searchPlaceholder="Cari vendor..."
                        />
                    ) : (
                        <ReadonlyValue value={selected.vendor?.name} />
                    )}
                </FieldRow>
            )}

            {/* Kategori Kontrak — tree style dengan search */}
            {selected.show_category !== false && (
                <FieldRow label="Kategori Kontrak">
                    {isDraft && selected.allow_category_edit !== false ? (
                        <TreeSelect
                            value={typeId}
                            onValueChange={(val) => setTypeId(val)}
                            items={types}
                            placeholder="Pilih Kategori"
                            disableParentSelection={true}
                        />
                    ) : (
                        <ReadonlyValue value={selected.contract_type} />
                    )}
                </FieldRow>
            )}

            {/* Masa Berlaku Kontrak */}
            {selected.show_period !== false && (
                <FieldRow label="Masa Berlaku Kontrak">
                    {isDraft && selected.allow_period_edit !== false ? (
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
                        <ReadonlyValue
                            value={
                                selected.contract_date || selected.end_date
                                    ? `${selected.contract_date ? formatDate(selected.contract_date) : '-'} s/d ${selected.end_date ? formatDate(selected.end_date) : '-'}`
                                    : null
                            }
                        />
                    )}
                </FieldRow>
            )}

            {/* Nilai / Harga Kontrak */}
            {selected.show_price !== false && (
                <FieldRow label="Nilai / Harga Kontrak">
                    {isDraft && selected.allow_price_edit !== false ? (
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
                    ) : (
                        <ReadonlyValue
                            value={(() => {
                                const val = price || (selected.metadata?.meta_harga ?? selected.metadata?.f2_price ?? selected.meta?.f2_price);
                                if (val === undefined || val === null || val === '') return null;
                                const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^\d.]/g, ''));
                                return isNaN(num) ? String(val) : new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
                            })()}
                        />
                    )}
                </FieldRow>
            )}

            {/* Pajak */}
            {selected.show_tax_toggle !== false && (
                <FieldRow label="Penentuan Pajak">
                    {isDraft ? (
                        <label
                            htmlFor="tax_required_checkbox"
                            className="flex items-center gap-2.5 cursor-pointer rounded-lg border border-surface-border bg-surface-muted/30 px-3 py-2 hover:bg-surface-muted/60 transition-colors"
                        >
                            <Checkbox
                                id="tax_required_checkbox"
                                checked={taxRequired}
                                onCheckedChange={(c) => onTaxRequiredChange(!!c)}
                            />
                            <span className="text-xs font-medium text-text-main select-none">
                                Dikenakan Pajak (PPN/PPh)
                            </span>
                        </label>
                    ) : (
                        <ReadonlyValue value={taxRequired ? 'Ya (Dikenakan Pajak)' : 'Tidak (Tanpa Pajak)'} />
                    )}
                </FieldRow>
            )}
        </div>
    );
}
