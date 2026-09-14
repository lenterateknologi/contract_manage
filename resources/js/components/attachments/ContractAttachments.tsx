import { ConfirmationModal } from '@/components/ui/dialogs/ConfirmationModal';
import { Card, CardContent } from '@/components/ui/cards/Card';
import { Badge } from '@/components/ui/feedback/Badge';
import { Button } from '@/components/ui/buttons/Button';
import { SearchInput } from '@/components/ui/inputs/SearchInput';
import LoadingLottie from '@/components/ui/feedback/LoadingLottie';
import { contractApi } from '@/pages/contracts/utils';
import { cn } from '@/lib/utils';
import { formatFileSize } from '@/lib/formatters';
import { renderAsync } from 'docx-preview';
import { ChipIcon, AppIcon, Icons, FileChipIcon, getAttachmentBadge } from '@/components/ui';

const {
    ArrowLeft,
    Download,
    FileCheck,
    FileIcon,
    FolderOpen,
    Loader2,
    Paperclip,
    Plus,
    Trash2,
    Search,
    ExternalLink,
    Eye,
} = Icons;
import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import type { Contract, ContractAttachment } from '@/pages/contracts/types';

interface Props {
    contract: Contract;
    canUpdate?: boolean;
    onUpdated: (c: Contract) => void;
    showToast: (msg: string, type: any) => void;
}

const DOCX_STYLES = `
    .docx-wrapper { background-color: transparent !important; padding: 0 !important; }
    .docx { 
        box-shadow: none !important; 
        margin-bottom: 20px !important; 
        border: 1px solid #e2e8f0 !important;
        background-color: white !important;
    }
`;

