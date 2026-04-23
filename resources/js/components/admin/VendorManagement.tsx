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

    const columns = useMemo<Column<any>[]>(() => [
        {
            header: 'Vendor / Perusahaan',
            accessorKey: 'name',
            sortable: true,
            className: 'font-black text-slate-900 uppercase tracking-tight text-[12px] min-w-[250px]',
            cell: (row) => (
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <span className="bg-black text-[9px] text-white px-1.5 py-0.5 font-black uppercase tracking-widest">{row.company_type || 'CV'}</span>
                        <span className="font-black">{row.name}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                        <span className="text-[9px] font-mono text-slate-400 font-bold tracking-wider">{row.code}</span>
                        {row.is_active ? (
                            <span className="flex items-center gap-1 text-[8px] font-black text-emerald-600 uppercase tracking-widest">
                                <ShieldCheck size={10} /> Verified
                            </span>
                        ) : (
                            <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Inactive</span>
                        )}
                    </div>
                </div>
            )
        },
        {
            header: 'Kategori & Kontak',
            accessorKey: 'category',
            className: 'text-[10px] font-medium text-slate-500 uppercase tracking-wide min-w-[200px]',
            cell: (row) => (
                <div className="space-y-1.5">
                    <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-black uppercase tracking-tighter border border-slate-200">
                        {row.category || 'GENERAL SUPPLIER'}
                    </span>
                    <div className="flex flex-col gap-1">
                        {row.email && (
                            <div className="flex items-center gap-1.5 lowercase font-mono text-[9px] text-slate-400">
                                <Mail size={10} /> {row.email}
                            </div>
                        )}
                        {row.phone && (
                            <div className="flex items-center gap-1.5 font-mono text-[9px] text-slate-400">
                                <Phone size={10} /> {row.phone}
                            </div>
                        )}
                    </div>
                </div>
            )
        },
        {
            header: 'PIC / Direktur',
            accessorKey: 'pic_name',
            className: 'text-[10px] font-medium text-slate-500 uppercase tracking-wide',
            cell: (row) => (
                <div className="flex flex-col">
                    <span className="font-black text-slate-700">{row.pic_name || row.director_name || '-'}</span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{row.pic_position || 'DIREKTUR UTAMA'}</span>
                </div>
            )
        },
        {
            header: 'Status Dokumen',
            accessorKey: 'id',
            className: 'text-center',
            cell: (row) => (
                <div className="flex justify-center">
                   <div className="flex -space-x-1">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className={cn(
                                "w-2.5 h-2.5 border border-white",
                                i <= (row.documents_count || 0) ? "bg-emerald-500" : "bg-slate-200"
                            )} />
                        ))}
                   </div>
                </div>
            )
        },
        {
            header: 'Aksi',
            accessorKey: 'actions',
            className: 'text-right min-w-[100px]',
            cell: (row) => (
                <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                    {canUpdate && (
                        <button 
                            onClick={() => router.get(`/admin/vendors/${row.id}/edit`)}
                            className="p-2 hover:bg-slate-100 text-slate-400 hover:text-black transition-all border border-transparent hover:border-slate-200"
                            title="Edit Vendor"
                        >
                            <Edit2 size={14} />
                        </button>
                    )}
                    {canDelete && (
                        <button 
                            onClick={() => { if(confirm('Hapus data vendor ini?')) router.delete(`/admin/vendors/${row.id}`) }}
                            className="p-2 hover:bg-rose-50 text-slate-300 hover:text-rose-600 transition-all border border-transparent hover:border-rose-100"
                            title="Delete Vendor"
                        >
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>
            )
        }
    ], [canUpdate, canDelete]);

    return (
        <DataTable
            data={vendors?.data || []}
            columns={columns}
            searchKey="name"
            searchValue={filters?.search || ''}
            onSearchChange={(v) => router.get(window.location.pathname, { ...filters, search: v, page: 1 }, { preserveState: true, replace: true })}
            onRowClick={(row) => router.get(`/admin/vendors/${row.id}/edit`)}
            headerActions={
                canCreate && (
                    <Button 
                        onClick={() => router.get('/admin/vendors/create')} 
                        className="h-9 gap-2 rounded-none bg-black hover:bg-slate-800 text-white px-5 text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-xl"
                    >
                        <Plus className="h-3.5 w-3.5" /> Tambah Vendor
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
