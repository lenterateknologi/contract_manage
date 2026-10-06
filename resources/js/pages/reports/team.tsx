import { Button } from '@/components/ui/buttons/Button';
import { useToast } from '@/components/ui/feedback/Toast';
import { SearchInput } from '@/components/ui/inputs/SearchInput';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/selection/Select';
import { cn } from '@/lib/utils';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { reportsApi, TeamReportResponse, TeamMatrixItem } from '@/api';
import {
    Users,
    Calendar,
    FileSpreadsheet,
    Loader2,
    Search,
    UserCheck,
    Send,
    Network,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

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

export default function TeamReportsPage({ breadcrumbs }: { breadcrumbs?: BreadcrumbItem[] }) {
    const { showToast } = useToast();
    const [data, setData] = useState<TeamReportResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [exportLoading, setExportLoading] = useState(false);

    // State: Role type ('creator' = Sebagai Pengaju vs 'pic' = Sebagai PIC)
    const [roleType, setRoleType] = useState<'creator' | 'pic'>('creator');
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [selectedOrgGroupId, setSelectedOrgGroupId] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState<string>('');

    const fetchData = (overrideParams: Record<string, any> = {}) => {
        setLoading(true);
        const activeRoleType = overrideParams.role_type !== undefined ? overrideParams.role_type : roleType;
        const activeOrgGroupId = overrideParams.org_group_id !== undefined ? overrideParams.org_group_id : selectedOrgGroupId;
        const activeYear = overrideParams.year !== undefined ? overrideParams.year : selectedYear;

        const params: Record<string, any> = {
            year: activeYear,
            role_type: activeRoleType,
            org_group_id: activeOrgGroupId || undefined,
            search: searchQuery,
        };

        reportsApi
            .getTeamMonthly(params)
            .then((res) => {
                setData(res);
                if (res.year && res.year !== selectedYear) {
                    setSelectedYear(res.year);
                }
                if (res.currentOrgGroup && (!selectedOrgGroupId || overrideParams.org_group_id !== undefined)) {
                    setSelectedOrgGroupId(res.currentOrgGroup.id);
                }
                setLoading(false);
            })
            .catch(() => {
                showToast('Gagal memuat data laporan tim.', 'danger');
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchData();
    }, [selectedYear, roleType, selectedOrgGroupId]);

    const handleRoleTypeChange = (newRoleType: 'creator' | 'pic') => {
        if (newRoleType === roleType) return;
        setRoleType(newRoleType);
    };

    const handleOrgGroupChange = (newOrgId: string) => {
        setSelectedOrgGroupId(newOrgId);
    };

    const handleExport = () => {
        setExportLoading(true);
        try {
            const params: Record<string, any> = {
                year: selectedYear,
                role_type: roleType,
                org_group_id: selectedOrgGroupId,
                search: searchQuery,
            };

            const url = reportsApi.getExportTeamUrl(params);
            window.location.href = url;
            showToast('Mengunduh laporan rekapitulasi tim...', 'success');
        } catch {
            showToast('Gagal mengekspor laporan.', 'danger');
        } finally {
            setTimeout(() => setExportLoading(false), 1500);
        }
    };

    // Active matrix items filtered by local search
    const activeMatrixList = useMemo(() => {
        if (!data?.matrix) return [];
        if (!searchQuery.trim()) return data.matrix;
        const q = searchQuery.toLowerCase();
        return data.matrix.filter(
            (item: TeamMatrixItem) =>
                (item.user_name || '').toLowerCase().includes(q) ||
                (item.user_email || '').toLowerCase().includes(q) ||
                (item.user_nik || '').toLowerCase().includes(q) ||
                (item.division_name || '').toLowerCase().includes(q) ||
                (item.org_group_name || '').toLowerCase().includes(q),
        );
    }, [data?.matrix, searchQuery]);

    const roleLabel = roleType === 'pic' ? 'Sebagai PIC' : 'Sebagai Pengaju';
    const currentOrgGroupName = data?.currentOrgGroup?.name || 'Organization Group';

    return (
        <>
            <Head title={`Laporan Rekapitulasi Tim (${roleLabel})`} />

            <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-surface-base select-none">
                {/* --- HEADER BAR (Height h-16 matching sidebar/sub-sidebar header) --- */}
                <div className="flex h-16 min-h-[64px] max-h-[64px] shrink-0 items-center justify-between border-b border-surface-border bg-white px-5 dark:bg-zinc-900 box-border">
                    <div className="flex items-center gap-2.5 min-w-0 mr-4">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[4px] bg-primary/10 text-primary dark:bg-primary/20">
                            {roleType === 'pic' ? <UserCheck size={16} /> : <Send size={16} />}
                        </div>
                        <div className="flex flex-col justify-center min-w-0">
                            <div className="flex items-center gap-2">
                                <h1 className="text-sm font-bold text-black dark:text-white leading-tight truncate">
                                    Laporan Rekapitulasi Tim ({roleLabel})
                                </h1>
                                <span className="rounded-[4px] bg-primary/10 px-1.5 py-0.2 text-[10px] font-bold text-primary">
                                    {currentOrgGroupName}
                                </span>
                            </div>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-tight truncate mt-0.5">
                                Rekapitulasi bulanan jumlah {roleType === 'pic' ? 'pengerjaan PIC' : 'pengajuan'} kontrak per anggota dalam group yang sama.
                            </p>
                        </div>
                    </div>

                    {/* Header Controls */}
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Org Group Selector (Commented out)
                        <div className="flex items-center gap-1.5 rounded-[4px] border border-surface-border bg-surface-muted/30 px-2.5 py-1 text-xs">
                            <Network size={13} className="text-zinc-500 dark:text-zinc-400" />
                            <span className="font-semibold text-black dark:text-white">Org Group:</span>
                            <select
                                value={selectedOrgGroupId}
                                onChange={(e) => handleOrgGroupChange(e.target.value)}
                                className="max-w-[200px] cursor-pointer bg-transparent text-xs font-bold text-primary outline-none"
                            >
                                {(data?.organizationGroups || []).map((og) => (
                                    <option key={og.id} value={og.id} className="bg-white text-black dark:bg-zinc-800 dark:text-white">
                                        {og.name} ({og.user_count || 0})
                                    </option>
                                ))}
                            </select>
                        </div>
                        */}

                        {/* Year Selector */}
                        <div className="w-28">
                            <Select
                                value={String(selectedYear)}
                                onValueChange={(val) => setSelectedYear(Number(val))}
                            >
                                <SelectTrigger className="h-8 rounded-[4px] border-surface-border bg-surface-muted/20 text-xs font-semibold shadow-none dark:bg-zinc-900">
                                    <div className="flex items-center gap-1.5 truncate">
                                        <Calendar size={13} className="text-zinc-500 shrink-0" />
                                        <SelectValue placeholder="Tahun" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="rounded-[4px] border-surface-border bg-white text-xs shadow-none dark:bg-zinc-900">
                                    {(data?.availableYears || [new Date().getFullYear()]).map((y) => (
                                        <SelectItem key={y} value={String(y)} className="rounded-[2px] text-xs">
                                            {y}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Search Box */}
                        <div className="w-48 sm:w-56">
                            <SearchInput
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Cari nama anggota..."
                                className="h-8 rounded-[4px] border-surface-border bg-surface-muted/20 text-xs shadow-none placeholder:text-zinc-400 focus:border-primary dark:bg-zinc-900"
                            />
                        </div>

                        {/* Export Button */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExport}
                            disabled={exportLoading || loading}
                            className="h-8 gap-1.5 rounded-[4px] px-3 text-xs font-semibold border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-200 hover:bg-emerald-50/60 hover:border-emerald-300 hover:text-emerald-700 dark:hover:bg-emerald-950/30 dark:hover:border-emerald-800 dark:hover:text-emerald-400 shadow-none transition-all cursor-pointer"
                            title="Export laporan rekapitulasi tim ke format Excel"
                        >
                            {exportLoading ? (
                                <Loader2 size={13} className="animate-spin text-emerald-600" />
                            ) : (
                                <FileSpreadsheet size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                            )}
                            <span>{exportLoading ? 'Mengunduh...' : 'Export Excel'}</span>
                        </Button>
                    </div>
                </div>

                {/* --- UNDERLINE TAB BAR (DI ATAS KONTEN DAN DI BAWAH NAVBAR) --- */}
                <div className="flex shrink-0 items-center gap-6 border-b border-surface-border bg-white px-5 dark:bg-zinc-900">
                    <button
                        type="button"
                        onClick={() => handleRoleTypeChange('creator')}
                        className={cn(
                            'relative -mb-px flex items-center gap-2 border-b-2 py-3 text-xs font-bold transition-all',
                            roleType === 'creator'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-white'
                        )}
                    >
                        <Send size={13} />
                        <span>Sebagai Pengaju</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => handleRoleTypeChange('pic')}
                        className={cn(
                            'relative -mb-px flex items-center gap-2 border-b-2 py-3 text-xs font-bold transition-all',
                            roleType === 'pic'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-white'
                        )}
                    >
                        <UserCheck size={13} />
                        <span>Sebagai PIC</span>
                    </button>
                </div>

                {/* --- MAIN CONTENT BODY (TABLE ONLY) --- */}
                <div className="flex-1 overflow-auto p-5 custom-scrollbar">
                    {loading ? (
                        <div className="flex h-64 flex-col items-center justify-center gap-2 text-primary">
                            <Loader2 size={32} className="animate-spin" />
                            <span className="text-xs font-bold text-black dark:text-white">Memuat data rekapitulasi tim...</span>
                        </div>
                    ) : (
                        <div className="rounded-[4px] border border-surface-border bg-white dark:bg-zinc-900">
                            <div className="flex items-center justify-between border-b border-surface-border p-3">
                                <div className="flex items-center gap-2">
                                    {roleType === 'pic' ? <UserCheck size={16} className="text-primary" /> : <Users size={16} className="text-primary" />}
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-black dark:text-white">
                                        Tabel Rekapitulasi Anggota {currentOrgGroupName} ({roleLabel}) - {selectedYear}
                                    </h3>
                                </div>
                                <span className="text-[11px] font-semibold text-zinc-500">
                                    Total: {data?.summary?.totalSubmissions ?? 0} Kontrak | {activeMatrixList.length} Anggota
                                </span>
                            </div>
                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full border-collapse text-left text-xs">
                                    <thead>
                                        <tr className="border-b border-surface-border bg-zinc-50 text-[11px] font-bold uppercase text-black dark:bg-zinc-800 dark:text-white">
                                            <th className="sticky left-0 z-20 w-10 border-r border-surface-border bg-zinc-50 px-3 py-2.5 text-center dark:bg-zinc-800">
                                                No
                                            </th>
                                            <th className="sticky left-10 z-20 min-w-[220px] border-r border-surface-border bg-zinc-50 px-3 py-2.5 dark:bg-zinc-800">
                                                Nama Anggota Tim
                                            </th>
                                            <th className="min-w-[140px] border-r border-surface-border px-3 py-2.5">
                                                Divisi
                                            </th>
                                            <th className="min-w-[160px] border-r border-surface-border px-3 py-2.5">
                                                Organization Group
                                            </th>
                                            {MONTH_NAMES.map((m) => (
                                                <th key={m.num} className="min-w-[56px] border-r border-surface-border px-2 py-2.5 text-center">
                                                    {m.short}
                                                </th>
                                            ))}
                                            <th className="sticky right-0 z-20 min-w-[80px] border-l border-surface-border bg-zinc-100 px-3 py-2.5 text-center font-black dark:bg-zinc-800">
                                                Total
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-surface-border">
                                        {activeMatrixList.length === 0 ? (
                                            <tr>
                                                <td colSpan={17} className="py-12 text-center text-xs text-zinc-500">
                                                    Tidak ada data anggota dalam Organization Group ini.
                                                </td>
                                            </tr>
                                        ) : (
                                            activeMatrixList.map((row: TeamMatrixItem, idx: number) => {
                                                return (
                                                    <tr
                                                        key={row.user_id || idx}
                                                        className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                                                    >
                                                        <td className="sticky left-0 z-10 border-r border-surface-border bg-white px-3 py-2 text-center text-zinc-500 dark:bg-zinc-900">
                                                            {idx + 1}
                                                        </td>
                                                        <td className="sticky left-10 z-10 border-r border-surface-border bg-white px-3 py-2 font-semibold text-black dark:bg-zinc-900 dark:text-white">
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-black dark:text-white">{row.user_name}</span>
                                                                {row.user_email && (
                                                                    <span className="text-[10px] text-zinc-400">
                                                                        {row.user_email}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="border-r border-surface-border px-3 py-2 text-zinc-700 dark:text-zinc-300">
                                                            <span className="rounded-[4px] bg-blue-50 px-1.5 py-0.5 text-[11px] font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                                                                {row.division_name || '-'}
                                                            </span>
                                                        </td>
                                                        <td className="border-r border-surface-border px-3 py-2 text-zinc-700 dark:text-zinc-300">
                                                            <span className="rounded-[4px] bg-zinc-100 px-1.5 py-0.5 text-[11px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                                                                {row.org_group_name || '-'}
                                                            </span>
                                                        </td>

                                                        {/* 12 Months Cells */}
                                                        {MONTH_NAMES.map((m) => {
                                                            const count = row.months[m.num] ?? 0;
                                                            return (
                                                                <td
                                                                    key={m.num}
                                                                    className={cn(
                                                                        'border-r border-surface-border px-2 py-2 text-center font-medium',
                                                                        count > 0
                                                                            ? 'text-black dark:text-white'
                                                                            : 'text-zinc-300 dark:text-zinc-600',
                                                                    )}
                                                                >
                                                                    {count > 0 ? (
                                                                        <span className="inline-flex min-w-[20px] items-center justify-center rounded-[4px] bg-primary/10 px-1.5 py-0.5 text-xs font-bold text-primary dark:bg-primary/20">
                                                                            {count}
                                                                        </span>
                                                                    ) : (
                                                                        '-'
                                                                    )}
                                                                </td>
                                                            );
                                                        })}

                                                        {/* Row Total */}
                                                        <td className="sticky right-0 z-10 border-l border-surface-border bg-zinc-50 px-3 py-2 text-center font-black text-black dark:bg-zinc-800/80 dark:text-white">
                                                            {row.total > 0 ? (
                                                                <span className="text-xs font-black text-primary">
                                                                    {row.total}
                                                                </span>
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
                                            <tr className="border-t-2 border-surface-border bg-zinc-100 font-black text-black dark:bg-zinc-800 dark:text-white">
                                                <td colSpan={4} className="sticky left-0 z-20 border-r border-surface-border bg-zinc-100 px-3 py-2.5 text-right uppercase tracking-wider dark:bg-zinc-800">
                                                    Total Keseluruhan
                                                </td>
                                                {MONTH_NAMES.map((m) => {
                                                    const colTotal = data.monthlyTotals[m.num] ?? 0;
                                                    return (
                                                        <td key={m.num} className="border-r border-surface-border px-2 py-2.5 text-center text-xs font-black">
                                                            {colTotal > 0 ? (
                                                                <span className="text-primary font-black">
                                                                    {colTotal}
                                                                </span>
                                                            ) : (
                                                                '0'
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                                <td className="sticky right-0 z-20 border-l border-surface-border bg-primary/20 px-3 py-2.5 text-center text-sm font-black text-primary dark:bg-primary/30">
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
