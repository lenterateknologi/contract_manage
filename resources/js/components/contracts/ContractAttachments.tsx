import { contractApi } from '@/lib/contract-api';
import { Contract, ContractAttachment } from '@/types/contracts';
import React, { useRef, useState } from 'react';

interface Props {
    contract: Contract;
    onUpdated: (c: Contract) => void;
    showToast: (msg: string, type: 'success' | 'danger') => void;
}

const CATEGORIES = [
    {
        id: 'perusahaan',
        label: 'Lampiran (Perusahaan)',
        items: [
            'Copy Akte Pendirian',
            'Copy Akte Perubahan Terakhir',
            'Copy TDP',
            'Copy SIUP / Izin BKPM',
            'Copy NPWP / PKP',
            'Copy Certificate of Domicile',
            'Asli Surat Kuasa',
            'Copy KTP / Passport Direksi',
            'Copy QCF / Bidding Price',
            'Copy BA Negosiasi',
        ],
    },
    {
        id: 'perorangan',
        label: 'Lampiran (Perorangan)',
        items: ['Copy KTP Suami/Istri', 'Copy Kartu Keluarga', 'Copy NPWP'],
    },
];

export default function ContractAttachments({ contract, onUpdated, showToast, onPreview }: Props & { onPreview: (at: ContractAttachment) => void }) {
    const [uploading, setUploading] = useState<string | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);
    const [activeLabel, setActiveLabel] = useState<string | null>(null);
    const [activeCat, setActiveCat] = useState<string | null>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !activeLabel || !activeCat) return;

        const fd = new FormData();
        fd.append('file', file);
        fd.append('label', activeLabel);
        fd.append('category', activeCat);

        setUploading(activeLabel);
        try {
            const updated = await contractApi.uploadAttachment(contract.id, fd);
            onUpdated(updated);
            showToast(`Berhasil mengupload ${activeLabel}`, 'success');
        } catch {
            showToast(`Gagal mengupload ${activeLabel}`, 'danger');
        } finally {
            setUploading(null);
            if (fileRef.current) fileRef.current.value = '';
        }
    };

    const handleDelete = async (atId: string, label: string) => {
        if (!confirm(`Hapus lampiran ${label}?`)) return;
        try {
            const updated = await contractApi.deleteAttachment(contract.id, atId);
            onUpdated(updated);
            showToast(`Berhasil menghapus ${label}`, 'success');
        } catch {
            showToast(`Gagal menghapus ${label}`, 'danger');
        }
    };

    const getAttachment = (label: string) => contract.attachments?.find((a) => a.label === label);

    return (
        <div className="space-y-8">
            <input type="file" ref={fileRef} className="hidden" onChange={handleFileChange} />

            {CATEGORIES.map((cat) => (
                <div key={cat.id}>
                    <h6 className="text-foreground mb-3 flex items-center gap-2 text-[12px] font-bold">
                        <div className="bg-primary h-1.5 w-1.5 rounded-full" />
                        {cat.label}
                    </h6>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        {cat.items.map((label) => {
                            const at = getAttachment(label);
                            const isUp = uploading === label;

                            return (
                                <div
                                    key={label}
                                    className={`flex items-center justify-between rounded-lg border p-3 transition-all ${at ? 'bg-primary/5 border-primary/20 dark:bg-primary/10 dark:border-primary/20' : 'bg-card border-border'}`}
                                >
                                    <div className="flex min-w-0 items-center gap-3">
                                        <div
                                            className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${at ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}
                                        >
                                            <i className={at ? 'fa-solid fa-file-circle-check' : 'fa-regular fa-file'} />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-foreground/80 truncate text-[12px] font-medium" title={label}>
                                                {label}
                                            </div>
                                            {at ? (
                                                <div className="text-muted-foreground mt-0.5 truncate text-[10px]">
                                                    {at.file_name} · {at.created_at}
                                                </div>
                                            ) : (
                                                <div className="text-muted-foreground/50 mt-0.5 text-[10px]">Belum ada dokumen</div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="ml-3 flex flex-shrink-0 items-center gap-1.25">
                                        {at ? (
                                            <>
                                                <button
                                                    onClick={() => onPreview(at)}
                                                    className="hover:bg-primary/10 text-primary/70 hover:text-primary flex h-7 w-7 items-center justify-center rounded-md transition-colors"
                                                    title="Preview"
                                                >
                                                    <i className="fa-solid fa-eye text-[11px]" />
                                                </button>
                                                <a
                                                    href={contractApi.attachmentDownloadUrl(contract.id, at.id)}
                                                    download
                                                    className="hover:bg-primary/10 text-primary/70 hover:text-primary flex h-7 w-7 items-center justify-center rounded-md transition-colors"
                                                    title="Download"
                                                >
                                                    <i className="fa-solid fa-download text-[11px]" />
                                                </a>
                                                <button
                                                    onClick={() => handleDelete(at.id, label)}
                                                    className="hover:bg-destructive/10 text-destructive/70 hover:text-destructive flex h-7 w-7 items-center justify-center rounded-md transition-colors"
                                                    title="Delete"
                                                >
                                                    <i className="fa-solid fa-trash-can text-[11px]" />
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                disabled={!!uploading}
                                                onClick={() => {
                                                    setActiveLabel(label);
                                                    setActiveCat(cat.id);
                                                    fileRef.current?.click();
                                                }}
                                                className="bg-muted hover:bg-primary text-muted-foreground hover:text-primary-foreground flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[10px] font-semibold transition-all disabled:opacity-50"
                                            >
                                                {isUp ? <i className="fa-solid fa-spinner fa-spin" /> : <i className="fa-solid fa-plus" />}
                                                Upload
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}
