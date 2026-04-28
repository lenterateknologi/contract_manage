import { cn } from '@/lib/utils';
import { Contract } from '@/types/contracts';
import axios from 'axios';
import { Diff, Download, FileText, History, Loader2, Upload, ExternalLink, X } from 'lucide-react'; 
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useToast } from '@/components/contracts/Toast';

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
    const pdfUrl = selectedVno 
        ? `/api/contracts/${contract.id}/pdf/${selectedVno}?type=agreement#view=FitH` 
        : null;

    return (
        <div className="bg-card animate-in fade-in flex flex-1 flex-col overflow-hidden duration-500">
            {/* Header Area */}
            <div className="border-border/60 sticky top-0 z-40 flex h-[72px] shrink-0 items-center justify-between border-b bg-white/50 px-6 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <div className="h-4 w-1 rounded-full bg-indigo-600" />
                            <h4 className="text-[11px] leading-none font-black tracking-tighter text-slate-900 uppercase">
                                Agreement Preview
                            </h4>
                            {selectedVno && (
                                <span className="animate-in fade-in zoom-in rounded bg-slate-950 px-1.5 py-0.5 text-[8px] font-black tracking-widest text-white uppercase duration-500">
                                    V{selectedVno}
                                </span>
                            )}
                        </div>
                        <span className="mt-1.5 text-[9px] font-black tracking-[0.2em] text-indigo-500 uppercase">
                            High-Fidelity PDF Preview &bull; Layout Preserved
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2.5" ref={dropdownRef}>
                    {versions.length > 0 && (
                        <div className="relative">
                            <button
                                onClick={() => setShowVersions(!showVersions)}
                                className={cn(
                                    'border-border flex h-8 items-center gap-1.5 rounded-xl border bg-white px-3 text-[9px] font-black tracking-widest uppercase shadow-sm transition-all active:scale-95',
                                    showVersions ? 'border-slate-900 bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50',
                                )}
                            >
                                <History size={11} className={cn('text-indigo-500', showVersions && 'text-white')} />
                                {versions.length} <span className={cn('opacity-40', showVersions && 'opacity-60')}>VERSIONS</span>
                                <i className={cn('fa-solid fa-chevron-down ml-1 text-[8px] transition-transform', showVersions && 'rotate-180')} />
                            </button>

                            {showVersions && (
                                <div className="animate-in fade-in zoom-in-95 absolute top-full left-0 z-[999] mt-2 w-72 origin-top-left rounded-xl border border-slate-200 bg-white p-1 shadow-2xl shadow-slate-200/50 duration-200 outline-none">
                                    <div className="border-b border-slate-100 p-2">
                                        <div className="relative">
                                            <i className="fa-solid fa-magnifying-glass absolute top-1/2 left-3 -translate-y-1/2 text-[10px] text-slate-400" />
                                            <input
                                                autoFocus
                                                type="text"
                                                placeholder="Cari versi..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="w-full rounded-lg border border-slate-100 bg-slate-50 py-1.5 pr-3 pl-8 text-[11px] font-bold transition-all outline-none focus:border-indigo-200 focus:bg-white"
                                            />
                                        </div>
                                    </div>
                                    <div className="max-h-[300px] overflow-y-auto py-1">
                                        {filteredVersions.map((v) => (
                                            <button
                                                key={v.id}
                                                onClick={() => handlePreview(v.version_no)}
                                                className="group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition-all hover:bg-slate-50"
                                            >
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className={cn(
                                                                'flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-black transition-colors',
                                                                selectedVno === v.version_no
                                                                    ? 'bg-indigo-600 text-white'
                                                                    : 'bg-slate-100 text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-600',
                                                            )}
                                                        >
                                                            {v.version_no}
                                                        </span>
                                                        <span className="text-[11px] font-bold text-slate-800">{v.file_name}</span>
                                                    </div>
                                                    <span className="mt-1 text-[9px] font-medium tracking-tight text-slate-400 uppercase">
                                                        {v.created_at} &bull; {v.uploader?.name || 'System'}
                                                    </span>
                                                </div>
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
                                'border-border flex h-8 w-8 items-center justify-center rounded-xl border bg-white shadow-sm transition-all active:scale-95',
                                showMoreActions ? 'border-slate-900 bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'
                            )}
                        >
                            <i className="fa-solid fa-ellipsis-vertical text-[10px]" />
                        </button>

                        {showMoreActions && (
                            <div className="animate-in fade-in zoom-in-95 absolute top-full right-0 z-[999] mt-2 w-48 origin-top-right rounded-xl border border-slate-200 bg-white p-1 shadow-2xl shadow-slate-200/50 duration-200 outline-none">
                                <button
                                    onClick={() => {
                                        loadVersions();
                                        setShowMoreActions(false);
                                    }}
                                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[10px] font-bold text-slate-600 transition-all hover:bg-slate-50 hover:text-slate-900"
                                >
                                    <i className="fa-solid fa-arrows-rotate w-4 text-[10px] opacity-40" />
                                    REFRESH LIST
                                </button>

                                <button
                                    onClick={() => {
                                        handleCompare();
                                        setShowMoreActions(false);
                                    }}
                                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[10px] font-bold text-orange-600 transition-all hover:bg-orange-50"
                                >
                                    <Diff size={12} className="opacity-60" />
                                    COMPARE VERSIONS
                                </button>
                            </div>
                        )}
                    </div>

                    <label
                        className={cn(
                            'flex h-8 cursor-pointer items-center gap-2 rounded-xl bg-slate-900 px-5 text-[9px] font-black tracking-widest text-white uppercase shadow-lg shadow-slate-200 transition-all hover:bg-slate-800 active:scale-95',
                            uploading && 'pointer-events-none opacity-50',
                        )}
                    >
                        <input type="file" className="hidden" accept=".docx" onChange={handleFileUpload} disabled={uploading} />
                        {uploading ? <Loader2 size={11} className="animate-spin" /> : <Upload size={11} />}
                        UPLOAD NEW VERSION
                    </label>
                </div>
            </div>

            {/* Main Preview Area - PDF Iframe */}
            <div className="relative flex flex-1 flex-col overflow-hidden bg-slate-200 p-2 lg:p-8 min-h-[1000px] border-t border-slate-200">
                {loading ? (
                    <div className="flex h-full items-center justify-center">
                        <Loader2 size={32} className="animate-spin text-slate-300" />
                    </div>
                ) : versions.length === 0 ? (
                    <div className="flex flex-1 flex-col items-center justify-center p-12 text-center">
                        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-slate-200 bg-white">
                            <FileText size={40} className="text-slate-200" />
                        </div>
                        <h4 className="mb-2 text-sm font-black tracking-widest text-slate-400 uppercase">No Document Available</h4>
                        <p className="max-w-sm text-[10px] leading-relaxed font-bold tracking-tight text-slate-300 uppercase">
                            Upload the final draft of your agreement (.docx) to start version tracking and per-point auditing.
                        </p>
                    </div>
                ) : (
                    <>
                        {pdfUrl ? (
                            <iframe 
                                src={pdfUrl} 
                                className="flex-1 w-full border-none min-h-[1000px]"
                                title="Agreement Preview"
                            />
                        ) : (
                            <div className="flex flex-1 items-center justify-center">
                                <Loader2 size={32} className="animate-spin text-indigo-600" />
                            </div>
                        )}
                    </>
                )}
            </div>
            
            <style dangerouslySetInnerHTML={{ __html: `
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
            `}} />
        </div>
    );
}
