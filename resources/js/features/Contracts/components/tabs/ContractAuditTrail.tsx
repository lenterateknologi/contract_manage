import { Button } from '@/components/ui/buttons/Button';
import { Badge } from '@/components/ui/feedback/Badge';
import LoadingLottie from '@/components/ui/feedback/LoadingLottie';
import { SearchInput } from '@/components/ui/inputs/SearchInput';
import { FilterCategory, FilterPopover } from '@/components/ui/selection/FilterPopover';
import { useDebounce } from '@/hooks/use-debounce';
import { cn, formatDateTime } from '@/lib/utils';
import { Contract } from '@/features/Contracts/types';
import { contractApi } from '@/features/Contracts/utils';
import * as LucideIcons from 'lucide-react';
import { FileSpreadsheet, FileText, Layers, ListFilter, Search, ShieldCheck, Workflow } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Props {
    contract: Contract;
}

export function ContractAuditTrail({ contract }: Props) {
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
            const data: any = await contractApi.auditTrail.list(contract.id, currentFilters);
            const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : Array.isArray(data?.histories) ? data.histories : [];
            setHistories(list);
        } catch (err) {
            console.error('Failed to fetch audit trail', err);
            setHistories([]);
        } finally {
            setLoading(false);
        }
    };

    const getActionConfig = (h: any) => {
        const label = h.badge_label || (h.action || '').replace(/_/g, ' ').toUpperCase() || 'AKTIVITAS';
        const color = h.color || '#64748b';
        const iconName = h.icon;

        // Render dynamic lucide icon or fallback
        const IconComponent = iconName && (LucideIcons as any)[iconName] ? (LucideIcons as any)[iconName] : FileText;

        return {
            label,
            color,
            icon: <IconComponent size={10} strokeWidth={2.5} />,
        };
    };

    const handleExportExcel = () => {
        const params = new URLSearchParams(filters as any).toString();
        window.open(`/api/contracts/${contract.id}/audit-trail/excel?${params}`, '_blank');
    };

    const currentStep =
        contract.workflow_step || (contract as any).current_step || contract.workflow?.steps?.find((s: any) => s.id === contract.workflow_step_id);
    const currentStepNumber = currentStep?.step || null;

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
        <div className="animate-in fade-in flex h-full min-h-0 flex-1 flex-col gap-2.5 overflow-hidden p-3 duration-300 lg:p-4">
            {/* Compact Primary Header */}
            <div className="bg-primary text-primary-foreground flex h-9.5 max-h-[38px] min-h-[38px] shrink-0 items-center justify-between rounded-xl px-4 shadow-xs">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <ShieldCheck size={15} className="text-primary-foreground/90" />
                        <h4 className="text-primary-foreground text-xs font-semibold tracking-tight uppercase">Audit Trail & Riwayat Aktivitas</h4>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {contract.workflow?.name && (
                        <span className="hidden items-center gap-1 rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-xs sm:inline-flex">
                            <Workflow size={10} className="shrink-0" />
                            <span>{contract.workflow.name}</span>
                        </span>
                    )}
                    {currentStepNumber && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-white/20 px-2 py-0.5 text-[10px] font-bold tracking-wider text-white uppercase backdrop-blur-xs">
                            <Layers size={10} className="shrink-0" />
                            <span>Tahap {currentStepNumber}</span>
                        </span>
                    )}
                </div>
            </div>

            <div className="custom-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto">
                {/* Toolbar */}
                <div className="flex w-full flex-wrap items-center justify-between gap-2">
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
                                    'border-surface-border bg-surface-base text-text-main hover:bg-surface-muted h-8 gap-1.5 rounded-lg px-2.5 text-[10px] font-semibold uppercase transition-all',
                                    activeCount > 0 && 'bg-primary border-primary text-white',
                                )}
                            >
                                <ListFilter size={12} strokeWidth={2.5} />
                                <span>Filter</span>
                                {activeCount > 0 && (
                                    <span className="text-primary ml-1 flex h-3.5 w-3.5 items-center justify-center rounded-md bg-white text-[8px] font-bold">
                                        {activeCount}
                                    </span>
                                )}
                            </Button>
                        </FilterPopover>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
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
                            className="border-surface-border bg-surface-base text-text-main hover:bg-surface-muted h-8 gap-1.5 rounded-lg px-2.5 text-[10px] font-semibold uppercase transition-all"
                            title="Ekspor Excel Riwayat Aktivitas"
                        >
                            <FileSpreadsheet size={13} strokeWidth={2.5} />
                            <span>Export</span>
                        </Button>
                    </div>
                </div>

                <div className="pb-4">
                    {/* Flat Chronological Timeline List */}
                    {loading ? (
                        <div className="flex flex-col items-center justify-center gap-3 py-12">
                            <LoadingLottie width={80} height={80} />
                            <span className="text-[9px] font-bold text-black/40 uppercase dark:text-white/40">Memuat Riwayat...</span>
                        </div>
                    ) : (
                        (() => {
                            const safeHistories = Array.isArray(histories) ? histories : [];
                            return (
                                <div className="relative pl-2.5">
                                    {safeHistories.length > 1 && <div className="bg-border/60 absolute top-2 bottom-2 left-[21px] w-px" />}
                                    <div className="flex flex-col gap-2.5">
                                        {safeHistories.map((h) => {
                                            const config = getActionConfig(h);

                                            return (
                                                <div key={h.id} className="group relative flex items-start gap-3">
                                                    <div
                                                        className="relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white shadow-xs ring-1 ring-black/10 dark:ring-white/10"
                                                        style={{ backgroundColor: config.color }}
                                                    >
                                                        <div className="scale-90">{config.icon}</div>
                                                    </div>
                                                    <div className="border-border/30 flex min-w-0 flex-1 flex-col border-b pb-2 last:border-b-0 last:pb-0">
                                                        <div className="flex flex-wrap items-baseline justify-between gap-3">
                                                            <div className="flex flex-wrap items-center gap-1.5 overflow-hidden">
                                                                <span className="text-text-main shrink-0 truncate text-[11px] font-semibold tracking-tight">
                                                                    {h.actor?.name || 'System'}
                                                                </span>
                                                                <Badge
                                                                    variant="outline"
                                                                    className="shrink-0 rounded-sm border px-1.5 py-0 text-[8px] font-bold tracking-wider uppercase"
                                                                    style={{
                                                                        backgroundColor: `${config.color}15`,
                                                                        borderColor: `${config.color}40`,
                                                                        color: config.color,
                                                                    }}
                                                                >
                                                                    {config.label}
                                                                </Badge>
                                                                {/* Activity description */}
                                                                <span className="text-text-main text-[11px] leading-relaxed font-medium">
                                                                    "{h.description}"
                                                                </span>
                                                            </div>
                                                            <div className="text-muted-foreground shrink-0 font-mono text-[9px] whitespace-nowrap uppercase tabular-nums">
                                                                {formatDateTime(h.created_at)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {safeHistories.length === 0 && (
                                            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-black/10 bg-black/[0.02] py-16 dark:border-white/10 dark:bg-white/[0.02]">
                                                <Search className="mb-3 h-6 w-6 text-black/10 dark:text-white/10" />
                                                <h4 className="text-[10px] font-bold tracking-[0.3em] text-black/20 uppercase dark:text-white/20">
                                                    Tidak ada riwayat aktivitas
                                                </h4>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })()
                    )}
                </div>
            </div>
        </div>
    );
}

export default ContractAuditTrail;
