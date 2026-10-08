import { useToast } from '@/components/ui/feedback/Toast';
import { useCallback, useEffect, useMemo, useState } from 'react';
import reportsService from '../services/reportsService';
import type { DivisionMatrixItem, DivisionReportResponse } from '../types/reports.types';

export function useDivisionReport() {
    const { showToast } = useToast();
    const [data, setData] = useState<DivisionReportResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [exportLoading, setExportLoading] = useState(false);

    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [searchQuery, setSearchQuery] = useState<string>('');

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

    const fetchData = useCallback(() => {
        setLoading(true);
        reportsService
            .getDivisionMonthly({
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
    }, [selectedYear, searchQuery, showToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleExport = () => {
        setExportLoading(true);
        try {
            const url = reportsService.getExportDivisionsUrl({
                year: selectedYear,
                group_by: 'org_group',
                search: searchQuery,
            });
            window.location.href = url;
            showToast('Laporan berhasil diexport', 'success');
        } catch {
            showToast('Gagal mengunduh laporan CSV', 'error');
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

            if (typeof sortField === 'number') {
                valA = a.months?.[sortField] || 0;
                valB = b.months?.[sortField] || 0;
            } else if (sortField === 'total') {
                valA = a.total || 0;
                valB = b.total || 0;
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
