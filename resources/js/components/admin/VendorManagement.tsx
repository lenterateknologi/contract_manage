import React, { useMemo } from 'react';
import { Column, DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { router } from '@inertiajs/react';
import { Plus, Trash2, Edit2, Truck, ExternalLink, ShieldCheck, Mail, Phone, MapPin } from 'lucide-react';
import { usePermissions } from '@/hooks/use-permissions';
import { useToast } from '@/components/contracts/Toast';
import { cn } from '@/lib/utils';

interface VendorManagementProps {
    vendors: any;
    filters: any;
}

export function VendorManagement({ vendors, filters }: VendorManagementProps) {
    const { showToast } = useToast();
    const { canCreate, canUpdate, canDelete } = usePermissions('ADMIN_VENDORS');

    const filterConfig = useMemo(() => [
        {
            label: 'Kategori Vendor',
            key: 'category',
            type: 'searchable',
            options: [
                { label: 'General Supplier', value: 'GENERAL SUPPLIER' },
                { label: 'Service Provider', value: 'SERVICE PROVIDER' },
                { label: 'Consultant', value: 'CONSULTANT' },
                { label: 'IT Services', value: 'IT SERVICES' },
                { label: 'Logistics', value: 'LOGISTICS' },
            ]
        },
        {
            label: 'Status Verifikasi',
            key: 'is_active',
            options: [
                { label: 'Verified (Aktif)', value: 'true' },
                { label: 'Unverified (Nonaktif)', value: 'false' },
            ]
        }
    ], []);

    const handleFilterChange = (newFilters: Record<string, any>) => {
        router.get(window.location.pathname, { 
            ...filters, 
            ...newFilters, 
            page: 1 
        }, { preserveState: true, replace: true });
    };

    const columns = useMemo<Column<any>[]>(() => [
        {
            header: 'Vendor / Institusi',
            accessorKey: 'name',
            sortable: true,
            cell: (row) => (
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black/[0.03] dark:bg-white/[0.03] text-black/30 dark:text-white/30 group-hover:text-black dark:group-hover:text-white transition-colors border border-black/[0.05] dark:border-white/[0.05]">
                        <Truck size={18} />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                             <span className="text-[13px] font-bold text-black dark:text-white truncate leading-tight">{row.name}</span>
                             <span className="text-[9px] font-black uppercase tracking-[0.1em] text-black/20 dark:text-white/20 border-l border-black/[0.1] pl-2 leading-none">{row.company_type || 'CV'}</span>
                        </div>
                        <div className="flex items-center gap-2 font-mono text-[10px] font-bold text-black/40 dark:text-white/40 uppercase tracking-widest leading-none">
                            {row.code}
                            <div className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                row.is_active ? "bg-black dark:bg-white" : "bg-black/10 dark:bg-white/10"
                            )} />
                        </div>
                    </div>
                </div>
            )
        },
        {
            header: 'Kategori & Kontak',
            accessorKey: 'category',
            cell: (row) => (
                <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-black/60 dark:text-white/60">
                        {row.category || 'GENERAL SUPPLIER'}
                    </span>
                    <div className="flex flex-col">
                        {row.email && (
                            <div className="flex items-center gap-1.5 lowercase font-medium text-[10px] text-black/30 dark:text-white/30">
                                <Mail size={10} className="shrink-0" /> {row.email}
                            </div>
                        )}
                        {row.phone && (
                            <div className="flex items-center gap-1.5 font-medium text-[10px] text-black/30 dark:text-white/30">
                                <Phone size={10} className="shrink-0" /> {row.phone}
                            </div>
                        )}
                    </div>
                </div>
            )
        },
        {
            header: 'Representatif / PIC',
            accessorKey: 'pic_name',
            cell: (row) => (
                <div className="flex flex-col">
                    <span className="text-[12px] font-bold text-black dark:text-white truncate">{row.pic_name || row.director_name || '—'}</span>
                    <span className="text-[9px] text-black/40 dark:text-white/40 font-black uppercase tracking-widest mt-0.5 leading-none">{row.pic_position || 'DIREKTUR UTAMA'}</span>
                </div>
            )
        },
        {
            header: 'Audit Skor',
            accessorKey: 'id',
            className: 'text-right',
            cell: (row) => (
                <div className="flex flex-col items-end">
                   <span className="text-[13px] font-bold text-black dark:text-white leading-none">{Math.round(((row.documents_count || 3) / 5) * 100)}%</span>
                   <span className="text-[9px] font-black text-black/20 dark:text-white/20 uppercase tracking-[0.2em] mt-1 leading-none">COMPLIANCE</span>
                </div>
            )
        },
    ], []);

    return (
        <DataTable
            title="Database Rekanan / Vendor"
            data={vendors?.data || []}
            columns={columns}
            searchKey="name"
            searchPlaceholder="Cari vendor, kode, atau email..."
            searchValue={filters?.search || ''}
            onSearchChange={(v) => router.get(window.location.pathname, { ...filters, search: v, page: 1 }, { preserveState: true, replace: true })}
            onRowClick={(row) => router.get(`/admin/vendors/${row.id}/edit`)}
            filters={filterConfig as any}
            activeFilters={filters}
            onFilterChange={handleFilterChange}
            headerActions={
                canCreate && (
                    <Button 
                        variant="primary"
                        onClick={() => router.get('/admin/vendors/create')} 
                        className="h-10 px-8 shadow-xl active:scale-95"
                    >
                        <Plus size={14} /> Registrasi Vendor Baru
                    </Button>
                )
            }
            bulkActions={canDelete ? [
                {
                    label: 'Hapus Terpilih',
                    icon: Trash2,
                    variant: 'destructive',
                    onClick: (ids) => {
                        if (confirm(`Hapus ${ids.length} vendor terpilih?`)) {
                            router.post('/admin/vendors/bulk-delete', { ids }, {
                                onSuccess: () => showToast(`${ids.length} vendor telah dihapus`, 'success')
                            });
                        }
                    }
                }
            ] : undefined}
            pagination={vendors ? {
                currentPage: vendors.current_page || 1,
                lastPage: vendors.last_page || 1,
                total: vendors.total || 0,
                from: vendors.from || 1,
                to: vendors.to || 1,
                perPage: vendors.per_page || 10,
                onPageChange: (page) => router.get(window.location.pathname, { ...filters, page }, { preserveState: true, preserveScroll: true }),
                onPerPageChange: (pp) => router.get(window.location.pathname, { ...filters, per_page: pp, page: 1 }, { preserveState: true, preserveScroll: true }),
            } : undefined}
        />
    );
}
