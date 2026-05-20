import { Button } from '@/components/ui/base/Button';
import { FilterCategory, FilterSheet } from '@/components/ui/data/FilterSheet';
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
    const [isFilterOpen, setIsFilterOpen] = useState(false);

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
            .post('/admin/api/reports/data', currentFilters)
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

    const applyFilters = () => {
        fetchData(activeFilters);
        setIsFilterOpen(false);
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

        const endpoint = activeTab === 'contracts' ? '/admin/api/reports/export' : '/admin/api/reports/audit/export';
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
        <div className="flex h-full flex-1 flex-col overflow-hidden bg-white">
            <Head title="Audit & Pelaporan" />
            {/* Unified Industrial Header */}
            <div className="space-y-5 border-b border-slate-200 bg-slate-50/50 px-5 py-5">
                <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-0.5">
                        <h1 className="flex items-center gap-2 text-[13px] font-black tracking-[0.3em] text-slate-900 uppercase">
                            <BarChart3 size={16} className="text-slate-900" />
                            Laporan & Statistik
                        </h1>
                        <p className="pl-6 text-[9px] font-bold text-slate-400 uppercase">Data operasional dan jejak audit sistem</p>
                    </div>

                    {data?.metrics && (
                        <div className="flex items-center gap-px overflow-hidden border border-slate-200 bg-slate-200">
                            <MetricCard label="Total Kontrak" value={data.metrics.totalContracts} />
                            <MetricCard label="Pending Approval" value={data.metrics.pendingApprovals} color="text-amber-500" />
                            <MetricCard label="Approved (MoM)" value={data.metrics.approvedThisMonth} color="text-green-600" />
                            <MetricCard label="Cycle Time (Days)" value={data.metrics.avgCycleTime} unit="d" />
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                    <div className="flex items-center gap-4">
                        <Button
                            onClick={() => setIsFilterOpen(true)}
                            className={cn(
                                'h-9 rounded-none border px-5 text-[10px] font-black tracking-[0.2em] uppercase transition-all',
                                activeFilterCount > 0
                                    ? 'border-black bg-black text-white hover:bg-slate-800'
                                    : 'border-slate-200 bg-white text-slate-600 hover:border-black hover:bg-slate-50 hover:text-black',
                            )}
                        >
                            <ListFilter size={14} className="mr-2" />
                            FILTER {activeFilterCount > 0 && `(${activeFilterCount})`}
                        </Button>

                        {activeFilterCount > 0 && (
                            <button
                                onClick={resetFilters}
                                className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase transition-colors hover:text-rose-600"
                            >
                                <History size={12} />
                                RESET FILTER
                            </button>
                        )}
                    </div>

                    <div className="flex h-9 items-center gap-2">
                        <Button
                            variant="outline"
                            className="flex h-full items-center gap-2 rounded-none border-slate-200 px-6 text-[10px] font-black uppercase transition-all hover:border-black active:bg-slate-50"
                            onClick={exportCsv}
                        >
                            <Download size={14} />
                            EXPORT CSV
                        </Button>
                    </div>
                </div>

                {/* Tabs Switcher */}
                <div className="-mb-5 flex items-center gap-8 border-b border-slate-200">
                    <button
                        className={cn(
                            'relative px-2 pb-3 text-[10px] font-black tracking-[0.2em] uppercase transition-all',
                            activeTab === 'contracts' ? 'text-black' : 'text-slate-400 hover:text-slate-600',
                        )}
                        onClick={() => setActiveTab('contracts')}
                    >
                        Database Kontrak
                        {activeTab === 'contracts' && <div className="absolute right-0 bottom-0 left-0 h-1 bg-black" />}
                    </button>
                    <button
                        className={cn(
                            'relative px-2 pb-3 text-[10px] font-black tracking-[0.2em] uppercase transition-all',
                            activeTab === 'audit' ? 'text-black' : 'text-slate-400 hover:text-slate-600',
                        )}
                        onClick={() => setActiveTab('audit')}
                    >
                        Audit Trail History
                        {activeTab === 'audit' && <div className="absolute right-0 bottom-0 left-0 h-1 bg-black" />}
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

            <FilterSheet
                isOpen={isFilterOpen}
                onOpenChange={setIsFilterOpen}
                title="FILTER LAPORAN"
                description="Sesuaikan kriteria data untuk rekapitulasi dan audit trail."
                categories={filterCategories}
                activeFilters={activeFilters}
                onFilterChange={handleFilterChange}
                onReset={resetFilters}
                applyText="TERAPKAN FILTER"
            />
        </div>
    );
}

// ─── Sub-Components ──────────────────────────────────────────────────

function ContractRegistryTable({ contracts }: { contracts: any[] }) {
    if (contracts.length === 0) return <EmptyState label="kontrak" />;
    return (
        <table className="w-full border-collapse bg-white text-[12px]">
            <thead className="sticky top-0 z-10 border-b border-slate-200 bg-white shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
                <tr>
                    <th className="px-5 py-3.5 text-left text-[9px] font-black tracking-[0.2em] text-slate-400 uppercase">Parameter</th>
                    <th className="px-5 py-3.5 text-left text-[9px] font-black tracking-[0.2em] text-slate-400 uppercase">Judul Rekap</th>
                    <th className="px-5 py-3.5 text-left text-[9px] font-black tracking-[0.2em] whitespace-nowrap text-slate-400 uppercase">Tipe</th>
                    <th className="px-5 py-3.5 text-left text-[9px] font-black tracking-[0.2em] whitespace-nowrap text-slate-400 uppercase">
                        Pemilik
                    </th>
                    <th className="px-5 py-3.5 text-left text-[9px] font-black tracking-[0.2em] whitespace-nowrap text-slate-400 uppercase">
                        Registrasi
                    </th>
                    <th className="px-5 py-3.5 text-center text-[9px] font-black tracking-[0.2em] text-slate-400 uppercase">Status</th>
                    <th className="px-5 py-3.5 text-right text-[9px] font-black tracking-[0.2em] whitespace-nowrap text-slate-400 uppercase">
                        Aging
                    </th>
                    <th className="px-5 py-3.5 text-left text-[9px] font-black tracking-[0.2em] whitespace-nowrap text-slate-400 uppercase">Stage</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {contracts.map((c) => (
                    <tr key={c.id} className="group transition-colors hover:bg-slate-50/80">
                        <td className="px-5 py-3">
                            <span className="font-mono text-[9px] font-black text-slate-400 transition-colors group-hover:text-slate-900">
                                {c.contract_no}
                            </span>
                        </td>
                        <td className="px-5 py-3">
                            <span className="block max-w-[180px] truncate text-[10px] leading-tight font-black tracking-tight text-slate-800 uppercase">
                                {c.title}
                            </span>
                        </td>
                        <td className="px-5 py-3 text-[9px] font-bold tracking-tighter whitespace-nowrap text-slate-400 uppercase">
                            {c.type || 'N/A'}
                        </td>
                        <td className="px-5 py-3 text-[9px] font-bold tracking-tight whitespace-nowrap text-slate-500 uppercase">{c.creator}</td>
                        <td className="px-5 py-3">
                            <span className="font-mono text-[9px] font-black text-slate-400 uppercase">
                                {new Date(c.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                            </span>
                        </td>
                        <td className="px-5 py-3">
                            <div className="flex items-center justify-center gap-1.5">
                                <div
                                    className={cn(
                                        'h-1 w-1 rounded-full',
                                        c.status === 'approved'
                                            ? 'bg-emerald-500'
                                            : c.status === 'pending'
                                              ? 'bg-amber-500'
                                              : c.status === 'rejected'
                                                ? 'bg-rose-500'
                                                : 'bg-slate-300',
                                    )}
                                />
                                <span
                                    className={cn(
                                        'text-[9px] font-black uppercase',
                                        c.status === 'approved'
                                            ? 'text-emerald-700'
                                            : c.status === 'pending'
                                              ? 'text-amber-700'
                                              : c.status === 'rejected'
                                                ? 'text-rose-700'
                                                : 'text-slate-500',
                                    )}
                                >
                                    {c.status}
                                </span>
                            </div>
                        </td>
                        <td className="px-5 py-3 text-right font-mono text-[9px] leading-none font-black whitespace-nowrap text-slate-400 uppercase">
                            {formatRelativeTime(c.created_at)}
                        </td>
                        <td className="px-5 py-3">
                            <div className="flex items-center gap-1.5">
                                <div className="h-1 w-1 rounded-full bg-slate-300 transition-colors group-hover:bg-black" />
                                <span className="text-[9px] font-bold tracking-tight whitespace-nowrap text-slate-600 uppercase">
                                    {c.current_step}
                                </span>
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

function AuditTrailTable({ histories }: { histories: any[] }) {
    if (histories.length === 0) return <EmptyState label="riwayat audit" />;
    return (
        <div className="flex-1 overflow-auto bg-slate-50/50 p-6 font-mono text-[11px] selection:bg-emerald-100">
            <div className="w-full space-y-0.5">
                <div className="mb-6 flex items-center gap-6 border-b border-slate-200 pb-3 text-[8px] font-black tracking-[0.3em] text-slate-400 uppercase">
                    <div className="w-28 text-left">TIMESTAMP</div>
                    <div className="w-24 text-left">REF_ID</div>
                    <div className="w-32 text-left">ACTION_EVENT</div>
                    <div className="flex-1 text-left">TRANSACTION_LOG_DATA</div>
                    <div className="w-40 text-right">AUTHOR_ENTITY</div>
                </div>

                {histories.map((h, idx) => {
                    const actionType = h.action.toLowerCase();
                    const isAlert = actionType.includes('reject') || actionType.includes('delete') || actionType.includes('cancel');
                    const isSuccess = actionType.includes('approve') || actionType.includes('create') || actionType.includes('submit');
                    const isSystem = actionType.includes('system') || actionType.includes('update');

                    return (
                        <div
                            key={h.id}
                            className="group -mx-3 flex gap-6 border border-transparent px-3 py-2 transition-all hover:border-slate-200 hover:bg-white hover:shadow-sm"
                        >
                            <div className="w-28 shrink-0 text-slate-400 tabular-nums">
                                <span className="font-medium text-slate-600">
                                    {new Date(h.created_at).toLocaleTimeString('id-ID', {
                                        hour12: false,
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        second: '2-digit',
                                    })}
                                </span>
                                <span className="ml-2 text-[7px] text-slate-400 opacity-0 group-hover:opacity-100">
                                    {new Date(h.created_at).toLocaleDateString()}
                                </span>
                            </div>

                            <div className="w-24 shrink-0 font-bold tracking-tighter text-slate-900">
                                <span className="mr-0.5 text-slate-300">#</span>
                                {h.contract_no.split('/').pop()}
                            </div>

                            <div className="w-32 shrink-0">
                                <span
                                    className={cn(
                                        'block border px-2 py-0.5 text-center text-[9px] font-black uppercase',
                                        isAlert
                                            ? 'border-rose-100 bg-rose-50 text-rose-700'
                                            : isSuccess
                                              ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                                              : isSystem
                                                ? 'border-blue-100 bg-blue-50 text-blue-700'
                                                : 'border-slate-200 bg-slate-100 text-slate-600',
                                    )}
                                >
                                    {h.action}
                                </span>
                            </div>

                            <div className="flex-1 leading-relaxed text-slate-500">
                                <span className="mr-2 text-[8px] font-black tracking-tighter text-slate-300">LOG::</span>
                                <span className="font-medium text-slate-700">{h.description}</span>
                            </div>

                            <div className="flex w-40 shrink-0 items-center justify-end gap-2 text-right text-slate-400">
                                <div className="h-px w-4 bg-slate-200" />
                                <span className="font-bold tracking-tighter text-slate-900 uppercase italic">@{h.actor.split(' ')[0]}</span>
                            </div>
                        </div>
                    );
                })}

                <div className="pt-12 text-center">
                    <div className="inline-flex items-center gap-4">
                        <div className="h-px w-10 bg-slate-200" />
                        <span className="text-[8px] font-black tracking-[0.5em] text-slate-300 uppercase">SYSTEM_TRANS_LOG_END</span>
                        <div className="h-px w-10 bg-slate-200" />
                    </div>
                </div>
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

function MetricCard({ label, value, color = 'text-slate-900', unit = '' }: { label: string; value: number; color?: string; unit?: string }) {
    return (
        <div className="flex min-w-[110px] flex-col gap-0.5 border-none bg-white px-4 py-2">
            <span className="text-[7px] leading-none font-black text-slate-400 uppercase">{label}</span>
            <div className="flex items-baseline gap-0.5">
                <span className={cn('text-[14px] leading-none font-black tracking-tighter', color)}>{value}</span>
                {unit && <span className="text-[8px] font-bold text-slate-400 uppercase">{unit}</span>}
            </div>
        </div>
    );
}
