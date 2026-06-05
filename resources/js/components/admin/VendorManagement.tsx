import { Button } from '@/components/ui/base/Button';
import { Column, DataTable } from '@/components/ui/data/DataTable';
import { ExcelActions } from '@/components/ui/data/ExcelActions';
import { useToast } from '@/components/ui/feedback/Toast';
import { usePermissions } from '@/hooks/use-permissions';
import { cn, vendorColor } from '@/lib/utils';
import { router } from '@inertiajs/react';
import { Mail, Phone, Plus, Trash2, Truck } from 'lucide-react';
import React, { useMemo } from 'react';

interface VendorManagementProps {
    vendors: any;
    filters: any;
}

const CATEGORY_COLORS: Record<string, string> = {
    'GENERAL SUPPLIER': 'bg-vendor-supplier-bg text-vendor-supplier-text border border-vendor-supplier-text/20',
    'SERVICE PROVIDER': 'bg-vendor-service-bg text-vendor-service-text border border-vendor-service-text/20',
    CONSULTANT: 'bg-role-admin-bg text-role-admin-text border border-role-admin-text/20',
    'IT SERVICES': 'bg-primary-muted text-primary border border-primary/20',
    LOGISTICS: 'bg-role-reviewer-bg text-role-reviewer-text border border-role-reviewer-text/20',
};

const VendorCell = ({ name, companyType, code, isActive }: Readonly<{ name: string; companyType?: string; code: string; isActive: boolean }>) => (
    <div className="group flex items-center gap-3 select-none">
        <div
            className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm backdrop-blur-sm transition-all duration-200 select-none',
                vendorColor(name),
            )}
        >
            <Truck size={18} />
        </div>
        <div className="flex min-w-0 flex-col">
            <div className="mb-0.5 flex items-center gap-2">
                <span className="text-text-main truncate text-sm leading-tight font-semibold tracking-wide">{name}</span>
                <span className="text-text-soft border-surface-border border-l pl-2 text-[10px] font-semibold  uppercase select-none">
                    {companyType || 'CV'}
                </span>
            </div>
            <div className="text-text-desc flex items-center gap-2 font-mono text-xs leading-none font-semibold">
                {code}
                <div className={cn('h-1.5 w-1.5 rounded-full', isActive ? 'bg-success animate-pulse' : 'bg-danger/40')} />
                <span
                    className={cn(
                        'text-xs font-semibold tracking-wide transition-colors duration-200 select-none',
                        isActive ? 'text-success' : 'text-danger',
                    )}
                >
                    {isActive ? 'Terverifikasi' : 'Belum Verifikasi'}
                </span>
            </div>
        </div>
    </div>
);

const CategoryCell = ({ category, email, phone }: Readonly<{ category?: string; email?: string; phone?: string }>) => (
    <div className="flex flex-col gap-1.5 select-none">
        <span
            className={cn(
                'inline-block w-fit rounded-xl px-3 py-1 text-xs font-semibold tracking-wide shadow-sm backdrop-blur-sm',
                CATEGORY_COLORS[category ?? ''] ?? 'border-surface-border bg-secondary text-text-desc border',
            )}
        >
            {category || 'General Supplier'}
        </span>
        <div className="flex flex-col pl-0.5">
            {email && (
                <div className="text-text-desc flex items-center gap-1.5 text-xs font-medium lowercase">
                    <Mail size={12} className="text-primary shrink-0 opacity-60" /> {email}
                </div>
            )}
            {phone && (
                <div className="text-text-desc flex items-center gap-1.5 text-xs font-medium">
                    <Phone size={12} className="text-primary shrink-0 opacity-60" /> {phone}
                </div>
            )}
        </div>
    </div>
);

const PicCell = ({ picName, directorName, picPosition }: Readonly<{ picName?: string; directorName?: string; picPosition?: string }>) => (
    <div className="flex flex-col select-none">
        <span className="text-text-main truncate text-sm font-semibold tracking-wide">{picName || directorName || '—'}</span>
        <span className="text-text-desc mt-0.5 text-[11px] leading-none font-semibold  uppercase">
            {picPosition || 'DIREKTUR UTAMA'}
        </span>
    </div>
);

const ComplianceCell = ({ docCount }: Readonly<{ docCount?: number }>) => {
    const score = Math.round(((docCount || 0) / 10) * 100);
    const status = score >= 80 ? 'SANGAT BAIK' : score >= 50 ? 'CUKUP' : 'KRITIS';
    const colorClass = score >= 80 ? 'text-success bg-success/10' : score >= 50 ? 'text-warning bg-warning/10' : 'text-danger bg-danger/10';

    return (
        <div className="flex flex-col items-end gap-1.5 select-none">
            <div className={cn('rounded-xl px-3 py-1 text-xs font-semibold  shadow-sm backdrop-blur-sm', colorClass)}>{status}</div>
            <div className="flex items-center gap-2">
                <div className="bg-muted border-surface-border h-1.5 w-20 overflow-hidden rounded-full border">
                    <div
                        className={cn('h-full transition-all duration-300', score >= 80 ? 'bg-success' : score >= 50 ? 'bg-warning' : 'bg-danger')}
                        style={{ width: `${score}%` }}
                    />
                </div>
                <span className="text-text-main text-xs font-semibold">{score}%</span>
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
        <DataTable
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
            headerActions={
                <div className="flex items-center gap-2">
                    <ExcelActions exportRoute="admin.vendors.export" importRoute="admin.vendors.import" label="Vendor" />
                    {canCreate ? (
                        <Button variant="white" onClick={() => router.visit(route('admin.vendors.create'))}>
                            <Plus size={15} className="text-primary" /> Tambah Vendor
                        </Button>
                    ) : undefined}
                </div>
            }
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
    );
}
