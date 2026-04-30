import React, { useMemo } from 'react';
import { Column, DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { useForm, router } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { usePermissions } from '@/hooks/use-permissions';
import { useToast } from '@/components/contracts/Toast';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';

interface NavigationManagementProps {
    readonly groups: any;
    readonly modules: any;
    readonly isModuleView?: boolean;
    readonly filters: any;
}

const GroupNameCell = ({ name }: Readonly<{ name: string }>) => (
    <div className="flex items-center gap-3">
        <span className="font-bold">{name}</span>
    </div>
);

const ModulesCountCell = ({ count }: Readonly<{ count: number }>) => (
    <span className="text-[10px] font-black uppercase tracking-widest text-black/60 dark:text-white/60">
        {count || 0} MODULS
    </span>
);

const ModuleNameCell = ({ name, identifier }: Readonly<{ name: string; identifier: string }>) => (
    <div className="flex flex-col">
        <span className="font-bold truncate leading-tight">{name}</span>
        <span className="text-[10px] font-bold text-black/40 dark:text-white/40 mt-1 uppercase tracking-widest">{identifier}</span>
    </div>
);

const ModuleGroupCell = ({ groupId, groups, route }: Readonly<{ groupId: any; groups: any; route?: string }>) => {
    const grps = (groups.data || groups);
    const group = Array.isArray(grps) ? grps.find((g: any) => g.id === groupId) : null;
    return (
        <div className="flex items-center gap-3">
            <span className="text-[10px] font-black text-black/60 dark:text-white/60 uppercase tracking-widest border-r border-black/10 dark:border-white/10 pr-3">{group?.name || 'GENERAL'}</span>
            <span className="text-[10px] text-black/40 dark:text-white/40 font-bold font-mono tracking-tight">{route || '#'}</span>
        </div>
    );
};

export function NavigationManagement({ groups, modules, isModuleView = false, filters }: Readonly<NavigationManagementProps>) {
    const { showToast } = useToast();
    const { canCreate, canUpdate, canDelete } = usePermissions('NAV_MGMT');
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [editingItem, setEditingItem] = React.useState<any>(null);
    const [confirmDelete, setConfirmDelete] = React.useState<{id: string, name: string} | null>(null);

    const groupForm = useForm({
        name: '',
        icon: 'Folder',
    });

    const moduleForm = useForm({
        identifier: '',
        name: '',
        route: '',
        icon: 'LayoutGrid',
        module_group_id: (groups.data || groups)?.[0]?.id || '',
        showed_as_menu: true as boolean,
    });

    const form = isModuleView ? moduleForm : groupForm;

    const groupColumns = useMemo<Column<any>[]>(() => [
        {
            header: 'Grup Menu',
            accessorKey: 'name',
            sortable: true,
            className: 'font-bold text-black dark:text-white text-[13px]',
            cell: (row) => <GroupNameCell name={row.name} />
        },
        {
            header: 'Total Modul',
            accessorKey: 'modules_count',
            cell: (row) => <ModulesCountCell count={row.modules_count} />
        }
    ], []);

    const moduleColumns = useMemo<Column<any>[]>(() => [
        {
            header: 'Modul & Kode',
            accessorKey: 'name',
            sortable: true,
            className: 'font-bold text-black dark:text-white text-[13px]',
            cell: (row) => <ModuleNameCell name={row.name} identifier={row.identifier} />
        },
        {
            header: 'Grup / Navigasi',
            accessorKey: 'module_group_id',
            cell: (row) => <ModuleGroupCell groupId={row.module_group_id} groups={groups} route={row.route} />
        },

    ], [groups]);

    const openCreate = () => {
        setEditingItem(null);
        form.reset();
        setIsModalOpen(true);
    };

    const openEdit = (item: any) => {
        setEditingItem(item);
        if (isModuleView) {
            moduleForm.setData({
                identifier: item.identifier,
                name: item.name,
                route: item.route || '',
                icon: item.icon || 'LayoutGrid',
                module_group_id: item.module_group_id,
                showed_as_menu: !!item.showed_as_menu,
            });
        } else {
            groupForm.setData({
                name: item.name,
                icon: item.icon || 'Folder',
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const path = isModuleView ? 'modules' : 'module-groups';
        const options = { 
            onSuccess: () => {
                setIsModalOpen(false);
                showToast(editingItem ? 'Data diperbarui' : 'Data ditambahkan', 'success');
            },
            onError: (err: any) => {
                console.error(err);
                showToast('Gagal menyimpan data', 'danger');
            }
        };
        if (editingItem) router.put(`/admin/${path}/${editingItem.id}`, form.data as any, options);
        else router.post(`/admin/${path}`, form.data as any, options);
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-black animate-in fade-in duration-500">
            <DataTable
                title={isModuleView ? "Master Modul Navigasi" : "Struktur Grup Menu"}
                columns={isModuleView ? moduleColumns : groupColumns}
                data={isModuleView ? (modules?.data || modules || []) : (groups?.data || groups || [])}
                searchKey="name"
                searchPlaceholder={`Cari ${isModuleView ? 'modul' : 'grup'}...`}
                headerActions={
                    canCreate && (
                        <Button 
                            variant="primary"
                            onClick={openCreate} 
                            className="h-10 px-8 shadow-xl active:scale-95"
                        >
                            <Plus size={14} /> {isModuleView ? 'Tambah Modul Baru' : 'Tambah Grup Baru'}
                        </Button>
                    )
                }
                bulkActions={canUpdate ? [
                    {
                        label: 'Hapus Terpilih',
                        icon: Trash2,
                        variant: 'destructive',
                        onClick: (ids) => {
                            const typeLabel = isModuleView ? 'modul' : 'grup menu';
                            if (confirm(`Hapus ${ids.length} ${typeLabel} terpilih?`)) {
                                const path = isModuleView ? 'modules' : 'module-groups';
                                router.post(`/admin/${path}/bulk-delete`, { ids }, {
                                    onSuccess: () => showToast(`${ids.length} ${typeLabel} telah dihapus`, 'success')
                                });
                            }
                        }
                    }
                ] : undefined}
                pagination={isModuleView && modules && modules.meta ? {
                    currentPage: modules.meta.current_page || 1,
                    lastPage: modules.meta.last_page || 1,
                    total: modules.meta.total || 0,
                    from: modules.meta.from || 1,
                    to: modules.meta.to || 1,
                    perPage: modules.meta.per_page || 10,
                    onPageChange: (page) => router.get(globalThis.location.pathname, { ...filters, page }, { preserveState: true, preserveScroll: true }),
                    onPerPageChange: (pp) => router.get(globalThis.location.pathname, { ...filters, per_page: pp, page: 1 }, { preserveState: true, preserveScroll: true }),
                } : (groups && groups.meta ? {
                    currentPage: groups.meta.current_page || 1,
                    lastPage: groups.meta.last_page || 1,
                    total: groups.meta.total || 0,
                    from: groups.meta.from || 1,
                    to: groups.meta.to || 1,
                    perPage: groups.meta.per_page || 10,
                    onPageChange: (page) => router.get(globalThis.location.pathname, { ...filters, page }, { preserveState: true, preserveScroll: true }),
                    onPerPageChange: (pp) => router.get(globalThis.location.pathname, { ...filters, per_page: pp, page: 1 }, { preserveState: true, preserveScroll: true }),
                }: undefined)}
                rowActions={(row) => (
                    <div className="flex items-center gap-1">
                        {canUpdate && <Button variant="ghost" size="icon" onClick={() => openEdit(row)} className="h-8 w-8 text-black/30 dark:text-white/30 hover:text-black dark:hover:text-white"><Pencil size={12} /></Button>}
                        {canDelete && <Button variant="ghost" size="icon" onClick={() => setConfirmDelete({id: row.id, name: row.name})} className="h-8 w-8 text-black/30 dark:text-white/30 hover:text-black dark:hover:text-white"><Trash2 size={12} /></Button>}
                    </div>
                )}
            />

            <ConfirmationModal 
                open={!!confirmDelete}
                onClose={() => setConfirmDelete(null)}
                onConfirm={() => {
                    if (!confirmDelete) return;
                    const path = isModuleView ? 'modules' : 'module-groups';
                    router.delete(`/admin/${path}/${confirmDelete.id}`, {
                        onSuccess: () => {
                            setConfirmDelete(null);
                            showToast(`${isModuleView ? 'Modul' : 'Grup'} telah dihapus`, 'success');
                        }
                    });
                }}
                title={`Hapus ${isModuleView ? 'Modul' : 'Grup'}`}
                description={`Apakah Anda yakin ingin menghapus ${isModuleView ? 'modul' : 'grup'} "${confirmDelete?.name}"? Tindakan ini dapat berdampak pada navigasi admin.`}
                confirmText="Ya, Hapus"
            />

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden rounded-2xl border border-black/[0.1] dark:border-white/[0.1] shadow-2xl bg-white dark:bg-black">
                    <div className="bg-black dark:bg-white p-8 text-white dark:text-black relative">
                        <DialogTitle className="text-xl font-bold flex items-center gap-2 uppercase tracking-tight">
                             {editingItem ? 'Edit' : 'Tambah'} {isModuleView ? 'Modul' : 'Grup'}
                        </DialogTitle>
                        <DialogDescription className="text-white/40 dark:text-black/40 text-[10px] font-bold mt-1 uppercase tracking-widest">Konfigurasi struktur navigasi dan menu sistem</DialogDescription>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        <div className="grid gap-5">
                            {isModuleView ? (
                                <>
                                    <div className="grid gap-2">
                                        <Label className="text-[10px] font-bold text-black/40 dark:text-white/40 uppercase tracking-widest">Judul Modul</Label>
                                        <Input value={moduleForm.data.name} onChange={e => moduleForm.setData('name', e.target.value)} required className="h-10 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border-black/[0.1] dark:border-white/[0.1] font-bold text-sm text-black dark:text-white placeholder:text-black/30 dark:placeholder:text-white/30" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label className="text-[10px] font-bold text-black/40 dark:text-white/40 uppercase tracking-widest">Kode Modul (Unik)</Label>
                                            <Input value={moduleForm.data.identifier} onChange={e => moduleForm.setData('identifier', e.target.value)} required className="h-10 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border-black/[0.1] dark:border-white/[0.1] font-mono text-xs font-bold text-black dark:text-white placeholder:text-black/30 dark:placeholder:text-white/30" />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label className="text-[10px] font-bold text-black/40 dark:text-white/40 uppercase tracking-widest">Grup Menu</Label>
                                            <Select value={String(moduleForm.data.module_group_id)} onValueChange={v => moduleForm.setData('module_group_id', v)}>
                                                <SelectTrigger className="h-10 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] text-xs font-bold text-black dark:text-white border-black/[0.1] dark:border-white/[0.1]"><SelectValue /></SelectTrigger>
                                                <SelectContent className="bg-white dark:bg-black border-black/[0.1] dark:border-white/[0.1] rounded-xl">
                                                    {(groups.data || groups || []).map((g:any) => <SelectItem key={g.id} value={String(g.id)} className="text-[11px] font-bold uppercase">{g.name}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="text-[10px] font-bold text-black/40 dark:text-white/40 uppercase tracking-widest">URL Navigasi</Label>
                                        <Input value={moduleForm.data.route} onChange={e => moduleForm.setData('route', e.target.value)} placeholder="/admin/..." className="h-10 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border-black/[0.1] dark:border-white/[0.1] text-sm font-bold text-black dark:text-white placeholder:text-black/30 dark:placeholder:text-white/30" />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="grid gap-2">
                                        <Label className="text-[10px] font-bold text-black/40 dark:text-white/40 uppercase tracking-widest">Judul Grup Menu</Label>
                                        <Input value={groupForm.data.name} onChange={e => groupForm.setData('name', e.target.value)} required className="h-10 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border-black/[0.1] dark:border-white/[0.1] font-bold text-sm text-black dark:text-white placeholder:text-black/30 dark:placeholder:text-white/30" />
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="flex gap-3 mt-8">
                             <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)} className="flex-1 h-10 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all">Batal</Button>
                             <Button type="submit" disabled={form.processing} className="flex-1 h-10 rounded-lg text-[11px] font-black uppercase tracking-widest shadow-lg transition-all disabled:opacity-50">
                                 {form.processing ? 'Menyimpan...' : 'Simpan Data'}
                             </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
