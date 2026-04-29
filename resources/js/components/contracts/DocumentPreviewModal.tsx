import { Dialog, DialogContent } from '@/components/ui/dialog';
import axios from 'axios';
import { renderAsync } from 'docx-preview';
import { Download, Loader2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

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
            <DialogContent className="flex h-[95vh] w-full max-w-[95vw] flex-col gap-0 overflow-hidden border-none bg-slate-50 p-0 shadow-2xl">
                <style>{DOCX_STYLES}</style>

                {/* HUD Header - Mirroring AgreementView */}
                <div className="z-50 flex h-[72px] shrink-0 items-center justify-between border-b bg-white/80 px-8 backdrop-blur-md">
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <div className="h-4 w-1 rounded-full bg-indigo-600" />
                                <h3 className="text-[11px] font-black tracking-tighter text-slate-900 uppercase">{fileName}</h3>
                                <span className="rounded bg-slate-950 px-1.5 py-0.5 text-[8px] font-black tracking-widest text-white uppercase">
                                    Preview
                                </span>
                            </div>
                            <span className="mt-1.5 text-[9px] leading-none font-black tracking-[0.2em] text-indigo-500 uppercase">
                                Documentation Inspection &bull; Format Preserved
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <a
                            href={url}
                            download={fileName}
                            className="flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-[10px] font-black tracking-widest text-slate-900 uppercase shadow-sm transition-all hover:bg-slate-50 active:scale-95"
                        >
                            <Download size={14} className="text-indigo-500" /> Download
                        </a>
                        <div className="mx-1 h-6 w-px bg-slate-200" />
                        <button
                            onClick={onClose}
                            className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-400 transition-all hover:bg-slate-200 hover:text-slate-900"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Content Area - Mirroring AgreementView layout */}
                <div className="custom-scrollbar flex flex-1 justify-center overflow-y-auto bg-slate-100/50 p-12">
                    <div className="relative mb-12 min-h-full w-full max-w-[210mm] rounded-sm bg-white shadow-2xl ring-1 ring-slate-200">
                        {loading && (
                            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm transition-all">
                                <Loader2 className="mb-4 h-10 w-10 animate-spin text-indigo-600" />
                                <span className="animate-pulse text-[10px] font-black tracking-[0.3em] text-indigo-600 uppercase">
                                    Rendering Layout...
                                </span>
                            </div>
                        )}

                        {isDocx ? (
                            <div ref={containerRef} className="docx-container w-full text-left" />
                        ) : (
                            <iframe
                                src={`${url}#toolbar=0&navpanes=0&view=FitH`}
                                className="h-[calc(95vh-72px-96px)] w-full rounded-sm border-none bg-white"
                                title="PDF Preview"
                            />
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
