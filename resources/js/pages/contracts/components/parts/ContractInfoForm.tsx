import { ContractType } from '@/pages/contracts/types';
import { Input } from '@/components/ui/inputs/Input';
import { SearchableSelect } from '@/components/ui/selection/SearchableSelect';

// --- CONFIGURATION ---
const SHOW_META_KEYS = true; // Set to false to hide technical keys from the UI
// -------------------

interface ContractInfoFormProps {
    isDraft: boolean;
    title: string;
    setTitle: (val: string) => void;
    crownNo: string;
    setCrownNo: (val: string) => void;
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
}

export function ContractInfoForm({
    isDraft,
    title,
    setTitle,
    crownNo,
    setCrownNo,
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
}: ContractInfoFormProps) {
    const MetaBadge = ({ name }: { name: string }) => {
        if (!SHOW_META_KEYS) return null;

        return (
            <span className="text-primary bg-primary/5 border-primary/10 rounded-sm border px-1.5 py-0.5 font-mono text-[8px] tracking-tighter uppercase opacity-70">
                KEY: {name}
            </span>
        );
    };

    return (
        <>
            <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                    <div className="text-text-desc text-[10px] font-bold tracking-widest uppercase">No. Kontrak (F2)</div>
                    <MetaBadge name="crown_no" />
                </div>
                {selected.workflow_step?.meta?.allow_f2_edit === true ? (
                    <Input
                        value={crownNo}
                        onChange={(e) => setCrownNo(e.target.value)}
                        placeholder="Masukkan nomor kontrak F2..."
                        className={inputCls}
                    />
                ) : (
                    <div className="text-primary text-sm font-bold">
                        {selected.crown_no || <span className="text-text-soft/40 text-xs font-medium italic">Belum diisi</span>}
                    </div>
                )}
            </div>

            {isDraft ? (
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                        <div className="text-text-desc text-[10px] font-bold tracking-widest uppercase">Judul Kontrak</div>
                        <MetaBadge name="meta_judul_kontrak" />
                    </div>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Masukkan nama kontrak..." className={inputCls} />
                </div>
            ) : null}

            <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                    <div className="text-text-desc text-[10px] font-bold tracking-widest uppercase">Jenis Kontrak</div>
                    <MetaBadge name="meta_jenis_kontrak" />
                </div>
                {isDraft ? (
                    <SearchableSelect
                        value={typeId}
                        onValueChange={setTypeId}
                        options={Array.isArray(types) ? types.map(t => ({ value: String(t.id), label: t.name })) : []}
                        placeholder="Pilih Tipe"
                    />
                ) : (
                    <div className="text-text-main text-sm font-semibold">{selected.contract_type}</div>
                )}
            </div>

            <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                    <div className="text-text-desc text-[10px] font-bold tracking-widest uppercase">Perjanjian</div>
                    <MetaBadge name="meta_tipe_perjanjian" />
                </div>
                {isDraft ? (
                    <SearchableSelect
                        value={submissionTypeId}
                        onValueChange={setSubmissionTypeId}
                        options={Array.isArray(submissionTypes) ? submissionTypes.map(st => ({ value: String(st.id), label: st.name })) : []}
                        placeholder="Pilih Tipe"
                    />
                ) : (
                    <div className="text-text-main text-sm font-semibold">{selected.submission_type || '—'}</div>
                )}
            </div>

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
        </>
    );
}
