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

// Recursively builds a flattened tree array with depth indicators
function buildTreeFlattened(items: any[], parentId: string | null = null, depth = 0): any[] {
    const result: any[] = [];
    const filtered = items.filter(item => item.parent_id === parentId);
    
    // Sort alphabetically by name
    filtered.sort((a, b) => a.name.localeCompare(b.name));
    
    for (const item of filtered) {
        result.push({ ...item, _depth: depth });
        const children = buildTreeFlattened(items, item.id, depth + 1);
        result.push(...children);
    }
    
    // Process orphan nodes (whose parent is not found in the list) at root level
    if (parentId === null) {
        const itemIds = new Set(items.map(i => i.id));
        const orphans = items.filter(item => item.parent_id && !itemIds.has(item.parent_id));
        for (const item of orphans) {
            if (!result.some(r => r.id === item.id)) {
                result.push({ ...item, _depth: 0 });
                const children = buildTreeFlattened(items, item.id, 1);
                result.push(...children);
            }
        }
        
        // Append any remaining items that were missed
        for (const item of items) {
            if (!result.some(r => r.id === item.id)) {
                result.push({ ...item, _depth: 0 });
            }
        }
    }
    
    return result;
}

// Recursively flattens parent nodes containing children arrays
function flattenTreeFromParents(parents: any[], depth = 0): any[] {
    const result: any[] = [];
    for (const parent of parents) {
        result.push({ ...parent, _depth: depth });
        if (parent.children && parent.children.length > 0) {
            const sortedChildren = [...parent.children].sort((a, b) => a.name.localeCompare(b.name));
            result.push(...flattenTreeFromParents(sortedChildren, depth + 1));
        }
    }
    return result;
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

    // Flatten data if it is contract-types to show a tree list
    const processedData = React.useMemo(() => {
        const rawItems = data?.data || [];
        if (resourceSlug === 'contract-types') {
            const hasChildrenArray = rawItems.some((item: any) => item.children && item.children.length > 0);
            if (hasChildrenArray) {
                return flattenTreeFromParents(rawItems);
            }
            return buildTreeFlattened(rawItems);
        }
        return rawItems;
    }, [data?.data, resourceSlug]);

    // Map schema to DataTable columns
    const columns = tableSchema.map((col: any) => ({
        header: col.label,
        accessorKey: col.name,
        sortable: col.sortable,
        cell: (row: any) => {
            const val = col.name.split('.').reduce((acc: any, part: string) => acc && acc[part], row);
            
            // Custom render for name column if resource is contract-types (showing tree structure)
            if (col.name === 'name' && resourceSlug === 'contract-types') {
                const depth = row._depth || 0;
                return (
                    <span 
                        style={{ paddingLeft: `${depth * 20}px` }} 
                        className="flex items-center gap-1.5 font-semibold text-text-main"
                    >
                        {depth > 0 && (
                            <span className="text-text-soft/60 font-mono select-none">
                                └─
                            </span>
                        )}
                        <span>{val}</span>
                    </span>
                );
            }

            if (col.name === 'label' && resourceSlug === 'contract-statuses') {
                const IconComp = row.icon && (LucideIcons as any)[row.icon]
                    ? (LucideIcons as any)[row.icon]
                    : null;
                return (
                    <span 
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-xs border"
                        style={{ 
                            color: row.color || '#ffffff', 
                            backgroundColor: row.bg_color || '#4f46e5',
                            borderColor: `${row.color || '#ffffff'}22`
                        }}
                    >
                        {IconComp && <IconComp className="h-3 w-3 mr-1.5 shrink-0" />}
                        {val}
                    </span>
                );
            }

            if (col.name === 'color' || col.name === 'bg_color' || col.name === 'text_color') {
                const colorVal = val || '#ffffff';
                return (
                    <span className="flex items-center gap-2 font-mono text-xs font-semibold">
                        <span 
                            className="h-4.5 w-4.5 rounded-md border border-surface-border/80 shadow-xs shrink-0" 
                            style={{ backgroundColor: colorVal }}
                        />
                        <span>{val || '—'}</span>
                    </span>
                );
            }

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
                data={processedData}
                pagination={{
                    currentPage: data.current_page,
                    lastPage: data.last_page,
                    total: data.total,
                    perPage: data.per_page,
                    onPageChange: (page) => router.get(`/admin/core/${resourceSlug}`, { ...activeFilters, page }, { preserveState: true }),
                    onPerPageChange: (perPage) => router.get(`/admin/core/${resourceSlug}`, { ...activeFilters, page: 1, per_page: perPage }, { preserveState: true })
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
