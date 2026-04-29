import { useToast } from '@/components/contracts/Toast';
import { contractApi } from '@/lib/contract-api';
import { cn } from '@/lib/utils';
import { Contract } from '@/types/contracts';
import { Check, Clock, ExternalLink, FileText, Loader2, Search, X, FileSpreadsheet, ListFilter } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { FilterSheet, FilterCategory } from '../ui/FilterSheet';
import LoadingLottie from '../ui/LoadingLottie';

interface Props {
    contract: Contract;
}

export default function ContractAuditTrail({ contract }: Props) {
    const { showToast } = useToast();
    const [histories, setHistories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filters, setFilters] = useState({
        action: '',
        actor_id: '',
        date_from: '',
        date_to: '',
        search: '',
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

    const getActionIcon = (action: string) => {
        const a = action.toLowerCase();
        if (a.includes('approve'))
            return (
                <div className="rounded-full bg-emerald-600 p-1 text-white">
                    <Check size={10} strokeWidth={4} />
                </div>
            );
        if (a.includes('reject'))
            return (
                <div className="rounded-full bg-rose-600 p-1 text-white">
                    <X size={10} strokeWidth={4} />
                </div>
            );
        if (a.includes('submitted'))
            return (
                <div className="rounded-full bg-sky-600 p-1 text-white">
                    <Clock size={10} strokeWidth={4} />
                </div>
            );
        if (a.includes('created'))
            return (
                <div className="rounded-full bg-slate-900 p-1 text-white">
                    <ExternalLink size={10} strokeWidth={4} />
                </div>
            );
        return (
            <div className="rounded-full bg-amber-600 p-1 text-white">
                <FileText size={10} strokeWidth={4} />
            </div>
        );
    };

    const handleExportExcel = () => {
        const params = new URLSearchParams(filters as any).toString();
        window.open(`/api/contracts/${contract.id}/audit-trail/excel?${params}`, '_blank');
    };

    const filterCategories: FilterCategory[] = [
        {
            label: 'Aktor (User)',
            key: 'actor_id',
            type: 'searchable',
            options: users.map(u => ({ label: u.name, value: u.id }))
        },
        {
            label: 'Rentang Tanggal',
            key: 'date',
            type: 'date-range'
        }
    ];

    const activeCount = (filters.actor_id ? 1 : 0) + (filters.date_from || filters.date_to ? 1 : 0);

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-300 relative bg-white dark:bg-sidebar rounded-xl border border-black/10 dark:border-white/10 overflow-hidden">
            <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 bg-[#0f172a] dark:bg-white p-4">
                <div className="flex items-center gap-2">
                    <Clock size={14} className="text-white dark:text-[#0f172a]" />
                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-white dark:text-[#0f172a]">
                        Audit Trail Aktivitas
                    </h3>
                </div>

                <div className="flex items-center gap-3">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setIsFilterOpen(true)}
                        className={cn(
                            "h-8 px-3 gap-2 border-white/20 dark:border-black/20 text-white dark:text-[#0f172a] font-bold rounded-lg hover:bg-white hover:text-[#0f172a] dark:hover:bg-[#0f172a] dark:hover:text-white transition-all shadow-sm",
                            activeCount > 0 && "border-white bg-white text-[#0f172a] dark:bg-[#0f172a] dark:text-white"
                        )}
                    >
                        <ListFilter size={12} strokeWidth={3} />
                        <span className="text-[9px] uppercase tracking-widest">Filter</span>
                        {activeCount > 0 && (
                            <span className="bg-[#0f172a] text-white dark:bg-white dark:text-[#0f172a] w-4 h-4 flex items-center justify-center rounded-md text-[8px] font-bold">
                                {activeCount}
                            </span>
                        )}
                    </Button>

                    <button 
                        onClick={handleExportExcel}
                        className="h-8 w-8 flex items-center justify-center text-white/40 dark:text-[#0f172a]/40 hover:text-white dark:hover:text-[#0f172a] transition-colors"
                        title="Ekspor Excel"
                    >
                        <FileSpreadsheet size={16} strokeWidth={2.5} />
                    </button>
                </div>
            </div>

            <div className="px-6 pb-6">
                <div className="mb-6 flex items-center gap-4">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-black/40 dark:text-white/40 transition-colors" />
                        <input 
                            type="text"
                            placeholder="CARI AKTIVITAS..."
                            value={filters.search}
                            onChange={(e) => {
                                const newFilters = { ...filters, search: e.target.value };
                                setFilters(newFilters);
                                fetchHistories(newFilters);
                            }}
                            className="w-full bg-black/[0.02] dark:bg-white/[0.02] border border-black/10 dark:border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-[10px] font-bold uppercase tracking-widest outline-none transition-all placeholder:text-black/20 dark:placeholder:text-white/20 focus:bg-white dark:focus:bg-sidebar focus:border-black dark:focus:border-white"
                        />
                    </div>
                </div>

            <FilterSheet 
                isOpen={isFilterOpen}
                onOpenChange={setIsFilterOpen}
                title="FILTER AKTIVITAS"
                description="Saring riwayat aktivitas berdasarkan kriteria"
                categories={filterCategories}
                activeFilters={{
                    actor_id: filters.actor_id ? [filters.actor_id] : [],
                    date_from: filters.date_from,
                    date_to: filters.date_to
                }}
                onFilterChange={(key, val) => {
                    let newFilters = { ...filters };
                    if (key === 'actor_id') {
                        newFilters.actor_id = filters.actor_id === val ? '' : val;
                    } else if (key === 'date_from' || key === 'date_to') {
                        newFilters[key] = val;
                    }
                    setFilters(newFilters);
                    fetchHistories(newFilters);
                }}
                onReset={() => {
                    const r = { ...filters, actor_id: '', date_from: '', date_to: '' };
                    setFilters(r);
                    fetchHistories(r);
                }}
            />

            {/* Timeline View */}
            {loading ? (
                <div className="flex flex-col items-center justify-center gap-4 py-16">
                    <LoadingLottie width={100} height={100} />
                    <span className="text-black/40 dark:text-white/40 text-[9px] font-bold tracking-widest uppercase">Memuat Riwayat...</span>
                </div>
            ) : (
                <div className="relative">
                    <div className="absolute top-3 bottom-3 left-[9px] w-px bg-black/5 dark:bg-white/5" />
                    <div className="flex flex-col gap-6">
                        {histories.map((h, i) => (
                            <div key={h.id} className="relative flex gap-4">
                                <div className="relative z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white dark:bg-sidebar ring-1 ring-black/10 dark:ring-white/10">
                                    <div className="scale-75">{getActionIcon(h.action)}</div>
                                </div>
                                <div className="flex min-w-0 flex-1 flex-col">
                                    <div className="flex items-baseline justify-between gap-4">
                                        <div className="flex flex-wrap items-center gap-2 overflow-hidden">
                                            <span className="text-black dark:text-white shrink-0 truncate text-[11px] font-bold uppercase tracking-tight">
                                                {h.actor?.name || 'System'}
                                            </span>
                                            <span
                                                className={cn(
                                                    'rounded px-2 py-0.5 text-[8px] font-bold tracking-widest uppercase border shadow-sm',
                                                    h.action.includes('APPROVE')
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                        : h.action.includes('REJECT')
                                                          ? 'bg-rose-50 text-rose-700 border-rose-100'
                                                          : 'bg-black/5 text-black/60 border-black/10 dark:bg-white/5 dark:text-white/60 dark:border-white/10',
                                                )}
                                            >
                                                {h.action.replace(/_/g, ' ')}
                                            </span>
                                            <span className="text-[12px] leading-relaxed font-bold text-black/40 dark:text-white/40 italic truncate max-w-md">"{h.description}"</span>
                                        </div>
                                        <div className="font-mono text-[9px] font-bold text-black/20 dark:text-white/20 whitespace-nowrap tabular-nums uppercase">
                                            {h.created_at}
                                        </div>
                                    </div>
                                    <div className="mt-3 w-full border-b border-black/5 dark:border-white/5" />
                                </div>
                            </div>
                        ))}
                        {histories.length === 0 && (
                            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] py-20">
                                <Search className="mb-4 h-8 w-8 text-black/10 dark:text-white/10" />
                                <h4 className="text-[11px] font-bold tracking-[0.3em] text-black/20 dark:text-white/20 uppercase">Tidak ada riwayat aktivitas</h4>
                            </div>
                        )}
                    </div>
                </div>
            )}
            </div>
        </div>
    );
}
