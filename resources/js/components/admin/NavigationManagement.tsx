import React, { useMemo } from 'react';
import { Column, DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { useForm, router } from '@inertiajs/react';
import { LayoutGrid, Pencil, Plus, Trash2, Link } from 'lucide-react';
import { usePermissions } from '@/hooks/use-permissions';
import { useToast } from '@/components/contracts/Toast';
import { cn } from '@/lib/utils';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';

interface NavigationManagementProps {
    groups: any;
    modules: any;
    isModuleView?: boolean;
    filters: any;
}

export function NavigationManagement({ groups, modules, isModuleView = false, filters }: NavigationManagementProps) {
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
            className: 'font-bold text-black dark:text-white text-[12px]',
            cell: (row) => (
                <div className="flex items-center gap-3">
                    <span className="font-bold">{row.name}</span>
                </div>
            )
        },

        {
            header: 'Total Modul',
            accessorKey: 'modules_count',
            cell: (row) => <Badge className="bg-black dark:bg-white text-white dark:text-black text-[10px] font-bold uppercase tracking-wide rounded-none border-none">{row.modules_count || 0} MODULS</Badge>
        }
    ], []);

    const moduleColumns = useMemo<Column<any>[]>(() => [
        {
            header: 'Modul & Kode',
            accessorKey: 'name',
            sortable: true,
            className: 'font-bold text-black dark:text-white text-[12px]',
            cell: (row) => (
                <div className="flex flex-col">
                    <span className="font-bold uppercase tracking-tight">{row.name}</span>
                    <span className="text-[10px] font-bold text-black/40 dark:text-white/40 mt-1">{row.identifier}</span>
                </div>
            )
        },
        {
            header: 'Grup / Navigasi',
            accessorKey: 'module_group_id',
            cell: (row) => {
                const grps = (groups.data || groups);
                const group = Array.isArray(grps) ? grps.find((g:any) => g.id === row.module_group_id) : null;
                return (
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="px-2 py-0 text-[10px] font-bold text-black dark:text-white uppercase border-black dark:border-white rounded-none">{group?.name || 'GENERAL'}</Badge>
                        <span className="text-[10px] text-black/50 dark:text-white/50 font-bold font-mono">{row.route || '#'}</span>
                    </div>
                )
            }
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
                columns={isModuleView ? moduleColumns : groupColumns}
                data={isModuleView ? (modules?.data || modules || []) : (groups?.data || groups || [])}
                searchKey="name"
                searchPlaceholder={`Cari ${isModuleView ? 'modul' : 'grup'}...`}
                headerActions={
                    canCreate && (
                        <Button onClick={openCreate} className="h-9 gap-2 rounded-none px-6 text-[11px] font-bold bg-black dark:bg-white text-white dark:text-black uppercase tracking-widest hover:opacity-90 transition-all">
                            <Plus className="h-4 w-4" /> {isModuleView ? 'Tambah Modul' : 'Tambah Grup'}
                        </Button>
                    )
                }
                pagination={isModuleView && modules && modules.meta ? {
                    currentPage: modules.meta.current_page || 1,
                    lastPage: modules.meta.last_page || 1,
                    total: modules.meta.total || 0,
                    from: modules.meta.from || 1,
                    to: modules.meta.to || 1,
                    perPage: modules.meta.per_page || 10,
                    onPageChange: (page) => router.get(window.location.pathname, { ...filters, page }, { preserveState: true, preserveScroll: true }),
                    onPerPageChange: (pp) => router.get(window.location.pathname, { ...filters, per_page: pp, page: 1 }, { preserveState: true, preserveScroll: true }),
                } : (groups && groups.meta ? {
                    currentPage: groups.meta.current_page || 1,
                    lastPage: groups.meta.last_page || 1,
                    total: groups.meta.total || 0,
                    from: groups.meta.from || 1,
                    to: groups.meta.to || 1,
                    perPage: groups.meta.per_page || 10,
                    onPageChange: (page) => router.get(window.location.pathname, { ...filters, page }, { preserveState: true, preserveScroll: true }),
                    onPerPageChange: (pp) => router.get(window.location.pathname, { ...filters, per_page: pp, page: 1 }, { preserveState: true, preserveScroll: true }),
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
                <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden rounded-none border border-black dark:border-white shadow-2xl bg-white dark:bg-black">
                    <div className="bg-black dark:bg-white p-8 text-white dark:text-black relative">
                        <DialogTitle className="text-xl font-bold flex items-center gap-2 uppercase tracking-tight">
                             <div className="w-1.5 h-6 bg-white dark:bg-black" />
                             {editingItem ? 'Edit' : 'Tambah'} {isModuleView ? 'Modul' : 'Grup'}
                        </DialogTitle>
                        <DialogDescription className="text-white/60 dark:text-black/60 text-[10px] font-bold mt-1 uppercase tracking-wider">Konfigurasi struktur navigasi dan menu sistem</DialogDescription>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        <div className="grid gap-5">
                            {isModuleView ? (
                                <>
                                    <div className="grid gap-2">
                                        <Label className="text-[10px] font-bold text-black dark:text-white uppercase tracking-wider">Judul Modul</Label>
                                        <Input value={moduleForm.data.name} onChange={e => moduleForm.setData('name', e.target.value)} required className="h-10 rounded-none bg-white dark:bg-black border-black dark:border-white font-bold text-sm text-black dark:text-white placeholder:text-black/30 dark:placeholder:text-white/30" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label className="text-[10px] font-bold text-black dark:text-white uppercase tracking-wider">Kode Modul (Unik)</Label>
                                            <Input value={moduleForm.data.identifier} onChange={e => moduleForm.setData('identifier', e.target.value)} required className="h-10 rounded-none bg-white dark:bg-black border-black dark:border-white font-mono text-xs font-bold text-black dark:text-white placeholder:text-black/30 dark:placeholder:text-white/30" />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label className="text-[10px] font-bold text-black dark:text-white uppercase tracking-wider">Grup Menu</Label>
                                            <Select value={String(moduleForm.data.module_group_id)} onValueChange={v => moduleForm.setData('module_group_id', v)}>
                                                <SelectTrigger className="h-10 rounded-none bg-white dark:bg-black text-xs font-bold text-black dark:text-white border-black dark:border-white"><SelectValue /></SelectTrigger>
                                                <SelectContent className="bg-white dark:bg-black border-black dark:border-white rounded-none">
                                                    {(groups.data || groups || []).map((g:any) => <SelectItem key={g.id} value={String(g.id)} className="text-[11px] font-bold uppercase">{g.name}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="text-[10px] font-bold text-black dark:text-white uppercase tracking-wider">URL Navigasi</Label>
                                        <Input value={moduleForm.data.route} onChange={e => moduleForm.setData('route', e.target.value)} placeholder="/admin/..." className="h-10 rounded-none bg-white dark:bg-black border-black dark:border-white text-sm font-bold text-black dark:text-white placeholder:text-black/30 dark:placeholder:text-white/30" />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="grid gap-2">
                                        <Label className="text-[10px] font-bold text-black dark:text-white uppercase tracking-wider">Judul Grup Menu</Label>
                                        <Input value={groupForm.data.name} onChange={e => groupForm.setData('name', e.target.value)} required className="h-10 rounded-none bg-white dark:bg-black border-black dark:border-white font-bold text-sm text-black dark:text-white placeholder:text-black/30 dark:placeholder:text-white/30" />
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="flex border-t border-black dark:border-white mt-8 -mx-8">
                             <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-6 text-[11px] font-bold uppercase tracking-widest text-black/40 dark:text-white/40 hover:bg-black/5 dark:hover:bg-white/5 transition-all">Batal</button>
                             <button type="submit" disabled={form.processing} className="flex-1 py-6 text-[11px] font-black uppercase tracking-widest text-black dark:text-white hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-all disabled:opacity-50">
                                 {form.processing ? 'Menyimpan...' : 'Simpan Data'}
                             </button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
