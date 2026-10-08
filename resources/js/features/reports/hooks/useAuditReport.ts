import { useToast } from '@/components/ui/feedback/Toast';
import { useCallback, useEffect, useState } from 'react';
import reportsService from '../services/reportsService';
import type { AuditLog, AuditReportResponse, ReportFilterParams } from '../types/reports.types';

export function useAuditReport() {
    const { showToast } = useToast();
    const [data, setData] = useState<AuditReportResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [exportLoading, setExportLoading] = useState(false);
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);

    const [filters, setFilters] = useState<{
        date_from: string;
        date_to: string;
        creator_ids: string[];
        contract_type_ids: string[];
        contract_ids: string[];
        actions: string[];
        search: string;
        audit_page: number;
    }>({
        date_from: '',
        date_to: '',
        creator_ids: [],
        contract_type_ids: [],
        contract_ids: [],
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

    const fetchData = useCallback(
        (currentFilters = filters) => {
            setLoading(true);
            reportsService
                .getAuditLogs(currentFilters)
                .then((res) => {
                    setData(res);
                    if (res.histories) {
                        setPagination({
                            current_page: res.histories.current_page,
                            last_page: res.histories.last_page,
                            total: res.histories.total,
                            per_page: res.histories.per_page,
                        });
                    }
                    setLoading(false);
                })
                .catch(() => {
                    setLoading(false);
                    showToast('Gagal memuat log audit', 'error');
                });
        },
        [filters, showToast],
    );

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleFilterChange = (key: string, value: any) => {
        const newFilters = { ...filters, [key]: value, audit_page: 1 };
        setFilters(newFilters);
        fetchData(newFilters);
    };

    const handleResetFilters = () => {
        const reset: typeof filters = {
            date_from: '',
            date_to: '',
            creator_ids: [],
            contract_type_ids: [],
            contract_ids: [],
            actions: [],
            search: '',
            audit_page: 1,
        };
        setFilters(reset);
        fetchData(reset);
    };

    const handlePageChange = (newPage: number) => {
        const newFilters = { ...filters, audit_page: newPage };
        setFilters(newFilters);
        fetchData(newFilters);
    };

    const handleExport = () => {
        setExportLoading(true);
        try {
            const url = reportsService.getExportAuditUrl(filters as ReportFilterParams);
            window.location.href = url;
            showToast('Laporan jejak audit berhasil diexport', 'success');
        } catch {
            showToast('Gagal mengunduh laporan excel', 'error');
        } finally {
            setExportLoading(false);
        }
    };

    const openDetail = (log: AuditLog) => {
        setSelectedLog(log);
        setDetailOpen(true);
    };

    const closeDetail = () => {
        setDetailOpen(false);
        setSelectedLog(null);
    };

    return {
        data,
        loading,
        exportLoading,
        selectedLog,
        detailOpen,
        openDetail,
        closeDetail,
        filters,
        pagination,
        handleFilterChange,
        handleResetFilters,
        handlePageChange,
        handleExport,
        refresh: fetchData,
    };
}
