import React, { useEffect, useMemo, useState } from 'react';
import { Contract, ContractVersion } from '@/types/contracts';

interface Props { open: boolean; onClose: () => void; contract: Contract | null; initialVersion: number | null; }

function buildText(c: Contract, ver: ContractVersion): string {
    const base = `KONTRAK: ${c.title}\nNo. Kontrak: ${c.contract_no}\nVersi: v${ver.version_no}\nTanggal: ${ver.created_at}\n\n1. PENDAHULUAN\nKontrak ini dibuat untuk mengatur hubungan kerja sama secara formal.\n\n2. RUANG LINGKUP\n${c.description}\n\n3. KEWAJIBAN PARA PIHAK\nPihak Pertama berkewajiban menyediakan layanan sesuai spesifikasi.\nPihak Kedua berkewajiban melakukan pembayaran sesuai jadwal.\n\n4. KETENTUAN PEMBAYARAN\nDown Payment: 30%\nTermin 1: 40%\nPelunasan: 30%\n\n5. JANGKA WAKTU\n12 (dua belas) bulan sejak penandatanganan.\n\n6. PENYELESAIAN SENGKETA\nMelalui Badan Arbitrase Nasional Indonesia (BANI).`;
    if (ver.version_no === 1) return base;
    return base.replace('12 (dua belas) bulan', '24 (dua puluh empat) bulan').replace('Down Payment: 30%', 'Down Payment: 20%').replace('Termin 1: 40%', 'Termin 1: 50%');
}

function esc(s: string) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

