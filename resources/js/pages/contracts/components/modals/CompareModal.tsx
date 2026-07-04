import { Button } from '@/components/ui/buttons/Button';
import { cn } from '@/lib/utils';
import { Contract } from '@/pages/contracts/types';
import { ArrowRight, Columns, List, Loader2, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

declare const mammoth: any;

interface Props {
    open: boolean;
    onClose: () => void;
    contract: Contract | null;
    initialVersion: number | null;
    type: 'contract' | 'f1' | 'f2';
}

function esc(s: string) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function fetchVersionText(contractId: string, versionNo: number, type: string): Promise<string> {
    try {
        const res = await fetch(`/api/contracts/${contractId}/file/${versionNo}?type=${type}`, { credentials: 'same-origin' });
        if (!res.ok) return `[File v${versionNo} (${type}) tidak tersedia]`;
        const buf = await res.arrayBuffer();
        if (typeof mammoth !== 'undefined') {
            const result = await mammoth.extractRawText({ arrayBuffer: buf });
            return result.value;
        }
        return '[mammoth.js belum dimuat]';
    } catch {
        return `[Gagal memuat file v${versionNo}]`;
    }
}

export default function CompareModal({ open, onClose, contract, initialVersion, type }: Props) {
    const [fromVer, setFromVer] = useState<number>(1);
    const [toVer, setToVer] = useState<number>(2);
    const [mode, setMode] = useState<'side' | 'inline'>('side');
    const [fromText, setFromText] = useState('');
    const [toText, setToText] = useState('');
    const [loading, setLoading] = useState(false);

    const filteredVersions = contract?.versions.filter((v) => v.document_type === type) || [];

    useEffect(() => {
        if (!open || !contract || !initialVersion) return;
        const sorted = [...filteredVersions].sort((a, b) => a.version_no - b.version_no);
        const idx = sorted.findIndex((v) => v.version_no === initialVersion);

        if (idx === -1) {
            setFromVer(sorted[0]?.version_no || 1);
            setToVer(sorted[1]?.version_no || sorted[0]?.version_no || 1);
        } else {
            const from = sorted[idx]?.version_no ?? sorted[0]?.version_no;
            const to = sorted[idx < sorted.length - 1 ? idx + 1 : idx - 1]?.version_no ?? sorted[sorted.length - 1]?.version_no;
            setFromVer(from);
            setToVer(to);
        }
    }, [open, contract?.id, initialVersion, type]);

    // Fetch text when versions change
    useEffect(() => {
        if (!open || !contract) return;
        setLoading(true);
        Promise.all([fetchVersionText(contract.id, fromVer, type), fetchVersionText(contract.id, toVer, type)]).then(([ft, tt]) => {
            setFromText(ft);
            setToText(tt);
            setLoading(false);
        });
    }, [open, contract?.id, fromVer, toVer, type]);

    if (!open || !contract) return null;

    const oldLines = fromText.split('\n');
    const newLines = toText.split('\n');

    const maxLen = Math.max(oldLines.length, newLines.length);
    let added = 0,
        removed = 0;
    const diffLines = Array.from({ length: maxLen }, (_, i) => {
        const o = oldLines[i] ?? null;
        const n = newLines[i] ?? null;
        if (o === n) return { type: 'eq', old: o ?? '', nw: n ?? '' };
        if (o !== null && n === null) {
            removed++;
            return { type: 'del', old: o, nw: '' };
        }
        if (o === null && n !== null) {
            added++;
            return { type: 'add', old: '', nw: n };
        }
        removed++;
        added++;
        return { type: 'chg', old: o!, nw: n! };
    });

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div
                className="flex flex-col rounded-xl bg-white shadow-xl"
                style={{ width: 1000, maxWidth: '96vw', height: '90vh', animation: 'modal-in .18s ease' }}
            >
                <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-100 px-5 py-3.5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-violet-100 bg-violet-50">
                            <i className="fa-solid fa-code-compare text-violet-500" />
                        </div>
                        <div>
                            <div className="text-[13px] font-bold">
                                {contract.title} ({type.toUpperCase()})
                            </div>
                            <div className="text-[10px] text-gray-400">{contract.form_no}</div>
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                        <X size={16} />
                    </Button>
                </div>

                <div className="flex flex-shrink-0 flex-wrap items-center gap-3 border-b border-gray-100 bg-gray-50 px-5 py-2.5">
                    <div className="flex items-center gap-2">
                        <label className="text-[11px] font-bold text-gray-500 uppercase">Dari</label>
                        <select
                            value={fromVer}
                            onChange={(e) => setFromVer(+e.target.value)}
                            className="rounded-xl border border-gray-200 bg-white px-2 py-1.5 text-[12px] outline-none"
                        >
                            {filteredVersions.map((v) => (
                                <option key={v.id} value={v.version_no}>
                                    v{v.version_no} — {v.change_log}
                                </option>
                            ))}
                        </select>
                    </div>
                    <ArrowRight size={14} className="text-gray-400" />
                    <div className="flex items-center gap-2">
                        <label className="text-[11px] font-bold text-gray-500 uppercase">Ke</label>
                        <select
                            value={toVer}
                            onChange={(e) => setToVer(+e.target.value)}
                            className="rounded-xl border border-gray-200 bg-white px-2 py-1.5 text-[12px] outline-none"
                        >
                            {filteredVersions.map((v) => (
                                <option key={v.id} value={v.version_no}>
                                    v{v.version_no} — {v.change_log}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="ml-2 flex items-center gap-1 rounded-xl border border-gray-200 bg-white p-0.5">
                        {(['side', 'inline'] as const).map((m) => (
                            <Button
                                key={m}
                                variant="ghost"
                                size="sm"
                                onClick={() => setMode(m)}
                                className={cn(
                                    'h-7 px-3 text-[11px] transition-all',
                                    mode === m ? 'bg-black text-white dark:bg-white dark:text-black' : 'text-gray-400',
                                )}
                            >
                                {m === 'side' ? (
                                    <>
                                        <Columns size={12} className="mr-1.5" />
                                        Side
                                    </>
                                ) : (
                                    <>
                                        <List size={12} className="mr-1.5" />
                                        Inline
                                    </>
                                )}
                            </Button>
                        ))}
                    </div>
                    <div className="ml-auto flex items-center gap-3 text-[11px] text-gray-500">
                        <span>
                            <span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-green-200" />+{added}
                        </span>
                        <span>
                            <span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-red-200" />−{removed}
                        </span>
                    </div>
                </div>

                <div className="flex flex-1 overflow-hidden" style={{ minHeight: 0 }}>
                    {loading ? (
                        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-gray-400">
                            <Loader2 className="text-primary h-10 w-10 animate-spin opacity-20" />
                            <span className="text-[13px]">Memuat file...</span>
                        </div>
                    ) : mode === 'side' ? (
                        <>
                            <div className="flex min-w-0 flex-1 flex-col border-r border-gray-200">
                                <div className="flex flex-shrink-0 items-center gap-2 border-b border-red-100 bg-red-50 px-4 py-2">
                                    <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                                    <span className="text-[11px] font-semibold text-red-700">v{fromVer} — Sblm</span>
                                </div>
                                <div className="flex-1 overflow-auto p-4 font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
                                    {diffLines.map((l, i) => (
                                        <div
                                            key={i}
                                            className={
                                                l.type === 'del' || l.type === 'chg'
                                                    ? 'rounded bg-red-50 px-1 text-red-700'
                                                    : l.type === 'eq'
                                                      ? 'px-1 text-gray-400 opacity-50'
                                                      : 'px-1 opacity-0'
                                            }
                                        >
                                            {l.old || '\u00a0'}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="flex min-w-0 flex-1 flex-col">
                                <div className="flex flex-shrink-0 items-center gap-2 border-b border-green-100 bg-green-50 px-4 py-2">
                                    <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
                                    <span className="text-[11px] font-semibold text-green-700">v{toVer} — Ssdh</span>
                                </div>
                                <div className="flex-1 overflow-auto p-4 font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
                                    {diffLines.map((l, i) => (
                                        <div
                                            key={i}
                                            className={
                                                l.type === 'add' || l.type === 'chg'
                                                    ? 'rounded bg-green-50 px-1 text-green-700'
                                                    : l.type === 'eq'
                                                      ? 'px-1 text-gray-400 opacity-50'
                                                      : 'px-1 opacity-0'
                                            }
                                        >
                                            {l.nw || '\u00a0'}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div>
                            {diffLines.map((l, i) =>
                                l.type === 'chg' ? (
                                    <React.Fragment key={i}>
                                        <div className="mb-0.5 rounded bg-red-50 px-2 py-0.5 text-red-700 line-through decoration-red-300">
                                            − {l.old}
                                        </div>
                                        <div className="mb-1 rounded bg-green-50 px-2 py-0.5 text-green-700">+ {l.nw}</div>
                                    </React.Fragment>
                                ) : l.type === 'del' ? (
                                    <div key={i} className="mb-1 rounded bg-red-50 px-2 py-0.5 text-red-700 line-through decoration-red-300">
                                        − {l.old}
                                    </div>
                                ) : l.type === 'add' ? (
                                    <div key={i} className="mb-1 rounded bg-green-50 px-2 py-0.5 text-green-700">
                                        + {l.nw}
                                    </div>
                                ) : (
                                    <div key={i} className="px-2 py-px text-gray-400 opacity-60">
                                        {l.old}
                                    </div>
                                ),
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
