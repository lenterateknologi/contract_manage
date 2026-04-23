import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { 
    FileText, 
    Upload, 
    History, 
    Diff, 
    Download, 
    CheckCircle2, 
    Clock, 
    User,
    ArrowRight,
    X,
    FileSearch,
    AlertCircle,
    Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Contract } from '@/types/contracts';
import { renderAsync } from 'docx-preview';

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

interface ComparisonData {
    v1: { version_no: number; content: string };
    v2: { version_no: number; content: string };
}

/**
 * A specialized word-level diff viewer for legal documents.
 * High-fidelity highlighting of additions and deletions.
 */
function DiffViewer({ v1, v2 }: { v1: string, v2: string }) {
    const diffWords = (oldStr: string, newStr: string) => {
        const oldWords = oldStr.split(/(\s+)/);
        const newWords = newStr.split(/(\s+)/);
        
        const renderV1 = () => {
            const words2Set = new Set(newWords);
            return oldWords.map((w, i) => {
                const isDeleted = w.trim() !== "" && !words2Set.has(w);
                return <span key={i} className={cn(isDeleted ? "bg-rose-100 text-rose-800 line-through rounded-sm px-0.5" : "")}>{w}</span>;
            });
        };

        const renderV2 = () => {
            const words1Set = new Set(oldWords);
            return newWords.map((w, i) => {
                const isAdded = w.trim() !== "" && !words1Set.has(w);
                return <span key={i} className={cn(isAdded ? "bg-emerald-100 text-emerald-800 rounded-sm px-0.5" : "")}>{w}</span>;
            });
        };

        return { v1: renderV1(), v2: renderV2() };
    };

    const rendered = diffWords(v1, v2);

    return (
        <div className="flex-1 flex overflow-hidden bg-background h-full">
            <div className="flex-1 border-r border-border flex flex-col">
                <div className="p-3 bg-card border-b border-border text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex justify-between">
                    <span>DOKUMEN ASAL</span>
                    <span className="text-rose-500 flex items-center gap-1.5"><X size={10}/> DELETED TEXT</span>
                </div>
                <div className="flex-1 p-10 overflow-y-auto bg-background/50 font-serif text-sm leading-relaxed whitespace-pre-wrap select-text selection:bg-rose-200/30">
                    {rendered.v1}
                </div>
            </div>

            <div className="flex-1 flex flex-col">
                <div className="p-3 bg-card border-b border-border text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex justify-between">
                    <span>DOKUMEN PEMBANDING</span>
                    <span className="text-emerald-500 flex items-center gap-1.5"><CheckCircle2 size={10}/> ADDED TEXT</span>
                </div>
                <div className="flex-1 p-10 overflow-y-auto bg-background font-serif text-sm leading-relaxed whitespace-pre-wrap select-text selection:bg-emerald-200/30">
                    {rendered.v2}
                </div>
            </div>
        </div>
    );
}

/**
 * Visual Side-by-Side Comparison using docx-preview.

 * Preserves 100% of the formatting (tables, bold, etc.) with Sync Scroll.
 */
