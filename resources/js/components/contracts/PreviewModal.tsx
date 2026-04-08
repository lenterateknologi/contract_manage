import React, { useEffect, useRef, useState } from 'react';
import { Contract, ContractVersion } from '@/types/contracts';

declare const mammoth: any;

interface Props {
    open: boolean;
    onClose: () => void;
    contract: Contract | null;
    versionNo: number | null;
}

function buildDemoDoc(c: Contract, ver: ContractVersion): string {
    return `
    <div style="text-align:center;margin-bottom:32px;padding-bottom:20px;border-bottom:2px solid #e5e7eb;">
      <div style="font-size:11px;color:#6b7280;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">Dokumen Kontrak</div>
      <h1 style="font-size:20px;font-weight:700;color:#111827;margin:0 0 6px;">${c.title}</h1>
      <div style="font-size:12px;color:#6b7280;">No. ${c.contract_no} &nbsp;·&nbsp; Versi v${ver.version_no} &nbsp;·&nbsp; ${ver.created_at}</div>
    </div>
    <table style="width:100%;margin-bottom:24px;font-size:12px;">
      <tr><td style="padding:4px 0;color:#6b7280;width:140px;">Dibuat Oleh</td><td style="font-weight:500;">: ${c.creator?.name}</td></tr>
      <tr><td style="padding:4px 0;color:#6b7280;">Tanggal</td><td style="font-weight:500;">: ${c.created_at}</td></tr>
      <tr><td style="padding:4px 0;color:#6b7280;">Status</td><td style="font-weight:500;">: ${c.status.replace('_', ' ').toUpperCase()}</td></tr>
      <tr><td style="padding:4px 0;color:#6b7280;">Changelog</td><td style="font-weight:500;">: ${ver.change_log}</td></tr>
    </table>
    <h2>1. Pendahuluan</h2>
    <p>Kontrak ini dibuat dan ditandatangani oleh para pihak yang berkepentingan, dengan tujuan mengatur hubungan kerja sama secara formal dan mengikat secara hukum.</p>
    <h2>2. Ruang Lingkup</h2>
    <p>${c.description}</p>
    <p>Para pihak sepakat bahwa seluruh ketentuan yang tercantum dalam kontrak ini berlaku sejak tanggal penandatanganan.</p>
    <h2>3. Kewajiban Para Pihak</h2>
    <p><strong>Pihak Pertama</strong> berkewajiban menyediakan layanan/produk sesuai spesifikasi yang disepakati.</p>
    <p><strong>Pihak Kedua</strong> berkewajiban melakukan pembayaran sesuai jadwal dan nominal yang disepakati.</p>
    <h2>4. Ketentuan Pembayaran</h2>
    <table><thead><tr><th>Termin</th><th>Persentase</th><th>Kondisi</th></tr></thead>
    <tbody><tr><td>DP</td><td>30%</td><td>Setelah kontrak ditandatangani</td></tr>
    <tr><td>Termin 1</td><td>40%</td><td>Setelah serah terima parsial</td></tr>
    <tr><td>Pelunasan</td><td>30%</td><td>Setelah serah terima final</td></tr></tbody></table>
    <h2>5. Jangka Waktu</h2>
    <p>Kontrak ini berlaku selama <strong>12 (dua belas) bulan</strong> terhitung sejak tanggal penandatanganan.</p>
    <h2>6. Penyelesaian Sengketa</h2>
    <p>Apabila terjadi perselisihan, diselesaikan melalui Badan Arbitrase Nasional Indonesia (BANI).</p>`;
}

export default function PreviewModal({ open, onClose, contract, versionNo }: Props) {
    const [zoom, setZoom] = useState(100);
    const [html, setHtml] = useState('');
    const [loading, setLoading] = useState(false);

    const ver = contract?.versions.find(v => v.version_no === versionNo);

    useEffect(() => {
        if (!open || !contract || !ver) return;
        setZoom(100);
        setHtml('');
        setLoading(true);
        // Use demo HTML since real file download requires extra auth flow
        setTimeout(() => {
            setHtml(buildDemoDoc(contract, ver));
            setLoading(false);
        }, 300);
    }, [open, contract?.id, versionNo]);

    if (!open || !contract || !ver) return null;

    const scale = zoom / 100;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="bg-white rounded-xl shadow-xl flex flex-col" style={{ width: 780, maxWidth: '95vw', height: '88vh', animation: 'modal-in .18s ease' }}>
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 flex-shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                            <i className="fa-regular fa-file-word text-blue-500" />
                        </div>
                        <div className="min-w-0">
                            <div className="text-[13px] font-semibold truncate">{ver.file_name}</div>
                            <div className="text-[10px] text-gray-400">v{ver.version_no} · {ver.change_log} · {ver.created_at}</div>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-400 text-[13px] ml-3">
                        <i className="fa-solid fa-xmark" />
                    </button>
                </div>
                <div className="flex items-center gap-2 px-5 py-2 border-b border-gray-100 bg-gray-50 flex-shrink-0">
                    <span className="text-[11px] text-gray-500 flex items-center gap-1.5">
                        <i className="fa-solid fa-circle-info text-blue-400" /> Preview dokumen (demo)
                    </span>
                    <div className="ml-auto flex gap-2 items-center">
                        <button onClick={() => setZoom(z => Math.max(50, z - 10))} className="px-2.5 py-1 text-[11px] border border-gray-200 rounded hover:bg-white"><i className="fa-solid fa-minus" /></button>
                        <span className="text-[11px] text-gray-500 px-1">{zoom}%</span>
                        <button onClick={() => setZoom(z => Math.min(150, z + 10))} className="px-2.5 py-1 text-[11px] border border-gray-200 rounded hover:bg-white"><i className="fa-solid fa-plus" /></button>
                    </div>
                </div>
                <div className="flex-1 overflow-auto bg-gray-100 p-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
                            <i className="fa-solid fa-spinner fa-spin text-3xl text-blue-400" />
                            <span className="text-[13px]">Memuat dokumen...</span>
                        </div>
                    ) : (
                        <div style={{ maxWidth: 680, margin: '0 auto', transform: `scale(${scale})`, transformOrigin: 'top center' }}>
                            <div className="bg-white shadow-sm rounded" style={{ padding: '48px 56px', lineHeight: 1.7, fontSize: 14, color: '#1f2937' }}
                                dangerouslySetInnerHTML={{ __html: html }} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
