import { contractApi } from '@/lib/contract-api';
import { Contract } from '@/types/contracts';
import { cn } from '@/lib/utils';
import { Download, Filter, Loader2, Search, User } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface Props {
    contract: Contract;
}

export default function ContractAuditTrail({ contract }: Props) {
    const [histories, setHistories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        action: '',
        actor_id: '',
        date_from: '',
        date_to: '',
        search: ''
    });

    const [users, setUsers] = useState<any[]>([]);

    useEffect(() => {
        contractApi.getUsers().then(setUsers);
        fetchHistories();
    }, [contract.id]);

    const fetchHistories = async (currentFilters = filters) => {
        setLoading(true);
        try {
            const data = await contractApi.auditTrail.list(contract.id, currentFilters);
            setHistories(data);
        } catch (err) {
            console.error('Failed to fetch audit trail', err);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const newFilters = { ...filters, [name]: value };
        setFilters(newFilters);
        fetchHistories(newFilters);
    };

    const handleExport = () => {
        window.open(contractApi.auditTrail.exportPdfUrl(contract.id, filters), '_blank');
    };

    const getActionBadge = (action: string) => {
        const a = action.toLowerCase();
        if (a.includes('approve')) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        if (a.includes('reject')) return 'bg-rose-100 text-rose-700 border-rose-200';
        if (a.includes('submitted')) return 'bg-sky-100 text-sky-700 border-sky-200';
        if (a.includes('created')) return 'bg-slate-100 text-slate-700 border-slate-200';
        return 'bg-amber-100 text-amber-700 border-amber-200';
    };

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-500">
            {/* Filter HUD - Stays relative to viewport */}
            <div className="bg-slate-50/50 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border/60 p-4 backdrop-blur-sm">
                <div className="flex flex-1 items-center gap-3 min-w-[200px]">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <input
                            type="text"
                            name="search"
                            value={filters.search}
                            onChange={handleFilterChange}
                            placeholder="Cari deskripsi..."
                            className="w-full h-9 rounded-lg border border-slate-200 bg-white pl-9 pr-4 text-[11px] font-medium placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                        />
                    </div>
                    <select
                        name="actor_id"
                        value={filters.actor_id}
                        onChange={handleFilterChange}
                        className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-bold text-slate-600 outline-none transition-all hover:border-slate-300 focus:border-indigo-500"
                    >
                        <option value="">Semua Aktor</option>
                        {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                </div>

                <div className="flex items-center gap-3">
                    <input
                        type="date"
                        name="date_from"
                        value={filters.date_from}
                        onChange={handleFilterChange}
                        className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-bold text-slate-600 outline-none transition-all hover:border-slate-300"
                    />
                    <input
                        type="date"
                        name="date_to"
                        value={filters.date_to}
                        onChange={handleFilterChange}
                        className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-bold text-slate-600 outline-none transition-all hover:border-slate-300"
                    />
                    <button
                        onClick={handleExport}
                        className="flex h-9 items-center gap-2 rounded-lg bg-slate-900 px-4 text-[10px] font-black tracking-widest text-white uppercase shadow-sm transition-all hover:bg-slate-800 active:scale-95"
                    >
                        <Download className="h-3.5 w-3.5" /> EXPORT PDF
                    </button>
                </div>
            </div>

            {/* Document Style Viewport */}
            <div className="flex flex-1 justify-center bg-slate-100/30 p-8 min-h-[1000px]">
                <div className="mb-20 w-full max-w-[210mm] rounded-sm bg-white shadow-2xl ring-1 ring-slate-200 p-[20mm] flex flex-col h-fit">
                    {/* Document Header */}
                    <div className="border-b-2 border-slate-900 pb-8 mb-8 text-left">
                        <div className="flex items-center justify-between mb-6">
                            <h1 className="text-2xl font-black tracking-tighter text-slate-950 uppercase italic">Catatan Audit Kontrak</h1>
                            <div className="text-right">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Contract No.</div>
                                <div className="text-sm font-mono font-bold text-slate-900">{contract.contract_no}</div>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-8 pt-4">
                            <div>
                                <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5">Judul Kontrak</div>
                                <div className="text-[12px] font-bold text-slate-900">{contract.title}</div>
                            </div>
                            <div>
                                <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5">Masa Berlaku</div>
                                <div className="text-[12px] font-bold text-slate-900">{contract.contract_date || '-'} — {contract.end_date || '-'}</div>
                            </div>
                        </div>
                    </div>

                    {/* Document Body */}
                    {loading ? (
                        <div className="flex h-64 items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-600/30" />
                        </div>
                    ) : (
                        <div className="flex-1">
                            <table className="w-full text-left border-collapse border border-slate-200">
                                <thead>
                                    <tr className="bg-slate-50">
                                        <th className="border border-slate-200 px-4 py-3 text-[10px] font-black tracking-widest text-slate-600 uppercase w-[140px]">Waktu (WIB)</th>
                                        <th className="border border-slate-200 px-4 py-3 text-[10px] font-black tracking-widest text-slate-600 uppercase w-[160px]">Aktor</th>
                                        <th className="border border-slate-200 px-4 py-3 text-[10px] font-black tracking-widest text-slate-600 uppercase w-[120px]">Aksi</th>
                                        <th className="border border-slate-200 px-4 py-3 text-[10px] font-black tracking-widest text-slate-600 uppercase">Keterangan</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {histories.map((h) => (
                                        <tr key={h.id} className="text-black border-b border-slate-200 last:border-0 hover:bg-slate-50/50">
                                            <td className="border border-slate-200 px-4 py-3 text-[10px] font-mono font-bold text-slate-700">{h.created_at}</td>
                                            <td className="border border-slate-200 px-4 py-3 font-black text-[11px] text-black uppercase">{h.actor?.name || 'System'}</td>
                                            <td className="border border-slate-200 px-4 py-3 text-[9px] font-black tracking-tight uppercase text-slate-800">{h.action.replace(/_/g, ' ')}</td>
                                            <td className="border border-slate-200 px-4 py-3 text-[11px] font-semibold leading-relaxed text-black">{h.description}</td>
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
                    )}

                    {/* Document Footer */}
                    <div className="mt-12 pt-8 border-t border-slate-100 flex items-end justify-between">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Generated by System</span>
                            <span className="text-[10px] font-bold text-slate-900 italic">Dicetak secara digital melalui Contract Management System</span>
                        </div>
                        <div className="text-[10px] font-mono font-bold text-slate-300 tracking-tighter">ID: {contract.id.substring(0, 8).toUpperCase()}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
