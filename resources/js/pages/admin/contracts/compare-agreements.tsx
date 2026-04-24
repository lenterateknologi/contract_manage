import { cn } from '@/lib/utils';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import { renderAsync } from 'docx-preview';
import { ArrowLeftRight, CalendarDays, Download, FileText, Loader2, User } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

interface VersionItem {
    id: string;
    version_no: number;
    file_name: string;
    created_at: string;
    uploader?: {
        name: string;
    };
}

interface CompareAgreementsProps {
    contract: any;
    versions: VersionItem[];
    initialV1?: number;
    initialV2?: number;
}

export default function CompareAgreements({ contract, versions, initialV1, initialV2 }: CompareAgreementsProps) {
    const [v1, setV1] = useState<number>(initialV1 || (versions.length > 0 ? versions[0].version_no : 0));
    const [v2, setV2] = useState<number>(initialV2 || (versions.length > 0 ? versions[versions.length - 1].version_no : 0));

    const [syncScroll, setSyncScroll] = useState(true);
    const ref1 = useRef<HTMLDivElement>(null);
    const ref2 = useRef<HTMLDivElement>(null);
    const doc1Ref = useRef<HTMLDivElement>(null);
    const doc2Ref = useRef<HTMLDivElement>(null);
    const isSyncing = useRef(false);
    const [loading1, setLoading1] = useState(false);
    const [loading2, setLoading2] = useState(false);

    const meta1 = versions.find((v) => v.version_no === v1);
    const meta2 = versions.find((v) => v.version_no === v2);

    const renderFile = async (vno: number, container: HTMLDivElement, setLoading: (l: boolean) => void) => {
        setLoading(true);
        try {
            const res = await axios.get(`/api/contracts/${contract.id}/file/${vno}?type=agreement`, {
                responseType: 'blob',
            });
            container.innerHTML = '';
            await renderAsync(res.data, container);
        } catch (err) {
            console.error('Render failed', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (doc1Ref.current && v1) renderFile(v1, doc1Ref.current, setLoading1);
    }, [v1]);

    useEffect(() => {
        if (doc2Ref.current && v2) renderFile(v2, doc2Ref.current, setLoading2);
    }, [v2]);

    const handleScroll = (source: HTMLDivElement, target: HTMLDivElement) => {
        if (!syncScroll || isSyncing.current) return;
        isSyncing.current = true;

        const scrollRangeSource = source.scrollHeight - source.clientHeight;
        const scrollRangeTarget = target.scrollHeight - target.clientHeight;

        if (scrollRangeSource > 0 && scrollRangeTarget > 0) {
            const percentage = source.scrollTop / scrollRangeSource;
            target.scrollTop = Math.round(percentage * scrollRangeTarget);
        }

        // Use requestAnimationFrame to clear the lock in the next frame
        // to ensure immediate responsiveness without circular loops.
        window.requestAnimationFrame(() => {
            isSyncing.current = false;
        });
    };

    return (
        <div className="flex h-screen min-h-screen flex-col overflow-hidden bg-slate-50 font-sans antialiased">
            <Head title={`Compare Agreement - ${contract.contract_no}`} />

            {/* Global Header */}
            <div className="z-[100] flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-8 py-3.5 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="text-slate-900">
                        <ArrowLeftRight className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col">
                        <h2 className="flex items-center gap-2 text-[13px] font-bold tracking-tight text-slate-900">
                            Compare Document Versions
                            <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[9px] font-medium text-slate-500">
                                Audit Mode
                            </span>
                        </h2>
                        <p className="mt-0.5 text-[10px] text-slate-400">
                            {contract.contract_no} &bull; {contract.title}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Simplified Switch Toggle */}
                    <div className="mr-2 flex items-center gap-3">
                        <span className="text-[10px] font-black tracking-tighter text-slate-400 uppercase">Sync Scroll</span>
                        <button
                            onClick={() => setSyncScroll(!syncScroll)}
                            className={cn(
                                'relative inline-flex h-5 w-10 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none',
                                syncScroll ? 'bg-indigo-600' : 'bg-slate-200',
                            )}
                        >
                            <span
                                className={cn(
                                    'pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform',
                                    syncScroll ? 'translate-x-5' : 'translate-x-1',
                                )}
                            />
                        </button>
                    </div>
                    <button
                        onClick={() => window.close()}
                        className="rounded-md bg-slate-900 px-4 py-1.5 text-[11px] font-medium text-white shadow-sm transition-all hover:bg-slate-800"
                    >
                        Close
                    </button>
                </div>
            </div>

            {/* Split Screen Container */}
            <div className="flex flex-1 divide-x-2 divide-slate-300 overflow-hidden bg-slate-200/50">
                {/* SIDE A */}
                <div
                    ref={ref1}
                    onScroll={(e) => handleScroll(e.currentTarget, ref2.current!)}
                    className="scrollbar-thin relative flex-1 overflow-auto bg-slate-100"
                >
                    <div className="sticky top-0 z-[60] flex items-center justify-between border-b border-slate-200 bg-white px-8 py-4 opacity-95 shadow-sm backdrop-blur-sm">
                        <div className="flex items-center gap-4">
                            <div className="h-8 w-1.5 rounded-full bg-slate-300" />
                            <div className="flex flex-col">
                                <span className="text-[8px] font-black tracking-widest text-slate-400 uppercase">Base Reference (Old)</span>
                                <h3 className="text-sm font-black tracking-tighter text-slate-900 uppercase">VERSION {v1}</h3>
                            </div>
                            <div className="mx-2 h-6 w-px bg-slate-100" />
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600">
                                    <User size={12} className="text-slate-400" />
                                    {meta1?.uploader?.name || 'System'}
                                </div>
                                <div className="mt-0.5 flex items-center gap-2 text-[9px] text-slate-400">
                                    <CalendarDays size={10} />
                                    {meta1?.created_at || '-'}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <a
                                href={`/api/contracts/${contract.id}/file/${v1}?type=agreement`}
                                download
                                className="rounded-lg border border-slate-200 p-2 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600"
                            >
                                <Download size={14} />
                            </a>
                            <select
                                value={v1}
                                onChange={(e) => setV1(Number(e.target.value))}
                                className="cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-bold text-slate-700 outline-none"
                            >
                                {[...versions]
                                    .sort((a, b) => b.version_no - a.version_no)
                                    .map((v) => (
                                        <option key={v.id} value={v.version_no}>
                                            v{v.version_no}
                                        </option>
                                    ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-center p-8 pb-10">
                        {loading1 && (
                            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm">
                                <Loader2 size={32} className="animate-spin text-slate-400" />
                            </div>
                        )}
                        <div
                            ref={doc1Ref}
                            className="docx-container mt-[10px] flex w-full max-w-[210mm] justify-center bg-white p-4 shadow-2xl ring-1 ring-slate-200"
                        />
                    </div>
                </div>

                {/* SIDE B */}
                <div
                    ref={ref2}
                    onScroll={(e) => handleScroll(e.currentTarget, ref1.current!)}
                    className="scrollbar-thin relative flex-1 overflow-auto bg-slate-100"
                >
                    <div className="sticky top-0 z-[60] flex items-center justify-between border-b border-indigo-100 bg-indigo-50 px-8 py-4 opacity-95 shadow-sm backdrop-blur-sm">
                        <div className="flex items-center gap-4">
                            <div className="h-8 w-1.5 rounded-full bg-indigo-500 shadow-lg shadow-indigo-100" />
                            <div className="flex flex-col">
                                <span className="text-[8px] font-black tracking-widest text-indigo-400 uppercase">Comparison Target (New)</span>
                                <h3 className="text-sm font-black tracking-tighter text-indigo-600 uppercase">VERSION {v2}</h3>
                            </div>
                            <div className="mx-2 h-6 w-px bg-indigo-100" />
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-900">
                                    <User size={12} className="text-indigo-400" />
                                    {meta2?.uploader?.name || 'System'}
                                </div>
                                <div className="mt-0.5 flex items-center gap-2 text-[9px] leading-none text-indigo-400/70">
                                    <CalendarDays size={10} />
                                    {meta2?.created_at || '-'}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <a
                                href={`/api/contracts/${contract.id}/file/${v2}?type=agreement`}
                                download
                                className="rounded-lg border border-indigo-200 p-2 text-indigo-400 transition-colors hover:bg-white hover:text-indigo-600"
                            >
                                <Download size={14} />
                            </a>
                            <select
                                value={v2}
                                onChange={(e) => setV2(Number(e.target.value))}
                                className="cursor-pointer rounded-lg border-none bg-indigo-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-lg shadow-indigo-100 outline-none"
                            >
                                {[...versions]
                                    .sort((a, b) => b.version_no - a.version_no)
                                    .map((v) => (
                                        <option key={v.id} value={v.version_no} className="bg-slate-900">
                                            v{v.version_no}
                                        </option>
                                    ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-center p-8 pb-10">
                        {loading2 && (
                            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm">
                                <Loader2 size={32} className="animate-spin text-indigo-400" />
                            </div>
                        )}
                        <div
                            ref={doc2Ref}
                            className="docx-container mt-[10px] flex w-full max-w-[210mm] justify-center bg-white p-4 shadow-2xl ring-1 ring-slate-200"
                        />
                    </div>
                </div>
            </div>

            {/* Status Footer */}
            <div className="z-50 flex shrink-0 items-center justify-center gap-8 border-t border-slate-200 bg-white px-10 py-3">
                <div className="flex items-center gap-2">
                    <FileText size={14} className="text-slate-400" />
                    <span className="text-[10px] leading-none font-bold tracking-widest text-slate-500 uppercase">Document Engine: DOCX-PREVIEW</span>
                </div>
                <div className="h-4 w-px bg-slate-200" />
                <div className="flex items-center gap-2">
                    <div className={cn('h-2 w-2 rounded-full', syncScroll ? 'animate-pulse bg-emerald-500' : 'bg-slate-300')} />
                    <span
                        className={cn(
                            'text-[10px] leading-none font-bold tracking-widest uppercase',
                            syncScroll ? 'text-emerald-600 italic' : 'text-slate-400',
                        )}
                    >
                        Sync Scroll {syncScroll ? 'Active' : 'Disabled'}
                    </span>
                </div>
            </div>

            <style
                dangerouslySetInnerHTML={{
                    __html: `
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
                .docx-preview-container {
                    width: 100% !important;
                }
                section.docx {
                    margin-bottom: 0 !important;
                    box-shadow: none !important;
                    padding: 40px !important;
                }
            `,
                }}
            />
        </div>
    );
}

CompareAgreements.layout = (page: React.ReactNode) => <>{page}</>;
