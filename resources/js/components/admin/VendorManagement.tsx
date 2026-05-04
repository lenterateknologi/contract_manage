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
    'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
    'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400',
    'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
];

function vendorColor(name: string) {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
    return VENDOR_COLORS[Math.abs(h) % VENDOR_COLORS.length];
}

const CATEGORY_COLORS: Record<string, string> = {
    'GENERAL SUPPLIER': 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-500/20',
    'SERVICE PROVIDER': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-500/20',
    CONSULTANT: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 border border-violet-500/20',
    'IT SERVICES': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400 border border-cyan-500/20',
    LOGISTICS: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-500/20',
};

const VendorCell = ({ name, companyType, code, isActive }: Readonly<{ name: string; companyType?: string; code: string; isActive: boolean }>) => (
    <div className="group flex items-center gap-3 select-none">
        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-200 select-none backdrop-blur-sm shadow-sm', vendorColor(name))}>
            <Truck size={18} />
        </div>
        <div className="flex min-w-0 flex-col">
            <div className="mb-0.5 flex items-center gap-2">
                <span className="text-slate-900 dark:text-slate-100 truncate text-sm leading-tight font-bold tracking-wide">{name}</span>
                <span className="text-muted-foreground/80 dark:text-slate-400 border-border dark:border-slate-800 border-l pl-2 text-[10px] font-bold tracking-wider uppercase select-none">
                    {companyType || 'CV'}
                </span>
            </div>
            <div className="text-muted-foreground/80 dark:text-slate-400 flex items-center gap-2 font-mono text-xs leading-none font-semibold">
                {code}
                <div className={cn('h-1.5 w-1.5 rounded-full', isActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-400')} />
                <span className={cn('text-xs font-bold tracking-wide select-none transition-colors duration-200', isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400')}>
                    {isActive ? 'Verified' : 'Unverified'}
                </span>
            </div>
        </div>
    </div>
);

const CategoryCell = ({ category, email, phone }: Readonly<{ category?: string; email?: string; phone?: string }>) => (
    <div className="flex flex-col gap-1.5 select-none">
        <span
            className={cn(
                'inline-block w-fit rounded-xl px-3 py-1 text-xs font-bold tracking-wide backdrop-blur-sm shadow-sm',
                CATEGORY_COLORS[category ?? ''] ?? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-500/20',
            )}
        >
            {category || 'General Supplier'}
        </span>
        <div className="flex flex-col pl-0.5">
            {email && (
                <div className="text-muted-foreground/80 dark:text-slate-400 flex items-center gap-1.5 text-xs font-medium lowercase">
                    <Mail size={12} className="shrink-0 opacity-60 text-primary" /> {email}
                </div>
            )}
            {phone && (
                <div className="text-muted-foreground/80 dark:text-slate-400 flex items-center gap-1.5 text-xs font-medium">
                    <Phone size={12} className="shrink-0 opacity-60 text-primary" /> {phone}
                </div>
            )}
        </div>
    </div>
);

const PicCell = ({ picName, directorName, picPosition }: Readonly<{ picName?: string; directorName?: string; picPosition?: string }>) => (
    <div className="flex flex-col select-none">
        <span className="text-slate-900 dark:text-slate-100 truncate text-sm font-bold tracking-wide">{picName || directorName || '—'}</span>
        <span className="text-muted-foreground/80 dark:text-slate-400 mt-0.5 text-[11px] leading-none font-bold uppercase tracking-wider">{picPosition || 'DIREKTUR UTAMA'}</span>
    </div>
);

const ComplianceCell = ({ docCount }: Readonly<{ docCount?: number }>) => {
    const score = Math.round(((docCount || 0) / 10) * 100);
    const status = score >= 80 ? 'EXCELLENT' : score >= 50 ? 'AVERAGE' : 'CRITICAL';
    const colorClass =
        score >= 80 ? 'text-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/20' : score >= 50 ? 'text-amber-500 bg-amber-500/10 dark:bg-amber-500/20' : 'text-rose-500 bg-rose-500/10 dark:bg-rose-500/20';

    return (
        <div className="flex flex-col items-end gap-1.5 select-none">
            <div className={cn('rounded-xl px-3 py-1 text-xs font-bold tracking-wider backdrop-blur-sm shadow-sm', colorClass)}>{status}</div>
            <div className="flex items-center gap-2">
                <div className="bg-muted dark:bg-slate-800 h-1.5 w-20 overflow-hidden rounded-full border border-border/40">
                    <div
                        className={cn('h-full transition-all duration-300', score >= 80 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-rose-500')}
                        style={{ width: `${score}%` }}
                    />
                </div>
                <span className="text-slate-900 dark:text-slate-100 text-xs font-bold">{score}%</span>
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
        <div className="bg-card/40 dark:bg-slate-900/20 backdrop-blur-sm border border-border/60 dark:border-slate-800/60 m-5 rounded-2xl p-6 shadow-sm animate-in fade-in duration-200 select-none">
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
