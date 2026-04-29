import { cn } from '@/lib/utils';
import { Head } from '@inertiajs/react';
import { ArrowLeftRight, Download, Loader2 } from 'lucide-react';
import React, { useState } from 'react';

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

    const meta1 = versions.find((v) => v.version_no === v1);
    const meta2 = versions.find((v) => v.version_no === v2);

    const pdfUrl1 = v1 ? `/api/contracts/${contract.id}/pdf/${v1}?type=agreement#view=FitH` : null;
    const pdfUrl2 = v2 ? `/api/contracts/${contract.id}/pdf/${v2}?type=agreement#view=FitH` : null;

    return (
        <div className="flex h-screen min-h-screen flex-col overflow-hidden bg-slate-50 font-sans antialiased">
            <Head title={`Compare Agreement - ${contract.contract_no}`} />

            {/* Global Header */}
            <div className="z-[100] flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-8 py-3.5 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="text-slate-900">
                        <ArrowLeftRight className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div className="flex flex-col">
                        <h2 className="flex items-center gap-2 text-sm font-bold text-black">
                            Perbandingan Persetujuan
                            <span className="rounded border border-black bg-black px-1.5 py-0.5 text-[9px] font-bold text-white">
                                Mode Audit
                            </span>
                        </h2>
                        <p className="mt-0.5 text-xs font-bold text-black">
                            {contract.contract_no} &bull; {contract.title}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => window.close()}
                        className="rounded-lg bg-black px-6 py-2 text-xs font-bold text-white shadow-lg transition-all hover:opacity-90 active:scale-95"
                    >
                        Tutup Perbandingan
                    </button>
                </div>
            </div>

            {/* Split Screen Container */}
            <div className="flex flex-1 divide-x divide-slate-200 overflow-hidden bg-slate-100">
                {/* SIDE A */}
                <div className="relative flex flex-1 flex-col overflow-hidden">
                    <div className="z-40 flex items-center justify-between border-b border-black/5 bg-white/95 px-8 py-5 backdrop-blur-md">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-[3px] rounded-full bg-black" />
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-black">Versi Referensi</span>
                                <h3 className="text-sm font-bold text-black">VERSI {v1}</h3>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <select
                                value={v1}
                                onChange={(e) => setV1(Number(e.target.value))}
                                className="cursor-pointer rounded-lg border-2 border-black bg-white px-4 py-2 text-xs font-bold text-black outline-none transition-all hover:bg-black hover:text-white"
                            >
                                {[...versions]
                                    .sort((a, b) => b.version_no - a.version_no)
                                    .map((v) => (
                                        <option key={v.id} value={v.version_no}>
                                            V{v.version_no} - {v.uploader?.name || 'System'}
                                        </option>
                                    ))}
                            </select>
                            <a
                                href={`/api/contracts/${contract.id}/download?version=${v1}&type=agreement`}
                                className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-black bg-white text-black transition-all hover:bg-black hover:text-white active:scale-95"
                                title="Download Word file"
                            >
                                <Download size={16} />
                            </a>
                        </div>
                    </div>

                    <div className="flex-1 bg-slate-200 p-2 lg:p-8">
                        {pdfUrl1 ? (
                            <iframe src={pdfUrl1} className="h-full w-full border-none shadow-2xl ring-1 ring-slate-300" title="V1 Preview" />
                        ) : (
                            <div className="flex h-full items-center justify-center">
                                <Loader2 size={32} className="animate-spin text-slate-300" />
                            </div>
                        )}
                    </div>
                </div>

                {/* SIDE B */}
                <div className="relative flex flex-1 flex-col overflow-hidden">
                    <div className="z-40 flex items-center justify-between border-b border-black bg-black px-8 py-5">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-[3px] rounded-full bg-white" />
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-white">Target Perbandingan</span>
                                <h3 className="text-sm font-bold text-white">VERSI {v2}</h3>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <select
                                value={v2}
                                onChange={(e) => setV2(Number(e.target.value))}
                                className="cursor-pointer rounded-lg border-2 border-white bg-white px-4 py-2 text-xs font-bold text-black outline-none transition-all hover:bg-transparent hover:text-white"
                            >
                                {[...versions]
                                    .sort((a, b) => b.version_no - a.version_no)
                                    .map((v) => (
                                        <option key={v.id} value={v.version_no} className="text-black">
                                            V{v.version_no} - {v.uploader?.name || 'System'}
                                        </option>
                                    ))}
                            </select>
                            <a
                                href={`/api/contracts/${contract.id}/download?version=${v2}&type=agreement`}
                                className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-black shadow-lg transition-all hover:opacity-90 active:scale-95"
                                title="Download Word file"
                            >
                                <Download size={16} />
                            </a>
                        </div>
                    </div>

                    <div className="flex-1 bg-slate-300 p-2 lg:p-8">
                        {pdfUrl2 ? (
                            <iframe src={pdfUrl2} className="h-full w-full border-none shadow-2xl ring-1 ring-slate-400" title="V2 Preview" />
                        ) : (
                            <div className="flex h-full items-center justify-center">
                                <Loader2 size={32} className="animate-spin text-indigo-300" />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Status Footer */}
            <div className="z-50 flex shrink-0 items-center justify-center gap-8 border-t border-black/5 bg-white px-10 py-4">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-black">High-Fidelity PDF Engine</span>
                </div>
                <div className="h-4 w-px bg-black/10" />
                <div className="flex items-center gap-2 text-black">
                    <span className="text-[10px] font-bold">Mode Perbandingan</span>
                </div>
            </div>
            
            <style dangerouslySetInnerHTML={{ __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
            `}} />
        </div>
    );
}

CompareAgreements.layout = (page: React.ReactNode) => <>{page}</>;
