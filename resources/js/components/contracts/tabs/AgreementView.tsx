import { useToast } from '@/components/ui/feedback/Toast';
import { Button } from '@/components/ui/base/Button';
import LoadingLottie from '@/components/ui/feedback/LoadingLottie';
import { SearchInput } from '@/components/ui/forms/SearchInput';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils';
import { Contract } from '@/types/contracts';
import axios from 'axios';
import { ArrowRight, Diff, Download, FileText, History, Loader2, MoreVertical, RefreshCw, Upload } from 'lucide-react';
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
    meId
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
    const [selectedVno, setSelectedVno] = useState<number | null>(null);
    const [showVersions, setShowVersions] = useState(false);
    const [showMoreActions, setShowMoreActions] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearch = useDebounce(searchQuery, 500);
    const [uploadNote, setUploadNote] = useState('');

    const dropdownRef = useRef<HTMLDivElement>(null);

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

    const loadVersions = useCallback(
        async (forceLatest = false) => {
            setLoading(true);
            try {
                const url = isRevision 
                    ? `/api/contracts/${contract.id}/revision/versions?type=${effectiveDocType}`
                    : `/api/contracts/${contract.id}/agreement/versions`;
                const res = await axios.get(url);
                setVersions(res.data);

                if (res.data.length > 0 && (forceLatest || !selectedVno)) {
                    setSelectedVno(res.data[0].version_no);
                }
            } catch (err) {
                console.error('Failed to load agreement versions', err);
            } finally {
                setLoading(false);
            }
        },
        [contract.id, selectedVno, isRevision, effectiveDocType],
    );

    useEffect(() => {
        loadVersions();
    }, [loadVersions]);

    const isCreator = contract.created_by === meId;
    const isApprover = (contract as any).can_approve;

    const allowFlag =
        effectiveDocType === 'f1'
            ? contract.allow_f1_edit
            : effectiveDocType === 'f2'
              ? contract.allow_f2_edit
              : contract.allow_agreement_edit;

    // We allow edit if user is Creator or Approver, AND the flag is not explicitly false.
    // (Admins who are neither will be read-only on frontend unless we pass their role)
    const canEdit = (isCreator || isApprover) && allowFlag !== false;

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!isRevision && !file.name.endsWith('.docx')) {
            showToast('Hanya file .docx yang diijinkan untuk Draft Perjanjian.', 'danger');
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        if (isRevision) {
            formData.append('changelog', uploadNote || 'Revisi Dokumen');
            formData.append('document_type', effectiveDocType);
        } else {
            formData.append('change_log', uploadNote);
        }

        try {
            const url = isRevision 
                ? `/api/contracts/${contract.id}/revision` 
                : `/api/contracts/${contract.id}/agreement`;
            const res = await axios.post(url, formData);
            setUploadNote('');
            if (onUpdate && res.data) onUpdate(res.data);
            await loadVersions(true);
        } catch (err) {
            console.error('Upload failed', err);
            showToast('Gagal mengupload agreement.', 'danger');
        } finally {
            setUploading(false);
        }
    };

    const handlePreview = (versionNo: number) => {
        setSelectedVno(versionNo);
        setShowVersions(false);
    };

    const handleCompare = () => {
        const v1 = versions.length > 1 ? versions[1].version_no : selectedVno;
        const v2 = selectedVno;
        
        const url = isRevision
            ? `/admin/contracts/${contract.id}/form-submissions/${effectiveDocType}/compare?v1=${v1}&v2=${v2}`
            : `/admin/contracts/${contract.id}/agreement/compare?v1=${v1}&v2=${v2}`;
            
        window.open(url, '_blank');
    };

    const filteredVersions = React.useMemo(() => {
        if (!debouncedSearch) return versions;
        const q = debouncedSearch.toLowerCase();
        return versions.filter((v) => {
            return (
                v.version_no.toString().includes(q) ||
                v.uploader?.name?.toLowerCase().includes(q) ||
                v.created_at.toLowerCase().includes(q)
            );
        });
    }, [versions, debouncedSearch]);

    const selectedVersion = React.useMemo(() => {
        return versions.find((v) => v.version_no === selectedVno) || versions[0];
    }, [versions, selectedVno]);

    // PDF Preview URL targeting the backend conversion endpoint
    const pdfUrl = selectedVno ? `/api/contracts/${contract.id}/pdf/${selectedVno}?type=${effectiveDocType}#view=FitH` : null;

    const labelMapping: Record<string, string> = {
        f1: 'Dokumen F1',
        f2: 'Dokumen F2',
        agreement: 'Persetujuan'
    };
    const titleLabel = labelMapping[effectiveDocType] || 'Persetujuan';

    return (
        <div className="bg-card animate-in fade-in custom-scrollbar flex flex-1 flex-col overflow-hidden duration-300">
            {/* Header Area */}
            <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b border-black/5 bg-white/50 px-6 backdrop-blur-md dark:border-white/5 dark:bg-black/50">
                <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <h4 className="text-xs font-medium tracking-tight text-black uppercase dark:text-white">Preview {titleLabel}</h4>
                            {selectedVno && (
                                <span className="rounded bg-black/5 px-1.5 py-0.5 text-[9px] font-medium text-black/60 dark:bg-white/10 dark:text-white/60">
                                    V{selectedVno}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2.5" ref={dropdownRef}>
                    {versions.length > 0 && (
                        <div className="relative">
                            <Button
                                variant={showVersions ? 'primary' : 'outline'}
                                size="sm"
                                onClick={() => setShowVersions(!showVersions)}
                                className={cn(
                                    'gap-2 border px-3 transition-all',
                                    showVersions
                                        ? 'bg-black text-white dark:bg-white dark:text-black'
                                        : 'border-black/5 bg-white text-black/60 hover:border-black/20 hover:text-black dark:border-white/5 dark:bg-transparent dark:text-white/60 dark:hover:text-white',
                                )}
                            >
                                <History
                                    size={14}
                                    className={cn(
                                        'transition-colors',
                                        showVersions
                                            ? 'text-white'
                                            : 'text-black/40 group-hover:text-black dark:text-white/40 dark:group-hover:text-white',
                                    )}
                                />
                                <span>{versions.length} Versi</span>
                            </Button>

                            {showVersions && (
                                <div className="animate-in fade-in zoom-in-95 dark:bg-sidebar absolute top-full left-0 z-[999] mt-2 w-72 origin-top-left rounded-xl border border-black/10 bg-white p-1 shadow-2xl duration-200 dark:border-white/10">
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

                    <div className="relative">
                        <Button
                            variant={showMoreActions ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => setShowMoreActions(!showMoreActions)}
                            className={cn(
                                'w-8 border px-0 transition-all',
                                showMoreActions
                                    ? 'bg-black text-white dark:bg-white dark:text-black'
                                    : 'border-black/5 bg-white text-black/40 hover:bg-black/5 dark:border-white/5 dark:bg-transparent dark:text-white/40',
                            )}
                        >
                            <MoreVertical size={14} />
                        </Button>

                        {showMoreActions && (
                            <div className="animate-in fade-in zoom-in-95 absolute top-full right-0 z-[999] mt-2 w-64 origin-top-right rounded-2xl border border-surface-border bg-surface-base p-1.5 shadow-2xl backdrop-blur-xl duration-200">
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        loadVersions();
                                        setShowMoreActions(false);
                                    }}
                                    className="flex w-full h-auto items-center justify-start gap-3 px-4 py-3 text-left text-xs text-text-main transition-all hover:bg-surface-muted"
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
                                        className="flex w-full h-auto items-center justify-start gap-3 px-4 py-3 text-left text-xs text-text-main transition-all hover:bg-surface-muted"
                                    >
                                        <Diff size={16} className="opacity-40" />
                                        Bandingkan Versi
                                    </Button>
                                )}

                                {selectedVersion && (
                                    <a
                                        href={isRevision 
                                            ? `/api/contracts/versions/${selectedVersion.id}/download`
                                            : `/api/contracts/agreement-versions/${selectedVersion.id}/download`
                                        }
                                        download
                                        className="flex w-full h-auto items-center justify-start gap-3 px-4 py-3 text-left text-xs text-text-main transition-all hover:bg-surface-muted"
                                    >
                                        <Download size={16} className="opacity-40" />
                                        Download Dokumen
                                    </a>
                                )}
                            </div>
                        )}
                    </div>

                    {canEdit && (
                        <Button
                            asChild
                            className={cn(
                                'h-10 px-6',
                                uploading && 'pointer-events-none opacity-50',
                            )}
                        >
                            <label className="cursor-pointer">
                                <input type="file" className="hidden" accept={isRevision ? ".pdf,.doc,.docx" : ".docx"} onChange={handleFileChange} disabled={uploading} />
                                {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                                Upload Versi Baru
                            </label>
                        </Button>
                    )}
                </div>
            </div>

            {/* Main Preview Area - PDF Iframe */}
            <div className="relative flex min-h-[1000px] flex-1 flex-col overflow-hidden border-t border-surface-border bg-surface-base dark:bg-transparent">
                {loading ? (
                    <div className="flex h-full flex-col items-center justify-center gap-4">
                        <LoadingLottie width={120} height={120} />
                        <span className="text-[10px] font-semibold tracking-[0.2em] text-[#172554] uppercase dark:text-white">Memuat Dokumen...</span>
                    </div>
                ) : versions.length === 0 ? (
                    <div className="flex flex-1 flex-col items-center justify-center p-20 text-center">
                        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-dashed border-black/20 dark:border-white/20">
                            <FileText size={40} className="text-black/40 dark:text-white/40" />
                        </div>
                        <h4 className="mb-2 text-xs font-medium text-black dark:text-white">Dokumen Tidak Tersedia</h4>
                        <p className="max-w-sm text-[11px] font-medium text-black/40 dark:text-white/40">
                            Upload draf final {titleLabel.toLowerCase()} Anda ({isRevision ? '.pdf, .docx' : '.docx'}) untuk mulai melacak versi secara dinamis.
                        </p>
                    </div>
                ) : (
                    <>
                        {pdfUrl ? (
                            <iframe src={pdfUrl} className="min-h-[1000px] w-full flex-1 border-none bg-white" title="Agreement Preview" />
                        ) : (
                            <div className="flex flex-1 items-center justify-center">
                                <LoadingLottie width={120} height={120} />
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
