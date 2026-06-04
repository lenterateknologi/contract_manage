import { Head } from '@inertiajs/react';
import { ArrowLeftRight, CalendarDays, Download, Loader2, User } from 'lucide-react';
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
    documentType?: 'agreement' | 'f1' | 'f2';
}

export default function CompareAgreements({ contract, versions, initialV1, initialV2, documentType = 'agreement' }: CompareAgreementsProps) {
    const sortedVersions = [...versions].sort((a, b) => b.version_no - a.version_no);

    const [v1, setV1] = useState<number>(
        initialV1 || (versions.length > 1 ? versions[versions.length - 1].version_no : versions[0]?.version_no || 0),
    );
    const [v2, setV2] = useState<number>(initialV2 || (versions.length > 0 ? versions[0].version_no : 0));

    const meta1 = versions.find((v) => v.version_no === v1);
    const meta2 = versions.find((v) => v.version_no === v2);

    const pdfUrl1 = v1 ? `/api/contracts/${contract.id}/pdf/${v1}?type=${documentType}#view=FitH` : null;
    const pdfUrl2 = v2 ? `/api/contracts/${contract.id}/pdf/${v2}?type=${documentType}#view=FitH` : null;

    const labelMapping: Record<string, string> = {
        f1: 'Dokumen F1',
        f2: 'Dokumen F2',
        agreement: 'Draft Perjanjian',
    };
    const titleLabel = labelMapping[documentType] || 'Persetujuan';

    return (
        <div className="flex h-screen min-h-screen flex-col overflow-hidden bg-white font-sans antialiased selection:bg-indigo-100">
            <Head title={`Audit ${titleLabel} - ${contract.contract_no}`} />

            {/* Main Header */}
            <div className="z-[100] flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
                <div className="flex items-center gap-3">
                    <ArrowLeftRight className="h-5 w-5 text-indigo-600" />
                    <div className="flex flex-col">
                        <h1 className="font-montserrat text-sm font-bold text-slate-900">Audit {titleLabel}</h1>
                        <p className="text-[11px] font-medium text-slate-500">
                            {contract.contract_no} &bull; {contract.title}
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => window.close()}
                    className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-slate-800 active:scale-95"
                >
                    Tutup Audit
                </button>
            </div>

            {/* Split PDF Viewer */}
            <div className="flex flex-1 overflow-hidden bg-slate-100">
                {/* PANEL A */}
                <div className="flex flex-1 flex-col border-r border-slate-200 bg-white">
                    <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-4 py-2.5">
                        <div className="flex items-center gap-4">
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-slate-900">Versi {v1}</span>
                            </div>
                            <div className="hidden items-center gap-3 border-l border-slate-200 pl-4 text-[10px] text-slate-500 lg:flex">
                                <div className="flex items-center gap-1.5">
                                    <User size={12} className="text-slate-400" />
                                    <span>{meta1?.uploader?.name || 'System'}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <CalendarDays size={12} className="text-slate-400" />
                                    <span>{meta1?.created_at?.split(' ')[0] || '-'}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <select
                                value={v1}
                                onChange={(e) => setV1(Number(e.target.value))}
                                className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500"
                            >
                                {sortedVersions.map((v) => (
                                    <option key={v.id} value={v.version_no}>
                                        V{v.version_no}
                                    </option>
                                ))}
                            </select>
                            <a
                                href={`/api/contracts/${contract.id}/download?version=${v1}&type=${documentType}`}
                                className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                            >
                                <Download size={14} />
                            </a>
                        </div>
                    </div>
                    <div className="flex-1 bg-slate-100">
                        {pdfUrl1 ? (
                            <iframe src={pdfUrl1} className="h-full w-full border-none" title="V1 Preview" />
                        ) : (
                            <div className="flex h-full items-center justify-center">
                                <Loader2 size={24} className="animate-spin text-slate-300" />
                            </div>
                        )}
                    </div>
                </div>

                {/* PANEL B */}
                <div className="flex flex-1 flex-col bg-white">
                    <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-4 py-2.5">
                        <div className="flex items-center gap-4">
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-slate-900">Versi {v2}</span>
                            </div>
                            <div className="hidden items-center gap-3 border-l border-slate-200 pl-4 text-[10px] text-slate-500 lg:flex">
                                <div className="flex items-center gap-1.5">
                                    <User size={12} className="text-slate-400" />
                                    <span>{meta2?.uploader?.name || 'System'}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <CalendarDays size={12} className="text-slate-400" />
                                    <span>{meta2?.created_at?.split(' ')[0] || '-'}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <select
                                value={v2}
                                onChange={(e) => setV2(Number(e.target.value))}
                                className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500"
                            >
                                {sortedVersions.map((v) => (
                                    <option key={v.id} value={v.version_no}>
                                        V{v.version_no}
                                    </option>
                                ))}
                            </select>
                            <a
                                href={`/api/contracts/${contract.id}/download?version=${v2}&type=${documentType}`}
                                className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                            >
                                <Download size={14} />
                            </a>
                        </div>
                    </div>
                    <div className="flex-1 bg-slate-100">
                        {pdfUrl2 ? (
                            <iframe src={pdfUrl2} className="h-full w-full border-none" title="V2 Preview" />
                        ) : (
                            <div className="flex h-full items-center justify-center">
                                <Loader2 size={24} className="animate-spin text-slate-300" />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

CompareAgreements.layout = (page: React.ReactNode) => <>{page}</>;