function VisualDiffViewer({ contractId, v1, v2 }: { contractId: string, v1: number, v2: number }) {
    const leftRef = useRef<HTMLDivElement>(null);
    const rightRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(true);
    const isScrolling = useRef(false);

    const renderFile = async (vno: number, container: HTMLDivElement) => {
        const res = await axios.get(`/api/contracts/${contractId}/file/${vno}?type=agreement`, {
            responseType: 'blob'
        });
        container.innerHTML = '';
        await renderAsync(res.data, container);
    };

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            if (leftRef.current && rightRef.current) {
                await Promise.all([
                    renderFile(v1, leftRef.current),
                    renderFile(v2, rightRef.current)
                ]);
            }
            setLoading(false);
        };
        load();
    }, [contractId, v1, v2]);

    // Sync Scroll Logic
    useEffect(() => {
        const left = leftRef.current;
        const right = rightRef.current;
        if (!left || !right) return;

        const handleScroll = (source: HTMLDivElement, target: HTMLDivElement) => {
            if (isScrolling.current) return;
            isScrolling.current = true;
            
            const percentage = source.scrollTop / (source.scrollHeight - source.clientHeight);
            target.scrollTop = percentage * (target.scrollHeight - target.clientHeight);
            
            setTimeout(() => { isScrolling.current = false; }, 50);
        };

        const onLeftScroll = () => handleScroll(left, right);
        const onRightScroll = () => handleScroll(right, left);

        left.addEventListener('scroll', onLeftScroll);
        right.addEventListener('scroll', onRightScroll);

        return () => {
            left.removeEventListener('scroll', onLeftScroll);
            right.removeEventListener('scroll', onRightScroll);
        };
    }, [loading]);

    return (
        <div className="flex-1 flex overflow-hidden bg-muted/30 relative">
            {loading && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-md animate-in fade-in">
                    <Loader2 size={40} className="animate-spin text-indigo-600 mb-4" />
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-[0.2em] animate-pulse">Rendering Pixel-Perfect Layouts...</span>
                </div>
            )}
            
            {/* Left Doc */}
            <div className="flex-1 border-r border-border flex flex-col overflow-hidden">
                <div className="p-3 bg-card border-b border-border text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex justify-between">
                    <span>DOKUMEN ASAL (V{v1})</span>
                    <Badge variant="outline" className="text-[8px] font-bold border-border text-muted-foreground">FORMAT PRESERVED</Badge>
                </div>
                <div 
                    ref={leftRef} 
                    className="flex-1 overflow-y-auto bg-card p-8 docx-preview-container select-none shadow-inner" 
                />
            </div>

            {/* Right Doc */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="p-3 bg-card border-b border-border text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex justify-between">
                    <span>DOKUMEN PEMBANDING (V{v2})</span>
                    <div className="flex items-center gap-2">
                         <span className="text-[8px] font-bold text-indigo-500 animate-pulse flex items-center gap-1">
                            <ArrowRight size={8} /> SYNC SCROLL ACTIVE
                         </span>
                    </div>
                </div>
                <div 
                    ref={rightRef} 
                    className="flex-1 overflow-y-auto bg-card p-8 docx-preview-container select-none shadow-inner" 
                />
            </div>
        </div>
    );
}

