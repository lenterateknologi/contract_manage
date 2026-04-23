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

interface DepartmentManagementProps {
    departments: any;
    filters: any;
}

export function DepartmentManagement({ departments, filters }: DepartmentManagementProps) {
    const { showToast } = useToast();
    const { canCreate, canUpdate, canDelete } = usePermissions('ADMIN_DEPARTMENTS');
    const [isFormView, setIsFormView] = React.useState(false);
    const [editingDept, setEditingDept] = React.useState<any>(null);

    const form = useForm({
        code: '',
        name: '',
        description: '',
        is_active: true as boolean,
    });

    const columns = useMemo<Column<any>[]>(() => [
        {
            header: 'Kode',
            accessorKey: 'code',
            sortable: true,
            className: 'font-mono text-[10px] font-black text-slate-500 uppercase tracking-widest',
        },
        {
            header: 'Nama Departemen',
            accessorKey: 'name',
            sortable: true,
            className: 'font-black text-slate-900 uppercase tracking-tight text-[12px]',
        },
        {
            header: 'Status',
            accessorKey: 'is_active',
            cell: (row) => (
                <Badge variant="outline" className={cn("px-2.5 py-0.5 text-[8px] font-black tracking-[0.2em] uppercase border-none shadow-none", row.is_active ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600")}>
                    {row.is_active ? 'Active' : 'Hidden'}
                </Badge>
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
                title={editingDept ? 'Edit Master Departemen' : 'Tambah Departemen Baru'}
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
                            onClick={() => { if(confirm('Hapus departemen?')) router.delete(`/admin/departments/${editingDept.id}`, { onSuccess: closeForm }) }}
                            className="h-8 hover:bg-rose-50 text-rose-600 rounded-none px-4 text-[10px] font-black uppercase tracking-widest transition-all"
                        >
                            <Trash2 size={14} className="mr-2" /> Hapus Data
                        </Button>
                    )
                }
            >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
                    <div className="md:col-span-8">
                        <FormSection title="Data Unit Kerja" subtitle="Detail identitas organisasi">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kode Unit / Singkatan</Label>
                                    <Input value={form.data.code} onChange={e => form.setData('code', e.target.value)} required placeholder="CONTOH: IT / FIN / HR" className="h-10 rounded-none border-slate-200 bg-slate-50/20 text-sm font-mono font-black uppercase tracking-widest px-4" />
                                </div>
                                <div className="space-y-1 md:col-span-2">
                                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nama Unit Struktural</Label>
                                    <Input value={form.data.name} onChange={e => form.setData('name', e.target.value)} required placeholder="NAMA LENGKAP DIVISI" className="h-10 rounded-none border-slate-200 text-sm font-black uppercase tracking-tight px-4" />
                                </div>
                                <div className="space-y-1 md:col-span-2 text-wrap">
                                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Keterangan Fungsi</Label>
                                    <Input value={form.data.description} onChange={e => form.setData('description', e.target.value)} placeholder="Tuliskan deskripsi unit kerja ini..." className="h-10 rounded-none border-slate-200 text-sm font-medium px-4" />
                                </div>
                            </div>
                        </FormSection>
                    </div>

                    <div className="md:col-span-4 space-y-10">
                        <FormDangerZone 
                            title="Visibilitas Unit" 
                            description="Tentukan apakah unit ini aktif dan dapat dipilih dalam pendataan user atau workflow."
                        >
                            <div className="flex items-center gap-3">
                                <span className={cn("text-[9px] font-black uppercase tracking-widest", form.data.is_active ? "text-emerald-600" : "text-rose-600")}>
                                    {form.data.is_active ? 'VISIBLE' : 'HIDDEN'}
                                </span>
                                <Checkbox 
                                    checked={form.data.is_active} 
                                    onCheckedChange={(c) => form.setData('is_active', !!c)} 
                                    className="w-5 h-5 rounded-none border-black"
                                />
                            </div>
                        </FormDangerZone>

                        <div className="border border-slate-200 p-6 bg-slate-50/50">
                             <div className="flex items-center gap-2 mb-4">
                                <Building2 size={16} className="text-slate-400" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Unit Info</span>
                             </div>
                             <p className="text-[10px] text-slate-500 font-bold uppercase leading-relaxed">
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
            title="Management Unit / Departemen"
            columns={columns}
            data={departments.data || []}
            searchKey="name"
            searchPlaceholder="Cari departemen..."
            searchValue={filters.search || ''}
            onSearchChange={(v) => router.get(window.location.pathname, { ...filters, search: v, page: 1 }, { preserveState: true, replace: true })}
            headerActions={
                canCreate && (
                    <Button onClick={openCreate} className="h-9 gap-2 rounded-xl px-5 text-[11px] font-black uppercase tracking-widest shadow-lg shadow-slate-200">
                        <Plus className="h-3.5 w-3.5" /> Tambah Unit
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
