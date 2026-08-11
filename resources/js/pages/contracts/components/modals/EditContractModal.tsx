import { Button } from '@/components/ui/buttons/Button';
import { FormInput } from '@/components/ui/inputs/FormInput';
import { FormTextarea } from '@/components/ui/inputs/FormTextarea';
import { PortalSelect } from '@/components/ui/selection/PortalSelect';
import { TreeSelect } from '@/components/ui/selection/TreeSelect';
import { Modal } from '@/components/ui/dialogs/Modal';
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
    const [formNo, setFormNo] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState('');
    const [typeId, setTypeId] = useState('');
    const [submissionTypeId, setSubmissionTypeId] = useState('');
    const [vendorId, setVendorId] = useState('');

    useEffect(() => {
        if (open && contract) {
            setTitle(contract.title);
            setFormNo(contract.form_no);
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
            form_no: formNo,
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
            headerVariant="primary"
            headerIcon={<FileEdit size={18} />}
            title="Edit Informasi Kontrak"
            description="Perbarui data dan informasi kontrak"
            maxWidth="2xl"
            footer={
                <div className="flex w-full justify-end gap-2.5">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        disabled={processing}
                        className="h-9 text-xs bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-800/50 font-semibold"
                    >
                        Batal
                    </Button>
                    <Button onClick={handleSubmit} disabled={processing || !title} className="min-w-[140px] h-9 text-xs">
                        {processing ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Check size={15} className="mr-1.5" />}
                        Simpan Perubahan
                    </Button>
                </div>
            }
        >
            <div className="space-y-3.5 pt-1">
                <FormInput
                    label="Judul Kontrak"
                    labelClassName="font-extrabold text-[10.5px] uppercase"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Masukkan judul kontrak"
                    required
                />

                <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
                    <FormInput
                        label="No. Pengajuan"
                        labelClassName="font-extrabold text-[10.5px] uppercase"
                        value={formNo}
                        onChange={(e) => setFormNo(e.target.value)}
                        placeholder="CTR/2026/..."
                    />
                    <FormInput
                        label="Tanggal"
                        labelClassName="font-extrabold text-[10.5px] uppercase"
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-slate-700 dark:text-zinc-200 text-[10.5px] font-extrabold uppercase">Klasifikasi & Jenis Dokumen</label>
                    <TreeSelect value={typeId} onValueChange={(val) => setTypeId(val)} items={types} placeholder="Pilih Tipe Kontrak" />
                </div>

                <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
                    <div className="space-y-1">
                        <label className="text-slate-700 dark:text-zinc-200 text-[10.5px] font-extrabold uppercase">Jenis Perjanjian</label>
                        <PortalSelect
                            value={submissionTypeId}
                            onValueChange={(val) => setSubmissionTypeId(val)}
                            options={submissionTypes.map((st) => ({ value: String(st.id), label: st.name }))}
                            placeholder="Pilih Tipe"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-slate-700 dark:text-zinc-200 text-[10.5px] font-extrabold uppercase">Pihak Kedua (Vendor)</label>
                        <PortalSelect
                            value={vendorId}
                            onValueChange={(val) => setVendorId(val)}
                            options={vendors.map((v) => ({ value: String(v.id), label: v.name }))}
                            placeholder="Pilih Vendor"
                        />
                    </div>
                </div>

                <FormTextarea
                    label="Deskripsi"
                    labelClassName="font-extrabold text-[10.5px] uppercase"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Penjelasan singkat kontrak..."
                    rows={3}
                />
            </div>
        </Modal>
    );
}
