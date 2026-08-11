import { DataTable } from '@/components/ui/tables/DataTable';
import { PageTable } from '@/components/ui/navigation/PageTable';
import { cn } from '@/lib/utils';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import { Download, Loader2, History, Calendar, X } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

interface AuditLog {
    id: string;
    form_no: string;
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
    const [exportLoading, setExportLoading] = useState(false);
    const [filters, setFilters] = useState({
        date_from: '',
        date_to: '',
        creator_ids: [],
        audit_page: 1,
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
                setData({
                    histories: res.data.histories.data || [],
                    users: res.data.users,
                });
                setPagination({
                    current_page: res.data.histories.current_page || 1,
                    last_page: res.data.histories.last_page || 1,
                    total: res.data.histories.total || 0,
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
        filters.creator_ids.forEach((id: string) => params.append('creator_ids[]', id));
        setTimeout(() => setExportLoading(false), 2000);
        window.location.href = `/admin/reports/api/audit/export?${params.toString()}`;
    };

    const filterCategories = useMemo(
        () => [
            { label: 'Rentang Waktu', key: 'date', type: 'date-range' },
            {
                label: 'Aktor (User)',
                key: 'creator_ids',
                type: 'searchable',
                options: data?.users.map((u) => ({ label: u.name, value: u.id })) || [],
            },
        ],
        [data],
    );

    const columns = [
        {
            header: 'Timestamp',
            accessorKey: 'created_at',
            cell: (row: any) => (
                <span className="text-text-desc text-sm whitespace-nowrap">
                    {new Date(row.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })} {new Date(row.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
            )
        },
        {
            header: 'Ref ID',
            accessorKey: 'form_no',
            cell: (row: any) => <span className="font-mono text-sm text-text-main">#{(row.form_no || row.contract_no || '').split('/').pop()}</span>
        },
        {
            header: 'Action Event',
            accessorKey: 'action',
            cell: (row: any) => {
                const actionType = row.action.toLowerCase();
                const isAlert = actionType.includes('reject') || actionType.includes('delete') || actionType.includes('cancel');
                const isSuccess = actionType.includes('approve') || actionType.includes('create') || actionType.includes('submit');
                const isSystem = actionType.includes('system') || actionType.includes('update');

                return (
                    <span className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide",
                        isAlert ? "bg-rose-50 text-rose-700 border border-rose-200" :
                        isSuccess ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                        isSystem ? "bg-blue-50 text-blue-700 border border-blue-200" :
                        "bg-slate-50 text-slate-700 border border-slate-200"
                    )}>
                        {row.action}
                    </span>
                );
            }
        },
        {
            header: 'Transaction Log Data',
            accessorKey: 'description',
            cell: (row: any) => <span className="text-text-main text-sm">{row.description}</span>
        },
        {
            header: 'Author Entity',
            accessorKey: 'actor',
            cell: (row: any) => <span className="text-text-desc text-sm">@{row.actor.split(' ')[0]}</span>
        }
    ];

    return (
        <>
            <Head title="Jejak Audit Sistem" />
            <PageTable
                title="Jejak Audit Sistem"
                subtitle="Daftar rekam jejak aktivitas transaksi dan perubahan data sistem"
                icon={History}
                filters={filterCategories}
                activeFilters={filters}
                onFilterChange={(key, val) => {
                    const nextFilters = { ...filters, [key]: val, audit_page: 1 };
                    setFilters(nextFilters);
                    fetchData(nextFilters);
                }}
                onResetFilters={() => {
                    const clear = {
                        date_from: '',
                        date_to: '',
                        creator_ids: [],
                        audit_page: 1,
                    };
                    setFilters(clear);
                    fetchData(clear);
                }}
                totalResults={pagination.total}
                actions={
                    <div className="flex items-center gap-2">
                        {/* Header Date Range Picker */}
                        <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-slate-600 dark:text-slate-300">
                            <Calendar size={13} className="text-slate-400 shrink-0" />
                            <input
                                type="date"
                                value={filters.date_from || ''}
                                onChange={(e) => {
                                    const nextFilters = { ...filters, date_from: e.target.value, audit_page: 1 };
                                    setFilters(nextFilters);
                                    fetchData(nextFilters);
                                }}
                                className="bg-transparent border-none focus:outline-none p-0 text-xs w-24 text-slate-700 dark:text-slate-200"
                                title="Dari Tanggal"
                            />
                            <span className="text-slate-300 dark:text-slate-600">-</span>
                            <input
                                type="date"
                                value={filters.date_to || ''}
                                onChange={(e) => {
                                    const nextFilters = { ...filters, date_to: e.target.value, audit_page: 1 };
                                    setFilters(nextFilters);
                                    fetchData(nextFilters);
                                }}
                                className="bg-transparent border-none focus:outline-none p-0 text-xs w-24 text-slate-700 dark:text-slate-200"
                                title="Sampai Tanggal"
                            />
                            {(filters.date_from || filters.date_to) && (
                                <button
                                    onClick={() => {
                                        const nextFilters = { ...filters, date_from: '', date_to: '', audit_page: 1 };
                                        setFilters(nextFilters);
                                        fetchData(nextFilters);
                                    }}
                                    className="ml-0.5 text-slate-400 hover:text-rose-500 rounded transition-colors"
                                    title="Reset Tanggal"
                                >
                                    <X size={12} />
                                </button>
                            )}
                        </div>

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
                    </div>
                }
                pagination={{
                    currentPage: pagination.current_page || 1,
                    lastPage: pagination.last_page || 1,
                    total: pagination.total || 0,
                    from: (pagination.current_page - 1) * (pagination.per_page || 10) + 1,
                    to: Math.min(pagination.current_page * (pagination.per_page || 10), pagination.total || 0),
                    perPage: pagination.per_page || 10,
                    onPageChange: (page) => {
                        const nextFilters = { ...filters, audit_page: page };
                        setFilters(nextFilters);
                        fetchData(nextFilters);
                    },
                    onPerPageChange: (perPage) => {
                        const nextFilters = { ...filters, audit_page: 1, per_page: perPage };
                        setFilters(nextFilters);
                        fetchData(nextFilters);
                    }
                }}
            >
                <DataTable
                    columns={columns}
                    data={data?.histories || []}
                    loading={loading}
                    borderless={true}
                />
            </PageTable>
        </>
    );
}
