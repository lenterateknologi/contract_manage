import { useToast } from '@/components/contracts/Toast';
import { Button } from '@/components/ui/base/Button';
import { Column, TableMasterData } from '@/components/ui/data/TableMasterData';
import { CompactInput } from '@/components/ui/forms/CompactInput';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/forms/Select';
import { ConfirmationModal } from '@/components/ui/overlays/ConfirmationModal';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/overlays/Dialog';
import { usePermissions } from '@/hooks/use-permissions';
import { router, useForm } from '@inertiajs/react';
import { Folder, LayoutGrid, Link as LinkIcon, Pencil, Plus, Shield, Trash2 } from 'lucide-react';
import React, { useMemo } from 'react';

interface NavigationManagementProps {
    readonly groups: any;
    readonly modules: any;
    readonly isModuleView?: boolean;
    readonly filters: any;
}

const GroupNameCell = ({ name }: Readonly<{ name: string }>) => (
    <div className="group flex items-center gap-4">
        <div className="bg-primary/[0.03] border-primary/10 text-primary/40 group-hover:bg-primary flex h-10 w-10 items-center justify-center rounded-xl border transition-all group-hover:text-white dark:border-white/10 dark:bg-white/[0.03] dark:text-white/40 dark:group-hover:bg-white dark:group-hover:text-black">
            <Folder size={16} />
        </div>
        <span className="text-primary text-[13px] font-black tracking-tight uppercase dark:text-white">{name}</span>
    </div>
);

const ModulesCountCell = ({ count }: Readonly<{ count: number }>) => (
    <div className="flex items-center gap-2">
        <div className="bg-primary/20 h-1.5 w-1.5 rounded-full dark:bg-white/20" />
        <span className="text-primary/60 text-[10px] font-black uppercase dark:text-white/60">{count || 0} MODULS</span>
    </div>
);

const ModuleNameCell = ({ name, identifier }: Readonly<{ name: string; identifier: string }>) => (
    <div className="group flex flex-col">
        <div className="flex items-center gap-3">
            <span className="text-primary text-[13px] font-black tracking-tight uppercase transition-transform group-hover:translate-x-1 dark:text-white">
                {name}
            </span>
            <div className="bg-primary/[0.05] border-primary/10 text-primary/40 rounded border px-2 py-0.5 text-[8px] font-black uppercase dark:border-white/10 dark:bg-white/[0.05] dark:text-white/40">
                {identifier}
            </div>
        </div>
    </div>
);

const ModuleGroupCell = ({ groupId, groups, route }: Readonly<{ groupId: any; groups: any; route?: string }>) => {
    const grps = groups.data || groups;
    const group = Array.isArray(grps) ? grps.find((g: any) => g.id === groupId) : null;
    return (
        <div className="flex items-center gap-4">
            <div className="bg-primary/[0.03] border-primary/10 flex items-center gap-2 rounded-xl border px-3 py-1.5 dark:border-white/10 dark:bg-white/[0.03]">
                <Folder size={10} className="text-primary/40 dark:text-white/40" />
                <span className="text-primary/60 text-[9px] font-black uppercase dark:text-white/60">{group?.name || 'GENERAL'}</span>
            </div>
            <div className="flex items-center gap-2">
                <LinkIcon size={10} className="text-primary/20 dark:text-white/20" />
                <span className="text-primary/30 font-mono text-[9px] font-bold tracking-tight dark:text-white/30">{route || '#'}</span>
            </div>
        </div>
    );
};

