import { useToast } from '@/components/contracts/Toast';
import { Button } from '@/components/ui/base/Button';
import { Column, TableMasterData } from '@/components/ui/data/TableMasterData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/forms/Select';
import { usePermissions } from '@/hooks/use-permissions';
import { router } from '@inertiajs/react';
import { Plus, ShieldCheck, Trash2, ChevronDown } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ContractTypeManagementProps {
    readonly contractTypes: any;
    readonly formTemplates?: any[] | null;
    readonly contractTemplates?: any[] | null;
    readonly filters: any;
}

const MechanismCell = ({ mechanism }: Readonly<{ mechanism: string }>) => (
    <div className="flex items-center gap-2">
        <div className="bg-primary/20 h-1.5 w-1.5 rounded-full dark:bg-white/20" />
        <span className="text-primary/60 text-[10px] font-semibold uppercase dark:text-white/60">
            {mechanism === 'digital' ? 'Formulir Digital' : mechanism === 'folder' ? 'Folder Kontrak' : 'Unggah Manual'}
        </span>
    </div>
);

const TypeDescriptionCell = ({ description }: Readonly<{ description?: string }>) => (
    <span className="text-primary/40 max-w-[200px] truncate text-[10px] font-bold tracking-tight uppercase dark:text-white/40">
        {description || '—'}
    </span>
);

