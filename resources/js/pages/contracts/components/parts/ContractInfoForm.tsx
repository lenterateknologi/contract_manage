import React from 'react';
import { ContractType } from '@/pages/contracts/types';
import { Input } from '@/components/ui/inputs/Input';
import { SearchableSelect } from '@/components/ui/selection/SearchableSelect';
import { TreeSelect } from '@/components/ui/selection/TreeSelect';
import { Checkbox } from '@/components/ui/selection/Checkbox';
import { cn } from '@/lib/utils';

interface ContractInfoFormProps {
    isDraft: boolean;
    title: string;
    setTitle: (val: string) => void;
    contractNo: string;
    setContractNo: (val: string) => void;
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
            <FieldRow label="Judul Kontrak">
                {isDraft ? (
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

            {/* No. Kontrak F2 */}
            {selected.show_f2_contract_no !== false && (
                <FieldRow label="No. Kontrak (F2)">
                    {selected.allow_f2_edit === true ? (
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
            <FieldRow label="Pihak Kedua (Vendor)">
                {isDraft ? (
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

            {/* Kategori Kontrak — tree style dengan search */}
            <FieldRow label="Kategori Kontrak">
                {isDraft ? (
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
