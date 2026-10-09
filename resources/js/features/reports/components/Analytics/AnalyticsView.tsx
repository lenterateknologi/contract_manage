import { Button } from '@/components/ui/buttons/Button';
import { StatusBadge } from '@/components/ui/feedback/StatusBadge';
import { DateRangePicker } from '@/components/ui/inputs/DateRangePicker';
import { PageTable } from '@/components/ui/navigation/PageTable';
import { DataTable } from '@/components/ui/tables/DataTable';
import { formatDate } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { BarChart3, FileSpreadsheet, Loader2 } from 'lucide-react';
import React, { useMemo } from 'react';
import { useAnalyticsReport } from '../../hooks/useAnalyticsReport';

export function AnalyticsView() {
    const {
        data,
        loading,
        exportLoading,
        filters,
        pagination,
        handleFilterChange,
        handleResetFilters,
        handlePageChange,
        handleExport,
    } = useAnalyticsReport();

    const filterCategories = useMemo(
        () => [
            { label: 'Rentang Waktu', key: 'date', type: 'date-range' as const },
            {
                label: 'Tipe Kontrak',
                key: 'contract_type_ids',
                type: 'tree' as const,
                treeItems: data?.types || [],
            },
            {
                label: 'Alur Kerja (Workflow)',
                key: 'workflow_ids',
                type: 'searchable' as const,
                options: data?.workflows?.map((w) => ({ label: w.name, value: w.id })) || [],
            },
            {
                label: 'Pembuat (Pengaju)',
                key: 'creator_ids',
                type: 'searchable' as const,
                options: data?.users?.map((u) => ({ label: u.name, value: u.id })) || [],
            },
            {
                label: 'Pihak Terkait (Person)',
                key: 'involved_ids',
                type: 'searchable' as const,
                options: data?.users?.map((u) => ({ label: u.name, value: u.id })) || [],
            },
            {
                label: 'Status Pengajuan',
                key: 'statuses',
                type: 'searchable' as const,
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

    const columns = [
        {
            header: 'No. Form / Kontrak',
            accessorKey: 'form_no',
            cell: (row: any) => (
                <Link
                    href={`/contracts/${row.id}`}
                    className="text-primary hover:underline font-mono text-xs font-bold whitespace-nowrap"
                >
                    {row.form_no || row.contract_no || '—'}
                </Link>
            ),
        },
        {
            header: 'Judul Pengajuan / Kontrak',
            accessorKey: 'title',
            cell: (row: any) => (
                <Link
                    href={`/contracts/${row.id}`}
                    className="text-text-main block max-w-[280px] truncate text-xs font-medium hover:text-primary hover:underline"
                    title={row.title}
                >
                    {row.title}
                </Link>
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
        <PageTable
            title="Laporan Analitik Kontrak"
            subtitle="Analisis dan statistik operasional data pengajuan serta kontrak"
            icon={BarChart3}
            filters={filterCategories}
            activeFilters={filters}
            onFilterChange={(keyOrObj, val) => {
                if (typeof keyOrObj === 'object' && keyOrObj !== null) {
                    Object.entries(keyOrObj).forEach(([k, v]) => handleFilterChange(k, v));
                } else {
                    handleFilterChange(keyOrObj, val);
                }
            }}
            onResetFilters={handleResetFilters}
            totalResults={pagination.total}
            actions={
                <div className="flex items-center gap-2">
                    <DateRangePicker
                        from={filters.date_from}
                        to={filters.date_to}
                        variant="action-button"
                        align="end"
                        onChange={(from, to) => {
                            handleFilterChange('date_from', from);
                            handleFilterChange('date_to', to);
                        }}
                    />

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
                onPageChange: handlePageChange,
                onPerPageChange: () => {},
            }}
        >
            <DataTable columns={columns} data={data?.contracts?.data || []} loading={loading} borderless={true} />
        </PageTable>
    );
}
export default AnalyticsView;
