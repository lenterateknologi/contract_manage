import { Button } from '@/components/ui/base/Button';
import { FormInput } from '@/components/ui/forms/FormInput';
import { FormTextarea } from '@/components/ui/forms/FormTextarea';
import { PortalSelect } from '@/components/ui/forms/PortalSelect';
import { TreeSelect } from '@/components/ui/forms/TreeSelect';
import { Modal } from '@/components/ui/overlays/Modal';
import { Contract, ContractType } from '@/pages/contracts/types';
import { Check, FileEdit, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

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
        }
    }, [open, contract, types]);

    const handleSubmit = () => {
        onSubmit({
            title,
            contract_no: contractNo,
            description,
            contract_date: date,
            contract_type_id: typeId,
            submission_type_id: submissionTypeId,
            vendor_id: vendorId,
        });
    };

    return (
        <Modal
            isOpen={open}
            onClose={onClose}
            title={
                <div className="flex items-center gap-3">
                    <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-xl">
                        <FileEdit size={20} className="text-primary" />
                    </div>
                    <span>Edit Informasi Kontrak</span>
                </div>
            }
            maxWidth="5xl"
            footer={
                <div className="flex w-full justify-end gap-3">
                    <Button variant="ghost" onClick={onClose} disabled={processing}>
                        Batal
                    </Button>
                    <Button onClick={handleSubmit} disabled={processing || !title} className="min-w-[140px]">
                        {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check size={16} className="mr-2" />}
                        Simpan Perubahan
                    </Button>
                </div>
            }
        >
            <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <FormInput
                        label="Judul Kontrak *"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Masukkan judul kontrak"
                        required
                    />
                    <FormInput label="No. Pengajuan" value={contractNo} onChange={(e) => setContractNo(e.target.value)} placeholder="CTR/2026/..." />
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <div className="space-y-1.5">
                        <label className="text-muted-foreground text-[11px] font-bold  uppercase">Tipe Kontrak</label>
                        <TreeSelect value={typeId} onValueChange={(val) => setTypeId(val)} items={types} placeholder="Pilih Tipe Kontrak" />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-muted-foreground text-[11px] font-bold  uppercase">Perjanjian</label>
                        <PortalSelect
                            value={submissionTypeId}
                            onValueChange={(val) => setSubmissionTypeId(val)}
                            options={submissionTypes.map((st) => ({ value: String(st.id), label: st.name }))}
                            placeholder="Pilih Tipe"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-muted-foreground text-[11px] font-bold  uppercase">Pihak Kedua (Vendor)</label>
                        <PortalSelect
                            value={vendorId}
                            onValueChange={(val) => setVendorId(val)}
                            options={vendors.map((v) => ({ value: String(v.id), label: v.name }))}
                            placeholder="Pilih Vendor"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <FormInput label="Tanggal" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>

                <FormTextarea
                    label="Deskripsi"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Penjelasan singkat kontrak..."
                    rows={3}
                />
            </div>
        </Modal>
    );
}
