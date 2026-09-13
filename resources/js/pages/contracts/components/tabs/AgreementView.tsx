import { Button } from '@/components/ui/buttons/Button';
import LoadingLottie from '@/components/ui/feedback/LoadingLottie';
import { useToast } from '@/components/ui/feedback/Toast';
import { SearchInput } from '@/components/ui/inputs/SearchInput';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils';
import { Contract } from '@/pages/contracts/types';
import axios from 'axios';
import { AppIcon, Icons } from '@/components/ui';

const {
    ArrowRight,
    Diff,
    Download,
    ExternalLink,
    FileText,
    History,
    Loader2,
    Maximize2,
    Minimize2,
    MoreVertical,
    PenTool,
    RefreshCw,
    Upload,
} = Icons;
import React, { useCallback, useEffect, useRef, useState } from 'react';

interface AgreementVersion {
    id: string;
    version_no: number;
    file_name: string;
    file_path: string;
    change_log: string | null;
    uploaded_by: string;
    uploader?: { name: string };
    created_at: string;
}

export default function AgreementView({
    contract,
    onUpdate,
    docType = 'agreement',
    meId,
}: {
    contract: Contract;
    onUpdate: (c: Contract) => void;
    docType?: 'agreement' | 'contract' | 'f1' | 'f2';
    meId?: string;
}) {
    // Normalize 'contract' to 'agreement' for internal logic if needed, but we keep docType intact.
    const effectiveDocType = docType === 'contract' ? 'agreement' : docType;
    const isRevision = effectiveDocType === 'f1' || effectiveDocType === 'f2';
    const { showToast } = useToast();
    const [versions, setVersions] = useState<AgreementVersion[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadPhase, setUploadPhase] = useState<'idle' | 'uploading' | 'processing' | 'rendering'>('idle');
    const [uploadFileName, setUploadFileName] = useState('');
    const [uploadFileSize, setUploadFileSize] = useState('');
    const [isIframeLoading, setIsIframeLoading] = useState(false);
    const [selectedVno, setSelectedVno] = useState<number | null>(null);
    const [showVersions, setShowVersions] = useState(false);
    const [showMoreActions, setShowMoreActions] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearch = useDebounce(searchQuery, 500);
    const [uploadNote, setUploadNote] = useState('');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const previewContainerRef = useRef<HTMLDivElement>(null);

    const toggleFullscreen = () => {
        if (!previewContainerRef.current) return;
        if (!document.fullscreenElement) {
            previewContainerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {
                const url = selectedVno ? `/api/contracts/${contract.id}/pdf/${selectedVno}?type=${effectiveDocType}` : null;
                if (url) window.open(url, '_blank');
            });
        } else {
            document.exitFullscreen().then(() => setIsFullscreen(false));
        }
    };

    useEffect(() => {
        const handleFsChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFsChange);
        return () => document.removeEventListener('fullscreenchange', handleFsChange);
    }, []);

    // Sidebar/Dropdown click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowVersions(false);
                setShowMoreActions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showVersions, showMoreActions]);

    const [lastUpdated, setLastUpdated] = useState(Date.now());

    const loadVersions = useCallback(
        async (forceLatest = false, silent = false) => {
            if (!silent) setLoading(true);
            try {
                const url = isRevision
                    ? `/api/contracts/${contract.id}/revision/versions?type=${effectiveDocType}`
                    : `/api/contracts/${contract.id}/agreement/versions`;
                const res = await axios.get(url);
                setVersions(res.data);

                if (res.data.length > 0 && (forceLatest || !selectedVno)) {
                    setSelectedVno(res.data[0].version_no);
                }
                setLastUpdated(Date.now()); // Update timestamp on refresh
            } catch (err) {
                console.error('Failed to load agreement versions', err);
            } finally {
                if (!silent) setLoading(false);
            }
        },
        [contract.id, selectedVno, isRevision, effectiveDocType],
    );

    useEffect(() => {
        loadVersions();
    }, [loadVersions]);

    // Refresh version list if the contract prop's versions have changed (e.g. upload from sidebar)
    const contractVersionsCount = contract.versions?.length || 0;
    useEffect(() => {
        if (contractVersionsCount > 0) {
            loadVersions(true, true); // Silent refresh
        }
    }, [contractVersionsCount]);

    const isCreator = contract.created_by === meId;
    const isApprover = (contract as any).can_approve;

    // --- SIGNING LOGIC ---
    const activeSignerApproval = React.useMemo(() => {
        return (contract.approvals || []).find(
            (a: any) => a.status === 'pending' && a.user_id === meId && (a.role === 'Pihak 1' || a.role === 'Pihak 2' || a.role === 'Penandatangan'),
        );
    }, [contract.approvals, meId]);

    const isSigner = !!activeSignerApproval;
    const stepDownloaded = activeSignerApproval ? contract.metadata?.[`downloaded_step_${activeSignerApproval.id}`] : null;

    const handleDownload = async (vId?: string) => {
        const versionsList = versions.length > 0 ? versions : contract.versions?.filter((v) => v.document_type === 'agreement') || [];
        if (versionsList.length === 0) {
            showToast('Tidak ada dokumen agreement yang ditemukan.', 'danger');
            return;
        }

        const versionToDownload = vId ? versionsList.find((v) => v.id === vId) : versionsList.sort((a, b) => b.version_no - a.version_no)[0];

        const downloadUrl = `/api/contracts/${contract.id}/file/${versionToDownload.version_no}?type=${effectiveDocType}`;
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = versionToDownload.file_name || 'document';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        if (isSigner && activeSignerApproval) {
            const newMeta = { ...contract.metadata };

            // Track globally for legacy P1/P2
            if (activeSignerApproval?.role === 'Pihak 1') newMeta['p1_downloaded_at'] = new Date().toISOString();
            if (activeSignerApproval?.role === 'Pihak 2') newMeta['p2_downloaded_at'] = new Date().toISOString();

            // Track specifically for this approval step
            newMeta[`downloaded_step_${activeSignerApproval.id}`] = new Date().toISOString();

            try {
                const res = await axios.patch(`/api/contracts/${contract.id}`, { metadata: newMeta });
                if (onUpdate) onUpdate(res.data);
            } catch (e) {
                console.error('Failed to update download metadata', e);
            }
        }
    };
    // ---------------------

    const allowFlag =
        effectiveDocType === 'f1' ? contract.allow_f1_edit : effectiveDocType === 'f2' ? contract.allow_f2_edit : contract.allow_agreement_edit;

    // We allow edit if user is Creator or Approver, AND the flag is not explicitly false.
    // (Admins who are neither will be read-only on frontend unless we pass their role)
    const canEdit = (isCreator || isApprover || isSigner) && allowFlag !== false;

    const formatSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const lowerName = file.name.toLowerCase();
        const isValidExt = lowerName.endsWith('.docx') || lowerName.endsWith('.doc') || lowerName.endsWith('.pdf');
        if (!isValidExt) {
            showToast('Hanya file .docx, .doc, atau .pdf yang diijinkan.', 'danger');
            return;
        }

        setUploading(true);
        setUploadPhase('uploading');
        setUploadProgress(0);
        setUploadFileName(file.name);
        setUploadFileSize(formatSize(file.size));
        setIsIframeLoading(true);

        const uploadConfig = {
            onUploadProgress: (progressEvent: any) => {
                if (progressEvent.total) {
                    const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(Math.min(percent, 98));
                    if (percent >= 98) {
                        setUploadPhase('processing');
                    }
                }
            },
        };

        // If it's a signer, use the approval/signing API
        if (isSigner) {
            const formData = new FormData();
            formData.append('attachment', file);
            formData.append('note', 'Pembaruan Dokumen TTD');
            formData.append('action_code', 'approve');

            try {
                const res = await axios.post(`/api/contracts/${contract.id}/approve`, formData, uploadConfig);
                setUploadProgress(100);
                setUploadPhase('rendering');
                if (onUpdate && res.data) onUpdate(res.data);
                showToast('Persetujuan Tanda Tangan berhasil diunggah.', 'success');
                await loadVersions(true, true);
            } catch (err: any) {
                showToast(err.response?.data?.message || 'Gagal mengunggah persetujuan.', 'danger');
            } finally {
                setTimeout(() => {
                    setUploading(false);
                    setUploadPhase('idle');
                }, 500);
            }
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        if (isRevision) {
            formData.append('changelog', uploadNote || 'Revisi Dokumen');
            formData.append('document_type', effectiveDocType);
        } else {
            formData.append('change_log', uploadNote);
        }

        try {
            const url = isRevision ? `/api/contracts/${contract.id}/revision` : `/api/contracts/${contract.id}/agreement`;
            const res = await axios.post(url, formData, uploadConfig);
            setUploadProgress(100);
            setUploadPhase('rendering');
            setUploadNote('');
            if (onUpdate && res.data) onUpdate(res.data);
            await loadVersions(true, true);
            const typeLabel = effectiveDocType === 'f1' ? 'Sub-dokumen F1' : effectiveDocType === 'f2' ? 'Sub-dokumen F2' : 'Draft Perjanjian';
            showToast(`${typeLabel} berhasil diunggah.`, 'success');
        } catch (err: any) {
            console.error('Upload failed', err);
            showToast(err.response?.data?.message || 'Gagal mengupload agreement.', 'danger');
        } finally {
            setTimeout(() => {
                setUploading(false);
                setUploadPhase('idle');
            }, 600);
        }
    };

    const handlePreview = (versionNo: number) => {
        setSelectedVno(versionNo);
        setLastUpdated(Date.now()); // Force refresh for this specific version
        setShowVersions(false);
    };

    const handleCompare = () => {
        const v1 = versions.length > 1 ? versions[1].version_no : selectedVno;
        const v2 = selectedVno;

        const url = `/admin/contracts/${contract.id}/agreement/compare?v1=${v1}&v2=${v2}&type=${effectiveDocType}`;

        window.open(url, '_blank');
    };

    const filteredVersions = React.useMemo(() => {
        if (!debouncedSearch) return versions;
        const q = debouncedSearch.toLowerCase();
        return versions.filter((v) => {
            return v.version_no.toString().includes(q) || v.uploader?.name?.toLowerCase().includes(q) || v.created_at.toLowerCase().includes(q);
        });
    }, [versions, debouncedSearch]);

    const selectedVersion = React.useMemo(() => {
        return versions.find((v) => v.version_no === selectedVno) || versions[0];
    }, [versions, selectedVno]);

    // PDF Preview URL targeting the backend conversion endpoint
    // Using lastUpdated state for cache-busting instead of inline Date.now()
    const pdfUrl = selectedVno ? `/api/contracts/${contract.id}/pdf/${selectedVno}?type=${effectiveDocType}&t=${lastUpdated}#view=FitH` : null;

    const labelMapping: Record<string, string> = {
        f1: 'Dokumen F1',
        f2: 'Dokumen F2',
        agreement: 'Persetujuan',
    };
    const titleLabel = labelMapping[effectiveDocType] || 'Persetujuan';

    return (
        <div className="bg-card animate-in fade-in flex flex-1 flex-col w-full h-full min-h-0 overflow-hidden duration-300 p-3 lg:p-4 gap-3">
            {/* Header Area */}
            <div className="bg-primary text-primary-foreground shrink-0 flex h-9.5 min-h-[38px] max-h-[38px] items-center justify-between px-4 rounded-xl shadow-xs">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <PenTool size={15} className="text-primary-foreground/90" />
                        <h4 className="text-xs font-semibold tracking-tight text-primary-foreground uppercase">Preview {titleLabel}</h4>
                        {selectedVno && (
                            <span className="rounded bg-white/20 border border-white/30 px-1.5 py-0.5 text-[9px] font-bold text-white">
                                V{selectedVno}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2" ref={dropdownRef}>
                    {versions.length > 0 && (
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setShowVersions(!showVersions)}
                                className={cn(
                                    "flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-xs font-medium transition-colors border cursor-pointer",
                                    showVersions 
                                        ? "bg-white text-primary border-white shadow-xs font-bold" 
                                        : "bg-white/15 hover:bg-white/25 text-white border-white/20"
                                )}
                            >
                                <History size={13} />
                                <span>{versions.length} Versi</span>
                            </button>

                            {showVersions && (
                                <div className="animate-in fade-in zoom-in-95 bg-surface-base text-foreground absolute top-full left-0 z-[999] mt-2 w-72 origin-top-left rounded-xl border border-surface-border p-1 shadow-2xl duration-200">
                                    <div className="border-b border-black/5 p-2 dark:border-white/5">
                                        <SearchInput
                                            autoFocus
                                            placeholder="Cari riwayat versi..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="h-9 text-[11px]"
                                        />
                                    </div>
                                    <div className="max-h-[300px] overflow-y-auto py-1">
                                        {filteredVersions.map((v) => (
                                            <Button
                                                key={v.id}
                                                variant="ghost"
                                                onClick={() => handlePreview(v.version_no)}
                                                className="group flex h-auto w-full items-center justify-between px-3 py-3 text-left transition-all hover:bg-black/5 dark:hover:bg-white/5"
                                            >
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className={cn(
                                                                'flex h-6 w-6 items-center justify-center rounded bg-black text-[10px] font-medium text-white shadow-sm transition-colors dark:bg-white dark:text-black',
                                                                selectedVno !== v.version_no && 'bg-black/10 dark:bg-white/10',
                                                            )}
                                                        >
                                                            {v.version_no}
                                                        </span>
                                                        <span className="text-xs font-medium text-black dark:text-white">{v.file_name}</span>
                                                    </div>
                                                    <span className="mt-1 text-[10px] font-medium text-black/30 dark:text-white/30">
                                                        {v.created_at} &bull; {v.uploader?.name || 'System'}
                                                    </span>
                                                </div>
                                                <ArrowRight
                                                    size={14}
                                                    className="text-black opacity-0 transition-all group-hover:opacity-100 dark:text-white"
                                                />
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={toggleFullscreen}
                        title={isFullscreen ? 'Keluar Full Screen' : 'Layar Penuh (Full Screen)'}
                        className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-xs font-medium bg-white/15 hover:bg-white/25 text-white border border-white/20 transition-colors cursor-pointer"
                    >
                        {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                        <span className="hidden sm:inline text-[11px]">{isFullscreen ? 'Keluar' : 'Full Screen'}</span>
                    </button>

                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setShowMoreActions(!showMoreActions)}
                            className={cn(
                                "flex items-center justify-center h-7 w-7 rounded-lg text-xs transition-colors border cursor-pointer",
                                showMoreActions 
                                    ? "bg-white text-primary border-white shadow-xs" 
                                    : "bg-white/15 hover:bg-white/25 text-white border-white/20"
                            )}
                        >
                            <MoreVertical size={14} />
                        </button>

                        {showMoreActions && (
                            <div className="animate-in fade-in zoom-in-95 border-surface-border bg-surface-base text-foreground absolute top-full right-0 z-[999] mt-2 w-64 origin-top-right rounded-2xl border p-1.5 shadow-2xl backdrop-blur-xl duration-200">
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        loadVersions();
                                        setShowMoreActions(false);
                                    }}
                                    className="text-text-main hover:bg-surface-muted flex h-auto w-full items-center justify-start gap-3 px-4 py-3 text-left text-xs transition-all"
                                >
                                    <RefreshCw size={16} className="opacity-40" />
                                    Refresh List
                                </Button>

                                {versions.length > 1 && (
                                    <Button
                                        variant="ghost"
                                        onClick={() => {
                                            handleCompare();
                                            setShowMoreActions(false);
                                        }}
                                        className="text-text-main hover:bg-surface-muted flex h-auto w-full items-center justify-start gap-3 px-4 py-3 text-left text-xs transition-all"
                                    >
                                        <Diff size={16} className="opacity-40" />
                                        Bandingkan Versi
                                    </Button>
                                )}

                                {selectedVersion && (
                                    <Button
                                        variant="ghost"
                                        onClick={() => {
                                            handleDownload(selectedVersion.id);
                                            setShowMoreActions(false);
                                        }}
                                        className="text-text-main hover:bg-surface-muted flex h-auto w-full items-center justify-start gap-3 px-4 py-3 text-left text-xs transition-all"
                                    >
                                        <Download size={16} className="opacity-40" />
                                        Download
                                    </Button>
                                )}

                                {pdfUrl && (
                                    <Button
                                        variant="ghost"
                                        onClick={() => {
                                            window.open(pdfUrl, '_blank');
                                            setShowMoreActions(false);
                                        }}
                                        className="text-text-main hover:bg-surface-muted flex h-auto w-full items-center justify-start gap-3 px-4 py-3 text-left text-xs transition-all"
                                    >
                                        <ExternalLink size={16} className="opacity-40" />
                                        Buka di Tab Baru
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>

                    {canEdit && (
                        <div className="flex items-center gap-1">
                            <input
                                ref={fileInputRef}
                                type="file"
                                className="hidden"
                                accept=".docx,.DOCX,.doc,.DOC,.pdf,.PDF"
                                onChange={handleFileChange}
                                onClick={(e) => {
                                    // Reset value so re-selecting same file triggers onChange
                                    (e.target as HTMLInputElement).value = '';
                                }}
                            />
                            <button
                                type="button"
                                className="bg-white text-primary hover:bg-white/90 h-7 px-3 text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                                disabled={uploading}
                                onClick={() => {
                                    if (isSigner && !stepDownloaded) {
                                        showToast('Harap unduh dokumen terlebih dahulu sebelum mengunggah persetujuan.', 'warning');
                                        return;
                                    }
                                    fileInputRef.current?.click();
                                }}
                            >
                                {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                                <span>Upload</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Preview Area - PDF Iframe (Full Width & Height, No Padding/Margin) */}
            <div ref={previewContainerRef} className="relative flex flex-1 flex-col w-full h-full min-h-0 overflow-hidden bg-white dark:bg-zinc-900 rounded-xl border border-surface-border p-0 m-0">
                {/* Uploading / Processing Glassmorphism Overlay */}
                {uploading && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md transition-all duration-300 animate-in fade-in">
                        <div className="w-full max-w-md mx-4 p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl text-slate-800 dark:text-zinc-100 flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
                            <div className="relative mb-4">
                                <div className="h-16 w-16 rounded-2xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary">
                                    {uploadPhase === 'uploading' ? (
                                        <Upload className="h-8 w-8 animate-bounce text-primary" />
                                    ) : uploadPhase === 'processing' ? (
                                        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                                    ) : (
                                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                    )}
                                </div>
                                <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-4 w-4 bg-primary"></span>
                                </span>
                            </div>

                            <h4 className="text-sm font-bold tracking-tight mb-1 text-slate-900 dark:text-white">
                                {uploadPhase === 'uploading' && 'Mengunggah Berkas...'}
                                {uploadPhase === 'processing' && 'Memproses & Mengonversi Dokumen ke PDF...'}
                                {uploadPhase === 'rendering' && 'Menyiapkan Tampilan Preview...'}
                            </h4>

                            {uploadFileName && (
                                <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium mb-4 truncate max-w-xs">
                                    {uploadFileName} {uploadFileSize ? `(${uploadFileSize})` : ''}
                                </p>
                            )}

                            {/* Progress bar */}
                            <div className="w-full bg-slate-100 dark:bg-zinc-800 rounded-full h-2.5 overflow-hidden mb-2.5">
                                <div
                                    className={cn(
                                        "h-full rounded-full transition-all duration-300 bg-primary",
                                        uploadPhase === 'processing' && "animate-pulse"
                                    )}
                                    style={{
                                        width: uploadPhase === 'processing' ? '100%' : `${uploadProgress}%`,
                                    }}
                                />
                            </div>

                            <div className="w-full flex justify-between items-center text-[10px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                                <span>
                                    {uploadPhase === 'uploading' ? 'Upload ke server' : uploadPhase === 'processing' ? 'Konversi PDF' : 'Finalisasi'}
                                </span>
                                <span>{uploadProgress}%</span>
                            </div>
                        </div>
                    </div>
                )}

                {loading ? (
                    /* High-polish Document Skeleton during initial loading */
                    <div className="flex flex-1 flex-col items-center justify-center p-8 bg-slate-50/50 dark:bg-zinc-950/50 animate-pulse">
                        <div className="w-full max-w-[210mm] h-[85vh] max-h-[700px] bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-slate-200 dark:border-zinc-800 p-8 flex flex-col justify-between">
                            <div className="space-y-6">
                                {/* Header skeleton */}
                                <div className="flex justify-between items-center pb-6 border-b border-slate-100 dark:border-zinc-800">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-slate-200 dark:bg-zinc-800" />
                                        <div className="space-y-2">
                                            <div className="h-3.5 w-36 rounded bg-slate-200 dark:bg-zinc-800" />
                                            <div className="h-2.5 w-24 rounded bg-slate-100 dark:bg-zinc-800/60" />
                                        </div>
                                    </div>
                                    <div className="h-6 w-20 rounded-full bg-slate-200 dark:bg-zinc-800" />
                                </div>

                                {/* Body skeleton lines */}
                                <div className="space-y-3 pt-4">
                                    <div className="h-3 w-3/4 rounded bg-slate-200 dark:bg-zinc-800" />
                                    <div className="h-3 w-full rounded bg-slate-100 dark:bg-zinc-800/60" />
                                    <div className="h-3 w-5/6 rounded bg-slate-100 dark:bg-zinc-800/60" />
                                    <div className="h-3 w-2/3 rounded bg-slate-100 dark:bg-zinc-800/60" />
                                </div>

                                <div className="space-y-3 pt-6">
                                    <div className="h-4 w-48 rounded bg-slate-200 dark:bg-zinc-800" />
                                    <div className="h-3 w-full rounded bg-slate-100 dark:bg-zinc-800/60" />
                                    <div className="h-3 w-11/12 rounded bg-slate-100 dark:bg-zinc-800/60" />
                                    <div className="h-3 w-4/5 rounded bg-slate-100 dark:bg-zinc-800/60" />
                                </div>
                            </div>

                            <div className="flex items-center justify-center gap-2 py-4 text-xs font-semibold text-primary">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Menyiapkan Dokumen {titleLabel}...</span>
                            </div>
                        </div>
                    </div>
                ) : versions.length === 0 ? (
                    <div className="flex flex-1 flex-col items-center justify-center p-12 text-center bg-slate-50/50 dark:bg-zinc-950/50">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 dark:bg-primary/20 text-primary border border-primary/20">
                            <FileText size={32} />
                        </div>
                        <h4 className="mb-1 text-sm font-bold text-slate-900 dark:text-white">Dokumen {titleLabel} Belum Tersedia</h4>
                        <p className="max-w-md text-xs text-slate-500 dark:text-zinc-400 mb-5">
                            Upload berkas {titleLabel.toLowerCase()} (.pdf, .docx, atau .doc) untuk mulai melihat pratinjau dan riwayat versi dokumen.
                        </p>
                        {canEdit && (
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 shadow-md transition-all cursor-pointer"
                            >
                                <Upload size={14} />
                                <span>Pilih Berkas untuk Diunggah</span>
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="relative w-full h-full min-h-0 flex-1 p-0 m-0 border-none overflow-hidden bg-slate-100 dark:bg-zinc-950">
                        {/* Iframe Loading Spinner overlay */}
                        {isIframeLoading && (
                            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xs transition-opacity duration-300">
                                <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-white dark:bg-zinc-800 shadow-md border border-slate-200 dark:border-zinc-700">
                                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                    <span className="text-xs font-semibold text-slate-700 dark:text-zinc-200">
                                        Merender Pratinjau PDF...
                                    </span>
                                </div>
                            </div>
                        )}

                        {pdfUrl ? (
                            <iframe
                                src={pdfUrl}
                                onLoad={() => setIsIframeLoading(false)}
                                className="w-full h-full min-h-0 flex-1 border-none p-0 m-0"
                                title="Agreement Preview"
                            />
                        ) : (
                            <div className="flex flex-1 items-center justify-center py-20">
                                <LoadingLottie width={120} height={120} />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
