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

    const groupForm = useForm({
        name: '',
        sequence: 0,
        icon: 'Folder',
    });

    const moduleForm = useForm({
        identifier: '',
        name: '',
        sequence: 0,
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
            className: 'font-black text-slate-900 uppercase tracking-tight text-[12px]',
            cell: (row) => (
                <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded border bg-slate-50 flex items-center justify-center font-mono text-[10px] text-slate-400">#{row.sequence}</span>
                    <span>{row.name}</span>
                </div>
            )
        },
        {
            header: 'Urutan',
            accessorKey: 'sequence',
            className: 'font-mono text-[10px] text-slate-400',
        },
        {
            header: 'Total Modul',
            accessorKey: 'modules_count',
            cell: (row) => <Badge className="bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest">{row.modules_count || 0} MODULS</Badge>
        }
    ], []);

    const moduleColumns = useMemo<Column<any>[]>(() => [
        {
            header: 'Modul & Kode',
            accessorKey: 'name',
            sortable: true,
            className: 'font-black text-slate-900 uppercase tracking-tight text-[12px]',
            cell: (row) => (
                <div className="flex flex-col">
                    <span className="font-black">{row.name}</span>
                    <span className="text-[9px] font-bold text-slate-400 tracking-widest leading-none mt-1">{row.identifier}</span>
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
                        <Badge variant="outline" className="px-2 py-0 text-[10px] font-bold text-slate-600 uppercase border-slate-200">{group?.name || 'GENERAL'}</Badge>
                        <span className="text-[10px] text-slate-400 font-mono">{row.route || '#'}</span>
                    </div>
                )
            }
        },
        {
            header: 'Urutan',
            accessorKey: 'sequence',
            cell: (row) => <span className="font-mono text-[10px] text-slate-400">POS: {row.sequence}</span>
        }
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
                sequence: item.sequence,
                route: item.route || '',
                icon: item.icon || 'LayoutGrid',
                module_group_id: item.module_group_id,
                showed_as_menu: !!item.showed_as_menu,
            });
        } else {
            groupForm.setData({
                name: item.name,
                sequence: item.sequence,
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
        <div className="flex flex-col h-full bg-background animate-in fade-in duration-500">
            <DataTable
                columns={isModuleView ? moduleColumns : groupColumns}
                data={isModuleView ? (modules?.data || modules || []) : (groups?.data || groups || [])}
                searchKey="name"
                searchPlaceholder={`Cari ${isModuleView ? 'modul' : 'grup'}...`}
                headerActions={
                    canCreate && (
                        <Button onClick={openCreate} className="h-9 gap-2 rounded-xl px-5 text-[11px] font-black uppercase tracking-widest shadow-lg shadow-slate-200">
                            <Plus className="h-3.5 w-3.5" /> {isModuleView ? 'Tambah Modul' : 'Tambah Grup'}
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
                        {canUpdate && <Button variant="ghost" size="icon" onClick={() => openEdit(row)} className="h-8 w-8 text-slate-400 hover:text-primary"><Pencil size={12} /></Button>}
                        {canDelete && <Button variant="ghost" size="icon" onClick={() => { 
                            const path = isModuleView ? 'modules' : 'module-groups';
                            if(confirm(`Hapus ${isModuleView ? 'modul' : 'grup'} ini?`)) router.delete(`/admin/${path}/${row.id}`) 
                        }} className="h-8 w-8 text-slate-400 hover:text-rose-600"><Trash2 size={12} /></Button>}
                    </div>
                )}
            />

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden rounded-2xl border-none shadow-2xl">
                    <div className="bg-slate-950 p-8 text-white relative">
                        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none text-white"><LayoutGrid size={80} className="rotate-12" /></div>
                        <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                             <div className="w-2 h-8 bg-primary rounded-full" />
                             {editingItem ? 'Edit' : 'Tambah'} {isModuleView ? 'Modul' : 'Grup'}
                        </DialogTitle>
                        <DialogDescription className="text-slate-400 text-[11px] font-bold uppercase tracking-wider mt-1">Konfigurasi struktur navigasi dan menu sistem</DialogDescription>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        <div className="grid gap-5">
                            {isModuleView ? (
                                <>
                                    <div className="grid gap-2">
                                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Judul Modul</Label>
                                        <Input value={moduleForm.data.name} onChange={e => moduleForm.setData('name', e.target.value)} required className="h-10 rounded-xl bg-slate-50 border-slate-100 font-black uppercase text-sm" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kode Modul (Unik)</Label>
                                            <Input value={moduleForm.data.identifier} onChange={e => moduleForm.setData('identifier', e.target.value)} required className="h-10 rounded-xl bg-slate-50 border-slate-100 font-mono text-xs font-black uppercase" />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Grup Menu</Label>
                                            <Select value={String(moduleForm.data.module_group_id)} onValueChange={v => moduleForm.setData('module_group_id', v)}>
                                                <SelectTrigger className="h-10 rounded-xl bg-slate-50 text-xs font-black uppercase"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    {(groups.data || groups || []).map((g:any) => <SelectItem key={g.id} value={String(g.id)} className="text-[10px] font-black uppercase">{g.name}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">URL Navigasi</Label>
                                            <Input value={moduleForm.data.route} onChange={e => moduleForm.setData('route', e.target.value)} placeholder="/admin/..." className="h-10 rounded-xl bg-slate-50 border-slate-100 text-sm font-medium" />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sequence</Label>
                                            <Input type="number" value={moduleForm.data.sequence} onChange={e => moduleForm.setData('sequence', parseInt(e.target.value))} className="h-10 rounded-xl bg-slate-50 border-slate-100 font-black" />
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="grid gap-2">
                                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Judul Grup Menu</Label>
                                        <Input value={groupForm.data.name} onChange={e => groupForm.setData('name', e.target.value)} required className="h-10 rounded-xl bg-slate-50 border-slate-100 font-black uppercase text-sm" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Urutan (Sequence)</Label>
                                        <Input type="number" value={groupForm.data.sequence} onChange={e => groupForm.setData('sequence', parseInt(e.target.value))} className="h-10 rounded-xl bg-slate-50 border-slate-100 font-black" />
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="flex border-t border-slate-100 mt-8 -mx-8">
                             <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 hover:bg-slate-50 transition-all">Batal</button>
                             <button type="submit" disabled={form.processing} className="flex-1 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-primary hover:bg-primary/5 transition-all disabled:opacity-50">
                                 {form.processing ? 'Menyimpan...' : 'Simpan Data'}
                             </button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
