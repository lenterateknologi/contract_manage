import { useToast } from '@/components/contracts/Toast';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { Column, DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePermissions } from '@/hooks/use-permissions';
import { router, useForm } from '@inertiajs/react';
import { Key, LayoutGrid, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import React, { useMemo } from 'react';
import { ManagementForm } from './ManagementForm';

interface RoleManagementProps {
    roles: any;
    filters: any;
}

export function RoleManagement({ roles, filters }: Readonly<RoleManagementProps>) {
    const { showToast } = useToast();
    const { canCreate, canDelete } = usePermissions('ADMIN_ROLES');
    const [isFormView, setIsFormView] = React.useState(false);
    const [editingRole, setEditingRole] = React.useState<any>(null);
    const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);

    const form = useForm({
        name: '',
        description: '',
    });

    const filterConfig = useMemo(
        () => [
            {
                label: 'Tanggal Registrasi',
                key: 'created',
                type: 'date-range',
            },
        ],
        [],
    );

    const handleFilterChange = (newFilters: Record<string, any>) => {
        router.get(
            window.location.pathname,
            {
                ...filters,
                ...newFilters,
                page: 1,
            },
            { preserveState: true, replace: true },
        );
    };

    const handleReset = () => {
        router.get(window.location.pathname, { search: filters.search }, { preserveState: true, replace: true });
    };

    const columns = useMemo<Column<any>[]>(
        () => [
            {
                header: 'Nama Role / Jabatan',
                accessorKey: 'name',
                sortable: true,
                cell: (row) => (
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/[0.05] bg-black/[0.03] text-black/30 transition-colors group-hover:text-black dark:border-white/[0.05] dark:bg-white/[0.03] dark:text-white/30 dark:group-hover:text-white">
                            <ShieldCheck size={18} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[13px] leading-tight font-bold text-black dark:text-white">{row.name}</span>
                            <span className="mt-0.5 text-[10px] font-bold tracking-widest text-black/30 uppercase dark:text-white/30">
                                TERDAFTAR: {new Date(row.created_at).toLocaleDateString('id-ID')}
                            </span>
                        </div>
                    </div>
                ),
            },
            {
                header: 'Deskripsi Otoritas',
                accessorKey: 'description',
                cell: (row) =>
                    row.description ? (
                        <span className="block max-w-sm truncate text-[11px] leading-tight font-bold tracking-tight text-black/40 uppercase dark:text-white/40">
                            {row.description}
                        </span>
                    ) : (
                        <span className="text-[10px] leading-none font-bold tracking-widest text-black/20 uppercase italic dark:text-white/20">
                            —
                        </span>
                    ),
            },
            {
                header: 'Pemetaan Akses',
                accessorKey: 'role_config',
                cell: (row) => (
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                            variant="outline"
                            onClick={() => router.get(`/admin/roles/${row.id}/access`)}
                            className="flex h-8 items-center gap-2 px-4 text-[9px] active:scale-95"
                        >
                            <Key size={11} className="opacity-40" /> Hak Akses
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => router.get(`/admin/roles/${row.id}/navigation`)}
                            className="flex h-8 items-center gap-2 px-4 text-[9px] active:scale-95"
                        >
                            <LayoutGrid size={11} className="opacity-40" /> Navigasi
                        </Button>
                    </div>
                ),
            },
        ],
        [],
    );

    const openCreate = () => {
        setEditingRole(null);
        form.reset();
        setIsFormView(true);
    };

    const openEdit = (role: any) => {
        setEditingRole(role);
        form.setData({
            name: role.name,
            description: role.description || '',
        });
        setIsFormView(true);
    };

    const closeForm = () => {
        setIsFormView(false);
        setEditingRole(null);
        form.reset();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const options = {
            onSuccess: () => {
                closeForm();
                showToast(editingRole ? 'Data role diperbarui' : 'Role baru berhasil dibuat', 'success');
            },
        };
        if (editingRole) form.put(`/admin/roles/${editingRole.id}`, options);
        else form.post('/admin/roles', options);
    };

    if (isFormView) {
        return (
            <ManagementForm
                title={editingRole ? 'Update Parameter Role' : 'Registrasi Role Baru'}
                subtitle={editingRole ? 'Konfigurasi parameter otorisasi sistem' : 'Definisikan kategori otorisasi baru'}
                onClose={closeForm}
                onSave={handleSubmit}
                processing={form.processing}
                isDirty={form.isDirty}
                isEdit={!!editingRole}
                headerActions={
                    editingRole &&
                    canDelete && (
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setIsConfirmOpen(true)}
                            className="h-10 rounded-xl border border-black/[0.1] px-6 text-[10px] font-black tracking-widest text-black uppercase shadow-sm transition-all hover:bg-black hover:text-white dark:border-white/[0.1] dark:text-white dark:hover:bg-white dark:hover:text-black"
                        >
                            <Trash2 size={14} className="mr-2" /> Hapus Role
                        </Button>
                    )
                }
            >
                <ConfirmationModal
                    open={isConfirmOpen}
                    onClose={() => setIsConfirmOpen(false)}
                    onConfirm={() => {
                        setIsConfirmOpen(false);
                        router.delete(`/admin/roles/${editingRole.id}`, {
                            onSuccess: () => {
                                closeForm();
                                showToast('Role telah dihapus', 'success');
                            },
                        });
                    }}
                    title="Hapus Role Otoritas"
                    description={`Apakah Anda yakin ingin menghapus role ${editingRole?.name}? Seluruh mapping hak akses untuk role ini akan dihapus permanen.`}
                    confirmText="Hapus Role"
                />
                <div className="grid grid-cols-1 gap-12 md:grid-cols-12">
                    <div className="space-y-10 md:col-span-8">
                        <div className="space-y-6">
                            <h3 className="ml-1 border-b border-black/[0.05] pb-3 text-[11px] font-black tracking-[0.2em] text-black uppercase dark:border-white/[0.05] dark:text-white">
                                Identitas Role
                            </h3>
                            <div className="grid grid-cols-1 gap-8 p-1">
                                <div className="space-y-2">
                                    <Label className="ml-1 text-[10px] leading-none font-black tracking-widest text-black/40 uppercase dark:text-white/40">
                                        Nama Jabatan / Role
                                    </Label>
                                    <Input
                                        value={form.data.name}
                                        onChange={(e) => form.setData('name', e.target.value)}
                                        required
                                        placeholder="CONTOH: LEGAL MANAGER"
                                        className="h-10 rounded-xl border-black/[0.08] bg-black/[0.03] px-5 text-sm font-black tracking-tight text-black uppercase shadow-sm transition-all placeholder:text-black/20 focus:border-black focus-visible:ring-0 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-white dark:focus:border-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="ml-1 text-[10px] leading-none font-black tracking-widest text-black/40 uppercase dark:text-white/40">
                                        Penjelasan Fungsi
                                    </Label>
                                    <Input
                                        value={form.data.description}
                                        onChange={(e) => form.setData('description', e.target.value)}
                                        placeholder="Tuliskan deskripsi tanggung jawab role ini..."
                                        className="h-10 rounded-xl border-black/[0.08] bg-black/[0.03] px-5 text-[11px] font-bold tracking-tight text-black uppercase shadow-sm transition-all placeholder:text-black/20 focus:border-black focus-visible:ring-0 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-white dark:focus:border-white"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col pt-6 md:col-span-4 md:pt-0">
                        <div className="rounded-xl border border-black/[0.05] bg-black/[0.02] p-8 shadow-sm dark:border-white/[0.05] dark:bg-white/[0.02]">
                            <div className="mb-8 flex items-center gap-3">
                                <ShieldCheck size={18} className="text-black/20 dark:text-white/20" />
                                <span className="text-[10px] font-black tracking-[0.3em] text-black/30 uppercase dark:text-white/30">
                                    Pusat Otoritas
                                </span>
                            </div>
                            <div className="mb-8 space-y-6 border-y border-dashed border-black/[0.05] py-8 dark:border-white/[0.05]">
                                <span className="block text-sm leading-tight font-black tracking-tight text-black uppercase dark:text-white">
                                    {form.data.name || 'NAMA ROLE'}
                                </span>
                                <p className="text-[10px] leading-relaxed font-bold tracking-widest text-black/40 uppercase italic dark:text-white/40">
                                    {form.data.description || 'Deskripsi belum diatur untuk role ini...'}
                                </p>
                            </div>
                            <p className="text-[10px] leading-normal font-bold tracking-tight text-black/30 uppercase dark:text-white/30">
                                Role menentukan hak akses pengguna terhadap modul-modul sistem. Setelah menyimpan, Anda dapat mengatur hak akses
                                spesifik per modul.
                            </p>
                        </div>
                    </div>
                </div>
            </ManagementForm>
        );
    }

    return (
        <DataTable
            title="Database Role & Otoritas"
            columns={columns}
            data={roles.data || []}
            searchKey="name"
            searchPlaceholder="Cari role..."
            searchValue={filters.search || ''}
            onSearchChange={(v) => router.get(window.location.pathname, { ...filters, search: v, page: 1 }, { preserveState: true, replace: true })}
            filters={filterConfig as any}
            activeFilters={filters}
            onFilterChange={handleFilterChange}
            onRefresh={handleReset}
            headerActions={
                canCreate && (
                    <Button variant="primary" onClick={openCreate} className="h-10 px-8 shadow-xl active:scale-95">
                        <Plus size={14} /> Registrasi Role Baru
                    </Button>
                )
            }
            onRowClick={openEdit}
            bulkActions={
                canDelete
                    ? [
                          {
                              label: 'Hapus Terpilih',
                              icon: Trash2,
                              variant: 'destructive',
                              onClick: (ids) => {
                                  if (confirm(`Hapus ${ids.length} role terpilih?`)) {
                                      router.post(
                                          '/admin/roles/bulk-delete',
                                          { ids },
                                          {
                                              onSuccess: () => showToast(`${ids.length} role telah dihapus`, 'success'),
                                          },
                                      );
                                  }
                              },
                          },
                      ]
                    : undefined
            }
            pagination={{
                currentPage: roles.current_page || 1,
                lastPage: roles.last_page || 1,
                total: roles.total || 0,
                from: roles.from || 1,
                to: roles.to || 1,
                perPage: roles.per_page || 10,
                onPageChange: (page) => router.get(window.location.pathname, { ...filters, page }, { preserveState: true, preserveScroll: true }),
                onPerPageChange: (pp) =>
                    router.get(window.location.pathname, { ...filters, per_page: pp, page: 1 }, { preserveState: true, preserveScroll: true }),
            }}
        />
    );
}
