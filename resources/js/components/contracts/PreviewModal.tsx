import React, { useEffect, useRef, useState } from 'react';
import { Contract, ContractVersion } from '@/types/contracts';
import { renderAsync } from 'docx-preview';

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
    const containerRef = useRef<HTMLDivElement>(null);

    const ver = contract?.versions.find(v => v.version_no === versionNo);

    useEffect(() => {
        if (!open || !contract || !ver) return;
        setZoom(100);
        setError('');
        setLoading(true);

        const fileUrl = `/api/contracts/${contract.id}/file/${ver.version_no}`;

        fetch(fileUrl, { credentials: 'same-origin' })
            .then(res => {
                if (!res.ok) {
                    setError('File tidak tersedia untuk versi ini');
                    setLoading(false);
                    return null;
                }
                return res.arrayBuffer();
            })
            .then(arrayBuffer => {
                if (!arrayBuffer || !containerRef.current) return;
                // Clear previous content
                containerRef.current.innerHTML = '';
                // Render docx with high-fidelity formatting
                renderAsync(arrayBuffer, containerRef.current, undefined, {
                    className: 'docx-preview-wrapper',
                    inWrapper: true,
                    ignoreWidth: false,
                    ignoreHeight: true,
                    ignoreFonts: false,
                    breakPages: true,
                    ignoreLastRenderedPageBreak: true,
                    experimental: true,
                    trimXmlDeclaration: true,
                    useBase64URL: true,
                    renderHeaders: true,
                    renderFooters: true,
                    renderFootnotes: true,
                    renderEndnotes: true,
                })
                    .then(() => setLoading(false))
                    .catch(() => {
                        setError('Gagal memproses dokumen .docx');
                        setLoading(false);
                    });
            })
            .catch(() => {
                setError('Gagal memuat file');
                setLoading(false);
            });
    }, [open, contract?.id, versionNo]);

    if (!open || !contract || !ver) return null;

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-white">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 flex-shrink-0 bg-white">
                <div className="flex items-center gap-3 min-w-0">
                    <button onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 transition-colors flex-shrink-0">
                        <i className="fa-solid fa-arrow-left text-[13px]" />
                    </button>
                    <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                        <i className="fa-regular fa-file-word text-blue-500" />
                    </div>
                    <div className="min-w-0">
                        <div className="text-[13px] font-semibold truncate">{ver.file_name}</div>
                        <div className="text-[10px] text-gray-400">v{ver.version_no} · {ver.change_log} · {ver.created_at}</div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1">
                        <button onClick={() => setZoom(z => Math.max(50, z - 10))} className="w-6 h-6 flex items-center justify-center rounded hover:bg-white text-gray-500 text-[11px]"><i className="fa-solid fa-minus" /></button>
                        <span className="text-[11px] text-gray-500 px-1 min-w-[36px] text-center">{zoom}%</span>
                        <button onClick={() => setZoom(z => Math.min(200, z + 10))} className="w-6 h-6 flex items-center justify-center rounded hover:bg-white text-gray-500 text-[11px]"><i className="fa-solid fa-plus" /></button>
                    </div>
                    <button onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 text-[13px] transition-colors">
                        <i className="fa-solid fa-xmark" />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto bg-gray-100">
                {loading && (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
                        <i className="fa-solid fa-spinner fa-spin text-3xl text-blue-400" />
                        <span className="text-[13px]">Memuat dokumen...</span>
                    </div>
                )}
                {error && !loading && (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
                        <i className="fa-solid fa-file-circle-xmark text-3xl text-gray-300" />
                        <span className="text-[13px] text-gray-500">{error}</span>
                    </div>
                )}
                <div
                    ref={containerRef}
                    className="docx-container"
                    style={{
                        display: loading || error ? 'none' : 'block',
                        transform: `scale(${zoom / 100})`,
                        transformOrigin: 'top center',
                        padding: '24px 0',
                    }}
                />
            </div>

            {/* Styling for docx-preview */}
            <style>{`
                .docx-container .docx-preview-wrapper {
                    // background: transparent !important;
                    padding: 0 !important;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }
                .docx-container .docx-preview-wrapper > section.docx {
                    // background: white !important;
                    // box-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);
                    border-radius: 4px;
                    margin-bottom: 24px;
                    min-width: 600px;
                    max-width: 900px;
                }
                // /* Remove dark/white highlight artifacts */
                // .docx-container span[style*="background-color: black"],
                // .docx-container span[style*="background-color:#000"],
                // .docx-container span[style*="background: black"],
                // .docx-container span[style*="background:#000"] {
                //     background-color: transparent !important;
                //     background: transparent !important;
                // }
                // .docx-container span[style*="background-color: white"],
                // .docx-container span[style*="background-color:#fff"],
                // .docx-container span[style*="background-color:#FFF"],
                // .docx-container span[style*="background: white"],
                // .docx-container span[style*="background:#fff"],
                // .docx-container span[style*="background:#FFF"] {
                //     background-color: transparent !important;
                //     background: transparent !important;
                // }
                /* Normalize text color on dark highlights */
                .docx-container span[style*="color: white"],
                .docx-container span[style*="color:#fff"],
                .docx-container span[style*="color:#FFF"] {
                    color: inherit !important;
                }
                /* Remove Word highlight marks */
                .docx-container .docx-highlight {
                    background: transparent !important;
                }
            `}</style>
        </div>
    );
}
