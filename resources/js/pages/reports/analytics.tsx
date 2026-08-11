import { DataTable } from '@/components/ui/tables/DataTable';
import { PageTable } from '@/components/ui/navigation/PageTable';
import { cn } from '@/lib/utils';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import { Download, Loader2, BarChart3 } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

interface AnalyticsData {
    recentContracts: any[];
    types: { id: string; name: string }[];
    users: { id: string; name: string }[];
}

export default function AnalyticsPage({ breadcrumbs }: { breadcrumbs: BreadcrumbItem[] }) {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [exportLoading, setExportLoading] = useState(false);
    const [filters, setFilters] = useState({
        date_from: '',
        date_to: '',
        contract_type_ids: [],
        creator_ids: [],
        contracts_page: 1,
    });

    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        total: 0,
    });

    const fetchData = (currentFilters = filters) => {
        setLoading(true);
        axios
            .post('/admin/reports/api/data', currentFilters)
            .then((res) => {
                const raw = res.data;
                setData({
                    recentContracts: raw.contracts.data || [],
                    types: raw.types,
                    users: raw.users,
                });
                setPagination({
                    current_page: raw.contracts.current_page || 1,
                    last_page: raw.contracts.last_page || 1,
                    total: raw.contracts.total || 0,
                });
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleExport = () => {
        setExportLoading(true);
        const params = new URLSearchParams();
        if (filters.date_from) params.append('date_from', filters.date_from);
        if (filters.date_to) params.append('date_to', filters.date_to);
        filters.contract_type_ids.forEach((id: string) => params.append('contract_type_ids[]', id));
        filters.creator_ids.forEach((id: string) => params.append('creator_ids[]', id));
        setTimeout(() => setExportLoading(false), 2000);
        window.location.href = `/admin/reports/api/export?${params.toString()}`;
    };

    const filterCategories = useMemo(
        () => [
            { label: 'Rentang Waktu', key: 'date', type: 'date-range' },
            {
                label: 'Tipe Kontrak',
                key: 'contract_type_ids',
                type: 'searchable',
                options: data?.types.map((t) => ({ label: t.name, value: t.id })) || [],
            },
            {
                label: 'Pembuat',
                key: 'creator_ids',
                type: 'searchable',
                options: data?.users.map((u) => ({ label: u.name, value: u.id })) || [],
            },
        ],
        [data],
    );

    const columns = [
        {
            header: 'Pengajuan / Kontrak',
            accessorKey: 'title',
            cell: (row: any) => (
                <div className="flex flex-col gap-1 min-w-[200px]">
                    <span className="text-[10px] text-text-muted font-normal uppercase tracking-wider">
                        {row.form_no || row.contract_no || '—'}
                    </span>
                    <span className="text-text-main font-normal text-xs truncate max-w-[280px] block">
                        {row.title}
                    </span>
                </div>
            )
        },
        {
            header: 'Tipe Kontrak',
            accessorKey: 'type',
            cell: (row: any) => <span className="text-text-main font-normal text-xs">{row.type || '—'}</span>
        },
        {
            header: 'Tipe Pengajuan',
            accessorKey: 'submission_type',
            cell: (row: any) => <span className="text-text-main font-normal text-xs">{row.submission_type || '—'}</span>
        },
        {
            header: 'Pembuat',
            accessorKey: 'creator',
            cell: (row: any) => <span className="text-text-main font-normal text-xs">{row.creator || '—'}</span>
        },
        {
            header: 'Tahap Saat Ini',
            accessorKey: 'current_step',
            cell: (row: any) => <span className="text-text-main font-normal text-xs">{row.current_step || '—'}</span>
        },
        {
            header: 'Status',
            accessorKey: 'status',
            cell: (row: any) => (
                <span className={cn(
                    "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-normal uppercase tracking-wider",
                    row.status === 'approved' ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                    row.status === 'pending' ? "bg-amber-50 text-amber-700 border border-amber-200" :
                    row.status === 'rejected' ? "bg-rose-50 text-rose-700 border border-rose-200" :
                    "bg-slate-50 text-slate-700 border border-slate-200"
                )}>
                    <span className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        row.status === 'approved' ? "bg-emerald-500" :
                        row.status === 'pending' ? "bg-amber-500" :
                        row.status === 'rejected' ? "bg-rose-500" :
                        "bg-slate-400"
                    )} />
                    {row.status}
                </span>
            )
        },
        {
            header: 'Tanggal Registrasi',
            accessorKey: 'created_at',
            cell: (row: any) => (
                <span className="text-text-main font-normal text-xs">
                    {new Date(row.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
            )
        }
    ];

    return (
        <>
            <Head title="Laporan Analitik Kontrak" />
            <PageTable
                title="Laporan Analitik Kontrak"
                subtitle="Analisis dan statistik operasional data pengajuan serta kontrak"
                icon={BarChart3}
                filters={filterCategories}
                activeFilters={filters}
                onFilterChange={(key, val) => {
                    const nextFilters = { ...filters, [key]: val, contracts_page: 1 };
                    setFilters(nextFilters);
                    fetchData(nextFilters);
                }}
                onResetFilters={() => {
                    const clear = {
                        date_from: '',
                        date_to: '',
                        contract_type_ids: [],
                        creator_ids: [],
                        contracts_page: 1,
                    };
                    setFilters(clear);
                    fetchData(clear);
                }}
                totalResults={pagination.total}
                actions={
                    <button
                        onClick={handleExport}
                        disabled={exportLoading}
                        className={cn(
                            "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-150",
                            "border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-zinc-800",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                            "disabled:opacity-60 disabled:cursor-not-allowed"
                        )}
                    >
                        {exportLoading ? (
                            <Loader2 size={13} className="animate-spin text-slate-400" />
                        ) : (
                            <Download size={13} className="text-slate-500 dark:text-slate-400" />
                        )}
                        <span>Export</span>
                    </button>
                }
                pagination={{
                    currentPage: pagination.current_page || 1,
                    lastPage: pagination.last_page || 1,
                    total: pagination.total || 0,
                    from: (pagination.current_page - 1) * (pagination.per_page || 10) + 1,
                    to: Math.min(pagination.current_page * (pagination.per_page || 10), pagination.total || 0),
                    perPage: pagination.per_page || 10,
                    onPageChange: (page) => {
                        const nextFilters = { ...filters, contracts_page: page };
                        setFilters(nextFilters);
                        fetchData(nextFilters);
                    },
                    onPerPageChange: (perPage) => {
                        const nextFilters = { ...filters, contracts_page: 1, per_page: perPage };
                        setFilters(nextFilters);
                        fetchData(nextFilters);
                    }
                }}
            >
                <DataTable
                    columns={columns}
                    data={data?.recentContracts || []}
                    loading={loading}
                    borderless={true}
                />
            </PageTable>
        </>
    );
}
