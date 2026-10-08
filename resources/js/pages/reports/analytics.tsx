import { reportsApi } from '@/api';
import { Button } from '@/components/ui/buttons/Button';
import { StatusBadge } from '@/components/ui/feedback/StatusBadge';
import { useToast } from '@/components/ui/feedback/Toast';
import { DateRangePicker } from '@/components/ui/inputs/DateRangePicker';
import { PageTable } from '@/components/ui/navigation/PageTable';
import { DataTable } from '@/components/ui/tables/DataTable';
import { formatDate, formatDateRange } from '@/lib/utils';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { BarChart3, FileSpreadsheet, Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

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
        reportsApi
            .getAnalytics(currentFilters)
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
                <span className="text-primary font-mono text-xs font-bold whitespace-nowrap">{row.form_no || row.contract_no || '—'}</span>
            ),
        },
        {
            header: 'Judul Pengajuan / Kontrak',
            accessorKey: 'title',
            cell: (row: any) => (
                <span className="text-text-main block max-w-[280px] truncate text-xs font-medium" title={row.title}>
                    {row.title}
                </span>
            ),
        },
        {
            header: 'Tipe Kontrak',
            accessorKey: 'type',
            cell: (row: any) => <span className="text-text-main text-xs whitespace-nowrap">{row.type || '—'}</span>,
        },
        {
            header: 'Tipe Pengajuan',
            accessorKey: 'submission_type',
            cell: (row: any) => <span className="text-text-main text-xs whitespace-nowrap">{row.submission_type || '—'}</span>,
        },
        {
            header: 'Pembuat (Pengaju)',
            accessorKey: 'creator',
            cell: (row: any) => <span className="text-text-main text-xs font-medium whitespace-nowrap">{row.creator || '—'}</span>,
        },
        {
            header: 'Status',
            accessorKey: 'status',
            cell: (row: any) => <StatusBadge status={row.status} />,
        },
        {
            header: 'Tanggal Dibuat',
            accessorKey: 'created_at',
            cell: (row: any) => <span className="text-text-main text-xs whitespace-nowrap">{formatDate(row.created_at)}</span>,
        },
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
                            className="h-8 cursor-pointer gap-1.5 rounded-[4px] border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-none transition-all hover:border-emerald-300 hover:bg-emerald-50/60 hover:text-emerald-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-emerald-800 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-400"
                            title="Export laporan analitik ke format Excel (.xlsx)"
                        >
                            {exportLoading ? (
                                <Loader2 size={13} className="animate-spin text-emerald-600" />
                            ) : (
                                <FileSpreadsheet size={13} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
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
                    },
                }}
            >
                <DataTable columns={columns} data={data?.recentContracts || []} loading={loading} borderless={true} />
            </PageTable>
        </>
    );
}
