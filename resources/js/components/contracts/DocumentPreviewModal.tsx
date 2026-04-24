import { cn } from '@/lib/utils';
import axios from 'axios';
import { renderAsync } from 'docx-preview';
import { Loader2, X, Download, Maximize2 } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    url: string;
    fileName: string;
}

const DOCX_STYLES = `
    .docx-container > div {
        background: transparent !important;
        box-shadow: none !important;
        margin: 0 !important;
        padding: 0 !important;
        width: 100% !important;
    }
    .docx-wrapper {
        background: transparent !important;
        padding: 0 !important;
    }
    section.docx {
        margin-bottom: 0 !important;
        box-shadow: none !important;
        padding: 60px !important;
        background: white !important;
    }
    .custom-scrollbar::-webkit-scrollbar {
        width: 8px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 10px;
    }
`;

export default function DocumentPreviewModal({ isOpen, onClose, url, fileName }: Props) {
    const [loading, setLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const isDocx = fileName.toLowerCase().endsWith('.docx');

    useEffect(() => {
        if (!isOpen || !isDocx) return;

        const fetchAndRender = async () => {
            setLoading(true);
            try {
                const res = await axios.get(url, { responseType: 'blob' });
                if (containerRef.current) {
                    containerRef.current.innerHTML = '';
                    await renderAsync(res.data, containerRef.current);
                }
            } catch (err) {
                console.error('Docx preview failed', err);
            } finally {
                setLoading(false);
            }
        };

        fetchAndRender();
    }, [isOpen, url, isDocx]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[95vw] w-full h-[95vh] p-0 overflow-hidden flex flex-col gap-0 border-none bg-slate-50 shadow-2xl">
                <style>{DOCX_STYLES}</style>
                
                {/* HUD Header - Mirroring AgreementView */}
                <div className="h-[72px] flex items-center justify-between px-8 border-b bg-white/80 backdrop-blur-md shrink-0 z-50">
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <div className="h-4 w-1 rounded-full bg-indigo-600" />
                                <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-tighter">{fileName}</h3>
                                <span className="rounded bg-slate-950 px-1.5 py-0.5 text-[8px] font-black tracking-widest text-white uppercase">
                                    Preview
                                </span>
                            </div>
                            <span className="mt-1.5 text-[9px] font-black tracking-[0.2em] text-indigo-500 uppercase leading-none">
                                Documentation Inspection &bull; Format Preserved
                            </span>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <a 
                            href={url} 
                            download={fileName}
                            className="bg-white border border-slate-200 h-9 px-5 rounded-xl text-slate-900 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
                        >
                            <Download size={14} className="text-indigo-500" /> Download
                        </a>
                        <div className="w-px h-6 bg-slate-200 mx-1" />
                        <button 
                            onClick={onClose}
                            className="h-9 w-9 flex items-center justify-center rounded-xl bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-900 transition-all"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Content Area - Mirroring AgreementView layout */}
                <div className="flex-1 overflow-y-auto bg-slate-100/50 p-12 flex justify-center custom-scrollbar">
                    <div className="relative w-full max-w-[210mm] min-h-full bg-white shadow-2xl ring-1 ring-slate-200 rounded-sm mb-12">
                        {loading && (
                            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm transition-all">
                                <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mb-4" />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600 animate-pulse">Rendering Layout...</span>
                            </div>
                        )}

                        {isDocx ? (
                            <div ref={containerRef} className="docx-container w-full text-left" />
                        ) : (
                            <iframe
                                src={`${url}#toolbar=0&navpanes=0&view=FitH`}
                                className="w-full h-[calc(95vh-72px-96px)] border-none bg-white rounded-sm"
                                title="PDF Preview"
                            />
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
