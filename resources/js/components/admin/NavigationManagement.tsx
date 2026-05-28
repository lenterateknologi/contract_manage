import { useToast } from '@/components/contracts/Toast';
import { Button } from '@/components/ui/base/Button';
import { Column, DataTable } from '@/components/ui/data/DataTable';
import { CompactInput } from '@/components/ui/forms/CompactInput';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/forms/Select';
import { ConfirmationModal } from '@/components/ui/overlays/ConfirmationModal';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/overlays/Dialog';
import { usePermissions } from '@/hooks/use-permissions';
import { router, useForm } from '@inertiajs/react';
import {
    LayoutGrid,
    FileText,
    Clock,
    FilePlus,
    FileEdit,
    History,
    Users,
    ShieldCheck,
    Settings2,
    GitBranch,
    BarChart3,
    Tags,
    Building2,
    Truck,
    UserCheck,
    FolderClosed,
    FileCode,
    ScanLine,
    Workflow,
    UserCog,
    KeyRound,
    ShieldAlert,
    Folder,
    Link as LinkIcon,
    Pencil,
    Plus,
    Shield,
    Trash2,
    type LucideIcon,
} from 'lucide-react';
import React, { useMemo } from 'react';

export const SELECTABLE_ICONS: Record<string, LucideIcon> = {
    LayoutGrid,
    FileText,
    Clock,
    FilePlus,
    FileEdit,
    History,
    Users,
    ShieldCheck,
    Settings2,
    GitBranch,
    BarChart3,
    Tags,
    Building2,
    Truck,
    UserCheck,
    FolderClosed,
    FileCode,
    ScanLine,
    Workflow,
    UserCog,
    KeyRound,
    ShieldAlert,
};

interface NavigationManagementProps {
    readonly groups: any;
    readonly modules: any;
    readonly isModuleView?: boolean;
    readonly filters: any;
}

const GroupNameCell = ({ name }: Readonly<{ name: string }>) => (
    <div className="group flex items-center gap-4">
        <div className="bg-surface-muted border-surface-border text-text-main/40 group-hover:bg-primary flex h-10 w-10 items-center justify-center rounded-xl border transition-all group-hover:text-white">
            <Folder size={16} />
        </div>
        <span className="text-text-main text-[13px] font-semibold tracking-tight uppercase">{name}</span>
    </div>
);

const ModulesCountCell = ({ count }: Readonly<{ count: number }>) => (
    <div className="flex items-center gap-2">
        <div className="bg-primary/20 h-1.5 w-1.5 rounded-full" />
        <span className="text-text-desc text-[10px] font-semibold uppercase">{count || 0} MODULS</span>
    </div>
);

const ModuleNameCell = ({ name, identifier, description, icon }: Readonly<{ name: string; identifier: string; description?: string; icon?: string }>) => {
    const IconComp = icon && SELECTABLE_ICONS[icon] ? SELECTABLE_ICONS[icon] : LayoutGrid;
    return (
        <div className="group flex items-start gap-3">
            <div className="bg-surface-muted border-surface-border text-text-main/40 group-hover:bg-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-all group-hover:text-white mt-0.5">
                <IconComp size={14} />
            </div>
            <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-3">
                    <span className="text-text-main text-[13px] font-semibold tracking-tight uppercase transition-transform group-hover:translate-x-1">
                        {name}
                    </span>
                    <div className="bg-primary/[0.05] border-surface-border text-text-main/40 rounded border px-2 py-0.5 text-[8px] font-semibold uppercase">
                        {identifier}
                    </div>
                </div>
                {description && (
                    <span className="text-text-desc text-[11px] leading-relaxed text-muted-foreground whitespace-pre-wrap max-w-md">
                        {description}
                    </span>
                )}
            </div>
        </div>
    );
};

