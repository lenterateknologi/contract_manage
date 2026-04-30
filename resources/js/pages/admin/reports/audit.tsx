import { Head } from '@inertiajs/react';
import { BreadcrumbItem } from '@/types';
import { 
    History, 
    Search, 
    Download, 
    Filter,
    Terminal,
    User,
    FileText,
    AlertCircle,
    CheckCircle,
    Clock,
    ArrowRight,
    ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/base/Button';
import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { cn } from '@/lib/utils';
import { FilterSheet, FilterCategory } from '@/components/ui/data/FilterSheet';

interface AuditLog {
    id: string;
    contract_no: string;
    action: string;
    description: string;
    actor: string;
    created_at: string;
}

interface AuditData {
    histories: AuditLog[];
    users: { id: string; name: string }[];
}

export default function AuditPage({ breadcrumbs }: { breadcrumbs: BreadcrumbItem[] }) {
    const [data, setData] = useState<AuditData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filters, setFilters] = useState({
        date_from: '',
        date_to: '',
        creator_ids: []
    });

    const fetchData = (currentFilters = filters) => {
        setLoading(true);
        axios.post('/admin/api/reports/data', currentFilters).then(res => {
            setData({
                histories: res.data.histories,
                users: res.data.users
            });
            setLoading(false);
        }).catch(() => setLoading(false));
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleExport = () => {
        window.location.href = '/admin/api/reports/audit/export';
    };

    const filterCategories: FilterCategory[] = useMemo(() => [
        { label: 'Rentang Waktu', key: 'date', type: 'date-range' },
        { 
            label: 'Aktor (User)', 
            key: 'creator_ids', 
            type: 'searchable', 
            options: data?.users.map(u => ({ label: u.name, value: u.id })) || [] 
        }
    ], [data]);

    return (
        <>
            <Head title="Jejak Audit Sistem" />
            
            <div className="flex flex-col flex-1 p-6 space-y-6 bg-[#f8fafc]">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-extrabold tracking-tight text-[#172554] font-montserrat flex items-center gap-3">
                            <ShieldCheck className="w-7 h-7 text-emerald-600" />
                            Jejak Audit Sistem
                        </h1>
                        <p className="text-sm text-slate-500 font-medium">
                            Rekam jejak seluruh aktivitas dan perubahan data dalam sistem kontrak.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button 
                            variant="outline" 
                            onClick={() => setIsFilterOpen(true)}
                            className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-bold shadow-sm"
                        >
                            <Filter className="w-4 h-4 mr-2" />
                            Filter Log
                        </Button>
                        <Button 
                            onClick={handleExport}
                            className="bg-[#172554] hover:bg-[#1e1b4b] text-white font-bold shadow-md"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Ekspor Audit Trail
                        </Button>
                    </div>
                </div>

                {/* Audit Console */}
                <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Terminal className="w-4 h-4 text-slate-400" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Activity_Logs_Terminal</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Live Monitor Active</span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto p-0">
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 bg-white border-b border-slate-100 z-10">
                                <tr>
                                    <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400 w-48">Waktu & Tanggal</th>
                                    <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400 w-32 text-center">Aksi</th>
                                    <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Detail Aktivitas</th>
                                    <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400 w-48 text-right">Pelaku</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} className="py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <i className="fa-solid fa-spinner fa-spin text-2xl text-indigo-600" />
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Memuat database log...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : data?.histories.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="py-20 text-center text-slate-400">
                                            Tidak ada data log yang ditemukan.
                                        </td>
                                    </tr>
                                ) : (
                                    data?.histories.map((log) => (
                                        <tr key={log.id} className="group hover:bg-slate-50/50 transition-all">
                                            <td className="py-4 px-6">
                                                <div className="flex flex-col">
                                                    <span className="text-[12px] font-mono font-bold text-slate-700">
                                                        {new Date(log.created_at).toLocaleTimeString('id-ID', { hour12: false })}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                                        {new Date(log.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex justify-center">
                                                    <ActionBadge action={log.action} />
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2">
                                                        <FileText className="w-3.5 h-3.5 text-indigo-400" />
                                                        <span className="text-[11px] font-black text-indigo-600 tracking-tight uppercase">
                                                            {log.contract_no}
                                                        </span>
                                                    </div>
                                                    <p className="text-[12px] text-slate-600 font-medium leading-relaxed">
                                                        {log.description}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex items-center justify-end gap-3 group-hover:translate-x-[-4px] transition-transform">
                                                    <div className="flex flex-col">
                                                        <span className="text-[11px] font-black text-[#172554] uppercase tracking-tighter italic">
                                                            @{log.actor.split(' ')[0]}
                                                        </span>
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase">
                                                            {log.actor}
                                                        </span>
                                                    </div>
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                                                        <User className="w-4 h-4 text-slate-500" />
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    
                    <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                            Showing {data?.histories.length || 0} transaction records
                        </p>
                        <div className="flex items-center gap-4">
                             <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em]">SYSTEM_V2.0_AUDIT_LOG_END</span>
                        </div>
                    </div>
                </div>
            </div>

            <FilterSheet 
                isOpen={isFilterOpen}
                onOpenChange={setIsFilterOpen}
                title="Filter Jejak Audit"
                description="Tentukan kriteria log yang ingin Anda tampilkan."
                categories={filterCategories}
                activeFilters={filters}
                onFilterChange={(key, val) => setFilters(p => ({ ...p, [key]: val }))}
                onReset={() => setFilters({ date_from: '', date_to: '', creator_ids: [] })}
                applyText="Tampilkan Log"
            />
        </>
    );
}

function ActionBadge({ action }: { action: string }) {
    const act = action.toLowerCase();
    
    if (act.includes('approve') || act.includes('success')) {
        return (
            <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1.5 w-fit">
                <CheckCircle className="w-3 h-3" />
                {action}
            </span>
        );
    }
    
    if (act.includes('reject') || act.includes('delete') || act.includes('cancel')) {
        return (
            <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-rose-50 text-rose-700 border border-rose-100 flex items-center gap-1.5 w-fit">
                <AlertCircle className="w-3 h-3" />
                {action}
            </span>
        );
    }

    if (act.includes('create') || act.includes('submit')) {
        return (
            <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-blue-50 text-blue-700 border border-blue-100 flex items-center gap-1.5 w-fit">
                <ArrowRight className="w-3 h-3" />
                {action}
            </span>
        );
    }

    return (
        <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1.5 w-fit">
            <Clock className="w-3 h-3" />
            {action}
        </span>
    );
}
