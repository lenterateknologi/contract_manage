import { useToast } from '@/components/ui/feedback/Toast';
import { useCallback, useEffect, useMemo, useState } from 'react';
import reportsService from '../services/reportsService';
import type { DivisionMatrixItem, DivisionReportResponse } from '../types/reports.types';

export function useDivisionReport() {
    const { showToast } = useToast();
    const [data, setData] = useState<DivisionReportResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [exportLoading, setExportLoading] = useState(false);

    const currentYear = new Date().getFullYear();
    const [dateFrom, setDateFrom] = useState<string>(`${currentYear}-01-01`);
    const [dateTo, setDateTo] = useState<string>(`${currentYear}-12-31`);
    const [selectedYear, setSelectedYear] = useState<number>(currentYear);
    const [searchQuery, setSearchQuery] = useState<string>('');

    const [sortField, setSortField] = useState<string | number>('total');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    const handleSort = (field: string | number) => {
        if (sortField === field) {
            setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortField(field);
            if (field === 'total' || field === 'average' || typeof field === 'number' || String(field).match(/^\d{4}-\d{2}$/)) {
                setSortDirection('desc');
            } else {
                setSortDirection('asc');
            }
        }
    };

    const handleDateRangeChange = (from: string, to: string) => {
        setDateFrom(from);
        setDateTo(to);
    };

    const fetchData = useCallback(() => {
        setLoading(true);
        reportsService
            .getDivisionMonthly({
                date_from: dateFrom,
                date_to: dateTo,
                year: selectedYear,
                group_by: 'org_group',
                search: searchQuery,
            })
            .then((res) => {
                setData(res);
                setLoading(false);
            })
            .catch(() => {
                setLoading(false);
                showToast('Gagal memuat data laporan divisi', 'error');
            });
    }, [dateFrom, dateTo, selectedYear, searchQuery, showToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleExport = () => {
        setExportLoading(true);
        try {
            const url = reportsService.getExportDivisionsUrl({
                date_from: dateFrom,
                date_to: dateTo,
                year: selectedYear,
                group_by: 'org_group',
                search: searchQuery,
            });
            window.location.href = url;
            showToast('Laporan berhasil diexport', 'success');
        } catch {
            showToast('Gagal mengunduh laporan Excel', 'error');
        } finally {
            setExportLoading(false);
        }
    };

    const sortedMatrix = useMemo(() => {
        if (!data?.matrix) return [];
        const items = [...data.matrix];

        return items.sort((a: DivisionMatrixItem, b: DivisionMatrixItem) => {
            let valA: any;
            let valB: any;

            if (typeof sortField === 'number' || (typeof sortField === 'string' && sortField in (a.months || {}))) {
                valA = a.months?.[sortField] || 0;
                valB = b.months?.[sortField] || 0;
            } else if (sortField === 'total') {
                valA = a.total || 0;
                valB = b.total || 0;
            } else if (sortField === 'average') {
                valA = a.average || 0;
                valB = b.average || 0;
            } else if (sortField === 'name') {
                valA = (a.org_group_name || a.division_name || '').toLowerCase();
                valB = (b.org_group_name || b.division_name || '').toLowerCase();
            }

            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }, [data?.matrix, sortField, sortDirection]);

    return {
        data,
        loading,
        exportLoading,
        dateFrom,
        dateTo,
        setDateRange: handleDateRangeChange,
        selectedYear,
        setSelectedYear,
        searchQuery,
        setSearchQuery,
        sortField,
        sortDirection,
        handleSort,
        handleExport,
        sortedMatrix,
        refresh: fetchData,
    };
}
