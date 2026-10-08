import { reportsApi } from '@/api';
import { Button } from '@/components/ui/buttons/Button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/dialogs/Sheet';
import { useToast } from '@/components/ui/feedback/Toast';
import { DateRangePicker } from '@/components/ui/inputs/DateRangePicker';
import { PageTable } from '@/components/ui/navigation/PageTable';
import { DataTable } from '@/components/ui/tables/DataTable';
import { formatDate, formatDateRange, formatDateTime } from '@/lib/utils';
import { BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    CheckCircle2,
    Clock,
    ExternalLink,
    Eye,
    FileSpreadsheet,
    FileText,
    History,
    Info,
    Layers,
    Loader2,
    PlusCircle,
    RefreshCw,
    Send,
    User,
    UserCheck,
    XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface AuditLog {
    id: string;
    contract_id: string;
    form_no?: string;
    contract_no?: string;
    contract_title?: string;
    contract_status?: string;
    contract_type?: string;
    action: string;
    description: string;
    actor: string;
    actor_id?: string;
    actor_email?: string;
    actor_role?: string;
    actor_department?: string;
    actor_division?: string;
    step_name?: string;
    step_number?: number;
    created_at: string;
}

interface AuditData {
    histories: AuditLog[];
    users: { id: string; name: string }[];
    types?: { id: string; name: string }[];
    contracts?: { id: string; name: string }[];
    actions?: string[];
}

export default function AuditPage({ breadcrumbs }: { breadcrumbs: BreadcrumbItem[] }) {
    const { showToast } = useToast();
    const [data, setData] = useState<AuditData | null>(null);
    const [loading, setLoading] = useState(true);
    const [exportLoading, setExportLoading] = useState(false);
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    const [filters, setFilters] = useState<{
        date_from: string;
        date_to: string;
        creator_ids: string[];
        contract_ids: string[];
        contract_type_ids: string[];
        actions: string[];
        search: string;
        audit_page: number;
    }>({
        date_from: '',
        date_to: '',
        creator_ids: [],
        contract_ids: [],
        contract_type_ids: [],
        actions: [],
        search: '',
        audit_page: 1,
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
            .getAuditLogs(currentFilters)
            .then((res: any) => {
                setData({
                    histories: res.histories?.data || [],
                    users: res.users || [],
                    types: res.types || [],
                    contracts: res.contracts || [],
                    actions: res.actions || [],
                });
                setPagination({
                    current_page: res.histories?.current_page || 1,
                    last_page: res.histories?.last_page || 1,
                    total: res.histories?.total || 0,
                    per_page: res.histories?.per_page || 25,
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
            nextFilters = { ...filters, ...keyOrObj, audit_page: 1 };
        } else {
            nextFilters = { ...filters, [keyOrObj]: val, audit_page: 1 };
        }
        setFilters(nextFilters);
        fetchData(nextFilters);
    };

    const handleResetFilters = () => {
        const clear = {
            date_from: '',
            date_to: '',
            creator_ids: [],
            contract_ids: [],
            contract_type_ids: [],
            actions: [],
            search: '',
            audit_page: 1,
        };
        setFilters(clear);
        fetchData(clear);
    };

    const handleExport = () => {
        setExportLoading(true);
        showToast('Menyiapkan dan mengunduh berkas Excel Jejak Audit...', 'info');
        const url = reportsApi.getExportAuditUrl(filters);
        setTimeout(() => setExportLoading(false), 2000);
        window.location.href = url;
    };

    const handleRowClick = (log: AuditLog) => {
        setSelectedLog(log);
        setIsSheetOpen(true);
    };

    const filterCategories = useMemo(
        () => [
            { label: 'Rentang Waktu', key: 'date', type: 'date-range' },
            {
                label: 'Aktor (Pelaku)',
                key: 'creator_ids',
                type: 'searchable',
                options: data?.users.map((u) => ({ label: u.name, value: u.id })) || [],
            },
            {
                label: 'Tipe Aksi (Action)',
                key: 'actions',
                type: 'searchable',
                options: (data?.actions || ['approve', 'reject', 'create', 'update', 'submit', 'revision', 'delete']).map((a) => ({
                    label: a.toUpperCase(),
                    value: a,
                })),
            },
            {
                label: 'Tipe Kontrak',
                key: 'contract_type_ids',
                type: 'searchable',
                options: data?.types?.map((t) => ({ label: t.name, value: t.id })) || [],
            },
        ],
        [data],
    );

    const hasDateFilter = !!(filters.date_from || filters.date_to);

    const dateDisplayText = useMemo(
        () => formatDateRange(filters.date_from, filters.date_to, 'Semua Rentang Waktu'),
        [filters.date_from, filters.date_to],
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
                        handleRowClick(row);
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
            <Head title="Jejak Audit Sistem" />
            <PageTable
                title="Jejak Audit Sistem"
                subtitle="Rekam jejak forensik transaksi data, perubahan status, dan riwayat aktivitas pengguna"
                icon={History}
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
                            title="Export log jejak audit ke format Excel (.xlsx)"
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
                        const nextFilters = { ...filters, audit_page: page };
                        setFilters(nextFilters);
                        fetchData(nextFilters);
                    },
                    onPerPageChange: (perPage) => {
                        const nextFilters = { ...filters, audit_page: 1, per_page: perPage };
                        setFilters(nextFilters);
                        fetchData(nextFilters);
                    },
                }}
            >
                <DataTable
                    columns={columns}
                    data={data?.histories || []}
                    loading={loading}
                    borderless={true}
                    onRowClick={(row: AuditLog) => handleRowClick(row)}
                />
            </PageTable>

            {/* Audit Inspector Side Drawer */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent
                    side="right"
                    className="w-full overflow-y-auto rounded-[4px] border-l border-neutral-200 bg-white p-6 text-black sm:max-w-lg dark:border-neutral-800 dark:bg-neutral-900 dark:text-white"
                >
                    {selectedLog && (
                        <div className="space-y-6">
                            {/* Drawer Header */}
                            <SheetHeader className="border-b border-neutral-200 pb-4 text-left dark:border-neutral-800">
                                <div className="flex items-center justify-between gap-2">
                                    {renderActionBadge(selectedLog.action)}
                                    <span className="font-mono text-[11px] text-black dark:text-white">
                                        ID: {selectedLog.id ? String(selectedLog.id).substring(0, 8) : '—'}
                                    </span>
                                </div>
                                <SheetTitle className="mt-2 text-base font-bold text-black dark:text-white">Detail Jejak Audit</SheetTitle>
                                <SheetDescription className="flex items-center gap-1 text-xs text-black dark:text-white">
                                    <Clock size={12} className="text-black dark:text-white" />
                                    {selectedLog.created_at
                                        ? `${formatDateTime(selectedLog.created_at)} (${formatDate(selectedLog.created_at)})`
                                        : '—'}
                                </SheetDescription>
                            </SheetHeader>

                            {/* Section 1: Dokumen Terkait */}
                            <div className="space-y-2 rounded-[4px] border border-neutral-200 bg-neutral-50 p-3.5 text-black dark:border-neutral-800 dark:bg-neutral-800/40 dark:text-white">
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-black uppercase dark:text-white">
                                        <FileText size={13} className="text-black dark:text-white" /> Dokumen Kontrak
                                    </span>
                                    {selectedLog.contract_id && (
                                        <Link
                                            href={`/contracts/${selectedLog.contract_id}`}
                                            className="flex items-center gap-1 text-xs font-semibold text-black underline hover:opacity-80 dark:text-white"
                                        >
                                            Buka Kontrak <ExternalLink size={11} className="text-black dark:text-white" />
                                        </Link>
                                    )}
                                </div>
                                <div className="mt-1 text-sm font-semibold text-black dark:text-white">{selectedLog.contract_title || '—'}</div>
                                <div className="grid grid-cols-3 gap-2 border-t border-neutral-200 pt-1 text-xs text-black dark:border-neutral-800 dark:text-white">
                                    <div>
                                        <span className="block text-[10px] text-black dark:text-white">No. Form / Ref:</span>
                                        <span className="font-mono font-medium text-black dark:text-white">
                                            {selectedLog.form_no || selectedLog.contract_no || '—'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="block text-[10px] text-black dark:text-white">Tipe Kontrak:</span>
                                        <span className="font-medium text-black dark:text-white">{selectedLog.contract_type || '—'}</span>
                                    </div>
                                    <div>
                                        <span className="block text-[10px] text-black dark:text-white">Status Kontrak:</span>
                                        {selectedLog.contract_status ? (
                                            <span className="mt-0.5 inline-flex items-center rounded-[4px] border border-neutral-300 bg-neutral-100 px-1.5 py-0.5 text-[10px] font-bold text-black uppercase dark:border-neutral-700 dark:bg-neutral-800 dark:text-white">
                                                {selectedLog.contract_status}
                                            </span>
                                        ) : (
                                            <span className="text-black dark:text-white">—</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Tahap Alur Kerja */}
                            <div className="space-y-2 rounded-[4px] border border-neutral-200 bg-neutral-50 p-3.5 text-black dark:border-neutral-800 dark:bg-neutral-800/40 dark:text-white">
                                <span className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-black uppercase dark:text-white">
                                    <Layers size={13} className="text-black dark:text-white" /> Tahap Alur Kerja Saat Aksi
                                </span>
                                <div className="mt-1 flex items-center gap-2">
                                    {selectedLog.step_number ? (
                                        <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-[4px] bg-neutral-200 text-xs font-bold text-black dark:bg-neutral-700 dark:text-white">
                                            {selectedLog.step_number}
                                        </span>
                                    ) : null}
                                    <span className="text-sm font-medium text-black dark:text-white">
                                        {selectedLog.step_name || 'Tidak terkait tahap spesifik'}
                                    </span>
                                </div>
                            </div>

                            {/* Section 3: Pelaksana / Aktor */}
                            <div className="space-y-2 rounded-[4px] border border-neutral-200 bg-neutral-50 p-3.5 text-black dark:border-neutral-800 dark:bg-neutral-800/40 dark:text-white">
                                <span className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-black uppercase dark:text-white">
                                    <User size={13} className="text-black dark:text-white" /> Informasi Pelaksana
                                </span>
                                <div className="mt-1 space-y-1">
                                    <div className="text-sm font-semibold text-black dark:text-white">{selectedLog.actor || 'System'}</div>
                                    {selectedLog.actor_email && <div className="text-xs text-black dark:text-white">{selectedLog.actor_email}</div>}
                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                        {selectedLog.actor_role && (
                                            <span className="rounded-[4px] bg-neutral-200 px-2 py-0.5 text-[11px] font-medium text-black dark:bg-neutral-700 dark:text-white">
                                                {selectedLog.actor_role}
                                            </span>
                                        )}
                                        {selectedLog.actor_department && (
                                            <span className="rounded-[4px] border border-neutral-300 bg-white px-2 py-0.5 text-[11px] text-black dark:border-neutral-700 dark:bg-neutral-900 dark:text-white">
                                                {selectedLog.actor_department}
                                            </span>
                                        )}
                                        {selectedLog.actor_division && (
                                            <span className="rounded-[4px] border border-neutral-300 bg-white px-2 py-0.5 text-[11px] text-black dark:border-neutral-700 dark:bg-neutral-900 dark:text-white">
                                                {selectedLog.actor_division}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Section 4: Deskripsi & Catatan Lengkap */}
                            <div className="space-y-1.5">
                                <span className="text-xs font-bold tracking-wider text-black uppercase dark:text-white">
                                    Deskripsi / Catatan Transaksi
                                </span>
                                <div className="rounded-[4px] border border-neutral-200 bg-white p-3.5 text-xs leading-relaxed whitespace-pre-wrap text-black dark:border-neutral-800 dark:bg-neutral-900 dark:text-white">
                                    {selectedLog.description || 'Tidak ada catatan tambahan.'}
                                </div>
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </>
    );
}
