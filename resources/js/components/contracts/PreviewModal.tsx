import React, { useEffect, useState } from 'react';
import { Contract, ContractVersion } from '@/types/contracts';

declare const mammoth: any;

interface Props {
    open: boolean;
    onClose: () => void;
    contract: Contract | null;
    versionNo: number | null;
}

function buildNoFileHtml(c: Contract, ver: ContractVersion): string {
    return `
    <div style="text-align:center;padding:60px 20px;color:#9ca3af;">
      <i class="fa-solid fa-file-circle-xmark" style="font-size:48px;display:block;margin-bottom:16px;"></i>
      <div style="font-size:16px;font-weight:500;color:#6b7280;margin-bottom:6px;">Tidak ada file yang diupload</div>
      <div style="font-size:13px;">Dokumen <strong>${c.contract_no} v${ver.version_no}</strong> belum memiliki file .docx yang diupload.</div>
    </div>`;
}

export default function PreviewModal({ open, onClose, contract, versionNo }: Props) {
    const [zoom, setZoom] = useState(100);
    const [html, setHtml] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const ver = contract?.versions.find(v => v.version_no === versionNo);

    useEffect(() => {
        if (!open || !contract || !ver) return;
        setZoom(100);
        setHtml('');
        setError('');
        setLoading(true);

        const fileUrl = `/api/contracts/${contract.id}/file/${ver.version_no}`;

        fetch(fileUrl, { credentials: 'same-origin' })
            .then(res => {
                if (!res.ok) {
                    setHtml(buildNoFileHtml(contract, ver));
                    setLoading(false);
                    return null;
                }
                return res.arrayBuffer();
            })
            .then(arrayBuffer => {
                if (!arrayBuffer) return;
                if (typeof mammoth !== 'undefined') {
                    mammoth.convertToHtml({ arrayBuffer })
                        .then((result: { value: string }) => {
                            setHtml(result.value);
                            setLoading(false);
                        })
                        .catch(() => {
                            setError('Gagal memproses dokumen .docx');
                            setLoading(false);
                        });
                } else {
                    setError('Library mammoth.js belum dimuat');
                    setLoading(false);
                }
            })
            .catch(() => {
                setHtml(buildNoFileHtml(contract, ver));
                setLoading(false);
            });
    }, [open, contract?.id, versionNo]);

    if (!open || !contract || !ver) return null;

    const scale = zoom / 100;

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
            <div className="flex-1 overflow-auto bg-gray-100 p-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
                        <i className="fa-solid fa-spinner fa-spin text-3xl text-blue-400" />
                        <span className="text-[13px]">Memuat dokumen...</span>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
                        <i className="fa-solid fa-triangle-exclamation text-3xl text-amber-400" />
                        <span className="text-[13px] text-gray-500">{error}</span>
                    </div>
                ) : (
                    <div style={{ maxWidth: 780, margin: '0 auto', transform: `scale(${scale})`, transformOrigin: 'top center' }}>
                        <div className="bg-white shadow-sm rounded-lg" style={{ padding: '56px 64px', lineHeight: 1.7, fontSize: 14, color: '#1f2937' }}
                            dangerouslySetInnerHTML={{ __html: html }} />
                    </div>
                )}
            </div>
        </div>
    );
}
