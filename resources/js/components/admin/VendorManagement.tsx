import { useToast } from '@/components/contracts/Toast';
import { Column, TableMasterData } from '@/components/ui/data/TableMasterData';
import { usePermissions } from '@/hooks/use-permissions';
import { cn } from '@/lib/utils';
import { router } from '@inertiajs/react';
import { Mail, Phone, Trash2, Truck } from 'lucide-react';
import React, { useMemo } from 'react';

interface VendorManagementProps {
    vendors: any;
    filters: any;
}

const VENDOR_COLORS = [
    'bg-emerald-100 text-emerald-600',
    'bg-blue-100 text-blue-600',
    'bg-violet-100 text-violet-600',
    'bg-teal-100 text-teal-600',
    'bg-amber-100 text-amber-600',
];
function vendorColor(name: string) {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
    return VENDOR_COLORS[Math.abs(h) % VENDOR_COLORS.length];
}

const CATEGORY_COLORS: Record<string, string> = {
    'GENERAL SUPPLIER': 'bg-slate-100 text-slate-600',
    'SERVICE PROVIDER': 'bg-blue-100 text-blue-700',
    CONSULTANT: 'bg-violet-100 text-violet-700',
    'IT SERVICES': 'bg-cyan-100 text-cyan-700',
    LOGISTICS: 'bg-amber-100 text-amber-700',
};

const VendorCell = ({ name, companyType, code, isActive }: Readonly<{ name: string; companyType?: string; code: string; isActive: boolean }>) => (
    <div className="group flex items-center gap-3">
        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', vendorColor(name))}>
            <Truck size={17} />
        </div>
        <div className="flex min-w-0 flex-col">
            <div className="mb-0.5 flex items-center gap-2">
                <span className="text-foreground truncate text-sm leading-tight font-semibold">{name}</span>
                <span className="text-muted-foreground border-border border-l pl-2 text-xs leading-none font-bold tracking-wide uppercase">
                    {companyType || 'CV'}
                </span>
            </div>
            <div className="text-muted-foreground flex items-center gap-2 font-mono text-xs leading-none font-medium">
                {code}
                <div className={cn('h-1.5 w-1.5 rounded-full', isActive ? 'bg-emerald-500' : 'bg-rose-400')} />
                <span className={cn('text-xs font-semibold', isActive ? 'text-emerald-600' : 'text-rose-500')}>
                    {isActive ? 'Aktif' : 'Nonaktif'}
                </span>
            </div>
        </div>
    </div>
);

const CategoryCell = ({ category, email, phone }: Readonly<{ category?: string; email?: string; phone?: string }>) => (
    <div className="flex flex-col gap-1.5">
        <span
            className={cn(
                'inline-block w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold',
                CATEGORY_COLORS[category ?? ''] ?? 'bg-slate-100 text-slate-600',
            )}
        >
            {category || 'General Supplier'}
        </span>
        <div className="flex flex-col">
            {email && (
                <div className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium lowercase">
                    <Mail size={12} className="shrink-0 opacity-60" /> {email}
                </div>
            )}
            {phone && (
                <div className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
                    <Phone size={12} className="shrink-0 opacity-60" /> {phone}
                </div>
            )}
        </div>
    </div>
);

const PicCell = ({ picName, directorName, picPosition }: Readonly<{ picName?: string; directorName?: string; picPosition?: string }>) => (
    <div className="flex flex-col">
        <span className="text-foreground truncate text-sm font-bold">{picName || directorName || '—'}</span>
        <span className="text-muted-foreground mt-0.5 text-xs leading-none font-medium">{picPosition || 'DIREKTUR UTAMA'}</span>
    </div>
);

