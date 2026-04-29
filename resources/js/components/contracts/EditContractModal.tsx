import { Contract, ContractType } from '@/types/contracts';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

interface EditContractModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    contract: Contract | null;
    types: ContractType[];
    submissionTypes: any[];
    vendors?: any[];
    processing: boolean;
}

export function EditContractModal({
    open,
    onClose,
    onSubmit,
    contract,
    types,
    submissionTypes = [],
    vendors = [],
    processing,
}: EditContractModalProps) {
    const [title, setTitle] = useState('');
    const [contractNo, setContractNo] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState('');
    const [typeId, setTypeId] = useState('');
    const [submissionTypeId, setSubmissionTypeId] = useState('');
    const [vendorId, setVendorId] = useState('');
    const [crownNo, setCrownNo] = useState('');

    useEffect(() => {
        if (open && contract) {
            setTitle(contract.title);
            setContractNo(contract.contract_no);
            setDescription(contract.description || '');
            setDate(contract.contract_date ? contract.contract_date.split('T')[0] : '');
            const t = types.find((x) => x.name === contract.contract_type);
            setTypeId(t ? String(t.id) : '');
            setSubmissionTypeId(contract.submission_type_id || '');
            setVendorId((contract as any).vendor_id || '');
            setCrownNo(contract.crown_no || '');
        }
    }, [open, contract, types]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="bg-card border-border scale-in-center w-full max-w-lg overflow-hidden rounded-2xl border shadow-2xl">
                <div className="border-border/50 flex items-center justify-between border-b" style={{ padding: '16px 20px' }}>
                    <h3 className="text-foreground font-bold" style={{ fontSize: 16 }}>
                        Edit Informasi Kontrak
                    </h3>
                    <button
                        onClick={onClose}
                        className="hover:bg-muted text-muted-foreground flex h-8 w-8 items-center justify-center rounded-full transition-colors"
                    >
                        <i className="fa-solid fa-xmark" />
                    </button>
                </div>
                <div style={{ padding: 20 }}>
                    <div className="space-y-4">
                        <div>
                            <label className="text-muted-foreground mb-1.5 block text-xs font-bold uppercase">Judul Kontrak</label>
                            <input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Contoh: Perjanjian Kerjasama Jasa IT"
                                className="bg-muted/30 border-border focus:border-primary/50 w-full rounded-lg border px-3 py-2 text-sm font-medium transition-all outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-muted-foreground mb-1.5 block text-xs font-bold uppercase">No. Pengajuan</label>
                            <input
                                value={contractNo}
                                onChange={(e) => setContractNo(e.target.value)}
                                placeholder="CTR/2026/..."
                                className="bg-muted/30 border-border focus:border-primary/50 w-full rounded-lg border px-3 py-2 font-mono text-sm transition-all outline-none"
                            />
                        </div>

                        <div>
                            <label className="text-muted-foreground mb-1.5 block text-xs font-bold uppercase">Tanggal</label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="bg-muted/30 border-border focus:border-primary/50 w-full rounded-lg border px-3 py-2 text-sm transition-all outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-muted-foreground mb-1.5 block text-xs font-bold uppercase">Tipe Kontrak</label>
                            <select
                                value={typeId}
                                onChange={(e) => setTypeId(e.target.value)}
                                className="bg-muted/30 border-border focus:border-primary/50 w-full rounded-lg border px-3 py-2 text-sm transition-all outline-none"
                            >
                                <option value="">Pilih Tipe</option>
                                {types.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {t.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-muted-foreground mb-1.5 block text-xs font-bold uppercase">Perjanjian</label>
                            <select
                                value={submissionTypeId}
                                onChange={(e) => setSubmissionTypeId(e.target.value)}
                                className="bg-muted/30 border-border focus:border-primary/50 w-full rounded-lg border px-3 py-2 text-sm transition-all outline-none"
                            >
                                <option value="">Pilih Tipe</option>
                                {submissionTypes.map((st) => (
                                    <option key={st.id} value={st.id}>
                                        {st.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-muted-foreground mb-1.5 block text-xs font-bold uppercase">Pihak Kedua (Vendor)</label>
                            <select
                                value={vendorId}
                                onChange={(e) => setVendorId(e.target.value)}
                                className="bg-muted/30 border-border focus:border-primary/50 w-full rounded-lg border px-3 py-2 text-sm font-bold text-indigo-600 transition-all outline-none"
                            >
                                <option value="">Pilih Vendor</option>
                                {vendors.map((v) => (
                                    <option key={v.id} value={v.id}>
                                        {v.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-muted-foreground mb-1.5 block text-xs font-bold uppercase">Deskripsi</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                placeholder="Penjelasan singkat kontrak..."
                                className="bg-muted/30 border-border focus:border-primary/50 w-full resize-none rounded-lg border px-3 py-2 text-sm transition-all outline-none"
                            />
                        </div>
                    </div>
                    <div className="mt-8 flex gap-3">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="flex-1 rounded-lg h-11 text-[11px] font-black uppercase tracking-widest transition-all"
                        >
                            Batal
                        </Button>
                        <Button
                            onClick={() =>
                                onSubmit({
                                    title,
                                    contract_no: contractNo,
                                    description,
                                    contract_date: date,
                                    contract_type_id: typeId,
                                    submission_type_id: submissionTypeId,
                                    vendor_id: vendorId,
                                })
                            }
                            disabled={processing || !title}
                            className="flex-1 rounded-lg h-11 text-[11px] font-black uppercase tracking-widest shadow-lg active:scale-95 disabled:opacity-50"
                        >
                            {processing ? <i className="fa-solid fa-spinner fa-spin mr-2" /> : <i className="fa-solid fa-save mr-2" />}
                            Simpan Perubahan
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
