import { useToast } from '@/components/contracts/Toast';
import { Column, DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePermissions } from '@/hooks/use-permissions';
import { router, useForm } from '@inertiajs/react';
import { Key, LayoutGrid, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import React, { useMemo } from 'react';
import { FormSection, ManagementForm } from './ManagementForm';

interface RoleManagementProps {
    roles: any;
    filters: any;
}

export function RoleManagement({ roles, filters }: RoleManagementProps) {
    const { showToast } = useToast();
    const { canCreate, canUpdate, canDelete } = usePermissions('ADMIN_ROLES');
    const [isFormView, setIsFormView] = React.useState(false);
    const [editingRole, setEditingRole] = React.useState<any>(null);

    const form = useForm({
        name: '',
        description: '',
    });

    const columns = useMemo<Column<any>[]>(
        () => [
            {
                header: 'Nama Role',
                accessorKey: 'name',
                sortable: true,
                className: 'font-black text-slate-900 uppercase tracking-tight text-[12px]',
                cell: (row) => (
                    <div className="flex items-center gap-3">
                        {/* <div className="w-1.5 h-3 bg-black" /> */}
                        <span>{row.name}</span>
                    </div>
                ),
            },
            {
                header: 'Deskripsi Otoritas',
                accessorKey: 'description',
                className: 'text-[10px] font-medium text-slate-500 uppercase tracking-wide',
                cell: (row) => row.description || '-',
            },
            {
                header: 'Konfigurasi',
                accessorKey: 'role_config',
                cell: (row) => (
                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => router.get(`/admin/roles/${row.id}/access`)}
                            className="border border-sky-100 bg-sky-50 px-3 py-1.5 text-[9px] font-black text-sky-600 uppercase transition-all hover:text-sky-700 active:scale-95"
                            title="Atur Hak Akses Modul"
                        >
                            <Key size={10} className="mr-1.5 mb-0.5 inline" /> Modul
                        </button>
                        <button
                            onClick={() => router.get(`/admin/roles/${row.id}/navigation`)}
                            className="border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-[9px] font-black text-indigo-600 uppercase transition-all hover:text-indigo-700 active:scale-95"
                            title="Atur Struktur Menu"
                        >
                            <LayoutGrid size={10} className="mr-1.5 mb-0.5 inline" /> Navigasi
                        </button>
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
                title={editingRole ? 'Edit Master Role' : 'Tambah Role Baru'}
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
                            onClick={() => {
                                if (confirm('Hapus role?')) router.delete(`/admin/roles/${editingRole.id}`, { onSuccess: closeForm });
                            }}
                            className="h-8 rounded-none px-4 text-[10px] font-black tracking-widest text-rose-600 uppercase transition-all hover:bg-rose-50"
                        >
                            <Trash2 size={14} className="mr-2" /> Hapus Role
                        </Button>
                    )
                }
            >
                <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
                    <div className="md:col-span-8">
                        <FormSection title="Parameter Role" subtitle="Pengaturan nama dan fungsi peran">
                            <div className="space-y-6">
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Nama Jabatan / Role</Label>
                                    <Input
                                        value={form.data.name}
                                        onChange={(e) => form.setData('name', e.target.value)}
                                        required
                                        placeholder="CONTOH: LEGAL MANAGER"
                                        className="h-10 rounded-none border-slate-200 bg-slate-50/20 px-4 text-sm font-black tracking-tight uppercase"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Penjelasan Fungsi</Label>
                                    <Input
                                        value={form.data.description}
                                        onChange={(e) => form.setData('description', e.target.value)}
                                        placeholder="Tuliskan deskripsi tanggung jawab role ini..."
                                        className="h-10 rounded-none border-slate-200 px-4 text-sm font-medium"
                                    />
                                </div>
                            </div>
                        </FormSection>
                    </div>

                    <div className="md:col-span-4">
                        <div className="space-y-4 border border-black p-6">
                            <div className="flex h-12 w-12 items-center justify-center bg-black font-black text-white">
                                <ShieldCheck size={24} />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-[11px] font-black tracking-widest uppercase">Pusat Otoritas</h3>
                                <p className="text-[10px] leading-relaxed font-bold text-slate-500 uppercase">
                                    Role menentukan hak akses pengguna terhadap modul-modul sistem. Setelah menyimpan, Anda dapat mengatur hak akses
                                    spesifik per modul.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </ManagementForm>
        );
    }

    return (
        <DataTable
            title="Management Role & Akses"
            columns={columns}
            data={roles.data || []}
            searchKey="name"
            searchPlaceholder="Cari role..."
            searchValue={filters.search || ''}
            onSearchChange={(v) => router.get(window.location.pathname, { ...filters, search: v, page: 1 }, { preserveState: true, replace: true })}
            headerActions={
                canCreate && (
                    <Button
                        onClick={openCreate}
                        className="h-9 gap-2 rounded-xl px-5 text-[11px] font-black tracking-widest uppercase shadow-lg shadow-slate-200"
                    >
                        <Plus className="h-3.5 w-3.5" /> Tambah Role
                    </Button>
                )
            }
            onRowClick={openEdit}
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