export default function ContractAttachments({ contract, canUpdate, onUpdated, showToast, meId }: Props & { meId?: string }) {
    const [uploading, setUploading] = useState<string | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);
    const [previewAt, setPreviewAt] = useState<ContractAttachment | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const previewContainerRef = useRef<HTMLDivElement>(null);
    const [confirmDelete, setConfirmDelete] = useState<{ id: string; label: string } | null>(null);
    const [search, setSearch] = useState('');

    const isActor = (contract as any).can_approve || contract.created_by === meId || (contract as any).initiated_by_id === meId;
    const canEdit = (isActor || canUpdate) && (contract as any).allow_attachment_edit !== false;

    // Reactive Preview Logic
    useEffect(() => {
        if (!previewAt) {
            setPreviewLoading(false);
            return;
        }

        setPreviewLoading(true);

        const fileName = (previewAt.file_name || '').toLowerCase();
        const isDocx = fileName.endsWith('.docx');

        if (isDocx) {
            const fetchAndRender = async () => {
                try {
                    const url = (previewAt as any).is_vendor_doc
                        ? contractApi.vendorDocumentPdfPreviewUrl(contract.id, previewAt.id, previewAt.file_name)
                        : contractApi.attachmentDownloadUrl(contract.id, previewAt.id);

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

    const contractAttachments = (contract.attachments || []).map((a: any) => {
        const cat = a.category || 'Lampiran';
        const isAction = ['Approval Action', 'Persetujuan', 'Penolakan Kontrak', 'Penolakan', 'Penugasan PIC', 'Persetujuan Tambahan', 'Tanda Tangan'].includes(cat);
        return {
            ...a,
            is_vendor_doc: false,
            is_approval_doc: isAction,
            has_file: true,
            is_uploaded: true,
        };
    });

    const existingFileNames = new Set((contract.attachments || []).map((a: any) => a.file_name));

    // Extract attachments from legacy approval actions (Approvals / Rejections / Adhoc actions)
    const approvalAttachments = (contract.approvals || [])
        .filter((appr: any) => Boolean(appr.attachment_path))
        .map((appr: any) => {
            const fileName = appr.attachment_name || (appr.attachment_path ? appr.attachment_path.split('/').pop() : 'Lampiran Aksi');
            return {
                id: appr.id,
                label: fileName,
                category: 'Lampiran Aksi',
                file_name: fileName,
                file_size: appr.file_size,
                file_type: fileName.split('.').pop() || 'file',
                is_vendor_doc: false,
                is_approval_doc: true,
                is_chat_doc: false,
                has_file: true,
                is_uploaded: true,
                created_at: appr.decided_at || appr.created_at,
                uploader: appr.approver,
            };
        })
        .filter((apprDoc: any) => !existingFileNames.has(apprDoc.file_name));

    // Extract attachments from discussion/chat messages
    const chatAttachments = (contract.messages || [])
        .filter((m: any) => Boolean(m.attachment_path || m.attachment_name || m.attachment_url))
        .map((m: any) => {
            const fileName = m.attachment_name || (m.attachment_path ? m.attachment_path.split('/').pop() : 'Lampiran Diskusi');
            return {
                id: m.id,
                label: fileName,
                category: 'Lampiran Diskusi',
                file_name: fileName,
                file_type: fileName.split('.').pop() || 'file',
                file_path: m.attachment_path,
                attachment_url: m.attachment_url,
                is_vendor_doc: false,
                is_approval_doc: false,
                is_chat_doc: true,
                has_file: true,
                is_uploaded: true,
                created_at: m.created_at,
                uploader: m.user,
            };
        });

    const allItems = [...vendorDocuments, ...contractAttachments, ...approvalAttachments, ...chatAttachments];

    const filteredItems = useMemo(() => {
        let items = allItems;
        if (activeTab === 'available') {
            items = allItems.filter((item) => item.has_file);
        } else if (activeTab === 'uploaded') {
            items = allItems.filter((item) => item.is_uploaded || !item.is_vendor_doc);
        }

        if (search.trim()) {
            const q = search.toLowerCase();
            items = items.filter((item) => (item.label || '').toLowerCase().includes(q) || (item.file_name || '').toLowerCase().includes(q));
        }

        return items;
    }, [allItems, activeTab, search]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const fd = new FormData();
        Array.from(files).forEach((f) => {
            fd.append('files[]', f);
        });
        fd.append('category', 'Lampiran');

        setUploading('uploading');
        try {
            const updated = await contractApi.uploadAttachment(contract.id, fd);
            onUpdated(updated);
            showToast(
                files.length > 1
                    ? `Berhasil mengunggah ${files.length} berkas lampiran.`
                    : `Berhasil mengunggah ${files[0].name}.`,
                'success',
            );
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Gagal mengunggah lampiran.';
            showToast(msg, 'danger');
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


    if (previewAt) {
        const fileName = (previewAt.file_name || '').toLowerCase();
        const isPdf = fileName.endsWith('.pdf');
        const isDocx = fileName.endsWith('.docx');
        const isImage = /\.(jpe?g|png|gif|webp)$/i.test(fileName);

        const downloadUrl = (previewAt as any).is_vendor_doc
            ? contractApi.vendorDocumentDownloadUrl(contract.id, previewAt.id, previewAt.file_name)
            : `${contractApi.attachmentDownloadUrl(contract.id, previewAt.id)}?download=1`;

        const previewUrl = (previewAt as any).is_vendor_doc
            ? contractApi.vendorDocumentPdfPreviewUrl(contract.id, previewAt.id, previewAt.file_name)
            : isPdf
                ? contractApi.attachmentPdfPreviewUrl(contract.id, previewAt.id)
                : contractApi.attachmentDownloadUrl(contract.id, previewAt.id);

        return (
            <div className="bg-card animate-in fade-in flex flex-1 flex-col w-full h-full min-h-0 overflow-hidden duration-300 p-3 lg:p-4 gap-3">
                <style>{DOCX_STYLES}</style>
                <div className="bg-primary text-primary-foreground shrink-0 flex h-9.5 min-h-[38px] max-h-[38px] items-center justify-between px-4 rounded-xl shadow-xs">
                    <div className="flex items-center gap-3">
                        <Paperclip size={15} className="text-primary-foreground/90 shrink-0" />
                        <div className="flex items-center gap-2">
                            <h4 className="text-xs font-semibold uppercase tracking-tight text-primary-foreground">{previewAt.label || previewAt.file_name}</h4>
                            <Badge
                                variant="outline"
                                className="bg-white/15 border-white/25 text-white px-1.5 py-0 text-[8.5px] font-bold uppercase"
                            >
                                {(previewAt as any).is_vendor_doc
                                    ? 'Dokumen Catalog'
                                    : previewAt.category || 'Lampiran'}
                            </Badge>
                            <span className="hidden sm:inline text-white/80 text-[10px] truncate max-w-[200px]">
                                ({previewAt.file_name})
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="white"
                            size="sm"
                            onClick={() => setPreviewAt(null)}
                            className="h-7 px-2.5 text-[10px] font-semibold uppercase gap-1"
                        >
                            <ArrowLeft size={12} /> KEMBALI
                        </Button>

                        <a
                            href={downloadUrl}
                            download
                            className="bg-white/20 hover:bg-white/30 text-white border border-white/30 shadow-xs flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-[10px] font-bold uppercase transition-all active:scale-95 cursor-pointer"
                        >
                            <Download size={12} /> UNDUH
                        </a>
                    </div>
                </div>

                <div className="relative flex flex-1 flex-col w-full h-full min-h-0 overflow-hidden bg-white dark:bg-zinc-900 rounded-xl border border-surface-border p-0 m-0">
                    {previewLoading && (
                        <div className="absolute inset-0 z-20 flex h-full w-full flex-col items-center justify-center gap-4 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xs py-20 animate-in fade-in duration-200">
                            <LoadingLottie width={120} height={120} />
                            <span className="text-[10px] font-semibold tracking-[0.2em] text-[#172554] uppercase dark:text-white">Memuat Dokumen...</span>
                        </div>
                    )}

                    {isDocx ? (
                        <div className="custom-scrollbar h-full w-full overflow-y-auto p-4">
                            <div className="mx-auto max-w-[900px]">
                                <div ref={previewContainerRef} className="docx-preview-container" />
                            </div>
                        </div>
                    ) : isImage ? (
                        <div className="custom-scrollbar flex h-full w-full items-center justify-center overflow-auto p-4">
                            <img
                                src={previewUrl}
                                alt="Preview"
                                onLoad={() => setPreviewLoading(false)}
                                onError={() => setPreviewLoading(false)}
                                className="max-h-full max-w-full object-contain"
                            />
                        </div>
                    ) : (
                        <div className="w-full h-full min-h-0 flex-1 p-0 m-0 border-none overflow-hidden">
                            <iframe
                                src={isPdf ? `${previewUrl}#view=FitH` : previewUrl}
                                className="w-full h-full min-h-0 flex-1 border-none p-0 m-0"
                                title="Attachment Preview"
                                onLoad={() => setPreviewLoading(false)}
                            />
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in flex flex-1 flex-col overflow-hidden duration-300 p-3 lg:p-4 gap-3">
            <input type="file" ref={fileRef} multiple className="hidden" onChange={handleFileChange} />

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
                    {canEdit && (
                        <Button
                            variant="white"
                            size="sm"
                            disabled={Boolean(uploading)}
                            onClick={() => fileRef.current?.click()}
                            className="h-7 px-2.5 text-[10px] font-bold uppercase gap-1 text-primary shadow-xs"
                        >
                            {uploading ? (
                                <Loader2 size={13} className="animate-spin" />
                            ) : (
                                <Plus size={13} strokeWidth={2.5} />
                            )}
                            <span>{uploading ? 'Mengunggah...' : 'Tambah Lampiran'}</span>
                        </Button>
                    )}
                </div>
            </div>

            <Card className="flex-1 flex flex-col min-h-0 overflow-hidden border-border/80 shadow-xs">
                {/* Toolbar Filter & Search */}
                <div className="p-3 border-b border-border/60 bg-muted/20 flex flex-wrap items-center justify-between gap-2.5">
                    {/* Filter Tabs */}
                    <div className="flex items-center gap-0 rounded-lg border border-border bg-muted/60 p-0.5">
                        {[
                            { key: 'available', label: 'Tersedia', count: allItems.filter((i) => i.has_file).length },
                            { key: 'uploaded', label: 'Diunggah', count: allItems.filter((i) => (i as any).is_uploaded || !i.is_vendor_doc).length },
                            { key: 'all', label: 'Semua', count: allItems.length },
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => setActiveTab(tab.key as any)}
                                className={cn(
                                    'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide transition-all duration-150 cursor-pointer',
                                    activeTab === tab.key
                                        ? 'bg-primary text-white shadow-xs'
                                        : 'text-muted-foreground hover:text-foreground',
                                )}
                            >
                                <span>{tab.label}</span>
                                <span className={cn('rounded-full px-1.5 py-0.2 text-[8.5px] font-bold', activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground')}>
                                    {tab.count}
                                </span>
                            </button>
                        ))}
                    </div>

                    <div className="w-full sm:w-64">
                        <SearchInput
                            placeholder="CARI NAMA BERKAS..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-8 text-[10px] uppercase"
                        />
                    </div>
                </div>

                {/* File list */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 divide-y divide-border/50">
                    {filteredItems.map((at) => {
                        const isUp = uploading === at.label;
                        const hasFile = (at as any).has_file ?? (Boolean(at.file_name) && at.file_name !== 'Belum diunggah');

                        return (
                            <div
                                key={at.id + at.label}
                                onClick={() => hasFile && setPreviewAt(at)}
                                className={cn(
                                    'flex items-center justify-between gap-3 px-3 py-3 transition-colors rounded-lg group',
                                    hasFile
                                        ? 'hover:bg-muted/40 cursor-pointer'
                                        : 'bg-muted/10 opacity-50 cursor-not-allowed',
                                )}
                            >
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    {hasFile ? (
                                        <FileChipIcon fileName={at.file_name} size="lg" />
                                    ) : (
                                        <ChipIcon size="lg" bg="bg-slate-400 dark:bg-slate-600" icon={FileCheck} />
                                    )}

                                    <div className="flex flex-col min-w-0 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-foreground truncate text-xs font-bold leading-tight" title={at.label || at.file_name}>
                                                {at.label || at.file_name}
                                            </span>
                                            {getAttachmentBadge(at)}
                                        </div>
                                        <div className="text-muted-foreground truncate text-[11px] font-medium mt-0.5 flex items-center gap-1.5">
                                            <span className="truncate">{at.file_name}</span>
                                            {hasFile && at.file_size ? (
                                                <span className="text-[10px] text-muted-foreground/80 font-semibold shrink-0">
                                                    ({formatFileSize(at.file_size)})
                                                </span>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                    {hasFile && (
                                        <>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setPreviewAt(at);
                                                }}
                                                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
                                                title="Lihat Pratinjau"
                                            >
                                                <Eye size={14} />
                                            </Button>

                                            <a
                                                href={
                                                    at.is_vendor_doc
                                                        ? contractApi.vendorDocumentDownloadUrl(contract.id, at.id, at.file_name)
                                                        : `${contractApi.attachmentDownloadUrl(contract.id, at.id)}?download=1`
                                                }
                                                download
                                                onClick={(e) => e.stopPropagation()}
                                                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                                title="Unduh Berkas"
                                            >
                                                <Download size={14} />
                                            </a>
                                        </>
                                    )}

                                    {!at.is_vendor_doc && !at.is_approval_doc && canEdit && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(at.id, at.label);
                                            }}
                                            className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md"
                                            title="Hapus Berkas"
                                        >
                                            <Trash2 size={14} />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {filteredItems.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <FolderOpen className="h-8 w-8 text-muted-foreground/40 mb-3" />
                            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                                Tidak ada lampiran ditemukan
                            </h4>
                            <p className="text-[11px] text-muted-foreground mt-1">
                                {search ? 'Coba kata kunci pencarian yang lain.' : 'Belum ada berkas yang diunggah untuk kategori ini.'}
                            </p>
                        </div>
                    )}
                </div>

                <div className="border-t border-border/60 bg-muted/20 px-4 py-2.5 text-muted-foreground text-[10px] leading-relaxed font-medium">
                    Catatan: Klik pada baris berkas yang tersedia untuk membuka pratinjau dokumen langsung di layar.
                </div>
            </Card>

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
