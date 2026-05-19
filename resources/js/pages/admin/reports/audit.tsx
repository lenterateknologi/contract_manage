import { Button } from '@/components/ui/base/Button';
import { FilterCategory, FilterSheet } from '@/components/ui/data/FilterSheet';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import { AlertCircle, ArrowRight, CheckCircle, Clock, Download, FileText, Filter, ShieldCheck, Terminal, User } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface AuditLog {
    id: string;
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
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filters, setFilters] = useState({
        date_from: '',
        date_to: '',
        creator_ids: [],
    });

    const fetchData = (currentFilters = filters) => {
        setLoading(true);
        axios
            .post('/admin/api/reports/data', currentFilters)
            .then((res) => {
                setData({
                    histories: res.data.histories,
                    users: res.data.users,
                });
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleExport = () => {
        window.location.href = '/admin/api/reports/audit/export';
    };

    const filterCategories: FilterCategory[] = useMemo(
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

    return (
        <>
            <Head title="Jejak Audit Sistem" />

            <div className="bg-background flex flex-1 flex-col space-y-6 p-6">
                {/* Header Section */}
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div className="space-y-1">
                        <h1 className="text-foreground font-montserrat flex items-center gap-3 text-2xl font-bold tracking-tight">
                            <ShieldCheck className="h-7 w-7 text-emerald-600" />
                            Jejak Audit Sistem
                        </h1>
                        <p className="text-muted-foreground text-sm font-medium">
                            Rekam jejak seluruh aktivitas dan perubahan data dalam sistem kontrak.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setIsFilterOpen(true)}
                            className="bg-card border-border text-foreground hover:bg-muted font-bold shadow-sm"
                        >
                            <Filter className="mr-2 h-4 w-4" />
                            Filter Log
                        </Button>
                        <Button onClick={handleExport} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-sm">
                            <Download className="mr-2 h-4 w-4" />
                            Ekspor Audit Trail
                        </Button>
                    </div>
                </div>

                {/* Audit Console */}
                <div className="bg-card border-border flex flex-1 flex-col overflow-hidden rounded-2xl border shadow-sm">
                    <div className="border-border bg-muted/30 flex items-center justify-between border-b p-4">
                        <div className="flex items-center gap-2">
                            <Terminal className="text-muted-foreground h-4 w-4" />
                            <span className="text-muted-foreground text-xs font-bold tracking-wider uppercase">Activity_Logs_Terminal</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                            <span className="text-muted-foreground text-xs font-semibold tracking-tight uppercase">Live Monitor Active</span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto p-0">
                        <table className="w-full border-collapse text-left">
                            <thead className="bg-card border-border sticky top-0 z-10 border-b">
                                <tr>
                                    <th className="text-muted-foreground w-48 px-6 py-4 text-xs font-bold tracking-wider uppercase">
                                        Waktu & Tanggal
                                    </th>
                                    <th className="text-muted-foreground w-32 px-6 py-4 text-center text-xs font-bold tracking-wider uppercase">
                                        Aksi
                                    </th>
                                    <th className="text-muted-foreground px-6 py-4 text-xs font-bold tracking-wider uppercase">Detail Aktivitas</th>
                                    <th className="text-muted-foreground w-48 px-6 py-4 text-right text-xs font-bold tracking-wider uppercase">
                                        Pelaku
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-border divide-y">
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} className="py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <i className="fa-solid fa-spinner fa-spin text-primary text-2xl" />
                                                <p className="text-muted-foreground text-sm font-semibold tracking-wider uppercase">
                                                    Memuat database log...
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : data?.histories.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="text-muted-foreground py-20 text-center">
                                            Tidak ada data log yang ditemukan.
                                        </td>
                                    </tr>
                                ) : (
                                    data?.histories.map((log) => (
                                        <tr key={log.id} className="group hover:bg-muted/20 transition-all">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-foreground font-mono text-sm font-bold">
                                                        {new Date(log.created_at).toLocaleTimeString('id-ID', { hour12: false })}
                                                    </span>
                                                    <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                                                        {new Date(log.created_at).toLocaleDateString('id-ID', {
                                                            day: '2-digit',
                                                            month: 'short',
                                                            year: 'numeric',
                                                        })}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-center">
                                                    <ActionBadge action={log.action} />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2">
                                                        <FileText className="text-primary/70 h-4 w-4" />
                                                        <span className="text-primary text-xs font-bold tracking-wide uppercase">
                                                            {log.contract_no}
                                                        </span>
                                                    </div>
                                                    <p className="text-foreground/80 text-sm leading-relaxed font-medium">{log.description}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-3 transition-transform group-hover:translate-x-[-4px]">
                                                    <div className="flex flex-col">
                                                        <span className="text-primary text-xs font-bold tracking-tight uppercase">
                                                            @{log.actor.split(' ')[0]}
                                                        </span>
                                                        <span className="text-muted-foreground text-xs font-medium">{log.actor}</span>
                                                    </div>
                                                    <div className="bg-muted border-border flex h-8 w-8 items-center justify-center rounded-full border">
                                                        <User className="text-muted-foreground h-4 w-4" />
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="border-border bg-muted/30 flex items-center justify-between border-t p-4">
                        <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                            Showing {data?.histories.length || 0} transaction records
                        </p>
                        <div className="flex items-center gap-4">
                            <span className="text-muted-foreground/40 text-xs font-bold uppercase">SYSTEM_V2.0_AUDIT_LOG_END</span>
                        </div>
                    </div>
                </div>
            </div>

            <FilterSheet
                isOpen={isFilterOpen}
                onOpenChange={setIsFilterOpen}
                title="Filter Jejak Audit"
                description="Tentukan kriteria log yang ingin Anda tampilkan."
                categories={filterCategories}
                activeFilters={filters}
                onFilterChange={(key, val) => setFilters((p) => ({ ...p, [key]: val }))}
                onReset={() => setFilters({ date_from: '', date_to: '', creator_ids: [] })}
                applyText="Tampilkan Log"
            />
        </>
    );
}

function ActionBadge({ action }: { action: string }) {
    const act = action.toLowerCase();

    if (act.includes('approve') || act.includes('success')) {
        return (
            <span className="flex w-fit items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold tracking-wider text-emerald-700 uppercase dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
                <CheckCircle className="h-3.5 w-3.5" />
                {action}
            </span>
        );
    }

    if (act.includes('reject') || act.includes('delete') || act.includes('cancel')) {
        return (
            <span className="flex w-fit items-center gap-1.5 rounded-full border border-rose-100 bg-rose-50 px-3 py-1 text-xs font-semibold tracking-wider text-rose-700 uppercase dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400">
                <AlertCircle className="h-3.5 w-3.5" />
                {action}
            </span>
        );
    }

    if (act.includes('create') || act.includes('submit')) {
        return (
            <span className="flex w-fit items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold tracking-wider text-blue-700 uppercase dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400">
                <ArrowRight className="h-3.5 w-3.5" />
                {action}
            </span>
        );
    }

    return (
        <span className="bg-muted text-muted-foreground border-border flex w-fit items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold tracking-wider uppercase">
            <Clock className="h-3.5 w-3.5" />
            {action}
        </span>
    );
}
