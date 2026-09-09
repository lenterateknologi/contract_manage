import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/buttons/Button';
import { FilterCategory, FilterPopover } from '@/components/ui/selection/FilterPopover';
import LoadingLottie from '@/components/ui/feedback/LoadingLottie';
import { useToast } from '@/components/ui/feedback/Toast';
import { SearchInput } from '@/components/ui/inputs/SearchInput';
import { useDebounce } from '@/hooks/use-debounce';
import { contractApi } from '@/pages/contracts/utils';
import { cn, formatDateTime } from '@/lib/utils';
import { Contract } from '@/pages/contracts/types';
import { Badge } from '@/components/ui/feedback/Badge';
import { StatusBadge } from '@/components/ui/feedback/StatusBadge';
import {
    Check,
    Clock,
    ExternalLink,
    FileSpreadsheet,
    FileText,
    ListFilter,
    Search,
    ShieldCheck,
    X,
    GitBranch,
    UserCheck,
    Users,
    ArrowRight,
    Send,
    Layers,
    Workflow,
} from 'lucide-react';

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

    const getActionConfig = (action: string, description?: string) => {
        const a = (action || '').toUpperCase();
        const d = (description || '').toLowerCase();

        if (a === 'WORKFLOW_BRANCHED' || d.includes('pindah workflow') || d.includes('persetujuan tambahan')) {
            return {
                label: 'PINDAH WORKFLOW',
                badgeClass: 'border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400',
                iconBgClass: 'bg-sky-500 text-white',
                icon: <GitBranch size={10} strokeWidth={2.5} />,
            };
        }
        if (a === 'WORKFLOW_ADVANCED' || a === 'WORKFLOW_AUTO_ADVANCED' || a === 'STAGE_TRANSITION') {
            return {
                label: 'LANJUT TAHAP',
                badgeClass: 'border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400',
                iconBgClass: 'bg-blue-500 text-white',
                icon: <ArrowRight size={10} strokeWidth={2.5} />,
            };
        }
        if (a === 'WORKFLOW_ASSIGNED' || a.includes('ASSIGN')) {
            return {
                label: 'PENUGASAN PIC',
                badgeClass: 'border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400',
                iconBgClass: 'bg-purple-500 text-white',
                icon: <UserCheck size={10} strokeWidth={2.5} />,
            };
        }
        if (a.includes('ADHOC') || a.includes('PARTICIPANT')) {
            return {
                label: 'APPROVER TAMBAHAN',
                badgeClass: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
                iconBgClass: 'bg-amber-500 text-white',
                icon: <Users size={10} strokeWidth={2.5} />,
            };
        }
        if (a === 'APPROVAL_APPROVED' || a.includes('APPROVED')) {
            return {
                label: 'DISETUJUI',
                badgeClass: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
                iconBgClass: 'bg-emerald-500 text-white',
                icon: <Check size={10} strokeWidth={3} />,
            };
        }
        if (a === 'APPROVAL_REJECTED' || a.includes('REJECT')) {
            return {
                label: 'DITOLAK',
                badgeClass: 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400',
                iconBgClass: 'bg-rose-500 text-white',
                icon: <X size={10} strokeWidth={3} />,
            };
        }
        if (a.includes('SIGN')) {
            return {
                label: 'PENANDATANGANAN',
                badgeClass: 'border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400',
                iconBgClass: 'bg-violet-500 text-white',
                icon: <FileText size={10} strokeWidth={2.5} />,
            };
        }
        if (a.includes('FORM') || a.includes('SUBMITTED')) {
            return {
                label: 'SUBMIT FORM',
                badgeClass: 'border-teal-500/30 bg-teal-500/10 text-teal-600 dark:text-teal-400',
                iconBgClass: 'bg-teal-500 text-white',
                icon: <FileSpreadsheet size={10} strokeWidth={2.5} />,
            };
        }
        if (a === 'CONTRACT_SENT') {
            return {
                label: 'KONTRAK DIKIRIM',
                badgeClass: 'border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400',
                iconBgClass: 'bg-sky-500 text-white',
                icon: <Send size={10} strokeWidth={2.5} />,
            };
        }
        if (a === 'CONTRACT_CREATED') {
            return {
                label: 'KONTRAK DIBUAT',
                badgeClass: 'border-primary/30 bg-primary/10 text-primary',
                iconBgClass: 'bg-primary text-white',
                icon: <ExternalLink size={10} strokeWidth={2.5} />,
            };
        }
        return {
            label: a.replace(/_/g, ' '),
            badgeClass: 'border-border bg-muted/60 text-muted-foreground',
            iconBgClass: 'bg-black text-white dark:bg-white dark:text-black',
            icon: <FileText size={10} strokeWidth={2.5} />,
        };
    };

    const handleExportExcel = () => {
        const params = new URLSearchParams(filters as any).toString();
        window.open(`/api/contracts/${contract.id}/audit-trail/excel?${params}`, '_blank');
    };

    const currentStep = contract.workflow_step || contract.current_step || contract.workflow?.steps?.find((s: any) => s.id === contract.workflow_step_id);
    const currentStepNumber = currentStep?.step || null;
    const isBranchedWorkflow = Boolean(contract.origin_workflow_id && contract.workflow_id !== contract.origin_workflow_id);

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
        <div className="animate-in fade-in flex flex-col flex-1 min-h-0 h-full overflow-hidden duration-300 p-3 lg:p-4 gap-2.5">
            {/* Compact Primary Header */}
            <div className="bg-primary text-primary-foreground shrink-0 flex h-9.5 min-h-[38px] max-h-[38px] items-center justify-between px-4 rounded-xl shadow-xs">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <ShieldCheck size={15} className="text-primary-foreground/90" />
                        <h4 className="text-xs font-semibold tracking-tight text-primary-foreground uppercase">
                            Audit Trail & Riwayat Aktivitas
                        </h4>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {contract.workflow?.name && (
                        <span className="hidden sm:inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-xs">
                            <Workflow size={10} className="shrink-0" />
                            <span>{contract.workflow.name}</span>
                        </span>
                    )}
                    {currentStepNumber && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-xs">
                            <Layers size={10} className="shrink-0" />
                            <span>Tahap {currentStepNumber}</span>
                        </span>
                    )}
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
                {/* Flat Chronological Timeline List */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-12">
                        <LoadingLottie width={80} height={80} />
                        <span className="text-[9px] font-bold text-black/40 uppercase dark:text-white/40">Memuat Riwayat...</span>
                    </div>
                ) : (
                    <div className="relative pl-2.5">
                        {histories.length > 1 && (
                            <div className="absolute top-2 bottom-2 left-[21px] w-px bg-border/60" />
                        )}
                        <div className="flex flex-col gap-2.5">
                            {histories.map((h) => {
                                const config = getActionConfig(h.action, h.description);

                                return (
                                    <div key={h.id} className="relative flex gap-3 group items-start">
                                        <div className={cn(
                                            'relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full shadow-xs ring-1 ring-black/10 dark:ring-white/10 mt-0.5',
                                            config.iconBgClass
                                        )}>
                                            <div className="scale-90">{config.icon}</div>
                                        </div>
                                        <div className="flex min-w-0 flex-1 flex-col pb-2 border-b border-border/30 last:border-b-0 last:pb-0">
                                            <div className="flex items-baseline justify-between gap-3 flex-wrap">
                                                <div className="flex flex-wrap items-center gap-1.5 overflow-hidden">
                                                    <span className="shrink-0 truncate text-[11px] font-semibold tracking-tight text-text-main">
                                                        {h.actor?.name || 'System'}
                                                    </span>
                                                    <Badge
                                                        variant="outline"
                                                        className={cn(
                                                            'px-1.5 py-0 text-[8px] font-bold uppercase tracking-wider rounded-sm shrink-0',
                                                            config.badgeClass,
                                                        )}
                                                    >
                                                        {config.label}
                                                    </Badge>
                                                    {/* Activity description */}
                                                    <span className="text-[11px] leading-relaxed text-text-main font-medium">
                                                        "{h.description}"
                                                    </span>
                                                </div>
                                                <div className="font-mono text-[9px] whitespace-nowrap text-muted-foreground uppercase tabular-nums shrink-0">
                                                    {formatDateTime(h.created_at)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

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
