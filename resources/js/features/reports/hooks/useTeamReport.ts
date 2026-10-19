import { useToast } from '@/components/ui/feedback/Toast';
import { useCallback, useEffect, useMemo, useState } from 'react';
import reportsService from '../services/reportsService';
import type { TeamMatrixItem, TeamReportResponse } from '../types/reports.types';

export function useTeamReport() {
    const { showToast } = useToast();
    const [data, setData] = useState<TeamReportResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [exportLoading, setExportLoading] = useState(false);

    const [roleType, setRoleType] = useState<'creator' | 'pic'>('creator');
    const currentYear = new Date().getFullYear();
    const [dateFrom, setDateFrom] = useState<string>(`${currentYear}-01-01`);
    const [dateTo, setDateTo] = useState<string>(`${currentYear}-12-31`);
    const [selectedYear, setSelectedYear] = useState<number>(currentYear);
    const [selectedOrgGroupId, setSelectedOrgGroupId] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState<string>('');

    const [sortField, setSortField] = useState<string | number>('total');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    const handleSort = (field: string | number) => {
        if (sortField === field) {
            setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortField(field);
            if (field === 'total' || typeof field === 'number' || String(field).match(/^\d{4}-\d{2}$/)) {
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

    const fetchData = useCallback(
        (overrideParams: Record<string, any> = {}) => {
            setLoading(true);
            const activeRoleType = overrideParams.role_type !== undefined ? overrideParams.role_type : roleType;
            const activeOrgGroupId = overrideParams.org_group_id !== undefined ? overrideParams.org_group_id : selectedOrgGroupId;
            const activeDateFrom = overrideParams.date_from !== undefined ? overrideParams.date_from : dateFrom;
            const activeDateTo = overrideParams.date_to !== undefined ? overrideParams.date_to : dateTo;
            const activeYear = overrideParams.year !== undefined ? overrideParams.year : selectedYear;

            reportsService
                .getTeamMonthly({
                    date_from: activeDateFrom,
                    date_to: activeDateTo,
                    year: activeYear,
                    role_type: activeRoleType,
                    org_group_id: activeOrgGroupId,
                    search: searchQuery,
                })
                .then((res) => {
                    setData(res);
                    if (!selectedOrgGroupId && res.currentOrgGroup) {
                        setSelectedOrgGroupId(res.currentOrgGroup.id);
                    }
                    setLoading(false);
                })
                .catch(() => {
                    setLoading(false);
                    showToast('Gagal memuat data laporan tim', 'error');
                });
        },
        [roleType, selectedOrgGroupId, dateFrom, dateTo, selectedYear, searchQuery, showToast],
    );

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleRoleTypeChange = (newRole: 'creator' | 'pic') => {
        setRoleType(newRole);
        fetchData({ role_type: newRole });
    };

    const handleOrgGroupChange = (orgGroupId: string) => {
        setSelectedOrgGroupId(orgGroupId);
        fetchData({ org_group_id: orgGroupId });
    };

    const handleExport = () => {
        setExportLoading(true);
        try {
            const url = reportsService.getExportTeamUrl({
                date_from: dateFrom,
                date_to: dateTo,
                year: selectedYear,
                role_type: roleType,
                org_group_id: selectedOrgGroupId,
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

        return items.sort((a: TeamMatrixItem, b: TeamMatrixItem) => {
            let valA: any;
            let valB: any;

            if (typeof sortField === 'number' || (typeof sortField === 'string' && sortField in (a.months || {}))) {
                valA = a.months?.[sortField] || 0;
                valB = b.months?.[sortField] || 0;
            } else if (sortField === 'total') {
                valA = a.total || 0;
                valB = b.total || 0;
            } else if (sortField === 'user_name') {
                valA = (a.user_name || '').toLowerCase();
                valB = (b.user_name || '').toLowerCase();
            } else if (sortField === 'department_name') {
                valA = (a.department_name || '').toLowerCase();
                valB = (b.department_name || '').toLowerCase();
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
        roleType,
        setRoleType: handleRoleTypeChange,
        dateFrom,
        dateTo,
        setDateRange: handleDateRangeChange,
        selectedYear,
        setSelectedYear,
        selectedOrgGroupId,
        setSelectedOrgGroupId: handleOrgGroupChange,
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
