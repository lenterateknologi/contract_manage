import { DataTable } from '@/components/ui/tables/DataTable';
import { PageTable } from '@/components/ui/navigation/PageTable';
import { Button } from '@/components/ui/buttons/Button';
import { DateRangePicker } from '@/components/ui/inputs/DateRangePicker';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/dialogs/Sheet';
import { cn, formatDate, formatDateTime, formatDateRange } from '@/lib/utils';
import { BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { reportsApi } from '@/api';
import { useToast } from '@/components/ui/feedback/Toast';
import {
    Download,
    Loader2,
    History,
    Calendar as CalendarIcon,
    X,
    ChevronDown,
    RotateCcw,
    FileSpreadsheet,
    Eye,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    RefreshCw,
    UserCheck,
    Send,
    PlusCircle,
    FileText,
    ExternalLink,
    Clock,
    User,
    Layers,
    Tag,
    Info,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

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
        reportsApi.getAuditLogs(currentFilters)
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
                label: 'Aktor (Person)',
                key: 'creator_ids',
                type: 'searchable',
                options: data?.users.map((u) => ({ label: u.name, value: u.id })) || [],
            },
            {
                label: 'Dokumen Pengajuan',
                key: 'contract_ids',
                type: 'searchable',
                options: data?.contracts?.map((c) => ({ label: c.name, value: c.id })) || [],
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
        let colorClass = 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700';
        let IconComponent = Info;

        if (act.includes('approve') || act.includes('submit') || act.includes('create') || act.includes('sign')) {
            colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/60';
            IconComponent = act.includes('create') ? PlusCircle : CheckCircle2;
        } else if (act.includes('reject') || act.includes('delete') || act.includes('cancel') || act.includes('terminate')) {
            colorClass = 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/60';
            IconComponent = XCircle;
        } else if (act.includes('revise') || act.includes('revision') || act.includes('assign') || act.includes('update')) {
            colorClass = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/60';
            IconComponent = act.includes('assign') ? UserCheck : RefreshCw;
        } else if (act.includes('sent') || act.includes('send')) {
            colorClass = 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/60';
            IconComponent = Send;
        }

        return (
            <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold tracking-wide border', colorClass)}>
                <IconComponent size={12} className="shrink-0" />
                <span>{action}</span>
            </span>
        );
    };

    const columns = [
        {
            header: 'Waktu Transaksi',
            accessorKey: 'created_at',
            cell: (row: AuditLog) => (
                <span className="text-text-main font-medium text-xs whitespace-nowrap">
                    {formatDateTime(row.created_at)}
                </span>
            )
        },
        {
            header: 'No. Form / Kontrak',
            accessorKey: 'form_no',
            cell: (row: AuditLog) => (
                <span className="text-xs font-mono font-bold text-primary whitespace-nowrap">
                    {row.form_no || row.contract_no || (row.contract_id ? `#${row.contract_id.substring(0, 8)}` : '—')}
                </span>
            )
        },
        {
            header: 'Judul Kontrak',
            accessorKey: 'contract_title',
            cell: (row: AuditLog) => (
                <span className="text-text-main font-medium text-xs truncate max-w-[260px] block" title={row.contract_title}>
                    {row.contract_title || '—'}
                </span>
            )
        },
        {
            header: 'Tipe Kontrak',
            accessorKey: 'contract_type',
            cell: (row: AuditLog) => (
                <span className="text-text-main text-xs whitespace-nowrap">
                    {row.contract_type || '—'}
                </span>
            )
        },
        {
            header: 'Tahap Alur Kerja',
            accessorKey: 'step_name',
            cell: (row: AuditLog) => (
                <span className="text-text-main text-xs truncate max-w-[180px] block" title={row.step_name}>
                    {row.step_name || '—'}
                </span>
            )
        },
        {
            header: 'No. Tahap',
            accessorKey: 'step_number',
            cell: (row: AuditLog) => (
                row.step_number ? (
                    <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-bold">
                        Tahap {row.step_number}
                    </span>
                ) : <span className="text-text-desc text-xs">—</span>
            )
        },
        {
            header: 'Jenis Aksi',
            accessorKey: 'action',
            cell: (row: AuditLog) => renderActionBadge(row.action)
        },
        {
            header: 'Pelaksana (Actor)',
            accessorKey: 'actor',
            cell: (row: AuditLog) => (
                <span className="text-text-main font-medium text-xs whitespace-nowrap">
                    {row.actor || 'System'}
                </span>
            )
        },
        {
            header: 'Jabatan / Role',
            accessorKey: 'actor_role',
            cell: (row: AuditLog) => (
                <span className="text-text-desc text-xs whitespace-nowrap">
                    {row.actor_role || '—'}
                </span>
            )
        },
        {
            header: 'Departemen',
            accessorKey: 'actor_department',
            cell: (row: AuditLog) => (
                <span className="text-text-desc text-xs whitespace-nowrap">
                    {row.actor_department || '—'}
                </span>
            )
        },
        {
            header: 'Deskripsi / Catatan',
            accessorKey: 'description',
            cell: (row: AuditLog) => (
                <span className="text-text-main text-xs truncate max-w-[300px] block" title={row.description}>
                    {row.description || '—'}
                </span>
            )
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
                    className="h-7 w-7 p-0 rounded-md text-text-desc hover:text-primary hover:bg-primary/10 cursor-pointer"
                    title="Buka detail jejak audit"
                >
                    <Eye size={14} />
                </Button>
            )
        }
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
                            className="h-9 px-3.5 rounded-lg text-xs font-semibold border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-200 hover:bg-emerald-50/60 hover:border-emerald-300 hover:text-emerald-700 dark:hover:bg-emerald-950/30 dark:hover:border-emerald-800 dark:hover:text-emerald-400 gap-2 shadow-xs transition-all cursor-pointer"
                            title="Export log jejak audit ke format Excel (.xlsx)"
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
                    onRowClick={(row: AuditLog) => handleRowClick(row)}
                />
            </PageTable>

            {/* Audit Inspector Side Drawer */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto p-6 bg-surface-card border-l border-surface-border">
                    {selectedLog && (
                        <div className="space-y-6">
                            {/* Drawer Header */}
                            <SheetHeader className="text-left border-b border-surface-border pb-4">
                                <div className="flex items-center justify-between gap-2">
                                    {renderActionBadge(selectedLog.action)}
                                    <span className="text-[11px] text-text-desc font-mono">
                                        ID: {selectedLog.id ? String(selectedLog.id).substring(0, 8) : '—'}
                                    </span>
                                </div>
                                <SheetTitle className="text-base font-bold text-text-main mt-2">
                                    Detail Jejak Audit
                                </SheetTitle>
                                <SheetDescription className="text-xs text-text-desc flex items-center gap-1">
                                    <Clock size={12} />
                                    {selectedLog.created_at ? `${formatDateTime(selectedLog.created_at)} (${formatDate(selectedLog.created_at)})` : '—'}
                                </SheetDescription>
                            </SheetHeader>

                            {/* Section 1: Dokumen Terkait */}
                            <div className="space-y-2 p-3.5 rounded-lg border border-surface-border bg-surface-muted/70 dark:bg-zinc-800/40">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-text-desc uppercase tracking-wider flex items-center gap-1.5">
                                        <FileText size={13} className="text-primary" /> Dokumen Kontrak
                                    </span>
                                    {selectedLog.contract_id && (
                                        <Link
                                            href={`/contracts/${selectedLog.contract_id}`}
                                            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                                        >
                                            Buka Kontrak <ExternalLink size={11} />
                                        </Link>
                                    )}
                                </div>
                                <div className="text-sm font-semibold text-text-main mt-1">
                                    {selectedLog.contract_title || '—'}
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-surface-border/50 text-text-desc">
                                    <div>
                                        <span className="text-[10px] text-text-desc block">No. Form / Ref:</span>
                                        <span className="font-mono font-medium text-text-main">
                                            {selectedLog.form_no || selectedLog.contract_no || '—'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-text-desc block">Tipe Kontrak:</span>
                                        <span className="font-medium text-text-main">
                                            {selectedLog.contract_type || '—'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Tahap Alur Kerja */}
                            <div className="space-y-2 p-3.5 rounded-lg border border-surface-border bg-surface-muted/70 dark:bg-zinc-800/40">
                                <span className="text-[11px] font-bold text-text-desc uppercase tracking-wider flex items-center gap-1.5">
                                    <Layers size={13} className="text-primary" /> Tahap Alur Kerja Saat Aksi
                                </span>
                                <div className="flex items-center gap-2 mt-1">
                                    {selectedLog.step_number ? (
                                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                                            {selectedLog.step_number}
                                        </span>
                                    ) : null}
                                    <span className="text-sm font-medium text-text-main">
                                        {selectedLog.step_name || 'Tidak terkait tahap spesifik'}
                                    </span>
                                </div>
                            </div>

                            {/* Section 3: Pelaksana / Aktor */}
                            <div className="space-y-2 p-3.5 rounded-lg border border-surface-border bg-surface-muted/70 dark:bg-zinc-800/40">
                                <span className="text-[11px] font-bold text-text-desc uppercase tracking-wider flex items-center gap-1.5">
                                    <User size={13} className="text-primary" /> Informasi Pelaksana
                                </span>
                                <div className="space-y-1 mt-1">
                                    <div className="text-sm font-semibold text-text-main">
                                        {selectedLog.actor || 'System'}
                                    </div>
                                    {selectedLog.actor_email && (
                                        <div className="text-xs text-text-desc">
                                            {selectedLog.actor_email}
                                        </div>
                                    )}
                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                        {selectedLog.actor_role && (
                                            <span className="text-[11px] px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">
                                                {selectedLog.actor_role}
                                            </span>
                                        )}
                                        {selectedLog.actor_department && (
                                            <span className="text-[11px] px-2 py-0.5 rounded bg-surface-base border border-surface-border text-text-desc">
                                                {selectedLog.actor_department}
                                            </span>
                                        )}
                                        {selectedLog.actor_division && (
                                            <span className="text-[11px] px-2 py-0.5 rounded bg-surface-base border border-surface-border text-text-desc">
                                                {selectedLog.actor_division}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Section 4: Deskripsi & Catatan Lengkap */}
                            <div className="space-y-1.5">
                                <span className="text-xs font-bold text-text-desc uppercase tracking-wider">
                                    Deskripsi / Catatan Transaksi
                                </span>
                                <div className="p-3.5 rounded-lg border border-surface-border bg-surface-base dark:bg-zinc-800/60 text-xs text-text-main leading-relaxed whitespace-pre-wrap">
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
