import React, { useEffect, useState } from 'react';
import { contractApi } from '@/lib/contract-api';

interface Props {
    open: boolean;
    onClose: () => void;
    title: string;
    url: string;
    hasFile: boolean;
}

export default function PreviewModal({ open, onClose, title, url, hasFile }: Props) {
    const [zoom, setZoom] = useState(100);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open) return;
        setZoom(100);
        setLoading(true);
        // Timeout as fallback for iframe load
        const timer = setTimeout(() => setLoading(false), 2000);
        return () => clearTimeout(timer);
    }, [open, url]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[60] flex flex-col bg-[#525659]">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800 flex-shrink-0 bg-[#323639] text-white shadow-lg">
                <div className="flex items-center gap-3 min-w-0">
                    <button onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-gray-300 transition-colors flex-shrink-0">
                        <i className="fa-solid fa-arrow-left text-[13px]" />
                    </button>
                    <div className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center flex-shrink-0">
                        <i className="fa-regular fa-file-pdf text-red-500" />
                    </div>
                    <div className="min-w-0">
                        <div className="text-[13px] font-semibold truncate" title={title}>{title}</div>
                        <div className="text-[10px] text-gray-400 uppercase tracking-wider">Adobe PDF Render v2.0</div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-1.5 bg-black/20 border border-white/10 rounded-lg px-2 py-1">
                        <button onClick={() => setZoom(z => Math.max(50, z - 10))} className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 text-gray-300 text-[11px]"><i className="fa-solid fa-minus" /></button>
                        <span className="text-[11px] text-gray-300 px-1 min-w-[36px] text-center font-mono">{zoom}%</span>
                        <button onClick={() => setZoom(z => Math.min(200, z + 10))} className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 text-gray-300 text-[11px]"><i className="fa-solid fa-plus" /></button>
                    </div>
                    <button onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-500 hover:text-white text-gray-400 text-[13px] transition-all">
                        <i className="fa-solid fa-xmark" />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden relative">
                {loading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#525659] z-10 text-gray-300 gap-3">
                        <i className="fa-solid fa-spinner fa-spin text-3xl text-blue-400" />
                        <span className="text-[13px] font-medium">Generating PDF Preview...</span>
                    </div>
                )}

                {!hasFile ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-300 gap-4 max-w-sm mx-auto text-center px-6">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                            <i className="fa-solid fa-file-circle-exclamation text-3xl text-amber-500" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold mb-1">File Tidak Ditemukan</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                Dokumen ini mungkin berasal dari data dummy (seeder) yang tidak memiliki file fisik di disk.
                                Silakan <b>Upload Dokumen Baru</b> untuk mencoba fitur PDF preview.
                            </p>
                        </div>
                    </div>
                ) : url ? (
                    <iframe
                        src={`${url}#toolbar=0&navpanes=0&scrollbar=1&view=FitH&zoom=${zoom}`}
                        className="w-full h-full border-none"
                        title="PDF Preview"
                        onLoad={() => setLoading(false)}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
                        <i className="fa-solid fa-triangle-exclamation text-3xl text-amber-500" />
                        <span className="text-[13px]">Gagal memuat preview PDF</span>
                    </div>
                )}
            </div>
        </div>
    );
}
