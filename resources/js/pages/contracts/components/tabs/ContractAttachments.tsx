import { ConfirmationModal } from '@/components/ui/dialogs/ConfirmationModal';
import { contractApi } from '@/pages/contracts/utils';
import { cn } from '@/lib/utils';
import { Contract, ContractAttachment } from '@/pages/contracts/types';
import axios from 'axios';
import { renderAsync } from 'docx-preview';
import { ArrowLeft, Download, FileCheck, FileIcon, FolderOpen, Loader2, Plus, Trash2 } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';

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
    const [activeTab, setActiveTab] = useState<'all' | 'available' | 'uploaded'>('available');

    // Combined list of attachments for the main grid
    const vendorObj = (contract.vendor as any) || {};
    const vendorDetail = vendorObj.vendor_detail || vendorObj.detail || {};

    const extractAttachmentsRecursively = (obj: any, prefix = ''): any[] => {
        let results: any[] = [];
        if (!obj || typeof obj !== 'object') return results;

        if (Array.isArray(obj)) {
            obj.forEach((item, idx) => {
                if (typeof item === 'string') {
                    results.push({ label: `${prefix} ${idx + 1}`.trim(), file_name: item, has_file: true });
                } else if (typeof item === 'object' && item !== null) {
                    const fn = item.file_name || item.url || item.path || item.name || '';
                    results.push({
                        label: item.label || item.type || item.name || `${prefix} ${idx + 1}`.trim(),
                        file_name: fn || 'Belum diunggah',
                        has_file: Boolean(fn && fn !== 'Belum diunggah'),
                        id: item.id,
                    });
                }
            });
            return results;
        }

        Object.entries(obj).forEach(([key, val]) => {
            const lowerKey = key.toLowerCase();
            const isAttachmentKey = lowerKey.includes('attachment') || lowerKey.includes('file');

            if (isAttachmentKey && (typeof val === 'string' || val === null || typeof val === 'boolean')) {
                const cleanLabel = key
                    .replace(/([A-Z])/g, ' $1')
                    .replace(/_/g, ' ')
                    .replace(/attachment/gi, '')
                    .replace(/file/gi, '')
                    .trim()
                    .toUpperCase();

                const fileName = typeof val === 'string' && val.trim() ? val.trim() : null;

                results.push({
                    label: cleanLabel || key.toUpperCase(),
                    file_name: fileName || 'Belum diunggah',
                    has_file: Boolean(fileName),
                });
            } else if (typeof val === 'object' && val !== null && !Array.isArray(val) && key !== 'businessFields' && key !== 'bank' && key !== 'paymentMethod') {
                results = results.concat(extractAttachmentsRecursively(val, key.toUpperCase()));
            } else if (Array.isArray(val) && (lowerKey === 'documents' || lowerKey === 'berkas' || lowerKey === 'files')) {
                results = results.concat(extractAttachmentsRecursively(val, key.toUpperCase()));
            }
        });

        return results;
    };

    const rawVendorDocs = extractAttachmentsRecursively(vendorDetail);

    const vendorDocuments = rawVendorDocs.map((d: any, idx: number) => {
        const fileName = d.file_name || '';
        const hasFile = d.has_file ?? (Boolean(fileName) && String(fileName).trim() !== '' && String(fileName).trim() !== 'Belum diunggah' && String(fileName).trim() !== '-');
        return {
            id: d.id || `vdoc-${idx}`,
            label: d.label || 'DOKUMEN VENDOR',
            category: 'Vendor Document',
            file_name: hasFile ? fileName : 'Belum diunggah',
            is_vendor_doc: true,
            has_file: hasFile,
            created_at: 'Master Vendor',
        };
    });

    const contractAttachments = (contract.attachments || []).map((a: any) => ({
        ...a,
        is_vendor_doc: false,
        has_file: true,
        is_uploaded: true,
    }));

    const allItems = [...vendorDocuments, ...contractAttachments];

    const filteredItems = useMemo(() => {
        if (activeTab === 'available') {
            return allItems.filter((item) => item.has_file);
        }
        if (activeTab === 'uploaded') {
            return allItems.filter((item) => item.is_uploaded || !item.is_vendor_doc);
        }
        return allItems;
    }, [allItems, activeTab]);

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
            <div className="bg-card animate-in fade-in flex flex-1 flex-col overflow-hidden duration-500 p-3 lg:p-4 gap-3">
                <style>{DOCX_STYLES}</style>
                <div className="bg-primary text-primary-foreground shrink-0 flex h-9.5 min-h-[38px] max-h-[38px] items-center justify-between px-4 rounded-xl shadow-xs">
                    <div className="flex items-center gap-3">
                        <Paperclip size={15} className="text-primary-foreground/90 shrink-0" />
                        <div className="flex items-center gap-2">
                            <h4 className="text-xs font-semibold uppercase tracking-tight text-primary-foreground">{previewAt.label}</h4>
                            <span
                                className="rounded bg-white/20 border border-white/30 px-1.5 py-0.5 text-[8.5px] font-bold text-white uppercase"
                            >
                                {(previewAt as any).is_vendor_doc ? 'Vendor Doc' : 'Attachment'}
                            </span>
                            <span className="hidden sm:inline text-white/70 text-[10px] truncate max-w-[200px]">
                                ({previewAt.file_name})
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPreviewAt(null)}
                            className="bg-white/15 hover:bg-white/25 text-white border border-white/20 flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-[10.5px] font-medium uppercase transition-all active:scale-95 cursor-pointer"
                        >
                            <ArrowLeft size={13} /> KEMBALI
                        </button>

                        <a
                            href={downloadUrl}
                            download
                            className="bg-white text-primary hover:bg-white/90 shadow-xs flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-[10.5px] font-bold uppercase transition-all active:scale-95 cursor-pointer"
                        >
                            <Download size={13} /> UNDUH
                        </a>
                    </div>
                </div>

                <div className="custom-scrollbar relative flex-1 overflow-y-auto bg-slate-100/50 p-6 rounded-xl border border-surface-border">
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
        <div className="bg-surface-base flex flex-1 flex-col overflow-hidden p-3 lg:p-4 gap-3">
            <input type="file" ref={fileRef} className="hidden" onChange={handleFileChange} />

            {/* Compact Primary Header */}
            <div className="bg-primary text-primary-foreground shrink-0 flex h-9.5 min-h-[38px] max-h-[38px] items-center justify-between px-4 rounded-xl shadow-xs">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <Paperclip size={15} className="text-primary-foreground/90" />
                        <h4 className="text-xs font-semibold tracking-tight text-primary-foreground uppercase">
                            Dokumen & Lampiran
                        </h4>
                        <span className="rounded bg-white/20 border border-white/30 px-1.5 py-0.5 text-[9px] font-bold text-white">
                            {allItems.length} Berkas
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {canEdit && !showManualUpload && (
                        <button
                            type="button"
                            onClick={() => setShowManualUpload(true)}
                            className="bg-white text-primary hover:bg-white/90 h-7 px-3 text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                            <Plus size={13} />
                            <span>Tambah Lampiran</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="custom-scrollbar flex-1 overflow-y-auto space-y-3">

            {canEdit && showManualUpload && (
                <div className="mb-4">
                    <div className="flex items-center gap-2 rounded-md border border-surface-border bg-surface-muted/30 p-2">
                        <input
                            type="text"
                            placeholder="Nama lampiran tambahan..."
                            value={manualLabel}
                            onChange={(e) => setManualLabel(e.target.value)}
                            className="text-text-main border-surface-border bg-surface-base flex-1 rounded-md border px-3 py-1.5 text-xs font-medium outline-none focus:border-primary"
                            onKeyDown={(e) => e.key === 'Enter' && handleManualUploadClick()}
                        />
                        <button
                            onClick={() => {
                                setShowManualUpload(false);
                                setManualLabel('');
                            }}
                            className="text-text-soft flex h-8 w-8 items-center justify-center rounded-md hover:bg-surface-border cursor-pointer"
                        >
                            <Trash2 size={15} />
                        </button>
                        <button
                            onClick={handleManualUploadClick}
                            className="bg-primary text-primary-foreground flex h-8 items-center gap-1.5 rounded-md px-3 text-[10px] font-bold uppercase cursor-pointer"
                        >
                            <Plus size={13} /> Upload
                        </button>
                    </div>
                </div>
            )}

            {/* Tab Filter Bar */}
            <div className="mb-3 flex items-center justify-between gap-2 border-b border-surface-border pb-2">
                <div className="flex items-center gap-1">
                    {[
                        { key: 'all', label: 'Semua', count: allItems.length },
                        { key: 'available', label: 'Tersedia', count: allItems.filter((i) => i.has_file).length },
                        { key: 'uploaded', label: 'Uploaded', count: allItems.filter((i) => (i as any).is_uploaded || !i.is_vendor_doc).length },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => setActiveTab(tab.key as any)}
                            className={cn(
                                'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-bold uppercase transition-all cursor-pointer',
                                activeTab === tab.key
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-text-soft hover:bg-surface-muted hover:text-text-main',
                            )}
                        >
                            <span>{tab.label}</span>
                            <span className={cn('rounded-full px-1.5 py-0.2 text-[9px]', activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-surface-muted text-text-soft')}>
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="rounded-md border border-surface-border bg-surface-base">
                <div className="divide-y divide-surface-border">
                    {filteredItems.map((at) => {
                        const isUp = uploading === at.label;
                        const hasFile = (at as any).has_file ?? (Boolean(at.file_name) && at.file_name !== 'Belum diunggah');

                        return (
                            <div
                                key={at.id + at.label}
                                onClick={() => hasFile && setPreviewAt(at)}
                                className={cn(
                                    'flex items-center justify-between gap-3 px-3 py-2.5 transition-colors',
                                    hasFile
                                        ? 'hover:bg-surface-muted/40 cursor-pointer'
                                        : 'bg-surface-muted/20 opacity-50 cursor-not-allowed',
                                )}
                            >
                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                    <FileCheck size={16} className={cn('shrink-0', hasFile ? 'text-emerald-600 dark:text-emerald-400' : 'text-text-soft')} />

                                    <div className="flex flex-col min-w-0 flex-1">
                                        <span className="text-text-main truncate text-[11px] font-bold uppercase leading-tight" title={at.label}>
                                            {at.label}
                                        </span>
                                        <span className="text-text-main truncate text-[10px] font-medium mt-0.5 opacity-90">
                                            {at.file_name}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    <span
                                        className={cn(
                                            'rounded px-1.5 py-0.5 text-[8px] font-semibold uppercase',
                                            at.is_vendor_doc
                                                ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                                                : 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400',
                                        )}
                                    >
                                        {at.is_vendor_doc ? 'VENDOR' : 'KONTRAK'}
                                    </span>

                                    {hasFile && (
                                        <a
                                            href={
                                                at.is_vendor_doc
                                                    ? contractApi.vendorDocumentDownloadUrl(contract.id, at.id)
                                                    : contractApi.attachmentDownloadUrl(contract.id, at.id)
                                            }
                                            download
                                            onClick={(e) => e.stopPropagation()}
                                            className="text-text-soft hover:text-text-main p-1 transition-colors"
                                            title="Unduh Berkas"
                                        >
                                            <Download size={14} />
                                        </a>
                                    )}

                                    {!at.is_vendor_doc && canEdit && (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(at.id, at.label);
                                            }}
                                            className="text-text-soft hover:text-rose-600 p-1 transition-colors cursor-pointer"
                                            title="Hapus Berkas"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

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
        </div>
    );
}
