import { InteractiveForm } from '@/components/form-renderer/InteractiveForm';
import { Head } from '@inertiajs/react';
import { ArrowLeftRight, CalendarDays, User } from 'lucide-react';
import React, { useState } from 'react';
import { cn } from '@/lib/utils';

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
    const [v1, setV1] = useState<number>(initialV1 || (versions.length > 1 ? versions[versions.length - 1].version_no : (versions[0]?.version_no || 0)));
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
                    <p className="mt-2 text-[10px] font-bold tracking-widest text-slate-400 uppercase">No form template matches this context.</p>
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
                    <div className="flex items-center gap-3 mr-2">
                        <span className="text-[10px] font-black tracking-tighter text-slate-400 uppercase">
                            Sync Scroll
                        </span>
                        <button
                            onClick={() => setSyncScroll(!syncScroll)}
                            className={cn(
                                "relative inline-flex h-5 w-10 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                                syncScroll ? "bg-indigo-600" : "bg-slate-200"
                            )}
                        >
                            <span
                                className={cn(
                                    "pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform",
                                    syncScroll ? "translate-x-5" : "translate-x-1"
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

            {/* Split Screen Audit Interface */}
            <div className="flex flex-1 divide-x-2 divide-slate-300 overflow-hidden bg-slate-200/50">
                {/* SIDE A: BASE REFERENCE */}
                <div ref={ref1} onScroll={() => handleScroll('left')} className="scrollbar-thin relative flex-1 overflow-auto bg-slate-50">
                    <div className="sticky top-0 z-[60] flex items-center justify-between border-b border-slate-200 bg-white px-8 py-4 shadow-sm">
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
                                    {meta1?.created_by || '-'}
                                </div>
                                <div className="mt-0.5 flex items-center gap-2 text-[9px] text-slate-400">
                                    <CalendarDays size={10} />
                                    {meta1?.created_at || '-'}
                                </div>
                            </div>
                        </div>
                        <select
                            value={v1}
                            onChange={(e) => setV1(Number(e.target.value))}
                            className="cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-bold text-slate-700 outline-none"
                        >
                            {sortedVersions.map((v) => <option key={v.id} value={v.version_no}>v{v.version_no}</option>)}
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
                    <div className="sticky top-0 z-[60] flex items-center justify-between border-b border-indigo-100 bg-indigo-50 px-8 py-4 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="h-8 w-1.5 rounded-full bg-indigo-500 shadow-lg shadow-indigo-100" />
                            <div className="flex flex-col">
                                <span className="text-[8px] font-black tracking-widest text-indigo-400 uppercase">Active Comparison (New)</span>
                                <h3 className="max-w-[150px] overflow-hidden text-sm font-black tracking-tighter text-ellipsis whitespace-nowrap text-indigo-600 uppercase italic">
                                    VERSION {v2}
                                </h3>
                            </div>
                            <div className="mx-2 h-6 w-px bg-indigo-100" />
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-900">
                                    <User size={12} className="text-indigo-400" />
                                    {meta2?.created_by || '-'}
                                </div>
                                <div className="mt-0.5 flex items-center gap-2 text-[9px] leading-none text-indigo-400/70">
                                    <CalendarDays size={10} />
                                    {meta2?.created_at || '-'}
                                </div>
                            </div>
                        </div>
                        <select
                            value={v2}
                            onChange={(e) => setV2(Number(e.target.value))}
                            className="cursor-pointer rounded-lg border-none bg-indigo-600 px-3 py-1.5 text-[11px] font-bold text-white outline-none shadow-lg shadow-indigo-100"
                        >
                            {sortedVersions.map((v) => <option key={v.id} value={v.version_no} className="bg-slate-900">v{v.version_no}</option>)}
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
                                    className="border border-indigo-100 shadow-[0_20px_50px_rgba(0,0,0,0.05)] ring-2 ring-indigo-50"
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Audit Status HUD */}
            <div className="z-50 flex shrink-0 items-center justify-center gap-10 border-t border-slate-200 bg-white px-10 py-3">
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-slate-300" />
                    <span className="text-[9px] font-black tracking-widest text-slate-500 uppercase">
                        Base Fields: {templateForRenderer?.fields?.length || 0}
                    </span>
                </div>
                <div className="h-4 w-px bg-slate-200" />
                <div className="flex items-center gap-2">
                    <div className={cn("h-2 w-2 rounded-full", syncScroll ? "bg-emerald-500 animate-pulse" : "bg-slate-300")} />
                    <span className={cn("text-[9px] font-black tracking-widest uppercase italic", syncScroll ? "text-emerald-600" : "text-slate-400")}>
                        Scroll Sync {syncScroll ? 'Active' : 'Disabled'}
                    </span>
                </div>
                <div className="h-4 w-px bg-slate-200" />
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                        <div className="h-2 w-2 rounded-sm border border-rose-400 bg-rose-200" />
                        <span className="text-[8px] font-black text-slate-400 uppercase">Removed</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="h-2 w-2 rounded-sm border border-emerald-400 bg-emerald-100" />
                        <span className="text-[8px] font-black text-slate-400 uppercase">Added</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="h-2 w-2 rounded-sm border border-amber-400 bg-amber-100" />
                        <span className="text-[8px] font-black text-slate-400 uppercase">Modified</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

CompareForms.layout = (page: React.ReactNode) => <>{page}</>;