const MechanismOptions = ({
    mechanism,
    formTemplateId,
    setFormTemplateId,
    contractTemplateId,
    setContractTemplateId,
    templates,
    physTemplates,
    type,
}: {
    mechanism: string;
    formTemplateId: string;
    setFormTemplateId: (id: string | number) => void;
    contractTemplateId: string;
    setContractTemplateId: (id: string | number) => void;
    templates: any[];
    physTemplates: any[];
    type: 'F1' | 'F2';
}) => {
    if (mechanism === 'digital') {
        return (
            <div className="animate-in fade-in slide-in-from-top-2">
                <div className="animate-in fade-in slide-in-from-top-2">
                    <div className="space-y-2">
                        <label className="text-primary/60 flex items-center gap-2 text-[10px] font-bold uppercase dark:text-white/60">
                            Tautan Templat Digital {type}
                        </label>
                        <Select value={String(formTemplateId)} onValueChange={(v: string) => setFormTemplateId(String(v))}>
                            <SelectTrigger className="border-primary/10 bg-primary/5 focus:border-primary h-10 rounded-xl text-xs font-bold transition-all">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="border-primary/10 rounded-xl bg-white shadow-2xl dark:bg-black">
                                <SelectItem value="none" className="py-2.5 text-xs font-bold uppercase">
                                    -- TANPA TEMPLAT TERPAUT --
                                </SelectItem>
                                {templates.map((t: any) => (
                                    <SelectItem key={t.id} value={String(t.id)} className="py-2.5 text-xs font-bold uppercase">
                                        {t.name} ({t.document_type || 'ADHOC'})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>
        );
    }
    if (mechanism === 'folder') {
        return (
            <div className="animate-in fade-in slide-in-from-top-2">
                <div className="animate-in fade-in slide-in-from-top-2">
                    <div className="space-y-2">
                        <label className="text-primary/60 flex items-center gap-2 text-[10px] font-bold uppercase dark:text-white/60">
                            Tautan Templat Folder ({type})
                        </label>
                        <Select value={String(contractTemplateId)} onValueChange={(v: string) => setContractTemplateId(String(v))}>
                            <SelectTrigger className="border-primary/10 bg-primary/5 focus:border-primary h-10 rounded-xl text-xs font-bold transition-all">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="border-primary/10 rounded-xl bg-white shadow-2xl dark:bg-black">
                                <SelectItem value="none" className="py-2.5 text-xs font-bold uppercase">
                                    -- TIDAK ADA TEMPLAT TERPILIH --
                                </SelectItem>
                                {physTemplates.map((t: any) => (
                                    <SelectItem key={t.id} value={String(t.id)} className="py-2.5 text-xs font-bold uppercase">
                                        {t.name} ({t.file_type || 'PDF'})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>
        );
    }
    return (
        <div className="animate-in fade-in border-primary/10 bg-primary/[0.01] rounded-2xl border border-dashed p-6 text-center dark:border-white/10 dark:bg-white/[0.01]">
            <p className="text-primary/30 text-[10px] font-bold tracking-[0.2em] uppercase italic dark:text-white/30">
                {type === 'F1' ? 'PENGGUNA INTERNAL' : 'VENDOR'} AKAN MENGUNGGAH PDF MANUAL UNTUK {type}
            </p>
        </div>
    );
};

export function ContractTypeManagement({ contractTypes, filters }: Readonly<ContractTypeManagementProps>) {
    const { showToast } = useToast();
    const { canCreate, canUpdate, canDelete } = usePermissions('ADMIN_TYPES');

    const data = contractTypes?.data || [];

    // 1. Build parent-child mapping for the current page dataset
    const { rootItems, childrenMap } = useMemo(() => {
        const map: Record<string, any[]> = {};
        const roots: any[] = [];
        const idsInPage = new Set(data.map((item: any) => item.id));

        data.forEach((item: any) => {
            const parentId = item.parent_id;
            if (parentId && idsInPage.has(parentId)) {
                if (!map[parentId]) {
                    map[parentId] = [];
                }
                map[parentId].push(item);
            } else {
                roots.push(item);
            }
        });

        return { rootItems: roots, childrenMap: map };
    }, [data]);

    // 2. Track expanded/collapsed state of parent nodes (defaults to expanded/true)
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});

    const allParentIds = useMemo(() => Object.keys(childrenMap), [childrenMap]);
    
    const isAllCollapsed = useMemo(() => {
        return allParentIds.length > 0 && allParentIds.every(id => expanded[id] === false);
    }, [allParentIds, expanded]);

    const toggleAll = () => {
        if (isAllCollapsed) {
            setExpanded({});
        } else {
            const nextState: Record<string, boolean> = {};
            allParentIds.forEach((id) => {
                nextState[id] = false;
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
                const isChildExpanded = expanded[child.id] !== false;
                if (isChildExpanded) {
                    addChildren(child.id, depth + 1);
                }
            });
        };

        rootItems.forEach((root) => {
            list.push({ ...root, _depth: 0 });
            const isRootExpanded = expanded[root.id] !== false;
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
                    const isParent = childrenMap[row.id]?.length > 0;
                    const depth = row._depth || 0;
                    const hasDepth = depth > 0;

                    return (
                        <div
                            className="group flex flex-col"
                            style={{ paddingLeft: `${depth * 24}px` }}
                        >
                            <div className="flex items-center gap-1.5">
                                {hasDepth && (
                                    <span className="text-muted-foreground/30 font-bold select-none mr-0.5">
                                        ↳
                                    </span>
                                )}
                                {isParent ? (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const isCurrentlyExpanded = expanded[row.id] !== false;
                                            setExpanded((prev) => ({
                                                ...prev,
                                                [row.id]: !isCurrentlyExpanded,
                                            }));
                                        }}
                                        className="p-1 hover:bg-muted/80 rounded-md transition-colors text-muted-foreground shrink-0"
                                    >
                                        <ChevronDown
                                            size={12}
                                            className={cn(
                                                "transition-transform duration-200",
                                                expanded[row.id] === false && "-rotate-90"
                                            )}
                                        />
                                    </button>
                                ) : (
                                    <div className="w-5 h-5 shrink-0" />
                                )}
                                <span className={cn(
                                    "text-[13px] font-bold tracking-tight uppercase transition-transform group-hover:translate-x-1",
                                    depth > 0 ? "text-foreground/80 dark:text-white/80" : "text-primary dark:text-white"
                                )}>
                                    {row.name}
                                </span>
                            </div>
                            <div className="mt-1 flex items-center gap-2" style={{ paddingLeft: hasDepth ? '20px' : '20px' }}>
                                <ShieldCheck size={10} className="text-primary/20 dark:text-white/20" />
                                <span className="text-primary/30 text-[9px] font-bold uppercase italic dark:text-white/30">
                                    Aset Administratif Terpantau
                                </span>
                            </div>
                        </div>
                    );
                },
            },
            {
                header: 'Klasifikasi Induk',
                accessorKey: 'parent.name',
                cell: (row) => (
                    <span className="text-primary/60 text-[11px] font-bold tracking-tight uppercase dark:text-white/60">
                        {row.parent?.name || '—'}
                    </span>
                ),
            },
            {
                header: 'Mekanisme F1 (Internal)',
                accessorKey: 'f1_input_mechanism',
                cell: (row) => <MechanismCell mechanism={row.f1_input_mechanism} />,
            },
            {
                header: 'Mekanisme F2 (Eksternal)',
                accessorKey: 'f2_input_mechanism',
                cell: (row) => <MechanismCell mechanism={row.f2_input_mechanism} />,
            },
            {
                header: 'Keterangan Konten',
                accessorKey: 'description',
                cell: (row) => <TypeDescriptionCell description={row.description} />,
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
        <div className="border-border bg-card m-5 rounded-2xl border p-5 shadow-sm">
            <TableMasterData
                title="Registri Klasifikasi Kontrak"
                borderless={true}
                columns={columns}
                data={flattenedData}
                searchPlaceholder="Filter jenis klasifikasi..."
                searchValue={filters.search || ''}
                onSearchChange={(v: string) =>
                    router.get(globalThis.location.pathname, { ...filters, search: v, page: 1 }, { preserveState: true, replace: true })
                }
                filters={[
                    {
                        label: 'Mekanisme F1',
                        key: 'f1_input_mechanism',
                        options: [
                            { label: 'Formulir Digital', value: 'digital' },
                            { label: 'Folder Kontrak', value: 'folder' },
                            { label: 'Manual', value: 'manual' },
                        ],
                    },
                    {
                        label: 'Mekanisme F2',
                        key: 'f2_input_mechanism',
                        options: [
                            { label: 'Formulir Digital', value: 'digital' },
                            { label: 'Folder Kontrak', value: 'folder' },
                            { label: 'Manual', value: 'manual' },
                        ],
                    },
                ]}
                activeFilters={{
                    f1_input_mechanism: filters.f1_input_mechanism ? [filters.f1_input_mechanism] : [],
                    f2_input_mechanism: filters.f2_input_mechanism ? [filters.f2_input_mechanism] : [],
                }}
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
                            <Button
                                variant="white"
                                onClick={toggleAll}
                                className="border-border/40 bg-card text-foreground hover:bg-muted/60 hover:border-border/60 h-10 gap-2 rounded-xl border px-4 text-xs font-bold shadow-sm transition-all duration-200 active:scale-95"
                            >
                                <ChevronDown size={14} className={cn("transition-transform duration-200", isAllCollapsed && "-rotate-90")} />
                                {isAllCollapsed ? 'Expand Semua' : 'Minimize Semua'}
                            </Button>
                        )}
                        {canCreate && (
                            <Button
                                variant="white"
                                onClick={openCreate}
                                className="border-border/40 bg-card text-foreground hover:bg-muted/60 hover:border-border/60 h-10 gap-2 rounded-xl border px-6 text-xs font-bold shadow-sm transition-all duration-200 hover:shadow-md active:scale-95"
                            >
                                <Plus size={14} className="mr-2" /> Registrasi Klasifikasi
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
                        router.get(
                            globalThis.location.pathname,
                            { ...filters, per_page: pp, page: 1 },
                            { preserveState: true, preserveScroll: true },
                        ),
                }}
            />
        </div>
    );
}