const ModuleGroupCell = ({ groupId, groups, route }: Readonly<{ groupId: any; groups: any; route?: string }>) => {
    const grps = groups.data || groups;
    const group = Array.isArray(grps) ? grps.find((g: any) => g.id === groupId) : null;
    return (
        <div className="flex items-center gap-4">
            <div className="bg-surface-muted border-surface-border flex items-center gap-2 rounded-xl border px-3 py-1.5">
                <Folder size={10} className="text-text-main/40" />
                <span className="text-text-desc text-[9px] font-semibold uppercase">{group?.name || 'GENERAL'}</span>
            </div>
            <div className="flex items-center gap-2">
                <LinkIcon size={10} className="text-text-main/20" />
                <span className="text-text-main/30 font-mono text-[9px] font-medium tracking-tight">{route || '#'}</span>
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
        description: '',
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
                cell: (row) => <ModuleNameCell name={row.name} identifier={row.identifier} description={row.description} icon={row.icon} />,
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
        if (isModuleView) {
            moduleForm.reset();
        } else {
            groupForm.reset();
        }
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
                description: item.description || '',
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
        <>
            <DataTable
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
                                className="text-text-main/20 hover:text-text-main hover:bg-primary/[0.05] h-9 w-9 rounded-xl transition-all"
                            >
                                <Pencil size={14} />
                            </Button>
                        )}
                        {canDelete && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setConfirmDelete({ id: row.id, name: row.name })}
                                className="text-text-main/20 hover:bg-danger/5 hover:text-danger h-9 w-9 rounded-xl transition-all"
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
                <DialogContent className="border-surface-border max-w-[480px] overflow-hidden rounded-[2.5rem] border bg-card p-0 shadow-2xl">
                    <div className="bg-primary relative overflow-hidden p-10 text-white">
                        <div className="absolute top-0 right-0 rotate-12 p-8 opacity-10">
                            <LayoutGrid size={120} strokeWidth={1} />
                        </div>
                        <DialogTitle className="relative z-10 flex items-center gap-3 text-2xl font-semibold tracking-tight uppercase">
                            {editingItem ? 'Edit' : 'Registrasi'} {isModuleView ? 'Modul' : 'Grup'}
                        </DialogTitle>
                        <DialogDescription className="relative z-10 mt-2 text-[10px] leading-relaxed font-medium tracking-wider text-white/50 uppercase">
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
                                            <label className="text-text-desc flex items-center gap-2 text-[10px] font-medium uppercase">
                                                Grup Menu Utama
                                            </label>
                                            <Select
                                                value={String(moduleForm.data.module_group_id)}
                                                onValueChange={(v: string) => moduleForm.setData('module_group_id', String(v))}
                                            >
                                                <SelectTrigger className="border-surface-border bg-primary/5 focus:border-primary h-10 rounded-xl text-xs font-medium transition-all">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="border-surface-border rounded-xl bg-card shadow-2xl">
                                                    {(groups.data || groups || []).map((g: any) => (
                                                        <SelectItem key={g.id} value={String(g.id)} className="py-2.5 text-xs font-medium uppercase">
                                                            {g.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <CompactInput
                                            label="URL Endpoint / Route"
                                            value={moduleForm.data.route}
                                            onChange={(e) => moduleForm.setData('route', e.target.value)}
                                            placeholder="/admin/vendor-management"
                                            icon={LinkIcon}
                                        />
                                        <div className="space-y-2">
                                            <label className="text-text-desc flex items-center gap-2 text-[10px] font-medium uppercase">
                                                Icon Modul
                                            </label>
                                            <Select
                                                value={moduleForm.data.icon || 'LayoutGrid'}
                                                onValueChange={(v: string) => moduleForm.setData('icon', v)}
                                            >
                                                <SelectTrigger className="border-surface-border bg-primary/5 focus:border-primary h-10 rounded-xl text-xs font-medium transition-all">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="border-surface-border max-h-60 rounded-xl bg-card shadow-2xl overflow-y-auto">
                                                    {Object.keys(SELECTABLE_ICONS).map((iconName) => {
                                                        const IconComponent = SELECTABLE_ICONS[iconName];
                                                        return (
                                                            <SelectItem key={iconName} value={iconName} className="py-2.5 text-xs font-medium uppercase">
                                                                <div className="flex items-center gap-2">
                                                                    {IconComponent && <IconComponent size={14} className="text-text-main/50" />}
                                                                    <span>{iconName}</span>
                                                                </div>
                                                            </SelectItem>
                                                        );
                                                    })}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5 w-full group">
                                        <div className="flex items-center justify-between px-0.5">
                                            <label className="text-xs font-bold uppercase transition-colors text-primary/60 dark:text-white/60">
                                                Deskripsi Modul
                                            </label>
                                        </div>
                                        <textarea
                                            value={moduleForm.data.description || ''}
                                            onChange={(e) => moduleForm.setData('description', e.target.value)}
                                            placeholder="CONTOH: MODUL UNTUK MENGELOLA DATA VENDOR UTAMA"
                                            className="flex min-h-[80px] w-full rounded-lg border bg-white dark:bg-white/[0.02] px-3 py-2 text-sm font-medium transition-all outline-none border-primary/5 dark:border-white/5 text-black dark:text-white focus:border-primary/20 dark:focus:border-white/20 focus:bg-primary/[0.01] dark:focus:bg-white/[0.01] shadow-sm resize-none"
                                        />
                                    </div>
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

                        <div className="border-surface-border mt-10 flex gap-4 border-t pt-6">
                            <Button
                                variant="ghost"
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="text-text-main/30 hover:text-text-main h-12 flex-1 rounded-2xl text-[11px] font-semibold uppercase transition-all"
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={form.processing}
                                className="h-12 flex-1 rounded-2xl text-[11px] font-semibold uppercase shadow-2xl transition-all disabled:opacity-50"
                            >
                                {form.processing ? 'Memproses...' : 'Simpan Perubahan'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
