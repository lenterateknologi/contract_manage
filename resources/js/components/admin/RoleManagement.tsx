import { useToast } from '@/components/contracts/Toast';
import { Button } from '@/components/ui/base/Button';
import { Column, TableMasterData } from '@/components/ui/data/TableMasterData';
import { CompactInput } from '@/components/ui/forms/CompactInput';
import { ConfirmationModal } from '@/components/ui/overlays/ConfirmationModal';
import { usePermissions } from '@/hooks/use-permissions';
import { cn } from '@/lib/utils';
import { router, useForm } from '@inertiajs/react';
import { Key, LayoutGrid, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import React, { useMemo } from 'react';
import { FormSection, ManagementForm } from './ManagementForm';

interface RoleManagementProps {
    roles: any;
    filters: any;
}

const ROLE_PALETTE = [
    'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
    'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
    'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
    'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
    'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400',
];

function roleColor(name: string) {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
    return ROLE_PALETTE[Math.abs(h) % ROLE_PALETTE.length];
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
            globalThis.location.pathname,
            {
                ...filters,
                ...newFilters,
                page: 1,
            },
            { preserveState: true, replace: true },
        );
    };

    const columns = useMemo<Column<any>[]>(
        () => [
            {
                header: 'Nama Role / Jabatan',
                accessorKey: 'name',
                cell: (row) => (
                    <div className="flex items-center gap-3 select-none">
                        <div
                            className={cn(
                                'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm transition-all duration-200 select-none',
                                roleColor(row.name),
                            )}
                        >
                            <ShieldCheck size={18} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm leading-tight font-bold tracking-wide text-slate-900 select-none dark:text-slate-100">
                                {row.name}
                            </span>
                            <span className="text-muted-foreground/80 mt-0.5 text-xs font-medium dark:text-slate-400/80">
                                Terdaftar: {new Date(row.created_at).toLocaleDateString('id-ID')}
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
                        <span className="text-muted-foreground block max-w-sm truncate text-sm leading-tight font-medium dark:text-slate-300">
                            {row.description}
                        </span>
                    ) : (
                        <span className="text-muted-foreground/30 text-sm leading-none font-medium italic dark:text-slate-700">—</span>
                    ),
            },
            {
                header: 'Pemetaan Akses',
                accessorKey: 'role_config',
                cell: (row) => (
                    <div className="flex items-center gap-2 select-none" onClick={(e) => e.stopPropagation()}>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.get(`/admin/roles/${row.id}/config?tab=access`)}
                            className="border-border/80 hover:bg-muted/60 flex h-8 items-center gap-1.5 rounded-xl px-3.5 text-xs font-bold tracking-wide active:scale-95 dark:border-slate-800/80 dark:hover:bg-slate-800/60"
                        >
                            <Key size={12} className="text-primary opacity-60" /> Hak Akses
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.get(`/admin/roles/${row.id}/config?tab=navigation`)}
                            className="border-border/80 hover:bg-muted/60 flex h-8 items-center gap-1.5 rounded-xl px-3.5 text-xs font-bold tracking-wide active:scale-95 dark:border-slate-800/80 dark:hover:bg-slate-800/60"
                        >
                            <LayoutGrid size={12} className="text-primary opacity-60" /> Navigasi
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
                            className="h-10 rounded-xl border border-rose-500/20 px-4 text-xs font-bold text-rose-500 transition-all duration-200 select-none hover:bg-rose-500 hover:text-white active:scale-95 dark:hover:bg-rose-500/20"
                        >
                            <Trash2 size={15} className="mr-2" /> Hapus
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
                <div className="animate-in fade-in grid grid-cols-1 gap-8 duration-200 select-none md:grid-cols-12">
                    {/* Main Column: 8 Columns */}
                    <div className="space-y-8 md:col-span-8">
                        <FormSection title="Identitas Role" subtitle="Nama jabatan dan penjelasan otoritas sistem">
                            <div className="grid grid-cols-1 gap-6">
                                <CompactInput
                                    label="Nama Jabatan / Role"
                                    value={form.data.name}
                                    onChange={(e) => form.setData('name', e.target.value)}
                                    placeholder="CONTOH: LEGAL MANAGER"
                                    error={form.errors.name}
                                />
                                <div className="space-y-1.5">
                                    <CompactInput
                                        label="Penjelasan Fungsi"
                                        value={form.data.description}
                                        onChange={(e) => form.setData('description', e.target.value)}
                                        placeholder="TULISKAN DESKRIPSI TANGGUNG JAWAB ROLE INI..."
                                        error={form.errors.description}
                                    />
                                </div>
                            </div>
                        </FormSection>
                    </div>

                    {/* Side Column: 4 Columns */}
                    <div className="flex flex-col pt-6 md:col-span-4 md:pt-0">
                        <div className="border-border/80 bg-muted/20 group relative overflow-hidden rounded-2xl border p-6 shadow-sm backdrop-blur-sm transition-all duration-200 select-none dark:border-slate-800/80 dark:bg-slate-900/40">
                            <div className="absolute top-0 right-0 p-4 opacity-5 transition-opacity duration-200 group-hover:opacity-10">
                                <ShieldCheck size={80} strokeWidth={1} />
                            </div>

                            <div className="relative z-10 mb-4 flex items-center gap-3">
                                <span className="text-xs font-bold tracking-wider text-slate-900 uppercase dark:text-slate-100">Pusat Otoritas</span>
                            </div>

                            <div className="border-border/60 relative z-10 mb-4 space-y-3 border-y border-dashed py-4 dark:border-slate-800/60">
                                <span className="block text-sm leading-tight font-bold tracking-tight text-slate-900 dark:text-slate-100">
                                    {form.data.name || 'Nama Role'}
                                </span>
                                <p className="text-muted-foreground text-xs leading-relaxed font-medium tracking-wide dark:text-slate-400">
                                    {form.data.description || 'Deskripsi belum diatur untuk role ini...'}
                                </p>
                            </div>

                            {editingRole && (
                                <div className="relative z-10 mb-4 grid grid-cols-2 gap-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => router.get(`/admin/roles/${editingRole.id}/config?tab=access`)}
                                        className="border-border/80 h-9 gap-2 rounded-xl text-xs font-bold active:scale-95 dark:border-slate-800/80"
                                    >
                                        <Key size={12} className="text-primary" /> Hak Akses
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => router.get(`/admin/roles/${editingRole.id}/config?tab=navigation`)}
                                        className="border-border/80 h-9 gap-2 rounded-xl text-xs font-bold active:scale-95 dark:border-slate-800/80"
                                    >
                                        <LayoutGrid size={12} className="text-primary" /> Navigasi
                                    </Button>
                                </div>
                            )}

                            <p className="text-muted-foreground/60 relative z-10 text-[11px] leading-normal font-medium tracking-tight dark:text-slate-500">
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
        <div className="bg-card/40 border-border/60 animate-in fade-in m-5 rounded-2xl border p-6 shadow-sm backdrop-blur-sm duration-200 select-none dark:border-slate-800/60 dark:bg-slate-900/20">
            <TableMasterData
                title="Database Role & Otoritas"
                columns={columns}
                borderless={true}
                data={roles.data || []}
                searchPlaceholder="Cari role..."
                searchValue={filters.search || ''}
                onSearchChange={(v: string) =>
                    router.get(globalThis.location.pathname, { ...filters, search: v, page: 1 }, { preserveState: true, replace: true })
                }
                filters={filterConfig as any}
                activeFilters={filters}
                onFilterChange={handleFilterChange}
                headerActions={
                    canCreate && (
                        <Button
                            variant="white"
                            onClick={openCreate}
                            className="border-border bg-card text-foreground hover:bg-muted/60 hover:border-border h-10 gap-2 rounded-xl border px-5 text-xs font-bold tracking-wide shadow-sm transition-all duration-200 select-none hover:shadow-md dark:bg-slate-900/60 dark:hover:bg-slate-800/60"
                        >
                            <Plus size={15} className="text-primary" /> Tambah Role
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
                                  onClick: (ids: string[] | number[]) => {
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
