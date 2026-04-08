import React, { useEffect, useState } from 'react';
import { Contract, ContractVersion } from '@/types/contracts';

interface Props {
    open: boolean;
    onClose: () => void;
    contract: Contract | null;
    versionNo: number | null;
}

export default function PreviewModal({ open, onClose, contract, versionNo }: Props) {
    const [zoom, setZoom] = useState(100);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const ver = contract?.versions.find(v => v.version_no === versionNo);

    // Endpoint for PDF preview
    const pdfUrl = (contract && ver)
        ? `/api/contracts/${contract.id}/pdf/${ver.version_no}`
        : '';

    useEffect(() => {
        if (!open || !contract || !ver) return;
        setZoom(100);
        setError('');
        setLoading(true);

        // We can't easily "fetch" to verify because it's an iframe, 
        // but we'll set a timeout or just wait for the iframe to load.
        const timer = setTimeout(() => setLoading(false), 1500);
        return () => clearTimeout(timer);
    }, [open, contract?.id, versionNo]);

    if (!open || !contract || !ver) return null;

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#525659]">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800 flex-shrink-0 bg-[#323639] text-white shadow-lg">
                <div className="flex items-center gap-3 min-w-0">
                    <button onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-gray-300 transition-colors flex-shrink-0">
                        <i className="fa-solid fa-arrow-left text-[13px]" />
                    </button>
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                        <i className="fa-regular fa-file-pdf text-red-500" />
                    </div>
                    <div className="min-w-0">
                        <div className="text-[13px] font-semibold truncate">{ver.file_name}</div>
                        <div className="text-[10px] text-gray-400 uppercase tracking-wider">v{ver.version_no} · Adobe PDF Render</div>
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

            {/* Content - PDF Iframe Viewer */}
            <div className="flex-1 overflow-hidden relative">
                {loading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#525659] z-10 text-gray-300 gap-3">
                        <i className="fa-solid fa-spinner fa-spin text-3xl text-blue-400" />
                        <span className="text-[13px] font-medium">Generating PDF Preview...</span>
                    </div>
                )}

                {!ver.has_file ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-300 gap-4 max-w-sm mx-auto text-center px-6">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                            <i className="fa-solid fa-file-circle-exclamation text-3xl text-amber-500" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold mb-1">File Tidak Ditemukan</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                Kontrak ini berasal dari data dummy (seeder) yang tidak memiliki file fisik di disk.
                                Silakan <b>Upload Kontrak Baru</b> untuk mencoba fitur PDF preview.
                            </p>
                        </div>
                    </div>
                ) : pdfUrl ? (
                    <iframe
                        src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitH&zoom=${zoom}`}
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

            <style>{`
                /* Simple CSS for the Zoom effect if needed outside of PDF params */
                .pdf-scale {
                    transform: scale(${zoom / 100});
                    transform-origin: top center;
                }
            `}</style>
        </div>
    );
}
