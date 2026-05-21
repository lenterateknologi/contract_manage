import { useToast } from '@/components/contracts/Toast';
import { Button } from '@/components/ui/base/Button';
import { FilterCategory, FilterSheet } from '@/components/ui/data/FilterSheet';
import LoadingLottie from '@/components/ui/feedback/LoadingLottie';
import { SearchInput } from '@/components/ui/forms/SearchInput';
import { contractApi } from '@/lib/contract-api';
import { cn } from '@/lib/utils';
import { Contract } from '@/types/contracts';
import { Check, Clock, ExternalLink, FileSpreadsheet, FileText, ListFilter, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';

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
        const bgClass = 'bg-black text-white dark:bg-white dark:text-black';
        let icon = <FileText size={10} strokeWidth={4} />;

        if (a.includes('approve')) {
            icon = <Check size={10} strokeWidth={4} />;
        } else if (a.includes('reject')) {
            icon = <X size={10} strokeWidth={4} />;
        } else if (a.includes('submitted')) {
            icon = <Clock size={10} strokeWidth={4} />;
        } else if (a.includes('created')) {
            icon = <ExternalLink size={10} strokeWidth={4} />;
        }

        return <div className={cn('rounded-full p-1 shadow-sm ring-1 ring-black/5 dark:ring-white/5', bgClass)}>{icon}</div>;
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
            options: users.map((u) => ({ label: u.name, value: u.id })),
        },
        {
            label: 'Rentang Tanggal',
            key: 'date',
            type: 'date-range',
        },
    ];

    const activeCount = (filters.actor_id ? 1 : 0) + (filters.date_from || filters.date_to ? 1 : 0);

    return (
        <div className="animate-in fade-in relative flex flex-col gap-6 p-5 duration-300">
            <div className="mb-2 flex items-center gap-4">
                <div className="flex-1">
                    <SearchInput
                        placeholder="CARI AKTIVITAS..."
                        value={filters.search}
                        onChange={(e) => {
                            const newFilters = { ...filters, search: e.target.value };
                            setFilters(newFilters);
                            fetchHistories(newFilters);
                        }}
                        className="h-10 text-[10px] uppercase"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsFilterOpen(true)}
                        className={cn(
                            'h-10 gap-2 rounded-xl border-black/10 px-4 font-bold text-black shadow-sm transition-all hover:bg-black/5 dark:border-white/10 dark:text-white dark:hover:bg-white/5',
                            activeCount > 0 && 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black',
                        )}
                    >
                        <ListFilter size={14} strokeWidth={3} />
                        <span className="text-[10px] uppercase">Filter</span>
                        {activeCount > 0 && (
                            <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-md bg-white text-[8px] font-bold text-black dark:bg-black dark:text-white">
                                {activeCount}
                            </span>
                        )}
                    </Button>

                    <button
                        onClick={handleExportExcel}
                        className="dark:bg-sidebar flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 bg-white text-black/40 shadow-sm transition-all hover:text-black active:scale-95 dark:border-white/10 dark:text-white/40 dark:hover:text-white"
                        title="Ekspor Excel"
                    >
                        <FileSpreadsheet size={18} strokeWidth={2.5} />
                    </button>
                </div>
            </div>

            <div className="pb-6">
                <FilterSheet
                    isOpen={isFilterOpen}
                    onOpenChange={setIsFilterOpen}
                    title="FILTER AKTIVITAS"
                    description="Saring riwayat aktivitas berdasarkan kriteria"
                    categories={filterCategories}
                    activeFilters={{
                        actor_id: filters.actor_id ? [filters.actor_id] : [],
                        date_from: filters.date_from,
                        date_to: filters.date_to,
                    }}
                    onFilterChange={(key, val) => {
                        const newFilters = { ...filters };
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
                        <span className="text-[9px] font-bold text-black/40 uppercase dark:text-white/40">Memuat Riwayat...</span>
                    </div>
                ) : (
                    <div className="relative">
                        <div className="absolute top-3 bottom-3 left-[9px] w-px bg-black/5 dark:bg-white/5" />
                        <div className="flex flex-col gap-6">
                            {histories.map((h, i) => (
                                <div key={h.id} className="relative flex gap-4">
                                    <div className="dark:bg-sidebar relative z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white ring-1 ring-black/10 dark:ring-white/10">
                                        <div className="scale-75">{getActionIcon(h.action)}</div>
                                    </div>
                                    <div className="flex min-w-0 flex-1 flex-col">
                                        <div className="flex items-baseline justify-between gap-4">
                                            <div className="flex flex-wrap items-center gap-2 overflow-hidden">
                                                <span className="shrink-0 truncate text-[11px] font-bold tracking-tight text-black uppercase dark:text-white">
                                                    {h.actor?.name || 'System'}
                                                </span>
                                                <span
                                                    className={cn(
                                                        'rounded border px-2 py-0.5 text-[8px] font-bold uppercase shadow-sm',
                                                        h.action.includes('APPROVE')
                                                            ? 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black'
                                                            : h.action.includes('REJECT')
                                                              ? 'border-black/20 bg-white text-black dark:border-white/20 dark:bg-black dark:text-white'
                                                              : 'border-black/10 bg-black/5 text-black/60 dark:border-white/10 dark:bg-white/5 dark:text-white/60',
                                                    )}
                                                >
                                                    {h.action.replace(/_/g, ' ')}
                                                </span>
                                                <span className="max-w-md truncate text-[12px] leading-relaxed font-bold text-black/40 italic dark:text-white/40">
                                                    "{h.description}"
                                                </span>
                                            </div>
                                            <div className="font-mono text-[9px] font-bold whitespace-nowrap text-black/20 uppercase tabular-nums dark:text-white/20">
                                                {h.created_at}
                                            </div>
                                        </div>
                                        <div className="mt-3 w-full border-b border-black/5 dark:border-white/5" />
                                    </div>
                                </div>
                            ))}
                            {histories.length === 0 && (
                                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-black/10 bg-black/[0.02] py-20 dark:border-white/10 dark:bg-white/[0.02]">
                                    <Search className="mb-4 h-8 w-8 text-black/10 dark:text-white/10" />
                                    <h4 className="text-[11px] font-bold tracking-[0.3em] text-black/20 uppercase dark:text-white/20">
                                        Tidak ada riwayat aktivitas
                                    </h4>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
