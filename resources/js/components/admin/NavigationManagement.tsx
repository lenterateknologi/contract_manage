import React, { useMemo } from 'react';
import { Column, DataTable } from '@/components/ui/data/DataTable';
import { Button } from '@/components/ui/base/Button';
import { CompactInput } from '@/components/ui/forms/CompactInput';
import { CompactSelect } from '@/components/ui/forms/CompactSelect';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/overlays/Dialog';
import { useForm, router } from '@inertiajs/react';
import { Pencil, Plus, Trash2, LayoutGrid, Folder, Hash, Link as LinkIcon, Shield } from 'lucide-react';
import { usePermissions } from '@/hooks/use-permissions';
import { useToast } from '@/components/contracts/Toast';
import { ConfirmationModal } from '@/components/ui/overlays/ConfirmationModal';

interface NavigationManagementProps {
    readonly groups: any;
    readonly modules: any;
    readonly isModuleView?: boolean;
    readonly filters: any;
}

const GroupNameCell = ({ name }: Readonly<{ name: string }>) => (
    <div className="flex items-center gap-4 group">
        <div className="h-10 w-10 rounded-xl bg-primary/[0.03] dark:bg-white/[0.03] border border-primary/10 dark:border-white/10 flex items-center justify-center text-primary/40 dark:text-white/40 group-hover:bg-primary group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black transition-all">
            <Folder size={16} />
        </div>
        <span className="font-black text-[13px] tracking-tight uppercase text-primary dark:text-white">{name}</span>
    </div>
);

const ModulesCountCell = ({ count }: Readonly<{ count: number }>) => (
    <div className="flex items-center gap-2">
        <div className="h-1.5 w-1.5 rounded-full bg-primary/20 dark:bg-white/20" />
        <span className="text-[10px] font-black uppercase tracking-widest text-primary/60 dark:text-white/60">
            {count || 0} MODULS
        </span>
    </div>
);

const ModuleNameCell = ({ name, identifier }: Readonly<{ name: string; identifier: string }>) => (
    <div className="flex flex-col group">
        <div className="flex items-center gap-3">
            <span className="font-black text-[13px] tracking-tight uppercase text-primary dark:text-white group-hover:translate-x-1 transition-transform">{name}</span>
            <div className="px-2 py-0.5 rounded bg-primary/[0.05] dark:bg-white/[0.05] border border-primary/10 dark:border-white/10 text-[8px] font-black tracking-widest text-primary/40 dark:text-white/40 uppercase">
                {identifier}
            </div>
        </div>
    </div>
);

