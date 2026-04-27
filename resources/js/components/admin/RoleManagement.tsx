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
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';

interface RoleManagementProps {
    roles: any;
    filters: any;
}

export function RoleManagement({ roles, filters }: RoleManagementProps) {
    const { showToast } = useToast();
    const { canCreate, canUpdate, canDelete } = usePermissions('ADMIN_ROLES');
    const [isFormView, setIsFormView] = React.useState(false);
    const [editingRole, setEditingRole] = React.useState<any>(null);
    const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);

    const form = useForm({
        name: '',
        description: '',
    });

    const filterConfig = useMemo(() => [
        {
            label: 'Tanggal Registrasi',
            key: 'created',
            type: 'date-range'
        }
    ], []);

    const handleFilterChange = (newFilters: Record<string, any>) => {
        router.get(window.location.pathname, { 
            ...filters, 
            ...newFilters, 
            page: 1 
        }, { preserveState: true, replace: true });
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
                        <div className="flex h-8 w-8 items-center justify-center rounded-none bg-slate-100 text-slate-400 group-hover:bg-black group-hover:text-white transition-colors">
                            <ShieldCheck size={14} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[11px] font-black uppercase tracking-tight text-slate-900 leading-none mb-1">{row.name}</span>
                            <span className="text-[9px] font-medium text-slate-400 uppercase tracking-wider leading-none">Terdaftar: {new Date(row.created_at).toLocaleDateString('id-ID')}</span>
                        </div>
                    </div>
                ),
            },
            {
                header: 'Deskripsi Otoritas',
                accessorKey: 'description',
                cell: (row) => (row.description ? (
                    <span className="text-[10px] font-medium text-slate-500 uppercase tracking-tight leading-tight block max-w-sm truncate">
                        {row.description}
                    </span>
                ) : <span className="text-slate-300 italic text-[10px]">TANPA DESKRIPSI</span>),
            },
            {
                header: 'Pemetaan Akses',
                accessorKey: 'role_config',
                cell: (row) => (
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => router.get(`/admin/roles/${row.id}/access`)}
                            className="bg-white border border-slate-200 h-7 px-3 text-[9px] font-black text-slate-600 uppercase transition-all hover:border-black hover:text-black active:scale-95 flex items-center gap-1.5"
                        >
                            <Key size={10} /> Konfigurasi Modul
                        </button>
                        <button
                            onClick={() => router.get(`/admin/roles/${row.id}/navigation`)}
                            className="bg-white border border-slate-200 h-7 px-3 text-[9px] font-black text-slate-600 uppercase transition-all hover:border-black hover:text-black active:scale-95 flex items-center gap-1.5"
                        >
                            <LayoutGrid size={10} /> Atur Navigasi
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
                            className="h-8 rounded-none px-4 text-[10px] font-black tracking-widest text-rose-600 uppercase transition-all hover:bg-rose-50"
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
                            }
                        });
                    }}
                    title="Hapus Role Otoritas"
                    description={`Apakah Anda yakin ingin menghapus role ${editingRole?.name}? Seluruh mapping hak akses untuk role ini akan dihapus permanen.`}
                    confirmText="Hapus Role"
                />
                <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
                    <div className="md:col-span-8 space-y-10">
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black tracking-[0.2em] text-slate-600 uppercase border-b border-slate-200 pb-2">Identitas Role</h3>
                            <div className="grid grid-cols-1 gap-6">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase leading-none">Nama Jabatan / Role</Label>
                                    <Input
                                        value={form.data.name}
                                        onChange={(e) => form.setData('name', e.target.value)}
                                        required
                                        placeholder="CONTOH: LEGAL MANAGER"
                                        className="h-10 rounded-none border-slate-200 bg-white px-4 text-sm font-black tracking-tight uppercase focus-visible:ring-0 focus-visible:border-black transition-colors"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase leading-none">Penjelasan Fungsi</Label>
                                    <Input
                                        value={form.data.description}
                                        onChange={(e) => form.setData('description', e.target.value)}
                                        placeholder="Tuliskan deskripsi tanggung jawab role ini..."
                                        className="h-10 rounded-none border-slate-200 px-4 text-[11px] font-medium focus-visible:ring-0 focus-visible:border-black transition-colors"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-4 flex flex-col pt-6 md:pt-0">
                         <div className="border border-slate-200 p-6 bg-slate-50/50">
                            <div className="flex items-center gap-2 mb-4">
                                <ShieldCheck size={16} className="text-slate-400" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Pusat Otoritas</span>
                            </div>
                            <div className="space-y-4 border-y border-slate-200 border-dashed py-4 mb-4">
                                <span className="text-[12px] font-black uppercase text-slate-900 block">{form.data.name || 'NAMA ROLE'}</span>
                                <p className="text-[9px] font-medium text-slate-400 uppercase leading-relaxed tracking-wider italic">
                                    {form.data.description || 'Deskripsi belum diatur untuk role ini...'}
                                </p>
                            </div>
                            <p className="text-[8px] font-bold text-slate-400 uppercase leading-normal tracking-tight">
                                Role menentukan hak akses pengguna terhadap modul-modul sistem. Setelah menyimpan, Anda dapat mengatur hak akses spesifik per modul.
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
                    <Button
                        onClick={openCreate}
                        className="h-9 gap-2 rounded-none bg-black px-6 text-[10px] font-black uppercase tracking-widest text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] hover:bg-slate-800 transition-all active:translate-x-0.5 active:translate-y-0.5"
                    >
                        <Plus className="h-3.5 w-3.5" /> Registrasi Role Baru
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
