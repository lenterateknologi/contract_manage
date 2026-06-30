import React, { useState } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import { DataTable } from '@/components/ui/tables/DataTable';
import { Button } from '@/components/ui/buttons/Button';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { ConfirmationModal } from '@/components/ui/dialogs/ConfirmationModal';
import { ExcelActions } from '@/components/ui/tables/ExcelActions';

interface Props {
    resourceSlug: string;
    title: string;
    tableSchema: any[];
    formSchema: any[];
    data: any;
    filters: any[];
    activeFilters?: Record<string, any>;
    hasExport?: boolean;
    hasImport?: boolean;
}

export default function ResourceIndex({ resourceSlug, title, tableSchema, data, filters, activeFilters = {}, hasExport = false, hasImport = false }: Props) {
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [selectedRows, setSelectedRows] = useState<any[]>([]);

    React.useEffect(() => {
        setSelectedRows([]);
    }, [resourceSlug]);

    const handleDelete = () => {
        if (!deleteId) return;
        router.delete(`/admin/core/${resourceSlug}/${deleteId}`, {
            onSuccess: () => setDeleteId(null),
        });
    };

    // Map schema to DataTable columns
    const columns = tableSchema.map((col: any) => ({
        header: col.label,
        accessorKey: col.name,
        sortable: col.sortable,
        cell: (row: any) => {
            const val = col.name.split('.').reduce((acc: any, part: string) => acc && acc[part], row);
            if (col.type === 'boolean') {
                return (
                    <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-full ${val ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                        {val ? 'Aktif' : 'Nonaktif'}
                    </span>
                );
            }
            return val;
        }
    }));

    return (
        <>
            <Head title={title} />

            <DataTable
                title={title}
                columns={columns}
                borderless={true}
                data={data.data}
                pagination={{
                    currentPage: data.current_page,
                    lastPage: data.last_page,
                    total: data.total,
                    onPageChange: (page) => router.get(`/admin/core/${resourceSlug}`, { ...activeFilters, page }, { preserveState: true })
                }}
                searchPlaceholder="Cari data..."
                searchValue={activeFilters.search || ''}
                onSearchChange={(v) => router.get(`/admin/core/${resourceSlug}`, { ...activeFilters, search: v, page: 1 }, { preserveState: true, replace: true })}
                filters={filters}
                activeFilters={activeFilters}
                onFilterChange={(newFilters) => router.get(`/admin/core/${resourceSlug}`, { ...activeFilters, ...newFilters, page: 1 }, { preserveState: true, replace: true })}
                sortBy={activeFilters.sort_by}
                sortDir={activeFilters.sort_dir as 'asc' | 'desc'}
                onSortChange={(sortBy, sortDir) => router.get(`/admin/core/${resourceSlug}`, { ...activeFilters, sort_by: sortBy, sort_dir: sortDir }, { preserveState: true, replace: true })}
                onSelectionChange={(selected: any[]) => setSelectedRows(selected)}
                selectedRows={selectedRows}
                bulkActions={(selected: any[]) => (
                    <Button
                        variant="white"
                        size="sm"
                        onClick={() => {
                            if (confirm(`Hapus ${selected.length} data terpilih? Tindakan ini tidak dapat dibatalkan.`)) {
                                router.post(`/admin/core/${resourceSlug}/bulk-delete`, {
                                    ids: selected.map((r: any) => r.id)
                                }, {
                                    onSuccess: () => setSelectedRows([])
                                });
                            }
                        }}
                        className="text-xs py-1.5 px-3 h-8 hover:bg-rose-50 hover:border-rose-200 text-rose-500 rounded-xl flex items-center gap-1.5 font-bold uppercase tracking-wider bg-white border border-surface-border shadow-sm"
                    >
                        <Trash2 size={13} /> Hapus Terpilih
                    </Button>
                )}
                headerActions={
                    <div className="flex items-center gap-2">
                        {(hasExport || hasImport) && (
                            <ExcelActions
                                exportRoute={`/admin/core/${resourceSlug}/export`}
                                importRoute={`/admin/core/${resourceSlug}/import`}
                                label={title}
                            />
                        )}
                        <Link href={`/admin/core/${resourceSlug}/create`}>
                            <Button variant="primary" className="gap-2">
                                <Plus size={16} /> Tambah Baru
                            </Button>
                        </Link>
                    </div>
                }
                rowActions={(row) => (
                    <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/core/${resourceSlug}/${row.id}/edit`}>
                            <Button variant="white" size="icon" className="h-8 w-8">
                                <Edit2 size={14} className="text-text-main" />
                            </Button>
                        </Link>
                        <Button variant="white" size="icon" className="h-8 w-8 hover:bg-rose-50 hover:border-rose-200" onClick={() => setDeleteId(row.id)}>
                            <Trash2 size={14} className="text-rose-500" />
                        </Button>
                    </div>
                )}
            />

            <ConfirmationModal
                open={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={handleDelete}
                title="Hapus Data"
                description="Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan."
                confirmText="Ya, Hapus"
                cancelText="Batal"
                variant="danger"
            />
        </>
    );
}