const ModuleGroupCell = ({ groupId, groups, route }: Readonly<{ groupId: any; groups: any; route?: string }>) => {
    const grps = (groups.data || groups);
    const group = Array.isArray(grps) ? grps.find((g: any) => g.id === groupId) : null;
    return (
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/[0.03] dark:bg-white/[0.03] border border-primary/10 dark:border-white/10">
                <Folder size={10} className="text-primary/40 dark:text-white/40" />
                <span className="text-[9px] font-black text-primary/60 dark:text-white/60 uppercase tracking-widest">{group?.name || 'GENERAL'}</span>
            </div>
            <div className="flex items-center gap-2">
                <LinkIcon size={10} className="text-primary/20 dark:text-white/20" />
                <span className="text-[9px] text-primary/30 dark:text-white/30 font-bold font-mono tracking-tight">{route || '#'}</span>
            </div>
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
            header: 'Grup Navigasi Utama',
            accessorKey: 'name',
            sortable: true,
            cell: (row) => <GroupNameCell name={row.name} />
        },
        {
            header: 'Kapasitas Modul',
            accessorKey: 'modules_count',
            cell: (row) => <ModulesCountCell count={row.modules_count} />
        }
    ], []);

    const moduleColumns = useMemo<Column<any>[]>(() => [
        {
            header: 'Identitas Modul & Kode',
            accessorKey: 'name',
            sortable: true,
            cell: (row) => <ModuleNameCell name={row.name} identifier={row.identifier} />
        },
        {
            header: 'Grup / Endpoint Navigasi',
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
                showToast(editingItem ? 'Konfigurasi navigasi diperbarui' : 'Grup navigasi baru telah ditambahkan', 'success');
            },
            onError: (err: any) => {
                console.error(err);
                showToast('Gagal memproses perubahan navigasi', 'danger');
            }
        };
        if (editingItem) router.put(`/admin/${path}/${editingItem.id}`, form.data as any, options);
        else router.post(`/admin/${path}`, form.data as any, options);
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-black animate-in fade-in duration-500 antialiased">
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
                            <Plus size={14} className="mr-2" /> {isModuleView ? 'Registrasi Modul' : 'Tambah Grup Baru'}
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
                            if (confirm(`Hapus ${ids.length} ${typeLabel} terpilih? Tindakan ini akan menghapus akses permanen.`)) {
                                const path = isModuleView ? 'modules' : 'module-groups';
                                router.post(`/admin/${path}/bulk-delete`, { ids }, {
                                    onSuccess: () => showToast(`${ids.length} ${typeLabel} telah dihapus dari sistem`, 'success')
                                });
                            }
                        }
                    }
                ] : undefined}
                pagination={isModuleView && modules && modules.meta ? {
                    currentPage: modules.meta.current_page || 1,
                    lastPage: modules.meta.last_page || 1,
                    total: modules.meta.total || 0,
                    onPageChange: (page) => router.get(globalThis.location.pathname, { ...filters, page }, { preserveState: true, preserveScroll: true }),
                } : (groups && groups.meta ? {
                    currentPage: groups.meta.current_page || 1,
                    lastPage: groups.meta.last_page || 1,
                    total: groups.meta.total || 0,
                    onPageChange: (page) => router.get(globalThis.location.pathname, { ...filters, page }, { preserveState: true, preserveScroll: true }),
                }: undefined)}
                rowActions={(row) => (
                    <div className="flex items-center gap-1">
                        {canUpdate && <Button variant="ghost" size="icon" onClick={() => openEdit(row)} className="h-9 w-9 text-primary/20 dark:text-white/20 hover:text-primary dark:hover:text-white hover:bg-primary/[0.05] dark:hover:bg-white/[0.05] rounded-xl transition-all"><Pencil size={14} /></Button>}
                        {canDelete && <Button variant="ghost" size="icon" onClick={() => setConfirmDelete({id: row.id, name: row.name})} className="h-9 w-9 text-primary/20 dark:text-white/20 hover:text-rose-500 hover:bg-rose-500/5 rounded-xl transition-all"><Trash2 size={14} /></Button>}
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
                description={`Apakah Anda yakin ingin menghapus ${isModuleView ? 'modul' : 'grup'} "${confirmDelete?.name}"? Tindakan ini bersifat permanen dan akan menghapus menu terkait dari navigasi admin.`}
                confirmText="Ya, Hapus Permanen"
            />

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-[480px] p-0 overflow-hidden rounded-[2.5rem] border border-primary/10 dark:border-white/10 shadow-2xl bg-white dark:bg-black">
                    <div className="bg-primary dark:bg-white p-10 text-white dark:text-black relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
                            <LayoutGrid size={120} strokeWidth={1} />
                        </div>
                        <DialogTitle className="text-2xl font-black flex items-center gap-3 uppercase tracking-tight relative z-10">
                             {editingItem ? 'Edit' : 'Registrasi'} {isModuleView ? 'Modul' : 'Grup'}
                        </DialogTitle>
                        <DialogDescription className="text-white/50 dark:text-black/50 text-[10px] font-bold mt-2 uppercase tracking-[0.2em] relative z-10 leading-relaxed">
                            Konfigurasi struktur hierarki navigasi dan endpoint sistem administrasi
                        </DialogDescription>
                    </div>

                    <form onSubmit={handleSubmit} className="p-10 space-y-8">
                        <div className="space-y-6">
                            {isModuleView ? (
                                <>
                                    <CompactInput 
                                        label="Nama Modul Navigasi"
                                        value={moduleForm.data.name}
                                        onChange={e => moduleForm.setData('name', e.target.value)}
                                        placeholder="CONTOH: MANAJEMEN VENDOR"
                                        required
                                        icon={LayoutGrid}
                                    />
                                    <div className="grid grid-cols-2 gap-6">
                                        <CompactInput 
                                            label="Kode Unik Modul"
                                            value={moduleForm.data.identifier}
                                            onChange={e => moduleForm.setData('identifier', e.target.value)}
                                            placeholder="VENDOR_MGMT"
                                            required
                                            icon={Shield}
                                        />
                                        <CompactSelect 
                                            label="Grup Menu Utama"
                                            value={String(moduleForm.data.module_group_id)}
                                            onChange={v => moduleForm.setData('module_group_id', v)}
                                            options={(groups.data || groups || []).map((g:any) => ({
                                                label: g.name,
                                                value: String(g.id)
                                            }))}
                                            icon={Folder}
                                        />
                                    </div>
                                    <CompactInput 
                                        label="URL Endpoint / Route"
                                        value={moduleForm.data.route}
                                        onChange={e => moduleForm.setData('route', e.target.value)}
                                        placeholder="/admin/vendor-management"
                                        icon={LinkIcon}
                                    />
                                </>
                            ) : (
                                <CompactInput 
                                    label="Judul Grup Menu Utama"
                                    value={groupForm.data.name}
                                    onChange={e => groupForm.setData('name', e.target.value)}
                                    placeholder="CONTOH: MASTER DATA"
                                    required
                                    icon={Folder}
                                />
                            )}
                        </div>

                        <div className="flex gap-4 mt-10 pt-6 border-t border-primary/5 dark:border-white/5">
                             <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)} className="flex-1 h-12 rounded-2xl text-[11px] font-black uppercase tracking-widest text-primary/30 hover:text-primary transition-all">Batal</Button>
                             <Button type="submit" disabled={form.processing} className="flex-1 h-12 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-2xl transition-all disabled:opacity-50">
                                 {form.processing ? 'Memproses...' : 'Simpan Perubahan'}
                             </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
