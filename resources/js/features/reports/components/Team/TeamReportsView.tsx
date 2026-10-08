import { Button } from '@/components/ui/buttons/Button';
import { SearchInput } from '@/components/ui/inputs/SearchInput';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/selection/Select';
import { cn } from '@/lib/utils';
import { ArrowDown, ArrowUp, ArrowUpDown, Calendar, FileSpreadsheet, Loader2, Send, UserCheck, Users } from 'lucide-react';
import React from 'react';
import { useTeamReport } from '../../hooks/useTeamReport';
import type { TeamMatrixItem } from '../../types/reports.types';
import { MONTH_NAMES } from '../../utils/reportsUtils';

export function TeamReportsView() {
    const {
        data,
        loading,
        exportLoading,
        roleType,
        setRoleType,
        selectedYear,
        setSelectedYear,
        searchQuery,
        setSearchQuery,
        sortField,
        sortDirection,
        handleSort,
        handleExport,
        sortedMatrix,
    } = useTeamReport();

    const roleLabel = roleType === 'pic' ? 'Sebagai PIC' : 'Sebagai Pengaju';
    const currentOrgGroupName = data?.currentOrgGroup?.name || 'Organization Group';

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
        <div className="bg-surface-base flex h-full min-h-0 flex-1 flex-col overflow-hidden select-none">
            {/* Header Bar */}
            <div className="border-surface-border box-border flex h-16 max-h-[64px] min-h-[64px] shrink-0 items-center justify-between border-b bg-white px-5 dark:bg-zinc-900">
                <div className="mr-4 flex min-w-0 items-center gap-2.5">
                    <div className="bg-primary/10 text-primary dark:bg-primary/20 flex h-8 w-8 shrink-0 items-center justify-center rounded-[4px]">
                        {roleType === 'pic' ? <UserCheck size={16} /> : <Send size={16} />}
                    </div>
                    <div className="flex min-w-0 flex-col justify-center">
                        <div className="flex items-center gap-2">
                            <h1 className="truncate text-sm leading-tight font-bold text-black dark:text-white">
                                Laporan Rekapitulasi Tim ({roleLabel})
                            </h1>
                            <span className="bg-primary/10 py-0.2 text-primary rounded-[4px] px-1.5 text-[10px] font-bold">
                                {currentOrgGroupName}
                            </span>
                        </div>
                        <p className="mt-0.5 truncate text-[11px] leading-tight text-zinc-500 dark:text-zinc-400">
                            Rekapitulasi bulanan jumlah {roleType === 'pic' ? 'pengerjaan PIC' : 'pengajuan'} kontrak per anggota dalam group yang
                            sama.
                        </p>
                    </div>
                </div>

                {/* Header Controls */}
                <div className="flex flex-wrap items-center gap-2">
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

                    <div className="w-48 sm:w-56">
                        <SearchInput
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari nama anggota..."
                            className="border-surface-border bg-surface-muted/20 focus:border-primary h-8 rounded-[4px] text-xs shadow-none placeholder:text-zinc-400 dark:bg-zinc-900"
                        />
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExport}
                        disabled={exportLoading || loading}
                        className="h-8 cursor-pointer gap-1.5 rounded-[4px] border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-none transition-all hover:border-emerald-300 hover:bg-emerald-50/60 hover:text-emerald-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-emerald-800 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-400"
                        title="Export laporan rekapitulasi tim ke format Excel"
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

            {/* Underline Tab Bar */}
            <div className="border-surface-border flex shrink-0 items-center gap-6 border-b bg-white px-5 dark:bg-zinc-900">
                <button
                    type="button"
                    onClick={() => setRoleType('creator')}
                    className={cn(
                        'relative -mb-px flex items-center gap-2 border-b-2 py-3 text-xs font-bold transition-all',
                        roleType === 'creator'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-white',
                    )}
                >
                    <Send size={13} />
                    <span>Sebagai Pengaju</span>
                </button>
                <button
                    type="button"
                    onClick={() => setRoleType('pic')}
                    className={cn(
                        'relative -mb-px flex items-center gap-2 border-b-2 py-3 text-xs font-bold transition-all',
                        roleType === 'pic'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-white',
                    )}
                >
                    <UserCheck size={13} />
                    <span>Sebagai PIC</span>
                </button>
            </div>

            {/* Table Body */}
            <div className="custom-scrollbar flex-1 overflow-auto p-5">
                {loading ? (
                    <div className="text-primary flex h-64 flex-col items-center justify-center gap-2">
                        <Loader2 size={32} className="animate-spin" />
                        <span className="text-xs font-bold text-black dark:text-white">Memuat data rekapitulasi tim...</span>
                    </div>
                ) : (
                    <div className="border-surface-border rounded-[4px] border bg-white dark:bg-zinc-900">
                        <div className="border-surface-border flex items-center justify-between border-b p-3">
                            <div className="flex items-center gap-2">
                                {roleType === 'pic' ? (
                                    <UserCheck size={16} className="text-primary" />
                                ) : (
                                    <Users size={16} className="text-primary" />
                                )}
                                <h3 className="text-xs font-bold tracking-wider text-black uppercase dark:text-white">
                                    Tabel Rekapitulasi Anggota {currentOrgGroupName} ({roleLabel}) - {selectedYear}
                                </h3>
                            </div>
                            <span className="text-[11px] font-semibold text-zinc-500">
                                Total: {data?.summary?.totalSubmissions ?? 0} Kontrak | {sortedMatrix.length} Anggota
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
                                            onClick={() => handleSort('user_name')}
                                            className={cn(
                                                'border-surface-border group sticky left-10 z-20 min-w-[220px] cursor-pointer border-r bg-zinc-50 px-3 py-2.5 transition-colors select-none hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700/60',
                                                sortField === 'user_name' && 'text-primary dark:text-primary',
                                            )}
                                            title="Urutkan berdasarkan Nama Anggota"
                                        >
                                            <div className="flex items-center justify-between gap-1.5">
                                                <span>Nama Anggota Tim</span>
                                                {renderSortIcon('user_name')}
                                            </div>
                                        </th>
                                        <th
                                            onClick={() => handleSort('department_name')}
                                            className={cn(
                                                'border-surface-border group min-w-[140px] cursor-pointer border-r px-3 py-2.5 transition-colors select-none hover:bg-zinc-100 dark:hover:bg-zinc-700/60',
                                                sortField === 'department_name' &&
                                                    'text-primary dark:text-primary bg-zinc-100/80 dark:bg-zinc-700/40',
                                            )}
                                            title="Urutkan berdasarkan Departemen"
                                        >
                                            <div className="flex items-center justify-between gap-1.5">
                                                <span>Departemen</span>
                                                {renderSortIcon('department_name')}
                                            </div>
                                        </th>
                                        <th
                                            onClick={() => handleSort('org_group_name')}
                                            className={cn(
                                                'border-surface-border group min-w-[160px] cursor-pointer border-r px-3 py-2.5 transition-colors select-none hover:bg-zinc-100 dark:hover:bg-zinc-700/60',
                                                sortField === 'org_group_name' &&
                                                    'text-primary dark:text-primary bg-zinc-100/80 dark:bg-zinc-700/40',
                                            )}
                                            title="Urutkan berdasarkan Organization Group"
                                        >
                                            <div className="flex items-center justify-between gap-1.5">
                                                <span>Organization Group</span>
                                                {renderSortIcon('org_group_name')}
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
                                    {sortedMatrix.length === 0 ? (
                                        <tr>
                                            <td colSpan={17} className="py-12 text-center text-xs text-zinc-500">
                                                Tidak ada data anggota dalam Organization Group ini.
                                            </td>
                                        </tr>
                                    ) : (
                                        sortedMatrix.map((row: TeamMatrixItem, idx: number) => {
                                            return (
                                                <tr
                                                    key={row.user_id || idx}
                                                    className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                                                >
                                                    <td className="border-surface-border sticky left-0 z-10 border-r bg-white px-3 py-2 text-center text-zinc-500 dark:bg-zinc-900">
                                                        {idx + 1}
                                                    </td>
                                                    <td className="border-surface-border sticky left-10 z-10 border-r bg-white px-3 py-2 font-semibold text-black dark:bg-zinc-900 dark:text-white">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-black dark:text-white">{row.user_name}</span>
                                                            {row.user_email && (
                                                                <span className="text-[10px] text-zinc-400">{row.user_email}</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="border-surface-border border-r px-3 py-2 text-zinc-700 dark:text-zinc-300">
                                                        <span className="rounded-[4px] bg-blue-50 px-1.5 py-0.5 text-[11px] font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                                                            {row.department_name || '-'}
                                                        </span>
                                                    </td>
                                                    <td className="border-surface-border border-r px-3 py-2 text-zinc-700 dark:text-zinc-300">
                                                        <span className="rounded-[4px] bg-zinc-100 px-1.5 py-0.5 text-[11px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                                                            {row.org_group_name || '-'}
                                                        </span>
                                                    </td>

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
                                {sortedMatrix.length > 0 && data?.monthlyTotals && (
                                    <tfoot>
                                        <tr className="border-surface-border border-t-2 bg-zinc-100 font-black text-black dark:bg-zinc-800 dark:text-white">
                                            <td
                                                colSpan={4}
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
    );
}
export default TeamReportsView;
