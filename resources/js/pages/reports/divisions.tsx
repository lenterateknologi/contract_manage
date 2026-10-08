import { DivisionReportResponse, reportsApi } from '@/api';
import { Button } from '@/components/ui/buttons/Button';
import { useToast } from '@/components/ui/feedback/Toast';
import { SearchInput } from '@/components/ui/inputs/SearchInput';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/selection/Select';
import { cn } from '@/lib/utils';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { ArrowDown, ArrowUp, ArrowUpDown, Calendar, FileSpreadsheet, Loader2, Network } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const MONTH_NAMES = [
    { num: 1, short: 'Jan', full: 'Januari' },
    { num: 2, short: 'Feb', full: 'Februari' },
    { num: 3, short: 'Mar', full: 'Maret' },
    { num: 4, short: 'Apr', full: 'April' },
    { num: 5, short: 'Mei', full: 'Mei' },
    { num: 6, short: 'Jun', full: 'Juni' },
    { num: 7, short: 'Jul', full: 'Juli' },
    { num: 8, short: 'Ags', full: 'Agustus' },
    { num: 9, short: 'Sep', full: 'September' },
    { num: 10, short: 'Okt', full: 'Oktober' },
    { num: 11, short: 'Nov', full: 'November' },
    { num: 12, short: 'Des', full: 'Desember' },
];

