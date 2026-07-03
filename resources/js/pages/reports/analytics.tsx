import { DataTable } from '@/components/ui/tables/DataTable';
import { Button } from '@/components/ui/buttons/Button';
import { cn } from '@/lib/utils';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import { Download } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

interface AnalyticsData {
    recentContracts: any[];
    types: { id: string; name: string }[];
    users: { id: string; name: string }[];
}

export default function AnalyticsPage({ breadcrumbs }: { breadcrumbs: BreadcrumbItem[] }) {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        date_from: '',
        date_to: '',
        contract_type_ids: [],
        creator_ids: [],
        contracts_page: 1,
    });

    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        total: 0,
    });

    const fetchData = (currentFilters = filters) => {
        setLoading(true);
        axios
            .post('/admin/reports/api/data', currentFilters)
            .then((res) => {
                const raw = res.data;
                setData({
                    recentContracts: raw.contracts.data || [],
                    types: raw.types,
                    users: raw.users,
                });
                setPagination({
                    current_page: raw.contracts.current_page || 1,
                    last_page: raw.contracts.last_page || 1,
                    total: raw.contracts.total || 0,
                });
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleExport = () => {
        const params = new URLSearchParams();
        if (filters.date_from) params.append('date_from', filters.date_from);
        if (filters.date_to) params.append('date_to', filters.date_to);
        filters.contract_type_ids.forEach((id: string) => params.append('contract_type_ids[]', id));
        filters.creator_ids.forEach((id: string) => params.append('creator_ids[]', id));

        window.location.href = `/admin/reports/api/export?${params.toString()}`;
    };

    const filterCategories = useMemo(
        () => [
            { label: 'Rentang Waktu', key: 'date', type: 'date-range' },
            {
                label: 'Tipe Kontrak',
                key: 'contract_type_ids',
                type: 'searchable',
                options: data?.types.map((t) => ({ label: t.name, value: t.id })) || [],
            },
            {
                label: 'Pembuat',
                key: 'creator_ids',
                type: 'searchable',
                options: data?.users.map((u) => ({ label: u.name, value: u.id })) || [],
            },
        ],
        [data],
    );

    const columns = [
        {
            header: 'No. Kontrak',
            accessorKey: 'contract_no',
            cell: (row: any) => <span>{row.contract_no}</span>
        },
        {
            header: 'Judul',
            accessorKey: 'title',
            cell: (row: any) => <span>{row.title}</span>
        },
        {
            header: 'Status',
            accessorKey: 'status',
            cell: (row: any) => (
                <span className={cn(
                    "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px]",
                    row.status === 'approved' ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                    row.status === 'pending' ? "bg-amber-50 text-amber-700 border border-amber-200" :
                    row.status === 'rejected' ? "bg-rose-50 text-rose-700 border border-rose-200" :
                    "bg-slate-50 text-slate-700 border border-slate-200"
                )}>
                    <span className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        row.status === 'approved' ? "bg-emerald-500" :
                        row.status === 'pending' ? "bg-amber-500" :
                        row.status === 'rejected' ? "bg-rose-500" :
                        "bg-slate-400"
                    )} />
                    {row.status}
                </span>
            )
        },
        {
            header: 'Tanggal Registrasi',
            accessorKey: 'created_at',
            cell: (row: any) => (
                <span>
                    {new Date(row.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
            )
        }
    ];

    return (
        <>
            <Head title="Laporan Analitik Kontrak" />
            <div className="bg-background flex flex-1 flex-col">
                <DataTable
                    title="Laporan Analitik Kontrak"
                    columns={columns}
                    data={data?.recentContracts || []}
                    loading={loading}
                    borderless={true}
                    pagination={{
                        currentPage: pagination.current_page,
                        lastPage: pagination.last_page,
                        total: pagination.total,
                        onPageChange: (page) => {
                            const nextFilters = { ...filters, contracts_page: page };
                            setFilters(nextFilters);
                            fetchData(nextFilters);
                        }
                    }}
                    filters={filterCategories}
                    activeFilters={filters}
                    onFilterChange={(newFilters) => {
                        const nextFilters = { ...filters, ...newFilters, contracts_page: 1 };
                        setFilters(nextFilters);
                        fetchData(nextFilters);
                    }}
                    headerActions={
                        <Button
                            variant="white"
                            onClick={handleExport}
                            className="text-xs py-1.5 px-3 h-8 hover:bg-surface-muted text-text-main rounded-xl flex items-center gap-1.5 font-bold uppercase tracking-wider bg-white border border-surface-border shadow-xs"
                        >
                            <Download size={13} /> Export Excel / CSV
                        </Button>
                    }
                />
            </div>
        </>
    );
}
