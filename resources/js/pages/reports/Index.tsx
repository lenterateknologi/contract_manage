import { Button } from '@/components/ui/buttons/Button';
import { FilterCategory, FilterPopover } from '@/components/ui/selection/FilterPopover';
import { cn } from '@/lib/utils';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import { BarChart3, Download, FileText, History, ListFilter } from 'lucide-react';
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
        axios
            .post('/admin/reports/api/data', currentFilters)
            .then((res) => {
                setData(res.data);
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
        const params = new URLSearchParams();
        if (activeFilters.date_from) params.append('date_from', activeFilters.date_from);
        if (activeFilters.date_to) params.append('date_to', activeFilters.date_to);
        activeFilters.contract_type_ids.forEach((id: string) => params.append('contract_type_ids[]', id));
        activeFilters.creator_ids.forEach((id: string) => params.append('creator_ids[]', id));
        activeFilters.involved_ids.forEach((id: string) => params.append('involved_ids[]', id));

        const endpoint = activeTab === 'contracts' ? '/admin/reports/api/export' : '/admin/reports/api/audit/export';
        window.location.href = `${endpoint}?${params.toString()}`;
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
            <div className="space-y-5 border-b border-surface-border pb-5 mb-5 px-5 pt-5">
                <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-0.5">
                        <h1 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-text-main">
                            <BarChart3 size={16} />
                            Laporan & Statistik
                        </h1>
                        <p className="pl-6 text-[10px] font-bold text-text-soft uppercase tracking-wider">Data operasional dan jejak audit sistem</p>
                    </div>
                </div>

                <div className="flex items-center justify-between border-t border-surface-border pt-4">
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
                                    'h-9 rounded-xl border px-4 text-xs font-bold transition-all shadow-xs',
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
                                className="flex items-center gap-1.5 text-xs font-bold text-text-soft hover:text-rose-500 transition-colors"
                            >
                                <History size={12} />
                                Reset Filter
                            </button>
                        )}
                    </div>

                    <div className="flex h-9 items-center gap-2">
                        <Button
                            variant="outline"
                            className="flex h-full items-center gap-2 rounded-xl border-surface-border bg-card px-4 text-xs font-bold transition-all hover:bg-surface-muted"
                            onClick={exportCsv}
                        >
                            <Download size={14} />
                            Export CSV
                        </Button>
                    </div>
                </div>

                {/* Tabs Switcher */}
                <div className="flex items-center gap-4 border-b border-surface-border pb-px">
                    <button
                        className={cn(
                            'px-4 pb-2.5 text-xs font-bold transition-all relative border-b-2 -mb-[2px]',
                            activeTab === 'contracts' ? 'border-primary text-primary' : 'border-transparent text-text-soft hover:text-text-main',
                        )}
                        onClick={() => setActiveTab('contracts')}
                    >
                        Database Kontrak
                    </button>
                    <button
                        className={cn(
                            'px-4 pb-2.5 text-xs font-bold transition-all relative border-b-2 -mb-[2px]',
                            activeTab === 'audit' ? 'border-primary text-primary' : 'border-transparent text-text-soft hover:text-text-main',
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
        <div className="border border-surface-border rounded-2xl overflow-hidden bg-card mx-5">
            <div className="scrollbar-hide overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs bg-card">
                    <thead>
                        <tr className="border-b border-surface-border bg-surface-muted select-none">
                            <th className="px-4 py-3 text-xs font-bold text-text-soft uppercase tracking-wider">Parameter</th>
                            <th className="px-4 py-3 text-xs font-bold text-text-soft uppercase tracking-wider">Judul Rekap</th>
                            <th className="px-4 py-3 text-xs font-bold text-text-soft uppercase tracking-wider">Tipe</th>
                            <th className="px-4 py-3 text-xs font-bold text-text-soft uppercase tracking-wider">Pemilik</th>
                            <th className="px-4 py-3 text-xs font-bold text-text-soft uppercase tracking-wider">Registrasi</th>
                            <th className="px-4 py-3 text-xs font-bold text-text-soft uppercase tracking-wider text-center">Status</th>
                            <th className="px-4 py-3 text-xs font-bold text-text-soft uppercase tracking-wider text-right">Aging</th>
                            <th className="px-4 py-3 text-xs font-bold text-text-soft uppercase tracking-wider">Stage</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border">
                        {contracts.map((c) => (
                            <tr key={c.id} className="hover:bg-surface-muted/50 transition-colors">
                                <td className="px-4 py-3 font-mono font-semibold text-text-soft">{c.form_no || c.contract_no || '—'}</td>
                                <td className="px-4 py-3 font-bold text-text-main uppercase truncate max-w-[200px]">{c.title}</td>
                                <td className="px-4 py-3 text-text-soft uppercase font-bold">{c.type || 'N/A'}</td>
                                <td className="px-4 py-3 text-text-soft uppercase font-semibold">{c.creator}</td>
                                <td className="px-4 py-3 text-text-soft font-semibold">
                                    {new Date(c.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <span className={cn(
                                        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                        c.status === 'approved' ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                                        c.status === 'pending' ? "bg-amber-50 text-amber-700 border border-amber-200" :
                                        c.status === 'rejected' ? "bg-rose-50 text-rose-700 border border-rose-200" :
                                        "bg-slate-50 text-slate-700 border border-slate-200"
                                    )}>
                                        <span className={cn(
                                            "h-1.5 w-1.5 rounded-full",
                                            c.status === 'approved' ? "bg-emerald-500" :
                                            c.status === 'pending' ? "bg-amber-500" :
                                            c.status === 'rejected' ? "bg-rose-500" :
                                            "bg-slate-400"
                                        )} />
                                        {c.status}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right font-mono font-semibold text-text-soft">{formatRelativeTime(c.created_at)}</td>
                                <td className="px-4 py-3 font-bold text-text-soft uppercase">{c.current_step}</td>
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
        <div className="border border-surface-border rounded-2xl overflow-hidden bg-card mx-5">
            <div className="scrollbar-hide overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs bg-card">
                    <thead>
                        <tr className="border-b border-surface-border bg-surface-muted select-none">
                            <th className="px-4 py-3 text-xs font-bold text-text-soft uppercase tracking-wider">Timestamp</th>
                            <th className="px-4 py-3 text-xs font-bold text-text-soft uppercase tracking-wider">Ref ID</th>
                            <th className="px-4 py-3 text-xs font-bold text-text-soft uppercase tracking-wider">Action Event</th>
                            <th className="px-4 py-3 text-xs font-bold text-text-soft uppercase tracking-wider">Transaction Log Data</th>
                            <th className="px-4 py-3 text-xs font-bold text-text-soft uppercase tracking-wider">Author Entity</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border">
                        {histories.map((h) => {
                            const actionType = h.action.toLowerCase();
                            const isAlert = actionType.includes('reject') || actionType.includes('delete') || actionType.includes('cancel');
                            const isSuccess = actionType.includes('approve') || actionType.includes('create') || actionType.includes('submit');
                            const isSystem = actionType.includes('system') || actionType.includes('update');

                            return (
                                <tr key={h.id} className="hover:bg-surface-muted/50 transition-colors">
                                    <td className="px-4 py-3 text-text-desc text-sm whitespace-nowrap">
                                        {new Date(h.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })} {new Date(h.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </td>
                                    <td className="px-4 py-3 font-mono text-sm text-text-main">
                                        #{(h.form_no || h.contract_no || '').split('/').pop()}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={cn(
                                            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide",
                                            isAlert ? "bg-rose-50 text-rose-700 border border-rose-200" :
                                            isSuccess ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                                            isSystem ? "bg-blue-50 text-blue-700 border border-blue-200" :
                                            "bg-slate-50 text-slate-700 border border-slate-200"
                                        )}>
                                            {h.action}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-text-main text-sm">{h.description}</td>
                                    <td className="px-4 py-3 text-text-desc text-sm">@{h.actor.split(' ')[0]}</td>
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

function formatRelativeTime(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    const diffInDays = Math.floor(diffInSeconds / 86400);

    if (diffInDays === 0) {
        if (diffInSeconds < 60) return 'Baru saja';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} mnt lalu`;
        return `${Math.floor(diffInSeconds / 3600)} jam lalu`;
    }
    if (diffInDays === 1) return 'Kemarin';
    if (diffInDays < 7) return `${diffInDays} hari lalu`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} minggu lalu`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} bulan lalu`;
    return `${Math.floor(diffInDays / 365)} tahun lalu`;
}