export default function CompareModal({ open, onClose, contract, initialVersion }: Props) {
    const [fromVer, setFromVer] = useState<number>(1);
    const [toVer, setToVer] = useState<number>(2);
    const [mode, setMode] = useState<'side' | 'inline'>('side');

    useEffect(() => {
        if (!open || !contract || !initialVersion) return;
        const sorted = [...contract.versions].sort((a, b) => a.version_no - b.version_no);
        const idx = sorted.findIndex(v => v.version_no === initialVersion);
        setFromVer(sorted[idx]?.version_no ?? sorted[0]?.version_no);
        setToVer(sorted[idx < sorted.length - 1 ? idx + 1 : idx - 1]?.version_no ?? sorted[sorted.length - 1]?.version_no);
    }, [open, contract?.id, initialVersion]);

    if (!open || !contract) return null;

    const fromText = buildText(contract, contract.versions.find(v => v.version_no === fromVer)!);
    const toText = buildText(contract, contract.versions.find(v => v.version_no === toVer)!);
    const oldLines = fromText.split('\n');
    const newLines = toText.split('\n');

    // Simple line diff
    const maxLen = Math.max(oldLines.length, newLines.length);
    let added = 0, removed = 0;
    const diffLines = Array.from({ length: maxLen }, (_, i) => {
        const o = oldLines[i] ?? null;
        const n = newLines[i] ?? null;
        if (o === n) return { type: 'eq', old: o ?? '', nw: n ?? '' };
        if (o !== null && n === null) { removed++; return { type: 'del', old: o, nw: '' }; }
        if (o === null && n !== null) { added++; return { type: 'add', old: '', nw: n }; }
        removed++; added++;
        return { type: 'chg', old: o!, nw: n! };
    });

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="bg-white rounded-xl shadow-xl flex flex-col" style={{ width: 1000, maxWidth: '96vw', height: '90vh', animation: 'modal-in .18s ease' }}>
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center">
                            <i className="fa-solid fa-code-compare text-violet-500" />
                        </div>
                        <div>
                            <div className="text-[13px] font-semibold">{contract.title}</div>
                            <div className="text-[10px] text-gray-400">{contract.contract_no}</div>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-400 text-[13px]">
                        <i className="fa-solid fa-xmark" />
                    </button>
                </div>
                {/* Toolbar */}
                <div className="flex items-center gap-3 px-5 py-2.5 border-b border-gray-100 bg-gray-50 flex-shrink-0 flex-wrap">
                    <div className="flex items-center gap-2">
                        <label className="text-[11px] font-semibold text-gray-500">Dari</label>
                        <select value={fromVer} onChange={e => setFromVer(+e.target.value)}
                            className="text-[12px] border border-gray-200 rounded-md px-2 py-1.5 bg-white outline-none">
                            {contract.versions.map(v => <option key={v.version_no} value={v.version_no}>v{v.version_no} — {v.change_log}</option>)}
                        </select>
                    </div>
                    <i className="fa-solid fa-arrow-right text-gray-400 text-[12px]" />
                    <div className="flex items-center gap-2">
                        <label className="text-[11px] font-semibold text-gray-500">Ke</label>
                        <select value={toVer} onChange={e => setToVer(+e.target.value)}
                            className="text-[12px] border border-gray-200 rounded-md px-2 py-1.5 bg-white outline-none">
                            {contract.versions.map(v => <option key={v.version_no} value={v.version_no}>v{v.version_no} — {v.change_log}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-1 ml-2 bg-white border border-gray-200 rounded-lg p-0.5">
                        {(['side', 'inline'] as const).map(m => (
                            <button key={m} onClick={() => setMode(m)}
                                className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${mode === m ? 'bg-gray-100 text-gray-700' : 'text-gray-400'}`}>
                                {m === 'side' ? <><i className="fa-solid fa-columns mr-1" />Side by Side</> : <><i className="fa-solid fa-bars mr-1" />Inline</>}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-3 ml-auto text-[11px] text-gray-500">
                        <span><span className="inline-block w-2.5 h-2.5 rounded-sm bg-green-200 mr-1" />Ditambahkan</span>
                        <span><span className="inline-block w-2.5 h-2.5 rounded-sm bg-red-200 mr-1" />Dihapus</span>
                        <span className="font-medium text-gray-700">+{added} −{removed}</span>
                    </div>
                </div>
                {/* Diff area */}
                <div className="flex-1 overflow-hidden flex" style={{ minHeight: 0 }}>
                    {mode === 'side' ? (
                        <>
                            <div className="flex-1 flex flex-col min-w-0 border-r border-gray-200">
                                <div className="px-4 py-2 bg-red-50 border-b border-red-100 flex items-center gap-2 flex-shrink-0">
                                    <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                                    <span className="text-[11px] font-semibold text-red-700">v{fromVer} — sebelum</span>
                                </div>
                                <div className="flex-1 overflow-auto p-4 font-mono text-[12px]" style={{ lineHeight: 1.8 }}>
                                    {diffLines.map((l, i) => (
                                        <div key={i} className={l.type === 'del' || l.type === 'chg' ? 'bg-red-50 border-l-2 border-red-400 pl-2 my-px line-through text-gray-400' : l.type === 'eq' ? 'pl-3 my-px' : 'pl-3 my-px opacity-0 select-none'}
                                            dangerouslySetInnerHTML={{ __html: `<span class="text-[10px] text-gray-300 mr-3">${i + 1}</span>${esc(l.old || '\u00a0')}` }} />
                                    ))}
                                </div>
                            </div>
                            <div className="flex-1 flex flex-col min-w-0">
                                <div className="px-4 py-2 bg-green-50 border-b border-green-100 flex items-center gap-2 flex-shrink-0">
                                    <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
                                    <span className="text-[11px] font-semibold text-green-700">v{toVer} — sesudah</span>
                                </div>
                                <div className="flex-1 overflow-auto p-4 font-mono text-[12px]" style={{ lineHeight: 1.8 }}>
                                    {diffLines.map((l, i) => (
                                        <div key={i} className={l.type === 'add' || l.type === 'chg' ? 'bg-green-50 border-l-2 border-green-400 pl-2 my-px' : l.type === 'eq' ? 'pl-3 my-px' : 'pl-3 my-px opacity-0 select-none'}
                                            dangerouslySetInnerHTML={{ __html: `<span class="text-[10px] text-gray-300 mr-3">${i + 1}</span>${esc(l.nw || '\u00a0')}` }} />
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 overflow-auto p-5 font-mono text-[12px]" style={{ lineHeight: 1.8 }}>
                            {diffLines.map((l, i) => l.type === 'chg' ? (
                                <React.Fragment key={i}>
                                    <div className="bg-red-50 border-l-2 border-red-400 pl-2 my-px line-through text-gray-400"><span className="mr-2 text-[10px] text-red-300 font-bold select-none">−</span>{esc(l.old)}</div>
                                    <div className="bg-green-50 border-l-2 border-green-400 pl-2 my-px"><span className="mr-2 text-[10px] text-green-500 font-bold select-none">+</span>{esc(l.nw)}</div>
                                </React.Fragment>
                            ) : l.type === 'del' ? (
                                <div key={i} className="bg-red-50 border-l-2 border-red-400 pl-2 my-px line-through text-gray-400"><span className="mr-2 text-[10px] text-red-300 font-bold select-none">−</span>{esc(l.old)}</div>
                            ) : l.type === 'add' ? (
                                <div key={i} className="bg-green-50 border-l-2 border-green-400 pl-2 my-px"><span className="mr-2 text-[10px] text-green-500 font-bold select-none">+</span>{esc(l.nw)}</div>
                            ) : (
                                <div key={i} className="pl-4 my-px text-gray-400">{esc(l.old || '\u00a0')}</div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