export function NavigationManagement({ groups, modules, isModuleView = false, filters }: Readonly<NavigationManagementProps>) {
    const { showToast } = useToast();
    const { canCreate, canUpdate, canDelete } = usePermissions('NAV_MGMT');
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [editingItem, setEditingItem] = React.useState<any>(null);
    const [confirmDelete, setConfirmDelete] = React.useState<{ id: string; name: string } | null>(null);

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

    const groupColumns = useMemo<Column<any>[]>(
        () => [
            {
                header: 'Grup Navigasi Utama',
                accessorKey: 'name',
                sortable: true,
                cell: (row) => <GroupNameCell name={row.name} />,
            },
            {
                header: 'Kapasitas Modul',
                accessorKey: 'modules_count',
                cell: (row) => <ModulesCountCell count={row.modules_count} />,
            },
        ],
        [],
    );

    const moduleColumns = useMemo<Column<any>[]>(
        () => [
            {
                header: 'Identitas Modul & Kode',
                accessorKey: 'name',
                sortable: true,
                cell: (row) => <ModuleNameCell name={row.name} identifier={row.identifier} />,
            },
            {
                header: 'Grup / Endpoint Navigasi',
                accessorKey: 'module_group_id',
                cell: (row) => <ModuleGroupCell groupId={row.module_group_id} groups={groups} route={row.route} />,
            },
        ],
        [groups],
    );

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
            },
        };
        if (editingItem) router.put(`/admin/${path}/${editingItem.id}`, form.data as any, options);
        else router.post(`/admin/${path}`, form.data as any, options);
    };

    return (
        <div className="animate-in fade-in flex h-full flex-col bg-white antialiased duration-500 dark:bg-black">
            <TableMasterData
                title={isModuleView ? 'Master Modul Navigasi' : 'Struktur Grup Menu'}
                columns={isModuleView ? moduleColumns : groupColumns}
                data={isModuleView ? modules?.data || modules || [] : groups?.data || groups || []}
                searchKey="name"
                searchPlaceholder={`Cari ${isModuleView ? 'modul' : 'grup'}...`}
                headerActions={
                    canCreate && (
                        <Button variant="primary" onClick={openCreate} className="h-10 px-8 shadow-xl active:scale-95">
                            <Plus size={14} className="mr-2" /> {isModuleView ? 'Registrasi Modul' : 'Tambah Grup Baru'}
                        </Button>
                    )
                }
                bulkActions={
                    canUpdate
                        ? [
                              {
                                  label: 'Hapus Terpilih',
                                  icon: Trash2,
                                  variant: 'destructive',
                                  onClick: (ids: string[] | number[]) => {
                                      const typeLabel = isModuleView ? 'modul' : 'grup menu';
                                      if (confirm(`Hapus ${ids.length} ${typeLabel} terpilih? Tindakan ini akan menghapus akses permanen.`)) {
                                          const path = isModuleView ? 'modules' : 'module-groups';
                                          router.post(
                                              `/admin/${path}/bulk-delete`,
                                              { ids },
                                              {
                                                  onSuccess: () => showToast(`${ids.length} ${typeLabel} telah dihapus dari sistem`, 'success'),
                                              },
                                          );
                                      }
                                  },
                              },
                          ]
                        : undefined
                }
                pagination={
                    isModuleView && modules && modules.meta
                        ? {
                              currentPage: modules.meta.current_page || 1,
                              lastPage: modules.meta.last_page || 1,
                              total: modules.meta.total || 0,
                              onPageChange: (page: number) =>
                                  router.get(globalThis.location.pathname, { ...filters, page }, { preserveState: true, preserveScroll: true }),
                          }
                        : groups && groups.meta
                          ? {
                                currentPage: groups.meta.current_page || 1,
                                lastPage: groups.meta.last_page || 1,
                                total: groups.meta.total || 0,
                                onPageChange: (page: number) =>
                                    router.get(globalThis.location.pathname, { ...filters, page }, { preserveState: true, preserveScroll: true }),
                            }
                          : undefined
                }
                rowActions={(row: any) => (
                    <div className="flex items-center justify-end gap-1">
                        {canUpdate && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEdit(row)}
                                className="text-primary/20 hover:text-primary hover:bg-primary/[0.05] h-9 w-9 rounded-xl transition-all dark:text-white/20 dark:hover:bg-white/[0.05] dark:hover:text-white"
                            >
                                <Pencil size={14} />
                            </Button>
                        )}
                        {canDelete && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setConfirmDelete({ id: row.id, name: row.name })}
                                className="text-primary/20 h-9 w-9 rounded-xl transition-all hover:bg-rose-500/5 hover:text-rose-500 dark:text-white/20"
                            >
                                <Trash2 size={14} />
                            </Button>
                        )}
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
                        },
                    });
                }}
                title={`Hapus ${isModuleView ? 'Modul' : 'Grup'}`}
                description={`Apakah Anda yakin ingin menghapus ${isModuleView ? 'modul' : 'grup'} "${confirmDelete?.name}"? Tindakan ini bersifat permanen dan akan menghapus menu terkait dari navigasi admin.`}
                confirmText="Ya, Hapus Permanen"
            />

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="border-primary/10 max-w-[480px] overflow-hidden rounded-[2.5rem] border bg-white p-0 shadow-2xl dark:border-white/10 dark:bg-black">
                    <div className="bg-primary relative overflow-hidden p-10 text-white dark:bg-white dark:text-black">
                        <div className="absolute top-0 right-0 rotate-12 p-8 opacity-10">
                            <LayoutGrid size={120} strokeWidth={1} />
                        </div>
                        <DialogTitle className="relative z-10 flex items-center gap-3 text-2xl font-black tracking-tight uppercase">
                            {editingItem ? 'Edit' : 'Registrasi'} {isModuleView ? 'Modul' : 'Grup'}
                        </DialogTitle>
                        <DialogDescription className="relative z-10 mt-2 text-[10px] leading-relaxed font-bold tracking-[0.2em] text-white/50 uppercase dark:text-black/50">
                            Konfigurasi struktur hierarki navigasi dan endpoint sistem administrasi
                        </DialogDescription>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8 p-10">
                        <div className="space-y-6">
                            {isModuleView ? (
                                <>
                                    <CompactInput
                                        label="Nama Modul Navigasi"
                                        value={moduleForm.data.name}
                                        onChange={(e) => moduleForm.setData('name', e.target.value)}
                                        placeholder="CONTOH: MANAJEMEN VENDOR"
                                        required
                                        icon={LayoutGrid}
                                    />
                                    <div className="grid grid-cols-2 gap-6">
                                        <CompactInput
                                            label="Kode Unik Modul"
                                            value={moduleForm.data.identifier}
                                            onChange={(e) => moduleForm.setData('identifier', e.target.value)}
                                            placeholder="VENDOR_MGMT"
                                            required
                                            icon={Shield}
                                        />
                                        <div className="space-y-2">
                                            <label className="text-primary/60 flex items-center gap-2 text-[10px] font-bold uppercase dark:text-white/60">
                                                Grup Menu Utama
                                            </label>
                                            <Select
                                                value={String(moduleForm.data.module_group_id)}
                                                onValueChange={(v: string) => moduleForm.setData('module_group_id', String(v))}
                                            >
                                                <SelectTrigger className="border-primary/10 bg-primary/5 focus:border-primary h-10 rounded-xl text-xs font-bold transition-all">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="border-primary/10 rounded-xl bg-white shadow-2xl dark:bg-black">
                                                    {(groups.data || groups || []).map((g: any) => (
                                                        <SelectItem key={g.id} value={String(g.id)} className="py-2.5 text-xs font-bold uppercase">
                                                            {g.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <CompactInput
                                        label="URL Endpoint / Route"
                                        value={moduleForm.data.route}
                                        onChange={(e) => moduleForm.setData('route', e.target.value)}
                                        placeholder="/admin/vendor-management"
                                        icon={LinkIcon}
                                    />
                                </>
                            ) : (
                                <CompactInput
                                    label="Judul Grup Menu Utama"
                                    value={groupForm.data.name}
                                    onChange={(e) => groupForm.setData('name', e.target.value)}
                                    placeholder="CONTOH: MASTER DATA"
                                    required
                                    icon={Folder}
                                />
                            )}
                        </div>

                        <div className="border-primary/5 mt-10 flex gap-4 border-t pt-6 dark:border-white/5">
                            <Button
                                variant="ghost"
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="text-primary/30 hover:text-primary h-12 flex-1 rounded-2xl text-[11px] font-black uppercase transition-all"
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={form.processing}
                                className="h-12 flex-1 rounded-2xl text-[11px] font-black uppercase shadow-2xl transition-all disabled:opacity-50"
                            >
                                {form.processing ? 'Memproses...' : 'Simpan Perubahan'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