const ComplianceCell = ({ docCount }: Readonly<{ docCount?: number }>) => {
    const score = Math.round(((docCount || 0) / 10) * 100);
    const status = score >= 80 ? 'EXCELLENT' : score >= 50 ? 'AVERAGE' : 'CRITICAL';
    const colorClass =
        score >= 80 ? 'text-emerald-500 bg-emerald-500/10' : score >= 50 ? 'text-amber-500 bg-amber-500/10' : 'text-rose-500 bg-rose-500/10';

    return (
        <div className="flex flex-col items-end gap-1.5">
            <div className={cn('rounded px-2 py-0.5 text-xs font-bold tracking-wide', colorClass)}>{status}</div>
            <div className="flex items-center gap-2">
                <div className="bg-muted h-1.5 w-16 overflow-hidden rounded-full">
                    <div
                        className={cn('h-full', score >= 80 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-rose-500')}
                        style={{ width: `${score}%` }}
                    />
                </div>
                <span className="text-muted-foreground text-xs font-bold">{score}%</span>
            </div>
        </div>
    );
};

export function VendorManagement({ vendors, filters }: Readonly<VendorManagementProps>) {
    const { showToast } = useToast();
    const { canCreate, canUpdate, canDelete } = usePermissions('ADMIN_VENDORS');
    const [selectedRows, setSelectedRows] = React.useState<any[]>([]);

    const filterConfig = useMemo(
        () => [
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
                ],
            },
            {
                label: 'Status Verifikasi',
                key: 'is_active',
                options: [
                    { label: 'Verified (Aktif)', value: 'true' },
                    { label: 'Unverified (Nonaktif)', value: 'false' },
                ],
            },
        ],
        [],
    );

    const handleFilterChange = (newFilters: Record<string, any>) => {
        router.get(
            globalThis.location.pathname,
            {
                ...filters,
                ...newFilters,
                page: 1,
            },
            { preserveState: true, replace: true },
        );
    };

    const columns = useMemo<Column<any>[]>(
        () => [
            {
                header: 'Vendor / Institusi',
                accessorKey: 'name',
                sortable: true,
                cell: (row) => <VendorCell name={row.name} companyType={row.company_type} code={row.code} isActive={row.is_active} />,
            },
            {
                header: 'Kategori & Kontak',
                accessorKey: 'category',
                cell: (row) => <CategoryCell category={row.category} email={row.email} phone={row.phone} />,
            },
            {
                header: 'Representatif / PIC',
                accessorKey: 'pic_name',
                cell: (row) => <PicCell picName={row.pic_name} directorName={row.director_name} picPosition={row.pic_position} />,
            },
            {
                header: 'Audit Skor',
                accessorKey: 'id',
                className: 'text-right',
                cell: (row) => <ComplianceCell docCount={row.documents_count} />,
            },
        ],
        [],
    );

    return (
        <div className="border-border bg-card m-5 rounded-2xl border p-5 shadow-sm">
            <TableMasterData
                title="Database Rekanan / Vendor"
                data={vendors?.data || []}
                columns={columns}
                borderless={true}
                selectedRows={selectedRows}
                onSelectionChange={setSelectedRows}
                searchPlaceholder="Cari vendor, kode, atau email..."
                searchValue={filters?.search || ''}
                onSearchChange={(v: string) =>
                    router.get(globalThis.location.pathname, { ...filters, search: v, page: 1 }, { preserveState: true, replace: true })
                }
                onRowClick={(row: any) => router.get(`/admin/vendors/${row.id}/edit`)}
                filters={filterConfig as any}
                activeFilters={filters}
                onFilterChange={handleFilterChange}
                bulkActions={
                    canDelete
                        ? [
                              {
                                  label: 'Hapus Terpilih',
                                  icon: Trash2,
                                  variant: 'destructive',
                                  onClick: (ids: string[] | number[]) => {
                                      if (confirm(`Hapus ${ids.length} vendor terpilih?`)) {
                                          router.post(
                                              '/admin/vendors/bulk-delete',
                                              { ids },
                                              {
                                                  onSuccess: () => showToast(`${ids.length} vendor telah dihapus`, 'success'),
                                              },
                                          );
                                      }
                                  },
                              },
                          ]
                        : undefined
                }
                pagination={
                    vendors
                        ? {
                              currentPage: vendors.current_page || 1,
                              lastPage: vendors.last_page || 1,
                              total: vendors.total || 0,
                              from: vendors.from || 1,
                              to: vendors.to || 1,
                              perPage: vendors.per_page || 10,
                              onPageChange: (page: number) =>
                                  router.get(globalThis.location.pathname, { ...filters, page }, { preserveState: true, preserveScroll: true }),
                              onPerPageChange: (pp: number) =>
                                  router.get(
                                      globalThis.location.pathname,
                                      { ...filters, per_page: pp, page: 1 },
                                      { preserveState: true, preserveScroll: true },
                                  ),
                          }
                        : undefined
                }
            />
        </div>
    );
}
