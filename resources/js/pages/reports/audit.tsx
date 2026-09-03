import { DataTable } from '@/components/ui/tables/DataTable';
import { PageTable } from '@/components/ui/navigation/PageTable';
import { Button } from '@/components/ui/buttons/Button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/dialogs/Popover';
import { DateRangeCalendar } from '@/components/ui/inputs/DateRangeCalendar';
import { cn } from '@/lib/utils';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import { useToast } from '@/components/ui/feedback/Toast';
import { Download, Loader2, History, Calendar as CalendarIcon, X, ChevronDown, RotateCcw, FileSpreadsheet } from 'lucide-react';
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

export default function AuditPage({ breadcrumbs }: { breadcrumbs: BreadcrumbItem[] }) {
    const { showToast } = useToast();
    const [data, setData] = useState<AuditData | null>(null);
    const [loading, setLoading] = useState(true);
    const [exportLoading, setExportLoading] = useState(false);
    const [isDateOpen, setIsDateOpen] = useState(false);

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
        per_page: 10,
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
                    per_page: res.data.histories.per_page || 10,
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
            audit_page: 1,
        };
        setFilters(clear);
        fetchData(clear);
    };

    const handleExport = () => {
        setExportLoading(true);
        showToast('Menyiapkan dan mengunduh berkas Excel Jejak Audit...', 'info');
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
                        isAlert ? "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/60" :
                        isSuccess ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/60" :
                        isSystem ? "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/60" :
                        "bg-slate-50 text-slate-700 border border-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700"
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
