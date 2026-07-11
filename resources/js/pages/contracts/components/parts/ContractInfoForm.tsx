import { ContractType } from '@/pages/contracts/types';
import { Input } from '@/components/ui/inputs/Input';
import { SearchableSelect } from '@/components/ui/selection/SearchableSelect';
import { TreeSelect } from '@/components/ui/selection/TreeSelect';
import { Checkbox } from '@/components/ui/selection/Checkbox';
import { useMemo } from 'react';

// --- CONFIGURATION ---
const SHOW_META_KEYS = true; // Set to false to hide technical keys from the UI
// -------------------

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
    const MetaBadge = ({ name }: { name: string }) => {
        if (!SHOW_META_KEYS) return null;

        return (
            <span className="text-primary bg-primary/5 border-primary/10 rounded-sm border px-1.5 py-0.5 font-mono text-[8px] tracking-tighter uppercase opacity-70">
                KEY: {name}
            </span>
        );
    };

    const availableSubmissionTypes = useMemo(() => {
        if (!typeId || !Array.isArray(types)) return [];
        const selectedType = types.find((t) => String(t.id) === String(typeId));
        return selectedType?.submission_types || [];
    }, [typeId, types]);

    return (
        <>
            {selected.show_f2_contract_no !== false && (
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                        <div className="text-text-desc text-[10px] font-bold tracking-widest uppercase">No. Kontrak (F2)</div>
                        <MetaBadge name="contract_no" />
                    </div>
                    {selected.allow_f2_edit === true ? (
                        <Input
                            value={contractNo}
                            onChange={(e) => setContractNo(e.target.value)}
                            placeholder="Masukkan nomor kontrak F2..."
                            className={inputCls}
                        />
                    ) : (
                        <div className="text-primary text-sm font-bold">
                            {selected.contract_no || <span className="text-text-soft/40 text-xs font-medium italic">Belum diisi</span>}
                        </div>
                    )}
                </div>
            )}



            <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                    <div className="text-text-desc text-[10px] font-bold tracking-widest uppercase">Pihak Kedua (Vendor)</div>
                    <MetaBadge name="meta_vendor_name" />
                </div>
                {isDraft ? (
                    <SearchableSelect
                        value={vendorId}
                        onValueChange={setVendorId}
                        options={Array.isArray(vendors) ? vendors.map(v => ({ value: String(v.id), label: v.name })) : []}
                        placeholder="Pilih Vendor"
                    />
                ) : (
                    <div className="text-text-main text-sm font-semibold">{selected.vendor?.name || '-'}</div>
                )}
            </div>

            {selected.show_tax_toggle !== false && (
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                        <div className="text-text-desc text-[10px] font-bold tracking-widest uppercase">Penentuan Pajak</div>
                        <MetaBadge name="meta_tax_required" />
                    </div>
                    {isDraft ? (
                        <div className="flex items-center gap-2 rounded-lg border border-surface-border bg-surface-muted/10 px-3 py-2.5">
                            <Checkbox
                                id="tax_required_checkbox"
                                checked={taxRequired}
                                onCheckedChange={(c) => onTaxRequiredChange(!!c)}
                            />
                            <label htmlFor="tax_required_checkbox" className="text-sm font-medium text-text-main cursor-pointer select-none">
                                Dikenakan Pajak (PPN/PPh)
                            </label>
                        </div>
                    ) : (
                        <div className="text-text-main text-sm font-semibold">
                            {taxRequired ? 'Ya (Dikenakan Pajak)' : 'Tidak (Tanpa Pajak)'}
                        </div>
                    )}
                </div>
            )}

            <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                    <div className="text-text-desc text-[10px] font-bold tracking-widest uppercase">Kategori Kontrak</div>
                </div>
                <div className="text-text-main text-sm font-semibold">{selected.contract_type || '—'}</div>
            </div>

            <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                    <div className="text-text-desc text-[10px] font-bold tracking-widest uppercase font-sans">Formulir Pengajuan</div>
                </div>
                <div className="text-text-main text-sm font-semibold">{selected.submission_type || '—'}</div>
            </div>
        </>
    );
}
