import { useToast } from '@/components/contracts/Toast';
import LoadingLottie from '@/components/ui/feedback/LoadingLottie';
import { SearchInput } from '@/components/ui/forms/SearchInput';
import { cn } from '@/lib/utils';
import { Contract } from '@/types/contracts';
import axios from 'axios';
import { ArrowRight, ChevronDown, Diff, FileText, History, Loader2, MoreVertical, RefreshCw, Upload } from 'lucide-react';
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

export default function AgreementView({ contract, onUpdate }: { contract: Contract; onUpdate: (c: Contract) => void }) {
    const { showToast } = useToast();
    const [versions, setVersions] = useState<AgreementVersion[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [selectedVno, setSelectedVno] = useState<number | null>(null);
    const [showVersions, setShowVersions] = useState(false);
    const [showMoreActions, setShowMoreActions] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
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
                const res = await axios.get(`/api/contracts/${contract.id}/agreement/versions`);
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
        [contract.id, selectedVno],
    );

    useEffect(() => {
        loadVersions();
    }, [loadVersions]);

    const isDraft = contract.status === 'draft';

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.name.endsWith('.docx')) {
            showToast('Hanya file .docx yang diijinkan.', 'danger');
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('change_log', uploadNote);

        try {
            const res = await axios.post(`/api/contracts/${contract.id}/agreement`, formData);
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
        window.open(`/admin/contracts/${contract.id}/agreement/compare?v1=${v1}&v2=${v2}`, '_blank');
    };

    const filteredVersions = versions.filter((v) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return v.version_no.toString().includes(q) || v.uploader?.name?.toLowerCase().includes(q) || v.created_at.toLowerCase().includes(q);
    });

    // PDF Preview URL targeting the backend conversion endpoint
    const pdfUrl = selectedVno ? `/api/contracts/${contract.id}/pdf/${selectedVno}?type=agreement#view=FitH` : null;

    return (
        <div className="bg-card animate-in fade-in flex flex-1 flex-col overflow-hidden duration-300">
            {/* Header Area */}
            <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b border-black/5 bg-white/50 px-6 backdrop-blur-md dark:border-white/5 dark:bg-black/50">
                <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold tracking-tight text-black dark:text-white uppercase">Preview Persetujuan</h4>
                            {selectedVno && (
                                <span className="rounded bg-black/5 px-1.5 py-0.5 text-[9px] font-bold text-black/60 dark:bg-white/10 dark:text-white/60">
                                    V{selectedVno}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2.5" ref={dropdownRef}>
                    {versions.length > 0 && (
                        <div className="relative">
                        <button
                            onClick={() => setShowVersions(!showVersions)}
                            className={cn(
                                'group flex h-8 items-center gap-2 rounded-lg border text-[11px] font-bold uppercase transition-all active:scale-95',
                                showVersions
                                    ? 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black'
                                    : 'border-black/5 bg-white text-black/60 hover:border-black/20 hover:text-black dark:border-white/5 dark:bg-transparent dark:text-white/60 dark:hover:text-white',
                            )}
                        >
                            <History
                                size={14}
                                className={cn(
                                    'ml-3 transition-colors',
                                    showVersions
                                        ? 'text-white'
                                        : 'text-black/40 group-hover:text-black dark:text-white/40 dark:group-hover:text-white',
                                )}
                            />
                            <span className="mr-3">{versions.length} Versi</span>
                        </button>

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
                                            <button
                                                key={v.id}
                                                onClick={() => handlePreview(v.version_no)}
                                                className="group flex w-full items-center justify-between rounded-lg px-3 py-3 text-left transition-all hover:bg-black/5 dark:hover:bg-white/5"
                                            >
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className={cn(
                                                                'flex h-6 w-6 items-center justify-center rounded bg-black text-[10px] font-bold text-white shadow-sm transition-colors dark:bg-white dark:text-black',
                                                                selectedVno !== v.version_no && 'bg-black/10 dark:bg-white/10',
                                                            )}
                                                        >
                                                            {v.version_no}
                                                        </span>
                                                        <span className="text-xs font-bold text-black dark:text-white">{v.file_name}</span>
                                                    </div>
                                                    <span className="mt-1 text-[10px] font-bold text-black/30 dark:text-white/30">
                                                        {v.created_at} &bull; {v.uploader?.name || 'System'}
                                                    </span>
                                                </div>
                                                <ArrowRight
                                                    size={14}
                                                    className="text-black opacity-0 transition-all group-hover:opacity-100 dark:text-white"
                                                />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="relative">
                        <button
                            onClick={() => setShowMoreActions(!showMoreActions)}
                            className={cn(
                                'flex h-8 w-8 items-center justify-center rounded-lg border transition-all active:scale-95',
                                showMoreActions
                                    ? 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black'
                                    : 'border-black/5 bg-white text-black/40 hover:bg-black/5 dark:border-white/5 dark:bg-transparent dark:text-white/40',
                            )}
                        >
                            <MoreVertical size={14} />
                        </button>

                        {showMoreActions && (
                            <div className="animate-in fade-in zoom-in-95 absolute top-full right-0 z-[999] mt-2 w-64 origin-top-right rounded-2xl border border-black/10 bg-white p-1.5 shadow-2xl backdrop-blur-xl duration-200 dark:border-white/10 dark:bg-[#1e293b]">
                                <button
                                    onClick={() => {
                                        loadVersions();
                                        setShowMoreActions(false);
                                    }}
                                    className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-xs font-semibold text-[#0f172a] transition-all hover:bg-black/5 dark:text-white dark:hover:bg-white/5"
                                >
                                    <RefreshCw size={16} className="opacity-40" />
                                    Refresh List
                                </button>

                                {versions.length > 1 && (
                                    <button
                                        onClick={() => {
                                            handleCompare();
                                            setShowMoreActions(false);
                                        }}
                                        className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-xs font-semibold text-[#0f172a] transition-all hover:bg-black/5 dark:text-white dark:hover:bg-white/5"
                                    >
                                        <Diff size={16} className="opacity-40" />
                                        Bandingkan Versi
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {isDraft && (
                        <label
                            className={cn(
                                'bg-primary flex h-9 cursor-pointer items-center gap-2 rounded-lg px-6 text-xs font-bold text-white shadow-lg transition-all hover:opacity-90 active:scale-95 dark:bg-white dark:text-black',
                                uploading && 'pointer-events-none opacity-50',
                            )}
                        >
                            <input type="file" className="hidden" accept=".docx" onChange={handleFileUpload} disabled={uploading} />
                            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                            Upload Versi Baru
                        </label>
                    )}
                </div>
            </div>

            {/* Main Preview Area - PDF Iframe */}
            <div className="relative flex min-h-[1000px] flex-1 flex-col overflow-hidden border-t border-black/10 bg-white dark:border-white/10 dark:bg-transparent">
                {loading ? (
                    <div className="flex h-full flex-col items-center justify-center gap-4">
                        <LoadingLottie width={120} height={120} />
                        <span className="text-[10px] font-black tracking-[0.2em] text-[#172554] uppercase dark:text-white">Memuat Dokumen...</span>
                    </div>
                ) : versions.length === 0 ? (
                    <div className="flex flex-1 flex-col items-center justify-center p-20 text-center">
                        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-dashed border-black/20 dark:border-white/20">
                            <FileText size={40} className="text-black/40 dark:text-white/40" />
                        </div>
                        <h4 className="mb-2 text-xs font-bold text-black dark:text-white">Dokumen Tidak Tersedia</h4>
                        <p className="max-w-sm text-[11px] font-bold text-black/40 dark:text-white/40">
                            Upload draf final persetujuan Anda (.docx) untuk mulai melacak versi dan melakukan audit per poin.
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

            <style
                dangerouslySetInnerHTML={{
                    __html: `
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
            `,
                }}
            />
        </div>
    );
}
