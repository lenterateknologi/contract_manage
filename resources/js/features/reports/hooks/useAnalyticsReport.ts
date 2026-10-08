import { useToast } from '@/components/ui/feedback/Toast';
import { useCallback, useEffect, useState } from 'react';
import reportsService from '../services/reportsService';
import type { AnalyticsReportResponse, ReportFilterParams } from '../types/reports.types';

export function useAnalyticsReport() {
    const { showToast } = useToast();
    const [data, setData] = useState<AnalyticsReportResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [exportLoading, setExportLoading] = useState(false);

    const [filters, setFilters] = useState<{
        date_from: string;
        date_to: string;
        contract_type_ids: string[];
        workflow_ids: string[];
        creator_ids: string[];
        involved_ids: string[];
        statuses: string[];
        search: string;
        contracts_page: number;
    }>({
        date_from: '',
        date_to: '',
        contract_type_ids: [],
        workflow_ids: [],
        creator_ids: [],
        involved_ids: [],
        statuses: [],
        search: '',
        contracts_page: 1,
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
                .getAnalytics(currentFilters)
                .then((res) => {
                    setData(res);
                    if (res.contracts) {
                        setPagination({
                            current_page: res.contracts.current_page,
                            last_page: res.contracts.last_page,
                            total: res.contracts.total,
                            per_page: res.contracts.per_page,
                        });
                    }
                    setLoading(false);
                })
                .catch(() => {
                    setLoading(false);
                    showToast('Gagal memuat analitik', 'error');
                });
        },
        [filters, showToast],
    );

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleFilterChange = (key: string, value: any) => {
        const newFilters = { ...filters, [key]: value, contracts_page: 1 };
        setFilters(newFilters);
        fetchData(newFilters);
    };

    const handleResetFilters = () => {
        const reset: typeof filters = {
            date_from: '',
            date_to: '',
            contract_type_ids: [],
            workflow_ids: [],
            creator_ids: [],
            involved_ids: [],
            statuses: [],
            search: '',
            contracts_page: 1,
        };
        setFilters(reset);
        fetchData(reset);
    };

    const handlePageChange = (newPage: number) => {
        const newFilters = { ...filters, contracts_page: newPage };
        setFilters(newFilters);
        fetchData(newFilters);
    };

    const handleExport = () => {
        setExportLoading(true);
        try {
            const url = reportsService.getExportAnalyticsUrl(filters as ReportFilterParams);
            window.location.href = url;
            showToast('Laporan analitik berhasil diexport', 'success');
        } catch {
            showToast('Gagal mengunduh laporan excel', 'error');
        } finally {
            setExportLoading(false);
        }
    };

    return {
        data,
        loading,
        exportLoading,
        filters,
        pagination,
        handleFilterChange,
        handleResetFilters,
        handlePageChange,
        handleExport,
        refresh: fetchData,
    };
}
