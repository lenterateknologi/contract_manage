import { Button } from '@/components/ui/buttons/Button';
import { DateRangePicker } from '@/components/ui/inputs/DateRangePicker';
import { PageTable } from '@/components/ui/navigation/PageTable';
import { DataTable } from '@/components/ui/tables/DataTable';
import { formatDateTime } from '@/lib/utils';
import {
    CheckCircle2,
    Eye,
    FileSpreadsheet,
    History,
    Info,
    Loader2,
    PlusCircle,
    RefreshCw,
    Send,
    UserCheck,
    XCircle,
} from 'lucide-react';
import React, { useMemo } from 'react';
import { useAuditReport } from '../../hooks/useAuditReport';
import type { AuditLog } from '../../types/reports.types';
import { AuditDetailSheet } from './AuditDetailSheet';

export function AuditView() {
    const {
        data,
        loading,
        exportLoading,
        selectedLog,
        detailOpen,
        openDetail,
        closeDetail,
        filters,
        pagination,
        handleFilterChange,
        handleResetFilters,
        handlePageChange,
        handleExport,
    } = useAuditReport();

    const filterCategories = useMemo(
        () => [
            { label: 'Rentang Waktu', key: 'date', type: 'date-range' as const },
            {
                label: 'Aktor (Pelaku)',
                key: 'creator_ids',
                type: 'searchable' as const,
                options: data?.users.map((u) => ({ label: u.name, value: u.id })) || [],
            },
            {
                label: 'Tipe Aksi (Action)',
                key: 'actions',
                type: 'searchable' as const,
                options: (data?.actions || ['approve', 'reject', 'create', 'update', 'submit', 'revision', 'delete']).map((a) => ({
                    label: a.toUpperCase(),
                    value: a,
                })),
            },
            {
                label: 'Tipe Kontrak',
                key: 'contract_type_ids',
                type: 'tree' as const,
                treeItems: data?.types || [],
            },
        ],
        [data],
    );

    const renderActionBadge = (action: string) => {
        const act = (action || '').toLowerCase();
        let IconComponent = Info;

        if (act.includes('approve') || act.includes('submit') || act.includes('create') || act.includes('sign')) {
            IconComponent = act.includes('create') ? PlusCircle : CheckCircle2;
        } else if (act.includes('reject') || act.includes('delete') || act.includes('cancel') || act.includes('terminate')) {
            IconComponent = XCircle;
        } else if (act.includes('revise') || act.includes('revision') || act.includes('assign') || act.includes('update')) {
            IconComponent = act.includes('assign') ? UserCheck : RefreshCw;
        } else if (act.includes('sent') || act.includes('send')) {
            IconComponent = Send;
        }

        return (
            <span className="inline-flex items-center gap-1.5 rounded-[4px] border border-neutral-300 bg-neutral-100 px-2.5 py-1 text-xs font-semibold tracking-wide text-black dark:border-neutral-700 dark:bg-neutral-800 dark:text-white">
                <IconComponent size={12} className="shrink-0 text-black dark:text-white" />
                <span className="text-black dark:text-white">{action}</span>
            </span>
        );
    };

    const columns = [
        {
            header: 'Waktu Transaksi',
            accessorKey: 'created_at',
            cell: (row: AuditLog) => (
                <span className="text-xs font-medium whitespace-nowrap text-black dark:text-white">{formatDateTime(row.created_at)}</span>
            ),
        },
        {
            header: 'Jenis Aksi',
            accessorKey: 'action',
            cell: (row: AuditLog) => renderActionBadge(row.action),
        },
        {
            header: 'No. Form / Kontrak',
            accessorKey: 'form_no',
            cell: (row: AuditLog) => (
                <span className="font-mono text-xs font-bold whitespace-nowrap text-black dark:text-white">
                    {row.form_no || row.contract_no || (row.contract_id ? `#${row.contract_id.substring(0, 8)}` : '—')}
                </span>
            ),
        },
        {
            header: 'Judul Kontrak',
            accessorKey: 'contract_title',
            cell: (row: AuditLog) => (
                <span className="block max-w-[280px] truncate text-xs font-medium text-black dark:text-white" title={row.contract_title}>
                    {row.contract_title || '—'}
                </span>
            ),
        },
        {
            header: 'Pelaksana (Actor)',
            accessorKey: 'actor',
            cell: (row: AuditLog) => (
                <span className="text-xs font-medium whitespace-nowrap text-black dark:text-white">{row.actor || 'System'}</span>
            ),
        },
        {
            header: 'Deskripsi / Catatan',
            accessorKey: 'description',
            cell: (row: AuditLog) => (
                <span className="block max-w-[320px] truncate text-xs text-black dark:text-white" title={row.description}>
                    {row.description || '—'}
                </span>
            ),
        },
        {
            header: 'Detail',
            accessorKey: 'id',
            cell: (row: AuditLog) => (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                        e.stopPropagation();
                        openDetail(row);
                    }}
                    className="h-7 w-7 cursor-pointer rounded-[4px] p-0 text-black hover:bg-neutral-200 dark:text-white dark:hover:bg-neutral-800"
                    title="Buka detail jejak audit"
                >
                    <Eye size={14} className="text-black dark:text-white" />
                </Button>
            ),
        },
    ];

    return (
        <>
            <PageTable
                title="Jejak Audit Sistem"
                subtitle="Rekam jejak forensik transaksi data, perubahan status, dan riwayat aktivitas pengguna"
                icon={History}
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
                            title="Export laporan jejak audit ke format Excel (.xlsx)"
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
                <DataTable columns={columns} data={data?.histories.data || []} loading={loading} borderless={true} />
            </PageTable>

            <AuditDetailSheet log={selectedLog} open={detailOpen} onClose={closeDetail} />
        </>
    );
}
export default AuditView;
