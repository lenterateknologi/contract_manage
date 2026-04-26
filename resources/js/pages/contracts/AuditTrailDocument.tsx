import { Contract } from '@/types/contracts';
import { Head } from '@inertiajs/react';
import { Download, Loader2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import React, { useState } from 'react';

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
        <div className="min-h-screen bg-slate-200/50 p-4 sm:p-8 flex flex-col items-center">
            <Head title={`Audit Trail - ${contract.contract_no}`} />
            
            {/* Control Bar - Hidden on print */}
            <div className="fixed top-4 right-4 flex gap-2 print:hidden z-50">
                <button
                    onClick={handlePrint}
                    className="flex h-10 items-center gap-2 rounded-full bg-slate-900 border border-slate-700 px-6 text-[10px] font-black tracking-widest text-white uppercase shadow-xl transition-all hover:bg-slate-800 active:scale-95"
                >
                    <i className="fa-solid fa-print" /> CETAK DOKUMEN
                </button>
            </div>

            {/* Document Style Viewport */}
            <div className="w-full max-w-[210mm] bg-white shadow-2xl ring-1 ring-slate-300 p-[15mm] sm:p-[20mm] flex flex-col min-h-[297mm] animate-in fade-in zoom-in-95 duration-500">
                {/* Document Header */}
                <div className="border-b-2 border-slate-900 pb-8 mb-8 text-left">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex flex-col">
                            <h1 className="text-2xl font-black tracking-tighter text-slate-950 uppercase italic leading-none">Catatan Audit Kontrak</h1>
                            <span className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-widest">Audit Trail Log Report</span>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Contract No.</div>
                            <div className="text-sm font-mono font-bold text-slate-900">{contract.contract_no}</div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-8 pt-4">
                        <div>
                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5">Judul Kontrak</div>
                            <div className="text-[12px] font-bold text-slate-900 leading-tight">{contract.title}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5">Masa Berlaku</div>
                                <div className="text-[10px] font-bold text-slate-900">
                                    {contract.contract_date ? new Date(contract.contract_date).toLocaleDateString('id-ID') : '-'}
                                    {contract.end_date && ` — ${new Date(contract.end_date).toLocaleDateString('id-ID')}`}
                                </div>
                            </div>
                            <div>
                                <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5">Dicetak Pada</div>
                                <div className="text-[10px] font-bold text-slate-900">{new Date().toLocaleString('id-ID')}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Info Box */}
                <div className="bg-slate-50 rounded-lg p-6 mb-8 border border-slate-200">
                    <div className="grid grid-cols-3 gap-6">
                        <div>
                            <div className="text-[8px] font-black text-slate-400 uppercase mb-1">Tipe Kontrak</div>
                            <div className="text-[11px] font-bold uppercase">{contract.contract_type}</div>
                        </div>
                        <div>
                            <div className="text-[8px] font-black text-slate-400 uppercase mb-1">Tipe Perjanjian</div>
                            <div className="text-[11px] font-bold uppercase">{contract.transaction_type || 'Perjanjian Baru'}</div>
                        </div>
                        <div>
                            <div className="text-[8px] font-black text-slate-400 uppercase mb-1">Pihak Kedua</div>
                            <div className="text-[11px] font-bold uppercase">{contract.p2_entity || (contract as any).vendor?.name || '-'}</div>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-100 border-y border-slate-300">
                                <th className="px-4 py-3 text-[10px] font-black tracking-widest text-slate-600 uppercase w-[160px]">Waktu (WIB)</th>
                                <th className="px-4 py-3 text-[10px] font-black tracking-widest text-slate-600 uppercase w-[160px]">Aktor</th>
                                <th className="px-4 py-3 text-[10px] font-black tracking-widest text-slate-600 uppercase w-[120px]">Aksi</th>
                                <th className="px-4 py-3 text-[10px] font-black tracking-widest text-slate-600 uppercase">Keterangan</th>
                            </tr>
                        </thead>
                        <tbody>
                            {histories.map((h, i) => (
                                <tr key={h.id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                                    <td className="border-b border-slate-100 px-4 py-4 text-[10px] font-mono font-bold text-slate-700">
                                        {new Date(h.created_at).toLocaleString('id-ID', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            second: '2-digit'
                                        })}
                                    </td>
                                    <td className="border-b border-slate-100 px-4 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-black text-[11px] text-black uppercase leading-tight">{h.actor?.name || 'System'}</span>
                                            {h.actor?.id && <span className="text-[8px] text-slate-400 font-mono">UID: {h.actor.id.substring(0,8)}</span>}
                                        </div>
                                    </td>
                                    <td className="border-b border-slate-100 px-4 py-4">
                                        <span className={cn(
                                            "inline-block px-1.5 py-0.5 rounded text-[8px] font-black tracking-tighter uppercase ring-1 ring-inset",
                                            h.action.includes('APPROVE') ? "bg-emerald-50 text-emerald-700 ring-emerald-200" :
                                            h.action.includes('REJECT') ? "bg-rose-50 text-rose-700 ring-rose-200" :
                                            "bg-indigo-50 text-indigo-700 ring-indigo-200"
                                        )}>
                                            {h.action.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td className="border-b border-slate-100 px-4 py-4 text-[11px] font-semibold leading-relaxed text-black">
                                        {h.description}
                                    </td>
                                </tr>
                            ))}
                            {histories.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-4 py-20 text-center text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Belum ada riwayat audit</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Document Footer */}
                <div className="mt-12 pt-8 border-t border-slate-100 flex items-end justify-between">
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Generated by CMS System</span>
                        <span className="text-[10px] font-bold text-slate-900 italic">Laporan ini dibuat secara otomatis oleh sistem managemen kontrak digital.</span>
                    </div>
                    <div className="flex flex-col items-end">
                        <div className="text-[10px] font-mono font-bold text-slate-300 tracking-tighter uppercase mb-1">Page 1 of 1</div>
                        <div className="text-[10px] font-mono font-bold text-slate-300 tracking-tighter">ID: {contract.id.toUpperCase()}</div>
                    </div>
                </div>
            </div>

            <p className="mt-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest print:hidden">
                Gunakan Ctrl+P atau tombol di atas untuk mencetak dokumen ini.
            </p>

            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    body {
                        background: white !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    .min-h-screen {
                        background: white !important;
                        padding: 0 !important;
                        min-height: auto !important;
                    }
                    .shadow-2xl, .ring-1 {
                        box-shadow: none !important;
                        ring: none !important;
                        border: none !important;
                    }
                    div[class*="max-w-[210mm]"] {
                        width: 100% !important;
                        max-width: none !important;
                        margin: 0 !important;
                        padding: 20mm !important;
                        min-height: auto !important;
                        box-shadow: none !important;
                    }
                }
            ` }} />
        </div>
    );
}

AuditTrailDocument.layout = (page: React.ReactNode) => <>{page}</>;
