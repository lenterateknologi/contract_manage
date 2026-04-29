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
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black/[0.03] dark:bg-white/[0.03] text-black/30 dark:text-white/30 group-hover:text-black dark:group-hover:text-white transition-colors border border-black/[0.05] dark:border-white/[0.05]">
                        <Building2 size={16} />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-[13px] font-bold text-black dark:text-white leading-tight mb-1 truncate">{row.name}</span>
                        <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold text-black/40 dark:text-white/40 uppercase tracking-widest leading-none">
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
                <span className="text-[11px] font-bold text-black/40 dark:text-white/40 uppercase tracking-tight line-clamp-1 max-w-[300px]">
                    {row.description || '—'}
                </span>
            )
        },
        {
            header: 'Visibilitas',
            accessorKey: 'is_active',
            cell: (row) => (
                <div className="flex items-center gap-2">
                    <div className={cn(
                        "w-1.5 h-1.5 rounded-full shrink-0",
                        row.is_active ? "bg-black dark:bg-white" : "bg-black/20 dark:bg-white/20"
                    )} />
                    <span className={cn(
                        "text-[10px] font-black uppercase tracking-widest",
                        row.is_active ? "text-black dark:text-white" : "text-black/30 dark:text-white/30"
                    )}>
                        {row.is_active ? 'TERLIHAT' : 'HIDDEN'}
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
                        <div className="space-y-6">
                            <h3 className="text-[11px] font-black tracking-[0.2em] text-black dark:text-white uppercase border-b border-black/[0.05] dark:border-white/[0.05] pb-3 ml-1">Data Organisasi</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-1">
                                <div className="md:col-span-1 space-y-2">
                                    <Label className="text-[10px] font-black text-black/40 dark:text-white/40 uppercase tracking-widest ml-1">Kode / Singkatan</Label>
                                    <Input 
                                        value={form.data.code} 
                                        onChange={e => form.setData('code', e.target.value)} 
                                        required 
                                        placeholder="CONTOH: IT" 
                                        className="h-10 rounded-xl border-black/[0.08] dark:border-white/[0.08] bg-black/[0.03] dark:bg-white/[0.03] text-[11px] font-mono font-black uppercase tracking-widest px-5 focus-visible:ring-0 transition-all text-black dark:text-white focus:border-black dark:focus:border-white shadow-sm" 
                                    />
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <Label className="text-[10px] font-black text-black/40 dark:text-white/40 uppercase tracking-widest ml-1">Nama Unit Struktural</Label>
                                    <Input 
                                        value={form.data.name} 
                                        onChange={e => form.setData('name', e.target.value)} 
                                        required 
                                        placeholder="NAMA LENGKAP DIVISI" 
                                        className="h-10 rounded-xl border-black/[0.08] dark:border-white/[0.08] bg-black/[0.03] dark:bg-white/[0.03] text-sm font-black uppercase tracking-tight px-5 focus-visible:ring-0 transition-all text-black dark:text-white focus:border-black dark:focus:border-white shadow-sm" 
                                    />
                                </div>
                                <div className="md:col-span-3 space-y-2">
                                    <Label className="text-[10px] font-black text-black/40 dark:text-white/40 uppercase tracking-widest ml-1">Keterangan Fungsi</Label>
                                    <Input 
                                        value={form.data.description} 
                                        onChange={e => form.setData('description', e.target.value)} 
                                        placeholder="Tuliskan deskripsi unit kerja ini..." 
                                        className="h-10 rounded-xl border-black/[0.08] dark:border-white/[0.08] bg-black/[0.03] dark:bg-white/[0.03] text-xs font-bold uppercase px-5 focus-visible:ring-0 transition-all text-black dark:text-white focus:border-black dark:focus:border-white shadow-sm" 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-4 flex flex-col pt-6 md:pt-0">
                         <div className="border border-black/[0.05] dark:border-white/[0.05] p-8 bg-black/[0.02] dark:bg-white/[0.02] rounded-xl shadow-sm">
                            <div className="flex items-center gap-4 bg-white dark:bg-black/40 p-3 rounded-xl border border-black/[0.05] dark:border-white/[0.05] shadow-sm mb-8">
                                <span className={cn("text-[10px] font-black uppercase tracking-widest ml-1", form.data.is_active ? "text-black dark:text-white" : "text-black/30 dark:text-white/30")}>
                                     {form.data.is_active ? 'Unit Terlihat' : 'Unit Tersembunyi'}
                                </span>
                                <Checkbox 
                                    checked={form.data.is_active} 
                                    onCheckedChange={(c) => form.setData('is_active', !!c)} 
                                    className="w-5 h-5 rounded-lg border-black/[0.1] dark:border-white/[0.1] data-[state=checked]:bg-black dark:data-[state=checked]:bg-white data-[state=checked]:text-white dark:data-[state=checked]:text-black transition-all"
                                />
                            </div>
                            <div className="flex items-center gap-3 mb-4">
                                <Building2 size={18} className="text-black/20 dark:text-white/20" />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-black/30 dark:text-white/30">Arsitektur Unit</span>
                            </div>
                            <p className="text-[11px] text-black/40 dark:text-white/40 font-bold uppercase leading-relaxed tracking-tight italic border-t border-black/[0.05] dark:border-white/[0.05] pt-4">
                                Departemen digunakan untuk mengelompokkan pengguna dan menentukan keterlibatan dalam alur persetujuan (Workflow) berbasis departemen secara otomatis.
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
                canUpdate && (
                    <Button 
                        variant="primary"
                        onClick={openCreate} 
                        className="h-10 px-8 shadow-xl active:scale-95"
                    >
                        <Plus size={14} /> Registrasi Unit Baru
                    </Button>
                )
            }
            onRowClick={openEdit}
            bulkActions={canUpdate ? [
                {
                    label: 'Hapus Terpilih',
                    icon: Trash2,
                    variant: 'destructive',
                    onClick: (ids) => {
                        if (confirm(`Hapus ${ids.length} departemen terpilih?`)) {
                            router.post('/admin/departments/bulk-delete', { ids }, {
                                onSuccess: () => showToast(`${ids.length} departemen telah dihapus`, 'success')
                            });
                        }
                    }
                }
            ] : undefined}
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
