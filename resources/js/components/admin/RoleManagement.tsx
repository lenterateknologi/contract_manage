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
                        <div className="flex h-8 w-8 items-center justify-center rounded-none bg-black/5 dark:bg-white/5 text-black/30 dark:text-white/30 group-hover:bg-black dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-black transition-colors border border-black/10 dark:border-white/10">
                            <ShieldCheck size={14} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[11px] font-black uppercase tracking-tight text-black dark:text-white leading-none mb-1">{row.name}</span>
                            <span className="text-[9px] font-bold text-black/40 dark:text-white/40 uppercase tracking-widest leading-none">Terdaftar: {new Date(row.created_at).toLocaleDateString('id-ID')}</span>
                        </div>
                    </div>
                ),
            },
            {
                header: 'Deskripsi Otoritas',
                accessorKey: 'description',
                cell: (row) => (row.description ? (
                    <span className="text-[10px] font-bold text-black/60 dark:text-white/60 uppercase tracking-tight leading-tight block max-w-sm truncate">
                        {row.description}
                    </span>
                ) : <span className="text-black/30 dark:text-white/30 italic text-[10px] font-bold uppercase tracking-widest leading-none">TANPA DESKRIPSI</span>),
            },
            {
                header: 'Pemetaan Akses',
                accessorKey: 'role_config',
                cell: (row) => (
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => router.get(`/admin/roles/${row.id}/access`)}
                            className="bg-white dark:bg-black border border-black dark:border-white h-7 px-3 text-[9px] font-black text-black dark:text-white uppercase transition-all hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black active:scale-95 flex items-center gap-1.5 rounded-none"
                        >
                            <Key size={10} /> Konfigurasi Modul
                        </button>
                        <button
                            onClick={() => router.get(`/admin/roles/${row.id}/navigation`)}
                            className="bg-white dark:bg-black border border-black dark:border-white h-7 px-3 text-[9px] font-black text-black dark:text-white uppercase transition-all hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black active:scale-95 flex items-center gap-1.5 rounded-none"
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
                            className="h-8 rounded-none px-4 text-[10px] font-black tracking-widest text-black dark:text-white uppercase transition-all hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black border border-black dark:border-white"
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
                            <h3 className="text-[10px] font-black tracking-[0.2em] text-black dark:text-white uppercase border-b border-black dark:border-white pb-2">Identitas Role</h3>
                            <div className="grid grid-cols-1 gap-6">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black tracking-widest text-black/50 dark:text-white/50 uppercase leading-none">Nama Jabatan / Role</Label>
                                    <Input
                                        value={form.data.name}
                                        onChange={(e) => form.setData('name', e.target.value)}
                                        required
                                        placeholder="CONTOH: LEGAL MANAGER"
                                        className="h-10 rounded-none border-black dark:border-white bg-white dark:bg-black px-4 text-sm font-black tracking-tight uppercase focus-visible:ring-0 transition-colors text-black dark:text-white placeholder:text-black/20"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black tracking-widest text-black/50 dark:text-white/50 uppercase leading-none">Penjelasan Fungsi</Label>
                                    <Input
                                        value={form.data.description}
                                        onChange={(e) => form.setData('description', e.target.value)}
                                        placeholder="Tuliskan deskripsi tanggung jawab role ini..."
                                        className="h-10 rounded-none border-black dark:border-white bg-white dark:bg-black px-4 text-[11px] font-bold uppercase tracking-tight focus-visible:ring-0 transition-colors text-black dark:text-white placeholder:text-black/20"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-4 flex flex-col pt-6 md:pt-0">
                         <div className="border border-black dark:border-white p-6 bg-black/5 dark:bg-white/5">
                            <div className="flex items-center gap-2 mb-4">
                                <ShieldCheck size={16} className="text-black/30 dark:text-white/30" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-black/30 dark:text-white/30">Pusat Otoritas</span>
                            </div>
                            <div className="space-y-4 border-y border-black dark:border-white border-dashed py-4 mb-4">
                                <span className="text-[12px] font-black uppercase text-black dark:text-white block tracking-tight">{form.data.name || 'NAMA ROLE'}</span>
                                <p className="text-[9px] font-bold text-black/40 dark:text-white/40 uppercase leading-relaxed tracking-widest italic">
                                    {form.data.description || 'Deskripsi belum diatur untuk role ini...'}
                                </p>
                            </div>
                            <p className="text-[8px] font-bold text-black/50 dark:text-white/50 uppercase leading-normal tracking-wider">
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
                        className="h-9 gap-2 rounded-none bg-black dark:bg-white px-6 text-[11px] font-black uppercase tracking-widest text-white dark:text-black border border-black dark:border-white shadow-none hover:opacity-90 transition-all active:scale-95"
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
