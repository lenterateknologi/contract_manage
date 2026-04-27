import { contractApi } from '@/lib/contract-api';
import { cn } from '@/lib/utils';
import { Contract, ContractAttachment } from '@/types/contracts';
import axios from 'axios';
import { renderAsync } from 'docx-preview';
import { Loader2 } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';

interface Props {
    contract: Contract;
    onUpdated: (c: Contract) => void;
    showToast: (msg: string, type: 'success' | 'danger') => void;
}

const DOCX_STYLES = `
    .docx-wrapper {
        background: white !important;
        padding: 20px !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
    }
    .docx-wrapper > section.docx {
        box-shadow: none !important;
        margin-bottom: 0 !important;
        padding: 0 !important;
        background: white !important;
        width: 100% !important;
    }
    .docx { background: white !important; }
`;

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

export default function ContractAttachments({ contract, onUpdated, showToast }: Props) {
    const [uploading, setUploading] = useState<string | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);
    const [activeLabel, setActiveLabel] = useState<string | null>(null);
    const [activeCat, setActiveCat] = useState<string | null>(null);
    const [previewAt, setPreviewAt] = useState<ContractAttachment | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const previewContainerRef = useRef<HTMLDivElement>(null);
    const [confirmDelete, setConfirmDelete] = useState<{id: string, label: string} | null>(null);

    // Reactive Preview Logic
    useEffect(() => {
        if (!previewAt) return;

        const fileName = (previewAt.file_name || '').toLowerCase();
        const isDocx = fileName.endsWith('.docx');

        if (isDocx) {
            const fetchAndRender = async () => {
                setPreviewLoading(true);
                try {
                    const url = (previewAt as any).is_vendor_doc 
                        ? contractApi.vendorDocumentPdfPreviewUrl(contract.id, previewAt.id)
                        : `/api/contracts/${contract.id}/attachment/${previewAt.id}`; // Original doc endpoint for conversion logic
                    
                    const res = await axios.get(url, {
                        responseType: 'blob',
                    });

                    if (previewContainerRef.current) {
                        previewContainerRef.current.innerHTML = '';
                        await renderAsync(res.data, previewContainerRef.current);
                    }
                } catch (err) {
                    console.error('Docx preview failed', err);
                } finally {
                    setPreviewLoading(false);
                }
            };
            fetchAndRender();
        }
    }, [previewAt, contract.id]);

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
        setConfirmDelete({ id: atId, label });
    };

    const execDelete = async () => {
        if (!confirmDelete) return;
        try {
            const updated = await contractApi.deleteAttachment(contract.id, confirmDelete.id);
            onUpdated(updated);
            showToast(`Berhasil menghapus ${confirmDelete.label}`, 'success');
        } catch {
            showToast(`Gagal menghapus ${confirmDelete.label}`, 'danger');
        } finally {
            setConfirmDelete(null);
        }
    };

    const getAttachment = (label: string) => {
        // 1. Direct contract attachments
        const direct = contract.attachments?.find((a) => a.label === label);
        if (direct) return direct;

        // 2. Virtual vendor documents (mapping by common keywords)
        if (contract.vendor?.documents) {
            const normalizedLabel = label.toLowerCase();
            const vendorDoc = contract.vendor.documents.find(d => {
                const name = (d.name || '').toLowerCase();
                const type = (d.type || '').toLowerCase();
                
                // Smart mapping for common legal docs
                if (normalizedLabel.includes('akte') && (name.includes('akte') || type.includes('akte'))) return true;
                if (normalizedLabel.includes('tdp') && (name.includes('tdp') || type.includes('tdp'))) return true;
                if (normalizedLabel.includes('siup') && (name.includes('siup') || type.includes('siup'))) return true;
                if (normalizedLabel.includes('npwp') && (name.includes('npwp') || type.includes('npwp'))) return true;
                if (normalizedLabel.includes('domicile') && (name.includes('domisili') || type.includes('domisili') || name.includes('domicile'))) return true;
                if (normalizedLabel.includes('ktp') && (name.includes('ktp') || name.includes('identitas'))) return true;
                
                return name === normalizedLabel || type === normalizedLabel;
            });

            if (vendorDoc) {
                return {
                    id: vendorDoc.id,
                    label: label,
                    category: 'Vendor Document',
                    file_name: vendorDoc.name,
                    file_path: '', // Not used for virtuals
                    is_vendor_doc: true, // Marker
                    created_at: 'Synced from Vendor'
                } as any;
            }
        }

        return null;
    };

    if (previewAt) {
        return (
            <div className="bg-card animate-in fade-in flex flex-1 flex-col overflow-hidden duration-500">
                <style>{DOCX_STYLES}</style>
                {/* High-Fidelity HUD for Attachment Preview */}
                <div className="border-border/60 flex h-[72px] shrink-0 items-center justify-between border-b bg-white/50 px-6 backdrop-blur-sm">
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <div className="h-4 w-1 rounded-full bg-orange-500" />
                                <h4 className="text-[11px] leading-none font-black tracking-tighter text-slate-900 uppercase">{previewAt.label}</h4>
                                <span className="animate-in fade-in zoom-in rounded bg-slate-950 px-1.5 py-0.5 text-[8px] font-black tracking-widest text-white uppercase duration-500">
                                    {previewAt.category || 'Attachment'}
                                </span>
                            </div>
                            <span className="mt-1.5 text-[9px] font-black tracking-[0.2em] text-orange-500 uppercase">
                                {previewAt.file_name} &bull; Document Preview
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <button
                            onClick={() => setPreviewAt(null)}
                            className="border-border flex h-8 items-center gap-2 rounded-xl border bg-white px-4 text-[9px] font-black tracking-widest text-slate-600 uppercase shadow-sm transition-all hover:bg-slate-50 active:scale-95"
                        >
                            <i className="fa-solid fa-arrow-left text-[10px]" /> BACK TO LIST
                        </button>

                        <a
                            href={(previewAt as any).is_vendor_doc 
                                ? contractApi.vendorDocumentDownloadUrl(contract.id, previewAt.id)
                                : contractApi.attachmentDownloadUrl(contract.id, previewAt.id)}
                            download
                            className="border-border flex h-8 items-center gap-2 rounded-xl border bg-white px-4 text-[9px] font-black tracking-widest text-slate-900 uppercase shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-95"
                        >
                            <i className="fa-solid fa-download text-[10px] text-slate-400" /> DOWNLOAD
                        </a>
                    </div>
                </div>

                <div className="flex flex-1 justify-center bg-white p-8">
                    <div className="relative mb-20 min-h-[80vh] w-full max-w-[210mm] overflow-hidden rounded-sm bg-white shadow-2xl ring-1 ring-slate-200">
                        {previewLoading && (
                            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 backdrop-blur-sm">
                                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                            </div>
                        )}

                        {previewAt.file_name.toLowerCase().endsWith('.docx') ? (
                            <div ref={previewContainerRef} className="docx-container contract-doc w-full p-12 text-left" />
                        ) : (
                            <iframe
                                src={(previewAt as any).is_vendor_doc
                                    ? `${contractApi.vendorDocumentPdfPreviewUrl(contract.id, previewAt.id)}#toolbar=0&navpanes=0&view=FitH`
                                    : `${contractApi.attachmentPdfPreviewUrl(contract.id, previewAt.id)}#toolbar=0&navpanes=0&view=FitH`}
                                className="absolute top-0 left-[-3%] h-full w-[106%] border-none bg-white"
                                title="Attachment Preview"
                                style={{ backgroundColor: 'white' }}
                            />
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in space-y-8 duration-500">
            <input type="file" ref={fileRef} className="hidden" onChange={handleFileChange} />
            {CATEGORIES.map((cat) => (
                <div key={cat.id}>
                    <h6 className="text-foreground/80 mb-4 flex items-center gap-2 text-[10px] font-black tracking-widest uppercase">
                        <div className="h-1.5 w-1.5 rounded-full bg-slate-900" />
                        {cat.label}
                    </h6>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-2">
                        {cat.items.map((label) => {
                            const at = getAttachment(label);
                            const isUp = uploading === label;

                            return (
                                <div
                                    key={label}
                                    onClick={() => at && setPreviewAt(at)}
                                    className={cn(
                                        'group relative flex items-center justify-between rounded-xl border p-3.5 transition-all outline-none',
                                        at
                                            ? 'cursor-pointer border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                                            : 'border-slate-200/60 bg-slate-50/30',
                                    )}
                                >
                                    <div className="flex min-w-0 items-center gap-3.5">
                                        <div
                                            className={cn(
                                                'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition-colors',
                                                at
                                                    ? 'bg-slate-100 text-slate-900 group-hover:bg-slate-900 group-hover:text-white'
                                                    : 'bg-slate-100 text-slate-300',
                                            )}
                                        >
                                            <i className={cn('text-[14px]', at ? 'fa-solid fa-file-circle-check' : 'fa-regular fa-file')} />
                                        </div>
                                        <div className="min-w-0">
                                            <div
                                                className={cn(
                                                    'truncate text-[11px] font-bold tracking-tight',
                                                    at ? 'text-slate-900' : 'text-slate-400',
                                                )}
                                                title={label}
                                            >
                                                {label}
                                            </div>
                                            {at ? (
                                                <div className="mt-0.5 truncate text-[9px] font-medium tracking-tight text-slate-400 uppercase">
                                                    {at.file_name} · {at.created_at}
                                                </div>
                                            ) : (
                                                <div className="mt-0.5 text-[9px] font-medium tracking-widest text-slate-300 uppercase italic">
                                                    Belum ada dokumen
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="ml-3 flex flex-shrink-0 items-center gap-1.5">
                                        {at ? (
                                            <>
                                                <a
                                                    href={(at as any).is_vendor_doc
                                                        ? contractApi.vendorDocumentDownloadUrl(contract.id, at.id)
                                                        : contractApi.attachmentDownloadUrl(contract.id, at.id)}
                                                    download
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="border-border flex h-8 w-8 items-center justify-center rounded-lg border bg-white shadow-sm transition-all hover:bg-slate-900 hover:text-white active:scale-95"
                                                    title="Download"
                                                >
                                                    <i className="fa-solid fa-download text-[11px]" />
                                                </a>
                                                {!(at as any).is_vendor_doc && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDelete(at.id, label);
                                                        }}
                                                        className="border-border flex h-8 w-8 items-center justify-center rounded-lg border bg-white text-rose-600 shadow-sm transition-all hover:bg-rose-600 hover:text-white active:scale-95"
                                                        title="Delete"
                                                    >
                                                        <i className="fa-solid fa-trash-can text-[11px]" />
                                                    </button>
                                                )}
                                            </>
                                        ) : (
                                            <button
                                                disabled={!!uploading}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveLabel(label);
                                                    setActiveCat(cat.id);
                                                    fileRef.current?.click();
                                                }}
                                                className="border-border flex h-8 items-center gap-1.5 rounded-lg border bg-white px-3 text-[9px] font-black tracking-widest text-slate-400 uppercase shadow-sm transition-all hover:bg-slate-900 hover:text-white active:scale-95 disabled:opacity-50"
                                            >
                                                {isUp ? (
                                                    <i className="fa-solid fa-spinner fa-spin" />
                                                ) : (
                                                    <i className="fa-solid fa-plus text-[10px]" />
                                                )}
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

            <ConfirmationModal 
                open={!!confirmDelete}
                onClose={() => setConfirmDelete(null)}
                onConfirm={execDelete}
                title="Hapus Lampiran"
                description={`Apakah Anda yakin ingin menghapus lampiran "${confirmDelete?.label}"? Berkas yang telah dihapus tidak dapat dipulihkan.`}
                confirmText="Hapus Berkas"
            />
        </div>
    );
}
