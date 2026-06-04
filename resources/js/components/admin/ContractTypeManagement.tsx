import { Button } from '@/components/ui/base/Button';
import { Column, DataTable } from '@/components/ui/data/DataTable';
import { useToast } from '@/components/ui/feedback/Toast';
import { usePermissions } from '@/hooks/use-permissions';
import { cn } from '@/lib/utils';
import { router } from '@inertiajs/react';
import { ChevronDown, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';

interface ContractTypeManagementProps {
    readonly contractTypes: any;
    readonly filters: any;
}

export function ContractTypeManagement({ contractTypes, filters }: Readonly<ContractTypeManagementProps>) {
    const { showToast } = useToast();
    const { canCreate, canUpdate, canDelete } = usePermissions('ADMIN_TYPES');

    const data = contractTypes?.data || [];

    // 1. Build parent-child mapping for the current page dataset
    // Since backend now paginates only parents, we map children from the 'children' relation
    const { rootItems, childrenMap } = useMemo(() => {
        const map: Record<string, any[]> = {};
        const roots: any[] = [];

        data.forEach((item: any) => {
            roots.push(item);
            if (item.children && item.children.length > 0) {
                map[item.id] = item.children;
            }
        });

        return { rootItems: roots, childrenMap: map };
    }, [data]);

    // 2. Track expanded/collapsed state (defaults to empty/collapsed as requested)
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});

    const allParentIds = useMemo(() => Object.keys(childrenMap), [childrenMap]);

    const isAllExpanded = useMemo(() => {
        return allParentIds.length > 0 && allParentIds.every((id) => expanded[id] === true);
    }, [allParentIds, expanded]);

    const toggleAll = () => {
        if (isAllExpanded) {
            setExpanded({});
        } else {
            const nextState: Record<string, boolean> = {};
            allParentIds.forEach((id) => {
                nextState[id] = true;
            });
            setExpanded(nextState);
        }
    };

    // 3. Flatten the tree based on expanded states
    const flattenedData = useMemo(() => {
        const list: any[] = [];

        const addChildren = (parentId: string, depth: number) => {
            const children = childrenMap[parentId] || [];
            children.forEach((child) => {
                list.push({ ...child, _depth: depth });
                // Check if this child itself has nested children and is expanded
                if (expanded[child.id] === true && child.children && child.children.length > 0) {
                    // Recursive call for nested children if needed
                    // (Currently backend might only load 1 level, but logic supports more)
                    const nestedMap: Record<string, any[]> = { [child.id]: child.children };
                    const addNested = (pId: string, d: number) => {
                        const subChildren = nestedMap[pId] || [];
                        subChildren.forEach((sc) => {
                            list.push({ ...sc, _depth: d });
                            if (expanded[sc.id] === true && sc.children) {
                                // Continue recursion if data exists
                            }
                        });
                    };
                    addNested(child.id, depth + 1);
                }
            });
        };

        rootItems.forEach((root) => {
            list.push({ ...root, _depth: 0 });
            const isRootExpanded = expanded[root.id] === true;
            if (isRootExpanded) {
                addChildren(root.id, 1);
            }
        });

        return list;
    }, [rootItems, childrenMap, expanded]);

    const columns = useMemo<Column<any>[]>(
        () => [
            {
                header: 'Klasifikasi Kontrak',
                accessorKey: 'name',
                sortable: true,
                cell: (row) => {
                    const isParent = (childrenMap[row.id]?.length || row.children?.length) > 0;
                    const depth = row._depth || 0;
                    const hasDepth = depth > 0;

                    return (
                        <div className="group flex flex-col" style={{ paddingLeft: `${depth * 24}px` }}>
                            <div className="flex items-center gap-1.5">
                                {hasDepth && <span className="text-muted-foreground/30 mr-0.5 font-medium select-none">↳</span>}
                                {isParent ? (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const isCurrentlyExpanded = expanded[row.id] === true;
                                            setExpanded((prev) => ({
                                                ...prev,
                                                [row.id]: !isCurrentlyExpanded,
                                            }));
                                        }}
                                        className="text-muted-foreground h-6 w-6 shrink-0"
                                    >
                                        <ChevronDown
                                            size={12}
                                            className={cn('transition-transform duration-200', expanded[row.id] !== true && '-rotate-90')}
                                        />
                                    </Button>
                                ) : (
                                    <div className="h-5 w-5 shrink-0" />
                                )}
                                <span
                                    className={cn(
                                        'text-[13px] font-semibold tracking-tight uppercase transition-transform group-hover:translate-x-1',
                                        depth > 0 ? 'text-text-desc' : 'text-text-main',
                                    )}
                                >
                                    {row.name}
                                </span>
                            </div>
                            <div className="mt-1 flex items-center gap-2" style={{ paddingLeft: hasDepth ? '20px' : '20px' }}>
                                <ShieldCheck size={10} className="text-primary/20" />
                                <span className="text-text-soft text-[9px] font-medium uppercase italic">
                                    {depth > 0 ? 'Sub-Klasifikasi Terdaftar' : 'Aset Administratif Terpantau'}
                                </span>
                            </div>
                        </div>
                    );
                },
            },
            {
                header: 'Kode Sistem',
                accessorKey: 'code',
                cell: (row) => <span className="font-mono text-[10px] font-semibold tracking-wider text-slate-400 uppercase">{row.code}</span>,
            },
            {
                header: 'Keterangan Konten',
                accessorKey: 'description',
                cell: (row) => (
                    <span className="text-text-soft max-w-[300px] truncate text-[10px] font-medium tracking-tight uppercase">
                        {row.description || '—'}
                    </span>
                ),
            },
        ],
        [childrenMap, expanded],
    );

    const openCreate = () => {
        router.visit(route('admin.contract-types.create'));
    };

    const openEdit = (type: any) => {
        if (!type) return;
        router.visit(route('admin.contract-types.edit', type.id));
    };

    return (
        <DataTable
            title="Registri Klasifikasi Kontrak"
            borderless={true}
            columns={columns}
            data={flattenedData}
            searchPlaceholder="Filter jenis klasifikasi..."
            searchValue={filters.search || ''}
            onSearchChange={(v: string) =>
                router.get(globalThis.location.pathname, { ...filters, search: v, page: 1 }, { preserveState: true, replace: true })
            }
            filters={[]}
            activeFilters={{}}
            onFilterChange={(updatedFilters: any) => {
                const newFilters: Record<string, any> = { ...filters, page: 1 };
                Object.keys(updatedFilters).forEach((key) => {
                    newFilters[key] = updatedFilters[key].length > 0 ? updatedFilters[key][0] : null;
                });
                router.get(globalThis.location.pathname, newFilters, { preserveState: true, replace: true });
            }}
            headerActions={
                <div className="flex items-center gap-2">
                    {allParentIds.length > 0 && (
                        <Button variant="white" onClick={toggleAll} className="text-[10px] font-black tracking-widest uppercase">
                            <ChevronDown size={14} className={cn('transition-transform duration-200', !isAllExpanded && '-rotate-90')} />
                            {isAllExpanded ? 'Minimize Semua' : 'Expand Semua'}
                        </Button>
                    )}
                    {canCreate && (
                        <Button variant="white" onClick={openCreate} className="text-[10px] font-black tracking-widest uppercase">
                            <Plus size={14} className="text-primary mr-2" /> Registrasi Klasifikasi
                        </Button>
                    )}
                </div>
            }
            onRowClick={openEdit}
            bulkActions={
                canDelete
                    ? [
                          {
                              label: 'Hapus Terpilih',
                              icon: Trash2,
                              variant: 'destructive',
                              onClick: (ids: string[]) => {
                                  if (confirm(`Apakah Anda yakin ingin menghapus ${ids.length} tipe kontrak terpilih secara permanen?`)) {
                                      router.post(
                                          route('admin.contract-types.bulk-destroy'),
                                          { ids },
                                          {
                                              onSuccess: () => showToast(`${ids.length} tipe kontrak telah dihapus dari registri`, 'success'),
                                          },
                                      );
                                  }
                              },
                          },
                      ]
                    : undefined
            }
            pagination={{
                currentPage: contractTypes.current_page || 1,
                lastPage: contractTypes.last_page || 1,
                total: contractTypes.total || 0,
                from: contractTypes.from || 1,
                to: contractTypes.to || 1,
                perPage: contractTypes.per_page || 10,
                onPageChange: (page: number) =>
                    router.get(globalThis.location.pathname, { ...filters, page }, { preserveState: true, preserveScroll: true }),
                onPerPageChange: (pp: number) =>
                    router.get(globalThis.location.pathname, { ...filters, per_page: pp, page: 1 }, { preserveState: true, preserveScroll: true }),
            }}
        />
    );
}
