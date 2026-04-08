import React, { useRef, useState } from 'react';
import { Contract, ContractAttachment } from '@/types/contracts';
import { contractApi } from '@/lib/contract-api';
import { Avatar } from '@/components/contracts/ui';

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
            'Copy BA Negosiasi'
        ]
    },
    {
        id: 'perorangan',
        label: 'Lampiran (Perorangan)',
        items: ['Copy KTP Suami/Istri', 'Copy Kartu Keluarga', 'Copy NPWP']
    }
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

    const getAttachment = (label: string) => contract.attachments?.find(a => a.label === label);

    return (
        <div className="space-y-8">
            <input type="file" ref={fileRef} className="hidden" onChange={handleFileChange} />

            {CATEGORIES.map(cat => (
                <div key={cat.id}>
                    <h6 className="text-[12px] font-bold text-foreground mb-3 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {cat.label}
                    </h6>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {cat.items.map(label => {
                            const at = getAttachment(label);
                            const isUp = uploading === label;

                            return (
                                <div key={label} className={`flex items-center justify-between p-3 rounded-lg border transition-all ${at ? 'bg-primary/5 border-primary/20 dark:bg-primary/10 dark:border-primary/20' : 'bg-card border-border'}`}>
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${at ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                            <i className={at ? "fa-solid fa-file-circle-check" : "fa-regular fa-file"} />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-[12px] font-medium text-foreground/80 truncate" title={label}>{label}</div>
                                            {at ? (
                                                <div className="text-[10px] text-muted-foreground truncate mt-0.5">
                                                    {at.file_name} · {at.created_at}
                                                </div>
                                            ) : (
                                                <div className="text-[10px] text-muted-foreground/50 mt-0.5">Belum ada dokumen</div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1.25 ml-3 flex-shrink-0">
                                        {at ? (
                                            <>
                                                <button onClick={() => onPreview(at)} className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-primary/10 text-primary/70 hover:text-primary transition-colors" title="Preview">
                                                    <i className="fa-solid fa-eye text-[11px]" />
                                                </button>
                                                <a href={contractApi.attachmentDownloadUrl(contract.id, at.id)} download className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-primary/10 text-primary/70 hover:text-primary transition-colors" title="Download">
                                                    <i className="fa-solid fa-download text-[11px]" />
                                                </a>
                                                <button onClick={() => handleDelete(at.id, label)} className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-destructive/10 text-destructive/70 hover:text-destructive transition-colors" title="Delete">
                                                    <i className="fa-solid fa-trash-can text-[11px]" />
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                disabled={!!uploading}
                                                onClick={() => { setActiveLabel(label); setActiveCat(cat.id); fileRef.current?.click(); }}
                                                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-muted hover:bg-primary text-muted-foreground hover:text-primary-foreground text-[10px] font-semibold rounded-md transition-all disabled:opacity-50"
                                            >
                                                {isUp ? (
                                                    <i className="fa-solid fa-spinner fa-spin" />
                                                ) : (
                                                    <i className="fa-solid fa-plus" />
                                                )}
                                                Upload
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}
