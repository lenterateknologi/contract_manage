import React, { useState, useEffect } from 'react';
import { Contract, ContractType } from '@/types/contracts';

interface EditContractModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    contract: Contract | null;
    types: ContractType[];
    vendors?: any[];
    processing: boolean;
}

export function EditContractModal({
    open,
    onClose,
    onSubmit,
    contract,
    types,
    vendors = [],
    processing,
}: EditContractModalProps) {
    const [title, setTitle] = useState('');
    const [contractNo, setContractNo] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState('');
    const [typeId, setTypeId] = useState('');
    const [vendorId, setVendorId] = useState('');

    useEffect(() => {
        if (open && contract) {
            setTitle(contract.title);
            setContractNo(contract.contract_no);
            setDescription(contract.description || '');
            setDate(contract.contract_date || '');
            const t = types.find((x) => x.name === contract.contract_type);
            setTypeId(t ? String(t.id) : '');
            setVendorId((contract as any).vendor_id || '');
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
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-muted-foreground mb-1.5 block text-xs font-bold uppercase">No. Kontrak</label>
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
                            <label className="text-muted-foreground mb-1.5 block text-xs font-bold uppercase">Pihak Kedua (Vendor)</label>
                            <select
                                value={vendorId}
                                onChange={(e) => setVendorId(e.target.value)}
                                className="bg-muted/30 border-border focus:border-primary/50 w-full rounded-lg border px-3 py-2 text-sm transition-all outline-none font-bold text-indigo-600"
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
                        <button
                            onClick={onClose}
                            className="border-border hover:bg-muted flex-1 rounded-xl border py-2.5 text-sm font-bold transition-all"
                        >
                            Batal
                        </button>
                        <button
                            onClick={() => onSubmit({ title, contract_no: contractNo, description, contract_date: date, contract_type_id: typeId, vendor_id: vendorId })}
                            disabled={processing || !title}
                            className="bg-primary text-primary-foreground shadow-primary/20 hover:shadow-primary/30 flex-1 rounded-xl py-2.5 text-sm font-bold shadow-lg transition-all active:scale-[0.98] disabled:opacity-50"
                        >
                            {processing ? <i className="fa-solid fa-spinner fa-spin mr-2" /> : <i className="fa-solid fa-save mr-2" />}
                            Simpan Perubahan
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
