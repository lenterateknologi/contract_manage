import React, { useMemo } from 'react';
import { Column, DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useForm, router } from '@inertiajs/react';
import { Plus, Trash2, Building2 } from 'lucide-react';
import { usePermissions } from '@/hooks/use-permissions';
import { useToast } from '@/components/contracts/Toast';
import { cn } from '@/lib/utils';
import { ManagementForm, FormSection, FormDangerZone } from './ManagementForm';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';

interface DepartmentManagementProps {
    departments: any;
    filters: any;
}

export function DepartmentManagement({ departments, filters }: DepartmentManagementProps) {
    const { showToast } = useToast();
    const { canCreate, canUpdate, canDelete } = usePermissions('ADMIN_DEPTS');
    const [isFormView, setIsFormView] = React.useState(false);
    const [editingDept, setEditingDept] = React.useState<any>(null);
    const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);

    const form = useForm({
        code: '',
        name: '',
        description: '',
        is_active: true as boolean,
    });

    const filterConfig = useMemo(() => [
        {
            label: 'Status Visibilitas',
            key: 'is_active',
            options: [
                { label: 'Visible (Aktif)', value: 'true' },
                { label: 'Hidden (Nonaktif)', value: 'false' },
            ]
        }
    ], []);

    const handleFilterChange = (newFilters: Record<string, any>) => {
        router.get(window.location.pathname, { 
            ...filters, 
            ...newFilters, 
            page: 1 
        }, { preserveState: true, replace: true });
    };

    const columns = useMemo<Column<any>[]>(() => [
        {
            header: 'Departemen / Unit',
            accessorKey: 'name',
            sortable: true,
            cell: (row) => (
                <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-none bg-black/5 dark:bg-white/5 text-black/40 dark:text-white/40 group-hover:bg-black dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-black transition-colors border border-black/5 dark:border-white/5">
                        <Building2 size={14} />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-[11px] font-black uppercase tracking-tight text-black dark:text-white leading-none mb-1 truncate">{row.name}</span>
                        <div className="flex items-center gap-1.5 font-mono text-[9px] font-black text-black/40 dark:text-white/40 uppercase tracking-widest leading-none">
                            {row.code}
                        </div>
                    </div>
                </div>
            )
        },
        {
            header: 'Deskripsi',
            accessorKey: 'description',
            cell: (row) => (
                <span className="text-[10px] font-medium text-black/50 dark:text-white/50 uppercase tracking-tight line-clamp-1 max-w-[300px]">
                    {row.description || 'TIDAK ADA KETERANGAN'}
                </span>
            )
        },
        {
            header: 'Visibilitas',
            accessorKey: 'is_active',
            cell: (row) => (
                <div className="flex items-center gap-2">
                    <div className={cn(
                        "w-1.5 h-1.5 rounded-none shrink-0",
                        row.is_active ? "bg-black dark:bg-white" : "bg-black/10 dark:bg-white/10"
                    )} />
                    <span className={cn(
                        "text-[9px] font-black uppercase tracking-widest",
                        row.is_active ? "text-black dark:text-white" : "text-black/30 dark:text-white/30"
                    )}>
                        {row.is_active ? 'TERLIHAT' : 'DISEMBUNYIKAN'}
                    </span>
                </div>
            )
        },
    ], []);

    const openCreate = () => {
        setEditingDept(null);
        form.reset();
        setIsFormView(true);
    };

    const openEdit = (dept: any) => {
        setEditingDept(dept);
        form.setData({
            code: dept.code || '',
            name: dept.name,
            description: dept.description || '',
            is_active: !!dept.is_active,
        });
        setIsFormView(true);
    };

    const closeForm = () => {
        setIsFormView(false);
        setEditingDept(null);
        form.reset();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const options = {
            onSuccess: () => {
                closeForm();
                showToast(editingDept ? 'Departemen diperbarui' : 'Departemen baru ditambahkan', 'success');
            }
        };
        if (editingDept) form.put(`/admin/departments/${editingDept.id}`, options);
        else form.post('/admin/departments', options);
    };

    if (isFormView) {
        return (
            <ManagementForm
                title={editingDept ? 'Update Master Departemen' : 'Registrasi Departemen Baru'}
                subtitle={editingDept ? 'Pengaturan detail unit organisasi' : 'Registrasi divisi atau unit organisasi'}
                onClose={closeForm}
                onSave={handleSubmit}
                processing={form.processing}
                isDirty={form.isDirty}
                isEdit={!!editingDept}
                headerActions={
                    editingDept && canDelete && (
                        <Button 
                            type="button" 
                            variant="ghost" 
                            onClick={() => setIsConfirmOpen(true)}
                            className="h-8 hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black text-black/50 dark:text-white/50 rounded-none px-4 text-[10px] font-black uppercase tracking-widest transition-all"
                        >
                            <Trash2 size={14} className="mr-2" /> Hapus Data
                        </Button>
                    )
                }
            >
                <ConfirmationModal 
                    open={isConfirmOpen}
                    onClose={() => setIsConfirmOpen(false)}
                    onConfirm={() => {
                        setIsConfirmOpen(false);
                        router.delete(`/admin/departments/${editingDept.id}`, { 
                            onSuccess: () => {
                                closeForm();
                                showToast('Departemen telah dihapus', 'success');
                            }
                        });
                    }}
                    title="Konfirmasi Penghapusan"
                    description={`Apakah Anda yakin ingin menghapus departemen ${editingDept?.name}? Tindakan ini tidak dapat dibatalkan.`}
                    confirmText="Hapus Departemen"
                />
                <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
                    <div className="md:col-span-8 space-y-10">
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black tracking-[0.2em] text-black/60 dark:text-white/60 uppercase border-b border-black/10 dark:border-white/10 pb-2 text-left">Data Organisasi</h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div className="md:col-span-1 space-y-1.5">
                                    <Label className="text-[9px] font-black text-black/40 dark:text-white/40 uppercase tracking-widest">Kode / Singkatan</Label>
                                    <Input value={form.data.code} onChange={e => form.setData('code', e.target.value)} required placeholder="CONTOH: IT" className="h-10 rounded-none border-black dark:border-white bg-white dark:bg-black text-[10px] font-mono font-black uppercase tracking-widest px-4 focus-visible:ring-0 transition-colors text-black dark:text-white" />
                                </div>
                                <div className="md:col-span-3 space-y-1.5">
                                    <Label className="text-[9px] font-black text-black/40 dark:text-white/40 uppercase tracking-widest">Nama Unit Struktural</Label>
                                    <Input value={form.data.name} onChange={e => form.setData('name', e.target.value)} required placeholder="NAMA LENGKAP DIVISI" className="h-10 rounded-none border-black dark:border-white bg-white dark:bg-black text-[10px] font-black uppercase tracking-tight px-4 focus-visible:ring-0 transition-colors text-black dark:text-white" />
                                </div>
                                <div className="md:col-span-4 space-y-1.5">
                                    <Label className="text-[9px] font-black text-black/40 dark:text-white/40 uppercase tracking-widest">Keterangan Fungsi</Label>
                                    <Input value={form.data.description} onChange={e => form.setData('description', e.target.value)} placeholder="Tuliskan deskripsi unit kerja ini..." className="h-10 rounded-none border-black dark:border-white bg-white dark:bg-black text-[10px] font-bold uppercase px-4 focus-visible:ring-0 transition-colors text-black dark:text-white" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-4 flex flex-col pt-6 md:pt-0">
                         <div className="border border-black dark:border-white p-6 bg-black/5 dark:bg-white/5">
                            <div className="flex items-center gap-3 mb-6">
                                <span className={cn("text-[9px] font-black uppercase tracking-widest", form.data.is_active ? "text-black dark:text-white" : "text-black/40 dark:text-white/40")}>
                                     {form.data.is_active ? 'Unit Aktif' : 'Unit Tersembunyi'}
                                </span>
                                <Checkbox 
                                    checked={form.data.is_active} 
                                    onCheckedChange={(c) => form.setData('is_active', !!c)} 
                                    className="w-5 h-5 rounded-none border-black dark:border-white"
                                />
                            </div>
                            <div className="flex items-center gap-2 mb-4">
                                <Building2 size={16} className="text-black/40 dark:text-white/40" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-black/40 dark:text-white/40">Arsitektur Unit</span>
                            </div>
                            <p className="text-[9px] text-black/50 dark:text-white/50 font-bold uppercase leading-relaxed tracking-tight italic">
                                Departemen digunakan untuk mengelompokkan pengguna dan menentukan keterlibatan dalam alur persetujuan (Workflow) berbasis departemen.
                            </p>
                        </div>
                    </div>
                </div>
            </ManagementForm>
        );
    }

    return (
        <DataTable
            title="Database Unit / Departemen"
            columns={columns}
            data={departments.data || []}
            searchKey="name"
            searchPlaceholder="Cari departemen..."
            searchValue={filters.search || ''}
            onSearchChange={(v) => router.get(window.location.pathname, { ...filters, search: v, page: 1 }, { preserveState: true, replace: true })}
            filters={filterConfig as any}
            activeFilters={filters}
            onFilterChange={handleFilterChange}
            headerActions={
                canCreate && (
                    <Button onClick={openCreate} className="h-9 gap-2 rounded-none bg-black px-6 text-[10px] font-black uppercase tracking-widest text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] hover:bg-slate-800 transition-all active:translate-x-0.5 active:translate-y-0.5">
                        <Plus className="h-3.5 w-3.5" /> Registrasi Unit Baru
                    </Button>
                )
            }
            onRowClick={openEdit}
            pagination={{
                currentPage: departments.current_page || 1,
                lastPage: departments.last_page || 1,
                total: departments.total || 0,
                from: departments.from || 1,
                to: departments.to || 1,
                perPage: departments.per_page || 10,
                onPageChange: (page) => router.get(window.location.pathname, { ...filters, page }, { preserveState: true, preserveScroll: true }),
                onPerPageChange: (pp) => router.get(window.location.pathname, { ...filters, per_page: pp, page: 1 }, { preserveState: true, preserveScroll: true }),
            }}
        />
    );
}
