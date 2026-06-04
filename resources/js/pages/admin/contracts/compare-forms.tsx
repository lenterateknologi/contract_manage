import { InteractiveForm } from '@/components/form/renderer/InteractiveForm';
import { cn } from '@/lib/utils';
import { Head } from '@inertiajs/react';
import { ArrowLeftRight, CalendarDays, User } from 'lucide-react';
import React, { useState } from 'react';

interface VersionItem {
    id: string;
    version_no: number;
    form_data: Record<string, any>;
    created_at: string;
    created_by: string;
}

interface CompareFormsProps {
    contract: any;
    docType: string;
    template: any;
    versions: VersionItem[];
    initialV1?: number;
    initialV2?: number;
}

export default function CompareForms({ contract, docType, template, versions, initialV1, initialV2 }: CompareFormsProps) {
    const sortedVersions = [...versions].sort((a, b) => b.version_no - a.version_no);

    // Default: Side A is oldest (v1), Side B is latest (vN) or from URL
    const [v1, setV1] = useState<number>(
        initialV1 || (versions.length > 1 ? versions[versions.length - 1].version_no : versions[0]?.version_no || 0),
    );
    const [v2, setV2] = useState<number>(initialV2 || (versions.length > 0 ? versions[0].version_no : 0));

    const ref1 = React.useRef<HTMLDivElement>(null);
    const ref2 = React.useRef<HTMLDivElement>(null);

    const [syncScroll, setSyncScroll] = useState(true);
    const isSyncingLeft = React.useRef(false);
    const isSyncingRight = React.useRef(false);

    const handleScroll = (source: 'left' | 'right') => {
        if (!syncScroll) return;
        const left = ref1.current;
        const right = ref2.current;
        if (!left || !right) return;

        if (source === 'left') {
            if (isSyncingRight.current) return;
            isSyncingLeft.current = true;

            const rangeL = left.scrollHeight - left.clientHeight;
            const rangeR = right.scrollHeight - right.clientHeight;
            if (rangeL > 0 && rangeR > 0) {
                right.scrollTop = (left.scrollTop / rangeL) * rangeR;
            }

            window.requestAnimationFrame(() => {
                isSyncingLeft.current = false;
            });
        } else {
            if (isSyncingLeft.current) return;
            isSyncingRight.current = true;

            const rangeL = left.scrollHeight - left.clientHeight;
            const rangeR = right.scrollHeight - right.clientHeight;
            if (rangeL > 0 && rangeR > 0) {
                left.scrollTop = (right.scrollTop / rangeR) * rangeL;
            }

            window.requestAnimationFrame(() => {
                isSyncingRight.current = false;
            });
        }
    };

    const data1 = versions.find((v) => v.version_no === v1)?.form_data || {};
    const data2 = versions.find((v) => v.version_no === v2)?.form_data || {};
    const meta1 = versions.find((v) => v.version_no === v1);
    const meta2 = versions.find((v) => v.version_no === v2);

    const diffDataA: Record<string, any> = {};
    const diffDataB: Record<string, any> = {};

    if (template?.fields) {
        template.fields.forEach((f: any) => {
            const v1Val = data1[f.name];
            const v2Val = data2[f.name];

            // Normalize "—" to empty string for comparison
            const clean1 = v1Val === '—' || !v1Val ? '' : JSON.stringify(v1Val);
            const clean2 = v2Val === '—' || !v2Val ? '' : JSON.stringify(v2Val);
            const isDiff = clean1 !== clean2;

            if (isDiff) {
                if (!clean1 && clean2) {
                    diffDataB[f.name] = 'added';
                } else if (clean1 && !clean2) {
                    diffDataA[f.name] = 'removed';
                } else {
                    diffDataA[f.name] = 'modified';
                    diffDataB[f.name] = 'modified';
                }
            }
        });
    }

    const templateForRenderer = template
        ? {
              ...template,
              has_letterhead: true,
              letterhead_json: template.letterhead_json || { margins: { top: 10, bottom: 10, left: 15, right: 15 } },
          }
        : null;

    if (!template) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-900 text-white">
                <div className="text-center">
                    <h1 className="text-2xl font-black italic">ERROR: TEMPLATE NOT FOUND</h1>
                    <p className="mt-2 text-[10px] font-bold text-slate-400 uppercase">No form template matches this context.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen min-h-screen flex-col overflow-hidden bg-slate-50 font-sans antialiased selection:bg-indigo-100">
            <Head title={`Audit ${docType.toUpperCase()} - ${contract.contract_no}`} />

            {/* Global Header - Simplified */}
            <div className="z-[100] flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-8 py-3.5 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="text-slate-900">
                        <ArrowLeftRight className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col">
                        <h2 className="flex items-center gap-2 text-sm font-bold text-black">
                            Perbandingan Versi Dokumen
                            <span className="rounded-md border border-black bg-black px-2 py-0.5 text-[9px] font-bold text-white">Mode Audit</span>
                        </h2>
                        <p className="mt-0.5 text-xs font-medium text-black">
                            {contract.contract_no} &bull; {contract.title}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="mr-2 flex items-center gap-3">
                        <span className="text-[10px] font-bold text-black">Sinkronisasi Scroll</span>
                        <button
                            onClick={() => setSyncScroll(!syncScroll)}
                            className={cn(
                                'relative inline-flex h-5 w-10 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-black focus-visible:outline-none',
                                syncScroll ? 'bg-black' : 'bg-black/10',
                            )}
                        >
                            <span
                                className={cn(
                                    'pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg transition-transform',
                                    syncScroll ? 'translate-x-5' : 'translate-x-1',
                                )}
                            />
                        </button>
                    </div>
                    <button
                        onClick={() => window.close()}
                        className="rounded-lg bg-black px-6 py-2 text-xs font-bold text-white shadow-lg transition-all hover:opacity-90 active:scale-95"
                    >
                        Tutup
                    </button>
                </div>
            </div>

            {/* Split Screen Audit Interface */}
            <div className="flex flex-1 divide-x-2 divide-slate-300 overflow-hidden bg-slate-200/50">
                {/* SIDE A: BASE REFERENCE */}
                <div ref={ref1} onScroll={() => handleScroll('left')} className="scrollbar-thin relative flex-1 overflow-auto bg-slate-50">
                    <div className="sticky top-0 z-[60] flex items-center justify-between border-b border-black/5 bg-white/95 px-8 py-5 backdrop-blur-md">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-[3px] rounded-full bg-black" />
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-black">Referensi Dasar (Lama)</span>
                                <h3 className="text-sm font-bold text-black">VERSI {v1}</h3>
                            </div>
                            <div className="mx-4 h-8 w-px bg-black/10" />
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-black">
                                    <User size={12} />
                                    {meta1?.created_by || '-'}
                                </div>
                                <div className="mt-1 flex items-center gap-2 text-[10px] font-bold text-black">
                                    <CalendarDays size={12} />
                                    {meta1?.created_at || '-'}
                                </div>
                            </div>
                        </div>
                        <select
                            value={v1}
                            onChange={(e) => setV1(Number(e.target.value))}
                            className="cursor-pointer rounded-lg border-2 border-black bg-white px-4 py-2 text-xs font-bold text-black transition-all outline-none hover:bg-black hover:text-white"
                        >
                            {sortedVersions.map((v) => (
                                <option key={v.id} value={v.version_no}>
                                    Versi {v.version_no}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex w-full justify-center p-8 pb-32">
                        <div className="w-full max-w-full">
                            {templateForRenderer && (
                                <InteractiveForm
                                    template={templateForRenderer}
                                    formData={data1}
                                    readOnly={true}
                                    diffData={diffDataA}
                                    comparisonData={data2}
                                    className="border border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.05)]"
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* SIDE B: CHANGE TARGET */}
                <div ref={ref2} onScroll={() => handleScroll('right')} className="scrollbar-thin relative flex-1 overflow-auto bg-slate-50">
                    <div className="sticky top-0 z-[60] flex items-center justify-between border-b border-black/5 bg-white/95 px-8 py-5 backdrop-blur-md">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-[3px] rounded-full bg-black" />
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-black">Perbandingan Aktif (Baru)</span>
                                <h3 className="text-sm font-bold text-black">VERSI {v2}</h3>
                            </div>
                            <div className="mx-4 h-8 w-px bg-black/10" />
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-black">
                                    <User size={12} />
                                    {meta2?.created_by || '-'}
                                </div>
                                <div className="mt-1 flex items-center gap-2 text-[10px] font-bold text-black">
                                    <CalendarDays size={12} />
                                    {meta2?.created_at || '-'}
                                </div>
                            </div>
                        </div>
                        <select
                            value={v2}
                            onChange={(e) => setV2(Number(e.target.value))}
                            className="cursor-pointer rounded-lg border-2 border-black bg-white px-4 py-2 text-xs font-bold text-black transition-all outline-none hover:bg-black hover:text-white"
                        >
                            {sortedVersions.map((v) => (
                                <option key={v.id} value={v.version_no} className="text-black">
                                    Versi {v.version_no}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex w-full justify-center p-8 pb-32">
                        <div className="w-full max-w-full">
                            {templateForRenderer && (
                                <InteractiveForm
                                    template={templateForRenderer}
                                    formData={data2}
                                    readOnly={true}
                                    diffData={diffDataB}
                                    comparisonData={data1}
                                    className="border border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.05)]"
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Audit Status HUD */}
            <div className="z-50 flex shrink-0 items-center justify-center gap-10 border-t border-black/5 bg-white px-10 py-4">
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-black" />
                    <span className="text-[10px] font-bold text-black">Total Field: {templateForRenderer?.fields?.length || 0}</span>
                </div>
                <div className="h-4 w-px bg-black/10" />
                <div className="flex items-center gap-2">
                    <div className={cn('h-2 w-2 rounded-full', syncScroll ? 'animate-pulse bg-black' : 'bg-black/20')} />
                    <span className={cn('text-[10px] font-bold', syncScroll ? 'text-black' : 'text-black/40')}>
                        Sinkronisasi Scroll {syncScroll ? 'Aktif' : 'Nonaktif'}
                    </span>
                </div>
                <div className="h-4 w-px bg-black/10" />
                <div className="flex items-center gap-5">
                    <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-sm border border-black bg-rose-50" />
                        <span className="text-[10px] font-bold text-black">Dihapus</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-sm border border-black bg-emerald-50" />
                        <span className="text-[10px] font-bold text-black">Ditambah</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-sm border border-black bg-amber-50" />
                        <span className="text-[10px] font-bold text-black">Diubah</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

CompareForms.layout = (page: React.ReactNode) => <>{page}</>;
