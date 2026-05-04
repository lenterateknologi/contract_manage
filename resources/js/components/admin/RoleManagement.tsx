import { ManagementForm, FormSection } from './ManagementForm';
import { CompactInput } from '@/components/ui/forms/CompactInput';
import { ConfirmationModal } from '@/components/ui/overlays/ConfirmationModal';
import { router, useForm } from '@inertiajs/react';
import { Key, LayoutGrid, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import React, { useMemo } from 'react';
import { Column, TableMasterData } from '@/components/ui/data/TableMasterData';
import { Button } from '@/components/ui/base/Button';
import { usePermissions } from '@/hooks/use-permissions';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/contracts/Toast';

interface RoleManagementProps {
    roles: any;
    filters: any;
}

const ROLE_PALETTE = [
    'bg-violet-100 text-violet-600',
    'bg-blue-100 text-blue-600',
    'bg-emerald-100 text-emerald-600',
    'bg-amber-100 text-amber-600',
    'bg-rose-100 text-rose-600',
    'bg-cyan-100 text-cyan-600',
    'bg-indigo-100 text-indigo-600',
    'bg-teal-100 text-teal-600',
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
                    <div className="flex items-center gap-3">
                        <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl shrink-0', roleColor(row.name))}>
                            <ShieldCheck size={16} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm leading-tight font-semibold text-foreground">{row.name}</span>
                            <span className="mt-0.5 text-xs font-medium text-muted-foreground/60">
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
                        <span className="block max-w-sm truncate text-sm leading-tight font-medium text-muted-foreground">
                            {row.description}
                        </span>
                    ) : (
                        <span className="text-sm leading-none font-medium text-muted-foreground/30 italic">
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
                            size="sm"
                            onClick={() => router.get(`/admin/roles/${row.id}/config?tab=access`)}
                            className="flex h-8 items-center gap-1.5 px-3 text-xs active:scale-95"
                        >
                            <Key size={12} className="opacity-40" /> Hak Akses
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.get(`/admin/roles/${row.id}/config?tab=navigation`)}
                            className="flex h-8 items-center gap-1.5 px-3 text-xs active:scale-95"
                        >
                            <LayoutGrid size={12} className="opacity-40" /> Navigasi
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
                            className="h-9 hover:bg-rose-500 hover:text-white text-rose-500 rounded-xl px-4 text-xs font-semibold transition-all border border-rose-500/10 active:scale-95"
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
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                    {/* Main Column: 8 Columns */}
                    <div className="md:col-span-8 space-y-8">
                        <FormSection 
                            title="Identitas Role" 
                            subtitle="Nama jabatan dan penjelasan otoritas sistem"
                        >
                            <div className="grid grid-cols-1 gap-6">
                                <CompactInput 
                                    label="Nama Jabatan / Role"
                                    value={form.data.name}
                                    onChange={e => form.setData('name', e.target.value)}
                                    placeholder="CONTOH: LEGAL MANAGER"
                                    error={form.errors.name}
                                />
                                <CompactInput 
                                    label="Penjelasan Fungsi"
                                    value={form.data.description}
                                    onChange={e => form.setData('description', e.target.value)}
                                    placeholder="TULISKAN DESKRIPSI TANGGUNG JAWAB ROLE INI..."
                                    error={form.errors.description}
                                />
                            </div>
                        </FormSection>
                    </div>

                    {/* Side Column: 4 Columns */}
                    <div className="md:col-span-4 flex flex-col pt-6 md:pt-0">
                        <div className="rounded-2xl border border-border bg-muted/30 p-6 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <ShieldCheck size={80} strokeWidth={1} />
                            </div>

                            <div className="mb-4 flex items-center gap-3 relative z-10">
                                <span className="text-xs font-bold tracking-wide text-foreground">
                                    Pusat Otoritas
                                </span>
                            </div>
                            
                            <div className="mb-4 space-y-3 border-y border-dashed border-border py-4 relative z-10">
                                <span className="block text-sm leading-tight font-semibold tracking-tight text-foreground">
                                    {form.data.name || 'Nama Role'}
                                </span>
                                <p className="text-xs leading-relaxed font-medium tracking-wide text-muted-foreground">
                                    {form.data.description || 'Deskripsi belum diatur untuk role ini...'}
                                </p>
                            </div>

                            {editingRole && (
                                <div className="grid grid-cols-2 gap-3 mb-4 relative z-10">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => router.get(`/admin/roles/${editingRole.id}/config?tab=access`)}
                                        className="h-9 gap-2 text-xs active:scale-95 transition-all"
                                    >
                                        <Key size={12} /> Hak Akses
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => router.get(`/admin/roles/${editingRole.id}/config?tab=navigation`)}
                                        className="h-9 gap-2 text-xs active:scale-95 transition-all"
                                    >
                                        <LayoutGrid size={12} /> Navigasi
                                    </Button>
                                </div>
                            )}

                            <p className="text-xs leading-normal font-medium tracking-tight text-muted-foreground/60 relative z-10">
                                Role menentukan hak akses pengguna terhadap modul-modul sistem. Setelah menyimpan, Anda dapat mengatur hak akses spesifik per modul.
                            </p>
                        </div>
                    </div>
                </div>
            </ManagementForm>
        );
    }

    return (
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
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
                            className="h-10 px-6 rounded-xl gap-2 text-xs font-bold transition-all duration-200 border border-border/40 bg-card text-foreground shadow-sm hover:bg-muted/60 hover:border-border/60 hover:shadow-md active:scale-95"
                        >
                            <Plus size={15} /> Tambah Role
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
                    onPageChange: (page: number) => router.get(globalThis.location.pathname, { ...filters, page }, { preserveState: true, preserveScroll: true }),
                    onPerPageChange: (pp: number) =>
                        router.get(globalThis.location.pathname, { ...filters, per_page: pp, page: 1 }, { preserveState: true, preserveScroll: true }),
                }}
            />
        </div>
    );
}
