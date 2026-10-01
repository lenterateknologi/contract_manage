import { DataTable } from '@/components/ui/tables/DataTable';
import { PageTable } from '@/components/ui/navigation/PageTable';
import { Button } from '@/components/ui/buttons/Button';
import { DateRangePicker } from '@/components/ui/inputs/DateRangePicker';
import { useToast } from '@/components/ui/feedback/Toast';
import { StatusBadge } from '@/components/ui/feedback/StatusBadge';
import { cn, formatDate, formatDateTime, formatDateRange } from '@/lib/utils';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { reportsApi } from '@/api';
import { Loader2, BarChart3, Calendar as CalendarIcon, X, ChevronDown, RotateCcw, FileSpreadsheet } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

interface AnalyticsData {
    recentContracts: any[];
    types: { id: string; name: string }[];
    users: { id: string; name: string }[];
    workflows?: { id: string; name: string }[];
}

export default function AnalyticsPage({ breadcrumbs }: { breadcrumbs: BreadcrumbItem[] }) {
    const { showToast } = useToast();
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [exportLoading, setExportLoading] = useState(false);
    const [filters, setFilters] = useState<{
        date_from: string;
        date_to: string;
        contract_type_ids: string[];
        workflow_ids: string[];
        creator_ids: string[];
        involved_ids: string[];
        statuses: string[];
        search: string;
        contracts_page: number;
    }>({
        date_from: '',
        date_to: '',
        contract_type_ids: [],
        workflow_ids: [],
        creator_ids: [],
        involved_ids: [],
        statuses: [],
        search: '',
        contracts_page: 1,
    });

    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        total: 0,
        per_page: 25,
    });

    const fetchData = (currentFilters = filters) => {
        setLoading(true);
        reportsApi.getAnalytics(currentFilters)
            .then((raw: any) => {
                setData({
                    recentContracts: raw.contracts?.data || [],
                    types: raw.types || [],
                    users: raw.users || [],
                    workflows: raw.workflows || [],
                });
                setPagination({
                    current_page: raw.contracts?.current_page || 1,
                    last_page: raw.contracts?.last_page || 1,
                    total: raw.contracts?.total || 0,
                    per_page: raw.contracts?.per_page || 25,
                });
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleFilterChange = (keyOrObj: string | Record<string, any>, val?: any) => {
        let nextFilters;
        if (typeof keyOrObj === 'object' && keyOrObj !== null) {
            nextFilters = { ...filters, ...keyOrObj, contracts_page: 1 };
        } else {
            nextFilters = { ...filters, [keyOrObj]: val, contracts_page: 1 };
        }
        setFilters(nextFilters);
        fetchData(nextFilters);
    };

    const handleResetFilters = () => {
        const clear = {
            date_from: '',
            date_to: '',
            contract_type_ids: [],
            workflow_ids: [],
            creator_ids: [],
            involved_ids: [],
            statuses: [],
            search: '',
            contracts_page: 1,
        };
        setFilters(clear);
        fetchData(clear);
    };

    const handleExport = () => {
        setExportLoading(true);
        showToast('Menyiapkan dan mengunduh berkas Excel Analitik Kontrak...', 'info');
        const url = reportsApi.getExportAnalyticsUrl(filters);
        setTimeout(() => setExportLoading(false), 2000);
        window.location.href = url;
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
                label: 'Alur Kerja (Workflow)',
                key: 'workflow_ids',
                type: 'searchable',
                options: data?.workflows?.map((w) => ({ label: w.name, value: w.id })) || [],
            },
            {
                label: 'Pembuat (Pengaju)',
                key: 'creator_ids',
                type: 'searchable',
                options: data?.users.map((u) => ({ label: u.name, value: u.id })) || [],
            },
            {
                label: 'Pihak Terkait (Person)',
                key: 'involved_ids',
                type: 'searchable',
                options: data?.users.map((u) => ({ label: u.name, value: u.id })) || [],
            },
            {
                label: 'Status Pengajuan',
                key: 'statuses',
                type: 'searchable',
                options: [
                    { label: 'Draft', value: 'draft' },
                    { label: 'In Process', value: 'in_process' },
                    { label: 'Pending Approval', value: 'pending_approval' },
                    { label: 'Approved', value: 'approved' },
                    { label: 'Rejected', value: 'rejected' },
                    { label: 'Revision', value: 'revision' },
                    { label: 'Active', value: 'active' },
                    { label: 'Completed', value: 'completed' },
                    { label: 'Terminated', value: 'terminated' },
                ],
            },
        ],
        [data],
    );

    const hasDateFilter = !!(filters.date_from || filters.date_to);

    const dateDisplayText = useMemo(
        () => formatDateRange(filters.date_from, filters.date_to, 'Semua Rentang Waktu'),
        [filters.date_from, filters.date_to],
    );

    const columns = [
        {
            header: 'No. Form / Kontrak',
            accessorKey: 'form_no',
            cell: (row: any) => (
                <span className="text-xs font-mono font-bold text-primary whitespace-nowrap">
                    {row.form_no || row.contract_no || '—'}
                </span>
            )
        },
        {
            header: 'Judul Pengajuan / Kontrak',
            accessorKey: 'title',
            cell: (row: any) => (
                <span className="text-text-main font-medium text-xs truncate max-w-[260px] block" title={row.title}>
                    {row.title}
                </span>
            )
        },
        {
            header: 'Tipe Kontrak',
            accessorKey: 'type',
            cell: (row: any) => <span className="text-text-main text-xs whitespace-nowrap">{row.type || '—'}</span>
        },
        {
            header: 'Tipe Pengajuan',
            accessorKey: 'submission_type',
            cell: (row: any) => <span className="text-text-main text-xs whitespace-nowrap">{row.submission_type || '—'}</span>
        },
        {
            header: 'Alur Kerja (Workflow)',
            accessorKey: 'current_workflow',
            cell: (row: any) => (
                <span className="text-text-main text-xs truncate max-w-[180px] block" title={row.current_workflow}>
                    {row.current_workflow || '—'}
                </span>
            )
        },
        {
            header: 'Tahap Saat Ini',
            accessorKey: 'current_step',
            cell: (row: any) => (
                <span className="text-text-main text-xs truncate max-w-[160px] block" title={row.current_step}>
                    {row.current_step || '—'}
                </span>
            )
        },
        {
            header: 'No. Tahap',
            accessorKey: 'current_step_number',
            cell: (row: any) => (
                row.current_step_number ? (
                    <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-bold">
                        Tahap {row.current_step_number}
                    </span>
                ) : <span className="text-text-muted text-xs">—</span>
            )
        },
        {
            header: 'Aktor / Approver Saat Ini',
            accessorKey: 'current_actor',
            cell: (row: any) => (
                <span className="text-text-main text-xs truncate max-w-[180px] block" title={row.current_actor}>
                    {row.current_actor || '—'}
                </span>
            )
        },
        {
            header: 'Aksi Terakhir',
            accessorKey: 'last_action',
            cell: (row: any) => (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-surface-muted text-text-muted border border-border/50">
                    {row.last_action || 'CREATE'}
                </span>
            )
        },
        {
            header: 'Aksi Oleh',
            accessorKey: 'last_action_by',
            cell: (row: any) => (
                <span className="text-text-main font-medium text-xs whitespace-nowrap" title={row.last_action_by}>
                    {row.last_action_by || '—'}
                </span>
            )
        },
        {
            header: 'Waktu Aksi Terakhir',
            accessorKey: 'last_action_at',
            cell: (row: any) => (
                <span className="text-text-muted text-xs whitespace-nowrap">
                    {row.last_action_at ? formatDateTime(row.last_action_at) : '—'}
                </span>
            )
        },
        {
            header: 'Pembuat',
            accessorKey: 'creator',
            cell: (row: any) => <span className="text-text-main text-xs whitespace-nowrap">{row.creator || '—'}</span>
        },
        {
            header: 'Status',
            accessorKey: 'status',
            cell: (row: any) => <StatusBadge status={row.status} />
        },
        {
            header: 'Tanggal Registrasi',
            accessorKey: 'created_at',
            cell: (row: any) => (
                <span className="text-text-main text-xs whitespace-nowrap">
                    {formatDate(row.created_at)}
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
                onFilterChange={handleFilterChange}
                onResetFilters={handleResetFilters}
                totalResults={pagination.total}
                actions={
                    <div className="flex items-center gap-2">
                        {/* Unified Date Range Picker */}
                        <DateRangePicker
                            from={filters.date_from}
                            to={filters.date_to}
                            variant="action-button"
                            align="end"
                            onChange={(from, to) => handleFilterChange({ date_from: from, date_to: to })}
                        />

                        {/* Export Button */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExport}
                            disabled={exportLoading}
                            className="h-9 px-3.5 rounded-lg text-xs font-semibold border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-200 hover:bg-emerald-50/60 hover:border-emerald-300 hover:text-emerald-700 dark:hover:bg-emerald-950/30 dark:hover:border-emerald-800 dark:hover:text-emerald-400 gap-2 shadow-xs transition-all cursor-pointer"
                            title="Export laporan analitik ke format Excel (.xlsx)"
                        >
                            {exportLoading ? (
                                <Loader2 size={14} className="animate-spin text-emerald-600" />
                            ) : (
                                <FileSpreadsheet size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                            )}
                            <span>{exportLoading ? 'Mengunduh...' : 'Export Excel'}</span>
                        </Button>
                    </div>
                }
                pagination={{
                    currentPage: pagination.current_page || 1,
                    lastPage: pagination.last_page || 1,
                    total: pagination.total || 0,
                    from: (pagination.current_page - 1) * (pagination.per_page || 25) + 1,
                    to: Math.min(pagination.current_page * (pagination.per_page || 25), pagination.total || 0),
                    perPage: pagination.per_page || 25,
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
