import { Button } from '@/components/ui/buttons/Button';
import { FilterCategory, FilterPopover } from '@/components/ui/selection/FilterPopover';
import LoadingLottie from '@/components/ui/feedback/LoadingLottie';
import { useToast } from '@/components/ui/feedback/Toast';
import { SearchInput } from '@/components/ui/inputs/SearchInput';
import { useDebounce } from '@/hooks/use-debounce';
import { contractApi } from '@/pages/contracts/utils';
import { cn } from '@/lib/utils';
import { Contract } from '@/pages/contracts/types';
import { Check, Clock, ExternalLink, FileSpreadsheet, FileText, ListFilter, Search, ShieldCheck, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Props {
    contract: Contract;
}

export default function ContractAuditTrail({ contract }: Props) {
    const { showToast } = useToast();
    const [histories, setHistories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    // Filter open state is handled internally by FilterPopover
    const [filters, setFilters] = useState({
        action: '',
        actor_id: '',
        date_from: '',
        date_to: '',
        search: '',
    });
    const debouncedSearch = useDebounce(filters.search, 500);

    const [users, setUsers] = useState<any[]>([]);

    useEffect(() => {
        contractApi.getUsers().then(setUsers);
    }, [contract.id]);

    useEffect(() => {
        fetchHistories();
    }, [debouncedSearch, filters.action, filters.actor_id, filters.date_from, filters.date_to]);

    const fetchHistories = async (currentFilters = { ...filters, search: debouncedSearch }) => {
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
        <div className="animate-in fade-in flex flex-col flex-1 min-h-0 h-full overflow-hidden duration-300 p-3 lg:p-4 gap-3">
            {/* Compact Primary Header */}
            <div className="bg-primary text-primary-foreground shrink-0 flex h-9.5 min-h-[38px] max-h-[38px] items-center justify-between px-4 rounded-xl shadow-xs">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <ShieldCheck size={15} className="text-primary-foreground/90" />
                        <h4 className="text-xs font-semibold tracking-tight text-primary-foreground uppercase">
                            Audit Trail
                        </h4>
                    </div>
                </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto space-y-3 custom-scrollbar">
                {/* Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-2 w-full">
                    <div className="flex items-center gap-2">
                        <FilterPopover
                            categories={filterCategories}
                            activeFilters={{
                                actor_id: filters.actor_id ? [filters.actor_id] : [],
                                date_from: filters.date_from,
                                date_to: filters.date_to,
                            }}
                            onFilterChange={(key, val) => {
                                const newFilters = { ...filters };
                                if (key === 'actor_id') {
                                    newFilters.actor_id = Array.isArray(val) ? val[0] || '' : val;
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
                        >
                            <Button
                                variant="outline"
                                size="sm"
                                className={cn(
                                    'border-surface-border bg-surface-base text-text-main hover:bg-surface-muted h-8 gap-1.5 px-2.5 rounded-lg transition-all text-[10px] font-semibold uppercase',
                                    activeCount > 0 && 'bg-primary text-white border-primary',
                                )}
                            >
                                <ListFilter size={12} strokeWidth={2.5} />
                                <span>Filter</span>
                                {activeCount > 0 && (
                                    <span className="ml-1 flex h-3.5 w-3.5 items-center justify-center rounded-md bg-white text-[8px] font-bold text-primary">
                                        {activeCount}
                                    </span>
                                )}
                            </Button>
                        </FilterPopover>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                        <div className="w-44 sm:w-56">
                            <SearchInput
                                placeholder="CARI AKTIVITAS..."
                                value={filters.search}
                                onChange={(e) => {
                                    setFilters({ ...filters, search: e.target.value });
                                }}
                                className="h-8 text-[10px] uppercase"
                            />
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExportExcel}
                            className="border-surface-border bg-surface-base text-text-main hover:bg-surface-muted h-8 gap-1.5 px-2.5 rounded-lg transition-all text-[10px] font-semibold uppercase"
                            title="Ekspor Excel Riwayat Aktivitas"
                        >
                            <FileSpreadsheet size={13} strokeWidth={2.5} />
                            <span>Export</span>
                        </Button>
                    </div>
                </div>

            <div className="pb-4">
                {/* Timeline View */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-12">
                        <LoadingLottie width={80} height={80} />
                        <span className="text-[9px] font-bold text-black/40 uppercase dark:text-white/40">Memuat Riwayat...</span>
                    </div>
                ) : (
                    <div className="relative">
                        <div className="absolute top-2.5 bottom-2.5 left-[9px] w-px bg-black/5 dark:bg-white/5" />
                        <div className="flex flex-col gap-3">
                            {histories.map((h) => (
                                <div key={h.id} className="relative flex gap-3">
                                    <div className="dark:bg-sidebar relative z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white ring-1 ring-black/10 dark:ring-white/10">
                                        <div className="scale-75">{getActionIcon(h.action)}</div>
                                    </div>
                                    <div className="flex min-w-0 flex-1 flex-col">
                                        <div className="flex items-baseline justify-between gap-3">
                                            <div className="flex flex-wrap items-center gap-1.5 overflow-hidden">
                                                <span className="shrink-0 truncate text-[11px] tracking-tight text-text-main uppercase">
                                                    {h.actor?.name || 'System'}
                                                </span>
                                                <span
                                                    className={cn(
                                                        'rounded border px-1.5 py-0.5 text-[8px] uppercase shadow-sm font-medium',
                                                        h.action.includes('APPROVE')
                                                            ? 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black'
                                                            : h.action.includes('REJECT')
                                                              ? 'border-black/20 bg-white text-black dark:border-white/20 dark:bg-black dark:text-white'
                                                              : 'border-surface-border bg-surface-muted text-text-main',
                                                    )}
                                                >
                                                    {h.action.replace(/_/g, ' ')}
                                                </span>
                                                {/* ponytail: uniform text, no bold or gray */}
                                                <span className="max-w-md truncate text-[11px] leading-relaxed text-text-main">
                                                    "{h.description}"
                                                </span>
                                            </div>
                                            <div className="font-mono text-[9px] whitespace-nowrap text-text-main uppercase tabular-nums">
                                                {h.created_at}
                                            </div>
                                        </div>
                                        <div className="mt-2.5 w-full border-b border-black/5 dark:border-white/5" />
                                    </div>
                                </div>
                            ))}
                            {histories.length === 0 && (
                                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-black/10 bg-black/[0.02] py-16 dark:border-white/10 dark:bg-white/[0.02]">
                                    <Search className="mb-3 h-6 w-6 text-black/10 dark:text-white/10" />
                                    <h4 className="text-[10px] font-bold tracking-[0.3em] text-black/20 uppercase dark:text-white/20">
                                        Tidak ada riwayat aktivitas
                                    </h4>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
            </div>
        </div>
    );
}