export default function AgreementView({ contract, onUpdate }: { contract: Contract, onUpdate: (c: Contract) => void }) {
    const [versions, setVersions] = useState<AgreementVersion[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [selectedV1, setSelectedV1] = useState<number | null>(null);
    const [selectedV2, setSelectedV2] = useState<number | null>(null);
    const [viewMode, setViewMode] = useState<'preview' | 'compare' | 'initial'>('initial');
    const [compareMode, setCompareMode] = useState<'text' | 'visual'>('visual');
    const [previewLoading, setPreviewLoading] = useState(false);
    const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
    const [comparing, setComparing] = useState(false);
    const [uploadNote, setUploadNote] = useState('');
    
    const previewContainerRef = useRef<HTMLDivElement>(null);

    const loadVersions = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axios.get(`/api/contracts/${contract.id}/agreement/versions`);
            setVersions(res.data);
            if (res.data.length > 0 && viewMode === 'initial') {
                 handlePreview(res.data[0].version_no);
            }
        } catch (err) {
            console.error('Failed to load agreement versions', err);
        } finally {
            setLoading(false);
        }
    }, [contract.id, viewMode]);

    useEffect(() => {
        loadVersions();
    }, [loadVersions]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.name.endsWith('.docx')) {
            alert('Hanya file .docx yang diijinkan.');
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('change_log', uploadNote);

        try {
            const res = await axios.post(`/api/contracts/${contract.id}/agreement`, formData);
            setUploadNote('');
            if (onUpdate && res.data) {
                onUpdate(res.data);
            }
            loadVersions();
        } catch (err) {

            console.error('Upload failed', err);
            alert('Gagal mengupload agreement.');
        } finally {
            setUploading(false);
        }
    };

    const handlePreview = async (versionNo: number) => {
        setViewMode('preview');
        setSelectedV1(versionNo);
        setSelectedV2(null);
        setPreviewLoading(true);
        
        try {
            const res = await axios.get(`/api/contracts/${contract.id}/file/${versionNo}?type=agreement`, {
                responseType: 'blob'
            });
            
            if (previewContainerRef.current) {
                previewContainerRef.current.innerHTML = '';
                await renderAsync(res.data, previewContainerRef.current);
            }
        } catch (err) {
            console.error('Preview failed', err);
        } finally {
            setPreviewLoading(false);
        }
    };

    const handleCompare = async () => {
        if (!selectedV1 || !selectedV2) return;
        
        setComparing(true);
        setViewMode('compare');
        try {
            const res = await axios.get(`/api/contracts/${contract.id}/agreement/compare`, {
                params: { v1: selectedV1, v2: selectedV2 }
            });
            setComparisonData(res.data);
        } catch (err) {
            console.error('Comparison failed', err);
            alert('Gagal memproses perbandingan dokumen.');
        } finally {
            setComparing(false);
        }
    };

    const toggleSelection = (vno: number) => {
        if (selectedV1 === vno) {
             // If we already have V1 as this, and V2 exists, maybe clear?
             // Simple logic: V1 is primary preview. V2 is target.
        } else if (selectedV2 === vno) {
            setSelectedV2(null);
        } else {
            if (!selectedV1) setSelectedV1(vno);
            else setSelectedV2(vno);
        }
    };

    return (
        <div className="flex h-[750px] gap-6 animate-in fade-in duration-500">
            {/* Sidebar: Version History */}
            <div className="w-80 flex flex-col bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                <div className="p-5 border-b border-border bg-muted/30">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
                             <History size={14} className="text-indigo-500" /> Version Control
                        </h3>
                        {versions.length > 0 && (
                            <Badge variant="outline" className="bg-indigo-50 text-indigo-600 border-indigo-100 text-[10px] font-bold uppercase">
                                {versions.length} Versi
                            </Badge>
                        )}
                    </div>

                    <div className="relative">
                        <label className={cn(
                            "flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-xl transition-all cursor-pointer",
                            uploading ? "bg-muted/50 border-border" : "bg-card border-border hover:border-indigo-400 hover:bg-muted/30 group"
                        )}>
                            <input type="file" className="hidden" accept=".docx" onChange={handleFileUpload} disabled={uploading} />
                            {uploading ? (
                                <Loader2 size={24} className="animate-spin text-muted-foreground/50" />
                            ) : (
                                <>
                                    <Upload size={20} className="text-muted-foreground/50 group-hover:text-indigo-500 mb-2" />
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">Upload v{versions.length + 1} (.docx)</span>
                                </>
                            )}
                        </label>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-2">
                             <Loader2 size={20} className="animate-spin text-muted-foreground/30" />
                             <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">Loading Revisions...</span>
                        </div>
                    ) : versions.map((v) => {
                        const isS1 = selectedV1 === v.version_no;
                        const isS2 = selectedV2 === v.version_no;
                        return (
                            <div 
                                key={v.id}
                                onClick={() => handlePreview(v.version_no)}
                                className={cn(
                                    "relative p-4 rounded-xl border transition-all cursor-pointer group",
                                    isS1 ? "bg-indigo-500/10 border-indigo-500/50 ring-2 ring-indigo-500/10 shadow-sm" : 
                                    isS2 ? "bg-amber-500/10 border-amber-500/50 ring-2 ring-amber-500/10" :
                                    "bg-card border-border/50 hover:border-border hover:shadow-md"
                                )}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className={cn(
                                            "h-7 w-7 rounded-lg flex items-center justify-center text-[10px] font-bold uppercase ring-1 shadow-sm",
                                            isS1 ? "bg-indigo-600 text-white ring-indigo-700" : 
                                            isS2 ? "bg-amber-500 text-white ring-amber-600" :
                                            "bg-foreground text-background ring-foreground/20"
                                        )}>
                                            v{v.version_no}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-bold tracking-tight text-foreground line-clamp-1">{v.file_name}</span>
                                            <span className="text-[9px] font-bold text-muted-foreground flex items-center gap-1 uppercase">
                                                <Clock size={8} /> {v.created_at}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-center gap-1">
                                         <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleSelection(v.version_no);
                                            }}
                                            className={cn(
                                                "p-1 rounded-md transition-colors",
                                                isS2 ? "bg-amber-500 text-white" : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                                            )}
                                            title="Pilih untuk bandingkan"
                                         >
                                            <Diff size={12} />
                                         </button>
                                    </div>
                                </div>
                                {v.change_log && (
                                    <p className="text-[10px] font-medium text-muted-foreground leading-relaxed italic line-clamp-2 mt-2 bg-muted/50 p-2 rounded-md border border-border">
                                        "{v.change_log}"
                                    </p>
                                )}
                                <div className="mt-3 flex items-center justify-between border-t border-border pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-[9px] font-bold text-muted-foreground flex items-center gap-1 uppercase">
                                        <User size={10} /> {v.uploader?.name}
                                    </span>
                                    <Download size={12} className="text-muted-foreground hover:text-indigo-600" />
                                </div>
                            </div>
                        );
                    })}
                </div>

                {selectedV1 && selectedV2 && (
                    <div className="p-4 border-t border-border bg-foreground">
                        <Button 
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-background font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-900/40"
                            onClick={handleCompare}
                            disabled={comparing}
                        >
                            {comparing ? <Loader2 size={12} className="animate-spin mr-2" /> : <Diff size={12} className="mr-2" />}
                            Bandingkan v{selectedV1} vs v{selectedV2}
                        </Button>
                    </div>
                )}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col relative">
                {viewMode === 'initial' && (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                         <div className="h-20 w-20 rounded-full bg-muted border border-border flex items-center justify-center mb-6">
                            <FileText size={40} className="text-muted-foreground/30" />
                         </div>
                         <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-2">Agreement Data Agreement</h4>
                         <p className="text-[11px] font-bold text-muted-foreground/60 max-w-sm uppercase leading-relaxed tracking-tight">
                             Upload draft agreement Anda di sisi kiri atau pilih versi yang sudah ada untuk melihat preview dan perbandingan.
                         </p>
                    </div>
                )}

                {viewMode === 'preview' && (
                   <>
                     <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20">
                        <div className="flex items-center gap-3">
                            <Badge className="bg-foreground text-background font-bold text-[10px] uppercase tracking-widest">
                                Preview v{selectedV1}
                            </Badge>
                            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                {versions.find(v => v.version_no === selectedV1)?.file_name}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                             <a 
                                href={`/api/contracts/${contract.id}/file/${selectedV1}?type=agreement`} 
                                download 
                                className="h-8 px-4 flex items-center gap-2 rounded-lg bg-card border border-border text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:bg-muted transition-all"
                             >
                                <Download size={12} /> Download
                             </a>
                             <Button variant="ghost" size="icon" onClick={() => setViewMode('initial')}>
                                <X size={16} className="text-muted-foreground/50" />
                             </Button>
                        </div>
                     </div>
                     <div className="flex-1 p-6 overflow-hidden bg-muted/30">
                        {previewLoading && (
                             <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm animate-in fade-in">
                                <Loader2 size={32} className="animate-spin text-indigo-600 mb-4" />
                                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-[0.2em] animate-pulse">Rendering Word Layout...</span>
                             </div>
                        )}
                        <div className="h-full w-full bg-card shadow-2xl rounded-sm overflow-y-auto ring-1 ring-border flex justify-center">
                            <div ref={previewContainerRef} className="w-full max-w-[210mm] p-12 docx-container text-left contract-doc" />
                        </div>
                     </div>
                   </>
                )}

                 {viewMode === 'compare' && (
                    <div className="flex-1 flex flex-col animate-in slide-in-from-right-10 duration-500">
                         <div className="p-4 border-b border-border flex items-center justify-between bg-foreground">
                            <div className="flex items-center gap-4">
                                <h4 className="text-[11px] font-bold text-background uppercase tracking-widest flex items-center gap-2">
                                     <Diff size={14} className="text-indigo-400" /> Perbandingan Dokumen
                                </h4>
                                <div className="flex items-center gap-1 bg-background/10 p-1 rounded-lg">
                                    <button 
                                        onClick={() => setCompareMode('visual')}
                                        className={cn(
                                            "px-4 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-widest transition-all",
                                            compareMode === 'visual' ? "bg-indigo-600 text-white shadow-lg" : "text-background/40 hover:text-background"
                                        )}
                                    >
                                        Visual Layout
                                    </button>
                                    <button 
                                        onClick={() => setCompareMode('text')}
                                        className={cn(
                                            "px-4 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-widest transition-all",
                                            compareMode === 'text' ? "bg-indigo-600 text-white shadow-lg" : "text-background/40 hover:text-background"
                                        )}
                                    >
                                        Smart Highlights
                                    </button>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" className="text-background/40 hover:text-background" onClick={() => setViewMode('preview')}>
                                <X size={16} />
                            </Button>
                         </div>
                         
                         <div className="flex-1 overflow-hidden relative">
                            {compareMode === 'text' ? (
                                 comparing ? (
                                    <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 gap-4 h-full">
                                        <Loader2 size={32} className="animate-spin text-indigo-600" />
                                        <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">Analyzing differences...</span>
                                    </div>
                                 ) : comparisonData ? (
                                    <DiffViewer v1={comparisonData.v1.content} v2={comparisonData.v2.content} />
                                 ) : null
                            ) : (
                                <VisualDiffViewer contractId={contract.id} v1={selectedV1!} v2={selectedV2!} />
                            )}
                         </div>
                    </div>
                )}
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .docx-container {
                    line-height: normal !important;
                }
                .docx-preview-container > div {
                    background: transparent !important;
                    box-shadow: none !important;
                    margin: 0 auto !important;
                    padding: 0 !important;
                    width: 100% !important;
                }
                .docx-wrapper {
                    background: transparent !important;
                    padding: 0 !important;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .animate-progress {
                    width: 0%;
                    animation: progress 2s infinite ease-in-out;
                }
                @keyframes progress {
                    0% { width: 0%; left: 0%; }
                    50% { width: 100%; left: 0%; }
                    100% { width: 0%; left: 100%; }
                }
            `}} />
        </div>
    );
}


