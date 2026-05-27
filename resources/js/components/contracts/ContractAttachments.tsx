import LoadingLottie from '@/components/ui/feedback/LoadingLottie';
import { ConfirmationModal } from '@/components/ui/overlays/ConfirmationModal';
import { contractApi } from '@/lib/contract-api';
import { cn } from '@/lib/utils';
import { Contract, ContractAttachment } from '@/types/contracts';
import axios from 'axios';
import { renderAsync } from 'docx-preview';
import { ArrowLeft, Download, FileCheck, File as FileIcon, Loader2, Plus, Trash2 } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

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

// Dynamic categories are now handled within the component based on vendor data

export default function ContractAttachments({ contract, onUpdated, showToast }: Props) {
    const [uploading, setUploading] = useState<string | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);
    const [activeLabel, setActiveLabel] = useState<string | null>(null);
    const [activeCat, setActiveCat] = useState<string | null>(null);
    const [previewAt, setPreviewAt] = useState<ContractAttachment | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const previewContainerRef = useRef<HTMLDivElement>(null);
    const [confirmDelete, setConfirmDelete] = useState<{ id: string; label: string } | null>(null);

    // Auto-detect category based on vendor type
    const vendorType = (contract.vendor as any)?.vendor_type?.toLowerCase() === 'perorangan' ? 'perorangan' : 'perusahaan';
    const [activeCategory, setActiveCategory] = useState<'perusahaan' | 'perorangan'>(vendorType);

    // Update active category when vendor changes
    useEffect(() => {
        if (contract.vendor) {
            setActiveCategory((contract.vendor as any).vendor_type?.toLowerCase() === 'perorangan' ? 'perorangan' : 'perusahaan');
        }
    }, [contract.vendor?.id]);

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
            const vendorDoc = contract.vendor.documents.find((d) => {
                const name = (d.name || '').toLowerCase();
                const type = (d.type || '').toLowerCase();

                // Smart mapping for common legal docs
                if (normalizedLabel.includes('akte') && (name.includes('akte') || type.includes('akte'))) return true;
                if (normalizedLabel.includes('tdp') && (name.includes('tdp') || type.includes('tdp'))) return true;
                if (normalizedLabel.includes('siup') && (name.includes('siup') || type.includes('siup'))) return true;
                if (normalizedLabel.includes('npwp') && (name.includes('npwp') || type.includes('npwp'))) return true;
                if (normalizedLabel.includes('domicile') && (name.includes('domisili') || type.includes('domisili') || name.includes('domicile')))
                    return true;
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
                    created_at: 'Synced from Vendor',
                } as any;
            }
        }

        return null;
    };

    if (!contract.vendor) {
        return (
            <div className="animate-in fade-in flex flex-1 flex-col items-center justify-center p-20 text-center duration-500">
                <div className="bg-surface-muted text-text-soft mb-6 flex h-20 w-20 items-center justify-center rounded-full">
                    <FileIcon size={40} />
                </div>
                <h4 className="text-text-main text-[11px] font-black uppercase tracking-[0.3em]">Vendor Belum Dipilih</h4>
                <p className="text-text-desc mt-2 max-w-[280px] text-[10px] font-bold leading-relaxed uppercase">
                    Silakan pilih vendor terlebih dahulu pada panel informasi kontrak untuk mengelola lampiran.
                </p>
            </div>
        );
    }

    // Dynamic Categories based on Vendor Data
    const DYNAMIC_CATEGORIES = [
        {
            id: vendorType,
            label: `Lampiran (${vendorType === 'perorangan' ? 'Perorangan' : 'Perusahaan'})`,
            items: (contract.vendor as any).documents?.map((d: any) => d.name) || [],
        },
    ];

    if (previewAt) {
        // ... (keep current preview return block)
        return (
            <div className="bg-card animate-in fade-in flex flex-1 flex-col overflow-hidden duration-500">
                <style>{DOCX_STYLES}</style>
                {/* High-Fidelity HUD for Attachment Preview */}
                <div className="border-surface-border flex h-[72px] shrink-0 items-center justify-between border-b bg-surface-base/80 px-6 backdrop-blur-xl">
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <div className="bg-primary h-4 w-1 rounded-full" />
                                <h4 className="text-text-main text-[11px] font-bold leading-none uppercase">{previewAt.label}</h4>
                                <span className="bg-primary rounded px-2 py-0.5 text-[8px] font-bold text-white uppercase">
                                    {previewAt.category || 'Attachment'}
                                </span>
                            </div>
                            <span className="text-text-desc mt-1.5 text-[9px] font-bold tracking-[0.2em] uppercase">
                                {previewAt.file_name} &bull; Document Preview
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <button
                            onClick={() => setPreviewAt(null)}
                            className="bg-surface-base border-surface-border text-text-desc flex h-8 items-center gap-2 rounded-lg border px-4 text-[10px] font-bold uppercase transition-all hover:bg-surface-muted active:scale-95"
                        >
                            <ArrowLeft size={14} /> BACK TO LIST
                        </button>

                        <a
                            href={
                                (previewAt as any).is_vendor_doc
                                    ? contractApi.vendorDocumentDownloadUrl(contract.id, previewAt.id)
                                    : contractApi.attachmentDownloadUrl(contract.id, previewAt.id)
                            }
                            download
                            className="bg-surface-base border-surface-border text-text-main flex h-8 items-center gap-2 rounded-lg border px-4 text-[10px] font-bold uppercase transition-all hover:bg-surface-muted active:scale-95"
                        >
                            <Download size={14} className="opacity-40" /> DOWNLOAD
                        </a>
                    </div>
                </div>

                <div className="bg-surface-muted flex flex-1 justify-center p-8">
                    <div className="border-surface-border relative mb-20 min-h-[80vh] w-full max-w-[210mm] overflow-hidden rounded-sm bg-white shadow-2xl ring-1">
                        {previewLoading && (
                            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-surface-base/80 backdrop-blur-sm">
                                <LoadingLottie width={100} height={100} />
                                <span className="text-text-soft text-[10px] font-black uppercase">Menyiapkan Preview...</span>
                            </div>
                        )}

                        {previewAt.file_name.toLowerCase().endsWith('.docx') ? (
                            <div ref={previewContainerRef} className="docx-container contract-doc w-full p-12 text-left" />
                        ) : (
                            <iframe
                                src={
                                    (previewAt as any).is_vendor_doc
                                        ? `${contractApi.vendorDocumentPdfPreviewUrl(contract.id, previewAt.id)}#toolbar=0&navpanes=0&view=FitH`
                                        : `${contractApi.attachmentPdfPreviewUrl(contract.id, previewAt.id)}#toolbar=0&navpanes=0&view=FitH`
                                }
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
        <div className="animate-in fade-in flex flex-col gap-5 p-5 duration-500">
            <input type="file" ref={fileRef} className="hidden" onChange={handleFileChange} />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {DYNAMIC_CATEGORIES[0].items.map((label: string) => {
                    const at = getAttachment(label);
                    const isUp = uploading === label;

                    return (
                        <div
                            key={label}
                            onClick={() => at && setPreviewAt(at)}
                            className={cn(
                                'group relative flex items-center justify-between rounded-xl border p-4 transition-all duration-300 outline-none',
                                at
                                    ? 'bg-surface-base border-surface-border cursor-pointer hover:-translate-y-1 hover:border-text-main hover:shadow-xl'
                                    : 'bg-surface-muted/30 border-surface-border/50',
                            )}
                        >
                            <div className="flex min-w-0 items-center gap-4">
                                <div
                                    className={cn(
                                        'flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl transition-all duration-300',
                                        at
                                            ? 'bg-surface-muted text-text-desc shadow-inner group-hover:bg-text-main group-hover:text-surface-base'
                                            : 'bg-surface-muted/50 text-text-soft/20',
                                    )}
                                >
                                    {at ? <FileCheck size={20} strokeWidth={2.5} /> : <FileIcon size={20} strokeWidth={2.5} />}
                                </div>
                                <div className="min-w-0">
                                    <div
                                        className={cn(
                                            'truncate text-[12px] font-bold tracking-tight',
                                            at ? 'text-text-main uppercase' : 'text-text-soft/40 uppercase',
                                        )}
                                        title={label}
                                    >
                                        {label}
                                    </div>
                                    {at ? (
                                        <div className="text-text-soft mt-1 truncate text-[9px] font-bold tracking-[0.1em] uppercase">
                                            {at.file_name} · <span className="text-text-main">READY</span>
                                        </div>
                                    ) : (
                                        <div className="text-text-soft/20 mt-1 text-[9px] font-bold uppercase italic">Kosong</div>
                                    )}
                                </div>
                            </div>

                            <div className="ml-3 flex flex-shrink-0 items-center gap-1.5">
                                {at ? (
                                    <>
                                        <a
                                            href={
                                                (at as any).is_vendor_doc
                                                    ? contractApi.vendorDocumentDownloadUrl(contract.id, at.id)
                                                    : contractApi.attachmentDownloadUrl(contract.id, at.id)
                                            }
                                            download
                                            onClick={(e) => e.stopPropagation()}
                                            className="bg-surface-base border-surface-border text-text-main flex h-8 w-8 items-center justify-center rounded-lg border shadow-sm transition-all hover:bg-text-main hover:text-surface-base active:scale-95"
                                            title="Download"
                                        >
                                            <Download size={14} strokeWidth={2.5} />
                                        </a>
                                        {!(at as any).is_vendor_doc && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(at.id, label);
                                                }}
                                                className="bg-surface-base border-surface-border text-text-main flex h-8 w-8 items-center justify-center rounded-lg border shadow-sm transition-all hover:bg-text-main hover:text-surface-base active:scale-95"
                                                title="Delete"
                                            >
                                                <Trash2 size={14} strokeWidth={2.5} />
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <button
                                        disabled={!!uploading}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveLabel(label);
                                            setActiveCat(vendorType);
                                            fileRef.current?.click();
                                        }}
                                        className="bg-surface-base border-surface-border text-text-desc flex h-8 items-center gap-2 rounded-lg border px-4 text-[10px] font-bold uppercase transition-all hover:bg-text-main hover:text-surface-base active:scale-95 disabled:opacity-20"
                                    >
                                        {isUp ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                                        Upload
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

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
