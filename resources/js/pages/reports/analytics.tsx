import { DataTable } from '@/components/ui/tables/DataTable';
import { PageTable } from '@/components/ui/navigation/PageTable';
import { Button } from '@/components/ui/buttons/Button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/dialogs/Popover';
import { DateRangeCalendar } from '@/components/ui/inputs/DateRangeCalendar';
import { useToast } from '@/components/ui/feedback/Toast';
import { cn } from '@/lib/utils';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import { Loader2, BarChart3, Calendar as CalendarIcon, X, ChevronDown, RotateCcw, FileSpreadsheet } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

interface AnalyticsData {
    recentContracts: any[];
    types: { id: string; name: string }[];
    users: { id: string; name: string }[];
}

const formatDateText = (dStr?: string) => {
    if (!dStr) return '';
    try {
        const [y, m, d] = dStr.split('-').map(Number);
        const dt = new Date(y, m - 1, d);
        return dt.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
        return dStr;
    }
};

const getPresetRange = (type: 'today' | '7days' | '30days' | 'thisMonth' | 'lastMonth') => {
    const today = new Date();
    const fmt = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    };

    if (type === 'today') {
        const t = fmt(today);
        return { date_from: t, date_to: t };
    }
    if (type === '7days') {
        const past = new Date(today);
        past.setDate(today.getDate() - 6);
        return { date_from: fmt(past), date_to: fmt(today) };
    }
    if (type === '30days') {
        const past = new Date(today);
        past.setDate(today.getDate() - 29);
        return { date_from: fmt(past), date_to: fmt(today) };
    }
    if (type === 'thisMonth') {
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        return { date_from: fmt(firstDay), date_to: fmt(lastDay) };
    }
    if (type === 'lastMonth') {
        const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
        return { date_from: fmt(firstDay), date_to: fmt(lastDay) };
    }
    return { date_from: '', date_to: '' };
};

export default function AnalyticsPage({ breadcrumbs }: { breadcrumbs: BreadcrumbItem[] }) {
    const { showToast } = useToast();
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
        per_page: 10,
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
                    per_page: raw.contracts.per_page || 10,
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
            creator_ids: [],
            contracts_page: 1,
        };
        setFilters(clear);
        fetchData(clear);
    };

    const handleExport = () => {
        setExportLoading(true);
        showToast('Menyiapkan dan mengunduh berkas Excel Analitik Kontrak...', 'info');
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

    const hasDateFilter = !!(filters.date_from || filters.date_to);

    const dateDisplayText = useMemo(() => {
        if (filters.date_from && filters.date_to) {
            if (filters.date_from === filters.date_to) {
                return formatDateText(filters.date_from);
            }
            return `${formatDateText(filters.date_from)} – ${formatDateText(filters.date_to)}`;
        }
        if (filters.date_from) {
            return `Dari ${formatDateText(filters.date_from)}`;
        }
        if (filters.date_to) {
            return `Sampai ${formatDateText(filters.date_to)}`;
        }
        return 'Semua Rentang Waktu';
    }, [filters.date_from, filters.date_to]);

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
                    row.status === 'approved' ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/60" :
                    row.status === 'pending' ? "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/60" :
                    row.status === 'rejected' ? "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/60" :
                    "bg-slate-50 text-slate-700 border border-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700"
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
                onFilterChange={handleFilterChange}
                onResetFilters={handleResetFilters}
                totalResults={pagination.total}
                actions={
                    <div className="flex items-center gap-2">
                        {/* Shadcn UI Date Range Popover */}
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className={cn(
                                        "h-9 px-3 rounded-lg text-xs font-medium border transition-all duration-150 gap-2 cursor-pointer shadow-none",
                                        hasDateFilter
                                            ? "border-primary/40 bg-primary/5 text-primary hover:bg-primary/10 hover:border-primary dark:border-primary/50 dark:bg-primary/10 dark:text-primary-foreground"
                                            : "border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-zinc-800"
                                    )}
                                >
                                    <CalendarIcon size={14} className={cn(hasDateFilter ? "text-primary" : "text-slate-500 dark:text-slate-400")} />
                                    <span className="truncate max-w-[200px]">{dateDisplayText}</span>
                                    {hasDateFilter ? (
                                        <span
                                            role="button"
                                            tabIndex={0}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleFilterChange({ date_from: '', date_to: '' });
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleFilterChange({ date_from: '', date_to: '' });
                                                }
                                            }}
                                            className="ml-1 p-0.5 rounded-full hover:bg-primary/20 text-primary dark:text-primary transition-colors cursor-pointer"
                                            title="Hapus filter tanggal"
                                        >
                                            <X size={12} />
                                        </span>
                                    ) : (
                                        <ChevronDown size={13} className="text-slate-400 shrink-0" />
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent
                                align="end"
                                className="w-[340px] sm:w-[380px] p-3.5 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 shadow-2xl rounded-xl z-[9999]"
                            >
                                <div className="space-y-3">
                                    {/* Popover Header */}
                                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800">
                                        <div className="flex items-center gap-1.5">
                                            <CalendarIcon size={14} className="text-primary" />
                                            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                                                Pilih Rentang Tanggal
                                            </span>
                                        </div>
                                        {hasDateFilter && (
                                            <button
                                                type="button"
                                                onClick={() => handleFilterChange({ date_from: '', date_to: '' })}
                                                className="flex items-center gap-1 text-[11px] font-semibold text-rose-500 hover:text-rose-600 transition-colors"
                                            >
                                                <RotateCcw size={11} />
                                                <span>Reset</span>
                                            </button>
                                        )}
                                    </div>

                                    {/* Preset Quick Buttons */}
                                    <div className="flex flex-wrap gap-1.5">
                                        {[
                                            { label: 'Hari Ini', type: 'today' as const },
                                            { label: '7 Hari Terakhir', type: '7days' as const },
                                            { label: '30 Hari Terakhir', type: '30days' as const },
                                            { label: 'Bulan Ini', type: 'thisMonth' as const },
                                            { label: 'Bulan Lalu', type: 'lastMonth' as const },
                                        ].map((preset) => (
                                            <button
                                                key={preset.type}
                                                type="button"
                                                onClick={() => {
                                                    const range = getPresetRange(preset.type);
                                                    handleFilterChange(range);
                                                }}
                                                className="px-2.5 py-1 text-[11px] font-medium rounded-md border border-slate-200 dark:border-zinc-800 bg-slate-50/80 hover:bg-slate-100 text-slate-700 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-300 transition-colors cursor-pointer"
                                            >
                                                {preset.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Interactive Range Calendar */}
                                    <div className="rounded-lg border border-slate-100 dark:border-zinc-800/80 p-2 bg-slate-50/40 dark:bg-zinc-900/40">
                                        <DateRangeCalendar
                                            from={filters.date_from}
                                            to={filters.date_to}
                                            onChange={(from, to) => {
                                                handleFilterChange({ date_from: from, date_to: to });
                                            }}
                                        />
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>

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
