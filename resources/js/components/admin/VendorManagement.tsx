import React, { useMemo } from 'react';
import { Column, DataTable } from '@/components/ui/DataTable';
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
                    <div className="flex h-10 w-10 items-center justify-center rounded-none bg-slate-100 text-slate-400 group-hover:bg-black group-hover:text-white transition-colors">
                        <Truck size={16} />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                             <span className="bg-black text-[8px] text-white px-1.5 py-0.5 font-black uppercase tracking-[0.2em]">{row.company_type || 'CV'}</span>
                             <span className="text-[11px] font-black uppercase tracking-tight text-slate-900 truncate leading-none">{row.name}</span>
                        </div>
                        <div className="flex items-center gap-2 font-mono text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">
                            {row.code}
                            <div className={cn(
                                "w-1 h-1 rounded-full",
                                row.is_active ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-slate-300"
                            )} />
                        </div>
                    </div>
                </div>
            )
        },
        {
            header: 'Kategori & Komunikasi',
            accessorKey: 'category',
            cell: (row) => (
                <div className="space-y-2">
                    <span className="inline-block px-2 py-0.5 bg-slate-50 text-slate-500 text-[8px] font-black uppercase tracking-widest border border-slate-100">
                        {row.category || 'GENERAL SUPPLIER'}
                    </span>
                    <div className="grid grid-cols-1 gap-1">
                        {row.email && (
                            <div className="flex items-center gap-1.5 lowercase font-mono text-[9px] text-slate-400">
                                <Mail size={10} className="shrink-0" /> {row.email}
                            </div>
                        )}
                        {row.phone && (
                            <div className="flex items-center gap-1.5 font-mono text-[9px] text-slate-400">
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
                    <span className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{row.pic_name || row.director_name || '-'}</span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1 leading-none">{row.pic_position || 'DIREKTUR UTAMA'}</span>
                </div>
            )
        },
        {
            header: 'Audit Dokumen',
            accessorKey: 'id',
            className: 'text-center',
            cell: (row) => (
                <div className="flex flex-col items-center gap-1.5">
                   <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className={cn(
                                "w-2 h-3.5 border",
                                i <= (row.documents_count || i % 3 + 1) ? "bg-black border-black" : "bg-white border-slate-100"
                            )} />
                        ))}
                   </div>
                   <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Compliance Score: {Math.round(((row.documents_count || 3) / 5) * 100)}%</span>
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
                        onClick={() => router.get('/admin/vendors/create')} 
                        className="h-9 gap-2 rounded-none bg-black px-6 text-[10px] font-black uppercase tracking-widest text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] hover:bg-slate-800 transition-all active:translate-x-0.5 active:translate-y-0.5"
                    >
                        <Plus className="h-3.5 w-3.5" /> Registrasi Vendor Baru
                    </Button>
                )
            }
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
