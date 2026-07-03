import { DataTable } from '@/components/ui/tables/DataTable';
import { Button } from '@/components/ui/buttons/Button';
import { cn } from '@/lib/utils';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import { Download } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

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
    const [filters, setFilters] = useState({
        date_from: '',
        date_to: '',
        creator_ids: [],
        audit_page: 1,
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
                setData({
                    histories: res.data.histories.data || [],
                    users: res.data.users,
                });
                setPagination({
                    current_page: res.data.histories.current_page || 1,
                    last_page: res.data.histories.last_page || 1,
                    total: res.data.histories.total || 0,
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
        filters.creator_ids.forEach((id: string) => params.append('creator_ids[]', id));

        window.location.href = `/admin/reports/api/audit/export?${params.toString()}`;
    };

    const filterCategories = useMemo(
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

    const columns = [
        {
            header: 'Timestamp',
            accessorKey: 'created_at',
            cell: (row: any) => (
                <span className="whitespace-nowrap">
                    {new Date(row.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })} {new Date(row.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
            )
        },
        {
            header: 'Ref ID',
            accessorKey: 'contract_no',
            cell: (row: any) => <span>#{row.contract_no.split('/').pop()}</span>
        },
        {
            header: 'Action Event',
            accessorKey: 'action',
            cell: (row: any) => {
                const actionType = row.action.toLowerCase();
                const isAlert = actionType.includes('reject') || actionType.includes('delete') || actionType.includes('cancel');
                const isSuccess = actionType.includes('approve') || actionType.includes('create') || actionType.includes('submit');
                const isSystem = actionType.includes('system') || actionType.includes('update');

                return (
                    <span className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-[10px]",
                        isAlert ? "bg-rose-50 text-rose-700 border border-rose-200" :
                        isSuccess ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                        isSystem ? "bg-blue-50 text-blue-700 border border-blue-200" :
                        "bg-slate-50 text-slate-700 border border-slate-200"
                    )}>
                        {row.action}
                    </span>
                );
            }
        },
        {
            header: 'Transaction Log Data',
            accessorKey: 'description',
            cell: (row: any) => <span>{row.description}</span>
        },
        {
            header: 'Author Entity',
            accessorKey: 'actor',
            cell: (row: any) => <span>@{row.actor.split(' ')[0]}</span>
        }
    ];

    return (
        <>
            <Head title="Jejak Audit Sistem" />
            <div className="bg-background flex flex-1 flex-col">
                <DataTable
                    title="Jejak Audit Sistem"
                    columns={columns}
                    data={data?.histories || []}
                    loading={loading}
                    borderless={true}
                    pagination={{
                        currentPage: pagination.current_page,
                        lastPage: pagination.last_page,
                        total: pagination.total,
                        onPageChange: (page) => {
                            const nextFilters = { ...filters, audit_page: page };
                            setFilters(nextFilters);
                            fetchData(nextFilters);
                        }
                    }}
                    filters={filterCategories}
                    activeFilters={filters}
                    onFilterChange={(newFilters) => {
                        const nextFilters = { ...filters, ...newFilters, audit_page: 1 };
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
