import React, { useState, useMemo } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { ChevronDown, ChevronRight, Maximize2, Minimize2, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DataTable } from '@/components/ui/tables/DataTable';
import { Button } from '@/components/ui/buttons/Button';
import { SearchableSelect } from '@/components/ui/selection/SearchableSelect';

interface TreeNode {
    id: string;
    name: string;
    code: string;
    type: 'Group' | 'Region' | 'Company';
    children: TreeNode[];
}

interface Props {
    treeData: TreeNode[];
    breadcrumbs: any[];
}

function flattenTree(items: TreeNode[], collapsedIds: Set<string>, ignoreCollapse: boolean, depth = 0): any[] {
    const result: any[] = [];
    for (const item of items) {
        const hasChildren = item.children && item.children.length > 0;
        result.push({ ...item, _depth: depth, _hasChildren: hasChildren });
        
        if (hasChildren && (ignoreCollapse || !collapsedIds.has(item.id))) {
            result.push(...flattenTree(item.children, collapsedIds, ignoreCollapse, depth + 1));
        }
    }
    return result;
}

function AddOrganizationModal({ onClose, treeData }: { onClose: () => void, treeData: TreeNode[] }) {
    const { data, setData, post, processing, errors } = useForm({
        type: 'Company',
        name: '',
        code: '',
        company_group_id: '',
        region_id: '',
    });

    const groups = useMemo(() => {
        const result: any[] = [];
        const findGroups = (nodes: TreeNode[]) => {
            nodes.forEach(node => {
                if (node.type === 'Group') result.push(node);
                if (node.children) findGroups(node.children);
            });
        };
        findGroups(treeData);
        return result;
    }, [treeData]);

    const regions = useMemo(() => {
        const result: any[] = [];
        const findRegions = (nodes: TreeNode[]) => {
            nodes.forEach(node => {
                if (node.type === 'Region') result.push(node);
                if (node.children) findRegions(node.children);
            });
        };
        findRegions(treeData);
        return result;
    }, [treeData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        let endpoint = '';
        if (data.type === 'Group') endpoint = '/admin/core/company-groups';
        if (data.type === 'Region') endpoint = '/admin/core/regions';
        if (data.type === 'Company') endpoint = '/admin/core/companies';

        post(endpoint, {
            onSuccess: () => onClose(),
        });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 dark:bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative mx-auto my-auto bg-white dark:bg-slate-900 w-full max-w-lg overflow-hidden rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                <form onSubmit={handleSubmit} className="flex flex-col h-full">
                    <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
                        <div>
                            <h3 className="text-slate-900 dark:text-slate-100 text-base font-normal tracking-tight">
                                Tambah Data
                            </h3>
                            <p className="text-text-main text-xs font-normal mt-0.5">
                                Pilih tipe dan isi form untuk menambahkan data baru.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-text-main hover:text-primary transition-all"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-normal text-text-main uppercase tracking-wider">Tipe</label>
                            <SearchableSelect
                                value={data.type}
                                onValueChange={(val) => setData('type', val)}
                                options={[
                                    { value: 'Group', label: 'Group' },
                                    { value: 'Region', label: 'Region' },
                                    { value: 'Company', label: 'Company' },
                                ]}
                                placeholder="Pilih Tipe..."
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-normal text-text-main uppercase tracking-wider">Kode</label>
                            <input
                                type="text"
                                value={data.code}
                                onChange={e => setData('code', e.target.value)}
                                className="flex h-10 w-full rounded-lg border border-surface-border bg-surface-base px-3 py-2 text-xs font-normal focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-primary"
                                placeholder="Masukkan kode..."
                                required
                            />
                            {errors.code && <span className="text-xs text-red-500">{errors.code}</span>}
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-normal text-text-main uppercase tracking-wider">Nama</label>
                            <input
                                type="text"
                                value={data.name}
                                onChange={e => setData('name', e.target.value)}
                                className="flex h-10 w-full rounded-lg border border-surface-border bg-surface-base px-3 py-2 text-xs font-normal focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-primary"
                                placeholder="Masukkan nama..."
                                required
                            />
                            {errors.name && <span className="text-xs text-red-500">{errors.name}</span>}
                        </div>

                        {data.type === 'Company' && (
                            <>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[11px] font-normal text-text-main uppercase tracking-wider">Group</label>
                                    <SearchableSelect
                                        value={data.company_group_id}
                                        onValueChange={(val) => setData('company_group_id', val)}
                                        options={groups.map((g: any) => ({ value: g.id, label: g.name }))}
                                        placeholder="Pilih Group..."
                                        searchPlaceholder="Cari Group..."
                                    />
                                    {errors.company_group_id && <span className="text-xs text-red-500">{errors.company_group_id}</span>}
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[11px] font-normal text-text-main uppercase tracking-wider">Region</label>
                                    <SearchableSelect
                                        value={data.region_id}
                                        onValueChange={(val) => setData('region_id', val)}
                                        options={regions.map((r: any) => ({ value: r.id, label: r.name }))}
                                        placeholder="Pilih Region..."
                                        searchPlaceholder="Cari Region..."
                                    />
                                    {errors.region_id && <span className="text-xs text-red-500">{errors.region_id}</span>}
                                </div>
                            </>
                        )}
                    </div>

                    <div className="flex items-center justify-end gap-3 px-6 pb-6 pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={processing}
                            className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-2.5 text-xs font-normal text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all disabled:opacity-50"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="flex-1 rounded-xl px-4 py-2.5 text-xs font-normal text-white transition-all bg-primary hover:bg-primary/95 disabled:opacity-50 shadow-md flex items-center justify-center gap-1.5"
                        >
                            {processing ? 'Menyimpan...' : 'Simpan Data'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function OrganizationTree({ treeData, breadcrumbs }: Props) {
    const [searchQuery, setSearchQuery] = useState('');
    const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Basic search filtering (preserves tree structure)
    const filterTree = (nodes: TreeNode[], query: string): TreeNode[] => {
        if (!query) return nodes;
        
        const lowerQuery = query.toLowerCase();
        
        return nodes.reduce((acc: TreeNode[], node) => {
            const matchesQuery = node.name.toLowerCase().includes(lowerQuery) || 
                                 (node.code && node.code.toLowerCase().includes(lowerQuery));
            
            if (matchesQuery) {
                acc.push(node);
            } else if (node.children) {
                const filteredChildren = filterTree(node.children, query);
                if (filteredChildren.length > 0) {
                    acc.push({ ...node, children: filteredChildren });
                }
            }
            
            return acc;
        }, []);
    };

    const filteredData = filterTree(treeData, searchQuery);
    
    // If there is a search query, we automatically expand all nodes to show results
    const isSearching = searchQuery.trim().length > 0;
    const flattenedData = useMemo(() => flattenTree(filteredData, collapsedIds, isSearching), [filteredData, collapsedIds, isSearching]);

    const toggleRow = (id: string) => {
        setCollapsedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const expandAll = () => setCollapsedIds(new Set());
    const collapseAll = () => {
        const allIds = new Set<string>();
        const collect = (nodes: TreeNode[]) => {
            for (const node of nodes) {
                if (node.children && node.children.length > 0) {
                    allIds.add(node.id);
                    collect(node.children);
                }
            }
        };
        collect(treeData);
        setCollapsedIds(allIds);
    };

    const columns = [
        {
            header: 'Name',
            accessorKey: 'name',
            sortable: false,
            cell: (row: any) => {
                const depth = row._depth || 0;
                const isCollapsed = collapsedIds.has(row.id) && !isSearching;
                
                return (
                    <span 
                        style={{ paddingLeft: `${depth * 20}px` }} 
                        className="flex items-center gap-1.5 font-normal text-text-main"
                    >
                        {row._hasChildren ? (
                            <button 
                                onClick={() => toggleRow(row.id)}
                                className="w-5 h-5 flex items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-text-main"
                            >
                                {isCollapsed ? <ChevronRight size={15} /> : <ChevronDown size={15} />}
                            </button>
                        ) : (
                            <span className="w-5 h-5 flex items-center justify-center text-text-main">
                                •
                            </span>
                        )}
                        {row.code && row.code !== '-' && (
                            <span className="text-[10px] bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20 text-text-main font-normal uppercase tracking-wider">
                                {row.code}
                            </span>
                        )}
                        <span>{row.name}</span>
                    </span>
                );
            }
        },
        {
            header: 'Type',
            accessorKey: 'type',
            sortable: false,
            cell: (row: any) => {
                const getTypeColor = () => {
                    switch (row.type) {
                        case 'Group': return 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 border-blue-200 dark:border-blue-500/30';
                        case 'Region': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30';
                        case 'Company': return 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300 border-orange-200 dark:border-orange-500/30';
                        default: return 'bg-primary/10 text-text-main';
                    }
                };
                return (
                    <span className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full border font-normal uppercase tracking-wider",
                        getTypeColor()
                    )}>
                        {row.type}
                    </span>
                );
            }
        },
        {
            header: 'Items',
            accessorKey: 'children',
            sortable: false,
            cell: (row: any) => {
                const count = row.children ? row.children.length : 0;
                return (
                    <span className="text-xs font-normal text-text-main">
                        {count > 0 ? `${count} items` : '—'}
                    </span>
                );
            }
        }
    ];

    return (
        <>
            <Head title="Organization Tree" />

            <DataTable
                title="Organization Tree"
                columns={columns}
                borderless={true}
                data={flattenedData}
                searchPlaceholder="Search group, region, or company..."
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                headerActions={
                    <div className="flex items-center gap-2">
                        <Button 
                            variant="white" 
                            size="icon" 
                            onClick={expandAll}
                            title="Expand All"
                            className="h-8 w-8 text-text-main bg-white border border-surface-border hover:bg-slate-50 rounded-lg shadow-sm"
                        >
                            <Maximize2 size={14} />
                        </Button>
                        <Button 
                            variant="white" 
                            size="icon" 
                            onClick={collapseAll}
                            title="Minimize All"
                            className="h-8 w-8 text-text-main bg-white border border-surface-border hover:bg-slate-50 rounded-lg shadow-sm"
                        >
                            <Minimize2 size={14} />
                        </Button>
                        <Button 
                            variant="primary" 
                            onClick={() => setIsAddModalOpen(true)}
                            className="gap-2 h-8 px-3 text-xs font-normal rounded-lg shadow-sm"
                        >
                            <Plus size={14} /> Tambah Data
                        </Button>
                    </div>
                }
            />

            {isAddModalOpen && (
                <AddOrganizationModal 
                    treeData={treeData} 
                    onClose={() => setIsAddModalOpen(false)} 
                />
            )}
        </>
    );
}
