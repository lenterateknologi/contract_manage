import { reportsApi } from '@/api';
import { Button } from '@/components/ui/buttons/Button';
import { StatusBadge } from '@/components/ui/feedback/StatusBadge';
import { FilterCategory, FilterPopover } from '@/components/ui/selection/FilterPopover';
import { cn, formatDate, formatDateTime, formatRelativeTime } from '@/lib/utils';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { BarChart3, FileSpreadsheet, FileText, History, ListFilter } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/users' },
    { title: 'Laporan & Audit', href: '#' },
];

interface ReportData {
    contracts: any[];
    histories: any[];
    users: { id: string; name: string }[];
    types: { id: string; name: string }[];
    metrics: {
        avgCycleTime: number;
        totalContracts: number;
        pendingApprovals: number;
        approvedThisMonth: number;
    };
    statusDistribution: { status: string; count: number }[];
}

export default function ReportsPage() {
    const [data, setData] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'contracts' | 'audit'>('contracts');

    // Filters state - using unified keys
    const [activeFilters, setActiveFilters] = useState<Record<string, any>>({
        date_from: '',
        date_to: '',
        contract_type_ids: [],
        creator_ids: [],
        involved_ids: [],
    });

    const fetchData = (currentFilters = activeFilters) => {
        setLoading(true);
        reportsApi
            .getData(currentFilters)
            .then((res: any) => {
                setData(res);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleFilterChange = (key: string, value: any) => {
        setActiveFilters((prev) => {
            const next = { ...prev };
            if (Array.isArray(prev[key])) {
                next[key] = prev[key].includes(String(value)) ? prev[key].filter((v: any) => v !== String(value)) : [...prev[key], String(value)];
            } else {
                next[key] = value;
            }
            return next;
        });
    };

    const resetFilters = () => {
        const clear = {
            date_from: '',
            date_to: '',
            contract_type_ids: [],
            creator_ids: [],
            involved_ids: [],
        };
        setActiveFilters(clear);
        fetchData(clear);
    };

    const exportCsv = () => {
        const url = activeTab === 'contracts' ? reportsApi.getExportAnalyticsUrl(activeFilters) : reportsApi.getExportAuditUrl(activeFilters);
        window.location.href = url;
    };

    const filterCategories: FilterCategory[] = useMemo(
        () => [
            {
                label: 'Rentang Waktu',
                key: 'date',
                type: 'date-range',
            },
            {
                label: 'Tipe Kontrak',
                key: 'contract_type_ids',
                type: 'searchable',
                options: data?.types.map((t) => ({ label: t.name, value: t.id })) || [],
            },
            {
                label: 'User Pembuat',
                key: 'creator_ids',
                type: 'searchable',
                options: data?.users.map((u) => ({ label: u.name, value: u.id })) || [],
            },
            {
                label: 'Pihak Terkait',
                key: 'involved_ids',
                type: 'searchable',
                options: data?.users.map((u) => ({ label: u.name, value: u.id })) || [],
            },
        ],
        [data],
    );

    const activeFilterCount = Object.values(activeFilters)
        .flat()
        .filter((v) => v !== '' && v !== null).length;

    if (loading && !data) {
        return (
            <div className="text-muted-foreground flex h-full items-center justify-center p-20">
                <div className="flex items-center gap-2">
                    <i className="fa-solid fa-spinner fa-spin text-primary" style={{ fontSize: 24 }} />
                    <span>Menyiapkan laporan & audit trail...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full flex-1 flex-col overflow-hidden bg-transparent">
            <Head title="Audit & Pelaporan" />
            {/* Unified Industrial Header */}
            <div className="border-surface-border mb-5 space-y-5 border-b px-5 pt-5 pb-5">
                <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-0.5">
                        <h1 className="text-text-main flex items-center gap-2 text-sm font-bold tracking-wider uppercase">
                            <BarChart3 size={16} />
                            Laporan & Statistik
                        </h1>
                        <p className="text-text-soft pl-6 text-[10px] font-bold tracking-wider uppercase">Data operasional dan jejak audit sistem</p>
                    </div>
                </div>

                <div className="border-surface-border flex items-center justify-between border-t pt-4">
                    <div className="flex items-center gap-4">
                        <FilterPopover
                            categories={filterCategories}
                            activeFilters={activeFilters}
                            onFilterChange={(key, val) => {
                                const nextFilters = { ...activeFilters, [key]: val };
                                setActiveFilters(nextFilters);
                                fetchData(nextFilters);
                            }}
                            onReset={() => {
                                const clear = {
                                    date_from: '',
                                    date_to: '',
                                    contract_type_ids: [],
                                    creator_ids: [],
                                    involved_ids: [],
                                };
                                setActiveFilters(clear);
                                fetchData(clear);
                            }}
                        >
                            <Button
                                className={cn(
                                    'h-9 rounded-xl border px-4 text-xs font-bold transition-all',
                                    activeFilterCount > 0
                                        ? 'border-primary bg-primary text-primary-foreground hover:bg-primary/95'
                                        : 'border-surface-border bg-card text-text-main hover:bg-surface-muted',
                                )}
                            >
                                <ListFilter size={14} className="mr-1.5" />
                                Filter {activeFilterCount > 0 && `(${activeFilterCount})`}
                            </Button>
                        </FilterPopover>

                        {activeFilterCount > 0 && (
                            <button
                                onClick={resetFilters}
                                className="text-text-soft flex items-center gap-1.5 text-xs font-bold transition-colors hover:text-rose-500"
                            >
                                <History size={12} />
                                Reset Filter
                            </button>
                        )}
                    </div>

                    <div className="flex h-8 items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={exportCsv}
                            className="h-8 cursor-pointer gap-1.5 rounded-[4px] border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-none transition-all hover:border-emerald-300 hover:bg-emerald-50/60 hover:text-emerald-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-emerald-800 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-400"
                            title="Export laporan ke format Excel"
                        >
                            <FileSpreadsheet size={13} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                            <span>Export Excel</span>
                        </Button>
                    </div>
                </div>

                {/* Tabs Switcher */}
                <div className="border-surface-border flex items-center gap-4 border-b pb-px">
                    <button
                        className={cn(
                            'relative -mb-[2px] border-b-2 px-4 pb-2.5 text-xs font-bold transition-all',
                            activeTab === 'contracts' ? 'border-primary text-primary' : 'text-text-soft hover:text-text-main border-transparent',
                        )}
                        onClick={() => setActiveTab('contracts')}
                    >
                        Database Kontrak
                    </button>
                    <button
                        className={cn(
                            'relative -mb-[2px] border-b-2 px-4 pb-2.5 text-xs font-bold transition-all',
                            activeTab === 'audit' ? 'border-primary text-primary' : 'text-text-soft hover:text-text-main border-transparent',
                        )}
                        onClick={() => setActiveTab('audit')}
                    >
                        Audit Trail History
                    </button>
                </div>
            </div>

            <div className="bg-background relative flex flex-1 flex-col overflow-auto">
                {loading && (
                    <div className="bg-background/50 absolute inset-0 z-20 flex items-center justify-center backdrop-blur-[1px]">
                        <i className="fa-solid fa-spinner fa-spin text-primary text-2xl" />
                    </div>
                )}

                {activeTab === 'contracts' ? (
                    <ContractRegistryTable contracts={data?.contracts || []} />
                ) : (
                    <AuditTrailTable histories={data?.histories || []} />
                )}
            </div>

            {/* FilterPopover is now used as a wrapper for the filter button above */}
        </div>
    );
}

// ─── Sub-Components ──────────────────────────────────────────────────

function ContractRegistryTable({ contracts }: { contracts: any[] }) {
    if (contracts.length === 0) return <EmptyState label="kontrak" />;
    return (
        <div className="border-surface-border bg-card mx-5 overflow-hidden rounded-2xl border">
            <div className="scrollbar-hide overflow-x-auto">
                <table className="bg-card w-full border-collapse text-left text-xs">
                    <thead>
                        <tr className="border-surface-border bg-surface-muted border-b select-none">
                            <th className="text-text-soft px-4 py-3 text-xs font-bold tracking-wider uppercase">Parameter</th>
                            <th className="text-text-soft px-4 py-3 text-xs font-bold tracking-wider uppercase">Judul Rekap</th>
                            <th className="text-text-soft px-4 py-3 text-xs font-bold tracking-wider uppercase">Tipe</th>
                            <th className="text-text-soft px-4 py-3 text-xs font-bold tracking-wider uppercase">Alur Kerja</th>
                            <th className="text-text-soft px-4 py-3 text-xs font-bold tracking-wider uppercase">Tahap Saat Ini</th>
                            <th className="text-text-soft px-4 py-3 text-xs font-bold tracking-wider uppercase">Pemilik</th>
                            <th className="text-text-soft px-4 py-3 text-xs font-bold tracking-wider uppercase">Registrasi</th>
                            <th className="text-text-soft px-4 py-3 text-center text-xs font-bold tracking-wider uppercase">Status</th>
                            <th className="text-text-soft px-4 py-3 text-right text-xs font-bold tracking-wider uppercase">Aging</th>
                        </tr>
                    </thead>
                    <tbody className="divide-surface-border divide-y">
                        {contracts.map((c) => (
                            <tr key={c.id} className="hover:bg-surface-muted/50 transition-colors">
                                <td className="text-text-soft px-4 py-3 font-mono font-semibold">{c.form_no || c.contract_no || '—'}</td>
                                <td className="text-text-main max-w-[200px] truncate px-4 py-3 font-bold uppercase">{c.title}</td>
                                <td className="text-text-soft px-4 py-3 font-bold uppercase">{c.type || 'N/A'}</td>
                                <td className="text-text-main px-4 py-3 font-normal">{c.current_workflow || '—'}</td>
                                <td className="text-text-main px-4 py-3 font-normal">
                                    <div className="flex items-center gap-1.5">
                                        {c.current_step_number && (
                                            <span className="bg-primary/10 text-primary inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold">
                                                {c.current_step_number}
                                            </span>
                                        )}
                                        <span className="max-w-[140px] truncate">{c.current_step || '—'}</span>
                                    </div>
                                </td>
                                <td className="text-text-soft px-4 py-3 font-semibold uppercase">{c.creator}</td>
                                <td className="text-text-soft px-4 py-3 font-semibold">{formatDate(c.created_at)}</td>
                                <td className="px-4 py-3 text-center">
                                    <StatusBadge status={c.status} />
                                </td>
                                <td className="text-text-soft px-4 py-3 text-right font-mono font-semibold">{formatRelativeTime(c.created_at)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function AuditTrailTable({ histories }: { histories: any[] }) {
    if (histories.length === 0) return <EmptyState label="riwayat audit" />;
    return (
        <div className="border-surface-border bg-card mx-5 overflow-hidden rounded-2xl border">
            <div className="scrollbar-hide overflow-x-auto">
                <table className="bg-card w-full border-collapse text-left text-xs">
                    <thead>
                        <tr className="border-surface-border bg-surface-muted border-b select-none">
                            <th className="text-text-soft px-4 py-3 text-xs font-bold tracking-wider uppercase">Timestamp</th>
                            <th className="text-text-soft px-4 py-3 text-xs font-bold tracking-wider uppercase">Ref ID</th>
                            <th className="text-text-soft px-4 py-3 text-xs font-bold tracking-wider uppercase">Action Event</th>
                            <th className="text-text-soft px-4 py-3 text-xs font-bold tracking-wider uppercase">Transaction Log Data</th>
                            <th className="text-text-soft px-4 py-3 text-xs font-bold tracking-wider uppercase">Author Entity</th>
                        </tr>
                    </thead>
                    <tbody className="divide-surface-border divide-y">
                        {histories.map((h) => {
                            const actionType = h.action.toLowerCase();
                            const isAlert = actionType.includes('reject') || actionType.includes('delete') || actionType.includes('cancel');
                            const isSuccess = actionType.includes('approve') || actionType.includes('create') || actionType.includes('submit');
                            const isSystem = actionType.includes('system') || actionType.includes('update');

                            return (
                                <tr key={h.id} className="hover:bg-surface-muted/50 transition-colors">
                                    <td className="text-text-desc px-4 py-3 text-sm whitespace-nowrap">{formatDateTime(h.created_at)}</td>
                                    <td className="text-text-main px-4 py-3 font-mono text-sm">
                                        #{(h.form_no || h.contract_no || '').split('/').pop()}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={cn(
                                                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium tracking-wide',
                                                isAlert
                                                    ? 'border border-rose-200 bg-rose-50 text-rose-700'
                                                    : isSuccess
                                                      ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                                                      : isSystem
                                                        ? 'border border-blue-200 bg-blue-50 text-blue-700'
                                                        : 'border border-slate-200 bg-slate-50 text-slate-700',
                                            )}
                                        >
                                            {h.action}
                                        </span>
                                    </td>
                                    <td className="text-text-main px-4 py-3 text-sm">{h.description}</td>
                                    <td className="text-text-desc px-4 py-3 text-sm">@{h.actor.split(' ')[0]}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function EmptyState({ label }: { label: string }) {
    return (
        <div className="text-muted-foreground/40 flex h-full flex-col items-center justify-center gap-4 py-20">
            <FileText className="h-12 w-12 opacity-20" />
            <span className="text-sm font-medium tracking-tight">Tidak ada {label} ditemukan dengan filter ini.</span>
        </div>
    );
}
