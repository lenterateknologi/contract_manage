import { cn, formatDate, formatDateTime } from '@/lib/utils';
import { Contract } from '@/pages/contracts/types';
import { Head } from '@inertiajs/react';
import React from 'react';

interface Props {
    contract: Contract;
    histories: any[];
    filters: any;
}

export default function AuditTrailDocument({ contract, histories, filters }: Props) {
    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="custom-scrollbar flex min-h-screen flex-col items-center bg-slate-200/50 p-4 sm:p-8 print:bg-white print:p-0">
            <Head title={`Audit Trail - ${contract.contract_no}`} />

            {/* Control Bar - Hidden on print */}
            <div className="fixed top-4 right-4 z-50 flex gap-2 print:hidden">
                <button
                    onClick={handlePrint}
                    className="flex h-10 items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-6 text-[10px] font-semibold text-white uppercase shadow-xl transition-all hover:bg-slate-800 active:scale-95"
                >
                    <i className="fa-solid fa-print" /> CETAK DOKUMEN
                </button>
            </div>

            {/* Document Style Viewport */}
            <div className="animate-in fade-in zoom-in-95 flex min-h-[297mm] w-full max-w-[210mm] flex-col bg-white p-[15mm] shadow-2xl ring-1 ring-slate-300 duration-500 sm:p-[20mm]">
                {/* Document Header */}
                <div className="mb-8 border-b-2 border-slate-900 pb-8 text-left">
                    <div className="mb-6 flex items-center justify-between">
                        <div className="flex flex-col">
                            <h1 className="text-2xl leading-none font-semibold tracking-tighter text-slate-950 uppercase italic">
                                Catatan Audit Kontrak
                            </h1>
                            <span className="mt-1 text-[10px] font-bold text-slate-500 uppercase">Audit Trail Log Report</span>
                        </div>
                        <div className="text-right">
                            <div className="mb-1 text-[10px] leading-none font-semibold text-slate-400 uppercase">Contract No.</div>
                            <div className="font-mono text-sm font-bold text-slate-900">{contract.contract_no}</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8 pt-4">
                        <div>
                            <div className="mb-1.5 text-[9px] font-semibold tracking-[0.2em] text-slate-400 uppercase">Judul Kontrak</div>
                            <div className="text-[12px] leading-tight font-bold text-slate-900">{contract.title}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="mb-1.5 text-[9px] font-semibold tracking-[0.2em] text-slate-400 uppercase">Masa Berlaku</div>
                                <div className="text-[10px] font-bold text-slate-900">
                                    {formatDate(contract.contract_date)}
                                    {contract.end_date && ` — ${formatDate(contract.end_date)}`}
                                </div>
                            </div>
                            <div>
                                <div className="mb-1.5 text-[9px] font-semibold tracking-[0.2em] text-slate-400 uppercase">Dicetak Pada</div>
                                <div className="text-[10px] font-bold text-slate-900">{formatDateTime(new Date())}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Info Box */}
                <div className="mb-8 rounded-lg border border-slate-200 bg-slate-50 p-6">
                    <div className="grid grid-cols-3 gap-6">
                        <div>
                            <div className="mb-1 text-[8px] font-semibold text-slate-400 uppercase">Tipe Kontrak</div>
                            <div className="text-[11px] font-bold uppercase">{contract.contract_type}</div>
                        </div>
                        <div>
                            <div className="mb-1 text-[8px] font-semibold text-slate-400 uppercase">Tipe Perjanjian</div>
                            <div className="text-[11px] font-bold uppercase">{contract.transaction_type || 'Perjanjian Baru'}</div>
                        </div>
                        <div>
                            <div className="mb-1 text-[8px] font-semibold text-slate-400 uppercase">Pihak Kedua</div>
                            <div className="text-[11px] font-bold uppercase">{contract.p2_entity || (contract as any).vendor?.name || '-'}</div>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="flex-1">
                    <table className="w-full border-collapse text-left">
                        <thead>
                            <tr className="border-y border-slate-300 bg-slate-100">
                                <th className="w-[160px] px-4 py-3 text-[10px] font-semibold text-slate-600 uppercase">Waktu (WIB)</th>
                                <th className="w-[160px] px-4 py-3 text-[10px] font-semibold text-slate-600 uppercase">Aktor</th>
                                <th className="w-[120px] px-4 py-3 text-[10px] font-semibold text-slate-600 uppercase">Aksi</th>
                                <th className="px-4 py-3 text-[10px] font-semibold text-slate-600 uppercase">Keterangan</th>
                            </tr>
                        </thead>
                        <tbody>
                            {histories.map((h, i) => (
                                <tr key={h.id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                                    <td className="border-b border-slate-100 px-4 py-4 font-mono text-[10px] font-bold text-slate-700">
                                        {formatDateTime(h.created_at)}
                                    </td>
                                    <td className="border-b border-slate-100 px-4 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-[11px] leading-tight font-semibold text-black uppercase">
                                                {h.actor?.name || 'System'}
                                            </span>
                                            {h.actor?.id && (
                                                <span className="font-mono text-[8px] text-slate-400">UID: {h.actor.id.substring(0, 8)}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="border-b border-slate-100 px-4 py-4">
                                        <span
                                            className={cn(
                                                'inline-block rounded px-1.5 py-0.5 text-[8px] font-semibold tracking-tighter uppercase ring-1 ring-inset',
                                                h.action.includes('APPROVE')
                                                    ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                                                    : h.action.includes('REJECT')
                                                        ? 'bg-rose-50 text-rose-700 ring-rose-200'
                                                        : 'bg-indigo-50 text-indigo-700 ring-indigo-200',
                                            )}
                                        >
                                            {h.action.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td className="border-b border-slate-100 px-4 py-4 text-[11px] leading-relaxed font-semibold text-black">
                                        {h.description}
                                    </td>
                                </tr>
                            ))}
                            {histories.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-4 py-20 text-center text-xs font-bold tracking-[0.2em] text-slate-400 uppercase">
                                        Belum ada riwayat audit
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Document Footer */}
                <div className="mt-12 flex items-end justify-between border-t border-slate-100 pt-8">
                    <div className="flex flex-col">
                        <span className="mb-1 text-[9px] font-semibold text-slate-400 uppercase">Generated by CMS System</span>
                        <span className="text-[10px] font-bold text-slate-900 italic">
                            Laporan ini dibuat secara otomatis oleh sistem managemen kontrak digital.
                        </span>
                    </div>
                    <div className="flex flex-col items-end">
                        <div className="mb-1 font-mono text-[10px] font-bold tracking-tighter text-slate-300 uppercase">Page 1 of 1</div>
                        <div className="font-mono text-[10px] font-bold tracking-tighter text-slate-300">ID: {contract.id.toUpperCase()}</div>
                    </div>
                </div>
            </div>

            <p className="mt-8 text-[10px] font-bold text-slate-400 uppercase print:hidden">
                Gunakan Ctrl+P atau tombol di atas untuk mencetak dokumen ini.
            </p>
        </div>
    );
}

AuditTrailDocument.layout = (page: React.ReactNode) => <>{page}</>;
