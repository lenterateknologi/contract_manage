import { ConfirmationModal } from '@/components/ui/overlays/ConfirmationModal';
import { contractApi } from '@/lib/contract-api';
import { cn } from '@/lib/utils';
import { Contract, ContractAttachment } from '@/types/contracts';
import axios from 'axios';
import { renderAsync } from 'docx-preview';
import { ArrowLeft, Download, FileCheck, FileIcon, FolderOpen, Loader2, Plus, Trash2 } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

interface Props {
    contract: Contract;
    canUpdate?: boolean;
    onUpdated: (c: Contract) => void;
    showToast: (msg: string, type: any) => void;
}

const DOCX_STYLES = `
    .docx-wrapper { background-color: transparent !important; padding: 0 !important; }
    .docx { 
        box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1) !important; 
        margin-bottom: 40px !important; 
        border: 1px solid #e2e8f0 !important;
        background-color: white !important;
    }
`;

export default function ContractAttachments({ contract, canUpdate, onUpdated, showToast, meId }: Props & { meId?: string }) {
    const [uploading, setUploading] = useState<string | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);
    const [activeLabel, setActiveLabel] = useState<string | null>(null);
    const [activeCat, setActiveCat] = useState<string | null>(null);
    const [previewAt, setPreviewAt] = useState<ContractAttachment | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const previewContainerRef = useRef<HTMLDivElement>(null);
    const [confirmDelete, setConfirmDelete] = useState<{ id: string; label: string } | null>(null);

    const isActor = (contract as any).can_approve || contract.created_by === meId;
    const canEdit = (isActor || canUpdate) && (contract as any).allow_attachment_edit !== false;

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
                        : `/api/contracts/${contract.id}/attachment/${previewAt.id}`;

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

    const [manualLabel, setManualLabel] = useState('');
    const [showManualUpload, setShowManualUpload] = useState(false);

    // Combined list of attachments for the main grid
    const vendorDocuments =
        (contract.vendor as any)?.documents?.map((d: any) => ({
            id: d.id,
            label: d.document_name || d.name,
            category: 'Vendor Document',
            file_name: d.document_name || d.name,
            is_vendor_doc: true,
            created_at: 'Master Vendor',
        })) || [];

    const contractAttachments = contract.attachments || [];
    const allItems = [...vendorDocuments, ...contractAttachments];

    const handleManualUploadClick = () => {
        if (!manualLabel.trim()) {
            showToast('Silakan isi nama lampiran terlebih dahulu', 'danger');
            return;
        }
        setActiveLabel(manualLabel.trim());
        setActiveCat('Additional');
        fileRef.current?.click();
    };

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
            setManualLabel('');
            setShowManualUpload(false);
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

    if (!contract.vendor) {
        return (
            <div className="animate-in fade-in flex flex-1 flex-col items-center justify-center p-20 text-center duration-500">
                <div className="bg-surface-muted text-text-soft mb-6 flex h-20 w-20 items-center justify-center rounded-full">
                    <FileIcon size={40} />
                </div>
                <h4 className="text-text-main text-[11px] font-semibold tracking-[0.3em] uppercase">Vendor Belum Dipilih</h4>
                <p className="text-text-desc mt-2 max-w-[280px] text-[10px] leading-relaxed font-bold uppercase">
                    Silakan pilih vendor terlebih dahulu pada panel informasi kontrak untuk mengelola lampiran.
                </p>
            </div>
        );
    }

    if (previewAt) {
        const fileName = (previewAt.file_name || '').toLowerCase();
        const isPdf = fileName.endsWith('.pdf');
        const isDocx = fileName.endsWith('.docx');
        const isImage = /\.(jpe?g|png|gif|webp)$/i.test(fileName);

        const downloadUrl = (previewAt as any).is_vendor_doc
            ? contractApi.vendorDocumentDownloadUrl(contract.id, previewAt.id)
            : contractApi.attachmentDownloadUrl(contract.id, previewAt.id);

        const previewUrl = (previewAt as any).is_vendor_doc
            ? contractApi.vendorDocumentPdfPreviewUrl(contract.id, previewAt.id)
            : `/api/contracts/${contract.id}/attachment/${previewAt.id}/preview`;

        return (
            <div className="bg-card animate-in fade-in flex flex-1 flex-col overflow-hidden duration-500">
                <style>{DOCX_STYLES}</style>
                <div className="border-surface-border bg-surface-base/80 flex h-[72px] shrink-0 items-center justify-between border-b px-6 backdrop-blur-xl">
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <div className="bg-primary h-4 w-1 rounded-full" />
                                <h4 className="text-text-main text-[11px] leading-none font-bold uppercase">{previewAt.label}</h4>
                                <span
                                    className={cn(
                                        'rounded px-2 py-0.5 text-[8px] font-bold text-white uppercase',
                                        (previewAt as any).is_vendor_doc ? 'bg-amber-600' : 'bg-indigo-600',
                                    )}
                                >
                                    {(previewAt as any).is_vendor_doc ? 'Vendor Doc' : 'Attachment'}
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
                            className="bg-surface-base border-surface-border text-text-desc hover:bg-surface-muted flex h-8 items-center gap-2 rounded-lg border px-4 text-[10px] font-bold uppercase transition-all active:scale-95"
                        >
                            <ArrowLeft size={14} /> BACK TO LIST
                        </button>

                        <a
                            href={downloadUrl}
                            download
                            className="bg-primary text-primary-foreground flex h-8 items-center gap-2 rounded-lg px-4 text-[10px] font-bold uppercase transition-all hover:opacity-90 active:scale-95"
                        >
                            <Download size={14} /> DOWNLOAD
                        </a>
                    </div>
                </div>

                <div className="custom-scrollbar relative flex-1 overflow-y-auto bg-slate-100/50 p-8">
                    <div className="mx-auto max-w-[900px]">
                        {previewLoading && (
                            <div className="flex h-64 flex-col items-center justify-center gap-3">
                                <Loader2 className="text-primary animate-spin" size={32} />
                                <span className="text-text-soft text-[10px] font-bold tracking-widest uppercase">Generating Preview...</span>
                            </div>
                        )}

                        {isDocx && <div ref={previewContainerRef} className="docx-preview-container" />}

                        {isImage && (
                            <div className="flex justify-center">
                                <img src={previewUrl} alt="Preview" className="max-w-full rounded-xl border border-slate-200 bg-white shadow-2xl" />
                            </div>
                        )}

                        {isPdf && (
                            <iframe
                                src={`${previewUrl}#toolbar=0`}
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
        <div className="bg-surface-muted/30 custom-scrollbar flex flex-1 flex-col overflow-y-auto px-6 py-8">
            <input type="file" ref={fileRef} className="hidden" onChange={handleFileChange} />

            <div className="mb-6 flex items-center justify-between px-1">
                <div>
                    <h4 className="text-text-main text-[11px] font-semibold tracking-[0.3em] uppercase">Dokumen & Lampiran</h4>
                    <p className="text-text-soft mt-1 text-[9px] font-bold  uppercase">
                        Daftar kelengkapan dokumen dari Vendor dan Kontrak
                    </p>
                </div>
                {canEdit && !showManualUpload && (
                    <button
                        onClick={() => setShowManualUpload(true)}
                        className="flex h-9 items-center gap-2 rounded-xl bg-indigo-600 px-5 text-[10px] font-bold text-white uppercase shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700 active:scale-95"
                    >
                        <Plus size={14} /> Tambah Lampiran
                    </button>
                )}
            </div>

            {canEdit && showManualUpload && (
                <div className="animate-in slide-in-from-top-2 mb-8 duration-300">
                    <div className="flex items-center gap-3 rounded-2xl border border-indigo-100 bg-indigo-50 p-4 backdrop-blur-sm">
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="Nama lampiran tambahan..."
                                value={manualLabel}
                                onChange={(e) => setManualLabel(e.target.value)}
                                className="text-text-main w-full rounded-xl border-indigo-100 bg-white px-4 py-2.5 text-sm font-medium shadow-sm transition-all outline-none focus:ring-2 focus:ring-indigo-500/20"
                                onKeyDown={(e) => e.key === 'Enter' && handleManualUploadClick()}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => {
                                    setShowManualUpload(false);
                                    setManualLabel('');
                                }}
                                className="text-text-soft flex h-10 w-10 items-center justify-center rounded-xl transition-all hover:bg-black/5"
                            >
                                <Trash2 size={18} />
                            </button>
                            <button
                                onClick={handleManualUploadClick}
                                className="flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-6 text-[10px] font-bold text-white uppercase shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700 active:scale-95"
                            >
                                <Plus size={14} /> Upload Berkas
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {allItems.map((at) => {
                    const isUp = uploading === at.label;
                    return (
                        <div
                            key={at.id + at.label}
                            onClick={() => setPreviewAt(at)}
                            className={cn(
                                'group relative flex flex-col justify-between rounded-2xl border p-5 transition-all duration-300 outline-none',
                                'border-surface-border hover:border-text-main cursor-pointer bg-white hover:-translate-y-1 hover:shadow-2xl',
                            )}
                        >
                            <div className="mb-4 flex items-start justify-between">
                                <div
                                    className={cn(
                                        'flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl transition-all duration-300',
                                        at.is_vendor_doc ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600',
                                        'group-hover:scale-110',
                                    )}
                                >
                                    <FileCheck size={24} strokeWidth={2.5} />
                                </div>
                                <div className="flex items-center gap-2">
                                    <a
                                        href={
                                            at.is_vendor_doc
                                                ? contractApi.vendorDocumentDownloadUrl(contract.id, at.id)
                                                : contractApi.attachmentDownloadUrl(contract.id, at.id)
                                        }
                                        download
                                        onClick={(e) => e.stopPropagation()}
                                        className="text-text-soft hover:text-text-main transition-colors"
                                        title="Download"
                                    >
                                        <Download size={16} />
                                    </a>
                                    {!at.is_vendor_doc && canEdit && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(at.id, at.label);
                                            }}
                                            className="text-text-soft transition-colors hover:text-rose-600"
                                            title="Delete"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="min-w-0">
                                <div className="text-text-main truncate text-[12px] font-semibold tracking-tight uppercase" title={at.label}>
                                    {at.label}
                                </div>
                                <div className="mt-1 flex items-center gap-2">
                                    <span
                                        className={cn(
                                            'rounded px-1.5 py-0.5 text-[8px] font-semibold uppercase',
                                            at.is_vendor_doc ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700',
                                        )}
                                    >
                                        {at.is_vendor_doc ? 'VENDOR' : 'CONTRACT'}
                                    </span>
                                    <span className="text-text-soft/40 truncate text-[9px] font-bold">{at.file_name}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {allItems.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center opacity-40">
                        <FolderOpen size={48} className="mb-4" />
                        <p className="text-xs font-semibold tracking-widest uppercase">Belum ada lampiran</p>
                    </div>
                )}
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