export default function DivisionReportsPage({ breadcrumbs }: { breadcrumbs?: BreadcrumbItem[] }) {
    const { showToast } = useToast();
    const [data, setData] = useState<DivisionReportResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [exportLoading, setExportLoading] = useState(false);

    // Filters state
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [searchQuery, setSearchQuery] = useState<string>('');

    // Sorting state (field can be 'name', 'total', or month index 1..12)
    const [sortField, setSortField] = useState<string | number>('total');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    const handleSort = (field: string | number) => {
        if (sortField === field) {
            setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortField(field);
            if (typeof field === 'number' || field === 'total') {
                setSortDirection('desc');
            } else {
                setSortDirection('asc');
            }
        }
    };

    const fetchData = () => {
        setLoading(true);
        const params: Record<string, any> = {
            year: selectedYear,
            group_by: 'org_group',
            search: searchQuery,
        };

        reportsApi
            .getDivisionMonthly(params)
            .then((res) => {
                setData(res);
                if (res.year && res.year !== selectedYear) {
                    setSelectedYear(res.year);
                }
                setLoading(false);
            })
            .catch(() => {
                showToast('Gagal memuat data laporan organization group.', 'danger');
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchData();
    }, [selectedYear]);

    const handleExport = () => {
        setExportLoading(true);
        try {
            const params: Record<string, any> = {
                year: selectedYear,
                group_by: 'org_group',
                search: searchQuery,
            };

            const url = reportsApi.getExportDivisionsUrl(params);
            window.location.href = url;
            showToast('Mengunduh laporan rekapitulasi organization group...', 'success');
        } catch {
            showToast('Gagal mengekspor laporan.', 'danger');
        } finally {
            setTimeout(() => setExportLoading(false), 1500);
        }
    };

    // Active matrix items filtered by local search and sorted
    const activeMatrixList = useMemo(() => {
        if (!data?.matrix) return [];
        let list = [...data.matrix];

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(
                (item: any) =>
                    (item.org_group_name || item.division_name || '').toLowerCase().includes(q) ||
                    (item.org_group_code || item.division_code || '').toLowerCase().includes(q),
            );
        }

        if (sortField !== null) {
            list.sort((a, b) => {
                let comparison = 0;
                if (typeof sortField === 'number') {
                    const valA = a.months?.[sortField] ?? 0;
                    const valB = b.months?.[sortField] ?? 0;
                    comparison = valA - valB;
                } else if (sortField === 'total') {
                    comparison = (a.total ?? 0) - (b.total ?? 0);
                } else {
                    const nameA = a.org_group_name || a.division_name || '';
                    const nameB = b.org_group_name || b.division_name || '';
                    comparison = String(nameA).localeCompare(String(nameB), undefined, { sensitivity: 'base', numeric: true });
                }

                if (comparison !== 0) {
                    return sortDirection === 'asc' ? comparison : -comparison;
                }
                const fallbackA = a.org_group_name || a.division_name || '';
                const fallbackB = b.org_group_name || b.division_name || '';
                return String(fallbackA).localeCompare(String(fallbackB));
            });
        }

        return list;
    }, [data?.matrix, searchQuery, sortField, sortDirection]);

    const renderSortIcon = (field: string | number) => {
        const isActive = sortField === field;
        if (!isActive) {
            return <ArrowUpDown size={11} className="shrink-0 text-zinc-400 opacity-40 transition-opacity group-hover:opacity-100" />;
        }
        return sortDirection === 'asc' ? (
            <ArrowUp size={11} className="text-primary shrink-0" />
        ) : (
            <ArrowDown size={11} className="text-primary shrink-0" />
        );
    };

    return (
        <>
            <Head title="Laporan Rekapitulasi Pengajuan per Organization Group" />

            <div className="bg-surface-base flex h-full min-h-0 flex-1 flex-col overflow-hidden select-none">
                {/* --- HEADER BAR (Height h-16 matching sidebar/sub-sidebar header) --- */}
                <div className="border-surface-border box-border flex h-16 max-h-[64px] min-h-[64px] shrink-0 items-center justify-between border-b bg-white px-5 dark:bg-zinc-900">
                    <div className="mr-4 flex min-w-0 items-center gap-2.5">
                        <div className="bg-primary/10 text-primary dark:bg-primary/20 flex h-8 w-8 shrink-0 items-center justify-center rounded-[4px]">
                            <Network size={16} />
                        </div>
                        <div className="flex min-w-0 flex-col justify-center">
                            <h1 className="truncate text-sm leading-tight font-bold text-black dark:text-white">
                                Laporan Rekapitulasi Pengajuan Org Group
                            </h1>
                            <p className="mt-0.5 truncate text-[11px] leading-tight text-zinc-500 dark:text-zinc-400">
                                Rekapitulasi bulanan jumlah pengajuan kontrak per Organization Group aktif.
                            </p>
                        </div>
                    </div>

                    {/* Header Controls: Search, Year, Export */}
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Year Selector */}
                        <div className="w-28">
                            <Select value={String(selectedYear)} onValueChange={(val) => setSelectedYear(Number(val))}>
                                <SelectTrigger className="border-surface-border bg-surface-muted/20 h-8 rounded-[4px] text-xs font-semibold shadow-none dark:bg-zinc-900">
                                    <div className="flex items-center gap-1.5 truncate">
                                        <Calendar size={13} className="shrink-0 text-zinc-500" />
                                        <SelectValue placeholder="Tahun" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="border-surface-border rounded-[4px] bg-white text-xs shadow-none dark:bg-zinc-900">
                                    {(data?.availableYears || [new Date().getFullYear()]).map((y) => (
                                        <SelectItem key={y} value={String(y)} className="rounded-[2px] text-xs">
                                            {y}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Search Input */}
                        <div className="w-48 sm:w-56">
                            <SearchInput
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Cari Organization Group..."
                                className="border-surface-border bg-surface-muted/20 focus:border-primary h-8 rounded-[4px] text-xs shadow-none placeholder:text-zinc-400 dark:bg-zinc-900"
                            />
                        </div>

                        {/* Export Button */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExport}
                            disabled={exportLoading || loading}
                            className="h-8 cursor-pointer gap-1.5 rounded-[4px] border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-none transition-all hover:border-emerald-300 hover:bg-emerald-50/60 hover:text-emerald-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-emerald-800 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-400"
                            title="Export laporan rekapitulasi per organization group"
                        >
                            {exportLoading ? (
                                <Loader2 size={13} className="animate-spin text-emerald-600" />
                            ) : (
                                <FileSpreadsheet size={13} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                            )}
                            <span>{exportLoading ? 'Mengunduh...' : 'Export Excel'}</span>
                        </Button>
                    </div>
                </div>

                {/* --- MAIN CONTENT BODY (TABLE ONLY) --- */}
                <div className="custom-scrollbar flex-1 overflow-auto p-5">
                    {loading ? (
                        <div className="text-primary flex h-64 flex-col items-center justify-center gap-2">
                            <Loader2 size={32} className="animate-spin" />
                            <span className="text-xs font-bold text-black dark:text-white">Memuat data rekapitulasi organization group...</span>
                        </div>
                    ) : (
                        <div className="border-surface-border rounded-[4px] border bg-white dark:bg-zinc-900">
                            <div className="border-surface-border flex items-center justify-between border-b p-3">
                                <div className="flex items-center gap-2">
                                    <Network size={16} className="text-primary" />
                                    <h3 className="text-xs font-bold tracking-wider text-black uppercase dark:text-white">
                                        Tabel Rekapitulasi Pengajuan per Bulan ({selectedYear})
                                    </h3>
                                </div>
                                <span className="text-[11px] font-semibold text-zinc-500">
                                    Total: {data?.summary?.totalSubmissions ?? 0} Pengajuan
                                </span>
                            </div>
                            <div className="custom-scrollbar overflow-x-auto">
                                <table className="w-full border-collapse text-left text-xs">
                                    <thead>
                                        <tr className="border-surface-border border-b bg-zinc-50 text-[11px] font-bold text-black uppercase dark:bg-zinc-800 dark:text-white">
                                            <th className="border-surface-border sticky left-0 z-20 w-10 border-r bg-zinc-50 px-3 py-2.5 text-center dark:bg-zinc-800">
                                                No
                                            </th>
                                            <th
                                                onClick={() => handleSort('name')}
                                                className={cn(
                                                    'border-surface-border group sticky left-10 z-20 min-w-[240px] cursor-pointer border-r bg-zinc-50 px-3 py-2.5 transition-colors select-none hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700/60',
                                                    sortField === 'name' && 'text-primary dark:text-primary',
                                                )}
                                                title="Urutkan berdasarkan Organization Group"
                                            >
                                                <div className="flex items-center justify-between gap-1.5">
                                                    <span>Organization Group</span>
                                                    {renderSortIcon('name')}
                                                </div>
                                            </th>
                                            {MONTH_NAMES.map((m) => (
                                                <th
                                                    key={m.num}
                                                    onClick={() => handleSort(m.num)}
                                                    className={cn(
                                                        'border-surface-border group min-w-[56px] cursor-pointer border-r px-2 py-2.5 text-center transition-colors select-none hover:bg-zinc-100 dark:hover:bg-zinc-700/60',
                                                        sortField === m.num && 'text-primary dark:text-primary bg-zinc-100/80 dark:bg-zinc-700/40',
                                                    )}
                                                    title={`Urutkan berdasarkan bulan ${m.full}`}
                                                >
                                                    <div className="flex items-center justify-center gap-1">
                                                        <span>{m.short}</span>
                                                        {renderSortIcon(m.num)}
                                                    </div>
                                                </th>
                                            ))}
                                            <th
                                                onClick={() => handleSort('total')}
                                                className={cn(
                                                    'border-surface-border group sticky right-0 z-20 min-w-[80px] cursor-pointer border-l bg-zinc-100 px-3 py-2.5 text-center font-black transition-colors select-none hover:bg-zinc-200/80 dark:bg-zinc-800 dark:hover:bg-zinc-700/80',
                                                    sortField === 'total' && 'text-primary dark:text-primary',
                                                )}
                                                title="Urutkan berdasarkan Total"
                                            >
                                                <div className="flex items-center justify-center gap-1">
                                                    <span>Total</span>
                                                    {renderSortIcon('total')}
                                                </div>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-surface-border divide-y">
                                        {activeMatrixList.length === 0 ? (
                                            <tr>
                                                <td colSpan={15} className="py-12 text-center text-xs text-zinc-500">
                                                    Tidak ada data pengajuan ditemukan.
                                                </td>
                                            </tr>
                                        ) : (
                                            activeMatrixList.map((row: any, idx: number) => {
                                                const name = row.org_group_name || row.division_name;
                                                const code = row.org_group_code || row.division_code;
                                                return (
                                                    <tr
                                                        key={row.org_group_id || row.division_id || idx}
                                                        className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                                                    >
                                                        <td className="border-surface-border sticky left-0 z-10 border-r bg-white px-3 py-2 text-center text-zinc-500 dark:bg-zinc-900">
                                                            {idx + 1}
                                                        </td>
                                                        <td className="border-surface-border sticky left-10 z-10 border-r bg-white px-3 py-2 font-semibold text-black dark:bg-zinc-900 dark:text-white">
                                                            <div className="flex items-center gap-1.5">
                                                                <Network size={13} className="text-zinc-400" />
                                                                <span>{name}</span>
                                                                {code && code !== '-' && (
                                                                    <span className="py-0.2 rounded-[4px] bg-zinc-100 px-1 text-[9px] font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                                                                        {code}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>

                                                        {/* 12 Months Cells */}
                                                        {MONTH_NAMES.map((m) => {
                                                            const count = row.months[m.num] ?? 0;
                                                            return (
                                                                <td
                                                                    key={m.num}
                                                                    className={cn(
                                                                        'border-surface-border border-r px-2 py-2 text-center font-medium',
                                                                        count > 0 ? 'text-black dark:text-white' : 'text-zinc-300 dark:text-zinc-600',
                                                                    )}
                                                                >
                                                                    {count > 0 ? (
                                                                        <span className="bg-primary/10 text-primary dark:bg-primary/20 inline-flex min-w-[20px] items-center justify-center rounded-[4px] px-1.5 py-0.5 text-xs font-bold">
                                                                            {count}
                                                                        </span>
                                                                    ) : (
                                                                        '-'
                                                                    )}
                                                                </td>
                                                            );
                                                        })}

                                                        {/* Row Total */}
                                                        <td className="border-surface-border sticky right-0 z-10 border-l bg-zinc-50 px-3 py-2 text-center font-black text-black dark:bg-zinc-800/80 dark:text-white">
                                                            {row.total > 0 ? (
                                                                <span className="text-primary text-xs font-black">{row.total}</span>
                                                            ) : (
                                                                '0'
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                    {/* Table Footer Totals */}
                                    {activeMatrixList.length > 0 && data?.monthlyTotals && (
                                        <tfoot>
                                            <tr className="border-surface-border border-t-2 bg-zinc-100 font-black text-black dark:bg-zinc-800 dark:text-white">
                                                <td
                                                    colSpan={2}
                                                    className="border-surface-border sticky left-0 z-20 border-r bg-zinc-100 px-3 py-2.5 text-right tracking-wider uppercase dark:bg-zinc-800"
                                                >
                                                    Total Keseluruhan
                                                </td>
                                                {MONTH_NAMES.map((m) => {
                                                    const colTotal = data.monthlyTotals[m.num] ?? 0;
                                                    return (
                                                        <td
                                                            key={m.num}
                                                            className="border-surface-border border-r px-2 py-2.5 text-center text-xs font-black"
                                                        >
                                                            {colTotal > 0 ? <span className="text-primary font-black">{colTotal}</span> : '0'}
                                                        </td>
                                                    );
                                                })}
                                                <td className="border-surface-border bg-primary/20 text-primary dark:bg-primary/30 sticky right-0 z-20 border-l px-3 py-2.5 text-center text-sm font-black">
                                                    {data.summary?.totalSubmissions ?? 0}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    )}
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
